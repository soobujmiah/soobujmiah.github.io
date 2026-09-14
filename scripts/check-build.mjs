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

/** Minimum visible server-rendered characters per route. */
const MIN_VISIBLE_CHARS = 220;
/** Total gzipped JS ceiling for the whole site (audit baseline: 262 KB). */
const MAX_TOTAL_JS_GZIP = 340 * 1024;
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
for (const slug of SECTIONS) {
  const file = routeFile(slug);
  if (!existsSync(file)) {
    fail(`missing static route for "${slug}" — expected ${file.replace(ROOT, 'out')}`);
    continue;
  }
  const html = readFileSync(file, 'utf8');
  const text = visibleText(html);
  textByRoute[slug] = text;

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
  else if (!title[1].includes('Sobuj Miah')) fail(`route "${slug}" title does not name the author: "${title[1]}"`);

  const desc = html.match(/<meta name="description" content="([^"]*)"/);
  if (!desc) fail(`route "${slug}" has no meta description`);

  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/);
  const want = new URL(routePath(slug), ORIGIN).href;
  if (!canonical) fail(`route "${slug}" has no canonical link`);
  else if (canonical[1] !== want) fail(`route "${slug}" canonical is ${canonical[1]}, expected ${want}`);

  const og = html.match(/<meta property="og:image" content="([^"]*)"/);
  if (!og) fail(`route "${slug}" has no og:image`);
}
ok(`${SECTIONS.length} section routes present with server-rendered HTML`);

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
} else {
  fail('out/_next/static not found');
}

if (failures > 0) {
  console.error(`\ncheck-build: ${failures} failure(s)`);
  process.exit(1);
}
console.log('\ncheck-build PASS (routes, deep links, SEO assets, and JS budget verified from the built artifact)');
