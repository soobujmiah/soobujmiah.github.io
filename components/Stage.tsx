'use client';

/* ═══════════════════════════════════════════════════════════════
   STAGE HOST — mounts the one environment and nothing else.

   Responsibilities, in order of importance:

     1. Never cost a route anything it cannot use. three.js is
        imported dynamically, and only after a real WebGL context has
        been proven on a throwaway canvas. A machine without WebGL
        downloads none of it and gets `StageFallback` instead.
     2. Never draw when it cannot be seen. The scene pauses on
        `visibilitychange` and while the element is off-screen.
     3. Respect `prefers-reduced-motion`: one static frame per
        chapter, no animation loop at all.
     4. Server-render an empty, inert canvas so every route ships the
        environment as markup (and a CSS gradient when JavaScript
        never arrives). The text of the page never depends on this
        component — see components/Chapter.tsx.

   There is exactly one of these on a page. If a second environment
   ever appears in this repository, that is the bug the whole
   "Inside One Device" architecture exists to prevent.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from 'react';
import { BRAND } from '@/app/design-tokens';
import { failedCount, humanClaimCount, verifiedCount } from '@/app/verification';
import { StageFallback } from '@/components/StageFallback';
import type { StageHandle } from '@/components/stage-scene';

/** Can this browser give us a real WebGL context at all? Probed on a
    throwaway canvas so the live one stays unclaimed for three.js. */
function hasWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl =
      probe.getContext('webgl2') ??
      probe.getContext('webgl') ??
      probe.getContext('experimental-webgl');
    if (!gl) return false;
    /* Release it immediately; some drivers only allow a few contexts. */
    const lose = (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context');
    lose?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function Stage({ chapter, reducedMotion }: { chapter: number; reducedMotion: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<StageHandle | null>(null);
  const [fallback, setFallback] = useState(false);

  /* ── Create / destroy ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    if (!hasWebGL()) {
      setFallback(true);
      return;
    }

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    const coarsePointer =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(pointer: coarse)').matches
        : false;

    import('@/components/stage-scene')
      .then(({ createStage }) => {
        if (cancelled || !canvasRef.current) return;
        const handle = createStage(canvasRef.current, {
          colors: {
            bg: BRAND.bg,
            fg: BRAND.fg,
            accent: BRAND.accent,
            accentBright: BRAND.accentBright,
            signal: BRAND.signal,
          },
          /* The scene is a readout of the generated evidence summary,
             not a decorated guess at it. */
          evidence: {
            verified: verifiedCount,
            failed: failedCount,
            attested: humanClaimCount,
          },
          reducedMotion,
          coarsePointer,
        });
        handleRef.current = handle;

        const measure = () => {
          const rect = host.getBoundingClientRect();
          handle.resize(rect.width, rect.height, window.devicePixelRatio || 1);
        };
        measure();
        handle.setChapter(chapter);

        /* Native resolution on every resize, including the mobile
           URL-bar collapse that fires no window resize event. */
        resizeObserver = new ResizeObserver(measure);
        resizeObserver.observe(host);
      })
      .catch(() => {
        if (!cancelled) setFallback(true);
      });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      handleRef.current?.dispose();
      handleRef.current = null;
    };
    /* Deliberately created once: chapter and motion changes are pushed
       through the handle rather than remounting the renderer. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Chapter changes ── */
  useEffect(() => {
    handleRef.current?.setChapter(chapter);
  }, [chapter]);

  /* ── Pause when the tab is hidden or the host scrolls away ── */
  useEffect(() => {
    const onVisibility = () => handleRef.current?.setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);

    const host = hostRef.current;
    let io: IntersectionObserver | null = null;
    if (host && typeof IntersectionObserver === 'function') {
      io = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry) handleRef.current?.setPaused(!entry.isIntersecting || document.hidden);
        },
        { threshold: 0 }
      );
      io.observe(host);
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      io?.disconnect();
    };
  }, []);

  /* ── Pointer parallax (fine pointers only) ── */
  useEffect(() => {
    if (reducedMotion) return;
    if (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches) {
      return;
    }
    const onMove = (e: PointerEvent) => {
      const x = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      const y = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
      handleRef.current?.setPointer(x, y);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reducedMotion]);

  return (
    <div className="stage" aria-hidden="true" data-stratum={chapter} ref={hostRef}>
      {/* The canvas is server-rendered and empty. Without JavaScript the
          `.stage` CSS gradient is the whole environment, and the page
          still reads as a complete document. */}
      <canvas className="stage-canvas" ref={canvasRef} />
      {fallback && <StageFallback chapter={chapter} reducedMotion={reducedMotion} />}
    </div>
  );
}
