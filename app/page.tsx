'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import { CustomCursor, ScrollProgress, Preloader, Header, Footer } from '@/components/ui';
import { PinnedSection } from '@/components/PinnedSection';
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

/* ── content-aware scroll weights ──
   Each section gets scroll duration proportional to its content.
   Higher weight = longer active time. */
const SCENES = [
  { id: 'hero', Component: HeroScene, weight: 1.0 },
  { id: 'stats', Component: StatsScene, weight: 0.8 },
  { id: 'about', Component: AboutScene, weight: 1.2 },
  { id: 'work', Component: WorkScene, weight: 1.8 },
  { id: 'research', Component: ResearchScene, weight: 1.2 },
  { id: 'stack', Component: StackScene, weight: 1.2 },
  { id: 'open-source', Component: OpenSourceScene, weight: 1.5 },
  { id: 'experience', Component: ExperienceScene, weight: 1.3 },
  { id: 'contact', Component: ContactScene, weight: 1.0 },
] as const;

const TOTAL = SCENES.length;
const WEIGHTS = SCENES.map((s) => s.weight);

export default function Page() {
  const [loaded, setLoaded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  /* single shared scroll progress drives every layer */
  const { scrollYProgress } = useScroll();

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
          <Footer />

          {/* ── fixed scene layers ── */}
          <div className="scenes-stack">
            {SCENES.map(({ id, Component, weight }, i) => (
              <PinnedSection
                key={id}
                index={i}
                total={TOTAL}
                weight={weight}
                weights={WEIGHTS}
                progress={scrollYProgress}
                reducedMotion={reducedMotion}
              >
                <Component reducedMotion={reducedMotion} />
              </PinnedSection>
            ))}
          </div>

          {/* ── scroll spacer ── */}
          <div style={{ height: `${TOTAL * 100}vh` }} aria-hidden />
        </motion.main>
      )}
    </>
  );
}
