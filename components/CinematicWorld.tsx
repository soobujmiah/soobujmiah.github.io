'use client';

import { motion } from 'framer-motion';
import { useRef } from 'react';

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
  lastPose.current[shot.asset] = shot;

  return (
    <div className="cinema-world" aria-hidden="true" data-shot={sceneIndex}>
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
            <div className="cinema-world-image" style={{ backgroundImage: `url(${src})` }} />
          </motion.div>
        );
      })}
      <div className="cinema-world-grade" />
      <div className="cinema-world-air" />
    </div>
  );
}
