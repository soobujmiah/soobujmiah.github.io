import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, BriefcaseBusiness, Code2,
  Cpu, Database, FlaskConical, FolderGit2, Globe2, Home, Mail, Monitor,
  PenTool, Smartphone, UserRound, Clock3, Moon, Sun,
} from 'lucide-react';
import rawSite from './data/site-content.json';

type Lang = 'en' | 'bn';
type Localized = Record<Lang, string>;
type Kind = 'home' | 'about' | 'services' | 'service' | 'experience' | 'projects' | 'project' | 'research' | 'contact';
interface PageText { title: string; description: string; eyebrow: string; headline: string; lede?: string; visualCaption?: string; [key: string]: string | string[] | undefined; }
interface SiteData {
  site: {
    name: string; url: string; email: string; phone: string; phoneHref: string;
    location: Localized; timezone: Localized;
    languages: Array<{ en: string; bn: string; levelEn: string; levelBn: string }>;
    social: Array<{ label: string; href: string }>;
  };
  pages: Record<Lang, Record<'home' | 'about' | 'services' | 'experience' | 'projects' | 'research' | 'contact', PageText>>;
  services: Array<{
    slug: string; icon: string; title: Localized; summary: Localized; detail: Localized;
    deliverables: Record<Lang, string[]>;
  }>;
  experience: Array<{ role: Localized; period: string; organisation: string; location: Localized; work: Record<Lang, string[]> }>;
  skills: Array<{ title: Localized; items: Record<Lang, string[]> }>;
  projects: Array<{ slug: string; name: string; category: Localized; summary: Localized; evidence?: Localized; boundary: Localized; url: string; state: string }>;
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
  const [light, setLight] = useState(() => document.documentElement.dataset.theme === 'light');
  const base = path.replace(/^\/bn(?=\/|$)/, '') || '/';
  const languagePath = lang === 'en' ? `/bn${base === '/' ? '/' : base}` : base;
  const icons: Record<string, typeof Home> = { about: UserRound, services: BriefcaseBusiness, projects: FolderGit2, experience: Clock3, research: FlaskConical, contact: Mail };
  const toggleTheme = () => {
    const next = !light;
    document.documentElement.dataset.theme = next ? 'light' : 'dark';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next ? '#fafaf9' : '#06070a');
    try { localStorage.setItem('sm-theme', next ? 'light' : 'dark'); } catch { /* storage can be disabled */ }
    setLight(next);
  };
  return <>
    <a className="dock-home" href={routePath('home', lang)} aria-label={lang === 'en' ? 'Sobuj Miah home' : 'সবুজ মিয়ার হোম'}><span className="wordmark-mark" aria-hidden="true"><i /><i /><i /></span></a>
    <header className="site-header">
      <nav id="primary-nav" className="primary-nav" aria-label={lang === 'en' ? 'Main navigation' : 'প্রধান নেভিগেশন'}>
        {navigation.map(item => { const Icon = icons[item.key]; return <a key={item.key} href={routePath(item.key, lang)} aria-label={item.label[lang]} title={item.label[lang]}><Icon size={18} strokeWidth={1.7} aria-hidden="true" /><span className="dock-tip">{item.label[lang]}</span></a>; })}
      </nav>
      <span className="dock-separator" aria-hidden="true" />
      <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={light ? (lang === 'en' ? 'Switch to dark theme' : 'ডার্ক থিম চালু করুন') : (lang === 'en' ? 'Switch to light theme' : 'লাইট থিম চালু করুন')} title={light ? 'Dark theme' : 'Light theme'}>{light ? <Moon size={16} /> : <Sun size={16} />}</button>
      <a className="language-switch" href={languagePath} lang={lang === 'en' ? 'bn' : 'en'} aria-label={lang === 'en' ? 'View this page in Bangla' : 'এই পৃষ্ঠাটি ইংরেজিতে দেখুন'}><Globe2 size={15} aria-hidden="true" /><span>{lang === 'en' ? 'বাংলা' : 'EN'}</span></a>
      <a className="nav-contact" href={routePath('contact', lang)} aria-label={lang === 'en' ? 'Contact Sobuj' : 'যোগাযোগ'} title={lang === 'en' ? 'Contact Sobuj' : 'যোগাযোগ'}><ArrowUpRight size={18} aria-hidden="true" /></a>
    </header>
  </>;
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
  const about = site.pages[lang].about;
  const contact = site.pages[lang].contact;
  const verified = site.research[lang].verified;
  const ticker = site.services.map(service => service.title[lang]);
  return <div className="source-home">
    <section className="hero source-hero" aria-labelledby="hero-title">
      <div className="hero-inner">
        <span className="tagline"><span className="pulse" />{lang === 'en' ? 'Available for freelance & remote work' : 'ফ্রিল্যান্স ও রিমোট কাজের জন্য উন্মুক্ত'}</span>
        <h1 className="source-name" id="hero-title"><span>{lang === 'en' ? 'Sobuj ' : 'সবুজ '}</span><span className="name-accent">{lang === 'en' ? 'Miah' : 'মিয়া'}</span></h1>
        <p className="source-role"><span aria-hidden="true">&gt;</span>{home.identity}<i aria-hidden="true" /></p>
        <p className="source-intro">{home.deck}</p>
        <div className="hero-actions"><a className="button button-primary" href={routePath('contact', lang)}>{lang === 'en' ? 'Start a project' : 'কাজ নিয়ে কথা বলুন'}<ArrowUpRight size={16} /></a><a className="button button-quiet" href={routePath('projects', lang)}>{lang === 'en' ? 'Explore my work' : 'আমার কাজ দেখুন'}<ArrowDown size={15} /></a></div>
        <div className="source-stats">
          <div><strong>8+</strong><span>{lang === 'en' ? 'Years · self-reported' : 'বছর · স্ব-প্রতিবেদিত'}</span></div>
          <div><strong>2</strong><span>{lang === 'en' ? 'Countries worked' : 'দেশে কাজের অভিজ্ঞতা'}</span></div>
          <div><strong>{site.site.languages.length}</strong><span>{lang === 'en' ? 'Languages' : 'টি ভাষা'}</span></div>
          <div><strong>{site.services.length}</strong><span>{lang === 'en' ? 'Practical services' : 'টি ব্যবহারিক সেবা'}</span></div>
        </div>
      </div>
      <span className="scroll-hint" aria-hidden="true">{lang === 'en' ? 'SCROLL TO EXPLORE' : 'আরও দেখতে স্ক্রল করুন'}<i /></span>
    </section>

    <div className="source-marquee" aria-label={lang === 'en' ? 'Services and capabilities' : 'সেবা ও দক্ষতা'}><div>{[...ticker, ...ticker].map((item, index) => <span key={`${item}-${index}`}>{item}<b>◆</b></span>)}</div></div>

    <section className="source-section" id="about" aria-labelledby="home-about-title">
      <div className="source-wrap">
        <SectionHeading number="01" label={lang === 'en' ? 'PROFILE' : 'পরিচিতি'} title={about.headline} lede={about.lede} id="home-about-title" />
        <div className="source-about-grid">
          <div className="source-prose">{(about.paragraphs as string[]).slice(0, 2).map(paragraph => <p key={paragraph}>{paragraph}</p>)}<a className="text-link" href={routePath('about', lang)}>{lang === 'en' ? 'Full profile' : 'সম্পূর্ণ পরিচিতি'}<ArrowRight size={15} /></a></div>
          <div className="source-side">
            <aside className="quick-facts"><h3>{lang === 'en' ? 'QUICK FACTS' : 'সংক্ষেপে'}</h3><dl>
              <div><dt>{lang === 'en' ? 'Location' : 'অবস্থান'}</dt><dd>{site.site.location[lang]}</dd></div>
              <div><dt>{lang === 'en' ? 'Timezone' : 'সময় অঞ্চল'}</dt><dd>{site.site.timezone[lang]}</dd></div>
              <div><dt>{about.educationLabel as string}</dt><dd>{about.educationValue as string}</dd></div>
              <div><dt>{lang === 'en' ? 'Availability' : 'কাজের সুযোগ'}</dt><dd>{about.availabilityValue as string}</dd></div>
            </dl></aside>
            <div className="terminal-card" aria-label={lang === 'en' ? 'Verified profile and technology summary' : 'যাচাইকৃত পরিচিতি ও প্রযুক্তির সারাংশ'}>
              <div className="terminal-bar"><i /><i /><i /><span>sobuj@portfolio: ~/work</span></div>
              <div className="terminal-body">
                <p><b>$</b> whoami --summary</p><p><span>Role</span> {lang === 'en' ? 'Office admin · systems builder' : 'অফিস প্রশাসন · সিস্টেম নির্মাতা'}</p><p><span>Base</span> {site.site.location[lang]}</p><p><span>Languages</span> EN · BN · HI · UR · AR</p>
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
        <div className="service-accordion">{site.services.slice(0, 3).map((service, index) => <details className="service-disclosure" key={service.slug}>
          <summary><span className="disclosure-number">{String(index + 1).padStart(2, '0')}</span><span className="disclosure-title">{service.title[lang]}</span><span className="disclosure-plus" aria-hidden="true" /></summary>
          <div className="disclosure-body"><p>{service.detail[lang]}</p><div className="source-tags">{service.deliverables[lang].map(item => <span key={item}>{item}</span>)}</div><a href={routePath('service', lang, service.slug)} className="text-link">{lang === 'en' ? 'Service details' : 'সেবার বিবরণ'}<ArrowRight size={14} /></a></div>
        </details>)}</div>
        <a className="section-link" href={routePath('services', lang)}>{lang === 'en' ? 'Open services page' : 'সব সেবা দেখুন'}<ArrowUpRight size={14} /></a>
      </div>
    </section>

    <section className="source-section source-section-alt" id="work" aria-labelledby="home-projects-title">
      <div className="source-wrap">
        <SectionHeading number="03" label={lang === 'en' ? 'PROJECTS' : 'প্রকল্প'} title={home.selectedTitle as string} lede={home.selectedIntro as string} id="home-projects-title" />
        <div className="source-project-grid">{site.projects.slice(0, 3).map((project, index) => <article className="source-project" key={project.slug}>
          <div className="source-project-top"><span>{String(index + 1).padStart(2, '0')} / {project.category[lang]}</span><span>{project.state}</span></div>
          <h3>{project.name}</h3><p>{project.summary[lang]}</p>{project.evidence && <p className="project-evidence">{project.evidence[lang]}</p>}<p className="project-limit"><b>{lang === 'en' ? 'BOUNDARY' : 'সীমা'}</b>{project.boundary[lang]}</p>
          <div className="source-project-links"><a href={routePath('project', lang, project.slug)}>{lang === 'en' ? 'Details' : 'বিস্তারিত'}<ArrowRight size={14} /></a><a href={project.url} target="_blank" rel="noopener noreferrer">GitHub<ArrowUpRight size={14} /></a></div>
        </article>)}</div>
      </div>
    </section>
    <section className="source-section source-contact" id="contact" aria-labelledby="home-contact-title">
      <div className="source-wrap"><SectionHeading number="04" label={lang === 'en' ? 'CONTACT' : 'যোগাযোগ'} title={contact.headline} lede={contact.lede} id="home-contact-title" />
        <div className="source-contact-links"><a href={`mailto:${site.site.email}`}><span>{contact.emailLabel as string}</span><b>{site.site.email}</b><ArrowUpRight size={17} /></a><a href={`tel:${site.site.phoneHref}`}><span>{contact.phoneLabel as string}</span><b>{site.site.phone}</b><ArrowUpRight size={17} /></a><a href="https://t.me/soobujmiah" target="_blank" rel="noopener noreferrer"><span>Telegram</span><b>@soobujmiah</b><ArrowUpRight size={17} /></a></div>
        <div className="source-socials">{site.site.social.map(item => <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer">{item.label}<ArrowUpRight size={13} /></a>)}</div>
      </div>
    </section>
  </div>;
}

function SectionHeading({ number, label, title, lede, id }: { number: string; label: string; title: string; lede?: string; id: string }) {
  const [first, ...rest] = title.split(/(?<=\s)/);
  return <header className="source-section-heading"><p className="source-eyebrow">{number} — {label}</p><h2 id={id}>{first}<em>{rest.join('')}</em></h2>{lede && <p>{lede}</p>}</header>;
}

function AboutPage({ lang, copy }: { lang: Lang; copy: SiteData['pages'][Lang]['about'] }) {
  const c = copy;
  return <div className="page-wrap"><PageHeading copy={c} />
    <section className="about-layout"><div className="prose">{(c.paragraphs as string[]).map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
      <aside className="profile-aside"><p className="eyebrow"><span />{c.factsTitle as string}</p><dl>
        <div><dt>{lang === 'en' ? 'Based in' : 'অবস্থান'}</dt><dd>{site.site.location[lang]}</dd></div>
        <div><dt>{lang === 'en' ? 'Time zone' : 'সময় অঞ্চল'}</dt><dd>{site.site.timezone[lang]}</dd></div>
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
    <span className="experience-index">0{index + 1}</span><div><div className="experience-heading"><div><p className="experience-place">{item.organisation} · {item.location[lang]}</p><h2>{item.role[lang]}</h2></div><time className="experience-period">{item.period}</time></div><ul>{item.work[lang].map(task => <li key={task}>{task}</li>)}</ul></div>
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
    <div className="project-detail-box">{project.evidence && <><p className="eyebrow"><span />{lang === 'en' ? 'ENGINEERING EVIDENCE' : 'প্রকৌশলগত প্রমাণ'}</p><p>{project.evidence[lang]}</p></>}<p className="eyebrow"><span />{copy.statusLabel as string}</p><p>{project.boundary[lang]}</p><a className="button button-primary" href={project.url} target="_blank" rel="noopener noreferrer">{copy.repoLabel as string}<ArrowUpRight size={16} /></a></div>
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
