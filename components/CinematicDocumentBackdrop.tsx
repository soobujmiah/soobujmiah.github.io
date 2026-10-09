'use client';

import { useReducedMotion } from 'framer-motion';
import { CinematicWorld } from '@/components/CinematicWorld';
import { LivingInteractions } from '@/components/LivingInteractions';

export function CinematicDocumentBackdrop({ sceneIndex }: { sceneIndex: 7 | 8 }) {
  const reducedMotion = useReducedMotion() ?? false;
  return <><CinematicWorld sceneIndex={sceneIndex} reducedMotion={reducedMotion} /><LivingInteractions /></>;
}
