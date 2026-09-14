'use client';

/* ═══════════════════════════════════════════════════════════════
   SIGNATURE NAME — the letters are the living object.

   Concept: the identity is a digital signal that can diffuse and
   reconstruct. Every effect happens INSIDE and AROUND the glyphs:
   a disturbed letter fades, drifts, and hands over to Matrix-style
   glyph fragments drawn inside its own box, then intelligently
   settles back into exact typography.

   There is no full-width sweep, no scan bar across the word, no
   overlay rectangle and no white/light flash anywhere in this
   system — idle life is per-glyph, and the only canvas is a
   transparent one clipped to the name's own box.

   Engineering contract
   --------------------
   - Legibility first: the real name is always real DOM text, in the
     correct font, selectable, painted ABOVE the fragment canvas
     (z-index 1 vs 0). Fragments can never obscure it; a dissolving
     glyph only ever dips to ~32% opacity while its fragments stand in.
   - Grapheme-safe: Bengali clusters (মি, ক্ষ, য়া) are never split, so
     shaping stays correct. `Intl.Segmenter` when available, with a
     combining-mark-aware fallback (app/graphemes.ts).
   - Compositor-friendly: the pointer writes CSS custom properties
     (--sx, --sy, --d) and never triggers a React re-render.
   - Bounded: one canvas sized to the name, capped DPR, capped
     fragment count, and the rAF loop only runs while the pointer is
     over the name or fragments are still alive. Idle motion is pure
     CSS. The tab being hidden stops everything.
   - Reduced motion: no canvas, no diffusion, no idle animation —
     a calm, fully designed static mark instead.
   ═══════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { MOTION } from '@/app/design-tokens';
import { segmentGraphemes } from '@/app/graphemes';

/** Deliberately restrained: digits plus a few katakana, not a wall of green. */
const DECODE_GLYPHS = '0123456789ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎ';

/** Brand green family only — no near-white, no off-family hue. */
const FRAG_INK = ['34,197,94', '74,222,128', '16,185,129', '52,211,153'];

interface GlyphBox {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
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
  const boxesRef = useRef<GlyphBox[]>([]);
  const dRef = useRef<number[]>([]);
  const fragsRef = useRef<Fragment[]>([]);
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const spawnClockRef = useRef<number[]>([]);
  /* the pointer-field applier is held in a ref so the single rAF loop
     can call it without a circular useCallback dependency */
  const applyPointerRef = useRef<() => void>(() => {});
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const [decoded, setDecoded] = useState(reducedMotion);

  /* ── measure the real glyph boxes, relative to the host so pager
        transforms cannot invalidate them ── */
  const measure = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;
    const hostRect = host.getBoundingClientRect();
    const boxes: GlyphBox[] = [];
    cellRefs.current.forEach((cell) => {
      if (!cell) return;
      const r = cell.getBoundingClientRect();
      boxes.push({
        centerX: r.left - hostRect.left + r.width / 2,
        centerY: r.top - hostRect.top + r.height / 2,
        width: r.width,
        height: r.height,
      });
    });
    boxesRef.current = boxes;
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  /* ── fragment field: bounded, transparent, stops when idle ── */
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
    const frags = fragsRef.current;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const f of frags) {
      const t = f.life / f.maxLife;
      const alpha = Math.sin(Math.min(1, t) * Math.PI) * 0.85;
      if (alpha <= 0.02) continue;
      ctx.fillStyle = `rgba(${f.ink},${alpha.toFixed(3)})`;
      ctx.font = `${f.size.toFixed(1)}px ui-monospace, monospace`;
      ctx.fillText(f.ch, f.x, f.y);
    }
  }, []);

  const ensureLoop = useCallback(() => {
    if (runningRef.current || reducedMotion) return;
    runningRef.current = true;
    const tick = () => {
      if (!runningRef.current) return;
      /* pointer field first: one layout read per frame, never per event */
      applyPointerRef.current();
      const frags = fragsRef.current;
      const w = hostRef.current?.offsetWidth ?? 0;
      const h = hostRef.current?.offsetHeight ?? 0;
      for (let i = frags.length - 1; i >= 0; i--) {
        const f = frags[i];
        f.life += 1;
        f.x += f.vx;
        f.y += f.vy;
        f.vx *= 0.94;
        f.vy = f.vy * 0.94 + 0.06; /* fragments drift down, like falling signal */
        if (f.life >= f.maxLife || f.y > h + 24 || f.x < -24 || f.x > w + 24) frags.splice(i, 1);
      }
      drawFragments();
      /* keep running only while there is something to show */
      const pointerInside = pointerRef.current !== null;
      const disturbed = dRef.current.some((d) => d > 0.01);
      if (!frags.length && !pointerInside && !disturbed) {
        stopLoop();
        drawFragments();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [drawFragments, reducedMotion, stopLoop]);

  /** Scatter digital fragments inside one glyph's own box. */
  const burst = useCallback(
    (index: number, count: number, spread = 1) => {
      if (reducedMotion) return;
      const box = boxesRef.current[index];
      if (!box) return;
      const frags = fragsRef.current;
      const cap = MOTION.name.maxFragments;
      const n = Math.min(count, Math.max(0, cap - frags.length));
      const now = performance.now();
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2;
        const rad = (0.15 + Math.random() * 0.55) * box.width * 0.5 * spread;
        frags.push({
          x: box.centerX + Math.cos(ang) * rad * 0.7,
          y: box.centerY + Math.sin(ang) * rad * 0.5,
          vx: Math.cos(ang) * (0.25 + Math.random() * 0.5) * spread,
          vy: (Math.random() - 0.55) * 0.7 * spread,
          life: 0,
          maxLife: MOTION.name.fragmentLifeTicks * (0.75 + Math.random() * 0.5),
          ch: DECODE_GLYPHS[(Math.random() * DECODE_GLYPHS.length) | 0],
          ink: FRAG_INK[(Math.random() * FRAG_INK.length) | 0],
          size: 9 + Math.random() * 5,
        });
      }
      /* rate-limit spawning per glyph so a fast pointer cannot flood it */
      spawnClockRef.current[index] = now;
      ensureLoop();
    },
    [ensureLoop, reducedMotion]
  );

  /* ── clear the pointer field (recovery path) ── */
  const resetPointer = useCallback(() => {
    pointerRef.current = null;
    cellRefs.current.forEach((cell, i) => {
      if (!cell) return;
      cell.style.setProperty('--sx', '0px');
      cell.style.setProperty('--sy', '0px');
      cell.style.setProperty('--d', '0');
      cell.classList.remove('sig-near');
      dRef.current[i] = 0;
    });
    ensureLoop(); /* let any in-flight fragments finish, then it stops itself */
  }, [ensureLoop]);

  /* ── initial reveal: glyph field → per-letter stabilisation ── */
  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    clearTimers();
    if (!host) return;
    measure();

    if (reducedMotion || !canvas) {
      setDecoded(true);
      cellRefs.current.forEach((c) => c?.classList.add('sig-locked'));
      return;
    }

    const n = MOTION.name;
    const dpr = Math.min(window.devicePixelRatio || 1, MOTION.canvas.maxDpr);
    const w = host.offsetWidth;
    const h = host.offsetHeight;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setDecoded(true);
      return;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    setDecoded(false);
    dRef.current = clusters.map(() => 0);
    spawnClockRef.current = clusters.map(() => 0);
    cellRefs.current.forEach((c) => c?.classList.remove('sig-locked', 'sig-near', 'sig-pulse'));

    /* The identity emerges FROM a digital field: seed fragments across
       every glyph box first, so the letters reconstruct out of standing
       signal rather than fading in from nothing. */
    clusters.forEach((_, i) => burst(i, 2, 1.5));

    /* Each letter then stabilises on its own beat, out of its own fragments. */
    const step = n.lockStaggerSeconds * 1000;
    clusters.forEach((_, i) => {
      const at = n.decodeSeconds * 620 + i * step;
      timersRef.current.push(
        setTimeout(() => {
          cellRefs.current[i]?.classList.add('sig-locked');
          burst(i, n.fragmentsPerGlyph, 1.25);
        }, at)
      );
    });
    timersRef.current.push(
      setTimeout(
        () => setDecoded(true),
        n.decodeSeconds * 620 + clusters.length * step + n.lockSeconds * 1000
      )
    );

    return () => {
      clearTimers();
      resetPointer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, measure, clearTimers, resetPointer, burst]);

  /* ── page change: one short LOCAL decode pulse, never a full replay ── */
  const firstPulse = useRef(true);
  useEffect(() => {
    if (firstPulse.current) {
      firstPulse.current = false;
      return;
    }
    if (reducedMotion) return;
    const n = Math.max(1, Math.min(3, clusters.length));
    const start = pulseKey % Math.max(1, clusters.length);
    const touched: number[] = [];
    for (let k = 0; k < n; k++) {
      const i = (start + k) % clusters.length;
      const cell = cellRefs.current[i];
      if (!cell) continue;
      touched.push(i);
      cell.classList.add('sig-pulse');
      burst(i, Math.max(2, Math.round(MOTION.name.fragmentsPerGlyph * 0.7)), 0.9);
    }
    const id = setTimeout(() => {
      touched.forEach((i) => cellRefs.current[i]?.classList.remove('sig-pulse'));
    }, 760);
    return () => clearTimeout(id);
  }, [pulseKey, reducedMotion, clusters.length, burst]);

  /* ── pointer field: proximity diffuses a glyph, distance rebuilds it ── */
  const applyPointer = useCallback(() => {
    const p = pointerRef.current;
    const host = hostRef.current;
    if (!p || !host) return;
    const hostRect = host.getBoundingClientRect();
    const px = p.x - hostRect.left;
    const py = p.y - hostRect.top;
    const { pointerRadiusPx, pointerMaxShiftPx } = MOTION.name;

    cellRefs.current.forEach((cell, i) => {
      if (!cell) return;
      const box = boxesRef.current[i];
      if (!box) return;
      const dx = box.centerX - px;
      const dy = box.centerY - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const influence = Math.max(0, 1 - dist / pointerRadiusPx);
      if (influence <= 0.01) {
        if ((dRef.current[i] ?? 0) !== 0) {
          cell.style.setProperty('--sx', '0px');
          cell.style.setProperty('--sy', '0px');
          cell.style.setProperty('--d', '0');
          cell.classList.remove('sig-near');
          dRef.current[i] = 0;
        }
        return;
      }
      const eased = influence * influence;
      cell.style.setProperty('--sx', `${(dx / (dist || 1)) * eased * pointerMaxShiftPx}px`);
      cell.style.setProperty('--sy', `${(-eased * pointerMaxShiftPx * 0.6).toFixed(2)}px`);
      cell.style.setProperty('--d', eased.toFixed(3));
      cell.classList.toggle('sig-near', eased > 0.3);
      dRef.current[i] = eased;

      /* diffusion trail: spawn only when the glyph newly becomes unstable,
         rate-limited per glyph so a fast drag stays a trail, not a flood */
      const clock = spawnClockRef.current[i] ?? 0;
      if (eased > 0.35 && performance.now() - clock > MOTION.name.fragmentCooldownMs) {
        burst(i, 2);
      }
    });
  }, [burst]);

  /* hand the applier to the loop */
  useEffect(() => {
    applyPointerRef.current = applyPointer;
  }, [applyPointer]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (reducedMotion) return;
      /* cheap: store the point and make sure the loop is awake. The field
         itself is computed once per animation frame, not per event. */
      pointerRef.current = { x: e.clientX, y: e.clientY };
      ensureLoop();
    },
    [ensureLoop, reducedMotion]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (reducedMotion) return;
      pointerRef.current = { x: e.clientX, y: e.clientY };
      /* a tap is a localised signal disturbance at the touched glyph */
      const host = hostRef.current;
      if (!host) return;
      const hostRect = host.getBoundingClientRect();
      const px = e.clientX - hostRect.left;
      const py = e.clientY - hostRect.top;
      let best = -1;
      let bestDist = Infinity;
      boxesRef.current.forEach((b, i) => {
        const d = Math.hypot(b.centerX - px, b.centerY - py);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      if (best >= 0 && bestDist < (boxesRef.current[best]?.width ?? 0) * 1.2) {
        burst(best, MOTION.name.fragmentsPerGlyph, 1.4);
      }
      ensureLoop();
    },
    [burst, ensureLoop, reducedMotion]
  );

  /* ── recovery: never leave a glyph stuck in a distorted state ── */
  useEffect(() => {
    if (reducedMotion) return;
    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        resetPointer();
        fragsRef.current = [];
        stopLoop();
      }
    };
    const onResize = () => {
      resetPointer();
      measure();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('resize', onResize);
    window.addEventListener('blur', resetPointer);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('blur', resetPointer);
      resetPointer();
      stopLoop();
    };
  }, [reducedMotion, resetPointer, measure, stopLoop]);

  const cls = ['sig-name', reducedMotion ? 'sig-static' : '', decoded ? 'sig-decoded' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <span
      ref={hostRef}
      className={cls}
      aria-label={text}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={resetPointer}
      onPointerLeave={resetPointer}
      onPointerCancel={resetPointer}
    >
      {!reducedMotion && <canvas ref={canvasRef} className="sig-canvas" aria-hidden />}
      <span className="sig-glyphs">
        {clusters.map((cluster, i) => (
          <span
            key={`${cluster}-${i}`}
            ref={(el) => {
              cellRefs.current[i] = el;
            }}
            className={`sig-cell${cluster === ' ' ? ' sig-space' : ''}`}
            style={{ '--i': i } as CSSProperties}
            aria-hidden
          >
            <span className="sig-ink">{cluster === ' ' ? '\u00a0' : cluster}</span>
          </span>
        ))}
      </span>
    </span>
  );
}
