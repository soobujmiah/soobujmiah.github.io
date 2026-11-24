import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { gzipSync } from 'node:zlib';

const root = process.cwd();
const sourceOnly = process.argv.includes('--source-only');
const data = JSON.parse(fs.readFileSync(path.join(root, 'src/data/site-content.json'), 'utf8'));
const checks = [];
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (name, condition, details = '') => checks.push({ name, pass: Boolean(condition), details });
const routes = [];
for (const lang of ['en', 'bn']) {
  const base = lang === 'en' ? '' : '/bn';
  routes.push(`${base}/`);
  for (const page of ['about', 'services', 'experience', 'projects', 'research', 'evidence', 'contact']) routes.push(`${base}/${page}/`);
  for (const item of data.services) routes.push(`${base}/services/${item.slug}/`);
  for (const item of data.projects) routes.push(`${base}/projects/${item.slug}/`);
}
const publicSource = ['index.html', 'src/App.tsx', 'src/styles.css', 'src/data/site-content.json', 'scripts/create-routes.mjs'].map(read).join('\n');
const expectedProjects = ['ternux', 'adt', 'lai', 'ggen', 'songjog'];
const baseUrl = data.site.url.replace(/\/$/, '');

assert('Bilingual content covers all profile pages', ['en', 'bn'].every(lang => ['home', 'about', 'services', 'experience', 'projects', 'research', 'evidence', 'contact'].every(page => data.pages[lang][page]?.title && data.pages[lang][page]?.description)));
assert('Requested public projects are represented and removed projects stay absent', expectedProjects.every(slug => data.projects.some(project => project.slug === slug)) && !data.projects.some(project => ['datakhoj', 'iqra-online-mart', 'ternuxx'].includes(project.slug)) && !/ternuxx/i.test(read('src/data/site-content.json') + read('src/App.tsx') + read('src/styles.css')));
assert('Retired project routes redirect to the living page', read('scripts/create-routes.mjs').includes("['/projects/ternuxx/', '/projects/']") && read('scripts/create-routes.mjs').includes('http-equiv="refresh"'));
assert('Full source-file work history and time zone are represented', data.experience.length === 7 && data.experience.every(item => item.period) && data.site.timezone.en.startsWith('GMT+6'));
assert('All GitHub profile service links target generated service slugs', ['web-development', 'software-development', 'computer-support', 'android-support', 'business-technology', 'graphics-design', 'office-administration', 'data-entry'].every(slug => data.services.some(service => service.slug === slug)));
assert('Service and project slugs are unique and route-safe', [...data.services, ...data.projects].every(item => /^[a-z0-9-]+$/.test(item.slug)) && new Set([...data.services, ...data.projects].map(item => item.slug)).size === data.services.length + data.projects.length);
assert('Project cards link to localized detail pages and repositories', publicSource.includes("routePath('project', lang, project.slug)") && data.projects.every(project => /^https:\/\/github\.com\//.test(project.url)));
assert('No private repository URLs or token-shaped secrets', !/https?:\/\/github\.com\/[^\s"']+\/(?:private|internal)(?:[\s"']|$)/i.test(publicSource) && !/gh[pousr]_[A-Za-z0-9]{20,}/i.test(publicSource));
assert('Search Console verification meta preserved', publicSource.includes('Z7hOImSydB4nMFUCSyYaLVRpIPHu8FJBlIbfVSbhWs8'));
assert('Search Console verification HTML preserved', fs.existsSync(path.join(root, 'public/google7974d87a16aa1b38.html')) && read('public/google7974d87a16aa1b38.html').includes('google-site-verification: google7974d87a16aa1b38.html'));
assert('3D scene, WebGL canvas, and motion control have been removed', !publicSource.includes('WorkbenchScene') && !publicSource.includes('scene-motion-toggle') && !read('src/styles.css').includes('workbench-canvas') && !fs.existsSync(path.join(root, 'src/scene/WorkbenchScene.ts')));
assert('Homepage follows the source index visual system without 3D artwork', read('src/App.tsx').includes('source-hero') && read('src/styles.css').includes('--lime: #cdff57') && read('src/styles.css').includes('--mint: #57e8ff') && !publicSource.includes('WorkbenchScene'));
assert('Portfolio remains multi-page with focused service and work previews', read('src/App.tsx').includes('featuredProjects') && read('src/App.tsx').includes("key: 'experience'") && read('src/App.tsx').includes('footer-evidence') && read('src/data/site-content.json').includes('"featuredServices"'));
assert('Reduced-motion preference disables decorative motion', read('src/styles.css').includes('@media (prefers-reduced-motion: reduce)') && read('src/styles.css').includes('.source-marquee > div'));
assert('Every section stays reachable from the dock without a hamburger menu', !read('src/App.tsx').includes('menu-trigger') && !read('src/App.tsx').includes('dock-secondary') && !read('src/styles.css').includes('.menu-panel') && ['about', 'services', 'projects', 'experience', 'research', 'evidence', 'contact'].every(key => read('src/App.tsx').includes(`key: '${key}'`)));
assert('Hero role line types, holds, deletes and repeats', read('src/App.tsx').includes('useTypewriter') && read('src/App.tsx').includes('role-caret') && read('src/styles.css').includes('.role-caret') && read('src/App.tsx').includes('sr-only'));
assert('Home page previews services and work as index rows instead of repeating their pages', read('src/App.tsx').includes('home-index-list') && !read('src/App.tsx').includes('source-project-grid') && !read('src/App.tsx').includes('service-accordion'));
assert('The footer carries only the claims link on every page', !read('src/App.tsx').includes('footer-name') && !read('src/App.tsx').includes('footer-links') && !read('src/App.tsx').includes('footer-meta') && !read('src/styles.css').includes('.footer-meta') && read('src/App.tsx').includes('footer-evidence'));
assert('Hero role line reserves fixed height so the typewriter cannot shift the page', read('src/styles.css').includes('.role-ghost') && read('src/App.tsx').includes('role-ghost') && read('src/styles.css').includes('min-height: 1.9em;') && !read('src/styles.css').includes('min-height: calc(1.9em * 2)'));
assert('Every page but the last offers a next-page band in reading order, fully styled', read('src/App.tsx').includes('next-page') && read('src/App.tsx').includes("const pageOrder") && ['.next-page {', '.next-page-inner {', '.next-page-step {', '.next-page-body b {', '.next-page-arrow {', '.next-page-pull {', '.next-page:hover .next-page-body b'].every(rule => read('src/styles.css').includes(rule)));
assert('The hero role line is fitted to one line instead of wrapping', read('src/App.tsx').includes('useFitRoleLine') && read('src/styles.css').includes('.role-line { position: relative; display: inline-block; max-width: 100%; vertical-align: top; text-align: left; white-space: nowrap; }'));
assert('The footer claims link is a comfortable tap target on every page', read('src/styles.css').includes('min-height: 42px; padding: 0 18px;') && read('src/styles.css').includes('padding: 22px var(--side-pad) calc(86px + env(safe-area-inset-bottom));'));
assert('The hero role line rotates through several trades in both languages', ['en', 'bn'].every(lang => data.site.roles?.[lang]?.length >= 3 && data.site.roles[lang].every(Boolean)));
assert('Projects that ship their own website link to it', ['ternux', 'adt'].every(slug => data.projects.find(project => project.slug === slug)?.website) && read('src/App.tsx').includes('project.website'));
assert('The home page explains how a engagement runs for prospective clients', data.site.process?.length === 3 && data.site.process.every(step => step.title?.en && step.title?.bn && step.body?.en && step.body?.bn) && read('src/App.tsx').includes('process-grid') && read('src/styles.css').includes('.process-grid'));
assert('Every social profile carries a brand icon and sits in a type group', data.site.social.length >= 4 && data.site.social.reduce((n, group) => n + group.items.length, 0) >= 20 && data.site.social.every(group => group.id && group.label.en && group.label.bn && group.items.every(item => item.label && item.href.startsWith('https://') && item.icon)));
assert('The social sprite is generated and referenced', fs.existsSync(path.join(root, 'public/social-icons.svg')) && read('public/social-icons.svg').includes('<symbol id="si-x"') && read('src/App.tsx').includes('social-icons.svg#si-'));
assert('The contact page prints its lede once and every channel as one centred circle cluster', !read('src/App.tsx').includes('contact-lede') && !read('src/App.tsx').includes('chip-row') && read('src/App.tsx').includes('contact-circles') && read('src/App.tsx').includes('circle-row') && read('src/styles.css').includes('.circle-row') && read('src/styles.css').includes('border-radius: 50%'));
assert('The contact page lists no separate contact rows — the circles carry every channel', !read('src/App.tsx').includes('contact-meta') && !read('src/App.tsx').includes('contact-detail-grid') && !read('src/styles.css').includes('.contact-meta'));
assert('The next-page band stays compact on phones instead of reserving dock space twice', read('src/styles.css').includes('padding-block: 22px 24px;') && !read('src/styles.css').includes('padding-block: 26px 96px;'));
assert('Every circle is named for assistive technology', read('src/App.tsx').includes('aria-label={item.label}') && read('src/App.tsx').includes('aria-label={`${item.label}: ${item.value}`}'));
assert('The home page offers only the three direct channels as equal buttons', !read('src/App.tsx').includes('source-socials') && !read('src/App.tsx').includes('source-contact-links') && read('src/App.tsx').includes('contact-buttons') && read('src/styles.css').includes('.contact-buttons { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr))'));
const graphemeCount = value => typeof Intl.Segmenter === 'function'
  ? Array.from(new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(value)).length
  : Array.from(value).length;
assert('Every rotating role is short enough to hold one line on a phone', data.site.roles.en.every(role => role.length <= 40) && data.site.roles.bn.every(role => graphemeCount(role) <= 30));
assert('Scrolling back never advances to the next page', read('src/App.tsx').includes("'back_forward'") && read('src/App.tsx').includes('event.persisted') && read('src/App.tsx').includes('deltaY <= 0') && read('src/App.tsx').includes('LEAVE_DISTANCE') && !read('src/App.tsx').includes('travelled') && read('src/styles.css').includes('overscroll-behavior-y: contain'));
assert('Scrolling back past the top of a page returns to the previous page in reading order', read('src/App.tsx').includes('function ScrollBack') && read('src/App.tsx').includes('prevPageFor') && read('src/App.tsx').includes('event.deltaY >= 0 || now < settleUntil') && read('src/App.tsx').includes('drag.current >= PULL_DISTANCE') && read('src/styles.css').includes('.back-hint'));
assert('A scroll-back lands at the end of the previous page with its next-page band cold', read('src/App.tsx').includes("sessionStorage.setItem(FLOW_ARRIVAL, 'end')") && read('src/App.tsx').includes("behavior: 'instant'") && read('src/App.tsx').includes("arrivedFromNext) || away()") && read('src/App.tsx').includes('<ScrollBack lang={lang} kind={kind} />'));
assert('A drag on the next-page band navigates once and only when the band is armed', read('src/App.tsx').includes('hotRef.current()') && read('src/App.tsx').includes('event.preventDefault(); // the synthesised tap') && read('src/App.tsx').includes('navigating.current = true'));
assert('No profile appears twice on the contact page and the order is explicit', !read('src/App.tsx').includes('socialGroups') && read('src/App.tsx').includes('const profileOrder') && read('src/App.tsx').includes('profileOrder.length + index'));
assert('A scroll progress indicator reports page position', read('src/App.tsx').includes('scroll-progress') && read('src/styles.css').includes('.scroll-progress'));
assert('Hero and page spacing use the compact source-index rhythm', read('src/styles.css').includes('.source-hero { display: grid') && read('src/styles.css').includes('padding: clamp(43px,6vw,76px)') && read('src/styles.css').includes('min-height: 58px'));
assert('Bilingual evidence page links all public project sources and limits', ['en', 'bn'].every(lang => data.pages[lang].evidence?.title && data.pages[lang].evidence?.description) && data.projects.every(project => /^https:\/\/github\.com\//.test(project.url)) && read('src/App.tsx').includes('EvidencePage'));
assert('Evidence from the public profile README appears on project pages', ['ternux', 'adt', 'lai', 'ggen', 'songjog'].every(slug => data.projects.some(project => project.slug === slug && project.evidence?.en && project.evidence?.bn)) && read('src/App.tsx').includes('project.evidence[lang]') && read('src/App.tsx').includes("text('evidenceLabel')"));
assert('The evidence page lists repository facts for every public project', data.projects.every(project => project.repo && ['Apache-2.0', 'custom', 'none'].includes(project.repo.license) && project.repo.language && /^\d{4}-\d{2}-\d{2}$/.test(project.repo.created) && /^\d{4}-\d{2}-\d{2}$/.test(project.repo.pushed) && typeof project.repo.release === 'string') && ['en', 'bn'].every(lang => ['factsTitle', 'factsNote', 'colProject', 'colLicense', 'colLanguage', 'colCreated', 'colPushed', 'colRelease', 'licenseCustom', 'licenseNone', 'releaseNone', 'releasePre', 'claimLabel', 'evidenceLabel', 'liveLabel'].every(key => data.pages[lang].evidence[key])) && read('src/App.tsx').includes('evidence-table') && read('src/App.tsx').includes('project.repo.license'));
assert('Search metadata and route generation are configured', read('scripts/create-routes.mjs').includes('hreflang="x-default"') && read('scripts/create-routes.mjs').includes('application/ld+json') && read('index.html').includes('<!-- ROUTE_LINKS -->'));
assert('Only one canonical URL is emitted per generated route', !read('scripts/create-routes.mjs').includes('return `<link rel="canonical"') && read('scripts/create-routes.mjs').includes('rel="canonical"'));
assert('Public 404 and robots/sitemap are produced', read('scripts/create-routes.mjs').includes('404.html') && read('scripts/create-routes.mjs').includes('sitemap.xml') && read('scripts/create-routes.mjs').includes('robots.txt'));
const workflowPath = path.join(root, '.github/workflows/deploy.yml');
assert('GitHub Pages deploy workflow is present', fs.existsSync(workflowPath) && /push:\s*\n\s*branches:\s*\[main\]/.test(fs.readFileSync(workflowPath, 'utf8')));
assert('Legacy Pocket Systems Lab copy is removed from active site source', !/Pocket Systems Lab|The workshop begins in your hand|station=work/.test(publicSource));

assert('Projects include localized search metadata, overview, highlights, and stack', data.projects.every(project => ['en', 'bn'].every(lang => project.metaTitle?.[lang] && project.metaDescription?.[lang] && project.overview?.[lang] && project.highlights?.[lang]?.length >= 3 && project.role?.[lang] && project.state?.[lang]) && project.stack?.length >= 4));
assert('Services are grouped and carry search keywords', data.serviceGroups.length === 3 && data.services.every(service => service.group && service.keywords?.length >= 2 && ['en', 'bn'].every(lang => service.title[lang] && service.summary[lang] && service.detail[lang] && service.deliverables[lang]?.length >= 3)));
assert('Bilingual FAQ covers the services page', ['en', 'bn'].every(lang => data.pages[lang].services.faq?.length === 6 && data.pages[lang].services.faq.every(item => item.question && item.answer)));
assert('Contact page includes a message brief and response expectation', ['en', 'bn'].every(lang => data.pages[lang].contact.brief?.length === 3 && data.pages[lang].contact.responseValue));
assert('Evidence page includes verification steps', ['en', 'bn'].every(lang => data.pages[lang].evidence.how?.length >= 3));
assert('Home features the requested projects and services', data.pages.en.home.featuredProjects?.join(',') === 'ternux,lai,adt' && data.pages.bn.home.featuredProjects?.join(',') === 'ternux,lai,adt' && data.pages.en.home.featuredServices?.length === 3 && data.pages.bn.home.featuredServices?.length === 3);
assert('Every profile page has a keyword set', ['en', 'bn'].every(lang => Object.values(data.pages[lang]).every(page => page.keywords?.length >= 5)));
assert('Social preview, manifest, and icon assets exist', ['public/og.png', 'public/icon.svg', 'public/icon-192.png', 'public/icon-512.png', 'public/apple-touch-icon.png', 'public/site.webmanifest'].every(file => fs.existsSync(path.join(root, file))));
assert('HTML head includes social image alt text and manifest', read('index.html').includes('og:image:alt') && read('index.html').includes('twitter:image:alt') && read('index.html').includes('site.webmanifest') && read('index.html').includes('apple-touch-icon'));
assert('Public sitemap mirror matches the route matrix', (() => {
  const locs = [...read('public/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  return locs.length === routes.length && routes.every(route => locs.includes(`${baseUrl}${route}`)) && !locs.some(url => /datakhoj|iqra-online-mart/.test(url));
})());
assert('Robots file points to the sitemap', read('public/robots.txt').includes(`${baseUrl}/sitemap.xml`));
assert('Sitemap generation includes lastmod and hreflang alternates', read('scripts/create-routes.mjs').includes('<lastmod>') && read('scripts/create-routes.mjs').includes('xhtml:link'));
assert('Structured data generation covers the main entity types', ['Person', 'WebSite', 'ProfilePage', 'Service', 'SoftwareApplication', 'SoftwareSourceCode', 'BreadcrumbList', 'FAQPage', 'knowsAbout', 'hasOfferCatalog'].every(token => read('scripts/create-routes.mjs').includes(token)));

if (!sourceOnly) {
  const dist = path.join(root, 'dist');
  assert('Production output exists', fs.existsSync(path.join(dist, 'index.html')));
  if (fs.existsSync(dist)) {
    assert('Generated route count matches bilingual route matrix', routes.length === 2 * (1 + 7 + data.services.length + data.projects.length) && routes.length === 48, `${routes.length} direct-load routes`);
    const routeHtml = routes.map(route => ({ route, file: path.join(dist, route.replace(/^\//, ''), 'index.html') }));
    assert('Every English and Bangla route has a static HTML entry', routeHtml.every(item => fs.existsSync(item.file)));
    const pages = routeHtml.filter(item => fs.existsSync(item.file)).map(({ route, file }) => ({ route, html: fs.readFileSync(file, 'utf8') }));
    const titles = pages.map(({ html }) => html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '');
    assert('Each generated route has unique title, canonical and one h1', pages.every(({ route, html }) => html.includes(`<link rel="canonical" href="${baseUrl}${route}"`) && (html.match(/<link rel="canonical"/g) ?? []).length === 1 && (html.match(/<h1\b/g) ?? []).length === 1 && /<title>[^<]+<\/title>/.test(html)));
    assert('Meta titles are unique across the route matrix', new Set(titles).size === routes.length);
    assert('Every generated route has Google verification and localized alternate links', pages.every(({ html }) => html.includes('name="google-site-verification"') && html.includes('hreflang="en"') && html.includes('hreflang="bn"') && html.includes('hreflang="x-default"')));
    assert('Every generated route has a route-aware JSON-LD record', pages.every(({ html }) => html.includes('id="route-schema"') && html.includes('application/ld+json')));
    assert('Every generated route publishes meta keywords and a substantial description', pages.every(({ html }) => /<meta name="keywords" content="[^"]{20,}"/.test(html) && (html.match(/<meta name="description" content="([^"]+)"/)?.[1]?.length ?? 0) >= 60));
    assert('Sitemap lists every route exactly once', fs.existsSync(path.join(dist, 'sitemap.xml')) && routes.every(route => readDist('sitemap.xml').includes(`<loc>${baseUrl}${route}</loc>`)) && (readDist('sitemap.xml').match(/<url>/g) ?? []).length === routes.length);
    assert('Robots points to the generated sitemap', readDist('robots.txt').includes(`${baseUrl}/sitemap.xml`));
    assert('Generated sitemap includes lastmod and reciprocal hreflang', readDist('sitemap.xml').includes('<lastmod>') && readDist('sitemap.xml').includes('hreflang="bn"') && readDist('sitemap.xml').includes('xhtml:link'));
    const about = fs.readFileSync(path.join(dist, 'about/index.html'), 'utf8');
    const bnAbout = fs.readFileSync(path.join(dist, 'bn/about/index.html'), 'utf8');
    assert('English and Bangla about routes have separate metadata and content', about.includes('About Sobuj Miah') && bnAbout.includes('সবুজ মিয়া') && about !== bnAbout);
    const experience = fs.readFileSync(path.join(dist, 'experience/index.html'), 'utf8');
    const bnExperience = fs.readFileSync(path.join(dist, 'bn/experience/index.html'), 'utf8');
    assert('English and Bangla experience fallback includes all seven source dates', ['Mar 2023 — Present', 'Sep 2022 — Feb 2023', '2015 — 2017'].every(date => experience.includes(date) && bnExperience.includes(date)) && (experience.match(/<article>/g) ?? []).length === 7);
    const home = readDist('index.html');
    assert('Generated home defines Person, WebSite, ProfilePage, and BreadcrumbList', home.includes('"@type":"Person"') && home.includes('"@type":"WebSite"') && home.includes('"@type":"ProfilePage"') && home.includes('"@type":"BreadcrumbList"') && home.includes('"knowsAbout"') && home.includes('"hasOfferCatalog"'));
    const servicesPage = readDist('services/index.html');
    assert('Generated services page defines CollectionPage and FAQPage', servicesPage.includes('"@type":"CollectionPage"') && servicesPage.includes('"@type":"FAQPage"'));
    const servicePage = readDist('services/linux-systems/index.html');
    assert('Generated service page defines a Service with a provider', servicePage.includes('"@type":"Service"') && servicePage.includes('"provider"'));
    const projectPage = readDist('projects/ternux/index.html');
    assert('Generated project page defines SoftwareSourceCode with a repository', projectPage.includes('"@type":"SoftwareSourceCode"') && projectPage.includes('"codeRepository"'));
    assert('Complete application JS stays under 85 KiB gzipped without a 3D renderer', totalJsSize() < 85 && !jsFiles().some(file => /three|workbench/i.test(file)), `${totalJsSize().toFixed(1)} KiB`);
  }
}

function readDist(file) { return fs.readFileSync(path.join(root, 'dist', file), 'utf8'); }
function jsFiles() {
  const dir = path.join(root, 'dist/assets');
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter(file => file.endsWith('.js')) : [];
}
function gzipKb(files) { return files.reduce((sum, file) => sum + gzipSync(fs.readFileSync(path.join(root, 'dist/assets', file))).byteLength, 0) / 1024; }
function totalJsSize() { return gzipKb(jsFiles()); }

const failures = checks.filter(item => !item.pass);
for (const check of checks) console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.name}${check.details ? ` — ${check.details}` : ''}`);
console.log(`\nPortfolio checks: ${checks.length - failures.length}/${checks.length} passed`);
if (failures.length) process.exitCode = 1;
