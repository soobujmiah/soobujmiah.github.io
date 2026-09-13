'use client';

import { type MotionValue, motion, useTransform } from 'framer-motion';
import { type ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════════════
   PINNED SECTION — reusable cinematic scene layer.

   Fixed full-viewport layers with uniform phaseStep spacing.
   Each section enters at an evenly-spaced slot within [0,1] and
   recedes into the next, ensuring smooth transitions without gaps.

   A single shared scrollYProgress drives every layer. The page
   spacer provides the natural scroll range. Browser scroll is
   never hijacked.
   ═══════════════════════════════════════════════════════════════ */

export interface PinnedSectionProps {
  index: number;
  total: number;
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
  weights,
  progress,
  enterSpan = 0.04,
  reducedMotion = false,
  children,
  className = '',
}: PinnedSectionProps) {
  const phaseStep = (1 - enterSpan) / (total - 1);
  const enterStart = index === 0 ? 0 : index * phaseStep;
  const rawTranslateY = useTransform(progress, [enterStart, Math.min(enterStart + enterSpan, 1)], [100, 0], { clamp: true });
  const translateY = index === 0 ? 0 : rawTranslateY;

  /* ── recede: fade/blur as next section covers ──
     Uniform phaseStep spacing so every scene (including the last)
     has a non-degenerate recede range within [0,1]. Weight-based
     hold would make the last scene recedeStart = sum(all)/sum = 1.0,
     producing a zero-width range that framer-motion silently skips. */
  const recedeStart = Math.min((index + 1) * phaseStep, 1 - enterSpan);
  const recedeEnd = recedeStart + enterSpan;

  const opacity = useTransform(progress, [recedeStart, recedeEnd], [1, 0.1], { clamp: true });
  const scale = useTransform(progress, [recedeStart, recedeEnd], [1, 0.97], { clamp: true });
  const blurRaw = useTransform(progress, [recedeStart, recedeEnd], [0, 6], { clamp: true });
  const filter = useTransform(blurRaw, (v) => `blur(${v}px)`);

  return (
    <motion.section
      className={`scene-fixed${className ? ` ${className}` : ''}`}
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
