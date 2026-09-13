'use client';

import { useCallback, useEffect, useMemo, useState, type JSX } from 'react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import { CustomCursor, ScrollProgress, Preloader, Header, Footer, NavProvider } from '@/components/ui';
import { PinnedSection, useCinematic } from '@/components/PinnedSection';
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

/* ── content-aware scroll weights (cinematic mode) ──
   Each scene's scroll slot is proportional to its weight, so the
   dense Work / Open Source / Experience scenes genuinely get more
   scroll time than the light Hero / Stats scenes. */
type SceneComponent = (props: { reducedMotion: boolean }) => JSX.Element;

const SCENES: { id: string; Component: SceneComponent; weight: number; tall?: boolean }[] = [
  { id: 'hero', Component: HeroScene, weight: 1.0, tall: true },
  { id: 'stats', Component: StatsScene, weight: 0.8 },
  { id: 'about', Component: AboutScene, weight: 1.2 },
  { id: 'work', Component: WorkScene, weight: 1.8 },
  { id: 'research', Component: ResearchScene, weight: 1.2 },
  { id: 'stack', Component: StackScene, weight: 1.2 },
  { id: 'open-source', Component: OpenSourceScene, weight: 1.5 },
  { id: 'experience', Component: ExperienceScene, weight: 1.3 },
  { id: 'contact', Component: ContactScene, weight: 1.0, tall: true },
];

const TOTAL = SCENES.length;
const TOTAL_WEIGHT = SCENES.reduce((sum, s) => sum + s.weight, 0);

/* Slot boundaries in page-progress units, derived from weights. */
const SLOTS: { start: number; end: number }[] = (() => {
  let cursor = 0;
  return SCENES.map((s) => {
    const start = cursor / TOTAL_WEIGHT;
    cursor += s.weight;
    return { start, end: cursor / TOTAL_WEIGHT };
  });
})();

function scrollToProgress(p: number, smooth: boolean) {
  try {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: Math.min(Math.max(p, 0), 1) * max, behavior: smooth ? 'smooth' : 'auto' });
  } catch {
    /* scroll unavailable — leave the user where they are */
  }
}

export default function Page() {
  const [loaded, setLoaded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const cinematic = useCinematic();

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

  /* Single shared scroll progress drives every cinematic layer. */
  const { scrollYProgress } = useScroll();

  const goToScene = useCallback(
    (index: number) => {
      const safe = Math.min(Math.max(index, 0), TOTAL - 1);
      if (!cinematic) {
        /* Flow mode: jump to the real section element. */
        try {
          document.getElementById(`scene-${SCENES[safe].id}`)?.scrollIntoView({
            behavior: reducedMotion ? 'auto' : 'smooth',
            block: 'start',
          });
        } catch {
          /* ignore */
        }
        return;
      }
      const slot = SLOTS[safe];
      scrollToProgress((slot.start + slot.end) / 2, !reducedMotion);
    },
    [cinematic, reducedMotion]
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

            {cinematic ? (
              <>
                {/* ── fixed scene layers ── */}
                <div className="scenes-stack">
                  {SCENES.map(({ id, Component }, i) => (
                    <PinnedSection
                      key={id}
                      index={i}
                      sceneId={id}
                      slotStart={SLOTS[i].start}
                      slotEnd={SLOTS[i].end}
                      isFirst={i === 0}
                      isLast={i === TOTAL - 1}
                      progress={scrollYProgress}
                      cinematic={true}
                    >
                      <Component reducedMotion={reducedMotion} />
                    </PinnedSection>
                  ))}
                </div>

                {/* ── scroll spacer ──
                    Extra 100vh at the end gives the terminal scene a proper
                    hold zone so it rests fully visible at the bottom. */}
                <div style={{ height: `${(TOTAL + 1) * 100}vh` }} aria-hidden />
              </>
            ) : (
              /* ── document flow: every section sized by its content ── */
              <div className="flow-stack">
                {SCENES.map(({ id, Component, tall }, i) => (
                  <PinnedSection
                    key={id}
                    index={i}
                    sceneId={id}
                    slotStart={SLOTS[i].start}
                    slotEnd={SLOTS[i].end}
                    isFirst={i === 0}
                    isLast={i === TOTAL - 1}
                    progress={scrollYProgress}
                    cinematic={false}
                    tall={tall}
                  >
                    <Component reducedMotion={reducedMotion} />
                  </PinnedSection>
                ))}
              </div>
            )}
          </motion.main>
        )}
      </NavProvider>
    </LanguageProvider>
  );
}
