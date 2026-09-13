'use client';

import { type MotionValue, motion, useTransform } from 'framer-motion';
import { type ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════════════
   PINNED SECTION — sequential slide-up transitions.

   Each scene occupies one "slot" in the scroll timeline.
   While active, it sits centered in the viewport.
   When the next scene begins, this one slides up and fades out
   cleanly — no overlapping z-indices, no degenerate ranges.

   The extra 100vh spacer at the end ensures the last scene can
   slide off-screen instead of getting pinned at progress=1.0.
   ═══════════════════════════════════════════════════════════════ */

export interface PinnedSectionProps {
  index: number;
  total: number;
  progress: MotionValue<number>;
  children: ReactNode;
}

export function PinnedSection({
  index,
  total,
  progress,
  children,
}: PinnedSectionProps) {
  const slotSize = 1 / total;
  const slotStart = index * slotSize;
  const slotEnd = slotStart + slotSize;

  /* Slide-up: scene moves up as it leaves, stays put while active */
  const translateY = useTransform(progress,
    [slotStart, slotEnd],
    [0, -100 * slotSize]
  );

  /* Fade: opaque while active, fades to transparent as it leaves */
  const opacity = useTransform(progress,
    [slotStart, slotEnd],
    [1, 0]
  );

  return (
    <motion.section
      className="scene-fixed"
      style={{
        translateY,
        opacity,
        zIndex: index + 1,
        willChange: 'transform, opacity',
      }}
    >
      <div className="scene-inner">{children}</div>
    </motion.section>
  );
}
