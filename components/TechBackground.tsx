'use client';

import { useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════════
   TECH BACKGROUND — live interactive particle network.

   - Drifting nodes + proximity links, pointer-reactive (nodes near
     the pointer glow and links brighten; taps emit ripple rings).
   - Slow scanline sweep + a pulse ring from center on every page
     change (driven by pulseKey).
   - Capped DPR + particle count, pauses when the tab is hidden,
     single static frame under prefers-reduced-motion.
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  reducedMotion: boolean;
  pulseKey: number;
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  core: boolean;
}

interface Ripple {
  x: number;
  y: number;
  r: number;
  a: number;
}

export function TechBackground({ reducedMotion, pulseKey }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pulseRef = useRef(pulseKey);

  useEffect(() => {
    pulseRef.current = pulseKey;
  }, [pulseKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      return;
    }
    if (!ctx) return;
    const g = ctx;

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = true;
    let lastPulse = pulseRef.current;
    let nodes: Node[] = [];
    const ripples: Ripple[] = [];
    const pointer = { x: -9999, y: -9999, down: false };

    const seed = () => {
      const count = Math.max(24, Math.min(90, Math.floor((w * h) / 22000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 1 + Math.random() * 1.8,
        core: Math.random() < 0.18,
      }));
    };

    const resize = () => {
      try {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        seed();
        if (reducedMotion) draw(0);
      } catch {
        /* ignore */
      }
    };

    const LINK = 130;

    const draw = (t: number) => {
      g.clearRect(0, 0, w, h);

      /* links */
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > LINK * LINK) continue;
          const d = Math.sqrt(d2);
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const pdx = mx - pointer.x;
          const pdy = my - pointer.y;
          const near = pdx * pdx + pdy * pdy < 160 * 160;
          const alpha = (1 - d / LINK) * (near ? 0.5 : 0.22);
          g.strokeStyle = `rgba(34,197,94,${alpha.toFixed(3)})`;
          g.lineWidth = near ? 1.4 : 1;
          g.beginPath();
          g.moveTo(a.x, a.y);
          g.lineTo(b.x, b.y);
          g.stroke();
        }
      }

      /* nodes */
      for (const n of nodes) {
        const pdx = n.x - pointer.x;
        const pdy = n.y - pointer.y;
        const near = pdx * pdx + pdy * pdy < 150 * 150;
        const tw = 0.55 + 0.45 * Math.sin(t / 700 + n.x * 0.05 + n.y * 0.03);
        const alpha = (near ? 0.95 : 0.6) * tw;
        g.fillStyle = n.core
          ? `rgba(220,255,230,${alpha.toFixed(3)})`
          : `rgba(74,222,128,${alpha.toFixed(3)})`;
        g.beginPath();
        g.arc(n.x, n.y, n.r * (near ? 1.5 : 1), 0, Math.PI * 2);
        g.fill();
      }

      /* scanline sweep */
      const progress = (t / 9000) % 1.3 - 0.15;
      const sy = progress * h;
      const grad = g.createLinearGradient(0, sy - 70, 0, sy + 70);
      grad.addColorStop(0, 'rgba(34,197,94,0)');
      grad.addColorStop(0.5, 'rgba(34,197,94,0.055)');
      grad.addColorStop(1, 'rgba(34,197,94,0)');
      g.fillStyle = grad;
      g.fillRect(0, sy - 70, w, 140);

      /* ripples */
      for (const r of ripples) {
        g.strokeStyle = `rgba(74,222,128,${Math.max(r.a, 0).toFixed(3)})`;
        g.lineWidth = 1.5;
        g.beginPath();
        g.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        g.stroke();
      }
    };

    const step = (t: number) => {
      if (!running) return;

      /* page-change pulse from center */
      if (lastPulse !== pulseRef.current) {
        lastPulse = pulseRef.current;
        ripples.push({ x: w / 2, y: h / 2, r: 10, a: 0.5 });
      }

      for (const n of nodes) {
        /* gentle pointer repulsion */
        const dx = n.x - pointer.x;
        const dy = n.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 130 * 130 && d2 > 1) {
          const d = Math.sqrt(d2);
          const f = ((130 - d) / 130) * 0.6;
          n.vx += (dx / d) * f * 0.08;
          n.vy += (dy / d) * f * 0.08;
        }
        /* clamp speed */
        const sp = Math.hypot(n.vx, n.vy) || 1;
        const max = 0.7;
        if (sp > max) {
          n.vx = (n.vx / sp) * max;
          n.vy = (n.vy / sp) * max;
        }
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -20) n.x = w + 20;
        if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        if (n.y > h + 20) n.y = -20;
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].r += 4;
        ripples[i].a -= 0.008;
        if (ripples[i].a <= 0) ripples.splice(i, 1);
      }

      draw(t);
      raf = requestAnimationFrame(step);
    };

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    const onDown = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.down = true;
      if (ripples.length < 6) ripples.push({ x: e.clientX, y: e.clientY, r: 6, a: 0.55 });
    };
    const onUp = () => {
      pointer.down = false;
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };
    const onVis = () => {
      try {
        if (document.hidden) {
          running = false;
          cancelAnimationFrame(raf);
        } else if (!reducedMotion) {
          running = true;
          raf = requestAnimationFrame(step);
        }
      } catch {
        /* ignore */
      }
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('visibilitychange', onVis);

    if (!reducedMotion) {
      raf = requestAnimationFrame(step);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('visibilitychange', onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className="tech-bg" aria-hidden />;
}
