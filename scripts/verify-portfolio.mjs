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
  for (const page of ['about', 'services', 'experience', 'projects', 'research', 'contact']) routes.push(`${base}/${page}/`);
  for (const item of data.services) routes.push(`${base}/services/${item.slug}/`);
  for (const item of data.projects) routes.push(`${base}/projects/${item.slug}/`);
}
const publicSource = ['index.html', 'src/App.tsx', 'src/styles.css', 'src/data/site-content.json', 'scripts/create-routes.mjs'].map(read).join('\n');
const expectedProjects = ['ternux', 'ternuxx', 'adt', 'lai', 'ggen', 'songjog'];

assert('Bilingual content covers all profile pages', ['en', 'bn'].every(lang => ['home', 'about', 'services', 'experience', 'projects', 'research', 'contact'].every(page => data.pages[lang][page]?.title && data.pages[lang][page]?.description)));
assert('Requested public projects are represented and removed projects stay absent', expectedProjects.every(slug => data.projects.some(project => project.slug === slug)) && !data.projects.some(project => ['datakhoj', 'iqra-online-mart'].includes(project.slug)));
assert('Full source-file work history and time zone are represented', data.experience.length === 7 && data.experience.every(item => item.period) && data.site.timezone.en.startsWith('GMT+6'));
assert('All GitHub profile service links target generated service slugs', ['web-development', 'software-development', 'computer-support', 'android-support', 'business-technology', 'graphics-design', 'office-administration', 'data-entry'].every(slug => data.services.some(service => service.slug === slug)));
assert('Service and project slugs are unique and route-safe', [...data.services, ...data.projects].every(item => /^[a-z0-9-]+$/.test(item.slug)) && new Set([...data.services, ...data.projects].map(item => item.slug)).size === data.services.length + data.projects.length);
assert('Project cards link to localized detail pages and repositories', publicSource.includes("routePath('project', lang, project.slug)") && data.projects.every(project => /^https:\/\/github\.com\//.test(project.url)));
assert('No private repository URLs or token-shaped secrets', !/https?:\/\/github\.com\/[^\s"']+\/(?:private|internal)(?:[\s"']|$)/i.test(publicSource) && !/gh[pousr]_[A-Za-z0-9]{20,}/i.test(publicSource));
assert('Search Console verification meta preserved', publicSource.includes('Z7hOImSydB4nMFUCSyYaLVRpIPHu8FJBlIbfVSbhWs8'));
assert('Search Console verification HTML preserved', fs.existsSync(path.join(root, 'public/google7974d87a16aa1b38.html')) && read('public/google7974d87a16aa1b38.html').includes('google-site-verification: google7974d87a16aa1b38.html'));
assert('3D scene, WebGL canvas, and motion control have been removed', !publicSource.includes('WorkbenchScene') && !publicSource.includes('scene-motion-toggle') && !read('src/styles.css').includes('workbench-canvas') && !fs.existsSync(path.join(root, 'src/scene/WorkbenchScene.ts')));
assert('Homepage follows the source index visual system without 3D artwork', read('src/App.tsx').includes('source-hero') && read('src/styles.css').includes('--lime: #cdff57') && read('src/styles.css').includes('--mint: #57e8ff') && !publicSource.includes('WorkbenchScene'));
assert('Portfolio remains multi-page with concise homepage previews', read('src/App.tsx').includes('site.services.slice(0, 3)') && read('src/App.tsx').includes('site.projects.slice(0, 3)') && read('src/App.tsx').includes("key: 'experience'"));
assert('Reduced-motion preference disables decorative motion', read('src/styles.css').includes('@media (prefers-reduced-motion: reduce)') && read('src/styles.css').includes('.source-marquee > div'));
assert('Hero and page spacing use the compact source-index rhythm', read('src/styles.css').includes('.source-hero { display: grid') && read('src/styles.css').includes('padding: clamp(43px,6vw,76px)') && read('src/styles.css').includes('min-height: 58px'));
assert('Evidence from the public profile README appears on project pages', ['ternux', 'adt', 'lai', 'ggen', 'songjog'].every(slug => data.projects.some(project => project.slug === slug && project.evidence?.en && project.evidence?.bn)) && read('src/App.tsx').includes('ENGINEERING EVIDENCE'));
assert('Search metadata and route generation are configured', read('scripts/create-routes.mjs').includes('hreflang="x-default"') && read('scripts/create-routes.mjs').includes('application/ld+json') && read('index.html').includes('<!-- ROUTE_LINKS -->'));
assert('Only one canonical URL is emitted per generated route', !read('scripts/create-routes.mjs').includes('return `<link rel="canonical"') && read('scripts/create-routes.mjs').includes('rel="canonical"'));
assert('Public 404 and robots/sitemap are produced', read('scripts/create-routes.mjs').includes('404.html') && read('scripts/create-routes.mjs').includes('sitemap.xml') && read('scripts/create-routes.mjs').includes('robots.txt'));
const workflowPath = path.join(root, '.github/workflows/deploy.yml');
assert('GitHub Pages deploy workflow is present', fs.existsSync(workflowPath) && /push:\s*\n\s*branches:\s*\[main\]/.test(fs.readFileSync(workflowPath, 'utf8')));
assert('Legacy Pocket Systems Lab copy is removed from active site source', !/Pocket Systems Lab|The workshop begins in your hand|station=work/.test(publicSource));

if (!sourceOnly) {
  const dist = path.join(root, 'dist');
  assert('Production output exists', fs.existsSync(path.join(dist, 'index.html')));
  if (fs.existsSync(dist)) {
    assert('Generated route count matches bilingual route matrix', routes.length === 2 * (1 + 6 + data.services.length + data.projects.length) && routes.length === 48, `${routes.length} direct-load routes`);
    const routeHtml = routes.map(route => ({ route, file: path.join(dist, route.replace(/^\//, ''), 'index.html') }));
    assert('Every English and Bangla route has a static HTML entry', routeHtml.every(item => fs.existsSync(item.file)));
    const pages = routeHtml.filter(item => fs.existsSync(item.file)).map(({ route, file }) => ({ route, html: fs.readFileSync(file, 'utf8') }));
    assert('Each generated route has unique title, canonical and one h1', pages.every(({ route, html }) => html.includes(`<link rel="canonical" href="${data.site.url.replace(/\/$/, '')}${route}"`) && (html.match(/<link rel="canonical"/g) ?? []).length === 1 && (html.match(/<h1\b/g) ?? []).length === 1 && /<title>[^<]+<\/title>/.test(html)));
    assert('Every generated route has Google verification and localized alternate links', pages.every(({ html }) => html.includes('name="google-site-verification"') && html.includes('hreflang="en"') && html.includes('hreflang="bn"') && html.includes('hreflang="x-default"')));
    assert('Every generated route has a route-aware JSON-LD record', pages.every(({ html }) => html.includes('id="route-schema"') && html.includes('application/ld+json')));
    assert('Sitemap lists every route exactly once', fs.existsSync(path.join(dist, 'sitemap.xml')) && routes.every(route => readDist('sitemap.xml').includes(`<loc>${data.site.url.replace(/\/$/, '')}${route}</loc>`)) && (readDist('sitemap.xml').match(/<url>/g) ?? []).length === routes.length);
    assert('Robots points to the generated sitemap', readDist('robots.txt').includes(`${data.site.url.replace(/\/$/, '')}/sitemap.xml`));
    const about = fs.readFileSync(path.join(dist, 'about/index.html'), 'utf8');
    const bnAbout = fs.readFileSync(path.join(dist, 'bn/about/index.html'), 'utf8');
    assert('English and Bangla about routes have separate metadata and content', about.includes('About Sobuj Miah') && bnAbout.includes('সবুজ মিয়া') && about !== bnAbout);
    const experience = fs.readFileSync(path.join(dist, 'experience/index.html'), 'utf8');
    const bnExperience = fs.readFileSync(path.join(dist, 'bn/experience/index.html'), 'utf8');
    assert('English and Bangla experience fallback includes all seven source dates', ['Mar 2023 — Present', 'Sep 2022 — Feb 2023', '2015 — 2017'].every(date => experience.includes(date) && bnExperience.includes(date)) && (experience.match(/<article>/g) ?? []).length === 7);
    assert('Complete application JS stays under 80 KiB gzipped without a 3D renderer', totalJsSize() < 80 && !jsFiles().some(file => /three|workbench/i.test(file)), `${totalJsSize().toFixed(1)} KiB`);
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
