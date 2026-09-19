'use client';

/* ═══════════════════════════════════════════════════════════════
   SIGNATURE NAME — service-driven particle storytelling canvas.

   One particle population continuously morphs:

       NAME → website → software → devices → business
            → graphics → office → data → NAME → …

   Scene geometry (app/story-world.ts) abstracts the real Services
   pillars — never invents offerings, never day-in-the-life theatre.
   Correspondence is spatial; morphs use flow curves.
   The canvas is bound to .hero-story-stage so it never paints over
   the clock, role copy, CTAs, or the bottom HUD.

   Reduced motion: static multi-tone wordmark, no canvas loop.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useRef } from 'react';
import type { CSSProperties } from 'react';
import { segmentGraphemes } from '@/app/graphemes';
import { MOTION } from '@/app/design-tokens';
import {
  baselineWithinBox,
  bucketFor,
  disperseOrigin,
  easeOutSettle,
  easeInOutQuint,
  flowPoint,
  hashSeed,
  mulberry32,
  particleBudget,
  rampPalette,
  denseStepFor,
  spatialPairing,
  startOffset,
} from '@/app/name-motion';
import { STORY_BEATS, sampleWorldScene, type SceneBeat } from '@/app/story-world';

const INKS = ['#a3e635', '#4ade80', '#22c55e', '#34d399', '#10b981', '#2dd4bf', '#84cc16', '#16a34a'];
const ASSEMBLE_INKS = ['#7dd3fc', '#a5b4fc', '#93c5fd', '#67e8f9'];
const LOCK_INK = '#eab308';
const RAMP_BUCKETS = 8;
const WARM_AT = 0.72;
const RESOLVED_INK = '#4ade80';
const WAITING_INK = 'rgba(147,197,253,0.20)';
const NAME_HOLD_MS = 3800;

type Particle = {
  tx: number;
  ty: number;
  ox: number;
  oy: number;
  at: number;
  dur: number;
  ph1: number;
  ph2: number;
  ph3: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  bend: number;
  stg: number;
  z: number;
};

type Phase = 'forming' | 'hold' | 'morph' | 'dissolve';

const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);

function motionEase(kind: SceneBeat['motion'], t: number): number {
  const x = clamp01(t);
  switch (kind) {
    case 'organic':
      return easeInOutQuint(x * 0.94 + 0.06 * x * x);
    case 'mechanical': {
      if (x < 0.18) return easeInOutQuint(x / 0.18) * 0.1;
      if (x < 0.82) return 0.1 + ((x - 0.18) / 0.64) * 0.8;
      return 0.9 + easeInOutQuint((x - 0.82) / 0.18) * 0.1;
    }
    case 'energetic':
      return easeInOutQuint(Math.pow(x, 0.88));
    case 'precise':
      return easeInOutQuint(x);
    case 'settle':
      return easeOutSettle(x, 0.32);
    case 'gentle':
    default:
      return easeInOutQuint(x);
  }
}

export function SignatureName({
  text,
  reducedMotion = false,
  armed = true,
}: {
  text: string;
  reducedMotion?: boolean;
  armed?: boolean;
}) {
  const clusters = useMemo(() => segmentGraphemes(text), [text]);
  const textRef = useRef(text);
  const clustersRef = useRef(clusters);
  textRef.current = text;
  clustersRef.current = clusters;
  const stageRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cellRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    if (reducedMotion || !armed) return;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    const T = MOTION.nameAssemble;
    stage.style.setProperty('--sig-resolve', `${T.resolveSeconds}s`);
    let cancelled = false;
    let raf = 0;
    let calmRaf = 0;
    let calmTries = 0;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => {
      timers.push(
        window.setTimeout(() => {
          if (!cancelled) fn();
        }, ms)
      );
    };

    const giveUpToText = () => {
      stage.dataset.asm = 'done';
    };

    let phase: Phase = 'forming';
    let particles: Particle[] = [];
    let builtText: string | null = null;
    let t0 = 0;
    let phaseT0 = 0;
    let dissolveT0 = 0;
    let hiddenAt = 0;
    let beatIndex = -1;
    let currentBeat: SceneBeat | null = null;
    let holdMs = NAME_HOLD_MS;
    let morphMs = 1800;
    let morphSpan = 1800;
    let morphMotion: SceneBeat['motion'] = 'gentle';
    let onNameTargets = true;
    let morphFromName = true;
    let morphToName = true;
    let fieldSeed = 1;
    let nameW = 0;
    let nameH = 0;
    let ruleY = 0;
    let dot = 2;
    let dpr = 1;
    let cw = 1;
    let chh = 1;
    let ox = 0;
    let oy = 0;
    let storyW = 0;
    let storyH = 0;
    let edges: number[] = [];
    let clustersNow: string[] = [];
    let ramp: string[] = [];
    let compact = false;
    let budgetNow = 2000;

    const sampleNameTargets = (
      textNow: string,
      clustersIn: string[],
      stageBox: DOMRect,
      sctx: CanvasRenderingContext2D
    ): Particle[] => {
      const cs = window.getComputedStyle(stage);
      const fontStr = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const fontSize = parseFloat(cs.fontSize) || 64;
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sctx.clearRect(0, 0, cw, chh);
      sctx.font = fontStr;
      sctx.textBaseline = 'alphabetic';
      sctx.textAlign = 'left';
      sctx.fillStyle = '#ffffff';

      edges = [];
      ruleY = 0;
      clustersIn.forEach((cluster, i) => {
        const cell = cellRefs.current[i];
        if (!cell) {
          edges.push(0);
          return;
        }
        const r = cell.getBoundingClientRect();
        edges.push(r.left - stageBox.left);
        if (cluster === ' ') return;
        const m = sctx.measureText(cluster);
        const ascent =
          (typeof m.fontBoundingBoxAscent === 'number' && m.fontBoundingBoxAscent) ||
          (typeof m.actualBoundingBoxAscent === 'number' && m.actualBoundingBoxAscent) ||
          fontSize * 0.78;
        const descent =
          (typeof m.fontBoundingBoxDescent === 'number' && m.fontBoundingBoxDescent) ||
          (typeof m.actualBoundingBoxDescent === 'number' && m.actualBoundingBoxDescent) ||
          fontSize * 0.22;
        const baseline = baselineWithinBox(r.top - stageBox.top, r.height, ascent, descent);
        if (!ruleY) ruleY = baseline;
        sctx.fillText(cluster, r.left - stageBox.left, baseline);
      });
      if (!ruleY) ruleY = nameH * 0.78;

      const img = sctx.getImageData(0, 0, cw, chh).data;
      const baseStep = Math.max(1, Math.round(T.sampleStepPx * dpr));
      const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 0 : 0;
      budgetNow = particleBudget(Math.max(nameW, storyW * 0.55), cores, T.maxParticles);

      const countAt = (step: number) => {
        let n = 0;
        for (let y = 0; y < chh; y += step) {
          for (let x = 0; x < cw; x += step) {
            if (img[(y * cw + x) * 4 + 3] > 110) n += 1;
          }
        }
        return n;
      };
      const step = denseStepFor(countAt(baseStep), baseStep, budgetNow);
      const clusterOf = (xCss: number) => {
        let idx = 0;
        for (let i = 0; i < edges.length; i += 1) {
          if (xCss >= edges[i] - 0.5) idx = i;
        }
        return idx;
      };

      const rnd = mulberry32(hashSeed(textNow));
      fieldSeed = hashSeed(textNow);
      const next: Particle[] = [];
      const clusterCount = clustersIn.length;

      // Name targets are in name-local CSS px; convert to story-stage space
      // via ox/oy (name origin inside the story stage).
      for (let y = 0; y < chh; y += step) {
        for (let x = 0; x < cw; x += step) {
          if (img[(y * cw + x) * 4 + 3] <= 110) continue;
          const lx = (x + step / 2) / dpr;
          const ly = (y + step / 2) / dpr;
          const tx = lx + ox;
          const ty = ly + oy;
          const o = disperseOrigin(lx, ly, nameW, nameH, rnd, T.disperseRadius);
          next.push({
            tx,
            ty,
            ox: o.x + ox,
            oy: o.y + oy,
            at: startOffset(clusterOf(lx), clusterCount, rnd, T.clusterShare, T.jitterShare),
            dur: T.travelShare,
            ph1: rnd() * Math.PI * 2,
            ph2: rnd() * Math.PI * 2,
            ph3: rnd() * Math.PI * 2,
            fromX: o.x + ox,
            fromY: o.y + oy,
            toX: tx,
            toY: ty,
            bend: 0,
            stg: 0,
            z: rnd(),
          });
        }
      }
      return next;
    };

    const build = (textNow: string, clustersIn: string[]): boolean => {
      if (cancelled) return true;
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) {
        giveUpToText();
        return true;
      }

      const stageBox = stage.getBoundingClientRect();
      nameW = stageBox.width;
      nameH = stageBox.height;
      if (!(nameW > 4) || !(nameH > 4)) {
        giveUpToText();
        return true;
      }

      const layerBox = canvas.getBoundingClientRect();
      const unset = (r: DOMRect, el: HTMLElement) =>
        Math.abs(r.width - el.offsetWidth) < 0.75 && Math.abs(r.height - el.offsetHeight) < 0.75;
      const calm = unset(stageBox, stage) && unset(layerBox, canvas);
      if (!calm && calmTries < 120) {
        calmTries += 1;
        if (!calmRaf)
          calmRaf = requestAnimationFrame(() => {
            calmRaf = 0;
            if (build(textNow, clustersIn)) startLoop();
          });
        return false;
      }
      calmTries = 0;

      dpr = Math.min(window.devicePixelRatio || 1, T.maxDpr);
      const maxArea = 4.5e6;
      const areaAt = (d: number) => layerBox.width * d * (layerBox.height * d);
      while (dpr > 1 && areaAt(dpr) > maxArea) dpr -= 0.25;

      storyW = layerBox.width;
      storyH = layerBox.height;
      ox = stageBox.left - layerBox.left;
      oy = stageBox.top - layerBox.top;
      compact = storyW < 420 || storyH < 210;

      cw = Math.max(1, Math.round(nameW * dpr));
      chh = Math.max(1, Math.round(nameH * dpr));

      const sample = document.createElement('canvas');
      sample.width = cw;
      sample.height = chh;
      const sctx = sample.getContext('2d', { alpha: true, willReadFrequently: true });
      if (!sctx) {
        giveUpToText();
        return true;
      }

      const next = sampleNameTargets(textNow, clustersIn, stageBox, sctx);
      if (next.length === 0) {
        giveUpToText();
        return true;
      }

      particles = next;
      clustersNow = clustersIn;
      ramp = rampPalette(ASSEMBLE_INKS[0], LOCK_INK, RESOLVED_INK, RAMP_BUCKETS, WARM_AT);
      dot = Math.max(1.2, Math.min(2.5, Math.min(nameW, storyW) / 220));

      canvas.width = Math.max(1, Math.round(storyW * dpr));
      canvas.height = Math.max(1, Math.round(storyH * dpr));
      // Story-stage coordinates: origin at top-left of .hero-story-stage
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stage.dataset.asm = 'run';
      builtText = textNow;
      beatIndex = -1;
      currentBeat = null;
      onNameTargets = true;
      holdMs = NAME_HOLD_MS;
      phase = 'forming';
      return true;
    };

    const aimToPoints = (
      pts: Array<{ x: number; y: number }>,
      now: number,
      motion: SceneBeat['motion'],
      morphDuration: number,
      towardName: boolean
    ) => {
      const n = particles.length;
      if (n === 0) return;
      if (pts.length === 0) {
        phase = 'hold';
        phaseT0 = now;
        return;
      }

      const fromPts = particles.map((p) =>
        onNameTargets ? { x: p.tx, y: p.ty } : { x: p.toX, y: p.toY }
      );
      const toPts = towardName ? particles.map((p) => ({ x: p.tx, y: p.ty })) : pts;
      const map = spatialPairing(fromPts, toPts);
      const rnd = mulberry32((fieldSeed ^ Math.imul(beatIndex + 5, 0x85ebca6b)) >>> 0);
      let stgMax = 0;

      for (let i = 0; i < n; i += 1) {
        const p = particles[i];
        const dest = toPts[map[i]] || toPts[i % toPts.length];
        const jx = towardName ? 0 : ((p.ph1 * 0.3183) % 1 - 0.5) * 1.4;
        const jy = towardName ? 0 : ((p.ph2 * 0.3183) % 1 - 0.5) * 1.4;
        p.fromX = fromPts[i].x;
        p.fromY = fromPts[i].y;
        p.toX = dest.x + jx;
        p.toY = dest.y + jy;
        const dist = Math.hypot(p.toX - p.fromX, p.toY - p.fromY);
        const bendScale =
          motion === 'mechanical'
            ? 0.16
            : motion === 'organic'
              ? 0.26
              : motion === 'energetic'
                ? 0.3
                : motion === 'precise'
                  ? 0.14
                  : 0.2;
        p.bend = (rnd() - 0.5) * Math.min(56, dist * bendScale);
        p.stg = (i / Math.max(1, n - 1)) * 0.08 + rnd() * 0.03;
        if (p.stg > stgMax) stgMax = p.stg;
      }

      morphMotion = motion;
      morphMs = morphDuration;
      morphSpan = morphDuration * (1 + stgMax);
      morphFromName = onNameTargets;
      morphToName = towardName;
      onNameTargets = towardName;
      phase = 'morph';
      phaseT0 = now;
    };

    const aimToBeat = (beat: SceneBeat, now: number) => {
      currentBeat = beat;
      const pts = sampleWorldScene(beat.id, storyW, storyH, dpr, budgetNow, compact);
      holdMs = beat.holdMs;
      aimToPoints(pts, now, beat.motion, beat.morphMs, false);
    };

    const returnToName = (now: number) => {
      currentBeat = null;
      holdMs = NAME_HOLD_MS;
      const namePts = particles.map((p) => ({ x: p.tx, y: p.ty }));
      aimToPoints(namePts, now, 'settle', 2400, true);
    };

    const advanceFromHold = (now: number) => {
      if (onNameTargets) {
        beatIndex = 0;
        aimToBeat(STORY_BEATS[0], now);
        return;
      }
      const next = beatIndex + 1;
      if (next >= STORY_BEATS.length) {
        beatIndex = -1;
        returnToName(now);
        return;
      }
      beatIndex = next;
      aimToBeat(STORY_BEATS[next], now);
    };

    const frame = (now: number) => {
      raf = 0;
      if (cancelled) return;
      if (document.hidden) {
        if (!hiddenAt) hiddenAt = now;
        return;
      }
      if (hiddenAt) {
        t0 += now - hiddenAt;
        phaseT0 += now - hiddenAt;
        dissolveT0 += now - hiddenAt;
        hiddenAt = 0;
      }

      if (phase !== 'dissolve' && builtText !== null && builtText !== textRef.current) {
        phase = 'dissolve';
        dissolveT0 = now;
      }

      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return;
      ctx.clearRect(0, 0, storyW + 2, storyH + 2);

      if (phase === 'dissolve') {
        const prog = Math.min(1, (now - dissolveT0) / (T.dissolveSeconds * 1000));
        const ease = prog * prog * (3 - 2 * prog);
        const buckets: Path2D[] = [];
        for (let b = 0; b < RAMP_BUCKETS; b += 1) buckets.push(new Path2D());
        for (let i = 0; i < particles.length; i += 1) {
          const p = particles[i];
          const x = p.tx + Math.cos(p.ph1) * ease * 12;
          const y = p.ty + Math.sin(p.ph2) * ease * 12;
          const s = dot * (1 + 0.2 * ease);
          buckets[bucketFor(1, RAMP_BUCKETS)].rect(x - s / 2, y - s / 2, s, s);
        }
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 1 - ease;
        for (let b = 0; b < RAMP_BUCKETS; b += 1) {
          ctx.fillStyle = ramp[b];
          ctx.fill(buckets[b]);
        }
        ctx.globalAlpha = 1;
        if (prog >= 1) build(textRef.current, clustersRef.current);
        raf = requestAnimationFrame(frame);
        return;
      }

      const ts = (now - t0) / 1000;
      const totalMs = T.totalSeconds * 1000;
      const t = (now - t0) / totalMs;

      if (phase === 'forming' && t >= 1) {
        phase = 'hold';
        phaseT0 = now;
        onNameTargets = true;
      } else if (phase === 'hold' && now - phaseT0 > holdMs) {
        advanceFromHold(now);
      } else if (phase === 'morph' && now - phaseT0 > morphSpan) {
        phase = 'hold';
        phaseT0 = now;
      }

      const guideFade = phase === 'forming' ? Math.max(0, 1 - t / T.guideShare) : 0;
      if (guideFade > 0.01) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = 1;
        const gy = Math.round(ruleY + oy) + 0.5;
        ctx.strokeStyle = `rgba(34,197,94,${(0.18 * guideFade).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(ox, gy);
        ctx.lineTo(ox + nameW, gy);
        ctx.stroke();
        ctx.strokeStyle = `rgba(165,180,252,${(0.3 * guideFade).toFixed(3)})`;
        ctx.beginPath();
        edges.forEach((bx, i) => {
          if (clustersNow[i] === ' ') return;
          const gx = Math.round(ox + bx) + 0.5;
          ctx.moveTo(gx, oy + ruleY - 3.5);
          ctx.lineTo(gx, oy + ruleY + 3.5);
        });
        ctx.stroke();
      }

      ctx.globalCompositeOperation = 'lighter';
      const waiting = new Path2D();
      const buckets: Path2D[] = [];
      for (let b = 0; b < RAMP_BUCKETS; b += 1) buckets.push(new Path2D());

      const morphing = phase === 'morph';
      const mRaw = morphing ? (now - phaseT0) / morphMs : 0;

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        let x = 0;
        let y = 0;
        let s = dot;
        let lc = 1;

        if (phase === 'forming') {
          const local = (t - p.at) / p.dur;
          if (local <= 0) {
            const ws = dot * 0.75;
            waiting.rect(p.ox - ws / 2, p.oy - ws / 2, ws, ws);
            continue;
          }
          const lcc = local > 1 ? 1 : local;
          const e = easeOutSettle(lcc, T.settleBack);
          x = p.ox + (p.tx - p.ox) * e;
          y = p.oy + (p.ty - p.oy) * e;
          lc = lcc;
          s = dot * (1.4 - 0.4 * lcc);
          if (lcc > 0.12 && lcc < 0.78) {
            const bx2 = x + (p.ox - x) * 0.18;
            const by2 = y + (p.oy - y) * 0.18;
            buckets[bucketFor(lc, RAMP_BUCKETS)].rect(bx2 - s * 0.26, by2 - s * 0.26, s * 0.52, s * 0.52);
          }
        } else if (morphing) {
          const local = clamp01(mRaw - p.stg);
          const e = motionEase(morphMotion, local);
          const pos = flowPoint(p.fromX, p.fromY, p.toX, p.toY, e, p.bend);
          x = pos.x;
          y = pos.y;
          const nameS = dot;
          const sceneS = dot * (0.9 + 0.22 * p.z);
          const fromS = morphFromName ? nameS : sceneS;
          const toS = morphToName ? nameS : sceneS;
          s = fromS + (toS - fromS) * e;
          lc = 0.94 + 0.06 * e;
        } else if (onNameTargets) {
          // NAME HOLD — dense, stable, clearly readable
          x = p.tx + T.microPx * Math.sin(ts * 1.15 + p.ph1);
          y = p.ty + T.microPx * Math.cos(ts * 0.95 + p.ph2);
          const c = (ts / T.breathSeconds + p.ph3 * 0.08) % 1;
          if (c < T.breathWindow) {
            const env = Math.sin(Math.PI * (c / T.breathWindow));
            x += Math.cos(p.ph1) * T.breathPx * env * 0.45;
            y += Math.sin(p.ph2) * T.breathPx * env * 0.45;
          }
          s = dot;
          lc = 1;
        } else {
          // scene hold — soft depth shimmer, restrained breath on sleep
          x = p.toX + T.microPx * 0.85 * Math.sin(ts * 1.05 + p.ph1);
          y = p.toY + T.microPx * 0.85 * Math.cos(ts * 0.9 + p.ph2);
          // soft depth shimmer on service holds — denser on data climax
          if (currentBeat?.id === 'data') {
            const pulse = 0.5 + 0.5 * Math.sin(ts * 1.6);
            s = dot * (0.94 + 0.18 * p.z + 0.04 * pulse);
          } else if (currentBeat?.id === 'devices') {
            s = dot * (0.9 + 0.2 * p.z + 0.02 * Math.sin(ts * 2.2 + p.ph3));
          } else {
            s = dot * (0.9 + 0.2 * p.z);
          }
          lc = 0.96 + 0.04 * p.z;
        }

        buckets[bucketFor(lc, RAMP_BUCKETS)].rect(x - s / 2, y - s / 2, s, s);
      }

      ctx.fillStyle = WAITING_INK;
      ctx.fill(waiting);
      for (let b = 0; b < RAMP_BUCKETS; b += 1) {
        ctx.fillStyle = ramp[b];
        ctx.fill(buckets[b]);
      }

      raf = requestAnimationFrame(frame);
    };

    const resume = () => {
      if (cancelled) return;
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const startLoop = () => {
      if (cancelled || raf) return;
      raf = requestAnimationFrame((now) => {
        t0 = now;
        phaseT0 = now;
        dissolveT0 = now;
        frame(now);
      });
    };

    const start = () => {
      if (cancelled) return;
      if (build(textRef.current, clustersRef.current)) startLoop();
    };

    const withFonts = () => {
      if (cancelled) return;
      try {
        const cs = window.getComputedStyle(stage);
        const fontStr = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const loaded = document.fonts?.load(fontStr, textRef.current);
        if (loaded && typeof loaded.then === 'function') {
          loaded.then(() => document.fonts.ready).then(start, start);
        } else {
          start();
        }
      } catch {
        start();
      }
    };

    const onVisibility = () => {
      if (cancelled) return;
      if (document.hidden) return;
      resume();
    };

    withFonts();
    later(() => {
      if (!builtText) giveUpToText();
    }, 5000);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      if (calmRaf) {
        cancelAnimationFrame(calmRaf);
        calmRaf = 0;
      }
      timers.forEach((id) => window.clearTimeout(id));
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.width = 0;
      canvas.height = 0;
      delete stage.dataset.asm;
      stage.style.removeProperty('--sig-resolve');
    };
  }, [reducedMotion, armed]);

  return (
    <span className={`sig-name${reducedMotion ? ' sig-static' : ''}`}>
      <span className="sr-only">{text}</span>
      <span className="sig-stage" aria-hidden="true" ref={stageRef}>
        <span className="sig-glyphs">
          {clusters.map((ch, i) => (
            <span
              key={`g-${i}`}
              ref={(el) => {
                cellRefs.current[i] = el;
              }}
              className={ch === ' ' ? 'sig-space' : 'sig-cell'}
              style={ch === ' ' ? undefined : ({ '--ink': INKS[i % INKS.length] } as CSSProperties)}
            >
              {ch === ' ' ? '\u00A0' : ch}
            </span>
          ))}
        </span>
        <canvas className="sig-canvas" ref={canvasRef} />
      </span>
    </span>
  );
}
