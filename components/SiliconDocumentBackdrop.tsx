'use client';

import { useReducedMotion } from 'framer-motion';
import { SiliconWorld } from '@/components/SiliconWorld';

/** The same environment behind the document routes (services, verification): a calm, static shot. */
export function SiliconDocumentBackdrop({ sceneIndex }: { sceneIndex: 7 | 8 }) {
  const reducedMotion = useReducedMotion() ?? false;
  return <SiliconWorld sceneIndex={sceneIndex} reducedMotion={reducedMotion} />;
}
