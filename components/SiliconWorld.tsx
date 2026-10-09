'use client';

import { useEffect, useRef } from 'react';
import { BRAND } from '@/app/design-tokens';
import { buildPlan, lerpPose, makeProjector, poseFor, type Plan, type Pose } from '@/app/silicon';

/* The site's one environment: an abstract, procedurally drawn phone-chip
   floorplan seen by a low camera (see app/silicon.ts). Two Canvas 2D
   layers: the scene (redrawn only while the camera flies) and a light
   layer of signal pulses. Drawn at native device pixels (DPR capped at
   2), paused when the tab is hidden, a static frame under reduced motion.
   Without JavaScript the CSS gradient on .silicon-world remains. */

const FLIGHT_MS = 1500;
const INTRO_MS = 1800;
const PULSE_SPEED = 230; // world units per second
const PULSE_TAIL = 150;

const STYLE = [
  { stroke: 'rgba(74, 222, 128, 0.10)', width: 0.6 },
  { stroke: 'rgba(74, 222, 128, 0.20)', width: 0.9 },
  { stroke: 'rgba(74, 222, 128, 0.42)', width: 1.3 },
] as const;

const plans: Partial<Record<'full' | 'lite', Plan>> = {};
const planFor = (detail: 'full' | 'lite') => (plans[detail] ??= buildPlan(20261009, detail));

function routeLength(route: number[]) {
  let total = 0;
  for (let i = 2; i < route.length; i += 2) total += Math.hypot(route[i] - route[i - 2], route[i + 1] - route[i - 1]);
  return total;
}

/** Point at distance d along a polyline of [x,z,…]. */
function along(route: number[], d: number, out: Float64Array) {
  let rest = d;
  for (let i = 2; i < route.length; i += 2) {
    const len = Math.hypot(route[i] - route[i - 2], route[i + 1] - route[i - 1]);
    if (rest <= len || i === route.length - 2) {
      const t = len === 0 ? 0 : Math.min(1, Math.max(0, rest / len));
      out[0] = route[i - 2] + (route[i] - route[i - 2]) * t;
      out[1] = route[i - 1] + (route[i + 1] - route[i - 1]) * t;
      return;
    }
    rest -= len;
  }
}

export function SiliconWorld({ sceneIndex, reducedMotion = false }: { sceneIndex: number; reducedMotion?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLCanvasElement>(null);
  const pulseRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<{ goTo: (index: number) => void } | null>(null);
  const first = useRef(sceneIndex);

  useEffect(() => {
    const root = rootRef.current;
    const sceneCanvas = sceneRef.current;
    const pulseCanvas = pulseRef.current;
    if (!root || !sceneCanvas || !pulseCanvas) return;
    const sc = sceneCanvas.getContext('2d');
    const pc = pulseCanvas.getContext('2d');
    if (!sc || !pc) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let plan = planFor('full');
    let from: Pose = poseFor(first.current);
    let to: Pose = from;
    let start = 0;
    let duration = 0;
    let current: Pose = from;
    let frame = 0;
    let visible = !document.hidden;
    let sceneDirty = true;
    const seg = new Float64Array(5);
    const pt = new Float64Array(3);
    const xz = new Float64Array(2);
    const routes = plan.routes;
    const lengths = routes.map(routeLength);
    const phase = routes.map((_, i) => i * 0.37);

    const drawScene = (pose: Pose) => {
      const proj = makeProjector(pose, width, height);
      sc.setTransform(1, 0, 0, 1, 0, 0);
      sc.fillStyle = BRAND.bg;
      sc.fillRect(0, 0, sceneCanvas.width, sceneCanvas.height);
      sc.setTransform(dpr, 0, 0, dpr, 0, 0);

      /* a faint glow where the chip meets the dark sky */
      const hz = proj.horizon;
      if (hz > -height && hz < height * 1.2) {
        const glow = sc.createLinearGradient(0, hz - height * 0.35, 0, hz + height * 0.12);
        glow.addColorStop(0, 'rgba(34, 197, 94, 0)');
        glow.addColorStop(0.75, 'rgba(34, 197, 94, 0.07)');
        glow.addColorStop(1, 'rgba(34, 197, 94, 0)');
        sc.fillStyle = glow;
        sc.fillRect(0, Math.max(0, hz - height * 0.35), width, height);
      }

      const margin = 40;
      for (let c = 0; c < 3; c++) {
        const L = plan.lines[c];
        const style = STYLE[c];
        sc.strokeStyle = style.stroke;
        sc.lineWidth = style.width;
        sc.beginPath();
        for (let i = 0; i < L.length; i += 6) {
          if (!proj.segment(L[i], L[i + 1], L[i + 2], L[i + 3], L[i + 4], L[i + 5], seg)) continue;
          const x1 = seg[0];
          const y1 = seg[1];
          const x2 = seg[2];
          const y2 = seg[3];
          if ((x1 < -margin && x2 < -margin) || (x1 > width + margin && x2 > width + margin)) continue;
          if ((y1 < -margin && y2 < -margin) || (y1 > height + margin && y2 > height + margin)) continue;
          if (c === 0 && Math.abs(x2 - x1) + Math.abs(y2 - y1) < 0.7) continue;
          sc.moveTo(x1, y1);
          sc.lineTo(x2, y2);
        }
        sc.stroke();
      }

      /* depth haze: distant chip dissolves into the dark */
      if (hz > -height * 0.2 && hz < height) {
        const haze = sc.createLinearGradient(0, hz - 2, 0, hz + height * 0.3);
        haze.addColorStop(0, 'rgba(5, 5, 7, 1)');
        haze.addColorStop(1, 'rgba(5, 5, 7, 0)');
        sc.fillStyle = haze;
        sc.fillRect(0, Math.max(0, hz - 2), width, height);
      }
    };

    const drawPulses = (pose: Pose, now: number) => {
      pc.setTransform(1, 0, 0, 1, 0, 0);
      pc.clearRect(0, 0, pulseCanvas.width, pulseCanvas.height);
      if (reducedMotion) return;
      pc.setTransform(dpr, 0, 0, dpr, 0, 0);
      const proj = makeProjector(pose, width, height);
      pc.lineCap = 'round';
      for (let r = 0; r < routes.length; r++) {
        const total = lengths[r];
        const head = ((now / 1000) * PULSE_SPEED + phase[r] * total) % (total + PULSE_TAIL);
        let prevX = 0;
        let prevY = 0;
        let have = false;
        const steps = 10;
        for (let k = 0; k <= steps; k++) {
          const d = head - (PULSE_TAIL * (steps - k)) / steps;
          if (d < 0 || d > total) {
            have = false;
            continue;
          }
          along(routes[r], d, xz);
          if (!proj.project(xz[0], 2, xz[1], pt)) {
            have = false;
            continue;
          }
          if (have) {
            pc.strokeStyle = `rgba(74, 222, 128, ${(0.65 * k) / steps})`;
            pc.lineWidth = 1.2 + (1.2 * k) / steps;
            pc.beginPath();
            pc.moveTo(prevX, prevY);
            pc.lineTo(pt[0], pt[1]);
            pc.stroke();
          }
          prevX = pt[0];
          prevY = pt[1];
          have = true;
        }
        if (have) {
          pc.fillStyle = 'rgba(190, 255, 215, 0.9)';
          pc.beginPath();
          pc.arc(prevX, prevY, 1.8, 0, Math.PI * 2);
          pc.fill();
        }
      }
    };

    const tick = (now: number) => {
      frame = 0;
      if (!visible) return;
      let flying = false;
      if (duration > 0) {
        const t = (now - start) / duration;
        if (t >= 1) {
          current = to;
          duration = 0;
          sceneDirty = true;
        } else {
          current = lerpPose(from, to, t);
          flying = true;
          sceneDirty = true;
        }
      }
      if (sceneDirty) {
        drawScene(current);
        sceneDirty = false;
      }
      drawPulses(current, now);
      if (!reducedMotion || flying || sceneDirty) frame = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!frame && visible) frame = requestAnimationFrame(tick);
    };

    const resize = () => {
      const w = root.clientWidth;
      const h = root.clientHeight;
      if (w === 0 || h === 0) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = w;
      height = h;
      const detail = w < 700 ? 'lite' : 'full';
      plan = planFor(detail);
      for (const canvas of [sceneCanvas, pulseCanvas]) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      sceneDirty = true;
      kick();
    };

    const goTo = (index: number) => {
      const target = poseFor(index);
      if (reducedMotion) {
        current = target;
        to = target;
        duration = 0;
        sceneDirty = true;
        kick();
        return;
      }
      from = current;
      to = target;
      start = performance.now();
      duration = FLIGHT_MS;
      kick();
    };
    api.current = { goTo };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(root);

    /* Opening: the camera rises to the establishing shot. Only on a true
       entry to the home chapter, and any input skips it. */
    if (first.current === 0 && !reducedMotion) {
      const target = poseFor(0);
      from = { ...target, h: 14, pitch: 2, fov: 70 };
      current = from;
      to = target;
      start = performance.now();
      duration = INTRO_MS;
      const skip = () => {
        if (duration === INTRO_MS) start = performance.now() - INTRO_MS;
        window.removeEventListener('pointerdown', skip);
        window.removeEventListener('keydown', skip);
        window.removeEventListener('wheel', skip);
      };
      window.addEventListener('pointerdown', skip, { once: true });
      window.addEventListener('keydown', skip, { once: true });
      window.addEventListener('wheel', skip, { once: true, passive: true });
    }

    const onVisibility = () => {
      visible = !document.hidden;
      if (visible) kick();
      else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    kick();

    return () => {
      api.current = null;
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reducedMotion]);

  const seen = useRef(sceneIndex);
  useEffect(() => {
    if (seen.current === sceneIndex) return;
    seen.current = sceneIndex;
    api.current?.goTo(sceneIndex);
  }, [sceneIndex]);

  return (
    <div ref={rootRef} className="silicon-world" aria-hidden="true" data-shot={sceneIndex}>
      <canvas ref={sceneRef} className="silicon-canvas" />
      <canvas ref={pulseRef} className="silicon-canvas silicon-pulses" />
      <div className="silicon-grade" />
    </div>
  );
}
