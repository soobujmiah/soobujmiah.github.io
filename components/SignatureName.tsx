'use client';

/* ═══════════════════════════════════════════════════════════════
   SIGNATURE NAME — compact geometric keyword morph.

   One particle population. No scene illustrations.

       NAME  ⇄  service keyword  ⇄  NAME  ⇄  next keyword  ⇄  …

   Keywords come from servicesContent (SERVICE_SLUGS order).
   Both name and keywords are sampled from real font ink via fillText
   so density stays consistent and morphs stay geometric/deterministic.

   Reduced motion: static multi-tone wordmark, no canvas loop.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useRef } from 'react';
import type { CSSProperties } from 'react';
import { segmentGraphemes } from '@/app/graphemes';
import { MOTION } from '@/app/design-tokens';
import { useLang } from '@/app/language';
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
import { STORY_BEATS, serviceKeywords, NAME_HOLD_MS } from '@/app/story-world';

const INKS = ['#a3e635', '#4ade80', '#22c55e', '#34d399', '#10b981', '#2dd4bf', '#84cc16', '#16a34a'];
const ASSEMBLE_INKS = ['#7dd3fc', '#a5b4fc', '#93c5fd', '#67e8f9'];
const LOCK_INK = '#eab308';
const RAMP_BUCKETS = 8;
const WARM_AT = 0.72;
const RESOLVED_INK = '#4ade80';
const WAITING_INK = 'rgba(147,197,253,0.20)';

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
type Pt = { x: number; y: number };

const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);

export function SignatureName({
  text,
  reducedMotion = false,
  armed = true,
}: {
  text: string;
  reducedMotion?: boolean;
  armed?: boolean;
}) {
  const { lang } = useLang();
  const clusters = useMemo(() => segmentGraphemes(text), [text]);
  const keywords = useMemo(() => serviceKeywords(lang), [lang]);
  const textRef = useRef(text);
  const clustersRef = useRef(clusters);
  const keywordsRef = useRef(keywords);
  textRef.current = text;
  clustersRef.current = clusters;
  keywordsRef.current = keywords;
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
    let holdMs = NAME_HOLD_MS;
    let morphMs = 1600;
    let morphSpan = 1600;
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
    let budgetNow = 1600;
    let fontStr = '';
    let fontSize = 64;

    /** Sample any string into story-stage CSS points using the identity font. */
    const sampleTextPoints = (label: string, maxCount: number): Pt[] => {
      if (!label || !(storyW > 0) || !(storyH > 0)) return [];
      const pad = 4;
      const fw = Math.max(1, Math.ceil(storyW * dpr));
      const fh = Math.max(1, Math.ceil(storyH * dpr));
      const sample = document.createElement('canvas');
      sample.width = fw;
      sample.height = fh;
      const sctx = sample.getContext('2d', { alpha: true, willReadFrequently: true });
      if (!sctx) return [];
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sctx.clearRect(0, 0, storyW, storyH);

      // Fit keyword into the story stage — slightly smaller than the name.
      let size = Math.min(fontSize * 0.72, storyH * 0.42, 48);
      sctx.font = `700 ${Math.round(size)}px ${fontStr.replace(/^\s*\d+\s+/, '').replace(/^[^ ]+\s+/, '') || 'sans-serif'}`;
      // Prefer computed family from stage
      sctx.font = `700 ${Math.round(size)}px ${window.getComputedStyle(stage).fontFamily}`;
      sctx.textAlign = 'center';
      sctx.textBaseline = 'middle';
      sctx.fillStyle = '#ffffff';

      let metrics = sctx.measureText(label);
      const maxW = storyW * 0.92;
      if (metrics.width > maxW && metrics.width > 0) {
        size = size * (maxW / metrics.width);
        sctx.font = `700 ${Math.round(size)}px ${window.getComputedStyle(stage).fontFamily}`;
        metrics = sctx.measureText(label);
      }
      sctx.fillText(label, storyW / 2, storyH / 2 + pad * 0.25);

      const img = sctx.getImageData(0, 0, fw, fh).data;
      const baseStep = Math.max(1, Math.round(T.sampleStepPx * dpr));
      const countAt = (step: number) => {
        let n = 0;
        for (let y = 0; y < fh; y += step) {
          for (let x = 0; x < fw; x += step) {
            if (img[(y * fw + x) * 4 + 3] > 110) n += 1;
          }
        }
        return n;
      };
      const step = denseStepFor(countAt(baseStep), baseStep, Math.max(200, maxCount));
      const pts: Pt[] = [];
      for (let y = 0; y < fh; y += step) {
        for (let x = 0; x < fw; x += step) {
          if (img[(y * fw + x) * 4 + 3] > 110) {
            pts.push({ x: (x + step / 2) / dpr, y: (y + step / 2) / dpr });
          }
        }
      }
      return pts;
    };

    const sampleNameTargets = (
      textNow: string,
      clustersIn: string[],
      stageBox: DOMRect,
      sctx: CanvasRenderingContext2D
    ): Particle[] => {
      const cs = window.getComputedStyle(stage);
      fontStr = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      fontSize = parseFloat(cs.fontSize) || 64;
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

      for (let y = 0; y < chh; y += step) {
        for (let x = 0; x < cw; x += step) {
          if (img[(y * cw + x) * 4 + 3] <= 110) continue;
          const lx = (x + step / 2) / dpr;
          const ly = (y + step / 2) / dpr;
          const tx = lx + ox;
          const ty = ly + oy;
          const o = disperseOrigin(lx, ly, nameW, nameH, rnd, T.disperseRadius * 0.85);
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
      const maxArea = 3.5e6;
      const areaAt = (d: number) => layerBox.width * d * (layerBox.height * d);
      while (dpr > 1 && areaAt(dpr) > maxArea) dpr -= 0.25;

      storyW = layerBox.width;
      storyH = layerBox.height;
      ox = stageBox.left - layerBox.left;
      oy = stageBox.top - layerBox.top;

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
      dot = Math.max(1.25, Math.min(2.6, Math.min(nameW, storyW) / 200));

      canvas.width = Math.max(1, Math.round(storyW * dpr));
      canvas.height = Math.max(1, Math.round(storyH * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stage.dataset.asm = 'run';
      builtText = textNow;
      beatIndex = -1;
      onNameTargets = true;
      holdMs = NAME_HOLD_MS;
      phase = 'forming';
      return true;
    };

    const aimToPoints = (
      pts: Pt[],
      now: number,
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
      const rnd = mulberry32((fieldSeed ^ Math.imul(beatIndex + 7, 0x85ebca6b)) >>> 0);
      let stgMax = 0;

      for (let i = 0; i < n; i += 1) {
        const p = particles[i];
        const dest = toPts[map[i]] || toPts[i % toPts.length];
        // tiny deterministic jitter only when many→few
        const jx = towardName ? 0 : ((p.ph1 * 0.3183) % 1 - 0.5) * 1.1;
        const jy = towardName ? 0 : ((p.ph2 * 0.3183) % 1 - 0.5) * 1.1;
        p.fromX = fromPts[i].x;
        p.fromY = fromPts[i].y;
        p.toX = dest.x + jx;
        p.toY = dest.y + jy;
        const dist = Math.hypot(p.toX - p.fromX, p.toY - p.fromY);
        // geometric, restrained bend — no scatter explosion
        p.bend = (rnd() - 0.5) * Math.min(28, dist * 0.12);
        p.stg = (i / Math.max(1, n - 1)) * 0.06 + rnd() * 0.02;
        if (p.stg > stgMax) stgMax = p.stg;
      }

      morphMs = morphDuration;
      morphSpan = morphDuration * (1 + stgMax);
      morphFromName = onNameTargets;
      morphToName = towardName;
      onNameTargets = towardName;
      phase = 'morph';
      phaseT0 = now;
    };

    const aimToKeyword = (index: number, now: number) => {
      const beat = STORY_BEATS[index];
      const label = keywordsRef.current[beat.serviceIndex] ?? '';
      const pts = sampleTextPoints(label, budgetNow);
      holdMs = beat.holdMs;
      aimToPoints(pts, now, beat.morphMs, false);
    };

    const returnToName = (now: number) => {
      holdMs = NAME_HOLD_MS;
      const namePts = particles.map((p) => ({ x: p.tx, y: p.ty }));
      aimToPoints(namePts, now, 1500, true);
    };

    const advanceFromHold = (now: number) => {
      if (onNameTargets) {
        // name → next keyword
        beatIndex = (beatIndex + 1) % STORY_BEATS.length;
        aimToKeyword(beatIndex, now);
        return;
      }
      // keyword → name
      returnToName(now);
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
          const x = p.tx + Math.cos(p.ph1) * ease * 10;
          const y = p.ty + Math.sin(p.ph2) * ease * 10;
          const s = dot * (1 + 0.15 * ease);
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
        ctx.strokeStyle = `rgba(34,197,94,${(0.16 * guideFade).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(ox, gy);
        ctx.lineTo(ox + nameW, gy);
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
          s = dot * (1.35 - 0.35 * lcc);
        } else if (morphing) {
          const local = clamp01(mRaw - p.stg);
          const e = easeInOutQuint(local);
          const pos = flowPoint(p.fromX, p.fromY, p.toX, p.toY, e, p.bend);
          x = pos.x;
          y = pos.y;
          const nameS = dot;
          const keyS = dot * 0.95;
          const fromS = morphFromName ? nameS : keyS;
          const toS = morphToName ? nameS : keyS;
          s = fromS + (toS - fromS) * e;
          lc = 0.95 + 0.05 * e;
        } else {
          // hold — near-static for readability (name or keyword)
          const hx = onNameTargets ? p.tx : p.toX;
          const hy = onNameTargets ? p.ty : p.toY;
          x = hx + T.microPx * Math.sin(ts * 1.1 + p.ph1);
          y = hy + T.microPx * Math.cos(ts * 0.95 + p.ph2);
          s = onNameTargets ? dot : dot * 0.95;
          lc = 1;
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
        const fs = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const loaded = document.fonts?.load(fs, textRef.current);
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
  }, [reducedMotion, armed, lang]);

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
