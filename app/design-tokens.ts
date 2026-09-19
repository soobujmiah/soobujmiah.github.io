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
  /** Signature identity — the wordmark is *constructed* from its own
      rendered ink, then becomes a continuous particle storytelling
      canvas (life/work cycle → back to name). Deterministic and seeded
      from the name. Shares of `totalSeconds` are a budget that must sum
      to 1: last cluster starts at clusterShare + jitterShare and travels
      for travelShare, so `clusterShare + jitterShare + travelShare === 1`. */
  nameAssemble: {
    /** Whole name construction, seconds. */
    totalSeconds: 2.0,
    /** Outgoing wordmark's exit when the language changes, seconds. */
    outgoingSeconds: 0.22,
    /** Cross-fade from particles to the real DOM text, seconds. */
    resolveSeconds: 0.34,
    /** Language retarget: the old particle glyphs loosen and fade over
        this many seconds while the new field prepares to form. */
    dissolveSeconds: 0.45,
    /** Name-hold micro-drift amplitude, CSS px — keep tiny so the name
        stays clearly readable during the stable identity beat. */
    microPx: 0.18,
    /** Reserved breath period (story holds use near-zero breath). */
    breathSeconds: 8.0,
    /** Reserved breath window share. */
    breathWindow: 0.2,
    /** Name-hold breath peak, CSS px — intentionally minimal. */
    breathPx: 0.6,
    /** Baseline rule + cluster ticks fade out over this share. */
    guideShare: 0.55,
    /** Left-to-right stagger across the grapheme clusters. */
    clusterShare: 0.3,
    /** Deterministic timing spread inside one cluster. */
    jitterShare: 0.15,
    /** Each particle's travel time. */
    travelShare: 0.55,
    /** Ease-out overshoot strength — 0 is plain, 0.7 seats subtly. */
    settleBack: 0.55,
    /** Dispersal radius, as a multiple of the wordmark box height. */
    disperseRadius: 1.15,
    /** Hard ceiling on the single global particle population. */
    maxParticles: 2200,
    /** Sampling grid step in CSS px before the budget adapts it. */
    sampleStepPx: 2.4,
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
