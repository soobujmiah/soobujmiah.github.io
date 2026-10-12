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
    yPercent: 10,
    rotateX: 6,
    rotateY: 7,
    scale: 0.955,
    perspective: 1300,
    opacitySeconds: 0.58,
    flipLockMs: 1000,
  },
  /** Scroll/entry reveal. */
  reveal: { seconds: 0.7, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' },
  /** Magnetic link pointer-follow / release. */
  magnetic: { followSeconds: 0.12, releaseSeconds: 0.5, pressSeconds: 0.1 },
  /** Pointer-tracked 3D card tilt (fine-pointer only; touch stays flat). */
  tilt: {
    /** Absolute ceiling for rotateX / rotateY, degrees. */
    maxRotateDeg: 5,
    /** Card perspective, px — closer than the page turn so cards read as near. */
    perspective: 900,
    /** Inner content layer translateZ, px, on hover (the "pop toward you"). */
    popZ: 14,
    /** Subtle scale-lift that pairs with the tilt. */
    cornerScale: 1.015,
    /** Pointer-follow spring for the tilt axes. */
    followSpring: { stiffness: 150, damping: 20, mass: 1 },
  },
  /** Layered depth in the page turn + scroll-linked parallax. */
  depth: {
    /** Outgoing page translateZ, px — it recedes as it leaves. */
    zRecede: 90,
    /** Incoming page translateZ, px — it rises toward the viewer. */
    zRise: 80,
    /** Inner-content spring lag vs the turning page shell, ms. */
    contentLagMs: 40,
    /** `--page-scroll` multiplier for the `.page-numeral` parallax. */
    numeralParallax: 0.07,
    /** `Reveal` depth-variant entry rotateX, degrees. */
    revealRotateX: 4,
    /** `Reveal` depth-variant perspective, px. */
    revealPerspective: 1200,
    /** Spring for the `Reveal` depth-variant rotateX / z axes. */
    revealSpring: { stiffness: 130, damping: 18, mass: 1 },
  },
  /** Presence count-up numeral. */
  countUp: { seconds: 1.1, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' },
  /** Pointer-driven camera orbit of the background environment (see docs/ENVIRONMENT.md §3). */
  cameraDrift: {
    /** Max drift as a multiple of the camera half-width (≈ ±2%). */
    maxOffsetHw: 0.02,
    /** Drift follow spring. */
    followSpring: { stiffness: 60, damping: 18, mass: 1 },
  },
  /** Signature identity — the canonical name as a dimensional object.

      The name stays real DOM text in the page's only `h1`. Depth comes
      from CSS 3D: the line sits in one perspective, and each grapheme
      cluster is its own transformed box that rises out of that depth in
      a left-to-right stagger, after which a light sweep travels across
      the letterforms. A single light-wave pass, not a cycle — the
      resting state is crisp, legible typography.

      Clusters come from `app/graphemes.ts`, so a Bengali conjunct
      (`ক্ষ`, `স্ট্র`) or a consonant carrying a matra (`মি`, `বু`,
      `য়া`) is one indivisible box and its shaping is never torn apart.

      The retired particle construction is not coming back
      (`docs/CINEMATIC_AUDIT.md`): no canvas, no WebGL, no sampled ink. */
  signature: {
    /** Perspective for the whole signature line, px. */
    perspective: 1500,
    /** Depth a cluster rises from, px (negative = away from the viewer). */
    enterZ: -220,
    /** A cluster's entrance rotateY, degrees. */
    enterRotateY: -28,
    /** A cluster's entrance rotateX, degrees. */
    enterRotateX: 14,
    /** Vertical travel of a cluster's entrance, em of the name's size. */
    enterRiseEm: 0.42,
    /** One cluster's entrance duration, seconds. */
    clusterSeconds: 0.92,
    /** Delay between consecutive clusters, seconds. */
    clusterStaggerSeconds: 0.055,
    /** Delay before the first cluster moves, seconds. */
    leadSeconds: 0.35,
    /** Shared easing for the entrance and the sweep. */
    ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
    /** One cluster's share of the light sweep, seconds. */
    sweepSeconds: 1.15,
    /** Delay between clusters inside the sweep, seconds — this is what
        makes the highlight read as travelling across the letterforms. */
    sweepStaggerSeconds: 0.042,
    /** Delay before the sweep starts, seconds. Must be >= leadSeconds so
        the light never crosses a cluster that has not arrived yet. */
    sweepLeadSeconds: 0.62,
    /** Pointer-driven tilt ceiling, degrees. Fine pointers only, and
        small on purpose: presence without harming readability. */
    pointerTiltDeg: 3.5,
    /** How long the signature takes to follow the pointer, seconds. */
    pointerFollowSeconds: 0.45,
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
