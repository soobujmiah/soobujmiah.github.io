'use client';

import { useEffect, useRef } from 'react';
import { BRAND, MOTION } from '@/app/design-tokens';
import {
  ambientOrbit,
  buildPlan,
  chapterGain,
  clockStep,
  dollyPose,
  flightAt,
  focusFor,
  inRects,
  litLevels,
  makeFlight,
  makeProjector,
  orbitPose,
  pixelRatioFor,
  poseFor,
  retarget,
  rng,
  springStep,
  type Flight,
  type Plan,
  type Pose,
  AMBIENT_AMP,
  AMBIENT_FRAME_MS,
  atmosphere,
} from '@/app/silicon';

/* The site's one environment: an abstract, procedurally drawn phone-chip
   floorplan seen by a camera (see app/silicon.ts). Each chapter lights the
   region of the chip it is about, and the signal pulses favour it.

   Rendering: two Canvas 2D layers driven by ONE requestAnimationFrame loop.
     scene  — the die: lines, chapter light on the lines, analytic depth fog,
              horizon. Redrawn only when the camera actually moves.
     light  — soft light pool over the lit region + signal pulses. Drawn
              with the exact pose the scene was last drawn with, so the two
              layers never drift apart.

   Motion is a function of an engine clock that only advances while the
   page is visible, with frame gaps clamped (app/silicon.ts clockStep). The
   camera pose each frame is
       flight(chapter)  →  dolly(scroll)  →  orbit(pointer + ambient)
   and every term is continuous in time, so nothing ever jumps:
     · flights are C² quintic curves; a new chapter mid-flight inherits the
       camera's velocity (retarget) instead of stopping it,
     · pointer and scroll inputs pass through the design-token spring
       (MOTION.cameraDrift.followSpring),
     · the ambient orbit's amplitude is itself eased in and out.

   Budget: backing store = DPR capped at 2 and at a pixel budget per canvas;
   idle ambient motion redraws at most 30 times a second; phones (coarse
   pointers) hold the camera still between chapters; a one-way quality
   ratchet steps down if motion frames are measured slow. Paused when the
   tab is hidden. Under reduced motion: one static, fully lit frame — no
   flights, pulses, orbit, dolly or breathing. Without JavaScript the CSS
   gradient on .silicon-world remains. Decorative: aria-hidden, no pointer
   events. */

const FLIGHT_MS = 1500;
const INTRO_MS = 1800;
/** A skipped opening finishes in this time instead of cutting. */
const SKIP_MS = 450;
const FOCUS_MS = 1100;
const PULSE_TAIL = 150;
/** How long a pose handed over by the previous route stays valid. */
const HANDOFF_MS = 4000;
const HANDOFF_KEY = 'silicon:pose';
const QUALITY_KEY = 'silicon:quality';
/** Scroll dolly: fraction of the way to the pivot at the end of a page. */
const DOLLY_MAX = 0.07;

/* Pixel budget per canvas by quality level (0 best). 2.6 MP keeps a
   1440×900 screen at 2× and stops a 4K screen from allocating 15 MP. */
const PIXEL_BUDGET = [2.6e6, 1.4e6, 0.9e6] as const;

/* Line classes: 0 faint detail, 1 block edge, 2 zone edge. */
const STYLE = [
  { alpha: 0.12, width: 0.6 },
  { alpha: 0.24, width: 0.9 },
  { alpha: 0.46, width: 1.3 },
] as const;
const LINE_RGB = '74, 222, 128';
const LIT_RGB = '120, 236, 166';
/** Extra alpha for lit lines, per lit level, as a multiple of the class alpha. */
const LIT_GAIN = [0, 0.28, 0.6] as const;

const plans: Partial<Record<'full' | 'lite', Plan>> = {};
const planFor = (detail: 'full' | 'lite') => (plans[detail] ??= buildPlan(20261009, detail));
const litCache = new Map<string, [Uint8Array, Uint8Array, Uint8Array]>();
const litFor = (detail: 'full' | 'lite', idx: number) => {
  const key = `${detail}:${idx}`;
  let v = litCache.get(key);
  if (!v) {
    v = litLevels(planFor(detail), focusFor(idx));
    litCache.set(key, v);
  }
  return v;
};

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

function readHandoff(): Pose | null {
  try {
    const raw = sessionStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { pose: Pose; at: number };
    if (!v || Date.now() - v.at > HANDOFF_MS) return null;
    const p = v.pose;
    return [p.x, p.z, p.h, p.yaw, p.pitch, p.fov].every(Number.isFinite) ? p : null;
  } catch {
    return null;
  }
}

function media(query: string): boolean {
  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

export function SiliconWorld({ sceneIndex, reducedMotion = false }: { sceneIndex: number; reducedMotion?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLCanvasElement>(null);
  const pulseRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<{ goTo: (index: number) => void } | null>(null);
  /* the chapter currently requested — a re-initialisation (e.g. the motion
     preference changing) resumes here, not at the first chapter mounted */
  const latest = useRef(sceneIndex);
  latest.current = sceneIndex;

  useEffect(() => {
    const root = rootRef.current;
    const sceneCanvas = sceneRef.current;
    const pulseCanvas = pulseRef.current;
    if (!root || !sceneCanvas || !pulseCanvas) return;
    const sc = sceneCanvas.getContext('2d');
    const pc = pulseCanvas.getContext('2d');
    if (!sc || !pc) return;

    const startIdx = latest.current;
    const fine = media('(hover: hover) and (pointer: fine)');
    const spring = MOTION.cameraDrift.followSpring;
    const orbitAmp = MOTION.cameraDrift.maxOffsetHw;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let detail: 'full' | 'lite' = 'full';
    let plan = planFor('full');
    let quality = 0;
    try {
      quality = Math.min(2, Math.max(0, Number(sessionStorage.getItem(QUALITY_KEY)) || 0));
    } catch {
      /* private mode: start at the top level */
    }

    /* engine clock (ms): advances only while frames run, gaps clamped */
    let clock = 0;
    let lastNow = -1;
    let frame = 0;
    let visible = !document.hidden;

    /* camera */
    let base: Pose = poseFor(startIdx);
    let flight: Flight | null = null;
    let flightStart = 0;
    let flightDur = FLIGHT_MS;
    let introStart = -1;
    let skippedAt = -1;

    /* inputs, each through the token spring: [position, velocity] */
    const ox: [number, number] = [0, 0];
    const oy: [number, number] = [0, 0];
    const dolly: [number, number] = [0, 0];
    let pointerX = 0;
    let pointerY = 0;
    let scrollTarget = 0;
    let scrollEl: HTMLElement | null = null;
    let scrollDirty = false;
    /* ambient orbit amplitude, eased between 0 and 1 */
    let ambient = 0;
    let lastScenePose: Pose = base;
    let lastSceneAt = -Infinity;
    let sceneDirty = true;

    /* which chapter's region is lit, and the one fading out */
    let focusIdx = startIdx;
    let prevFocusIdx = startIdx;
    let focusSince = -FOCUS_MS;

    /* adaptive quality: intervals of frames that redrew the scene */
    const slow: number[] = [];

    const seg = new Float64Array(5);
    const pt = new Float64Array(3);
    const pt2 = new Float64Array(3);
    /* unit radial falloff (1 → 0.4 at 55 % → 0), rendered once */
    const poolSprite = document.createElement('canvas');
    poolSprite.width = poolSprite.height = 128;
    {
      const sx = poolSprite.getContext('2d');
      if (sx) {
        const g = sx.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0, 'rgba(34, 197, 94, 1)');
        g.addColorStop(0.55, 'rgba(34, 197, 94, 0.4)');
        g.addColorStop(1, 'rgba(34, 197, 94, 0)');
        sx.fillStyle = g;
        sx.fillRect(0, 0, 128, 128);
      }
    }
    const xz = new Float64Array(2);
    const routes = plan.routes;
    const lengths = routes.map(routeLength);
    const rand = rng(7);
    const speeds = routes.map(() => 195 + rand() * 70);
    const phase = routes.map(() => rand());
    const routeLit = (idx: number) =>
      routes.map((route) => {
        const rects = focusFor(idx);
        for (let i = 0; i < route.length; i += 2) if (inRects(rects, route[i], route[i + 1])) return 1;
        return 0;
      });
    let weightsNow = routeLit(focusIdx);
    let weightsPrev = weightsNow;

    const motionOn = !reducedMotion;
    /* idle ambient orbit and scroll dolly: desktop-class only (fine pointer,
       full detail, quality not stepped down) — phones hold still */
    const ambientAllowed = () => motionOn && fine && detail === 'full' && quality === 0;

    const focusMix = () => (reducedMotion ? 1 : smooth((clock - focusSince) / FOCUS_MS));

    /* ── scene ─────────────────────────────────────────────── */
    const drawScene = (pose: Pose, reveal: number) => {
      const proj = makeProjector(pose, width, height);
      sc.setTransform(1, 0, 0, 1, 0, 0);
      sc.globalAlpha = 1;
      sc.fillStyle = BRAND.bg;
      sc.fillRect(0, 0, sceneCanvas.width, sceneCanvas.height);
      sc.setTransform(dpr, 0, 0, dpr, 0, 0);
      const hz = proj.horizon;

      if (reveal > 0.01) {
        const margin = 40;
        const mix = focusMix();
        const litNow = litFor(detail, focusIdx);
        const litPrev = litFor(detail, prevFocusIdx);
        const pooled = (pass: 'pool' | 'edge') => {
          sc.globalAlpha = reveal;
          if (prevFocusIdx !== focusIdx) drawFocus(sc, proj, prevFocusIdx, (1 - mix) * reveal, pass);
          drawFocus(sc, proj, focusIdx, mix * reveal, pass);
          sc.globalAlpha = 1;
        };
        pooled('pool');
        sc.lineCap = 'butt';
        for (let c = 0; c < 3; c++) {
          const L = plan.lines[c];
          const all = new Path2D();
          /* lit overlays: [current soft, current bright, previous soft, previous bright] */
          const lit = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
          const ln = litNow[c];
          const lp = litPrev[c];
          for (let i = 0, j = 0; i < L.length; i += 6, j++) {
            if (!proj.segment(L[i], L[i + 1], L[i + 2], L[i + 3], L[i + 4], L[i + 5], seg)) continue;
            const x1 = seg[0];
            const y1 = seg[1];
            const x2 = seg[2];
            const y2 = seg[3];
            if ((x1 < -margin && x2 < -margin) || (x1 > width + margin && x2 > width + margin)) continue;
            if ((y1 < -margin && y2 < -margin) || (y1 > height + margin && y2 > height + margin)) continue;
            /* sub-pixel detail adds noise, not information */
            if (c === 0 && Math.abs(x2 - x1) + Math.abs(y2 - y1) < 0.7) continue;
            all.moveTo(x1, y1);
            all.lineTo(x2, y2);
            if (ln[j] && mix > 0.01) {
              lit[ln[j] - 1].moveTo(x1, y1);
              lit[ln[j] - 1].lineTo(x2, y2);
            }
            if (lp[j] && mix < 0.99 && prevFocusIdx !== focusIdx) {
              lit[1 + lp[j]].moveTo(x1, y1);
              lit[1 + lp[j]].lineTo(x2, y2);
            }
          }
          const style = STYLE[c];
          sc.lineWidth = style.width;
          sc.strokeStyle = `rgb(${LINE_RGB})`;
          sc.globalAlpha = style.alpha * reveal;
          sc.stroke(all);
          sc.strokeStyle = `rgb(${LIT_RGB})`;
          const gNow = chapterGain(focusFor(focusIdx)) * mix;
          const gPrev = prevFocusIdx === focusIdx ? 0 : chapterGain(focusFor(prevFocusIdx)) * (1 - mix);
          const weights = [gNow, gNow, gPrev, gPrev];
          for (let k = 0; k < 4; k++) {
            const w = weights[k] * LIT_GAIN[(k % 2) + 1];
            if (w <= 0.01) continue;
            sc.globalAlpha = Math.min(1, style.alpha * w * reveal);
            sc.stroke(lit[k]);
          }
        }
        sc.globalAlpha = 1;
        pooled('edge');

        /* sky + depth fog + horizon glow in one full-screen fill */
        const atm = atmosphere(pose, height, 0.06 * reveal);
        const g = sc.createLinearGradient(0, 0, 0, height);
        for (const [y, r, gr, b, a] of atm) {
          g.addColorStop(Math.min(1, Math.max(0, y / height)), `rgba(${Math.round(r)}, ${Math.round(gr)}, ${Math.round(b)}, ${a.toFixed(3)})`);
        }
        sc.fillStyle = g;
        sc.fillRect(0, 0, width, height);
      }

      /* the horizon line itself: the first thing to exist in the opening */
      if (hz > 0 && hz < height) {
        const line = sc.createLinearGradient(0, 0, width, 0);
        line.addColorStop(0, 'rgba(74, 222, 128, 0)');
        line.addColorStop(0.5, `rgba(74, 222, 128, ${(0.34 - 0.2 * reveal).toFixed(3)})`);
        line.addColorStop(1, 'rgba(74, 222, 128, 0)');
        sc.fillStyle = line;
        sc.fillRect(0, hz - 0.5, width, 1);
      }
    };

    /* ── light ─────────────────────────────────────────────── */
    /* a soft pool of light over the region a chapter is about, as the
       perspective-correct ellipse of a ground disc, plus a quiet edge */
    /* Drawn into the scene layer (beneath the wires, inside the fog), so it
       costs nothing while the camera rests: the pool changes only when the
       pose or the chapter crossfade changes. */
    const drawFocus = (ctx: CanvasRenderingContext2D, proj: ReturnType<typeof makeProjector>, idx: number, weight: number, pass: 'pool' | 'edge') => {
      if (weight <= 0.01) return;
      const gain = chapterGain(focusFor(idx));
      for (const r of focusFor(idx)) {
        const cx = (r[0] + r[2]) / 2;
        const cz = (r[1] + r[3]) / 2;
        /* pool radius follows the region but is capped: a long thin strip
           (the I/O ring) must not become a screen-wide wash */
        const R = Math.min(520, Math.max(r[2] - r[0], r[3] - r[1]) * 0.55 + 100);
        if (pass === 'pool' && proj.project(cx, 0, cz, pt) && proj.project(cx + R, 0, cz, pt2)) {
          const rx = Math.hypot(pt2[0] - pt[0], pt2[1] - pt[1]);
          const sx = pt[0];
          const sy = pt[1];
          let ry = rx * 0.35;
          if (proj.project(cx, 0, cz + R, pt2)) ry = Math.max(4, Math.abs(pt2[1] - sy));
          if (rx > 2 && rx < width * 4) {
            /* the pool sprite stretched to the projected ellipse: identical to
               a per-frame radial gradient at about half the raster cost */
            ctx.save();
            ctx.globalAlpha = weight * gain * 0.07;
            ctx.translate(sx, sy);
            ctx.scale(rx, ry);
            ctx.drawImage(poolSprite, -1, -1, 2, 2);
            ctx.restore();
          }
        }
        if (pass !== 'edge') continue;
        /* the region's edge, quiet: a hint of where the light belongs */
        let ok = true;
        ctx.beginPath();
        for (let k = 0; k < 4; k++) {
          const x = k === 0 || k === 3 ? r[0] : r[2];
          const z = k < 2 ? r[1] : r[3];
          if (!proj.project(x, 0, z, pt)) {
            ok = false;
            break;
          }
          if (k === 0) ctx.moveTo(pt[0], pt[1]);
          else ctx.lineTo(pt[0], pt[1]);
        }
        if (!ok) continue;
        ctx.closePath();
        ctx.strokeStyle = `rgb(${LINE_RGB})`;
        ctx.globalAlpha = weight * 0.19;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    };

    const drawLight = (pose: Pose) => {
      pc.setTransform(1, 0, 0, 1, 0, 0);
      pc.clearRect(0, 0, pulseCanvas.width, pulseCanvas.height);
      pc.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reducedMotion) return;
      const mix = focusMix();
      const proj = makeProjector(pose, width, height);
      pc.lineCap = 'round';
      pc.strokeStyle = `rgb(${LINE_RGB})`;
      pc.fillStyle = 'rgb(190, 255, 215)';
      for (let r = 0; r < routes.length; r++) {
        /* pulses on the lit region burn brighter; the rest idle quietly */
        const blended = weightsPrev[r] + (weightsNow[r] - weightsPrev[r]) * mix;
        const weight = 0.32 + 0.68 * blended;
        const total = lengths[r];
        const cycle = total + PULSE_TAIL;
        const head = ((clock / 1000) * speeds[r] + phase[r] * cycle) % cycle;
        /* fade in leaving the start and out arriving at the end: no pop */
        const env = smooth(head / 90) * smooth((total + PULSE_TAIL * 0.6 - head) / 120);
        if (env <= 0.01) continue;
        let prevX = 0;
        let prevY = 0;
        let have = false;
        let headX = 0;
        let headY = 0;
        let headOk = false;
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
            pc.globalAlpha = (0.7 * weight * env * k) / steps;
            pc.lineWidth = 1.1 + (1.1 * k) / steps;
            pc.beginPath();
            pc.moveTo(prevX, prevY);
            pc.lineTo(pt[0], pt[1]);
            pc.stroke();
          }
          prevX = pt[0];
          prevY = pt[1];
          have = true;
          if (k === steps) {
            headX = pt[0];
            headY = pt[1];
            headOk = true;
          }
        }
        if (headOk) {
          pc.globalAlpha = 0.9 * weight * env;
          pc.beginPath();
          pc.arc(headX, headY, 1.7, 0, Math.PI * 2);
          pc.fill();
        }
      }
      pc.globalAlpha = 1;
    };

    /* ── frame ─────────────────────────────────────────────── */
    const settled = (s: [number, number], target: number) => Math.abs(s[0] - target) < 1e-4 && Math.abs(s[1]) < 1e-3;

    const tick = (now: number) => {
      frame = 0;
      if (!visible) return;
      const gap = lastNow < 0 ? 0 : now - lastNow;
      lastNow = now;
      const dt = clockStep(gap);
      clock += dt;

      let reveal = 1;
      let active = false; // something needs a full-rate redraw

      if (introStart >= 0) {
        const t = (clock - introStart) / INTRO_MS;
        reveal = smooth((t - 0.1) / 0.55);
        /* a skipped opening completes quickly instead of cutting */
        if (skippedAt >= 0) reveal = Math.max(reveal, smooth((clock - skippedAt) / SKIP_MS));
        if (t >= 1 || reveal >= 1) introStart = -1;
        active = true;
      }
      if (flight) {
        const t = (clock - flightStart) / flightDur;
        base = flightAt(flight, t);
        if (t >= 1) flight = null;
        active = true;
      }
      if (motionOn && clock - focusSince < FOCUS_MS) active = true;

      /* inputs → springs (time-based, so identical at 30, 60 or 120 Hz) */
      if (scrollDirty && scrollEl) {
        scrollDirty = false;
        const max = scrollEl.scrollHeight - scrollEl.clientHeight;
        scrollTarget = max > 8 ? Math.min(1, Math.max(0, scrollEl.scrollTop / max)) : 0;
      }
      const useDolly = ambientAllowed();
      const dollyTarget = useDolly ? scrollTarget * DOLLY_MAX : 0;
      if (motionOn) {
        const tx = fine ? pointerX : 0;
        const ty = fine ? pointerY : 0;
        if (!settled(ox, tx) || !settled(oy, ty) || !settled(dolly, dollyTarget)) {
          springStep(ox, tx, dt, spring.stiffness, spring.damping, spring.mass);
          springStep(oy, ty, dt, spring.stiffness, spring.damping, spring.mass);
          springStep(dolly, dollyTarget, dt, spring.stiffness, spring.damping, spring.mass);
          active = true;
        }
        /* ambient amplitude eases toward on/off over ~2 s — never pops */
        const ambientTarget = ambientAllowed() ? 1 : 0;
        if (ambient !== ambientTarget) {
          ambient += Math.sign(ambientTarget - ambient) * Math.min(Math.abs(ambientTarget - ambient), dt / 2000);
        }
      }

      let ax = 0;
      let ay = 0;
      if (ambient > 0) {
        const [lx, ly] = ambientOrbit(clock);
        const k = AMBIENT_AMP * smooth(ambient);
        ax = lx * k;
        ay = ly * k;
      }
      const pose = orbitPose(dollyPose(base, dolly[0]), ox[0] + ax, oy[0] + ay, orbitAmp, width / Math.max(1, height));

      /* redraw policy: full rate while anything is actually moving; the
         ambient orbit alone redraws every AMBIENT_FRAME_MS (≤ 0.25 px steps) */
      const ambientDue = ambient > 0 && clock - lastSceneAt >= AMBIENT_FRAME_MS;
      if (active || ambientDue || sceneDirty) {
        if (active && lastSceneAt > -Infinity && gap > 0) {
          slow.push(gap);
          if (slow.length > 45) slow.shift();
        }
        drawScene(pose, reveal);
        lastScenePose = pose;
        lastSceneAt = clock;
        sceneDirty = false;
      }
      /* the light layer always uses the pose the scene was drawn with */
      drawLight(lastScenePose);

      /* one-way quality ratchet: if the median motion frame is slower than
         ~33 fps, step down once (fewer pixels, then no ambient motion and
         a lighter plan). Never steps back up within the session. */
      if (slow.length >= 45 && quality < 2) {
        const sorted = [...slow].sort((a, b) => a - b);
        if (sorted[22] > 30) {
          quality += 1;
          slow.length = 0;
          try {
            sessionStorage.setItem(QUALITY_KEY, String(quality));
          } catch {
            /* ignore */
          }
          root.dataset.quality = String(quality);
          resize();
        }
      }

      /* pulses keep the loop alive under normal motion; under reduced
         motion it stops as soon as the static frame is drawn. A resize
         inside this frame may already have scheduled the next one. */
      if ((motionOn || active) && !frame) frame = requestAnimationFrame(tick);
    };

    const kick = () => {
      if (!frame && visible) {
        lastNow = -1;
        frame = requestAnimationFrame(tick);
      }
    };

    function resize() {
      const w = root!.clientWidth;
      const h = root!.clientHeight;
      if (w === 0 || h === 0) return;
      width = w;
      height = h;
      detail = w < 700 || quality >= 2 ? 'lite' : 'full';
      plan = planFor(detail);
      dpr = pixelRatioFor(w, h, Math.min(window.devicePixelRatio || 1, 2), PIXEL_BUDGET[quality]);
      for (const canvas of [sceneCanvas!, pulseCanvas!]) {
        const bw = Math.round(w * dpr);
        const bh = Math.round(h * dpr);
        if (canvas.width !== bw) canvas.width = bw;
        if (canvas.height !== bh) canvas.height = bh;
      }
      sceneDirty = true;
      kick();
    }

    const goTo = (index: number) => {
      if (index !== focusIdx) {
        prevFocusIdx = focusIdx;
        focusIdx = index;
        focusSince = clock;
        weightsPrev = weightsNow;
        weightsNow = routeLit(index);
      }
      const target = poseFor(index);
      if (reducedMotion) {
        base = target;
        flight = null;
        prevFocusIdx = focusIdx;
        focusSince = -FOCUS_MS;
        sceneDirty = true;
        kick();
        return;
      }
      if (flight) {
        /* mid-flight: bend toward the new chapter, keeping the velocity */
        const t = Math.min(1, (clock - flightStart) / flightDur);
        flight = retarget(flight, t, flightDur, FLIGHT_MS, target);
      } else {
        flight = makeFlight(base, target);
      }
      flightStart = clock;
      flightDur = FLIGHT_MS;
      if (introStart >= 0 && skippedAt < 0) skippedAt = clock;
      scrollTarget = 0;
      kick();
    };
    api.current = { goTo };

    /* ── inputs ────────────────────────────────────────────── */
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      pointerX = Math.max(-1, Math.min(1, (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1));
      pointerY = Math.max(-1, Math.min(1, (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1)) * -1;
      kick();
    };
    const onPointerLeave = () => {
      pointerX = 0;
      pointerY = 0;
      kick();
    };
    /* scroll events do not bubble; one capturing listener sees every inner
       page scroller. Geometry is read inside the next frame, at most once. */
    const onScroll = (e: Event) => {
      const el = e.target as HTMLElement | null;
      if (!el || !(el instanceof HTMLElement) || !el.classList.contains('page-scroll')) return;
      scrollEl = el;
      scrollDirty = true;
      kick();
    };

    /* opening: the horizon line first, then the chip as the camera rises.
       Only on a true entry to the home chapter; any input skips it. */
    const skip = () => {
      removeSkip();
      if (introStart < 0 || !flight) return;
      /* finish the rise in SKIP_MS, keeping the camera's current velocity */
      skippedAt = clock;
      const t = Math.min(1, (clock - flightStart) / flightDur);
      flight = retarget(flight, t, flightDur, SKIP_MS, poseFor(focusIdx));
      flightStart = clock;
      flightDur = SKIP_MS;
    };
    const removeSkip = () => {
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('wheel', skip);
    };

    const handoff = motionOn ? readHandoff() : null;
    if (handoff) {
      /* arriving from another route: continue from where its camera was */
      base = handoff;
      flight = makeFlight(handoff, poseFor(startIdx));
      flightStart = 0;
      flightDur = FLIGHT_MS;
    } else if (startIdx === 0 && motionOn) {
      const target = poseFor(0);
      const from = { ...target, h: 14, pitch: 2, fov: 70 };
      base = from;
      flight = makeFlight(from, target);
      flight.lift = 0;
      flightStart = 0;
      flightDur = INTRO_MS;
      introStart = 0;
      focusSince = 600;
      window.addEventListener('pointerdown', skip, { once: true });
      window.addEventListener('keydown', skip, { once: true });
      window.addEventListener('wheel', skip, { once: true, passive: true });
    }

    const saveHandoff = () => {
      try {
        sessionStorage.setItem(HANDOFF_KEY, JSON.stringify({ pose: lastScenePose, at: Date.now() }));
      } catch {
        /* ignore */
      }
    };

    root.dataset.quality = String(quality);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(root);

    const onVisibility = () => {
      visible = !document.hidden;
      if (visible) kick();
      else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', saveHandoff);
    if (motionOn && fine) {
      window.addEventListener('pointermove', onPointer, { passive: true });
      document.documentElement.addEventListener('pointerleave', onPointerLeave);
    }
    if (motionOn) document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    kick();

    return () => {
      saveHandoff();
      api.current = null;
      observer.disconnect();
      removeSkip();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', saveHandoff);
      window.removeEventListener('pointermove', onPointer);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('scroll', onScroll, { capture: true });
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
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
