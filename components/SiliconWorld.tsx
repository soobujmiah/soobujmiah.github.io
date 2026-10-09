'use client';

import { useEffect, useRef } from 'react';
import { BRAND } from '@/app/design-tokens';
import { buildPlan, flightPose, focusFor, inRects, makeProjector, poseFor, type Plan, type Pose } from '@/app/silicon';

/* The site's one environment: an abstract, procedurally drawn phone-chip
   floorplan seen by a low camera (see app/silicon.ts). Each chapter lights
   the region of the chip it is about (what you are reading is what is lit),
   and the signal pulses favour that region.

   Two Canvas 2D layers: the scene (redrawn while the camera flies or sways)
   and a light layer (focus glow + pulses). Native device pixels (DPR capped
   at 2), paused when the tab is hidden, a static frame under reduced motion,
   a lighter plan and no idle sway on phones. Without JavaScript the CSS
   gradient on .silicon-world remains. */

const FLIGHT_MS = 1500;
const INTRO_MS = 1800;
const FOCUS_MS = 1100;
const PULSE_SPEED = 230; // world units per second
const PULSE_TAIL = 150;
const SWAY_FRAME_MS = 1000 / 30;

/* class × depth band: [near, mid, far] alpha multipliers on the class colour */
const BAND = [1, 0.62, 0.3] as const;
const STYLE = [
  { rgb: '74, 222, 128', alpha: 0.11, width: 0.6 },
  { rgb: '74, 222, 128', alpha: 0.22, width: 0.9 },
  { rgb: '74, 222, 128', alpha: 0.44, width: 1.3 },
] as const;

const plans: Partial<Record<'full' | 'lite', Plan>> = {};
const planFor = (detail: 'full' | 'lite') => (plans[detail] ??= buildPlan(20261009, detail));

const smooth = (t: number) => {
  const c = t < 0 ? 0 : t > 1 ? 1 : t;
  return c * c * (3 - 2 * c);
};

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
    let swayOn = false;
    let plan = planFor('full');
    let from: Pose = poseFor(first.current);
    let to: Pose = from;
    let start = 0;
    let duration = 0;
    let current: Pose = from;
    let introStart = -1;
    let frame = 0;
    let visible = !document.hidden;
    let sceneDirty = true;
    let lastSway = 0;

    /* which chapter's region is lit, and the one fading out */
    let focusIdx = first.current;
    let prevFocusIdx = first.current;
    let focusSince = -FOCUS_MS;

    const seg = new Float64Array(5);
    const pt = new Float64Array(3);
    const xz = new Float64Array(2);
    const routes = plan.routes;
    const lengths = routes.map(routeLength);
    const phase = routes.map((_, i) => i * 0.37);
    const focusWeights = (idx: number) =>
      routes.map((route) => {
        const rects = focusFor(idx);
        for (let i = 0; i < route.length; i += 2) if (inRects(rects, route[i], route[i + 1])) return 1;
        return 0;
      });
    let weightsNow = focusWeights(focusIdx);
    let weightsPrev = weightsNow;

    const drawScene = (pose: Pose, reveal: number) => {
      const proj = makeProjector(pose, width, height);
      sc.setTransform(1, 0, 0, 1, 0, 0);
      sc.globalAlpha = 1;
      sc.fillStyle = BRAND.bg;
      sc.fillRect(0, 0, sceneCanvas.width, sceneCanvas.height);
      sc.setTransform(dpr, 0, 0, dpr, 0, 0);

      const hz = proj.horizon;
      /* a faint glow where the chip meets the dark sky */
      if (hz > -height && hz < height * 1.2) {
        const glow = sc.createLinearGradient(0, hz - height * 0.35, 0, hz + height * 0.12);
        glow.addColorStop(0, 'rgba(34, 197, 94, 0)');
        glow.addColorStop(0.75, `rgba(34, 197, 94, ${0.07 * reveal})`);
        glow.addColorStop(1, 'rgba(34, 197, 94, 0)');
        sc.fillStyle = glow;
        sc.fillRect(0, Math.max(0, hz - height * 0.35), width, height);
      }

      if (reveal > 0.01) {
        const margin = 40;
        /* depth bands are measured from the camera height: a low camera sees
           a short near field, a high one a long one */
        const near = 520 + pose.h * 2.2;
        const mid = near * 2.1;
        for (let c = 0; c < 3; c++) {
          const L = plan.lines[c];
          const style = STYLE[c];
          const paths: Path2D[] = [new Path2D(), new Path2D(), new Path2D()];
          for (let i = 0; i < L.length; i += 6) {
            if (!proj.segment(L[i], L[i + 1], L[i + 2], L[i + 3], L[i + 4], L[i + 5], seg)) continue;
            const x1 = seg[0];
            const y1 = seg[1];
            const x2 = seg[2];
            const y2 = seg[3];
            if ((x1 < -margin && x2 < -margin) || (x1 > width + margin && x2 > width + margin)) continue;
            if ((y1 < -margin && y2 < -margin) || (y1 > height + margin && y2 > height + margin)) continue;
            if (c === 0 && Math.abs(x2 - x1) + Math.abs(y2 - y1) < 0.7) continue;
            const band = seg[4] < near ? 0 : seg[4] < mid ? 1 : 2;
            paths[band].moveTo(x1, y1);
            paths[band].lineTo(x2, y2);
          }
          sc.lineWidth = style.width;
          for (let b = 0; b < 3; b++) {
            sc.strokeStyle = `rgba(${style.rgb}, ${(style.alpha * BAND[b] * reveal).toFixed(3)})`;
            sc.stroke(paths[b]);
          }
        }
      }

      /* the horizon line itself: the first thing to exist in the opening */
      if (hz > 0 && hz < height) {
        const line = sc.createLinearGradient(0, 0, width, 0);
        line.addColorStop(0, 'rgba(74, 222, 128, 0)');
        line.addColorStop(0.5, `rgba(74, 222, 128, ${0.34 - 0.18 * reveal})`);
        line.addColorStop(1, 'rgba(74, 222, 128, 0)');
        sc.fillStyle = line;
        sc.fillRect(0, hz - 0.5, width, 1);
      }

      /* depth haze: the distant chip dissolves into the dark */
      if (hz > -height * 0.2 && hz < height) {
        const haze = sc.createLinearGradient(0, hz - 2, 0, hz + height * 0.3);
        haze.addColorStop(0, 'rgba(5, 5, 7, 1)');
        haze.addColorStop(1, 'rgba(5, 5, 7, 0)');
        sc.fillStyle = haze;
        sc.fillRect(0, Math.max(0, hz - 2), width, height);
      }
    };

    /* the region a chapter is about, lit from within: a ground wash and an edge */
    const drawFocus = (pose: Pose, idx: number, weight: number, now: number) => {
      if (weight <= 0.01) return;
      const proj = makeProjector(pose, width, height);
      const breath = reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(now / 1700);
      for (const r of focusFor(idx)) {
        const corners = [
          [r[0], r[1]],
          [r[2], r[1]],
          [r[2], r[3]],
          [r[0], r[3]],
        ];
        const pts: number[] = [];
        let ok = true;
        for (const [x, z] of corners) {
          if (!proj.project(x, 0, z, pt)) {
            ok = false;
            break;
          }
          pts.push(pt[0], pt[1]);
        }
        if (!ok) continue;
        pc.beginPath();
        pc.moveTo(pts[0], pts[1]);
        for (let i = 2; i < 8; i += 2) pc.lineTo(pts[i], pts[i + 1]);
        pc.closePath();
        pc.fillStyle = `rgba(34, 197, 94, ${(weight * (0.045 + 0.03 * breath)).toFixed(3)})`;
        pc.fill();
        pc.strokeStyle = `rgba(74, 222, 128, ${(weight * (0.3 + 0.18 * breath)).toFixed(3)})`;
        pc.lineWidth = 1.1;
        pc.stroke();
      }
    };

    const drawLight = (pose: Pose, now: number) => {
      pc.setTransform(1, 0, 0, 1, 0, 0);
      pc.clearRect(0, 0, pulseCanvas.width, pulseCanvas.height);
      pc.setTransform(dpr, 0, 0, dpr, 0, 0);
      const mix = smooth((now - focusSince) / FOCUS_MS);
      drawFocus(pose, prevFocusIdx, 1 - mix, now);
      drawFocus(pose, focusIdx, mix, now);
      if (reducedMotion) return;
      const proj = makeProjector(pose, width, height);
      pc.lineCap = 'round';
      for (let r = 0; r < routes.length; r++) {
        /* pulses on the lit region burn brighter; the rest idle quietly */
        const blended = weightsPrev[r] + (weightsNow[r] - weightsPrev[r]) * mix;
        const weight = 0.35 + 0.65 * blended;
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
            pc.strokeStyle = `rgba(74, 222, 128, ${(0.7 * weight * k) / steps})`;
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
          pc.fillStyle = `rgba(190, 255, 215, ${0.9 * weight})`;
          pc.beginPath();
          pc.arc(prevX, prevY, 1.8, 0, Math.PI * 2);
          pc.fill();
        }
      }
    };

    const tick = (now: number) => {
      frame = 0;
      if (!visible) return;
      let pose = current;
      let reveal = 1;
      let moving = false;

      if (introStart >= 0) {
        const t = (now - introStart) / INTRO_MS;
        reveal = smooth((t - 0.1) / 0.55);
        if (t >= 1) introStart = -1;
        moving = true;
      }
      if (duration > 0) {
        const t = (now - start) / duration;
        if (t >= 1) {
          current = to;
          duration = 0;
        } else {
          current = flightPose(from, to, t);
        }
        pose = current;
        moving = true;
      }
      if (moving) sceneDirty = true;

      /* a barely-there sway keeps the still shot alive (full-detail screens only) */
      let shown = pose;
      if (swayOn && !moving) {
        const s = now / 1000;
        shown = {
          ...pose,
          x: pose.x + Math.sin(s * 0.42) * 9,
          h: pose.h + Math.sin(s * 0.57) * 3.5,
          yaw: pose.yaw + Math.sin(s * 0.31) * 0.45,
        };
        if (now - lastSway >= SWAY_FRAME_MS) {
          lastSway = now;
          sceneDirty = true;
        }
      }

      if (sceneDirty) {
        drawScene(shown, reveal);
        sceneDirty = false;
      }
      drawLight(shown, now);
      if (!reducedMotion || moving) frame = requestAnimationFrame(tick);
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
      swayOn = detail === 'full' && !reducedMotion;
      for (const canvas of [sceneCanvas, pulseCanvas]) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      sceneDirty = true;
      kick();
    };

    const goTo = (index: number) => {
      const now = performance.now();
      if (index !== focusIdx) {
        prevFocusIdx = focusIdx;
        focusIdx = index;
        focusSince = now;
        weightsPrev = weightsNow;
        weightsNow = focusWeights(index);
      }
      const target = poseFor(index);
      if (reducedMotion) {
        current = target;
        to = target;
        duration = 0;
        focusSince = -FOCUS_MS;
        sceneDirty = true;
        kick();
        return;
      }
      from = current;
      to = target;
      start = now;
      duration = FLIGHT_MS;
      kick();
    };
    api.current = { goTo };

    resize();
    if (reducedMotion) focusSince = -FOCUS_MS;
    const observer = new ResizeObserver(resize);
    observer.observe(root);

    /* Opening: first the horizon line, then the chip appears as the camera
       rises to the establishing shot. Only on a true entry to the home
       chapter, and any input skips it. */
    if (first.current === 0 && !reducedMotion) {
      const target = poseFor(0);
      from = { ...target, h: 14, pitch: 2, fov: 70 };
      current = from;
      to = target;
      start = performance.now();
      duration = INTRO_MS;
      introStart = start;
      focusSince = start + 600;
      const skip = () => {
        const t = performance.now() - INTRO_MS;
        if (duration === INTRO_MS) start = t;
        if (introStart >= 0) introStart = t;
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
