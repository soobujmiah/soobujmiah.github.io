'use client';

/* ═══════════════════════════════════════════════════════════════
   DISCRETE PAGER — one full-screen page at a time, zero vertical
   scrolling. Every gesture (wheel tick, swipe, arrow key, dot, nav
   link) flips exactly one page with a buttery spring slide/fade.
   ═══════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { TechBackground } from '@/components/TechBackground';
import { LanguageProvider, useLang } from '@/app/language';
import {
  NavProvider,
  CustomCursor,
  Preloader,
  Header,
  Footer,
  ScrollProgress,
  PageDots,
} from '@/components/ui';
import {
  HeroScene,
  StatsScene,
  AboutScene,
  WorkScene,
  ResearchScene,
  StackScene,
  OpenSourceScene,
  ExperienceScene,
  ContactScene,
} from '@/components/sections';

const PAGE_IDS = [
  'home',
  'presence',
  'about',
  'work',
  'research',
  'stack',
  'open-source',
  'experience',
  'contact',
] as const;

const PAGE_COUNT = PAGE_IDS.length;
const FLIP_LOCK_MS = 1000; // one gesture = one flip, no runaway paging
const WHEEL_THRESHOLD = 24;
const SWIPE_THRESHOLD = 60;

type PageProps = { reducedMotion: boolean };

function PageBody({ index, reducedMotion }: { index: number; reducedMotion: boolean }) {
  const props: PageProps = { reducedMotion };
  switch (index) {
    case 0:
      return <HeroScene {...props} />;
    case 1:
      return <StatsScene />;
    case 2:
      return <AboutScene />;
    case 3:
      return <WorkScene />;
    case 4:
      return <ResearchScene />;
    case 5:
      return <StackScene />;
    case 6:
      return <OpenSourceScene />;
    case 7:
      return <ExperienceScene />;
    case 8:
      return <ContactScene />;
    default:
      return <HeroScene {...props} />;
  }
}

/* Buttery flip: spring slide + subtle depth scale + quick fade. */
const pageVariants = {
  enter: (dir: number) => ({ y: dir >= 0 ? '10%' : '-10%', scale: 0.98, opacity: 0 }),
  center: { y: '0%', scale: 1, opacity: 1 },
  exit: (dir: number) => ({ y: dir >= 0 ? '-10%' : '10%', scale: 1.015, opacity: 0 }),
};

function indexFromHash(): number | null {
  try {
    const hash = window.location.hash.replace(/^#/, '');
    const i = PAGE_IDS.indexOf(hash as (typeof PAGE_IDS)[number]);
    return i >= 0 ? i : null;
  } catch {
    return null;
  }
}

function Pager() {
  const prefersReduced = useReducedMotion();
  const reducedMotion = prefersReduced ?? false;
  const { t } = useLang();
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const lastFlip = useRef(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Deep-link: honour #page-id on load, stay in sync with history.
  useEffect(() => {
    try {
      const i = indexFromHash();
      if (i !== null) {
        setIndex(i);
        setDir(1);
      }
      const onHash = () => {
        const j = indexFromHash();
        if (j !== null) {
          setIndex((prev) => {
            if (j !== prev) setDir(j > prev ? 1 : -1);
            return j;
          });
          lastFlip.current = Date.now();
        }
      };
      window.addEventListener('hashchange', onHash);
      return () => window.removeEventListener('hashchange', onHash);
    } catch {
      return;
    }
  }, []);

  const goToScene = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(PAGE_COUNT - 1, next));
      setIndex((prev) => {
        if (clamped === prev) return prev;
        setDir(clamped > prev ? 1 : -1);
        lastFlip.current = Date.now();
        return clamped;
      });
    },
    []
  );

  // Keep the URL hash on the visible page (no history spam).
  useEffect(() => {
    try {
      window.history.replaceState(null, '', `#${PAGE_IDS[index]}`);
    } catch {
      /* ignore */
    }
  }, [index]);

  const tryFlip = useCallback(
    (delta: 1 | -1) => {
      const now = Date.now();
      if (now - lastFlip.current < FLIP_LOCK_MS) return;
      lastFlip.current = now;
      setIndex((prev) => {
        const next = Math.max(0, Math.min(PAGE_COUNT - 1, prev + delta));
        if (next !== prev) setDir(delta);
        return next;
      });
    },
    []
  );

  // Touch: dominant-axis vertical swipes flip pages; horizontal swipes
  // stay native so carousels keep working.
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    if (t) touchStart.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (Math.abs(dy) < SWIPE_THRESHOLD) return;
      if (Math.abs(dy) < Math.abs(dx) * 1.2) return;
      tryFlip(dy < 0 ? 1 : -1);
    },
    [tryFlip]
  );

  // Native non-passive wheel listener — React delegates wheel as passive,
  // so preventDefault would warn. Vertical ticks flip pages; horizontal
  // pans belong to carousels.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onWheelNative = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return; // pinch-zoom gesture, leave alone
      const { deltaX, deltaY } = e;
      if (Math.abs(deltaY) < WHEEL_THRESHOLD) return;
      if (Math.abs(deltaX) > Math.abs(deltaY)) return;
      e.preventDefault();
      tryFlip(deltaY > 0 ? 1 : -1);
    };
    root.addEventListener('wheel', onWheelNative, { passive: false });
    return () => root.removeEventListener('wheel', onWheelNative);
  }, [tryFlip]);

  // Keyboard paging.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          tryFlip(1);
          break;
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          tryFlip(-1);
          break;
        case 'Home':
          e.preventDefault();
          goToScene(0);
          break;
        case 'End':
          e.preventDefault();
          goToScene(PAGE_COUNT - 1);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tryFlip, goToScene]);

  return (
    <NavProvider value={{ goToScene, goToTop: () => goToScene(0) }}>
      <CustomCursor />
      {/* boot splash */}
      <AnimatePresence>
        {!ready && !reducedMotion && <Preloader key="preloader" onComplete={() => setReady(true)} />}
      </AnimatePresence>

      <ScrollProgress value={(index + 1) / PAGE_COUNT} />
      <Header />

      <div
        ref={rootRef}
        className="pager-root"
        style={{ touchAction: 'pan-x' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <TechBackground pulseKey={index} reducedMotion={reducedMotion} />
        <div
          className="pager-grid grid-bg"
          aria-hidden
          style={reducedMotion ? {} : { transform: `translate3d(0, ${-index * 14}px, 0)` }}
        />
        <div className="pager-vignette" aria-hidden />

        <AnimatePresence custom={dir} initial={false} mode="sync">
          <motion.div
            key={index}
            className="page-abs"
            custom={dir}
            variants={pageVariants}
            initial={reducedMotion ? false : 'enter'}
            animate="center"
            exit={reducedMotion ? { opacity: 0, transition: { duration: 0 } } : 'exit'}
            transition={
              reducedMotion
                ? { duration: 0 }
                : {
                    y: { type: 'spring', stiffness: 170, damping: 27, mass: 0.9 },
                    scale: { type: 'spring', stiffness: 170, damping: 27, mass: 0.9 },
                    opacity: { duration: 0.4, ease: 'easeOut' },
                  }
            }
          >
            {(ready || reducedMotion) && <PageBody index={index} reducedMotion={reducedMotion} />}
          </motion.div>
        </AnimatePresence>

        <PageDots total={PAGE_COUNT} active={index} labels={t.ui.pageLabels} onGo={goToScene} />
      </div>

      <Footer />
    </NavProvider>
  );
}

export default function Home() {
  return (
    <LanguageProvider>
      <Pager />
    </LanguageProvider>
  );
}
