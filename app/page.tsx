'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  AnimatePresence,
  useMotionValue,
  useVelocity,
} from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════
   DATA — from GitHub, SKB, CV, work history image
   ═══════════════════════════════════════════════════════════════ */

const profile = {
  name: 'Sobuj',
  nameFull: 'Sobuj Miah',
  title: 'Independent Software & AI Systems Engineer',
  tagline: 'On-device AI · Android · Linux · ARM64 · GPU/NPU',
  location: 'Dhaka, Bangladesh',
  github: 'https://github.com/soobujmiah',
  email: 'soobujmiah@gmail.com',
  telegram: '@soobujmiah',
  linkedin: 'https://linkedin.com/in/soobujmiah',
};

/* — corrected work history from /mnt/sdcard/work history.jpg — */
const workHistory = [
  {
    period: 'Mar 2025 – Present',
    role: 'Office Administrator',
    company: 'Rabeya Education Family',
    location: 'Savar, Dhaka',
    desc: 'Daily operations, social media, SEO, student registration, document management, promotional graphics.',
  },
  {
    period: 'Sep 2022 – Feb 2023',
    role: 'Computer Operator',
    company: 'Monika Enterprise',
    location: 'Savar, Dhaka',
    desc: 'Online activities, document processing, filing systems.',
  },
  {
    period: '2021 – 2022',
    role: 'Coordinator',
    company: 'Abdullah Trading Pvt Ltd',
    location: 'Jubail, Saudi Arabia',
    desc: 'Site operations, logistics, team communication.',
  },
  {
    period: '2020 – 2021',
    role: 'Electrician',
    company: 'Saudi Electricity Company & Khaled Juffali Company',
    location: 'Jeddah, Saudi Arabia',
    desc: 'Electrical installation and maintenance.',
  },
  {
    period: '2018 – 2020',
    role: 'Progress Reporter',
    company: 'Fadhli Gas Plant Project / PCMC',
    location: 'Saudi Arabia',
    desc: 'Daily progress data, digitization, structured reporting.',
  },
  {
    period: '2017 – 2018',
    role: 'Fire Watcher',
    company: 'Fadhli Gas Plant / Saudi Aramco',
    location: 'Saudi Arabia',
    desc: 'Fire hazard monitoring, incident prevention.',
  },
  {
    period: '2015 – 2017',
    role: 'Email Marketing Specialist',
    company: 'Freelance',
    location: 'Remote',
    desc: 'Targeted campaigns, subscriber management, self-taught digital marketing.',
  },
];

const projects = [
  {
    name: 'LAI',
    tagline: 'Bangla-first local AI + consent-driven automation',
    year: '2024–26',
    description:
      'Source-only Android runtime for private on-device LLM inference and Accessibility-gated automation. CPU inference device-validated; GPU/NPU in qualification.',
    evidence:
      'Real arm64 llama.cpp CPU inference, ~20 tok/s decode, KV-prefix reuse. Root-cause diagnosis of an Adreno Vulkan driver crash that shaped a fail-closed CPU-default architecture.',
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
      '143 pure-Dart unit tests, 353 widget/controller tests. Validated on a physical device round after round.',
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
      'Qualcomm Hexagon HTP NPU evaluation. First real non-CPU backend confirmed working with FastRPC/DSP evidence.',
  },
  {
    title: 'Adreno Vulkan / GPU',
    status: 'experimental',
    description:
      'Mesa Turnip Vulkan, Zink OpenGL-on-Vulkan. Vulkan compute crashes at decode — root-caused, documented.',
  },
  {
    title: 'Android Automation',
    status: 'validated',
    description:
      'AccessibilityService + Shizuku privileged execution with explicit consent, hash-chained audit trails.',
  },
  {
    title: 'AI Agents & Orchestration',
    status: 'investigating',
    description:
      'Policy-gated tool dispatch, signed model catalog with SHA-256 verification, multi-provider gateway.',
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
  { name: 'faridpur-police-app', desc: 'Official Faridpur District Police app', lang: 'Dart', stars: 0, url: 'https://github.com/soobujmiah/faridpur-police-app' },
  { name: 'iqra-online-mart', desc: 'Bilingual e-commerce storefront demo', lang: 'JavaScript', stars: 0, url: 'https://github.com/soobujmiah/iqra-online-mart' },
  { name: 'arms', desc: 'ARM64 dev environment setup scripts', lang: 'HTML', stars: 0, url: 'https://github.com/soobujmiah/arms' },
];

/* ── stats ── */
const stats = [
  { value: '13', label: 'Public Repos' },
  { value: '7', label: 'Languages' },
  { value: '19', label: 'Total Projects' },
  { value: '8+', label: 'Years Working' },
];

/* ═══════════════════════════════════════════════════════════════
   CUSTOM CURSOR — magnetic with velocity-based stretch
   ═══════════════════════════════════════════════════════════════ */

function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [visible, setVisible] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const ringX = useMotionValue(0);
  const ringY = useMotionValue(0);
  const velX = useVelocity(mouseX);
  const velY = useVelocity(mouseY);

  const ringScale = useSpring(
    useTransform([velX, velY], ([vx, vy]) => {
      const speed = Math.sqrt((vx || 0) ** 2 + (vy || 0) ** 2);
      return Math.min(1 + speed * 0.001, 1.4);
    }),
    { stiffness: 300, damping: 20 }
  );

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      dot.style.left = e.clientX + 'px';
      dot.style.top = e.clientY + 'px';
      setVisible(true);
    };

    const animate = () => {
      const currentX = ringX.get();
      const currentY = ringY.get();
      ringX.set(currentX + (mouseX.get() - currentX) * 0.12);
      ringY.set(currentY + (mouseY.get() - currentY) * 0.12);
      requestAnimationFrame(animate);
    };

    const onDown = () => setClicking(true);
    const onUp = () => setClicking(false);
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    /* magnetic hover */
    const onOver = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('a, button, [data-magnetic]')) setHovering(true);
    };
    const onOut = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('a, button, [data-magnetic]')) setHovering(false);
    };
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
  }, [mouseX, mouseY, ringX, ringY]);

  return (
    <>
      <motion.div
        ref={dotRef}
        className="cursor-dot"
        style={{
          x: mouseX,
          y: mouseY,
          opacity: visible ? 1 : 0,
          scale: clicking ? 0.5 : 1,
        }}
      />
      <motion.div
        ref={ringRef}
        className={`cursor-ring${hovering ? ' hover' : ''}`}
        style={{
          x: ringX,
          y: ringY,
          opacity: visible ? 1 : 0,
          scale: hovering ? 1.8 : clicking ? 0.7 : ringScale,
        }}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAGNETIC BUTTON
   ═══════════════════════════════════════════════════════════════ */

function Magnetic({
  children,
  className = '',
  href,
  strength = 0.25,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setOffset({
      x: (e.clientX - rect.left - rect.width / 2) * strength,
      y: (e.clientY - rect.top - rect.height / 2) * strength,
    });
  };

  const onLeave = () => setOffset({ x: 0, y: 0 });

  return (
    <a
      ref={ref}
      href={href}
      data-magnetic
      className={className}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: offset.x === 0 ? 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)' : 'transform 0.12s ease-out',
      }}
      {...props}
    >
      {children}
    </a>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCROLL REVEAL
   ═══════════════════════════════════════════════════════════════ */

function Reveal({
  children,
  delay = 0,
  className = '',
  y = 30,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TEXT REVEAL — word by word
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
  const inView = useInView(ref, { once: true, margin: '-40px' });

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
              transition={{ duration: 0.55, delay: delay + i * 0.035, ease: [0.16, 1, 0.3, 1] }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </span>
    );
  }

  return (
    <span ref={ref} className={className}>
      <motion.span
        className="inline-block"
        initial={{ y: '110%' }}
        animate={inView ? { y: 0 } : {}}
        transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   UNIQUE NAME ANIMATED LETTERS
   ═══════════════════════════════════════════════════════════════ */

function AnimatedName() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const letters = profile.name.split('');

  return (
    <span ref={ref} className="inline-flex overflow-hidden">
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ y: '120%', rotateX: -90, opacity: 0 }}
          animate={inView ? { y: 0, rotateX: 0, opacity: 1 } : {}}
          transition={{
            duration: 0.7,
            delay: 0.9 + i * 0.08,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{ transformOrigin: 'bottom' }}
        >
          {letter}
        </motion.span>
      ))}
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
      current += Math.random() * 12 + 4;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(onComplete, 500);
      }
      setProgress(Math.min(current, 100));
    }, 100);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100000] flex flex-col items-center justify-center"
      style={{ background: '#060608' }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.7 }}
        className="text-center"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] mb-5" style={{ color: 'rgba(232,230,227,0.25)' }}>
          Initializing
        </p>
        <p className="font-mono text-6xl font-extralight tabular-nums" style={{ color: '#e8e6e3' }}>
          {String(Math.round(progress)).padStart(3, '0')}
        </p>
      </motion.div>
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-40 h-px" style={{ background: 'rgba(232,230,227,0.05)' }}>
        <motion.div
          className="h-full"
          style={{ width: `${progress}%`, background: '#38bdf8' }}
          transition={{ duration: 0.08 }}
        />
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCROLL PROGRESS BAR
   ═══════════════════════════════════════════════════════════════ */

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[99999] origin-left"
      style={{ scaleX, background: 'linear-gradient(90deg, #38bdf8, #00e5a0)' }}
    />
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
        scrolled ? 'py-3 backdrop-blur-xl border-b' : 'py-5'
      }`}
      style={scrolled ? { background: 'rgba(6,6,8,0.75)', borderColor: 'rgba(232,230,227,0.04)' } : {}}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
        <a href="#" className="font-mono text-sm font-medium tracking-tight" style={{ color: '#e8e6e3' }} data-magnetic>
          sobuj<span style={{ color: '#38bdf8' }}>.</span>miah
        </a>
        <nav className="hidden md:flex items-center gap-8">
          {[
            { href: '#work', label: 'Work' },
            { href: '#research', label: 'Research' },
            { href: '#stack', label: 'Stack' },
            { href: '#contact', label: 'Contact' },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-xs uppercase tracking-[0.1em] transition-colors duration-300 hover:opacity-100"
              style={{ color: 'rgba(232,230,227,0.4)' }}
              data-magnetic
            >
              {l.label}
            </a>
          ))}
        </nav>
        <Magnetic
          href="https://github.com/soobujmiah"
          className="rounded-full px-4 py-1.5 text-[11px] font-medium transition-colors duration-300"
          style={{ border: '1px solid rgba(232,230,227,0.12)', color: '#e8e6e3' }}
          strength={0.2}
        >
          GitHub
        </Magnetic>
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
  const y = useTransform(scrollYProgress, [0, 1], [0, 250]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.7], [1, 0.95]);

  return (
    <section ref={ref} className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* ambient orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      {/* grid */}
      <div className="absolute inset-0 grid-bg" />

      <motion.div style={{ y, opacity, scale }} className="relative z-10 mx-auto max-w-5xl px-6 text-center pt-28 pb-16">
        <motion.p
          className="font-mono text-[10px] uppercase tracking-[0.4em] mb-8"
          style={{ color: '#38bdf8' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.7 }}
        >
          {profile.tagline}
        </motion.p>

        <h1 className="text-[clamp(2.5rem,6.5vw,5.8rem)] font-semibold leading-[0.92] tracking-tight mb-6" style={{ color: '#e8e6e3' }}>
          <span className="block">
            <TextReveal delay={0.8}>I build systems close</TextReveal>
          </span>
          <span className="block mt-1">
            <TextReveal delay={1.0}>
              <span className="gradient-text">to the hardware.</span>
            </TextReveal>
          </span>
        </h1>

        <motion.div
          className="mt-4 mb-8"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.7 }}
        >
          <AnimatedName />
          <motion.span
            className="ml-3 text-2xl sm:text-3xl font-light"
            style={{ color: 'rgba(232,230,227,0.3)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 1 }}
          >
            — mostly from a phone.
          </motion.span>
        </motion.div>

        <motion.p
          className="mx-auto max-w-lg text-base leading-relaxed"
          style={{ color: 'rgba(232,230,227,0.4)' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.0, duration: 0.7 }}
        >
          Self-taught engineer at the intersection of on-device AI, Android systems,
          and ARM64 Linux. Every build runs on CI. Every claim checked against a physical device.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2, duration: 0.7 }}
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
        transition={{ delay: 2.6, duration: 1 }}
      >
        <motion.div
          className="flex flex-col items-center gap-2"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: 'rgba(232,230,227,0.2)' }}>
            Scroll
          </span>
          <div className="w-px h-6" style={{ background: 'linear-gradient(to bottom, #38bdf8, transparent)' }} />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STATS STRIP
   ═══════════════════════════════════════════════════════════════ */

function StatsStrip() {
  return (
    <div className="border-y py-8" style={{ borderColor: 'rgba(232,230,227,0.04)' }}>
      <div className="mx-auto max-w-5xl px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08}>
            <div className="text-center">
              <motion.p
                className="text-3xl sm:text-4xl font-bold tabular-nums"
                style={{ color: '#e8e6e3' }}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                {s.value}
              </motion.p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: 'rgba(232,230,227,0.3)' }}>
                {s.label}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ABOUT — compact
   ═══════════════════════════════════════════════════════════════ */

function About() {
  return (
    <section id="about" className="relative py-24">
      <div className="mx-auto max-w-5xl px-6">
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
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   WORK / PROJECTS — compact grid with hover glow
   ═══════════════════════════════════════════════════════════════ */

function ProjectCard({ project, index }: { project: typeof projects[number]; index: number }) {
  const ref = useRef(null);
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
      {/* cursor-following glow */}
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

function Work() {
  return (
    <section id="work" className="relative py-24">
      <div className="mx-auto max-w-5xl px-6">
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
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RESEARCH — compact
   ═══════════════════════════════════════════════════════════════ */

function Research() {
  return (
    <section id="research" className="relative py-24">
      <div className="mx-auto max-w-5xl px-6">
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
                whileHover={{}}
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
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STACK — compact
   ═══════════════════════════════════════════════════════════════ */

function Stack() {
  const domains = [
    { name: 'On-Device AI', items: ['llama.cpp', 'GGUF', 'KV-cache', 'CPU/GPU/NPU routing'] },
    { name: 'Android Systems', items: ['Kotlin', 'Compose', 'Accessibility', 'Shizuku', 'JNI/C++'] },
    { name: 'Linux / ARM64', items: ['AOSP builds', 'Clang/CMake/Ninja', 'Termux + PRoot'] },
    { name: 'GPU / Graphics', items: ['Vulkan', 'Mesa Turnip', 'Zink', 'Adreno KGSL'] },
    { name: 'Mobile & Web', items: ['Flutter', 'Dart', 'TypeScript', 'Python'] },
    { name: 'Eng Ops', items: ['GitHub Actions', 'Signed releases', 'Device validation'] },
  ];

  return (
    <section id="stack" className="relative py-24">
      <div className="mx-auto max-w-5xl px-6">
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
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   OPEN SOURCE — compact
   ═══════════════════════════════════════════════════════════════ */

function OpenSource() {
  return (
    <section id="open-source" className="relative py-24">
      <div className="mx-auto max-w-5xl px-6">
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
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   WORK HISTORY — from image
   ═══════════════════════════════════════════════════════════════ */

function WorkHistory() {
  return (
    <section id="experience" className="relative py-24">
      <div className="mx-auto max-w-5xl px-6">
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
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CONTACT
   ═══════════════════════════════════════════════════════════════ */

function Contact() {
  return (
    <section id="contact" className="relative py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
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
            {[
              { label: 'Email', value: profile.email, href: `mailto:${profile.email}` },
              { label: 'GitHub', value: 'soobujmiah', href: 'https://github.com/soobujmiah' },
              { label: 'Telegram', value: profile.telegram, href: 'https://t.me/soobujmiah' },
              { label: 'LinkedIn', value: 'in/soobujmiah', href: 'https://linkedin.com/in/soobujmiah' },
            ].map((c) => (
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
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════ */

function Footer() {
  return (
    <footer className="border-t py-6" style={{ borderColor: 'rgba(232,230,227,0.04)' }}>
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 sm:flex-row">
        <p className="font-mono text-[10px]" style={{ color: 'rgba(232,230,227,0.15)' }}>
          © {new Date().getFullYear()} {profile.nameFull}. Built from a phone.
        </p>
        <p className="font-mono text-[10px]" style={{ color: 'rgba(232,230,227,0.15)' }}>
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
      <ScrollProgress />

      <AnimatePresence mode="wait">
        {!loaded && <Preloader onComplete={() => setLoaded(true)} />}
      </AnimatePresence>

      {loaded && (
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ background: '#060608' }}
        >
          <Header />
          <Hero />
          <StatsStrip />
          <About />
          <Work />
          <Research />
          <Stack />
          <OpenSource />
          <WorkHistory />
          <Contact />
          <Footer />
        </motion.main>
      )}
    </>
  );
}
