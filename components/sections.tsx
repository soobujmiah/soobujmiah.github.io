'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { Magnetic, Reveal, useNav } from './ui';
import { MatrixName } from './MatrixName';
import { useSceneActive } from './PinnedSection';
import { useLang } from '@/app/language';
import type { Project } from '@/app/content';

/* ═══════════════════════════════════════════════════════════════
   SCENE CONTENT COMPONENTS — green + dark theme.
   All copy flows from the bilingual content tree (useLang).
   ═══════════════════════════════════════════════════════════════ */

/* ── 01 · HERO ───────────────────────────────────────────────── */

export function HeroScene({ reducedMotion }: { reducedMotion: boolean }) {
  const { t } = useLang();
  const { goToScene } = useNav();

  return (
    <div className="scene-fill">
      <div className="orb orb-1" aria-hidden />
      <div className="orb orb-2" aria-hidden />
      <div className="absolute inset-0 grid-bg" aria-hidden />

      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-6 text-center">
        <motion.p
          className="font-mono text-[10px] uppercase tracking-[0.4em] mb-6"
          style={{ color: '#22c55e' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
        >
          {t.profile.tagline}
        </motion.p>

        <h1
          className="text-[clamp(2.8rem,8vw,6.5rem)] font-semibold leading-[0.92] tracking-tight mb-5"
          style={{ color: '#e4e2df' }}
        >
          <MatrixName reducedMotion={reducedMotion} />
        </h1>

        <motion.p
          className="mx-auto max-w-md text-sm leading-relaxed"
          style={{ color: 'rgba(228,226,223,0.6)' }}
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
            href="#scene-work"
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
            className="rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-300"
            style={{ border: '1px solid rgba(228,226,223,0.15)', color: '#e4e2df' }}
          >
            {t.hero.ctaGithub}
          </Magnetic>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
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
          <span className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: 'rgba(228,226,223,0.35)' }}>
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
    <div className="scene-fill">
      <div className="absolute inset-0 grid-bg opacity-50" aria-hidden />
      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-6">
        <Reveal>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] mb-8" style={{ color: '#22c55e' }}>
            {t.presence.eyebrow}
          </p>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
          {t.presence.items.map((p, i) => (
            <Reveal key={p.label} delay={i * 0.08}>
              <div className="text-center">
                <p className="text-base sm:text-lg font-semibold" style={{ color: '#e4e2df' }}>{p.label}</p>
                <p className="mt-1.5 font-mono text-[10px] leading-relaxed" style={{ color: 'rgba(228,226,223,0.5)' }}>
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

/* ── 03 · ABOUT ──────────────────────────────────────────────── */

export function AboutScene() {
  const { t } = useLang();
  return (
    <div className="scene-fill">
      <div className="absolute inset-0 grid-bg opacity-30" aria-hidden />
      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col justify-center px-6 py-20">
        <Reveal>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] mb-5" style={{ color: '#22c55e' }}>
            {t.about.eyebrow}
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <h2 className="text-[clamp(1.6rem,3.5vw,2.8rem)] font-semibold leading-[1.15] tracking-tight max-w-3xl mb-8" style={{ color: '#e4e2df' }}>
            {t.about.heading}
          </h2>
        </Reveal>

        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4">
            {t.about.paragraphs.map((p, i) => (
              <Reveal key={i} delay={0.1 + i * 0.06}>
                <p className="text-sm leading-[1.8]" style={{ color: 'rgba(228,226,223,0.6)' }}>{p}</p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.15}>
            <div className="rounded-xl p-6 space-y-0" style={{ border: '1px solid rgba(228,226,223,0.05)', background: 'rgba(255,255,255,0.01)' }}>
              {t.about.facts.map((f, i) => (
                <div key={f.label} className={`flex items-start justify-between gap-4 py-3 ${i < t.about.facts.length - 1 ? 'border-b' : ''}`} style={{ borderColor: 'rgba(228,226,223,0.04)' }}>
                  <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'rgba(228,226,223,0.4)' }}>{f.label}</span>
                  <span className="text-xs font-medium text-right" style={{ color: '#e4e2df' }}>{f.value}</span>
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
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const sceneActive = useSceneActive();
  const shown = inView && sceneActive;
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
      className="group relative rounded-xl p-6 sm:p-7 transition-all duration-500"
      style={{ border: '1px solid rgba(228,226,223,0.05)', background: 'rgba(255,255,255,0.01)' }}
      initial={{ opacity: 0, y: 50 }}
      animate={shown ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      whileHover={{ borderColor: 'rgba(228,226,223,0.1)', y: -4 }}
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
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.35)' }}>0{index + 1}</span>
              <span className="font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.35)' }}>{project.year}</span>
            </div>
            <h3 className="text-2xl font-semibold tracking-tight" style={{ color: '#e4e2df' }}>{project.name}</h3>
            <p className="mt-0.5 text-xs" style={{ color: project.accent }}>{project.tagline}</p>
          </div>
          <Magnetic
            href={project.repo}
            ariaLabel={`${project.name} repository`}
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300"
            style={{ border: '1px solid rgba(228,226,223,0.08)', color: 'rgba(228,226,223,0.5)' }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M1 13L13 1M13 1H3M13 1V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Magnetic>
        </div>

        <p className="text-xs leading-[1.7] mb-4" style={{ color: 'rgba(228,226,223,0.55)' }}>
          {project.description}
        </p>

        <p className="text-xs leading-[1.7] mb-5" style={{ color: 'rgba(228,226,223,0.45)' }}>
          <span style={{ color: 'rgba(228,226,223,0.6)' }}>{t.work.evidenceLabel}</span>{project.evidence}
        </p>

        <div className="flex flex-wrap items-center gap-1.5">
          {project.topics.map((topic) => (
            <span key={topic} className="rounded-full px-2.5 py-0.5 font-mono text-[10px]" style={{ border: '1px solid rgba(228,226,223,0.06)', color: 'rgba(228,226,223,0.45)' }}>
              {topic}
            </span>
          ))}
          {project.websiteUrl && (
            <Magnetic
              href={project.websiteUrl}
              className="rounded-full px-2.5 py-0.5 font-mono text-[10px] transition-colors duration-300"
              style={{ border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' }}
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

export function WorkScene() {
  const { t } = useLang();
  const nb = t.work.nowBuilding;
  return (
    <div className="scene-fill">
      <div className="absolute inset-0 grid-bg opacity-30" aria-hidden />
      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col justify-center px-6 py-20">
        <Reveal>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] mb-5" style={{ color: '#22c55e' }}>
            {t.work.eyebrow}
          </p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="text-[clamp(1.6rem,3.5vw,2.8rem)] font-semibold leading-[1.15] tracking-tight max-w-2xl mb-10" style={{ color: '#e4e2df' }}>
            {t.work.heading}
          </h2>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2">
          {t.work.projects.map((p, i) => (
            <ProjectCard key={p.name} project={p} index={i} />
          ))}
        </div>

        <Reveal delay={0.15}>
          <Magnetic
            href={nb.url}
            className="mt-5 flex flex-col gap-2 rounded-xl p-5 text-left transition-all duration-500 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
            style={{ border: '1px solid rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.04)' }}
            strength={0.08}
          >
            <span>
              <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: '#4ade80' }}>
                {nb.eyebrow}
              </span>
              <span className="block text-sm font-semibold" style={{ color: '#e4e2df' }}>{nb.name}</span>
              <span className="mt-1 block text-xs leading-relaxed" style={{ color: 'rgba(228,226,223,0.55)' }}>
                {nb.description}
              </span>
              <span className="mt-1.5 block font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.4)' }}>
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
    <div className="scene-fill">
      <div className="absolute inset-0 grid-bg opacity-30" aria-hidden />
      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col justify-center px-6 py-20">
        <Reveal>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] mb-5" style={{ color: '#22c55e' }}>
            {t.research.eyebrow}
          </p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="text-[clamp(1.6rem,3.5vw,2.8rem)] font-semibold leading-[1.15] tracking-tight max-w-2xl mb-10" style={{ color: '#e4e2df' }}>
            {t.research.heading}
          </h2>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2">
          {t.research.entries.map((r, i) => (
            <Reveal key={r.title} delay={0.08 + i * 0.06}>
              <div
                className="rounded-xl p-6 transition-all duration-500 h-full"
                style={{ border: '1px solid rgba(228,226,223,0.05)', background: 'rgba(255,255,255,0.01)' }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <span
                    className="h-2 w-2 rounded-full"
                    aria-hidden
                    style={{
                      background: r.status === 'validated' ? '#22c55e' : r.status === 'experimental' ? '#4ade80' : 'rgba(228,226,223,0.3)',
                    }}
                  />
                  <span className="font-mono text-[9px] uppercase tracking-[0.15em]" style={{ color: 'rgba(228,226,223,0.4)' }}>
                    {r.statusLabel}
                  </span>
                </div>
                <h3 className="text-base font-semibold mb-1.5" style={{ color: '#e4e2df' }}>{r.title}</h3>
                <p className="text-xs leading-[1.7]" style={{ color: 'rgba(228,226,223,0.55)' }}>{r.description}</p>
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
    <div className="scene-fill">
      <div className="absolute inset-0 grid-bg opacity-30" aria-hidden />
      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col justify-center px-6 py-20">
        <Reveal>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] mb-5" style={{ color: '#22c55e' }}>
            {t.stack.eyebrow}
          </p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="text-[clamp(1.6rem,3.5vw,2.8rem)] font-semibold leading-[1.15] tracking-tight max-w-2xl mb-10" style={{ color: '#e4e2df' }}>
            {t.stack.heading}
          </h2>
        </Reveal>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {t.stack.domains.map((d, i) => (
            <Reveal key={d.name} delay={0.06 + i * 0.05}>
              <div className="rounded-xl p-5 h-full" style={{ border: '1px solid rgba(228,226,223,0.04)', background: 'rgba(255,255,255,0.008)' }}>
                <h3 className="font-mono text-xs font-medium mb-3" style={{ color: '#22c55e' }}>{d.name}</h3>
                <ul className="space-y-1.5">
                  {d.items.map((item) => (
                    <li key={item} className="text-xs" style={{ color: 'rgba(228,226,223,0.5)' }}>{item}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 07 · OPEN SOURCE ────────────────────────────────────────── */

export function OpenSourceScene() {
  const { t } = useLang();
  return (
    <div className="scene-fill">
      <div className="absolute inset-0 grid-bg opacity-30" aria-hidden />
      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col justify-center px-6 py-20">
        <Reveal>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] mb-5" style={{ color: '#22c55e' }}>
            {t.openSource.eyebrow}
          </p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="text-[clamp(1.6rem,3.5vw,2.8rem)] font-semibold leading-[1.15] tracking-tight max-w-2xl mb-10" style={{ color: '#e4e2df' }}>
            {t.openSource.heading}
          </h2>
        </Reveal>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {t.openSource.repos.map((r, i) => (
            <Reveal key={r.name} delay={0.03 + i * 0.03}>
              <div
                className="flex flex-col rounded-xl p-5 text-left transition-all duration-500 h-full"
                style={{ border: '1px solid rgba(228,226,223,0.04)', background: 'rgba(255,255,255,0.008)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-mono text-xs font-semibold transition-colors duration-300" style={{ color: '#e4e2df' }}>{r.name}</h3>
                  {r.stars > 0 && <span className="font-mono text-[9px]" style={{ color: 'rgba(228,226,223,0.35)' }}>★ {r.stars}</span>}
                </div>
                <p className="flex-1 text-[11px] leading-relaxed mb-3" style={{ color: 'rgba(228,226,223,0.5)' }}>{r.desc}</p>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" aria-hidden style={{ background: '#22c55e', opacity: 0.6 }} />
                  <span className="font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.4)' }}>{r.lang}</span>
                  <span className="ml-auto flex items-center gap-2">
                    {r.websiteUrl && (
                      <Magnetic href={r.websiteUrl} className="font-mono text-[10px] transition-colors duration-300" style={{ color: '#4ade80' }} strength={0.15}>
                        {t.openSource.liveLabel}
                      </Magnetic>
                    )}
                    <Magnetic href={r.url} ariaLabel={`${r.name} repository`} className="font-mono text-[10px] transition-colors duration-300" style={{ color: 'rgba(228,226,223,0.5)' }} strength={0.15}>
                      {t.openSource.codeLabel}
                    </Magnetic>
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 08 · EXPERIENCE ─────────────────────────────────────────── */

export function ExperienceScene() {
  const { t } = useLang();
  return (
    <div className="scene-fill">
      <div className="absolute inset-0 grid-bg opacity-30" aria-hidden />
      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col justify-center px-6 py-20">
        <Reveal>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] mb-5" style={{ color: '#22c55e' }}>
            {t.experience.eyebrow}
          </p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="text-[clamp(1.6rem,3.5vw,2.8rem)] font-semibold leading-[1.15] tracking-tight max-w-2xl mb-10" style={{ color: '#e4e2df' }}>
            {t.experience.heading}
          </h2>
        </Reveal>

        <div className="relative">
          <div className="absolute left-[5px] top-0 bottom-0 w-px" style={{ background: 'rgba(228,226,223,0.05)' }} aria-hidden />
          {t.experience.entries.map((w, i) => (
            <Reveal key={`${w.company}-${i}`} delay={0.06 + i * 0.05}>
              <div className="relative pl-8 pb-6 last:pb-0">
                <div className="absolute left-0 top-1 h-3 w-3 rounded-full border-2" style={{ borderColor: '#22c55e', background: '#060608' }} aria-hidden />
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                  <span className="font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.4)' }}>{w.period}</span>
                  <h3 className="text-sm font-semibold" style={{ color: '#e4e2df' }}>{w.role}</h3>
                </div>
                <p className="text-xs" style={{ color: 'rgba(228,226,223,0.55)' }}>
                  {w.company} · {w.location}
                </p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(228,226,223,0.45)' }}>{w.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 09 · CONTACT (terminal scene) ───────────────────────────── */

export function ContactScene() {
  const { t } = useLang();
  return (
    <div className="scene-fill">
      <div className="absolute inset-0 grid-bg opacity-30" aria-hidden />
      <div className="relative z-10 mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-6 text-center">
        <Reveal>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] mb-5" style={{ color: '#22c55e' }}>
            {t.contact.eyebrow}
          </p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="text-[clamp(1.8rem,4vw,3.2rem)] font-semibold leading-[1.1] tracking-tight mb-5" style={{ color: '#e4e2df' }}>
            {t.contact.headingA}
            <br />
            <span className="gradient-text">{t.contact.headingB}</span>
          </h2>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mx-auto max-w-md mb-10 text-sm" style={{ color: 'rgba(228,226,223,0.55)' }}>
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
                className="group flex items-center gap-2.5 rounded-full px-5 py-2.5 transition-all duration-500"
                style={{ border: '1px solid rgba(228,226,223,0.07)', background: 'rgba(255,255,255,0.01)' }}
                strength={0.2}
              >
                <span className="text-xs font-medium transition-colors duration-300" style={{ color: '#e4e2df' }}>{c.label}</span>
                <span className="font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.4)' }}>{c.value}</span>
              </Magnetic>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
