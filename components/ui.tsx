'use client';

import { Children, createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useInView, useMotionValue, useSpring, useVelocity, useTransform } from 'framer-motion';
import { useLang, localizeDigits } from '@/app/language';

/* ═══════════════════════════════════════════════════════════════
   PAGE NAVIGATION — discrete pager: goToScene jumps to a page.
   Provided by page.tsx.
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
  const [pressing, setPressing] = useState(false);

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setOffset({
      x: (e.clientX - rect.left - rect.width / 2) * strength,
      y: (e.clientY - rect.top - rect.height / 2) * strength,
    });
  };

  const onLeave = () => {
    setOffset({ x: 0, y: 0 });
    setPressing(false);
  };
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
      onMouseDown={() => setPressing(true)}
      onMouseUp={() => setPressing(false)}
      onTouchStart={() => setPressing(true)}
      onTouchEnd={() => setPressing(false)}
      {...(isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px) scale(${pressing ? 0.96 : 1})`,
        transition: pressing
          ? 'transform 0.1s ease-out'
          : offset.x === 0 && offset.y === 0
            ? 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
            : 'transform 0.12s ease-out',
        ...style,
      }}
    >
      {children}
    </a>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCROLL REVEAL — fade up on view. Pages mount fresh on every
   visit, so reveals replay on each page entry.
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
  const inView = useInView(ref, { once: true, margin: '-40px' });

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
   PAGE PROGRESS BAR — driven by pager fraction, not scroll.
   ═══════════════════════════════════════════════════════════════ */

export function ScrollProgress({ value }: { value: number }) {
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[99999] origin-left"
      style={{ background: 'linear-gradient(90deg, #22c55e, #4ade80)' }}
      initial={false}
      animate={{ scaleX: Math.min(Math.max(value, 0), 1) }}
      transition={{ type: 'spring', stiffness: 120, damping: 24 }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE DOTS — vertical rail on desktop, mini row above the footer
   on phones.
   ═══════════════════════════════════════════════════════════════ */

export function PageDots({
  total,
  active,
  labels,
  onGo,
}: {
  total: number;
  active: number;
  labels: string[];
  onGo: (index: number) => void;
}) {
  const dots = Array.from({ length: total }, (_, i) => i);
  return (
    <>
      {/* desktop rail */}
      <nav
        aria-label="Pages"
        className="pager-dots-rail"
      >
        {dots.map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onGo(i)}
            aria-label={labels[i] ?? `Page ${i + 1}`}
            aria-current={i === active ? 'true' : undefined}
            data-magnetic
            className={`pager-dot${i === active ? ' pager-dot-active' : ''}`}
          />
        ))}
      </nav>
      {/* phone row */}
      <nav aria-label="Pages" className="pager-dots-row">
        {dots.map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onGo(i)}
            aria-label={labels[i] ?? `Page ${i + 1}`}
            aria-current={i === active ? 'true' : undefined}
            className={`pager-dot-sm${i === active ? ' pager-dot-sm-active' : ''}`}
          />
        ))}
      </nav>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SNAP CAROUSEL — native horizontal snap swipe + buttons + dots.
   Used inside dense pages so nothing ever needs vertical scroll.
   ═══════════════════════════════════════════════════════════════ */

export function SnapCarousel({
  children,
  label,
  prevLabel = 'Previous',
  nextLabel = 'Next',
}: {
  children: ReactNode;
  label: string;
  prevLabel?: string;
  nextLabel?: string;
}) {
  const { lang } = useLang();
  const trackRef = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const slides = Children.toArray(children);
  const count = slides.length;

  const slideStep = useCallback(() => {
    try {
      const track = trackRef.current;
      const first = track?.querySelector(':scope > *') as HTMLElement | null;
      if (!track || !first) return 300;
      const gap = parseFloat(getComputedStyle(track).columnGap || '16') || 16;
      return first.offsetWidth + gap;
    } catch {
      return 300;
    }
  }, []);

  const go = useCallback(
    (index: number) => {
      try {
        trackRef.current?.scrollTo({ left: index * slideStep(), behavior: 'smooth' });
      } catch {
        /* ignore */
      }
    },
    [slideStep]
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        try {
          setAt(Math.round(track.scrollLeft / slideStep()));
        } catch {
          /* ignore */
        }
      });
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      track.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [slideStep]);

  return (
    <div>
      <div ref={trackRef} className="snap-carousel" role="group" aria-label={label} aria-roledescription="carousel">
        {slides.map((child, i) => (
          <div key={i} className="snap-slide" role="group" aria-roledescription="slide" aria-label={localizeDigits(`${i + 1} / ${count}`, lang)}>
            {child}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5" aria-hidden>
          {slides.map((_, i) => (
            <span key={i} className={`h-1 rounded-full transition-all duration-300 ${i === at ? 'w-5' : 'w-1.5'}`} style={{ background: i === at ? '#22c55e' : 'rgba(228,226,223,0.15)' }} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(Math.max(at - 1, 0))}
            disabled={at <= 0}
            aria-label={prevLabel}
            data-magnetic
            className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity duration-300 disabled:opacity-25"
            style={{ border: '1px solid rgba(228,226,223,0.12)', color: '#e4e2df' }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => go(Math.min(at + 1, count - 1))}
            disabled={at >= count - 1}
            aria-label={nextLabel}
            data-magnetic
            className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity duration-300 disabled:opacity-25"
            style={{ border: '1px solid rgba(228,226,223,0.12)', color: '#e4e2df' }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRELOADER
   ═══════════════════════════════════════════════════════════════ */

export function Preloader({ onComplete }: { onComplete: () => void }) {
  const { t, lang } = useLang();
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
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] mb-5" style={{ color: 'rgba(228,226,223,0.25)' }}>
          {t.preloader.status}
        </p>
        <p className="font-mono text-6xl font-extralight tabular-nums" style={{ color: '#e4e2df' }}>
          {localizeDigits(String(Math.round(progress)).padStart(3, '0'), lang)}
        </p>
      </motion.div>
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-40 h-px" style={{ background: 'rgba(228,226,223,0.05)' }}>
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
   HEADER — fixed; nav jumps between pages.
   ═══════════════════════════════════════════════════════════════ */

export function Header() {
  const { t, toggleLang } = useLang();
  const { goToScene } = useNav();

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-[9998] py-4 backdrop-blur-xl border-b"
      style={{ background: 'rgba(6,6,8,0.6)', borderColor: 'rgba(228,226,223,0.05)' }}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
        {/* Brand: links directly to GitHub profile, not portfolio home */}
        <a
          href="https://github.com/soobujmiah"
          target="_blank"
          rel="noreferrer"
          aria-label={t.header.githubAria}
          className="font-mono text-sm font-medium tracking-tight"
          style={{ color: '#e4e2df' }}
          data-magnetic
        >
          soobujmiah
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
              style={{ color: 'rgba(228,226,223,0.4)' }}
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
            aria-label={t.header.langAria}
            data-magnetic
            className="rounded-full px-4 py-1.5 font-mono text-[11px] font-medium transition-colors duration-300"
            style={{ border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80' }}
          >
            {t.header.langLabel}
          </button>
          <Magnetic
            href="https://github.com/soobujmiah"
            ariaLabel={t.header.githubAria}
            className="rounded-full px-4 py-1.5 text-[11px] font-medium transition-colors duration-300"
            style={{ border: '1px solid rgba(228,226,223,0.12)', color: '#e4e2df' }}
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
  const { t, lang } = useLang();
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-[9997] border-t py-2.5" style={{ borderColor: 'rgba(228,226,223,0.04)', background: 'rgba(6,6,8,0.6)', backdropFilter: 'blur(12px)' }}>
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-1 px-6 sm:flex-row">
        <p className="font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.35)' }}>
          © {localizeDigits(new Date().getFullYear(), lang)} {t.profile.nameFull}. {t.footer.built}
        </p>
        <p className="font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.35)' }}>
          {t.footer.claims}
        </p>
      </div>
    </footer>
  );
}
