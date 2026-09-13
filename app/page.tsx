'use client';

import { useCallback, useEffect, useMemo, useState, type JSX } from 'react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import { CustomCursor, ScrollProgress, Preloader, Header, Footer, NavProvider } from '@/components/ui';
import { PinnedSection } from '@/components/PinnedSection';
import { buildPagePlan } from '@/app/pageplan';
import { LanguageProvider } from '@/app/language';
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

/* ── paged scenes ──
   Page scroll (px) is split into per-page segments sized by measured
   content: [intro hold][page0 read][turn][page1 read][turn]…[outro].
   Each page's inner content travels 1:1 with the finger through its
   read range; turns crossfade/slide between pages. Keyframe math is
   pure (app/pageplan.ts) and unit-tested — see README. */

type SceneComponent = (props: { reducedMotion: boolean }) => JSX.Element;

const SCENES: { id: string; Component: SceneComponent }[] = [
  { id: 'hero', Component: HeroScene },
  { id: 'stats', Component: StatsScene },
  { id: 'about', Component: AboutScene },
  { id: 'work', Component: WorkScene },
  { id: 'research', Component: ResearchScene },
  { id: 'stack', Component: StackScene },
  { id: 'open-source', Component: OpenSourceScene },
  { id: 'experience', Component: ExperienceScene },
  { id: 'contact', Component: ContactScene },
];

const TOTAL = SCENES.length;

export default function Page() {
  const [loaded, setLoaded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [viewportH, setViewportH] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerHeight : 800
  );
  const [contentHs, setContentHs] = useState<number[]>(() => SCENES.map(() => 0));

  useEffect(() => {
    /* Guarded: matchMedia can be absent in old WebViews / in-app browsers. */
    try {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mq.matches);
      const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      if (typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
      }
      /* Legacy Safari lacks addEventListener on MediaQueryList. */
      mq.addListener(onChange);
      return () => mq.removeListener(onChange);
    } catch {
      return;
    }
  }, []);

  /* Track the viewport: page-turn math is in px, so rotation / URL-bar
     show-hide re-plans the segments. */
  useEffect(() => {
    try {
      const sync = () => setViewportH(window.innerHeight);
      sync();
      window.addEventListener('resize', sync, { passive: true });
      window.addEventListener('orientationchange', sync);
      return () => {
        window.removeEventListener('resize', sync);
        window.removeEventListener('orientationchange', sync);
      };
    } catch {
      return;
    }
  }, []);

  const reportHeight = useCallback((index: number, height: number) => {
    setContentHs((prev) => {
      if (Math.abs((prev[index] ?? 0) - height) <= 1) return prev;
      const next = prev.slice();
      next[index] = height;
      return next;
    });
  }, []);

  const plan = useMemo(
    () => buildPagePlan(viewportH, contentHs, TOTAL),
    [viewportH, contentHs]
  );

  /* Raw page scroll position in px — the single driver of all motion. */
  const { scrollY } = useScroll();

  const goToScene = useCallback(
    (index: number) => {
      const safe = Math.min(Math.max(index, 0), TOTAL - 1);
      try {
        window.scrollTo({
          top: safe === 0 ? 0 : plan.scenes[safe].readStart + 2,
          behavior: reducedMotion ? 'auto' : 'smooth',
        });
      } catch {
        /* ignore */
      }
    },
    [plan, reducedMotion]
  );

  const goToTop = useCallback(() => {
    try {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    } catch {
      /* ignore */
    }
  }, [reducedMotion]);

  const nav = useMemo(() => ({ goToScene, goToTop }), [goToScene, goToTop]);
  const handleLoaded = useCallback(() => setLoaded(true), []);

  return (
    <LanguageProvider>
      <NavProvider value={nav}>
        <CustomCursor />
        <ScrollProgress />

        <AnimatePresence mode="wait">
          {!loaded && <Preloader onComplete={handleLoaded} />}
        </AnimatePresence>

        {loaded && (
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ background: '#060608' }}
          >
            <Header />
            <Footer />

            {/* ── fixed page layers, driven by page scroll ── */}
            <div className="scenes-stack">
              {SCENES.map(({ id, Component }, i) => (
                <PinnedSection
                  key={id}
                  index={i}
                  motion={plan.scenes[i]}
                  isFirst={i === 0}
                  scrollY={scrollY}
                  sceneId={id}
                  onHeight={reportHeight}
                >
                  <Component reducedMotion={reducedMotion} />
                </PinnedSection>
              ))}
            </div>

            {/* ── scroll spacer: page length = journey + one viewport ── */}
            <div style={{ height: plan.total + viewportH }} aria-hidden />
          </motion.main>
        )}
      </NavProvider>
    </LanguageProvider>
  );
}
