/* ═══════════════════════════════════════════════════════════════
   CINEMATIC 3D LOGIC — the pure math behind the WebGL environment.

   Everything here is deterministic and unit-tested by
   `scripts/check-units.mjs`: the shot table (where the camera and
   its subject are for each chapter), the critically damped flight
   (velocity-continuous chapter-to-chapter camera travel, so a new
   destination mid-flight bends the path instead of cutting), the
   device-pixel-ratio policy (caps + a hard pixel budget), and the
   workstation exploded-stack offsets.

   No three.js import here — the renderer consumes these numbers;
   the logic never depends on the renderer. See docs/CINEMATIC_3D.md.
   ═══════════════════════════════════════════════════════════════ */

export type Vec3 = { x: number; y: number; z: number };

export type Shot = {
  /** Camera position for the chapter's resting composition. */
  position: Vec3;
  /** What the camera studies in that composition. */
  target: Vec3;
};

/* ── The city plan ──────────────────────────────────────────────
   One district per chapter, laid out as a gentle zig-zag down the
   wafer so every flight travels THROUGH the city, never cuts. The
   indices match app/sections.ts SECTION_IDS order. */
export const DISTRICTS: readonly Vec3[] = [
  { x: 0, y: 0, z: 0 }, //      0 home — identity plaza
  { x: -26, y: 0, z: -34 }, //  1 presence — measurement field
  { x: 24, y: 0, z: -64 }, //   2 about — quiet quad
  { x: -22, y: 0, z: -98 }, //  3 workstation — the layer tower
  { x: 24, y: 0, z: -132 }, //  4 work — three monuments
  { x: -24, y: 0, z: -166 }, // 5 research — polyhedra field
  { x: 20, y: 0, z: -198 }, //  6 experience — the year rail
  { x: 0, y: 0, z: -232 }, //   7 contact — the overlook
] as const;

/* Resting shot per chapter. Camera always above the wafer (y > 0),
   subjects at monument height. The contact shot rises and looks past
   the last district to the horizon — the journey's closing frame. */
export const SHOTS: readonly Shot[] = [
  { position: { x: 0, y: 5.4, z: 26 }, target: { x: 0, y: 5.5, z: -10 } },
  { position: { x: -12, y: 7.5, z: -14 }, target: { x: -26, y: 3.6, z: -34 } },
  { position: { x: 34, y: 5.4, z: -46 }, target: { x: 24, y: 2.6, z: -64 } },
  { position: { x: -5, y: 8.5, z: -80 }, target: { x: -22, y: 7.2, z: -98 } },
  { position: { x: 11, y: 6.2, z: -114 }, target: { x: 24, y: 4.2, z: -132 } },
  { position: { x: -10, y: 7.4, z: -148 }, target: { x: -24, y: 5.6, z: -166 } },
  { position: { x: 7, y: 5.2, z: -182 }, target: { x: 20, y: 3.2, z: -202 } },
  { position: { x: -4, y: 26, z: -200 }, target: { x: 0, y: 8, z: -300 } },
] as const;

export const FOV = 52;

/* ── Critically damped flight (SmoothDamp) ──────────────────────
   The camera chases its destination like a mass on a critically
   damped spring: it never overshoots, velocity is continuous, and
   changing the destination mid-flight preserves momentum — exactly
   the "retarget inherits velocity" behaviour the 2D environment
   proved out (app/silicon.ts), re-derived for 3D scalars. */
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

export type DampedVec3 = { value: Vec3; velocity: Vec3 };

export function makeDamped(initial: Vec3): DampedVec3 {
  return { value: { ...initial }, velocity: { x: 0, y: 0, z: 0 } };
}

/** Advance one damped vector toward its destination; mutates and returns it. */
export function dampVec3(state: DampedVec3, dest: Vec3, smoothTime: number, dt: number): DampedVec3 {
  const axes: Array<keyof Vec3> = ['x', 'y', 'z'];
  for (const a of axes) {
    const [v, vel] = smoothDamp(state.value[a], dest[a], state.velocity[a], smoothTime, dt);
    state.value[a] = v;
    state.velocity[a] = vel;
  }
  return state;
}

/* ── Pointer orbit ──────────────────────────────────────────────
   A small, springy parallax of the camera around its shot, from the
   normalized pointer (-1..1). Amplitudes are deliberately modest:
   the orbit reads as a head-turn, not a new composition. */
export const ORBIT = { x: 2.2, y: 1.1 } as const;

export function orbitOffset(px: number, py: number): Vec3 {
  const cx = Math.max(-1, Math.min(1, px));
  const cy = Math.max(-1, Math.min(1, py));
  return { x: cx * ORBIT.x, y: -cy * ORBIT.y, z: 0 };
}

/* ── Portrait dolly compensation ────────────────────────────────
   A perspective camera framed for landscape fills a portrait phone's
   width with its subject. Rather than a second shot table, the camera
   dollies out along its own view axis as the viewport narrows: factor
   1 at square-or-wider, growing smoothly as aspect falls. */
export function portraitCompensation(aspect: number): number {
  const a = Math.max(0.3, Math.min(aspect, 1));
  return 1 + (1 - a) * 1.15;
}

/* ── Device-pixel-ratio policy ──────────────────────────────────
   Same philosophy as the 2D environment: a cap by pointer class AND
   a hard pixel budget, whichever is tighter; the floor keeps text
   edges from dissolving. Coarse pointers (phones) get the lower cap
   — a Redmi-class GPU can do more, but the floor of mobile browsers
   is the budget here. */
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

/* ── Workstation exploded stack ─────────────────────────────────
   Six layers, bottom to top. At activation 0 the tower is a compact
   block; at 1 the layers separate into an exploded view with equal
   air between them. Order is the real dependency order and must
   match the workstation chapter copy. */
export const STACK_LAYERS = 6;
export const STACK = { thickness: 1.1, gapClosed: 0.14, gapOpen: 1.5 } as const;

/** Center-height of layer `i` (0 = bottom) for activation a ∈ [0,1]. */
export function stackLayerY(i: number, activation: number): number {
  const a = Math.max(0, Math.min(1, activation));
  const gap = STACK.gapClosed + (STACK.gapOpen - STACK.gapClosed) * a;
  const pitch = STACK.thickness + gap;
  return STACK.thickness / 2 + i * pitch;
}

/* ── Work monuments ─────────────────────────────────────────────
   Three verified projects, three recognizable forms. Positions are
   relative to the work district center. The DOM cards remain the
   interactive source of truth; these are their places in the world. */
export const MONUMENTS = [
  { id: 'lai', dx: -7.5, dz: 1.5 }, //  monolith with a pulsing core
  { id: 'ggen', dx: 0, dz: -2.5 }, //   layered sheets
  { id: 'skb', dx: 7.5, dz: 1 }, //     knowledge lattice
] as const;

/** Activation (0..1 destination) of district `i` when chapter `c` is current. */
export function districtActivation(i: number, c: number): number {
  if (i === c) return 1;
  return Math.abs(i - c) === 1 ? 0.25 : 0;
}
