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
               → converge into a TECHNICAL FORM A (hold 1.6–2.3s)
               → reorganise in place into FORM B (hold)
               → spread again → NAME → hold → next chain → …

   Every morph is two curved legs through a seeded scatter field, so
   material visibly leaves the name, occupies a larger controlled
   region, then reorganises — emergence rather than interpolation.
   Form→form morphs arc tighter and pair particles by angle around
   the field centre, so the SAME field is seen becoming the next
   silhouette — never a cut between unrelated scenes.
   The scatter centre and radii derive from the *layer* box (the
   stable positioned page container), never from the text, so the
   identity container cannot jump or shift between languages or
   cycles; only pixels inside the canvas move.

   The form library is a curated collection of 42 technical motifs
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
  denseStepFor,
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

/** The curated form library — cycled by a seeded bag, never all at once.
    Every entry is a recognizable semantic silhouette (software,
    computing, AI, systems, Android, science/space) — no abstract
    filler: the generic geometry that said nothing (arch, pyramid,
    hex, sphere, robot, bolt, layers) was retired in favour of the
    science/space and accelerator vocabulary. */
/* The canonical vocabulary — 25 symbols derived from the actual
   Services pages (app/services-content.ts is the source of truth),
   one per real capability:
   website development → code, git, server, monitor, doc ·
   custom software → braces, terminal, database, android, chip,
     circuit, gpu, npu, neural, aigraph, gear (Kotlin/Flutter,
     Python/Shell CLI, C/C++/JNI on ARM64, SQLite, llama.cpp/GGUF
     on-device AI, GitHub Actions) ·
   computer support → linux, network (Windows/Linux, remote sessions) ·
   android support → phone (ADB, Termux, device tuning) ·
   small-business technology → sheet, folder (spreadsheet systems,
     local records) ·
   office administration → printer, check (operations, reporting) ·
   graphics design → palette · data entry → keyboard.
   Never removed, never redefined per cycle. */
const CANON_FORMS = [
  'code', 'braces', 'terminal', 'git', 'database',
  'chip', 'gpu', 'npu', 'circuit', 'server',
  'linux', 'android', 'phone', 'monitor', 'network',
  'doc', 'folder', 'sheet', 'printer', 'check',
  'neural', 'aigraph', 'gear', 'palette', 'keyboard',
] as const;
/* Supporting forms: occasional guests (~1 excursion in 6) sharing the
   SAME canonical particle population — ambient technical and orbital
   motifs between the service symbols, never a second system. */
const SUPPORT_FORMS = [
  'binary', 'matrix', 'flow', 'orbit', 'globe', 'starfield',
  'constellation', 'satellite', 'galaxy', 'starsystem',
] as const;
const FORMS = [...CANON_FORMS, ...SUPPORT_FORMS] as const;
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
const ell = (ctx: Ctx, x: number, y: number, rx: number, ry: number) => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
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

    /* ── systems / computing ── */
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
    case 'gpu':
    case 'npu': {
      /* the two accelerators share the die-with-pins body; the label
         keeps them apart as semantic identities */
      const s = H * 0.5;
      const pin = H * 0.12;
      ctx.strokeRect(cx - s / 2, cy - s / 2, s, s);
      for (let i = 0; i < 3; i += 1) {
        const o = (i - 1) * s * 0.34;
        line(ctx, cx + o, cy - s / 2, cx + o, cy - s / 2 - pin);
        line(ctx, cx + o, cy + s / 2, cx + o, cy + s / 2 + pin);
      }
      txt(ctx, form === 'gpu' ? 'GPU' : 'NPU', cx, cy + s * 0.2, s * 0.46);
      break;
    }
    case 'monitor': {
      /* terminal on a stand with a prompt line inside */
      const w = W * 0.7;
      const h = H * 0.48;
      ctx.strokeRect(cx - w / 2, cy - h / 2 - H * 0.06, w, h);
      txt(ctx, '>_', cx - w * 0.24, cy - H * 0.02, h * 0.4);
      line(ctx, cx, cy + h / 2 - H * 0.06, cx, cy + h / 2 + H * 0.05);
      line(ctx, cx - w * 0.16, cy + h / 2 + H * 0.07, cx + w * 0.16, cy + h / 2 + H * 0.07);
      break;
    }
    case 'binary': {
      /* data pattern: columns of 0s and 1s, seeded but glyph-real */
      const rnd = mulberry32(seed);
      const s = H * 0.2;
      for (let c = 0; c < 4; c += 1)
        for (let r = 0; r < 3; r += 1)
          txt(ctx, rnd() < 0.5 ? '0' : '1', W * (0.16 + c * 0.23), H * (0.2 + r * 0.3), s);
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
    case 'linux': {
      /* Tux: body, belly, head, beak, feet — the Linux mark */
      const bw = W * 0.22;
      const bh = H * 0.34;
      ell(ctx, cx, cy + H * 0.08, bw, bh);
      ell(ctx, cx, cy + H * 0.14, bw * 0.52, bh * 0.56);
      circle(ctx, cx, cy - H * 0.3, H * 0.15, false);
      poly(ctx, [
        [cx - H * 0.04, cy - H * 0.28],
        [cx + H * 0.1, cy - H * 0.255],
        [cx - H * 0.04, cy - H * 0.23],
      ]);
      ctx.stroke();
      line(ctx, cx - bw * 0.7, cy + H * 0.44, cx - bw * 0.1, cy + H * 0.44);
      line(ctx, cx + bw * 0.1, cy + H * 0.44, cx + bw * 0.7, cy + H * 0.44);
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

    /* ── documents & records ── */
    case 'doc': {
      /* file: sheet with a folded corner and text rules */
      const w = W * 0.4;
      const h = H * 0.6;
      const f = w * 0.26;
      poly(ctx, [
        [cx - w / 2, cy - h / 2], [cx + w / 2 - f, cy - h / 2],
        [cx + w / 2, cy - h / 2 + f], [cx + w / 2, cy + h / 2],
        [cx - w / 2, cy + h / 2],
      ], true);
      ctx.stroke();
      line(ctx, cx + w / 2 - f, cy - h / 2, cx + w / 2, cy - h / 2 + f);
      for (let i = 0; i < 2; i += 1)
        line(ctx, cx - w * 0.3, cy + i * h * 0.17, cx + w * 0.3, cy + i * h * 0.17);
      break;
    }
    case 'folder': {
      /* records folder: tabbed sleeve */
      const w = W * 0.56;
      const h = H * 0.42;
      const t = cy - h / 2;
      poly(ctx, [
        [cx - w / 2, t], [cx - w * 0.1, t],
        [cx + w * 0.02, t + h * 0.2], [cx - w / 2, t + h * 0.2],
      ], true);
      ctx.stroke();
      ctx.strokeRect(cx - w / 2, t + h * 0.2, w, h * 0.8);
      break;
    }
    case 'sheet': {
      /* spreadsheet: header row, column rules, data grid */
      const w = W * 0.56;
      const h = H * 0.5;
      const x = cx - w / 2;
      const y = cy - h / 2;
      ctx.strokeRect(x, y, w, h);
      line(ctx, x, y + h * 0.26, x + w, y + h * 0.26);
      line(ctx, x + w / 2, y, x + w / 2, y + h);
      line(ctx, x, y + h * 0.63, x + w, y + h * 0.63);
      break;
    }
    case 'printer': {
      /* printer: paper in, body, sheet out */
      const w = W * 0.58;
      const h = H * 0.26;
      ctx.strokeRect(cx - w * 0.28, cy - h / 2 - H * 0.16, w * 0.56, H * 0.16);
      ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
      ctx.strokeRect(cx - w * 0.24, cy + h / 2, w * 0.48, H * 0.18);
      line(ctx, cx - w * 0.12, cy + h / 2 + H * 0.09, cx + w * 0.12, cy + h / 2 + H * 0.09);
      break;
    }
    case 'check': {
      /* clipboard checklist: board, clip, ticked rows */
      const w = W * 0.42;
      const h = H * 0.58;
      ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
      ctx.strokeRect(cx - w * 0.15, cy - h / 2 - H * 0.045, w * 0.3, H * 0.07);
      for (let i = 0; i < 3; i += 1) {
        const y = cy - h * 0.18 + i * h * 0.28;
        poly(ctx, [
          [cx - w * 0.3, y],
          [cx - w * 0.2, y + H * 0.045],
          [cx - w * 0.08, y - H * 0.045],
        ]);
        ctx.stroke();
        line(ctx, cx + w * 0.04, y, cx + w * 0.3, y);
      }
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
    case 'aigraph': {
      /* intelligence graph: core hub, six ring nodes, chord links —
         distinct from the layered 'neural' net and the mesh 'network' */
      const ring: number[][] = [];
      for (let i = 0; i < 6; i += 1) {
        const a = ((i + 0.5) / 6) * Math.PI * 2;
        ring.push([cx + Math.cos(a) * W * 0.26, cy + Math.sin(a) * H * 0.34]);
      }
      for (let i = 0; i < 6; i += 1) {
        line(ctx, cx, cy, ring[i][0], ring[i][1]);
        const j = (i + 2) % 6;
        line(ctx, ring[i][0], ring[i][1], ring[j][0], ring[j][1]);
      }
      circle(ctx, cx, cy, H * 0.09);
      for (const [x, y] of ring) circle(ctx, x, y, lw * 1.15);
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

    /* ── geometric / orbital ── */
    case 'orbit': {
      circle(ctx, cx, cy, H * 0.2, false);
      ctx.beginPath();
      ctx.ellipse(cx, cy, H * 0.42, H * 0.15, -0.5, 0, Math.PI * 2);
      ctx.stroke();
      circle(ctx, cx + H * 0.34, cy - H * 0.2, lw * 1.2);
      break;
    }
    /* ── science / space — real silhouettes, seeded, never blobs ── */
    case 'galaxy': {
      /* two logarithmic spiral arms around a lit core, vertically
         inclined like a tilted disc, plus a sparse seeded star halo */
      ctx.beginPath();
      for (let arm = 0; arm < 2; arm += 1)
        for (let i = 0; i <= 26; i += 1) {
          const th = (i / 26) * Math.PI * 2.2;
          const r = H * 0.055 * Math.exp(0.3 * th);
          const x = cx + Math.cos(th + arm * Math.PI) * r;
          const y = cy + Math.sin(th + arm * Math.PI) * r * 0.68;
          if (i) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        }
      ctx.stroke();
      circle(ctx, cx, cy, H * 0.075);
      const rnd = mulberry32(seed);
      for (let i = 0; i < 10; i += 1) {
        const a = rnd() * Math.PI * 2;
        const r = H * (0.14 + rnd() * 0.3);
        circle(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.68, lw * (0.4 + rnd() * 0.5));
      }
      break;
    }
    case 'starfield': {
      const rnd = mulberry32(seed);
      for (let i = 0; i < 26; i += 1) {
        const x = W * (0.06 + rnd() * 0.88);
        const y = H * (0.08 + rnd() * 0.84);
        const r = lw * (0.4 + rnd() * 0.9);
        circle(ctx, x, y, r);
        /* every fourth star gets diffraction spikes: the field reads
           as depth, not as uniform noise */
        if (i % 4) continue;
        line(ctx, x - r * 2.6, y, x + r * 2.6, y);
        line(ctx, x, y - r * 2.6, x, y + r * 2.6);
      }
      break;
    }
    case 'constellation': {
      const rnd = mulberry32(seed);
      const pts: number[][] = [];
      for (let i = 0; i < 7; i += 1) pts.push([W * (0.12 + rnd() * 0.76), H * (0.14 + rnd() * 0.72)]);
      poly(ctx, pts);
      ctx.stroke();
      for (const [x, y] of pts) circle(ctx, x, y, lw * (0.8 + rnd() * 0.6));
      break;
    }
    case 'starsystem': {
      circle(ctx, cx, cy, H * 0.1);
      ctx.beginPath();
      ctx.ellipse(cx, cy, H * 0.26, H * 0.1, -0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy, H * 0.44, H * 0.17, -0.3, 0, Math.PI * 2);
      ctx.stroke();
      circle(ctx, cx + H * 0.23, cy - H * 0.12, lw * 1.1);
      circle(ctx, cx - H * 0.4, cy + H * 0.15, lw * 1.3);
      break;
    }
    case 'satellite': {
      const b = H * 0.26;
      ctx.strokeRect(cx - b / 2, cy - b / 2, b, b);
      ctx.strokeRect(cx - b * 2, cy - b * 0.36, b * 1.15, b * 0.72);
      ctx.strokeRect(cx + b * 0.85, cy - b * 0.36, b * 1.15, b * 0.72);
      line(ctx, cx - b * 0.85, cy, cx - b / 2, cy);
      line(ctx, cx + b / 2, cy, cx + b * 0.85, cy);
      line(ctx, cx, cy - b / 2, cx, cy - b * 1.15);
      break;
    }
    /* ── services: design & data work ── */
    case 'palette': {
      /* graphics design: painter's palette, paint wells, thumb hole */
      circle(ctx, cx, cy, H * 0.38, false);
      for (let i = 0; i < 4; i += 1) {
        const a = -2.4 + i * 0.85;
        circle(ctx, cx + Math.cos(a) * W * 0.24, cy + Math.sin(a) * H * 0.24, lw * 0.85);
      }
      circle(ctx, cx - W * 0.16, cy + H * 0.2, H * 0.07, false);
      break;
    }
    case 'keyboard': {
      /* data entry: key deck with a space bar */
      const w = W * 0.62;
      const h = H * 0.4;
      ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
      for (let i = 0; i < 8; i += 1)
        for (let j = 0; j < 2; j += 1)
          circle(ctx, cx - w * 0.4 + i * ((w * 0.8) / 7), cy - h * 0.2 + j * h * 0.26, lw * 0.6);
      line(ctx, cx - w * 0.24, cy + h * 0.28, cx + w * 0.24, cy + h * 0.28);
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
    case 'globe': {
      circle(ctx, cx, cy, H * 0.36, false);
      line(ctx, cx - H * 0.36, cy, cx + H * 0.36, cy);
      ctx.beginPath();
      ctx.ellipse(cx, cy, H * 0.16, H * 0.36, 0, 0, Math.PI * 2);
      ctx.stroke();
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
    /* transform-unrest guard: deferred re-measure while the page turn
       animates (see build) */
    let calmRaf = 0;
    let calmTries = 0;
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
       toForm   : detach → bounded spread → converge into a form; the
                  same phase also carries form→form chains (tighter
                  arc, angle-sorted particle correspondence).
       formHold : the form, held with depth shimmer + parallax; when a
                  chained form remains, the field morphs straight into
                  it instead of returning to the name first.
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
    /* how many more forms this excursion chains before returning to
       the name, and a cursor through the seeded form bag so a chain
       never repeats a form back-to-back */
    let formsLeft = 0;
    let formCursor = 0;
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
    const build = (textNow: string, clustersIn: string[]): boolean => {
      if (cancelled) return true;
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) {
        giveUpToText();
        return true;
      }

      const stageBox = stage.getBoundingClientRect();
      W = stageBox.width;
      H = stageBox.height;
      if (!(W > 4) || !(H > 4)) {
        giveUpToText();
        return true;
      }

      const layerBox = canvas.getBoundingClientRect();
      /* determinism guard: while the pager's page turn is animating,
         its y/rotateX/scale transforms distort every rect — sampling
         mid-turn bakes the animation offset into the field geometry
         and the name lands displaced until a refresh (returning to
         the homepage must give the same geometry as reloading it).
         Translation cannot fool the check: it shifts stage and layer
         rects alike, while scale/rotateX make rect ≠ layout offset.
         Wait for calm, then measure; after ~2 s of unrest, sample
         anyway rather than never. */
      const unset = (r: DOMRect, el: HTMLElement) =>
        Math.abs(r.width - el.offsetWidth) < 0.75 &&
        Math.abs(r.height - el.offsetHeight) < 0.75;
      const calm = unset(stageBox, stage) && unset(layerBox, canvas);
      if (!calm && calmTries < 120) {
        calmTries += 1;
        if (!calmRaf)
          calmRaf = requestAnimationFrame(() => {
            calmRaf = 0;
            if (build(textNow, clustersIn)) startLoop();
          });
        return false;
      }
      calmTries = 0;
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
      if (!sctx) {
        giveUpToText();
        return true;
      }
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
      const step = denseStepFor(countAt(baseStep), baseStep, budget);

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

      if (next.length === 0) {
        giveUpToText();
        return true;
      }

      particles = next;
      clustersNow = clustersIn;
      ramp = rampPalette(ASSEMBLE_INKS[0], LOCK_INK, RESOLVED_INK, RAMP_BUCKETS, WARM_AT);
      dot = Math.max(1.1, Math.min(2.3, W / 250));

      ox = stageBox.left - layerBox.left;
      oy = stageBox.top - layerBox.top;
      cssW = layerBox.width;
      cssH = layerBox.height;
      /* the controlled scatter field: centred horizontally on the
         stable layer box, but vertically owned by the wordmark stage —
         the field spreads inside a band around the name, never down
         across the hero copy below it. The radii are clamped so the
         widest cycle spread (plus curve bend and turbulence) cannot
         reach the canvas edge: a transition can never be clipped by
         an invisible wall mid-flight. */
      scx = cssW / 2 - ox;
      scy = H * 0.5;
      srx = Math.max(60, Math.min(cssW * 0.42, cssW / 2 - 52));
      sry = Math.max(36, H * 0.65);
      canvas.width = Math.max(1, Math.round(cssW * dpr));
      canvas.height = Math.max(1, Math.round(cssH * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, ox * dpr, oy * dpr);
      stage.dataset.asm = 'run';
      builtText = textNow;
      cycle = 0;
      phase = 'forming';
      return true;
    };

    /* ── sample a technical form into targets for the same field ──── */
    const formTargets = (form: FormId): Array<{ x: number; y: number }> => {
      /* silhouettes are sampled at 1.12× the wordmark box, centred on
         it — the forms read larger and clearer without growing the
         canvas; a margined sample canvas keeps the overhang ink, which
         is mapped back into stage coordinates */
      const k = 1.12;
      const mw = Math.ceil(((W * (k - 1)) / 2) * dpr) + 2;
      const mh = Math.ceil(((H * (k - 1)) / 2) * dpr) + 2;
      const fw = cw + mw * 2;
      const fh = chh + mh * 2;
      const sample = document.createElement('canvas');
      sample.width = fw;
      sample.height = fh;
      const sctx = sample.getContext('2d', { alpha: true, willReadFrequently: true });
      if (!sctx) return [];
      sctx.scale(dpr, dpr);
      sctx.translate(mw / dpr - (W * (k - 1)) / 2, mh / dpr - (H * (k - 1)) / 2);
      drawForm(sctx, form, W * k, H * k, fieldSeed + formCursor * 0x9e3779b9);
      const img = sctx.getImageData(0, 0, fw, fh).data;
      const baseStep = Math.max(1, Math.round(2 * dpr));
      const countAt = (step: number) => {
        let n = 0;
        for (let y = 0; y < fh; y += step) {
          for (let x = 0; x < fw; x += step) {
            if (img[(y * fw + x) * 4 + 3] > 110) n += 1;
          }
        }
        return n;
      };
      const step = denseStepFor(countAt(baseStep), baseStep, Math.max(240, particles.length));
      const pts: Array<{ x: number; y: number }> = [];
      for (let y = 0; y < fh; y += step) {
        for (let x = 0; x < fw; x += step) {
          if (img[(y * fw + x) * 4 + 3] > 110)
            pts.push({ x: (x + step / 2 - mw) / dpr, y: (y + step / 2 - mh) / dpr });
        }
      }
      return pts;
    };

    /* ── aim the whole field: origin → scatter → destination ──────── */
    /* mode 0 = name → form, 1 = form → name, 2 = form → form (the
       same particles reorganise directly into the next silhouette) */
    const aimField = (mode: 0 | 1 | 2, now: number) => {
      const toForm = mode !== 1;
      const seed = (fieldSeed ^ Math.imul(cycle + 1, 0x85ebca6b)) >>> 0;
      const rnd = mulberry32(seed);
      /* per-cycle variety, bounded: spread, timing, turbulence. The
         spread tops out at 1.0 so the waypoint families — whose radii
         are fractions of the safe ellipse — can never exceed it. */
      spreadScale = 0.75 + rnd() * 0.25;
      /* a form→form morph arcs tighter: the field reorganises in
         place instead of scattering across the whole stage */
      if (mode === 2) spreadScale *= 0.5;
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
        /* the canonical 25 are the primary vocabulary; a supporting
           form is due about one excursion in six, so the identity
           stays light. Seeded shuffled bag per pool: no immediate
           repeat and no visible tiny loop. */
        const bagRnd = mulberry32((fieldSeed ^ 0x2c1b3c6d) >>> 0);
        const bag = [...(bagRnd() < 0.16 ? SUPPORT_FORMS : CANON_FORMS)];
        for (let i = bag.length - 1; i > 0; i -= 1) {
          const j = Math.floor(bagRnd() * (i + 1));
          [bag[i], bag[j]] = [bag[j], bag[i]];
        }
        currentForm = bag[formCursor % bag.length];
        formCursor += 1;
        /* every excursion chains two forms: NAME → A → B → NAME, so
           the field is seen reorganising shape-to-shape, not cut */
        if (mode === 0) formsLeft = 1;
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
      if (mode === 2 && pts.length > 0) {
        /* monotonic correspondence: sort both clouds by angle around
           the field centre and pair them in order, so every particle
           flies to its angular neighbour in the next silhouette — the
           two forms are visibly the same field reorganising, never a
           cut between unrelated scenes */
        const ang = (x: number, y: number) => Math.atan2(y - scy, x - scx);
        pts.sort((a, b) => ang(a.x, a.y) - ang(b.x, b.y));
        order.sort(
          (a, b) => ang(particles[a].m1x, particles[a].m1y) - ang(particles[b].m1x, particles[b].m1y)
        );
        const map = new Array<number>(n);
        for (let k = 0; k < n; k += 1) map[order[k]] = Math.floor((k * pts.length) / n);
        for (let i = 0; i < n; i += 1) order[i] = map[i];
      }
      let stgMaxNow = 0;
      for (let i = 0; i < n; i += 1) {
        const p = particles[i];
        const fromX = mode === 0 ? p.tx : p.m1x;
        const fromY = mode === 0 ? p.ty : p.m1y;
        let toX: number;
        let toY: number;
        if (toForm) {
          const pt = pts[order[i] % pts.length];
          /* when the population outnumbers the samples, duplicates
             converge with a deterministic sub-cell jitter (from their
             own phases — no allocation, no respawn) instead of
             stacking into one glowing point */
          toX = pt.x + ((p.ph1 * 0.3183) % 1 - 0.5) * 2.4;
          toY = pt.y + ((p.ph2 * 0.3183) % 1 - 0.5) * 2.4;
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
        aimField(0, now);
      } else if (phase === 'toForm' && now - phaseT0 > morphSpan) {
        phase = 'formHold';
        phaseT0 = now;
      } else if (phase === 'formHold' && now - phaseT0 > holdFormMs) {
        if (formsLeft > 0) {
          /* chain the next silhouette: the same field morphs across */
          formsLeft -= 1;
          aimField(2, now);
        } else {
          aimField(1, now);
        }
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
          /* particle identity at the phase seam: size and ink start at
             EXACTLY the values the departing hold was using, and the
             flight size ramps in with the spread leg — nothing pops
             when a morph begins or ends, so the same particles are
             visibly the same particles throughout. The flight ink dip
             stays inside the identity-green top of the ramp. */
          const depart = easeOut(clamp01(ue / SPREAD_AT));
          const holdS = dot * (0.85 + 0.6 * p.z);
          const holdLc = 0.55 + 0.45 * p.z;
          const restS = phase === 'toForm' ? dot : holdS;
          const flyS = (restS + (dot * (1.0 + 0.5 * p.z) - restS) * depart) * (1 + 0.3 * pf);
          if (phase === 'toForm') {
            s = flyS + (holdS - flyS) * arrive;
            lc = (1 - 0.3 * clamp01(mU)) * (1 - arrive) + holdLc * arrive;
          } else {
            s = flyS + (dot - flyS) * arrive;
            lc = holdLc + (1 - holdLc) * clamp01(mU);
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

    const startLoop = () => {
      if (cancelled || raf) return;
      raf = requestAnimationFrame((now) => {
        t0 = now;
        phaseT0 = now;
        dissolveT0 = now;
        frame(now);
      });
    };

    const start = () => {
      if (cancelled) return;
      /* a build deferred by transform unrest starts the loop itself
         once the geometry it sampled is deterministic */
      if (build(textRef.current, clustersRef.current)) startLoop();
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
      if (calmRaf) {
        cancelAnimationFrame(calmRaf);
        calmRaf = 0;
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
