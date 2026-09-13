'use client';

import { type MotionValue, motion, useMotionValueEvent, useTransform } from 'framer-motion';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { SceneMotion } from '@/app/pageplan';

/* ═══════════════════════════════════════════════════════════════
   PAGED SCENES — one fixed page at a time, page scroll drives all.

   - Each scene is a fixed full-viewport layer. Incoming pages slide
     up from the bottom and fade in OVER the previous page (higher
     z-index), like turning pages bottom-to-top. Outgoing pages drift
     up slightly underneath.
   - Tall content scrolls THROUGH the fixed viewport 1:1 with the
     finger (transform-driven, so it follows native page momentum),
     and only once a page's content is finished does the next page
     start coming in.
   - All motion is a pure function of page scrollY (keyframe math in
     page.tsx) — no scroll-jacking, fully reversible, touch-safe.
   - Only the active page takes pointer events / is exposed to
     assistive tech.
   ═══════════════════════════════════════════════════════════════ */

const SceneActiveContext = createContext<boolean>(true);

/** True while the enclosing page owns the viewport. Defaults to true
    outside a PinnedSection so shared components stay safe. */
export function useSceneActive(): boolean {
  return useContext(SceneActiveContext);
}

export interface PinnedSectionProps {
  index: number;
  motion: SceneMotion;
  isFirst: boolean;
  scrollY: MotionValue<number>;
  sceneId: string;
  onHeight: (index: number, height: number) => void;
  children: ReactNode;
}

export function PinnedSection({
  index,
  motion: m,
  isFirst,
  scrollY,
  sceneId,
  onHeight,
  children,
}: PinnedSectionProps) {
  /* Inner content travel (0 → -travel across this page's read range). */
  const contentY = useTransform(scrollY, m.contentKeys, m.contentVals);
  /* Page enter/exit (slide + fade, driven by the same scrollY). */
  const layerY = useTransform(scrollY, m.layerYKeys, m.layerYVals);
  const layerO = useTransform(scrollY, m.layerOKeys, m.layerOVals);

  /* Active = this page owns the viewport. Flips only at boundaries. */
  const [active, setActive] = useState<boolean>(() => {
    try {
      const y = scrollY.get();
      return y >= m.activeStart && y < m.activeEnd;
    } catch {
      return isFirst;
    }
  });
  useMotionValueEvent(scrollY, 'change', (v) => {
    const next = v >= m.activeStart && v < m.activeEnd;
    setActive((prev) => (prev === next ? prev : next));
  });

  /* Measure in-flow content height (ignores absolute orbs/hints) and
     report up so page.tsx can size this page's scroll segment. A
     ResizeObserver keeps it correct across language switches, font
     loads, and rotation. */
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      try {
        const fill = wrap.firstElementChild as HTMLElement | null;
        const scope = fill ?? wrap;
        let max = 0;
        for (const child of Array.from(scope.children)) {
          const el = child as HTMLElement;
          let pos = '';
          try {
            pos = window.getComputedStyle(el).position;
          } catch {
            pos = '';
          }
          if (pos === 'absolute' || pos === 'fixed') continue;
          max = Math.max(max, el.offsetTop + el.offsetHeight);
        }
        onHeight(index, max);
      } catch {
        /* measurement unavailable — segment math falls back to 0 travel */
      }
    };
    measure();
    let ro: ResizeObserver | null = null;
    try {
      if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(() => measure());
        ro.observe(wrap);
      }
    } catch {
      ro = null;
    }
    return () => {
      try {
        ro?.disconnect();
      } catch {
        /* ignore */
      }
    };
  }, [index, onHeight]);

  return (
    <SceneActiveContext.Provider value={active}>
      <motion.section
        id={`scene-${sceneId}`}
        className="scene-fixed"
        aria-hidden={!active}
        style={{
          y: layerY,
          opacity: layerO,
          zIndex: index + 1,
          pointerEvents: active ? 'auto' : 'none',
          willChange: 'transform, opacity',
        }}
      >
        <div className="scene-inner">
          <motion.div ref={wrapRef} style={{ y: contentY, willChange: 'transform' }}>
            {children}
          </motion.div>
        </div>
      </motion.section>
    </SceneActiveContext.Provider>
  );
}
