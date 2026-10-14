'use client';

/* ═══════════════════════════════════════════════════════════════
   STAGE FALLBACK — the same machine, drawn with Canvas 2D.

   This is what a browser without WebGL sees. It is deliberately the
   SAME subject from the SAME numbers (`app/stage.ts`): the strata,
   their apertures, their depths and the evidence marks. A reader
   without WebGL sees a quieter version of one place, not a different
   site — which is the whole point of having one subject.

   It carries the same discipline as the WebGL stage: capped device
   pixel ratio, redraw at native resolution on resize, paused when
   the tab is hidden, and a single static frame under reduced motion.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from 'react';
import { BRAND } from '@/app/design-tokens';
import { failedCount, humanClaimCount, verifiedCount } from '@/app/verification';
import {
  FLIGHT,
  STANDOFF,
  STRATA,
  distributeMarks,
  makeDamped,
  damp,
  stationFor,
  stratumPresence,
} from '@/app/stage';

/** Perspective focal length in CSS pixels, scaled by viewport size. */
const FOCAL = 0.9;

export function StageFallback({ chapter, reducedMotion }: { chapter: number; reducedMotion: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chapterRef = useRef(chapter);
  chapterRef.current = chapter;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    /* Named separately so the narrowing survives into the paint
       functions below: a `const` narrowed by an early return is not
       re-narrowed inside a hoisted function declaration. */
    const ctx: CanvasRenderingContext2D = context;

    const marks = distributeMarks(verifiedCount, failedCount, humanClaimCount);
    const depth = makeDamped(stationFor(chapterRef.current).z);
    const lateral = makeDamped(stationFor(chapterRef.current).lateral);

    let width = 1;
    let height = 1;
    let ratio = 1;
    let raf = 0;
    let last = 0;
    let paused = false;
    let disposed = false;

    const measure = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      /* Cap the device pixel ratio: a 3x phone would otherwise draw
         nine times the pixels for line work nobody can resolve. */
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      paint();
    };

    function project(worldZ: number, camZ: number): number | null {
      const dz = camZ - worldZ;
      if (dz <= 0.6) return null;
      return (FOCAL * Math.min(width, height)) / dz;
    }

    function paint() {
      if (disposed) return;
      const camZ = depth.value;
      const shiftX = width * (width > height ? 0.14 : 0);
      const cx = width / 2 + shiftX - lateral.value * 6;
      const cy = height / 2 + height * 0.04;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = BRAND.bg;
      ctx.fillRect(0, 0, width, height);

      /* Far strata first, so nearer ones draw over them. */
      for (let i = STRATA.length - 1; i >= 0; i -= 1) {
        const s = STRATA[i];
        if (!s) continue;
        const scale = project(s.z, camZ);
        if (scale === null) continue;
        const presence = stratumPresence(i, camZ);
        if (presence <= 0.002) continue;

        const outer = s.halfWidth * scale;
        const inner = s.aperture * scale;
        /* The plane the camera is inside overflows the frame: its outer
           edge is behind the viewer in every direction, so drawing it
           puts a stray hairline across the composition (measured at
           x=389 on a 1440×900 frame before this guard). Only its
           aperture and marks belong on screen. */
        /* A rectangle that is only PARTLY on screen contributes one or
           two straight edges and nothing else, which reads as a UI rule
           ruled across the page rather than as depth. (Measured on the
           home chapter: the rim of stratum 0 drew a single green line
           down x=389 of a 1440-wide frame, because its right edge fell
           at 1453.) So a plane's face and its aperture are drawn only
           while their whole rectangle is inside the frame; once the
           camera is standing in the doorway, the strata ahead are what
           carries the depth. */
        const inFrame = (half: number) =>
          cx - half > -1 && cx + half < width + 1 && cy - half > -1 && cy + half < height + 1;
        const framed = inFrame(outer);
        const rimFramed = inFrame(inner);

        if (framed) {
          /* The plane's face, as a filled frame between the two rects. */
          ctx.beginPath();
          ctx.rect(cx - outer, cy - outer, outer * 2, outer * 2);
          ctx.rect(cx - inner, cy - inner, inner * 2, inner * 2);
          ctx.fillStyle = `rgba(228,226,223,${(0.012 + presence * 0.03).toFixed(4)})`;
          ctx.fill('evenodd');

          /* Outer edge. */
          ctx.strokeStyle = `rgba(228,226,223,${(0.04 + presence * 0.14).toFixed(4)})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(cx - outer, cy - outer, outer * 2, outer * 2);
        }

        /* The aperture rim — the brightest line in the frame. */
        if (rimFramed) {
          ctx.strokeStyle = `rgba(74,222,128,${(0.1 + presence * 0.6).toFixed(4)})`;
          ctx.lineWidth = presence > 0.6 ? 1.4 : 1;
          ctx.strokeRect(cx - inner, cy - inner, inner * 2, inner * 2);
        }

        /* A few etch rules, enough to read as machinery. */
        ctx.strokeStyle = `rgba(228,226,223,${(0.02 + presence * 0.09).toFixed(4)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let k = 1; framed && k <= 4; k += 1) {
          const y = cy - outer + ((outer * 2) / 5) * k;
          if (Math.abs(y - cy) < inner) continue;
          ctx.moveTo(cx - outer, y);
          ctx.lineTo(cx + outer, y);
        }
        ctx.stroke();

        /* The evidence marks for this stratum. */
        for (const m of marks) {
          if (m.stratum !== i || !rimFramed) continue;
          const r = (s.aperture + 0.95) * scale;
          const mx = cx + Math.cos(m.angle) * r;
          const my = cy + Math.sin(m.angle) * r;
          const dim = m.state === 'failed' ? 0.3 : m.state === 'attested' ? 0.55 : 1;
          ctx.fillStyle =
            m.state === 'failed'
              ? `rgba(228,226,223,${(presence * dim).toFixed(3)})`
              : m.state === 'attested'
                ? `rgba(16,185,129,${(presence * dim).toFixed(3)})`
                : `rgba(74,222,128,${(presence * dim).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(mx, my, Math.max(1, 1.6 * Math.min(2, scale / 8)), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function frame(now: number) {
      raf = 0;
      if (disposed || paused || reducedMotion) return;
      const dt = last === 0 ? 1 / 60 : Math.min(0.05, (now - last) / 1000);
      last = now;
      const station = stationFor(chapterRef.current);
      damp(depth, station.z, FLIGHT.depth, dt);
      damp(lateral, station.lateral, FLIGHT.lateral, dt);
      paint();
      const settled =
        Math.abs(depth.value - station.z) < 0.01 && Math.abs(lateral.value - station.lateral) < 0.01;
      if (!settled) raf = requestAnimationFrame(frame);
    }

    const start = () => {
      if (disposed || paused || reducedMotion || raf) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };

    if (reducedMotion) {
      const station = stationFor(chapterRef.current);
      depth.value = station.z;
      lateral.value = station.lateral;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    measure();
    start();

    const onVisibility = () => {
      paused = document.hidden;
      if (paused) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      } else {
        start();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    /* Re-aim whenever the chapter changes: the parent re-renders this
       effect's host, and a plain interval would keep a phone awake. */
    const onChapter = () => start();
    window.addEventListener('stage:chapter', onChapter);

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('stage:chapter', onChapter);
    };
  }, [reducedMotion]);

  /* The chapter prop drives the damped flight through a cheap custom
     event rather than a re-created render loop. */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const station = stationFor(chapter);
    if (station) window.dispatchEvent(new Event('stage:chapter'));
  }, [chapter]);

  return <canvas className="stage-canvas stage-canvas--fallback" ref={canvasRef} />;
}
