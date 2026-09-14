/* ═══════════════════════════════════════════════════════════════
   DESIGN TOKENS — the single source of truth for the brand.

   This file is the machine-checkable root of the visual ecosystem
   (see DESIGN_SYSTEM.md). The portfolio imports these values; future
   repository websites must import the same ones rather than copying
   numbers out of prose.

   `scripts/check-design.mjs` parses DESIGN_SYSTEM.md and fails the
   build if the documented values drift from these. Documentation is
   therefore load-bearing, not decorative.
   ═══════════════════════════════════════════════════════════════ */

/** Colour + surface tokens. Mirrored into `app/globals.css :root`. */
export const BRAND = {
  bg: '#050507',
  fg: '#e4e2df',
  muted: 'rgba(228,226,223,0.45)',
  border: 'rgba(228,226,223,0.07)',
  accent: '#22c55e',
  accentBright: '#4ade80',
  accentGlow: 'rgba(34,197,94,0.18)',
  signal: '#10b981',
  cardBg: 'rgba(6,7,6,0.66)',
  /** Chrome (header/footer) surface — slightly bluer than `bg`. */
  chrome: '#060608',
} as const;

/** Motion tokens. These are the values that actually ship. */
export const MOTION = {
  /** Paper-turn page transition (portfolio pager). */
  pageTurn: {
    spring: { stiffness: 140, damping: 22, mass: 1.0 },
    yPercent: 6,
    rotateX: 3.5,
    scale: 0.99,
    perspective: 1800,
    opacitySeconds: 0.4,
    flipLockMs: 1000,
  },
  /** Scroll/entry reveal. */
  reveal: { seconds: 0.7, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' },
  /** Magnetic link pointer-follow / release. */
  magnetic: { followSeconds: 0.12, releaseSeconds: 0.5, pressSeconds: 0.1 },
  /** Canvas budget. */
  canvas: { maxDpr: 1.5 },
  /** Signature name — glyph-local diffusion budget. */
  name: {
    decodeSeconds: 1.5,
    lockSeconds: 0.55,
    lockStaggerSeconds: 0.065,
    pointerRadiusPx: 130,
    pointerMaxShiftPx: 5,
    /** Fragments scattered inside one glyph on reveal / tap. */
    fragmentsPerGlyph: 5,
    /** Hard ceiling on live fragments across the whole name. */
    maxFragments: 72,
    /** Fragment lifetime in animation ticks (~60/s). */
    fragmentLifeTicks: 34,
    /** Minimum ms between trail bursts on the same glyph. */
    fragmentCooldownMs: 150,
  },
  /** Pull-to-refresh gesture. */
  pullToRefresh: {
    /** Raw pixels the finger must travel before the gesture arms. */
    armPx: 12,
    /** Committed pull distance (after resistance) that triggers reload. */
    thresholdPx: 76,
    /** Resistance divisor — pull beyond `armPx` moves at 1/2.2 speed. */
    resistance: 2.2,
    maxPx: 118,
  },
} as const;

export type MotionTokens = typeof MOTION;
