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
      include: ['app/graphemes.ts', 'app/sections.ts', 'app/language.tsx', 'app/geo.ts'],
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

if (!sigPath || !sectionsPath || !langPath || !geoPath) {
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

rmSync(cfgPath, { force: true });
rmSync(tmp, { recursive: true, force: true });

if (failures > 0) {
  console.error(`\ncheck-units: ${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`\ncheck-units PASS (${checks} logic checks)`);
