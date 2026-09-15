'use client';

/* ═══════════════════════════════════════════════════════════════
   WORLD MAP — a dynamic, page-aware environment.

   Concept: a dark, deep-green cartographic atmosphere that says
   "global presence, Bangladeshi origin" — and TRAVELS. Each of the
   nine sections owns one deterministic geographic focus
   (app/geo.ts → GEO_FOCUS, aligned with SECTION_IDS by index), and
   the camera flies there whenever the pager turns a page.

   Layers (content always wins)
   ----------------------------
     L1 land             — Natural Earth 1:110m, Miller projection,
                           generated offline by tools/make-worldmap.py
     L2 focus glow       — a soft radial wash centred on the current
                           page's geographic focus
     L3 data flow        — origin→hub arcs (static geometry) with a
                           handful of travelling packets (SMIL motion)
     L4 technical motifs — circuit traces, orbits, waveforms, network
                           nodes; decorative, static, very low ink
     L5 atmosphere       — the existing deep-green radial wash

   Camera
   ------
   The camera is the SVG viewBox, interpolated with rAF during page
   transitions (~1.25 s, ease-in-out) and set instantly for reduced
   motion. Nothing else moves geometry: land, hubs, links and pins
   keep their coordinates, and their strokes stay crisp at every zoom
   because they use `vector-effect: non-scaling-stroke`. There is no
   CSS transform on map geometry — that is what shimmered before.

   Every marker is COMPUTED from real longitude/latitude via
   app/geo.ts — never hand-placed. `check-units` asserts the origin
   point falls inside the projected Bangladesh outline.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from 'react';
import { BANGLADESH_OUTLINE, WORLD_LAND } from './world-map-path';
import {
  GEO_FOCUS,
  HUB_POINTS,
  ORIGIN_POINT,
  clampCamera,
  focusCamera,
  type PageFocus,
} from '@/app/geo';

/** Origin → a spread of hubs, bowed upward so they read as arcs. */
const LINK_TARGETS = [0, 2, 4, 7] as const;

function arc(to: { x: number; y: number }) {
  const mx = (ORIGIN_POINT.x + to.x) / 2;
  const my = (ORIGIN_POINT.y + to.y) / 2;
  const lift = Math.min(46, Math.abs(to.x - ORIGIN_POINT.x) * 0.18);
  return `M${ORIGIN_POINT.x.toFixed(1)} ${ORIGIN_POINT.y.toFixed(1)} Q ${mx.toFixed(1)} ${(my - lift).toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
}

const LINKS = LINK_TARGETS.map((i) => arc(HUB_POINTS[i]));

/** Packet cadence — staggered so deliveries never sync up. */
const PACKETS = LINKS.map((d, i) => ({ d, dur: 7 + i * 2.4, begin: 1.2 + i * 1.9 }));

type Cam = { x: number; y: number; hw: number };

const FLIGHT_MS = 1250;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function focusFor(index: number): PageFocus {
  return GEO_FOCUS[index] ?? GEO_FOCUS[0];
}

function camFor(index: number): Cam {
  const f = focusFor(index);
  const c = focusCamera(f);
  return clampCamera(c.cx, c.cy, c.hw);
}

function viewBoxOf(cam: Cam): string {
  return `${(cam.x - cam.hw).toFixed(1)} ${(cam.y - cam.hw).toFixed(1)} ${(cam.hw * 2).toFixed(1)} ${(cam.hw * 2).toFixed(1)}`;
}

export function WorldMap({
  sectionIndex = 0,
  reducedMotion = false,
}: {
  sectionIndex?: number;
  reducedMotion?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);

  /* Server-render the page's own camera so deep links and crawlers see
     the geography that belongs to the route. */
  const [initialCam] = useState<Cam>(() => camFor(sectionIndex));
  const camRef = useRef<Cam>(initialCam);

  const applyCam = (cam: Cam) => {
    const svg = svgRef.current;
    if (svg) svg.setAttribute('viewBox', viewBoxOf(cam));
    const glow = glowRef.current;
    if (glow) {
      glow.setAttribute('cx', cam.x.toFixed(1));
      glow.setAttribute('cy', cam.y.toFixed(1));
      glow.setAttribute('r', (cam.hw * 0.95).toFixed(1));
    }
    const host = hostRef.current;
    if (host) host.dataset.cam = `${cam.x.toFixed(1)},${cam.y.toFixed(1)},${cam.hw.toFixed(1)}`;
  };

  /* Fly the camera when the page changes. */
  useEffect(() => {
    const target = camFor(sectionIndex);
    const from = camRef.current;
    if (reducedMotion) {
      camRef.current = target;
      applyCam(target);
      return;
    }
    if (from.x === target.x && from.y === target.y && from.hw === target.hw) return;

    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      raf = 0;
      const t = Math.min(1, (now - start) / FLIGHT_MS);
      const k = easeInOut(t);
      const cam: Cam = {
        x: from.x + (target.x - from.x) * k,
        y: from.y + (target.y - from.y) * k,
        hw: from.hw + (target.hw - from.hw) * k,
      };
      camRef.current = cam;
      applyCam(cam);
      if (t < 1 && !document.hidden) raf = requestAnimationFrame(step);
      else if (t < 1) {
        /* hidden mid-flight: land quietly at the destination */
        camRef.current = target;
        applyCam(target);
      }
    };
    raf = requestAnimationFrame(step);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sectionIndex, reducedMotion]);

  /* The origin ring is the only CSS-animated thing here (opacity
     only). Stop it when the tab is hidden — one attribute flip per
     visibility change, never a per-frame React update. */
  useEffect(() => {
    if (reducedMotion) return;
    const host = hostRef.current;
    if (!host) return;
    const onVis = () => {
      host.dataset.paused = document.hidden ? 'true' : 'false';
    };
    onVis();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [reducedMotion]);

  const { x, y } = ORIGIN_POINT;
  const f = focusFor(sectionIndex);

  return (
    <div
      ref={hostRef}
      className="worldmap"
      data-paused="false"
      data-section={f.section}
      data-cam={`${initialCam.x.toFixed(1)},${initialCam.y.toFixed(1)},${initialCam.hw.toFixed(1)}`}
      aria-hidden
    >
      <div className="worldmap-atmosphere" />
      <svg
        ref={svgRef}
        className="worldmap-svg"
        viewBox={viewBoxOf(initialCam)}
        preserveAspectRatio="xMidYMid meet"
        focusable="false"
      >
        <defs>
          <radialGradient id="map-focus-glow">
            <stop offset="0%" stopColor="rgba(16,185,129,0.16)" />
            <stop offset="55%" stopColor="rgba(16,185,129,0.05)" />
            <stop offset="100%" stopColor="rgba(16,185,129,0)" />
          </radialGradient>
        </defs>

        {/* L1 — the land */}
        <path className="worldmap-land" d={WORLD_LAND} />

        {/* L2 — the page's geographic focus, panned by the camera */}
        <circle
          ref={glowRef}
          className="worldmap-focus"
          cx={initialCam.x}
          cy={initialCam.y}
          r={initialCam.hw * 0.95}
          fill="url(#map-focus-glow)"
        />

        {/* network — static geometry; the packets do the travelling */}
        <g className="worldmap-network">
          {LINKS.map((d, i) => (
            <path key={i} className="worldmap-link" d={d} />
          ))}
          {HUB_POINTS.map((p, i) => (
            <circle key={i} className="worldmap-hub" cx={p.x} cy={p.y} r={1.5} />
          ))}
        </g>

        {/* L3 — data flow: a few restrained packets along the arcs.
            SMIL motion, not CSS: the geometry itself never animates. */}
        {!reducedMotion && (
          <g className="worldmap-flow">
            {PACKETS.map((p, i) => (
              <circle key={i} className="worldmap-packet" r={1.05}>
                <animateMotion dur={`${p.dur}s`} begin={`${p.begin}s`} repeatCount="indefinite" path={p.d} />
              </circle>
            ))}
          </g>
        )}

        {/* Bangladesh — the origin, drawn from the real national outline */}
        <g className="worldmap-origin">
          <path className="worldmap-bd" d={BANGLADESH_OUTLINE} />
          <circle className="worldmap-origin-halo" cx={x} cy={y} r={6.5} />
          <circle className="worldmap-origin-ring" cx={x} cy={y} r={3.1} />
          <circle className="worldmap-origin-core" cx={x} cy={y} r={1.7} />
        </g>
      </svg>

      {/* L4 — technical vector motifs. Screen-space, decorative, static:
          circuit traces, orbits, a waveform fragment, network nodes. */}
      <svg className="maptech" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" focusable="false">
        {/* circuit traces — top left */}
        <g className="maptech-circuit">
          <path d="M40 84 h84 l18 18 h56" />
          <path d="M124 84 v34 l14 14 h30" />
          <circle cx="198" cy="102" r="2.2" />
          <circle cx="168" cy="132" r="2.2" />
          <circle cx="40" cy="84" r="1.6" />
        </g>
        {/* orbital arcs — top right */}
        <g className="maptech-orbit">
          <circle cx="906" cy="92" r="44" />
          <circle cx="906" cy="92" r="66" />
          <path d="M906 22 v8 M906 154 v8 M836 92 h8 M968 92 h8" />
          <circle cx="938" cy="60" r="1.8" />
        </g>
        {/* waveform fragment — bottom left */}
        <g className="maptech-wave">
          <path d="M42 522 l14 -18 14 30 14 -22 14 12 14 -8 14 16 14 -10" />
          <circle cx="42" cy="522" r="1.6" />
        </g>
        {/* network nodes — bottom right */}
        <g className="maptech-net">
          <path d="M862 512 L906 472 L942 530 L898 556 Z" />
          <path d="M862 512 L942 530 M906 472 L898 556" />
          <circle cx="862" cy="512" r="2" />
          <circle cx="906" cy="472" r="2" />
          <circle cx="942" cy="530" r="2" />
          <circle cx="898" cy="556" r="2" />
        </g>
        {/* coordinate ticks — left edge */}
        <g className="maptech-ticks">
          <path d="M24 256 h6 M24 276 h6 M24 296 h6 M24 316 h6 M24 336 h6" />
        </g>
      </svg>
    </div>
  );
}
