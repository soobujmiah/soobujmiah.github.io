'use client';

import { type MotionValue, motion, useTransform } from 'framer-motion';
import { type ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════════════
   PINNED SECTION — reusable cinematic scene layer.

   Fixed full-viewport layers with content-aware scroll pacing.
   Each section gets scroll duration proportional to its content
   weight, so content-heavy sections stay active longer.

   A single shared scrollYProgress drives every layer. The page
   spacer provides the natural scroll range. Browser scroll is
   never hijacked.

   The last section locks (no recede) with an opaque background,
   creating a clean terminal state.
   ═══════════════════════════════════════════════════════════════ */

export interface PinnedSectionProps {
  index: number;
  total: number;
  weight: number;
  weights: number[];
  progress: MotionValue<number>;
  enterSpan?: number;
  reducedMotion?: boolean;
  children: ReactNode;
  className?: string;
}

export function PinnedSection({
  index,
  total,
  weight,
  weights,
  progress,
  enterSpan = 0.04,
  reducedMotion = false,
  children,
  className = '',
}: PinnedSectionProps) {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const offset = weights.slice(0, index).reduce((a, b) => a + b, 0) / totalWeight;
  const duration = weight / totalWeight;
  const isLast = index === total - 1;

  /* ── enter: slide up from below (hero stays put) ── */
  const rawTranslateY = useTransform(progress, [offset, offset + enterSpan], [100, 0], { clamp: true });
  const translateY = index === 0 ? 0 : rawTranslateY;

  /* ── recede: fade/blur as next section covers (last section locks) ── */
  const recedeStart = isLast ? 1 : offset + duration;
  /* clamp end to 1 so the last scene's motion range stays inside [0,1] —
     exceeding 1 makes framer-motion silently skip the animation, leaving
     the scene stuck at the bottom with no exit transition. */
  const recedeEnd = Math.min(recedeStart + enterSpan, 1);

  const opacity = useTransform(progress, [recedeStart, recedeEnd], [1, isLast ? 1 : 0.1], { clamp: true });
  const scale = useTransform(progress, [recedeStart, recedeEnd], [1, isLast ? 1 : 0.97], { clamp: true });
  const blurRaw = useTransform(progress, [recedeStart, recedeEnd], [0, isLast ? 0 : 6], { clamp: true });
  const filter = useTransform(blurRaw, (v) => `blur(${v}px)`);

  return (
    <motion.section
      className={`scene-fixed${isLast ? ' scene-terminal' : ''}${className ? ` ${className}` : ''}`}
      style={{
        translateY,
        opacity,
        scale,
        filter,
        zIndex: index + 1,
        willChange: 'transform, opacity, filter',
      }}
    >
      <div className="scene-inner">{children}</div>
    </motion.section>
  );
}
