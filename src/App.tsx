import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, ChevronDown, Cpu,
  ExternalLink, Eye, GitBranch, Languages, Mail, Menu, Monitor, Pause, Play, Radio,
  RotateCcw, ShieldCheck, Smartphone, Terminal, X,
} from 'lucide-react';
import { copy, navItems, processSteps, projects, services, type Language, type Project, type Station } from './data/content';
import type { LabScene, SceneConfig } from './scene/LabScene';

interface RouteState { station: Station; project: string | null; }
type RenderMode = '3d' | 'schematic';

const validStations = new Set(navItems.map(item => item.id));
function readRoute(): RouteState {
  const params = new URLSearchParams(window.location.search);
  const segments = window.location.pathname.split('/').filter(Boolean);
  const pathStation = segments[0] as Station | undefined;
  const queryStation = params.get('station') as Station | null;
  const station = pathStation && validStations.has(pathStation) ? pathStation : queryStation;
  const pathProject = station === 'work' ? segments[1] : null;
  const project = pathProject ?? params.get('project');
  return {
    station: station && validStations.has(station) ? station : 'home',
    project: project && projects.some(item => item.id === project) ? project : null,
  };
}

function routePath(station: Station, project: string | null = null) {
  if (station === 'home' && !project) return '/';
  return `/${station}/${project ? `${project}/` : ''}`;
}

function idle(callback: () => void) {
  const win = window as Window & {
    requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (win.requestIdleCallback) {
    const id = win.requestIdleCallback(callback, { timeout: 1400 });
    return () => win.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(callback, 160);
  return () => window.clearTimeout(id);
}

function StatusPill({ kind, label }: { kind: Project['status']; label: string }) {
  return <span className={`status-pill status-${kind}`}><span className="status-dot" />{label}</span>;
}

function Schematic({ station, project, language }: { station: Station; project: string | null; language: Language }) {
  const selected = project ? projects.find(item => item.id === project) : null;
  const stationLabel = navItems.find(item => item.id === station)?.label[language] ?? station;
  return (
    <div className={`schematic schematic-${station}`} aria-hidden="true">
      <div className="schematic-grid" />
      <svg className="schematic-svg" viewBox="0 0 780 420" role="presentation">
        <defs>
          <linearGradient id="wire" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#22c55e" stopOpacity=".78"/><stop offset="1" stopColor="#22c55e" stopOpacity=".06"/></linearGradient>
          <radialGradient id="die"><stop stopColor="#173126"/><stop offset="1" stopColor="#08100d"/></radialGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <path d="M76 210H195L240 165H310M704 210H585L540 165H470M195 210L248 263H310M585 210L532 263H470M390 55V132M390 288V365" fill="none" stroke="url(#wire)" strokeWidth="2" />
        <path d="M85 142V278M696 142V278M246 52H534M246 369H534" fill="none" stroke="#34423b" strokeWidth="1" strokeDasharray="5 8" />
        <rect x="310" y="115" width="160" height="182" rx="22" fill="url(#die)" stroke="#46544c" strokeWidth="2" />
        <rect x="328" y="135" width="124" height="143" rx="14" fill="#050807" stroke="#22c55e" strokeOpacity=".56" />
        <path d="M350 176H430M350 192H414M350 208H426" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" opacity=".75" />
        <circle cx="390" cy="250" r="5" fill="#22c55e" filter="url(#glow)" />
        {[['T',100,210],['X',680,210],['A',250,90],['L',530,90],['G',250,330],['S',530,330]].map(([label,x,y])=> (
          <g key={label as string} transform={`translate(${x} ${y})`}>
            <circle r="27" fill="#0b100e" stroke={selected && selected.id === ({T:'ternux',X:'ternuxx',A:'adt',L:'lai',G:'ggen',S:'songjog'} as Record<string,string>)[label as string] ? '#4ade80' : '#314039'} strokeWidth="2" />
            <text textAnchor="middle" dominantBaseline="central" fill="#dce8df" fontFamily="monospace" fontSize="16">{label}</text>
          </g>
        ))}
      </svg>
      <div className="schematic-caption"><span className="caption-dot" />{selected ? selected.name : station === 'home' ? 'POCKET WORKSTATION / SPATIAL MAP' : `${stationLabel.toUpperCase()} / WORKBENCH`}</div>
      <span className="schematic-coord coord-one">ARM64 · ANDROID FIRST</span><span className="schematic-coord coord-two">SIGNAL PATH · EVIDENCE LEDGER</span>
    </div>
  );
}

function ScenePanel({ config, renderMode, language, onFailure, onReady, onAction }: { config: SceneConfig; renderMode: RenderMode; language: Language; onFailure: () => void; onReady: (instance: LabScene) => void; onAction: (station: Station, project: string | null) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const latest = useRef(config);
  const instanceRef = useRef<LabScene | null>(null);
  latest.current = config;

  useEffect(() => {
    if (renderMode !== '3d' || !host.current || instanceRef.current) return;
    let cancelled = false;
    const cancelIdle = idle(async () => {
      try {
        const module = await import('./scene/LabScene');
        if (cancelled || !host.current) return;
        const scene = new module.LabScene(host.current, latest.current, () => onFailure(), onAction);
        instanceRef.current = scene;
        setReady(true);
        onReady(scene);
      } catch {
        if (!cancelled) onFailure();
      }
    });
    return () => {
      cancelled = true;
      cancelIdle();
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };
  }, [renderMode, onFailure, onReady, onAction]);

  useEffect(() => { instanceRef.current?.update(config); }, [config]);
  return <div className={`scene-host ${ready ? 'scene-ready' : ''}`} ref={host} aria-hidden="true"><Schematic station={config.view} project={config.project} language={language} /></div>;
}

function App() {
  const [route, setRoute] = useState<RouteState>(readRoute);
  const previousRoute = useRef(route);
  const [language, setLanguage] = useState<Language>(() => {
    try { return localStorage.getItem('pocket-lab-language') === 'bn' ? 'bn' : 'en'; } catch { return 'en'; }
  });
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [mode, setMode] = useState<RenderMode>('3d');
  const [paused, setPaused] = useState(false);
  const [scene, setScene] = useState<LabScene | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = copy[language];
  const activeProject = route.project ? projects.find(project => project.id === route.project) ?? null : null;
  const sceneConfig: SceneConfig = useMemo(() => ({ view: route.station, project: route.project, language, paused, reducedMotion }), [route.station, route.project, language, paused, reducedMotion]);
  const setSceneRef = useCallback((instance: LabScene) => setScene(instance), []);
  const failScene = useCallback(() => { setWebglFailed(true); setMode('schematic'); setScene(null); }, []);
  const sceneRequested = mode === '3d' && !webglFailed;
  const use3D = sceneRequested && scene !== null;

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.language = language;
    const homeTitle = language === 'bn'
      ? 'সবুজ মিয়া — স্বতন্ত্র সফটওয়্যার ও এআই সিস্টেম নির্মাতা | পকেট সিস্টেমস ল্যাব'
      : 'Sobuj Miah — Independent Software & AI Systems Builder | The Pocket Systems Lab';
    const sectionName = navItems.find(item => item.id === route.station)?.label[language] ?? 'Lab';
    const pageTitle = route.station === 'home' ? homeTitle : `${sectionName} — Sobuj Miah | The Pocket Systems Lab`;
    const description = language === 'bn'
      ? 'হাতের মুঠোয় শুরু হয় এই কর্মশালা। অ্যান্ড্রয়েড-প্রথম সিস্টেম ল্যাব থেকে ব্যবহারিক সফটওয়্যার, ARM64 Android/Linux toolchain, লোকাল AI ও কাজের workflow তৈরি করেন সবুজ মিয়া।'
      : 'The workshop begins in your hand. Sobuj Miah builds practical software, ARM64 Android/Linux toolchains, on-device AI runtimes, and bilingual workflows from an Android-first systems lab in Dhaka, Bangladesh.';
    document.title = pageTitle;
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) descriptionMeta.setAttribute('content', description);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', pageTitle);
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute('content', description);
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', pageTitle);
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) twitterDescription.setAttribute('content', description);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', `https://soobujmiah.github.io${routePath(route.station, route.project)}`);
    try { localStorage.setItem('pocket-lab-language', language); } catch { /* storage is optional */ }
  }, [language, route]);

  const activeStationRef = useRef(route.station);
  const scrollDrivenRef = useRef(false);

  useEffect(() => {
    const initial = readRoute();
    if (initial.station !== 'home') {
      requestAnimationFrame(() => document.getElementById(`station-${initial.station}`)?.scrollIntoView({ block: 'start' }));
    }
    const handlePop = () => {
      const next = readRoute();
      activeStationRef.current = next.station;
      setRoute(next);
      requestAnimationFrame(() => document.getElementById(`station-${next.station}`)?.scrollIntoView({ block: 'start' }));
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-story-station]'));
    let frame = 0;
    const updateActiveStation = () => {
      frame = 0;
      const marker = Math.min(window.innerHeight * 0.52, window.innerHeight - 90);
      const current = sections.find(section => {
        const rect = section.getBoundingClientRect();
        return rect.top <= marker && rect.bottom > marker;
      });
      const station = current?.dataset.storyStation as Station | undefined;
      if (!station || activeStationRef.current === station) return;
      activeStationRef.current = station;
      scrollDrivenRef.current = true;
      setRoute({ station, project: null });
      window.history.replaceState({ pocketLab: true, scrollDriven: true }, '', `${routePath(station)}${window.location.hash}`);
    };
    const scheduleUpdate = () => { if (!frame) frame = requestAnimationFrame(updateActiveStation); };
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    scheduleUpdate();
    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const previous = previousRoute.current;
    previousRoute.current = route;
    if (previous.station === route.station && previous.project === route.project) return;
    if (scrollDrivenRef.current) { scrollDrivenRef.current = false; return; }
    const frame = requestAnimationFrame(() => document.getElementById(`station-heading-${route.station}`)?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [route]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (mobileMenuOpen) setMobileMenuOpen(false);
        else if (route.project) navigate(route.station, null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileMenuOpen, route]);

  const navigate = useCallback((station: Station, project: string | null = null, replace = false) => {
    const next: RouteState = { station, project };
    activeStationRef.current = station;
    const url = `${routePath(station, project)}${window.location.hash}`;
    window.history[replace ? 'replaceState' : 'pushState']({ ...next, pocketLab: true }, '', url);
    setRoute(next);
    setMobileMenuOpen(false);
    requestAnimationFrame(() => document.getElementById(`station-${station}`)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' }));
  }, [reducedMotion]);
  const handleSceneAction = useCallback((station: Station, project: string | null) => navigate(station, project), [navigate]);

  useEffect(() => {
    const handleMotion = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
      if (event.matches) { setMode('schematic'); setPaused(true); scene?.setReducedMotion(true); }
      else { setPaused(false); }
    };
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    query.addEventListener('change', handleMotion);
    return () => query.removeEventListener('change', handleMotion);
  }, [scene]);

  useEffect(() => { scene?.update(sceneConfig); }, [route, paused, reducedMotion, scene]);

  const toggleLanguage = () => setLanguage(value => value === 'en' ? 'bn' : 'en');
  const toggleRenderMode = () => {
    if (webglFailed) {
      setWebglFailed(false);
      setMode('3d');
      setPaused(reducedMotion);
      return;
    }
    if (mode === '3d') { setMode('schematic'); setScene(null); }
    else { setMode('3d'); setPaused(reducedMotion); }
  };
  const togglePause = () => {
    const next = !paused;
    setPaused(next);
    scene?.setPaused(next);
  };
  const goExplore = () => navigate('work');
  const startConversation = () => navigate('contact');

  return (
    <div className={`app-shell lang-${language} ${mode === 'schematic' ? 'mode-schematic' : ''}`} data-world-mode={use3D ? '3d' : 'fallback'}>
      <div className="world-backdrop" aria-hidden="true" />
      <div className="world-viewport" aria-hidden="true">
        {sceneRequested ? <ScenePanel config={sceneConfig} renderMode={mode} language={language} onFailure={failScene} onReady={setSceneRef} onAction={handleSceneAction} /> : <Schematic station={route.station} project={route.project} language={language} />}
        <div className="world-vignette" />
        <div className="world-label world-label-left"><span>PSL / 01</span><i />{activeProject?.name ?? 'POCKET SYSTEMS'}</div>
        <div className="world-label world-label-right">{t.scene} {navItems.find(item => item.id === route.station)?.number ?? '00'}</div>
      </div>

      <header className="topbar">
        <button className="brand-lockup" type="button" onClick={() => navigate('home')} aria-label={language === 'en' ? 'Return to Pocket Systems Lab' : 'পকেট সিস্টেমস ল্যাবে ফিরুন'}>
          <span className="brand-mark"><Smartphone size={17} strokeWidth={1.65} /><span /></span>
          <span className="brand-words"><strong>SOBUJ MIAH</strong><small>POCKET SYSTEMS LAB</small></span>
        </button>
        <nav className={`main-nav ${mobileMenuOpen ? 'nav-open' : ''}`} aria-label={language === 'en' ? 'Main navigation' : 'মূল নেভিগেশন'}>
          {navItems.map(item => (
            <button key={item.id} type="button" className={`nav-link ${route.station === item.id ? 'is-active' : ''}`} aria-current={route.station === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}>
              <span className="nav-index">{item.number}</span>{item.label[language]}
            </button>
          ))}
        </nav>
        <div className="topbar-actions">
          <button className="lang-switch" onClick={toggleLanguage} type="button" aria-label={`${t.language}: ${language === 'en' ? 'বাংলা' : 'English'}`} title={t.language}>
            <Languages size={15} /><span>{language === 'en' ? 'EN' : 'বাংলা'}</span>
          </button>
          <button className="menu-trigger icon-button" onClick={() => setMobileMenuOpen(value => !value)} type="button" aria-label={t.openMenu} aria-expanded={mobileMenuOpen}>
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {(webglFailed || reducedMotion) && <p className="mode-notice" role="status">{webglFailed ? t.notWebgl : t.reduced}</p>}
      <div className="scene-meta" aria-label={`${t.environment} · ${t.scene} ${navItems.find(item => item.id === route.station)?.number}`}>
        <span className="live-indicator"><i />{t.environment}</span>
        <span className="meta-separator" />
        <span>{t.wayfinding} <b>{navItems.find(item => item.id === route.station)?.number}</b></span>
      </div>

      <main className="story-scroll">
        {navItems.map(item => {
          const showProject = item.id === 'work' && route.station === 'work' ? activeProject : null;
          return <section id={`station-${item.id}`} data-story-station={item.id} className={`story-stop story-${item.id}`} key={item.id} aria-label={item.label[language]}>
            <div className={`content-panel content-${item.id} ${showProject ? 'has-project' : ''}`} key={`${item.id}-${showProject?.id ?? 'index'}`}>
              {item.id === 'home' && <HomeView language={language} t={t} onExplore={goExplore} onContact={startConversation} />}
              {item.id === 'work' && <WorkView language={language} t={t} project={showProject} onSelect={id => navigate('work', id)} onBack={() => navigate('home')} onNext={() => {
                const index = showProject ? projects.findIndex(project => project.id === showProject.id) : 0;
                navigate('work', projects[(index + 1) % projects.length].id);
              }} />}
              {item.id === 'process' && <ProcessView language={language} t={t} />}
              {item.id === 'services' && <ServicesView language={language} t={t} onContact={startConversation} />}
              {item.id === 'about' && <AboutView language={language} t={t} />}
              {item.id === 'notes' && <NotesView language={language} t={t} />}
              {item.id === 'contact' && <ContactView language={language} t={t} />}
            </div>
          </section>;
        })}
      </main>

      <div className="bottom-controls">
        <div className="bottom-status"><span className={`mode-led ${use3D ? 'mode-led-live' : ''}`} />{language === 'en' ? (use3D ? 'WEBGL / ACTIVE' : 'SCHEMATIC / READY') : (use3D ? 'WEBGL / চালু' : '২ডি নকশা / প্রস্তুত')}</div>
        <div className="control-group">
          {!reducedMotion && <button className="control-button" type="button" onClick={togglePause} aria-label={paused ? t.resume : t.pause} title={paused ? t.resume : t.pause}>{paused ? <Play size={15} /> : <Pause size={15} />}<span>{paused ? t.resume : t.pause}</span></button>}
          <button className={`control-button ${mode === 'schematic' ? 'control-active' : ''}`} type="button" onClick={toggleRenderMode} aria-pressed={mode === 'schematic'} aria-label={webglFailed ? t.retry3D : t.fallback} title={webglFailed ? t.retry3D : t.fallback}><Monitor size={15} /><span>{webglFailed ? t.retry3D : t.fallback}</span></button>
          <span className="quality-label"><span className="quality-bars"><i /><i /><i /></span>{language === 'en' ? (use3D ? 'ADAPTIVE' : 'LOW POWER') : (use3D ? 'মানিয়ে নেওয়া' : 'কম শক্তি')}</span>
        </div>
      </div>

      <footer className="page-footer">
        <span>© 2026 SOBUJ MIAH · {t.footer}</span>
        <a href="https://github.com/soobujmiah" target="_blank" rel="noreferrer">GITHUB <ArrowUpRight size={12} /></a>
      </footer>
    </div>
  );
}

function HomeView({ language, t, onExplore, onContact }: { language: Language; t: typeof copy.en | typeof copy.bn; onExplore: () => void; onContact: () => void }) {
  return (
    <div className="hero-view">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-line" />{t.eyebrow}</div>
        <h1 id="station-heading-home" tabIndex={-1} className="hero-title">{language === 'en' ? <>The workshop<br /><em>begins in your hand.</em></> : <>হাতের মুঠোয়<br /><em>শুরু হয় এই কর্মশালা।</em></>}</h1>
        <p className="hero-name">Sobuj Miah <span>· {t.role}</span></p>
        <p className="hero-support">{t.support}</p>
        <div className="hero-actions">
          <button className="button-primary" type="button" onClick={onExplore}>{t.explore}<ArrowRight size={16} /></button>
          <button className="button-quiet" type="button" onClick={onContact}><Radio size={15} />{t.conversation}</button>
        </div>
      </div>
      <div className="hero-side-note"><span className="side-note-rule" /><span>ANDROID-FIRST<br />SYSTEMS BUILDER</span><span className="side-note-index">PSL—01</span></div>
      <div className="hero-floor-label"><span>01 / 07</span><span>SCROLL OR CHOOSE A STATION</span><ArrowDownRight size={14} /></div>
    </div>
  );
}

function WorkView({ language, t, project, onSelect, onBack, onNext }: { language: Language; t: typeof copy.en | typeof copy.bn; project: Project | null; onSelect: (id: string) => void; onBack: () => void; onNext: () => void }) {
  const [expanded, setExpanded] = useState<'purpose'|'built'|'verified'|'limits'>('purpose');
  useEffect(() => setExpanded('purpose'), [project?.id]);
  if (project) {
    const sections = [
      { id: 'purpose' as const, title: t.purpose, content: <p>{project.problem[language]}</p> },
      { id: 'built' as const, title: t.built, content: <ul>{project.built[language].map(text => <li key={text}>{text}</li>)}</ul> },
      { id: 'verified' as const, title: t.evidence, content: <ul>{project.verified[language].map(text => <li key={text}>{text}</li>)}</ul> },
      { id: 'limits' as const, title: t.limits, content: <ul>{project.limits[language].map(text => <li key={text}>{text}</li>)}</ul> },
    ];
    return (
      <div className="project-detail-view">
        <div className="detail-toolbar"><button className="back-link" type="button" onClick={onBack}><ArrowLeft size={15} />{t.back}</button><span className="detail-path">{language === 'en' ? 'WORK' : 'কাজ'} / {project.id.toUpperCase()}</span></div>
        <div className="project-detail-heading">
          <div><div className="eyebrow"><span className="eyebrow-line" />{language === 'en' ? 'PROJECT STATION' : 'প্রকল্প স্টেশন'}</div><h1 id="station-heading-work" tabIndex={-1} className="section-title">{project.name}<span className="title-period">.</span></h1><p className="project-strapline">{project.strapline[language]}</p></div>
          <StatusPill kind={project.status} label={t[project.status]} />
        </div>
        <div className="detail-status-note"><ShieldCheck size={14} />{t[project.status === 'verified' ? 'statusVerified' : project.status === 'experimental' ? 'statusExperimental' : 'statusBoundary']}</div>
        <div className="detail-sections">
          {sections.map(section => <div className={`detail-section ${expanded === section.id ? 'detail-section-open' : ''}`} key={section.id}>
            <button className="detail-section-button" type="button" aria-expanded={expanded === section.id} onClick={() => setExpanded(current => current === section.id ? 'purpose' : section.id)}><span>{section.title}</span><ChevronDown size={15} /></button>
            {expanded === section.id && <div className="detail-section-content">{section.content}</div>}
          </div>)}
        </div>
        <div className="detail-links">
          <a href={project.repo} target="_blank" rel="noreferrer"><GitBranch size={14} />{t.source}<ExternalLink size={12} /></a>
          {project.demo && <a href={project.demo} target="_blank" rel="noreferrer"><Eye size={14} />{t.liveDocs}<ExternalLink size={12} /></a>}
          {project.release && <a href={project.release} target="_blank" rel="noreferrer"><ArrowDownRight size={14} />{t.releases}<ExternalLink size={12} /></a>}
        </div>
        <div className="detail-next-row"><span>STATION / {String(projects.findIndex(item => item.id === project.id) + 1).padStart(2, '0')}</span><button type="button" className="next-project" onClick={onNext}>{t.alternate}<ArrowRight size={15} /></button></div>
      </div>
    );
  }
  return (
    <div className="work-index-view">
      <div className="eyebrow"><span className="eyebrow-line" />{t.work} / 01</div>
      <div className="section-heading-row"><h1 id="station-heading-work" tabIndex={-1} className="section-title">{t.projects}<span className="title-period">.</span></h1><span className="heading-mark"><Cpu size={16} />{language === 'en' ? 'SOURCE-GROUNDED' : 'তথ্যসূত্র-ভিত্তিক'}</span></div>
      <p className="section-intro">{t.projectsIntro}</p>
      <div className="project-list" aria-label={t.selectProject}>
        {projects.map((item, index) => <button className="project-row" type="button" key={item.id} onClick={() => onSelect(item.id)}>
          <span className="project-row-index">0{index + 1}</span><span className={`project-token token-${item.id}`}><span className="token-core">{item.name.slice(0, 1)}</span><span className="token-orbit" /></span>
          <span className="project-row-copy"><strong>{item.name}</strong><small>{item.strapline[language]}</small></span><span className="project-row-status"><i className={`status-dot dot-${item.status}`} />{t[item.status]}</span><ArrowUpRight className="project-row-arrow" size={17} />
        </button>)}
      </div>
      <p className="list-footnote"><ShieldCheck size={13} />{language === 'en' ? 'Private repositories and unapproved project material are not shown.' : 'ব্যক্তিগত repository ও অনুমোদনহীন প্রকল্পের তথ্য এখানে দেখানো হয়নি।'}</p>
    </div>
  );
}

function ProcessView({ language, t }: { language: Language; t: typeof copy.en | typeof copy.bn }) {
  const [activeStep, setActiveStep] = useState(0);
  return <div className="section-view">
    <div className="eyebrow"><span className="eyebrow-line" />{language === 'en' ? 'WORKFLOW / 02' : 'কাজের ধারা / ০২'}</div>
    <h1 id="station-heading-process" tabIndex={-1} className="section-title">{t.processTitle}<span className="title-period">.</span></h1>
    <p className="section-intro">{t.processIntro}</p>
    <div className="process-layout">
      <div className="process-rail" role="tablist" aria-label={t.processTitle}>
        {processSteps.map((step, index) => <button role="tab" aria-selected={activeStep === index} className={`process-step ${activeStep === index ? 'step-active' : ''} ${step.color === 'amber' ? 'step-amber' : ''}`} key={step.id} onClick={() => setActiveStep(index)} type="button"><span className="process-index">0{index + 1}</span><span className="process-glyph">{step.icon}</span><span className="process-name">{language === 'en' ? step.en : step.bn}</span><span className="process-node" /></button>)}
      </div>
      <div className={`process-detail detail-${processSteps[activeStep].color}`} role="tabpanel" aria-live="polite">
        <span className="process-detail-index">STEP / 0{activeStep + 1}</span><span className="process-detail-icon">{processSteps[activeStep].icon}</span>
        <h2>{language === 'en' ? processSteps[activeStep].en : processSteps[activeStep].bn}</h2>
        <p>{language === 'en' ? processSteps[activeStep].detailEn : processSteps[activeStep].detailBn}</p>
        <div className="process-current"><span /><span>{language === 'en' ? 'EVIDENCE LOOP' : 'প্রমাণের চক্র'}</span><RotateCcw size={14} /></div>
      </div>
    </div>
    <p className="process-note"><span className="status-dot dot-experimental" />{language === 'en' ? 'Project-specific tools, build authority, and device acceptance differ. This is a working principle—not a live process monitor.' : 'প্রকল্পভেদে tool, build authority ও device acceptance আলাদা। এটি কাজের নীতি—live process monitor নয়।'}</p>
  </div>;
}

function ServicesView({ language, t, onContact }: { language: Language; t: typeof copy.en | typeof copy.bn; onContact: () => void }) {
  return <div className="section-view">
    <div className="eyebrow"><span className="eyebrow-line" />{language === 'en' ? 'TOOL STATION / 03' : 'টুল স্টেশন / ০৩'}</div>
    <h1 id="station-heading-services" tabIndex={-1} className="section-title">{t.servicesTitle}<span className="title-period">.</span></h1>
    <p className="section-intro">{t.servicesIntro}</p>
    <div className="service-bench">
      {services.map((service, index) => <article className="service-tool" key={service.id}>
        <span className="service-index">0{index + 1} / TOOL</span><span className="service-icon">{service.icon}</span><h2>{service.title[language]}</h2><p>{service.body[language]}</p><span className="service-endline" />
      </article>)}
    </div>
    <button className="button-primary service-contact" onClick={onContact} type="button">{t.conversation}<ArrowRight size={15} /></button>
  </div>;
}

function AboutView({ language, t }: { language: Language; t: typeof copy.en | typeof copy.bn }) {
  return <div className="section-view about-view">
    <div className="eyebrow"><span className="eyebrow-line" />{language === 'en' ? 'FIELD NOTEBOOK / 04' : 'কাজের নোটবই / ০৪'}</div>
    <h1 id="station-heading-about" tabIndex={-1} className="section-title">{t.aboutTitle}<span className="title-period">.</span></h1>
    <p className="about-lede">{t.aboutIntro}</p>
    <div className="about-columns">
      <div className="notebook-card">
        <div className="notebook-top"><BookOpen size={15} /><span>NOTE / 01</span><span className="notebook-dot" /></div>
        <p className="notebook-quote">{language === 'en' ? '“Document everything, verify before reporting, own the outcome.”' : '“সব নথিবদ্ধ করো, রিপোর্টের আগে যাচাই করো, ফলাফলের দায় নাও।”'}</p>
        <div className="notebook-signature">S. MIAH <span>· SAVAR / DHAKA</span></div>
        <div className="notebook-lines" />
      </div>
      <div className="principles-panel"><h2>{t.principles}</h2><ul>{t.principlesList.map((item, index) => <li key={item}><span>0{index + 1}</span>{item}</li>)}</ul><p className="education-note"><span className="status-dot dot-verified" />{language === 'en' ? 'Self-educated; no formal engineering degree or certification is claimed.' : 'স্বশিক্ষিত; কোনো আনুষ্ঠানিক engineering degree বা certification দাবি করা হয় না।'}</p></div>
    </div>
  </div>;
}

function NotesView({ language, t }: { language: Language; t: typeof copy.en | typeof copy.bn }) {
  return <div className="section-view notes-view">
    <div className="eyebrow"><span className="eyebrow-line" />{language === 'en' ? 'ARCHIVE / 05' : 'আর্কাইভ / ০৫'}</div>
    <h1 id="station-heading-notes" tabIndex={-1} className="section-title">{t.notesTitle}<span className="title-period">.</span></h1>
    <div className="archive-room"><div className="archive-orbit"><span /><span /><span /><BookOpen size={25} /></div><p>{t.notesEmpty}</p><span className="archive-stamp">{language === 'en' ? 'NO PUBLIC NOTES INDEXED' : 'পাবলিক নোট তালিকাভুক্ত নয়'}</span></div>
  </div>;
}

function ContactView({ language, t }: { language: Language; t: typeof copy.en | typeof copy.bn }) {
  const links = [
    { label: t.github, href: 'https://github.com/soobujmiah', icon: <GitBranch size={16} /> },
    { label: t.linkedin, href: 'https://linkedin.com/in/soobujmiah', icon: <ExternalLink size={15} /> },
    { label: t.devto, href: 'https://dev.to/soobujmiah', icon: <Terminal size={15} /> },
    { label: t.telegram, href: 'https://t.me/soobujmiah', icon: <Radio size={15} /> },
  ];
  return <div className="section-view contact-view">
    <div className="eyebrow"><span className="eyebrow-line" />{language === 'en' ? 'COMMUNICATIONS / 06' : 'যোগাযোগ / ০৬'}</div>
    <div className="contact-beacon"><span /><span /><span /><Radio size={19} /></div>
    <h1 id="station-heading-contact" tabIndex={-1} className="section-title">{t.contactTitle}<span className="title-period">.</span></h1>
    <p className="section-intro">{t.contactIntro}</p>
    <a className="email-signal" href="mailto:soobujmiah@gmail.com"><span className="email-icon"><Mail size={17} /></span><span><small>{t.email}</small><strong>soobujmiah@gmail.com</strong></span><ArrowUpRight size={17} /></a>
    <div className="contact-links">{links.map(link => <a href={link.href} target="_blank" rel="noreferrer" key={link.label}>{link.icon}<span>{link.label}</span><ArrowUpRight className="link-arrow" size={13} /></a>)}</div>
    <div className="contact-location"><span className="location-pulse" />{t.location}<span>GMT+6</span></div>
  </div>;
}

export default App;
