'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useInView, useScroll, useMotionValue, useSpring, useVelocity, useTransform } from 'framer-motion';
import { useLang } from '@/app/language';
import { useSceneActive } from './PinnedSection';

/* ═══════════════════════════════════════════════════════════════
   SCENE NAVIGATION — fixed scenes can't use #anchor jumps, so nav
   scrolls the page to the middle of the target scene's slot.
   Provided by page.tsx (the only place that knows slot math).
   ═══════════════════════════════════════════════════════════════ */

interface NavValue {
  goToScene: (index: number) => void;
  goToTop: () => void;
}

const NavContext = createContext<NavValue>({
  goToScene: () => {},
  goToTop: () => {},
});

export const NavProvider = NavContext.Provider;

export function useNav(): NavValue {
  return useContext(NavContext);
}

/* ═══════════════════════════════════════════════════════════════
   CUSTOM CURSOR — dot follows instantly, ring trails with
   velocity-based stretch. Hidden on touch / coarse pointers via CSS.
   ═══════════════════════════════════════════════════════════════ */

export function CustomCursor() {
  const [hovering, setHovering] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [visible, setVisible] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const ringX = useMotionValue(-100);
  const ringY = useMotionValue(-100);
  const velX = useVelocity(mouseX);
  const velY = useVelocity(mouseY);

  const ringScale = useSpring(
    useTransform([velX, velY], ([vx, vy]) => {
      const speed = Math.sqrt((Number(vx) || 0) ** 2 + (Number(vy) || 0) ** 2);
      return Math.min(1 + speed * 0.001, 1.4);
    }),
    { stiffness: 300, damping: 20 }
  );

  useEffect(() => {
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      setVisible(true);
    };

    const animate = () => {
      ringX.set(ringX.get() + (mouseX.get() - ringX.get()) * 0.12);
      ringY.set(ringY.get() + (mouseY.get() - ringY.get()) * 0.12);
      raf = requestAnimationFrame(animate);
    };

    const onDown = () => setClicking(true);
    const onUp = () => setClicking(false);
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    const onOver = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('a, button, [data-magnetic]')) setHovering(true);
    };
    const onOut = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('a, button, [data-magnetic]')) setHovering(false);
    };
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);

    raf = requestAnimationFrame(animate);
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
      {/* Outer motion wrapper positions; inner div centers via CSS so the
          motion transform never fights the -50% centering. */}
      <motion.div
        className="cursor-pos"
        aria-hidden
        style={{ x: mouseX, y: mouseY, opacity: visible ? 1 : 0, scale: clicking ? 0.5 : 1 }}
      >
        <div className="cursor-dot" />
      </motion.div>
      <motion.div
        className="cursor-pos"
        aria-hidden
        style={{ x: ringX, y: ringY, opacity: visible ? 1 : 0, scale: hovering ? 1.8 : clicking ? 0.7 : ringScale }}
      >
        <div className={`cursor-ring${hovering ? ' hover' : ''}`} />
      </motion.div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAGNETIC BUTTON / LINK — drifts toward the pointer, springs back.
   External http(s) links open in a new tab; anchors/mailto stay.
   ═══════════════════════════════════════════════════════════════ */

export function Magnetic({
  children,
  className = '',
  href,
  strength = 0.25,
  style,
  onClick,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  href?: string;
  strength?: number;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  ariaLabel?: string;
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
  const isExternal = !!href && /^https?:\/\//.test(href);

  return (
    <a
      ref={ref}
      href={href}
      data-magnetic
      className={className}
      aria-label={ariaLabel}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      {...(isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: offset.x === 0 && offset.y === 0 ? 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)' : 'transform 0.12s ease-out',
        ...style,
      }}
    >
      {children}
    </a>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCROLL REVEAL — fade up. Scene-aware: fixed layers are always
   geometrically "in view", so the reveal also waits for the scene
   to own the viewport before playing.
   ═══════════════════════════════════════════════════════════════ */

export function Reveal({
  children,
  delay = 0,
  className = '',
  y = 30,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const sceneActive = useSceneActive();
  const shown = inView && sceneActive;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={shown ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCROLL PROGRESS BAR
   ═══════════════════════════════════════════════════════════════ */

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[99999] origin-left"
      style={{ scaleX, background: 'linear-gradient(90deg, #22c55e, #4ade80)' }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRELOADER
   ═══════════════════════════════════════════════════════════════ */

export function Preloader({ onComplete }: { onComplete: () => void }) {
  const { t } = useLang();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let current = 0;
    let doneTimer: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      current += Math.random() * 12 + 4;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        doneTimer = setTimeout(onComplete, 500);
      }
      setProgress(Math.min(current, 100));
    }, 100);
    return () => {
      clearInterval(interval);
      if (doneTimer) clearTimeout(doneTimer);
    };
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
          {t.preloader.status}
        </p>
        <p className="font-mono text-6xl font-extralight tabular-nums" style={{ color: '#e8e6e3' }}>
          {String(Math.round(progress)).padStart(3, '0')}
        </p>
      </motion.div>
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-40 h-px" style={{ background: 'rgba(232,230,227,0.05)' }}>
        <motion.div
          className="h-full"
          style={{ width: `${progress}%`, background: '#22c55e' }}
          transition={{ duration: 0.08 }}
        />
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HEADER — fixed; nav scrolls to scene slots (no #anchor jumps).
   ═══════════════════════════════════════════════════════════════ */

export function Header() {
  const { t, toggleLang } = useLang();
  const { goToScene, goToTop } = useNav();
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
        <a
          href="#top"
          aria-label={t.header.homeLabel}
          onClick={(e) => {
            e.preventDefault();
            goToTop();
          }}
          className="font-mono text-sm font-medium tracking-tight"
          style={{ color: '#e8e6e3' }}
          data-magnetic
        >
          sobuj<span style={{ color: '#22c55e' }}>.</span>miah
        </a>
        <nav className="hidden md:flex items-center gap-8" aria-label="Sections">
          {t.nav.map((l) => (
            <a
              key={l.scene}
              href={`#scene-${l.scene}`}
              onClick={(e) => {
                e.preventDefault();
                goToScene(l.scene);
              }}
              className="text-xs uppercase tracking-[0.1em] transition-colors duration-300 hover:opacity-100"
              style={{ color: 'rgba(232,230,227,0.4)' }}
              data-magnetic
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLang}
            aria-label="Switch language / ভাষা বদলান"
            data-magnetic
            className="rounded-full px-4 py-1.5 font-mono text-[11px] font-medium transition-colors duration-300"
            style={{ border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80' }}
          >
            {t.header.langLabel}
          </button>
          <Magnetic
            href="https://github.com/soobujmiah"
            ariaLabel="GitHub profile"
            className="rounded-full px-4 py-1.5 text-[11px] font-medium transition-colors duration-300"
            style={{ border: '1px solid rgba(232,230,227,0.12)', color: '#e8e6e3' }}
            strength={0.2}
          >
            {t.header.githubLabel}
          </Magnetic>
        </div>
      </div>
    </motion.header>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FOOTER — fixed.
   ═══════════════════════════════════════════════════════════════ */

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-[9997] border-t py-3" style={{ borderColor: 'rgba(232,230,227,0.04)', background: 'rgba(6,6,8,0.6)', backdropFilter: 'blur(12px)' }}>
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-6 sm:flex-row">
        <p className="font-mono text-[10px]" style={{ color: 'rgba(232,230,227,0.35)' }}>
          © {new Date().getFullYear()} {t.profile.nameFull}. {t.footer.built}
        </p>
        <p className="font-mono text-[10px]" style={{ color: 'rgba(232,230,227,0.35)' }}>
          {t.footer.claims}
        </p>
      </div>
    </footer>
  );
}
