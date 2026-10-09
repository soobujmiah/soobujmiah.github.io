'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const LivingAtmosphere = dynamic(() => import('@/components/LivingAtmosphere').then((module) => module.LivingAtmosphere), { ssr: false });

type Shot = { asset: 0 | 1 | 2; x: string; y: string; scale: number };

const PLATES = [
  '/cinema/observatory.webp',
  '/cinema/causeway.webp',
  '/cinema/archive.webp',
] as const;

// One place, seen from different camera positions as the story advances.
const SHOTS: readonly Shot[] = [
  { asset: 0, x: '0%', y: '0%', scale: 1.04 },
  { asset: 0, x: '-3%', y: '1%', scale: 1.14 },
  { asset: 1, x: '0%', y: '0%', scale: 1.04 },
  { asset: 1, x: '3%', y: '-1%', scale: 1.15 },
  { asset: 1, x: '-3%', y: '-2%', scale: 1.24 },
  { asset: 2, x: '0%', y: '0%', scale: 1.05 },
  { asset: 2, x: '3%', y: '-1%', scale: 1.16 },
  { asset: 1, x: '2%', y: '-1%', scale: 1.13 },
  { asset: 2, x: '-2%', y: '0%', scale: 1.11 },
];

export function CinematicWorld({ sceneIndex, reducedMotion = false }: { sceneIndex: number; reducedMotion?: boolean }) {
  const shot = SHOTS[sceneIndex] ?? SHOTS[0];
  const lastPose = useRef<Shot[]>([SHOTS[0], SHOTS[2], SHOTS[5]]);
  const worldRef = useRef<HTMLDivElement>(null);
  lastPose.current[shot.asset] = shot;

  useEffect(() => {
    const root = worldRef.current;
    if (!root || reducedMotion || !window.matchMedia('(pointer: fine)').matches) return;
    let frame = 0;
    let x = 0;
    let y = 0;
    const update = () => {
      root.style.setProperty('--look-x', `${x * 1.6}%`);
      root.style.setProperty('--look-y', `${y * 1.2}%`);
      frame = 0;
    };
    const move = (event: PointerEvent) => {
      x = event.clientX / window.innerWidth - 0.5;
      y = event.clientY / window.innerHeight - 0.5;
      if (!frame) frame = requestAnimationFrame(update);
    };
    const reset = () => {
      x = 0;
      y = 0;
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('blur', reset);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('blur', reset);
      cancelAnimationFrame(frame);
      root.style.removeProperty('--look-x');
      root.style.removeProperty('--look-y');
    };
  }, [reducedMotion]);

  return (
    <div ref={worldRef} className="cinema-world" aria-hidden="true" data-shot={sceneIndex}>
      {PLATES.map((src, asset) => {
        const pose = lastPose.current[asset];
        return (
          <motion.div
            key={src}
            className="cinema-world-plate"
            data-active={shot.asset === asset}
            initial={false}
            animate={{
              opacity: shot.asset === asset ? 1 : 0,
              x: pose.x,
              y: pose.y,
              scale: pose.scale,
            }}
            transition={reducedMotion ? { duration: 0 } : {
              opacity: { duration: 1.1, ease: [0.22, 0.8, 0.2, 1] },
              x: { duration: 1.8, ease: [0.16, 1, 0.3, 1] },
              y: { duration: 1.8, ease: [0.16, 1, 0.3, 1] },
              scale: { duration: 1.8, ease: [0.16, 1, 0.3, 1] },
            }}
          >
            <div className="cinema-world-look">
              <div className="cinema-world-image" style={{ backgroundImage: `url(${src})` }} />
            </div>
          </motion.div>
        );
      })}
      <div className="cinema-world-grade" />
      <LivingAtmosphere sceneIndex={sceneIndex} reducedMotion={reducedMotion} />
      <div className="cinema-world-air" />
    </div>
  );
}
