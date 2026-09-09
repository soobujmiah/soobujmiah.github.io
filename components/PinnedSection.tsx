'use client';

import { type MotionValue, motion, useScroll, useTransform } from 'framer-motion';
import { useRef, type ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════════════
   PINNED SECTION — reusable cinematic scene layer.

   Each section is position:sticky with top:0 and full viewport
   height. They stack in the document flow, so the browser handles
   the scroll-driven covering naturally — no spacer, no shared
   progress math, no fragile phase-step calculations.

   A section's own local scroll progress drives its recede
   (opacity / scale / blur) as the next section covers it. The
   last section never recedes (nothing covers it).

   Browser scroll is never hijacked.
   ═══════════════════════════════════════════════════════════════ */

export interface PinnedSectionProps {
  index: number;
  zIndex: number;
  children: ReactNode;
  className?: string;
}

export function PinnedSection({ index, zIndex, children, className = '' }: PinnedSectionProps) {
  const ref = useRef(null);

  /* local scroll progress of THIS section as it passes the viewport */
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  /* recede as this section scrolls up and away (0 → 1).
     The last section has nothing covering it, so its recede
     is forced to 0 (stays locked). */
  const isLast = false; /* per-section last detection handled by parent */
  const recede = scrollYProgress;

  const opacity = useTransform(recede, [0, 0.6, 1], [1, 0.6, 0.1]);
  const scale = useTransform(recede, [0, 1], [1, 0.97]);
  const blurRaw = useTransform(recede, [0, 1], [0, 6]);
  const filter = useTransform(blurRaw, (v) => `blur(${v}px)`);

  return (
    <motion.section
      ref={ref}
      className={`scene-sticky${className ? ` ${className}` : ''}`}
      style={{ opacity, scale, filter, zIndex, willChange: 'transform, opacity, filter' }}
    >
      <div className="scene-inner">{children}</div>
    </motion.section>
  );
}
