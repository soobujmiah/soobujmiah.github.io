'use client';

/* ═══════════════════════════════════════════════════════════════
   SIGNATURE NAME — polished geometric keyword morph.

   One particle population. Fixed story-stage slot (no layout shift).

       NAME  ⇄  service keyword (≤2 lines)  ⇄  NAME  ⇄  …

   Keywords from story-world (SERVICE_SLUGS order). Both name and
   keywords are sampled from real font ink. Morph styles vary by beat
   (axis / sweep / compress / converge / wave) — deterministic, reverse-
   coherent trajectories via styledFlowPoint.

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
  centerPointsInSafeRect,
  disperseOrigin,
  easeOutSettle,
  easeInOutQuint,
  hashSeed,
  mulberry32,
  particleBudget,
  particleCountForInk,
  densityStepFor,
  rampPalette,
  denseStepFor,
  sampleInkPoints,
  spatialPairing,
  startOffset,
  styledFlowPoint,
  splitTwoLines,
  morphParamsFromSeed,
  staggerOrder,
  type MorphStyle,
  type MorphParams,
} from '@/app/name-motion';
import { STORY_BEATS, serviceKeywords, NAME_HOLD_MS } from '@/app/story-world';

const INKS = ['#a3e635', '#4ade80', '#22c55e', '#34d399', '#10b981', '#2dd4bf', '#84cc16', '#16a34a'];
/* Green-only identity lock — one hue family, no amber/gold/cyan detour.
   Morph brightness may vary; HUE never leaves brand green. */
const ASSEMBLE_INKS = ['#22c55e', '#16a34a', '#4ade80', '#34d399'];
const LOCK_INK = '#4ade80';
const RAMP_BUCKETS = 8;
const WARM_AT = 0.5;
const RESOLVED_INK = '#4ade80';
const WAITING_INK = 'rgba(34,197,94,0.16)';
/** Solid identity ink used for hold + morph (no hue ramp mid-flight). */
const IDENTITY_INK = '#4ade80';

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
    let morphMs = 1750;
    let morphSpan = 1750;
    let onNameTargets = true;
    let morphFromName = true;
    let morphToName = true;
    let morphStyle: MorphStyle = 'radial';
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
    let fieldCx = 0;
    let fieldCy = 0;
    let edges: number[] = [];
    let ramp: string[] = [];
    let budgetNow = 1600;
    let fontSize = 64;
    /** Name-field areal density (particles / CSS-px² of ink) — reference weight. */
    let nameInkDensity = 0.12;
    /** Cache: service label + viewport key → densified CSS points. */
    const keywordCache = new Map<string, Pt[]>();

    /**
     * Sample a service title into the FULL story-stage canvas (≤2 lines).
     *
     * Pipeline: fit scale → raster mask → areal density → sample ink →
     * center actual particle bounds. Density matches the name field so
     * long titles never go skeletal. One particle pool expands when a
     * keyword needs more samples than the name held.
     */
    const sampleTextPoints = (label: string, poolCap: number): Pt[] => {
      if (!label || !(storyW > 0) || !(storyH > 0)) return [];
      const cacheKey = `${label}|${Math.round(storyW)}x${Math.round(storyH)}|${Math.round(fontSize)}|${dpr.toFixed(2)}`;
      const hit = keywordCache.get(cacheKey);
      if (hit) return hit;

      const fw = Math.max(1, Math.ceil(storyW * dpr));
      const fh = Math.max(1, Math.ceil(storyH * dpr));
      const sample = document.createElement('canvas');
      sample.width = fw;
      sample.height = fh;
      const sctx = sample.getContext('2d', { alpha: true, willReadFrequently: true });
      if (!sctx) return [];
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sctx.clearRect(0, 0, storyW, storyH);

      const family = window.getComputedStyle(stage).fontFamily;
      // SERVICE SIZE ≈ NAME SIZE. Prefer two lines over shrinking.
      // Safe air for particle radius + anti-alias fringe — prevents edge crop.
      const edgeAir = Math.max(3.5, (dot || 2) * 1.15 + 2);
      const safeW = Math.max(8, storyW - edgeAir * 2);
      const safeH = Math.max(8, storyH - edgeAir * 2);
      let size = fontSize;
      /* Inner text width is stricter than the stage so long titles never
         paint into the particle air band (Office Admin / Small-Business /
         Computer Setup were clipping here). */
      const maxW = safeW * 0.98;
      const applyFont = (px: number) => {
        sctx.font = `700 ${Math.round(px)}px ${family}`;
      };
      applyFont(size);
      sctx.textAlign = 'center';
      sctx.textBaseline = 'alphabetic';
      sctx.fillStyle = '#ffffff';

      const measure = (s: string) => sctx.measureText(s).width;
      const lineWidth = (s: string) => {
        const m = sctx.measureText(s);
        const left =
          typeof m.actualBoundingBoxLeft === 'number' ? m.actualBoundingBoxLeft : 0;
        const right =
          typeof m.actualBoundingBoxRight === 'number' ? m.actualBoundingBoxRight : m.width;
        /* actual boxes are from the anchor; for center-aligned we need full span. */
        const span = left + right;
        return Math.max(m.width, span);
      };
      const glyphMetrics = () => {
        const m = sctx.measureText('HgÁy|@Wp');
        const ascent =
          (typeof m.fontBoundingBoxAscent === 'number' && m.fontBoundingBoxAscent) ||
          (typeof m.actualBoundingBoxAscent === 'number' && m.actualBoundingBoxAscent) ||
          size * 0.82;
        const descent =
          (typeof m.fontBoundingBoxDescent === 'number' && m.fontBoundingBoxDescent) ||
          (typeof m.actualBoundingBoxDescent === 'number' && m.actualBoundingBoxDescent) ||
          size * 0.24;
        return { ascent, descent, content: ascent + descent };
      };

      /* Fit at name scale using REAL glyph extents. Prefer wrap over shrink.
         Floor stays high (not subtitle), but MUST keep reducing while the
         measured two-line block still overflows the safe rect — otherwise
         long titles paint past the canvas and look cropped. */
      const minSize = Math.max(fontSize * 0.78, Math.min(storyH * 0.34, fontSize * 0.9));
      let lines = splitTwoLines(label, measure, maxW);
      let met = glyphMetrics();
      let lineH = met.content + Math.max(1, size * 0.05);
      for (let guard = 0; guard < 28; guard += 1) {
        lines = splitTwoLines(label, measure, maxW);
        met = glyphMetrics();
        lineH = met.content + Math.max(1, size * 0.05);
        const blockH = lines.length * lineH;
        const widest = Math.max(...lines.map(lineWidth), 0);
        if (widest <= maxW && blockH <= safeH) break;
        if (size <= minSize + 0.15) break;
        size = Math.max(minSize, size * 0.97);
        applyFont(size);
      }

      lines = splitTwoLines(label, measure, maxW);
      met = glyphMetrics();
      lineH = met.content + Math.max(1, size * 0.05);
      /* If still overflowing at the floor, compress line box slightly (not
         a third line, not a global redesign). */
      let blockH = lines.length * lineH;
      if (blockH > safeH && lines.length > 1) {
        lineH = Math.max(met.content * 0.98, safeH / lines.length);
        blockH = lines.length * lineH;
      }
      let blockTop = (storyH - blockH) / 2;
      if (blockTop < edgeAir) blockTop = edgeAir;
      if (blockTop + blockH > storyH - edgeAir) {
        blockTop = Math.max(edgeAir, storyH - edgeAir - blockH);
      }

      applyFont(size);
      for (let i = 0; i < lines.length; i += 1) {
        const boxTop = blockTop + i * lineH;
        const baseline = baselineWithinBox(boxTop, lineH, met.ascent, met.descent);
        sctx.fillText(lines[i], storyW / 2, baseline);
      }

      /* Second-pass: if any ink still sits outside the safe rect (true glyph
         overhang past measureText), clear and re-draw at a reduced scale
         from the measured ink bounds — guarantees no raster crop. */
      let img = sctx.getImageData(0, 0, fw, fh).data;
      const inkBounds = () => {
        let minX = fw;
        let minY = fh;
        let maxX = -1;
        let maxY = -1;
        for (let y = 0; y < fh; y += 1) {
          for (let x = 0; x < fw; x += 1) {
            if (img[(y * fw + x) * 4 + 3] > 80) {
              if (x < minX) minX = x;
              if (y < minY) minY = y;
              if (x > maxX) maxX = x;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (maxX < 0) return null;
        return {
          minX: minX / dpr,
          minY: minY / dpr,
          maxX: (maxX + 1) / dpr,
          maxY: (maxY + 1) / dpr,
          w: (maxX - minX + 1) / dpr,
          h: (maxY - minY + 1) / dpr,
        };
      };
      let bounds = inkBounds();
      if (
        bounds &&
        (bounds.w > safeW * 1.01 ||
          bounds.h > safeH * 1.01 ||
          bounds.minX < edgeAir - 0.5 ||
          bounds.minY < edgeAir - 0.5 ||
          bounds.maxX > storyW - edgeAir + 0.5 ||
          bounds.maxY > storyH - edgeAir + 0.5)
      ) {
        const sx = safeW / Math.max(1e-3, bounds.w);
        const sy = safeH / Math.max(1e-3, bounds.h);
        const k = Math.min(1, sx, sy) * 0.97;
        size = Math.max(minSize * 0.95, size * k);
        applyFont(size);
        sctx.clearRect(0, 0, storyW, storyH);
        lines = splitTwoLines(label, measure, maxW);
        met = glyphMetrics();
        lineH = met.content + Math.max(1, size * 0.05);
        blockH = lines.length * lineH;
        if (blockH > safeH && lines.length > 1) {
          lineH = Math.max(met.content * 0.98, safeH / lines.length);
          blockH = lines.length * lineH;
        }
        blockTop = (storyH - blockH) / 2;
        if (blockTop < edgeAir) blockTop = edgeAir;
        if (blockTop + blockH > storyH - edgeAir) {
          blockTop = Math.max(edgeAir, storyH - edgeAir - blockH);
        }
        for (let i = 0; i < lines.length; i += 1) {
          const boxTop = blockTop + i * lineH;
          const baseline = baselineWithinBox(boxTop, lineH, met.ascent, met.descent);
          sctx.fillText(lines[i], storyW / 2, baseline);
        }
        img = sctx.getImageData(0, 0, fw, fh).data;
        bounds = inkBounds();
      }

      /* Probe ink at a stable base grid, then lock areal density to the name. */
      const probe = Math.max(1, Math.round(T.sampleStepPx * dpr * 0.9));
      let inkAtProbe = 0;
      for (let y = 0; y < fh; y += probe) {
        for (let x = 0; x < fw; x += probe) {
          if (img[(y * fw + x) * 4 + 3] > 100) inkAtProbe += 1;
        }
      }
      /* Density in device-px²: name density is CSS → convert via dpr². */
      const targetDensityDev = Math.max(0.04, nameInkDensity / (dpr * dpr));
      const maxPts = Math.min(
        Math.max(poolCap, budgetNow),
        Math.max(480, Math.round(T.maxParticles * (storyW < 700 ? 0.85 : 1)))
      );
      const minPts = Math.max(220, Math.round(budgetNow * 0.55));
      const want = particleCountForInk(inkAtProbe, probe, targetDensityDev, minPts, maxPts);
      const step = densityStepFor(
        inkAtProbe,
        probe,
        targetDensityDev,
        Math.max(1, Math.floor(probe * 0.45)),
        Math.max(probe, Math.ceil(probe * 1.35))
      );
      const raw = sampleInkPoints(img, fw, fh, step, 100, want, hashSeed(label + cacheKey));
      /* CSS space — uniform scale-fit into safe rect (no edge crush). */
      const pts: Pt[] = raw.map((p) => ({ x: p.x / dpr, y: p.y / dpr }));
      centerPointsInSafeRect(pts, storyW * 0.5, storyH * 0.5, {
        left: edgeAir,
        top: edgeAir,
        right: Math.max(edgeAir + 1, storyW - edgeAir),
        bottom: Math.max(edgeAir + 1, storyH - edgeAir),
      });
      if (keywordCache.size > 24) keywordCache.clear();
      keywordCache.set(cacheKey, pts);
      return pts;
    };

    const sampleNameTargets = (
      textNow: string,
      clustersIn: string[],
      stageBox: DOMRect,
      sctx: CanvasRenderingContext2D
    ): Particle[] => {
      const cs = window.getComputedStyle(stage);
      const fontStr = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
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
      budgetNow = particleBudget(Math.max(nameW, storyW * 0.6), cores, T.maxParticles);

      const countAt = (step: number) => {
        let n = 0;
        for (let y = 0; y < chh; y += step) {
          for (let x = 0; x < cw; x += step) {
            if (img[(y * cw + x) * 4 + 3] > 110) n += 1;
          }
        }
        return n;
      };
      /* Name uses denseStepFor toward budget — still the visual reference. */
      const inkAtBase = countAt(baseStep);
      const step = denseStepFor(inkAtBase, baseStep, budgetNow);
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
      /* Lock areal density from the assembled name so service titles match. */
      const inkAreaCss =
        inkAtBase * (baseStep / dpr) * (baseStep / dpr);
      if (inkAreaCss > 1 && next.length > 0) {
        nameInkDensity = next.length / inkAreaCss;
      } else {
        nameInkDensity = 0.12;
      }
      /* Clamp density into a readable band (particles / CSS-px² of ink). */
      if (nameInkDensity < 0.08) nameInkDensity = 0.08;
      if (nameInkDensity > 0.28) nameInkDensity = 0.28;
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

      /* Drawable field = the reserved story slot (≤2-line height), NOT the
         single-line name box. Canvas is positioned on .hero-story-stage so
         two-line service glyphs never clip against the name's shorter box. */
      const fieldEl =
        (stage.closest('.hero-story-stage') as HTMLElement | null) ??
        (stage.parentElement as HTMLElement | null);
      const fieldBox = fieldEl ? fieldEl.getBoundingClientRect() : stageBox;

      const unset = (r: DOMRect, el: HTMLElement) =>
        Math.abs(r.width - el.offsetWidth) < 0.75 && Math.abs(r.height - el.offsetHeight) < 0.75;
      const calm =
        unset(stageBox, stage) && (!fieldEl || unset(fieldBox, fieldEl));
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
      const areaAt = (d: number) => fieldBox.width * d * (fieldBox.height * d);
      while (dpr > 1 && areaAt(dpr) > maxArea) dpr -= 0.25;

      storyW = fieldBox.width;
      storyH = fieldBox.height;
      fieldCx = storyW * 0.5;
      fieldCy = storyH * 0.5;
      ox = stageBox.left - fieldBox.left;
      oy = stageBox.top - fieldBox.top;

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
      ramp = rampPalette(ASSEMBLE_INKS[0], LOCK_INK, RESOLVED_INK, RAMP_BUCKETS, WARM_AT);
      // Stable particle radius for name AND services — same material weight.
      // Slightly larger than pure hairline so strokes read solid, not dotted.
      dot = Math.max(1.55, Math.min(2.85, Math.min(nameW, storyW) / 165));
      keywordCache.clear();

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

    let morphParams: MorphParams = morphParamsFromSeed(1, 'radial');

    /**
     * Grow the shared particle pool when a denser keyword target needs
     * more samples than the name held. New particles clone nearest
     * existing ones so the morph stays continuous (no pop-in field).
     */
    const ensurePoolSize = (need: number, seed: number) => {
      const cap = Math.max(480, Math.round(T.maxParticles * (storyW < 700 ? 0.9 : 1)));
      const target = Math.min(need, cap);
      if (particles.length >= target || particles.length === 0) return;
      const rnd = mulberry32(seed >>> 0);
      const base = particles.length;
      while (particles.length < target) {
        const src = particles[Math.floor(rnd() * base) % base];
        const jx = (rnd() - 0.5) * 1.2;
        const jy = (rnd() - 0.5) * 1.2;
        particles.push({
          tx: src.tx + jx,
          ty: src.ty + jy,
          ox: src.ox + jx,
          oy: src.oy + jy,
          at: src.at,
          dur: src.dur,
          ph1: rnd() * Math.PI * 2,
          ph2: rnd() * Math.PI * 2,
          ph3: rnd() * Math.PI * 2,
          fromX: src.fromX + jx,
          fromY: src.fromY + jy,
          toX: src.toX + jx,
          toY: src.toY + jy,
          bend: 0,
          stg: 0,
          z: rnd(),
        });
      }
    };

    const aimToPoints = (
      pts: Pt[],
      now: number,
      morphDuration: number,
      towardName: boolean,
      style: MorphStyle,
      transitionKey: string
    ) => {
      if (particles.length === 0) return;
      if (pts.length === 0) {
        phase = 'hold';
        phaseT0 = now;
        return;
      }

      /* Expand pool toward keyword density before pairing (no mid-morph spawn). */
      if (!towardName && pts.length > particles.length) {
        ensurePoolSize(
          pts.length,
          (fieldSeed ^ Math.imul(beatIndex + 7, 0x27d4eb2d) ^ hashSeed(transitionKey)) >>> 0
        );
      }

      const n = particles.length;
      const fromPts = particles.map((p) =>
        onNameTargets ? { x: p.tx, y: p.ty } : { x: p.toX, y: p.toY }
      );
      /* Toward name: pair onto the name anchors (tx/ty). Surplus particles
         that were cloned for a dense keyword collapse onto nearest name pts
         via spatialPairing's stretch — continuous, no despawn flash. */
      const toPts = towardName
        ? particles.map((p) => ({ x: p.tx, y: p.ty }))
        : pts;
      const map = spatialPairing(fromPts, toPts);
      const seed =
        (fieldSeed ^
          Math.imul(beatIndex + 19, 0x85ebca6b) ^
          hashSeed(style + ':' + transitionKey + (towardName ? ':back' : ':out'))) >>>
        0;
      const params = morphParamsFromSeed(seed, style, morphStyle);
      morphParams = params;
      const rnd = mulberry32(seed);
      let stgMax = 0;

      for (let i = 0; i < n; i += 1) {
        const p = particles[i];
        const dest = toPts[map[i]] || toPts[i % toPts.length];
        p.fromX = fromPts[i].x;
        p.fromY = fromPts[i].y;
        p.toX = dest.x;
        p.toY = dest.y;
        const dist = Math.hypot(p.toX - p.fromX, p.toY - p.fromY);
        p.bend = (rnd() - 0.5) * Math.min(36, dist * params.bendScale);

        const nx = storyW > 0 ? p.fromX / storyW : 0.5;
        const ny = storyH > 0 ? p.fromY / storyH : 0.5;
        // Multi-group activation: core / flow / edge via z + stagger.
        const order = staggerOrder(nx, ny, params.prop, params.flip);
        const group = p.z < 0.2 ? 0 : p.z < 0.55 ? 1 : p.z < 0.85 ? 2 : 3;
        const groupBias = group * 0.035;
        p.stg = clamp01(order) * params.stagger + groupBias + rnd() * 0.02;
        if (p.stg > stgMax) stgMax = p.stg;
      }

      morphStyle = style;
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
      /* Cap = maxParticles band so density can grow past the name pool. */
      const pts = sampleTextPoints(label, Math.max(budgetNow, Math.round(T.maxParticles * 0.85)));
      holdMs = beat.holdMs;
      aimToPoints(pts, now, beat.morphMs, false, beat.styleOut, beat.slug);
    };

    const returnToName = (now: number) => {
      holdMs = NAME_HOLD_MS;
      const beat = STORY_BEATS[Math.max(0, beatIndex)];
      const style = beat?.styleBack ?? morphStyle;
      const namePts = particles.map((p) => ({ x: p.tx, y: p.ty }));
      aimToPoints(namePts, now, 1800, true, style, beat?.slug ?? 'name');
    };

    const advanceFromHold = (now: number) => {
      if (onNameTargets) {
        beatIndex = (beatIndex + 1) % STORY_BEATS.length;
        aimToKeyword(beatIndex, now);
        return;
      }
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
      // Soft glow envelope during morph — peaks mid-flight, settles at ends.
      const glow =
        morphing ? Math.sin(Math.min(1, Math.max(0, mRaw)) * Math.PI) * 0.35 : 0;

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
          const pos = styledFlowPoint(
            p.fromX,
            p.fromY,
            p.toX,
            p.toY,
            e,
            p.bend,
            morphStyle,
            fieldCx,
            fieldCy,
            morphParams
          );
          x = pos.x;
          y = pos.y;
          // Same particle scale for name and service — identical visual role.
          const baseS = dot * 1.08;
          const pulse = 1 + glow * 0.18 * Math.sin(e * Math.PI);
          s = baseS * pulse;
          // Brightness only (green lock) — never a hue shift.
          lc = 0.85 + 0.15 * e;
        } else {
          // Hold — near-static for readability (name or keyword).
          const hx = onNameTargets ? p.tx : p.toX;
          const hy = onNameTargets ? p.ty : p.toY;
          x = hx + T.microPx * Math.sin(ts * 1.1 + p.ph1);
          y = hy + T.microPx * Math.cos(ts * 0.95 + p.ph2);
          s = dot * 1.08;
          lc = 1;
        }

        /* Keep every painted particle inside the story-stage bitmap —
           mid-flight arcs/overshoot must not vanish off the canvas edge. */
        const half = s / 2;
        if (x < half) x = half;
        else if (x > storyW - half) x = storyW - half;
        if (y < half) y = half;
        else if (y > storyH - half) y = storyH - half;
        buckets[bucketFor(lc, RAMP_BUCKETS)].rect(x - half, y - half, s, s);
      }

      ctx.fillStyle = WAITING_INK;
      ctx.fill(waiting);
      // Soft green glow only (same hue) during morph.
      if (glow > 0.02) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = glow * 0.1;
        const g = Math.min(storyW, storyH) * 0.4;
        const grd = ctx.createRadialGradient(fieldCx, fieldCy, 4, fieldCx, fieldCy, g);
        grd.addColorStop(0, 'rgba(74,222,128,0.28)');
        grd.addColorStop(1, 'rgba(74,222,128,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, storyW, storyH);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'lighter';
      }
      // Identity green lock — single fill for hold/morph (no multi-hue ramp).
      ctx.fillStyle = IDENTITY_INK;
      for (let b = 0; b < RAMP_BUCKETS; b += 1) {
        ctx.globalAlpha = 0.72 + (b / Math.max(1, RAMP_BUCKETS - 1)) * 0.28;
        ctx.fill(buckets[b]);
      }
      ctx.globalAlpha = 1;

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
