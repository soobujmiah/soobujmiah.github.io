'use client';

import { type MotionValue, motion, useMotionValueEvent, useTransform } from 'framer-motion';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════════════
   SCENE LAYOUT — adaptive.

   CINEMATIC (desktop, fine pointer): sequential fixed scenes with
   scroll-driven crossfades centered on weighted slot boundaries.
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

   FLOW (phone / touch / narrow): the same scenes render as normal
   stacked document sections sized by their content. Nothing is
   fixed, nothing clips, nothing needs inner scrolling — every card
   is reachable with a plain page scroll. Reveals play on scroll
   into view via useInView as usual.
   ═══════════════════════════════════════════════════════════════ */

const SceneActiveContext = createContext<boolean>(true);

/** True while the enclosing scene owns the viewport (cinematic), or
    always true in flow mode. Defaults to true outside a scene. */
export function useSceneActive(): boolean {
  return useContext(SceneActiveContext);
}

/** Cinematic only on wide screens with a fine pointer. Everything
    else gets robust document flow. Guarded for SSR / old WebViews. */
export function useCinematic(): boolean {
  const [cinematic, setCinematic] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
      const mq = window.matchMedia('(min-width: 1024px) and (hover: hover)');
      const sync = () => setCinematic(mq.matches);
      sync();
      if (typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', sync);
        return () => mq.removeEventListener('change', sync);
      }
      mq.addListener(sync);
      return () => mq.removeListener(sync);
    } catch {
      return;
    }
  }, []);

  return cinematic;
}

export interface PinnedSectionProps {
  index: number;
  slotStart: number;
  slotEnd: number;
  isFirst: boolean;
  isLast: boolean;
  progress: MotionValue<number>;
  sceneId: string;
  cinematic: boolean;
  /** Flow mode: stretch short scenes (hero/contact) to fill the screen. */
  tall?: boolean;
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
  cinematic,
  tall = false,
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

  /* ── FLOW MODE: plain stacked section, always "active". ── */
  if (!cinematic) {
    return (
      <SceneActiveContext.Provider value={true}>
        <section id={`scene-${sceneId}`} className={`flow-section${tall ? ' flow-tall' : ''}`}>
          {children}
        </section>
      </SceneActiveContext.Provider>
    );
  }

  /* ── CINEMATIC MODE: fixed crossfading layer. ── */
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
