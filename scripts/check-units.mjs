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
        'app/silicon.ts',
        'app/cinematic.ts',
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
const siliconPath = pick('app/silicon.js', 'silicon.js');
if (!siliconPath) {
  console.error('check-units FAIL: compiled app/silicon.ts not found');
  process.exit(1);
}
const silicon = await import(pathToFileURL(siliconPath).href);
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

console.log('\nSignature motion tokens (MOTION.signature)');
const { MOTION } = tokens;
const SIG = MOTION.signature;

/* The signature is the brand's primary object, so its tokens are
   load-bearing, not decoration. These invariants are the ones a future
   edit could plausibly break while still "looking fine" locally. */
eq('the retired particle token group is gone', 'nameAssemble' in MOTION, false);
eq('the signature token group exists', typeof SIG, 'object');

const DURATIONS = ['clusterSeconds', 'clusterStaggerSeconds', 'leadSeconds', 'gleamSeconds', 'gleamStaggerSeconds', 'gleamLeadSeconds', 'pointerFollowSeconds'];
eq('every duration is a finite positive number', DURATIONS.filter((k) => !(Number.isFinite(SIG[k]) && SIG[k] > 0)), []);
eq('every geometry token is finite', ['perspective', 'enterZ', 'enterRotateY', 'enterRotateX', 'enterRiseEm', 'pointerTiltDeg'].filter((k) => !Number.isFinite(SIG[k])), []);

/* The light must never sweep a cluster that has not arrived yet: the
   sweep has to start no earlier than the first cluster's entrance. */
eq('the gleam starts no earlier than the entrance', SIG.gleamLeadSeconds >= SIG.leadSeconds, true);

/* Clusters rise *out of* depth, so enterZ is away from the viewer. */
eq('clusters rise out of depth (enterZ is negative)', SIG.enterZ < 0, true);
eq('perspective is a real camera distance, not a flattened one', SIG.perspective >= 600, true);

/* Readability ceiling: the resting signature must stay crisp. A large
   pointer tilt on display type at 8.5rem is unreadable, not premium. */
eq('the pointer tilt stays subtle (<= 6deg)', SIG.pointerTiltDeg > 0 && SIG.pointerTiltDeg <= 6, true);
eq('the entrance rotation stays within a quarter turn', Math.abs(SIG.enterRotateY) <= 90 && Math.abs(SIG.enterRotateX) <= 90, true);
eq('the easing is an explicit cubic-bezier', /^cubic-bezier\(/.test(SIG.ease), true);

/* Total time to a fully legible name, for the longest canonical name.
   The stagger is per grapheme cluster, so the Latin name (9 clusters,
   the longer of the two) sets the worst case. Both the entrance and
   the sweep must finish inside it. */
const clustersOf = (name) => segmentGraphemes(name).filter((c) => c.trim()).length;
eq('the canonical Latin name is 9 clusters', clustersOf('Sobuj Miah'), 9);
eq('the canonical Bengali name is 5 clusters', clustersOf('সবুজ মিয়া'), 5);

const last = clustersOf('Sobuj Miah') - 1;
const entranceEnd = SIG.leadSeconds + last * SIG.clusterStaggerSeconds + SIG.clusterSeconds;
const gleamEnd = SIG.gleamLeadSeconds + last * SIG.gleamStaggerSeconds + SIG.gleamSeconds;
eq('the whole name is legible within 2s', entranceEnd <= 2.0, true);
eq('the gleam ends after the entrance (light reads as a finishing pass)', gleamEnd >= entranceEnd, true);
eq('the signature settles within 2.5s — one pass, with an end', Math.max(entranceEnd, gleamEnd) <= 2.5, true);

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

console.log('\nSilicon Nocturne — the procedural environment');
{
  const { buildPlan, rng, POSES, poseFor, lerpPose, flightPose, shortYaw, FOCUS, focusFor, inRects, easeInOut, makeProjector, ZONES, DIE } = silicon;
  const count = (p) => p.lines.map((l) => l.length / 6);
  eq('the PRNG is deterministic', [rng(7)(), rng(7)()], [rng(7)(), rng(7)()]);
  eq('the PRNG stays in [0,1)', (() => { const r = rng(3); for (let i = 0; i < 1000; i++) { const v = r(); if (v < 0 || v >= 1) return false; } return true; })(), true);
  eq('the same seed yields the same chip', count(buildPlan(11, 'full')), count(buildPlan(11, 'full')));
  eq('the same seed yields identical geometry', buildPlan(11, 'lite').lines[1].slice(0, 60), buildPlan(11, 'lite').lines[1].slice(0, 60));
  const full = buildPlan(20261009, 'full');
  const lite = buildPlan(20261009, 'lite');
  const total = (p) => count(p).reduce((a, b) => a + b, 0);
  eq('the full chip is dense enough to read as a city of silicon', total(full) > 6000, true);
  eq('the full chip stays inside the Canvas 2D draw budget', total(full) < 30000, true);
  eq('mobile detail is genuinely lighter', total(lite) < total(full) * 0.6, true);
  eq('every line array is whole segments', full.lines.every((l) => l.length % 6 === 0), true);
  eq('every coordinate is finite', full.lines.every((l) => l.every(Number.isFinite)), true);
  eq('signal routes are Manhattan polylines of whole points', full.routes.every((r) => r.length >= 4 && r.length % 2 === 0), true);
  eq('zones sit inside the die', Object.values(ZONES).every((z) => z[0] >= -DIE.halfW && z[2] <= DIE.halfW && z[1] >= -DIE.halfD && z[3] <= DIE.halfD), true);
  eq('one camera pose per chapter plus services and verification', POSES.length, SECTION_IDS.length + 2);
  eq('poseFor falls back to the establishing shot', poseFor(99), POSES[0]);
  eq('no two chapters share a camera', new Set(POSES.map((p) => JSON.stringify(p))).size, SECTION_IDS.length + 2);
  eq('the flight eases through its endpoints', [easeInOut(0), easeInOut(1)], [0, 1]);
  eq('the flight eases monotonically', [0.1, 0.3, 0.5, 0.7, 0.9].every((t, i, a) => i === 0 || easeInOut(t) > easeInOut(a[i - 1])), true);
  eq('lerpPose hits both endpoints', [lerpPose(POSES[0], POSES[3], 0), lerpPose(POSES[0], POSES[3], 1)], [POSES[0], POSES[3]]);
  eq('every chapter lights at least one region of the chip', FOCUS.length === POSES.length && FOCUS.every((rs) => rs.length > 0), true);
  eq('every lit region lies on the die', FOCUS.every((rs) => rs.every((r) => r[0] >= -DIE.halfW && r[2] <= DIE.halfW && r[1] >= -DIE.halfD && r[3] <= DIE.halfD && r[0] < r[2] && r[1] < r[3])), true);
  const idx = (id) => SECTION_IDS.indexOf(id);
  eq('each chapter lights the region it is about', [
    FOCUS[idx('work')][0] === ZONES.gpu,
    FOCUS[idx('research')][0] === ZONES.npu,
    FOCUS[idx('workstation')][0] === ZONES.cpu,
  ], [true, true, true]);
  eq('focusFor falls back to the whole die', focusFor(99), FOCUS[0]);
  eq('inRects is inclusive and exact', [inRects([[0, 0, 10, 10]], 10, 10), inRects([[0, 0, 10, 10]], 11, 5)], [true, false]);
  eq('yaw takes the short way round', [shortYaw(170, -170), shortYaw(-90, 90) === -180 || shortYaw(-90, 90) === 180, shortYaw(10, 30)], [20, true, 20]);
  eq('a flight starts and ends exactly on its poses', [flightPose(POSES[0], POSES[3], 0), flightPose(POSES[0], POSES[3], 1)], [POSES[0], POSES[3]]);
  eq('a long flight rises mid-way (an arc, not a slide)', flightPose(POSES[0], POSES[6], 0.5).h > (POSES[0].h + POSES[6].h) / 2, true);
  eq('a flight is finite for every pair of chapters', POSES.every((a) => POSES.every((b) => [0.1, 0.5, 0.9].every((t) => Object.values(flightPose(a, b, t)).every(Number.isFinite)))), true);
  const out = new Float64Array(5);
  /* a point straight ahead of the camera lands on the screen centre */
  const flat = { x: 0, z: 100, h: 50, yaw: 0, pitch: 0, fov: 60 };
  const pr = makeProjector(flat, 800, 600);
  eq('a point dead ahead projects to the screen centre', (() => { const o = new Float64Array(3); pr.project(0, 50, -300, o); return [Math.round(o[0]), Math.round(o[1])]; })(), [400, 300]);
  eq('a point behind the camera is rejected', pr.project(0, 50, 500, new Float64Array(3)), false);
  eq('the horizon of a level camera is mid-screen', Math.round(pr.horizon), 300);
  eq('pitching down lifts the horizon off the top', makeProjector({ ...flat, pitch: 40 }, 800, 600).horizon < 0, true);
  eq('a segment wholly behind the camera is culled', pr.segment(0, 0, 500, 10, 0, 600, out), false);
  eq('a segment crossing the near plane is clipped, not dropped', (() => { const ok = pr.segment(0, 0, 90, 0, 0, -500, out); return ok && out.every(Number.isFinite); })(), true);
  eq('a right-hand point lands right of centre', (() => { const o = new Float64Array(3); pr.project(80, 50, -200, o); return o[0] > 400; })(), true);
  eq('every chapter\'s camera sees a substantial part of the chip', POSES.every((pose) => {
    const proj = makeProjector(pose, 1440, 900);
    let seen = 0;
    for (const l of full.lines) {
      for (let i = 0; i < l.length; i += 6) {
        if (proj.segment(l[i], l[i + 1], l[i + 2], l[i + 3], l[i + 4], l[i + 5], out) && out[1] > -20 && out[1] < 920 && out[0] > -20 && out[0] < 1460) seen++;
      }
    }
    return seen > 600;
  }), true);

  console.log('\nEnvironment motion — continuity, orbit, fog, light, budget');
  const { smootherstep, makeFlight, flightAt, flightVelocity, retarget, orbitPose, dollyPose, pivotOf, ambientOrbit, springStep, clockStep, MAX_FRAME_GAP_MS, fogStops, visibility, lightAt, litLevels, pixelRatioFor } = silicon;
  const KEYS = ['x', 'z', 'h', 'yaw', 'pitch', 'fov'];
  const maxDiff = (p, q) => Math.max(...KEYS.map((k) => Math.abs(p[k] - q[k])));
  eq('smootherstep is C² at its ends (0, 1, flat slopes)', [smootherstep(0), smootherstep(1), Math.abs(smootherstep(1e-4)) < 1e-10, Math.abs(1 - smootherstep(1 - 1e-4)) < 1e-10], [0, 1, true, true]);
  eq('a flight from rest starts and ends exactly on its poses', [maxDiff(flightAt(makeFlight(POSES[1], POSES[4]), 0), POSES[1]), maxDiff(flightAt(makeFlight(POSES[1], POSES[4]), 1), POSES[4])], [0, 0]);
  eq('a flight from rest has zero velocity at both ends', (() => { const f = makeFlight(POSES[0], POSES[5]); return maxDiff(flightVelocity(f, 0.0002), { x: 0, z: 0, h: 0, yaw: 0, pitch: 0, fov: 0 }) < 0.05 && maxDiff(flightVelocity(f, 0.9998), { x: 0, z: 0, h: 0, yaw: 0, pitch: 0, fov: 0 }) < 0.05; })(), true);
  {
    /* retarget at many instants: position is identical and velocity (per ms) matches across the switch */
    const T = 1500;
    let worstPos = 0;
    let worstVel = 0;
    for (const t of [0.1, 0.25, 0.5, 0.73, 0.9]) {
      const f = makeFlight(POSES[0], POSES[3]);
      const g = retarget(f, t, T, T, POSES[6]);
      worstPos = Math.max(worstPos, maxDiff(flightAt(f, t), flightAt(g, 0)));
      const v1 = flightVelocity(f, t);
      const v2 = flightVelocity(g, 0.0001);
      worstVel = Math.max(worstVel, ...KEYS.map((k) => Math.abs(v1[k] - v2[k]) / T));
    }
    eq('a retargeted flight starts exactly where the camera is (no jump)', worstPos < 1e-9, true);
    eq('a retargeted flight keeps the camera velocity (no sudden stop), < 0.002 units/ms', worstVel < 0.002, true);
    const g = retarget(makeFlight(POSES[0], POSES[3]), 0.5, T, T, POSES[6]);
    eq('a retargeted flight still lands exactly on the new chapter', maxDiff(flightAt(g, 1), { ...POSES[6], yaw: flightAt(g, 1).yaw }) < 1e-9, true);
  }
  {
    /* orbit keeps the pivot (the chapter's subject) fixed on screen */
    const ok = POSES.every((p) => {
      const { px, pz } = pivotOf(p);
      const a = new Float64Array(3);
      const b = new Float64Array(3);
      const o = orbitPose(p, 1, -1, 0.02, 1.6);
      if (!makeProjector(p, 1440, 900).project(px, 0, pz, a) || !makeProjector(o, 1440, 900).project(px, 0, pz, b)) return false;
      return Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.01;
    });
    eq('orbit keeps every chapter\'s look-at point fixed on screen (< 0.01 px)', ok, true);
    const p = POSES[3];
    const o = orbitPose(p, 1, 0, 0.02, 1.6);
    const near = new Float64Array(3);
    const near2 = new Float64Array(3);
    const far = new Float64Array(3);
    const far2 = new Float64Array(3);
    const { px, pz } = pivotOf(p);
    makeProjector(p, 1440, 900).project(p.x, 0, p.z - 60, near);
    makeProjector(o, 1440, 900).project(p.x, 0, p.z - 60, near2);
    makeProjector(p, 1440, 900).project(px, 0, pz - 1400, far);
    makeProjector(o, 1440, 900).project(px, 0, pz - 1400, far2);
    eq('orbit is true parallax: near and far ground move in opposite directions', Math.sign(near2[0] - near[0]) === -Math.sign(far2[0] - far[0]), true);
    eq('orbit is restrained: the near floor moves < 60 px at full pointer range', Math.abs(near2[0] - near[0]) < 60, true);
    eq('zero orbit input returns the pose unchanged', orbitPose(p, 0, 0, 0.02, 1.6), p);
    const d = dollyPose(p, 0.07);
    eq('dolly keeps the pitch and moves toward the pivot', [d.pitch === p.pitch, d.h < p.h, Math.abs(pivotOf(d).px - pivotOf(p).px) < 1e-9], [true, true, true]);
  }
  eq('the ambient orbit is bounded by ±1 for any clock value', [0, 1e3, 3.7e4, 9.99e6].every((ms) => ambientOrbit(ms).every((v) => Math.abs(v) <= 1)), true);
  eq('the ambient orbit is continuous (tiny change per 16 ms)', (() => { let worst = 0; for (let ms = 0; ms < 120000; ms += 16) { const a = ambientOrbit(ms); const b = ambientOrbit(ms + 16); worst = Math.max(worst, Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])); } return worst < 0.003; })(), true);
  {
    /* the single-pass atmosphere must equal sky/fog-then-glow drawn separately */
    const { atmosphere, visibility: vis, SKY_RGB, FOG_RGB, GLOW_RGB, POSES } = silicon;
    const H = 900;
    const exact = (p, peak, y) => {
      const pitch = (p.pitch * Math.PI) / 180;
      const f = H / 2 / Math.tan((p.fov * Math.PI) / 360);
      const hz = H / 2 - f * Math.tan(pitch);
      const g0 = hz - 0.3 * H, g1 = hz + 0.1 * H;
      const g = y <= g0 || y >= g1 ? 0 : y <= hz ? (peak * (y - g0)) / (hz - g0) : (peak * (g1 - y)) / (g1 - hz);
      return (dst) => {
        let c;
        if (y < hz) c = [0, 1, 2].map((k) => SKY_RGB[k]);
        else {
          const below = pitch + Math.atan((y - H / 2) / f);
          const fo = below <= 0.0005 ? 1 : 1 - vis(p.h / Math.sin(below));
          c = [0, 1, 2].map((k) => dst[k] * (1 - fo) + FOG_RGB[k] * fo);
        }
        return [0, 1, 2].map((k) => c[k] * (1 - g) + GLOW_RGB[k] * g);
      };
    };
    const merged = (stops, y) => (dst) => {
      let i = 0;
      while (i < stops.length - 2 && stops[i + 1][0] < y) i++;
      const [y0, ...a] = stops[i];
      const [y1, ...b] = stops[i + 1];
      const t = y1 > y0 ? Math.min(1, Math.max(0, (y - y0) / (y1 - y0))) : 0;
      const s = a.map((v, k) => v + (b[k] - v) * t); // canvas interpolates unpremultiplied
      return [0, 1, 2].map((k) => dst[k] * (1 - s[3]) + s[k] * s[3]);
    };
    const dsts = [[5, 5, 7], [14, 63, 33], [120, 236, 166]]; // background, a wire, a lit wire
    let worst = 0;
    let opaqueSky = true;
    let ordered = true;
    for (const p of POSES) {
      const stops = atmosphere(p, H, 0.06);
      if (stops[0][0] !== 0 || stops[stops.length - 1][0] !== H) ordered = false;
      for (let k = 1; k < stops.length; k++) if (stops[k][0] < stops[k - 1][0]) ordered = false;
      const pitch = (p.pitch * Math.PI) / 180;
      const hz = H / 2 - (H / 2 / Math.tan((p.fov * Math.PI) / 360)) * Math.tan(pitch);
      for (const st of stops) if (st[0] < hz && st[4] !== 1) opaqueSky = false;
      for (let y = 0.5; y < H; y += 3) {
        const e = exact(p, 0.06, y), m = merged(stops, y);
        for (const d of dsts) { const A = e(d), B = m(d); for (let k = 0; k < 3; k++) worst = Math.max(worst, Math.abs(A[k] - B[k])); }
      }
    }
    eq('atmosphere stops cover 0…height in order, for every chapter pose', ordered, true);
    eq('atmosphere: the sky above the horizon is opaque', opaqueSky, true);
    eq(`atmosphere: one pass matches sky/fog then glow within 1/255 (worst ${worst.toFixed(2)})`, worst <= 1, true);
  }
  eq('an ambient redraw step moves no on-screen point more than 0.25 px (1440×900, every chapter)', (() => {
    const { MOTION } = tokens;
    const amp = MOTION.cameraDrift.maxOffsetHw;
    const a = new Float64Array(3);
    const b = new Float64Array(3);
    let worst = 0;
    for (const base of silicon.POSES) {
      const at = (ms) => { const [lx, ly] = ambientOrbit(ms); return orbitPose(base, lx * silicon.AMBIENT_AMP, ly * silicon.AMBIENT_AMP, amp, 1440 / 900); };
      for (let ms = 0; ms < 106000; ms += 1000) {
        const p0 = silicon.makeProjector(at(ms), 1440, 900);
        const p1 = silicon.makeProjector(at(ms + silicon.AMBIENT_FRAME_MS), 1440, 900);
        for (let x = -1800; x <= 1800; x += 300) for (let z = -1400; z <= 1400; z += 280) {
          if (!p0.project(x, 0, z, a) || !p1.project(x, 0, z, b)) continue;
          if (a[0] < 0 || a[0] > 1440 || a[1] < 0 || a[1] > 900) continue;
          worst = Math.max(worst, Math.hypot(b[0] - a[0], b[1] - a[1]));
        }
      }
    }
    return worst > 0 && worst <= 0.25;
  })(), true);
  {
    const run = (hz) => { const s = [0, 0]; for (let i = 0; i < hz; i++) springStep(s, 1, 1000 / hz, 60, 18, 1); return s[0]; };
    eq('the token spring is frame-rate independent (30/60/144 Hz agree to 0.5%)', Math.max(Math.abs(run(30) - run(60)), Math.abs(run(144) - run(60))) < 0.005, true);
    const s = [0, 0];
    let peak = 0;
    for (let i = 0; i < 300; i++) { springStep(s, 1, 16.7, 60, 18, 1); peak = Math.max(peak, s[0]); }
    eq('the token spring (ζ ≈ 1.16) settles without overshoot', [peak <= 1 + 1e-9, Math.abs(s[0] - 1) < 1e-3], [true, true]);
  }
  eq('the engine clock clamps a suspended-tab gap', [clockStep(16.7), clockStep(60000), clockStep(-5)], [16.7, MAX_FRAME_GAP_MS, 0]);
  {
    const ok = POSES.every((p) => {
      const st = fogStops(p, 900);
      const rising = st.every((s, i) => i === 0 || (s[0] >= st[i - 1][0] && s[1] <= st[i - 1][1] + 1e-12));
      return rising && st.every(([y, a]) => Number.isFinite(y) && a >= 0 && a <= 1);
    });
    eq('depth fog is monotonic: densest at the horizon, clearing toward the camera', ok, true);
    eq('depth fog: near floor crisp, far die edge dim', [visibility(200) > 0.9, visibility(2400) < 0.2], [true, true]);
  }
  eq('chapter light: 1 inside the core, 0 far outside, smooth between', [lightAt([ZONES.gpu], 120, -165) > 0.9, lightAt([ZONES.gpu], 120, 2000), lightAt([ZONES.gpu], 120, 190 + 85) > 0 && lightAt([ZONES.gpu], 120, 190 + 85) < 1], [true, 0, true]);
  {
    const lv = litLevels(lite, FOCUS[3]);
    const n = lv.reduce((a, l) => a + l.length, 0);
    const lit = lv.reduce((a, l) => a + l.filter((v) => v > 0).length, 0);
    eq('lit levels cover every line, and light only part of the die for a zone chapter', [lv.every((l, c) => l.length === lite.lines[c].length / 6), lit > 0 && lit < n * 0.7], [true, true]);
  }
  eq('render scale: DPR capped at 2, never below 1', [pixelRatioFor(390, 844, 3, 2.6e6), pixelRatioFor(1440, 900, 1, 2.6e6), pixelRatioFor(800, 600, 0.5, 2.6e6)], [2, 1, 1]);
  eq('render scale: a 2× 1080p screen is held to the pixel budget', (() => { const r = pixelRatioFor(1920, 1080, 2, 2.6e6); return 1920 * 1080 * r * r <= 2.6e6 + 1 && r > 1 && r < 2; })(), true);
  eq('render scale: a 2× 1440p screen drops to 1× (budget below native, never sub-1×)', pixelRatioFor(2560, 1440, 2, 2.6e6), 1);
}


/* ── 3D cinematic logic (app/cinematic.ts) ──────────────────────
   The WebGL environment's math: the shot table the camera flies,
   the critically damped flight (no cuts, no overshoot, velocity
   continuity on retarget), the DPR policy and one-way ratchet, and
   the workstation exploded stack. Proven here because none of it is
   visible in a build log. */
{
  const cinePath = pick('app/cinematic.js', 'cinematic.js');
  if (!cinePath) {
    console.error('check-units FAIL: compiled app/cinematic.ts not found');
    process.exit(1);
  }
  const cine = await import(pathToFileURL(cinePath).href);
  const { SHOTS, DISTRICTS, MONUMENTS, STACK, STACK_LAYERS, PIXEL_BUDGET, RATCHET } = cine;

  console.log('\n3D cinematic logic — shot table');
  eq('one district and one shot per chapter', [DISTRICTS.length, SHOTS.length], [SECTION_IDS.length, SECTION_IDS.length]);
  eq('every shot is finite and the camera never dips under the wafer', SHOTS.every((s) => [s.position, s.target].every((v) => [v.x, v.y, v.z].every(Number.isFinite)) && s.position.y > 0), true);
  eq('consecutive shots are distinct — every chapter change is a real flight', SHOTS.every((s, i) => i === 0 || Math.hypot(s.position.x - SHOTS[i - 1].position.x, s.position.y - SHOTS[i - 1].position.y, s.position.z - SHOTS[i - 1].position.z) > 5), true);
  eq('the journey travels forward through the city (z strictly decreasing)', DISTRICTS.every((d, i) => i === 0 || d.z < DISTRICTS[i - 1].z), true);
  eq('project stations name the actual systems', MONUMENTS.map((m) => m.id), ['ternux', 'adt', 'lai', 'ggen', 'skb']);

  console.log('\n3D cinematic logic — critically damped flight');
  {
    let x = 0;
    let v = 0;
    let overshoot = false;
    for (let i = 0; i < 600; i += 1) {
      [x, v] = cine.smoothDamp(x, 10, v, 1.2, 1 / 60);
      if (x > 10 + 1e-4) overshoot = true;
    }
    eq('flight converges and settles (600 frames @60fps)', Math.abs(x - 10) < 0.01 && Math.abs(v) < 0.01, true);
    eq('flight never overshoots its destination', overshoot, false);
  }
  {
    let x = 0;
    let v = 0;
    let prev = 0;
    let maxStep = 0;
    for (let i = 0; i < 540; i += 1) {
      const dest = i < 90 ? 10 : -5; // chapter changes mid-flight
      prev = x;
      [x, v] = cine.smoothDamp(x, dest, v, 1.2, 1 / 60);
      maxStep = Math.max(maxStep, Math.abs(x - prev));
    }
    eq('retarget mid-flight keeps the camera continuous (no frame jumps > 0.35u)', maxStep < 0.35 && Math.abs(x - -5) < 0.05, true);
  }
  {
    const s = cine.makeDamped({ x: 0, y: 0, z: 0 });
    for (let i = 0; i < 600; i += 1) cine.dampVec3(s, { x: 3, y: -4, z: 12 }, 1.0, 1 / 60);
    eq('vector flight converges on every axis', [Math.abs(s.value.x - 3) < 0.01, Math.abs(s.value.y + 4) < 0.01, Math.abs(s.value.z - 12) < 0.01], [true, true, true]);
  }
  eq('pointer orbit clamps to its amplitude', cine.orbitOffset(5, -5), { x: cine.ORBIT.x, y: cine.ORBIT.y, z: 0 });
  eq('portrait compensation: landscape unchanged, narrower = farther, bounded', [cine.portraitCompensation(1.6), cine.portraitCompensation(0.46) > 1.4 && cine.portraitCompensation(0.46) < 1.9, cine.portraitCompensation(0.1)], [1, true, cine.portraitCompensation(0.3)]);

  console.log('\n3D cinematic logic — render quality policy');
  eq('coarse pointers cap at 1.5× (phone floor, not Redmi headroom)', cine.pixelRatioFor3D(3, true, 390, 844), 1.5);
  eq('fine pointers cap at 2×, small windows keep native DPR', cine.pixelRatioFor3D(1, false, 800, 600), 1);
  {
    const r = cine.pixelRatioFor3D(2, false, 1920, 1080);
    eq('a 2× 1080p screen is held to the pixel budget (and above the floor)', 1920 * 1080 * r * r <= PIXEL_BUDGET.fine + 1 && r >= 0.75 && r < 2, true);
  }
  eq('quality ratchet: fast frames never change the scale', cine.ratchetScale(1, RATCHET.slowMs - 1), 1);
  eq('quality ratchet: a slow window steps down once, one-way', cine.ratchetScale(1, RATCHET.slowMs + 10), RATCHET.step);
  eq('quality ratchet: never below its floor', cine.ratchetScale(RATCHET.floor, 100), RATCHET.floor);

  console.log('\n3D cinematic logic — workstation stack & districts');
  {
    const closed = Array.from({ length: STACK_LAYERS }, (_, i) => cine.stackLayerY(i, 0));
    const open = Array.from({ length: STACK_LAYERS }, (_, i) => cine.stackLayerY(i, 1));
    eq('six layers — the real phone-workstation dependency chain', STACK_LAYERS, 6);
    eq('closed tower: compact, evenly pitched, bottom layer seated on the wafer', [closed[0], closed.every((y, i) => i === 0 || Math.abs(y - closed[i - 1] - (STACK.thickness + STACK.gapClosed)) < 1e-9)], [STACK.thickness / 2, true]);
    eq('exploded view: every gap opens to the same air, wider than closed', open.every((y, i) => i === 0 || Math.abs(y - open[i - 1] - (STACK.thickness + STACK.gapOpen)) < 1e-9) && STACK.gapOpen > STACK.gapClosed, true);
    eq('activation clamps outside 0..1', [cine.stackLayerY(2, -1), cine.stackLayerY(2, 2)], [cine.stackLayerY(2, 0), cine.stackLayerY(2, 1)]);
  }
  eq('district activation: current 1, neighbours 0.25, elsewhere 0', [cine.districtActivation(4, 4), cine.districtActivation(3, 4), cine.districtActivation(0, 4)], [1, 0.25, 0]);
}

rmSync(cfgPath, { force: true });
rmSync(tmp, { recursive: true, force: true });

if (failures > 0) {
  console.error(`\ncheck-units: ${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`\ncheck-units PASS (${checks} logic checks)`);
