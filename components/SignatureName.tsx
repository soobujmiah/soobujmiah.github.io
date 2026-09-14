'use client';

/* ═══════════════════════════════════════════════════════════════
   SIGNATURE NAME — every letter is its own living object.

   Concept: the identity is a digital signal that can destabilise and
   reconstruct. Each grapheme runs its own small state machine —

       STABLE → SIGNAL → DIFFUSING → FRAGMENTED → RECONSTRUCTING → STABLE

   — on its own clock, so the word breathes as a field of letters
   rather than as one synchronised animation.

   Everything happens INSIDE and AROUND the letters:
   - a disturbed glyph drifts, dims and hands over to Matrix glyph
     fragments drawn inside its own box, then settles back into exact
     typography;
   - EVERY glyph holds its own ink, walked deterministically through the
     brand's greens — never one uniform colour, never a random rainbow;
   - idle life is one glyph at a time, and the only canvas is a
     transparent one clipped to the name's own box.

   There is no full-width sweep, no scan bar, no panel and no white or
   light flash anywhere in this system. The energy comes from the letters.

   Engineering contract
   --------------------
   - Legibility first: the real name is always real DOM text, in the
     correct font, selectable, painted ABOVE the fragment canvas
     (z-index 1 vs 0). Fragments can never obscure it, and a dissolving
     glyph never drops below ~12% opacity.
   - Grapheme-safe: Bengali clusters (মি, ক্ষ, য়া) are never split, so
     shaping stays correct. `Intl.Segmenter` when available, with a
     combining-mark-aware fallback (app/graphemes.ts).
   - Compositor-friendly: the animation writes CSS custom properties
     (`--tx`, `--ty`, `--rot`, `--sc`, `--go`) and NEVER triggers a React
     re-render. `--ink` is written only when a glyph changes state, so
     the CSS transition does the colour work off the animation path.
   - No per-event layout reads: pointer events only store a point; the
     single rAF loop applies the field once per frame from cached boxes.
   - Bounded and self-limiting: one canvas, capped DPR, a hard fragment
     ceiling, and the loop stops as soon as nothing is moving. Idle events
     are scheduled with a timer, not a permanent rAF. Hidden tab stops
     everything.
   - Deterministic: idle randomness comes from a seeded generator, so the
     behaviour is reproducible rather than jittery.
   - Reduced motion: no canvas, no diffusion, no idle animation — a calm,
     fully designed, multi-tone static mark.
   ═══════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { MOTION } from '@/app/design-tokens';
import { segmentGraphemes } from '@/app/graphemes';

type GlyphState = 'STABLE' | 'SIGNAL' | 'DIFFUSING' | 'FRAGMENTED' | 'RECONSTRUCTING';

/** Deliberately restrained: digits plus a few katakana, not a wall of green. */
const DECODE_GLYPHS = '0123456789ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎ';

/** Canvas fragment inks — brand green family only. */
const FRAG_INK = ['34,197,94', '74,222,128', '16,185,129', '52,211,153'];

/** The ink walk. Deterministic order, so the mark reads as a considered
    run of greens (lime → teal → emerald → vivid → forest) instead of a
    per-letter colour cycle. */
const INK_RAMP = ['#4ade80', '#2dd4bf', '#34d399', '#a3e635', '#22c55e', '#16a34a'];

/** Ink a glyph takes while it is destabilised or lit. */
const INK_LIT = '#4ade80';

/** Seed for the idle scheduler — fixed, so idle behaviour is reviewable. */
const SEED = 0x50b0;

interface GlyphBox {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

interface Glyph {
  state: GlyphState;
  /** absolute ms timestamp when the current state began (may be future) */
  since: number;
  /** current diffusion level, 0 (settled) .. 1 (fully fragmented) */
  level: number;
  ink: string;
  /** true once --ink has been written for the current ink value */
  inkDirty: boolean;
}

interface Fragment {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  ch: string;
  ink: string;
  size: number;
}

/** Deterministic PRNG — organic, but the same on every load. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

export function SignatureName({
  text,
  reducedMotion = false,
  pulseKey = 0,
}: {
  text: string;
  reducedMotion?: boolean;
  pulseKey?: number;
}) {
  const clusters = useMemo(() => segmentGraphemes(text), [text]);
  const hostRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cellRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const glyphsRef = useRef<Glyph[]>([]);
  const boxesRef = useRef<GlyphBox[]>([]);
  const fragsRef = useRef<Fragment[]>([]);
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const spawnClockRef = useRef<number[]>([]);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rngRef = useRef<() => number>(() => 0.5);
  const pulseSeenRef = useRef(0);

  /* ── measurement: cached, recomputed only on resize ── */
  const measure = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;
    const hostRect = host.getBoundingClientRect();
    const boxes: GlyphBox[] = [];
    cellRefs.current.forEach((cell) => {
      if (!cell) return;
      const r = cell.getBoundingClientRect();
      boxes.push({
        cx: r.left - hostRect.left + r.width / 2,
        cy: r.top - hostRect.top + r.height / 2,
        w: r.width,
        h: r.height,
      });
    });
    boxesRef.current = boxes;
  }, []);

  /* ── the fragment field ── */
  const stopLoop = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  const drawFragments = useCallback(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !host || !ctx) return;
    const w = host.offsetWidth;
    const h = host.offsetHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const f of fragsRef.current) {
      const t = clamp01(f.life / f.maxLife);
      const alpha = Math.sin(t * Math.PI) * 0.8;
      if (alpha <= 0.02) continue;
      ctx.fillStyle = `rgba(${f.ink},${alpha.toFixed(3)})`;
      ctx.font = `${f.size.toFixed(1)}px ui-monospace, monospace`;
      ctx.fillText(f.ch, f.x, f.y);
    }
  }, []);

  /** Scatter digital fragments inside one glyph's OWN box. */
  const burst = useCallback((index: number, count: number, spread = 1) => {
    const box = boxesRef.current[index];
    if (!box) return;
    const frags = fragsRef.current;
    const room = Math.max(0, MOTION.name.maxFragments - frags.length);
    const n = Math.min(count, room);
    const rnd = rngRef.current;
    for (let i = 0; i < n; i++) {
      const ang = rnd() * Math.PI * 2;
      const rad = (0.15 + rnd() * 0.55) * box.w * 0.5 * spread;
      frags.push({
        x: box.cx + Math.cos(ang) * rad * 0.7,
        y: box.cy + Math.sin(ang) * rad * 0.5,
        vx: Math.cos(ang) * (0.25 + rnd() * 0.5) * spread,
        vy: (rnd() - 0.55) * 0.7 * spread,
        life: 0,
        maxLife: MOTION.name.fragmentLifeTicks * (0.75 + rnd() * 0.5),
        ch: DECODE_GLYPHS[(rnd() * DECODE_GLYPHS.length) | 0],
        ink: FRAG_INK[(rnd() * FRAG_INK.length) | 0],
        size: 9 + rnd() * 5,
      });
    }
  }, []);

  const inkFor = useCallback((i: number) => INK_RAMP[i % INK_RAMP.length], []);

  /** Write the machine's output to one glyph. Variables only. */
  const paint = useCallback((i: number, level: number, pushX: number) => {
    const cell = cellRefs.current[i];
    const g = glyphsRef.current[i];
    if (!cell || !g) return;
    /* never fully hidden: legibility outranks the effect */
    cell.style.setProperty('--go', (1 - level * 0.88).toFixed(3));
    cell.style.setProperty('--tx', `${(pushX * level).toFixed(2)}px`);
    cell.style.setProperty('--ty', `${(level * 4.5).toFixed(2)}px`);
    cell.style.setProperty('--rot', `${(level * 2.2).toFixed(2)}deg`);
    cell.style.setProperty('--sc', (1 + level * 0.05).toFixed(3));
    if (g.inkDirty) {
      cell.style.setProperty('--ink', g.ink);
      g.inkDirty = false;
    }
    const shown: GlyphState = g.state === 'STABLE' && level > 0.3 ? 'DIFFUSING' : g.state;
    if (cell.dataset.state !== shown) cell.dataset.state = shown;
  }, []);

  const drawFragmentsRef = useRef(drawFragments);
  drawFragmentsRef.current = drawFragments;
  const paintRef = useRef(paint);
  paintRef.current = paint;
  const burstRef = useRef(burst);
  burstRef.current = burst;

  /** Advance one glyph's machine. Returns true while it is still moving. */
  const step = useCallback((g: Glyph, i: number, now: number): boolean => {
    const n = MOTION.name;
    const dt = (now - g.since) / 1000;
    if (dt < 0) return true; /* scheduled for later — hold and keep the loop alive */

    switch (g.state) {
      case 'STABLE':
        g.level *= 0.86;
        if (g.level < 0.01) g.level = 0;
        return g.level > 0.01;

      case 'SIGNAL': {
        const t = clamp01(dt / n.signalSeconds);
        g.level = smoothstep(t) * 0.18;
        if (t >= 1) {
          g.state = 'DIFFUSING';
          g.since = now;
          g.ink = INK_LIT;
          g.inkDirty = true;
          burstRef.current(i, Math.ceil(n.fragmentsPerGlyph / 2), 1.1);
        }
        return true;
      }

      case 'DIFFUSING': {
        const t = clamp01(dt / n.diffuseSeconds);
        g.level = 0.18 + smoothstep(t) * 0.5;
        if (t >= 1) {
          g.state = 'FRAGMENTED';
          g.since = now;
          burstRef.current(i, n.fragmentsPerGlyph, 1.25);
        }
        return true;
      }

      case 'FRAGMENTED': {
        const t = clamp01(dt / n.fragmentSeconds);
        /* holds wide while its own fragments stand in for it */
        g.level = 0.68 + Math.sin(t * Math.PI) * 0.2;
        if (t >= 1) {
          g.state = 'RECONSTRUCTING';
          g.since = now;
        }
        return true;
      }

      case 'RECONSTRUCTING': {
        const t = clamp01(dt / n.rebuildSeconds);
        g.level = 0.72 * (1 - smoothstep(t));
        if (t >= 1) {
          g.state = 'STABLE';
          g.since = now;
          g.level = 0;
          g.ink = inkFor(i);
          g.inkDirty = true;
        }
        return true;
      }
    }
  }, [inkFor]);

  const stepRef = useRef(step);
  stepRef.current = step;

  /** Start a full destabilise→reconstruct cycle on one glyph. */
  const cycle = useCallback((index: number, from: GlyphState = 'SIGNAL', delayMs = 0) => {
    const g = glyphsRef.current[index];
    if (!g) return;
    g.state = from;
    g.since = performance.now() + delayMs;
    if (from !== 'STABLE') {
      g.ink = INK_LIT;
      g.inkDirty = true;
    }
  }, []);

  /* ── the single animation loop ── */
  const wake = useCallback(() => {
    if (reducedMotion || runningRef.current) return;
    runningRef.current = true;
    const tick = () => {
      if (!runningRef.current) return;
      const now = performance.now();
      const cells = glyphsRef.current;
      const boxes = boxesRef.current;
      const ptr = pointerRef.current;
      const R = MOTION.name.pointerRadiusPx;
      let moving = false;

      for (let i = 0; i < cells.length; i++) {
        const g = cells[i];
        /* 1. the machine */
        if (stepRef.current(g, i, now)) moving = true;
        /* 2. the pointer field — pure arithmetic from cached boxes */
        let pushX = 0;
        let field = 0;
        const box = boxes[i];
        if (ptr && box) {
          const dx = ptr.x - box.cx;
          const dy = ptr.y - box.cy;
          const dist = Math.hypot(dx, dy);
          const raw = clamp01(1 - dist / R);
          field = smoothstep(raw);
          if (field > 0.02) {
            pushX = dx >= 0 ? MOTION.name.pointerMaxShiftPx : -MOTION.name.pointerMaxShiftPx;
            /* a real disturbance, rate-limited per glyph */
            if (field > 0.34) {
              const last = spawnClockRef.current[i] || 0;
              if (now - last > MOTION.name.fragmentCooldownMs) {
                spawnClockRef.current[i] = now;
                burstRef.current(i, 1, 0.9);
              }
            }
          }
        }
        const level = Math.max(g.level, field);
        if (field > 0.02) moving = true;
        paintRef.current(i, level, pushX);
      }

      /* 3. fragments */
      const frags = fragsRef.current;
      const w = hostRef.current?.offsetWidth ?? 0;
      const h = hostRef.current?.offsetHeight ?? 0;
      for (let i = frags.length - 1; i >= 0; i--) {
        const f = frags[i];
        f.life += 1;
        f.x += f.vx;
        f.y += f.vy;
        f.vx *= 0.94;
        f.vy = f.vy * 0.94 + 0.06; /* fragments fall, like settling signal */
        if (f.life >= f.maxLife || f.y > h + 24 || f.x < -24 || f.x > w + 24) frags.splice(i, 1);
      }
      drawFragmentsRef.current();

      if (!moving && !frags.length && !pointerRef.current) {
        stopLoop();
        drawFragmentsRef.current();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [reducedMotion, stopLoop]);

  /* ── idle scheduler: one letter at a time, unhurried ── */
  const scheduleIdle = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (reducedMotion) return;
    const n = MOTION.name;
    const gap =
      (n.idleGapMinSeconds + rngRef.current() * (n.idleGapMaxSeconds - n.idleGapMinSeconds)) * 1000;
    idleTimerRef.current = setTimeout(() => {
      if (document.hidden) {
        scheduleIdle();
        return;
      }
      const count = glyphsRef.current.length;
      if (count) {
        const start = (rngRef.current() * count) | 0;
        cycle(start, 'SIGNAL');
        /* a short internal signal travelling to the next glyph — local, quiet */
        if (rngRef.current() > 0.45 && count > 1) cycle((start + 1) % count, 'SIGNAL', 260);
        wake();
      }
      scheduleIdle();
    }, gap);
  }, [cycle, reducedMotion, wake]);

  /* ── mount: seed the field, reveal glyph by glyph, then idle ── */
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    rngRef.current = mulberry32(SEED);
    glyphsRef.current = clusters.map((_, i) => ({
      state: 'STABLE' as GlyphState,
      since: 0,
      level: 0,
      ink: inkFor(i),
      inkDirty: true,
    }));
    spawnClockRef.current = clusters.map(() => 0);
    measure();

    if (reducedMotion) {
      /* calm, fully designed static mark — each letter keeps its own ink */
      glyphsRef.current.forEach((g) => (g.level = 0));
      for (let i = 0; i < clusters.length; i++) paint(i, 0, 0);
      return;
    }

    const canvas = canvasRef.current;
    const dpr = Math.min(window.devicePixelRatio || 1, MOTION.canvas.maxDpr);
    const w = host.offsetWidth;
    const h = host.offsetHeight;
    if (canvas && w && h) {
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /* The identity emerges FROM a digital field: every letter starts as
       fragments, then reconstructs on its own beat — never a whole-word
       fade, and the sequence runs exactly once. */
    const stagger = MOTION.name.lockStaggerSeconds * 1000;
    glyphsRef.current.forEach((g, i) => {
      g.state = 'FRAGMENTED';
      g.level = 0.88;
      g.ink = INK_LIT;
      g.inkDirty = true;
      g.since = performance.now() + 200 + i * stagger;
      paint(i, 0.88, 0);
    });
    /* seed the field across the glyph boxes */
    clusters.forEach((_, i) => burst(i, 2, 1.5));
    wake();
    scheduleIdle();

    return () => {
      stopLoop();
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
      pointerRef.current = null;
      fragsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, clusters, measure, burst, inkFor, paint, wake, scheduleIdle, stopLoop]);

  /* ── page change: 2–3 letters destabilise, the rest stay stable ── */
  useEffect(() => {
    if (pulseKey === pulseSeenRef.current) return;
    pulseSeenRef.current = pulseKey;
    if (reducedMotion) return;
    const count = glyphsRef.current.length;
    if (!count) return;
    const n = Math.min(MOTION.name.pulseGlyphs, count);
    const start = ((pulseKey % count) + count) % count;
    for (let k = 0; k < n; k++) cycle((start + k) % count, 'SIGNAL', k * 120);
    wake();
  }, [pulseKey, cycle, reducedMotion, wake]);

  /* ── resize: re-measure and re-fit the canvas ── */
  useEffect(() => {
    const onResize = () => {
      measure();
      const host = hostRef.current;
      const canvas = canvasRef.current;
      if (!host || !canvas || reducedMotion) return;
      const dpr = Math.min(window.devicePixelRatio || 1, MOTION.canvas.maxDpr);
      const w = host.offsetWidth;
      const h = host.offsetHeight;
      if (!w || !h) return;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [measure, reducedMotion]);

  /* ── hidden tab: stop everything, resume quietly on return ── */
  useEffect(() => {
    if (reducedMotion) return;
    const onVis = () => {
      if (document.hidden) {
        stopLoop();
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      } else {
        scheduleIdle();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [reducedMotion, scheduleIdle, stopLoop]);

  /* ── pointer + touch: character-local, never whole-word ──
     No preventDefault anywhere: the page swipe must stay intact. */
  const onMove = useCallback(
    (e: ReactPointerEvent<HTMLSpanElement>) => {
      if (reducedMotion) return;
      const host = hostRef.current;
      if (!host) return;
      const r = host.getBoundingClientRect();
      pointerRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
      wake();
    },
    [reducedMotion, wake]
  );

  const onLeave = useCallback(() => {
    if (reducedMotion) return;
    pointerRef.current = null;
    wake(); /* rebuild, then the loop stops itself */
  }, [reducedMotion, wake]);

  const onDown = useCallback(
    (e: ReactPointerEvent<HTMLSpanElement>) => {
      if (reducedMotion) return;
      const host = hostRef.current;
      if (!host) return;
      const r = host.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      /* nearest character reacts — tap one letter, disturb one letter */
      let best = -1;
      let bestD = Infinity;
      boxesRef.current.forEach((b, i) => {
        const d = Math.hypot(x - b.cx, y - b.cy);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      if (best >= 0) {
        pointerRef.current = { x, y };
        burst(best, MOTION.name.fragmentsPerGlyph, 1.15);
        cycle(best, 'DIFFUSING');
        wake();
      }
    },
    [burst, cycle, reducedMotion, wake]
  );

  /* The glyphs below are real text nodes: selectable, copyable, and the
     accessible name comes from `aria-label` on the root. Each cell is
     hidden from assistive tech so the name is announced once, as a word,
     instead of letter by letter. */
  return (
    <span
      ref={hostRef}
      className={`sig-name${reducedMotion ? ' sig-static' : ''}`}
      aria-label={text}
    >
      <canvas ref={canvasRef} className="sig-canvas" aria-hidden />
      <span className="sig-glyphs">
        {clusters.map((ch, i) =>
          ch === ' ' ? (
            <span
              key={`s${i}`}
              className="sig-cell sig-space"
              data-state="STABLE"
              aria-hidden="true"
            >
              {' '}
            </span>
          ) : (
            <span
              key={`g${i}`}
              ref={(el) => {
                cellRefs.current[i] = el;
              }}
              className="sig-cell"
              data-state="STABLE"
              aria-hidden="true"
            >
              <span className="sig-ink">{ch}</span>
            </span>
          )
        )}
      </span>
    </span>
  );
}
