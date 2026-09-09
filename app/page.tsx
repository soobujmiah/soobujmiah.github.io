'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

          {/* ── sticky scene layers ── */}
          <div className="scenes-stack">
            {SCENES.map(({ id, Component }, i) => (
              <PinnedSection
                key={id}
                index={i}
                zIndex={i + 1}
              >
                <Component reducedMotion={reducedMotion} />
              </PinnedSection>
            ))}
          </div>
        </motion.main>
      )}
    </>
  );
}
