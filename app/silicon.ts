/* ═══════════════════════════════════════════════════════════════
   SILICON NOCTURNE — the procedural environment.

   An abstract, invented floorplan of a phone system-on-chip (CPU
   clusters, GPU, NPU, memory, interconnect, I/O ring) seen by a low
   camera. It is NOT a photograph or a real die: every line is drawn
   from a seeded generator, so the same seed always yields the same
   chip, and it is resolution-independent (vector, drawn at native
   device pixels).

   This module is pure (no DOM, no React) so the logic can be proven
   by `scripts/check-units.mjs` without a browser.
   ═══════════════════════════════════════════════════════════════ */

/** Alpha class of a line: 0 faint detail, 1 block edge, 2 zone edge. */
export type LineClass = 0 | 1 | 2;

export interface Plan {
  /** Flat [x1,y1,z1,x2,y2,z2, …] per line class. y is height above the die. */
  lines: [number[], number[], number[]];
  /** Signal routes on the die surface: flat [x,z, x,z, …] polylines. */
  routes: number[][];
}

export const DIE = { halfW: 1200, halfD: 760 } as const;

/** Deterministic PRNG (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rect = [number, number, number, number]; // x1, z1, x2, z2

/** Named zones of the invented chip. Used for the camera and the docs. */
export const ZONES = {
  cpu: [-1010, -520, -400, 150] as Rect,
  gpu: [-320, -520, 560, 190] as Rect,
  npu: [650, -520, 1040, -40] as Rect,
  mem: [-1010, 250, -80, 560] as Rect,
  media: [-10, 250, 560, 560] as Rect,
  dram: [650, 60, 1040, 560] as Rect,
} as const;

export function buildPlan(seed = 20261009, detail: 'full' | 'lite' = 'full'): Plan {
  const rand = rng(seed);
  const lines: Plan['lines'] = [[], [], []];
  const routes: number[][] = [];
  const lite = detail === 'lite';

  const seg = (c: LineClass, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) => {
    lines[c].push(x1, y1, z1, x2, y2, z2);
  };
  const outline = (c: LineClass, r: Rect, y = 0) => {
    seg(c, r[0], y, r[1], r[2], y, r[1]);
    seg(c, r[2], y, r[1], r[2], y, r[3]);
    seg(c, r[2], y, r[3], r[0], y, r[3]);
    seg(c, r[0], y, r[3], r[0], y, r[1]);
  };
  const box = (c: LineClass, r: Rect, h: number) => {
    outline(c, r, h);
    seg(1, r[0], 0, r[1], r[0], h, r[1]);
    seg(1, r[2], 0, r[1], r[2], h, r[1]);
    seg(1, r[2], 0, r[3], r[2], h, r[3]);
    seg(1, r[0], 0, r[3], r[0], h, r[3]);
  };
  const grid = (c: LineClass, r: Rect, nx: number, nz: number, y: number) => {
    for (let i = 1; i < nx; i++) {
      const x = r[0] + ((r[2] - r[0]) * i) / nx;
      seg(c, x, y, r[1], x, y, r[3]);
    }
    for (let j = 1; j < nz; j++) {
      const z = r[1] + ((r[3] - r[1]) * j) / nz;
      seg(c, r[0], y, z, r[2], y, z);
    }
  };
  const inset = (r: Rect, d: number): Rect => [r[0] + d, r[1] + d, r[2] - d, r[3] - d];

  /* Die, seal rings, and the I/O pad ring along every edge. */
  const { halfW: W, halfD: D } = DIE;
  const die: Rect = [-W, -D, W, D];
  outline(2, die);
  outline(1, inset(die, 14));
  outline(0, inset(die, 30));
  const pitch = lite ? 44 : 26;
  for (let x = -W + 70; x <= W - 70; x += pitch) {
    for (const side of [-1, 1]) {
      const z = side * (D - 46);
      outline(0, [x - 6, z - 9, x + 6, z + 9]);
      seg(0, x, 0, z - side * 9, x, 0, z - side * 62);
    }
  }
  for (let z = -D + 80; z <= D - 80; z += pitch) {
    for (const side of [-1, 1]) {
      const x = side * (W - 46);
      outline(0, [x - 9, z - 6, x + 9, z + 6]);
      seg(0, x - side * 9, 0, z, x - side * 62, 0, z);
    }
  }
  outline(2, inset(die, 110));

  /* Recursive block subdivision of a zone: the "city" of silicon. */
  const city = (zone: Rect, minSize: number, maxH: number, gap: number) => {
    const walk = (r: Rect, depth: number) => {
      const w = r[2] - r[0];
      const d = r[3] - r[1];
      if ((w < minSize * 1.9 && d < minSize * 1.9) || depth > 6) {
        const b = inset(r, gap);
        if (b[2] - b[0] < 6 || b[3] - b[1] < 6) return;
        const h = 3 + rand() * maxH;
        box(1, b, h);
        if (!lite && w > minSize * 0.9 && d > minSize * 0.9) {
          grid(0, inset(b, 4), 2 + ((rand() * 4) | 0), 2 + ((rand() * 4) | 0), h);
        }
        return;
      }
      const cut = 0.34 + rand() * 0.32;
      if (w >= d) {
        const x = r[0] + w * cut;
        walk([r[0], r[1], x, r[3]], depth + 1);
        walk([x, r[1], r[2], r[3]], depth + 1);
      } else {
        const z = r[1] + d * cut;
        walk([r[0], r[1], r[2], z], depth + 1);
        walk([r[0], z, r[2], r[3], ], depth + 1);
      }
    };
    walk(zone, 0);
  };

  /* CPU: a tall prime core, mid cores, small efficiency cores. */
  const cpu = ZONES.cpu;
  outline(2, cpu);
  city(inset(cpu, 14), lite ? 70 : 38, 46, 3);
  /* GPU: a dense, regular shader array (tall, repeating cells). */
  const gpu = ZONES.gpu;
  outline(2, gpu);
  const gcols = lite ? 8 : 14;
  const grows = lite ? 5 : 9;
  const g = inset(gpu, 16);
  const cw = (g[2] - g[0]) / gcols;
  const cd = (g[3] - g[1]) / grows;
  for (let i = 0; i < gcols; i++) {
    for (let j = 0; j < grows; j++) {
      const cell: Rect = [g[0] + i * cw + 5, g[1] + j * cd + 5, g[0] + (i + 1) * cw - 5, g[1] + (j + 1) * cd - 5];
      const h = 8 + rand() * 26;
      box(1, cell, h);
      grid(0, inset(cell, 3), lite ? 3 : 5, lite ? 3 : 5, h);
    }
  }
  /* NPU: a square MAC array — the finest, most regular texture. */
  const npu = ZONES.npu;
  outline(2, npu);
  const n = inset(npu, 18);
  const nn = lite ? 20 : 34;
  grid(0, n, nn, nn, 6);
  outline(1, n, 6);
  for (let i = 0; i < nn; i += 2) {
    for (let j = 0; j < nn; j += 2) {
      if (rand() < 0.35) {
        const x = n[0] + ((n[2] - n[0]) * i) / nn;
        const z = n[1] + ((n[3] - n[1]) * j) / nn;
        const s = (n[2] - n[0]) / nn;
        box(0, [x + 3, z + 3, x + s * 2 - 3, z + s * 2 - 3], 10 + rand() * 16);
      }
    }
  }
  /* Memory: bit-cell arrays — fine ruled texture, low height. */
  const mem = ZONES.mem;
  outline(2, mem);
  for (let k = 0; k < 3; k++) {
    const w = (mem[2] - mem[0] - 30) / 3;
    const b: Rect = [mem[0] + 12 + k * (w + 3), mem[1] + 12, mem[0] + 12 + k * (w + 3) + w, mem[3] - 12];
    outline(1, b, 4);
    grid(0, b, lite ? 30 : 64, lite ? 14 : 30, 4);
  }
  /* Media / modem / ISP: mixed small blocks. */
  outline(2, ZONES.media);
  city(inset(ZONES.media, 12), lite ? 52 : 30, 22, 3);
  /* DRAM interface: repeated PHY slices. */
  const dram = ZONES.dram;
  outline(2, dram);
  const slices = lite ? 8 : 16;
  const dh = (dram[3] - dram[1] - 24) / slices;
  for (let i = 0; i < slices; i++) {
    const s: Rect = [dram[0] + 12, dram[1] + 12 + i * dh + 3, dram[2] - 12, dram[1] + 12 + (i + 1) * dh - 3];
    box(1, s, 5 + rand() * 9);
    grid(0, inset(s, 3), lite ? 16 : 30, 1, 10);
  }

  /* Interconnect: parallel bus lanes in the channels between zones. */
  const lanes = lite ? 6 : 14;
  const bus = (x1: number, z1: number, x2: number, z2: number) => {
    for (let i = 0; i < lanes; i++) {
      const o = (i - lanes / 2) * 4;
      if (x1 === x2) seg(0, x1 + o, 0, z1, x2 + o, 0, z2);
      else seg(0, x1, 0, z1 + o, x2, 0, z2 + o);
    }
  };
  bus(-360, -500, -360, 550);
  bus(600, -500, 600, 550);
  bus(-980, 205, 1020, 205);
  bus(-980, -560, 1020, -560);
  bus(-40, 230, -40, 570);
  outline(2, [-380, 205 - 22, 620, 205 + 22]);

  /* Fine routing: short Manhattan traces and vias scattered over the die
     floor, so the ground between blocks reads as wiring, not emptiness. */
  const traces = lite ? 260 : 900;
  for (let i = 0; i < traces; i++) {
    const x = (rand() * 2 - 1) * (W - 130);
    const z = (rand() * 2 - 1) * (D - 130);
    const len = 20 + rand() * 90;
    const horiz = rand() < 0.5;
    const x2 = horiz ? x + len : x;
    const z2 = horiz ? z : z + len;
    seg(0, x, 0, z, x2, 0, z2);
    if (rand() < 0.5) {
      const bend = 10 + rand() * 30;
      seg(0, x2, 0, z2, x2 + (horiz ? 0 : bend), 0, z2 + (horiz ? bend : 0));
    }
    if (rand() < 0.25) {
      seg(0, x - 3, 0, z, x + 3, 0, z);
      seg(0, x, 0, z - 3, x, 0, z + 3);
    }
  }

  /* Signal routes: Manhattan paths along the bus lanes and zone edges,
     travelled by pulses. Waypoints are fixed so routes stay on lines. */
  routes.push(
    [-700, -560, -360, -560, -360, 205, 200, 205, 200, -170],
    [-360, 205, 600, 205, 600, -300, 850, -300],
    [850, -40, 600, -40, 600, 205, -40, 205, -40, 400],
    [-700, 150, -700, 205, -360, 205, -360, -300, 100, -300],
    [-40, 570, -40, 205, 600, 205, 600, 560],
    [-1140, -300, -1000, -300, -1000, -560, -360, -560],
    [1140, 300, 1020, 300, 1020, 205, 600, 205],
  );

  return { lines, routes };
}

/* ── camera ─────────────────────────────────────────────────── */

export interface Pose {
  /** Camera position on the die plane, and height above it. */
  x: number;
  z: number;
  h: number;
  /** Heading in degrees (0 looks toward −z) and pitch down in degrees. */
  yaw: number;
  pitch: number;
  /** Vertical field of view in degrees. */
  fov: number;
}

/** One pose per pager chapter, then the services and verification documents. */
export const POSES: readonly Pose[] = [
  { x: 40, z: 980, h: 150, yaw: 0, pitch: 11, fov: 58 }, //  0 home: wide establishing, horizon low
  { x: -520, z: 440, h: 170, yaw: -18, pitch: 28, fov: 52 }, //  1 focus & tools: over the compute blocks
  { x: 120, z: 680, h: 180, yaw: -28, pitch: 22, fov: 50 }, //  2 about: memory arrays in the empty lower-left, clear of the text column
  { x: 120, z: 430, h: 150, yaw: 4, pitch: 30, fov: 50 }, //  3 work: over the GPU
  { x: 850, z: 250, h: 140, yaw: -8, pitch: 32, fov: 50 }, //  4 research: over the NPU
  { x: -1380, z: 215, h: 90, yaw: 90, pitch: 14, fov: 54 }, // 5 experience: tracking a long bus
  { x: 40, z: 1100, h: 260, yaw: 0, pitch: 30, fov: 60 }, //  6 contact: pulled back to the I/O ring
  { x: -300, z: 800, h: 260, yaw: 10, pitch: 44, fov: 52 }, //  7 services: calm static
  { x: 300, z: 800, h: 260, yaw: -10, pitch: 44, fov: 52 }, //  8 verification: calm static
];

export function poseFor(index: number): Pose {
  return POSES[index] ?? POSES[0];
}

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
export const easeInOut = (t: number) => {
  const c = clamp01(t);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};

/** What each chapter is about, as the die regions it lights. Index = chapter. */
export const FOCUS: readonly (readonly Rect[])[] = [
  [[-DIE.halfW, -DIE.halfD, DIE.halfW, DIE.halfD]], //  0 home: the whole die
  [ZONES.cpu, ZONES.gpu, ZONES.npu], //  1 focus & tools: the compute blocks
  [ZONES.mem], //  2 about: memory — what persists
  [ZONES.gpu], //  3 work: the GPU, where things are rendered
  [ZONES.npu], //  4 research: the NPU
  [[-1100, 183, 1100, 227]], //  5 experience: the long interconnect bus
  [
    [-DIE.halfW, -DIE.halfD, DIE.halfW, -DIE.halfD + 110],
    [-DIE.halfW, DIE.halfD - 110, DIE.halfW, DIE.halfD],
    [-DIE.halfW, -DIE.halfD, -DIE.halfW + 110, DIE.halfD],
    [DIE.halfW - 110, -DIE.halfD, DIE.halfW, DIE.halfD],
  ], //  6 contact: the I/O ring, where signals leave the chip
  [ZONES.media], //  7 services
  [ZONES.dram], //  8 verification
];

export function focusFor(index: number): readonly Rect[] {
  return FOCUS[index] ?? FOCUS[0];
}

/** True when a point on the die lies inside any of the rects. */
export function inRects(rects: readonly Rect[], x: number, z: number): boolean {
  return rects.some((r) => x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3]);
}

/** Heading difference taking the short way round, degrees. */
export function shortYaw(from: number, to: number): number {
  return ((((to - from) % 360) + 540) % 360) - 180;
}

/* ── continuous motion ────────────────────────────────────────
   Everything that moves the camera is a continuous function of an
   engine clock (milliseconds that only advance while the page is
   visible, with per-frame gaps clamped), so motion is frame-rate
   independent and never jumps after a suspended tab. */

/** Quintic smootherstep: C² at both ends (zero velocity *and* zero
 *  acceleration), so a flight neither lurches off nor brakes hard. */
export const smootherstep = (t: number) => {
  const c = clamp01(t);
  return c * c * c * (c * (c * 6 - 15) + 10);
};

/** Quintic Hermite basis for an initial velocity with zero end velocity
 *  and zero accelerations: g(0)=g(1)=0, g'(0)=1, g'(1)=0. */
const hermiteV = (t: number) => t - 6 * t * t * t + 8 * t * t * t * t - 3 * t * t * t * t * t;

/** A camera flight. `v` is the initial velocity in pose units per unit of
 *  flight progress (per-millisecond velocity × duration). A fresh flight
 *  has v = 0; a flight retargeted mid-air inherits the current velocity,
 *  so the camera bends toward the new chapter instead of stopping. */
export interface Flight {
  a: Pose;
  /** Destination with yaw unwrapped to the short way round from `a`. */
  b: Pose;
  v: Pose;
  /** Peak extra height of the arc (an arc reads as travelling, not sliding). */
  lift: number;
}

const POSE_KEYS = ['x', 'z', 'h', 'yaw', 'pitch', 'fov'] as const;
export const ZERO_POSE: Pose = { x: 0, z: 0, h: 0, yaw: 0, pitch: 0, fov: 0 };

export function makeFlight(a: Pose, b: Pose, v: Pose = ZERO_POSE): Flight {
  return {
    a,
    b: { ...b, yaw: a.yaw + shortYaw(a.yaw, b.yaw) },
    v,
    lift: Math.min(140, Math.hypot(b.x - a.x, b.z - a.z) * 0.14),
  };
}

/** Pose at progress t ∈ [0, 1]. Position and velocity are continuous for
 *  every t, including t = 0 of a retargeted flight. */
export function flightAt(f: Flight, t: number): Pose {
  if (t <= 0) return f.a;
  if (t >= 1) return f.b;
  const s = smootherstep(t);
  const g = hermiteV(t);
  const out = { ...f.a };
  for (const k of POSE_KEYS) out[k] = f.a[k] + (f.b[k] - f.a[k]) * s + f.v[k] * g;
  /* sin(π·s) has zero slope at t = 0 because s'(0) = 0: the arc cannot
     introduce a velocity jump into a retargeted flight. */
  out.h += f.lift * Math.sin(Math.PI * s);
  return out;
}

/** Velocity of a flight at progress t, in pose units per unit progress
 *  (central difference — the curve is smooth, so this is accurate). */
export function flightVelocity(f: Flight, t: number): Pose {
  const e = 1e-4;
  const p = flightAt(f, Math.min(1, t + e));
  const q = flightAt(f, Math.max(0, t - e));
  const span = Math.min(1, t + e) - Math.max(0, t - e);
  const out = { ...ZERO_POSE };
  for (const k of POSE_KEYS) out[k] = (p[k] - q[k]) / span;
  return out;
}

/** Retarget mid-flight: the new flight starts exactly where the camera is
 *  and with the velocity it has (rescaled to the new duration). */
export function retarget(f: Flight, t: number, durationOld: number, durationNew: number, to: Pose): Flight {
  const here = flightAt(f, t);
  const vel = t > 0 && t < 1 ? flightVelocity(f, t) : ZERO_POSE;
  const scale = durationNew / durationOld;
  const v = { ...ZERO_POSE };
  for (const k of POSE_KEYS) v[k] = vel[k] * scale;
  return makeFlight(here, to, v);
}

/** A flight between two poses from rest: eased (C²), shortest-way yaw, and
 *  a camera that rises mid-flight. */
export function flightPose(a: Pose, b: Pose, t: number): Pose {
  if (t <= 0) return a;
  if (t >= 1) return b;
  return flightAt(makeFlight(a, b), t);
}

/* ── orbit, dolly and ambient motion ─────────────────────────── */

/** Ground distance from the camera to the point its optical axis meets the
 *  die, and that point. Pitch is clamped so a near-level camera still has a
 *  finite pivot. */
export function pivotOf(p: Pose): { L: number; px: number; pz: number } {
  const pitch = (Math.max(4, p.pitch) * Math.PI) / 180;
  const yaw = (p.yaw * Math.PI) / 180;
  const L = p.h / Math.tan(pitch);
  return { L, px: p.x + Math.sin(yaw) * L, pz: p.z - Math.cos(yaw) * L };
}

/** Orbit the camera around its look-at point. (ox, oy) ∈ [-1, 1] move the
 *  camera right/up by `amp` × the half-width/half-height of the view at the
 *  pivot, then re-aim at the pivot exactly. The pivot (what the chapter is
 *  about) stays fixed on screen; nearer geometry slides one way and farther
 *  geometry the other — true depth parallax, not a flat pan. */
export function orbitPose(p: Pose, ox: number, oy: number, amp: number, aspect: number): Pose {
  if (ox === 0 && oy === 0) return p;
  const { L, px, pz } = pivotOf(p);
  const slant = Math.hypot(L, p.h);
  const halfH = slant * Math.tan((p.fov * Math.PI) / 360);
  const halfW = halfH * aspect;
  const yaw = (p.yaw * Math.PI) / 180;
  const d = ox * amp * halfW;
  const x = p.x + Math.cos(yaw) * d;
  const z = p.z + Math.sin(yaw) * d;
  const h = Math.max(24, p.h + oy * amp * halfH);
  const dx = px - x;
  const dz = pz - z;
  const yawDeg = (Math.atan2(dx, -dz) * 180) / Math.PI;
  const pitch = (Math.atan2(h, Math.hypot(dx, dz)) * 180) / Math.PI;
  return { ...p, x, z, h, yaw: p.yaw + shortYaw(p.yaw, yawDeg), pitch };
}

/** Move the camera a fraction k along its line of sight toward the pivot.
 *  Height and ground offset scale together, so the pivot stays on the
 *  optical axis and the pitch is unchanged. */
export function dollyPose(p: Pose, k: number): Pose {
  if (k === 0) return p;
  const { px, pz } = pivotOf(p);
  return { ...p, x: p.x + (px - p.x) * k, z: p.z + (pz - p.z) * k, h: p.h * (1 - k) };
}

/** Ambient orbit input: a slow Lissajous path (periods ≈ 37 s and 53 s —
 *  incommensurate, so the path never visibly repeats). Bounded by ±1,
 *  smooth, and defined for every clock value. */
/** Ambient orbit amplitude relative to the pointer's full orbit range. */
export const AMBIENT_AMP = 0.42;
/** Redraw cadence of the unattended ambient orbit. Its fastest on-screen
 *  point moves ≈ 1.9 px/s at 1440×900 (37 s / 53 s periods × 0.42 × 0.02 rad),
 *  so a 125 ms step is ≤ 0.25 px — below what anti-aliased lines can show.
 *  Pointer, scroll, flight and crossfade motion still redraw every frame. */
export const AMBIENT_FRAME_MS = 125;

export function ambientOrbit(ms: number): [number, number] {
  const s = ms / 1000;
  return [Math.sin((s * 2 * Math.PI) / 37), Math.sin((s * 2 * Math.PI) / 53 + 1.1) * 0.6];
}

/** One step of a damped spring (semi-implicit Euler, sub-stepped at ≤ 8 ms
 *  so it is stable and frame-rate independent). state = [position, velocity]. */
export function springStep(state: [number, number], target: number, dtMs: number, stiffness: number, damping: number, mass = 1): void {
  let left = Math.max(0, dtMs) / 1000;
  while (left > 0) {
    const h = Math.min(left, 0.008);
    const a = (-stiffness * (state[0] - target) - damping * state[1]) / mass;
    state[1] += a * h;
    state[0] += state[1] * h;
    left -= h;
  }
}

/** Engine clock: advance by the real frame gap, clamped, so a suspended tab
 *  (or one very slow frame) resumes exactly where motion left off. */
export const MAX_FRAME_GAP_MS = 50;
export function clockStep(gapMs: number): number {
  return gapMs > 0 ? Math.min(gapMs, MAX_FRAME_GAP_MS) : 0;
}

/* ── atmosphere ──────────────────────────────────────────────── */

/** Distance at which the atmosphere has absorbed ~63% of a line's light
 *  (exp(-1)). Shorter than the die is deep: the near floor is crisp and
 *  the far half dissolves, which keeps the band behind headings (usually
 *  near the horizon) quiet. */
export const FOG_DISTANCE = 1150;
/** Shape exponent: >1 keeps the foreground clear and darkens the distance
 *  faster than a pure exponential. */
export const FOG_SHAPE = 1.6;

/** Visibility of a die point at ground-ray distance r: 1 near, → 0 far. */
export const visibility = (r: number) => Math.exp(-Math.pow(Math.max(0, r) / FOG_DISTANCE, FOG_SHAPE));

/** Analytic depth fog for the die floor. For a planar floor, every screen
 *  row is at one distance, so the fog is an exact vertical gradient:
 *  continuous, perspective-correct, and free (no per-line work, no depth
 *  bands for lines to pop between). Returns [row, fogAlpha] stops from the
 *  horizon down to the bottom edge; fogAlpha = 1 − visibility. */
export function fogStops(p: Pose, height: number, steps = 12): [number, number][] {
  const pitch = (p.pitch * Math.PI) / 180;
  const f = height / 2 / Math.tan((p.fov * Math.PI) / 360);
  const cy = height / 2;
  const horizon = cy - f * Math.tan(pitch);
  const top = Math.max(0, horizon);
  const stops: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    /* rows are spaced quadratically: distance changes fastest near the horizon */
    const u = i / steps;
    const y = top + (height - top) * u * u;
    const below = pitch + Math.atan((y - cy) / f);
    const fog = below <= 0.0005 ? 1 : 1 - visibility(p.h / Math.sin(below));
    stops.push([y, fog]);
  }
  return stops;
}

/** Colours of the atmosphere pass (sRGB). SKY is the brand background. */
export const SKY_RGB = [5, 5, 7] as const;
export const FOG_RGB = [5, 6, 8] as const;
export const GLOW_RGB = [34, 197, 94] as const;

/** The whole atmosphere — opaque sky above the horizon, depth fog below it,
 *  and the faint glow where die meets sky — as ONE vertical gradient, so the
 *  scene pays for one full-screen fill instead of three.
 *
 *  Exact source-over algebra: fog (colour F, alpha f) followed by glow
 *  (colour G, alpha g) equals a single layer with
 *      a = 1 − (1 − f)(1 − g),   C = (F·f·(1 − g) + G·g) / a.
 *  Above the horizon the sky is opaque, so C = S·(1 − g) + G·g and a = 1.
 *  The glow is a tent: 0 at horizon − 0.3h, glowPeak at the horizon, 0 at
 *  horizon + 0.1h. Returns [row, r, g, b, alpha] stops covering 0…height. */
export function atmosphere(p: Pose, height: number, glowPeak: number, steps = 40): [number, number, number, number, number][] {
  const pitch = (p.pitch * Math.PI) / 180;
  const f = height / 2 / Math.tan((p.fov * Math.PI) / 360);
  const cy = height / 2;
  const hz = cy - f * Math.tan(pitch);
  const g0 = hz - 0.3 * height;
  const g1 = hz + 0.1 * height;
  const glowAt = (y: number) => (y <= g0 || y >= g1 ? 0 : y <= hz ? (glowPeak * (y - g0)) / (hz - g0) : (glowPeak * (g1 - y)) / (g1 - hz));
  const fogAt = (y: number) => {
    const below = pitch + Math.atan((y - cy) / f);
    return below <= 0.0005 ? 1 : 1 - visibility(p.h / Math.sin(below));
  };
  const ys: number[] = [0, height];
  const top = Math.min(height, Math.max(0, hz));
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    ys.push(top + (height - top) * u * u); // depth changes fastest near the horizon
  }
  for (let i = 0; i <= 8; i++) ys.push(g0 + ((g1 - g0) * i) / 8);
  ys.push(hz);
  const rows = [...new Set(ys.filter((y) => y >= 0 && y <= height).map((y) => Math.round(y * 100) / 100))].sort((a, b) => a - b);
  return rows.map((y) => {
    const g = glowAt(y);
    if (y < hz) return [y, SKY_RGB[0] * (1 - g) + GLOW_RGB[0] * g, SKY_RGB[1] * (1 - g) + GLOW_RGB[1] * g, SKY_RGB[2] * (1 - g) + GLOW_RGB[2] * g, 1];
    const fo = fogAt(y);
    const a = 1 - (1 - fo) * (1 - g);
    if (a <= 1e-6) return [y, FOG_RGB[0], FOG_RGB[1], FOG_RGB[2], 0];
    const mixC = (k: 0 | 1 | 2) => (FOG_RGB[k] * fo * (1 - g) + GLOW_RGB[k] * g) / a;
    return [y, mixC(0), mixC(1), mixC(2), a];
  });
}

/* ── light field ─────────────────────────────────────────────── */

/** Soft edge of a lit region, world units. */
export const LIGHT_EDGE = 170;

/** Intensity of the chapter light at a die point: 1 inside the focus
 *  region's core, falling smoothly to 0 across LIGHT_EDGE outside it, and
 *  shaped by a broad radial falloff from the region's centre so a lit zone
 *  reads as a pool of light rather than a flat rectangle. */
export function lightAt(rects: readonly Rect[], x: number, z: number): number {
  let best = 0;
  for (const r of rects) {
    const dx = Math.max(r[0] - x, 0, x - r[2]);
    const dz = Math.max(r[1] - z, 0, z - r[3]);
    const edge = 1 - smooth01(Math.hypot(dx, dz) / LIGHT_EDGE);
    if (edge <= 0) continue;
    const cx = (r[0] + r[2]) / 2;
    const cz = (r[1] + r[3]) / 2;
    const radius = Math.hypot(r[2] - r[0], r[3] - r[1]) * 0.62 + LIGHT_EDGE;
    const radial = 1 - 0.55 * smooth01(Math.hypot(x - cx, z - cz) / radius);
    best = Math.max(best, edge * radial);
  }
  return best;
}
const smooth01 = (t: number) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};

/** Lit level per line (0 none, 1 soft, 2 bright) for one chapter, from the
 *  light field at each segment's midpoint. Static per (plan, chapter), so it
 *  is computed once and cached by the renderer. */
export function litLevels(plan: Plan, rects: readonly Rect[]): [Uint8Array, Uint8Array, Uint8Array] {
  return plan.lines.map((L) => {
    const out = new Uint8Array(L.length / 6);
    for (let i = 0, j = 0; i < L.length; i += 6, j++) {
      const v = lightAt(rects, (L[i] + L[i + 3]) / 2, (L[i + 2] + L[i + 5]) / 2);
      out[j] = v > 0.62 ? 2 : v > 0.26 ? 1 : 0;
    }
    return out;
  }) as [Uint8Array, Uint8Array, Uint8Array];
}

/** Brightness scale of a chapter's light, from the area it lights: a single
 *  block (≈ 0.7 Mu²) gets full light, the whole die (Home) a quarter, so a
 *  big lit region never floods the page. */
export function chapterGain(rects: readonly Rect[]): number {
  const area = rects.reduce((a, r) => a + (r[2] - r[0]) * (r[3] - r[1]), 0);
  return Math.min(1, Math.max(0.25, 7e5 / Math.max(1, area)));
}

/* ── render resolution ───────────────────────────────────────── */

/** Backing-store scale for a canvas: the device pixel ratio, capped at 2,
 *  and further limited so one canvas never exceeds `budget` pixels (a 4K
 *  monitor does not need 15 megapixels of hairlines). Never below 1. */
export function pixelRatioFor(cssW: number, cssH: number, devicePixelRatio: number, budget: number): number {
  const capped = Math.min(Math.max(devicePixelRatio || 1, 1), 2);
  const fit = Math.sqrt(budget / Math.max(1, cssW * cssH));
  return Math.max(1, Math.min(capped, fit));
}

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const e = easeInOut(t);
  const m = (p: number, q: number) => p + (q - p) * e;
  return { x: m(a.x, b.x), z: m(a.z, b.z), h: m(a.h, b.h), yaw: m(a.yaw, b.yaw), pitch: m(a.pitch, b.pitch), fov: m(a.fov, b.fov) };
}

export interface Projector {
  /** Projects a world point into out[0..2] = x, y, depth; false when behind the near plane. */
  project(x: number, y: number, z: number, out: Float64Array): boolean;
  /** Projects a line, clipped to the near plane, into out[0..3] = x1, y1, x2, y2 and out[4] = nearest depth. */
  segment(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, out: Float64Array): boolean;
  /** Screen y of the horizon (may be off-screen). */
  horizon: number;
}

const NEAR = 6;

export function makeProjector(pose: Pose, width: number, height: number): Projector {
  const yaw = (pose.yaw * Math.PI) / 180;
  const pitch = (pose.pitch * Math.PI) / 180;
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const f = height / 2 / Math.tan((pose.fov * Math.PI) / 360);
  const cx = width / 2;
  const cyScreen = height / 2;
  /* camera space: out = right, up, depth. Yaw 0 looks toward −z. */
  const cam = (x: number, y: number, z: number, out: Float64Array) => {
    const dx = x - pose.x;
    const dy = y - pose.h;
    const dz = z - pose.z;
    const rx = dx * cy + dz * sy;
    const fwd = dx * sy - dz * cy;
    out[0] = rx;
    out[1] = fwd * sp + dy * cp;
    out[2] = fwd * cp - dy * sp;
  };
  const a = new Float64Array(3);
  const b = new Float64Array(3);
  return {
    horizon: cyScreen - f * Math.tan(pitch),
    project(x, y, z, out) {
      cam(x, y, z, a);
      if (a[2] < NEAR) return false;
      out[0] = cx + (a[0] * f) / a[2];
      out[1] = cyScreen - (a[1] * f) / a[2];
      out[2] = a[2];
      return true;
    },
    segment(x1, y1, z1, x2, y2, z2, out) {
      cam(x1, y1, z1, a);
      cam(x2, y2, z2, b);
      if (a[2] < NEAR && b[2] < NEAR) return false;
      if (a[2] < NEAR || b[2] < NEAR) {
        /* depth is affine in the world point, so the clip is exact */
        const t = (NEAR - a[2]) / (b[2] - a[2]);
        const px = a[0] + (b[0] - a[0]) * t;
        const py = a[1] + (b[1] - a[1]) * t;
        if (a[2] < NEAR) {
          a[0] = px;
          a[1] = py;
          a[2] = NEAR;
        } else {
          const u = (NEAR - b[2]) / (a[2] - b[2]);
          b[0] = b[0] + (a[0] - b[0]) * u;
          b[1] = b[1] + (a[1] - b[1]) * u;
          b[2] = NEAR;
        }
      }
      out[0] = cx + (a[0] * f) / a[2];
      out[1] = cyScreen - (a[1] * f) / a[2];
      out[2] = cx + (b[0] * f) / b[2];
      out[3] = cyScreen - (b[1] * f) / b[2];
      out[4] = Math.min(a[2], b[2]);
      return true;
    },
  };
}
