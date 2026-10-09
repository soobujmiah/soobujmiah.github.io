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
  { x: -560, z: 700, h: 110, yaw: 8, pitch: 24, fov: 48 }, //  2 about: calm memory-array texture
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
