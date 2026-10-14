/* ═══════════════════════════════════════════════════════════════
   STAGE LOGIC — the pure math behind "Inside One Device".

   THE CONCEPT
   -----------
   Everything in this portfolio was built from inside a single
   Android phone. So the site is not a page with a picture of a
   device on it: the site is *inside* the device. There is exactly
   one subject — a cross-section of that machine — and the reader
   travels INTO it along the depth axis. Each chapter is a STRATUM
   of the real stack, in real dependency order:

     0  surface      the glass: identity, the thing you touch first
     1  display      focus & tools, the instruments on the surface
     2  silicon      about: the constraint the work is shaped by
     3  userland     the workstation itself (Termux → PRoot Debian)
     4  toolchain    the projects that needed native ARM64 tooling
     5  frontier     research: the experimental, unqualified edge
     6  bus          experience: the long line through the years
     7  port         contact: the way out of the machine, to people

   Moving on means going DEEPER, not further down a page. Each
   stratum carries a central aperture, so the chapters ahead are
   visible through the ones in front, fading into haze — the reader
   can always see that there is more machine behind this one.

   TWO ARCHITECTURAL RULES
   -----------------------
     1. ONE SUBJECT. A chapter may change the camera's depth and what
        is emphasised. It may never introduce a second environment.
        The previous build grew three independent visual systems (a
        WebGL district map, a Canvas 2D chip floorplan and a text
        overlay) that all kept drawing at once, and the result read
        as overlapped layers rather than one place. One subject makes
        that failure structurally impossible.
     2. THE WORLD TELLS THE TRUTH. The instrument marks etched into
        the strata are not decoration: their count and state come
        from `app/verification-summary.json`, the same generated
        evidence projection the footer and `/verification/` read. One
        machine check is currently failing, so one mark is visibly
        dark. The scene cannot flatter the work — it is a readout.

   Everything here is deterministic and unit-tested by
   `scripts/check-units.mjs`. No three.js import: the renderer
   consumes these numbers, the numbers never depend on the renderer.
   See docs/STAGE.md.
   ═══════════════════════════════════════════════════════════════ */

import { MOTION } from './design-tokens';

export type Vec3 = { x: number; y: number; z: number };

/* ── The strata ─────────────────────────────────────────────────
   Eight planes along -Z, one per chapter, in `SECTION_IDS` order.
   `etch` names the procedural pattern cut into the plane; the
   renderer owns how each is drawn, this module owns only where
   things are and how big they are. */
export type Etch = 'grain' | 'instruments' | 'traces' | 'terminal' | 'lattice' | 'probe' | 'bus' | 'aperture';

export type Stratum = {
  id: string;
  /** Depth of the plane. Always ≤ 0; strata recede from the reader. */
  z: number;
  /** Half-extent of the plane, world units. */
  halfWidth: number;
  /** Half-extent of the central opening the camera passes through. */
  aperture: number;
  etch: Etch;
};

/** Distance between consecutive strata. */
export const STRATUM_PITCH = 9;

export const STRATA: readonly Stratum[] = [
  { id: 'surface', z: 0, halfWidth: 15, aperture: 4.2, etch: 'grain' },
  { id: 'display', z: -STRATUM_PITCH, halfWidth: 14, aperture: 4, etch: 'instruments' },
  { id: 'silicon', z: -STRATUM_PITCH * 2, halfWidth: 13.5, aperture: 3.6, etch: 'traces' },
  { id: 'userland', z: -STRATUM_PITCH * 3, halfWidth: 13, aperture: 3.4, etch: 'terminal' },
  { id: 'toolchain', z: -STRATUM_PITCH * 4, halfWidth: 12.5, aperture: 3.8, etch: 'lattice' },
  { id: 'frontier', z: -STRATUM_PITCH * 5, halfWidth: 12, aperture: 3.2, etch: 'probe' },
  { id: 'bus', z: -STRATUM_PITCH * 6, halfWidth: 12, aperture: 4.4, etch: 'bus' },
  { id: 'port', z: -STRATUM_PITCH * 7, halfWidth: 11, aperture: 5.2, etch: 'aperture' },
] as const;

export const STRATUM_COUNT = STRATA.length;

export function stratumFor(i: number): Stratum {
  const clamped = Math.max(0, Math.min(STRATUM_COUNT - 1, Math.trunc(i) || 0));
  return STRATA[clamped] as Stratum;
}

/** Total depth of the machine — used for haze and fog distances. */
export const MACHINE_DEPTH = STRATUM_PITCH * (STRATUM_COUNT - 1);

/* ── Stations ───────────────────────────────────────────────────
   Where the camera rests for each chapter. It stands off its own
   stratum by `STANDOFF` so the plane fills the frame without the
   near clip plane cutting it, and carries a small lateral/lift/roll
   offset per chapter so the journey never reads as a dead-on
   symmetrical tunnel. The lateral sign alternates: the reader is
   walked through the machine, not fired down a pipe. */
export const STANDOFF = 6.4;

export type Station = {
  /** Camera depth. Derived from the stratum, never hand-typed. */
  z: number;
  /** Sideways offset from the axis. */
  lateral: number;
  /** Height above the axis. */
  lift: number;
  /** Camera roll, degrees — tiny, and the only roll in the site. */
  rollDeg: number;
  /** Extra inward lean of the aim point, world units past the plane. */
  lean: number;
};

const STATION_SHAPE: readonly Omit<Station, 'z'>[] = [
  { lateral: 0, lift: 0.6, rollDeg: 0, lean: 2.2 }, // surface — square on, the first impression
  { lateral: -2.6, lift: 1.4, rollDeg: -1.1, lean: 3 }, // display
  { lateral: 3.1, lift: -0.8, rollDeg: 1.4, lean: 2.6 }, // silicon
  { lateral: -3.4, lift: 1.9, rollDeg: -1.6, lean: 3.4 }, // userland
  { lateral: 2.8, lift: -1.5, rollDeg: 1.2, lean: 3 }, // toolchain
  { lateral: -2.2, lift: 2.3, rollDeg: -0.9, lean: 2.4 }, // frontier
  { lateral: 3.6, lift: 0.4, rollDeg: 1.7, lean: 3.6 }, // bus
  { lateral: 0, lift: 0.9, rollDeg: 0, lean: 4.2 }, // port — square on again, the way out
] as const;

export const STATIONS: readonly Station[] = STRATA.map((s, i) => ({
  z: s.z + STANDOFF,
  ...(STATION_SHAPE[i] as Omit<Station, 'z'>),
}));

export function stationFor(i: number): Station {
  const clamped = Math.max(0, Math.min(STATIONS.length - 1, Math.trunc(i) || 0));
  return STATIONS[clamped] as Station;
}

export const FOV = 54;

/* ── Shortest-way angles ────────────────────────────────────────
   Roll is small, but it is still an angle: damping it must take the
   short way round so a wrap never spins the horizon. */
export function shortestAngleDelta(from: number, to: number): number {
  let d = (to - from) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

export function unwrapAngle(from: number, to: number): number {
  return from + shortestAngleDelta(from, to);
}

/* ── Critically damped travel (SmoothDamp) ──────────────────────
   The camera chases its destination like a mass on a critically
   damped spring: no overshoot, continuous velocity, and retargeting
   mid-flight inherits momentum, so a fast reader bends the path
   instead of cutting it. Carried over unchanged from the previous
   environment — it was correct, and it is the one piece of that work
   worth keeping. */
export function smoothDamp(
  current: number,
  target: number,
  velocity: number,
  smoothTime: number,
  dt: number,
  maxSpeed = Infinity
): [number, number] {
  const st = Math.max(1e-4, smoothTime);
  const omega = 2 / st;
  const x = omega * dt;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  let change = current - target;
  const maxChange = maxSpeed * st;
  if (change > maxChange) change = maxChange;
  else if (change < -maxChange) change = -maxChange;
  const clampedTarget = current - change;
  const temp = (velocity + omega * change) * dt;
  let nextVel = (velocity - omega * temp) * exp;
  let next = clampedTarget + (change + temp) * exp;
  /* Prevent the exponential tail from crossing the destination. */
  if (target - current > 0 === next > target) {
    next = target;
    nextVel = (next - target) / dt;
  }
  return [next, nextVel];
}

export type Damped = { value: number; velocity: number };

export function makeDamped(initial: number): Damped {
  return { value: initial, velocity: 0 };
}

export function damp(state: Damped, dest: number, smoothTime: number, dt: number): Damped {
  const [v, vel] = smoothDamp(state.value, dest, state.velocity, smoothTime, dt);
  state.value = v;
  state.velocity = vel;
  return state;
}

/** The camera: four independently damped scalars, no quaternions —
    the aim is always down the depth axis, so attitude is roll only. */
export type CameraState = {
  depth: Damped;
  lateral: Damped;
  lift: Damped;
  roll: Damped;
};

export function makeCamera(station: Station): CameraState {
  return {
    depth: makeDamped(station.z),
    lateral: makeDamped(station.lateral),
    lift: makeDamped(station.lift),
    roll: makeDamped(station.rollDeg),
  };
}

/** Flight times, from the brand motion tokens — depth is the slowest
    axis, so entering a stratum reads as travel while the lateral
    settle is almost immediate. The numbers live in design-tokens.ts
    because DESIGN_SYSTEM.md documents them for the whole ecosystem;
    this module is their only consumer here. */
export const FLIGHT = MOTION.flight;

export function stepCamera(state: CameraState, station: Station, dt: number): CameraState {
  damp(state.depth, station.z, FLIGHT.depth, dt);
  damp(state.lateral, station.lateral, FLIGHT.lateral, dt);
  damp(state.lift, station.lift, FLIGHT.lift, dt);
  state.roll.value = unwrapAngle(state.roll.value, station.rollDeg);
  damp(state.roll, station.rollDeg, FLIGHT.roll, dt);
  return state;
}

/** Where the camera is right now. */
export function cameraPosition(state: CameraState): Vec3 {
  return { x: state.lateral.value, y: state.lift.value, z: state.depth.value };
}

/** What it aims at: a point on the axis, past the stratum ahead, so
    the composition leads the reader deeper rather than flattening. */
export function cameraTarget(state: CameraState, station: Station): Vec3 {
  return {
    x: state.lateral.value * 0.25,
    y: state.lift.value * 0.3,
    z: state.depth.value - STANDOFF - station.lean,
  };
}

/* ── Pointer parallax ───────────────────────────────────────────
   A small, springy nudge from the normalized pointer (-1..1). It
   moves the camera across the axis, which in a tunnel reads as
   looking around the aperture — presence without a new composition. */
export const POINTER = MOTION.parallax;

export function pointerOffset(px: number, py: number): { lateral: number; lift: number } {
  const cx = Math.max(-1, Math.min(1, px));
  const cy = Math.max(-1, Math.min(1, py));
  return { lateral: cx * POINTER.lateral, lift: -cy * POINTER.lift };
}

/* ── Framing ────────────────────────────────────────────────────
   A perspective camera framed for landscape fills a portrait phone's
   width with its subject. Rather than a second station table, the
   camera stands further off as the viewport narrows: factor 1 at
   square-or-wider, growing smoothly as aspect falls. */
export function portraitCompensation(aspect: number): number {
  const a = Math.max(0.3, Math.min(aspect, 1));
  return 1 + (1 - a) * 1.15;
}

/* The chapter's text occupies one side of the viewport, so the
   machine's axis is pushed to the free side: right of centre on wide
   screens (text reads left), and low on portrait, where the text
   block owns the upper half. Fractions of the half-viewport. */
export function subjectOffset(aspect: number): { x: number; y: number } {
  if (aspect < 0.95) return { x: 0, y: -0.3 };
  if (aspect < 1.45) return { x: 0.22, y: -0.12 };
  return { x: 0.32, y: -0.05 };
}

/* ── Device-pixel-ratio policy ──────────────────────────────────
   A cap by pointer class AND a hard pixel budget, whichever is
   tighter; the floor keeps edges from dissolving. Coarse pointers
   (phones) get the lower cap — a Redmi-class GPU can do more, but
   the floor of mobile browsers is the budget here. */
export const PIXEL_BUDGET = { fine: 2.6e6, coarse: 1.5e6 } as const;

export function pixelRatioFor3D(dpr: number, coarse: boolean, width: number, height: number): number {
  const cap = coarse ? 1.5 : 2;
  let r = Math.min(Math.max(dpr, 0.5), cap);
  const budget = coarse ? PIXEL_BUDGET.coarse : PIXEL_BUDGET.fine;
  const px = Math.max(1, width) * Math.max(1, height);
  if (px * r * r > budget) r = Math.sqrt(budget / px);
  return Math.max(0.75, Math.min(r, cap));
}

/* One-way quality ratchet: a sustained slow frame average steps the
   render scale down once; it never steps back up (no oscillation). */
export const RATCHET = { slowMs: 26, windowFrames: 48, step: 0.85, floor: 0.6 } as const;

export function ratchetScale(current: number, avgFrameMs: number): number {
  if (avgFrameMs <= RATCHET.slowMs) return current;
  return Math.max(RATCHET.floor, current * RATCHET.step);
}

/* ── Depth presence ─────────────────────────────────────────────
   How present a stratum is, given where the camera is. The one the
   reader is inside is full; the next few ahead fade with depth so
   the machine continues visibly past the current chapter; anything
   behind the camera drops away fast so it never veils the frame.

   Returned 0..1. This is the only brightness authority in the
   scene — a chapter cannot light itself independently, which is
   what keeps the composition from accumulating. */
export const PRESENCE = { aheadFalloff: 26, behindFalloff: 7, floor: 0.05 } as const;

export function stratumPresence(index: number, cameraZ: number): number {
  const s = stratumFor(index);
  /* Positive = the stratum is ahead of (deeper than) the camera. */
  const ahead = cameraZ - s.z;
  if (ahead >= 0) {
    const v = 1 - ahead / PRESENCE.aheadFalloff;
    return Math.max(PRESENCE.floor, Math.min(1, v));
  }
  const v = 1 + ahead / PRESENCE.behindFalloff;
  return Math.max(0, Math.min(1, v));
}

/** The stratum the camera is currently inside or closest to. */
export function nearestStratum(cameraZ: number): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < STRATUM_COUNT; i += 1) {
    const d = Math.abs(cameraZ - STANDOFF - stratumFor(i).z);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/* ── Evidence marks ─────────────────────────────────────────────
   The instrument marks etched into the strata ARE the verification
   state. `distributeMarks` spreads a claim tally across the strata
   deterministically (round-robin, so no stratum is empty and the
   failing one is never hidden on a plane the reader skips).

   A mark's state is the claim's state. There is no "decorative"
   mark: if the counts change, the scene changes. */
export type MarkState = 'verified' | 'failed' | 'attested';

export type Mark = {
  stratum: number;
  /** Position around the stratum's aperture, radians. */
  angle: number;
  state: MarkState;
};

/** Round-robin a tally of claim states across the strata. Verified
    first, then the failures (so a failure never lands on stratum 0
    where it would read as the site itself being broken), then the
    human-attested hairlines. */
export function distributeMarks(verified: number, failed: number, attested: number): Mark[] {
  const marks: Mark[] = [];
  const push = (state: MarkState, count: number, startStratum: number) => {
    const n = Math.max(0, Math.trunc(count));
    for (let i = 0; i < n; i += 1) {
      const stratum = (startStratum + i) % STRATUM_COUNT;
      const seat = marks.filter((m) => m.stratum === stratum).length;
      marks.push({ stratum, angle: (seat * Math.PI * 2) / 7 + stratum * 0.4, state });
    }
  };
  push('verified', verified, 0);
  push('failed', failed, 4);
  push('attested', attested, 2);
  return marks;
}

/* ── Motes ──────────────────────────────────────────────────────
   Dust in the light shaft. Seeded and deterministic, so it is
   procedural (nothing is ever downloaded) and unit-testable. */
export const MOTES = { count: 300, radius: 13, depth: MACHINE_DEPTH + 14 } as const;

/** Deterministic [0,1) generator — Lehmer, sufficient and testable. */
export function seeded(seed: number): () => number {
  let s = (Math.trunc(seed) || 1) % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** `count` motes filling the machine's interior volume. */
export function motePositions(count: number, seed: number): Vec3[] {
  const rand = seeded(seed);
  const out: Vec3[] = [];
  for (let i = 0; i < Math.max(0, Math.trunc(count)); i += 1) {
    const angle = rand() * Math.PI * 2;
    /* sqrt keeps areal density even rather than crowding the axis. */
    const r = Math.sqrt(rand()) * MOTES.radius;
    out.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
      z: STANDOFF - rand() * MOTES.depth,
    });
  }
  return out;
}
