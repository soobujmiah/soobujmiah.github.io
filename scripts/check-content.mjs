/* ═══════════════════════════════════════════════════════════════
   CONTENT GATE — bilingual parity + content-model sanity.

   Runs automatically before every build (`prebuild`) and on demand via
   `npm run check`. Fails loudly on:

   1. en/bn key-structure drift (missing or extra keys, array lengths)
   2. openSource.selected naming repos that don't exist (or order drift)
   3. Bengali characters anywhere in the EN tree
   4. pageLabels count, nav scene range, accent/URL shape
   ═══════════════════════════════════════════════════════════════ */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
let failures = 0;
let leaves = 0;

const fail = (msg) => {
  failures += 1;
  console.error(`check-content FAIL: ${msg}`);
};

/* 1 ── deep key parity between en and bn ── */
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

/* 3 ── EN purity walk ── */
const BENGALI = /[\u0980-\u09FF]/;
function checkEnPure(node, path) {
  if (typeof node === 'string') {
    if (BENGALI.test(node)) fail(`Bengali chars in en at ${path}`);
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => checkEnPure(v, `${path}[${i}]`));
    return;
  }
  if (node && typeof node === 'object') {
    Object.entries(node).forEach(([k, v]) => checkEnPure(v, path ? `${path}.${k}` : k));
  }
}

const tmp = mkdtempSync(join(tmpdir(), 'content-check-'));
try {
  const tscBin = join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');
  if (!existsSync(tscBin)) {
    fail(`TypeScript compiler not found at ${tscBin} — run npm install first`);
    throw new Error('no tsc');
  }
  try {
    execSync(
      `node "${tscBin}" app/content.ts --outDir "${tmp}" --module commonjs --target es2020 --skipLibCheck`,
      { cwd: ROOT, stdio: 'pipe' }
    );
  } catch (e) {
    const detail = e?.stderr?.toString() || e?.message || 'unknown';
    fail(`could not compile app/content.ts:\n${detail.slice(0, 2000)}`);
    throw new Error('compile failed');
  }
  const compiled = [join(tmp, 'content.js'), join(tmp, 'app', 'content.js')].find((p) =>
    existsSync(p)
  );
  if (!compiled) {
    fail(`tsc produced no output under ${tmp}`);
    throw new Error('no output');
  }
  const { content } = await import(pathToFileURL(compiled).href);
  if (!content?.en || !content?.bn) {
    fail('content export must have en and bn trees');
    throw new Error('bad export');
  }

  checkParity(content.en, content.bn, '');
  checkEnPure(content.en, 'en');

  /* 2 ── selected ⊆ repos, same order both languages ── */
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
console.log(`check-content PASS (${leaves} leaf values compared, EN pure, selected valid)`);
