import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, BriefcaseBusiness, Check,
  Code2, Cpu, Database, FlaskConical, FolderGit2, Globe2, Home, Mail, Monitor,
  Moon, PenTool, Smartphone, Sun, UserRound, Clock3,
} from 'lucide-react';
import rawSite from './data/site-content.json';

type Lang = 'en' | 'bn';
type Localized = Record<Lang, string>;
type LocalizedList = Record<Lang, string[]>;
type Kind = 'home' | 'about' | 'services' | 'service' | 'experience' | 'projects' | 'project' | 'research' | 'evidence' | 'contact';

interface PageText {
  title: string;
  description: string;
  keywords?: string[];
  eyebrow: string;
  headline: string;
  lede?: string;
  [key: string]: unknown;
}

interface Service {
  slug: string;
  icon: string;
  group: string;
  title: Localized;
  summary: Localized;
  detail: Localized;
  keywords?: string[];
  deliverables: Record<Lang, string[]>;
}

interface Project {
  slug: string;
  name: string;
  website?: string;
  category: Localized;
  role: Localized;
  metaTitle: Localized;
  metaDescription: Localized;
  keywords: string[];
  summary: Localized;
  overview: Localized;
  highlights: LocalizedList;
  stack: string[];
  state: Localized;
  boundary: Localized;
  evidence: Localized;
  url: string;
}

interface SiteData {
  site: {
    name: string;
    alternateName: string;
    url: string;
    email: string;
    phone: string;
    phoneHref: string;
    location: Localized;
    timezone: Localized;
    availability: Localized;
    description: Localized;
    keywords: Record<Lang, string[]>;
    roles: Record<Lang, string[]>;
    process: Array<{ title: Localized; body: Localized }>;
    languages: Array<{ en: string; bn: string; levelEn: string; levelBn: string }>;
    social: Array<{ label: string; href: string }>;
  };
  serviceGroups: Array<{ id: string; title: Localized; lede: Localized }>;
  pages: Record<Lang, Record<'home' | 'about' | 'services' | 'experience' | 'projects' | 'research' | 'evidence' | 'contact', PageText>>;
  services: Service[];
  experience: Array<{ role: Localized; period: string; organisation: string; location: Localized; work: Record<Lang, string[]> }>;
  skills: Array<{ title: Localized; items: Record<Lang, string[]> }>;
  projects: Project[];
  research: Record<Lang, { verified: string[]; experimental: string[]; notClaimed: string[] }>;
}

const site = rawSite as unknown as SiteData;

const navigation: Array<{ key: 'about' | 'services' | 'projects' | 'experience' | 'research' | 'evidence' | 'contact'; label: Localized }> = [
  { key: 'about', label: { en: 'About', bn: 'পরিচিতি' } },
  { key: 'services', label: { en: 'Services', bn: 'সেবা' } },
  { key: 'projects', label: { en: 'Projects', bn: 'প্রকল্প' } },
  { key: 'experience', label: { en: 'Experience', bn: 'অভিজ্ঞতা' } },
  { key: 'research', label: { en: 'Research', bn: 'গবেষণা' } },
  { key: 'evidence', label: { en: 'Evidence', bn: 'প্রমাণ' } },
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
  const allowed = new Set(['about', 'experience', 'projects', 'research', 'evidence', 'contact']);
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

/** Split a string into grapheme clusters so Bengali conjuncts and marks are typed whole. */
function graphemes(value: string): string[] {
  const Segmenter = (Intl as unknown as {
    Segmenter?: new (locale: string, options: { granularity: string }) => { segment: (input: string) => Iterable<{ segment: string }> };
  }).Segmenter;
  if (!Segmenter) return Array.from(value);
  return Array.from(new Segmenter('en', { granularity: 'grapheme' }).segment(value), part => part.segment);
}

/** Type → hold → delete → next role → repeat, for as long as the list runs. */
function useTypewriter(roles: string[]) {
  const list = useMemo(() => roles.filter(Boolean), [roles]);
  const [index, setIndex] = useState(0);
  const chars = useMemo(() => graphemes(list[index] ?? ''), [list, index]);
  const [count, setCount] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!list.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setCount(chars.length); setDeleting(false); setPaused(false); return; }
    if (paused) return;
    const total = chars.length;
    let timer: number;
    if (!deleting && count < total) {
      timer = window.setTimeout(() => setCount(value => Math.min(total, value + 1)), count === 0 ? 420 : 42);
    } else if (!deleting) {
      timer = window.setTimeout(() => setDeleting(true), 3000);
    } else if (count > 0) {
      timer = window.setTimeout(() => setCount(value => Math.max(0, value - 1)), 18);
    } else {
      timer = window.setTimeout(() => {
        setDeleting(false);
        setIndex(value => (value + 1) % list.length);
        setPaused(true);
      }, 640);
    }
    return () => window.clearTimeout(timer);
  }, [chars, count, deleting, list, paused]);

  // A beat of stillness between roles, so the swap reads as a deliberate change.
  useEffect(() => {
    if (!paused) return;
    const timer = window.setTimeout(() => { setPaused(false); }, 900);
    return () => window.clearTimeout(timer);
  }, [paused]);

  return { typed: chars.slice(0, count).join(''), complete: count >= chars.length && !deleting, index };
}

/** Count a number up from zero once the element scrolls into view. */
function useCountUp(target: number, active: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setValue(target); return; }
    let frame = 0;
    const started = performance.now();
    const duration = 900;
    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = window.requestAnimationFrame(step);
    };
    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [active, target]);
  return value;
}

function Header({ lang, path }: { lang: Lang; path: string }) {
  const [light, setLight] = useState(() => document.documentElement.dataset.theme === 'light');
  const base = path.replace(/^\/bn(?=\/|$)/, '') || '/';
  const languagePath = lang === 'en' ? `/bn${base === '/' ? '/' : base}` : base;
  const icons: Record<string, typeof Home> = { about: UserRound, services: BriefcaseBusiness, projects: FolderGit2, experience: Clock3, research: FlaskConical, evidence: BadgeCheck, contact: Mail };
  const homePath = routePath('home', lang);

  const toggleTheme = () => {
    const next = !light;
    document.documentElement.dataset.theme = next ? 'light' : 'dark';
    document.querySelectorAll('meta[name="theme-color"]').forEach(element => element.setAttribute('content', next ? '#f6f7f3' : '#06070a'));
    try { localStorage.setItem('sm-theme', next ? 'light' : 'dark'); } catch { /* storage can be disabled */ }
    setLight(next);
  };

  return <header className="site-header">
    <nav id="primary-nav" className="primary-nav" aria-label={lang === 'en' ? 'Main navigation' : 'প্রধান নেভিগেশন'}>
      <a className="dock-home-link" href={homePath} aria-label={lang === 'en' ? 'Home' : 'হোম'} title={lang === 'en' ? 'Home' : 'হোম'} aria-current={path === homePath ? 'page' : undefined}>
        <Home size={18} strokeWidth={1.7} aria-hidden="true" /><span className="dock-tip">{lang === 'en' ? 'Home' : 'হোম'}</span>
      </a>
      {navigation.map(item => {
        const Icon = icons[item.key];
        const target = routePath(item.key, lang);
        return <a key={item.key} href={target} aria-label={item.label[lang]} title={item.label[lang]} aria-current={path === target ? 'page' : undefined}>
          <Icon size={18} strokeWidth={1.7} aria-hidden="true" /><span className="dock-tip">{item.label[lang]}</span>
        </a>;
      })}
    </nav>
    <span className="dock-separator" aria-hidden="true" />
    <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={light ? (lang === 'en' ? 'Switch to dark theme' : 'ডার্ক থিম চালু করুন') : (lang === 'en' ? 'Switch to light theme' : 'লাইট থিম চালু করুন')} title={light ? 'Dark theme' : 'Light theme'}>{light ? <Moon size={16} /> : <Sun size={16} />}</button>
    <a className="language-switch" href={languagePath} lang={lang === 'en' ? 'bn' : 'en'} aria-label={lang === 'en' ? 'View this page in Bangla' : 'এই পৃষ্ঠাটি ইংরেজিতে দেখুন'}><Globe2 size={15} aria-hidden="true" /><span className="language-label">{lang === 'en' ? 'বাংলা' : 'EN'}</span></a>
    <a className="nav-contact" href={routePath('contact', lang)} aria-label={lang === 'en' ? 'Contact Sobuj' : 'যোগাযোগ'} title={lang === 'en' ? 'Contact Sobuj' : 'যোগাযোগ'} aria-current={path === routePath('contact', lang) ? 'page' : undefined}><ArrowUpRight size={18} aria-hidden="true" /></a>
  </header>;
}

function Footer({ lang }: { lang: Lang }) {
  return <footer className="site-footer">
    <p className="footer-meta">© {new Date().getFullYear()} · {site.site.location[lang]} · {site.site.timezone[lang]}</p>
    <nav className="footer-links" aria-label={lang === 'en' ? 'Profiles and evidence' : 'প্রোফাইল ও প্রমাণ'}>
      {site.site.social.map(item => <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer">{item.label}</a>)}
      <a className="footer-evidence" href={routePath('evidence', lang)}>{lang === 'en' ? 'Claims & limits' : 'দাবি ও সীমাবদ্ধতা'}</a>
    </nav>
  </footer>;
}

function PageHeading({ copy }: { copy: PageText }) {
  return <header className="page-heading" data-reveal><p className="eyebrow"><span />{copy.eyebrow}</p><h1>{copy.headline}</h1>{copy.lede && <p className="page-lede">{copy.lede}</p>}</header>;
}

function SectionHeading({ number, label, title, lede, id }: { number: string; label: string; title: string; lede?: string; id: string }) {
  const [first, ...rest] = title.split(/(?<=\s)/);
  return <header className="source-section-heading" data-reveal><p className="source-eyebrow"><span>{number}</span>{label}</p><h2 id={id}>{first}<em>{rest.join('')}</em></h2>{lede && <p>{lede}</p>}</header>;
}

function Stack({ items, label }: { items: string[]; label: string }) {
  return <ul className="stack-row" aria-label={label}>{items.map(item => <li key={item}>{item}</li>)}</ul>;
}

function ServiceCard({ service, lang, index }: { service: Service; lang: Lang; index: number }) {
  return <a className="service-card" href={routePath('service', lang, service.slug)} data-reveal>
    <span className="card-top"><span className="card-index">{String(index + 1).padStart(2, '0')}</span><span className="card-icon"><IconFor name={service.icon} /></span><ArrowUpRight className="card-arrow" size={17} /></span>
    <h2>{service.title[lang]}</h2><p>{service.summary[lang]}</p><span className="card-more">{lang === 'en' ? 'Explore service' : 'সেবাটি দেখুন'}<ArrowRight size={14} /></span>
  </a>;
}

function ProjectCard({ project, lang, index }: { project: Project; lang: Lang; index: number }) {
  return <article className="project-card" data-reveal>
    <div className="project-top"><span className="project-index">PROJECT / {String(index + 1).padStart(2, '0')}</span><span className="project-state">{project.state[lang]}</span></div>
    <p className="project-category">{project.category[lang]}</p>
    <h2>{project.name}</h2>
    <p className="project-summary">{project.summary[lang]}</p>
    <Stack items={project.stack.slice(0, 4)} label={lang === 'en' ? 'Technologies used' : 'ব্যবহৃত প্রযুক্তি'} />
    {project.evidence && <p className="project-evidence">{project.evidence[lang]}</p>}
    <div className="project-boundary"><span>{lang === 'en' ? 'BOUNDARY' : 'সীমা'}</span><p>{project.boundary[lang]}</p></div>
    <div className="project-links">
      <a href={routePath('project', lang, project.slug)} className="text-link">{lang === 'en' ? 'Project details' : 'প্রকল্পের বিবরণ'}<ArrowRight size={14} /></a>
      {project.website && <a href={project.website} target="_blank" rel="noopener noreferrer" className="text-link text-link-site">{lang === 'en' ? 'Visit website' : 'ওয়েবসাইট দেখুন'}<ArrowUpRight size={14} /></a>}
      <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-link">{lang === 'en' ? 'Open repository' : 'Source repository খুলুন'}<ArrowUpRight size={14} /></a>
    </div>
  </article>;
}

function Stat({ value, suffix = '', label }: { value: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!('IntersectionObserver' in window)) { setActive(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setActive(true); observer.disconnect(); }
    }, { threshold: 0.4 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const shown = useCountUp(value, active);
  return <div ref={ref}><strong data-value={value}>{shown}{suffix}</strong><span>{label}</span></div>;
}

function HomePage({ lang, copy }: { lang: Lang; copy: SiteData['pages'][Lang]['home'] }) {
  const home = copy;
  const about = site.pages[lang].about;
  const contact = site.pages[lang].contact;
  const verified = site.research[lang].verified;
  const roles = site.site.roles[lang];
  const { typed, complete } = useTypewriter(roles);
  const featuredServices = (home.featuredServices as string[]).map(slug => site.services.find(service => service.slug === slug)).filter((service): service is Service => Boolean(service));
  const featuredProjects = (home.featuredProjects as string[]).map(slug => site.projects.find(project => project.slug === slug)).filter((project): project is Project => Boolean(project));
  const focus = home.focus as string[];
  const ticker = site.services.map(service => service.title[lang]);
  return <div className="source-home">
    <section className="hero source-hero" aria-labelledby="hero-title">
      <div className="hero-inner">
        <span className="tagline" data-reveal><span className="pulse" />{site.site.availability[lang]}</span>
        <h1 className="source-name" id="hero-title" data-reveal><span>{lang === 'en' ? 'Sobuj ' : 'সবুজ '}</span><span className="name-accent">{lang === 'en' ? 'Miah' : 'মিয়া'}</span></h1>
        <p className="source-role" data-reveal>
          <span className="sr-only">{roles.join(' · ')}</span>
          <span className="role-line" aria-hidden="true"><b>&gt;</b>{typed}<i className={complete ? 'role-caret is-idle' : 'role-caret'} /></span>
        </p>
        <p className="source-intro" data-reveal>{home.deck as string}</p>
        <div className="hero-actions" data-reveal><a className="button button-primary" href={routePath('contact', lang)}>{lang === 'en' ? 'Discuss a project' : 'কাজ নিয়ে কথা বলুন'}<ArrowUpRight size={16} /></a><a className="button button-quiet" href={routePath('projects', lang)}>{lang === 'en' ? 'View projects' : 'প্রকল্প দেখুন'}<ArrowDown size={15} /></a></div>
        <ul className="focus-chips" aria-label={lang === 'en' ? 'Current focus areas' : 'বর্তমান কাজের ক্ষেত্র'}>{focus.map(item => <li key={item}>{item}</li>)}</ul>
        <div className="source-stats" data-reveal>
          <Stat value={8} suffix="+" label={lang === 'en' ? 'Years · self-reported' : 'বছর · স্ব-প্রতিবেদিত'} />
          <Stat value={2} label={lang === 'en' ? 'Countries worked' : 'দেশে কাজের অভিজ্ঞতা'} />
          <Stat value={site.projects.length} label={lang === 'en' ? 'Public projects' : 'পাবলিক প্রকল্প'} />
          <Stat value={site.site.languages.length} label={lang === 'en' ? 'Languages' : 'টি ভাষা'} />
        </div>
      </div>
      <span className="scroll-hint" aria-hidden="true">{lang === 'en' ? 'SCROLL TO EXPLORE' : 'আরও দেখতে স্ক্রল করুন'}<i /></span>
    </section>

    <div className="source-marquee" aria-hidden="true"><div>{[...ticker, ...ticker].map((item, index) => <span key={`${item}-${index}`}>{item}<b>◆</b></span>)}</div></div>

    <section className="source-section" id="about" aria-labelledby="home-about-title">
      <div className="source-wrap">
        <SectionHeading number="01" label={lang === 'en' ? 'PROFILE' : 'পরিচিতি'} title={about.headline} lede={about.lede} id="home-about-title" />
        <div className="source-about-grid">
          <div className="source-prose" data-reveal>{(about.paragraphs as string[]).slice(0, 2).map(paragraph => <p key={paragraph}>{paragraph}</p>)}<a className="text-link" href={routePath('about', lang)}>{lang === 'en' ? 'Full profile' : 'সম্পূর্ণ পরিচিতি'}<ArrowRight size={15} /></a></div>
          <div className="source-side" data-reveal>
            <aside className="quick-facts"><h3>{lang === 'en' ? 'QUICK FACTS' : 'সংক্ষেপে'}</h3><dl>
              <div><dt>{lang === 'en' ? 'Location' : 'অবস্থান'}</dt><dd>{site.site.location[lang]}</dd></div>
              <div><dt>{lang === 'en' ? 'Timezone' : 'সময় অঞ্চল'}</dt><dd>{site.site.timezone[lang]}</dd></div>
              <div><dt>{about.educationLabel as string}</dt><dd>{about.educationValue as string}</dd></div>
              <div><dt>{lang === 'en' ? 'Availability' : 'কাজের সুযোগ'}</dt><dd>{about.availabilityValue as string}</dd></div>
            </dl></aside>
            <div className="terminal-card" aria-label={lang === 'en' ? 'Working focus and verified results' : 'কাজের ক্ষেত্র ও যাচাইকৃত ফলাফল'}>
              <div className="terminal-bar"><i /><i /><i /><span>sobuj@portfolio: ~/work</span></div>
              <div className="terminal-body">
                <p><b>$</b> cat ~/focus</p>{focus.slice(0, 3).map(item => <p className="terminal-result" key={item}><b>›</b> {item}</p>)}
                <p className="terminal-gap"><b>$</b> research --verified</p>{verified.slice(0, 3).map(item => <p className="terminal-result" key={item}><b>✓</b> {item}</p>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="source-section source-section-alt" id="services" aria-labelledby="home-services-title">
      <div className="source-wrap">
        <SectionHeading number="02" label={lang === 'en' ? 'SERVICES' : 'সেবা'} title={home.servicesTitle as string} lede={home.servicesIntro as string} id="home-services-title" />
        <ul className="home-index-list">{featuredServices.map((service, index) => <li key={service.slug} data-reveal>
          <a href={routePath('service', lang, service.slug)}><span className="index-number">{String(index + 1).padStart(2, '0')}</span><span className="index-body"><b>{service.title[lang]}</b><em>{service.summary[lang]}</em></span><ArrowUpRight size={17} aria-hidden="true" /></a>
        </li>)}</ul>
        <a className="section-link" href={routePath('services', lang)}>{lang === 'en' ? 'All services' : 'সব সেবা দেখুন'}<ArrowUpRight size={14} /></a>
      </div>
    </section>

    <section className="source-section source-section-alt" id="work" aria-labelledby="home-projects-title">
      <div className="source-wrap">
        <SectionHeading number="03" label={lang === 'en' ? 'SELECTED WORK' : 'নির্বাচিত কাজ'} title={home.selectedTitle as string} lede={home.selectedIntro as string} id="home-projects-title" />
        <ul className="home-index-list home-index-projects">{featuredProjects.slice(0, 3).map((project, index) => <li key={project.slug} data-reveal>
          <a href={routePath('project', lang, project.slug)}><span className="index-number">{String(index + 1).padStart(2, '0')}</span><span className="index-body"><b>{project.name}</b><em>{project.category[lang]} · {project.state[lang]}</em></span><ArrowUpRight size={17} aria-hidden="true" /></a>
        </li>)}</ul>
        <a className="section-link" href={routePath('projects', lang)}>{lang === 'en' ? 'All projects' : 'সব প্রকল্প'}<ArrowUpRight size={14} /></a>
      </div>
    </section>

    <section className="source-section" id="process" aria-labelledby="home-process-title">
      <div className="source-wrap">
        <SectionHeading number="04" label={home.processEyebrow as string} title={home.processTitle as string} lede={home.processLede as string} id="home-process-title" />
        <div className="process-grid">{site.site.process.map((step, index) => <article className="process-step" key={step.title.en} data-reveal>
          <span className="process-number">{String(index + 1).padStart(2, '0')}</span>
          <h3>{step.title[lang]}</h3><p>{step.body[lang]}</p>
        </article>)}</div>
      </div>
    </section>

    <section className="source-section source-contact" id="contact" aria-labelledby="home-contact-title">
      <div className="source-wrap"><SectionHeading number="05" label={lang === 'en' ? 'CONTACT' : 'যোগাযোগ'} title={contact.headline} lede={contact.lede} id="home-contact-title" />
        <div className="source-contact-links" data-reveal><a href={`mailto:${site.site.email}`}><span>{contact.emailLabel as string}</span><b>{site.site.email}</b><ArrowUpRight size={17} /></a><a href={`tel:${site.site.phoneHref}`}><span>{contact.phoneLabel as string}</span><b>{site.site.phone}</b><ArrowUpRight size={17} /></a><a href="https://t.me/soobujmiah" target="_blank" rel="noopener noreferrer"><span>Telegram</span><b>@soobujmiah</b><ArrowUpRight size={17} /></a></div>
        <div className="source-socials">{site.site.social.map(item => <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer">{item.label}<ArrowUpRight size={13} /></a>)}</div>
      </div>
    </section>
  </div>;
}

function AboutPage({ lang, copy }: { lang: Lang; copy: SiteData['pages'][Lang]['about'] }) {
  const c = copy;
  return <div className="page-wrap"><PageHeading copy={c} />
    <section className="about-layout" data-reveal><div className="prose">{(c.paragraphs as string[]).map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
      <aside className="profile-aside"><p className="eyebrow"><span />{c.factsTitle as string}</p><dl>
        <div><dt>{lang === 'en' ? 'Based in' : 'অবস্থান'}</dt><dd>{site.site.location[lang]}</dd></div>
        <div><dt>{lang === 'en' ? 'Time zone' : 'সময় অঞ্চল'}</dt><dd>{site.site.timezone[lang]}</dd></div>
        <div><dt>{c.experienceLabel as string}</dt><dd>{c.experienceValue as string}</dd></div>
        <div><dt>{c.educationLabel as string}</dt><dd>{c.educationValue as string}</dd></div>
        <div><dt>{c.availabilityLabel as string}</dt><dd>{c.availabilityValue as string}</dd></div>
      </dl><div className="principle-aside"><span>{c.principleTitle as string}</span><p>{c.principle as string}</p></div></aside>
    </section>
    <section className="subsection"><div className="subsection-heading" data-reveal><p className="eyebrow"><span />{c.capabilitiesEyebrow as string}</p><h2>{c.capabilitiesTitle as string}</h2></div><div className="skill-grid">{site.skills.map((group, i) => <article className="skill-card" key={group.title.en} data-reveal><span className="skill-number">0{i + 1}</span><h3>{group.title[lang]}</h3><ul>{group.items[lang].map(item => <li key={item}>{item}</li>)}</ul></article>)}</div></section>
    <section className="subsection"><div className="subsection-heading" data-reveal><p className="eyebrow"><span />{c.languagesTitle as string}</p></div><div className="language-list" data-reveal>{site.site.languages.map(item => <div key={item.en}><span>{item[lang]}</span><span>{lang === 'en' ? item.levelEn : item.levelBn}</span></div>)}</div></section>
    <div className="detail-cta" data-reveal><a className="button button-primary" href={routePath('contact', lang)}>{lang === 'en' ? 'Discuss a project' : 'কাজ নিয়ে কথা বলুন'}<ArrowRight size={16} /></a></div>
  </div>;
}

function ServicesPage({ lang, copy }: { lang: Lang; copy: SiteData['pages'][Lang]['services'] }) {
  const faq = copy.faq as Array<{ question: string; answer: string }>;
  return <div className="page-wrap"><PageHeading copy={copy} />
    {site.serviceGroups.map(group => {
      const services = site.services.filter(service => service.group === group.id);
      if (!services.length) return null;
      return <section className="service-group" key={group.id} aria-labelledby={`group-${group.id}`}>
        <div className="service-group-heading" data-reveal><p className="eyebrow"><span />{group.title[lang]}</p><p>{group.lede[lang]}</p></div>
        <div className="service-grid">{services.map((service, index) => <ServiceCard key={service.slug} service={service} lang={lang} index={index} />)}</div>
      </section>;
    })}
    <section className="faq-section" aria-labelledby="faq-title">
      <div className="subsection-heading" data-reveal><p className="eyebrow"><span />FAQ</p><h2 id="faq-title">{copy.faqTitle as string}</h2><p className="faq-intro">{copy.faqIntro as string}</p></div>
      <div className="faq-list">{faq.map(item => <details className="faq-item" key={item.question}><summary>{item.question}<span className="disclosure-plus" aria-hidden="true" /></summary><p>{item.answer}</p></details>)}</div>
    </section>
    <div className="detail-cta" data-reveal><a className="button button-primary" href={routePath('contact', lang)}>{lang === 'en' ? 'Discuss your project' : 'আপনার কাজ নিয়ে কথা বলুন'}<ArrowRight size={16} /></a></div>
  </div>;
}

function ServiceDetail({ lang, copy, slug }: { lang: Lang; copy: SiteData['pages'][Lang]['services']; slug: string }) {
  const service = site.services.find(item => item.slug === slug);
  if (!service) return <NotFound lang={lang} />;
  const index = site.services.indexOf(service);
  const related = site.services.filter(item => item.group === service.group && item.slug !== service.slug).slice(0, 3);
  return <div className="page-wrap detail-wrap"><a className="back-link" href={routePath('services', lang)}><ArrowLeft size={15} />{copy.backLabel as string}</a>
    <PageHeading copy={{ title: service.title[lang], description: service.summary[lang], eyebrow: `${copy.eyebrow} · ${String(index + 1).padStart(2, '0')}`, headline: service.title[lang], lede: service.summary[lang] }} />
    <div className="service-detail-layout" data-reveal><section className="prose"><p>{service.detail[lang]}</p><ul className="inline-keywords">{(service.keywords ?? []).map(keyword => <li key={keyword}>{keyword}</li>)}</ul></section><aside className="deliverables"><p className="eyebrow"><span />{copy.deliverablesLabel as string}</p><ul>{service.deliverables[lang].map(item => <li key={item}>{item}</li>)}</ul></aside></div>
    <div className="detail-cta" data-reveal><a className="button button-primary" href={routePath('contact', lang)}>{copy.contactLabel as string}<ArrowRight size={16} /></a></div>
    {related.length > 0 && <section className="related-section"><p className="eyebrow"><span />{lang === 'en' ? 'Related services' : 'সম্পর্কিত সেবা'}</p><div className="related-grid">{related.map(item => <a key={item.slug} href={routePath('service', lang, item.slug)}><span>{item.title[lang]}</span><ArrowUpRight size={15} /></a>)}</div></section>}
  </div>;
}

function ExperiencePage({ lang, copy }: { lang: Lang; copy: SiteData['pages'][Lang]['experience'] }) {
  return <div className="page-wrap"><PageHeading copy={copy} />
    <p className="page-summary" data-reveal>{copy.summary as string}</p>
    <div className="experience-list">{site.experience.map((item, index) => <article className="experience-item" key={`${item.role.en}-${item.organisation}`} data-reveal>
      <span className="experience-index">{String(index + 1).padStart(2, '0')}</span><div><div className="experience-heading"><div><p className="experience-place">{item.organisation} · {item.location[lang]}</p><h2>{item.role[lang]}</h2></div><time className="experience-period">{item.period}</time></div><ul>{item.work[lang].map(task => <li key={task}>{task}</li>)}</ul></div>
    </article>)}</div><p className="quiet-note">{copy.experienceNote as string}</p></div>;
}

function ProjectsPage({ lang, copy }: { lang: Lang; copy: SiteData['pages'][Lang]['projects'] }) {
  return <div className="page-wrap"><PageHeading copy={copy} /><div className="project-grid all-projects">{site.projects.map((project, index) => <ProjectCard key={project.slug} project={project} lang={lang} index={index} />)}</div></div>;
}

function ProjectDetail({ lang, copy, slug }: { lang: Lang; copy: SiteData['pages'][Lang]['projects']; slug: string }) {
  const project = site.projects.find(item => item.slug === slug);
  if (!project) return <NotFound lang={lang} />;
  const index = site.projects.indexOf(project);
  const previous = site.projects[(index - 1 + site.projects.length) % site.projects.length];
  const next = site.projects[(index + 1) % site.projects.length];
  return <div className="page-wrap detail-wrap"><a className="back-link" href={routePath('projects', lang)}><ArrowLeft size={15} />{lang === 'en' ? 'All projects' : 'সব প্রকল্প'}</a>
    <PageHeading copy={{ title: project.metaTitle[lang], description: project.metaDescription[lang], eyebrow: `${copy.eyebrow} · ${project.category[lang]}`, headline: project.name, lede: project.summary[lang] }} />
    <div className="project-meta" data-reveal><div><span>{copy.roleLabel as string}</span><b>{project.role[lang]}</b></div><div><span>{copy.stateLabel as string}</span><b>{project.state[lang]}</b></div><div><span>{copy.stackLabel as string}</span><Stack items={project.stack.slice(0, 4)} label={copy.stackLabel as string} /></div></div>
    <div className="project-detail-layout">
      <div className="project-main">
        <section data-reveal><h2>{copy.overviewLabel as string}</h2><p>{project.overview[lang]}</p></section>
        <section data-reveal><h2>{copy.highlightsLabel as string}</h2><ul className="highlight-list">{project.highlights[lang].map(item => <li key={item}><Check size={15} aria-hidden="true" />{item}</li>)}</ul></section>
        <section className="project-evidence-block" data-reveal><h2>{copy.evidenceLabel as string}</h2><p>{project.evidence[lang]}</p></section>
        <div className="project-links" data-reveal>
          {project.website && <a className="button button-primary" href={project.website} target="_blank" rel="noopener noreferrer">{lang === 'en' ? 'Visit the website' : 'প্রজেক্টের ওয়েবসাইট'}<ArrowUpRight size={16} /></a>}
          <a className={project.website ? 'button button-quiet' : 'button button-primary'} href={project.url} target="_blank" rel="noopener noreferrer">{copy.repoLabel as string}<ArrowUpRight size={16} /></a>
          <a className="text-link" href={routePath('evidence', lang)}>{lang === 'en' ? 'Evidence and claim limits' : 'প্রমাণ ও দাবির সীমা'}<ArrowRight size={14} /></a>
        </div>
      </div>
      <aside className="project-aside" data-reveal>
        <p className="eyebrow"><span />{copy.statusLabel as string}</p>
        <p className="project-aside-boundary">{project.boundary[lang]}</p>
        <dl><div><dt>{copy.roleLabel as string}</dt><dd>{project.role[lang]}</dd></div><div><dt>{copy.stateLabel as string}</dt><dd>{project.state[lang]}</dd></div><div><dt>{copy.stackLabel as string}</dt><dd>{project.stack.slice(0, 6).join(' · ')}</dd></div></dl>
        <a className="text-link" href={project.url} target="_blank" rel="noopener noreferrer">{copy.repoLabelShort as string}<ArrowUpRight size={14} /></a>
      </aside>
    </div>
    <nav className="project-nav" aria-label={lang === 'en' ? 'More projects' : 'আরও প্রকল্প'}>
      <a href={routePath('project', lang, previous.slug)}><span>{lang === 'en' ? 'Previous' : 'আগের'}</span><b><ArrowLeft size={14} />{previous.name}</b></a>
      <a href={routePath('project', lang, next.slug)}><span>{lang === 'en' ? 'Next' : 'পরবর্তী'}</span><b>{next.name}<ArrowRight size={14} /></b></a>
    </nav>
  </div>;
}

function ResearchPage({ lang, copy }: { lang: Lang; copy: SiteData['pages'][Lang]['research'] }) {
  const data = site.research[lang];
  const groups = [
    { title: copy.verifiedTitle as string, items: data.verified, className: 'research-verified' },
    { title: copy.experimentalTitle as string, items: data.experimental, className: 'research-experimental' },
    { title: copy.plannedTitle as string, items: data.notClaimed, className: 'research-boundary' },
  ];
  return <div className="page-wrap"><PageHeading copy={copy} />
    <p className="page-summary" data-reveal>{copy.lastReviewed as string}</p>
    <p className="quiet-note" data-reveal>{copy.researchNote as string}</p>
    <div className="research-grid">{groups.map(group => <section className={`research-card ${group.className}`} key={group.title} data-reveal><h2>{group.title}</h2><ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul></section>)}</div>
    <a className="text-link evidence-research-link" href={routePath('evidence', lang)}>{lang === 'en' ? 'Read the evidence page' : 'প্রমাণের পৃষ্ঠা দেখুন'}<ArrowRight size={15} /></a>
  </div>;
}

function EvidencePage({ lang, copy }: { lang: Lang; copy: SiteData['pages'][Lang]['evidence'] }) {
  return <div className="page-wrap"><PageHeading copy={copy} />
    <p className="evidence-note" data-reveal>{copy.note as string}</p>
    <section className="evidence-how" data-reveal><h2>{copy.howTitle as string}</h2><ol>{(copy.how as string[]).map(item => <li key={item}>{item}</li>)}</ol></section>
    <div className="evidence-list">{site.projects.map((project, index) => <article className="evidence-entry" key={project.slug} data-reveal>
      <div className="evidence-entry-head"><span>{String(index + 1).padStart(2, '0')} · {project.category[lang]}</span><span>{project.state[lang]}</span></div>
      <h2>{project.name}</h2>
      <p>{project.evidence[lang]}</p>
      <div className="evidence-boundary"><strong>{copy.limitLabel as string}</strong><p>{project.boundary[lang]}</p></div>
      <a className="text-link" href={project.url} target="_blank" rel="noopener noreferrer">{copy.sourceLabel as string}<ArrowUpRight size={14} /></a>
    </article>)}</div>
    <a className="text-link evidence-research-link" href={routePath('research', lang)}>{copy.researchLink as string}<ArrowRight size={15} /></a>
  </div>;
}

function ContactPage({ lang, copy }: { lang: Lang; copy: SiteData['pages'][Lang]['contact'] }) {
  return <div className="page-wrap contact-page"><PageHeading copy={copy} />
    <p className="contact-lede" data-reveal>{copy.lede}</p>
    <div className="contact-grid" data-reveal>
      <a href={`mailto:${site.site.email}`}><span>{copy.emailLabel as string}</span><strong>{site.site.email}</strong><ArrowUpRight size={17} /></a>
      <a href={`tel:${site.site.phoneHref}`}><span>{copy.phoneLabel as string}</span><strong>{site.site.phone}</strong><ArrowUpRight size={17} /></a>
      <a href="https://t.me/soobujmiah" target="_blank" rel="noopener noreferrer"><span>{copy.telegramLabel as string}</span><strong>@soobujmiah</strong><ArrowUpRight size={17} /></a>
    </div>
    <div className="contact-detail-grid">
      <section className="contact-brief" data-reveal><h2>{copy.briefTitle as string}</h2><ol>{(copy.brief as string[]).map(item => <li key={item}>{item}</li>)}</ol></section>
      <aside className="contact-meta" data-reveal><div><span>{copy.responseLabel as string}</span><b>{copy.responseValue as string}</b></div><div><span>{lang === 'en' ? 'Time zone' : 'সময় অঞ্চল'}</span><b>{site.site.timezone[lang]}</b></div><div><span>{lang === 'en' ? 'Location' : 'অবস্থান'}</span><b>{site.site.location[lang]}</b></div></aside>
    </div>
    <div className="social-list" data-reveal>{site.site.social.filter(link => !['WhatsApp', 'Telegram'].includes(link.label)).map(link => <a href={link.href} target="_blank" rel="noopener noreferrer" key={link.label}>{link.label}<ArrowUpRight size={14} /></a>)}</div>
  </div>;
}

function NotFound({ lang }: { lang: Lang }) {
  return <div className="page-wrap not-found"><p className="eyebrow"><span />404 · {lang === 'en' ? 'PAGE NOT FOUND' : 'পেজ পাওয়া যায়নি'}</p><h1>{lang === 'en' ? 'This path has moved.' : 'এই ঠিকানাটি আর নেই।'}</h1><a className="button button-primary" href={routePath('home', lang)}>{lang === 'en' ? 'Return home' : 'হোমে ফিরুন'}<ArrowRight size={16} /></a></div>;
}

/** Reading order of the top-level pages. Detail pages keep their own prev/next nav. */
const pageOrder: Kind[] = ['home', 'about', 'services', 'projects', 'experience', 'research', 'evidence', 'contact'];

function nextPageFor(kind: Kind, lang: Lang) {
  const index = pageOrder.indexOf(kind);
  if (index < 0 || index >= pageOrder.length - 1) return null;
  const next = pageOrder[index + 1];
  const entry = navigation.find(item => item.key === next);
  const copy = site.pages[lang] as unknown as Record<string, { headline?: string }>;
  return {
    href: routePath(next, lang),
    label: next === 'home' ? (lang === 'en' ? 'Home' : 'হোম') : (entry?.label[lang] ?? next),
    title: next === 'home' ? site.site.name : (copy[next]?.headline ?? entry?.label[lang] ?? next),
    step: String(index + 2).padStart(2, '0'),
  };
}

/**
 * Bottom-of-page "continue" band. Scrolling past the end of a page — or
 * dragging up on the band — opens the next page in reading order, so the
 * sections read as one continuous scroll while every page keeps its own URL.
 */
function NextPage({ lang, kind }: { lang: Lang; kind: Kind }) {
  const next = nextPageFor(kind, lang);
  const href = next?.href;
  const [pull, setPull] = useState(0);
  const startY = useRef(0);

  useEffect(() => {
    if (!href) return;
    let accumulated = 0;
    let idle: number | undefined;
    const onWheel = (event: WheelEvent) => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight > 40;
      const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
      if (!scrollable || !atEnd || event.deltaY <= 0) { accumulated = 0; return; }
      accumulated += event.deltaY;
      window.clearTimeout(idle);
      idle = window.setTimeout(() => { accumulated = 0; }, 900);
      if (accumulated >= 420) { accumulated = 0; window.location.assign(href); }
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => { window.removeEventListener('wheel', onWheel); window.clearTimeout(idle); };
  }, [href]);

  if (!next || !href) return null;

  return <a
    className="next-page"
    href={next.href}
    aria-label={`${lang === 'en' ? 'Next page' : 'পরবর্তী পৃষ্ঠা'}: ${next.label}`}
    onTouchStart={event => { startY.current = event.touches[0]?.clientY ?? 0; }}
    onTouchMove={event => {
      const y = event.touches[0]?.clientY ?? 0;
      setPull(Math.max(0, Math.min(120, startY.current - y)));
    }}
    onTouchEnd={() => {
      if (pull >= 90) window.location.assign(next.href);
      setPull(0);
    }}
  >
    <span className="next-page-inner" data-reveal>
      <span className="next-page-step">{lang === 'en' ? 'NEXT' : 'পরবর্তী'} · {next.step}</span>
      <span className="next-page-body">
        <b>{next.title}</b>
        <em>{lang === 'en' ? 'Keep scrolling or tap to continue' : 'স্ক্রল করুন বা ট্যাপ করুন'}</em>
      </span>
      <span className="next-page-arrow"><ArrowRight size={22} aria-hidden="true" /></span>
      <span className="next-page-pull" style={{ transform: `scaleX(${Math.min(1, pull / 90)})` }} aria-hidden="true" />
    </span>
  </a>;
}

function App() {
  const route = useMemo(readRoute, []);
  const { lang, kind } = route;
  const locale = site.pages[lang];
  const homeCopy = locale.home;
  const meta = kind === 'service'
    ? (() => { const service = site.services.find(item => item.slug === route.slug); return service ? { title: `${service.title[lang]} — ${lang === 'en' ? 'Sobuj Miah' : 'সবুজ মিয়া'}`, description: service.summary[lang], keywords: service.keywords } : { title: '404 | Sobuj Miah', description: 'Page not found.' }; })()
    : kind === 'project'
      ? (() => { const project = site.projects.find(item => item.slug === route.slug); return project ? { title: project.metaTitle[lang], description: project.metaDescription[lang], keywords: project.keywords } : { title: '404 | Sobuj Miah', description: 'Page not found.' }; })()
      : { title: locale[kind].title, description: locale[kind].description, keywords: locale[kind].keywords };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dataset.locale = lang;
    document.title = meta.title;
    setMeta('meta[name="description"]', 'content', meta.description);
    setMeta('meta[name="keywords"]', 'content', meta.keywords?.join(', ') ?? site.site.keywords[lang].join(', '));
    setMeta('meta[property="og:title"]', 'content', meta.title);
    setMeta('meta[property="og:description"]', 'content', meta.description);
    setMeta('meta[property="og:url"]', 'content', `${site.site.url}${route.path}`);
    setMeta('meta[name="twitter:title"]', 'content', meta.title);
    setMeta('meta[name="twitter:description"]', 'content', meta.description);
    setMeta('link[rel="canonical"]', 'href', `${site.site.url}${route.path}`);
  }, [lang, meta, route.path]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (reduce || !('IntersectionObserver' in window)) {
      nodes.forEach(node => node.classList.add('is-visible'));
      return;
    }
    root.classList.add('reveal-ready');
    const observer = new IntersectionObserver(entries => {
      const entering = entries.filter(entry => entry.isIntersecting);
      entering.forEach((entry, order) => {
        (entry.target as HTMLElement).style.transitionDelay = `${Math.min(order * 70, 280)}ms`;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    nodes.forEach(node => observer.observe(node));
    return () => { observer.disconnect(); root.classList.remove('reveal-ready'); };
  }, []);

  useEffect(() => {
    // Card glow follows the cursor; the CSS falls back to the centre without this.
    const track = (event: PointerEvent) => {
      const card = (event.target as Element | null)?.closest?.('.service-card, .project-card') as HTMLElement | null;
      if (!card) return;
      const box = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${((event.clientX - box.left) / box.width) * 100}%`);
      card.style.setProperty('--my', `${((event.clientY - box.top) / box.height) * 100}%`);
    };
    window.addEventListener('pointermove', track, { passive: true });
    return () => window.removeEventListener('pointermove', track);
  }, []);

  useEffect(() => {
    const bar = document.querySelector<HTMLElement>('.scroll-progress');    if (!bar) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const limit = document.documentElement.scrollHeight - window.innerHeight;
      const progress = limit > 0 ? Math.min(1, Math.max(0, window.scrollY / limit)) : 0;
      bar.style.setProperty('--progress', progress.toFixed(4));
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  let content;
  if (kind === 'home') content = <HomePage lang={lang} copy={homeCopy} />;
  else if (kind === 'about') content = <div className="page-shell"><AboutPage lang={lang} copy={locale.about} /></div>;
  else if (kind === 'services') content = <div className="page-shell"><ServicesPage lang={lang} copy={locale.services} /></div>;
  else if (kind === 'service') content = <div className="page-shell"><ServiceDetail lang={lang} copy={locale.services} slug={route.slug ?? ''} /></div>;
  else if (kind === 'experience') content = <div className="page-shell"><ExperiencePage lang={lang} copy={locale.experience} /></div>;
  else if (kind === 'projects') content = <div className="page-shell"><ProjectsPage lang={lang} copy={locale.projects} /></div>;
  else if (kind === 'project') content = <div className="page-shell"><ProjectDetail lang={lang} copy={locale.projects} slug={route.slug ?? ''} /></div>;
  else if (kind === 'research') content = <div className="page-shell"><ResearchPage lang={lang} copy={locale.research} /></div>;
  else if (kind === 'evidence') content = <div className="page-shell"><EvidencePage lang={lang} copy={locale.evidence} /></div>;
  else if (kind === 'contact') content = <div className="page-shell"><ContactPage lang={lang} copy={locale.contact} /></div>;
  else content = <div className="page-shell"><NotFound lang={lang} /></div>;

  return <><a className="skip-link" href="#main">{lang === 'en' ? 'Skip to content' : 'মূল কনটেন্টে যান'}</a><span className="scroll-progress" aria-hidden="true" /><Header lang={lang} path={route.path} /><main id="main">{content}<NextPage lang={lang} kind={kind} /></main><Footer lang={lang} /></>;
}

export default App;
