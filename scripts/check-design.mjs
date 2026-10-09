/* ═══════════════════════════════════════════════════════════════
   DESIGN-SYSTEM DRIFT GATE

   The portfolio is the brand root of the ecosystem: future project
   sites inherit its tokens. That only works if the documentation
   cannot lie about them. This gate makes the docs machine-checkable.

   It compares three places that must never disagree:
     1. `app/design-tokens.ts`          — the source of truth
     2. `DESIGN_SYSTEM.md`              — the inheritable contract
     3. `app/globals.css :root`         — what actually reaches CSS

   The previous audit found the documented page-turn spring
   (170/27/0.9, ±7%, rotateX ±5°, perspective 1400) did not match the
   shipped values (140/22/1.0, ±6%, ±3.5°, 1800). Every project site
   inheriting from that prose would have drifted. This script exists
   so that can never happen again silently.
   ═══════════════════════════════════════════════════════════════ */

import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.error(`check-design FAIL: ${msg}`);
};

const tmp = mkdtempSync(join(tmpdir(), 'design-check-'));
try {
  const tscBin = join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');
  if (!existsSync(tscBin)) {
    fail(`TypeScript compiler not found at ${tscBin} — run npm install first`);
    throw new Error('no tsc');
  }
  try {
    execSync(`node "${tscBin}" app/design-tokens.ts --outDir "${tmp}" --module commonjs --target es2020 --skipLibCheck`, {
      cwd: ROOT,
      stdio: 'pipe',
    });
  } catch (e) {
    fail(`could not compile app/design-tokens.ts:\n${(e?.stderr?.toString() || e?.message || '').slice(0, 1200)}`);
    throw new Error('compile failed');
  }
  const compiled = [join(tmp, 'design-tokens.js'), join(tmp, 'app', 'design-tokens.js')].find((p) => existsSync(p));
  if (!compiled) {
    fail('tsc produced no output for design-tokens.ts');
    throw new Error('no output');
  }
  const { BRAND, MOTION } = await import(pathToFileURL(compiled).href);

  /* ── 1. DESIGN_SYSTEM.md must carry the exact motion tokens ── */
  const doc = readFileSync(join(ROOT, 'DESIGN_SYSTEM.md'), 'utf8');
  const START = '<!-- design-tokens:start -->';
  const END = '<!-- design-tokens:end -->';
  const i = doc.indexOf(START);
  const j = doc.indexOf(END);
  if (i < 0 || j < 0 || j < i) {
    fail(`DESIGN_SYSTEM.md is missing the ${START} … ${END} token block`);
  } else {
    const block = doc.slice(i + START.length, j);
    const fence = block.match(/```json\s*([\s\S]*?)```/);
    if (!fence) {
      fail('the design-tokens block in DESIGN_SYSTEM.md must contain a ```json fenced object');
    } else {
      let documented;
      try {
        documented = JSON.parse(fence[1]);
      } catch (e) {
        fail(`design-tokens JSON in DESIGN_SYSTEM.md is not valid JSON: ${e.message}`);
      }
      if (documented) {
        for (const group of Object.keys(MOTION)) {
          if (!(group in documented)) {
            fail(`DESIGN_SYSTEM.md design-tokens JSON is missing motion group "${group}"`);
            continue;
          }
          const a = JSON.stringify(MOTION[group]);
          const b = JSON.stringify(documented[group]);
          if (a !== b) {
            fail(`motion drift in "${group}"\n    code: ${a}\n    docs: ${b}`);
          }
        }
        for (const extra of Object.keys(documented)) {
          if (extra === 'brand') continue; /* compared separately, below */
          if (!(extra in MOTION)) fail(`DESIGN_SYSTEM.md documents unknown motion group "${extra}"`);
        }
        if (documented.brand) {
          for (const k of Object.keys(BRAND)) {
            if (documented.brand[k] !== BRAND[k]) {
              fail(`brand token drift for "${k}": code=${BRAND[k]} docs=${documented.brand[k]}`);
            }
          }
        } else {
          fail('DESIGN_SYSTEM.md design-tokens JSON is missing the "brand" group');
        }
      }
    }
  }

  /* ── 2. globals.css :root must match the brand tokens ── */
  const css = readFileSync(join(ROOT, 'app', 'globals.css'), 'utf8');
  const rootBlock = css.match(/:root\s*\{([\s\S]*?)\}/);
  if (!rootBlock) {
    fail('could not find the :root token block in app/globals.css');
  } else {
    const cssVars = {};
    for (const line of rootBlock[1].split('\n')) {
      const m = line.match(/^\s*(--[a-z-]+)\s*:\s*(.+?);\s*$/);
      if (m) cssVars[m[1]] = m[2].replace(/\s+/g, '');
    }
    const expect = {
      '--bg': BRAND.bg,
      '--fg': BRAND.fg,
      '--muted': BRAND.muted,
      '--border': BRAND.border,
      '--accent': BRAND.accent,
      '--accent-bright': BRAND.accentBright,
      '--signal': BRAND.signal,
      '--card': BRAND.cardBg,
    };
    for (const [name, value] of Object.entries(expect)) {
      const got = cssVars[name];
      if (got === undefined) fail(`app/globals.css :root is missing ${name}`);
      else if (got.replace(/\s+/g, '') !== value.replace(/\s+/g, '')) {
        fail(`token mismatch ${name}: css=${got} tokens=${value}`);
      }
    }
  }

  /* ── 3. the browser theme colour must match --bg ── */
  const layoutPath = existsSync(join(ROOT, 'app', 'site-layout.tsx')) ? 'site-layout.tsx' : 'layout.tsx';
  const layout = readFileSync(join(ROOT, 'app', layoutPath), 'utf8');
  const theme = layout.match(/themeColor:\s*(?:BRAND\.bg|'([^']+)')/);
  if (!theme) fail(`app/${layoutPath} must set themeColor to BRAND.bg (or the literal ${BRAND.bg})`);
  else if (theme[1] && theme[1].toLowerCase() !== BRAND.bg.toLowerCase()) {
    fail(`themeColor (${theme[1]}) must equal the --bg token (${BRAND.bg})`);
  }
  if (!/from '\.\/design-tokens'|from '@\/app\/design-tokens'/.test(layout)) {
    fail(`app/${layoutPath} must import its theme colour from design-tokens.ts rather than hard-coding it`);
  }

  /* ── 4. the environment: one procedural silicon scene ──
     The stock plates/footage, the world map and the particle name were
     retired (docs/CINEMATIC_AUDIT.md). These checks assert the removals
     stay removed and that the replacement is wired in. */
  const tryRead = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), 'utf8') : '');
  const removed = [
    'components/WorldMap.tsx', 'components/CinematicWorld.tsx', 'components/LivingAtmosphere.tsx',
    'components/SignatureName.tsx', 'components/IdentityClock.tsx', 'public/cinema',
  ];
  for (const rel of removed) {
    if (existsSync(join(ROOT, rel))) fail(`${rel} was retired — stock media / map / particle name must not return`);
  }
  const removedMotifs = [
    ['.grid-bg', 'the 60px square grid'],
    ['pager-grid', 'the grid overlay behind the pages'],
    ['TechBackground', 'the removed particle canvas'],
    ['orb-1', 'the blurred glow orb layer'],
    ['orb-2', 'the blurred glow orb layer'],
    ['mix-blend-mode', 'blend modes (they re-composite the page per frame)'],
    ['.worldmap', 'the retired world map'],
    ['cinema-world', 'the retired stock-footage world'],
    ['/cinema/', 'stock media paths'],
  ];
  for (const rel of ['app/globals.css', 'components/Pager.tsx', 'components/sections.tsx', 'components/ui.tsx']) {
    const text = tryRead(rel);
    for (const [needle, what] of removedMotifs) {
      if (text.includes(needle)) fail(`${rel} still references ${what} ("${needle}")`);
    }
  }
  const world = tryRead('components/SiliconWorld.tsx');
  if (!world) fail('components/SiliconWorld.tsx is missing — the site environment');
  else {
    if (!/document\.hidden|visibilitychange/.test(world)) fail('SiliconWorld must pause when the tab is hidden');
    if (!/reducedMotion/.test(world)) fail('SiliconWorld must accept a reduced-motion path');
    if (!/Math\.min\(window\.devicePixelRatio/.test(world)) fail('SiliconWorld must cap the device pixel ratio');
    if (!/ResizeObserver/.test(world)) fail('SiliconWorld must redraw at native resolution on resize');
  }
  if (!/from '@\/components\/SiliconWorld'/.test(tryRead('components/Pager.tsx'))) {
    fail('components/Pager.tsx must mount SiliconWorld as the page background');
  }
  if (!/\.silicon-world\s*\{/.test(css)) fail('app/globals.css must style .silicon-world (including its no-JS gradient fallback)');
  const fontsSrc = tryRead('app/site-layout.tsx');
  for (const gone of ['Space_Grotesk', 'Chakra_Petch', 'Anek_Bangla']) {
    if (fontsSrc.includes(gone)) fail(`app/site-layout.tsx still loads ${gone} — the type system is serif + sans + mono`);
  }
  for (const need of ['Instrument_Serif', 'Noto_Serif_Bengali']) {
    if (!fontsSrc.includes(need)) fail(`app/site-layout.tsx must load ${need} for editorial headings`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`check-design: ${failures} failure(s)`);
  process.exit(1);
}
console.log(
  'check-design PASS (design-tokens.ts = DESIGN_SYSTEM.md = globals.css :root = themeColor · environment: procedural silicon scene, no stock media)'
);
