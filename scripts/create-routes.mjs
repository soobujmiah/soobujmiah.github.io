import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const dist = path.join(root, 'dist');
const data = JSON.parse(fs.readFileSync(path.join(root, 'src/data/site-content.json'), 'utf8'));
const baseUrl = data.site.url.replace(/\/$/, '');
const sharedPages = ['about', 'services', 'experience', 'projects', 'research', 'contact'];
const nav = [
  ['about', { en: 'About', bn: 'পরিচিতি' }],
  ['services', { en: 'Services', bn: 'সেবা' }],
  ['projects', { en: 'Projects', bn: 'প্রকল্প' }],
  ['experience', { en: 'Experience', bn: 'অভিজ্ঞতা' }],
  ['research', { en: 'Research', bn: 'গবেষণা' }],
  ['contact', { en: 'Contact', bn: 'যোগাযোগ' }],
];

const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const localePath = (kind, lang, slug) => {
  const suffix = kind === 'home' ? '' : kind === 'service' ? `services/${slug}/` : kind === 'project' ? `projects/${slug}/` : `${kind}/`;
  return lang === 'bn' ? `/bn/${suffix}` : `/${suffix}`;
};
const urlFor = p => `${baseUrl}${p}`;

function collectRoutes() {
  const routes = [];
  for (const lang of ['en', 'bn']) {
    routes.push({ lang, kind: 'home', path: localePath('home', lang) });
    for (const kind of sharedPages) routes.push({ lang, kind, path: localePath(kind, lang) });
    for (const item of data.services) routes.push({ lang, kind: 'service', slug: item.slug, path: localePath('service', lang, item.slug) });
    for (const item of data.projects) routes.push({ lang, kind: 'project', slug: item.slug, path: localePath('project', lang, item.slug) });
  }
  return routes;
}

function pageMeta(route) {
  const locale = data.pages[route.lang];
  if (route.kind === 'service') {
    const item = data.services.find(service => service.slug === route.slug);
    return { title: `${item.title[route.lang]} | ${locale.services.title}`, description: item.summary[route.lang], name: item.title[route.lang], type: 'Service', item };
  }
  if (route.kind === 'project') {
    const item = data.projects.find(project => project.slug === route.slug);
    return { title: `${item.name} | ${locale.projects.title}`, description: item.summary[route.lang], name: item.name, type: 'CreativeWork', item };
  }
  const page = locale[route.kind];
  return { title: page.title, description: page.description, name: page.headline, type: 'WebPage', item: page };
}

function linksFor(route) {
  const home = localePath('home', route.lang);
  return nav.map(([kind, label]) => `<a href="${localePath(kind, route.lang)}">${esc(label[route.lang])}</a>`).join('');
}

function sharedHeadMarkup(route, meta) {
  const pathEnglish = route.path.replace(/^\/bn(?=\/|$)/, '') || '/';
  const pathBangla = `/bn${pathEnglish === '/' ? '/' : pathEnglish}`;
  const english = urlFor(pathEnglish);
  const bangla = urlFor(pathBangla);
  const pageType = meta.type === 'Service'
    ? { '@type': 'Service', name: meta.name, description: meta.description, serviceType: meta.name, url: urlFor(route.path), provider: { '@id': `${baseUrl}/#person` }, areaServed: ['Bangladesh', 'Remote'] }
    : meta.type === 'CreativeWork'
      ? { '@type': 'CreativeWork', name: meta.name, description: meta.description, url: urlFor(route.path), sameAs: meta.item.url }
      : { '@type': 'WebPage', name: meta.title, description: meta.description, url: urlFor(route.path), inLanguage: route.lang };
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: route.lang === 'en' ? 'Home' : 'হোম', item: urlFor(localePath('home', route.lang)) },
      ...(route.kind === 'service' ? [{ '@type': 'ListItem', position: 2, name: data.pages[route.lang].services.headline, item: urlFor(localePath('services', route.lang)) }] : []),
      ...(route.kind === 'project' ? [{ '@type': 'ListItem', position: 2, name: data.pages[route.lang].projects.headline, item: urlFor(localePath('projects', route.lang)) }] : []),
      { '@type': 'ListItem', position: route.kind === 'service' || route.kind === 'project' ? 3 : 2, name: meta.name, item: urlFor(route.path) },
    ],
  };
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${baseUrl}/#website`, url: `${baseUrl}/`, name: 'Sobuj Miah', inLanguage: ['en', 'bn'] },
      { '@type': 'Person', '@id': `${baseUrl}/#person`, name: 'Sobuj Miah', alternateName: 'সবুজ মিয়া', url: `${baseUrl}/`, jobTitle: 'Independent Software & AI Systems Engineer', address: { '@type': 'PostalAddress', addressLocality: 'Savar, Dhaka', addressCountry: 'BD' }, email: `mailto:${data.site.email}`, telephone: data.site.phone, sameAs: data.site.social.map(item => item.href) },
      pageType,
      breadcrumb,
    ],
  };
  const schema = JSON.stringify(graph).replaceAll('<', '\\u003c');
  return `<link rel="alternate" hreflang="en" href="${esc(english)}">
    <link rel="alternate" hreflang="bn" href="${esc(bangla)}">
    <link rel="alternate" hreflang="x-default" href="${esc(english)}">
    <script type="application/ld+json" id="route-schema">${schema}</script>`;
}

function fallbackHeader(lang) {
  const home = localePath('home', lang);
  const name = lang === 'en' ? 'SOBUJ MIAH' : 'সবুজ মিয়া';
  const serviceLinks = nav.map(([kind, label]) => `<a href="${localePath(kind, lang)}">${esc(label[lang])}</a>`).join('');
  return `<header class="site-header"><a class="wordmark" href="${home}"><strong>${name}</strong></a><nav aria-label="${lang === 'en' ? 'Main navigation' : 'প্রধান নেভিগেশন'}">${serviceLinks}</nav><a class="language-switch" href="${lang === 'en' ? '/bn/' : '/'}">${lang === 'en' ? 'বাংলা' : 'English'}</a></header>`;
}

function homeFallback(route, page) {
  const lang = route.lang;
  const serviceItems = data.services.slice(0, 3).map(service => `<li><a href="${localePath('service', lang, service.slug)}"><strong>${esc(service.title[lang])}</strong></a> — ${esc(service.summary[lang])}</li>`).join('');
  const projectItems = data.projects.slice(0, 3).map(project => `<li><a href="${localePath('project', lang, project.slug)}"><strong>${esc(project.name)}</strong></a> — ${esc(project.summary[lang])}${project.evidence ? `<p>${esc(project.evidence[lang])}</p>` : ''}</li>`).join('');
  const paragraphs = data.pages[lang].about.paragraphs.slice(0, 2).map(paragraph => `<p>${esc(paragraph)}</p>`).join('');
  return `<section class="fallback-hero"><p class="eyebrow">${esc(page.eyebrow)}</p><h1>${esc(data.site.name)}</h1><p>${esc(page.identity)}</p><p>${esc(page.deck)}</p><p><a class="button button-primary" href="${localePath('contact', lang)}">${esc(page.primary)}</a> <a href="${localePath('projects', lang)}">${esc(page.secondary)}</a></p></section><section id="about"><h2>${esc(page.aboutTitle)}</h2><p>${esc(page.aboutIntro)}</p>${paragraphs}<p>${esc(data.site.location[lang])} · ${esc(data.site.timezone[lang])}</p><p><a href="${localePath('about', lang)}">${lang === 'en' ? 'Full profile' : 'সম্পূর্ণ পরিচিতি'}</a></p></section><section id="services"><h2>${esc(page.servicesTitle)}</h2><p>${esc(data.pages[lang].services.lede)}</p><ul>${serviceItems}</ul><p><a href="${localePath('services', lang)}">${lang === 'en' ? 'All services' : 'সব সেবা'}</a></p></section><section id="projects"><h2>${esc(page.selectedTitle)}</h2><p>${esc(page.selectedIntro)}</p><ul>${projectItems}</ul><p><a href="${localePath('projects', lang)}">${lang === 'en' ? 'All public projects' : 'সব পাবলিক প্রকল্প'}</a></p></section><section id="contact"><h2>${esc(data.pages[lang].contact.headline)}</h2><p>${esc(data.pages[lang].contact.lede)}</p><p><a href="mailto:${esc(data.site.email)}">${esc(data.site.email)}</a> · <a href="tel:${esc(data.site.phoneHref)}">${esc(data.site.phone)}</a></p></section>`;
}

function fallbackContent(route, meta) {
  const lang = route.lang;
  const locale = data.pages[lang];
  const page = locale[route.kind === 'service' ? 'services' : route.kind === 'project' ? 'projects' : route.kind];
  if (route.kind === 'home') return homeFallback(route, page);
  if (route.kind === 'about') {
    return `<section><p class="eyebrow">${esc(page.eyebrow)}</p><h1>${esc(page.headline)}</h1><p>${esc(page.lede)}</p>${page.paragraphs.map(p => `<p>${esc(p)}</p>`).join('')}<h2>${esc(page.factsTitle)}</h2><p>${esc(data.site.location[lang])} · ${esc(data.site.timezone[lang])} · ${esc(page.experienceValue)} · ${esc(page.educationValue)}</p><h2>${esc(page.languagesTitle)}</h2><ul>${data.site.languages.map(item => `<li>${esc(item[lang])} — ${esc(lang === 'en' ? item.levelEn : item.levelBn)}</li>`).join('')}</ul><h2>${lang === 'en' ? 'Capabilities' : 'দক্ষতা'}</h2>${data.skills.map(group => `<h3>${esc(group.title[lang])}</h3><p>${group.items[lang].map(esc).join(' · ')}</p>`).join('')}</section>`;
  }
  if (route.kind === 'services') {
    return `<section><p class="eyebrow">${esc(page.eyebrow)}</p><h1>${esc(page.headline)}</h1><p>${esc(page.lede)}</p><ul>${data.services.map(service => `<li><a href="${localePath('service', lang, service.slug)}"><strong>${esc(service.title[lang])}</strong></a> — ${esc(service.summary[lang])}</li>`).join('')}</ul></section>`;
  }
  if (route.kind === 'service') {
    const item = meta.item;
    return `<section><p class="eyebrow">${esc(page.eyebrow)}</p><p><a href="${localePath('services', lang)}">${esc(page.backLabel)}</a></p><h1>${esc(item.title[lang])}</h1><p>${esc(item.summary[lang])}</p><h2>${esc(page.detailLabel)}</h2><p>${esc(item.detail[lang])}</p><h2>${esc(page.deliverablesLabel)}</h2><ul>${item.deliverables[lang].map(v => `<li>${esc(v)}</li>`).join('')}</ul><p><a href="${localePath('contact', lang)}">${esc(page.contactLabel)}</a></p></section>`;
  }
  if (route.kind === 'experience') {
    return `<section><p class="eyebrow">${esc(page.eyebrow)}</p><h1>${esc(page.headline)}</h1><p>${esc(page.lede)}</p>${data.experience.map(item => `<article><h2>${esc(item.role[lang])}</h2><p>${esc(item.organisation)} · ${esc(item.location[lang])} · ${esc(item.period)}</p><ul>${item.work[lang].map(v => `<li>${esc(v)}</li>`).join('')}</ul></article>`).join('')}<p>${esc(page.experienceNote)}</p></section>`;
  }
  if (route.kind === 'projects') {
    return `<section><p class="eyebrow">${esc(page.eyebrow)}</p><h1>${esc(page.headline)}</h1><p>${esc(page.lede)}</p><ul>${data.projects.map(item => `<li><h2><a href="${localePath('project', lang, item.slug)}">${esc(item.name)}</a></h2><p>${esc(item.category[lang])} · ${esc(item.state)}</p><p>${esc(item.summary[lang])}</p><p><strong>${esc(page.statusLabel)}:</strong> ${esc(item.boundary[lang])}</p><p><a href="${esc(item.url)}">${esc(page.repoLabel)}</a></p></li>`).join('')}</ul></section>`;
  }
  if (route.kind === 'project') {
    const item = meta.item;
    return `<section><p class="eyebrow">${esc(page.eyebrow)} · ${esc(item.category[lang])}</p><p><a href="${localePath('projects', lang)}">${lang === 'en' ? 'All projects' : 'সব প্রকল্প'}</a></p><h1>${esc(item.name)}</h1><p>${esc(item.summary[lang])}</p>${item.evidence ? `<h2>${lang === 'en' ? 'Engineering evidence' : 'প্রকৌশলগত প্রমাণ'}</h2><p>${esc(item.evidence[lang])}</p>` : ''}<h2>${esc(page.statusLabel)}</h2><p>${esc(item.boundary[lang])}</p><p><a href="${esc(item.url)}">${esc(page.repoLabel)}</a></p></section>`;
  }
  if (route.kind === 'research') {
    const info = data.research[lang];
    return `<section><p class="eyebrow">${esc(page.eyebrow)}</p><h1>${esc(page.headline)}</h1><p>${esc(page.lede)}</p><h2>${esc(page.verifiedTitle)}</h2><ul>${info.verified.map(v => `<li>${esc(v)}</li>`).join('')}</ul><h2>${esc(page.experimentalTitle)}</h2><ul>${info.experimental.map(v => `<li>${esc(v)}</li>`).join('')}</ul><h2>${esc(page.plannedTitle)}</h2><ul>${info.notClaimed.map(v => `<li>${esc(v)}</li>`).join('')}</ul></section>`;
  }
  return `<section><p class="eyebrow">${esc(page.eyebrow)}</p><h1>${esc(page.headline)}</h1><p>${esc(page.lede)}</p><p><a href="mailto:${esc(data.site.email)}">${esc(data.site.email)}</a></p><p><a href="tel:${esc(data.site.phoneHref)}">${esc(data.site.phone)}</a></p><ul>${data.site.social.map(link => `<li><a href="${esc(link.href)}">${esc(link.label)}</a></li>`).join('')}</ul></section>`;
}

function replaceMeta(html, key, value, property = 'name') {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expression = new RegExp(`<meta\\s+${property}="${escapedKey}"\\s+content="[^"]*"\\s*\\/?\\s*>`, 'i');
  const tag = `<meta ${property}="${esc(key)}" content="${esc(value)}" />`;
  return expression.test(html) ? html.replace(expression, tag) : html.replace('</head>', `  ${tag}\n  </head>`);
}

function makeHtml(template, route) {
  const meta = pageMeta(route);
  const locale = data.pages[route.lang];
  let html = template.replace(/<html\s+lang="[^"]*"/, `<html lang="${route.lang}"`);
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(meta.title)}</title>`);
  html = replaceMeta(html, 'description', meta.description);
  html = replaceMeta(html, 'og:type', 'website', 'property');
  html = replaceMeta(html, 'og:url', urlFor(route.path), 'property');
  html = replaceMeta(html, 'og:title', meta.title, 'property');
  html = replaceMeta(html, 'og:description', meta.description, 'property');
  html = replaceMeta(html, 'og:locale', route.lang === 'en' ? 'en_US' : 'bn_BD', 'property');
  html = replaceMeta(html, 'twitter:title', meta.title);
  html = replaceMeta(html, 'twitter:description', meta.description);
  html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?\s*>/i, `<link rel="canonical" href="${esc(urlFor(route.path))}" />`);
  html = html.replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${fallbackHeader(route.lang)}<main id="main" class="page-shell"><div class="page-wrap">${fallbackContent(route, meta)}</div></main></div>`);
  const headTags = sharedHeadMarkup(route, meta);
  html = html.includes('<!-- ROUTE_LINKS -->') ? html.replace('<!-- ROUTE_LINKS -->', headTags) : html.replace('</head>', `  ${headTags}\n</head>`);
  return html;
}

function writeRoute(route, template) {
  const directory = route.path === '/' ? dist : path.join(dist, route.path.replace(/^\//, '').replace(/\/$/, ''));
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'index.html'), makeHtml(template, route));
}

const routes = collectRoutes();
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
routes.forEach(route => writeRoute(route, template));

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map(route => `  <url><loc>${esc(urlFor(route.path))}</loc></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`);

const notFound = template
  .replace(/<title>[\s\S]*?<\/title>/i, '<title>Page not found | Sobuj Miah</title>')
  .replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root"><main class="page-wrap not-found"><p class="eyebrow">404 · PAGE NOT FOUND</p><h1>This path has moved.</h1><p><a href="/">Return to Sobuj Miah’s portfolio</a></p></main></div>`)
  .replace('</head>', '  <meta name="robots" content="noindex,follow" />\n</head>');
fs.writeFileSync(path.join(dist, '404.html'), notFound);
console.log(`Generated ${routes.length} direct-load pages, unique canonical/alternate metadata, and sitemap.xml.`);
