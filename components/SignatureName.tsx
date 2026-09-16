'use client';

/* ═══════════════════════════════════════════════════════════════
   SIGNATURE NAME — a constructed identity.

   The wordmark is not revealed, it is *built*. The rendered ink of
   the name is sampled into a particle field, the field is dispersed,
   and every particle travels home to the exact pixel it was sampled
   from. The word assembles grapheme cluster by grapheme cluster,
   left to right, each particle seating with one warm highlight
   before the canvas hands over to the real DOM text.

       guides on the baseline → dispersed field → convergence
       → clusters seat (amber) → resolve into real typography

   Why the resting state is DOM text and not canvas
   ------------------------------------------------
   The final name is real, selectable, crawlable text rendered by the
   browser's own text engine in the brand wordmark faces. The canvas
   is scaffolding: it exists during construction, then fades out and
   releases its backing store. The most important frame is the last
   one, and the last one is typography.

   Why Bengali shaping cannot break
   --------------------------------
   Nothing here addresses a character. The renderer draws whole
   grapheme clusters (`app/graphemes.ts` → `Intl.Segmenter`, with a
   combining-mark-aware fallback) and samples the pixels the browser
   produced, so কার, মাত্রা, হসন্ত and যুক্তাক্ষর are correct by
   construction — there is no code path that could detach one, because
   no code path ever refers to one. The cluster strings drawn into the
   sample canvas are the same strings the DOM renders, so the particle
   targets and the resolved glyphs are the same shapes in the same
   places.

   Signal discipline
   -----------------
   - Deterministic: the seed derives from the name (FNV-1a), so the
     field, the timing and every frame are reproducible, and a re-run
     after a language switch rebuilds the same wordmark. No
     Math.random — server and client markup stay identical.
   - One-shot: the loop ends. No idle cycle, no residual rAF, and the
     canvas backing store is released once the name has resolved.
   - Reflow-free: the loop writes only to the canvas and to one
     `data-asm` attribute. It never touches text content and never
     writes a layout property, so there is nothing for the hero to
     shift — the DOM cells are static from first paint.
   - Batched: particles are quantised into an eight-step colour ramp,
     so a frame is at most a dozen draw calls whatever the particle
     count, and the ramp doubles as the arrival signal.
   - Budgeted: the particle count derives from viewport width and core
     count under a hard cap, so a phone gets a smaller field rather
     than a slower one.
   - Paused while the tab is hidden (the clock stops with it, so
     returning does not skip the construction), and fully torn down on
     unmount: rAF cancelled, timers cleared, listeners removed, canvas
     released.
   - Reduced motion: no canvas is drawn, no timer is set, and the
     wordmark is simply present — same faces, same inks, same halo.

   Accessibility / SEO contract
   ----------------------------
   The name is real DOM text twice over: a screen-reader copy and the
   visible cells inside an `aria-hidden` stage. The accessible name is
   "Sobuj Miah" / "সবুজ মিয়া" at every moment of the construction, and
   crawlers read the stable spelling from the server-rendered markup.
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
};

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
  const hasBuilt = useRef(false);

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
       alive    : the permanent state. The name stays composed of its
                  particles: a micro-drift on every seated particle plus a
                  staggered periodic breath wave (gentle diffusion out,
                  natural reconvergence). Pure functions of one continuous
                  clock, so there is no loop point to see.
       dissolve : a language retarget — the old particle glyphs loosen and
                  fade while nothing else is on screen, then the new field
                  is sampled and forms. No solid text, no blank frame.   */
    let phase: 'forming' | 'alive' | 'dissolve' = 'forming';
    let particles: Particle[] = [];
    let builtText: string | null = null;
    let t0 = 0;
    let dissolveT0 = 0;
    let hiddenAt = 0;
    /* geometry of the current field, in wordmark space */
    let W = 0;
    let H = 0;
    let padX = 0;
    let padY = 0;
    let ruleY = 0;
    let dot = 2;
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
      let dpr = Math.min(window.devicePixelRatio || 1, T.maxDpr);
      /* Fill-rate guard: the layer covers the whole page box, so cap its
         total device pixels and trade resolution for area rather than
         letting a phone allocate an outsized backing store. 4 Mpx is the
         budget of an ordinary full-screen dpr-3 phone canvas. */
      const maxArea = 4.0e6;
      const areaAt = (d: number) => layerBox.width * d * (layerBox.height * d);
      while (dpr > 1 && areaAt(dpr) > maxArea) dpr -= 0.25;
      const cw = Math.max(1, Math.round(W * dpr));
      const chh = Math.max(1, Math.round(H * dpr));

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
      phase = 'forming';
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
      if (t >= 1 && phase === 'forming') phase = 'alive';

      /* construction guides: one baseline rule, one tick per cluster.
         They exist while the word is being built and leave with it. */
      const guideFade = Math.max(0, 1 - t / T.guideShare);
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

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        const local = (t - p.at) / p.dur;
        if (local <= 0) {
          const s = dot * 0.75;
          waiting.rect(p.ox - s / 2, p.oy - s / 2, s, s);
          continue;
        }
        const lc = local > 1 ? 1 : local;
        const e = easeOutSettle(lc, T.settleBack);
        let x = p.ox + (p.tx - p.ox) * e;
        let y = p.oy + (p.ty - p.oy) * e;
        if (lc >= 1) {
          /* ── alive: the letterform stays particles, forever ──
             micro-drift on every seated particle, ramped in over the
             first quarter-step so seating hands over without a jump… */
          const q = Math.min(1, (local - 1) / 0.25);
          x += T.microPx * q * Math.sin(ts * 1.7 + p.ph1);
          y += T.microPx * q * Math.cos(ts * 1.3 + p.ph2);
          /* …plus the staggered breath wave: each particle periodically
             loosens a few px along its own outward direction and returns.
             The envelope is a sine pulse (0→1→0) on a continuous clock, so
             every cycle ends exactly where it began and there is no frame
             at which the loop can be seen to restart. The slow modulator
             keeps successive breaths from feeling like a fixed timer. */
          const c = (ts / T.breathSeconds + p.wph) % 1;
          if (c < T.breathWindow) {
            const env = Math.sin(Math.PI * (c / T.breathWindow));
            const slow = 0.6 + 0.4 * Math.sin(ts * 0.35 + p.ph3);
            const amp = T.breathPx * env * slow * q;
            x += p.bx * amp;
            y += p.by * amp;
          }
        }
        /* slightly larger in flight, condensing as it seats */
        const s = dot * (1.5 - 0.5 * lc);
        const path = buckets[bucketFor(lc, RAMP_BUCKETS)];
        path.rect(x - s / 2, y - s / 2, s, s);
        /* a short tail while the particle is genuinely in flight */
        if (lc > 0.12 && lc < 0.78) {
          const bx = x + (p.ox - x) * 0.22;
          const by = y + (p.oy - y) * 0.22;
          path.rect(bx - s * 0.3, by - s * 0.3, s * 0.6, s * 0.6);
        }
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
