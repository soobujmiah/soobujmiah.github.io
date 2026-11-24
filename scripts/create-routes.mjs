import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const dist = path.join(root, 'dist');
const data = JSON.parse(fs.readFileSync(path.join(root, 'src/data/site-content.json'), 'utf8'));
const baseUrl = data.site.url.replace(/\/$/, '');
const buildDate = new Date().toISOString().slice(0, 10);
const sharedPages = ['about', 'services', 'experience', 'projects', 'research', 'evidence', 'contact'];
const nav = [
  ['about', { en: 'About', bn: 'পরিচিতি' }],
  ['services', { en: 'Services', bn: 'সেবা' }],
  ['projects', { en: 'Projects', bn: 'প্রকল্প' }],
  ['experience', { en: 'Experience', bn: 'অভিজ্ঞতা' }],
  ['research', { en: 'Research', bn: 'গবেষণা' }],
  ['evidence', { en: 'Evidence', bn: 'প্রমাণ' }],
  ['contact', { en: 'Contact', bn: 'যোগাযোগ' }],
];

const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const localePath = (kind, lang, slug) => {
  const suffix = kind === 'home' ? '' : kind === 'service' ? `services/${slug}/` : kind === 'project' ? `projects/${slug}/` : `${kind}/`;
  return lang === 'bn' ? `/bn/${suffix}` : `/${suffix}`;
};
const urlFor = p => `${baseUrl}${p}`;
const unique = items => Array.from(new Set(items.filter(Boolean)));
const alternatePaths = route => {
  const englishPath = route.path.replace(/^\/bn(?=\/|$)/, '') || '/';
  const banglaPath = `/bn${englishPath === '/' ? '/' : englishPath}`;
  return { englishPath, banglaPath };
};

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
    return {
      title: item.metaTitle?.[route.lang] ?? `${item.title[route.lang]} — ${route.lang === 'en' ? 'Sobuj Miah' : 'সবুজ মিয়া'}`,
      description: item.metaDescription?.[route.lang] ?? item.summary[route.lang],
      keywords: unique([...(item.keywords ?? []), ...data.site.keywords[route.lang]]),
      name: item.title[route.lang], type: 'Service', item,
    };
  }
  if (route.kind === 'project') {
    const item = data.projects.find(project => project.slug === route.slug);
    return {
      title: item.metaTitle?.[route.lang] ?? item.name,
      description: item.metaDescription?.[route.lang] ?? item.summary[route.lang],
      keywords: unique([...(item.keywords ?? []), ...data.site.keywords[route.lang]]),
      name: item.name, type: 'Software', item,
    };
  }
  const page = locale[route.kind];
  return {
    title: page.title, description: page.description,
    keywords: unique([...(page.keywords ?? []), ...data.site.keywords[route.lang]]),
    name: page.headline, type: 'WebPage', item: page,
  };
}

function linksFor(route) {
  return nav.map(([kind, label]) => `<a href="${localePath(kind, route.lang)}">${esc(label[route.lang])}</a>`).join('');
}

function schemaGraph(route, meta) {
  const personId = `${baseUrl}/#person`;
  const websiteId = `${baseUrl}/#website`;
  const image = `${baseUrl}/og.png`;
  const { englishPath, banglaPath } = alternatePaths(route);
  const person = {
    '@type': 'Person', '@id': personId, name: data.site.name, alternateName: data.site.alternateName,
    url: `${baseUrl}/`, image,
    jobTitle: 'Independent Software & AI Systems Engineer',
    description: data.site.description[route.lang],
    email: `mailto:${data.site.email}`, telephone: data.site.phone,
    address: { '@type': 'PostalAddress', addressLocality: 'Savar, Dhaka', addressCountry: 'BD' },
    areaServed: ['Bangladesh', 'Remote'],
    knowsAbout: unique(['Linux on Android', 'Termux', 'Debian', 'Termux:X11', 'PRoot', 'ARM64', 'llama.cpp', 'Local AI', 'Android development', 'Web development', 'Office administration', 'Data entry', 'SEO']),
    sameAs: data.site.social.flatMap(group => group.items.map(item => item.href)),
    hasOfferCatalog: {
      '@type': 'OfferCatalog', name: 'Services',
      itemListElement: data.services.map(service => ({
        '@type': 'Offer', itemOffered: {
          '@type': 'Service', name: service.title[route.lang],
          url: urlFor(localePath('service', route.lang, service.slug)),
        },
      })),
    },
  };
  const website = {
    '@type': 'WebSite', '@id': websiteId, url: `${baseUrl}/`, name: data.site.name,
    alternateName: data.site.alternateName, description: data.site.description[route.lang],
    inLanguage: ['en', 'bn'], publisher: { '@id': personId }, image,
  };
  const breadcrumbItems = [{ '@type': 'ListItem', position: 1, name: route.lang === 'en' ? 'Home' : 'হোম', item: urlFor(localePath('home', route.lang)) }];
  if (route.kind === 'service') {
    breadcrumbItems.push({ '@type': 'ListItem', position: 2, name: route.lang === 'en' ? 'Services' : 'সেবা', item: urlFor(localePath('services', route.lang)) });
    breadcrumbItems.push({ '@type': 'ListItem', position: 3, name: meta.name, item: urlFor(route.path) });
  } else if (route.kind === 'project') {
    breadcrumbItems.push({ '@type': 'ListItem', position: 2, name: route.lang === 'en' ? 'Projects' : 'প্রকল্প', item: urlFor(localePath('projects', route.lang)) });
    breadcrumbItems.push({ '@type': 'ListItem', position: 3, name: meta.name, item: urlFor(route.path) });
  } else if (route.kind !== 'home') {
    breadcrumbItems.push({ '@type': 'ListItem', position: 2, name: meta.name, item: urlFor(route.path) });
  }
  const breadcrumb = { '@type': 'BreadcrumbList', itemListElement: breadcrumbItems };
  const commonPage = {
    name: meta.title, description: meta.description, url: urlFor(route.path),
    inLanguage: route.lang, isPartOf: { '@id': websiteId }, about: { '@id': personId },
    primaryImageOfPage: image, dateModified: buildDate,
  };
  let pageType;
  if (route.kind === 'home' || route.kind === 'about') {
    pageType = { '@type': 'ProfilePage', ...commonPage, mainEntity: { '@id': personId } };
  } else if (route.kind === 'services') {
    pageType = {
      '@type': 'CollectionPage', ...commonPage,
      mainEntity: {
        '@type': 'ItemList', name: 'Services', itemListElement: data.services.map((service, index) => ({
          '@type': 'ListItem', position: index + 1,
          item: { '@type': 'Service', name: service.title[route.lang], url: urlFor(localePath('service', route.lang, service.slug)) },
        })),
      },
    };
  } else if (route.kind === 'service') {
    pageType = {
      '@type': 'Service', name: meta.name, description: meta.description, serviceType: meta.name,
      url: urlFor(route.path), provider: { '@id': personId }, areaServed: ['Bangladesh', 'Remote'],
      inLanguage: route.lang, isPartOf: { '@id': websiteId }, mainEntityOfPage: urlFor(route.path),
      hasOfferCatalog: {
        '@type': 'OfferCatalog', name: meta.name,
        itemListElement: [{ '@type': 'Offer', itemOffered: { '@type': 'Service', name: meta.name, url: urlFor(route.path) } }],
      },
    };
  } else if (route.kind === 'projects') {
    pageType = {
      '@type': 'CollectionPage', ...commonPage,
      mainEntity: {
        '@type': 'ItemList', name: 'Projects', itemListElement: data.projects.map((project, index) => ({
          '@type': 'ListItem', position: index + 1,
          item: {
            '@type': ['ternux', 'adt'].includes(project.slug) ? 'SoftwareSourceCode' : 'SoftwareApplication',
            name: project.name, description: project.summary[route.lang],
            url: urlFor(localePath('project', route.lang, project.slug)), codeRepository: project.url,
            ...(project.website ? { sameAs: project.website } : {}),
            applicationCategory: 'DeveloperApplication', operatingSystem: 'Android, Linux',
          },
        })),
      },
    };
  } else if (route.kind === 'project') {
    const item = meta.item;
    const isSourceCode = ['ternux', 'adt'].includes(item.slug);
    pageType = {
      '@type': isSourceCode ? 'SoftwareSourceCode' : 'SoftwareApplication',
      name: item.name, description: item.metaDescription[route.lang], url: urlFor(route.path),
      codeRepository: item.url, ...(item.website ? { sameAs: item.website } : {}),
      programmingLanguage: item.stack.filter(entry => ['Bash', 'C/C++', 'Dart', 'Kotlin', 'Python'].includes(entry)),
      runtimePlatform: 'Android, Linux', operatingSystem: 'Android, Linux',
      applicationCategory: isSourceCode ? 'DeveloperApplication' : 'BusinessApplication',
      author: { '@id': personId }, keywords: item.keywords.join(', '),
      inLanguage: route.lang, isPartOf: { '@id': websiteId }, mainEntityOfPage: urlFor(route.path),
    };
  } else if (route.kind === 'contact') {
    pageType = { '@type': 'ContactPage', ...commonPage, mainEntity: { '@id': personId } };
  } else {
    pageType = { '@type': 'WebPage', ...commonPage };
  }
  const graph = [website, person, pageType, breadcrumb];
  if (route.kind === 'services') {
    const faq = data.pages[route.lang].services.faq ?? [];
    if (faq.length) {
      graph.push({
        '@type': 'FAQPage', inLanguage: route.lang, isPartOf: { '@id': websiteId },
        mainEntity: faq.map(entry => ({
          '@type': 'Question', name: entry.question,
          acceptedAnswer: { '@type': 'Answer', text: entry.answer },
        })),
      });
    }
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

function sharedHeadMarkup(route, meta) {
  const { englishPath, banglaPath } = alternatePaths(route);
  const schema = JSON.stringify(schemaGraph(route, meta)).replaceAll('<', '\\u003c');
  return `<link rel="alternate" hreflang="en" href="${esc(urlFor(englishPath))}">
    <link rel="alternate" hreflang="bn" href="${esc(urlFor(banglaPath))}">
    <link rel="alternate" hreflang="x-default" href="${esc(urlFor(englishPath))}">
    <script type="application/ld+json" id="route-schema">${schema}</script>`;
}

function fallbackHeader(lang) {
  const home = localePath('home', lang);
  const name = lang === 'en' ? 'Sobuj Miah' : 'সবুজ মিয়া';
  return `<header class="fallback-header"><a class="fallback-mark" href="${home}"><strong>${name}</strong><span>${lang === 'en' ? 'Portfolio' : 'পোর্টফোলিও'}</span></a><nav aria-label="${lang === 'en' ? 'Main navigation' : 'প্রধান নেভিগেশন'}">${linksFor({ lang })}</nav><a class="fallback-lang" href="${lang === 'en' ? '/bn/' : '/'}">${lang === 'en' ? 'বাংলা' : 'English'}</a></header>`;
}

function homeFallback(route, page) {
  const lang = route.lang;
  const featuredServices = ['software-development', 'linux-systems', 'office-administration'].map(slug => data.services.find(item => item.slug === slug)).filter(Boolean);
  const featuredProjects = ['ternux', 'lai', 'adt'].map(slug => data.projects.find(item => item.slug === slug)).filter(Boolean);
  const serviceItems = featuredServices.map(service => `<li><a href="${localePath('service', lang, service.slug)}"><strong>${esc(service.title[lang])}</strong></a><p>${esc(service.summary[lang])}</p><p>${esc(service.detail[lang])}</p></li>`).join('');
  const projectItems = featuredProjects.map(project => `<li><a href="${localePath('project', lang, project.slug)}"><strong>${esc(project.name)}</strong></a><p>${esc(project.summary[lang])}</p><ul>${project.highlights[lang].map(item => `<li>${esc(item)}</li>`).join('')}</ul><p><strong>${lang === 'en' ? 'Stack' : 'Stack'}:</strong> ${esc(project.stack.slice(0, 6).join(' · '))}</p><p><strong>${lang === 'en' ? 'Boundary' : 'সীমা'}:</strong> ${esc(project.boundary[lang])}</p><p><a href="${esc(project.url)}">${lang === 'en' ? 'Open repository' : 'Source repository খুলুন'}</a></p></li>`).join('');
  const paragraphs = data.pages[lang].about.paragraphs.slice(0, 2).map(paragraph => `<p>${esc(paragraph)}</p>`).join('');
  return `<section class="fallback-hero"><p class="eyebrow">${esc(page.eyebrow)}</p><h1>${esc(data.site.name)}</h1><p>${esc(page.identity)}</p><p>${esc(page.deck)}</p><p><a class="button button-primary" href="${localePath('contact', lang)}">${esc(lang === 'en' ? 'Discuss a project' : 'কাজ নিয়ে কথা বলুন')}</a> <a href="${localePath('projects', lang)}">${esc(lang === 'en' ? 'View projects' : 'প্রকল্প দেখুন')}</a></p><ul class="fallback-stats"><li><strong>8+</strong><span>${lang === 'en' ? 'Years · self-reported' : 'বছর · স্ব-প্রতিবেদিত'}</span></li><li><strong>2</strong><span>${lang === 'en' ? 'Countries worked' : 'দেশে কাজের অভিজ্ঞতা'}</span></li><li><strong>${data.projects.length}</strong><span>${lang === 'en' ? 'Public projects' : 'পাবলিক প্রকল্প'}</span></li><li><strong>${data.site.languages.length}</strong><span>${lang === 'en' ? 'Languages' : 'টি ভাষা'}</span></li></ul></section>
  <section id="about"><h2>${esc(page.aboutTitle)}</h2><p>${esc(page.aboutIntro)}</p>${paragraphs}<p>${esc(data.site.location[lang])} · ${esc(data.site.timezone[lang])}</p><p><a href="${localePath('about', lang)}">${lang === 'en' ? 'Full profile' : 'সম্পূর্ণ পরিচিতি'}</a></p></section>
  <section id="services"><h2>${esc(page.servicesTitle)}</h2><p>${esc(page.servicesIntro)}</p><ul>${serviceItems}</ul><p><a href="${localePath('services', lang)}">${lang === 'en' ? 'All services' : 'সব সেবা'}</a></p></section>
  <section id="projects"><h2>${esc(page.selectedTitle)}</h2><p>${esc(page.selectedIntro)}</p><ul>${projectItems}</ul><p><a href="${localePath('projects', lang)}">${lang === 'en' ? 'All public projects' : 'সব পাবলিক প্রকল্প'}</a></p></section>
  <section id="contact"><h2>${esc(data.pages[lang].contact.headline)}</h2><p>${esc(data.pages[lang].contact.lede)}</p><p><a href="mailto:${esc(data.site.email)}">${esc(data.site.email)}</a> · <a href="tel:${esc(data.site.phoneHref)}">${esc(data.site.phone)}</a> · <a href="https://t.me/soobujmiah">Telegram</a></p></section>`;
}

function fallbackContent(route, meta) {
  const lang = route.lang;
  const locale = data.pages[lang];
  const page = locale[route.kind === 'service' ? 'services' : route.kind === 'project' ? 'projects' : route.kind];
  if (route.kind === 'home') return homeFallback(route, page);
  if (route.kind === 'about') {
    return `<section><p class="eyebrow">${esc(page.eyebrow)}</p><h1>${esc(page.headline)}</h1><p>${esc(page.lede)}</p>${page.paragraphs.map(p => `<p>${esc(p)}</p>`).join('')}<h2>${esc(page.factsTitle)}</h2><p>${esc(data.site.location[lang])} · ${esc(data.site.timezone[lang])} · ${esc(page.experienceValue)} · ${esc(page.educationValue)}</p><h2>${esc(page.languagesTitle)}</h2><ul>${data.site.languages.map(item => `<li>${esc(item[lang])} — ${esc(lang === 'en' ? item.levelEn : item.levelBn)}</li>`).join('')}</ul><h2>${esc(page.capabilitiesTitle)}</h2>${data.skills.map(group => `<h3>${esc(group.title[lang])}</h3><p>${group.items[lang].map(esc).join(' · ')}</p>`).join('')}</section>`;
  }
  if (route.kind === 'services') {
    const faq = page.faq ?? [];
    return `<section><p class="eyebrow">${esc(page.eyebrow)}</p><h1>${esc(page.headline)}</h1><p>${esc(page.lede)}</p>${data.serviceGroups.map(group => {
      const services = data.services.filter(service => service.group === group.id);
      return `<h2>${esc(group.title[lang])}</h2><p>${esc(group.lede[lang])}</p><ul>${services.map(service => `<li><h3><a href="${localePath('service', lang, service.slug)}">${esc(service.title[lang])}</a></h3><p>${esc(service.summary[lang])}</p><p>${esc(service.detail[lang])}</p></li>`).join('')}</ul>`;
    }).join('')}<h2>${esc(page.faqTitle)}</h2><ul>${faq.map(entry => `<li><strong>${esc(entry.question)}</strong><p>${esc(entry.answer)}</p></li>`).join('')}</ul><p><a href="${localePath('contact', lang)}">${esc(lang === 'en' ? 'Discuss your project' : 'আপনার কাজ নিয়ে কথা বলুন')}</a></p></section>`;
  }
  if (route.kind === 'service') {
    const item = meta.item;
    return `<section><p class="eyebrow">${esc(page.eyebrow)}</p><p><a href="${localePath('services', lang)}">${esc(page.backLabel)}</a></p><h1>${esc(item.title[lang])}</h1><p>${esc(item.summary[lang])}</p><h2>${esc(page.detailLabel)}</h2><p>${esc(item.detail[lang])}</p><h2>${esc(page.deliverablesLabel)}</h2><ul>${item.deliverables[lang].map(v => `<li>${esc(v)}</li>`).join('')}</ul><p><a href="${localePath('contact', lang)}">${esc(page.contactLabel)}</a></p></section>`;
  }
  if (route.kind === 'experience') {
    return `<section><p class="eyebrow">${esc(page.eyebrow)}</p><h1>${esc(page.headline)}</h1><p>${esc(page.lede)}</p><p>${esc(page.summary)}</p>${data.experience.map(item => `<article><h2>${esc(item.role[lang])}</h2><p>${esc(item.organisation)} · ${esc(item.location[lang])} · ${esc(item.period)}</p><ul>${item.work[lang].map(v => `<li>${esc(v)}</li>`).join('')}</ul></article>`).join('')}<p>${esc(page.experienceNote)}</p></section>`;
  }
  if (route.kind === 'projects') {
    return `<section><p class="eyebrow">${esc(page.eyebrow)}</p><h1>${esc(page.headline)}</h1><p>${esc(page.lede)}</p><ul>${data.projects.map(item => `<li><h2><a href="${localePath('project', lang, item.slug)}">${esc(item.name)}</a></h2><p>${esc(item.category[lang])} · ${esc(item.state[lang])}</p><p>${esc(item.summary[lang])}</p><ul>${item.highlights[lang].map(highlight => `<li>${esc(highlight)}</li>`).join('')}</ul><p><strong>${esc(page.stackLabel)}:</strong> ${esc(item.stack.slice(0, 8).join(' · '))}</p><p><strong>${esc(page.statusLabel)}:</strong> ${esc(item.boundary[lang])}</p><p><a href="${esc(item.url)}">${esc(page.repoLabel)}</a></p></li>`).join('')}</ul></section>`;
  }
  if (route.kind === 'project') {
    const item = meta.item;
    return `<section><p class="eyebrow">${esc(page.eyebrow)} · ${esc(item.category[lang])}</p><p><a href="${localePath('projects', lang)}">${lang === 'en' ? 'All projects' : 'সব প্রকল্প'}</a></p><h1>${esc(item.name)}</h1><p>${esc(item.summary[lang])}</p><p>${esc(item.role[lang])} · ${esc(item.state[lang])} · ${esc(item.stack.slice(0, 8).join(' · '))}</p><h2>${esc(page.overviewLabel)}</h2><p>${esc(item.overview[lang])}</p><h2>${esc(page.highlightsLabel)}</h2><ul>${item.highlights[lang].map(highlight => `<li>${esc(highlight)}</li>`).join('')}</ul><h2>${esc(page.evidenceLabel)}</h2><p>${esc(item.evidence[lang])}</p><h2>${esc(page.statusLabel)}</h2><p>${esc(item.boundary[lang])}</p><p><a href="${esc(item.url)}">${esc(page.repoLabel)}</a></p><p><a href="${localePath('evidence', lang)}">${lang === 'en' ? 'Evidence and claim limits' : 'প্রমাণ ও দাবির সীমা'}</a></p></section>`;
  }
  if (route.kind === 'research') {
    const info = data.research[lang];
    return `<section><p class="eyebrow">${esc(page.eyebrow)}</p><h1>${esc(page.headline)}</h1><p>${esc(page.lede)}</p><p>${esc(page.lastReviewed)}</p><h2>${esc(page.verifiedTitle)}</h2><ul>${info.verified.map(v => `<li>${esc(v)}</li>`).join('')}</ul><h2>${esc(page.experimentalTitle)}</h2><ul>${info.experimental.map(v => `<li>${esc(v)}</li>`).join('')}</ul><h2>${esc(page.plannedTitle)}</h2><ul>${info.notClaimed.map(v => `<li>${esc(v)}</li>`).join('')}</ul><p>${esc(page.researchNote)}</p><p><a href="${localePath('evidence', lang)}">${lang === 'en' ? 'Read the evidence page' : 'প্রমাণের পৃষ্ঠা দেখুন'}</a></p></section>`;
  }
  if (route.kind === 'evidence') {
    return `<section><p class="eyebrow">${esc(page.eyebrow)}</p><h1>${esc(page.headline)}</h1><p>${esc(page.lede)}</p><p>${esc(page.note)}</p><h2>${esc(page.howTitle)}</h2><ol>${page.how.map(v => `<li>${esc(v)}</li>`).join('')}</ol><ul>${data.projects.map(item => `<li><h2>${esc(item.name)}</h2><p>${esc(item.evidence[lang])}</p><p><strong>${esc(page.limitLabel)}:</strong> ${esc(item.boundary[lang])}</p><p><a href="${esc(item.url)}">${esc(page.sourceLabel)}</a></p></li>`).join('')}</ul><p><a href="${localePath('research', lang)}">${esc(page.researchLink)}</a></p></section>`;
  }
  return `<section><p class="eyebrow">${esc(page.eyebrow)}</p><h1>${esc(page.headline)}</h1><p>${esc(page.lede)}</p><p><a href="mailto:${esc(data.site.email)}">${esc(data.site.email)}</a></p><p><a href="tel:${esc(data.site.phoneHref)}">${esc(data.site.phone)}</a></p><h2>${esc(page.briefTitle)}</h2><ol>${page.brief.map(v => `<li>${esc(v)}</li>`).join('')}</ol><p>${esc(page.responseLabel)}: ${esc(page.responseValue)}</p><ul>${data.site.social.flatMap(group => group.items).map(link => `<li><a href="${esc(link.href)}">${esc(link.label)}</a></li>`).join('')}</ul></section>`;
}

function replaceMeta(html, key, value, property = 'name') {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expression = new RegExp(`<meta\\s+${property}="${escapedKey}"\\s+content="[^"]*"\\s*\\/?\\s*>`, 'i');
  const tag = `<meta ${property}="${esc(key)}" content="${esc(value)}" />`;
  return expression.test(html) ? html.replace(expression, tag) : html.replace('</head>', `  ${tag}\n  </head>`);
}

function makeHtml(template, route) {
  const meta = pageMeta(route);
  let html = template.replace(/<html\s+lang="[^"]*"/, `<html lang="${route.lang}"`);
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(meta.title)}</title>`);
  html = replaceMeta(html, 'description', meta.description);
  html = replaceMeta(html, 'keywords', meta.keywords.join(', '));
  html = replaceMeta(html, 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-archive-size');
  html = replaceMeta(html, 'og:type', 'website', 'property');
  html = replaceMeta(html, 'og:url', urlFor(route.path), 'property');
  html = replaceMeta(html, 'og:title', meta.title, 'property');
  html = replaceMeta(html, 'og:description', meta.description, 'property');
  html = replaceMeta(html, 'og:locale', route.lang === 'en' ? 'en_US' : 'bn_BD', 'property');
  html = replaceMeta(html, 'og:locale:alternate', route.lang === 'en' ? 'bn_BD' : 'en_US', 'property');
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

// Retired routes get a static meta-refresh + canonical stub (GitHub Pages has
// no redirect config), so an old link lands on the living page, not a 404.
const retired = [['/projects/ternuxx/', '/projects/'], ['/bn/projects/ternuxx/', '/bn/projects/']];
for (const [from, to] of retired) {
  const directory = path.join(dist, from.replace(/^\//, '').replace(/\/$/, ''));
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><link rel="canonical" href="${esc(urlFor(to))}"><meta http-equiv="refresh" content="0; url=${esc(to)}"><title>Moved | Sobuj Miah</title></head><body><p>This page has moved. <a href="${esc(to)}">Continue to Projects</a></p></body></html>`);
}

const priority = route => route.kind === 'home' ? '1.0' : ['service', 'project'].includes(route.kind) ? '0.7' : '0.8';
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${routes.map(route => {
  const { englishPath, banglaPath } = alternatePaths(route);
  return `  <url>\n    <loc>${esc(urlFor(route.path))}</loc>\n    <lastmod>${buildDate}</lastmod>\n    <changefreq>${route.kind === 'home' ? 'weekly' : 'monthly'}</changefreq>\n    <priority>${priority(route)}</priority>\n    <xhtml:link rel="alternate" hreflang="en" href="${esc(urlFor(englishPath))}" />\n    <xhtml:link rel="alternate" hreflang="bn" href="${esc(urlFor(banglaPath))}" />\n    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(urlFor(englishPath))}" />\n  </url>`;
}).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`);

const notFound = template
  .replace(/<title>[\s\S]*?<\/title>/i, '<title>Page not found | Sobuj Miah</title>')
  .replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root"><main class="page-wrap not-found"><p class="eyebrow">404 · PAGE NOT FOUND</p><h1>This path has moved.</h1><p><a href="/">Return to Sobuj Miah’s portfolio</a></p></main></div>`)
  .replace('</head>', '  <meta name="robots" content="noindex,follow" />\n</head>');
fs.writeFileSync(path.join(dist, '404.html'), notFound);
console.log(`Generated ${routes.length} direct-load pages, unique metadata, JSON-LD, and a bilingual sitemap.`);
