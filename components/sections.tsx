'use client';

import { motion, useScroll, useTransform, useInView, type MotionValue } from 'framer-motion';
import { useRef, useState } from 'react';
import { Magnetic, Reveal } from './ui';
import { MatrixName } from './MatrixName';
import {
  profile,
  stats,
  projects,
  research,
  domains,
  allRepos,
  workHistory,
  contactChannels,
} from '@/app/data';

/* ═══════════════════════════════════════════════════════════════
   SCENE CONTENT COMPONENTS
   Each section is a distinct visual scene. All existing content,
   links, and metadata are preserved.
   ═══════════════════════════════════════════════════════════════ */

/* ── shared parallax background hook ── */
function useSceneParallax(progress: MotionValue<number>, reducedMotion: boolean) {
  const y = useTransform(progress, [0, 1], reducedMotion ? [0, 0] : [0, -60]);
  return y;
}

/* ═══════════════════════════════════════════════════════════════
   01 — HERO
   ═══════════════════════════════════════════════════════════════ */

export function HeroScene({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const bgY = useSceneParallax(scrollYProgress, reducedMotion);
  const contentY = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [0, 120]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    <div ref={ref} className="scene-fill">
      {/* ambient orbs */}
      <motion.div className="orb orb-1" style={{ y: bgY }} />
      <motion.div className="orb orb-2" style={{ y: bgY }} />
      <div className="absolute inset-0 grid-bg" />

      <motion.div
        className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-6 text-center"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <motion.p
          className="font-mono text-[10px] uppercase tracking-[0.4em] mb-8"
          style={{ color: '#38bdf8' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
        >
          {profile.tagline}
        </motion.p>

        <h1
          className="matrix-name-target text-[clamp(3rem,9vw,7rem)] font-semibold leading-[0.92] tracking-tight mb-6"
          style={{ color: '#e8e6e3' }}
        >
          <MatrixName reducedMotion={reducedMotion} />
        </h1>

        <motion.p
          className="mx-auto max-w-lg text-base leading-relaxed"
          style={{ color: 'rgba(232,230,227,0.45)' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.9, duration: 0.7 }}
        >
          Self-taught engineer at the intersection of on-device AI, Android systems,
          and ARM64 Linux. Every build runs on CI. Every claim checked against a physical device.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.1, duration: 0.7 }}
        >
          <Magnetic
            href="#work"
            className="rounded-full px-7 py-3 text-sm font-medium transition-all duration-300"
            style={{ background: '#38bdf8', color: '#060608' }}
          >
            Explore my work
          </Magnetic>
          <Magnetic
            href="https://github.com/soobujmiah"
            className="rounded-full px-7 py-3 text-sm font-medium transition-all duration-300"
            style={{ border: '1px solid rgba(232,230,227,0.15)', color: '#e8e6e3' }}
          >
            View GitHub ↗
          </Magnetic>
        </motion.div>
      </motion.div>

      {/* scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 1 }}
      >
        <motion.div
          className="flex flex-col items-center gap-2"
          animate={reducedMotion ? {} : { y: [0, 6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: 'rgba(232,230,227,0.2)' }}>
            Scroll
          </span>
          <div className="w-px h-6" style={{ background: 'linear-gradient(to bottom, #38bdf8, transparent)' }} />
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   02 — STATS
   ═══════════════════════════════════════════════════════════════ */

export function StatsScene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="scene-fill">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-6">
        <Reveal>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] mb-8" style={{ color: '#38bdf8' }}>
            At a glance
          </p>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <div className="text-center">
                <motion.p
                  className="text-4xl sm:text-5xl font-bold tabular-nums"
                  style={{ color: '#e8e6e3' }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  {s.value}
                </motion.p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: 'rgba(232,230,227,0.3)' }}>
                  {s.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   03 — ABOUT
   ═══════════════════════════════════════════════════════════════ */

export function AboutScene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="scene-fill">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col justify-center px-6 py-20">
        <Reveal>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] mb-5" style={{ color: '#38bdf8' }}>
            01 — About
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <h2 className="text-[clamp(1.6rem,3.5vw,2.8rem)] font-semibold leading-[1.15] tracking-tight max-w-3xl mb-8" style={{ color: '#e8e6e3' }}>
            Self-taught systems builder working from constraints most people treat as blockers.
          </h2>
        </Reveal>

        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4">
            {[
              'I am a self-taught systems builder based in Dhaka, Bangladesh. My work sits at the intersection of on-device AI, Android systems, and ARM64 Linux — problems I pursue because the tools I needed did not exist yet on the hardware I had.',
              'A defining constraint: I develop, build, and validate software primarily from an Android phone running Termux and PRoot Debian, not a conventional PC. This shapes everything — tooling, CI architecture, how I verify claims.',
              'My learning philosophy: living till learning, dead upon stop learning. I learn through real problems — hypothesis, test, observation, formal theory, compare, iterate. Mechanism-first, evidence-backed.',
            ].map((p, i) => (
              <Reveal key={i} delay={0.1 + i * 0.06}>
                <p className="text-sm leading-[1.8]" style={{ color: 'rgba(232,230,227,0.45)' }}>{p}</p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.15}>
            <div className="rounded-xl p-6 space-y-0" style={{ border: '1px solid rgba(232,230,227,0.05)', background: 'rgba(255,255,255,0.01)' }}>
              {[
                { label: 'Based in', value: 'Dhaka, Bangladesh (GMT+6)' },
                { label: 'Languages', value: 'Bangla, English, Hindi/Urdu, Arabic' },
                { label: 'Reference device', value: 'Redmi Turbo 4 Pro — SD 8s Gen 4' },
                { label: 'Build pipeline', value: 'GitHub Actions CI/CD' },
              ].map((f, i) => (
                <div key={f.label} className={`flex items-start justify-between gap-4 py-3 ${i < 3 ? 'border-b' : ''}`} style={{ borderColor: 'rgba(232,230,227,0.04)' }}>
                  <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'rgba(232,230,227,0.25)' }}>{f.label}</span>
                  <span className="text-xs font-medium text-right" style={{ color: '#e8e6e3' }}>{f.value}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   04 — FEATURED WORK
   ═══════════════════════════════════════════════════════════════ */

function ProjectCard({ project, index }: { project: typeof projects[number]; index: number }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
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
      style={{ border: '1px solid rgba(232,230,227,0.05)', background: 'rgba(255,255,255,0.01)' }}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      whileHover={{ borderColor: 'rgba(232,230,227,0.1)', y: -4 }}
    >
      {isHovered && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, ${project.accent}08, transparent 60%)`,
          }}
        />
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="font-mono text-[10px]" style={{ color: 'rgba(232,230,227,0.2)' }}>0{index + 1}</span>
              <span className="font-mono text-[10px]" style={{ color: 'rgba(232,230,227,0.2)' }}>{project.year}</span>
            </div>
            <h3 className="text-2xl font-semibold tracking-tight" style={{ color: '#e8e6e3' }}>{project.name}</h3>
            <p className="mt-0.5 text-xs" style={{ color: project.accent }}>{project.tagline}</p>
          </div>
          <Magnetic
            href={project.repo}
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300"
            style={{ border: '1px solid rgba(232,230,227,0.08)', color: 'rgba(232,230,227,0.35)' }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M1 13L13 1M13 1H3M13 1V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Magnetic>
        </div>

        <p className="text-xs leading-[1.7] mb-4" style={{ color: 'rgba(232,230,227,0.4)' }}>
          {project.description}
        </p>

        <p className="text-xs leading-[1.7] mb-5" style={{ color: 'rgba(232,230,227,0.3)' }}>
          <span style={{ color: 'rgba(232,230,227,0.5)' }}>Evidence: </span>{project.evidence}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {project.topics.map((t) => (
            <span key={t} className="rounded-full px-2.5 py-0.5 font-mono text-[10px]" style={{ border: '1px solid rgba(232,230,227,0.06)', color: 'rgba(232,230,227,0.3)' }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

export function WorkScene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="scene-fill">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col justify-center px-6 py-20">
        <Reveal>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] mb-5" style={{ color: '#38bdf8' }}>
            02 — Featured Work
          </p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="text-[clamp(1.6rem,3.5vw,2.8rem)] font-semibold leading-[1.15] tracking-tight max-w-2xl mb-10" style={{ color: '#e8e6e3' }}>
            The strongest work — not every repository.
          </h2>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2">
          {projects.map((p, i) => (
            <ProjectCard key={p.name} project={p} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   05 — RESEARCH & EXPERIMENTS
   ═══════════════════════════════════════════════════════════════ */

export function ResearchScene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="scene-fill">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col justify-center px-6 py-20">
        <Reveal>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] mb-5" style={{ color: '#38bdf8' }}>
            03 — Research & Experiments
          </p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="text-[clamp(1.6rem,3.5vw,2.8rem)] font-semibold leading-[1.15] tracking-tight max-w-2xl mb-10" style={{ color: '#e8e6e3' }}>
            Honest about what is proven vs. experimental.
          </h2>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2">
          {research.map((r, i) => (
            <Reveal key={r.title} delay={0.08 + i * 0.06}>
              <div
                className="rounded-xl p-6 transition-all duration-500 h-full"
                style={{ border: '1px solid rgba(232,230,227,0.05)', background: 'rgba(255,255,255,0.01)' }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      background: r.status === 'validated' ? '#00e5a0' : r.status === 'experimental' ? '#38bdf8' : 'rgba(232,230,227,0.3)',
                    }}
                  />
                  <span className="font-mono text-[9px] uppercase tracking-[0.15em]" style={{ color: 'rgba(232,230,227,0.25)' }}>
                    {r.status}
                  </span>
                </div>
                <h3 className="text-base font-semibold mb-1.5" style={{ color: '#e8e6e3' }}>{r.title}</h3>
                <p className="text-xs leading-[1.7]" style={{ color: 'rgba(232,230,227,0.4)' }}>{r.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   06 — TECHNICAL FOCUS
   ═══════════════════════════════════════════════════════════════ */

export function StackScene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="scene-fill">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col justify-center px-6 py-20">
        <Reveal>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] mb-5" style={{ color: '#38bdf8' }}>
            04 — Technical Focus
          </p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="text-[clamp(1.6rem,3.5vw,2.8rem)] font-semibold leading-[1.15] tracking-tight max-w-2xl mb-10" style={{ color: '#e8e6e3' }}>
            Technologies I actually work with.
          </h2>
        </Reveal>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {domains.map((d, i) => (
            <Reveal key={d.name} delay={0.06 + i * 0.05}>
              <div className="rounded-xl p-5 h-full" style={{ border: '1px solid rgba(232,230,227,0.04)', background: 'rgba(255,255,255,0.008)' }}>
                <h3 className="font-mono text-xs font-medium mb-3" style={{ color: '#38bdf8' }}>{d.name}</h3>
                <ul className="space-y-1.5">
                  {d.items.map((item) => (
                    <li key={item} className="text-xs" style={{ color: 'rgba(232,230,227,0.35)' }}>{item}</li>
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

/* ═══════════════════════════════════════════════════════════════
   07 — OPEN SOURCE
   ═══════════════════════════════════════════════════════════════ */

export function OpenSourceScene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="scene-fill">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col justify-center px-6 py-20">
        <Reveal>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] mb-5" style={{ color: '#38bdf8' }}>
            05 — Open Source
          </p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="text-[clamp(1.6rem,3.5vw,2.8rem)] font-semibold leading-[1.15] tracking-tight max-w-2xl mb-10" style={{ color: '#e8e6e3' }}>
            Selected repositories.
          </h2>
        </Reveal>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allRepos.map((r, i) => (
            <Reveal key={r.name} delay={0.03 + i * 0.03}>
              <Magnetic
                href={r.url}
                className="group flex flex-col rounded-xl p-5 text-left transition-all duration-500 h-full"
                style={{ border: '1px solid rgba(232,230,227,0.04)', background: 'rgba(255,255,255,0.008)' }}
                strength={0.15}
              >
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-mono text-xs font-semibold transition-colors duration-300" style={{ color: '#e8e6e3' }}>{r.name}</h3>
                  {r.stars > 0 && <span className="font-mono text-[9px]" style={{ color: 'rgba(232,230,227,0.2)' }}>★ {r.stars}</span>}
                </div>
                <p className="flex-1 text-[11px] leading-relaxed mb-3" style={{ color: 'rgba(232,230,227,0.3)' }}>{r.desc}</p>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: '#38bdf8', opacity: 0.6 }} />
                  <span className="font-mono text-[10px]" style={{ color: 'rgba(232,230,227,0.25)' }}>{r.lang}</span>
                </div>
              </Magnetic>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   08 — EXPERIENCE
   ═══════════════════════════════════════════════════════════════ */

export function ExperienceScene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="scene-fill">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col justify-center px-6 py-20">
        <Reveal>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] mb-5" style={{ color: '#38bdf8' }}>
            06 — Experience
          </p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="text-[clamp(1.6rem,3.5vw,2.8rem)] font-semibold leading-[1.15] tracking-tight max-w-2xl mb-10" style={{ color: '#e8e6e3' }}>
            8+ years across operations, engineering, and administration.
          </h2>
        </Reveal>

        <div className="relative">
          <div className="absolute left-[5px] top-0 bottom-0 w-px" style={{ background: 'rgba(232,230,227,0.05)' }} />
          {workHistory.map((w, i) => (
            <Reveal key={i} delay={0.06 + i * 0.05}>
              <div className="relative pl-8 pb-6 last:pb-0">
                <div className="absolute left-0 top-1 h-3 w-3 rounded-full border-2" style={{ borderColor: '#38bdf8', background: '#060608' }} />
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                  <span className="font-mono text-[10px]" style={{ color: 'rgba(232,230,227,0.25)' }}>{w.period}</span>
                  <h3 className="text-sm font-semibold" style={{ color: '#e8e6e3' }}>{w.role}</h3>
                </div>
                <p className="text-xs" style={{ color: 'rgba(232,230,227,0.4)' }}>
                  {w.company} · {w.location}
                </p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(232,230,227,0.3)' }}>{w.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   09 — CONTACT
   ═══════════════════════════════════════════════════════════════ */

export function ContactScene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="scene-fill">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative z-10 mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-6 text-center">
        <Reveal>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] mb-5" style={{ color: '#38bdf8' }}>
            07 — Contact
          </p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="text-[clamp(1.8rem,4vw,3.2rem)] font-semibold leading-[1.1] tracking-tight mb-5" style={{ color: '#e8e6e3' }}>
            Open to freelance,
            <br />
            <span className="gradient-text">remote, and collaboration.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mx-auto max-w-md mb-10 text-sm" style={{ color: 'rgba(232,230,227,0.4)' }}>
            On-device AI, Android systems, ARM64 tooling, or local-first products — happy to talk.
          </p>
        </Reveal>

        <Reveal delay={0.18}>
          <div className="flex flex-wrap justify-center gap-3">
            {contactChannels.map((c) => (
              <Magnetic
                key={c.label}
                href={c.href}
                className="group flex items-center gap-2.5 rounded-full px-5 py-2.5 transition-all duration-500"
                style={{ border: '1px solid rgba(232,230,227,0.07)', background: 'rgba(255,255,255,0.01)' }}
                strength={0.2}
              >
                <span className="text-xs font-medium transition-colors duration-300" style={{ color: '#e8e6e3' }}>{c.label}</span>
                <span className="font-mono text-[10px]" style={{ color: 'rgba(232,230,227,0.25)' }}>{c.value}</span>
              </Magnetic>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
