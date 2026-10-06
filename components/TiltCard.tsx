'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';
import { MOTION } from '@/app/design-tokens';

/* ═══════════════════════════════════════════════════════════════
   TILT CARD — pointer-tracked 3D tilt (compositor-only).
   The card rotates a few degrees toward the pointer and its content
   pops toward the viewer on hover. Reads the shared `tilt` +
   `magnetic` tokens, so values cannot drift from the design system.

   Guardrails:
   - Fine-pointer only: coarse/touch devices render the child flat
     with zero pointer listeners (snap carousels & pull-to-refresh
     are untouched).
   - No-op under reduced motion (static, links inside stay functional).
   - Transform + opacity only — no filter/background/blend animation.
   ═══════════════════════════════════════════════════════════════ */

export function TiltCard({
  children,
  className = '',
  style,
  disabled = false,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Force-off for dense rows where tilt reads as noise. */
  disabled?: boolean;
}) {
  const T = MOTION.tilt;
  const reduced = useReducedMotion() ?? false;
  const [fine, setFine] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Detect a true pointer (mouse/trackpad): only then is tilt enabled.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setFine(mq.matches);
    const onChange = () => setFine(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const active = fine && !reduced && !disabled;

  const rotateX = useSpring(useMotionValue(0), T.followSpring);
  const rotateY = useSpring(useMotionValue(0), T.followSpring);
  const popZ = useSpring(useMotionValue(0), T.followSpring);
  const scale = useSpring(useMotionValue(1), T.followSpring);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!active || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    // Normalized pointer offset from the card center, -0.5..0.5.
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    rotateY.set(px * 2 * T.maxRotateDeg);
    rotateX.set(-py * 2 * T.maxRotateDeg);
  };
  const onEnter = () => {
    if (!active) return;
    popZ.set(T.popZ);
    scale.set(T.cornerScale);
  };
  const onLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    popZ.set(0);
    scale.set(1);
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        perspective: T.perspective,
        transformStyle: 'preserve-3d',
        // Keep the card interactive (links inside stay clickable).
        touchAction: 'manipulation',
      }}
      onPointerMove={active ? onMove : undefined}
      onPointerEnter={active ? onEnter : undefined}
      onPointerLeave={active ? onLeave : undefined}
    >
      <motion.div
        className="tilt-card h-full"
        style={{ rotateX, rotateY, scale, transformStyle: 'preserve-3d' }}
      >
        <motion.div className="tilt-content h-full" style={{ z: popZ }}>
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}
