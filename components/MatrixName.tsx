'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════
   MATRIX NAME — "SOOBUJ MIAH" with continuous digital effect.

   After the initial reveal, the name stays readable while a subtle
   continuous Matrix effect runs: occasional letter glitches,
   ambient noise, and drifting digital particles. All animation is
   CSS-driven for performance; only one lightweight interval toggles
   glitch classes.

   Reduced-motion: reveal only, no continuous effect.
   ═══════════════════════════════════════════════════════════════ */

const NAME = 'SOOBUJ MIAH';
const LETTERS = NAME.split('');
/* Glitch targets exclude the space (glitching it is invisible). */
const GLITCHABLE = LETTERS.map((ch, i) => (ch === ' ' ? -1 : i)).filter((i) => i >= 0);

export function MatrixName({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const [glitchIndex, setGlitchIndex] = useState<number | null>(null);

  /* Continuous glitch: briefly glitch one random letter at a time. */
  useEffect(() => {
    if (reducedMotion) return;

    let timeout: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      const pick = GLITCHABLE[Math.floor(Math.random() * GLITCHABLE.length)];
      setGlitchIndex(pick);
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => setGlitchIndex(null), 180);
    }, 700);

    return () => {
      clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [reducedMotion]);

  return (
    <span className="matrix-name" aria-label={NAME}>
      {/* ambient noise layer */}
      {!reducedMotion && <span className="matrix-noise" aria-hidden />}

      {/* digital particles */}
      {!reducedMotion && (
        <span className="matrix-particles" aria-hidden>
          {[...Array(6)].map((_, i) => (
            <span
              key={i}
              className="matrix-particle"
              style={{
                left: `${15 + i * 14}%`,
                bottom: `${10 + (i % 3) * 15}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${2.5 + (i % 3) * 0.7}s`,
              }}
            />
          ))}
        </span>
      )}

      {/* letters */}
      {LETTERS.map((letter, i) => (
        <motion.span
          key={i}
          className={`matrix-letter${glitchIndex === i ? ' glitching' : ''}`}
          initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
          animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
          transition={{
            duration: 0.6,
            delay: 0.6 + i * 0.07,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {letter === ' ' ? ' ' : letter}
        </motion.span>
      ))}
    </span>
  );
}
