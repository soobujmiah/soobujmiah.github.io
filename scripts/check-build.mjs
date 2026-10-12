/* ═══════════════════════════════════════════════════════════════
   STATIC EXPORT / DEEP-LINK / BUDGET VALIDATION

   Runs against the real `out/` directory after `next build`.
   Proves, from the built artifact rather than from source, that:

     1. every section has its own static route (7 real pages)
     2. each route ships meaningful server-rendered visible text,
        not an empty shell that only fills in after JavaScript
     3. each route has a real <title>, description and canonical URL
     4. the social card, robots.txt, sitemap.xml and icon exist,
        and the sitemap lists every section
     5. the JavaScript budget has not regressed

   The audit measured the old build at 226 characters of visible
   body text on one indexable page. This script is the guard that
   keeps that from happening again.
   ═══════════════════════════════════════════════════════════════ */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'out');
const ORIGIN = 'https://soobujmiah.github.io';

/* Kept in sync with app/sections.ts by construction: the route list is
   the source, and this asserts the built artifact matches it. */
const SECTIONS = [
  'home', 'presence', 'about', 'work', 'research', 'experience', 'contact',
];
const LEGACY_ROUTES = [['stack', 'presence'], ['open-source', 'work']];
/* The service-intent layer (app/services.ts): hub + eight pages. Kept
   separate from SECTIONS on purpose — these are documents outside the
   pager, so they are held to the metadata/content bar but not to the
   world-map/camera invariants that belong to the seven scenes. */
const SERVICE_ROUTES = [
  '/services/',
  '/services/web-development/', '/services/software-development/', '/services/computer-support/',
  '/services/android-support/', '/services/business-technology/', '/services/graphics-design/',
  '/services/office-administration/', '/services/data-entry/',
];
/* The public verification page (/verification/) — generated evidence for the
   footer's Proof/Claims line. One route in each language, held to the same
   metadata bar as the service documents. */
const VERIFICATION_ROUTES = ['/verification/'];
const EXPECTED_CANONICAL_ROUTES = 2 * (SECTIONS.length + SERVICE_ROUTES.length + VERIFICATION_ROUTES.length);
const EXPECTED_EXPORTED_ROUTES = EXPECTED_CANONICAL_ROUTES + 2 * LEGACY_ROUTES.length;

/** Minimum visible server-rendered characters per route. */
const MIN_VISIBLE_CHARS = 220;
/** Total gzipped JS ceiling for the whole site (audit baseline: 262 KB;
    329 KB before the service layer; the layer adds one ~18 KB chunk that
    only /services/* routes load — so the site-wide sum moved to 360 KB
    while the per-route ceilings below stay where the pager was.
    361 KB since the owner's final micro-polish spec: the identity form
    library grew to 42 semantic silhouettes (+14 science/space and
    accelerator forms, −7 retired generics) and the bottom bar's dot row
    became the perimeter progress trace — ~750 B gz of real, required
    vocabulary that trimming could not recover.
    362 KB since the homepage service-discovery line (later replaced by
    hero CTAs close the stack; budget holds the ceiling).
    380 KB since the public verification page (/verification/): a new static
    document that carries the bilingual claim copy plus the generated
    evidence table. The footer's own proof line adds only ~0.2 KB to the
    shared chunk, because it reads a 298-byte generated summary instead of
    the full projection. The new page loads 134 kB on its own route — well
    under the per-route ceiling below — so the site-wide sum moved only
    because a real route now exists that did not before.
    388 KB for the 2026-10 cinematic journey. The current film plates are
    local WebP assets and the old canvas renderer is removed; the measured
    site-wide JS sum is 379 KB. The later living-motion pass loads its
    atmosphere separately; site-wide JS measures 383 KB. */
const MAX_TOTAL_JS_GZIP = 388 * 1024;
/** Per-route payload ceiling: the gzipped sum of every script a single
    HTML page references. The home page measured ~250 KB before the
    service layer; this holds every route — pager and services — there.
    270 KB since the CSS-3D motion layer: the shared chunk gained
    TiltCard, the Reveal depth variant, the count-up primitive and the
    world-map camera drift (~5 KB gz), moving every pager route from
    263 KB to 268 KB. No new dependency and no new per-route chunk —
    the site-wide total stayed under its 380 KB ceiling at the time.
    271 KB for the 2026-10 cinematic journey: the shared viewport motion
    observer adds entrances to card details across all pager chapters. The
    measured home route is just above 270 KB. The 2026-10 living-motion pass
    adds camera parallax and pointer response to the initial route; measured
    route JS is 272 KB, so the ceiling is 274 KB with 2 KB of headroom.
    The site-wide 388 KB limit and single-chunk ceiling still apply. */
const MAX_ROUTE_JS_GZIP = 274 * 1024;
/** Per-route ceiling on the largest single gzipped chunk group. */
const MAX_PAGE_JS_GZIP = 190 * 1024;

let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.error(`check-build FAIL: ${msg}`);
};
const ok = (msg) => console.log(`  ok   ${msg}`);

if (!existsSync(OUT)) {
  console.error('check-build FAIL: out/ not found — run `npm run build` first');
  process.exit(1);
}

function walkFiles(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, acc);
    else acc.push(full);
  }
  return acc;
}

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-zA-Z#0-9]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const routeFile = (slug) => (slug === 'home' ? join(OUT, 'index.html') : join(OUT, slug, 'index.html'));
const routePath = (slug) => (slug === 'home' ? '/' : `/${slug}/`);

/* ── 1–3. real routes with real, server-rendered content ── */
const textByRoute = {};
const publicTitles = new Set();
const publicDescriptions = new Set();
for (const [sceneIndex, slug] of SECTIONS.entries()) {
  const file = routeFile(slug);
  if (!existsSync(file)) {
    fail(`missing static route for "${slug}" — expected ${file.replace(ROOT, 'out')}`);
    continue;
  }
  const html = readFileSync(file, 'utf8');
  const text = visibleText(html);
  textByRoute[slug] = text;
  if (!/<html[^>]*lang="en"/.test(html)) fail(`route "${slug}" does not declare lang=en`);
  if ((html.match(/<h1(?:\s|>)/g) || []).length !== 1) fail(`route "${slug}" must render exactly one h1`);
  if (html.includes('cinematic-chapter')) fail(`route "${slug}" still renders a second chapter title`);
  if (!html.includes(`class="silicon-world" aria-hidden="true" data-shot="${sceneIndex}"`)) {
    fail(`route "${slug}" has no server-rendered silicon environment`);
  }

  if (text.length < MIN_VISIBLE_CHARS) {
    fail(`route "${slug}" ships only ${text.length} visible chars (min ${MIN_VISIBLE_CHARS}) — content is not server-rendered`);
  }
  /* End-to-end language purity on the artifact: the server renders the
     English tree, so a Bengali codepoint in the visible HTML means a
     Bangla string leaked into the default render. */
  const bengali = (text.match(/[\u0980-\u09FF]/g) || []).length;
  if (bengali > 0) {
    fail(`route "${slug}" ships ${bengali} Bengali char(s) in its default (English) render`);
  }
  const title = html.match(/<title>([^<]*)<\/title>/);
  if (!title) fail(`route "${slug}" has no <title>`);
  else {
    if (!title[1].includes('Sobuj Miah')) fail(`route "${slug}" title does not name the author: "${title[1]}"`);
    if (publicTitles.has(title[1])) fail(`duplicate title across public routes: ${title[1]}`);
    publicTitles.add(title[1]);
  }

  const desc = html.match(/<meta name="description" content="([^"]*)"/);
  if (!desc) fail(`route "${slug}" has no meta description`);
  else {
    if (publicDescriptions.has(desc[1])) fail(`duplicate description across public routes: ${desc[1]}`);
    publicDescriptions.add(desc[1]);
  }

  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/);
  const want = new URL(routePath(slug), ORIGIN).href;
  if (!canonical) fail(`route "${slug}" has no canonical link`);
  else if (canonical[1] !== want) fail(`route "${slug}" canonical is ${canonical[1]}, expected ${want}`);
  const pairedPath = routePath(slug);
  for (const [hreflang, path] of [['en', pairedPath], ['bn', pairedPath === '/' ? '/bn/' : `/bn${pairedPath}`], ['x-default', pairedPath]]) {
    const href = new URL(path, ORIGIN).href;
    if (!html.includes(`rel="alternate" hrefLang="${hreflang}" href="${href}"`)) fail(`route "${slug}" is missing ${hreflang} alternate ${href}`);
  }

  const og = html.match(/<meta property="og:image" content="([^"]*)"/);
  if (!og) fail(`route "${slug}" has no og:image`);
}
ok(`${SECTIONS.length} section routes present with server-rendered HTML`);
ok('pager routes contain no duplicate chapter caption');
if (!/Delivery\s+Verification/.test(textByRoute.presence ?? '')) {
  fail('merged /presence/ route is missing the former technical-stack content');
}
if (!textByRoute.work?.includes('Other selected repositories.')) {
  fail('merged /work/ route is missing selected repositories');
}

/* Old section URLs remain usable, but identify the merged destination
   as canonical and stay out of the sitemap. */
for (const [oldSlug, destination] of LEGACY_ROUTES) {
  for (const prefix of ['', 'bn/']) {
    const file = join(OUT, prefix, oldSlug, 'index.html');
    if (!existsSync(file)) {
      fail(`missing legacy route /${prefix}${oldSlug}/`);
      continue;
    }
    const html = readFileSync(file, 'utf8');
    const canonical = new URL(`/${prefix}${destination}/`, ORIGIN).href;
    if (!html.includes(`<link rel="canonical" href="${canonical}"`)) {
      fail(`legacy /${prefix}${oldSlug}/ must canonicalize to ${canonical}`);
    }
    const en = new URL(`/${destination}/`, ORIGIN).href;
    const bn = new URL(`/bn/${destination}/`, ORIGIN).href;
    for (const [language, href] of [['en', en], ['bn', bn], ['x-default', en]]) {
      if (!html.includes(`rel="alternate" hrefLang="${language}" href="${href}"`)) {
        fail(`legacy /${prefix}${oldSlug}/ is missing ${language} alternate ${href}`);
      }
    }
    if (visibleText(html).length < MIN_VISIBLE_CHARS) fail(`legacy /${prefix}${oldSlug}/ has no useful content`);
  }
}
ok(`${LEGACY_ROUTES.length * 2} legacy language routes retain content and point to merged canonicals`);

/* ── 1b. service routes: same bar (real HTML, title names the author,
       description, exact canonical, og:image, EN-only default render)
       plus Service/BreadcrumbList structured data ── */
for (const route of SERVICE_ROUTES) {
  const file = join(OUT, ...route.split('/').filter(Boolean), 'index.html');
  if (!existsSync(file)) {
    fail(`missing static service route ${route} — expected ${file.replace(ROOT, 'out')}`);
    continue;
  }
  const html = readFileSync(file, 'utf8');
  const text = visibleText(html);
  if (!/<html[^>]*lang="en"/.test(html)) fail(`service route ${route} does not declare lang=en`);
  if (text.length < MIN_VISIBLE_CHARS) fail(`service route ${route} ships only ${text.length} visible chars`);
  const bengali = (text.match(/[\u0980-\u09FF]/g) || []).length;
  if (bengali > 0) fail(`service route ${route} ships ${bengali} Bengali char(s) in its default (English) render`);
  const title = html.match(/<title>([^<]*)<\/title>/);
  if (!title) fail(`service route ${route} has no <title>`);
  else {
    if (!title[1].includes('Sobuj Miah')) fail(`service route ${route} title does not name the author: "${title[1]}"`);
    if (publicTitles.has(title[1])) fail(`duplicate <title> across public routes at ${route}: "${title[1]}"`);
    publicTitles.add(title[1]);
  }
  const desc = html.match(/<meta name="description" content="([^"]*)"/);
  if (!desc) fail(`service route ${route} has no meta description`);
  else {
    if (publicDescriptions.has(desc[1])) fail(`duplicate meta description across public routes on ${route}`);
    publicDescriptions.add(desc[1]);
  }
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/);
  const want = new URL(route, ORIGIN).href;
  if (!canonical) fail(`service route ${route} has no canonical link`);
  else if (canonical[1] !== want) fail(`service route ${route} canonical is ${canonical[1]}, expected ${want}`);
  const bnRoute = `/bn${route}`;
  for (const [hreflang, path] of [['en', route], ['bn', bnRoute], ['x-default', route]]) {
    const href = new URL(path, ORIGIN).href;
    if (!html.includes(`rel="alternate" hrefLang="${hreflang}" href="${href}"`)) fail(`service route ${route} is missing ${hreflang} alternate ${href}`);
  }
  if (!html.match(/<meta property="og:image" content="([^"]*)"/)) fail(`service route ${route} has no og:image`);
  if (/noindex/i.test(html)) fail(`service route ${route} carries a noindex directive`);
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  let hasBreadcrumb = false;
  let hasService = false;
  for (const raw of ld) {
    try {
      const doc = JSON.parse(raw);
      const nodes = doc['@graph'] ?? [doc];
      for (const n of nodes) {
        if (n['@type'] === 'BreadcrumbList') hasBreadcrumb = true;
        if (n['@type'] === 'Service' || n['@type'] === 'CollectionPage') hasService = true;
        if (n['@type'] === 'LocalBusiness' || n.aggregateRating || n.review) fail(`service route ${route} carries forbidden LocalBusiness/rating/review schema`);
      }
    } catch (e) {
      fail(`service route ${route} has invalid JSON-LD: ${e.message}`);
    }
  }
  if (!hasBreadcrumb) fail(`service route ${route} has no BreadcrumbList JSON-LD`);
  if (!hasService) fail(`service route ${route} has no Service/CollectionPage JSON-LD`);
  if (!html.includes('href="/services/"') && route !== '/services/') fail(`service route ${route} does not link back to the hub`);
}
ok(`${SERVICE_ROUTES.length} service routes present with unique title/description, exact canonical, valid Service + BreadcrumbList JSON-LD`);

/* ── 1c. verification routes: the generated proof page ──
   Same bar as the service documents, plus the two things that make this
   page trustworthy: it must carry real generated evidence text (not an
   empty shell), and its machine-verified list must actually render rows. */
for (const route of VERIFICATION_ROUTES) {
  const file = join(OUT, ...route.split('/').filter(Boolean), 'index.html');
  if (!existsSync(file)) {
    fail(`missing static verification route ${route} — expected ${file.replace(ROOT, 'out')}`);
    continue;
  }
  const html = readFileSync(file, 'utf8');
  const text = visibleText(html);
  if (!/<html[^>]*lang="en"/.test(html)) fail(`verification route ${route} does not declare lang=en`);
  if (text.length < MIN_VISIBLE_CHARS) fail(`verification route ${route} ships only ${text.length} visible chars`);
  const bengali = (text.match(/[\u0980-\u09FF]/g) || []).length;
  if (bengali > 0) fail(`verification route ${route} ships ${bengali} Bengali char(s) in its default (English) render`);
  const title = html.match(/<title>([^<]*)<\/title>/);
  if (!title) fail(`verification route ${route} has no <title>`);
  else {
    if (!title[1].includes('Sobuj Miah')) fail(`verification route ${route} title does not name the author: "${title[1]}"`);
    if (publicTitles.has(title[1])) fail(`duplicate <title> across public routes at ${route}: "${title[1]}"`);
    publicTitles.add(title[1]);
  }
  const desc = html.match(/<meta name="description" content="([^"]*)"/);
  if (!desc) fail(`verification route ${route} has no meta description`);
  else {
    if (publicDescriptions.has(desc[1])) fail(`duplicate meta description across public routes on ${route}`);
    publicDescriptions.add(desc[1]);
  }
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/);
  const want = new URL(route, ORIGIN).href;
  if (!canonical) fail(`verification route ${route} has no canonical link`);
  else if (canonical[1] !== want) fail(`verification route ${route} canonical is ${canonical[1]}, expected ${want}`);
  for (const [hreflang, path] of [['en', route], ['bn', `/bn${route}`], ['x-default', route]]) {
    const href = new URL(path, ORIGIN).href;
    if (!html.includes(`rel="alternate" hrefLang="${hreflang}" href="${href}"`)) {
      fail(`verification route ${route} is missing ${hreflang} alternate ${href}`);
    }
  }
  if (!html.includes('property="og:image"')) fail(`verification route ${route} has no og:image`);
  /* The page must show the generated evidence, not a placeholder: the
     machine-verified heading and at least one evidence row have to ship. */
  if (!/Machine-verified claims/.test(text)) fail(`verification route ${route} is missing its machine-verified section`);
  if (!/Not automatically verified/.test(text)) fail(`verification route ${route} is missing its human-attested section`);
  if (!/Evidence as of/.test(text)) fail(`verification route ${route} is missing its deterministic as-of timestamp`);
  if (!/build\.status/.test(text)) fail(`verification route ${route} ships no evidence rows — public/verification.json may be empty`);
  let ld;
  try {
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    ld = blocks.flatMap((b) => b['@graph'] ?? [b]);
  } catch (e) {
    fail(`verification route ${route} has invalid JSON-LD: ${e.message}`);
  }
  if (ld) {
    if (!ld.some((n) => n['@type'] === 'BreadcrumbList')) fail(`verification route ${route} has no BreadcrumbList JSON-LD`);
    if (!ld.some((n) => n['@type'] === 'WebPage')) fail(`verification route ${route} has no WebPage JSON-LD`);
  }
  /* The page must stay reachable from the site graph: its own chrome links
     home, so a visitor arriving from a deep link is never stranded. The
     reciprocal language pair is asserted by the hreflang block above. */
  if (!html.includes('href="/"') && !html.includes('href="/bn/"')) {
    fail(`verification route ${route} does not link back to the site root`);
  }
}
ok(`${VERIFICATION_ROUTES.length} verification route(s) present with generated evidence, unique metadata, exact canonical, WebPage + BreadcrumbList JSON-LD`);

/* Bangla is independently crawlable below /bn/. Verify the exported
   documents, locale declarations, paired metadata, and translated text. */
const localizedRoutes = [
  ...SECTIONS.map((slug) => [slug === 'home' ? '/bn/' : `/bn/${slug}/`, slug]),
  ...SERVICE_ROUTES.map((route) => [`/bn${route}`, route]),
  ...VERIFICATION_ROUTES.map((route) => [`/bn${route}`, route]),
];
/* GitHub Pages serves these separate project sites on this same hostname;
   their paths intentionally do not live in this portfolio's export. */
const SAME_HOST_PROJECT_PATHS = new Set(['/arms', '/iqra-online-mart', '/ternux', '/adt']);
for (const [route] of localizedRoutes) {
  const file = join(OUT, ...route.split('/').filter(Boolean), 'index.html');
  if (!existsSync(file)) {
    fail(`missing static Bengali route ${route}`);
    continue;
  }
  const html = readFileSync(file, 'utf8');
  const text = visibleText(html);
  if (text.length < MIN_VISIBLE_CHARS) fail(`Bengali route ${route} ships only ${text.length} visible chars`);
  if ((html.match(/<h1(?:\s|>)/g) || []).length !== 1) fail(`Bengali route ${route} must render exactly one h1`);
  if (html.includes('cinematic-chapter')) fail(`Bengali route ${route} still renders a second chapter title`);
  if (!/<html[^>]*lang="bn"/.test(html)) fail(`Bengali route ${route} does not declare lang=bn`);
  if (!/[\u0980-\u09FF]/.test(text)) fail(`Bengali route ${route} contains no Bengali visible text`);
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
  if (!title) fail(`Bengali route ${route} has no title`);
  else {
    if (!/[\u0980-\u09FF]/.test(title)) fail(`Bengali route ${route} title is not translated`);
    if (publicTitles.has(title)) fail(`duplicate title across public routes: ${title}`);
    publicTitles.add(title);
  }
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  if (!desc) fail(`Bengali route ${route} has no description`);
  else {
    if (!/[\u0980-\u09FF]/.test(desc)) fail(`Bengali route ${route} description is not translated`);
    if (publicDescriptions.has(desc)) fail(`duplicate description across public routes: ${desc}`);
    publicDescriptions.add(desc);
  }
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  if (canonical !== new URL(route, ORIGIN).href) fail(`Bengali route ${route} has incorrect canonical ${canonical}`);
  for (const [hreflang, path] of [['en', route.replace(/^\/bn/, '') || '/'], ['bn', route], ['x-default', route.replace(/^\/bn/, '') || '/']]) {
    const href = new URL(path, ORIGIN).href;
    if (!html.includes(`rel="alternate" hrefLang="${hreflang}" href="${href}"`)) fail(`${route} is missing ${hreflang} alternate ${href}`);
  }
  if (!html.includes('property="og:image"')) fail(`Bengali route ${route} has no og:image`);
}
ok(`${localizedRoutes.length} Bengali routes present with Bengali content, titles, descriptions, canonical and reciprocal hreflang`);
for (const [route, phrase] of [['/bn/presence/', 'রিলিজ ও যাচাই'], ['/bn/work/', 'অন্যান্য নির্বাচিত রিপোজিটরি']]) {
  const file = join(OUT, ...route.split('/').filter(Boolean), 'index.html');
  if (existsSync(file) && !visibleText(readFileSync(file, 'utf8')).includes(phrase)) {
    fail(`${route} is missing its merged Bengali content`);
  }
}
ok(`${EXPECTED_EXPORTED_ROUTES} exported routes: ${EXPECTED_CANONICAL_ROUTES} primary URLs and ${2 * LEGACY_ROUTES.length} legacy aliases`);

/* Every rendered same-origin link must resolve to an exported file. */
let checkedLinks = 0;
for (const file of walkFiles(OUT).filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(file, 'utf8');
  for (const [, rawHref] of html.matchAll(/\bhref="([^"]+)"/g)) {
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('/_next/')) continue;
    let url;
    try { url = new URL(rawHref.replaceAll('&amp;', '&'), ORIGIN); } catch { continue; }
    if (url.origin !== ORIGIN) continue;
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); } catch { pathname = url.pathname; }
    if (SAME_HOST_PROJECT_PATHS.has(pathname.replace(/\/$/, ''))) continue;
    const parts = pathname.split('/').filter(Boolean);
    const direct = join(OUT, ...parts);
    const candidates = pathname.endsWith('/')
      ? [join(direct, 'index.html')]
      : [direct, `${direct}.html`, join(direct, 'index.html')];
    checkedLinks += 1;
    if (!candidates.some((candidate) => existsSync(candidate))) {
      fail(`broken internal link ${rawHref} in ${file.replace(OUT, 'out')}`);
    }
  }
}
ok(`${checkedLinks} same-origin HTML links resolve to exported files`);

if (textByRoute['home']) ok(`home ships ${textByRoute['home'].length} visible chars without JavaScript (audit baseline: 226)`);

/* ── 4. static assets and strict sitemap validation ── */
for (const f of ['og.png', 'robots.txt', 'sitemap.xml', 'icon.svg', '404.html']) {
  if (!existsSync(join(OUT, f))) fail(`out/${f} is missing`);
}
ok('og.png, robots.txt, sitemap.xml, icon.svg, 404.html all present');

/* The environment is procedural: no stock raster or video may ship. */
if (existsSync(join(OUT, 'cinema'))) fail('out/cinema/ still exists — the stock plates and footage were retired');
else ok('no stock media under out/cinema/ (the environment is drawn, not shipped)');
const heavy = walkFiles(OUT).filter((f) => /\.(mp4|webm|mov)$/i.test(f));
if (heavy.length) fail(`video files ship in the export: ${heavy.map((f) => f.replace(OUT, 'out')).join(', ')}`);

const og = join(OUT, 'og.png');
if (existsSync(og)) {
  const buf = readFileSync(og);
  const isPng = buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (!isPng) fail('out/og.png is not a PNG — social platforms do not accept SVG/other formats');
  else {
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    if (w !== 1200 || h !== 630) fail(`out/og.png is ${w}x${h}, expected 1200x630`);
    else ok(`og.png is a valid ${w}x${h} PNG (${Math.round(statSync(og).size / 1024)} KB)`);
  }
}

{
  const notFound = join(OUT, '404.html');
  if (existsSync(notFound)) {
    const t404 = visibleText(readFileSync(notFound, 'utf8'));
    const bn404 = (t404.match(/[\u0980-\u09FF]/g) || []).length;
    if (t404.length < 40) fail(`404.html ships only ${t404.length} visible chars`);
    else if (bn404 > 0) fail(`404.html ships ${bn404} Bengali char(s) in its default render`);
    else ok(`404.html renders ${t404.length} visible chars, no Bengali in the default render`);
  }
}

if (existsSync(join(OUT, 'sitemap.xml'))) {
  const xml = readFileSync(join(OUT, 'sitemap.xml'), 'utf8');
  for (const slug of SECTIONS) {
    const url = new URL(routePath(slug), ORIGIN).href;
    if (!xml.includes(url)) fail(`sitemap.xml is missing ${url}`);
  }
  ok('sitemap.xml lists every section route');
  /* Search Console can fetch XML successfully and still reject it during
     sitemap processing. Parse the exported document with Python's strict
     XML parser and validate sitemap + XHTML namespace structure, unique
     canonical URLs, timestamps, and reciprocal language alternates. */
  const xmlCheck = String.raw`import sys, xml.etree.ElementTree as ET
from datetime import datetime
p = sys.argv[1]
ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9", "xhtml": "http://www.w3.org/1999/xhtml"}
root = ET.parse(p).getroot()
if root.tag != "{http://www.sitemaps.org/schemas/sitemap/0.9}urlset":
    raise SystemExit("root must be a sitemap 0.9 urlset with the standard namespace")
urls = root.findall("sm:url", ns)
locs = [node.findtext("sm:loc", namespaces=ns) for node in urls]
if any(not loc for loc in locs):
    raise SystemExit("every url entry must contain a non-empty loc")
if len(locs) != len(set(locs)):
    raise SystemExit("duplicate loc values found")
for node in urls:
    loc = node.findtext("sm:loc", namespaces=ns)
    if not loc.startswith("https://soobujmiah.github.io/"):
        raise SystemExit("non-canonical host or non-HTTPS URL: " + loc)
    lastmod = node.findtext("sm:lastmod", namespaces=ns)
    if lastmod:
        try: datetime.fromisoformat(lastmod.replace("Z", "+00:00"))
        except ValueError: raise SystemExit("invalid lastmod for " + loc + ": " + lastmod)
    alts = {}
    for alt in node.findall("xhtml:link", ns):
        lang, href = alt.get("hreflang"), alt.get("href")
        if not lang or not href: raise SystemExit("alternate link missing hreflang/href for " + loc)
        if lang in alts: raise SystemExit("duplicate hreflang " + lang + " for " + loc)
        alts[lang] = href
    if set(alts) != {"en", "bn", "x-default"}:
        raise SystemExit("expected en, bn and x-default alternates for " + loc)
    if alts["x-default"] != alts["en"]:
        raise SystemExit("x-default must match the English URL for " + loc)
    if loc not in (alts["en"], alts["bn"]):
        raise SystemExit("loc must match its own English or Bengali alternate for " + loc)
    for href in alts.values():
        if href not in locs: raise SystemExit("alternate URL absent from sitemap loc entries: " + href)
if len(locs) != 34:
    raise SystemExit("expected exactly 34 primary URLs (17 routes in EN + BN), got " + str(len(locs)))
print("  ok   sitemap.xml is well-formed XML; 34 unique URLs, valid lastmod and reciprocal en/bn/x-default alternates")`;
  const parsed = spawnSync('python3', ['-c', xmlCheck, join(OUT, 'sitemap.xml')], { encoding: 'utf8' });
  if (parsed.status !== 0) fail(`sitemap.xml strict XML/alternate validation failed: ${(parsed.stderr || parsed.stdout).trim()}`);
  else process.stdout.write(parsed.stdout);
  for (const route of SERVICE_ROUTES) {
    const url = new URL(route, ORIGIN).href;
    if (!xml.includes(url)) fail(`sitemap.xml is missing ${url}`);
  }
  for (const [route] of localizedRoutes) {
    const url = new URL(route, ORIGIN).href;
    if (!xml.includes(url)) fail(`sitemap.xml is missing ${url}`);
  }
  if (!xml.includes('hreflang="bn"') || !xml.includes('hreflang="en"') || !xml.includes('hreflang="x-default"')) fail('sitemap.xml lacks language alternate links');
  const locs = (xml.match(/<loc>/g) || []).length;
  if (locs !== EXPECTED_CANONICAL_ROUTES) fail(`sitemap.xml lists ${locs} URLs, expected exactly ${EXPECTED_CANONICAL_ROUTES}`);
  else ok(`sitemap.xml lists exactly ${EXPECTED_CANONICAL_ROUTES} primary URLs (${SECTIONS.length} sections + ${SERVICE_ROUTES.length} services + ${VERIFICATION_ROUTES.length} verification page, in both languages)`);
}

if (existsSync(join(OUT, 'robots.txt'))) {
  const robots = readFileSync(join(OUT, 'robots.txt'), 'utf8');
  if (!/User-Agent:\s*\*/i.test(robots) || !/Allow:\s*\//i.test(robots)) fail('robots.txt does not allow crawling');
  if (!robots.includes(`${ORIGIN}/sitemap.xml`)) fail('robots.txt does not reference the canonical sitemap');
  else ok('robots.txt allows crawling and references sitemap.xml');
}

/* ── 5. JavaScript budget ── */
function walkJs(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkJs(full, acc);
    else if (entry.name.endsWith('.js')) acc.push(full);
  }
  return acc;
}

const chunksDir = join(OUT, '_next', 'static');
if (existsSync(chunksDir)) {
  const files = walkJs(chunksDir);
  let raw = 0;
  let gz = 0;
  let largest = 0;
  for (const f of files) {
    const buf = readFileSync(f);
    raw += buf.length;
    const g = gzipSync(buf, { level: 6 }).length;
    gz += g;
    if (g > largest) largest = g;
  }
  const kb = (n) => `${Math.round(n / 1024)} KB`;
  if (gz > MAX_TOTAL_JS_GZIP) fail(`total JS ${kb(gz)} gzipped exceeds the ${kb(MAX_TOTAL_JS_GZIP)} budget`);
  else ok(`total JS ${kb(gz)} gzipped across ${files.length} chunks (${kb(raw)} raw, budget ${kb(MAX_TOTAL_JS_GZIP)})`);
  if (largest > MAX_PAGE_JS_GZIP) fail(`largest chunk ${kb(largest)} gzipped exceeds the ${kb(MAX_PAGE_JS_GZIP)} budget`);
  else ok(`largest single chunk ${kb(largest)} gzipped (budget ${kb(MAX_PAGE_JS_GZIP)})`);

  /* per-route payload: what one page actually loads, not the site sum */
  const gzByFile = new Map(files.map((f) => [f.replace(OUT, '').replace(/\\/g, '/'), gzipSync(readFileSync(f), { level: 6 }).length]));
  const routeHtml = [
    ...SECTIONS.map((slug) => [routePath(slug), routeFile(slug)]),
    ...SERVICE_ROUTES.map((r) => [r, join(OUT, ...r.split('/').filter(Boolean), 'index.html')]),
    ...VERIFICATION_ROUTES.map((r) => [r, join(OUT, ...r.split('/').filter(Boolean), 'index.html')]),
    ...localizedRoutes.map(([route]) => [route, join(OUT, ...route.split('/').filter(Boolean), 'index.html')]),
  ];
  let heaviest = ['', 0];
  for (const [route, file] of routeHtml) {
    if (!existsSync(file)) continue;
    const html = readFileSync(file, 'utf8');
    const srcs = [...html.matchAll(/<script[^>]+src="([^"]+\.js)[^"]*"/g)].map((m) => m[1].replace(/\?.*$/, ''));
    const total = [...new Set(srcs)].reduce((n, src) => n + (gzByFile.get(src) ?? 0), 0);
    if (total > MAX_ROUTE_JS_GZIP) fail(`route ${route} loads ${kb(total)} gzipped JS, over the ${kb(MAX_ROUTE_JS_GZIP)} per-route ceiling`);
    if (total > heaviest[1]) heaviest = [route, total];
  }
  ok(`heaviest route ${heaviest[0]} loads ${kb(heaviest[1])} gzipped JS (per-route ceiling ${kb(MAX_ROUTE_JS_GZIP)})`);
} else {
  fail('out/_next/static not found');
}

/* ── hero environment, verified from what actually ships ──
   Source-level guards live in check-design.mjs; these confirm the same
   thing in the built output, where a stray rule or a client-only render
   would otherwise slip through. */
const homeHtml = textByRoute && existsSync(join(OUT, 'index.html')) ? readFileSync(join(OUT, 'index.html'), 'utf8') : '';
if (homeHtml) {
  /* The name is real text and the only <h1>; the environment is scaffolding. */
  if (!/<h1 class="hero-name">/.test(homeHtml)) fail('out/index.html: the hero name must be the h1.hero-name');
  const words = (homeHtml.match(/class="cinema-word(?: cinema-word--play)?"/g) || []).length;
  if (words < 2) fail(`out/index.html ships only ${words} name word(s) as real text`);
  else ok(`hero name ships as real DOM text (${words} words), no canvas or image`);
  if (/<canvas[^>]*>\s*[^<\s]/.test(homeHtml)) fail('a canvas ships content — the environment must ship empty');
  for (const slug of SECTIONS) {
    const html = existsSync(routeFile(slug)) ? readFileSync(routeFile(slug), 'utf8') : '';
    if ((html.match(/<canvas/g) || []).length !== 2) fail(`route "${slug}" must ship exactly the two environment canvases`);
    if (/cinema-world|worldmap|sig-cell/.test(html)) fail(`route "${slug}" still ships retired environment markup`);
  }
  ok('every chapter ships the silicon environment (2 empty canvases + no-JS gradient) and no retired markup');
}

const cssDir = join(OUT, '_next', 'static', 'css');
if (existsSync(cssDir)) {
  const sheets = readdirSync(cssDir).filter((f) => f.endsWith('.css'));
  if (!sheets.length) fail('no CSS bundle found in out/_next/static/css');
  let css = '';
  for (const f of sheets) css += readFileSync(join(cssDir, f), 'utf8');
  const banned = [
    ['grid-bg', 'the 60px square grid'],
    ['pager-grid', 'the grid overlay'],
    ['sig-sweep', 'the sweeping light band'],
    ['sigFlash', 'the light-flash keyframes'],
    ['86efac', 'near-white mint ink'],
    ['134,239,172', 'the near-white mint gradient'],
    ['134, 239, 172', 'the near-white mint gradient'],
    ['220,255,230', 'the near-white particle core'],
    ['blur(80px)', 'the blurred glow layer'],
  ];
  const leaked = banned.filter(([needle]) => css.includes(needle));
  if (leaked.length) {
    for (const [needle, what] of leaked) fail(`shipped CSS still contains ${what} ("${needle}")`);
  } else {
    ok(`shipped CSS is free of the removed hero motifs (${sheets.length} sheet(s) scanned)`);
  }
  if (!/prefers-reduced-motion/.test(css)) fail('shipped CSS has no prefers-reduced-motion block');
}

if (failures > 0) {
  console.error(`\ncheck-build: ${failures} failure(s)`);
  process.exit(1);
}
console.log(
  '\ncheck-build PASS (routes, deep links, SEO assets, hero environment, and JS budget verified from the built artifact)'
);
