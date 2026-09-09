'use client';

import { motion } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════
   MATRIX NAME — "সবুজ" digital materialization.

   Split into syllables (not code units) so the vowel sign ু in বু
   stays bound to ব and the name never visually tears. Each syllable
   reveals via a staggered clip-path while a digital-noise sweep
   passes across the text — elegant, readable, Bangla-safe.

   Reduced-motion: simple crossfade, no effect.
   ═══════════════════════════════════════════════════════════════ */

const SYLLABLES = ['স', 'বু', 'জ'];
const NAME = SYLLABLES.join('');

export function MatrixName({ reducedMotion = false }: { reducedMotion?: boolean }) {
  return (
    <span className="matrix-name" aria-label="সবুজ">
      {SYLLABLES.map((syl, i) => (
        <motion.span
          key={i}
          className="matrix-syllable"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
          animate={
            reducedMotion
              ? { opacity: 1 }
              : { opacity: 1, clipPath: 'inset(0 0% 0 0)' }
          }
          transition={{
            duration: reducedMotion ? 0.5 : 0.7,
            delay: 0.8 + i * 0.18,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {syl}
        </motion.span>
      ))}

      {/* digital sweep overlay — only when motion is allowed */}
      {!reducedMotion && (
        <motion.span
          className="matrix-sweep"
          aria-hidden
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 1.4, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      )}
    </span>
  );
}

export { NAME as MATRIX_NAME };
