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
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
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

  /* ── 4. the environment: ONE subject, WebGL first ──
     The 2026-10 rebuild ("Inside One Device", docs/STAGE.md) replaced
     three coexisting visual systems with a single environment. These
     checks are the structural guarantee that it stays single: the
     retired systems must stay deleted, exactly one module may import
     three.js, and the host must mount exactly one stage. The older
     stock-media prohibitions (docs/CINEMATIC_AUDIT.md) still apply —
     the environment is drawn from numbers, never downloaded. */
  const tryRead = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), 'utf8') : '');
  const removed = [
    /* stock media, map and particle name — retired 2026-10-11 */
    'components/WorldMap.tsx', 'components/LivingAtmosphere.tsx',
    'components/SignatureName.tsx', 'components/IdentityClock.tsx', 'public/cinema',
    /* the three overlapping systems and their hosts — retired 2026-10-14 */
    'components/CinematicWorld.tsx', 'components/cinematic-scene.ts', 'app/cinematic.ts',
    'components/SiliconWorld.tsx', 'components/SiliconDocumentBackdrop.tsx', 'app/silicon.ts',
    'components/WorldStory.tsx', 'components/sections.tsx',
    'components/Pager.tsx', 'components/NavOverlay.tsx',
    'components/TiltCard.tsx', 'components/DocumentMotion.tsx', 'components/PullToRefresh.tsx',
    'components/ui.tsx',
  ];
  for (const rel of removed) {
    if (existsSync(join(ROOT, rel))) {
      fail(`${rel} was retired — it must not return (one environment, one presentation system)`);
    }
  }
  /* The new surface area. Anything here referencing the old vocabulary
     means a retired layer is growing back inside a new file. */
  const SURFACE = [
    'app/globals.css', 'app/stage.ts',
    'components/Journey.tsx', 'components/Stage.tsx', 'components/StageFallback.tsx',
    'components/stage-scene.ts', 'components/chapters.tsx', 'components/record.tsx',
    'components/chrome.tsx', 'components/DepthRail.tsx',
  ];
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
    ['world-beat', 'the retired story-overlay beats'],
    ['cinema-word', 'the retired per-word name construction'],
    ['sig-sweep', 'the retired light band behind the name'],
    ['silicon-world', 'the retired Canvas 2D chip floorplan'],
    ['cinematic-world', 'the retired WebGL district map'],
    ['backdrop-filter', 'blurred chrome surfaces'],
    ['backdrop-blur', 'blurred chrome surfaces'],
  ];
  for (const rel of SURFACE) {
    const text = tryRead(rel);
    for (const [needle, what] of removedMotifs) {
      if (text.includes(needle)) fail(`${rel} still references ${what} ("${needle}")`);
    }
  }

  /* 4a. exactly one module may import three.js. This is the whole
     "one subject" rule, expressed as something a script can prove. */
  const componentFiles = readdirSync(join(ROOT, 'components'), { withFileTypes: true })
    .filter((e) => e.isFile() && /\.(ts|tsx)$/.test(e.name))
    .map((e) => `components/${e.name}`);
  const threeImporters = componentFiles.filter((rel) => /from 'three'|from "three"/.test(tryRead(rel)));
  if (threeImporters.length !== 1 || threeImporters[0] !== 'components/stage-scene.ts') {
    fail(`exactly one module may import three.js (components/stage-scene.ts); found: ${threeImporters.join(', ') || 'none'}`);
  }

  /* 4b. the host */
  const stage = tryRead('components/Stage.tsx');
  if (!stage) fail('components/Stage.tsx is missing — the one environment host');
  else {
    if (!/webgl2|webgl/.test(stage)) fail('Stage must probe for a WebGL context before loading three.js');
    if (!/import\(['"]@\/components\/stage-scene['"]\)/.test(stage)) {
      fail('Stage must lazy-load the three.js scene module (no route pays for it up front)');
    }
    if (!/StageFallback/.test(stage)) fail('Stage must fall back to StageFallback when WebGL is unavailable');
    if (!/document\.hidden|visibilitychange/.test(stage)) fail('Stage must pause when the tab is hidden');
    if (!/IntersectionObserver/.test(stage)) fail('Stage must pause while the environment is off-screen');
    if (!/reducedMotion/.test(stage)) fail('Stage must accept a reduced-motion path');
    if (!/ResizeObserver/.test(stage)) fail('Stage must resize at native resolution');
    if (!/verifiedCount|verificationSummary/.test(stage)) {
      fail('Stage must feed the generated evidence summary into the scene — the world is a readout, not decoration');
    }
  }

  /* 4c. the scene */
  const scene = tryRead('components/stage-scene.ts');
  if (!scene) fail('components/stage-scene.ts is missing — the three.js environment');
  else {
    if (!/from '@\/app\/stage'/.test(scene)) fail('stage-scene must take its geometry from app/stage.ts (the unit-tested numbers)');
    if (!/pixelRatioFor3D/.test(scene)) fail('stage-scene must apply the unit-tested DPR policy (pixelRatioFor3D)');
    if (!/ratchetScale/.test(scene)) fail('stage-scene must apply the one-way quality ratchet');
    if (!/dispose\(\)/.test(scene)) fail('stage-scene must dispose renderer, geometries and materials on unmount');
    if (/\.(glb|gltf|hdr|ktx2|webm|mp4|webp|jpe?g|png)['"]/i.test(scene)) {
      fail('stage-scene must stay fully procedural — no downloaded models, textures or media');
    }
  }

  /* 4d. the WebGL-unavailable fallback: the SAME machine, drawn in 2D */
  const fallback = tryRead('components/StageFallback.tsx');
  if (!fallback) fail('components/StageFallback.tsx is missing — the WebGL-unavailable environment');
  else {
    if (!/from '@\/app\/stage'/.test(fallback)) fail('StageFallback must draw the same strata from app/stage.ts');
    if (!/document\.hidden|visibilitychange/.test(fallback)) fail('StageFallback must pause when the tab is hidden');
    if (!/reducedMotion/.test(fallback)) fail('StageFallback must accept a reduced-motion path');
    if (!/Math\.min\(window\.devicePixelRatio/.test(fallback)) fail('StageFallback must cap the device pixel ratio');
    if (!/ResizeObserver/.test(fallback)) fail('StageFallback must redraw at native resolution on resize');
  }

  /* 4e. the journey mounts exactly one of it */
  const journey = tryRead('components/Journey.tsx');
  if (!journey) fail('components/Journey.tsx is missing — the journey host');
  else {
    const mounts = (journey.match(/<Stage\s/g) || []).length;
    if (mounts !== 1) fail(`components/Journey.tsx mounts ${mounts} stages — "Inside One Device" allows exactly one`);
    if (!/from '@\/components\/chapters'/.test(journey)) fail('Journey must render the chapters from components/chapters.tsx');
    if (!/from '@\/components\/chrome'/.test(journey)) fail('Journey must use the shared masthead/footer (components/chrome.tsx)');
  }

  /* 4f. the environment and its no-JS state have to be styled */
  if (!/\.stage\s*\{/.test(css)) fail('app/globals.css must style .stage (including its no-JS gradient fallback)');
  if (!/\.stage-canvas\s*\{/.test(css)) fail('app/globals.css must style .stage-canvas');
  if (!/\.rail\s*\{/.test(css)) fail('app/globals.css must style .rail (the depth navigation)');
  if (!/\.chapter\s*\{/.test(css)) fail('app/globals.css must style .chapter (the record system)');

  /* 4g. one masthead and one footer for the whole site */
  for (const rel of ['components/services/ServicesShell.tsx', 'components/verification/VerificationShell.tsx']) {
    const shell = tryRead(rel);
    if (!/from '@\/components\/chrome'/.test(shell)) {
      fail(`${rel} must use the shared chrome (components/chrome.tsx) rather than its own header and footer`);
    }
  }

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
  'check-design PASS (design-tokens.ts = DESIGN_SYSTEM.md = globals.css :root = themeColor · environment: ONE procedural WebGL stage + 2D fallback from the same numbers, one masthead, no stock media)'
);
