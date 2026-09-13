'use client';

import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { Magnetic, Reveal, SnapCarousel, useNav } from './ui';
import { MatrixName } from './MatrixName';
import { useLang } from '@/app/language';
import type { Project, Repo } from '@/app/content';

/* ═══════════════════════════════════════════════════════════════
   PAGE CONTENT — every page fits its viewport (no vertical scroll
   anywhere). Dense collections use horizontal carousels (Work, Open
   Source) or an accordion (Experience) on phones, and fitted grids
   on desktop. Cards sit over the live tech background, so they use
   translucent fills + backdrop blur for readability.
   ═══════════════════════════════════════════════════════════════ */

const CARD_BG = 'rgba(8,10,8,0.62)';

/* ── 01 · HERO ───────────────────────────────────────────────── */

export function HeroScene({ reducedMotion }: { reducedMotion: boolean }) {
  const { t } = useLang();
  const { goToScene } = useNav();

  return (
    <div className="page-fill">
      <div className="orb orb-1" aria-hidden />
      <div className="orb orb-2" aria-hidden />

      <div className="page-content flex flex-col items-center text-center">
        <motion.p
          className="font-mono text-[10px] uppercase tracking-[0.4em] mb-5"
          style={{ color: '#22c55e' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
        >
          {t.profile.tagline}
        </motion.p>

        <h1
          className="text-[clamp(2.6rem,9vw,6.5rem)] font-semibold leading-[0.95] tracking-tight mb-5"
          style={{ color: '#e4e2df' }}
        >
          <MatrixName reducedMotion={reducedMotion} />
        </h1>

        <motion.p
          className="mx-auto max-w-md text-sm leading-relaxed"
          style={{ color: 'rgba(228,226,223,0.65)' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.7, duration: 0.7 }}
        >
          {t.hero.intro}
        </motion.p>

        <motion.div
          className="mt-7 flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.9, duration: 0.7 }}
        >
          <Magnetic
            href="#work"
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
        className="absolute bottom-24 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.3, duration: 1 }}
        aria-hidden
      >
        <motion.div
          className="flex flex-col items-center gap-2"
          animate={reducedMotion ? {} : { y: [0, 6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: 'rgba(228,226,223,0.4)' }}>
            {t.hero.scrollHint}
          </span>
          <div className="w-px h-6" style={{ background: 'linear-gradient(to bottom, #22c55e, transparent)' }} />
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ── 02 · PRESENCE ───────────────────────────────────────────── */

export function StatsScene() {
  const { t } = useLang();
  return (
    <div className="page-fill">
      <div className="page-content flex flex-col items-center">
        <Reveal>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] mb-7 text-center" style={{ color: '#22c55e' }}>
            {t.presence.eyebrow}
          </p>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
          {t.presence.items.map((p, i) => (
            <Reveal key={p.label} delay={i * 0.08}>
              <div className="text-center">
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

/* ── shared compact eyebrow + heading ── */

function PageHeading({ eyebrow, heading }: { eyebrow: string; heading: string }) {
  return (
    <>
      <Reveal>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3 sm:mb-4" style={{ color: '#22c55e' }}>
          {eyebrow}
        </p>
      </Reveal>
      <Reveal delay={0.06}>
        <h2 className="text-[clamp(1.35rem,5.2vw,2.6rem)] font-semibold leading-[1.12] tracking-tight max-w-2xl mb-5 sm:mb-8" style={{ color: '#e4e2df' }}>
          {heading}
        </h2>
      </Reveal>
    </>
  );
}

/* ── 03 · ABOUT ──────────────────────────────────────────────── */

export function AboutScene() {
  const { t } = useLang();
  return (
    <div className="page-fill">
      <div className="page-content">
        <PageHeading eyebrow={t.about.eyebrow} heading={t.about.heading} />
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:gap-10">
          <div className="space-y-3">
            {t.about.paragraphs.map((p, i) => (
              <Reveal key={i} delay={0.1 + i * 0.06}>
                <p className="text-[13px] sm:text-sm leading-[1.75]" style={{ color: 'rgba(228,226,223,0.65)' }}>{p}</p>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.15}>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl backdrop-blur-md" style={{ border: '1px solid rgba(228,226,223,0.08)', background: 'rgba(228,226,223,0.06)' }}>
              {t.about.facts.map((f) => (
                <div key={f.label} className="p-3.5 sm:p-4" style={{ background: CARD_BG }}>
                  <p className="font-mono text-[9px] uppercase tracking-wider mb-1.5" style={{ color: 'rgba(228,226,223,0.4)' }}>{f.label}</p>
                  <p className="text-xs font-medium leading-snug" style={{ color: '#e4e2df' }}>{f.value}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

/* ── 04 · FEATURED WORK ──────────────────────────────────────── */

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const { t } = useLang();
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
      className="group relative h-full rounded-xl p-5 sm:p-6 backdrop-blur-md transition-all duration-500"
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
              <span className="font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.35)' }}>0{index + 1}</span>
              <span className="font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.35)' }}>{project.year}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: '#e4e2df' }}>{project.name}</h3>
            <p className="mt-0.5 text-xs" style={{ color: project.accent }}>{project.tagline}</p>
          </div>
          <Magnetic
            href={project.repo}
            ariaLabel={`${project.name} repository`}
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300"
            style={{ border: '1px solid rgba(228,226,223,0.1)', color: 'rgba(228,226,223,0.55)' }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M1 13L13 1M13 1H3M13 1V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Magnetic>
        </div>

        <p className="text-xs leading-[1.7] mb-3" style={{ color: 'rgba(228,226,223,0.6)' }}>
          {project.description}
        </p>

        <p className="text-xs leading-[1.7] mb-4" style={{ color: 'rgba(228,226,223,0.5)' }}>
          <span style={{ color: 'rgba(228,226,223,0.65)' }}>{t.work.evidenceLabel}</span>{project.evidence}
        </p>

        <div className="flex flex-wrap items-center gap-1.5">
          {project.topics.map((topic) => (
            <span key={topic} className="rounded-full px-2.5 py-0.5 font-mono text-[10px]" style={{ border: '1px solid rgba(228,226,223,0.08)', color: 'rgba(228,226,223,0.5)' }}>
              {topic}
            </span>
          ))}
          {project.websiteUrl && (
            <Magnetic
              href={project.websiteUrl}
              className="rounded-full px-2.5 py-0.5 font-mono text-[10px] transition-colors duration-300"
              style={{ border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80' }}
              strength={0.15}
            >
              {t.work.liveLabel}
            </Magnetic>
          )}
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
      className="flex h-full flex-col justify-between gap-4 rounded-xl p-5 sm:p-6 text-left backdrop-blur-md transition-all duration-500 sm:hidden"
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

export function WorkScene() {
  const { t } = useLang();
  const nb = t.work.nowBuilding;
  return (
    <div className="page-fill">
      <div className="page-content">
        <PageHeading eyebrow={t.work.eyebrow} heading={t.work.heading} />

        {/* phones: swipeable project pages (Songjog is the 5th slide) */}
        <div className="md:hidden">
          <SnapCarousel label={t.work.heading} prevLabel={t.ui.carouselPrev} nextLabel={t.ui.carouselNext}>
            {t.work.projects.map((p, i) => (
              <ProjectCard key={p.name} project={p} index={i} />
            ))}
            <SongjogSlide />
          </SnapCarousel>
        </div>

        {/* desktop: fitted 2×2 grid + now-building strip */}
        <div className="hidden md:grid gap-5 md:grid-cols-2">
          {t.work.projects.map((p, i) => (
            <ProjectCard key={p.name} project={p} index={i} />
          ))}
        </div>
        <Reveal delay={0.15} className="hidden md:block">
          <Magnetic
            href={nb.url}
            className="mt-5 hidden flex-col gap-2 rounded-xl p-5 text-left backdrop-blur-md transition-all duration-500 sm:flex-row sm:items-center sm:justify-between sm:gap-6 md:flex"
            style={{ border: '1px solid rgba(34,197,94,0.22)', background: 'rgba(34,197,94,0.06)' }}
            strength={0.08}
          >
            <span>
              <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: '#4ade80' }}>
                {nb.eyebrow}
              </span>
              <span className="block text-sm font-semibold" style={{ color: '#e4e2df' }}>{nb.name}</span>
              <span className="mt-1 block text-xs leading-relaxed" style={{ color: 'rgba(228,226,223,0.6)' }}>
                {nb.description}
              </span>
              <span className="mt-1.5 block font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.45)' }}>
                {nb.testsNote}
              </span>
            </span>
            <span
              className="shrink-0 rounded-full px-5 py-2 text-center text-xs font-medium"
              style={{ background: '#22c55e', color: '#060608' }}
            >
              {nb.cta}
            </span>
          </Magnetic>
        </Reveal>
      </div>
    </div>
  );
}

/* ── 05 · RESEARCH & EXPERIMENTS ─────────────────────────────── */

export function ResearchScene() {
  const { t } = useLang();
  return (
    <div className="page-fill">
      <div className="page-content">
        <PageHeading eyebrow={t.research.eyebrow} heading={t.research.heading} />
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          {t.research.entries.map((r, i) => (
            <Reveal key={r.title} delay={0.08 + i * 0.06}>
              <div
                className="rounded-xl p-5 sm:p-6 backdrop-blur-md transition-all duration-500 h-full"
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
      <div className="page-content">
        <PageHeading eyebrow={t.stack.eyebrow} heading={t.stack.heading} />
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
          {t.stack.domains.map((d, i) => (
            <Reveal key={d.name} delay={0.06 + i * 0.05}>
              <div className="rounded-xl p-4 sm:p-5 h-full backdrop-blur-md" style={{ border: '1px solid rgba(228,226,223,0.08)', background: CARD_BG }}>
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
  return (
    <div
      className="flex flex-col rounded-xl p-4 text-left backdrop-blur-md transition-all duration-500 h-full"
      style={{ border: '1px solid rgba(228,226,223,0.08)', background: CARD_BG }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <h3 className="font-mono text-xs font-semibold transition-colors duration-300" style={{ color: '#e4e2df' }}>{repo.name}</h3>
        {repo.stars > 0 && <span className="font-mono text-[9px]" style={{ color: 'rgba(228,226,223,0.4)' }}>★ {repo.stars}</span>}
      </div>
      <p className="flex-1 text-[11px] leading-relaxed mb-2.5" style={{ color: 'rgba(228,226,223,0.55)' }}>{repo.desc}</p>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" aria-hidden style={{ background: '#22c55e', opacity: 0.6 }} />
        <span className="font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.45)' }}>{repo.lang}</span>
        <span className="ml-auto flex items-center gap-2">
          {repo.websiteUrl && (
            <Magnetic href={repo.websiteUrl} className="font-mono text-[10px] transition-colors duration-300" style={{ color: '#4ade80' }} strength={0.15}>
              {liveLabel}
            </Magnetic>
          )}
          <Magnetic href={repo.url} ariaLabel={`${repo.name} repository`} className="font-mono text-[10px] transition-colors duration-300" style={{ color: 'rgba(228,226,223,0.55)' }} strength={0.15}>
            {codeLabel}
          </Magnetic>
        </span>
      </div>
    </div>
  );
}

export function OpenSourceScene() {
  const { t } = useLang();
  const repos = t.openSource.repos;
  const slides: Repo[][] = [repos.slice(0, 4), repos.slice(4, 8), repos.slice(8, 12)];
  return (
    <div className="page-fill">
      <div className="page-content">
        <PageHeading eyebrow={t.openSource.eyebrow} heading={t.openSource.heading} />

        {/* phones: 3 swipeable 2×2 slides */}
        <div className="md:hidden">
          <SnapCarousel label={t.openSource.heading} prevLabel={t.ui.carouselPrev} nextLabel={t.ui.carouselNext}>
            {slides.map((group, i) => (
              <div key={i} className="grid grid-cols-2 gap-2.5">
                {group.map((r) => (
                  <RepoCard key={r.name} repo={r} liveLabel={t.openSource.liveLabel} codeLabel={t.openSource.codeLabel} />
                ))}
              </div>
            ))}
          </SnapCarousel>
        </div>

        {/* desktop: fitted grid, all twelve */}
        <div className="hidden md:grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {repos.map((r) => (
            <RepoCard key={r.name} repo={r} liveLabel={t.openSource.liveLabel} codeLabel={t.openSource.codeLabel} />
          ))}
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
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
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
      <div className="page-content">
        <PageHeading eyebrow={t.experience.eyebrow} heading={t.experience.heading} />

        {/* phones: accordion, one story at a time */}
        <div className="md:hidden">
          <ExperienceAccordion />
        </div>

        {/* desktop: full timeline */}
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
  );
}

/* ── 09 · CONTACT ────────────────────────────────────────────── */

export function ContactScene() {
  const { t } = useLang();
  return (
    <div className="page-fill">
      <div className="page-content flex flex-col items-center text-center">
        <Reveal>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] mb-4" style={{ color: '#22c55e' }}>
            {t.contact.eyebrow}
          </p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="text-[clamp(1.7rem,7vw,3.2rem)] font-semibold leading-[1.1] tracking-tight mb-4" style={{ color: '#e4e2df' }}>
            {t.contact.headingA}
            <br />
            <span className="gradient-text">{t.contact.headingB}</span>
          </h2>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mx-auto max-w-md mb-8 text-sm" style={{ color: 'rgba(228,226,223,0.6)' }}>
            {t.contact.sub}
          </p>
        </Reveal>

        <Reveal delay={0.18}>
          <div className="flex flex-wrap justify-center gap-3">
            {t.contact.channels.map((c) => (
              <Magnetic
                key={c.label}
                href={c.href}
                ariaLabel={`${c.label}: ${c.value}`}
                className="group flex items-center gap-2.5 rounded-full px-5 py-2.5 backdrop-blur-md transition-all duration-500"
                style={{ border: '1px solid rgba(228,226,223,0.1)', background: 'rgba(8,10,8,0.55)' }}
                strength={0.2}
              >
                <span className="text-xs font-medium transition-colors duration-300" style={{ color: '#e4e2df' }}>{c.label}</span>
                <span className="font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.45)' }}>{c.value}</span>
              </Magnetic>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
