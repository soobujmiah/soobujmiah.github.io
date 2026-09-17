'use client';

/* ═══════════════════════════════════════════════════════════════
   SIGNATURE NAME — a constructed, living identity.

   The wordmark is not revealed, it is *built*: the rendered ink of
   the name is sampled into a particle field, the field is dispersed,
   and every particle travels home to the exact pixel it was sampled
   from, grapheme cluster by grapheme cluster. That construction —
   and the Bengali shaping guarantees that come with it — is
   protected existing behaviour and is unchanged.

   Once built, the identity lives in a controlled loop:

       forming → NAME (hold 2.6–3.8s)
               → detach + wide radial SPREAD (bounded field)
               → converge into a TECHNICAL FORM (hold 1.6–2.3s)
               → spread again → NAME → hold → next form → …

   Every morph is two curved legs through a seeded scatter field, so
   material visibly leaves the name, occupies a larger controlled
   region, then reorganises — emergence rather than interpolation.
   The scatter centre and radii derive from the *layer* box (the
   stable positioned page container), never from the text, so the
   identity container cannot jump or shift between languages or
   cycles; only pixels inside the canvas move.

   The form library is a curated collection of 35 technical motifs
   (programming, systems, Android, ecosystem, AI, geometric/3D and
   device metaphors). Forms are drawn into an offscreen canvas and
   sampled exactly like the name's ink — one code path decides where
   material goes. A seeded shuffled bag schedules them: no immediate
   repeat, no visible tiny loop, fully reproducible per cycle.

   Depth without a 3D engine: each particle carries a seeded z used
   for size, ramp position and a slow parallax sway while a form is
   held; curved Bézier legs + per-particle stagger + a bounded
   turbulence term give the transitions their organic, nonlinear
   character. All maths is deterministic (FNV-1a + mulberry32); no
   Math.random, no per-frame allocation beyond the batched paths.

   Reduced motion: no canvas, no timer, no loop — the wordmark is
   simply present, stable and readable. The accessible name is the
   sr-only copy at every moment, in the current language.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useRef } from 'react';
import type { CSSProperties } from 'react';
import { segmentGraphemes } from '@/app/graphemes';
import { MOTION } from '@/app/design-tokens';
import {
  baselineWithinBox,
  bucketFor,
  disperseOrigin,
  easeOutSettle,
  hashSeed,
  mulberry32,
  particleBudget,
  rampPalette,
  sampleStepFor,
  startOffset,
} from '@/app/name-motion';

/** Resolved inks — the brand's green family, one per grapheme cluster. */
const INKS = ['#a3e635', '#4ade80', '#22c55e', '#34d399', '#10b981', '#2dd4bf', '#84cc16', '#16a34a'];
/** Assembly inks — restrained cool technical tones for material in motion. */
const ASSEMBLE_INKS = ['#7dd3fc', '#a5b4fc', '#93c5fd', '#67e8f9'];
/** The one warm highlight: the moment a particle seats. */
const LOCK_INK = '#eab308';

/** Colour-ramp resolution. Also the ceiling on fills per frame. */
const RAMP_BUCKETS = 8;
/** Where the warm highlight sits along each particle's arrival. */
const WARM_AT = 0.72;
/** The green the field condenses into before the DOM text takes over. */
const RESOLVED_INK = '#4ade80';
/** Ink + alpha for material that has not started travelling yet. */
const WAITING_INK = 'rgba(147,197,253,0.20)';

/* ── the living loop, seconds (varied per cycle by a seeded factor) ── */
const NAME_HOLD_S = 3.0; // readable name before any transform (±0.6)
const FORM_HOLD_S = 1.9; // a technical form, held (±0.35)
const MORPH_S = 2.2; // one spread+converge leg-pair (±0.3)
/** Where the scatter waypoint sits along a morph, 0..1. */
const SPREAD_AT = 0.42;

/** The curated form library — cycled by a seeded bag, never all at once. */
const FORMS = [
  // programming
  'code', 'braces', 'brackets', 'terminal', 'cursor',
  // systems / engineering
  'chip', 'circuit', 'server', 'database', 'network', 'wave', 'arch',
  // android / mobile
  'android', 'phone', 'appgrid', 'robot',
  // developer ecosystem
  'git', 'tree', 'package',
  // ai / data
  'neural', 'matrix', 'flow',
  // geometric / dimensional
  'cube', 'sphere', 'orbit', 'hex', 'pyramid', 'layers',
  // technical motifs
  'gear', 'lock', 'cloud', 'globe', 'bolt', 'antenna', 'keyboard',
] as const;
type FormId = (typeof FORMS)[number];

/** Transition choreographies — the spread itself must vary cycle to
    cycle; radial is one member, never the universal behaviour. */
const STYLES = [
  'radial', 'spiral', 'vortex', 'orbital', 'wave', 'ripple', 'sweep',
  'clusters', 'fragment', 'depth', 'perspective', 'layered', 'flow',
] as const;
type StyleId = (typeof STYLES)[number];

type Particle = {
  /** sampled target, CSS px — where this pixel of ink actually is */
  tx: number;
  ty: number;
  /** dispersed origin, CSS px */
  ox: number;
  oy: number;
  /** start time and travel duration, as fractions of the assembly */
  at: number;
  dur: number;
  /** alive-state phases: two micro-drift oscillators and one slow
      amplitude modulator, radians */
  ph1: number;
  ph2: number;
  ph3: number;
  /** stagger of the periodic breath wave, 0..1 of the cycle */
  wph: number;
  /** unit-ish direction the breath wave carries this particle */
  bx: number;
  by: number;
  /** morph legs: origin → scatter → destination, curved controls */
  m0x: number; m0y: number;
  sx: number; sy: number;
  m1x: number; m1y: number;
  c0x: number; c0y: number;
  c1x: number; c1y: number;
  /** per-particle morph stagger + bounded turbulence amplitude */
  stg: number;
  turb: number;
  /** depth 0..1 */
  z: number;
};

const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);
const easeInOut = (t: number): number => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
const easeOut = (t: number): number => {
  const x = clamp01(t);
  return 1 - (1 - x) * (1 - x);
};
const quad = (a: number, c: number, b: number, t: number): number => {
  const u = 1 - t;
  return u * u * a + 2 * u * t * c + t * t * b;
};

/* ── canvas drawing helpers for the form library ───────────────── */
type Ctx = CanvasRenderingContext2D;
const poly = (ctx: Ctx, pts: number[][], close = false) => {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  if (close) ctx.closePath();
};
const circle = (ctx: Ctx, x: number, y: number, r: number, fill = true) => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) ctx.fill();
  else ctx.stroke();
};
const line = (ctx: Ctx, a: number, b: number, c: number, d: number) => {
  ctx.beginPath();
  ctx.moveTo(a, b);
  ctx.lineTo(c, d);
  ctx.stroke();
};
const txt = (ctx: Ctx, s: string, x: number, y: number, px: number) => {
  ctx.font = `700 ${Math.round(px)}px ui-monospace, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
};

/* ── drawing the technical forms ──────────────────────────────────
   Each form is drawn into the same wordmark box the name occupies;
   the lit pixels are then sampled into particle targets exactly like
   the name's ink. Strokes are sized off H so every form reads at the
   identity's scale. */
function drawForm(ctx: Ctx, form: FormId, W: number, H: number, seed: number): void {
  const cx = W / 2;
  const cy = H / 2;
  const lw = Math.max(2, H * 0.05);
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (form) {
    /* ── programming ── */
    case 'code':
      txt(ctx, '</>', cx, cy, H * 0.82);
      break;
    case 'braces':
      txt(ctx, '{ }', cx, cy, H * 0.86);
      break;
    case 'brackets':
      txt(ctx, '[ ]', cx, cy, H * 0.86);
      break;
    case 'terminal': {
      const w = W * 0.62;
      const h = H * 0.74;
      ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
      line(ctx, cx - w / 2, cy - h / 2 + h * 0.22, cx + w / 2, cy - h / 2 + h * 0.22);
      ctx.font = `700 ${Math.round(H * 0.34)}px ui-monospace, monospace`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('>', cx - w * 0.3, cy + h * 0.12);
      ctx.fillRect(cx - w * 0.08, cy + h * 0.02, w * 0.22, lw * 1.4);
      break;
    }
    case 'cursor':
      line(ctx, cx - H * 0.42, cy, cx + H * 0.08, cy);
      ctx.fillRect(cx + H * 0.16, cy - H * 0.34, lw * 1.6, H * 0.68);
      break;

    /* ── systems / engineering ── */
    case 'chip': {
      const s = H * 0.56;
      ctx.strokeRect(cx - s / 2, cy - s / 2, s, s);
      ctx.fillRect(cx - s * 0.18, cy - s * 0.18, s * 0.36, s * 0.36);
      for (let i = -1; i <= 1; i += 1) {
        const o = (i * s) / 3;
        line(ctx, cx + o, cy - s / 2, cx + o, cy - s / 2 - H * 0.12);
        line(ctx, cx + o, cy + s / 2, cx + o, cy + s / 2 + H * 0.12);
        line(ctx, cx - s / 2, cy + o, cx - s / 2 - H * 0.12, cy + o);
        line(ctx, cx + s / 2, cy + o, cx + s / 2 + H * 0.12, cy + o);
      }
      break;
    }
    case 'circuit': {
      const rnd = mulberry32(seed);
      for (let t = 0; t < 5; t += 1) {
        let x = W * (0.12 + rnd() * 0.2);
        let y = H * (0.15 + (t / 5) * 0.7 + rnd() * 0.08);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, lw * 0.8, 0, Math.PI * 2);
        const segs = 3 + Math.floor(rnd() * 2);
        for (let s = 0; s < segs; s += 1) {
          x += W * (0.14 + rnd() * 0.14);
          y += rnd() < 0.45 ? 0 : (rnd() - 0.5) * H * 0.34;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        circle(ctx, x, y, lw * 1.1);
      }
      break;
    }
    case 'server': {
      const w = H * 0.72;
      const h = H * 0.2;
      for (let i = -1; i <= 1; i += 1) {
        const y = cy + i * (h + H * 0.06) - h / 2;
        ctx.strokeRect(cx - w / 2, y, w, h);
        circle(ctx, cx - w / 2 + H * 0.07, y + h / 2, lw * 0.8);
        line(ctx, cx + w * 0.08, y + h / 2, cx + w / 2 - H * 0.06, y + h / 2);
      }
      break;
    }
    case 'database': {
      const w = H * 0.6;
      const h = H * 0.66;
      const ry = H * 0.1;
      ctx.beginPath();
      ctx.ellipse(cx, cy - h / 2, w / 2, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      line(ctx, cx - w / 2, cy - h / 2, cx - w / 2, cy + h / 2);
      line(ctx, cx + w / 2, cy - h / 2, cx + w / 2, cy + h / 2);
      ctx.beginPath();
      ctx.ellipse(cx, cy + h / 2, w / 2, ry, 0, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy - h / 6, w / 2, ry, 0, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy + h / 6, w / 2, ry, 0, 0, Math.PI);
      ctx.stroke();
      break;
    }
    case 'network': {
      const rnd = mulberry32(seed);
      const nodes: number[][] = [[cx, cy]];
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 6) * Math.PI * 2 + rnd() * 0.5;
        nodes.push([cx + Math.cos(a) * W * 0.3, cy + Math.sin(a) * H * 0.34]);
      }
      for (let i = 1; i < nodes.length; i += 1) line(ctx, cx, cy, nodes[i][0], nodes[i][1]);
      line(ctx, nodes[1][0], nodes[1][1], nodes[2][0], nodes[2][1]);
      line(ctx, nodes[4][0], nodes[4][1], nodes[5][0], nodes[5][1]);
      circle(ctx, cx, cy, lw * 1.4);
      for (let i = 1; i < nodes.length; i += 1) circle(ctx, nodes[i][0], nodes[i][1], lw);
      break;
    }
    case 'wave': {
      ctx.beginPath();
      for (let x = -W * 0.32; x <= W * 0.32; x += 2) {
        const y = cy + Math.sin((x / (W * 0.64)) * Math.PI * 3) * H * 0.26;
        if (x === -W * 0.32) ctx.moveTo(cx + x, y);
        else ctx.lineTo(cx + x, y);
      }
      ctx.stroke();
      circle(ctx, cx - W * 0.106, cy - H * 0.26, lw);
      circle(ctx, cx + W * 0.106, cy + H * 0.26, lw);
      break;
    }
    case 'arch': {
      const w = H * 0.3;
      ctx.strokeRect(cx - w / 2, cy - H * 0.4, w, H * 0.22);
      ctx.strokeRect(cx - W * 0.24 - w / 2, cy + H * 0.16, w, H * 0.22);
      ctx.strokeRect(cx + W * 0.24 - w / 2, cy + H * 0.16, w, H * 0.22);
      line(ctx, cx, cy - H * 0.18, cx, cy);
      line(ctx, cx - W * 0.24, cy, cx + W * 0.24, cy);
      line(ctx, cx - W * 0.24, cy, cx - W * 0.24, cy + H * 0.16);
      line(ctx, cx + W * 0.24, cy, cx + W * 0.24, cy + H * 0.16);
      break;
    }

    /* ── android / mobile ── */
    case 'android': {
      const rr = H * 0.3;
      ctx.beginPath();
      ctx.arc(cx, cy + rr * 0.55, rr, Math.PI, 0);
      ctx.closePath();
      ctx.stroke();
      circle(ctx, cx - rr * 0.45, cy + 0.05 * H, lw * 0.9);
      circle(ctx, cx + rr * 0.45, cy + 0.05 * H, lw * 0.9);
      line(ctx, cx - rr * 0.55, cy - rr * 0.75, cx - rr * 0.85, cy - rr * 1.25);
      line(ctx, cx + rr * 0.55, cy - rr * 0.75, cx + rr * 0.85, cy - rr * 1.25);
      break;
    }
    case 'phone': {
      const w = H * 0.42;
      const h = H * 0.78;
      ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
      line(ctx, cx - w * 0.16, cy - h / 2 + H * 0.08, cx + w * 0.16, cy - h / 2 + H * 0.08);
      circle(ctx, cx, cy + h / 2 - H * 0.09, lw * 0.9);
      break;
    }
    case 'appgrid': {
      const s = H * 0.26;
      const g = H * 0.12;
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        ctx.strokeRect(cx + (dx * (s + g)) / 2 - s / 2, cy + (dy * (s + g)) / 2 - s / 2, s, s);
      }
      break;
    }
    case 'robot': {
      const w = H * 0.52;
      const h = H * 0.42;
      ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
      circle(ctx, cx - w * 0.22, cy - h * 0.08, lw);
      circle(ctx, cx + w * 0.22, cy - h * 0.08, lw);
      line(ctx, cx - w * 0.18, cy + h * 0.2, cx + w * 0.18, cy + h * 0.2);
      line(ctx, cx, cy - h / 2, cx, cy - h / 2 - H * 0.14);
      circle(ctx, cx, cy - h / 2 - H * 0.17, lw * 0.9);
      break;
    }

    /* ── developer ecosystem ── */
    case 'git': {
      line(ctx, cx - W * 0.14, cy - H * 0.36, cx - W * 0.14, cy + H * 0.36);
      ctx.beginPath();
      ctx.moveTo(cx - W * 0.14, cy - H * 0.1);
      ctx.quadraticCurveTo(cx + W * 0.16, cy - H * 0.06, cx + W * 0.16, cy + H * 0.16);
      ctx.stroke();
      circle(ctx, cx - W * 0.14, cy - H * 0.3, lw * 1.2);
      circle(ctx, cx - W * 0.14, cy - H * 0.1, lw * 1.2);
      circle(ctx, cx - W * 0.14, cy + H * 0.3, lw * 1.2);
      circle(ctx, cx + W * 0.16, cy + H * 0.2, lw * 1.2);
      break;
    }
    case 'tree': {
      const x0 = cx - W * 0.22;
      line(ctx, x0, cy - H * 0.34, x0, cy + H * 0.3);
      for (let i = 0; i < 4; i += 1) {
        const y = cy - H * 0.2 + i * H * 0.17;
        line(ctx, x0, y, x0 + W * 0.14, y);
        line(ctx, x0 + W * 0.14, y, x0 + W * 0.3, y);
      }
      circle(ctx, x0, cy - H * 0.34, lw);
      break;
    }
    case 'package': {
      const s = H * 0.56;
      poly(ctx, [[cx - s / 2, cy - s * 0.32], [cx, cy - s / 2], [cx + s / 2, cy - s * 0.32], [cx + s / 2, cy + s * 0.32], [cx, cy + s / 2], [cx - s / 2, cy + s * 0.32]], true);
      ctx.stroke();
      line(ctx, cx - s / 2, cy - s * 0.32, cx, cy - s * 0.14);
      line(ctx, cx + s / 2, cy - s * 0.32, cx, cy - s * 0.14);
      line(ctx, cx, cy - s * 0.14, cx, cy + s / 2);
      break;
    }

    /* ── ai / data ── */
    case 'neural': {
      const cols = [-W * 0.26, 0, W * 0.26];
      const rows = [2, 3, 2];
      const pts: number[][][] = [];
      for (let c = 0; c < 3; c += 1) {
        pts[c] = [];
        for (let i = 0; i < rows[c]; i += 1) {
          const y = cy + (i - (rows[c] - 1) / 2) * H * 0.3;
          pts[c].push([cx + cols[c], y]);
        }
      }
      for (let c = 0; c < 2; c += 1)
        for (const a of pts[c]) for (const b of pts[c + 1]) line(ctx, a[0], a[1], b[0], b[1]);
      for (const col of pts) for (const [x, y] of col) circle(ctx, x, y, lw * 1.1);
      break;
    }
    case 'matrix': {
      const rnd = mulberry32(seed);
      for (let i = 0; i < 6; i += 1)
        for (let j = 0; j < 3; j += 1) {
          const x = cx + (i - 2.5) * W * 0.11;
          const y = cy + (j - 1) * H * 0.3;
          circle(ctx, x, y, rnd() < 0.3 ? lw * 1.3 : lw * 0.7);
        }
      break;
    }
    case 'flow': {
      for (let i = -1; i <= 1; i += 1) {
        const y = cy + i * H * 0.28;
        const x1 = cx + W * 0.26;
        line(ctx, cx - W * 0.28, y, x1, y);
        line(ctx, x1 - H * 0.1, y - H * 0.08, x1, y);
        line(ctx, x1 - H * 0.1, y + H * 0.08, x1, y);
      }
      break;
    }

    /* ── geometric / dimensional ── */
    case 'cube': {
      const s = H * 0.42;
      const o = H * 0.16;
      ctx.strokeRect(cx - s / 2, cy - s / 2 + o / 2, s, s);
      ctx.strokeRect(cx - s / 2 + o, cy - s / 2 - o / 2, s, s);
      line(ctx, cx - s / 2, cy - s / 2 + o / 2, cx - s / 2 + o, cy - s / 2 - o / 2);
      line(ctx, cx + s / 2, cy - s / 2 + o / 2, cx + s / 2 + o, cy - s / 2 - o / 2);
      line(ctx, cx - s / 2, cy + s / 2 + o / 2, cx - s / 2 + o, cy + s / 2 - o / 2);
      line(ctx, cx + s / 2, cy + s / 2 + o / 2, cx + s / 2 + o, cy + s / 2 - o / 2);
      break;
    }
    case 'sphere': {
      circle(ctx, cx, cy, H * 0.36, false);
      ctx.beginPath();
      ctx.ellipse(cx, cy, H * 0.36, H * 0.13, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy, H * 0.13, H * 0.36, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'orbit': {
      circle(ctx, cx, cy, H * 0.2, false);
      ctx.beginPath();
      ctx.ellipse(cx, cy, H * 0.42, H * 0.15, -0.5, 0, Math.PI * 2);
      ctx.stroke();
      circle(ctx, cx + H * 0.34, cy - H * 0.2, lw * 1.2);
      break;
    }
    case 'hex': {
      const rr2 = H * 0.4;
      const pts: number[][] = [];
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
        pts.push([cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2]);
      }
      poly(ctx, pts, true);
      ctx.stroke();
      poly(ctx, pts.map(([x, y]) => [cx + (x - cx) * 0.5, cy + (y - cy) * 0.5]), true);
      ctx.stroke();
      break;
    }
    case 'pyramid': {
      poly(ctx, [[cx, cy - H * 0.38], [cx - W * 0.26, cy + H * 0.26], [cx + W * 0.26, cy + H * 0.26]], true);
      ctx.stroke();
      line(ctx, cx, cy - H * 0.38, cx + W * 0.06, cy + H * 0.26);
      line(ctx, cx - W * 0.26, cy + H * 0.26, cx + W * 0.06, cy + H * 0.26);
      break;
    }
    case 'layers': {
      for (let i = -1; i <= 1; i += 1) {
        const y = cy + i * H * 0.22;
        poly(ctx, [[cx, y - H * 0.11], [cx + W * 0.26, y], [cx, y + H * 0.11], [cx - W * 0.26, y]], true);
        ctx.stroke();
      }
      break;
    }

    /* ── technical motifs ── */
    case 'gear': {
      circle(ctx, cx, cy, H * 0.24, false);
      circle(ctx, cx, cy, H * 0.09, false);
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * Math.PI * 2;
        line(
          ctx,
          cx + Math.cos(a) * H * 0.24,
          cy + Math.sin(a) * H * 0.24,
          cx + Math.cos(a) * H * 0.38,
          cy + Math.sin(a) * H * 0.38
        );
      }
      break;
    }
    case 'lock': {
      const w = H * 0.5;
      const h = H * 0.4;
      ctx.strokeRect(cx - w / 2, cy - h * 0.1, w, h);
      ctx.beginPath();
      ctx.arc(cx, cy - h * 0.1, w * 0.32, Math.PI, 0);
      ctx.stroke();
      circle(ctx, cx, cy + h * 0.32, lw * 1.1);
      break;
    }
    case 'cloud': {
      ctx.beginPath();
      ctx.arc(cx - H * 0.2, cy + H * 0.08, H * 0.16, Math.PI * 0.4, Math.PI * 1.5);
      ctx.arc(cx - H * 0.02, cy - H * 0.12, H * 0.2, Math.PI * 0.9, Math.PI * 1.95);
      ctx.arc(cx + H * 0.2, cy + H * 0.06, H * 0.15, Math.PI * 1.4, Math.PI * 0.6);
      ctx.closePath();
      ctx.stroke();
      break;
    }
    case 'globe': {
      circle(ctx, cx, cy, H * 0.36, false);
      line(ctx, cx - H * 0.36, cy, cx + H * 0.36, cy);
      ctx.beginPath();
      ctx.ellipse(cx, cy, H * 0.16, H * 0.36, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'bolt':
      poly(
        ctx,
        [
          [cx + H * 0.06, cy - H * 0.4],
          [cx - H * 0.22, cy + H * 0.06],
          [cx - H * 0.02, cy + H * 0.06],
          [cx - H * 0.06, cy + H * 0.4],
          [cx + H * 0.22, cy - H * 0.06],
          [cx + H * 0.02, cy - H * 0.06],
        ],
        true
      );
      ctx.fill();
      break;
    case 'antenna': {
      line(ctx, cx, cy + H * 0.38, cx, cy - H * 0.1);
      circle(ctx, cx, cy - H * 0.14, lw);
      ctx.beginPath();
      ctx.arc(cx, cy - H * 0.14, H * 0.16, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy - H * 0.14, H * 0.28, Math.PI * 1.2, Math.PI * 1.8);
      ctx.stroke();
      line(ctx, cx - H * 0.16, cy + H * 0.38, cx + H * 0.16, cy + H * 0.38);
      break;
    }
    case 'keyboard': {
      const w = W * 0.62;
      const h = H * 0.4;
      ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
      for (let i = 0; i < 8; i += 1)
        for (let j = 0; j < 2; j += 1)
          circle(ctx, cx - w * 0.4 + i * (w * 0.8 / 7), cy - h * 0.2 + j * h * 0.26, lw * 0.6);
      line(ctx, cx - w * 0.24, cy + h * 0.28, cx + w * 0.24, cy + h * 0.28);
      break;
    }
  }
}

export function SignatureName({
  text,
  reducedMotion = false,
  armed = true,
}: {
  text: string;
  reducedMotion?: boolean;
  /** False while the boot splash still covers the page, so the
     construction is not spent where nobody can see it. */
  armed?: boolean;
}) {
  const clusters = useMemo(() => segmentGraphemes(text), [text]);
  /* The animation effect deliberately does NOT re-run when the name
     changes: one persistent lifecycle retargets in place, so a language
     switch dissolves the old particle glyphs into the new ones instead of
     tearing the canvas down (which would flash). These refs hand the
     fresh text/clusters to the running frame loop. */
  const textRef = useRef(text);
  const clustersRef = useRef(clusters);
  textRef.current = text;
  clustersRef.current = clusters;
  const stageRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /* one ref per cluster, spaces included: their measured boxes are what
     make the sampled targets and the resolved glyphs coincide */
  const cellRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    if (reducedMotion || !armed) return;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    const T = MOTION.nameAssemble;
    stage.style.setProperty('--sig-resolve', `${T.resolveSeconds}s`);
    let cancelled = false;
    let raf = 0;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => {
      timers.push(
        window.setTimeout(() => {
          if (!cancelled) fn();
        }, ms)
      );
    };

    const giveUpToText = () => {
      stage.dataset.asm = 'done';
    };

    /* ── the living state machine ───────────────────────────────────
       forming  : the existing construction — dispersed field seats into
                  the wordmark, unchanged.
       nameHold : the completed name, readable, breathing gently.
       toForm   : detach → wide bounded spread → converge into a form.
       formHold : the form, held with depth shimmer + parallax.
       toName   : spread again → flow back into the name (this language).
       dissolve : a language retarget — old glyphs loosen and fade, then
                  the new field is sampled and forms.                    */
    let phase: 'forming' | 'nameHold' | 'toForm' | 'formHold' | 'toName' | 'dissolve' = 'forming';
    let particles: Particle[] = [];
    let builtText: string | null = null;
    let t0 = 0;
    let phaseT0 = 0;
    let dissolveT0 = 0;
    let hiddenAt = 0;
    let cycle = 0;
    let currentForm: FormId = 'code';
    let currentStyle: StyleId = 'radial';
    let lastStyle: StyleId = 'flow';
    let swirlDir = 1;
    let wavePh = 0;
    /* per-cycle choreography variety, seeded */
    let holdNameMs = NAME_HOLD_S * 1000;
    let holdFormMs = FORM_HOLD_S * 1000;
    let morphMs = MORPH_S * 1000;
    /* the morph phase runs until the LAST staggered particle has
       actually landed (morphMs is one particle's flight; staggered
       particles start later), so no cycle is ever cut mid-flight */
    let morphSpan = MORPH_S * 1000;
    let spreadScale = 1;
    /* geometry of the current field, in wordmark space */
    let W = 0;
    let H = 0;
    let ruleY = 0;
    let dot = 2;
    let fieldSeed = 1;
    /* stable anchor: the layer (positioned page container) box. The
       scatter field is centred on this and never on the text, so the
       composition cannot drift sideways between cycles or languages. */
    let scx = 0;
    let scy = 0;
    let srx = 0;
    let sry = 0;
    /* sampling geometry shared by name and form sampling */
    let dpr = 1;
    let cw = 1;
    let chh = 1;
    /* stage origin inside the layer, CSS px, plus the layer's CSS size */
    let ox = 0;
    let oy = 0;
    let cssW = 0;
    let cssH = 0;
    let edges: number[] = [];
    let clustersNow: string[] = [];
    let ramp: string[] = [];

    /* ── sample the rendered wordmark into a particle field ───────── */
    const build = (textNow: string, clustersIn: string[]) => {
      if (cancelled) return;
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return giveUpToText();

      const stageBox = stage.getBoundingClientRect();
      W = stageBox.width;
      H = stageBox.height;
      if (!(W > 4) || !(H > 4)) return giveUpToText();

      const layerBox = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, T.maxDpr);
      const maxArea = 4.0e6;
      const areaAt = (d: number) => layerBox.width * d * (layerBox.height * d);
      while (dpr > 1 && areaAt(dpr) > maxArea) dpr -= 0.25;
      cw = Math.max(1, Math.round(W * dpr));
      chh = Math.max(1, Math.round(H * dpr));

      const cs = window.getComputedStyle(stage);
      const fontStr = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const fontSize = parseFloat(cs.fontSize) || 64;

      const sample = document.createElement('canvas');
      sample.width = cw;
      sample.height = chh;
      const sctx = sample.getContext('2d', { alpha: true, willReadFrequently: true });
      if (!sctx) return giveUpToText();
      sctx.scale(dpr, dpr);
      sctx.font = fontStr;
      sctx.textBaseline = 'alphabetic';
      sctx.textAlign = 'left';
      sctx.fillStyle = '#ffffff';

      edges = [];
      ruleY = 0;
      clustersIn.forEach((cluster, i) => {
        const cell = cellRefs.current[i];
        if (!cell) {
          edges.push(0);
          return;
        }
        const r = cell.getBoundingClientRect();
        edges.push(r.left - stageBox.left);
        if (cluster === ' ') return;
        const m = sctx.measureText(cluster);
        const ascent =
          (typeof m.fontBoundingBoxAscent === 'number' && m.fontBoundingBoxAscent) ||
          (typeof m.actualBoundingBoxAscent === 'number' && m.actualBoundingBoxAscent) ||
          fontSize * 0.78;
        const descent =
          (typeof m.fontBoundingBoxDescent === 'number' && m.fontBoundingBoxDescent) ||
          (typeof m.actualBoundingBoxDescent === 'number' && m.actualBoundingBoxDescent) ||
          fontSize * 0.22;
        const baseline = baselineWithinBox(r.top - stageBox.top, r.height, ascent, descent);
        if (!ruleY) ruleY = baseline;
        sctx.fillText(cluster, r.left - stageBox.left, baseline);
      });
      if (!ruleY) ruleY = H * 0.78;

      const img = sctx.getImageData(0, 0, cw, chh).data;
      const baseStep = Math.max(1, Math.round(T.sampleStepPx * dpr));
      const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 0 : 0;
      const budget = particleBudget(W, cores, T.maxParticles);

      const countAt = (step: number) => {
        let n = 0;
        for (let y = 0; y < chh; y += step) {
          for (let x = 0; x < cw; x += step) {
            if (img[(y * cw + x) * 4 + 3] > 110) n += 1;
          }
        }
        return n;
      };
      const step = sampleStepFor(countAt(baseStep), baseStep, budget);

      const clusterOf = (xCss: number) => {
        let idx = 0;
        for (let i = 0; i < edges.length; i += 1) {
          if (xCss >= edges[i] - 0.5) idx = i;
        }
        return idx;
      };

      const rnd = mulberry32(hashSeed(textNow));
      fieldSeed = hashSeed(textNow);
      const next: Particle[] = [];
      const clusterCount = clustersIn.length;

      for (let y = 0; y < chh; y += step) {
        for (let x = 0; x < cw; x += step) {
          if (img[(y * cw + x) * 4 + 3] <= 110) continue;
          const tx = (x + step / 2) / dpr;
          const ty = (y + step / 2) / dpr;
          const o = disperseOrigin(tx, ty, W, H, rnd, T.disperseRadius);
          const ang = Math.atan2(ty - H / 2, tx - W / 2) + (rnd() - 0.5) * 1.6;
          next.push({
            tx, ty, ox: o.x, oy: o.y,
            at: startOffset(clusterOf(tx), clusterCount, rnd, T.clusterShare, T.jitterShare),
            dur: T.travelShare,
            ph1: rnd() * Math.PI * 2,
            ph2: rnd() * Math.PI * 2,
            ph3: rnd() * Math.PI * 2,
            wph: rnd(),
            bx: Math.cos(ang),
            by: Math.sin(ang),
            m0x: tx, m0y: ty, sx: tx, sy: ty, m1x: tx, m1y: ty,
            c0x: tx, c0y: ty, c1x: tx, c1y: ty,
            stg: 0, turb: 0, z: rnd(),
          });
        }
      }

      if (next.length === 0) return giveUpToText();

      particles = next;
      clustersNow = clustersIn;
      ramp = rampPalette(ASSEMBLE_INKS[0], LOCK_INK, RESOLVED_INK, RAMP_BUCKETS, WARM_AT);
      dot = Math.max(1.1, Math.min(2.3, W / 250));

      ox = stageBox.left - layerBox.left;
      oy = stageBox.top - layerBox.top;
      cssW = layerBox.width;
      cssH = layerBox.height;
      /* the controlled scatter field: centred on the stable layer box,
         bounded to stay inside it whatever the cycle variety says */
      scx = cssW / 2 - ox;
      scy = cssH / 2 - oy;
      srx = Math.max(60, cssW * 0.42);
      sry = Math.max(40, cssH * 0.4);
      canvas.width = Math.max(1, Math.round(cssW * dpr));
      canvas.height = Math.max(1, Math.round(cssH * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, ox * dpr, oy * dpr);
      stage.dataset.asm = 'run';
      builtText = textNow;
      cycle = 0;
      phase = 'forming';
    };

    /* ── sample a technical form into targets for the same field ──── */
    const formTargets = (form: FormId): Array<{ x: number; y: number }> => {
      const sample = document.createElement('canvas');
      sample.width = cw;
      sample.height = chh;
      const sctx = sample.getContext('2d', { alpha: true, willReadFrequently: true });
      if (!sctx) return [];
      sctx.scale(dpr, dpr);
      drawForm(sctx, form, W, H, fieldSeed + cycle * 0x9e3779b9);
      const img = sctx.getImageData(0, 0, cw, chh).data;
      const baseStep = Math.max(1, Math.round(2 * dpr));
      const countAt = (step: number) => {
        let n = 0;
        for (let y = 0; y < chh; y += step) {
          for (let x = 0; x < cw; x += step) {
            if (img[(y * cw + x) * 4 + 3] > 110) n += 1;
          }
        }
        return n;
      };
      const step = sampleStepFor(countAt(baseStep), baseStep, Math.max(240, particles.length));
      const pts: Array<{ x: number; y: number }> = [];
      for (let y = 0; y < chh; y += step) {
        for (let x = 0; x < cw; x += step) {
          if (img[(y * cw + x) * 4 + 3] > 110) pts.push({ x: (x + step / 2) / dpr, y: (y + step / 2) / dpr });
        }
      }
      return pts;
    };

    /* ── aim the whole field: origin → scatter → destination ──────── */
    const aimField = (toForm: boolean, now: number) => {
      const seed = (fieldSeed ^ Math.imul(cycle + 1, 0x85ebca6b)) >>> 0;
      const rnd = mulberry32(seed);
      /* per-cycle variety, bounded: spread, timing, turbulence */
      spreadScale = 0.8 + rnd() * 0.4;
      holdNameMs = (NAME_HOLD_S + (rnd() - 0.5) * 1.2) * 1000;
      holdFormMs = (FORM_HOLD_S + (rnd() - 0.5) * 0.7) * 1000;
      morphMs = (MORPH_S + (rnd() - 0.5) * 0.6) * 1000;
      /* transition style: seeded bag over the family, never twice in
         a row — NAME→spiral→A then NAME→wave→B, etc. */
      const sBagRnd = mulberry32((fieldSeed ^ 0x51ab3d) >>> 0);
      const sBag = [...STYLES];
      for (let i2 = sBag.length - 1; i2 > 0; i2 -= 1) {
        const j2 = Math.floor(sBagRnd() * (i2 + 1));
        [sBag[i2], sBag[j2]] = [sBag[j2], sBag[i2]];
      }
      let sIdx = (cycle * 2 + (toForm ? 0 : 1)) % sBag.length;
      if (sBag[sIdx] === lastStyle) sIdx = (sIdx + 1) % sBag.length;
      currentStyle = sBag[sIdx];
      lastStyle = currentStyle;
      swirlDir = rnd() < 0.5 ? -1 : 1;
      wavePh = rnd() * Math.PI * 2;
      if (toForm) {
        /* seeded shuffled bag over the whole library: no immediate
           repeat and no visible tiny loop */
        const bagRnd = mulberry32((fieldSeed ^ 0x2c1b3c6d) >>> 0);
        const bag = [...FORMS];
        for (let i = bag.length - 1; i > 0; i -= 1) {
          const j = Math.floor(bagRnd() * (i + 1));
          [bag[i], bag[j]] = [bag[j], bag[i]];
        }
        currentForm = bag[cycle % bag.length];
      }
      const pts = toForm ? formTargets(currentForm) : [];
      const n = particles.length;
      if (toForm && pts.length === 0) {
        phase = 'nameHold';
        phaseT0 = now;
        return;
      }
      const order = new Array<number>(n);
      for (let i = 0; i < n; i += 1) order[i] = i;
      for (let i = n - 1; i > 0; i -= 1) {
        const j = Math.floor(rnd() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      let stgMaxNow = 0;
      for (let i = 0; i < n; i += 1) {
        const p = particles[i];
        const fromX = toForm ? p.tx : p.m1x;
        const fromY = toForm ? p.ty : p.m1y;
        let toX: number;
        let toY: number;
        if (toForm) {
          const pt = pts[order[i] % pts.length];
          toX = pt.x;
          toY = pt.y;
        } else {
          toX = p.tx;
          toY = p.ty;
        }
        /* scatter waypoint on the bounded field — placement follows
           the cycle's transition family, so no two spreads read the
           same. All styles stay inside the elliptical boundary. */
        const tn = i / n;
        let sx = scx;
        let sy = scy;
        /* perspective keeps its own depth channel so waypoint radius
           and in-flight push share one z per particle */
        let zc = -1;
        if (currentStyle === 'radial') {
          const a = rnd() * Math.PI * 2;
          const rf = (0.55 + 0.45 * rnd()) * spreadScale;
          sx = scx + Math.cos(a) * srx * rf;
          sy = scy + Math.sin(a) * sry * rf;
        } else if (currentStyle === 'spiral') {
          const a = tn * Math.PI * 2 * 2.2 + swirlDir * 1.7;
          const rf = (0.3 + 0.7 * tn) * spreadScale;
          sx = scx + Math.cos(a) * srx * rf * 0.9;
          sy = scy + Math.sin(a) * sry * rf * 0.9;
        } else if (currentStyle === 'orbital') {
          const a = tn * Math.PI * 2 + (rnd() - 0.5) * 0.15;
          const rf = (0.8 + 0.15 * rnd()) * spreadScale;
          sx = scx + Math.cos(a) * srx * rf;
          sy = scy + Math.sin(a) * sry * rf;
        } else if (currentStyle === 'wave') {
          const x = (tn * 2 - 1) * srx * 0.92 * spreadScale;
          sx = scx + x;
          sy = scy + Math.sin(tn * Math.PI * 3 + wavePh) * sry * 0.5 * spreadScale + (rnd() - 0.5) * 8;
        } else if (currentStyle === 'sweep') {
          sx = scx + (tn * 2 - 1) * srx * 0.9 * spreadScale;
          sy = scy + (rnd() - 0.5) * sry * 0.7 * spreadScale;
        } else if (currentStyle === 'clusters') {
          const ca = [0.6, 2.7, 4.6][i % 3];
          sx = scx + Math.cos(ca) * srx * 0.55 * spreadScale + (rnd() - 0.5) * srx * 0.22;
          sy = scy + Math.sin(ca) * sry * 0.55 * spreadScale + (rnd() - 0.5) * sry * 0.22;
        } else if (currentStyle === 'depth') {
          const a = rnd() * Math.PI * 2;
          const rf = (0.15 + 0.35 * rnd()) * spreadScale;
          sx = scx + Math.cos(a) * srx * rf;
          sy = scy + Math.sin(a) * sry * rf;
        } else if (currentStyle === 'vortex') {
          /* double spiral — two interlocked arms, opposite phase */
          const arm = i % 2;
          const a = swirlDir * (tn * Math.PI * 2 * 2.4) + arm * Math.PI + 1.1;
          const rf = (0.32 + 0.66 * tn) * spreadScale;
          sx = scx + Math.cos(a) * srx * rf * 0.92;
          sy = scy + Math.sin(a) * sry * rf * 0.92;
        } else if (currentStyle === 'ripple') {
          /* shockwave: four concentric rings outward from the core */
          const k = i % 4;
          const a = tn * Math.PI * 8 + k * 0.9 + wavePh;
          const rf = (0.28 + 0.22 * k) * spreadScale;
          sx = scx + Math.cos(a) * srx * rf;
          sy = scy + Math.sin(a) * sry * rf;
        } else if (currentStyle === 'fragment') {
          /* shatter: the field breaks into tight shards, then recombines */
          const k = i % 4;
          const fa = 0.55 + k * 1.57 + wavePh * 0.3;
          const fr = (0.5 + 0.06 * k) * spreadScale;
          sx = scx + Math.cos(fa) * srx * fr + (rnd() - 0.5) * srx * 0.16;
          sy = scy + Math.sin(fa) * sry * fr + (rnd() - 0.5) * sry * 0.16;
        } else if (currentStyle === 'perspective') {
          /* depth push: near particles hold inward, far ones flung out */
          zc = rnd();
          const a = rnd() * Math.PI * 2;
          const rf = (0.18 + 0.82 * zc) * spreadScale;
          sx = scx + Math.cos(a) * srx * rf;
          sy = scy + Math.sin(a) * sry * rf;
        } else if (currentStyle === 'layered') {
          /* three horizontal bands emerge, top to bottom */
          const band = i % 3;
          sx = scx + (rnd() * 2 - 1) * srx * 0.88 * spreadScale;
          sy = scy + (band - 1) * sry * 0.5 * spreadScale + (rnd() - 0.5) * sry * 0.12;
        } else {
          /* flow: a smooth horizontal field with a sine current */
          const x = (rnd() * 2 - 1) * srx * 0.9 * spreadScale;
          sx = scx + x;
          sy = scy + Math.sin(x * 0.018 + wavePh) * sry * 0.38 * spreadScale + (rnd() - 0.5) * sry * 0.2;
        }
        /* curved controls per leg: midpoint + perpendicular bend */
        const bend0 = (rnd() - 0.5) * 0.7 * Math.min(120, Math.hypot(sx - fromX, sy - fromY) * 0.5);
        const bend1 = (rnd() - 0.5) * 0.7 * Math.min(120, Math.hypot(toX - sx, toY - sy) * 0.5);
        p.m0x = fromX; p.m0y = fromY;
        p.sx = sx; p.sy = sy;
        p.m1x = toX; p.m1y = toY;
        p.c0x = (fromX + sx) / 2 + (-(sy - fromY) / (Math.hypot(sx - fromX, sy - fromY) || 1)) * bend0;
        p.c0y = (fromY + sy) / 2 + ((sx - fromX) / (Math.hypot(sx - fromX, sy - fromY) || 1)) * bend0;
        p.c1x = (sx + toX) / 2 + (-(toY - sy) / (Math.hypot(toX - sx, toY - sy) || 1)) * bend1;
        p.c1y = (sy + toY) / 2 + ((toX - sx) / (Math.hypot(toX - sx, toY - sy) || 1)) * bend1;
        p.stg = currentStyle === 'sweep' ? tn * 0.22
          : currentStyle === 'orbital' ? tn * 0.15
          : currentStyle === 'vortex' ? tn * 0.18
          : currentStyle === 'ripple' ? (i % 4) * 0.06
          : currentStyle === 'fragment' ? (i % 4) * 0.05
          : currentStyle === 'layered' ? (i % 3) * 0.09
          : rnd() * 0.12;
        if (p.stg > stgMaxNow) stgMaxNow = p.stg;
        p.turb = (rnd() - 0.5) * (currentStyle === 'depth' ? 16 : currentStyle === 'fragment' ? 14 : 10);
        p.z = zc >= 0 ? zc : rnd();
      }
      /* run the phase until the last staggered particle lands */
      morphSpan = morphMs * (1 + stgMaxNow);
      phase = toForm ? 'toForm' : 'toName';
      phaseT0 = now;
    };

    /* position along the two-leg morph for one particle */
    const morphPos = (p: Particle, u0: number): { x: number; y: number } => {
      const u = clamp01(u0 - p.stg);
      if (u <= SPREAD_AT) {
        const e = easeOut(u / SPREAD_AT);
        return { x: quad(p.m0x, p.c0x, p.sx, e), y: quad(p.m0y, p.c0y, p.sy, e) };
      }
      const e = easeInOut((u - SPREAD_AT) / (1 - SPREAD_AT));
      let x = quad(p.sx, p.c1x, p.m1x, e);
      let y = quad(p.sy, p.c1y, p.m1y, e);
      /* family-specific flight character on top of the two legs */
      const flight = Math.sin(Math.PI * u);
      if (currentStyle === 'spiral' || currentStyle === 'orbital' || currentStyle === 'vortex') {
        const dx = x - scx;
        const dy = y - scy;
        /* vortex co-rotates harder than the single-arm families */
        const ang = swirlDir * (currentStyle === 'vortex' ? 0.55 : 0.35) * flight;
        const cos = Math.cos(ang);
        const sin = Math.sin(ang);
        x = scx + dx * cos - dy * sin;
        y = scy + dx * sin + dy * cos;
      } else if (currentStyle === 'wave') {
        y += Math.sin(u * Math.PI * 2 + p.ph1) * 6 * flight;
      } else if (currentStyle === 'ripple') {
        y += Math.cos(u * Math.PI * 3 + p.ph1) * 5 * flight;
      } else if (currentStyle === 'depth') {
        const k = 1 + 0.3 * flight * p.z;
        x = scx + (x - scx) * k;
        y = scy + (y - scy) * k;
      } else if (currentStyle === 'perspective') {
        /* strong z-burst: far particles rush past the frame plane */
        const k = 1 + 0.5 * flight * p.z;
        x = scx + (x - scx) * k;
        y = scy + (y - scy) * k;
      }
      return { x, y };
    };

    const frame = (now: number) => {
      raf = 0;
      if (cancelled) return;
      if (document.hidden) {
        if (!hiddenAt) hiddenAt = now;
        return;
      }
      if (hiddenAt) {
        t0 += now - hiddenAt;
        phaseT0 += now - hiddenAt;
        dissolveT0 += now - hiddenAt;
        hiddenAt = 0;
      }

      /* a language changed while we were living: dissolve, then rebuild */
      if (phase !== 'dissolve' && builtText !== null && builtText !== textRef.current) {
        phase = 'dissolve';
        dissolveT0 = now;
      }

      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return;
      ctx.clearRect(-ox - 4, -oy - 4, cssW + 8, cssH + 8);

      if (phase === 'dissolve') {
        const prog = Math.min(1, (now - dissolveT0) / (T.dissolveSeconds * 1000));
        const ease = prog * prog * (3 - 2 * prog);
        const buckets: Path2D[] = [];
        for (let b = 0; b < RAMP_BUCKETS; b += 1) buckets.push(new Path2D());
        for (let i = 0; i < particles.length; i += 1) {
          const p = particles[i];
          const x = p.tx + p.bx * ease * 16;
          const y = p.ty + p.by * ease * 16;
          const s = dot * (1 + 0.35 * ease);
          buckets[bucketFor(1, RAMP_BUCKETS - (i % 3))].rect(x - s / 2, y - s / 2, s, s);
        }
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 1 - ease;
        for (let b = 0; b < RAMP_BUCKETS; b += 1) {
          ctx.fillStyle = ramp[b];
          ctx.fill(buckets[b]);
        }
        ctx.globalAlpha = 1;
        if (prog >= 1) build(textRef.current, clustersRef.current);
        raf = requestAnimationFrame(frame);
        return;
      }

      const ts = (now - t0) / 1000;
      const totalMs = T.totalSeconds * 1000;
      const t = (now - t0) / totalMs;

      /* ── phase advances ── */
      if (phase === 'forming' && t >= 1) {
        phase = 'nameHold';
        phaseT0 = now;
      } else if (phase === 'nameHold' && now - phaseT0 > holdNameMs) {
        aimField(true, now);
      } else if (phase === 'toForm' && now - phaseT0 > morphSpan) {
        phase = 'formHold';
        phaseT0 = now;
      } else if (phase === 'formHold' && now - phaseT0 > holdFormMs) {
        aimField(false, now);
      } else if (phase === 'toName' && now - phaseT0 > morphSpan) {
        phase = 'nameHold';
        phaseT0 = now;
        cycle += 1;
      }

      const guideFade = phase === 'forming' ? Math.max(0, 1 - t / T.guideShare) : 0;
      if (guideFade > 0.01) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = 1;
        const gy = Math.round(ruleY) + 0.5;
        ctx.strokeStyle = `rgba(34,197,94,${(0.2 * guideFade).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(W, gy);
        ctx.stroke();
        ctx.strokeStyle = `rgba(165,180,252,${(0.34 * guideFade).toFixed(3)})`;
        ctx.beginPath();
        edges.forEach((bx, i) => {
          if (clustersNow[i] === ' ') return;
          const gx = Math.round(bx) + 0.5;
          ctx.moveTo(gx, ruleY - 3.5);
          ctx.lineTo(gx, ruleY + 3.5);
        });
        ctx.stroke();
      }

      ctx.globalCompositeOperation = 'lighter';
      const waiting = new Path2D();
      const buckets: Path2D[] = [];
      for (let b = 0; b < RAMP_BUCKETS; b += 1) buckets.push(new Path2D());

      const morphing = phase === 'toForm' || phase === 'toName';
      const mU = morphing ? (now - phaseT0) / morphMs : 0;

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        let x = 0;
        let y = 0;
        let s = dot;
        let lc = 1;

        if (phase === 'forming') {
          const local = (t - p.at) / p.dur;
          if (local <= 0) {
            const ws = dot * 0.75;
            waiting.rect(p.ox - ws / 2, p.oy - ws / 2, ws, ws);
            continue;
          }
          const lcc = local > 1 ? 1 : local;
          const e = easeOutSettle(lcc, T.settleBack);
          x = p.ox + (p.tx - p.ox) * e;
          y = p.oy + (p.ty - p.oy) * e;
          if (local >= 1) {
            const q = Math.min(1, (local - 1) / 0.25);
            x += T.microPx * q * Math.sin(ts * 1.7 + p.ph1);
            y += T.microPx * q * Math.cos(ts * 1.3 + p.ph2);
            const c = (ts / T.breathSeconds + p.wph) % 1;
            if (c < T.breathWindow) {
              const env = Math.sin(Math.PI * (c / T.breathWindow));
              const slow = 0.6 + 0.4 * Math.sin(ts * 0.35 + p.ph3);
              const amp = T.breathPx * env * slow * q;
              x += p.bx * amp;
              y += p.by * amp;
            }
          }
          lc = lcc;
          s = dot * (1.5 - 0.5 * lcc);
          if (lcc > 0.12 && lcc < 0.78) {
            const bx2 = x + (p.ox - x) * 0.22;
            const by2 = y + (p.oy - y) * 0.22;
            buckets[bucketFor(lc, RAMP_BUCKETS)].rect(bx2 - s * 0.3, by2 - s * 0.3, s * 0.6, s * 0.6);
          }
        } else if (phase === 'nameHold') {
          x = p.tx + T.microPx * Math.sin(ts * 1.7 + p.ph1);
          y = p.ty + T.microPx * Math.cos(ts * 1.3 + p.ph2);
          const c = (ts / T.breathSeconds + p.wph) % 1;
          if (c < T.breathWindow) {
            const env = Math.sin(Math.PI * (c / T.breathWindow));
            const slow = 0.6 + 0.4 * Math.sin(ts * 0.35 + p.ph3);
            x += p.bx * T.breathPx * env * slow;
            y += p.by * T.breathPx * env * slow;
          }
          lc = 1;
          s = dot;
        } else if (morphing) {
          const pos = morphPos(p, mU);
          x = pos.x;
          y = pos.y;
          /* bounded turbulence while genuinely in flight */
          const flight = Math.sin(Math.PI * clamp01(mU));
          x += Math.sin(ts * 2.1 + p.ph1) * p.turb * flight * 0.4;
          y += Math.cos(ts * 1.7 + p.ph2) * p.turb * flight * 0.4;
          /* per-particle arrival: size and ink ease into the values the
             next hold phase uses, so the phase switch is seamless —
             no size pop, no brightness pop, no cut-off look */
          const ue = clamp01(mU - p.stg);
          const pf = Math.sin(Math.PI * ue);
          const arrive = ue <= SPREAD_AT ? 0 : easeInOut((ue - SPREAD_AT) / (1 - SPREAD_AT));
          const flyS = dot * (1.0 + 0.5 * p.z) * (1 + 0.3 * pf);
          if (phase === 'toForm') {
            const holdS = dot * (0.85 + 0.6 * p.z);
            s = flyS + (holdS - flyS) * arrive;
            const holdLc = 0.55 + 0.45 * p.z;
            lc = (1 - 0.75 * clamp01(mU)) * (1 - arrive) + holdLc * arrive;
          } else {
            s = flyS + (dot - flyS) * arrive;
            lc = 0.25 + 0.75 * clamp01(mU);
          }
        } else {
          /* formHold: seated on the form with dimensional shimmer */
          x = p.m1x + T.microPx * 0.8 * Math.sin(ts * 1.4 + p.ph1) + (p.z - 0.5) * 3.2 * Math.sin(ts * 0.5);
          y = p.m1y + T.microPx * 0.8 * Math.cos(ts * 1.1 + p.ph2) + (p.z - 0.5) * 2.2 * Math.cos(ts * 0.42);
          s = dot * (0.85 + 0.6 * p.z);
          lc = 0.55 + 0.45 * p.z;
        }

        buckets[bucketFor(lc, RAMP_BUCKETS)].rect(x - s / 2, y - s / 2, s, s);
      }

      ctx.fillStyle = WAITING_INK;
      ctx.fill(waiting);
      for (let b = 0; b < RAMP_BUCKETS; b += 1) {
        ctx.fillStyle = ramp[b];
        ctx.fill(buckets[b]);
      }

      raf = requestAnimationFrame(frame);
    };

    const resume = () => {
      if (cancelled) return;
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (cancelled) return;
      build(textRef.current, clustersRef.current);
      if (!raf) {
        raf = requestAnimationFrame((now) => {
          t0 = now;
          phaseT0 = now;
          dissolveT0 = now;
          frame(now);
        });
      }
    };

    const withFonts = () => {
      if (cancelled) return;
      try {
        const cs = window.getComputedStyle(stage);
        const fontStr = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const loaded = document.fonts?.load(fontStr, textRef.current);
        if (loaded && typeof loaded.then === 'function') {
          loaded.then(() => document.fonts.ready).then(start, start);
        } else {
          start();
        }
      } catch {
        start();
      }
    };

    const onVisibility = () => {
      if (cancelled) return;
      if (document.hidden) return;
      resume();
    };

    withFonts();
    /* watchdog: if the font pipeline never resolves and no field was ever
       sampled, the real DOM text is the accessible, legible answer */
    later(() => {
      if (!builtText) giveUpToText();
    }, 5000);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      timers.forEach((id) => window.clearTimeout(id));
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.width = 0;
      canvas.height = 0;
      delete stage.dataset.asm;
      stage.style.removeProperty('--sig-resolve');
    };
  }, [reducedMotion, armed]);

  /* The stage is decoration; the accessible name is the sr-only copy —
     always the correct spelling, in the current language. */
  return (
    <span className={`sig-name${reducedMotion ? ' sig-static' : ''}`}>
      <span className="sr-only">{text}</span>
      <span className="sig-stage" aria-hidden="true" ref={stageRef}>
        <span className="sig-glyphs">
          {clusters.map((ch, i) => (
            <span
              key={`g-${i}`}
              ref={(el) => {
                cellRefs.current[i] = el;
              }}
              className={ch === ' ' ? 'sig-space' : 'sig-cell'}
              style={ch === ' ' ? undefined : ({ '--ink': INKS[i % INKS.length] } as CSSProperties)}
            >
              {ch === ' ' ? '\u00A0' : ch}
            </span>
          ))}
        </span>
        <canvas className="sig-canvas" ref={canvasRef} />
      </span>
    </span>
  );
}
