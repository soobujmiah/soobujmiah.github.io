'use client';

import { useReducedMotion } from 'framer-motion';
import { CinematicWorld } from '@/components/CinematicWorld';

export function CinematicDocumentBackdrop({ sceneIndex }: { sceneIndex: 7 | 8 }) {
  const reducedMotion = useReducedMotion() ?? false;
  return <CinematicWorld sceneIndex={sceneIndex} reducedMotion={reducedMotion} />;
}
