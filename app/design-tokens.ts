/* ═══════════════════════════════════════════════════════════════
   DESIGN TOKENS — the single source of truth for the brand.

   This file is the machine-checkable root of the visual ecosystem
   (see DESIGN_SYSTEM.md). The portfolio imports these values; future
   repository websites must import the same ones rather than copying
   numbers out of prose.

   `scripts/check-design.mjs` parses DESIGN_SYSTEM.md and fails the
   build if the documented values drift from these. Documentation is
   therefore load-bearing, not decorative.

   The colour tokens survived the 2026-10 rebuild unchanged: they are
   the canonical ecosystem palette and ARMS, Ternux and ADT inherit
   them. The motion tokens did not. The previous set described a
   stack of page-turn, tilt, reveal, signature and parallax systems
   layered on each other; "Inside One Device" has exactly one moving
   thing — the camera travelling into the machine — so the motion
   tokens are now that camera, the text settling after it, and the
   input contract that keeps a gesture worth exactly one stratum.
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
  /** Camera flight: seconds for each axis to settle on a new station
      (`app/stage.ts` consumes this as `FLIGHT`). Depth is the slowest
      axis on purpose — entering a stratum has to read as travel into
      the machine, not as a cut between two pictures. */
  flight: { depth: 1.5, lateral: 1.05, lift: 1.05, roll: 1.2 },
  /** Pointer parallax amplitude in world units, fine pointers only
      (`app/stage.ts` consumes this as `POINTER`). Touch never gets it:
      a finger is already the thing being tracked. */
  parallax: { lateral: 1.5, lift: 0.9 },
  /** The text settling into the new stratum, behind the camera. One
      entrance, one stagger, nothing per-element beyond that. */
  settle: { seconds: 0.72, ease: 'cubic-bezier(0.16, 1, 0.3, 1)', staggerSeconds: 0.05 },
  /** Depth input. One gesture is worth exactly one stratum, and the
      lock outlasts the slowest flight axis so a fast scroll can never
      fire the reader through the machine. */
  input: { lockMs: 900, wheelDelta: 24, swipePx: 60 },
} as const;

export type MotionTokens = typeof MOTION;
