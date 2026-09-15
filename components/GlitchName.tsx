'use client';

/* ═══════════════════════════════════════════════════════════════
   GLITCH NAME — a living technical identity.

   The wordmark runs a continuous, deterministic cycle:

       CORRECT NAME → subtle instability → rapid glyph scramble
       → reconstruction (characters lock back, left to right)
       → CORRECT NAME holds → repeat

   One shared clock drives every glyph; each glyph runs the same
   cycle with an index-based stagger, so instability and rebuilding
   travel through the word as a wave instead of flickering in unison.

   Signal discipline
   -----------------
   - Deterministic: scramble choices derive from (cycle count, glyph
     index, step) — no Math.random, so server and client markup are
     identical and every run is reproducible.
   - The scramble alphabet is a curated set of technical marks
     (ASCII, Greek, geometric/math glyphs) chosen for metric
     compatibility with the display face — never emoji, never anything
     that reads as noise or offense. The real name is always
     recoverable and is what the cycle resolves to.
   - Bengali mode never scrambles: clusters keep their exact text
     (scrambling conjuncts would corrupt shaping) and live through the
     cycle with colour + jitter only. The final accessible name is the
     correct one in both scripts.
   - Text mutations write `textContent` directly on leaf spans React
     never re-renders — zero React churn during the loop.
   - Compositor-friendly: jitter is a transform variable written at a
     fixed cadence only while unstable; colour/glow are class flips on
     coarse phase boundaries. No layout reads in the loop, no layout
     writes (each cell is width-locked to its stable glyph, measured
     once after the display font settles).
   - The loop pauses while the tab is hidden and never runs for
     reduced-motion users, who get a calm static wordmark with the
     same typography and colour.

   Accessibility / SEO contract
   ----------------------------
   The name is real DOM text twice over: a screen-reader copy and the
   visible cells (aria-hidden), so the accessible name is "Sobuj Miah"
   / "সবুজ মিয়া" regardless of phase, and crawlers read the stable
   spelling from the server-rendered markup.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useRef } from 'react';
import type { CSSProperties } from 'react';
import { segmentGraphemes } from '@/app/graphemes';
import { MOTION } from '@/app/design-tokens';

/* ── the signal vocabulary ─────────────────────────────────────
   Scramble pools: technically flavoured marks that render in the
   display face and stay inside the cell's metrics. */
const LATIN_POOL = ['S', 'Z', 'X', 'K', 'V', 'N', 'E', 'R'];
const GLYPH_POOL = ['∆', 'Σ', 'Ω', 'Φ', 'Λ', 'Ξ', 'Ψ', 'Π', '∷', '≡', '/', '|', '×', '+', '◦'];

/** Resolved inks — the brand's green family, deterministic order. */
const INKS = ['#a3e635', '#4ade80', '#22c55e', '#34d399', '#10b981', '#2dd4bf', '#84cc16', '#16a34a'];
/** Scramble inks — restrained cool technical tones, low saturation. */
const SCRAMBLE_INKS = ['#7dd3fc', '#a5b4fc', '#93c5fd', '#67e8f9'];
/** Reconstruction flash — the one warm highlight in the system. */
const REBUILD_INK = '#eab308';

/** Characters eligible for a scramble pass (Bengali passes through). */
const SCRAMBLABLE = /^[0-9A-Za-z]$/;

type Phase = 'hold' | 'unstable' | 'scramble' | 'rebuild';

export function GlitchName({ text, reducedMotion = false }: { text: string; reducedMotion?: boolean }) {
  const clusters = useMemo(() => segmentGraphemes(text), [text]);
  const stageRef = useRef<HTMLSpanElement>(null);
  const cellRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const charRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    if (reducedMotion) return;
    const stage = stageRef.current;
    if (!stage) return;

    const T = MOTION.nameCycle;
    const A = T.holdSeconds; /* hold */
    const B = A + T.unstableSeconds; /* instability begins */
    const C = B + T.scrambleSeconds; /* rapid transformation */
    const D = C + T.rebuildSeconds; /* reconstruction completes */

    const n = clusters.length;
    const isSpace = clusters.map((c) => c === ' ');
    const isLatin = clusters.map((c) => SCRAMBLABLE.test(c));

    /* Per-glyph state, held in refs — the loop never re-renders React. */
    const prevPhase = new Array<Phase>(n).fill('hold');
    const locked = new Array<boolean>(n).fill(true);
    const lastSwap = new Array<number>(n).fill(-1);
    const boostUntil = new Array<number>(n).fill(0);
    const timeouts: number[] = [];
    let raf = 0;
    let lastJitter = 0;
    const t0 = performance.now();

    /* Width-lock every cell to its stable glyph so scrambling can never
       shift the layout. Measured once, after the display font settles. */
    const measure = () => {
      try {
        const cv = document.createElement('canvas').getContext('2d');
        if (!cv) return;
        const style = window.getComputedStyle(stage);
        cv.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        clusters.forEach((ch, i) => {
          const cell = cellRefs.current[i];
          if (!cell || isSpace[i]) return;
          const w = cv.measureText(ch).width;
          if (w > 0) cell.style.width = `${Math.ceil(w)}px`;
        });
      } catch {
        /* widths stay natural — the pools are metric-compatible anyway */
      }
    };

    const spanOf = (i: number) => charRefs.current[i];

    /** Write one cell. `ink` null → the character's own CSS ink. */
    const setCell = (i: number, ch: string, phase: Phase, ink: string | null) => {
      const cell = cellRefs.current[i];
      const span = spanOf(i);
      if (!cell || !span) return;
      if (span.textContent !== ch) span.textContent = ch;
      if (prevPhase[i] !== phase) {
        prevPhase[i] = phase;
        cell.dataset.glitch = phase;
        cell.classList.toggle('sig-scramble', phase === 'scramble');
        cell.classList.toggle('sig-rebuild', phase === 'rebuild');
      }
      if (ink) {
        if (span.style.color !== ink) span.style.color = ink;
      } else if (span.style.color) span.style.removeProperty('color');
    };

    const clearJitter = (i: number) => {
      const cell = cellRefs.current[i];
      if (cell && cell.style.transform) cell.style.removeProperty('transform');
    };

    /** Deterministic scramble glyph + ink for this moment. */
    const scrambled = (i: number, t: number, cyc: number) => {
      const pool = isLatin[i] ? LATIN_POOL : GLYPH_POOL;
      const step = Math.floor((t * 1000) / T.scrambleStepMs);
      const ch = isLatin[i] ? pool[(cyc * 7 + i * 3 + step) % pool.length] : clusters[i];
      const ink = SCRAMBLE_INKS[(cyc + i + step) % SCRAMBLE_INKS.length];
      return { ch, ink };
    };

    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const tick = () => {
      raf = 0;
      if (document.hidden) return;
      const t = (performance.now() - t0) / 1000;
      const jitterNow = t - lastJitter >= 0.05;
      if (jitterNow) lastJitter = t;

      for (let i = 0; i < n; i++) {
        if (isSpace[i]) continue;
        const cell = cellRefs.current[i];
        if (!cell) continue;

        const lt = t - i * T.staggerSeconds;
        const cyc = Math.floor(lt / T.cycleSeconds + 4096);
        const tt = (lt + T.cycleSeconds * 4096) % T.cycleSeconds;
        const boosted = t < boostUntil[i];

        /* 1 · rapid transformation (the cycle's, or interaction-driven) */
        const inScramble = tt >= B && tt < C;
        if (inScramble || boosted) {
          if (prevPhase[i] !== 'scramble') locked[i] = false;
          if (jitterNow) {
            const jx = Math.sin(t * 31 + i * 13.7) * T.jitterPx;
            const jy = Math.cos(t * 27 + i * 7.3) * T.jitterPx * 0.6;
            const jr = Math.sin(t * 19 + i * 3.1) * 1.1;
            cell.style.transform = `translate(${jx.toFixed(2)}px, ${jy.toFixed(2)}px) rotate(${jr.toFixed(2)}deg)`;
          }
          if (isLatin[i] && t - lastSwap[i] >= T.scrambleStepMs / 1000) {
            lastSwap[i] = t;
            const s = scrambled(i, t, cyc);
            setCell(i, s.ch, 'scramble', s.ink);
          } else if (!isLatin[i]) {
            setCell(i, clusters[i], 'scramble', SCRAMBLE_INKS[(cyc + i) % SCRAMBLE_INKS.length]);
          }
          continue;
        }

        /* 2 · reconstruction: characters lock back one by one */
        if (tt >= C && tt < D) {
          const progress = (tt - C) / T.rebuildSeconds;
          const lockLine = progress * n; /* left → right */
          if (!locked[i] && lockLine >= i) {
            locked[i] = true;
            setCell(i, clusters[i], 'rebuild', REBUILD_INK);
            clearJitter(i);
            /* the warm flash settles back into the character's own ink */
            const span = spanOf(i);
            if (span) {
              timeouts.push(
                window.setTimeout(() => {
                  span.style.removeProperty('color');
                  const c = cellRefs.current[i];
                  if (c) {
                    c.classList.remove('sig-rebuild');
                    if (c.dataset.glitch === 'rebuild') c.dataset.glitch = 'hold';
                  }
                }, 340)
              );
            }
          } else if (!locked[i]) {
            /* not reached yet — residual flicker while the wave arrives */
            if (jitterNow) {
              const jx = Math.sin(t * 31 + i * 13.7) * T.jitterPx * 0.5;
              cell.style.transform = `translate(${jx.toFixed(2)}px, 0px)`;
            }
            if (isLatin[i] && t - lastSwap[i] >= (T.scrambleStepMs * 2.4) / 1000) {
              lastSwap[i] = t;
              const s = scrambled(i, t, cyc);
              setCell(i, s.ch, 'scramble', s.ink);
            }
          }
          continue;
        }

        /* 3 · hold: the correct name, at rest */
        if (!locked[i] || prevPhase[i] !== 'hold') {
          locked[i] = true;
          setCell(i, clusters[i], 'hold', null);
          clearJitter(i);
        }

        /* 4 · subtle pre-instability: the word leans before it breaks */
        if (tt >= A && tt < B && jitterNow) {
          const k = (tt - A) / T.unstableSeconds;
          const jx = Math.sin(t * 23 + i * 9.1) * T.jitterPx * 0.45 * k;
          const jy = Math.cos(t * 19 + i * 5.7) * T.jitterPx * 0.3 * k;
          cell.style.transform = `translate(${jx.toFixed(2)}px, ${jy.toFixed(2)}px)`;
        }
      }

      raf = requestAnimationFrame(tick);
    };

    /* Interaction is secondary: proximity raises the local signal,
       taps fire a burst — but the cycle runs without any input. */
    const onMove = (e: PointerEvent) => {
      const base = stage.getBoundingClientRect();
      const x = e.clientX - base.left;
      const y = e.clientY - base.top;
      const t = (performance.now() - t0) / 1000;
      for (let i = 0; i < n; i++) {
        if (isSpace[i]) continue;
        const cell = cellRefs.current[i];
        if (!cell) continue;
        const r = cell.getBoundingClientRect();
        const cx = r.left - base.left + r.width / 2;
        const cy = r.top - base.top + r.height / 2;
        if (Math.hypot(x - cx, y - cy) < r.width * 1.6) {
          boostUntil[i] = Math.max(boostUntil[i], t + T.boostSeconds * 0.45);
        }
      }
    };
    const onDown = (e: PointerEvent) => {
      const base = stage.getBoundingClientRect();
      const x = e.clientX - base.left;
      const t = (performance.now() - t0) / 1000;
      let best = -1;
      let bestD = Infinity;
      for (let i = 0; i < n; i++) {
        if (isSpace[i]) continue;
        const cell = cellRefs.current[i];
        if (!cell) continue;
        const r = cell.getBoundingClientRect();
        const d = Math.abs(x - (r.left - base.left + r.width / 2));
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      if (best >= 0) boostUntil[best] = t + T.boostSeconds;
    };
    const onVis = () => {
      if (document.hidden) stop();
      else if (!raf) raf = requestAnimationFrame(tick);
    };

    /* Start after the display font settles so the width-lock is true. */
    const begin = () => {
      measure();
      if (!raf) raf = requestAnimationFrame(tick);
    };
    try {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(begin).catch(begin);
      } else {
        begin();
      }
    } catch {
      begin();
    }

    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerdown', onDown);
    document.addEventListener('visibilitychange', onVis);

    return () => {
      stop();
      timeouts.forEach((id) => window.clearTimeout(id));
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerdown', onDown);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [reducedMotion, clusters]);

  /* The visible cells are aria-hidden; the accessible name comes from
     the screen-reader copy — always the correct spelling. */
  return (
    <span ref={stageRef} className={`sig-name${reducedMotion ? ' sig-static' : ''}`}>
      <span className="sr-only">{text}</span>
      <span className="sig-glyphs" aria-hidden="true">
        {clusters.map((ch, i) =>
          ch === ' ' ? (
            <span key={`sp-${i}`} className="sig-space">
              {'\u00A0'}
            </span>
          ) : (
            <span
              key={`g-${i}`}
              ref={(el) => {
                cellRefs.current[i] = el;
              }}
              className="sig-cell"
              style={{ '--ink': INKS[i % INKS.length] } as CSSProperties}
            >
              <span
                ref={(el) => {
                  charRefs.current[i] = el;
                }}
                className="sig-ink"
              >
                {ch}
              </span>
            </span>
          )
        )}
      </span>
    </span>
  );
}
