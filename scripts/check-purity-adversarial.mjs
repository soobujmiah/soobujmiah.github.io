/* ═══════════════════════════════════════════════════════════════
   ADVERSARIAL PURITY SUITE

   Testing that the *normal* content passes proves very little: a
   gate that always returns 0 would also pass. This suite mutates
   copies of the real `app/content.ts` with adversarial strings and
   asserts that `check-content.mjs` exits non-zero for each one.

   Cases
   -----
     1. Bangla field contains Latin words     → must FAIL
     2. English field contains Bengali script → must FAIL
     3. Latin leak deep inside a long Bangla description → must FAIL
     4. Latin leak in a Bangla accessibility label       → must FAIL
     5. Unmodified content (control)                     → must PASS

   The control case matters: it proves the failures above come from
   the injected text and not from the harness.
   ═══════════════════════════════════════════════════════════════ */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const GATE = join(ROOT, 'scripts', 'check-content.mjs');
const SOURCE = join(ROOT, 'app', 'content.ts');
const original = readFileSync(SOURCE, 'utf8');

/** Each case: a unique anchor in content.ts, its adversarial replacement, and the expected exit code. */
const CASES = [
  {
    name: 'BN field containing Latin words ("এটি AI Work Section GitHub")',
    anchor: "navOpen: 'সূচি খুলুন'",
    replace: "navOpen: 'এটি AI Work Section GitHub'",
    expectFail: true,
  },
  {
    name: 'BN field containing a bare English brand word',
    anchor: "navTitle: 'সূচি'",
    replace: "navTitle: 'সূচি GitHub'",
    expectFail: true,
  },
  {
    name: 'Latin leak deep inside a long BN description',
    anchor: "evidenceLabel: 'প্রমাণ: '",
    replace: "evidenceLabel: 'প্রমাণ: CI passed on device'",
    expectFail: true,
  },
  {
    name: 'Latin leak in a BN accessibility label',
    anchor: "homeLabel: 'হোমে ফিরুন'",
    replace: "homeLabel: 'Back to home'",
    expectFail: true,
  },
  {
    name: 'EN field containing Bengali script ("This is বাংলা বিভাগ")',
    anchor: "navOpen: 'Open section index'",
    replace: "navOpen: 'This is বাংলা বিভাগ'",
    expectFail: true,
  },
  {
    name: 'EN copy with a single Bengali vowel sign',
    anchor: "navTitle: 'Index'",
    replace: "navTitle: 'Indেx'",
    expectFail: true,
  },
  {
    name: 'control — unmodified content',
    anchor: null,
    replace: null,
    expectFail: false,
  },
];

const tmp = mkdtempSync(join(tmpdir(), 'purity-adversarial-'));
let failures = 0;

try {
  CASES.forEach((c, idx) => {
    let source = original;
    if (c.anchor) {
      if (!original.includes(c.anchor)) {
        console.error(`adversarial FAIL: anchor not found for "${c.name}" — ${c.anchor}`);
        failures += 1;
        return;
      }
      source = original.replace(c.anchor, c.replace);
    }
    const file = join(tmp, `fixture-${idx}.ts`);
    writeFileSync(file, source, 'utf8');

    let status = 0;
    let stdout = '';
    try {
      stdout = execFileSync(process.execPath, [GATE], {
        cwd: ROOT,
        env: { ...process.env, CONTENT_FILE: file },
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (e) {
      status = typeof e.status === 'number' ? e.status : 1;
      stdout = (e.stdout || '') + (e.stderr || '');
    }
    const failed = status !== 0;
    const ok = failed === c.expectFail;
    if (!ok) failures += 1;
    const verdict = ok ? 'ok  ' : 'FAIL';
    const want = c.expectFail ? 'must reject' : 'must accept';
    console.log(`  [${verdict}] ${want} — ${c.name} (exit ${status})`);
    if (!ok) console.log(stdout.trim().split('\n').slice(0, 4).map((l) => `         ${l}`).join('\n'));
  });
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\ncheck-purity-adversarial: ${failures} case(s) did not behave as required`);
  process.exit(1);
}
console.log(`\ncheck-purity-adversarial PASS (${CASES.length} cases: ${CASES.length - 1} rejected, 1 control accepted)`);
