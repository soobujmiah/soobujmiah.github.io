import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, BriefcaseBusiness, Code2,
  Cpu, Database, Menu, Monitor, PenTool, Smartphone, X,
} from 'lucide-react';
import rawSite from './data/site-content.json';

type Lang = 'en' | 'bn';
type Localized = Record<Lang, string>;
type Kind = 'home' | 'about' | 'services' | 'service' | 'experience' | 'projects' | 'project' | 'research' | 'contact';
interface PageText { title: string; description: string; eyebrow: string; headline: string; lede?: string; visualCaption?: string; [key: string]: string | string[] | undefined; }
interface SiteData {
  site: {
    name: string; url: string; email: string; phone: string; phoneHref: string;
    location: Localized;
    languages: Array<{ en: string; bn: string; levelEn: string; levelBn: string }>;
    social: Array<{ label: string; href: string }>;
  };
  pages: Record<Lang, Record<'home' | 'about' | 'services' | 'experience' | 'projects' | 'research' | 'contact', PageText>>;
  services: Array<{
    slug: string; icon: string; title: Localized; summary: Localized; detail: Localized;
    deliverables: Record<Lang, string[]>;
  }>;
  experience: Array<{ role: Localized; organisation: string; location: Localized; work: Record<Lang, string[]> }>;
  skills: Array<{ title: Localized; items: Record<Lang, string[]> }>;
  projects: Array<{ slug: string; name: string; category: Localized; summary: Localized; boundary: Localized; url: string; state: string }>;
  research: Record<Lang, { verified: string[]; experimental: string[]; notClaimed: string[] }>;
}

const site = rawSite as unknown as SiteData;
const navigation: Array<{ key: 'about' | 'services' | 'projects' | 'experience' | 'research' | 'contact'; label: Localized }> = [
  { key: 'about', label: { en: 'About', bn: 'পরিচিতি' } },
  { key: 'services', label: { en: 'Services', bn: 'সেবা' } },
  { key: 'projects', label: { en: 'Projects', bn: 'প্রকল্প' } },
  { key: 'experience', label: { en: 'Experience', bn: 'অভিজ্ঞতা' } },
  { key: 'research', label: { en: 'Research', bn: 'গবেষণা' } },
  { key: 'contact', label: { en: 'Contact', bn: 'যোগাযোগ' } },
];
const routePath = (kind: string, lang: Lang, slug?: string) => {
  const suffix = kind === 'home' ? '' : kind === 'service' ? `services/${slug}/` : kind === 'project' ? `projects/${slug}/` : `${kind}/`;
  return lang === 'bn' ? `/bn/${suffix}` : `/${suffix}`;
};
function readRoute() {
  const pathname = `/${window.location.pathname.split('/').filter(Boolean).join('/')}${window.location.pathname.endsWith('/') ? '' : '/'}`;
  const parts = pathname.split('/').filter(Boolean);
  const lang: Lang = parts[0] === 'bn' ? 'bn' : 'en';
  const path = parts[0] === 'bn' ? parts.slice(1) : parts;
  if (!path.length) return { lang, kind: 'home' as Kind, path: lang === 'bn' ? '/bn/' : '/' };
  if (path[0] === 'services' && path[1]) return { lang, kind: 'service' as Kind, slug: path[1], path: routePath('service', lang, path[1]) };
  if (path[0] === 'services') return { lang, kind: 'services' as Kind, path: routePath('services', lang) };
  if (path[0] === 'projects' && path[1]) return { lang, kind: 'project' as Kind, slug: path[1], path: routePath('project', lang, path[1]) };
  const allowed = new Set(['about', 'experience', 'projects', 'research', 'contact']);
  if (allowed.has(path[0])) return { lang, kind: path[0] as Kind, path: routePath(path[0], lang) };
  return { lang, kind: 'home' as Kind, path: lang === 'bn' ? '/bn/' : '/' };
}
function setMeta(selector: string, attribute: string, value: string) {
  const element = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
  if (element) element.setAttribute(attribute, value);
}
function IconFor({ name, size = 18 }: { name: string; size?: number }) {
  const icons: Record<string, typeof Code2> = {
    web: Monitor, software: Code2, computer: Monitor, android: Smartphone,
    business: BriefcaseBusiness, design: PenTool, office: BriefcaseBusiness,
    data: Database, marketing: ArrowUpRight, linux: Cpu, ai: Cpu,
  };
  const Icon = icons[name] ?? Code2;
  return <Icon size={size} strokeWidth={1.6} aria-hidden="true" />;
}

function Header({ lang, path }: { lang: Lang; path: string }) {
  const [open, setOpen] = useState(false);
  const base = path.replace(/^\/bn(?=\/|$)/, '') || '/';
  const languagePath = lang === 'en' ? `/bn${base === '/' ? '/' : base}` : base;
  const text = lang === 'en'
    ? { menu: 'Open navigation', home: 'Sobuj Miah home', language: 'বাংলা' }
    : { menu: 'নেভিগেশন খুলুন', home: 'সবুজ মিয়ার হোম', language: 'English' };
  return <header className="site-header">
    <a className="wordmark" href={routePath('home', lang)} aria-label={text.home}>
      <span className="wordmark-mark" aria-hidden="true"><i /><i /><i /></span>
      <span><strong>{lang === 'bn' ? 'সবুজ মিয়া' : 'SOBUJ MIAH'}</strong><small>{lang === 'bn' ? 'সফটওয়্যার · সিস্টেম · পরিচালনা' : 'SOFTWARE · SYSTEMS · OPERATIONS'}</small></span>
    </a>
    <button className="menu-toggle" type="button" aria-label={text.menu} aria-expanded={open} aria-controls="primary-nav" onClick={() => setOpen(!open)}>{open ? <X size={19} /> : <Menu size={19} />}</button>
    <nav id="primary-nav" className={`primary-nav ${open ? 'is-open' : ''}`} aria-label={lang === 'en' ? 'Main navigation' : 'প্রধান নেভিগেশন'}>
      {navigation.map(item => <a key={item.key} href={routePath(item.key, lang)} onClick={() => setOpen(false)}>{item.label[lang]}</a>)}
      <a className="nav-contact" href={routePath('contact', lang)} onClick={() => setOpen(false)}>{lang === 'en' ? 'Let’s talk' : 'কথা বলুন'}<ArrowUpRight size={14} /></a>
    </nav>
    <a className="language-switch" href={languagePath} lang={lang === 'en' ? 'bn' : 'en'} aria-label={lang === 'en' ? 'View this page in Bangla' : 'এই পৃষ্ঠাটি ইংরেজিতে দেখুন'}>{text.language}</a>
  </header>;
}

function Footer({ lang }: { lang: Lang }) {
  return <footer className="site-footer">
    <a href={routePath('home', lang)} className="footer-name">{lang === 'bn' ? 'সবুজ মিয়া' : 'Sobuj Miah'}</a>
    <span>{site.site.location[lang]}</span>
    <nav aria-label={lang === 'en' ? 'Footer navigation' : 'ফুটার নেভিগেশন'}>
      {navigation.map(item => <a key={item.key} href={routePath(item.key, lang)}>{item.label[lang]}</a>)}
    </nav>
    <span>© {new Date().getFullYear()} Sobuj Miah</span>
  </footer>;
}

function HeroScene({ lang, label }: { lang: Lang; label: string }) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<{ setPaused: (value: boolean) => void; dispose: () => void } | null>(null);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener('change', update);
    let cancelled = false;
    void import('./scene/WorkbenchScene').then(({ WorkbenchScene }) => {
      if (cancelled || !host.current) return;
      scene.current = new WorkbenchScene(host.current, reduced || paused);
      scene.current.setPaused(reduced || paused);
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; query.removeEventListener('change', update); scene.current?.dispose(); scene.current = null; };
  }, []);
  useEffect(() => { scene.current?.setPaused(reduced || paused); }, [reduced, paused]);
  const pauseLabel = reduced ? (lang === 'en' ? 'Reduced motion enabled' : 'Reduced motion চালু') : paused ? (lang === 'en' ? 'Resume scene motion' : 'দৃশ্যের গতি চালু করুন') : (lang === 'en' ? 'Pause scene motion' : 'দৃশ্যের গতি থামান');
  return <div className={`hero-art ${failed ? 'art-fallback' : ''}`}>
    <div className="scene-wash" aria-hidden="true" />
    {!failed ? <div className="scene-host" ref={host} /> : <div className="scene-fallback"><div className="fallback-board"><div className="fallback-phone"><span>SOBUJ / SYSTEMS</span><i /><i /><i /><b>ARM64 · AI · WEB</b></div><div className="fallback-chip">WORK<br />BENCH</div><span className="fallback-line line-a" /><span className="fallback-line line-b" /><span className="fallback-node node-a">01 / SYSTEMS</span><span className="fallback-node node-b">02 / WORKFLOWS</span></div></div>}
    <div className="scene-caption" aria-hidden="true"><span className="caption-signal" />{label}</div>
    {!failed && <button className="scene-motion" type="button" aria-hidden="false" aria-label={pauseLabel} title={pauseLabel} onClick={() => setPaused(!paused)} disabled={reduced}><span>{paused || reduced ? 'II' : '↗'}</span><span className="sr-only">{pauseLabel}</span></button>}
  </div>;
}

function PageHeading({ copy }: { copy: PageText }) {
  return <header className="page-heading"><p className="eyebrow"><span />{copy.eyebrow}</p><h1>{copy.headline}</h1>{copy.lede && <p className="page-lede">{copy.lede}</p>}</header>;
}

function ServiceCard({ service, lang, index }: { service: SiteData['services'][number]; lang: Lang; index: number }) {
  return <a className="service-card" href={routePath('service', lang, service.slug)}>
    <span className="card-top"><span className="card-index">{String(index + 1).padStart(2, '0')}</span><span className="card-icon"><IconFor name={service.icon} /></span><ArrowUpRight className="card-arrow" size={17} /></span>
    <h2>{service.title[lang]}</h2><p>{service.summary[lang]}</p><span className="card-more">{lang === 'en' ? 'Explore service' : 'সেবাটি দেখুন'}<ArrowRight size={14} /></span>
  </a>;
}

function ProjectCard({ project, lang, index }: { project: SiteData['projects'][number]; lang: Lang; index: number }) {
  return <article className="project-card">
    <div className="project-top"><span className="project-index">PROJECT / {String(index + 1).padStart(2, '0')}</span><span className="project-state">{project.state}</span></div>
    <p className="project-category">{project.category[lang]}</p><h2>{project.name}</h2><p className="project-summary">{project.summary[lang]}</p>
    <div className="project-boundary"><span>{lang === 'en' ? 'BOUNDARY' : 'সীমা'}</span><p>{project.boundary[lang]}</p></div>
    <a href={routePath('project', lang, project.slug)} className="text-link">{lang === 'en' ? 'Project details' : 'প্রকল্পের বিবরণ'}<ArrowRight size={14} /></a>
    <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-link">{lang === 'en' ? 'Open source repository' : 'Source repository খুলুন'}<ArrowUpRight size={14} /></a>
  </article>;
}

function HomePage({ lang, copy }: { lang: Lang; copy: SiteData['pages'][Lang]['home'] }) {
  const home = copy;
  return <>
    <section className="hero" aria-labelledby="hero-title">
      <HeroScene lang={lang} label={home.visualCaption ?? home.eyebrow} />
      <div className="hero-inner">
        <p className="eyebrow hero-eyebrow"><span />{home.eyebrow}</p>
        <p className="hero-name">{site.site.name}<span> / {lang === 'en' ? 'INDEPENDENT BUILDER' : 'স্বতন্ত্র নির্মাতা'}</span></p>
        <h1 id="hero-title">{home.headline.split('. ').map((line, index, all) => <span key={line}>{line}{index < all.length - 1 ? '.' : ''}{index === 0 && all.length > 1 ? <br /> : ' '}</span>)}</h1>
        <p className="hero-deck">{home.deck}</p>
        <p className="hero-identity">{home.identity}</p>
        <div className="hero-actions"><a className="button button-primary" href={routePath('projects', lang)}>{home.primary}<ArrowRight size={16} /></a><a className="button button-quiet" href={routePath('services', lang)}>{home.secondary}<ArrowDown size={15} /></a></div>
        <div className="hero-bottom"><span>23.81° N · 90.26° E</span><span>{home.visualLabel}</span></div>
      </div>
      <div className="hero-edge" aria-hidden="true"><span>FIELD NOTES / 01</span><i /></div>
    </section>

    <section className="section about-teaser" aria-labelledby="home-about-title">
      <div className="section-meta"><span>01</span><span>{lang === 'en' ? 'PROFILE' : 'পরিচিতি'}</span></div>
      <div className="about-teaser-copy"><h2 id="home-about-title">{home.aboutTitle}</h2><p>{home.aboutIntro}</p><a className="text-link" href={routePath('about', lang)}>{lang === 'en' ? 'Read my story' : 'আমার পরিচিতি পড়ুন'}<ArrowRight size={15} /></a></div>
      <div className="principle-note"><span className="principle-mark">“</span><p>{lang === 'en' ? 'Document the work. Verify before reporting. Own the outcome.' : 'কাজ নথিবদ্ধ করি। রিপোর্টের আগে যাচাই করি। ফলাফলের দায় নিই।'}</p><span>{lang === 'en' ? 'A WORKING PRINCIPLE' : 'কাজের নীতি'}</span></div>
    </section>

    <section className="section section-tint" aria-labelledby="home-services-title">
      <div className="section-meta"><span>02</span><span>{lang === 'en' ? 'SERVICES' : 'সেবা'}</span></div>
      <div className="section-head"><div><p className="eyebrow"><span />{lang === 'en' ? 'PRACTICAL SUPPORT' : 'ব্যবহারিক সহায়তা'}</p><h2 id="home-services-title">{home.servicesTitle}</h2></div><p>{home.servicesIntro}</p></div>
      <div className="service-grid home-service-grid">{site.services.slice(0, 4).map((service, index) => <ServiceCard key={service.slug} service={service} lang={lang} index={index} />)}</div>
      <a className="text-link section-link" href={routePath('services', lang)}>{lang === 'en' ? 'Browse every service' : 'সব সেবা দেখুন'}<ArrowRight size={15} /></a>
    </section>

    <section className="section" aria-labelledby="home-projects-title">
      <div className="section-meta"><span>03</span><span>{lang === 'en' ? 'SELECTED WORK' : 'বাছাই করা কাজ'}</span></div>
      <div className="section-head"><div><p className="eyebrow"><span />{lang === 'en' ? 'PUBLIC SOURCE · REAL BOUNDARIES' : 'পাবলিক সোর্স · বাস্তব সীমা'}</p><h2 id="home-projects-title">{home.selectedTitle}</h2></div><p>{home.selectedIntro}</p></div>
      <div className="project-grid">{site.projects.slice(0, 3).map((project, index) => <ProjectCard key={project.slug} project={project} lang={lang} index={index} />)}</div>
      <a className="text-link section-link" href={routePath('projects', lang)}>{lang === 'en' ? 'See all public projects' : 'সব পাবলিক প্রকল্প দেখুন'}<ArrowRight size={15} /></a>
    </section>

    <ContactBand lang={lang} copy={site.pages[lang].contact} />
  </>;
}

function AboutPage({ lang, copy }: { lang: Lang; copy: SiteData['pages'][Lang]['about'] }) {
  const c = copy;
  return <div className="page-wrap"><PageHeading copy={c} />
    <section className="about-layout"><div className="prose">{(c.paragraphs as string[]).map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
      <aside className="profile-aside"><p className="eyebrow"><span />{c.factsTitle as string}</p><dl>
        <div><dt>{lang === 'en' ? 'Based in' : 'অবস্থান'}</dt><dd>{site.site.location[lang]}</dd></div>
        <div><dt>{c.experienceLabel as string}</dt><dd>{c.experienceValue as string}</dd></div>
        <div><dt>{c.educationLabel as string}</dt><dd>{c.educationValue as string}</dd></div>
        <div><dt>{c.availabilityLabel as string}</dt><dd>{c.availabilityValue as string}</dd></div>
      </dl><div className="principle-aside"><span>{c.principleTitle as string}</span><p>{c.principle as string}</p></div></aside>
    </section>
    <section className="subsection"><div className="subsection-heading"><p className="eyebrow"><span />{lang === 'en' ? 'CAPABILITIES' : 'দক্ষতা'}</p><h2>{lang === 'en' ? 'A wide, practical toolkit.' : 'ব্যবহারিক দক্ষতার বিস্তৃত পরিসর।'}</h2></div><div className="skill-grid">{site.skills.map((group, i) => <article className="skill-card" key={group.title.en}><span className="skill-number">0{i + 1}</span><h3>{group.title[lang]}</h3><ul>{group.items[lang].map(item => <li key={item}>{item}</li>)}</ul></article>)}</div></section>
    <section className="subsection"><div className="subsection-heading"><p className="eyebrow"><span />{c.languagesTitle as string}</p></div><div className="language-list">{site.site.languages.map(item => <div key={item.en}><span>{item[lang]}</span><span>{lang === 'en' ? item.levelEn : item.levelBn}</span></div>)}</div></section>
  </div>;
}

function ServicesPage({ lang, copy }: { lang: Lang; copy: SiteData['pages'][Lang]['services'] }) {
  return <div className="page-wrap"><PageHeading copy={copy} /><div className="service-grid">{site.services.map((service, index) => <ServiceCard key={service.slug} service={service} lang={lang} index={index} />)}</div></div>;
}

function ServiceDetail({ lang, copy, slug }: { lang: Lang; copy: SiteData['pages'][Lang]['services']; slug: string }) {
  const service = site.services.find(item => item.slug === slug);
  if (!service) return <NotFound lang={lang} />;
  const index = site.services.indexOf(service);
  return <div className="page-wrap detail-wrap"><a className="back-link" href={routePath('services', lang)}><ArrowLeft size={15} />{copy.backLabel as string}</a>
    <PageHeading copy={{ title: service.title[lang], description: service.summary[lang], eyebrow: `${copy.eyebrow} · ${String(index + 1).padStart(2, '0')}`, headline: service.title[lang], lede: service.summary[lang] }} />
    <div className="service-detail-layout"><section className="prose"><p>{service.detail[lang]}</p></section><aside className="deliverables"><p className="eyebrow"><span />{copy.deliverablesLabel as string}</p><ul>{service.deliverables[lang].map(item => <li key={item}>{item}</li>)}</ul></aside></div>
    <div className="detail-cta"><a className="button button-primary" href={routePath('contact', lang)}>{copy.contactLabel as string}<ArrowRight size={16} /></a></div>
  </div>;
}

function ExperiencePage({ lang, copy }: { lang: Lang; copy: SiteData['pages'][Lang]['experience'] }) {
  return <div className="page-wrap"><PageHeading copy={copy} /><div className="experience-list">{site.experience.map((item, index) => <article className="experience-item" key={`${item.role.en}-${item.organisation}`}>
    <span className="experience-index">0{index + 1}</span><div><p className="experience-place">{item.organisation} · {item.location[lang]}</p><h2>{item.role[lang]}</h2><ul>{item.work[lang].map(task => <li key={task}>{task}</li>)}</ul></div>
  </article>)}</div><p className="quiet-note">{copy.experienceNote as string}</p></div>;
}

function ProjectsPage({ lang, copy }: { lang: Lang; copy: SiteData['pages'][Lang]['projects'] }) {
  return <div className="page-wrap"><PageHeading copy={copy} /><div className="project-grid all-projects">{site.projects.map((project, index) => <ProjectCard key={project.slug} project={project} lang={lang} index={index} />)}</div></div>;
}

function ProjectDetail({ lang, copy, slug }: { lang: Lang; copy: SiteData['pages'][Lang]['projects']; slug: string }) {
  const project = site.projects.find(item => item.slug === slug);
  if (!project) return <NotFound lang={lang} />;
  return <div className="page-wrap detail-wrap"><a className="back-link" href={routePath('projects', lang)}><ArrowLeft size={15} />{lang === 'en' ? 'All projects' : 'সব প্রকল্প'}</a>
    <PageHeading copy={{ title: `${project.name} — ${copy.title}`, description: project.summary[lang], eyebrow: `${copy.eyebrow} · ${project.category[lang]}`, headline: project.name, lede: project.summary[lang] }} />
    <div className="project-detail-box"><p className="eyebrow"><span />{copy.statusLabel as string}</p><p>{project.boundary[lang]}</p><a className="button button-primary" href={project.url} target="_blank" rel="noopener noreferrer">{copy.repoLabel as string}<ArrowUpRight size={16} /></a></div>
  </div>;
}

function ResearchPage({ lang, copy }: { lang: Lang; copy: SiteData['pages'][Lang]['research'] }) {
  const data = site.research[lang];
  const groups = [
    { title: copy.verifiedTitle as string, items: data.verified, className: 'research-verified' },
    { title: copy.experimentalTitle as string, items: data.experimental, className: 'research-experimental' },
    { title: copy.plannedTitle as string, items: data.notClaimed, className: 'research-boundary' },
  ];
  return <div className="page-wrap"><PageHeading copy={copy} /><div className="research-grid">{groups.map(group => <section className={`research-card ${group.className}`} key={group.title}><h2>{group.title}</h2><ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul></section>)}</div></div>;
}

function ContactPage({ copy }: { lang: Lang; copy: SiteData['pages'][Lang]['contact'] }) {
  return <div className="page-wrap contact-page"><PageHeading copy={copy} /><p className="contact-lede">{copy.lede}</p><div className="contact-grid">
    <a href={`mailto:${site.site.email}`}><span>{copy.emailLabel as string}</span><strong>{site.site.email}</strong><ArrowUpRight size={17} /></a>
    <a href={`tel:${site.site.phoneHref}`}><span>{copy.phoneLabel as string}</span><strong>{site.site.phone}</strong><ArrowUpRight size={17} /></a>
    <a href="https://t.me/soobujmiah" target="_blank" rel="noopener noreferrer"><span>{copy.telegramLabel as string}</span><strong>@soobujmiah</strong><ArrowUpRight size={17} /></a>
  </div><div className="social-list">{site.site.social.filter(link => !['WhatsApp', 'Telegram'].includes(link.label)).map(link => <a href={link.href} target="_blank" rel="noopener noreferrer" key={link.label}>{link.label}<ArrowUpRight size={14} /></a>)}</div></div>;
}

function ContactBand({ lang, copy }: { lang: Lang; copy: PageText }) {
  return <section className="contact-band"><p className="eyebrow"><span />{copy.eyebrow}</p><div><h2>{copy.headline}</h2><p>{copy.lede}</p></div><a className="button button-primary" href={routePath('contact', lang)}>{lang === 'en' ? 'Get in touch' : 'যোগাযোগ করুন'}<ArrowRight size={16} /></a></section>;
}

function NotFound({ lang }: { lang: Lang }) {
  return <div className="page-wrap not-found"><p className="eyebrow"><span />404 · {lang === 'en' ? 'PAGE NOT FOUND' : 'পেজ পাওয়া যায়নি'}</p><h1>{lang === 'en' ? 'This path has moved.' : 'এই ঠিকানাটি আর নেই।'}</h1><a className="button button-primary" href={routePath('home', lang)}>{lang === 'en' ? 'Return home' : 'হোমে ফিরুন'}<ArrowRight size={16} /></a></div>;
}

function App() {
  const route = useMemo(readRoute, []);
  const { lang, kind } = route;
  const locale = site.pages[lang];
  const homeCopy = locale.home;
  const meta = kind === 'service'
    ? (() => { const service = site.services.find(item => item.slug === route.slug); return service ? { title: `${service.title[lang]} | ${locale.services.title}`, description: service.summary[lang] } : { title: '404 | Sobuj Miah', description: 'Page not found.' }; })()
    : kind === 'project'
      ? (() => { const project = site.projects.find(item => item.slug === route.slug); return project ? { title: `${project.name} | ${locale.projects.title}`, description: project.summary[lang] } : { title: '404 | Sobuj Miah', description: 'Page not found.' }; })()
      : locale[kind];
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dataset.locale = lang;
    document.title = meta.title;
    setMeta('meta[name="description"]', 'content', meta.description);
    setMeta('meta[property="og:title"]', 'content', meta.title);
    setMeta('meta[property="og:description"]', 'content', meta.description);
    setMeta('meta[property="og:url"]', 'content', `${site.site.url}${route.path}`);
    setMeta('meta[name="twitter:title"]', 'content', meta.title);
    setMeta('meta[name="twitter:description"]', 'content', meta.description);
    setMeta('link[rel="canonical"]', 'href', `${site.site.url}${route.path}`);
  }, [lang, meta, route.path]);

  let content;
  if (kind === 'home') content = <HomePage lang={lang} copy={homeCopy} />;
  else if (kind === 'about') content = <div className="page-shell"><AboutPage lang={lang} copy={locale.about} /></div>;
  else if (kind === 'services') content = <div className="page-shell"><ServicesPage lang={lang} copy={locale.services} /></div>;
  else if (kind === 'service') content = <div className="page-shell"><ServiceDetail lang={lang} copy={locale.services} slug={route.slug ?? ''} /></div>;
  else if (kind === 'experience') content = <div className="page-shell"><ExperiencePage lang={lang} copy={locale.experience} /></div>;
  else if (kind === 'projects') content = <div className="page-shell"><ProjectsPage lang={lang} copy={locale.projects} /></div>;
  else if (kind === 'project') content = <div className="page-shell"><ProjectDetail lang={lang} copy={locale.projects} slug={route.slug ?? ''} /></div>;
  else if (kind === 'research') content = <div className="page-shell"><ResearchPage lang={lang} copy={locale.research} /></div>;
  else if (kind === 'contact') content = <div className="page-shell"><ContactPage lang={lang} copy={locale.contact} /></div>;
  else content = <div className="page-shell"><NotFound lang={lang} /></div>;

  return <><a className="skip-link" href="#main">{lang === 'en' ? 'Skip to content' : 'মূল কনটেন্টে যান'}</a><Header lang={lang} path={route.path} /><main id="main">{content}</main><Footer lang={lang} /></>;
}

export default App;
