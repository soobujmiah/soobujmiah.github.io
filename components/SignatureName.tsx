'use client';

/* ═══════════════════════════════════════════════════════════════
   SIGNATURE NAME — a constructed, living identity.

   The wordmark is not revealed, it is *built*. The rendered ink of
   the name is sampled into a particle field, the field is dispersed,
   and every particle travels home to the exact pixel it was sampled
   from. The word assembles grapheme cluster by grapheme cluster,
   left to right, each particle seating with one warm highlight.

   Once built, the identity lives in a controlled loop:

       forming → NAME (hold 3s) → morph → TECHNICAL FORM (hold ~2s)
               → morph → NAME (hold 3s) → morph → next form → …

   The forms come from a fixed, designed collection (code brackets,
   a terminal, the Android head, a chip, a small robot, a circuit) —
   never unconstrained noise. Each morph re-aims the *same* particle
   field at pixels sampled from the drawn form, along seeded curved
   (quadratic Bézier) paths with per-particle depth, so the field
   reads as one coordinated mass with weight and dimension rather
   than teleporting dots.

   Why the resting state is DOM text and not canvas
   ------------------------------------------------
   The no-JS / reduced-motion answer is real, selectable, crawlable
   text rendered by the browser's own text engine. With motion on,
   the particle letterform is the living state and the DOM cells stay
   hidden behind it; the accessible name is always the sr-only copy.

   Why Bengali shaping cannot break
   --------------------------------
   Nothing here addresses a character. The renderer draws whole
   grapheme clusters (`app/graphemes.ts` → `Intl.Segmenter`, with a
   combining-mark-aware fallback) and samples the pixels the browser
   produced, so কার, মাত্রা, হসন্ত and যুক্তাক্ষর are correct by
   construction. The technical forms are language-neutral glyphs, so
   both languages share them while the name targets stay per-language.

   Signal discipline
   -----------------
   - Deterministic: every seed derives from the name (FNV-1a) plus
     the cycle index. No Math.random — the same name produces the
     same field, the same form order and the same frame at the same
     timestamp.
   - Budgeted: the particle count derives from viewport width and
     core count under a hard cap; form targets are sampled once per
     morph (never per frame); frames batch into an eight-step ramp.
   - Paused while the tab is hidden (the clock stops with it), fully
     torn down on unmount.
   - Reduced motion: no canvas, no timer, no loop — the wordmark is
     simply present, stable and readable.
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

/* ── the living loop, seconds ─────────────────────────────────────
   Deliberately local constants (not brand tokens): they tune one
   component's choreography rather than the shared design system. */
const NAME_HOLD_S = 3.0; // the name, clearly readable, before any transform
const FORM_HOLD_S = 1.9; // a technical form, held
const MORPH_S = 1.5; // one reorganisation, either direction

/** The designed form collection — cycled, never all at once. */
const FORMS = ['code', 'terminal', 'android', 'chip', 'robot', 'circuit'] as const;
type FormId = (typeof FORMS)[number];

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
  /** morph state: current leg anchors + Bézier control + depth 0..1 */
  m0x: number;
  m0y: number;
  m1x: number;
  m1y: number;
  cpx: number;
  cpy: number;
  z: number;
};

const easeInOut = (t: number): number => {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * (3 - 2 * x);
};
const quad = (a: number, c: number, b: number, t: number): number => {
  const u = 1 - t;
  return u * u * a + 2 * u * t * c + t * t * b;
};

/* ── drawing the technical forms ──────────────────────────────────
   Each form is drawn into the same wordmark box the name occupies;
   the lit pixels are then sampled into particle targets exactly like
   the name's ink — one code path for "where does material go". */
function drawForm(ctx: CanvasRenderingContext2D, form: FormId, W: number, H: number, seed: number): void {
  const cx = W / 2;
  const cy = H / 2;
  const lw = Math.max(2, H * 0.055);
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  switch (form) {
    case 'code': {
      ctx.font = `700 ${Math.round(H * 0.82)}px ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('</>', cx, cy);
      break;
    }
    case 'terminal': {
      const w = W * 0.62;
      const h = H * 0.74;
      ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, cy - h / 2 + h * 0.22);
      ctx.lineTo(cx + w / 2, cy - h / 2 + h * 0.22);
      ctx.stroke();
      ctx.font = `700 ${Math.round(H * 0.34)}px ui-monospace, monospace`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('>', cx - w * 0.3, cy + h * 0.12);
      ctx.fillRect(cx - w * 0.08, cy + h * 0.02, w * 0.22, lw * 1.4);
      break;
    }
    case 'android': {
      const r = H * 0.3;
      ctx.beginPath();
      ctx.arc(cx, cy + r * 0.55, r, Math.PI, 0);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx - r * 0.45, cy + 0.05 * H, lw * 0.9, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.45, cy + 0.05 * H, lw * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.55, cy - r * 0.75);
      ctx.lineTo(cx - r * 0.85, cy - r * 1.25);
      ctx.moveTo(cx + r * 0.55, cy - r * 0.75);
      ctx.lineTo(cx + r * 0.85, cy - r * 1.25);
      ctx.stroke();
      break;
    }
    case 'chip': {
      const s = H * 0.56;
      ctx.strokeRect(cx - s / 2, cy - s / 2, s, s);
      ctx.fillRect(cx - s * 0.18, cy - s * 0.18, s * 0.36, s * 0.36);
      for (let i = -1; i <= 1; i += 1) {
        const o = (i * s) / 3;
        ctx.beginPath();
        ctx.moveTo(cx + o, cy - s / 2);
        ctx.lineTo(cx + o, cy - s / 2 - H * 0.12);
        ctx.moveTo(cx + o, cy + s / 2);
        ctx.lineTo(cx + o, cy + s / 2 + H * 0.12);
        ctx.moveTo(cx - s / 2, cy + o);
        ctx.lineTo(cx - s / 2 - H * 0.12, cy + o);
        ctx.moveTo(cx + s / 2, cy + o);
        ctx.lineTo(cx + s / 2 + H * 0.12, cy + o);
        ctx.stroke();
      }
      break;
    }
    case 'robot': {
      const w = H * 0.52;
      const h = H * 0.42;
      ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
      ctx.beginPath();
      ctx.arc(cx - w * 0.22, cy - h * 0.08, lw, 0, Math.PI * 2);
      ctx.arc(cx + w * 0.22, cy - h * 0.08, lw, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.18, cy + h * 0.2);
      ctx.lineTo(cx + w * 0.18, cy + h * 0.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy - h / 2);
      ctx.lineTo(cx, cy - h / 2 - H * 0.14);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy - h / 2 - H * 0.17, lw * 0.9, 0, Math.PI * 2);
      ctx.fill();
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
        for (let sIdx = 0; sIdx < segs; sIdx += 1) {
          const dx = W * (0.14 + rnd() * 0.14);
          const dy = rnd() < 0.45 ? 0 : (rnd() - 0.5) * H * 0.34;
          x += dx;
          y += dy;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, lw * 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
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
    /* The handover duration is read from the token here rather than
       hard-coded in the stylesheet, so the two cannot drift. It now only
       serves the no-JS/failure fallback cross-fade. */
    stage.style.setProperty('--sig-resolve', `${T.resolveSeconds}s`);
    let cancelled = false;
    let raf = 0;
    const timers: number[] = [];
    /* assigned by build(); lets the visibility handler resume the clock */
    let resume: (() => void) | null = null;

    const later = (fn: () => void, ms: number) => {
      timers.push(
        window.setTimeout(() => {
          if (!cancelled) fn();
        }, ms)
      );
    };

    /* Failure fallback only: if the field can never be sampled, the real
       text is the accessible, legible answer. Normal motion never takes
       this path — the particle letterform IS the resting state. */
    const giveUpToText = () => {
      stage.dataset.asm = 'done';
    };

    /* ── the living state machine ───────────────────────────────────
       forming  : the existing construction — dispersed field seats into
                  the wordmark, unchanged.
       nameHold : the completed name, readable, breathing gently, for
                  NAME_HOLD_S. The strongest identity moment.
       toForm   : the field reorganises along seeded curved paths into a
                  technical form (one morph, coordinated mass).
       formHold : the form, held with depth shimmer + parallax.
       toName   : the field flows back into the name (this language).
       dissolve : a language retarget — the old particle glyphs loosen and
                  fade, then the new field is sampled and forms.        */
    let phase: 'forming' | 'nameHold' | 'toForm' | 'formHold' | 'toName' | 'dissolve' = 'forming';
    let particles: Particle[] = [];
    let builtText: string | null = null;
    let t0 = 0;
    let phaseT0 = 0;
    let dissolveT0 = 0;
    let hiddenAt = 0;
    let cycle = 0;
    let currentForm: FormId = 'code';
    /* geometry of the current field, in wordmark space */
    let W = 0;
    let H = 0;
    let ruleY = 0;
    let dot = 2;
    let fieldSeed = 1;
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

      /* The display layer covers the stable hero-name box; the sample
         canvas covers only the wordmark box (that is where the ink is),
         keeping getImageData small. */
      const layerBox = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, T.maxDpr);
      /* Fill-rate guard: the layer covers the whole page box, so cap its
         total device pixels and trade resolution for area rather than
         letting a phone allocate an outsized backing store. 4 Mpx is the
         budget of an ordinary full-screen dpr-3 phone canvas. */
      const maxArea = 4.0e6;
      const areaAt = (d: number) => layerBox.width * d * (layerBox.height * d);
      while (dpr > 1 && areaAt(dpr) > maxArea) dpr -= 0.25;
      cw = Math.max(1, Math.round(W * dpr));
      chh = Math.max(1, Math.round(H * dpr));

      const cs = window.getComputedStyle(stage);
      const fontStr = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const fontSize = parseFloat(cs.fontSize) || 64;

      /* Render the clusters exactly where the DOM puts them; the lit
         pixels become the particle targets. Shaping is the browser's:
         clusters are drawn as whole grapheme clusters, never code points,
         so কার/মাত্রা/যুক্তাক্ষর arrive here already correct. */
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

      /* Left edge of every cluster, and the baseline the rule sits on.
         Both come from the same metrics the browser used. */
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

      /* Which cluster a sample belongs to, from the measured edges. */
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
          /* breath direction: biased outward from the word's centre, so a
             loosening glyph exhales rather than sliding sideways */
          const ang = Math.atan2(ty - H / 2, tx - W / 2) + (rnd() - 0.5) * 1.6;
          next.push({
            tx,
            ty,
            ox: o.x,
            oy: o.y,
            at: startOffset(clusterOf(tx), clusterCount, rnd, T.clusterShare, T.jitterShare),
            dur: T.travelShare,
            ph1: rnd() * Math.PI * 2,
            ph2: rnd() * Math.PI * 2,
            ph3: rnd() * Math.PI * 2,
            wph: rnd(),
            bx: Math.cos(ang),
            by: Math.sin(ang),
            m0x: tx,
            m0y: ty,
            m1x: tx,
            m1y: ty,
            cpx: tx,
            cpy: ty,
            z: rnd(),
          });
        }
      }

      /* Nothing lit (font not ready, or a zero-width box): do not leave
         the hero empty — hand straight over to the real text. */
      if (next.length === 0) return giveUpToText();

      particles = next;
      clustersNow = clustersIn;
      ramp = rampPalette(ASSEMBLE_INKS[0], LOCK_INK, RESOLVED_INK, RAMP_BUCKETS, WARM_AT);
      dot = Math.max(1.1, Math.min(2.3, W / 250));

      /* wordmark space: the layer's origin sits one stage-offset away, so
         every coordinate below stays relative to the rendered letters */
      ox = stageBox.left - layerBox.left;
      oy = stageBox.top - layerBox.top;
      cssW = layerBox.width;
      cssH = layerBox.height;
      canvas.width = Math.max(1, Math.round(cssW * dpr));
      canvas.height = Math.max(1, Math.round(cssH * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, ox * dpr, oy * dpr);
      /* the particle letterform is the only visual from here on: the DOM
         cells stay hidden for the whole life of the animation */
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

    /* ── aim the whole field at a destination set, curved paths ───── */
    const aimField = (toForm: boolean, now: number) => {
      const seed = (fieldSeed ^ Math.imul(cycle + 1, 0x85ebca6b)) >>> 0;
      const rnd = mulberry32(seed);
      if (toForm) {
        /* deterministic form order: shuffled bag per epoch, no immediate
           repeat across the bag boundary */
        const bagRnd = mulberry32((fieldSeed ^ 0x2c1b3c6d) >>> 0);
        const bag = [...FORMS];
        for (let i = bag.length - 1; i > 0; i -= 1) {
          const j = Math.floor(bagRnd() * (i + 1));
          [bag[i], bag[j]] = [bag[j], bag[i]];
        }
        currentForm = bag[cycle % bag.length];
        if (cycle > 0 && currentForm === FORMS[(cycle - 1) % FORMS.length]) {
          currentForm = bag[(cycle + 1) % bag.length];
        }
      }
      const pts = toForm ? formTargets(currentForm) : [];
      const n = particles.length;
      if (toForm && pts.length === 0) {
        /* sampling failed: skip this form, hold the name instead */
        phase = 'nameHold';
        phaseT0 = now;
        return;
      }
      /* deterministic assignment: a seeded permutation pairs particles
         with targets so paths cross fluidly instead of sliding in lockstep */
      const order = new Array<number>(n);
      for (let i = 0; i < n; i += 1) order[i] = i;
      for (let i = n - 1; i > 0; i -= 1) {
        const j = Math.floor(rnd() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
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
        /* control point: midpoint pushed perpendicular, seeded — the
           curve gives the morph its organic, non-mechanical sweep */
        const mx = (fromX + toX) / 2;
        const my = (fromY + toY) / 2;
        const dx = toX - fromX;
        const dy = toY - fromY;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const bend = (rnd() - 0.5) * 0.9 * Math.min(90, len * 0.5);
        p.m0x = fromX;
        p.m0y = fromY;
        p.m1x = toX;
        p.m1y = toY;
        p.cpx = mx + (-dy / len) * bend;
        p.cpy = my + (dx / len) * bend;
        p.z = rnd();
      }
      phase = toForm ? 'toForm' : 'toName';
      phaseT0 = now;
    };

    const frame = (now: number) => {
      raf = 0;
      if (cancelled) return;
      if (document.hidden) {
        /* stop the clock as well as the loop, so returning to the tab
           resumes the motion instead of skipping ahead in it */
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
        /* the old glyphs loosen outward and fade — particles leaving, not
           a cut. When they are gone the new field is sampled and forms. */
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
      } else if (phase === 'nameHold' && now - phaseT0 > NAME_HOLD_S * 1000) {
        aimField(true, now);
      } else if (phase === 'toForm' && now - phaseT0 > MORPH_S * 1000) {
        phase = 'formHold';
        phaseT0 = now;
      } else if (phase === 'formHold' && now - phaseT0 > FORM_HOLD_S * 1000) {
        aimField(false, now);
      } else if (phase === 'toName' && now - phaseT0 > MORPH_S * 1000) {
        phase = 'nameHold';
        phaseT0 = now;
        cycle += 1;
      }

      /* construction guides: one baseline rule, one tick per cluster.
         They exist while the word is being built and leave with it. */
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

      /* particles: one path for material still waiting, then one per
         ramp bucket — at most RAMP_BUCKETS + 1 fills a frame */
      ctx.globalCompositeOperation = 'lighter';
      const waiting = new Path2D();
      const buckets: Path2D[] = [];
      for (let b = 0; b < RAMP_BUCKETS; b += 1) buckets.push(new Path2D());

      const morphing = phase === 'toForm' || phase === 'toName';
      const mProg = morphing ? easeInOut(Math.min(1, (now - phaseT0) / (MORPH_S * 1000))) : 0;

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
            /* seated while the name holds: micro-drift + breath wave */
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
          /* the readable name: micro-drift + the staggered breath wave */
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
          x = quad(p.m0x, p.cpx, p.m1x, mProg);
          y = quad(p.m0y, p.cpy, p.m1y, mProg);
          /* depth cue in flight: nearer particles slightly larger */
          s = dot * (1.05 + 0.45 * p.z) * (1 + 0.25 * Math.sin(Math.PI * mProg));
          lc = phase === 'toForm' ? 1 - 0.75 * mProg : 0.25 + 0.75 * mProg;
        } else {
          /* formHold: seated on the form, with dimensional shimmer —
             depth-scaled size, intensity by z, and a slow parallax sway */
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

    resume = () => {
      if (cancelled) return;
      if (!raf) raf = requestAnimationFrame(frame);
    };

    /* ── start: fonts first, then one persistent lifecycle ── */
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
      if (document.hidden) return; /* the frame loop parks itself */
      /* the clock was stopped with the loop; shift the origin by the
         hidden duration so the motion resumes where it left off */
      resume?.();
    };

    withFonts();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      resume = null;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      timers.forEach((id) => window.clearTimeout(id));
      document.removeEventListener('visibilitychange', onVisibility);
      /* the nodes captured when the effect ran, not the ref's current
         value: by teardown the ref may already point somewhere else */
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
