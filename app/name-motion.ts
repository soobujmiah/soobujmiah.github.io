/* ═══════════════════════════════════════════════════════════════
   NAME ASSEMBLY — pure motion logic.

   The signature identity mark is *constructed*, not revealed: the
   wordmark's own rendered ink is sampled into a particle field, the
   field is dispersed, and every particle travels home to the exact
   pixel it was sampled from. This module holds all of the maths that
   decides where a particle starts, when it moves, how it eases and
   what colour it is at a given moment.

   Two rules shaped the design:

   1. Shaping is never re-implemented here. Nothing in this file
      splits a string, and nothing decides what a glyph looks like.
      The renderer draws whole grapheme clusters with the browser's
      own text engine and samples the resulting pixels, so Bengali
      কার / মাত্রা / যুক্তাক্ষর are correct by construction — there is
      no code path that could detach a matra, because no code path
      ever addresses one.

   2. Everything is deterministic. The same name produces the same
      seed, the same particle field and the same frame at the same
      timestamp, so a server render, a client render and a re-run
      after a language switch are all reproducible. No Math.random.

   Pure logic, no React and no DOM — so `scripts/check-units.mjs` can
   compile and test it directly.
   ═══════════════════════════════════════════════════════════════ */

/** FNV-1a: a stable 32-bit seed for any string. */
export function hashSeed(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — small, fast, deterministic. Returns a float in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);

/**
 * Ease-out with a single controlled overshoot, then an exact landing.
 *
 * `back` is the overshoot strength: 0 is a plain ease-out, ~0.7 is the
 * subtle "seats into place" feel the identity uses. The curve is 0 at
 * t=0 and *exactly* 1 at t=1, so a particle always finishes precisely
 * on its sampled target — the overshoot can never leave the resolved
 * name slightly off its typography.
 */
export function easeOutSettle(t: number, back: number): number {
  const x = clamp01(t);
  const c3 = back + 1;
  const d = x - 1;
  return 1 + c3 * d * d * d + back * d * d;
}

/** Linear interpolation. */
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Where the baseline sits inside an inline box.
 *
 * CSS centres the font's em box in the line box and distributes the
 * leftover as half-leading, so the baseline is:
 *
 *     boxTop + (lineHeight − (ascent + descent)) / 2 + ascent
 *
 * Sampling particles against a synthetic baseline would put them a
 * pixel or two away from the real glyphs, and the cross-fade from
 * canvas to DOM text would visibly jump. Deriving it from the same
 * metrics the browser used makes the two coincide.
 */
export function baselineWithinBox(
  boxTop: number,
  lineHeight: number,
  ascent: number,
  descent: number
): number {
  const content = ascent + descent;
  if (!(content > 0) || !(lineHeight > 0)) return boxTop + lineHeight * 0.8;
  return boxTop + (lineHeight - content) / 2 + ascent;
}

/**
 * The sampling step that keeps the field inside the particle budget.
 *
 * `inkPixels` is the number of lit pixels found at `baseStep`. Because
 * the sample count falls with the square of the step, the step needed
 * to reach `maxParticles` is `baseStep * sqrt(inkPixels / max)`. The
 * result is rounded up to a whole device pixel so the sample grid
 * stays regular, and never goes below `baseStep` (the budget is a
 * ceiling, not a target — a short name stays crisp rather than being
 * padded out with noise).
 */
export function sampleStepFor(inkPixels: number, baseStep: number, maxParticles: number): number {
  if (!(inkPixels > 0) || !(maxParticles > 0)) return baseStep;
  if (inkPixels <= maxParticles) return baseStep;
  return Math.max(baseStep, Math.ceil(baseStep * Math.sqrt(inkPixels / maxParticles)));
}

/**
 * Responsive-density sampling step.
 *
 * sampleStepFor only ever widens the step when a field exceeds the
 * budget; small fields — a phone wordmark is a fraction of the
 * desktop's ink — stay at the base step and sample sparse, so the
 * mobile name reads thin. denseStepFor tightens the step toward the
 * same budget when ink falls well under it, giving every viewport
 * comparable particle typography. The ceil guarantees the predicted
 * count never exceeds the budget; within 85% of it the base step is
 * kept, so desktop sampling is unchanged.
 */
export function denseStepFor(inkPixels: number, baseStep: number, target: number): number {
  if (!(inkPixels > 0) || !(target > 0)) return baseStep;
  if (inkPixels >= target * 0.85) return sampleStepFor(inkPixels, baseStep, target);
  return Math.max(1, Math.ceil(baseStep * Math.sqrt(inkPixels / target)));
}

/**
 * Where a particle starts.
 *
 * The field reads as a wordmark that has just been taken apart rather
 * than as confetti: displacement grows with distance from the word's
 * centre, so the outer letters travel furthest and the assembly sweeps
 * inward, and the vertical component is biased so material falls into
 * the baseline instead of arriving from every direction equally.
 *
 * Returns CSS-pixel coordinates.
 */
export function disperseOrigin(
  tx: number,
  ty: number,
  boxW: number,
  boxH: number,
  rnd: () => number,
  radius: number
): { x: number; y: number } {
  const cx = boxW / 2;
  /* 0 at the centre of the word, 1 at its edges. */
  const radial = Math.min(1, Math.abs(tx - cx) / (cx || 1));
  const spread = radius * boxH * (0.45 + 0.55 * radial);
  const angle = rnd() * Math.PI * 2;
  /* Slightly wider than tall: the word is a horizontal object. */
  const x = tx + Math.cos(angle) * spread * (0.9 + rnd() * 0.5);
  const y = ty + Math.sin(angle) * spread * 0.52 - boxH * 0.1 * rnd();
  return { x, y };
}

/**
 * Per-particle start time, as a fraction of the whole assembly.
 *
 * Two staggers compose: the cluster the particle belongs to (so the
 * word builds left to right, one grapheme at a time) and a small
 * deterministic jitter inside that cluster (so a cluster resolves as
 * material settling rather than as a hard edge switching on).
 */
export function startOffset(
  clusterIndex: number,
  clusterCount: number,
  rnd: () => number,
  clusterShare: number,
  jitterShare: number
): number {
  const slots = Math.max(1, clusterCount - 1);
  const byCluster = (clusterIndex / slots) * clusterShare;
  return byCluster + rnd() * jitterShare;
}

/* ── colour ───────────────────────────────────────────────────────
   Hex helpers live here so the ramp is testable: a particle's colour
   is a function of its lock progress, cool → warm → the brand green. */

export type Rgb = { r: number; g: number; b: number };

export function hexToRgb(hex: string): Rgb {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return { r: 0, g: 0, b: 0 };
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export const rgbToCss = (c: Rgb, alpha: number): string =>
  `rgba(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)},${Number(alpha.toFixed(3))})`;

export function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  const k = clamp01(t);
  return { r: lerp(a.r, b.r, k), g: lerp(a.g, b.g, k), b: lerp(a.b, b.b, k) };
}

/**
 * The assembly ramp, quantised to `buckets` entries so the renderer
 * can batch every particle of a colour into one fill call.
 *
 *   progress 0.00 → cool technical ink   (material still in motion)
 *   progress warm → one amber highlight  (the moment a particle seats)
 *   progress 1.00 → the particle's own green (resolved identity)
 *
 * `warmAt` is where the amber peak sits along the ramp.
 */
export function rampPalette(cool: string, warm: string, green: string, buckets: number, warmAt: number): string[] {
  const c = hexToRgb(cool);
  const w = hexToRgb(warm);
  const g = hexToRgb(green);
  const out: string[] = [];
  const n = Math.max(2, buckets);
  for (let i = 0; i < n; i += 1) {
    const t = i / (n - 1);
    const at = clamp01(warmAt);
    const rgb = t <= at ? mixRgb(c, w, at === 0 ? 1 : t / at) : mixRgb(w, g, (t - at) / (1 - at || 1));
    out.push(rgbToCss(rgb, 1));
  }
  return out;
}

/** Which bucket of a ramp a lock progress falls into. */
export function bucketFor(progress: number, buckets: number): number {
  const n = Math.max(2, buckets);
  return Math.min(n - 1, Math.max(0, Math.round(clamp01(progress) * (n - 1))));
}

/**
 * The particle budget for this device and this wordmark.
 *
 * Mobile hardware gets a smaller field on purpose: the assembly reads
 * the same at 600 particles as at 1600, and a phone's fill rate is
 * better spent on the page transition than on the identity mark.
 * `cores` is `navigator.hardwareConcurrency`, treated as a hint only.
 */
export function particleBudget(viewportWidth: number, cores: number, cap: number): number {
  const small = viewportWidth < 700;
  const weak = cores > 0 && cores <= 4;
  let budget = cap;
  /* phones keep 70% of the cap: enough for a dense, legible wordmark
     (the name is priority one), still well under desktop load */
  if (small) budget = Math.round(budget * 0.7);
  if (weak) budget = Math.round(budget * 0.8);
  return Math.max(180, Math.min(cap, budget));
}

/**
 * Smoothstep / quintic fade — continuous velocity at the endpoints when used
 * as a morph parameter (no sudden acceleration).
 */
export function easeInOutQuint(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
}

export function easeInOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/**
 * Spatial particle↔target correspondence.
 *
 * Sorts both clouds by a stable spatial key (x then y) and pairs them in
 * order so neighbouring material stays neighbouring. When the populations
 * differ, targets are stretched evenly across the particle list — never
 * randomly shuffled. This is the anti-noise contract for the storytelling
 * canvas: particles must appear to flow, not teleport.
 */
export function spatialPairing(
  from: Array<{ x: number; y: number }>,
  to: Array<{ x: number; y: number }>
): Int32Array {
  const n = from.length;
  const m = to.length;
  const map = new Int32Array(n);
  if (n === 0 || m === 0) return map;

  const fi = new Array<number>(n);
  const ti = new Array<number>(m);
  for (let i = 0; i < n; i += 1) fi[i] = i;
  for (let i = 0; i < m; i += 1) ti[i] = i;

  const bySpatial = (
    pts: Array<{ x: number; y: number }>,
    a: number,
    b: number
  ): number => {
    const dx = pts[a].x - pts[b].x;
    if (Math.abs(dx) > 0.01) return dx;
    return pts[a].y - pts[b].y;
  };

  fi.sort((a, b) => bySpatial(from, a, b));
  ti.sort((a, b) => bySpatial(to, a, b));

  for (let k = 0; k < n; k += 1) {
    const dest = m === 1 ? 0 : Math.min(m - 1, Math.floor((k * m) / n));
    map[fi[k]] = ti[dest];
  }
  return map;
}

/**
 * Quadratic Bézier through a controlled midpoint. The midpoint is biased
 * toward the short path so long-distance pairs arc gently instead of
 * cutting diagonally through the whole field.
 */
export function flowPoint(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  t: number,
  bend: number
): { x: number; y: number } {
  const e = easeInOutQuint(t);
  const mx = (ax + bx) * 0.5;
  const my = (ay + by) * 0.5;
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * bend;
  const cy = my + (dx / len) * bend;
  const u = 1 - e;
  return {
    x: u * u * ax + 2 * u * e * cx + e * e * bx,
    y: u * u * ay + 2 * u * e * cy + e * e * by,
  };
}
