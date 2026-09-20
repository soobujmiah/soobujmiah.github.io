/* ═══════════════════════════════════════════════════════════════
   LOGIC CHECKS — the pieces a build cannot prove by passing.

   These are the units whose correctness is invisible in a build log
   and impossible to eyeball here (no browser in this environment):

     * Bengali grapheme segmentation — the signature name animates
       glyph by glyph, and splitting মি / য়া by code point would
       corrupt the shaping. Verified against BOTH the Intl.Segmenter
       path and the manual fallback path.
     * section routing helpers — the pager, the index overlay, the
       sitemap and the build validator all derive from one list.
     * Bengali digit localisation.

   Nothing here proves how anything LOOKS. It proves the logic is
   correct; visual and device behaviour is reported separately.
   ═══════════════════════════════════════════════════════════════ */

import { execSync } from 'node:child_process';
import { existsSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
let failures = 0;
let checks = 0;
const eq = (label, got, want) => {
  checks += 1;
  const g = JSON.stringify(got);
  const w = JSON.stringify(want);
  if (g !== w) {
    failures += 1;
    console.error(`  FAIL ${label}\n       got  ${g}\n       want ${w}`);
  } else {
    console.log(`  ok   ${label}`);
  }
};

/* Emitted inside the repo so Node resolves `react` from node_modules;
   removed again at the end and git-ignored in the meantime. */
const tmp = join(ROOT, '.units-build');
rmSync(tmp, { recursive: true, force: true });
const tsc = join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');

/* The units use the project's `@/` path alias, so they must be compiled
   through a real tsconfig rather than a bare CLI invocation. Generated
   at the repo root (so `extends` and `include` resolve) and removed
   again; it is a .json, so `next build` never picks it up. */
const cfgPath = join(ROOT, '.units-tsconfig.json');
writeFileSync(
  cfgPath,
  JSON.stringify(
    {
      extends: './tsconfig.json',
      compilerOptions: {
        noEmit: false,
        outDir: tmp,
        module: 'commonjs',
        moduleResolution: 'node',
        jsx: 'react-jsx',
        incremental: false,
        strict: false,
        plugins: [],
      },
      include: [
        'app/graphemes.ts',
        'app/sections.ts',
        'app/language.tsx',
        'app/geo.ts',
        'app/name-motion.ts',
        'app/design-tokens.ts',
        'app/clock.ts',
        'app/story-world.ts',
        'app/services.ts',
      ],
    },
    null,
    2
  )
);
try {
  execSync(`node "${tsc}" -p "${cfgPath}"`, { cwd: ROOT, stdio: 'pipe' });
} catch (e) {
  console.error(`check-units FAIL: could not compile the units\n${(e.stderr?.toString() || e.message).slice(0, 1500)}`);
  rmSync(cfgPath, { force: true });
  process.exit(1);
}

const pick = (...cands) => cands.map((c) => join(tmp, c)).find((p) => existsSync(p));

const sigPath = pick('graphemes.js', 'app/graphemes.js');
const sectionsPath = pick('app/sections.js', 'sections.js');
const langPath = pick('app/language.js', 'language.js');
const geoPath = pick('app/geo.js', 'geo.js');
const motionPath = pick('app/name-motion.js', 'name-motion.js');
const tokensPath = pick('app/design-tokens.js', 'design-tokens.js');

if (!sigPath || !sectionsPath || !langPath || !geoPath || !motionPath || !tokensPath) {
  console.error(`check-units FAIL: compiled output not found under ${tmp}`);
  console.log(existsSync(tmp) ? execSync(`find "${tmp}" -name '*.js'`, { encoding: 'utf8' }) : '');
  process.exit(1);
}

const { segmentGraphemes } = await import(pathToFileURL(sigPath).href);
const { SECTION_IDS, sectionHref, indexForSlug, indexFromPathname, sectionUrl, SITE_ORIGIN } = await import(
  pathToFileURL(sectionsPath).href
);
const { localizeDigits } = await import(pathToFileURL(langPath).href);
const clockPath = pick('app/clock.js', 'clock.js');
if (!clockPath) {
  console.error('check-units FAIL: compiled app/clock.ts not found');
  process.exit(1);
}
const { hour12, twoDigit } = await import(pathToFileURL(clockPath).href);
const { GEO_FOCUS, cameraFor, clampCamera, projectPoint, projectToScreen } = await import(
  pathToFileURL(geoPath).href
);
const {
  hashSeed,
  mulberry32,
  easeOutSettle,
  baselineWithinBox,
  sampleStepFor,
  denseStepFor,
  densityStepFor,
  particleCountForInk,
  sampleInkPoints,
  pointsBounds,
  centerPointsInSafeRect,
  startOffset,
  disperseOrigin,
  rampPalette,
  bucketFor,
  particleBudget,
  hexToRgb,
  mixRgb,
  rgbToCss,
  spatialPairing,
  flowPoint,
  styledFlowPoint,
  splitTwoLines,
  morphParamsFromSeed,
  staggerOrder,
  MORPH_STYLES,
  easeInOutQuint,
} = await import(pathToFileURL(motionPath).href);
const storyPath = pick('app/story-world.js', 'story-world.js');
if (!storyPath) {
  console.error('check-units FAIL: compiled app/story-world.ts not found');
  process.exit(1);
}
const {
  STORY_BEATS,
  serviceKeywords,
  NAME_HOLD_MS,
  KEYWORD_HOLD_MS,
} = await import(pathToFileURL(storyPath).href);
const { MOTION } = await import(pathToFileURL(tokensPath).href);

console.log('\nBengali grapheme segmentation (Intl.Segmenter path)');
eq('সবুজ মিয়া → 6 clusters, not 9 code points', segmentGraphemes('সবুজ মিয়া'), ['স', 'বু', 'জ', ' ', 'মি', 'য়া']);
eq('matra stays attached to its base (কি)', segmentGraphemes('কি'), ['কি']);
eq('pre-base vowel sign stays one cluster (মি)', segmentGraphemes('মি'), ['মি']);
eq('conjunct stays one cluster (ক্ষ)', segmentGraphemes('ক্ষ'), ['ক্ষ']);
eq('Latin name splits per character', segmentGraphemes('Sobuj Miah'), ['S', 'o', 'b', 'u', 'j', ' ', 'M', 'i', 'a', 'h']);
eq('space is preserved as its own cluster', segmentGraphemes('ক খ'), ['ক', ' ', 'খ']);

console.log('\nFallback path (no Intl.Segmenter — older WebViews)');
const realSegmenter = Intl.Segmenter;
try {
  // @ts-expect-error deliberately removing the API to exercise the fallback
  Intl.Segmenter = undefined;
  eq('Bengali still clusters correctly without Intl.Segmenter', segmentGraphemes('সবুজ মিয়া'), ['স', 'বু', 'জ', ' ', 'মি', 'য়া']);
  eq('conjunct still stays whole without Intl.Segmenter (ক্ষ)', segmentGraphemes('ক্ষ'), ['ক্ষ']);
  eq('Latin still splits per character', segmentGraphemes('Sobuj Miah'), ['S', 'o', 'b', 'u', 'j', ' ', 'M', 'i', 'a', 'h']);
} finally {
  Intl.Segmenter = realSegmenter;
}

console.log('\nSection routing');
eq('nine sections', SECTION_IDS.length, 9);
eq('home is the site root', sectionHref(0), '/');
eq('a section is a real directory route', sectionHref(3), '/work/');
eq('index → slug → index round-trips for every section', SECTION_IDS.map((_, i) => indexForSlug(SECTION_IDS[i])), [...SECTION_IDS.keys()]);
eq('unknown slug is null', indexForSlug('nope'), null);
eq('pathname /work/ → index 3', indexFromPathname('/work/'), 3);
eq('pathname / → home', indexFromPathname('/'), 0);
eq('unknown pathname falls back to home', indexFromPathname('/nonsense/'), 0);
eq('absolute section URL', sectionUrl(3), `${SITE_ORIGIN}/work/`);

/* ── the map's promise ──
   Every route promises one thing visually: its own geography, framed.
   The camera is derived in app/geo.ts and rendered by WorldMap, so the
   promise is testable here rather than eyeballed in a browser we do not
   have. "Framed" means the focus's real projected coordinates land on
   the centre of the visible square — the same mapping the arrival label
   uses for its screen position. */
console.log('\nMap camera framing (the geography each route promises)');
eq('one focus per section, in section order', GEO_FOCUS.map((g) => g.section), [...SECTION_IDS]);
const VIEWPORTS = [
  { width: 390, height: 844 }, // phone
  { width: 1440, height: 900 }, // desktop
];
for (const [i, g] of GEO_FOCUS.entries()) {
  const cam = cameraFor(i);
  const point = projectPoint(g.lon, g.lat);
  for (const vp of VIEWPORTS) {
    const p = projectToScreen(cam, point, vp);
    const offX = Math.abs(p.x - vp.width / 2);
    const offY = Math.abs(p.y - vp.height / 2);
    eq(
      `${g.section}: focus on the frame centre @${vp.width}x${vp.height} (off by ${offX.toFixed(1)},${offY.toFixed(1)} px)`,
      offX <= 1 && offY <= 1,
      true
    );
  }
}
const cams = GEO_FOCUS.map((_, i) => cameraFor(i));
eq('every section gets its own camera', new Set(cams.map((c) => `${c.x},${c.y},${c.hw}`)).size, GEO_FOCUS.length);
eq('cameraFor is deterministic (same page, same frame, always)', cameraFor(4), cameraFor(4));
eq('clamping an already-clamped camera changes nothing', clampCamera(cams[7].x, cams[7].y, cams[7].hw), cams[7]);
eq(
  'a zoom wider than the projected map still yields a finite camera',
  Number.isFinite(clampCamera(500, -200, 400).y),
  true
);

console.log('\nBengali digits');
eq('English digits unchanged', localizeDigits('2026', 'en'), '2026');
eq('Bengali digits', localizeDigits('2026', 'bn'), '২০২৬');

console.log('\nClock arithmetic — one authoritative value (§13/§15 boundaries)');
eq('00h reads 12 AM', hour12(0), 12);
eq('01h reads 1', hour12(1), 1);
eq('11h reads 11 (11:59 AM edge)', hour12(11), 11);
eq('12h reads 12 (12:00 PM)', hour12(12), 12);
eq('13h reads 1 (12:59 PM → 01 PM)', hour12(13), 1);
eq('23h reads 11 (11:59 PM edge)', hour12(23), 11);
eq('out-of-range wraps onto the dial', hour12(24), 12);
eq('garbage hour falls back to 12', hour12(NaN), 12);
eq('seconds pad below ten', twoDigit(5), '05');
eq('the 55→56 step', twoDigit(56), '56');
eq('59 stays 59 before the wrap', twoDigit(59), '59');
eq('over-range clamps to 59', twoDigit(75), '59');
eq('garbage part falls back to 00', twoDigit(NaN), '00');
eq('Bengali seconds render ৫৮ for 58', localizeDigits(twoDigit(58), 'bn'), '৫৮');
eq('padded counter', localizeDigits('03', 'bn'), '০৩');

console.log('\nSignature name — determinism (the construction must be reproducible)');
eq('the same name always seeds the same', hashSeed('Sobuj Miah'), hashSeed('Sobuj Miah'));
eq('a different name seeds differently', hashSeed('Sobuj Miah') !== hashSeed('সবুজ মিয়া'), true);
eq('the seed is a 32-bit unsigned integer', Number.isInteger(hashSeed('সবুজ মিয়া')) && hashSeed('সবুজ মিয়া') >= 0, true);
const r1 = mulberry32(hashSeed('Sobuj Miah'));
const r2 = mulberry32(hashSeed('Sobuj Miah'));
const seq1 = [r1(), r1(), r1()];
const seq2 = [r2(), r2(), r2()];
eq('the same seed replays the same sequence', seq1, seq2);
eq('every value is in [0, 1)', seq1.every((v) => v >= 0 && v < 1), true);
eq('successive values differ (the generator is not stuck)', new Set(seq1).size, 3);

console.log('\nSignature name — the settle curve must land exactly on target');
eq('starts at 0', easeOutSettle(0, 0.7), 0);
eq('lands at exactly 1 — a particle can never stop short of its glyph', easeOutSettle(1, 0.7), 1);
eq('overshoots once, so the particle seats rather than stops', (() => {
  let max = 0;
  for (let i = 0; i <= 200; i += 1) max = Math.max(max, easeOutSettle(i / 200, 0.7));
  return max > 1 && max < 1.12;
})(), true);
eq('back=0 is a plain ease-out with no overshoot', (() => {
  let max = 0;
  for (let i = 0; i <= 200; i += 1) max = Math.max(max, easeOutSettle(i / 200, 0));
  return Math.abs(max - 1) < 1e-9;
})(), true);
eq('clamps below zero', easeOutSettle(-3, 0.7), 0);
eq('clamps above one', easeOutSettle(7, 0.7), 1);
eq('is monotonic enough to never travel backwards visually', (() => {
  let prev = -1;
  let regressions = 0;
  for (let i = 0; i <= 100; i += 1) {
    const v = easeOutSettle(i / 100, 0.7);
    if (v < prev - 0.02) regressions += 1;
    prev = v;
  }
  return regressions;
})(), 0);

console.log('\nSignature name — baseline derivation (particles must land on the glyphs)');
eq('centres the em box in the line box: no leading', baselineWithinBox(0, 100, 80, 20), 80);
eq('splits half-leading above the ascent', baselineWithinBox(0, 140, 80, 20), 100);
eq('respects the box offset', baselineWithinBox(25, 140, 80, 20), 125);
eq('degenerate metrics fall back instead of returning NaN', Number.isFinite(baselineWithinBox(0, 0, 0, 0)), true);
eq('the fallback sits inside the box', baselineWithinBox(0, 0, 0, 0), 0);

console.log('\nSignature name — the particle budget is a ceiling');
eq('under budget keeps the crisp base step', sampleStepFor(400, 3, 1700), 3);
eq('sparse fields densify below the base step', denseStepFor(400, 8, 1600) < 8, true);
eq('densified count never exceeds the budget', 400 * (8 / denseStepFor(400, 8, 1600)) ** 2 <= 1600, true);
eq('near-target fields keep the base step', denseStepFor(1500, 3, 1700), 3);
eq('over target matches sampleStepFor', denseStepFor(6800, 2, 1700), sampleStepFor(6800, 2, 1700));
eq('dense degenerate input returns the base step', denseStepFor(0, 3, 1700), 3);
eq('the dense step never collapses below one pixel', denseStepFor(1, 8, 4000) >= 1, true);
eq('over budget widens the step', sampleStepFor(6800, 2, 1700), 4);

console.log('\\nSignature name — constant areal density (service weight = name weight)');
eq('densityStepFor is finite and ≥1', densityStepFor(800, 3, 0.12, 1, 8) >= 1, true);
eq('densityStepFor respects maxStep', densityStepFor(10, 8, 0.001, 1, 5) <= 5, true);
eq('densityStepFor respects minStep', densityStepFor(9000, 2, 0.5, 3, 10) >= 3, true);
eq('densityStepFor is deterministic', densityStepFor(500, 4, 0.1, 1, 6), densityStepFor(500, 4, 0.1, 1, 6));
eq('particleCountForInk scales with area', particleCountForInk(400, 2, 0.15, 100, 5000) > particleCountForInk(100, 2, 0.15, 100, 5000), true);
eq('particleCountForInk honours minimum', particleCountForInk(1, 8, 0.01, 220, 2000) >= 220, true);
eq('particleCountForInk honours maximum', particleCountForInk(99999, 1, 1, 100, 900) <= 900, true);
eq('particleCountForInk is deterministic', particleCountForInk(300, 3, 0.1, 50, 2000), particleCountForInk(300, 3, 0.1, 50, 2000));
/* Synthetic 20×20 ink square in a 40×40 buffer — density must follow the square, not the bbox. */
(() => {
  const fw = 40;
  const fh = 40;
  const img = new Uint8ClampedArray(fw * fh * 4);
  for (let y = 10; y < 30; y += 1) {
    for (let x = 10; x < 30; x += 1) {
      const i = (y * fw + x) * 4;
      img[i] = 255; img[i + 1] = 255; img[i + 2] = 255; img[i + 3] = 255;
    }
  }
  const pts = sampleInkPoints(img, fw, fh, 2, 100, 200, 42);
  eq('sampleInkPoints only hits ink', pts.every((p) => {
    const x = Math.min(fw - 1, Math.max(0, Math.floor(p.x)));
    const y = Math.min(fh - 1, Math.max(0, Math.floor(p.y)));
    return img[(y * fw + x) * 4 + 3] > 100;
  }), true);
  eq('sampleInkPoints is deterministic', sampleInkPoints(img, fw, fh, 2, 100, 200, 42).length, pts.length);
  eq('sampleInkPoints stays under maxCount', pts.length <= 200, true);
  eq('sampleInkPoints has real coverage', pts.length >= 40, true);
  const b = pointsBounds(pts);
  eq('pointsBounds width tracks the glyph, not the canvas', b.width <= 22 && b.width >= 14, true);
  eq('pointsBounds height tracks the glyph, not the canvas', b.height <= 22 && b.height >= 14, true);
  centerPointsInSafeRect(pts, 100, 80, { left: 90, top: 70, right: 110, bottom: 90 });
  const b2 = pointsBounds(pts);
  eq('centerPointsInSafeRect recentres the cloud', Math.abs(b2.cx - 100) < 2 && Math.abs(b2.cy - 80) < 2, true);
  eq('centerPointsInSafeRect stays inside the safe rect', b2.minX >= 90 - 0.01 && b2.maxX <= 110 + 0.01 && b2.minY >= 70 - 0.01 && b2.maxY <= 90 + 0.01, true);
})();
eq('the widened step actually brings the count under the ceiling', (() => {
  const step = sampleStepFor(6800, 2, 1700);
  return Math.round(6800 * (2 * 2) / (step * step)) <= 1700;
})(), true);
eq('never goes below the base step', sampleStepFor(999999, 5, 10) >= 5, true);
eq('degenerate input returns the base step', sampleStepFor(0, 3, 1700), 3);
eq('a phone gets a smaller field than the cap', particleBudget(390, 8, 1700) < 1700, true);
eq('a desktop keeps the full cap', particleBudget(1440, 8, 1700), 1700);
eq('few cores trim the budget further', particleBudget(390, 4, 1700) < particleBudget(390, 8, 1700), true);
eq('an unknown core count is treated as a hint, not a veto', particleBudget(1440, 0, 1700), 1700);
eq('the budget never collapses to nothing', particleBudget(200, 2, 1700) >= 180, true);

console.log('\nSignature name — cluster-ordered assembly');
const offs = [0, 1, 2, 3, 4, 5].map((i) => startOffset(i, 6, mulberry32(7), 0.3, 0.15));
eq('every start is inside the stagger budget', offs.every((o) => o >= 0 && o <= 0.45 + 1e-9), true);
eq('the last cluster starts no earlier than the first', offs[5] >= offs[0] - 0.15, true);
eq('a single cluster still yields a valid start', Number.isFinite(startOffset(0, 1, mulberry32(3), 0.3, 0.15)), true);
eq('the same seed gives the same schedule', startOffset(2, 6, mulberry32(11), 0.3, 0.15), startOffset(2, 6, mulberry32(11), 0.3, 0.15));
eq('dispersed origins are finite', (() => {
  const o = disperseOrigin(50, 20, 300, 90, mulberry32(5), 1.35);
  return Number.isFinite(o.x) && Number.isFinite(o.y);
})(), true);
eq('dispersal actually moves the particle off its target', (() => {
  const o = disperseOrigin(50, 20, 300, 90, mulberry32(5), 1.35);
  return Math.hypot(o.x - 50, o.y - 20) > 1;
})(), true);
eq('an edge particle disperses further than a central one', (() => {
  const edge = disperseOrigin(299, 20, 300, 90, mulberry32(5), 1.35);
  const mid = disperseOrigin(150, 20, 300, 90, mulberry32(5), 1.35);
  return Math.hypot(edge.x - 299, edge.y - 20) >= Math.hypot(mid.x - 150, mid.y - 20);
})(), true);

console.log('\nSignature name — the colour ramp');
const ramp = rampPalette('#22c55e', '#4ade80', '#4ade80', 8, 0.5);
eq('the ramp has one entry per bucket', ramp.length, 8);
eq('it starts on the assembly green', ramp[0], 'rgba(34,197,94,1)');
eq('it ends on the resolved green', ramp[7], 'rgba(74,222,128,1)');
eq('every stop is a valid rgba()', ramp.every((c) => /^rgba\(\d+,\d+,\d+,1\)$/.test(c)), true);
eq('a two-bucket ramp stays green-family', rampPalette('#22c55e', '#4ade80', '#4ade80', 2, 0.5), ['rgba(34,197,94,1)', 'rgba(74,222,128,1)']);
eq('bucketFor clamps low', bucketFor(-1, 8), 0);
eq('bucketFor clamps high', bucketFor(4, 8), 7);
eq('bucketFor maps arrival to the last bucket', bucketFor(1, 8), 7);
eq('hexToRgb parses brand green', hexToRgb('#22c55e'), { r: 34, g: 197, b: 94 });
eq('hexToRgb rejects junk instead of throwing', hexToRgb('not-a-colour'), { r: 0, g: 0, b: 0 });
eq('mixRgb at the ends returns the endpoints', [mixRgb({r:0,g:0,b:0},{r:10,g:20,b:30},0), mixRgb({r:0,g:0,b:0},{r:10,g:20,b:30},1)], [{r:0,g:0,b:0},{r:10,g:20,b:30}]);
eq('rgbToCss rounds and keeps alpha readable', rgbToCss({ r: 74.4, g: 222.1, b: 128.9 }, 0.5), 'rgba(74,222,129,0.5)');

console.log('\nSignature name — the motion token budget must add up');
const NA = MOTION.nameAssemble;
eq('the last particle arrives exactly at the end of the assembly',
  Number((NA.clusterShare + NA.jitterShare + NA.travelShare).toFixed(10)), 1);
eq('the construction is short enough to read and long enough to stage',
  NA.totalSeconds >= 1.0 && NA.totalSeconds <= 2.6, true);
eq('the outgoing name leaves before the new one is built', NA.outgoingSeconds > 0 && NA.outgoingSeconds < NA.totalSeconds, true);
eq('the guides are gone before the name resolves', NA.guideShare > 0 && NA.guideShare < 1, true);
eq('the particle ceiling is a real ceiling', NA.maxParticles >= 400 && NA.maxParticles <= 4000, true);
eq('the device-pixel ratio is capped for mobile fill rate', NA.maxDpr <= 2, true);
eq('the settle overshoot stays subtle', NA.settleBack > 0 && NA.settleBack <= 1.2, true);
eq('name-hold micro-drift stays subtle enough to keep the name readable', NA.microPx <= 0.35, true);
eq('name-hold breath stays minimal', NA.breathPx <= 1.5, true);

console.log('\nStory world — compact keyword morph cycle');
eq('easeInOutQuint starts and ends at the endpoints', [easeInOutQuint(0), easeInOutQuint(1)], [0, 1]);
eq('flowPoint starts at A and ends at B', (() => {
  const a = flowPoint(0, 0, 10, 0, 0, 4);
  const b = flowPoint(0, 0, 10, 0, 1, 4);
  return Math.hypot(a.x, a.y) < 1e-9 && Math.hypot(b.x - 10, b.y) < 1e-9;
})(), true);
const STYLES = ['radial', 'horizontal', 'vertical', 'orbital', 'wave', 'edge', 'grid', 'dispersion', 'crossflow', 'focal'];
eq(
  'styledFlowPoint lands on endpoints for every morph style',
  STYLES.every((style) => {
    const a = styledFlowPoint(0, 0, 40, 20, 0, 6, style, 20, 10);
    const b = styledFlowPoint(0, 0, 40, 20, 1, 6, style, 20, 10);
    return Math.hypot(a.x, a.y) < 1e-6 && Math.hypot(b.x - 40, b.y - 20) < 1e-6;
  }),
  true,
);
eq(
  'styledFlowPoint midpoints differ by style (controlled variation)',
  (() => {
    const mids = STYLES.map((s) => styledFlowPoint(0, 0, 40, 0, 0.5, 8, s, 20, 10));
    const keys = new Set(mids.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`));
    return keys.size >= 6;
  })(),
  true,
);
eq(
  'morphParamsFromSeed is deterministic',
  morphParamsFromSeed(42, 'radial'),
  morphParamsFromSeed(42, 'radial'),
);
eq(
  'morphParamsFromSeed varies by seed',
  morphParamsFromSeed(1, 'wave').turb !== morphParamsFromSeed(99, 'wave').turb ||
    morphParamsFromSeed(1, 'wave').prop !== morphParamsFromSeed(99, 'wave').prop,
  true,
);
eq(
  'staggerOrder respects flip',
  staggerOrder(0.2, 0.5, 0, false) < staggerOrder(0.8, 0.5, 0, false) &&
    staggerOrder(0.2, 0.5, 0, true) > staggerOrder(0.8, 0.5, 0, true),
  true,
);
eq('MORPH_STYLES enumerates every family', MORPH_STYLES.length >= 8, true);
eq(
  'splitTwoLines keeps short labels on one line',
  splitTwoLines('Graphics Design', (s) => s.length * 8, 400),
  ['Graphics Design'],
);
eq(
  'splitTwoLines wraps long titles to at most two lines',
  splitTwoLines('Office Administration & Operations Support', (s) => s.length * 10, 180).length,
  2,
);
eq(
  'splitTwoLines never invents a third line',
  splitTwoLines('Android & Phone Software Support', (s) => s.length * 12, 100).length <= 2,
  true,
);
eq('spatialPairing is structure-preserving (sorted left-to-right)', (() => {
  const from = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 }];
  const to = [{ x: 0, y: 5 }, { x: 10, y: 5 }, { x: 20, y: 5 }];
  const map = spatialPairing(from, to);
  return map[0] === 0 && map[1] === 1 && map[2] === 2;
})(), true);
eq('spatialPairing handles unequal populations without throwing', (() => {
  const from = [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 10, y: 0 }, { x: 15, y: 0 }];
  const to = [{ x: 0, y: 1 }, { x: 20, y: 1 }];
  const map = spatialPairing(from, to);
  return map.length === 4 && [...map].every((i) => i === 0 || i === 1);
})(), true);
eq('one beat per service slug', STORY_BEATS.length, 8);
eq(
  'beats are deterministic keyword holds with dual morph styles',
  Array.isArray(STORY_BEATS) &&
    STORY_BEATS.every(
      (b) =>
        typeof b.serviceIndex === 'number' &&
        typeof b.slug === 'string' &&
        b.holdMs > 0 &&
        b.morphMs > 0 &&
        STYLES.includes(b.styleOut) &&
        STYLES.includes(b.styleBack) &&
        b.styleOut !== b.styleBack,
    ),
  true,
);
eq(
  'at least five distinct outbound morph styles across the cycle',
  new Set(STORY_BEATS.map((b) => b.styleOut)).size >= 5,
  true,
);
eq(
  'no two consecutive transitions share the same style',
  (() => {
    const seq = [];
    for (const b of STORY_BEATS) {
      seq.push(b.styleOut, b.styleBack);
    }
    for (let i = 1; i < seq.length; i += 1) {
      if (seq[i] === seq[i - 1]) return false;
    }
    return true;
  })(),
  true,
);
eq('first beat is web-development', STORY_BEATS[0].slug, 'web-development');
eq('last beat is data-entry', STORY_BEATS[STORY_BEATS.length - 1].slug, 'data-entry');
const slugs = STORY_BEATS.map((b) => b.slug);
eq(
  'canonical service order is preserved',
  slugs,
  [
    'web-development',
    'software-development',
    'computer-support',
    'android-support',
    'business-technology',
    'graphics-design',
    'office-administration',
    'data-entry',
  ],
);
eq('service indices are sequential', STORY_BEATS.map((b) => b.serviceIndex), [0, 1, 2, 3, 4, 5, 6, 7]);
eq('keyword hold is long enough to read', STORY_BEATS[0].holdMs >= 2000, true);
eq('name hold is long enough to read', NAME_HOLD_MS >= 2000, true);
eq('default keyword hold matches beat hold', KEYWORD_HOLD_MS, STORY_BEATS[0].holdMs);
const enKw = serviceKeywords('en');
const bnKw = serviceKeywords('bn');
eq('EN keywords cover every service', enKw.length, 8);
eq('BN keywords cover every service', bnKw.length, 8);
eq('first EN keyword is Website Development', enKw[0], 'Website Development');
eq('EN keywords stay Latin-script titles', enKw.every((k) => /[A-Za-z]/.test(k)), true);
eq('BN keywords carry Bengali script', bnKw.every((k) => /[\u0980-\u09FF]/.test(k)), true);
eq('no bedroom / life-cycle leftovers on beats', !JSON.stringify(STORY_BEATS).includes('bed_sleep'), true);
eq('name-hold micro-drift stays subtle enough to keep the name readable', NA.microPx <= 0.35, true);


rmSync(cfgPath, { force: true });
rmSync(tmp, { recursive: true, force: true });

if (failures > 0) {
  console.error(`\ncheck-units: ${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`\ncheck-units PASS (${checks} logic checks)`);
