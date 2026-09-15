'use client';

/* ═══════════════════════════════════════════════════════════════
   HERO NAME — a living signal wordmark.

   The name is treated as a cast of characters, not animated text.
   Every grapheme of "Sobuj Miah" / "সবুজ মিয়া" carries:

   - its own ink, drawn from the brand's lime → teal ramp
   - its own stance: tilt, scale and baseline offset
   - its own phase inside one shared floating wave

   Life is continuous and calm. It comes from two CSS animations —
   a staggered one-time entrance (`sig-in`: rise, un-tilt, settle)
   and an infinite gentle drift (`sig-live`: float, rotation sway,
   breathing scale) — plus a slow ink wander on every third glyph.
   Negative per-glyph delays make the drift travel through the word,
   so there is never a visible start or end state.

   Interaction is glyph-local and optional:
   - pointer proximity leans nearby characters gently toward the
     cursor, with neighbours feeling a falloff share of it;
   - a tap gives the nearest character a short scale kick.
   One self-stopping rAF loop writes CSS custom properties
   (`--mag-x/--mag-y/--mag-r/--mag-s`) on the glyph wrappers — no
   React re-render per frame, no per-frame layout reads, and the
   loop stops entirely the moment nothing is moving.

   Engineering contract
   --------------------
   - Legibility first: the name exists as real DOM text twice over —
     a screen-reader-only copy and the visible glyphs (aria-hidden),
     so it is announced once, as a word. It is never canvas or image.
   - Grapheme-safe: clusters come from app/graphemes.ts
     (Intl.Segmenter + combining-mark fallback), so Bengali conjuncts
     and matras (মি, ক্ষ) are never split.
   - Compositor-friendly: transform + opacity only; the glow is a
     static text-shadow; no filter, no canvas, no mix-blend.
   - Deterministic: every colour, tilt, delay and duration derives
     from the glyph index — server and client render identically.
   - Reduced motion: a calm, fully designed static mark — each
     character keeps its ink, stance and glow; no listeners run.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useRef } from 'react';
import type { CSSProperties } from 'react';
import { segmentGraphemes } from '@/app/graphemes';

/* The ink ramp — the brand's green family, in a considered order
   (lime → green → emerald → teal), never a random rainbow. */
const INKS = ['#a3e635', '#4ade80', '#22c55e', '#34d399', '#10b981', '#2dd4bf', '#84cc16', '#16a34a'];

/* A soft matching glow per ink (static text-shadow — painted once). */
const GLOWS = [
  'rgba(163,230,53,0.24)',
  'rgba(74,222,128,0.26)',
  'rgba(34,197,94,0.26)',
  'rgba(52,211,153,0.25)',
  'rgba(16,185,129,0.25)',
  'rgba(45,212,191,0.22)',
  'rgba(132,204,22,0.24)',
  'rgba(22,163,74,0.26)',
];

/* Per-character stance — deterministic personality tables. */
const TILTS = [-2.4, 1.8, -1.2, 2.6, -1.6, 1.4, -2.8, 2.2, -1.5, 1.9];
const SCALES = [1.03, 0.97, 1.0, 1.05, 0.96, 1.02, 0.98, 1.04, 0.97, 1.01];
const BASELINES = [0, -0.025, 0.012, -0.018, 0.02, -0.01, 0.005, -0.03, 0.015, -0.02];

/* Pointer-field tuning — gentle by design. */
const FIELD_RADIUS = 120; /* px around a glyph centre */
const FIELD_SHIFT = 5; /* max px a character leans toward the pointer */
const FIELD_TILT = 2.4; /* max deg of lean */
const FIELD_SCALE = 0.045; /* extra scale at the field centre */
const NEIGHBOR_SHARE = 0.4; /* neighbours feel this share of the field */
const SETTLE = 0.16; /* per-frame lerp toward the target */
const TAP_KICK = 0.13; /* scale impulse on tap */

export function HeroName({ text, reducedMotion = false }: { text: string; reducedMotion?: boolean }) {
  const clusters = useMemo(() => segmentGraphemes(text), [text]);
  const stageRef = useRef<HTMLSpanElement>(null);
  const cellRefs = useRef<Array<HTMLSpanElement | null>>([]);

  /* The magnetism loop. Runs only while something is moving. */
  useEffect(() => {
    if (reducedMotion) return;
    const stage = stageRef.current;
    if (!stage) return;

    let boxes: Array<{ cx: number; cy: number }> = [];
    let pointer: { x: number; y: number } | null = null;
    let raf = 0;
    const state = clusters.map(() => ({ x: 0, y: 0, r: 0, s: 1, kick: 0 }));
    /* the word-space has no glyph box and never reacts */
    const inert = clusters.map((c) => c === ' ');

    /* One layout read per interaction burst, never per frame. Dense over
       clusters, so the space keeps an index but carries no box. */
    const measure = () => {
      const base = stage.getBoundingClientRect();
      boxes = clusters.map((_, i) => {
        const el = cellRefs.current[i];
        if (!el) return { cx: 0, cy: 0 };
        const r = el.getBoundingClientRect();
        return { cx: r.left - base.left + r.width / 2, cy: r.top - base.top + r.height / 2 };
      });
    };

    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const tick = () => {
      raf = 0;
      const n = boxes.length;
      if (!n) return;

      /* 1. per-glyph field target from the cached boxes */
      const target = boxes.map((b, i) => {
        if (inert[i] || !pointer) return { x: 0, y: 0, r: 0, s: 1 };
        const dx = pointer.x - b.cx;
        const dy = pointer.y - b.cy;
        const d = Math.hypot(dx, dy);
        if (d > FIELD_RADIUS) return { x: 0, y: 0, r: 0, s: 1 };
        const f = (1 - d / FIELD_RADIUS) * (1 - d / FIELD_RADIUS);
        return {
          x: (dx / Math.max(d, 1)) * FIELD_SHIFT * f,
          y: (dy / Math.max(d, 1)) * FIELD_SHIFT * f * 0.6,
          r: (dx >= 0 ? 1 : -1) * FIELD_TILT * f,
          s: 1 + FIELD_SCALE * f,
        };
      });

      /* 2. neighbours share a little of the disturbance */
      const blended = target.map((t, i) => {
        const l = target[i - 1];
        const r = target[i + 1];
        const nx = ((l?.x ?? 0) + (r?.x ?? 0)) / 2;
        const ny = ((l?.y ?? 0) + (r?.y ?? 0)) / 2;
        const nr = ((l?.r ?? 0) + (r?.r ?? 0)) / 2;
        const ns = ((l?.s ?? 1) + (r?.s ?? 1)) / 2;
        return {
          x: t.x + nx * NEIGHBOR_SHARE,
          y: t.y + ny * NEIGHBOR_SHARE,
          r: t.r + nr * NEIGHBOR_SHARE,
          s: t.s + (ns - 1) * NEIGHBOR_SHARE,
        };
      });

      /* 3. settle toward the target, decay tap impulses, write vars */
      let moving = pointer !== null;
      for (let i = 0; i < n; i++) {
        const st = state[i];
        const t = blended[i];
        st.x += (t.x - st.x) * SETTLE;
        st.y += (t.y - st.y) * SETTLE;
        st.r += (t.r - st.r) * SETTLE;
        st.s += (t.s - st.s) * SETTLE;
        st.kick *= 0.88;
        if (st.kick < 0.002) st.kick = 0;

        const active =
          Math.abs(st.x) > 0.01 || Math.abs(st.y) > 0.01 || Math.abs(st.r) > 0.01 || st.kick > 0 || Math.abs(st.s - 1) > 0.002;
        if (active) moving = true;

        const cell = cellRefs.current[i];
        if (!cell) continue;
        if (active) {
          cell.style.setProperty('--mag-x', `${st.x.toFixed(2)}px`);
          cell.style.setProperty('--mag-y', `${st.y.toFixed(2)}px`);
          cell.style.setProperty('--mag-r', `${st.r.toFixed(2)}deg`);
          cell.style.setProperty('--mag-s', (st.s + st.kick).toFixed(3));
        } else {
          /* fully settled — clear the vars so CSS defaults own the pose */
          cell.style.removeProperty('--mag-x');
          cell.style.removeProperty('--mag-y');
          cell.style.removeProperty('--mag-r');
          cell.style.removeProperty('--mag-s');
        }
      }

      if (moving) raf = requestAnimationFrame(tick);
      else stop();
    };

    const wake = () => {
      if (!boxes.length) measure();
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const base = stage.getBoundingClientRect();
      pointer = { x: e.clientX - base.left, y: e.clientY - base.top };
      wake();
    };
    const onLeave = () => {
      pointer = null;
      wake(); /* settle, then the loop stops itself */
    };
    const onDown = (e: PointerEvent) => {
      const base = stage.getBoundingClientRect();
      const x = e.clientX - base.left;
      const y = e.clientY - base.top;
      pointer = { x, y };
      if (!boxes.length) measure();
      /* the nearest character reacts — tap one letter, move one letter */
      let best = -1;
      let bestD = Infinity;
      boxes.forEach((b, i) => {
        if (inert[i]) return;
        const d = Math.hypot(x - b.cx, y - b.cy);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      if (best >= 0) state[best].kick = TAP_KICK;
      wake();
    };
    const onResize = () => {
      boxes = [];
    };
    const onVis = () => {
      if (document.hidden) {
        stop();
        pointer = null;
      }
    };

    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerleave', onLeave);
    stage.addEventListener('pointerdown', onDown);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVis);

    return () => {
      stop();
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerleave', onLeave);
      stage.removeEventListener('pointerdown', onDown);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [reducedMotion, clusters]);

  /* The visible glyphs are aria-hidden; the name is announced once from
     the screen-reader copy below, as a word, never letter by letter. */
  return (
    <span ref={stageRef} className={`sig-name${reducedMotion ? ' sig-static' : ''}`}>
      <span className="sr-only">{text}</span>
      <span className="sig-glyphs" aria-hidden="true">
        {clusters.map((ch, i) => {
          if (ch === ' ') {
            return (
              <span key={`sp-${i}`} className="sig-space">
                {'\u00A0'}
              </span>
            );
          }
          return (
            <span
              key={`g-${i}`}
              ref={(el) => {
                cellRefs.current[i] = el;
              }}
              className="sig-glyph"
            >
              <span
                className="sig-in"
                style={{ '--in-delay': `${(0.15 + i * 0.07).toFixed(2)}s` } as CSSProperties}
              >
                <span
                  className={`sig-ink${i % 3 === 1 ? ' sig-wanderer' : ''}`}
                  style={
                    {
                      '--ink': INKS[i % INKS.length],
                      '--ink2': INKS[(i + 2) % INKS.length],
                      '--glow': GLOWS[i % GLOWS.length],
                      '--tilt': `${TILTS[i % TILTS.length]}deg`,
                      '--sc': SCALES[i % SCALES.length],
                      '--base': `${BASELINES[i % BASELINES.length]}em`,
                      '--live-dur': `${(5.2 + (i % 4) * 0.55).toFixed(2)}s`,
                      '--live-delay': `${(-i * 0.57).toFixed(2)}s`,
                    } as CSSProperties
                  }
                >
                  {ch}
                </span>
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
