'use client';

import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Magnetic, Reveal, SnapCarousel, useNav } from './ui';
import { SignatureName } from './SignatureName';
import { sectionHref } from '@/app/sections';
import { serviceHref } from '@/app/services';
import { useLang, localizeDigits } from '@/app/language';
import type { Project, Repo } from '@/app/content';

/* ═══════════════════════════════════════════════════════════════
   PAGE CONTENT — every page fits its viewport (no vertical scroll
   anywhere). Desktop uses wide editorial layouts (heading rails,
   fitted grids, a work spotlight); phones use horizontal snap
   carousels and an accordion. Giant outlined numerals fill the
   negative space. Cards sit over the live tech background, so they
   use translucent fills + backdrop blur for readability.
   ═══════════════════════════════════════════════ */

const CARD_BG = 'rgba(6,7,6,0.66)';

const NUMERALS = {
  en: ['01', '02', '03', '04', '05', '06', '07', '08', '09'],
  bn: ['০১', '০২', '০৩', '০৪', '০৫', '০৬', '০৭', '০৮', '০৯'],
} as const;

function PageNumeral({ index }: { index: number }) {
  const { lang } = useLang();
  return (
    <div aria-hidden className="page-numeral">
      {NUMERALS[lang][index]}
    </div>
  );
}

/* ── 01 · HERO ───────────────────────────────────────────────── */

export function HeroScene({ reducedMotion, armed = true }: { reducedMotion: boolean; armed?: boolean }) {
  const { t, lang } = useLang();
  const { goToScene, openNav } = useNav();

  return (
    <div className="page-fill">
      <PageNumeral index={0} />

      <div className="page-content flex flex-col items-center text-center">
        {/* 1 · where the work happens — a status line, not a second job title */}
        <motion.p
          className="hero-status font-mono text-[10px] uppercase tracking-[0.4em] mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
        >
          <span className="hero-status-dot" aria-hidden />
          {t.profile.location} · {t.hero.availability}
        </motion.p>

        {/* 2 · who I am — the identity mark dominates */}
        <h1 className="hero-name text-[clamp(3.05rem,10vw,7.4rem)] font-semibold leading-[1.06] tracking-tight">
          <SignatureName text={t.profile.nameFull} reducedMotion={reducedMotion} armed={armed} />
        </h1>

        {/* 3 · what I am — exactly one professional identity treatment */}
        <motion.p
          className="hero-role mt-5 text-[13px] font-medium sm:text-sm"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.7 }}
        >
          {t.profile.title}
        </motion.p>

        {/* 3b · the specialization line — the identity's second half */}
        <motion.p
          className="hero-tagline mt-2.5 font-mono text-[10px] leading-relaxed tracking-[0.18em] sm:text-[11px]"
          style={{ color: '#4ade80' }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.68, duration: 0.7 }}
        >
          {t.profile.tagline}
        </motion.p>

        {/* 4 · what I build, and why it is credible */}
        <motion.p
          className="mx-auto mt-4 max-w-lg text-sm leading-relaxed"
          style={{ color: 'rgba(228,226,223,0.62)' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.75, duration: 0.7 }}
        >
          {t.hero.intro}
        </motion.p>

        <motion.div
          className="mt-6 flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.0, duration: 0.7 }}
        >
          <Magnetic
            href={sectionHref(3)}
            onClick={(e) => {
              e.preventDefault();
              goToScene(3);
            }}
            className="rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-300"
            style={{ background: '#22c55e', color: '#060608' }}
          >
            {t.hero.ctaWork}
          </Magnetic>
          <Magnetic
            href="https://github.com/soobujmiah"
            className="rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-300 backdrop-blur-md"
            style={{ border: '1px solid rgba(228,226,223,0.15)', color: '#e4e2df', background: 'rgba(8,10,8,0.5)' }}
          >
            {t.hero.ctaGithub}
          </Magnetic>
        </motion.div>
      </div>

      <motion.div
        className="hero-hint absolute bottom-24 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 1 }}
        aria-hidden
      >
        <motion.button
          type="button"
          onClick={openNav}
          aria-label={t.ui.navOpen}
          className="flex flex-col items-center gap-2"
          animate={reducedMotion ? {} : { y: [0, 6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: 'rgba(228,226,223,0.4)' }}>
            {t.hero.scrollHint}
          </span>
          <div className="w-px h-6" style={{ background: 'linear-gradient(to bottom, #22c55e, transparent)' }} />
        </motion.button>
      </motion.div>
    </div>
  );
}

/* ── 02 · PRESENCE ───────────────────────────────────────────── */

export function StatsScene() {
  const { t } = useLang();
  return (
    <div className="page-fill">
      <PageNumeral index={1} />
      <div className="page-content page-content-wide flex flex-col items-center">
        <Reveal>
          <p className="ph-e font-mono text-[10px] uppercase tracking-[0.3em] mb-3 text-center" style={{ color: '#22c55e' }}>
            {t.presence.eyebrow}
          </p>
        </Reveal>
        <Reveal delay={0.06}>
          <h1 className="ph-h text-[clamp(1.35rem,5.2vw,2.6rem)] font-semibold leading-[1.12] tracking-tight max-w-3xl mb-6 text-center" style={{ color: '#e4e2df' }}>
            {t.presence.heading}
          </h1>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full">
          {t.presence.items.map((p, i) => (
            <Reveal key={p.label} delay={i * 0.08}>
              <div
                className="rounded-xl p-5 sm:p-6 text-center backdrop-blur-md h-full"
                style={{ border: '1px solid rgba(228,226,223,0.09)', background: CARD_BG }}
              >
                <p className="text-base sm:text-lg font-semibold" style={{ color: '#e4e2df' }}>{p.label}</p>
                <p className="mt-1.5 font-mono text-[10px] leading-relaxed" style={{ color: 'rgba(228,226,223,0.55)' }}>
                  {p.detail}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── shared compact eyebrow + heading ──
   Each section route server-renders exactly one scene, and the pager
   keeps only one scene in the DOM, so every page carries exactly one
   <h1>: the hero name on home, the section topic everywhere else. */

function PageHeading({ eyebrow, heading }: { eyebrow: string; heading: string }) {
  return (
    <>
      <Reveal>
        <p className="ph-e font-mono text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: '#22c55e' }}>
          {eyebrow}
        </p>
      </Reveal>
      <Reveal delay={0.06}>
        <h1 className="ph-h text-[clamp(1.35rem,5.2vw,2.6rem)] font-semibold leading-[1.12] tracking-tight max-w-2xl mb-4 sm:mb-6" style={{ color: '#e4e2df' }}>
          {heading}
        </h1>
      </Reveal>
    </>
  );
}

/* ── 03 · ABOUT ──────────────────────────────────────────────── */

export function AboutScene() {
  const { t } = useLang();
  return (
    <div className="page-fill">
      <PageNumeral index={2} />
      <div className="page-content page-content-wide">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:gap-12">
          <div>
            <PageHeading eyebrow={t.about.eyebrow} heading={t.about.heading} />
          </div>
          <div>
            <div className="space-y-3 mb-5">
              {t.about.paragraphs.map((p, i) => (
                <Reveal key={i} delay={0.1 + i * 0.06}>
                  <p className="about-p text-[13px] sm:text-sm leading-[1.75]" style={{ color: 'rgba(228,226,223,0.65)' }}>{p}</p>
                </Reveal>
              ))}
            </div>
            {/* Engineering method, as working principles — the same
                discipline the evidence lines on the work page rely on. */}
            <Reveal delay={0.13}>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {t.about.principles.map((p) => (
                  <span
                    key={p}
                    className="rounded-full px-2.5 py-1 font-mono text-[10px]"
                    style={{ border: '1px solid rgba(34,197,94,0.25)', color: 'rgba(228,226,223,0.6)', background: 'rgba(34,197,94,0.05)' }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl backdrop-blur-md" style={{ border: '1px solid rgba(228,226,223,0.08)', background: 'rgba(228,226,223,0.06)' }}>
                {t.about.facts.map((f) => (
                  <div key={f.label} className="p-3.5 sm:p-4" style={{ background: CARD_BG }}>
                    <p className="font-mono text-[9px] uppercase tracking-wider mb-1.5" style={{ color: 'rgba(228,226,223,0.4)' }}>{f.label}</p>
                    <p className="fact-v text-xs font-medium leading-snug" style={{ color: '#e4e2df' }}>{f.value}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 04 · FEATURED WORK ──────────────────────────────────────── */

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const { t, lang } = useLang();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.article
      ref={ref}
      className="dense-card group relative h-full rounded-xl p-4 sm:p-5 backdrop-blur-md transition-all duration-500"
      style={{ border: '1px solid rgba(228,226,223,0.09)', background: CARD_BG }}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      whileHover={{ borderColor: 'rgba(228,226,223,0.16)', y: -4 }}
    >
      {isHovered && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, ${project.accent}08, transparent 60%)`,
          }}
          aria-hidden
        />
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.35)' }}>{localizeDigits(`0${index + 1}`, lang)}</span>
              <span className="font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.35)' }}>{project.year}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: '#e4e2df' }}>
              {project.websiteUrl ? (
                <a
                  href={project.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="project-name-link"
                  aria-label={`${project.name} — ${t.ui.liveSiteWord}`}
                >
                  {project.name}
                </a>
              ) : (
                project.name
              )}
            </h3>
            <p className="mt-0.5 text-xs" style={{ color: project.accent }}>{project.tagline}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {project.websiteUrl && (
              <Magnetic
                href={project.websiteUrl}
                className="rounded-full px-2.5 py-1 font-mono text-[10px] transition-colors duration-300"
                style={{ border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80' }}
                strength={0.15}
              >
                {t.work.liveLabel}
              </Magnetic>
            )}
            <Magnetic
              href={project.repo}
              ariaLabel={`${project.name} ${t.ui.repoWord}`}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300"
              style={{ border: '1px solid rgba(228,226,223,0.1)', color: 'rgba(228,226,223,0.55)' }}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M1 13L13 1M13 1H3M13 1V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Magnetic>
          </div>
        </div>

        <p className="text-xs leading-[1.7] mb-3" style={{ color: 'rgba(228,226,223,0.6)' }}>
          {project.description}
        </p>

        <p className="dc-evidence text-xs leading-[1.7] mb-4" style={{ color: 'rgba(228,226,223,0.5)' }}>
          <span style={{ color: 'rgba(228,226,223,0.65)' }}>{t.work.evidenceLabel}</span>{project.evidence}
        </p>

        <div className="dc-topics flex flex-wrap items-center gap-1.5">
          {project.topics.map((topic) => (
            <span key={topic} className="rounded-full px-2.5 py-0.5 font-mono text-[10px]" style={{ border: '1px solid rgba(228,226,223,0.08)', color: 'rgba(228,226,223,0.5)' }}>
              {topic}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

function SongjogSlide() {
  const { t } = useLang();
  const nb = t.work.nowBuilding;
  return (
    <Magnetic
      href={nb.url}
      className="flex h-full flex-col justify-between gap-4 rounded-xl p-5 sm:p-6 text-left backdrop-blur-md transition-all duration-500"
      style={{ border: '1px solid rgba(34,197,94,0.25)', background: 'rgba(34,197,94,0.07)' }}
      strength={0.05}
    >
      <span>
        <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: '#4ade80' }}>
          {nb.eyebrow}
        </span>
        <span className="block text-xl font-semibold" style={{ color: '#e4e2df' }}>{nb.name}</span>
        <span className="mt-2 block text-xs leading-relaxed" style={{ color: 'rgba(228,226,223,0.6)' }}>
          {nb.description}
        </span>
        <span className="mt-2 block font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.45)' }}>
          {nb.testsNote}
        </span>
      </span>
      <span
        className="rounded-full px-5 py-2 text-center text-xs font-medium"
        style={{ background: '#22c55e', color: '#060608' }}
      >
        {nb.cta}
      </span>
    </Magnetic>
  );
}

/* Desktop spotlight: compact selector + one rich detail card.
   Auto-advances until the visitor takes over; always fits. */
function WorkSpotlight() {
  const { t, lang } = useLang();
  const prefersReduced = useReducedMotion();
  const reducedMotion = prefersReduced ?? false;
  const projects = t.work.projects;
  const nb = t.work.nowBuilding;
  const total = projects.length + 1;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const id = setInterval(() => setActive((a) => (a + 1) % total), 6000);
    return () => clearInterval(id);
  }, [paused, reducedMotion, total]);

  return (
    <div
      className="hidden lg:grid lg:grid-cols-[1fr_1.5fr] gap-5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="flex flex-col gap-2" role="tablist" aria-label={t.work.heading}>
        {projects.map((p, i) => {
          const isActive = active === i;
          return (
            <button
              key={p.name}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(i)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-left backdrop-blur-md transition-all duration-300"
              style={{
                border: isActive ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(228,226,223,0.08)',
                background: isActive ? 'rgba(34,197,94,0.07)' : CARD_BG,
              }}
            >
              <span className="font-mono text-[10px]" style={{ color: isActive ? '#4ade80' : 'rgba(228,226,223,0.35)' }}>
                {localizeDigits(`0${i + 1}`, lang)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold" style={{ color: '#e4e2df' }}>{p.name}</span>
                <span className="block truncate text-[11px]" style={{ color: 'rgba(228,226,223,0.45)' }}>{p.tagline}</span>
              </span>
              <span
                aria-hidden
                className="font-mono text-xs transition-all duration-300"
                style={{ color: '#4ade80', opacity: isActive ? 1 : 0, transform: isActive ? 'translateX(0)' : 'translateX(-4px)' }}
              >
                →
              </span>
            </button>
          );
        })}
        <button
          type="button"
          role="tab"
          aria-selected={active === projects.length}
          onClick={() => setActive(projects.length)}
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-left backdrop-blur-md transition-all duration-300"
          style={{
            border: active === projects.length ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(34,197,94,0.2)',
            background: 'rgba(34,197,94,0.07)',
          }}
        >
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: '#22c55e' }} />
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: '#22c55e' }} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold" style={{ color: '#e4e2df' }}>{nb.name}</span>
            <span className="block truncate font-mono text-[10px]" style={{ color: '#4ade80' }}>{nb.eyebrow}</span>
          </span>
        </button>
      </div>

      <div className="relative min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            role="tabpanel"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            {active < projects.length ? (
              <ProjectCard project={projects[active]} index={active} />
            ) : (
              <div
                className="dense-card rounded-xl p-5 backdrop-blur-md h-full"
                style={{ border: '1px solid rgba(34,197,94,0.25)', background: 'rgba(34,197,94,0.07)' }}
              >
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: '#4ade80' }}>
                  {nb.eyebrow}
                </p>
                <h3 className="text-2xl font-semibold tracking-tight" style={{ color: '#e4e2df' }}>{nb.name}</h3>
                <p className="mt-2 text-xs leading-[1.7]" style={{ color: 'rgba(228,226,223,0.6)' }}>
                  {nb.description}
                </p>
                <p className="mt-2 font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.45)' }}>
                  {nb.testsNote}
                </p>
                <Magnetic
                  href={nb.url}
                  className="mt-4 inline-block rounded-full px-5 py-2 text-xs font-medium"
                  style={{ background: '#22c55e', color: '#060608' }}
                >
                  {nb.cta}
                </Magnetic>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── ecosystem relationship — ADT ↔ Ternux ──────────────────────
   One physical Android device, two complementary layers. Compact by
   design: a device rail, the two layer cards, then one evidence line
   each way (verified / not yet proven). It reuses the page's existing
   card idiom and each project's own accent, so it adds no animation,
   no dependency and no new design token. */
function RelationshipBlock() {
  const { t } = useLang();
  const rel = t.work.relationship;
  const edge = { borderColor: 'rgba(228,226,223,0.08)' };

  return (
    <Reveal delay={0.16}>
      <section
        aria-labelledby="work-ecosystem"
        className="mt-4 rounded-xl backdrop-blur-md"
        style={{ border: '1px solid rgba(34,197,94,0.18)', background: CARD_BG }}
      >
        <div className="flex items-center gap-2.5 border-b px-4 py-2.5" style={edge}>
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: '#22c55e' }} aria-hidden />
          <span className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: 'rgba(228,226,223,0.45)' }}>
            {rel.deviceLabel}
          </span>
          <span className="ml-auto hidden font-mono text-[9px] uppercase tracking-[0.2em] sm:block" style={{ color: 'rgba(74,222,128,0.7)' }}>
            {rel.eyebrow}
          </span>
        </div>

        <div className="px-4 pt-3">
          <h3 id="work-ecosystem" className="text-sm font-semibold tracking-tight" style={{ color: '#e4e2df' }}>
            {rel.heading}
          </h3>
          <p className="mt-1 text-[11px] leading-[1.6]" style={{ color: 'rgba(228,226,223,0.55)' }}>
            {rel.body}
          </p>
        </div>

        <div className="grid sm:grid-cols-2">
          {rel.layers.map((layer, i) => {
            const accent = t.work.projects.find((p) => p.name === layer.name)?.accent ?? '#4ade80';
            return (
              <div
                key={layer.name}
                className={`border-t px-4 py-3 sm:border-t-0 ${i === 1 ? 'sm:border-l' : ''}`}
                style={edge}
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: accent }}>
                    {layer.name}
                  </span>
                  <span className="h-px flex-1" style={{ background: 'rgba(228,226,223,0.08)' }} aria-hidden />
                  <span className="font-mono text-[9px]" style={{ color: 'rgba(228,226,223,0.4)' }}>{layer.role}</span>
                </div>
                <p className="text-[11px] leading-[1.6]" style={{ color: 'rgba(228,226,223,0.6)' }}>{layer.note}</p>
                <div className="mt-2.5 flex items-center gap-2">
                  <Magnetic
                    href={layer.websiteUrl}
                    ariaLabel={`${layer.name} — ${t.ui.liveSiteWord}`}
                    className="rounded-full px-2.5 py-1 font-mono text-[10px] transition-colors duration-300"
                    style={{ border: `1px solid ${accent}59`, color: accent }}
                    strength={0.15}
                  >
                    {t.work.liveLabel}
                  </Magnetic>
                  <Magnetic
                    href={layer.repo}
                    ariaLabel={`${layer.name} ${t.ui.repoWord}`}
                    className="rounded-full px-2.5 py-1 font-mono text-[10px] transition-colors duration-300"
                    style={{ border: '1px solid rgba(228,226,223,0.1)', color: 'rgba(228,226,223,0.55)' }}
                    strength={0.15}
                  >
                    {t.work.codeLabel}
                  </Magnetic>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-2 border-t px-4 py-3 sm:grid-cols-2" style={edge}>
          <p className="text-[11px] leading-[1.6]" style={{ color: 'rgba(228,226,223,0.5)' }}>
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: '#22c55e' }} aria-hidden />
            <span style={{ color: 'rgba(228,226,223,0.7)' }}>{rel.verifiedLabel}</span>
            {rel.verified}
          </p>
          <p className="text-[11px] leading-[1.6]" style={{ color: 'rgba(228,226,223,0.5)' }}>
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: 'rgba(228,226,223,0.3)' }} aria-hidden />
            <span style={{ color: 'rgba(228,226,223,0.7)' }}>{rel.experimentalLabel}</span>
            {rel.experimental}
          </p>
        </div>
      </section>
    </Reveal>
  );
}

export function WorkScene() {
  const { t } = useLang();
  return (
    <div className="page-fill">
      <PageNumeral index={3} />
      <div className="page-content page-content-wide">
        <PageHeading eyebrow={t.work.eyebrow} heading={t.work.heading} />

        {/* phones + tablets: swipeable project pages (Songjog is last) */}
        <div className="lg:hidden">
          <SnapCarousel label={t.work.heading} prevLabel={t.ui.carouselPrev} nextLabel={t.ui.carouselNext}>
            {t.work.projects.map((p, i) => (
              <ProjectCard key={p.name} project={p} index={i} />
            ))}
            <SongjogSlide />
          </SnapCarousel>
        </div>

        {/* desktop: interactive spotlight, always fits */}
        <WorkSpotlight />

        {/* ecosystem: ADT ↔ Ternux — two layers of one device */}
        <RelationshipBlock />
      </div>
    </div>
  );
}

/* ── 05 · RESEARCH & EXPERIMENTS ─────────────────────────────── */

export function ResearchScene() {
  const { t } = useLang();
  return (
    <div className="page-fill">
      <PageNumeral index={4} />
      <div className="page-content page-content-wide">
        <PageHeading eyebrow={t.research.eyebrow} heading={t.research.heading} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {t.research.entries.map((r, i) => (
            <Reveal key={r.title} delay={0.08 + i * 0.06}>
              <div
                className="dense-card rounded-xl p-4 sm:p-5 backdrop-blur-md transition-all duration-500 h-full"
                style={{ border: '1px solid rgba(228,226,223,0.09)', background: CARD_BG }}
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    aria-hidden
                    style={{
                      background: r.status === 'validated' ? '#22c55e' : r.status === 'experimental' ? '#4ade80' : 'rgba(228,226,223,0.3)',
                    }}
                  />
                  <span className="font-mono text-[9px] uppercase tracking-[0.15em]" style={{ color: 'rgba(228,226,223,0.45)' }}>
                    {r.statusLabel}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-semibold mb-1.5" style={{ color: '#e4e2df' }}>{r.title}</h3>
                <p className="text-xs leading-[1.7]" style={{ color: 'rgba(228,226,223,0.6)' }}>{r.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 06 · TECHNICAL FOCUS ────────────────────────────────────── */

export function StackScene() {
  const { t } = useLang();
  return (
    <div className="page-fill">
      <PageNumeral index={5} />
      <div className="page-content page-content-wide">
        <PageHeading eyebrow={t.stack.eyebrow} heading={t.stack.heading} />
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
          {t.stack.domains.map((d, i) => (
            <Reveal key={d.name} delay={0.06 + i * 0.05}>
              <div className="dense-card rounded-xl p-4 sm:p-5 h-full backdrop-blur-md" style={{ border: '1px solid rgba(228,226,223,0.08)', background: CARD_BG }}>
                <h3 className="font-mono text-xs font-medium mb-2" style={{ color: '#22c55e' }}>{d.name}</h3>
                <p className="text-[11px] sm:text-xs leading-relaxed" style={{ color: 'rgba(228,226,223,0.55)' }}>
                  {d.items.join(' · ')}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 07 · OPEN SOURCE ────────────────────────────────────────── */

function RepoCard({ repo, liveLabel, codeLabel }: { repo: Repo; liveLabel: string; codeLabel: string }) {
  const { t, lang } = useLang();
  return (
    <div
      className="repo-card dense-card flex flex-col rounded-xl p-4 text-left backdrop-blur-md h-full"
      style={{ border: '1px solid rgba(228,226,223,0.08)', background: CARD_BG }}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1.5">
        <h3 className="font-mono text-xs font-semibold transition-colors duration-300" style={{ color: '#e4e2df' }}>{repo.name}</h3>
        {repo.tier === 'applied' && (
          <span
            className="rounded-full px-2 py-0.5 font-mono text-[9px]"
            style={{ border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' }}
          >
            {t.openSource.appliedBadge}
          </span>
        )}
        {repo.stars > 0 && <span className="font-mono text-[9px]" style={{ color: 'rgba(228,226,223,0.4)' }}>★ {localizeDigits(repo.stars, lang)}</span>}
      </div>
      <p className="flex-1 text-[11px] leading-relaxed mb-2.5" style={{ color: 'rgba(228,226,223,0.55)' }}>{repo.desc}</p>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="h-2 w-2 rounded-full" aria-hidden style={{ background: '#22c55e', opacity: 0.6 }} />
        <span className="font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.45)' }}>{repo.lang}</span>
        <span className="ml-auto flex items-center gap-2">
          {repo.websiteUrl && (
            <Magnetic href={repo.websiteUrl} className="font-mono text-[10px] transition-colors duration-300" style={{ color: '#4ade80' }} strength={0.15}>
              {liveLabel}
            </Magnetic>
          )}
          <Magnetic href={repo.url} ariaLabel={`${repo.name} ${t.ui.repoWord}`} className="font-mono text-[10px] transition-colors duration-300" style={{ color: 'rgba(228,226,223,0.55)' }} strength={0.15}>
            {codeLabel}
          </Magnetic>
        </span>
      </div>
    </div>
  );
}

/* ── 07 · SELECTED OPEN SOURCE ────────────────────────────────────────── */

/* Curated set only (content.openSource.selected) + one GitHub route.
   Featured projects are NOT repeated here. */

function GithubRouteCard() {
  const { t } = useLang();
  return (
    <Magnetic
      href="https://github.com/soobujmiah"
      className="repo-card flex h-full flex-col justify-between gap-3 rounded-xl p-4 text-left backdrop-blur-md"
      style={{ border: '1px solid rgba(34,197,94,0.25)', background: 'rgba(34,197,94,0.07)' }}
      strength={0.08}
    >
      <span>
        <span className="block text-sm font-semibold" style={{ color: '#e4e2df' }}>{t.openSource.moreLabel}</span>
        <span className="mt-1 block text-[11px] leading-relaxed" style={{ color: 'rgba(228,226,223,0.55)' }}>{t.openSource.moreSub}</span>
      </span>
      <span aria-hidden className="font-mono text-lg leading-none" style={{ color: '#4ade80' }}>
        &rarr;
      </span>
    </Magnetic>
  );
}

export function OpenSourceScene() {
  const { t } = useLang();
  const selected = t.openSource.selected
    .map((name) => t.openSource.repos.find((r) => r.name === name))
    .filter((r): r is Repo => Boolean(r));
  const cells: (Repo | null)[] = [...selected, null]; // null = GitHub route card
  const slides: (Repo | null)[][] = [cells.slice(0, 4), cells.slice(4, 8)];

  const renderCell = (c: Repo | null, key: string) =>
    c === null ? (
      <GithubRouteCard key={key} />
    ) : (
      <RepoCard key={key} repo={c} liveLabel={t.openSource.liveLabel} codeLabel={t.openSource.codeLabel} />
    );

  return (
    <div className="page-fill">
      <PageNumeral index={6} />
      <div className="page-content page-content-wide">
        <PageHeading eyebrow={t.openSource.eyebrow} heading={t.openSource.heading} />
        <Reveal delay={0.1}>
          <p className="text-xs mb-4 sm:mb-5" style={{ color: 'rgba(228,226,223,0.5)' }}>
            {t.openSource.note}
          </p>
        </Reveal>

        {/* phones + tablets: 2 swipeable 2x2 slides */}
        <div className="lg:hidden">
          <SnapCarousel label={t.openSource.heading} prevLabel={t.ui.carouselPrev} nextLabel={t.ui.carouselNext}>
            {slides.map((group, i) => (
              <div key={i} className="grid grid-cols-2 gap-2.5">
                {group.map((c, j) => renderCell(c, `${i}-${j}`))}
              </div>
            ))}
          </SnapCarousel>
        </div>

        {/* desktop: fitted 4-column grid */}
        <div className="hidden lg:grid gap-3 lg:grid-cols-4">
          {cells.map((c, i) => renderCell(c, `d-${i}`))}
        </div>
      </div>
    </div>
  );
}

/* ── 08 · EXPERIENCE ─────────────────────────────────────────── */

function ExperienceAccordion() {
  const { t } = useLang();
  const [open, setOpen] = useState(0);
  return (
    <div className="rounded-xl overflow-hidden backdrop-blur-md" style={{ border: '1px solid rgba(228,226,223,0.09)', background: CARD_BG }}>
      {t.experience.entries.map((w, i) => {
        const isOpen = open === i;
        return (
          <div key={`${w.company}-${i}`} style={i > 0 ? { borderTop: '1px solid rgba(228,226,223,0.06)' } : {}}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className="acc-btn flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              <span
                className="font-mono text-xs transition-transform duration-300"
                style={{ color: '#22c55e', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                aria-hidden
              >
                ›
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold" style={{ color: '#e4e2df' }}>{w.role}</span>
                <span className="block font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.45)' }}>{w.period}</span>
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-3.5 pl-9">
                    <p className="text-xs" style={{ color: 'rgba(228,226,223,0.6)' }}>
                      {w.company} · {w.location}
                    </p>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(228,226,223,0.5)' }}>{w.desc}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export function ExperienceScene() {
  const { t } = useLang();
  return (
    <div className="page-fill">
      <PageNumeral index={7} />
      <div className="page-content page-content-wide">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr] lg:gap-12">
          <div>
            <PageHeading eyebrow={t.experience.eyebrow} heading={t.experience.heading} />
            {/* Practical professional layer — deliberately separate
                from the engineering identity on the work pages. */}
            <Reveal delay={0.1}>
              <p className="font-mono text-[9px] uppercase tracking-wider mb-2" style={{ color: 'rgba(228,226,223,0.4)' }}>
                {t.experience.services.label}
              </p>
              <div className="flex flex-wrap gap-1.5 max-w-md">
                {t.experience.services.items.map((s) => (
                  <span
                    key={s}
                    className="rounded-full px-2.5 py-1 font-mono text-[10px]"
                    style={{ border: '1px solid rgba(228,226,223,0.09)', color: 'rgba(228,226,223,0.55)', background: 'rgba(8,10,8,0.45)' }}
                  >
                    {s}
                  </span>
                ))}
              </div>
              {/* Discovery link into the service-intent layer (/services/),
                  which lives outside the pager by design. */}
              <a
                href={serviceHref()}
                className="mt-3 inline-block font-mono text-[10px] transition-colors duration-300 hover:text-[#4ade80]"
                style={{ color: 'rgba(228,226,223,0.5)' }}
                data-magnetic
              >
                {t.contact.servicesLink}
              </a>
            </Reveal>
          </div>
          <div>
            {/* phones: accordion, one story at a time */}
            <div className="md:hidden">
              <ExperienceAccordion />
            </div>

            {/* tablet + desktop: full timeline */}
            <div className="relative hidden md:block">
              <div className="absolute left-[5px] top-0 bottom-0 w-px" style={{ background: 'rgba(228,226,223,0.07)' }} aria-hidden />
              {t.experience.entries.map((w, i) => (
                <Reveal key={`${w.company}-${i}`} delay={0.04 + i * 0.04}>
                  <div className="relative pl-8 pb-4 last:pb-0">
                    <div className="absolute left-0 top-1 h-3 w-3 rounded-full border-2" style={{ borderColor: '#22c55e', background: '#060608' }} aria-hidden />
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-0.5">
                      <span className="font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.45)' }}>{w.period}</span>
                      <h3 className="text-sm font-semibold" style={{ color: '#e4e2df' }}>{w.role}</h3>
                    </div>
                    <p className="text-xs" style={{ color: 'rgba(228,226,223,0.6)' }}>
                      {w.company} · {w.location}
                    </p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'rgba(228,226,223,0.5)' }}>{w.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 09 · CONTACT ────────────────────────────────────────────── */

export function ContactScene() {
  const { t } = useLang();
  return (
    <div className="page-fill">
      <PageNumeral index={8} />
      <div className="page-content page-content-wide">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-start">
          <div className="text-center lg:text-left">
            <Reveal>
              <p className="ph-e font-mono text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: '#22c55e' }}>
                {t.contact.eyebrow}
              </p>
            </Reveal>
            <Reveal delay={0.06}>
              <h1 className="ph-h text-[clamp(1.7rem,7vw,3.2rem)] font-semibold leading-[1.1] tracking-tight mb-4" style={{ color: '#e4e2df' }}>
                {t.contact.headingA}
                <br />
                <span className="gradient-text">{t.contact.headingB}</span>
              </h1>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mx-auto lg:mx-0 max-w-md text-sm" style={{ color: 'rgba(228,226,223,0.6)' }}>
                {t.contact.sub}{' '}
                <a
                  href={serviceHref()}
                  className="transition-colors duration-300 hover:text-[#4ade80]"
                  style={{ color: 'rgba(228,226,223,0.85)', textDecoration: 'underline', textUnderlineOffset: 3 }}
                  data-magnetic
                >
                  {t.contact.servicesLink}
                </a>
              </p>
            </Reveal>

            {/* The one primary channel, visually first and on its own —
                it is a way to reach a person, not a platform profile. */}
            <Reveal delay={0.18}>
              <Magnetic
                href={t.contact.email.href}
                ariaLabel={`${t.contact.email.label}: ${t.contact.email.value}`}
                className="group mt-6 flex flex-col gap-1 rounded-xl p-4 backdrop-blur-md transition-all duration-500 sm:max-w-sm lg:mt-8"
                style={{ border: '1px solid rgba(34,197,94,0.22)', background: 'rgba(8,14,10,0.6)' }}
                strength={0.12}
              >
                <span className="text-sm font-semibold transition-colors duration-300" style={{ color: '#e4e2df' }}>
                  {t.contact.email.label}
                </span>
                <span className="font-mono text-[11px] truncate" style={{ color: 'rgba(228,226,223,0.5)' }}>
                  {t.contact.email.value}
                </span>
              </Magnetic>
            </Reveal>
          </div>

          {/* The complete ecosystem: 17 canonical links, grouped, one
              line each. Deliberately typographic rather than a wall of
              platform icons — these are navigation, not content, and
              they stay inside the green-on-black system. The handle is
              carried in the accessible name and on hover, so the row
              stays quiet without hiding anything. */}
          <Reveal delay={0.22}>
            <dl className="social-grid">
              {t.contact.groups.map((g) => (
                <div key={g.label} className="social-row">
                  <dt className="social-group">{g.label}</dt>
                  <dd className="social-links">
                    {g.links.map((l, i) => (
                      <span key={l.href} className="social-item">
                        {i > 0 && <span className="social-sep" aria-hidden="true">·</span>}
                        <a
                          href={l.href}
                          target="_blank"
                          rel="noreferrer"
                          data-magnetic
                          title={`${l.label} — ${l.handle}`}
                          aria-label={`${l.label}: ${l.handle}`}
                        >
                          {l.label}
                        </a>
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.3)' }}>
              {t.contact.groupsNote}
            </p>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
