'use client';

import { type MotionValue, motion, useTransform } from 'framer-motion';
import { type ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════════════
   PINNED SECTION — reusable cinematic scene layer.

   Each section is a fixed full-viewport layer. A single shared
   scrollYProgress (0..1) drives every layer so that:
     * the current scene sits at translateY 0 (fully visible)
     * the next scene slides up from below and covers it
     * the covered scene subtly recedes (fade / scale / blur)
     * later layers stack on top via ascending z-index; before a
       layer enters it is translated below the viewport so its
       higher z-index is not visible

   Browser scroll is never hijacked — we only *read* progress.
   A tall spacer (in page.tsx) provides the natural scroll range.
   ═══════════════════════════════════════════════════════════════ */

export interface PinnedSectionProps {
  index: number;
  total: number;
  zIndex: number;
  progress: MotionValue<number>;
  enterSpan?: number;
  reducedMotion?: boolean;
  children: ReactNode;
  className?: string;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

export function PinnedSection({
  index,
  total,
  zIndex,
  progress,
  enterSpan = 0.14,
  reducedMotion = false,
  children,
  className = '',
}: PinnedSectionProps) {
  const enterStart = index / total;
  const enterEnd = enterStart + enterSpan;

  /* ── slide up from below (hero stays put from the top) ──
     Hooks are always called; the hero simply maps to [0,0]. */
  const rawTranslateY = useTransform(progress, [enterStart, enterEnd], [100, 0], { clamp: true });
  const translateY = index === 0 ? 0 : rawTranslateY;

  /* ── recede while the next scene covers this one ──
     The last section has nothing covering it, so its recede
     range is degenerate (input never exceeds it) → stays locked. */
  const isLast = index === total - 1;
  const recedeStart = isLast ? 1 : (index + 1) / total;
  const recedeEnd = recedeStart + enterSpan;

  const opacity = useTransform(progress, [recedeStart, recedeEnd], [1, isLast ? 1 : 0.12], { clamp: true });
  const scale = useTransform(progress, [recedeStart, recedeEnd], [1, isLast ? 1 : 0.97], { clamp: true });
  const blurRaw = useTransform(progress, [recedeStart, recedeEnd], [0, isLast ? 0 : 7], { clamp: true });
  const filter = useTransform(blurRaw, (v) => `blur(${v}px)`);

  /* ── reduced motion: snap-fade only, no slide/parallax ── */
  const activeIndex = useTransform(progress, [0, 1], [0, total - 1]);
  const isActive = useTransform(activeIndex, (v) => Math.round(v) === index);
  const rmOpacity = useTransform(isActive, (v) => (v ? 1 : 0));

  return (
    <motion.section
      className={`scene${className ? ` ${className}` : ''}`}
      style={
        reducedMotion
          ? { opacity: rmOpacity, zIndex, willChange: 'opacity' }
          : {
              translateY,
              opacity,
              scale,
              filter,
              zIndex,
              willChange: 'transform, opacity, filter',
            }
      }
      transition={{ ease: easeOut }}
    >
      <div className="scene-inner">{children}</div>
    </motion.section>
  );
}
