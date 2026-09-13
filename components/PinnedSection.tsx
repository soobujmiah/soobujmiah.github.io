'use client';

import { type MotionValue, motion, useMotionValueEvent, useTransform } from 'framer-motion';
import { createContext, useContext, useState, type ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════════════
   PINNED SECTION — sequential fixed scenes with scroll-driven
   enter/exit transitions.

   Contract per scene, over its scroll slot [slotStart, slotEnd]:
   - First scene: visible immediately (opacity 1), then crossfades
     out across its end boundary.
   - Middle scenes: crossfade in across their start boundary, hold
     while active, crossfade out across their end boundary.
   - Last scene: crossfades in, then HOLDS to the end of the page
     (no fade-out — it is the terminal scene).
   - Inactive scenes get pointer-events: none + aria-hidden so the
     invisible fixed layers above/below can never swallow clicks or
     confuse assistive tech.

   Slot boundaries come from content weights (page.tsx) so heavier
   scenes genuinely get more scroll time.
   ═══════════════════════════════════════════════════════════════ */

const SceneActiveContext = createContext<boolean>(true);

/** True while the enclosing scene owns the viewport. Defaults to true
    outside a PinnedSection so shared components stay safe. */
export function useSceneActive(): boolean {
  return useContext(SceneActiveContext);
}

export interface PinnedSectionProps {
  index: number;
  slotStart: number;
  slotEnd: number;
  isFirst: boolean;
  isLast: boolean;
  progress: MotionValue<number>;
  sceneId: string;
  children: ReactNode;
}

export function PinnedSection({
  index,
  slotStart,
  slotEnd,
  isFirst,
  isLast,
  progress,
  sceneId,
  children,
}: PinnedSectionProps) {
  const slotLen = Math.max(slotEnd - slotStart, 0.0001);
  /* Transitions are centered ON slot boundaries so the outgoing fade
     and the incoming fade overlap into a true crossfade (no dip to
     black between scenes). Values outside the keyframes clamp, so
     middle scenes rest at 0 before/after their slot. */
  const h = slotLen * 0.18;

  const opacity = useTransform(
    progress,
    isFirst
      ? [slotEnd - h, slotEnd + h]
      : isLast
        ? [slotStart - h, slotStart + h]
        : [slotStart - h, slotStart + h, slotEnd - h, slotEnd + h],
    isFirst ? [1, 0] : isLast ? [0, 1] : [0, 1, 1, 0]
  );

  /* Gentle vertical drift: incoming rises into place, outgoing rises out. */
  const y = useTransform(
    progress,
    isFirst
      ? [slotEnd - h, slotEnd + h]
      : isLast
        ? [slotStart - h, slotStart + h]
        : [slotStart - h, slotStart + h, slotEnd - h, slotEnd + h],
    isFirst ? [0, -48] : isLast ? [48, 0] : [48, 0, 0, -48]
  );

  /* Active = this scene owns the viewport. State updates only flip at
     slot edges, so scroll frames don't re-render. */
  const [active, setActive] = useState(isFirst);
  useMotionValueEvent(progress, 'change', (v) => {
    const next = isLast ? v >= slotStart : v >= slotStart && v < slotEnd;
    setActive((prev) => (prev === next ? prev : next));
  });

  return (
    <SceneActiveContext.Provider value={active}>
      <motion.section
        id={`scene-${sceneId}`}
        className="scene-fixed"
        aria-hidden={!active}
        style={{
          y,
          opacity,
          zIndex: index + 1,
          pointerEvents: active ? 'auto' : 'none',
          willChange: 'transform, opacity',
        }}
      >
        <div className="scene-inner">{children}</div>
      </motion.section>
    </SceneActiveContext.Provider>
  );
}
