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
      include: ['app/graphemes.ts', 'app/sections.ts', 'app/language.tsx', 'app/geo.ts', 'app/name-motion.ts', 'app/design-tokens.ts'],
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
  startOffset,
  disperseOrigin,
  rampPalette,
  bucketFor,
  particleBudget,
  hexToRgb,
  mixRgb,
  rgbToCss,
} = await import(pathToFileURL(motionPath).href);
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
const ramp = rampPalette('#7dd3fc', '#eab308', '#4ade80', 8, 0.72);
eq('the ramp has one entry per bucket', ramp.length, 8);
eq('it starts on the cool assembly ink', ramp[0], 'rgba(125,211,252,1)');
eq('it ends on the resolved green', ramp[7], 'rgba(74,222,128,1)');
eq('every stop is a valid rgba()', ramp.every((c) => /^rgba\(\d+,\d+,\d+,1\)$/.test(c)), true);
eq('a two-bucket ramp still spans cool to green', rampPalette('#7dd3fc', '#eab308', '#4ade80', 2, 0.72), ['rgba(125,211,252,1)', 'rgba(74,222,128,1)']);
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

rmSync(cfgPath, { force: true });
rmSync(tmp, { recursive: true, force: true });

if (failures > 0) {
  console.error(`\ncheck-units: ${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`\ncheck-units PASS (${checks} logic checks)`);
