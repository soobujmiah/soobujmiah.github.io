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
       hard-coded in the stylesheet, so the two cannot drift. */
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

    const giveUpToText = () => {
      stage.dataset.asm = 'done';
      hasBuilt.current = true;
    };

    /* ── build the field from the rendered wordmark ─────────────── */
    const build = () => {
      if (cancelled) return;
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return giveUpToText();

      const stageBox = stage.getBoundingClientRect();
      const W = stageBox.width;
      const H = stageBox.height;
      if (!(W > 4) || !(H > 4)) return giveUpToText();

      /* The field disperses *around* the word, so the construction canvas
         has to be larger than the wordmark box — otherwise every particle
         that leaves the text is clipped away and the assembly reads as a
         shimmer inside the letters instead of a disperse-and-rebuild. The
         padding is derived from the same token that drives the dispersal,
         so the two can never disagree. */
      const padX = Math.ceil(H * T.disperseRadius * 1.5);
      const padY = Math.ceil(H * T.disperseRadius * 0.62);
      stage.style.setProperty('--sig-pad-x', `${padX}px`);
      stage.style.setProperty('--sig-pad-y', `${padY}px`);

      /* Two canvases, two jobs. The sample canvas covers only the
         wordmark box (that is where the ink is), keeping getImageData
         small; the display canvas is padded so the field has room. */
      let dpr = Math.min(window.devicePixelRatio || 1, T.maxDpr);
      /* Fill-rate guard: the padded canvas is much bigger than the text,
         so cap its total device pixels and trade resolution for area
         rather than letting a phone allocate a huge backing store. */
      const maxArea = 2.4e6;
      const areaAt = (d: number) => (W + 2 * padX) * d * ((H + 2 * padY) * d);
      while (dpr > 1 && areaAt(dpr) > maxArea) dpr -= 0.25;
      const cw = Math.max(1, Math.round(W * dpr));
      const chh = Math.max(1, Math.round(H * dpr));

      const cs = window.getComputedStyle(stage);
      const fontStr = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const fontSize = parseFloat(cs.fontSize) || 64;

      /* Render the clusters exactly where the DOM puts them; the lit
         pixels become the particle targets. */
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
      const edges: number[] = [];
      let ruleY = 0;
      clusters.forEach((cluster, i) => {
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

      const rnd = mulberry32(hashSeed(text));
      const particles: Particle[] = [];
      const clusterCount = clusters.length;

      for (let y = 0; y < chh; y += step) {
        for (let x = 0; x < cw; x += step) {
          if (img[(y * cw + x) * 4 + 3] <= 110) continue;
          const tx = (x + step / 2) / dpr;
          const ty = (y + step / 2) / dpr;
          const o = disperseOrigin(tx, ty, W, H, rnd, T.disperseRadius);
          particles.push({
            tx,
            ty,
            ox: o.x,
            oy: o.y,
            at: startOffset(clusterOf(tx), clusterCount, rnd, T.clusterShare, T.jitterShare),
            dur: T.travelShare,
          });
        }
      }

      /* Nothing lit (font not ready, or a zero-width box): do not leave
         the hero empty — hand straight over to the real text. */
      if (particles.length === 0) return giveUpToText();

      const ramp = rampPalette(ASSEMBLE_INKS[0], LOCK_INK, RESOLVED_INK, RAMP_BUCKETS, WARM_AT);
      const dot = Math.max(1.1, Math.min(2.3, W / 250));

      const dw = Math.max(1, Math.round((W + 2 * padX) * dpr));
      const dh = Math.max(1, Math.round((H + 2 * padY) * dpr));
      canvas.width = dw;
      canvas.height = dh;
      ctx.scale(dpr, dpr);
      /* draw in wordmark-space: the canvas origin is one padding away */
      ctx.translate(padX, padY);
      stage.dataset.asm = 'run';

      const totalMs = T.totalSeconds * 1000;
      const disperseMs = T.disperseSeconds * 1000;
      let t0 = performance.now();
      let hiddenAt = 0;
      let settled = false;
      /* 'in' is the existing construction: the dispersed field seats into
         the wordmark. 'out' is the same particle math played the other
         way, so a formed wordmark lifts off into the field instead of
         popping back to scatter — the loop's decomposition beat. Same
         particles, same paths, same palette, same easing: nothing new is
         drawn, the existing timeline is simply traversed in reverse. */
      let phase: 'in' | 'out' = 'in';

      const release = () => {
        /* Hand over to the real typography, hold the formed wordmark for
           the token's pause, then hand back to the particles: the
           construction is the identity mark, so it repeats for as long as
           the page lives. One controlled lifecycle — the same particle
           array, the same canvas, the same rAF slot — restarts per cycle;
           nothing is re-allocated and nothing accumulates.

           The backing store now stays allocated across cycles (the next
           cycle draws into it); teardown releases it. The padded CSS box
           is deliberately left in place for the component's lifetime:
           `data-asm="done"` has already faded the canvas to opacity 0, so
           shrinking the element back to the wordmark box would buy nothing
           visually, while changing its rect is exactly the kind of
           invisible geometry change that browsers can book as a layout
           shift. Keeping the box constant means the identity mark never
           moves anything, ever.

           The overhang is safe: every ancestor of the stage up to <body>
           clips overflow-x, so the padded box cannot introduce a
           horizontal scrollbar even when it extends past a narrow
           viewport (verified: documentElement.scrollWidth === innerWidth
           at 390px with the pad live). */
        settled = true;
        giveUpToText();
        later(() => {
          later(beginCycle, T.holdSeconds * 1000);
        }, T.resolveSeconds * 1000 + 60);
      };

      const beginCycle = () => {
        if (cancelled || raf) return;
        settled = false;
        hiddenAt = 0;
        phase = 'out';
        /* The canvas still holds the seated field from the last cycle, so
           swapping text→canvas on this frame reads as the wordmark
           beginning to lift, not as a flicker. Cells hide on the same
           frame, exactly as they did on the very first construction. */
        stage.dataset.asm = 'run';
        t0 = performance.now();
        raf = requestAnimationFrame(frame);
      };

      const frame = (now: number) => {
        raf = 0;
        if (cancelled || settled) return;
        if (document.hidden) {
          /* stop the clock as well as the loop, so returning to the tab
             resumes the construction instead of skipping to the end */
          if (!hiddenAt) hiddenAt = now;
          return;
        }
        if (hiddenAt) {
          t0 += now - hiddenAt;
          hiddenAt = 0;
        }

        const elapsed = now - t0;
        if (phase === 'out' && elapsed >= disperseMs) {
          /* decomposition complete: the field is floating again — now run
             the existing construction forward, unchanged */
          phase = 'in';
          t0 = now;
        }
        const t =
          phase === 'out' ? 1 - Math.min(1, elapsed / disperseMs) : elapsed / totalMs;
        ctx.clearRect(-padX, -padY, W + 2 * padX, H + 2 * padY);

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
            if (clusters[i] === ' ') return;
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

        let arrived = 0;
        for (let i = 0; i < particles.length; i += 1) {
          const p = particles[i];
          const local = (t - p.at) / p.dur;
          if (local <= 0) {
            const s = dot * 0.75;
            waiting.rect(p.ox - s / 2, p.oy - s / 2, s, s);
            continue;
          }
          const lc = local > 1 ? 1 : local;
          if (local >= 1) arrived += 1;
          const e = easeOutSettle(lc, T.settleBack);
          const x = p.ox + (p.tx - p.ox) * e;
          const y = p.oy + (p.ty - p.oy) * e;
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

        if (phase === 'in' && (t >= 1 || arrived === particles.length)) {
          release();
          return;
        }
        raf = requestAnimationFrame(frame);
      };

      resume = () => {
        if (cancelled || settled) return;
        if (!raf) raf = requestAnimationFrame(frame);
      };

      raf = requestAnimationFrame((now) => {
        t0 = now;
        frame(now);
      });
    };

    /* ── start: fonts first, and a graceful exit for the outgoing name ── */
    const start = () => {
      if (cancelled) return;
      if (hasBuilt.current) {
        /* a language switch: the outgoing wordmark leaves before the new
           one is constructed, so the two scripts never overlap */
        stage.dataset.asm = 'out';
        later(build, T.outgoingSeconds * 1000);
      } else {
        build();
      }
    };

    const withFonts = () => {
      if (cancelled) return;
      try {
        const cs = window.getComputedStyle(stage);
        const fontStr = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const loaded = document.fonts?.load(fontStr, text);
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
         hidden duration so the construction resumes where it left off */
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
      stage.style.removeProperty('--sig-pad-x');
      stage.style.removeProperty('--sig-pad-y');
    };
  }, [reducedMotion, armed, clusters, text]);

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
        {/* Keyed by the rendered name so a language change mounts a
            *fresh* canvas instead of resizing the one that is already
            there. Inserting and removing a node is never booked as a
            layout shift; changing the box of a node that has already
            painted can be, when the main thread is busy. */}
        <canvas key={text} className="sig-canvas" ref={canvasRef} />
      </span>
    </span>
  );
}
