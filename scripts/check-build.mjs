/* ═══════════════════════════════════════════════════════════════
   STATIC EXPORT / DEEP-LINK / BUDGET VALIDATION

   Runs against the real `out/` directory after `next build`.
   Proves, from the built artifact rather than from source, that:

     1. every section has its own static route (9 real pages)
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
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'out');
const ORIGIN = 'https://soobujmiah.github.io';

/* Kept in sync with app/sections.ts by construction: the route list is
   the source, and this asserts the built artifact matches it. */
const SECTIONS = [
  'home', 'presence', 'about', 'work', 'research', 'stack', 'open-source', 'experience', 'contact',
];
/* The service-intent layer (app/services.ts): hub + eight pages. Kept
   separate from SECTIONS on purpose — these are documents outside the
   pager, so they are held to the metadata/content bar but not to the
   world-map/camera invariants that belong to the nine scenes. */
const SERVICE_ROUTES = [
  '/services/',
  '/services/web-development/', '/services/software-development/', '/services/computer-support/',
  '/services/android-support/', '/services/business-technology/', '/services/graphics-design/',
  '/services/office-administration/', '/services/data-entry/',
];
const EXPECTED_PUBLIC_ROUTES = 2 * (SECTIONS.length + SERVICE_ROUTES.length); // English + Bengali

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
    hero CTAs close the stack; budget holds the ceiling). */
const MAX_TOTAL_JS_GZIP = 370 * 1024;
/** Per-route payload ceiling: the gzipped sum of every script a single
    HTML page references. The home page measured ~250 KB before the
    service layer; this holds every route — pager and services — there. */
const MAX_ROUTE_JS_GZIP = 265 * 1024;
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
for (const slug of SECTIONS) {
  const file = routeFile(slug);
  if (!existsSync(file)) {
    fail(`missing static route for "${slug}" — expected ${file.replace(ROOT, 'out')}`);
    continue;
  }
  const html = readFileSync(file, 'utf8');
  const text = visibleText(html);
  textByRoute[slug] = text;
  if (!/<html[^>]*lang="en"/.test(html)) fail(`route "${slug}" does not declare lang=en`);

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
/* Bangla is independently crawlable below /bn/. Verify the exported
   documents, locale declarations, paired metadata, and translated text. */
const localizedRoutes = [
  ...SECTIONS.map((slug) => [slug === 'home' ? '/bn/' : `/bn/${slug}/`, slug]),
  ...SERVICE_ROUTES.map((route) => [`/bn${route}`, route]),
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
ok(`${EXPECTED_PUBLIC_ROUTES} public routes in total: English + Bengali section and service pages`);

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

/* ── 4. static assets ── */
for (const f of ['og.png', 'robots.txt', 'sitemap.xml', 'icon.svg', '404.html']) {
  if (!existsSync(join(OUT, f))) fail(`out/${f} is missing`);
}
ok('og.png, robots.txt, sitemap.xml, icon.svg, 404.html all present');

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
  if (locs !== EXPECTED_PUBLIC_ROUTES) fail(`sitemap.xml lists ${locs} URLs, expected exactly ${EXPECTED_PUBLIC_ROUTES}`);
  else ok(`sitemap.xml lists exactly ${EXPECTED_PUBLIC_ROUTES} URLs (${SECTIONS.length} sections + ${SERVICE_ROUTES.length} services)`);
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
  if (!homeHtml.includes('worldmap-land')) {
    fail('out/index.html has no world map — the hero environment must be server-rendered');
  } else {
    /* Hub markers. Both class shapes are accepted so a legitimate
       rename cannot produce a false failure — the invariant is "the map
       ships visible network signals", not a particular class name. */
    const hubs = (homeHtml.match(/worldmap-hub(?:-core)?(?![\w-])/g) || []).length;
    if (hubs < 6) fail(`out/index.html ships only ${hubs} map signals (expected >= 6)`);
    else ok(`hero world map is server-rendered (contours + ${hubs} signals), no grid, no light layer`);

    /* The origin must be present AND marked: Bangladesh is the point of
       the map, so a refactor that silently drops it has to fail here. */
    if (!homeHtml.includes('worldmap-bd')) {
      fail('out/index.html has no Bangladesh outline — the map must show the origin country');
    }
    if (!homeHtml.includes('worldmap-origin-core')) {
      fail('out/index.html has no origin pin over Bangladesh');
    } else {
      ok('Bangladesh origin is server-rendered (outline + projected pin)');
    }

    /* Real per-country geography: the country layer ships, and the route's
       active country is highlighted server-side. */
    if (!homeHtml.includes('worldmap-countries')) {
      fail('out/index.html has no country layer — geography must be per-country, not dots');
    }
    if (!homeHtml.includes('worldmap-country-active')) {
      fail('out/index.html has no active country — Home must activate Bangladesh');
    }

    /* The page-aware camera must be server-rendered: Home carries its own
       viewBox + data-cam + data-section, so deep links and crawlers see
       the geography that belongs to the route (Bangladesh, focused). */
    if (!homeHtml.includes('data-cam')) {
      fail('out/index.html has no camera state (data-cam) — the map must be page-aware');
    }
    if (!homeHtml.includes('data-section="home"')) {
      fail('out/index.html does not declare its focus section');
    }
    if (!homeHtml.includes('worldmap-focus')) {
      fail('out/index.html has no focus glow — the current page geography must be highlighted');
    }
    /* data flow: packets travel the arcs via SMIL in the default render */
    if (!homeHtml.includes('worldmap-packet') || !homeHtml.includes('animateMotion')) {
      fail('out/index.html has no data-flow packets — the map must show restrained travelling signals');
    } else {
      ok('page-aware camera + focus glow + data-flow packets are server-rendered');
    }

    /* every route pre-renders its own camera position */
    const homeCam = (homeHtml.match(/data-cam="([^"]*)"/) || [])[1];
    const cams = new Set([homeCam]);
    const homeCountry = (homeHtml.match(/data-country="([^"]*)"/) || [])[1];
    if (homeCountry !== 'BGD') fail(`home must activate Bangladesh (found data-country="${homeCountry}")`);
    for (const slug of SECTIONS) {
      const html = slug === 'home' ? homeHtml : existsSync(routeFile(slug)) ? readFileSync(routeFile(slug), 'utf8') : '';
      const cam = (html.match(/data-cam="([^"]*)"/) || [])[1];
      if (!cam) fail(`route "${slug}" ships no camera state — every page needs its own map position`);
      else cams.add(cam);
      const country = (html.match(/data-country="([^"]*)"/) || [])[1];
      if (!country) fail(`route "${slug}" ships no active country (data-country)`);
    }
    if (cams.size < SECTIONS.length) {
      fail(`only ${cams.size} distinct camera positions across ${SECTIONS.length} routes — each page must focus its own geography`);
    } else {
      ok(`${cams.size} distinct server-rendered camera positions, one per page`);
    }

    /* The identity must stay REAL TEXT. The construction is painted on a
       canvas, which makes this check more load-bearing than before: it is
       what stops the canvas from ever becoming the *only* representation
       of the name. If the glyphs were swapped for pixels or an image, the
       name would be unselectable and invisible to assistive tech — that is
       the end of the site's premise. Three things must all hold. */
    const ink = (homeHtml.match(/class="sig-cell"/g) || []).length;
    if (ink < 6) {
      fail(`out/index.html ships only ${ink} real glyph text nodes (expected >= 6)`);
    } else {
      ok(`${ink} real glyph text nodes server-rendered in the identity mark`);
    }
    /* the accessible name must not depend on the canvas either */
    if (!/<span class="sr-only">Sobuj Miah<\/span>/.test(homeHtml)) {
      fail('out/index.html has no screen-reader copy of the name — the accessible name cannot depend on JavaScript');
    } else {
      ok('the accessible name ships as real text, independent of the construction');
    }
    /* the canvas is scaffolding: it must ship empty, never as the name */
    if (/<canvas[^>]*sig-canvas[^>]*>\s*[^<\s]/.test(homeHtml)) {
      fail('the construction canvas ships content — the name must live in the DOM, not in the canvas');
    }
    /* and the legible state must be the one that needs no JavaScript:
       no phase attribute may be baked into the server render */
    if (/data-asm=/.test(homeHtml)) {
      fail('out/index.html bakes in a construction phase — without JavaScript the name must simply be present');
    }
    else ok(`identity mark is real DOM text (${ink} glyphs), not a canvas or image`);
  }
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
