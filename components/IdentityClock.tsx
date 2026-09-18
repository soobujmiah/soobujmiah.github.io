'use client';

/* ═══════════════════════════════════════════════════════════════
   IDENTITY CLOCK — the signature name's smaller sibling.

   Digits render as dot matrices sampled from the wordmark faces
   (Chakra Petch; Anek Bangla for Bengali digits) — the resolved
   state of the name's own particles — never a generic monospace:
   if sampling is unavailable, the same wordmark face renders plain
   text. The browser's text engine draws every glyph, so Bengali
   shapes are correct by construction.

   Same contract as the flip clock it replaces: only changed digits
   animate (position-keyed slots), fixed-width slots so the layout
   never shifts, one timer cleaned up on unmount/language change,
   client-only first paint (SSR/no-JS baseline untouched), and
   reduced motion neutralised in CSS. Bengali gets Bengali digits
   (localizeDigits) and the Bengali meridiem from the content tree.

   Rendered in two parts: `part="time"` (the dot-matrix clock) leads
   the hero under the header; `part="date"` (the bilingual date ·
   timezone metadata line) closes the hero under the CTAs — the
   clock frames the identity without crowding the name.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useLang, localizeDigits } from '@/app/language';
import { hour12, twoDigit } from '@/app/clock';

type DotGrid = { cols: number; rows: number; cells: boolean[]; cw: number };

const ROWS = 15; // 11 rows aliased Chakra Petch 6/9 into 8 — see the threshold note
const SIZE = 88; // canvas glyph size, px

/* Deterministic and cached: ten digits per language, sampled once. */
const gridCache = new Map<string, DotGrid | null>();

/**
 * Sample one glyph's ink into a dot grid: collect ink pixels and their
 * bounding box in one pass, then count ink per cell of an 11-row grid.
 * The faces string is a CSS font-family list — the canvas resolves the
 * fallback chain natively (so a face missing Bengali digits yields to
 * the next). Implausible coverage (no ink / tofu) → null, and the
 * caller falls back to the wordmark face as plain text.
 */
function sampleGlyph(ch: string, faces: string, bn: boolean): DotGrid | null {
  const key = `${ch}|${faces}|${bn}`;
  const hit = gridCache.get(key);
  if (hit !== undefined) return hit;
  let grid: DotGrid | null = null;
  try {
    const cv = document.createElement('canvas');
    cv.width = SIZE * 2;
    cv.height = SIZE * 2;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.font = `700 ${SIZE}px ${faces}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(ch, SIZE, SIZE);
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
      const pts: number[] = [];
      let bx0 = cv.width;
      let by0 = cv.height;
      let bx1 = -1;
      let by1 = -1;
      for (let y = 0; y < cv.height; y += 1)
        for (let x = 0; x < cv.width; x += 1)
          if (d[(y * cv.width + x) * 4 + 3] > 96) {
            pts.push(x, y);
            if (x < bx0) bx0 = x;
            if (x > bx1) bx1 = x;
            if (y < by0) by0 = y;
            if (y > by1) by1 = y;
          }
      const w = bx1 - bx0 + 1;
      const h = by1 - by0 + 1;
      const cov = pts.length && w > 0 && h > 0 ? pts.length / 2 / (w * h) : 0;
      if (cov >= 0.05 && cov <= 0.72) {
        /* Column caps follow the script. Latin digits are narrow
           (w/h ≈ 0.55): 7 square-cell columns fit the 0.66 em slot.
           Bengali digits are inherently wide (w/h ≈ 0.8–1.1, measured
           on the shipped face) — 7 square columns squeezed them to
           ~45% of their proportions, collapsing the loops so ৬ read
           as ৫. Bengali gets 10 columns plus an aspect-preserving
           cell width (cw) inside its own wider slot. */
        const cols = Math.max(3, Math.min(bn ? 10 : 7, Math.round(w / (h / ROWS))));
        const n = new Uint16Array(ROWS * cols);
        for (let i = 0; i < pts.length; i += 2) {
          const c = Math.min(cols - 1, (((pts[i] - bx0) * cols) / w) | 0);
          const r = Math.min(ROWS - 1, (((pts[i + 1] - by0) * ROWS) / h) | 0);
          n[r * cols + c] += 1;
        }
        /* A cell lights when real ink fills it, and the threshold
           scales with the cell area. The old fixed ≥3px floor let
           anti-aliasing fringes close the counters of 6 and 9, so
           both displayed as 8 — the clock "showed" numbers it never
           held (55→58→57→58→58→00). 32% keeps bowls open, stems
           solid, and every digit 0-9 visually distinct. */
        const thr = Math.max(2, (w / cols) * (h / ROWS) * (bn ? 0.25 : 0.32));
        const cells: boolean[] = [];
        for (let i = 0; i < ROWS * cols; i += 1) cells.push(n[i] >= thr);
        /* cw: the em cell width that keeps a Bengali grid at its true
           proportions (the grid is always 1.02 em tall), capped so the
           widest grid still fits the 1.05 em Bengali slot with real
           breathing room. Latin keeps square cells (cw 0 → CSS
           default), so the working English clock is byte-identical. */
        grid = {
          cols,
          rows: ROWS,
          cells,
          cw: bn ? +Math.min(0.09, (1.02 * w) / (cols * h)).toFixed(4) : 0,
        };
      }
    }
  } catch {
    grid = null;
  }
  gridCache.set(key, grid);
  return grid;
}

/** One digit's face: its dot matrix, or the wordmark face as text. */
function DigitFace({ ch, faces, bn }: { ch: string; faces: string | null; bn: boolean }) {
  const grid = faces ? sampleGlyph(ch, faces, bn) : null;
  return grid ? (
    <span
      className="idc-grid"
      aria-hidden="true"
      style={{ '--cols': grid.cols, '--rows': grid.rows, '--cw': grid.cw ? `${grid.cw}em` : undefined } as CSSProperties}
    >
      {grid.cells.map((on, i) =>
        on ? <span key={i} className="idc-dot" data-on="true" /> : <span key={i} className="idc-dot" />
      )}
    </span>
  ) : (
    <span className="idc-fallback" aria-hidden="true">
      {ch}
    </span>
  );
}

/** One digit slot: a fixed viewport. A changed digit rolls — the old
    face exits upward while the new one enters from below, both clipped
    inside the slot, so the clock block never moves and nothing can
    drift into the neighbours or out of the row. Unchanged digits keep
    their DOM and never animate. */
function DigitSlot({ ch, faces, bn }: { ch: string; faces: string | null; bn: boolean }) {
  const prevRef = useRef(ch);
  const [ghost, setGhost] = useState<string | null>(null);
  useEffect(() => {
    const prev = prevRef.current;
    if (prev === ch) return;
    prevRef.current = ch;
    setGhost(prev);
    const id = setTimeout(() => setGhost(null), 380);
    return () => clearTimeout(id);
  }, [ch]);
  return (
    <span className="idc-slot">
      {ghost !== null && ghost !== ch ? (
        <span className="idc-ghost" aria-hidden="true">
          <DigitFace ch={ghost} faces={faces} bn={bn} />
        </span>
      ) : null}
      {/* key carries the value: a changed digit remounts and replays
          the roll-in; an unchanged digit keeps its DOM */}
      <span key={ch} className="idc-live">
        <DigitFace ch={ch} faces={faces} bn={bn} />
      </span>
    </span>
  );
}

type ClockState = { h: string; m: string; s: string; ap: string; date: string };

export function IdentityClock({ part = 'time' }: { part?: 'time' | 'date' }) {
  const { lang, t } = useLang();
  const bn = lang === 'bn';
  const [state, setState] = useState<ClockState | null>(null);
  const [faces, setFaces] = useState<string | null>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const isDate = part === 'date';

  /* One timer; Asia/Dhaka regardless of the visitor's timezone. Parts
     are read as Latin digits and localized by hand so the meridiem
     comes from the content tree, never from Intl's dayPeriod text. */
  useEffect(() => {
    const time = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Dhaka',
    });
    /* one localized formatter for the whole date line */
    const date = new Intl.DateTimeFormat(lang === 'bn' ? 'bn' : 'en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Dhaka',
    });
    const tick = () => {
      const d = new Date();
      const p: Record<string, string> = {};
      for (const part of time.formatToParts(d)) p[part.type] = part.value;
      /* one authoritative reading per tick: every displayed part —
         dial hour, meridiem, minute, second — derives from this same
         real-time value, never from animation state */
      const h24 = Math.min(23, Math.max(0, Number(p.hour ?? 0) || 0));
      setState({
        h: localizeDigits(String(hour12(h24)).padStart(2, '0'), lang),
        m: localizeDigits(twoDigit(Number(p.minute ?? 0)), lang),
        s: localizeDigits(twoDigit(Number(p.second ?? 0)), lang),
        ap: h24 < 12 ? t.ui.meridiemAm : t.ui.meridiemPm,
        date: date.format(d),
      });
    };
    /* Numeric determinism: a naive 1 s interval drifts across second
       boundaries — a displayed second could repeat or be skipped.
       Each tick re-aims at the next real boundary instead: the time
       face lands ~25 ms after a whole second, every time. The date
       line changes at most once a day, so it polls lazily. */
    let id = 0;
    const loop = () => {
      tick();
      id = window.setTimeout(loop, isDate ? 30_000 : 1025 - (Date.now() % 1000));
    };
    loop();
    return () => window.clearTimeout(id);
  }, [lang, t, isDate]);

  /* Resolve the identity's display faces from the probe element's
     computed style — the same pattern SignatureName uses: the CSS
     owns the font stack (per language, via body.lang-bn), JS only
     reads what actually applies. load() then guarantees the woff2 is
     in memory before the first sample. */
  useEffect(() => {
    if (isDate) return; // only digit matrices sample the wordmark faces
    let dead = false;
    const list = probeRef.current ? getComputedStyle(probeRef.current).fontFamily : '';
    const face = list.split(',')[0]?.trim() ?? '';
    const digits = lang === 'bn' ? '০১২৩৪৫৬৭৮৯' : '0123456789';
    void (async () => {
      try {
        await document.fonts?.ready;
        if (face) await document.fonts?.load(`700 ${SIZE}px ${face}`, digits);
      } catch {
        /* sampling falls back to text; the clock never blocks on fonts */
      }
      if (!dead && list) setFaces(list);
    })();
    return () => {
      dead = true;
    };
  }, [lang, isDate]);

  /* Client-only first paint, identical to the clock this replaces.
     The probe renders from the very first mount so the face
     resolution above always finds it. The language class is applied
     locally (not read from body.lang-bn) so the probe's computed
     font stack is already correct when this component's effect runs —
     child effects fire before the parent provider's body class swap.
     The date face keeps an empty line box on first paint so the
     metadata row never shifts in. */
  if (!state)
    return isDate ? (
      <span className="hero-clock-date font-mono" aria-hidden="true">
        &nbsp;
      </span>
    ) : (
      <span ref={probeRef} className={bn ? 'idc-probe idc-bn' : 'idc-probe'} aria-hidden="true" />
    );

  if (isDate)
    return (
      <span className="hero-clock-date font-mono">
        {state.date} · {bn ? 'জিএমটি+৬ · ঢাকা' : 'GMT+6 · Dhaka'}
      </span>
    );

  const digits = [state.h[0], state.h[1], ':', state.m[0], state.m[1], ':', state.s[0], state.s[1]];
  return (
    <span className={bn ? 'idclock idc-bn' : 'idclock'}>
      <span ref={probeRef} className="idc-probe" aria-hidden="true" />
      <span className="idc-time">
        {digits.map((ch, i) =>
          ch === ':' ? (
            <span key={i} className="idc-colon" aria-hidden="true">
              <i />
              <i />
            </span>
          ) : (
            <DigitSlot key={i} ch={ch ?? '0'} faces={faces} bn={bn} />
          )
        )}
        <span key={state.ap} className="idc-ampm">
          {state.ap}
        </span>
        <span className="sr-only">{`${state.h}:${state.m}:${state.s} ${state.ap}`}</span>
      </span>
    </span>
  );
}
