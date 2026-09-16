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
  /** Signature identity — the wordmark is *constructed*, not revealed:
      its own rendered ink is sampled into a dispersed particle field
      that travels home and resolves into real typography. One-shot and
      deterministic (seeded from the name); nothing loops afterwards.

      Shares are fractions of `totalSeconds`, and they are a budget that
      must sum to 1: the last cluster starts at clusterShare +
      jitterShare and travels for travelShare, so
      `clusterShare + jitterShare + travelShare === 1`. */
  nameAssemble: {
    /** Whole construction, seconds. */
    totalSeconds: 1.6,
    /** Outgoing wordmark's exit when the language changes, seconds. */
    outgoingSeconds: 0.22,
    /** Cross-fade from particles to the real DOM text, seconds. */
    resolveSeconds: 0.34,
    /** Loop decomposition pass: the formed wordmark lifts back into the
        field over this many seconds, traversing the existing particle
        math in reverse. */
    disperseSeconds: 0.9,
    /** Stable pause of the formed wordmark between cycles, seconds. */
    holdSeconds: 1.6,
    /** Baseline rule + cluster ticks fade out over this share. */
    guideShare: 0.62,
    /** Left-to-right stagger across the grapheme clusters. */
    clusterShare: 0.3,
    /** Deterministic timing spread inside one cluster. */
    jitterShare: 0.15,
    /** Each particle's travel time. */
    travelShare: 0.55,
    /** Ease-out overshoot strength — 0 is plain, 0.7 seats subtly. */
    settleBack: 0.7,
    /** Dispersal radius, as a multiple of the wordmark box height. */
    disperseRadius: 1.35,
    /** Hard ceiling on live particles — a budget, not a target. */
    maxParticles: 1700,
    /** Sampling grid step in CSS px before the budget adapts it. */
    sampleStepPx: 2.6,
    /** Device-pixel-ratio cap for the construction canvas. */
    maxDpr: 2,
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
