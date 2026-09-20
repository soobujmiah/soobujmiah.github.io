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
 * Constant areal particle density — the visual-weight contract for
 * name ⇄ service morph targets.
 *
 * `inkPixels` is the lit-pixel count measured at `probeStep` on the
 * offscreen mask (device pixels). The returned step keeps ≈ the same
 * particles-per-ink-area for every title so long two-line services do
 * not look skeletal next to the name. Floor/ceiling protect mobile
 * fill rate and anti-sparsity respectively.
 *
 * probeStep is the grid used to *measure* ink (usually baseStep);
 * the returned step is the grid used to *sample* particles.
 */
export function densityStepFor(
  inkAtProbe: number,
  probeStep: number,
  targetDensity: number,
  minStep: number,
  maxStep: number
): number {
  if (!(inkAtProbe > 0) || !(probeStep > 0) || !(targetDensity > 0)) {
    return Math.max(1, Math.round(probeStep) || 1);
  }
  /* inkArea ≈ inkAtProbe * probeStep²  →  step = 1/√density */
  const step = 1 / Math.sqrt(targetDensity);
  const lo = Math.max(1, minStep);
  const hi = Math.max(lo, maxStep);
  return Math.max(lo, Math.min(hi, Math.round(step)));
}

/**
 * Target particle count from measured ink area and a density goal.
 * Clamped so small titles stay readable and large ones stay mobile-safe.
 */
export function particleCountForInk(
  inkAtProbe: number,
  probeStep: number,
  targetDensity: number,
  minCount: number,
  maxCount: number
): number {
  if (!(inkAtProbe > 0) || !(probeStep > 0) || !(targetDensity > 0)) {
    return Math.max(0, Math.floor(minCount));
  }
  const inkArea = inkAtProbe * probeStep * probeStep;
  const n = Math.round(inkArea * targetDensity);
  return Math.max(Math.floor(minCount), Math.min(Math.floor(maxCount), n));
}

/**
 * Sample ink pixels on a regular grid, then top-up with a seeded
 * sub-grid walk when the regular pass undershoots the density target.
 * Deterministic: same mask + seed → same points. Never Math.random.
 */
export function sampleInkPoints(
  img: Uint8ClampedArray | Uint8Array,
  fw: number,
  fh: number,
  step: number,
  alphaMin: number,
  maxCount: number,
  seed: number
): Array<{ x: number; y: number }> {
  const pts: Array<{ x: number; y: number }> = [];
  if (!(fw > 0) || !(fh > 0) || !(step > 0) || maxCount <= 0) return pts;
  const s = Math.max(1, Math.floor(step));
  for (let y = 0; y < fh; y += s) {
    for (let x = 0; x < fw; x += s) {
      if (img[(y * fw + x) * 4 + 3] > alphaMin) {
        pts.push({ x: x + s / 2, y: y + s / 2 });
      }
    }
  }
  if (pts.length >= maxCount) {
    /* Even thin of a dense grid — keep spatial coverage, drop extras. */
    if (pts.length === maxCount) return pts;
    const keep = new Array<typeof pts[0]>(maxCount);
    for (let i = 0; i < maxCount; i += 1) {
      keep[i] = pts[Math.floor((i * pts.length) / maxCount)];
    }
    return keep;
  }
  /* Undersampled: walk a half-offset lattice with a seeded skip so the
     top-up is stable and still follows glyph ink (not the bbox). */
  const need = maxCount - pts.length;
  if (need <= 0) return pts;
  const rnd = mulberry32(seed >>> 0);
  const half = Math.max(1, Math.floor(s / 2));
  const extras: Array<{ x: number; y: number }> = [];
  for (let y = half; y < fh; y += s) {
    for (let x = half; x < fw; x += s) {
      if (img[(y * fw + x) * 4 + 3] > alphaMin) {
        extras.push({ x: x + half / 2, y: y + half / 2 });
      }
    }
  }
  /* Shuffle extras deterministically, take what we need. */
  for (let i = extras.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = extras[i];
    extras[i] = extras[j];
    extras[j] = tmp;
  }
  for (let i = 0; i < extras.length && pts.length < maxCount; i += 1) {
    pts.push(extras[i]);
  }
  return pts;
}

/**
 * Axis-aligned bounds of a point cloud (CSS or device px — caller units).
 */
export function pointsBounds(pts: Array<{ x: number; y: number }>): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
} {
  if (pts.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, cx: 0, cy: 0 };
  }
  let minX = pts[0].x;
  let minY = pts[0].y;
  let maxX = pts[0].x;
  let maxY = pts[0].y;
  for (let i = 1; i < pts.length; i += 1) {
    const p = pts[i];
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    cx: (minX + maxX) * 0.5,
    cy: (minY + maxY) * 0.5,
  };
}

/**
 * Fit a point cloud into a safe rectangle without crushing edges.
 *
 * 1) Uniformly scale so width/height fit inside the safe box (never
 *    stretch axes independently — keeps glyph proportions).
 * 2) Translate so the scaled bounds centre lands on (cx, cy).
 * 3) Only if a single outlier still escapes (fp noise), soft-clamp.
 *
 * Edge-only clamping used to flatten long titles against the rim and
 * looked like horizontal/vertical cropping. Scale-then-center keeps
 * every glyph complete.
 */
export function centerPointsInSafeRect(
  pts: Array<{ x: number; y: number }>,
  cx: number,
  cy: number,
  safe: { left: number; top: number; right: number; bottom: number }
): Array<{ x: number; y: number }> {
  if (pts.length === 0) return pts;
  const safeW = Math.max(1, safe.right - safe.left);
  const safeH = Math.max(1, safe.bottom - safe.top);
  let b = pointsBounds(pts);
  const bw = Math.max(1e-3, b.width);
  const bh = Math.max(1e-3, b.height);
  /* Tiny air so anti-aliased edges + particle radius never kiss the rim. */
  const fit = Math.min(1, (safeW * 0.98) / bw, (safeH * 0.98) / bh);
  if (fit < 0.999 || Math.abs(b.cx - cx) > 0.25 || Math.abs(b.cy - cy) > 0.25) {
    for (let i = 0; i < pts.length; i += 1) {
      pts[i].x = cx + (pts[i].x - b.cx) * fit;
      pts[i].y = cy + (pts[i].y - b.cy) * fit;
    }
    b = pointsBounds(pts);
  }
  /* Final soft clamp — only outliers from float error, not bulk crop. */
  for (let i = 0; i < pts.length; i += 1) {
    let x = pts[i].x;
    let y = pts[i].y;
    if (x < safe.left) x = safe.left;
    else if (x > safe.right) x = safe.right;
    if (y < safe.top) y = safe.top;
    else if (y > safe.bottom) y = safe.bottom;
    pts[i].x = x;
    pts[i].y = y;
  }
  return pts;
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

/**
 * Controlled morph physics profiles — same engine, deliberate variation.
 * Never random; assigned per service transition in story-world.
 *
 *   radial      — outer material converges through the centre
 *   horizontal  — lateral sweep / flow
 *   vertical    — compress to a mid-band, then expand
 *   orbital     — subtle curved / orbital arcs
 *   wave        — progressive wave along the word
 *   edge        — edges collapse inward, then redistribute
 *   grid        — brief lattice reconfiguration
 *   dispersion  — controlled loosen → reassemble (not explosion)
 */
export type MorphStyle =
  | 'radial'
  | 'horizontal'
  | 'vertical'
  | 'orbital'
  | 'wave'
  | 'edge'
  | 'grid'
  | 'dispersion'
  | 'crossflow'
  | 'focal';

export const MORPH_STYLES: readonly MorphStyle[] = [
  'radial',
  'horizontal',
  'vertical',
  'orbital',
  'wave',
  'edge',
  'grid',
  'dispersion',
  'crossflow',
  'focal',
] as const;

/** Seeded parameters that combine with a morph family for variety. */
export type MorphParams = {
  style: MorphStyle;
  /** 0..1 stagger span (activation delay budget). */
  stagger: number;
  /** Arc / bend magnitude scale. */
  bendScale: number;
  /** Low-amplitude coherent turbulence (0..1). */
  turb: number;
  /** Slight destination overshoot (0..0.12 of travel). */
  overshoot: number;
  /** Propagation axis: 0=x, 1=y, 2=radial, 3=angular. */
  prop: 0 | 1 | 2 | 3;
  /** Flip propagation direction. */
  flip: boolean;
  /** Secondary family blend 0..1 into a second style. */
  blend: number;
  blendStyle: MorphStyle;
};

/** Deterministic 0..1 from a 32-bit seed stream. */
export function seededUnit(seed: number, salt: number): number {
  return mulberry32((seed ^ Math.imul(salt, 0x9e3779b9)) >>> 0)();
}

/**
 * Build controlled morph parameters from a transition seed.
 * Same seed → same physics. Never Math.random in the hot path.
 */
export function morphParamsFromSeed(seed: number, primary: MorphStyle, avoid?: MorphStyle): MorphParams {
  const rnd = mulberry32(seed >>> 0);
  const pick = (): MorphStyle => {
    const pool = MORPH_STYLES.filter((s) => s !== primary && s !== avoid);
    return pool[Math.floor(rnd() * pool.length) % pool.length] ?? 'wave';
  };
  return {
    style: primary,
    stagger: 0.08 + rnd() * 0.14,
    bendScale: 0.1 + rnd() * 0.16,
    turb: 0.04 + rnd() * 0.1,
    overshoot: rnd() * 0.09,
    prop: (Math.floor(rnd() * 4) % 4) as 0 | 1 | 2 | 3,
    flip: rnd() > 0.5,
    blend: 0.15 + rnd() * 0.35,
    blendStyle: pick(),
  };
}

function familyMid(
  style: MorphStyle,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  e: number,
  bend: number,
  fieldCx: number,
  fieldCy: number,
  pull: number,
  nx: number,
  ny: number
): { x: number; y: number } {
  let mx = (ax + bx) * 0.5;
  let my = (ay + by) * 0.5;
  const k = Math.sin(e * Math.PI);

  if (style === 'radial' || style === 'focal') {
    const strength = style === 'focal' ? 0.88 : 0.78;
    mx = lerp(mx, fieldCx, strength * k + 0.12);
    my = lerp(my, fieldCy, strength * k + 0.12);
    mx += nx * bend * 0.35;
    my += ny * bend * 0.35;
  } else if (style === 'horizontal') {
    mx += Math.sign(bx - ax || 1) * pull * 0.95;
    my += bend * 0.5 + ny * bend * 0.2;
  } else if (style === 'vertical') {
    mx += nx * bend * 0.35;
    my = lerp(my, fieldCy, 0.85);
  } else if (style === 'orbital') {
    const ang = (e - 0.5) * Math.PI * 0.65;
    const rad = Math.min(32, Math.hypot(bx - ax, by - ay) * 0.18);
    mx = lerp(mx, fieldCx, 0.38) + Math.cos(ang) * rad * 0.6 + nx * bend * 0.3;
    my = lerp(my, fieldCy, 0.38) + Math.sin(ang) * rad * 0.6 + ny * bend * 0.3;
  } else if (style === 'wave') {
    const wave = Math.sin(e * Math.PI * 1.6) * Math.min(26, Math.hypot(bx - ax, by - ay) * 0.16);
    mx += nx * (bend * 0.45 + wave);
    my += ny * (bend * 0.45 + wave * 0.4);
  } else if (style === 'edge') {
    mx = lerp(mx, fieldCx, 0.72 * k);
    my = lerp(my, fieldCy, 0.48 * k);
    mx += nx * bend * 0.55;
    my += ny * bend * 0.55;
  } else if (style === 'grid') {
    const cell = 12;
    const gx = Math.round(mx / cell) * cell;
    const gy = Math.round(my / cell) * cell;
    mx = lerp(mx, gx, 0.8 * k);
    my = lerp(my, gy, 0.8 * k);
    mx += nx * bend * 0.22;
    my += ny * bend * 0.22;
  } else if (style === 'crossflow') {
    // Two axes cross: horizontal pull then vertical release.
    mx += Math.sign(bx - ax || 1) * pull * (1 - e) * 0.7;
    my += Math.sign(by - ay || 1) * pull * e * 0.55;
    mx += nx * bend * 0.4;
    my += ny * bend * 0.4;
  } else {
    // dispersion
    const out = Math.min(28, Math.hypot(bx - ax, by - ay) * 0.15) * k;
    const ox = (ax - fieldCx) || nx;
    const oy = (ay - fieldCy) || ny;
    const ol = Math.hypot(ox, oy) || 1;
    mx += (ox / ol) * out + nx * bend * 0.3;
    my += (oy / ol) * out + ny * bend * 0.3;
  }
  return { x: mx, y: my };
}

/**
 * Multi-family geometric trajectory with seeded turbulence + overshoot.
 * Endpoints are exact at t=0 and t=1. Hue is never involved.
 */
export function styledFlowPoint(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  t: number,
  bend: number,
  style: MorphStyle,
  fieldCx: number,
  fieldCy: number,
  params?: Partial<MorphParams>
): { x: number; y: number } {
  const e = easeInOutQuint(t);
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const pull = Math.min(44, len * 0.24);
  const turb = params?.turb ?? 0;
  const overshoot = params?.overshoot ?? 0;
  const blend = params?.blend ?? 0;
  const blendStyle = params?.blendStyle ?? style;

  const a = familyMid(style, ax, ay, bx, by, e, bend, fieldCx, fieldCy, pull, nx, ny);
  let mx = a.x;
  let my = a.y;
  if (blend > 0.02 && blendStyle !== style) {
    const b = familyMid(blendStyle, ax, ay, bx, by, e, bend * 0.8, fieldCx, fieldCy, pull, nx, ny);
    mx = lerp(mx, b.x, blend);
    my = lerp(my, b.y, blend);
  }

  // Coherent low-amplitude turbulence (seeded via bend phase, not Math.random).
  if (turb > 0) {
    const w = Math.sin(e * Math.PI * 2 + bend * 0.17) * turb * Math.min(18, len * 0.1);
    const w2 = Math.cos(e * Math.PI * 1.3 + bend * 0.31) * turb * Math.min(12, len * 0.07);
    mx += nx * w + ny * w2 * 0.5;
    my += ny * w - nx * w2 * 0.5;
  }

  // Slight overshoot past destination near the end, then settle (still ends at B).
  let destX = bx;
  let destY = by;
  if (overshoot > 0 && e > 0.55 && e < 1) {
    const o = Math.sin(((e - 0.55) / 0.45) * Math.PI) * overshoot;
    destX = bx + dx * o;
    destY = by + dy * o;
  }
  // Re-anchor so t=1 lands exactly on B.
  const landX = e >= 1 ? bx : destX;
  const landY = e >= 1 ? by : destY;

  const u = 1 - e;
  return {
    x: u * u * ax + 2 * u * e * mx + e * e * landX,
    y: u * u * ay + 2 * u * e * my + e * e * landY,
  };
}

/** Stagger order key for a particle under a propagation mode. */
export function staggerOrder(
  nx: number,
  ny: number,
  prop: 0 | 1 | 2 | 3,
  flip: boolean
): number {
  let o = 0;
  if (prop === 0) o = nx;
  else if (prop === 1) o = ny;
  else if (prop === 2) o = Math.hypot(nx - 0.5, ny - 0.5) * 1.4;
  else o = (Math.atan2(ny - 0.5, nx - 0.5) + Math.PI) / (Math.PI * 2);
  if (flip) o = 1 - o;
  return clamp01(o);
}

/**
 * Tokenise a service title for two-line wrapping.
 * Spaces are hard breaks; hyphens (Small-Business) are soft breaks that
 * keep the hyphen on the first half so long compounds can split cleanly.
 */
function wrapTokens(label: string): string[] {
  const raw = label.trim().split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (const w of raw) {
    if (w.includes('-') && w.length > 6) {
      const parts = w.split('-');
      for (let i = 0; i < parts.length; i += 1) {
        if (!parts[i]) continue;
        out.push(i < parts.length - 1 ? `${parts[i]}-` : parts[i]);
      }
    } else {
      out.push(w);
    }
  }
  return out;
}

/**
 * Split a service title into at most two balanced lines for sampling.
 * Prefers breaks on spaces (and soft hyphen splits) near the midpoint;
 * never forces 3+ lines.
 */
export function splitTwoLines(label: string, measure: (s: string) => number, maxWidth: number): string[] {
  const words = wrapTokens(label);
  if (words.length === 0) return [''];
  if (words.length === 1) return [words[0]];
  const join = (from: number, to: number) =>
    words
      .slice(from, to)
      .join(' ')
      .replace(/-\s+/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
  const full = join(0, words.length);
  if (measure(full) <= maxWidth) return [full];

  let best = 1;
  let bestScore = Infinity;
  for (let i = 1; i < words.length; i += 1) {
    const a = join(0, i);
    const b = join(i, words.length);
    if (!a || !b) continue;
    const wa = measure(a);
    const wb = measure(b);
    const overflow = Math.max(0, wa - maxWidth) + Math.max(0, wb - maxWidth);
    const balance = Math.abs(wa - wb);
    const score = overflow * 1000 + balance;
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return [join(0, best), join(best, words.length)];
}
