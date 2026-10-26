import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { gzipSync } from 'node:zlib';

const root = process.cwd();
const sourceOnly = process.argv.includes('--source-only');
const expectedProjects = ['ternux', 'ternuxx', 'adt', 'lai', 'ggen', 'songjog'];
const checks = [];
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (name, condition, details = '') => checks.push({ name, pass: Boolean(condition), details });

assert('English & Bangla copy', /export const copy\s*=\s*\{[\s\S]*?en:/m.test(read('src/data/content.ts')) && /bn:/m.test(read('src/data/content.ts')));
assert('All approved featured repos represented', expectedProjects.every(id => read('src/data/content.ts').includes(`id: '${id}'`)));
assert('No private repository links or secret-like credentials in public source', !/https?:\/\/github\.com\/(?:[^/]+\/(?:private|internal)[^\s"']*)/i.test(['index.html', 'src/App.tsx', 'src/data/content.ts', 'src/styles.css'].map(read).join('\n')) && !/gh[pousr]_[A-Za-z0-9]{20,}/i.test(['index.html', 'src/App.tsx', 'src/data/content.ts', 'src/styles.css'].map(read).join('\n')));
assert('No numeric vanity achievement widgets', !/stars?\s*[:=]|downloads?\s*[:=]|\b\d+\s*%\s*(faster|improvement|users|growth)/i.test(['index.html', 'src/App.tsx', 'src/data/content.ts'].map(read).join('\n')));
assert('Accessible project details retain evidence and limits', ['verified', 'limits', 'purpose', 'built'].every(key => read('src/App.tsx').includes(`id: '${key}'`) || read('src/App.tsx').includes(`t.${key}`)) && read('src/data/content.ts').includes('limits:'));
assert('Semantic no-JS crawlable baseline', /<h1[\s\S]*?Sobuj Miah/.test(read('index.html')) && /<a href="https:\/\/github.com\/soobujmiah\/ternux"/.test(read('index.html')));
assert('Reduced-motion & WebGL fallback', read('src/App.tsx').includes('prefers-reduced-motion') && read('src/App.tsx').includes('Schematic') && read('src/styles.css').includes('prefers-reduced-motion: reduce'));
assert('SEO, public sitemap & branded share preview present', fs.existsSync(path.join(root, 'public/sitemap.xml')) && fs.existsSync(path.join(root, 'public/robots.txt')) && fs.existsSync(path.join(root, 'public/og.png')) && read('public/sitemap.xml').includes('https://soobujmiah.github.io/about/') && read('index.html').includes('application/ld+json') && read('index.html').includes('og:image'));
const pagesWorkflow = path.join(root, '.github/workflows/deploy.yml');
assert('GitHub Pages workflow deploys on main pushes', fs.existsSync(pagesWorkflow) && /push:\s*\n\s*branches:\s*\[main\]/.test(fs.readFileSync(pagesWorkflow, 'utf8')) && /actions\/deploy-pages@v4/.test(fs.readFileSync(pagesWorkflow, 'utf8')));
assert('Direct section URLs, including /about/, are generated', read('scripts/create-routes.mjs').includes("'about'") && read('scripts/create-routes.mjs').includes("'contact'"));
assert('Story sections scroll vertically and are not clipped', read('src/App.tsx').includes('navItems.map(item => {') && read('src/App.tsx').includes('data-story-station={item.id}') && read('src/styles.css').includes('.story-stop {') && read('src/styles.css').includes('overflow: visible;') && !/\.app-shell\s*\{[^}]*overflow:\s*clip/.test(read('src/styles.css')));

if (!sourceOnly) {
  const dist = path.join(root, 'dist');
  assert('Production output exists', fs.existsSync(path.join(dist, 'index.html')));
  if (fs.existsSync(dist)) {
    for (const file of ['icon.svg', 'robots.txt', 'sitemap.xml', 'og.png']) assert(`Built asset: ${file}`, fs.existsSync(path.join(dist, file)));
    for (const route of ['work', 'process', 'services', 'about', 'notes', 'contact', 'work/ternux', 'work/ternuxx', 'work/adt', 'work/lai', 'work/ggen', 'work/songjog']) {
      assert(`Direct route: /${route}/`, fs.existsSync(path.join(dist, route, 'index.html')));
    }
    const aboutHtml = fs.readFileSync(path.join(dist, 'about/index.html'), 'utf8');
    assert('About page retains its indexed URL and unique metadata', aboutHtml.includes('https://soobujmiah.github.io/about/') && aboutHtml.includes('<title>About Sobuj Miah | The Pocket Systems Lab</title>') && aboutHtml.includes('<h1 style="font-size: 2.5rem; margin: 0.5rem 0;">About Sobuj Miah</h1>'));
    const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
    assert('Built HTML has a title and one crawlable h1', /<title>[^<]+<\/title>/.test(html) && /<h1[^>]*>/.test(html));
    const assets = path.join(dist, 'assets');
    if (fs.existsSync(assets)) {
      const jsFiles = fs.readdirSync(assets).filter(file => file.endsWith('.js'));
      const gzipKb = files => files.reduce((sum, file) => sum + gzipSync(fs.readFileSync(path.join(assets, file))).byteLength, 0) / 1024;
      const initial = jsFiles.filter(file => !file.startsWith('three-') && !file.startsWith('LabScene-'));
      const lazyScene = jsFiles.filter(file => file.startsWith('three-') || file.startsWith('LabScene-'));
      const initialKb = gzipKb(initial);
      const lazyKb = gzipKb(lazyScene);
      assert('Gzipped initial JavaScript stays under 80 KiB', initialKb < 80, `${initialKb.toFixed(1)} KiB`);
      assert('Gzipped lazy 3D scene stays under 140 KiB', lazyKb < 140, `${lazyKb.toFixed(1)} KiB`);
    }
  }
}

const failures = checks.filter(item => !item.pass);
for (const check of checks) console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.name}${check.details ? ` — ${check.details}` : ''}`);
console.log(`\nPortfolio checks: ${checks.length - failures.length}/${checks.length} passed`);
if (failures.length) process.exitCode = 1;
