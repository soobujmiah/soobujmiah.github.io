'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════
   DIGITAL DIFFUSION NAME — each character animates independently
   with subtle color variation and gentle particle drift.

   The palette stays within the green family (accent → bright →
   emerald → teal-soft) so it feels alive without looking like a
   rainbow toy. Staggered delays give each glyph its own voice.

   Reduced-motion: only the entrance plays once; no continuous loop.
   ═══════════════════════════════════════════════════════════════ */

const NAME = 'SOOBUJ MIAH';
const LETTERS = NAME.split('');

/* Per-character color — green spectrum, subtly different per slot */
const CHARS_COLORS: string[] = [
  '#10b981', // emerald
  '#22c55e', // green
  '#4ade80', // green-light
  '#86efac', // green-soft
  '#22d3ee', // cyan-soft
  '#34d399', // emerald-mid
  '#10b981', // repeat cycle
  '#6ee7b7', // emerald-light
  '#22c55e',
  '#4ade80',
  '#10b981',
  '#22d3ee',
  '#86efac',
  '#34d399',
];

export function MatrixName({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const [revealed, setRevealed] = useState(false);
  const idxRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Initial staggered reveal on mount. */
  useEffect(() => {
    setRevealed(false);
    idxRef.current = 0;
    const timer = setTimeout(() => setRevealed(true), 100);
    return () => clearTimeout(timer);
  }, []);

  /* Continuous subtile phase shift — nudge the glow index slowly.
     Creates a slow wave that makes the name feel respiring. */
  useEffect(() => {
    if (reducedMotion) return;
    intervalRef.current = setInterval(() => {
      idxRef.current = (idxRef.current + 1) % LETTERS.length;
    }, 1800);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [reducedMotion]);

  return (
    <span
      className="matrix-name"
      aria-label={NAME}
      style={{ background: 'transparent', boxShadow: 'none' }}
    >
      {/* ambient noise layer */}
      {!reducedMotion && (
        <span className="matrix-noise" aria-hidden />
      )}

      {/* digital particles */}
      {!reducedMotion && (
        <span className="matrix-particles" aria-hidden>
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="matrix-particle"
              style={{
                left: `${8 + i * 12}%`,
                bottom: `${8 + (i % 4) * 18}%`,
                animationDelay: `${i * 0.4}s`,
                animationDuration: `${2.2 + (i % 3) * 0.6}s`,
              }}
            />
          ))}
        </span>
      )}

      {/* letters — each independent, staggered entrance, per-char color */}
      {LETTERS.map((letter, i) => {
        const baseColor = CHARS_COLORS[i % CHARS_COLORS.length];
        /* Slow wave: the currently-highlighted char gets slightly brighter */
        const isActive = !reducedMotion && revealed && (i - idxRef.current + LETTERS.length) % LETTERS.length < 3;
        const color = isActive ? '#86efac' : baseColor;
        const glowOpacity = isActive ? 0.6 : 0.18;
        const yOffset = reducedMotion ? 0 : isActive ? -1.5 : 0;

        return (
          <motion.span
            key={i}
            className={`matrix-letter${!revealed ? ' matrix-reveal' : ''}`}
            initial={false}
            animate={{
              opacity: revealed ? 1 : 0,
              y: revealed ? yOffset : 18,
              filter: revealed
                ? `drop-shadow(0 0 ${isActive ? 6 : 2}px ${color}aa)`
                : 'none',
            }}
            transition={{
              duration: 0.55,
              delay: 0.55 + i * 0.065,
              ease: [0.16, 1, 0.3, 1],
              y: { type: 'spring', stiffness: 200, damping: 18 },
            }}
            style={{
              color,
              background: 'transparent',
              WebkitTextFillColor: color,
            }}
          >
            {letter === ' ' ? ' ' : letter}
          </motion.span>
        );
      })}
    </span>
  );
}
