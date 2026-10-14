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
        'app/stage.ts',
        'app/design-tokens.ts',
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
const tokensPath = pick('app/design-tokens.js', 'design-tokens.js');

if (!sigPath || !sectionsPath || !langPath || !tokensPath) {
  console.error(`check-units FAIL: compiled output not found under ${tmp}`);
  console.log(existsSync(tmp) ? execSync(`find "${tmp}" -name '*.js'`, { encoding: 'utf8' }) : '');
  process.exit(1);
}

const { segmentGraphemes } = await import(pathToFileURL(sigPath).href);
const { SECTION_IDS, sectionHref, indexForSlug, indexFromPathname, sectionUrl, SITE_ORIGIN } = await import(
  pathToFileURL(sectionsPath).href
);
const { localizeDigits } = await import(pathToFileURL(langPath).href);
const tokens = await import(pathToFileURL(tokensPath).href);

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

console.log('\nMotion tokens (app/design-tokens.ts)');
const { MOTION } = tokens;

/* The 2026-10 rebuild cut the motion system down to one moving
   thing: the camera travelling into the machine. These invariants
   are the ones a future edit could plausibly break while the site
   still "looks fine" on one device. */
for (const gone of ['signature', 'pageTurn', 'tilt', 'depth', 'magnetic', 'countUp', 'cameraDrift', 'pullToRefresh', 'reveal']) {
  eq(`the retired "${gone}" token group is gone`, gone in MOTION, false);
}
eq('the shipped token groups are exactly the four the build uses', Object.keys(MOTION).sort(), ['flight', 'input', 'parallax', 'settle']);

eq('every flight axis is a finite positive settle time', Object.values(MOTION.flight).filter((v) => !(Number.isFinite(v) && v > 0)), []);
eq('depth is the slowest axis — entering a stratum reads as travel', MOTION.flight.depth > Math.max(MOTION.flight.lateral, MOTION.flight.lift, MOTION.flight.roll), true);
eq('no axis is so slow the reader waits for it (<= 2.5s)', Math.max(...Object.values(MOTION.flight)) <= 2.5, true);

/* The input lock must cover a real part of the slowest axis, or a
   fast scroll fires the reader through the machine while the camera
   is still flying — the "where am I?" failure this rebuild fixes. */
eq('the input lock covers at least half the slowest flight axis', MOTION.input.lockMs / 1000 >= Math.max(...Object.values(MOTION.flight)) * 0.5, true);
eq('one gesture is worth one stratum (lock >= 0.5s)', MOTION.input.lockMs >= 500, true);
eq('the wheel threshold ignores trackpad jitter but not a real scroll', MOTION.input.wheelDelta >= 8 && MOTION.input.wheelDelta <= 80, true);
eq('the swipe threshold is a deliberate gesture, not tap drift', MOTION.input.swipePx >= 32 && MOTION.input.swipePx <= 140, true);

eq('the pointer parallax is a nudge, not a second camera', MOTION.parallax.lateral > 0 && MOTION.parallax.lateral <= 4 && MOTION.parallax.lift > 0 && MOTION.parallax.lift <= 4, true);
eq('the settle is one short entrance with an end', MOTION.settle.seconds > 0 && MOTION.settle.seconds <= 1.2, true);
eq('the settle stagger cannot outlast the settle itself', MOTION.settle.staggerSeconds < MOTION.settle.seconds, true);
eq('the easing is an explicit cubic-bezier', /^cubic-bezier\(/.test(MOTION.settle.ease), true);

/* The canonical name is still a shaping test: the chapter heading
   sets it as one line, so its clusters must never be torn apart. */
const clustersOf = (name) => segmentGraphemes(name).filter((c) => c.trim()).length;
eq('the canonical Latin name is 9 clusters', clustersOf('Sobuj Miah'), 9);
eq('the canonical Bengali name is 5 clusters', clustersOf('সবুজ মিয়া'), 5);

console.log('\nSection routing');
/* The chapter list is the registry's to decide; these assertions pin
   the *routing contract*, not a fixed chapter count, so adding a
   chapter does not falsify them. */
const WORK = SECTION_IDS.indexOf('work');
eq('every section id is unique', new Set(SECTION_IDS).size, SECTION_IDS.length);
eq('the registry has a work chapter', WORK >= 0, true);
eq('home is the site root', sectionHref(0), '/');
eq('a section is a real directory route', sectionHref(WORK), '/work/');
eq('index → slug → index round-trips for every section', SECTION_IDS.map((_, i) => indexForSlug(SECTION_IDS[i])), [...SECTION_IDS.keys()]);
eq('unknown slug is null', indexForSlug('nope'), null);
eq('legacy stack slug resolves to merged section', indexForSlug('stack'), 1);
eq('legacy stack pathname resolves to merged section', indexFromPathname('/bn/stack/'), 1);
eq('legacy open-source slug resolves to work', indexForSlug('open-source'), WORK);
eq('legacy open-source pathname resolves to work', indexFromPathname('/bn/open-source/'), WORK);
eq('pathname /work/ maps back to the work chapter', indexFromPathname('/work/'), WORK);
eq('pathname / → home', indexFromPathname('/'), 0);
eq('unknown pathname falls back to home', indexFromPathname('/nonsense/'), 0);
eq('absolute section URL', sectionUrl(WORK), `${SITE_ORIGIN}/work/`);
eq('Bengali section path has locale prefix', sectionHref(WORK, 'bn'), '/bn/work/');
eq('Bengali home path has locale prefix', sectionHref(0, 'bn'), '/bn/');
eq('Bengali section URL', sectionUrl(WORK, 'bn'), `${SITE_ORIGIN}/bn/work/`);
eq('Bengali pathname maps to section', indexFromPathname('/bn/work/'), WORK);

console.log('\nBengali digits');
eq('English digits unchanged', localizeDigits('2026', 'en'), '2026');
eq('Bengali digits', localizeDigits('2026', 'bn'), '২০২৬');

/* ── Stage logic (app/stage.ts) ─────────────────────────────────
   The one environment's math: the strata the reader travels into,
   the stations the camera rests at, the critically damped flight,
   the render-quality policy, the depth presence that is the scene's
   only brightness authority, and the evidence marks that make the
   world a readout of `app/verification-summary.json`.

   None of this is visible in a build log, and all of it is pure, so
   it is proven here rather than by looking at the site. */
{
  const stagePath = pick('app/stage.js', 'stage.js');
  if (!stagePath) {
    console.error('check-units FAIL: compiled app/stage.ts not found');
    process.exit(1);
  }
  const stage = await import(pathToFileURL(stagePath).href);
  const {
    STRATA, STRATUM_PITCH, STRATUM_COUNT, MACHINE_DEPTH, STANDOFF, STATIONS, FOV,
    PIXEL_BUDGET, RATCHET, PRESENCE, MOTES, FLIGHT, POINTER,
  } = stage;

  console.log('\nStage — the machine the reader travels into');
  eq('one stratum per chapter', STRATUM_COUNT, SECTION_IDS.length);
  eq('the strata are named after the real stack, in dependency order', STRATA.map((s) => s.id), ['surface', 'display', 'silicon', 'userland', 'toolchain', 'frontier', 'bus', 'port']);
  eq('the journey goes INTO the machine (z recedes, evenly pitched)', STRATA.every((s, i) => (i === 0 ? s.z === 0 : Math.abs(s.z - STRATA[i - 1].z + STRATUM_PITCH) < 1e-9)), true);
  eq('total depth matches the pitch and the count', MACHINE_DEPTH, STRATUM_PITCH * (STRATUM_COUNT - 1));
  eq('every stratum has an aperture the camera can pass through', STRATA.every((s) => s.aperture > 0 && s.aperture < s.halfWidth), true);
  eq('the strata narrow with depth — the machine converges, never flares', STRATA.every((s, i) => i === 0 || s.halfWidth <= STRATA[i - 1].halfWidth), true);
  eq('stratum lookup clamps instead of throwing', [stage.stratumFor(-4).id, stage.stratumFor(99).id], ['surface', 'port']);
  eq('every etch pattern is one of the eight declared', STRATA.every((s) => ['grain', 'instruments', 'traces', 'terminal', 'lattice', 'probe', 'bus', 'aperture'].includes(s.etch)), true);

  console.log('\nStage — stations (where the camera rests per chapter)');
  eq('one station per stratum, each standing off its own plane', [STATIONS.length, STATIONS.every((st, i) => Math.abs(st.z - (STRATA[i].z + STANDOFF)) < 1e-9)], [STRATUM_COUNT, true]);
  eq('every station is finite', STATIONS.every((st) => [st.z, st.lateral, st.lift, st.rollDeg, st.lean].every(Number.isFinite)), true);
  eq('the camera always stands clear of the plane it frames', STANDOFF > 0 && STATIONS.every((st, i) => st.z > STRATA[i].z), true);
  eq('consecutive stations are a real flight, never a cut in place', STATIONS.every((st, i) => i === 0 || Math.hypot(st.lateral - STATIONS[i - 1].lateral, st.lift - STATIONS[i - 1].lift, st.z - STATIONS[i - 1].z) > 3), true);
  eq('the camera stays inside the machine, never outside its walls', STATIONS.every((st, i) => Math.abs(st.lateral) < STRATA[i].halfWidth), true);
  eq('roll exists but never tilts the horizon noticeably (<= 2deg)', STATIONS.every((st) => Math.abs(st.rollDeg) <= 2), true);
  eq('the first and last stations are square on (identity, and the way out)', [STATIONS[0].lateral, STATIONS[0].rollDeg, STATIONS[STRATUM_COUNT - 1].lateral, STATIONS[STRATUM_COUNT - 1].rollDeg], [0, 0, 0, 0]);
  eq('the field of view is a real camera, not a fisheye', FOV > 30 && FOV < 75, true);
  eq('station lookup clamps instead of throwing', [stage.stationFor(-1).z, stage.stationFor(42).z], [STATIONS[0].z, STATIONS[STRATUM_COUNT - 1].z]);

  console.log('\nStage — critically damped flight');
  {
    let x = 0;
    let v = 0;
    let overshoot = false;
    for (let i = 0; i < 600; i += 1) {
      [x, v] = stage.smoothDamp(x, 10, v, FLIGHT.depth, 1 / 60);
      if (x > 10 + 1e-4) overshoot = true;
    }
    eq('flight converges and settles (600 frames @60fps)', Math.abs(x - 10) < 0.01 && Math.abs(v) < 0.01, true);
    eq('flight never overshoots its destination', overshoot, false);
  }
  {
    let x = 0;
    let v = 0;
    let maxStep = 0;
    for (let i = 0; i < 540; i += 1) {
      const dest = i < 90 ? 10 : -5; // the reader changes chapter mid-flight
      const prev = x;
      [x, v] = stage.smoothDamp(x, dest, v, FLIGHT.depth, 1 / 60);
      maxStep = Math.max(maxStep, Math.abs(x - prev));
    }
    eq('retarget mid-flight keeps the camera continuous (no jump > 0.35u)', maxStep < 0.35 && Math.abs(x + 5) < 0.05, true);
  }
  {
    const camera = stage.makeCamera(stage.stationFor(0));
    const last = STRATUM_COUNT - 1;
    for (let i = 0; i < 900; i += 1) stage.stepCamera(camera, stage.stationFor(last), 1 / 60);
    const pos = stage.cameraPosition(camera);
    const target = stage.cameraTarget(camera, stage.stationFor(last));
    eq('the camera arrives at the last station', Math.abs(pos.z - STATIONS[last].z) < 0.02 && Math.abs(pos.x - STATIONS[last].lateral) < 0.02, true);
    eq('the aim always leads deeper than the camera', target.z < pos.z, true);
  }
  eq('roll damping takes the short way round a wrap', [stage.shortestAngleDelta(350, 10), stage.shortestAngleDelta(10, 350), stage.unwrapAngle(350, 10)], [20, -20, 370]);
  eq('pointer parallax clamps to its amplitude and inverts Y (screen → world)', [stage.pointerOffset(5, -5), stage.pointerOffset(-5, 5)], [{ lateral: POINTER.lateral, lift: POINTER.lift }, { lateral: -POINTER.lateral, lift: -POINTER.lift }]);
  eq('portrait compensation: landscape unchanged, narrower = farther, bounded', [stage.portraitCompensation(1.6), stage.portraitCompensation(0.46) > 1.4 && stage.portraitCompensation(0.46) < 1.9, stage.portraitCompensation(0.1)], [1, true, stage.portraitCompensation(0.3)]);
  eq('the subject only shifts off-axis where the text column is not', [stage.subjectOffset(0.5).x, stage.subjectOffset(1.8).x > 0], [0, true]);

  console.log('\nStage — render quality policy');
  eq('coarse pointers cap at 1.5×', stage.pixelRatioFor3D(3, true, 390, 844), 1.5);
  eq('fine pointers cap at 2×, small windows keep native DPR', stage.pixelRatioFor3D(1, false, 800, 600), 1);
  {
    const r = stage.pixelRatioFor3D(2, false, 1920, 1080);
    eq('a 2× 1080p screen is held to the pixel budget (and above the floor)', 1920 * 1080 * r * r <= PIXEL_BUDGET.fine + 1 && r >= 0.75 && r < 2, true);
  }
  eq('never below the legibility floor', stage.pixelRatioFor3D(0.1, false, 4096, 2160) >= 0.75, true);
  eq('quality ratchet: fast frames never change the scale', stage.ratchetScale(1, RATCHET.slowMs - 1), 1);
  eq('quality ratchet: a slow window steps down once, one-way', stage.ratchetScale(1, RATCHET.slowMs + 10), RATCHET.step);
  eq('quality ratchet: never below its floor', stage.ratchetScale(RATCHET.floor, 100), RATCHET.floor);

  console.log('\nStage — depth presence (the only brightness authority)');
  eq('the stratum the camera is at is fully present', stage.stratumPresence(0, STATIONS[0].z) > 0.7, true);
  eq('presence falls with depth ahead but never to nothing', (() => {
    const ahead = STRATA.map((_, i) => stage.stratumPresence(i, STATIONS[0].z));
    return ahead.every((v, i) => (i === 0 || v <= ahead[i - 1] + 1e-9) && v >= PRESENCE.floor);
  })(), true);
  eq('a stratum the camera has passed fades, and is gone two strata later', [stage.stratumPresence(0, STATIONS[1].z) < stage.stratumPresence(0, STATIONS[0].z), stage.stratumPresence(0, STATIONS[2].z), stage.stratumPresence(0, STATIONS[4].z)], [true, 0, 0]);
  eq('the camera knows which stratum it is inside, at every station', STATIONS.map((st) => stage.nearestStratum(st.z)), [...STRATA.keys()]);

  console.log('\nStage — the world as a readout of the evidence');
  {
    const marks = stage.distributeMarks(17, 1, 9);
    const byStratum = STRATA.map((_, i) => marks.filter((m) => m.stratum === i).length);
    eq('every claim becomes exactly one mark', marks.length, 27);
    eq('no stratum is left blank — the tally spreads round-robin', byStratum.every((n) => n > 0), true);
    eq('a failing check is visible, and never on the identity stratum', [marks.some((m) => m.state === 'failed'), marks.filter((m) => m.state === 'failed').every((m) => m.stratum !== 0)], [true, true]);
    eq('marks are seated around the aperture, never stacked on one angle', new Set(marks.filter((m) => m.stratum === 0).map((m) => m.angle.toFixed(4))).size === byStratum[0] && marks.every((m) => Number.isFinite(m.angle)), true);
    eq('a clean build shows no failed mark (the scene cannot flatter the work)', stage.distributeMarks(18, 0, 9).some((m) => m.state === 'failed'), false);
    eq('nonsense tallies are ignored rather than crashing the scene', stage.distributeMarks(-5, 0.4, 0).length, 0);
  }

  console.log('\nStage — motes (procedural dust, nothing downloaded)');
  {
    const a = stage.motePositions(MOTES.count, 7);
    const b = stage.motePositions(MOTES.count, 7);
    eq('the same seed gives the same dust (deterministic, so testable)', JSON.stringify(a), JSON.stringify(b));
    eq('a different seed gives different dust', JSON.stringify(a) === JSON.stringify(stage.motePositions(MOTES.count, 8)), false);
    eq('every mote sits inside the machine volume', a.every((m) => Math.hypot(m.x, m.y) <= MOTES.radius + 1e-9 && m.z <= STANDOFF + 1e-9 && m.z >= STANDOFF - MOTES.depth - 1e-9), true);
    eq('the dust fills the whole depth, not just the first chapter', a.some((m) => m.z < -MACHINE_DEPTH * 0.6), true);
    const rand = stage.seeded(1);
    eq('the generator stays in [0,1)', Array.from({ length: 500 }, rand).every((v) => v >= 0 && v < 1), true);
  }
}

rmSync(cfgPath, { force: true });
rmSync(tmp, { recursive: true, force: true });

if (failures > 0) {
  console.error(`\ncheck-units: ${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`\ncheck-units PASS (${checks} logic checks)`);
