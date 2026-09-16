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
  'contact.email.value',
  'contact.email.href',
  /* the social ecosystem: handles and URLs are verbatim data in both
     languages, while every group label and platform name stays prose
     and therefore stays under the purity rule (গিটহাব, not GitHub) */
  'contact.groups[].links[].handle',
  'contact.groups[].links[].href',
  'work.projects[].name',
  'work.projects[].repo',
  'work.projects[].websiteUrl',
  'work.projects[].accent',
  'work.nowBuilding.url',
  /* the ADT ↔ Ternux relationship block repeats the same three kinds
     of data as work.projects[] above: the project name, its repository
     slug and its verified live site. Same justification, same shape. */
  'work.relationship.layers[].name',
  'work.relationship.layers[].repo',
  'work.relationship.layers[].websiteUrl',
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

  /* 4 ── canonical professional identity ──
     One identity across the portfolio, the profile README and the JSON-LD.
     The owner set this wording explicitly; a silent rewording here would
     drift every surface that inherits it, so it is asserted rather than
     trusted. Retired positioning is asserted *absent*, not merely unused. */
  const CANONICAL_TITLE = 'Independent Software & AI Systems Engineer';
  const RETIRED_POSITIONING = ['Self-Taught Technology Builder'];
  if (content.en.profile.title !== CANONICAL_TITLE) {
    fail(`en.profile.title is "${content.en.profile.title}", expected the canonical "${CANONICAL_TITLE}"`);
  }
  for (const lang of ['en', 'bn']) {
    const hay = JSON.stringify(content[lang]);
    for (const retired of RETIRED_POSITIONING) {
      if (hay.includes(retired)) fail(`${lang} tree still carries retired positioning "${retired}"`);
    }
  }
  /* the Bangla title must be Bangla prose, not the English string */
  if (content.bn.profile.title === content.en.profile.title) {
    fail('bn.profile.title is identical to en — the Bangla tree must translate the identity');
  }

  /* 4b ── the canonical social ecosystem ──
     Seventeen links, supplied by the owner, exact and complete. This is
     the audit the brief asks for, made repeatable: a link can never go
     missing, duplicated, re-pointed at a different handle, or diverge
     between the two language trees without failing the build. */
  const CANONICAL_SOCIAL = [
    'https://github.com/soobujmiah',
    'https://soobujmiah.github.io',
    'https://linkedin.com/in/soobujmiah',
    'https://peerlist.io/soobujmiah',
    'https://www.producthunt.com/@soobujmiah',
    'https://huggingface.co/soobujmiah',
    'https://dev.to/soobujmiah',
    'https://hashnode.com/@soobujmiah',
    'https://medium.com/@soobujmiah',
    'https://x.com/soobujmiah',
    'https://instagram.com/soobujmiah',
    'https://threads.net/@soobujmiah',
    'https://facebook.com/soobujmiah',
    'https://youtube.com/@soobujmiah',
    'https://t.me/soobujmiah',
    'https://wa.me/soobujmiah',
    'https://about.me/soobujmiah',
  ];
  const flat = (lang) => content[lang].contact.groups.flatMap((g) => g.links);
  const shapes = {};
  for (const lang of ['en', 'bn']) {
    const links = flat(lang);
    shapes[lang] = links;
    if (links.length !== CANONICAL_SOCIAL.length) {
      fail(`${lang}.contact.groups carries ${links.length} links, expected ${CANONICAL_SOCIAL.length}`);
    }
    const hrefs = links.map((l) => l.href);
    if (new Set(hrefs).size !== hrefs.length) fail(`${lang}.contact.groups has a duplicate href`);
    for (const want of CANONICAL_SOCIAL) {
      if (!hrefs.includes(want)) fail(`${lang}.contact.groups is missing the canonical link ${want}`);
    }
    for (const got of hrefs) {
      if (!CANONICAL_SOCIAL.includes(got)) fail(`${lang}.contact.groups has a non-canonical link ${got}`);
    }
    for (const l of links) {
      if (!/^https:\/\//.test(l.href)) fail(`${lang}.contact.groups link must be https: ${l.href}`);
      if (!l.handle || !l.label) fail(`${lang}.contact.groups link missing handle/label: ${l.href}`);
    }
    if (!content[lang].contact.email.href.startsWith('mailto:')) {
      fail(`${lang}.contact.email.href must be a mailto: URL`);
    }
    if (content[lang].contact.groups.length < 2) {
      fail(`${lang}.contact.groups must stay grouped — a flat list of 17 is a wall, not navigation`);
    }
  }
  /* the two trees must describe the same ecosystem in the same order,
     differing only in the words */
  if (JSON.stringify(shapes.en.map((l) => l.href)) !== JSON.stringify(shapes.bn.map((l) => l.href))) {
    fail('social hrefs differ in content or order between en and bn');
  }
  if (JSON.stringify(shapes.en.map((l) => l.handle)) !== JSON.stringify(shapes.bn.map((l) => l.handle))) {
    fail('social handles differ between en and bn — handles are verbatim data');
  }
  if (JSON.stringify(content.en.contact.groups.map((g) => g.links.length)) !==
      JSON.stringify(content.bn.contact.groups.map((g) => g.links.length))) {
    fail('social group sizes differ between en and bn');
  }

  /* 5 ── labels, nav, accents, URLs ── */
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
