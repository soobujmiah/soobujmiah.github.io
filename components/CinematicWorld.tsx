'use client';

/* ═══════════════════════════════════════════════════════════════
   CINEMATIC WORLD — mounts the real-time WebGL environment, with an
   honest three-step fallback chain:

     1. WebGL available  → lazy-load the three.js scene module
        (components/cinematic-scene.ts); the pager index drives the
        camera flight, the pointer drives a small orbit.
     2. WebGL unavailable, lost, or the module fails → the proven
        Canvas 2D environment (SiliconWorld) mounts unchanged.
     3. No JavaScript → the .cinematic-world CSS gradient remains
        and every chapter stays server-rendered, readable HTML.

   Discipline shared with the 2D environment: device pixel ratio is
   capped (Math.min(window.devicePixelRatio, cap) inside the DPR
   policy), rendering pauses on visibilitychange/document.hidden,
   resize tracks a ResizeObserver, reduced motion renders one static
   composition per chapter, and the scene is fully disposed on
   unmount. Decorative: aria-hidden, no pointer events.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from 'react';
import { SiliconWorld } from '@/components/SiliconWorld';
import type { CinematicHandle } from '@/components/cinematic-scene';
import { useLang } from '@/app/language';

function webglSupported(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return false;
    (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function CinematicWorld({ sceneIndex, beatIndex, reducedMotion }: { sceneIndex: number; beatIndex: number; reducedMotion: boolean }) {
  const { lang } = useLang();
  const [mode, setMode] = useState<'probing' | 'webgl' | 'fallback'>('probing');
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<CinematicHandle | null>(null);
  const lastAnchor = useRef({ x: -1, y: -1 });
  const indexRef = useRef(sceneIndex);
  indexRef.current = sceneIndex;
  const beatRef = useRef(beatIndex);
  beatRef.current = beatIndex;
  const reducedRef = useRef(reducedMotion);
  reducedRef.current = reducedMotion;
  const langRef = useRef(lang);
  langRef.current = lang;

  useEffect(() => {
    document.documentElement.dataset.sceneMode = mode;
    return () => { delete document.documentElement.dataset.sceneMode; };
  }, [mode]);

  /* Probe, then lazy-load three.js only when it can actually run. */
  useEffect(() => {
    if (!webglSupported()) {
      setMode('fallback');
      return;
    }
    let cancelled = false;
    setMode('webgl');
    (async () => {
      try {
        const mod = await import('@/components/cinematic-scene');
        if (cancelled || !canvasRef.current || !hostRef.current) return;
        const coarse = window.matchMedia('(pointer: coarse)').matches;
        const handle = mod.createCinematicScene(canvasRef.current, {
          chapter: indexRef.current,
          beat: beatRef.current,
          reducedMotion: reducedRef.current,
          coarse,
          lang: langRef.current,
          onAnchor: (x, y) => {
            const root = hostRef.current?.parentElement;
            if (!root) return;
            if (Math.abs(lastAnchor.current.x - x) < .0015 && Math.abs(lastAnchor.current.y - y) < .0015) return;
            lastAnchor.current = { x, y };
            root.style.setProperty('--anchor-x', `${(x * 100).toFixed(2)}%`);
            root.style.setProperty('--anchor-y', `${(y * 100).toFixed(2)}%`);
          },
          onContextLost: () => {
            handleRef.current?.dispose();
            handleRef.current = null;
            setMode('fallback');
          },
        });
        handleRef.current = handle;
        const rect = hostRef.current.getBoundingClientRect();
        handle.resize(rect.width, rect.height);
      } catch {
        if (!cancelled) setMode('fallback');
      }
    })();
    return () => {
      cancelled = true;
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, []);

  /* The pager index is the camera's destination. */
  useEffect(() => {
    handleRef.current?.setChapter(sceneIndex);
  }, [sceneIndex, mode]);

  useEffect(() => {
    handleRef.current?.setBeat(beatIndex);
  }, [beatIndex, mode]);

  useEffect(() => {
    handleRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion, mode]);

  useEffect(() => {
    handleRef.current?.setLanguage(lang);
  }, [lang, mode]);

  /* Pause while the tab is hidden; resume on return. */
  useEffect(() => {
    if (mode !== 'webgl') return;
    const onVis = () => handleRef.current?.setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [mode]);

  /* Native-resolution resize. */
  useEffect(() => {
    if (mode !== 'webgl') return;
    const host = hostRef.current;
    if (!host || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (e) handleRef.current?.resize(e.contentRect.width, e.contentRect.height);
    });
    ro.observe(host);
    return () => ro.disconnect();
  }, [mode]);

  /* Pointer orbit — fine pointers only; phones hold the shot still
     (same policy the 2D environment shipped with). Window-level and
     passive: nothing is intercepted from the page. */
  useEffect(() => {
    if (mode !== 'webgl' || reducedMotion) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      handleRef.current?.setPointer(nx, ny);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [mode, reducedMotion]);

  if (mode === 'fallback') {
    return <SiliconWorld sceneIndex={sceneIndex} reducedMotion={reducedMotion} />;
  }

  /* data-shot server-renders each route's own camera composition index,
     so the static artifact proves every chapter pre-renders its shot. */
  return (
    <div ref={hostRef} className="cinematic-world" aria-hidden data-shot={sceneIndex}>
      <canvas ref={canvasRef} className="cinematic-canvas" />
    </div>
  );
}
