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
  const layout = readFileSync(join(ROOT, 'app', 'layout.tsx'), 'utf8');
  const theme = layout.match(/themeColor:\s*(?:BRAND\.bg|'([^']+)')/);
  if (!theme) fail(`app/layout.tsx must set themeColor to BRAND.bg (or the literal ${BRAND.bg})`);
  else if (theme[1] && theme[1].toLowerCase() !== BRAND.bg.toLowerCase()) {
    fail(`themeColor (${theme[1]}) must equal the --bg token (${BRAND.bg})`);
  }
  if (!/from '\.\/design-tokens'|from '@\/app\/design-tokens'/.test(layout)) {
    fail('app/layout.tsx must import its theme colour from design-tokens.ts rather than hard-coding it');
  }

  /* ── 4. hero visual system ──
     Regression guards for three concrete, reported defects: a near-white
     band sweeping behind the name, a repeating square grid behind the
     hero, and a blurred glow layer competing with it. Each was removed at
     its source; these checks make sure none of them can come back
     unnoticed. They assert removals, not taste. */
  const tryRead = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), 'utf8') : '');
  const removedMotifs = [
    ['.grid-bg', 'the 60px square grid'],
    ['pager-grid', 'the grid overlay behind the pages'],
    ['sig-sweep', 'the sweeping light band behind the name'],
    ['sigSweep', 'the sweep keyframes'],
    ['sigFlash', 'the light-flash keyframes'],
    ['sig-flash', 'the flash state class'],
    ['86efac', 'near-white mint ink'],
    ['134, 239, 172', 'the near-white mint gradient'],
    ['134,239,172', 'the near-white mint gradient'],
    ['220, 255, 230', 'the near-white particle core'],
    ['220,255,230', 'the near-white particle core'],
    ['orb-1', 'the blurred glow orb layer'],
    ['orb-2', 'the blurred glow orb layer'],
    ['TechBackground', 'the removed particle canvas'],
    ['MatrixName', 'the removed name implementation'],
    ['HeroName', 'the retired floating-wave wordmark'],
    ['.sig-in,', 'the retired wordmark entrance animation'],
    ['.sig-in {', 'the retired wordmark entrance animation'],
    ['"sig-in"', 'the retired wordmark entrance class'],
    ['sig-glyph"', 'the retired wordmark glyph wrapper class'],
    ['sig-wander', 'the retired wordmark ink-wander keyframes'],
    ['sig-live', 'the retired wordmark float keyframes'],
    ['--mag-x', 'the retired wordmark magnetism variable'],
    ['--mag-y', 'the retired wordmark magnetism variable'],
    ['--mag-r', 'the retired wordmark magnetism variable'],
    ['--mag-s', 'the retired wordmark magnetism variable'],
  ];
  for (const rel of [
    'app/globals.css',
    'components/GlitchName.tsx',
    'components/WorldMap.tsx',
    'components/Pager.tsx',
    'components/sections.tsx',
    'components/ui.tsx',
  ]) {
    const text = tryRead(rel);
    if (!text) continue;
    for (const [needle, what] of removedMotifs) {
      if (text.includes(needle)) {
        fail(`${rel} still references ${what} ("${needle}") — remove the source, do not hide the symptom`);
      }
    }
  }

  /* no rule targeting the name may paint a surface or stack a filter */
  const ruleRe = /([^{}]+)\{([^}]*)\}/g;
  let rule;
  while ((rule = ruleRe.exec(css))) {
    const selector = rule[1].trim().split('\n').pop().trim();
    const body = rule[2];
    if (!/\.sig-/.test(rule[1])) continue;
    if (/(^|[;\s])background(-image|-color)?\s*:/.test(body)) {
      fail(`app/globals.css paints a background on the name (${selector}) — the identity sits on the environment, never on its own panel`);
    }
    if (/(^|[;\s])filter\s*:/.test(body)) {
      fail(`app/globals.css applies a filter to the name (${selector}) — no blur stacks on the identity`);
    }
  }

  /* the replacement environment must actually exist and be wired up */
  const worldMap = tryRead('components/WorldMap.tsx');
  if (!worldMap) {
    fail('components/WorldMap.tsx is missing — the hero environment must be the dark-green global map');
  } else {
    if (!/WORLD_LAND/.test(worldMap)) fail('components/WorldMap.tsx must render the generated land contours');
    if (!/data-paused/.test(worldMap)) fail('components/WorldMap.tsx must suspend its animation when the tab is hidden');
    if (!/reducedMotion/.test(worldMap)) fail('components/WorldMap.tsx must accept a reduced-motion path');
  }
  if (!/from '@\/components\/WorldMap'/.test(tryRead('components/Pager.tsx'))) {
    fail('components/Pager.tsx must mount WorldMap as the page background');
  }
  if (!existsSync(join(ROOT, 'components', 'world-map-path.ts'))) {
    fail('components/world-map-path.ts is missing — run tools/make-worldmap.py');
  }
  if (!existsSync(join(ROOT, 'tools', 'make-worldmap.py'))) {
    fail('tools/make-worldmap.py is missing — the contour data would no longer be reproducible');
  }

  const ruleRe2 = /([^{}]+)\{([^}]*)\}/g;

  /* ── 5. background flicker ──
     The reported flicker traced to geometry that re-rasterised every
     frame: the land group scaled while `vector-effect: non-scaling-stroke`
     was set, stroked hub circles were scaled, and the link arcs animated
     `stroke-dashoffset`. A 29 KB vector path re-tessellated per frame is
     the shimmer. So: the map's geometry is painted once and never
     animated. Only the origin ring may move, and only its OPACITY. */
  const mapGeoSelectors = ['worldmap-land', 'worldmap-hub', 'worldmap-link', 'worldmap-bd'];
  ruleRe2.lastIndex = 0;
  let mapRule;
  while ((mapRule = ruleRe2.exec(css))) {
    const sel = mapRule[1].trim().split('\n').pop().trim();
    const body = mapRule[2];
    if (!/\.worldmap/.test(sel)) continue;
    const isOriginRing = /\.worldmap-origin-halo/.test(sel);
    if (!isOriginRing && /(^|[;\s])animation\s*:/.test(body)) {
      fail(`app/globals.css animates map geometry (${sel}) — that forces a vector re-rasterise every frame and is the flicker`);
    }
    if (!isOriginRing && /(^|[;\s])transition\s*:/.test(body)) {
      fail(`app/globals.css transitions map geometry (${sel}) — the map must be painted once, not moved`);
    }
    if (mapGeoSelectors.some((n) => sel.includes(n)) && /(^|[;\s])transform\s*:/.test(body)) {
      fail(`app/globals.css transforms map geometry (${sel}) — scaling a stroked path is what shimmered`);
    }
  }
  /* the one surviving map animation must be opacity-only */
  const originKeyframes = css.match(/@keyframes\s+originPulse\s*\{([\s\S]*?)\n\}/);
  if (originKeyframes) {
    const kb = originKeyframes[1];
    for (const prop of ['transform', 'stroke', 'stroke-width', 'd:', 'r:', 'filter']) {
      if (kb.includes(prop)) {
        fail(`the origin ring's keyframes animate "${prop}" — only opacity can run without a repaint`);
      }
    }
  }

  /* blend modes composite the whole page on every pointer move and also
     invert to magenta over the pale name. Both were reported defects. */
  if (/mix-blend-mode/.test(css)) {
    fail('app/globals.css still uses mix-blend-mode — it re-composites the page per frame and is off-brand over the name');
  }

/* ── 6. the name is a deterministic glitch/reconstruct cycle ──
   The identity implementation may be replaced, but the engineering
   contract survives: the name is real DOM text in both scripts, split
   grapheme-safely; the cycle is deterministic (no Math.random); jitter
   touches transforms only; Bengali is never letter-scrambled; a
   reduced-motion path exists; and the word itself is never the
   animated object. */
const nameComp = tryRead('components/GlitchName.tsx');
if (!nameComp) {
  fail('components/GlitchName.tsx is missing — the hero identity must be the living glitch wordmark');
} else {
  if (!/segmentGraphemes/.test(nameComp)) {
    fail('components/GlitchName.tsx must split the name grapheme-safely — Bengali clusters can never be broken');
  }
  if (!/reducedMotion/.test(nameComp)) {
    fail('components/GlitchName.tsx has no reduced-motion path');
  }
  if (!/aria-hidden/.test(nameComp) || !/sr-only/.test(nameComp)) {
    fail('components/GlitchName.tsx must keep the name as real accessible text (sr-only copy, decorative cells hidden)');
  }
  /* comments are stripped so the gate tests code, not prose */
  const nameCode = nameComp.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  if (/Math\.random/.test(nameCode)) {
    fail('components/GlitchName.tsx uses Math.random — the cycle must be deterministic so SSR and client render identically');
  }
  if (/\.style\.left|\.style\.top|\.style\.margin|\.style\.padding/.test(nameComp)) {
    fail('components/GlitchName.tsx writes layout properties in its loop — jitter must be transform-only');
  }
  /* Bengali clusters keep their exact text: only Latin marks scramble */
  if (!/SCRAMBLABLE/.test(nameComp)) {
    fail('components/GlitchName.tsx must gate scrambling to Latin characters — Bengali shaping can never be scrambled');
  }
  /* the scramble vocabulary: technical marks only, no emoji ranges */
  const pools = nameComp.match(/(?:LATIN_POOL|GLYPH_POOL)\s*=\s*\[([^\]]*)\]/g) ?? [];
  if (pools.length < 2) {
    fail('components/GlitchName.tsx must define both scramble pools (Latin letters + technical glyphs)');
  }
  for (const pool of pools) {
    for (const ch of pool.matchAll(/'([^']+)'/g)) {
      const cp = ch[1].codePointAt(0);
      const ok =
        /^[0-9A-Za-z]$/.test(ch[1]) ||
        (cp >= 0x0391 && cp <= 0x03c9) || /* Greek */
        (cp >= 0x2200 && cp <= 0x22ff) || /* math operators */
        (cp >= 0x25a0 && cp <= 0x25ff) || /* geometric shapes */
        '/|+×◦'.includes(ch[1]);
      if (!ok) {
        fail(`components/GlitchName.tsx scramble pool contains a disallowed glyph "${ch[1]}" (U+${cp.toString(16)}) — technical marks only, never emoji`);
      }
    }
  }
  /* the word itself must not be the animated object */
  const nameRule = css.match(/\.sig-name\s*\{([^}]*)\}/);
  if (nameRule && /(^|[;\s])animation\s*:/.test(nameRule[1])) {
    fail('app/globals.css animates .sig-name as a whole — the cycle must run per cell, never as one sweep');
  }
}

/* ── 7. the palette stays in the brand's greens + restrained accents ── */
  const hue = (hex) => {
    const m = /^#([0-9a-f]{6})$/i.exec(hex);
    if (!m) return null;
    const n = parseInt(m[1], 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 510;
    const sL = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1)) / 255;
    if (max === min) return { h: 0, l, s: 0, r, g, b };
    let h;
    if (max === g) h = 60 * (2 + (b - r) / (max - min));
    else if (max === r) h = 60 * (((g - b) / (max - min) + 6) % 6);
    else h = 60 * (4 + (r - g) / (max - min));
    return { h, l, s: sL, r, g, b };
  };
if (nameComp) {
  const inks = [...(nameComp.match(/INKS\s*=\s*\[([^\]]*)\]/)?.[1].match(/#[0-9a-f]{6}/gi) ?? [])];
  if (inks.length < 4) {
    fail('components/GlitchName.tsx no longer defines a spread of inks — every letter needs its own colour');
  }
  for (const hex of inks) {
    const c = hue(hex);
    if (!c) continue;
    /* green family: hue 75..190 (lime → teal), green dominant */
    if (c.h < 75 || c.h > 190 || c.g < c.r || c.g < c.b) {
      fail(`components/GlitchName.tsx uses an off-family ink ${hex} (hue ${Math.round(c.h)}) — the identity is green, not a rainbow`);
    }
  }
  /* scramble inks: cool technical tones — cyan→blue band, light, restrained */
  const scramble = [...(nameComp.match(/SCRAMBLE_INKS\s*=\s*\[([^\]]*)\]/)?.[1].match(/#[0-9a-f]{6}/gi) ?? [])];
  if (scramble.length < 2) {
    fail('components/GlitchName.tsx must define scramble inks for the transformation phase');
  }
  for (const hex of scramble) {
    const c = hue(hex);
    if (!c) continue;
    if (c.h < 180 || c.h > 265 || c.l < 0.55 || c.l > 0.95) {
      fail(`components/GlitchName.tsx scramble ink ${hex} leaves the restrained cool band (hue ${Math.round(c.h)}, lightness ${c.l.toFixed(2)})`);
    }
  }
  /* the reconstruction flash: one warm highlight, nothing else */
  const warm = nameComp.match(/REBUILD_INK\s*=\s*'(#[0-9a-f]{6})'/i)?.[1];
  if (!warm) {
    fail('components/GlitchName.tsx must define the warm reconstruction ink');
  } else {
    const c = hue(warm);
    if (!c || c.h < 20 || c.h > 70) {
      fail(`components/GlitchName.tsx reconstruction ink ${warm} must stay in the warm amber band (hue 20..70)`);
    }
  }
}

/* ── 8. the map is page-aware: nine deterministic camera positions ──
   One focus per section, indexed by the sections registry; Home is
   Bangladesh; WorldMap flies the viewBox between them. */
const geo = tryRead('app/geo.ts');
if (!geo) {
  fail('app/geo.ts is missing — the camera mapping must live with the projection');
} else {
  const block = geo.slice(geo.indexOf('GEO_FOCUS'), geo.indexOf('export const HALF_WORLD'));
  const entries = [...block.matchAll(/\{\s*section:\s*'([^']+)',\s*place:\s*'([^']*)',\s*lon:\s*(-?[\d.]+),\s*lat:\s*(-?[\d.]+),\s*zoom:\s*([\d.]+)\s*\}/g)];
  if (entries.length !== 9) {
    fail(`app/geo.ts GEO_FOCUS must define exactly one camera position per section (found ${entries.length}, need 9)`);
  }
  if (entries[0]) {
    const [, section, , lon, lat] = entries[0];
    if (section !== 'home') fail(`GEO_FOCUS[0] must be section "home" (found "${section}")`);
    if (Math.abs(Number(lon) - 90.4) > 1 || Math.abs(Number(lat) - 23.8) > 1) {
      fail(`GEO_FOCUS[0] must stay on Bangladesh (Dhaka ≈ 90.4E 23.8N) — got ${lon}, ${lat}`);
    }
  }
  if (new Set(entries.map((e) => `${e[3]},${e[4]}`)).size !== entries.length) {
    fail('GEO_FOCUS positions must be distinct — nine pages, nine geographies');
  }
}
const worldMap2 = tryRead('components/WorldMap.tsx');
if (worldMap2) {
  if (!/GEO_FOCUS/.test(worldMap2)) fail('components/WorldMap.tsx must consume the GEO_FOCUS registry — one mapping, one source');
  if (!/sectionIndex/.test(worldMap2)) fail('components/WorldMap.tsx must receive the active section index from the pager');
  if (!/setAttribute\('viewBox'/.test(worldMap2)) fail('components/WorldMap.tsx must fly the camera via the viewBox attribute — no CSS transform on map geometry');
  if (!/data-cam/.test(worldMap2)) fail('components/WorldMap.tsx must expose its camera state via data-cam for observability');
  if (!/animateMotion/.test(worldMap2)) fail('components/WorldMap.tsx must keep the data-flow packets');
}
if (!/sectionIndex=\{index\}/.test(tryRead('components/Pager.tsx'))) {
  fail('components/Pager.tsx must pass the active section index to WorldMap');
}
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`check-design: ${failures} failure(s)`);
  process.exit(1);
}
console.log(
  'check-design PASS (design-tokens.ts = DESIGN_SYSTEM.md = globals.css :root = themeColor · hero system: no grid, no light layer, world map wired)'
);
