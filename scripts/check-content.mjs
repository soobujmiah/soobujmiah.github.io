/* ═══════════════════════════════════════════════════════════════
   CONTENT GATE — bilingual parity, two-way language purity, and
   content-model sanity. Runs on `prebuild`, so the build fails if
   any invariant breaks.

   Language purity (both directions, both mandatory)
   -------------------------------------------------
     EN tree → zero Bengali codepoints          (U+0980–U+09FF)
     BN tree → zero Latin letters               (A–Z, a–z)
               except the enumerated verbatim-data paths below.

   The BN exception list is deliberately tiny and explicit. It holds
   *data*, never language: an e-mail address that must stay routable,
   real account handles, repository slugs that must match the URL
   path, and URLs/hex accents. Everything a visitor reads as a word
   is Bangla, including transliterated technology names.

   The gate also proves it is still capable of failing: it runs a
   predicate self-test on every invocation, and `scripts/check-
   purity-adversarial.mjs` feeds whole adversarial content files
   through this same gate and asserts a non-zero exit.
   ═══════════════════════════════════════════════════════════════ */

import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
let failures = 0;
let leaves = 0;
let bnProse = 0;
let identifiers = 0;

const fail = (msg) => {
  failures += 1;
  console.error(`check-content FAIL: ${msg}`);
};

/* ── the purity predicates ─────────────────────────────────────── */

const BENGALI = /[\u0980-\u09FF]/;
const LATIN = /[A-Za-z]/;

const bengaliHits = (s) => (s.match(/[\u0980-\u09FF]/g) || []).length;
const latinHits = (s) => (s.match(/[A-Za-z]/g) || []).length;

/* Verbatim data that must stay in Latin script even in Bangla mode.
   Path syntax: dotted keys, `[]` for "every element of this array". */
const IDENTIFIER_PATHS = new Set([
  'profile.email',
  'profile.github',
  'profile.telegram',
  'profile.linkedin',
  'contact.channels[].value',
  'contact.channels[].href',
  'work.projects[].name',
  'work.projects[].repo',
  'work.projects[].websiteUrl',
  'work.projects[].accent',
  'work.nowBuilding.url',
  /* machine enums consumed by logic/CSS, not rendered as prose —
     `statusLabel` / the badge labels are the visible strings and stay
     under the purity rule */
  'research.entries[].status',
  'openSource.selected[]',
  'openSource.repos[].name',
  'openSource.repos[].url',
  'openSource.repos[].websiteUrl',
  'openSource.repos[].tier',
]);

/* Self-test: if either predicate ever stops catching its own
   adversarial input, the gate is dead and must not report PASS. */
function selfTest() {
  const cases = [
    { lang: 'bn', value: 'এটি AI Work Section GitHub', expect: true },
    { lang: 'bn', value: 'On-device AI', expect: true },
    { lang: 'bn', value: 'কাজ', expect: false },
    { lang: 'bn', value: 'গিটহাব অ্যাকশনস', expect: false },
    { lang: 'en', value: 'This is বাংলা বিভাগ', expect: true },
    { lang: 'en', value: 'নির্বাচিত কাজ', expect: true },
    { lang: 'en', value: 'Featured work', expect: false },
    { lang: 'en', value: 'CI/CD and SHA-256', expect: false },
  ];
  for (const c of cases) {
    const caught = c.lang === 'bn' ? latinHits(c.value) > 0 : bengaliHits(c.value) > 0;
    if (caught !== c.expect) {
      fail(`purity predicate self-test failed for ${c.lang} "${c.value}" (caught=${caught}, expected=${c.expect})`);
    }
  }
}

/* ── 1. deep key parity between en and bn ─────────────────────── */

function checkParity(a, b, path) {
  const bothArr = Array.isArray(a) && Array.isArray(b);
  const oneArr = Array.isArray(a) || Array.isArray(b);
  if (oneArr && !bothArr) {
    fail(`type mismatch at ${path || '<root>'}`);
    return;
  }
  if (bothArr) {
    if (a.length !== b.length) {
      fail(`array length at ${path}: en=${a.length} bn=${b.length}`);
      return;
    }
    a.forEach((_, i) => checkParity(a[i], b[i], `${path}[${i}]`));
    return;
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a).sort();
    const kb = Object.keys(b).sort();
    if (JSON.stringify(ka) !== JSON.stringify(kb)) {
      fail(`keys at ${path || '<root>'}: en=[${ka.join(',')}] bn=[${kb.join(',')}]`);
      return;
    }
    ka.forEach((k) => checkParity(a[k], b[k], path ? `${path}.${k}` : k));
    return;
  }
  leaves += 1;
}

/* ── 2. purity walk, both directions ─────────────────────────── */

function walk(node, path, visit) {
  if (typeof node === 'string') {
    visit(node, path);
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => walk(v, `${path}[]` || `[${i}]`, visit));
    return;
  }
  if (node && typeof node === 'object') {
    Object.entries(node).forEach(([k, v]) => walk(v, path ? `${path}.${k}` : k, visit));
  }
}

function checkPurity(tree, lang) {
  walk(tree, '', (value, path) => {
    if (lang === 'en') {
      if (BENGALI.test(value)) {
        fail(`EN purity: ${bengaliHits(value)} Bengali char(s) in en.${path} → "${value.slice(0, 60)}"`);
      }
      return;
    }
    /* Bangla mode */
    if (IDENTIFIER_PATHS.has(path)) {
      /* Identifier fields are data: they must NOT contain Bangla. */
      identifiers += 1;
      if (BENGALI.test(value)) {
        fail(`identifier field ${path} must stay verbatim ASCII, found Bengali → "${value.slice(0, 60)}"`);
      }
      return;
    }
    bnProse += 1;
    if (LATIN.test(value)) {
      const hits = latinHits(value);
      const sample = (value.match(/[A-Za-z]+/g) || []).slice(0, 4).join(', ');
      fail(`BN purity: ${hits} Latin letter(s) in bn.${path} (${sample}) → "${value.slice(0, 60)}"`);
    }
  });
}

/* ── run ──────────────────────────────────────────────────────── */

selfTest();

const tmp = mkdtempSync(join(tmpdir(), 'content-check-'));
const OVERRIDE = process.env.CONTENT_FILE;
try {
  const source = OVERRIDE ? resolve(ROOT, OVERRIDE) : join(ROOT, 'app', 'content.ts');
  if (!existsSync(source)) {
    fail(`content source not found: ${source}`);
    throw new Error('no source');
  }
  const tscBin = join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');
  if (!existsSync(tscBin)) {
    fail(`TypeScript compiler not found at ${tscBin} — run npm install first`);
    throw new Error('no tsc');
  }
  try {
    execSync(
      `node "${tscBin}" "${source}" --outDir "${tmp}" --module commonjs --target es2020 --skipLibCheck --strict false`,
      { cwd: ROOT, stdio: 'pipe' }
    );
  } catch (e) {
    const detail = e?.stderr?.toString() || e?.message || 'unknown';
    fail(`could not compile ${source}:\n${detail.slice(0, 2000)}`);
    throw new Error('compile failed');
  }
  const base = source.replace(/\.ts$/, '.js').replace(/^.*[\\/]/, '');
  const compiled =
    [join(tmp, base), join(tmp, 'app', base), join(tmp, 'content.js'), join(tmp, 'app', 'content.js')].find((p) =>
      existsSync(p)
    );
  if (!compiled) {
    fail(`tsc produced no output under ${tmp}`);
    throw new Error('no output');
  }
  const mod = await import(pathToFileURL(compiled).href);
  const content = mod.content ?? mod.default;
  if (!content?.en || !content?.bn) {
    fail('content export must have en and bn trees');
    throw new Error('bad export');
  }

  checkParity(content.en, content.bn, '');
  checkPurity(content.en, 'en');
  checkPurity(content.bn, 'bn');

  /* 3 ── selected ⊆ repos, same order both languages ── */
  for (const lang of ['en', 'bn']) {
    const os = content[lang].openSource;
    const names = os.repos.map((r) => r.name);
    for (const n of os.selected) {
      if (!names.includes(n)) fail(`${lang}.openSource.selected names unknown repo: ${n}`);
    }
    if (new Set(os.selected).size !== os.selected.length) {
      fail(`${lang}.openSource.selected has duplicates`);
    }
  }
  if (JSON.stringify(content.en.openSource.selected) !== JSON.stringify(content.bn.openSource.selected)) {
    fail('openSource.selected order differs between en and bn');
  }

  /* 4 ── labels, nav, accents, URLs ── */
  for (const lang of ['en', 'bn']) {
    const tree = content[lang];
    if (tree.ui.pageLabels.length !== 9) fail(`${lang}.ui.pageLabels length != 9`);
    /* per-route search metadata must cover every section route */
    if (tree.seo.sections.length !== 9) fail(`${lang}.seo.sections length != 9`);
    for (const s of tree.seo.sections) {
      if (!s.title || !s.description) fail(`${lang}.seo.sections has an entry missing title/description`);
    }
    for (const l of tree.nav) {
      if (!Number.isInteger(l.scene) || l.scene < 0 || l.scene > 8) {
        fail(`${lang}.nav scene out of range: ${l.scene}`);
      }
    }
    for (const p of tree.work.projects) {
      if (!/^#[0-9a-f]{6}$/i.test(p.accent)) fail(`${lang}.work.${p.name} accent not hex: ${p.accent}`);
      if (!p.repo.startsWith('https://github.com/soobujmiah/')) {
        fail(`${lang}.work.${p.name} repo URL unexpected: ${p.repo}`);
      }
      if (p.websiteUrl !== null && !p.websiteUrl.startsWith('https://')) {
        fail(`${lang}.work.${p.name} websiteUrl must be https or null`);
      }
    }
    for (const r of tree.openSource.repos) {
      if (!r.url.startsWith('https://github.com/soobujmiah/')) {
        fail(`${lang}.openSource.${r.name} url unexpected: ${r.url}`);
      }
      if (r.websiteUrl !== null && !r.websiteUrl.startsWith('https://')) {
        fail(`${lang}.openSource.${r.name} websiteUrl must be https or null`);
      }
    }
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`check-content: ${failures} failure(s)`);
  process.exit(1);
}
console.log(
  `check-content PASS (${leaves} leaf values compared · EN pure · BN pure across ${bnProse} prose fields ` +
    `· ${identifiers} enumerated identifier fields · predicate self-test ok)`
);
