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
eq('seven sections', SECTION_IDS.length, 7);
eq('home is the site root', sectionHref(0), '/');
eq('a section is a real directory route', sectionHref(3), '/work/');
eq('index → slug → index round-trips for every section', SECTION_IDS.map((_, i) => indexForSlug(SECTION_IDS[i])), [...SECTION_IDS.keys()]);
eq('unknown slug is null', indexForSlug('nope'), null);
eq('legacy stack slug resolves to merged section', indexForSlug('stack'), 1);
eq('legacy stack pathname resolves to merged section', indexFromPathname('/bn/stack/'), 1);
eq('legacy open-source slug resolves to work', indexForSlug('open-source'), 3);
eq('legacy open-source pathname resolves to work', indexFromPathname('/bn/open-source/'), 3);
eq('pathname /work/ → index 3', indexFromPathname('/work/'), 3);
eq('pathname / → home', indexFromPathname('/'), 0);
eq('unknown pathname falls back to home', indexFromPathname('/nonsense/'), 0);
eq('absolute section URL', sectionUrl(3), `${SITE_ORIGIN}/work/`);
eq('Bengali section path has locale prefix', sectionHref(3, 'bn'), '/bn/work/');
eq('Bengali home path has locale prefix', sectionHref(0, 'bn'), '/bn/');
eq('Bengali section URL', sectionUrl(3, 'bn'), `${SITE_ORIGIN}/bn/work/`);
eq('Bengali pathname maps to section', indexFromPathname('/bn/work/'), 3);

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
  eq('one camera pose per chapter plus services and verification', POSES.length, 9);
  eq('poseFor falls back to the establishing shot', poseFor(99), POSES[0]);
  eq('no two chapters share a camera', new Set(POSES.map((p) => JSON.stringify(p))).size, 9);
  eq('the flight eases through its endpoints', [easeInOut(0), easeInOut(1)], [0, 1]);
  eq('the flight eases monotonically', [0.1, 0.3, 0.5, 0.7, 0.9].every((t, i, a) => i === 0 || easeInOut(t) > easeInOut(a[i - 1])), true);
  eq('lerpPose hits both endpoints', [lerpPose(POSES[0], POSES[3], 0), lerpPose(POSES[0], POSES[3], 1)], [POSES[0], POSES[3]]);
  eq('every chapter lights at least one region of the chip', FOCUS.length === POSES.length && FOCUS.every((rs) => rs.length > 0), true);
  eq('every lit region lies on the die', FOCUS.every((rs) => rs.every((r) => r[0] >= -DIE.halfW && r[2] <= DIE.halfW && r[1] >= -DIE.halfD && r[3] <= DIE.halfD && r[0] < r[2] && r[1] < r[3])), true);
  eq('Work lights the GPU, Research the NPU', [FOCUS[3][0] === ZONES.gpu, FOCUS[4][0] === ZONES.npu], [true, true]);
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
}


rmSync(cfgPath, { force: true });
rmSync(tmp, { recursive: true, force: true });

if (failures > 0) {
  console.error(`\ncheck-units: ${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`\ncheck-units PASS (${checks} logic checks)`);
