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

const SCENES = [
  { id: 'hero', Component: HeroScene },
  { id: 'stats', Component: StatsScene },
  { id: 'about', Component: AboutScene },
  { id: 'work', Component: WorkScene },
  { id: 'research', Component: ResearchScene },
  { id: 'stack', Component: StackScene },
  { id: 'open-source', Component: OpenSourceScene },
  { id: 'experience', Component: ExperienceScene },
  { id: 'contact', Component: ContactScene },
] as const;

const TOTAL = SCENES.length;

export default function Page() {
  const [loaded, setLoaded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  /* respect prefers-reduced-motion */
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
            {SCENES.map(({ id, Component }, i) => (
              <PinnedSection
                key={id}
                index={i}
                total={TOTAL}
                zIndex={i + 1}
                progress={scrollYProgress}
                reducedMotion={reducedMotion}
              >
                <Component reducedMotion={reducedMotion} />
              </PinnedSection>
            ))}
          </div>

          {/* ── scroll spacer: provides the natural scroll range ── */}
          <div style={{ height: `${TOTAL * 100}vh` }} aria-hidden />
        </motion.main>
      )}
    </>
  );
}
