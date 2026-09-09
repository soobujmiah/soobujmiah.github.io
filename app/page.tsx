'use client';

import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  AnimatePresence,
  type MotionValue,
} from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════ */

const profile = {
  name: 'Sobuj Miah',
  title: 'Independent Software & AI Systems Engineer',
  tagline: 'On-device AI · Android · Linux · ARM64 · GPU/NPU',
  location: 'Dhaka, Bangladesh',
  github: 'https://github.com/soobujmiah',
  email: 'soobujmiah@gmail.com',
  telegram: '@soobujmiah',
  linkedin: 'https://linkedin.com/in/soobujmiah',
};

const projects = [
  {
    name: 'LAI',
    tagline: 'Bangla-first local AI + consent-driven automation',
    year: '2024–26',
    description:
      'Source-only Android runtime for private on-device LLM inference and Accessibility-gated automation. CPU inference device-validated; GPU/NPU in qualification.',
    evidence:
      'Real arm64 llama.cpp CPU inference, ~20 tok/s decode, KV-prefix reuse. Symbolized root-cause diagnosis of an Adreno Vulkan driver crash that shaped a fail-closed CPU-default architecture.',
    topics: ['Kotlin', 'llama.cpp', 'Vulkan', 'Accessibility', 'Shizuku', 'GGUF'],
    repo: 'https://github.com/soobujmiah/lai',
    accent: '#38bdf8',
  },
  {
    name: 'GGEN',
    tagline: 'Android-first creative & document studio',
    year: '2024–26',
    description:
      'Flutter/Dart foundation for professional vector, raster, document, and PDF work. Documentation-first architecture with pure-Dart core and SHA-256 state integrity.',
    evidence:
      '143 pure-Dart unit tests, 353 widget/controller tests. Multi-stage PR history validated on a physical device round after round.',
    topics: ['Flutter', 'Dart', 'Document Generation', 'Vector Graphics'],
    repo: 'https://github.com/soobujmiah/ggen',
    accent: '#00e5a0',
  },
  {
    name: 'ADT',
    tagline: 'Native ARM64 Android development toolchain',
    year: '2023–26',
    description:
      'Builds Android SDK build-tools and platform-tools from AOSP source for Linux ARM64/glibc. SHA-256-verified offline release artifacts.',
    evidence:
      'Full ARM64 native APK pipeline validated end-to-end on Snapdragon 8s Gen 4: source → APK → sign → install → JNI load → run.',
    topics: ['AOSP', 'ARM64', 'Build Tools', 'Cross-compilation'],
    repo: 'https://github.com/soobujmiah/adt',
    accent: '#a78bfa',
  },
  {
    name: 'Ternux',
    tagline: 'No-root Debian/Xfce Linux desktop on Android',
    year: '2023–26',
    description:
      'Installs a real Debian ARM64 userspace, Xfce4 desktop, Termux:X11 display, PulseAudio bridge, and Zink/Turnip GPU route — one command, no root.',
    evidence:
      'Zink/Turnip renderer confirmed on Adreno 825: glmark2 score 140 (OpenGL 4.6). Blender 4.3.2 launched with Zink/Adreno/Turnip renderer.',
    topics: ['Debian', 'Vulkan', 'Turnip', 'Zink', 'Adreno', 'PRoot'],
    repo: 'https://github.com/soobujmiah/ternux',
    accent: '#f59e0b',
  },
];

const research = [
  {
    title: 'Snapdragon / Hexagon NPU',
    status: 'experimental',
    description:
      'Qualcomm Hexagon HTP NPU evaluation. First real non-CPU backend confirmed working with FastRPC/DSP evidence. QAIRT/QNN runtime evaluation ongoing.',
  },
  {
    title: 'Adreno Vulkan / GPU',
    status: 'experimental',
    description:
      'Mesa Turnip Vulkan, Zink OpenGL-on-Vulkan, native Vulkan compute. Vulkan compute crashes at decode — root-caused, documented, shaped fail-closed architecture.',
  },
  {
    title: 'Android Automation',
    status: 'validated',
    description:
      'AccessibilityService + Shizuku privileged execution with explicit consent, hash-chained audit trails, typed operation policies. No raw shell API.',
  },
  {
    title: 'AI Agents & Orchestration',
    status: 'investigating',
    description:
      'Policy-gated tool dispatch, signed model catalog with SHA-256 verification, multi-provider gateway with failover routing, encrypted credential storage.',
  },
];

const allRepos = [
  { name: 'lai', desc: 'Bangla-first local AI + automation runtime', lang: 'Kotlin', stars: 1, url: 'https://github.com/soobujmiah/lai' },
  { name: 'adt', desc: 'ARM64 Android dev toolchain from AOSP source', lang: 'Shell', stars: 0, url: 'https://github.com/soobujmiah/adt' },
  { name: 'ternux', desc: 'GPU-accelerated Linux desktop on Android', lang: 'Shell', stars: 1, url: 'https://github.com/soobujmiah/ternux' },
  { name: 'ggen', desc: 'Android-first creative & document studio', lang: 'Dart', stars: 0, url: 'https://github.com/soobujmiah/ggen' },
  { name: 'datakhoj-android', desc: 'Universal data collector for Android', lang: 'Kotlin', stars: 0, url: 'https://github.com/soobujmiah/datakhoj-android' },
  { name: 'songjog', desc: 'Bangla-first business ledger app', lang: 'Dart', stars: 0, url: 'https://github.com/soobujmiah/songjog' },
  { name: 'apiloop', desc: 'Provider-agnostic AI API gateway', lang: 'Python', stars: 0, url: 'https://github.com/soobujmiah/apiloop' },
  { name: 'sobkichu', desc: 'Bangladesh hyperlocal super-app', lang: 'TypeScript', stars: 0, url: 'https://github.com/soobujmiah/sobkichu' },
  { name: 'docdr', desc: 'Mobile-first offline document workspace', lang: 'Dart', stars: 0, url: 'https://github.com/soobujmiah/docdr' },
];

/* ═══════════════════════════════════════════════════════════════
   CUSTOM CURSOR
   ═══════════════════════════════════════════════════════════════ */

function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = mouseX + 'px';
      dot.style.top = mouseY + 'px';
      setVisible(true);
    };

    const onDown = () => setClicking(true);
    const onUp = () => setClicking(false);
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    // magnetic hover on interactive elements
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [data-magnetic]')) {
        setHovering(true);
      }
    };
    const onOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [data-magnetic]')) {
        setHovering(false);
      }
    };

    // smooth ring follow
    const animate = () => {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      ring.style.left = ringX + 'px';
      ring.style.top = ringY + 'px';
      requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    const raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        className="cursor-dot"
        style={{ opacity: visible ? 1 : 0 }}
      />
      <div
        ref={ringRef}
        className={`cursor-ring${hovering ? ' hover' : ''}${clicking ? ' clicking' : ''}`}
        style={{ opacity: visible ? 1 : 0 }}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAGNETIC BUTTON
   ═══════════════════════════════════════════════════════════════ */

function MagneticButton({
  children,
  className = '',
  href,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setOffset({
      x: (e.clientX - cx) * 0.25,
      y: (e.clientY - cy) * 0.25,
    });
  };

  const onLeave = () => setOffset({ x: 0, y: 0 });

  const style: React.CSSProperties = {
    transform: `translate(${offset.x}px, ${offset.y}px)`,
    transition: offset.x === 0 ? 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' : 'transform 0.15s ease',
  };

  return (
    <a
      ref={ref}
      href={href}
      data-magnetic
      className={className}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={style}
      {...props}
    >
      {children}
    </a>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCROLL REVEAL WRAPPER
   ═══════════════════════════════════════════════════════════════ */

function Reveal({
  children,
  delay = 0,
  className = '',
  y = 40,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TEXT REVEAL (line by line)
   ═══════════════════════════════════════════════════════════════ */

function TextReveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  // If children is a string, animate word by word
  if (typeof children === 'string') {
    const words = children.split(' ');
    return (
      <span ref={ref} className={className}>
        {words.map((word, i) => (
          <span key={i} className="inline-block overflow-hidden align-bottom mr-[0.25em]">
            <motion.span
              className="inline-block"
              initial={{ y: '110%' }}
              animate={inView ? { y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: delay + i * 0.04,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </span>
    );
  }

  // For ReactNode children (e.g. wrapped in span), animate the whole block
  return (
    <span ref={ref} className={className}>
      <motion.span
        className="inline-block"
        initial={{ y: '110%' }}
        animate={inView ? { y: 0 } : {}}
        transition={{
          duration: 0.7,
          delay,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRELOADER
   ═══════════════════════════════════════════════════════════════ */

function Preloader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 15 + 5;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(onComplete, 400);
      }
      setProgress(Math.min(current, 100));
    }, 120);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-[#08080a]"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-center"
      >
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-[rgba(232,230,227,0.3)] mb-6">
          Loading experience
        </p>
        <p className="font-mono text-5xl font-light text-[#e8e6e3] tabular-nums">
          {String(Math.round(progress)).padStart(3, '0')}
        </p>
      </motion.div>
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48 h-px bg-[rgba(232,230,227,0.06)]">
        <motion.div
          className="h-full bg-[#38bdf8]"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HEADER
   ═══════════════════════════════════════════════════════════════ */

function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-[9998] transition-all duration-500 ${
        scrolled ? 'py-4 backdrop-blur-xl bg-[#08080a]/70 border-b border-[rgba(232,230,227,0.04)]' : 'py-6'
      }`}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 sm:px-10">
        <a href="#" className="font-mono text-sm font-medium tracking-tight text-[#e8e6e3]" data-magnetic>
          sobuj<span className="text-[#38bdf8]">.</span>miah
        </a>
        <nav className="hidden md:flex items-center gap-10">
          {[
            { href: '#work', label: 'Work' },
            { href: '#research', label: 'Research' },
            { href: '#stack', label: 'Stack' },
            { href: '#contact', label: 'Contact' },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-[rgba(232,230,227,0.45)] transition-colors duration-300 hover:text-[#e8e6e3]"
              data-magnetic
            >
              {l.label}
            </a>
          ))}
        </nav>
        <MagneticButton
          href="https://github.com/soobujmiah"
          className="rounded-full border border-[rgba(232,230,227,0.12)] px-5 py-2 text-xs font-medium text-[#e8e6e3] transition-colors duration-300 hover:border-[#38bdf8] hover:text-[#38bdf8]"
        >
          GitHub
        </MagneticButton>
      </div>
    </motion.header>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════════════════ */

function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      {/* grid */}
      <div className="absolute inset-0 grid-bg opacity-100" />

      <motion.div style={{ y, opacity }} className="relative z-10 mx-auto max-w-6xl px-6 sm:px-10 text-center pt-32 pb-20">
        <motion.p
          className="font-mono text-xs uppercase tracking-[0.35em] text-[#38bdf8] mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          {profile.tagline}
        </motion.p>

        <h1 className="text-[clamp(2.8rem,7vw,6.5rem)] font-semibold leading-[0.95] tracking-tight text-[#e8e6e3] mb-8">
          <TextReveal delay={0.9}>
            I build systems close to the hardware.
          </TextReveal>
          <br />
          <TextReveal delay={1.2}>
            <span className="gradient-text">Mostly from a phone.</span>
          </TextReveal>
        </h1>

        <motion.p
          className="mx-auto max-w-xl text-lg leading-relaxed text-[rgba(232,230,227,0.45)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.8 }}
        >
          Self-taught engineer working at the intersection of on-device AI, Android systems,
          and ARM64 Linux. Every build runs on CI. Every hardware claim is checked against a physical device.
        </motion.p>

        <motion.div
          className="mt-12 flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.9, duration: 0.8 }}
        >
          <MagneticButton
            href="#work"
            className="rounded-full bg-[#38bdf8] px-8 py-3.5 text-sm font-medium text-[#08080a] transition-all duration-300 hover:shadow-[0_0_40px_rgba(56,189,248,0.3)]"
          >
            Explore my work
          </MagneticButton>
          <MagneticButton
            href="https://github.com/soobujmiah"
            className="rounded-full border border-[rgba(232,230,227,0.15)] px-8 py-3.5 text-sm font-medium text-[#e8e6e3] transition-all duration-300 hover:border-[rgba(232,230,227,0.3)]"
          >
            View GitHub
          </MagneticButton>
        </motion.div>
      </motion.div>

      {/* scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4, duration: 1 }}
      >
        <motion.div
          className="flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[rgba(232,230,227,0.25)]">
            Scroll
          </span>
          <div className="w-px h-8 bg-gradient-to-b from-[#38bdf8] to-transparent" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MARQUEE DIVIDER
   ═══════════════════════════════════════════════════════════════ */

function Marquee({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  const track = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-[rgba(232,230,227,0.04)] py-5">
      <div
        className="marquee-track flex gap-12 whitespace-nowrap"
        style={{ animationDirection: reverse ? 'reverse' : 'normal' }}
      >
        {track.map((item, i) => (
          <span key={i} className="font-mono text-xs uppercase tracking-[0.15em] text-[rgba(232,230,227,0.2)]">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ABOUT
   ═══════════════════════════════════════════════════════════════ */

function About() {
  return (
    <section id="about" className="relative py-32 sm:py-40">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#38bdf8] mb-6">
            01 — About
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <h2 className="text-[clamp(1.8rem,4vw,3.2rem)] font-semibold leading-[1.15] tracking-tight text-[#e8e6e3] max-w-4xl mb-12">
            Self-taught systems builder working from constraints most people treat as blockers.
          </h2>
        </Reveal>

        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-5">
            {[
              'I am a self-taught systems builder based in Dhaka, Bangladesh. My work sits at the intersection of on-device AI, Android systems, and ARM64 Linux — problems I pursue because the tools I needed did not exist yet on the hardware I had.',
              'A defining constraint: I develop, build, and validate software primarily from an Android phone running Termux and PRoot Debian, not a conventional PC. This shapes everything — tooling choices, CI architecture, how I verify claims, and which problems I choose to solve.',
              'My learning philosophy is simple: living till learning, dead upon stop learning. I learn through real problems — hypothesis, test, observation, formal theory, compare, iterate. Mechanism-first, evidence-backed, honest about what is proven versus what is still experimental.',
            ].map((p, i) => (
              <Reveal key={i} delay={0.15 + i * 0.08}>
                <p className="text-base leading-[1.8] text-[rgba(232,230,227,0.5)]">
                  {p}
                </p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2}>
            <div className="rounded-2xl border border-[rgba(232,230,227,0.06)] bg-[rgba(255,255,255,0.015)] p-8 space-y-6">
              {[
                { label: 'Based in', value: 'Dhaka, Bangladesh (GMT+6)' },
                { label: 'Languages', value: 'Bangla, English, Hindi/Urdu, Arabic' },
                { label: 'Education', value: 'Self-taught' },
                { label: 'Reference device', value: 'Redmi Turbo 4 Pro — Snapdragon 8s Gen 4' },
                { label: 'Build pipeline', value: 'GitHub Actions CI/CD' },
              ].map((f) => (
                <div key={f.label} className="flex items-start justify-between gap-4 border-b border-[rgba(232,230,227,0.04)] pb-4 last:border-0 last:pb-0">
                  <span className="font-mono text-xs uppercase tracking-wider text-[rgba(232,230,227,0.3)]">
                    {f.label}
                  </span>
                  <span className="text-sm font-medium text-[#e8e6e3] text-right">{f.value}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   WORK / PROJECTS
   ═══════════════════════════════════════════════════════════════ */

function ProjectCard({ project, index }: { project: typeof projects[number]; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.article
      ref={ref}
      className="group relative rounded-2xl border border-[rgba(232,230,227,0.06)] bg-[rgba(255,255,255,0.012)] p-8 sm:p-10 transition-all duration-500 hover:border-[rgba(232,230,227,0.12)] hover:bg-[rgba(255,255,255,0.025)]"
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* hover glow */}
      <div
        className="absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none"
        style={{
          background: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${project.accent}08, transparent 60%)`,
        }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-xs text-[rgba(232,230,227,0.25)]">
                0{index + 1}
              </span>
              <span className="font-mono text-xs text-[rgba(232,230,227,0.25)]">
                {project.year}
              </span>
            </div>
            <h3 className="text-3xl font-semibold tracking-tight text-[#e8e6e3]">
              {project.name}
            </h3>
            <p className="mt-1 text-sm" style={{ color: project.accent }}>
              {project.tagline}
            </p>
          </div>
          <MagneticButton
            href={project.repo}
            className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(232,230,227,0.1)] text-[rgba(232,230,227,0.4)] transition-all duration-300 hover:border-[#38bdf8] hover:text-[#38bdf8]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 13L13 1M13 1H3M13 1V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </MagneticButton>
        </div>

        <p className="text-sm leading-[1.7] text-[rgba(232,230,227,0.45)] mb-6">
          {project.description}
        </p>

        <div className="mb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[rgba(232,230,227,0.25)] mb-2">
            Evidence
          </p>
          <p className="text-sm leading-[1.7] text-[rgba(232,230,227,0.35)]">
            {project.evidence}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {project.topics.map((t) => (
            <span
              key={t}
              className="rounded-full border border-[rgba(232,230,227,0.06)] px-3 py-1 font-mono text-[11px] text-[rgba(232,230,227,0.35)]"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

function Work() {
  return (
    <section id="work" className="relative py-32 sm:py-40">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#38bdf8] mb-6">
            02 — Featured Work
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="text-[clamp(1.8rem,4vw,3.2rem)] font-semibold leading-[1.15] tracking-tight text-[#e8e6e3] max-w-3xl mb-4">
            The strongest work — not every repository.
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="max-w-xl text-[rgba(232,230,227,0.4)] mb-16">
            Selected projects that demonstrate real technical depth, originality, and evidence of actual work.
          </p>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((p, i) => (
            <ProjectCard key={p.name} project={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RESEARCH
   ═══════════════════════════════════════════════════════════════ */

function Research() {
  return (
    <section id="research" className="relative py-32 sm:py-40">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#38bdf8] mb-6">
            03 — Research & Experiments
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="text-[clamp(1.8rem,4vw,3.2rem)] font-semibold leading-[1.15] tracking-tight text-[#e8e6e3] max-w-3xl mb-16">
            Serious technical exploration — honest about what is proven.
          </h2>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2">
          {research.map((r, i) => (
            <Reveal key={r.title} delay={0.1 + i * 0.08}>
              <div className="group rounded-2xl border border-[rgba(232,230,227,0.06)] bg-[rgba(255,255,255,0.012)] p-8 transition-all duration-500 hover:border-[rgba(232,230,227,0.12)]">
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      r.status === 'validated' ? 'bg-[#00e5a0]' : r.status === 'experimental' ? 'bg-[#38bdf8]' : 'bg-[rgba(232,230,227,0.3)]'
                    }`}
                  />
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[rgba(232,230,227,0.3)]">
                    {r.status}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-[#e8e6e3] mb-2">{r.title}</h3>
                <p className="text-sm leading-[1.7] text-[rgba(232,230,227,0.4)]">
                  {r.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STACK
   ═══════════════════════════════════════════════════════════════ */

function Stack() {
  const domains = [
    { name: 'On-Device AI', items: ['llama.cpp', 'GGUF', 'KV-cache reuse', 'Model integrity', 'CPU/GPU/NPU routing'] },
    { name: 'Android Systems', items: ['Kotlin', 'Compose', 'AccessibilityService', 'Shizuku', 'JNI/C++'] },
    { name: 'Linux / ARM64', items: ['AOSP builds', 'Clang/CMake/Ninja', 'Termux + PRoot', 'Bash scripting'] },
    { name: 'GPU / Graphics', items: ['Vulkan', 'Mesa Turnip', 'Zink', 'OpenGL-on-Vulkan', 'Adreno KGSL'] },
    { name: 'Mobile & Web', items: ['Flutter', 'Dart', 'TypeScript', 'Python', 'HTML/CSS/JS'] },
    { name: 'Eng Ops', items: ['GitHub Actions', 'Reproducible builds', 'Signed releases', 'Device validation'] },
  ];

  return (
    <section id="stack" className="relative py-32 sm:py-40">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#38bdf8] mb-6">
            04 — Technical Focus
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="text-[clamp(1.8rem,4vw,3.2rem)] font-semibold leading-[1.15] tracking-tight text-[#e8e6e3] max-w-3xl mb-16">
            Technologies I actually work with.
          </h2>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {domains.map((d, i) => (
            <Reveal key={d.name} delay={0.1 + i * 0.06}>
              <div className="rounded-2xl border border-[rgba(232,230,227,0.05)] bg-[rgba(255,255,255,0.01)] p-6 h-full">
                <h3 className="font-mono text-sm font-medium text-[#38bdf8] mb-4">{d.name}</h3>
                <ul className="space-y-2">
                  {d.items.map((item) => (
                    <li key={item} className="text-sm text-[rgba(232,230,227,0.4)]">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   OPEN SOURCE
   ═══════════════════════════════════════════════════════════════ */

function OpenSource() {
  return (
    <section id="open-source" className="relative py-32 sm:py-40">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#38bdf8] mb-6">
            05 — Open Source
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="text-[clamp(1.8rem,4vw,3.2rem)] font-semibold leading-[1.15] tracking-tight text-[#e8e6e3] max-w-3xl mb-16">
            Selected repositories.
          </h2>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allRepos.map((r, i) => (
            <Reveal key={r.name} delay={0.05 + i * 0.04}>
              <MagneticButton
                href={r.url}
                className="group flex flex-col rounded-2xl border border-[rgba(232,230,227,0.05)] bg-[rgba(255,255,255,0.01)] p-6 text-left transition-all duration-500 hover:border-[rgba(232,230,227,0.1)] hover:bg-[rgba(255,255,255,0.02)] h-full"
              >
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-mono text-sm font-semibold text-[#e8e6e3] group-hover:text-[#38bdf8] transition-colors duration-300">
                    {r.name}
                  </h3>
                  {r.stars > 0 && (
                    <span className="font-mono text-[10px] text-[rgba(232,230,227,0.25)]">★ {r.stars}</span>
                  )}
                </div>
                <p className="flex-1 text-xs leading-relaxed text-[rgba(232,230,227,0.35)] mb-4">
                  {r.desc}
                </p>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#38bdf8]/60" />
                  <span className="font-mono text-[11px] text-[rgba(232,230,227,0.3)]">{r.lang}</span>
                </div>
              </MagneticButton>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3}>
          <p className="mt-10 text-sm text-[rgba(232,230,227,0.3)]">
            See all repositories on{' '}
            <a href="https://github.com/soobujmiah" className="text-[#38bdf8] underline-offset-4 hover:underline" data-magnetic>
              github.com/soobujmiah
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   JOURNEY
   ═══════════════════════════════════════════════════════════════ */

function Journey() {
  const events = [
    { year: '2019', title: 'GitHub journey begins', desc: 'Started building and publishing open-source projects from an Android phone.' },
    { year: '2022', title: 'Phone-as-workstation', desc: 'Established Termux + PRoot Debian as a primary development environment. Ternux born from this constraint.' },
    { year: '2024', title: 'Local AI focus', desc: 'Began serious work on on-device LLM inference. LAI project started. llama.cpp CPU backend validated on ARM64.' },
    { year: '2025', title: 'Ecosystem expansion', desc: 'GGEN, ADT, DataKhoj, Songjog, Sobkichu — multiple projects in parallel. CI/CD pipelines standardized.' },
    { year: '2026', title: 'NPU qualification + GPU diagnosis', desc: 'Hexagon HTP NPU confirmed working. Vulkan GPU crash root-caused and documented. 19 active repositories.' },
  ];

  return (
    <section id="journey" className="relative py-32 sm:py-40">
      <div className="mx-auto max-w-4xl px-6 sm:px-10">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#38bdf8] mb-6">
            06 — Journey
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="text-[clamp(1.8rem,4vw,3.2rem)] font-semibold leading-[1.15] tracking-tight text-[#e8e6e3] max-w-3xl mb-16">
            How the work evolved.
          </h2>
        </Reveal>

        <div className="relative">
          <div className="absolute left-[7px] top-0 bottom-0 w-px bg-[rgba(232,230,227,0.06)]" />
          {events.map((e, i) => (
            <Reveal key={e.year} delay={0.1 + i * 0.08}>
              <div className="relative pl-10 pb-10 last:pb-0">
                <div className="absolute left-0 top-1 h-4 w-4 rounded-full border-2 border-[#38bdf8] bg-[#08080a]" />
                <span className="font-mono text-sm font-bold text-[#38bdf8]">{e.year}</span>
                <h3 className="mt-1 text-lg font-semibold text-[#e8e6e3]">{e.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[rgba(232,230,227,0.4)]">{e.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CONTACT
   ═══════════════════════════════════════════════════════════════ */

function Contact() {
  return (
    <section id="contact" className="relative py-32 sm:py-40">
      <div className="mx-auto max-w-4xl px-6 sm:px-10 text-center">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#38bdf8] mb-6">
            07 — Contact
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="text-[clamp(2rem,5vw,4rem)] font-semibold leading-[1.1] tracking-tight text-[#e8e6e3] mb-6">
            Open to freelance,
            <br />
            <span className="gradient-text">remote, and collaboration.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mx-auto max-w-lg text-[rgba(232,230,227,0.4)] mb-12">
            If you are working on on-device AI, Android systems, ARM64 tooling, or local-first products — I would be happy to talk.
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { label: 'Email', value: profile.email, href: `mailto:${profile.email}` },
              { label: 'GitHub', value: 'soobujmiah', href: 'https://github.com/soobujmiah' },
              { label: 'Telegram', value: profile.telegram, href: 'https://t.me/soobujmiah' },
              { label: 'LinkedIn', value: 'in/soobujmiah', href: 'https://linkedin.com/in/soobujmiah' },
            ].map((c) => (
              <MagneticButton
                key={c.label}
                href={c.href}
                className="group flex items-center gap-3 rounded-full border border-[rgba(232,230,227,0.08)] bg-[rgba(255,255,255,0.015)] px-6 py-3.5 transition-all duration-500 hover:border-[#38bdf8]"
              >
                <span className="text-sm font-medium text-[#e8e6e3] group-hover:text-[#38bdf8] transition-colors duration-300">
                  {c.label}
                </span>
                <span className="font-mono text-xs text-[rgba(232,230,227,0.3)]">{c.value}</span>
              </MagneticButton>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════ */

function Footer() {
  return (
    <footer className="border-t border-[rgba(232,230,227,0.04)] py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row sm:px-10">
        <p className="font-mono text-xs text-[rgba(232,230,227,0.2)]">
          © {new Date().getFullYear()} {profile.name}. Built from a phone.
        </p>
        <p className="font-mono text-xs text-[rgba(232,230,227,0.2)]">
          Every claim backed by CI or real-device evidence.
        </p>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function Page() {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      <CustomCursor />

      <AnimatePresence mode="wait">
        {!loaded && <Preloader onComplete={() => setLoaded(true)} />}
      </AnimatePresence>

      {loaded && (
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <Header />
          <Hero />
          <Marquee items={['On-Device AI', '·', 'Android', '·', 'ARM64', '·', 'Local LLM', '·', 'Vulkan', '·', 'NPU', '·', 'Flutter', '·', 'Kotlin', '·', 'Linux', '·']} />
          <About />
          <Work />
          <Marquee items={['Evidence-First', '·', 'CI/CD', '·', 'Real-Device Validation', '·', 'Open Source', '·', 'Bangla-First', '·', 'Privacy-First', '·']} reverse />
          <Research />
          <Stack />
          <OpenSource />
          <Journey />
          <Contact />
          <Footer />
        </motion.main>
      )}
    </>
  );
}
