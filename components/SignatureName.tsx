'use client';

/* ═══════════════════════════════════════════════════════════════
   SIGNATURE NAME — a digital reconstruction of the identity mark.

   Concept: the name is treated as a *signal being resolved*. On
   entry, a decode field of falling glyphs sweeps across the word and
   locks glyph by glyph into precise typography. Afterwards the name
   is stable, legible, and quietly alive: a slow sweep passes through
   it, the pointer locally distorts nearby glyphs (they diffuse and
   converge back), and a page change triggers a short re-decode
   flash rather than replaying the whole sequence.

   Engineering contract
   --------------------
   - Legibility first: the real name is always real DOM text, in the
     correct font, selectable, and painted ABOVE the decode canvas.
     The canvas can never obscure it.
   - Grapheme-safe: Bengali clusters (মি, য়া) are never split, so
     shaping stays correct. `Intl.Segmenter` when available, with a
     combining-mark-aware fallback.
   - Compositor-friendly: interaction and lock animate transform +
     opacity only. No animated filter/blur stacks.
   - Bounded: the decode canvas runs for one short sequence and then
     stops. Idle motion is pure CSS. The pointer loop only runs while
     a pointer is actually over the name.
   - Reduced motion: no canvas, no sweep, no distortion — a calm,
     fully designed static mark instead.
   ═══════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MOTION } from '@/app/design-tokens';
import { segmentGraphemes } from '@/app/graphemes';

/** Deliberately restrained: digits plus a few katakana, not a wall of green. */
const DECODE_GLYPHS = '0123456789ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎ';

interface GlyphBox {
  centerX: number;
  top: number;
  height: number;
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
  const rafRef = useRef(0);
  const pointerRaf = useRef(0);
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const [decoded, setDecoded] = useState(reducedMotion);

  /* ── measure the real glyph boxes (used by canvas + pointer field) ── */
  const measure = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;
    const hostRect = host.getBoundingClientRect();
    const boxes: GlyphBox[] = [];
    cellRefs.current.forEach((cell) => {
      if (!cell) return;
      const r = cell.getBoundingClientRect();
      boxes.push({ centerX: r.left - hostRect.left + r.width / 2, top: r.top - hostRect.top, height: r.height });
    });
    boxesRef.current = boxes;
  }, []);

  /* ── clear pointer distortion (recovery path) ── */
  const resetPointer = useCallback(() => {
    pointerRef.current = null;
    if (pointerRaf.current) {
      cancelAnimationFrame(pointerRaf.current);
      pointerRaf.current = 0;
    }
    cellRefs.current.forEach((cell) => {
      if (!cell) return;
      cell.style.setProperty('--sx', '0px');
      cell.style.setProperty('--sy', '0px');
      cell.classList.remove('sig-near');
    });
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  /* ── decode sequence (once on mount, and lightly on page change) ── */
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
    cellRefs.current.forEach((c) => c?.classList.remove('sig-locked'));

    /* Glyph lock is staggered in the DOM (transform + opacity only). */
    const base = n.decodeSeconds * 0.62 * 1000;
    clusters.forEach((_, i) => {
      timersRef.current.push(
        setTimeout(() => cellRefs.current[i]?.classList.add('sig-locked'), base + i * n.lockStaggerSeconds * 1000)
      );
    });
    timersRef.current.push(setTimeout(() => setDecoded(true), base + clusters.length * n.lockStaggerSeconds * 1000 + n.lockSeconds * 1000));

    /* Decode field: falling glyphs with a bright head sweeping left→right.
       Capped density, capped DPR, cancelled the moment it is done. */
    const columns = Math.max(6, Math.min(18, Math.round(w / 26)));
    const start = performance.now();
    const total = (n.decodeSeconds + 0.35) * 1000;
    const seed = Array.from({ length: columns }, () => Math.random() * 1000);

    const frame = (now: number) => {
      const elapsed = now - start;
      if (elapsed > total) {
        ctx.clearRect(0, 0, w, h);
        return;
      }
      const t = elapsed / total;
      ctx.clearRect(0, 0, w, h);
      const head = w * Math.min(1, t * 1.35);

      for (let c = 0; c < columns; c++) {
        const x = ((c + 0.5) / columns) * w;
        const proximity = Math.max(0, 1 - Math.abs(x - head) / (w * 0.32));
        if (proximity <= 0.02) continue;
        const fall = ((elapsed * 0.16 + seed[c]) % (h + 60)) - 30;
        const chars = 3 + Math.round(proximity * 3);
        for (let k = 0; k < chars; k++) {
          const y = fall - k * 15;
          if (y < -18 || y > h + 18) continue;
          const fade = (1 - k / chars) * proximity * (1 - t * 0.55);
          if (fade <= 0.03) continue;
          ctx.fillStyle = `rgba(52, 211, 153, ${(fade * 0.85).toFixed(3)})`;
          ctx.font = `${k === 0 ? 15 : 13}px ui-monospace, monospace`;
          ctx.fillText(DECODE_GLYPHS[(c * 7 + k * 3 + (elapsed / 90 | 0)) % DECODE_GLYPHS.length], x - 5, y + 12);
        }
      }

      /* decode head — a thin, precise scan bar */
      if (head < w) {
        const grad = ctx.createLinearGradient(head - 26, 0, head + 6, 0);
        grad.addColorStop(0, 'rgba(34,197,94,0)');
        grad.addColorStop(1, 'rgba(134,239,172,0.5)');
        ctx.fillStyle = grad;
        ctx.fillRect(head - 26, 0, 32, h);
      }
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimers();
      resetPointer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, measure, clearTimers, resetPointer]);

  /* ── light re-decode flash when the page changes (never a full replay) ── */
  const firstPulse = useRef(true);
  useEffect(() => {
    if (firstPulse.current) {
      firstPulse.current = false;
      return;
    }
    const host = hostRef.current;
    if (!host || reducedMotion) return;
    host.classList.add('sig-flash');
    const id = setTimeout(() => host.classList.remove('sig-flash'), MOTION.name.redecodeSeconds * 1000);
    return () => clearTimeout(id);
  }, [pulseKey, reducedMotion]);

  /* ── pointer proximity field: glyphs diffuse, then converge back ── */
  const applyPointer = useCallback(() => {
    pointerRaf.current = 0;
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
      const dy = box.top + box.height / 2 - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const influence = Math.max(0, 1 - dist / pointerRadiusPx);
      if (influence <= 0.01) {
        cell.style.setProperty('--sx', '0px');
        cell.style.setProperty('--sy', '0px');
        cell.classList.remove('sig-near');
        return;
      }
      const eased = influence * influence;
      cell.style.setProperty('--sx', `${(dx / (dist || 1)) * eased * pointerMaxShiftPx}px`);
      cell.style.setProperty('--sy', `${(-eased * pointerMaxShiftPx * 0.6).toFixed(2)}px`);
      cell.classList.toggle('sig-near', eased > 0.35);
    });
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (reducedMotion) return;
      pointerRef.current = { x: e.clientX, y: e.clientY };
      if (!pointerRaf.current) pointerRaf.current = requestAnimationFrame(applyPointer);
    },
    [applyPointer, reducedMotion]
  );

  /* ── recovery: never leave a glyph stuck in a distorted state ── */
  useEffect(() => {
    if (reducedMotion) return;
    const onHide = () => {
      if (document.visibilityState === 'hidden') resetPointer();
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
    };
  }, [reducedMotion, resetPointer, measure]);

  const cls = [
    'sig-name',
    reducedMotion ? 'sig-static' : '',
    decoded ? 'sig-decoded' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      ref={hostRef}
      className={cls}
      aria-label={text}
      onPointerMove={onPointerMove}
      onPointerLeave={resetPointer}
      onPointerCancel={resetPointer}
    >
      {!reducedMotion && <canvas ref={canvasRef} className="sig-canvas" aria-hidden />}
      {!reducedMotion && <span className="sig-sweep" aria-hidden />}
      <span className="sig-glyphs">
        {clusters.map((cluster, i) => (
          <span
            key={`${cluster}-${i}`}
            ref={(el) => {
              cellRefs.current[i] = el;
            }}
            className={`sig-cell${cluster === ' ' ? ' sig-space' : ''}`}
            aria-hidden
          >
            <span className="sig-ink">{cluster === ' ' ? '\u00a0' : cluster}</span>
          </span>
        ))}
      </span>
    </span>
  );
}
