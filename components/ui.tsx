'use client';

import { Children, createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useInView, useMotionValue, useReducedMotion, useSpring, useVelocity, useTransform } from 'framer-motion';
import { useLang, localizeDigits } from '@/app/language';
import { sectionHref } from '@/app/sections';
import { serviceHref } from '@/app/services';
import { BrandIcon } from './social-icons';

/* ═══════════════════════════════════════════════════════════════
   PAGE NAVIGATION — discrete pager: goToScene jumps to a page.
   Provided by page.tsx.
   ═══════════════════════════════════════════════════════════════ */

interface NavValue {
  goToScene: (index: number) => void;
  goToTop: () => void;
  /** Opens the section index overlay (the pager's own navigation). */
  openNav: () => void;
}

const NavContext = createContext<NavValue>({
  goToScene: () => {},
  goToTop: () => {},
  openNav: () => {},
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
   PAGE PROGRESS — the HUD bar's border is the instrument.
   ═══════════════════════════════════════════════════════════════ */

/* The old top-of-page progress bar is gone: page position now travels
   around the bottom HUD's border (see PageDots), so the progress read
   and the navigation it describes are one instrument. */

/** Three stacked rails — reads as "index", not "hamburger". */
function IndexGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M1 3h12M1 7h12M1 11h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PERIMETER TRACE — progress as a border trace, never a dot row.

   The bar is a fixed-size pill, so its border path is known exactly:
   a green trace travels the perimeter clockwise from a fixed origin
   at bottom-centre — bottom edge → right cap → top edge → left cap —
   with pathLength normalised to 1 and strokeDashoffset = 1 − progress.
   Page 1 = 0%, page 9 = 100% (12.5% steps). Only the trace endpoint
   moves: the origin never re-centres, the bar never resizes or shifts.
   The NN/09 readout names the position; the ●●● dot row is retired —
   the trace is the primary progress read.
   ═══════════════════════════════════════════════════════════════ */

function PerimeterTrace({ w, h, progress, reduced }: { w: number; h: number; progress: number; reduced: boolean }) {
  /* 0.75px inset keeps the 1.5px stroke centred on the pill's border;
     the caps are true semicircles (r = half the inset height) */
  const r = (h - 1.5) / 2;
  const y0 = 0.75;
  const y1 = h - 0.75;
  const xL = 0.75 + r;
  const xR = w - 0.75 - r;
  const d = `M${w / 2} ${y1}H${xR}A${r} ${r} 0 0 1 ${xR} ${y0}H${xL}A${r} ${r} 0 0 1 ${xL} ${y1}H${w / 2}`;
  return (
    <svg className="hud-perim" viewBox={`0 0 ${w} ${h}`} aria-hidden focusable="false">
      <path className="hud-perim-base" d={d} pathLength={1} />
      <motion.path
        className="hud-perim-fill"
        d={d}
        pathLength={1}
        strokeDasharray="1 1"
        initial={false}
        animate={{ strokeDashoffset: 1 - progress }}
        transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 170, damping: 26 }}
      />
    </svg>
  );
}

export function PageDots({
  total,
  active,
  labels,
  navOpen,
}: {
  total: number;
  active: number;
  labels: string[];
  navOpen: boolean;
}) {
  const { t, lang } = useLang();
  const { openNav } = useNav();
  const prefersReduced = useReducedMotion();
  /* Same instrument as the open panel's bottom-edge trace:
     progress = active / (total − 1), fixed origin, monotonic. */
  const progress = total > 1 ? active / (total - 1) : 0;
  const pad2 = (n: number) => localizeDigits(String(n).padStart(2, '0'), lang);
  const readout = `${pad2(active + 1)}/${pad2(total)}`;
  const bar = (w: number, h: number, sm: boolean) => (
    <>
      <PerimeterTrace w={w} h={h} progress={progress} reduced={!!prefersReduced} />
      <span className="hud-readout font-mono" aria-hidden>
        {readout}
      </span>
      <span className="sr-only">{labels[active] ?? ''}</span>
      <span className="hud-divider" aria-hidden />
      <button
        type="button"
        onClick={openNav}
        aria-label={t.ui.navOpen}
        aria-expanded={navOpen}
        data-magnetic={!sm}
        className={sm ? 'pager-index-trigger pager-index-trigger-sm' : 'pager-index-trigger'}
      >
        <IndexGlyph />
      </button>
    </>
  );
  return (
    <>
      {/* desktop bar — the index trigger wrapped in its progress
          trace. data-nav-open couples the bar to the HUD that
          emerges from it: while the index is open, the bar carries
          the glow and the trigger sparks. */}
      <nav
        aria-label={t.ui.navTitle}
        className="pager-dots-rail pager-hud"
        data-nav-open={navOpen ? 'true' : 'false'}
      >
        {bar(124, 38, false)}
      </nav>
      {/* phone bar */}
      <nav
        aria-label={t.ui.navTitle}
        className="pager-dots-row pager-hud"
        data-nav-open={navOpen ? 'true' : 'false'}
      >
        {bar(112, 36, true)}
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
  const { t, lang, toggleLang } = useLang();
  const { goToScene } = useNav();
  /* compact language glyph showing the *active* language: Latin "EN" or
     Bangla "বাং". The default (English) render therefore ships "EN" and
     stays pure-English for SSR; the Bangla glyph only appears after a
     client-side switch. Full action name stays in the aria-label. */
  const langGlyph = lang === 'en' ? 'EN' : 'বাং';

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-[9998] py-4 backdrop-blur-xl border-b"
      style={{ background: 'rgba(6,6,8,0.6)', borderColor: 'rgba(228,226,223,0.05)' }}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-3 sm:px-6">
        {/* Brand mark returns to the site root — the portfolio is the
            brand root of the ecosystem, so its own mark must lead home. */}
        <a
          href={sectionHref(0)}
          aria-label={t.header.homeLabel}
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
              href={sectionHref(l.scene)}
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
          {/* the service-intent layer, reachable from every page */}
          <a
            href={serviceHref()}
            className="text-xs uppercase tracking-[0.1em] transition-colors duration-300 hover:opacity-100"
            style={{ color: 'rgba(228,226,223,0.4)' }}
            data-magnetic
          >
            {t.header.servicesLabel}
          </a>
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          {/* CV — quiet but always present, desktop and mobile */}
          <a
            href="/cv/Sobuj_Miah_CV.pdf"
            download="Sobuj_Miah_CV.pdf"
            aria-label={t.header.cvAria}
            data-magnetic
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-3.5 py-1.5 font-mono text-[11px] font-medium transition-colors duration-300"
            style={{ border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t.header.cvLabel}
          </a>
          {/* Services — the nav row is desktop-only, so phones get the
              service intent as its own quiet pill: icon always, label
              once there is room for it. Same green outline language as
              the CV pill, so the cluster reads as one system. */}
          <a
            href={serviceHref()}
            aria-label={t.header.servicesLabel}
            title={t.header.servicesLabel}
            data-magnetic
            className="md:hidden inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 font-mono text-[11px] font-medium transition-colors duration-300"
            style={{ border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
              <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
              <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
              <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
            </svg>
            <span className="max-[399px]:hidden">{t.header.servicesLabel}</span>
          </a>
          <button
            type="button"
            onClick={toggleLang}
            aria-label={t.header.langAria}
            data-magnetic
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-4 py-1.5 font-mono text-[11px] font-medium transition-colors duration-300"
            style={{ border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80' }}
          >
            <BrandIcon id="portfolio" size={12} />
            {langGlyph}
          </button>
          {/* GitHub — same green outline family as CV/Services/language:
              identical border weight, corner geometry and colour, so
              the four controls read as one system. Icon-only by design. */}
          <Magnetic
            href="https://github.com/soobujmiah"
            ariaLabel={t.header.githubAria}
            className="inline-flex items-center rounded-full px-2.5 sm:px-3 py-1.5 transition-colors duration-300"
            style={{ border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80' }}
            strength={0.2}
          >
            <BrandIcon id="github" size={14} />
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
        {/* The promise is made checkable rather than merely asserted: the
            link opens the repository's claim-verification log, where each
            figure is tied to a commit, a CI run or a device record. */}
        <a
          href="https://github.com/soobujmiah/soobujmiah.github.io#claim-verification-log"
          target="_blank"
          rel="noreferrer"
          data-magnetic
          className="font-mono text-[10px] transition-colors duration-300 hover:text-[#4ade80]"
          style={{ color: 'rgba(228,226,223,0.35)' }}
        >
          {t.footer.claims} <span aria-hidden>↗</span>
        </a>
      </div>
    </footer>
  );
}
