'use client';

import dynamic from 'next/dynamic';
import { useReducedMotion } from 'framer-motion';

const CinematicStage = dynamic(
  () => import('@/components/CinematicStage').then((module) => module.CinematicStage),
  { ssr: false },
);

export function CinematicDocumentBackdrop({ sceneIndex }: { sceneIndex: 7 | 8 }) {
  const reducedMotion = useReducedMotion() ?? false;
  if (reducedMotion) return null;
  return <CinematicStage sectionIndex={sceneIndex} reducedMotion={false} />;
}
