import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const rootDocument = path.join(dist, 'index.html');
if (!fs.existsSync(rootDocument)) throw new Error('Build root index.html before generating routes.');
const rootHtml = fs.readFileSync(rootDocument, 'utf8');
const routes = [
  { path: 'work', title: 'Work — Sobuj Miah | The Pocket Systems Lab', description: 'Evidence-grounded details of Sobuj Miah’s public software and systems projects.' },
  { path: 'process', title: 'Process — Sobuj Miah | The Pocket Systems Lab', description: 'A practical build, install, test, observe, fix, and retest loop—shown with its limits.' },
  { path: 'services', title: 'Services — Sobuj Miah | The Pocket Systems Lab', description: 'Practical software, Android and Linux setup, workflow, and documentation support.' },
  { path: 'about', title: 'About Sobuj Miah | The Pocket Systems Lab', description: 'About Sobuj Miah, a self-educated software and systems builder working from Savar, Dhaka.' },
  { path: 'notes', title: 'Experiments & field notes — Sobuj Miah | The Pocket Systems Lab', description: 'Evidence-grounded experiments from Sobuj Miah’s Android-first software and systems work, with the limits stated.' },
  { path: 'contact', title: 'Contact Sobuj Miah | The Pocket Systems Lab', description: 'Contact Sobuj Miah about software, Android and Linux, workflows, or documentation.' },
  ...[
    ['ternux', 'Ternux', 'A no-root Termux and PRoot Debian/Xfce workstation for Android. Graphics routes remain device-specific.'],
    ['ternuxx', 'Ternuxx', 'A native Termux workstation control plane with preview-first package changes and optional Debian PRoot handoff.'],
    ['adt', 'ADT', 'Native ARM64 Android tooling for Linux glibc, with a documented source-to-device build path.'],
    ['lai', 'LAI', 'A Bangla-first on-device AI runtime with llama.cpp CPU inference and a fail-closed Adreno Vulkan boundary.'],
    ['ggen', 'GGEN', 'An Android-first Flutter creative canvas for vector work, page geometry, and linked text flow.'],
    ['songjog', 'Songjog', 'A Bangla-first business record app with local SQLite persistence and diagnostic export.'],
  ].map(([id, name, description]) => ({ path: `work/${id}`, title: `${name} — Project station | Sobuj Miah`, description, source: `https://github.com/soobujmiah/${id}` })),
];

const escapeHtml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
for (const route of routes) {
  const canonical = `https://soobujmiah.github.io/${route.path}/`;
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  let html = rootHtml
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${description}" />`)
    .replace(/<link rel="canonical" href="[^"]+"\s*\/>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:url" content="[^"]+"\s*\/>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta property="og:title" content="[^"]+"\s*\/>/, `<meta property="og:title" content="${title}" />`)
    .replace(/<meta name="twitter:title" content="[^"]+"\s*\/>/, `<meta name="twitter:title" content="${title}" />`)
    .replace(/<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${description}" />`)
    .replace(/<meta\s+name="twitter:description"[\s\S]*?\/>/, `<meta name="twitter:description" content="${description}" />`);

  let heading = route.path === 'about' ? 'About Sobuj Miah' : route.path.startsWith('work/') ? route.title.split(' — ')[0] : route.title.split(' — ')[0];
  let summary = route.description;
  if (route.path === 'about') summary = 'Self-educated; no formal engineering degree or certification is claimed. Builds practical software and systems from an Android-first setup in Savar, Dhaka.';
  const projectSource = route.source ? `<p><a href="${escapeHtml(route.source)}" style="color:#4ade80">Open ${escapeHtml(heading)} public source</a></p>` : '';
  const staticMain = `<main style="max-width: 56rem; margin: 0 auto; padding: 3rem 1.25rem; font-family: system-ui, sans-serif; line-height: 1.7;"><p style="font-family: monospace; text-transform: uppercase; letter-spacing: 0.16em; color: #4ade80; font-size: 0.75rem;">The Pocket Systems Lab · Sobuj Miah</p><h1 style="font-size: 2.5rem; margin: 0.5rem 0;">${escapeHtml(heading)}</h1><p>${escapeHtml(summary)}</p>${projectSource}<p><a href="/" style="color:#4ade80">Return to the Pocket Systems Lab</a></p></main>`;
  html = html.replace(/<main style="max-width: 56rem;[\s\S]*?<\/main>/, staticMain);
  const directory = path.join(dist, route.path);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'index.html'), html);
}
console.log(`Generated ${routes.length} direct-load routes, including SEO-preserving /about/.`);
