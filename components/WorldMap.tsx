'use client';

/* ═══════════════════════════════════════════════════════════════
   WORLD MAP — a dynamic, page-aware geographic environment.

   Concept: a dark, deep-green cartographic atmosphere that says
   "global presence, Bangladeshi origin" — and TRAVELS. Each of the
   seven sections owns one deterministic geographic focus
   (app/geo.ts → GEO_FOCUS, aligned with SECTION_IDS by index), and
   the camera flies there whenever the pager turns a page.

   The map is real geography, not a dot abstraction: Natural Earth
   1:110m land plus a per-country layer where every territory keeps
   its recognisable shape. The section's active country lights up in
   its own restrained ink while all others stay subdued.

   Layers (content always wins)
   ----------------------------
     L1 land + countries — Natural Earth 1:110m, Miller projection,
                           generated offline by tools/make-worldmap.py
     L2 focus glow       — a soft radial wash centred on the current
                           page's geographic focus
     L3 data flow        — origin→hub arcs + one active route to the
                           current focus, with travelling packets (SMIL)
     L4 technical motifs — circuit traces, orbits, waveforms, network
                           nodes; decorative, static, very low ink
     L5 atmosphere       — the deep-green radial wash

   Camera
   ------
   The camera is the SVG viewBox, interpolated with rAF during page
   transitions (~1.25 s, ease-in-out) and set instantly for reduced
   motion. Nothing else moves geometry: land, countries, hubs, links
   and pins keep their coordinates, and their strokes stay crisp at
   every zoom because they use `vector-effect: non-scaling-stroke`.
   There is no CSS transform on map geometry — that is what shimmered
   before. Country activation is a class flip (fill/stroke recolour),
   never an animated geometry change.

   Every marker is COMPUTED from real longitude/latitude via
   app/geo.ts — never hand-placed. `check-units` asserts the origin
   point falls inside the projected Bangladesh outline.

   Arrival
   -------
   Two sections can legitimately share a country (a work history is not
   one city), so a country tint alone cannot say where a page is. Every
   non-origin section therefore carries a projected marker on its real
   coordinates plus a small label naming the place, in the reader's
   language. The camera centres that point, `check-units` asserts it
   lands on the frame's centre for phone and desktop viewports, and the
   ink, label and route hand over together at 55% of the flight — so a
   destination is never lit before its own geography arrives, and the
   previous one is never still lit after it has left.

   Accessibility: the map is decoration (`aria-hidden`), but the
   active geography is also announced as real text (sr-only focus
   line, polite live region, following the route rather than the
   animation), so the focus never exists only visually.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { BANGLADESH_OUTLINE, WORLD_LAND } from './world-map-path';
import { COUNTRY_PATHS } from './world-map-countries';
import {
  COUNTRY_INKS,
  GEO_FOCUS,
  HUB_POINTS,
  MICRO_FOCUS,
  ORIGIN_POINT,
  cameraFor,
  projectPoint,
  projectToScreen,
  type Camera,
  type PageFocus,
} from '@/app/geo';
import { useLang } from '@/app/language';

/** Origin → a spread of hubs, bowed upward so they read as arcs. */
const LINK_TARGETS = [0, 2, 4, 7] as const;

function arc(from: { x: number; y: number }, to: { x: number; y: number }) {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const lift = Math.min(46, Math.abs(to.x - from.x) * 0.18);
  return `M${from.x.toFixed(1)} ${from.y.toFixed(1)} Q ${mx.toFixed(1)} ${(my - lift).toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
}

const LINKS = LINK_TARGETS.map((i) => arc(ORIGIN_POINT, HUB_POINTS[i]));

/** Packet cadence — staggered so deliveries never sync up. */
const PACKETS = LINKS.map((d, i) => ({ d, dur: 7 + i * 2.4, begin: 1.2 + i * 1.9 }));

/** Country shapes are static; memoised so re-renders never re-map 171 paths. */
const COUNTRY_ELEMENTS = Object.entries(COUNTRY_PATHS).map(([iso, d]) => ({ iso, d }));

const FLIGHT_MS = 1250;

/* The country ink, the arrival label and the route change hands as the
   camera arrives, not as the page turns. A destination that lights up
   while the previous geography still fills the screen is the same class
   of flicker as a stale country — just at the other end of the flight.
   0.55 puts the swap on the far side of the midpoint. */
const HANDOVER = 0.55;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function focusFor(index: number): PageFocus {
  return GEO_FOCUS[index] ?? GEO_FOCUS[0];
}

function viewBoxOf(cam: Camera): string {
  return `${(cam.x - cam.hw).toFixed(1)} ${(cam.y - cam.hw).toFixed(1)} ${(cam.hw * 2).toFixed(1)} ${(cam.hw * 2).toFixed(1)}`;
}

export function WorldMap({
  sectionIndex = 0,
  reducedMotion = false,
}: {
  sectionIndex?: number;
  reducedMotion?: boolean;
}) {
  const { t, lang } = useLang();
  const hostRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const hostSizeRef = useRef({ width: 0, height: 0 });

  /* Server-render the page's own camera so deep links and crawlers see
     the geography that belongs to the route. `cameraFor` is the only
     place a camera is derived — this component never computes one, so
     the rendered state and the promised state cannot drift. */
  const [initialCam] = useState<Camera>(() => cameraFor(sectionIndex));
  const camRef = useRef<Camera>(initialCam);

  /* Which section owns the map's pixels right now. It trails the page
     index until the camera has flown, so the highlight can never arrive
     ahead of the geography it belongs to. */
  const [activeIndex, setActiveIndex] = useState(sectionIndex);
  const activeIndexRef = useRef(sectionIndex);

  const f = focusFor(activeIndex);
  const focusPoint = projectPoint(f.lon, f.lat);
  const focusPointRef = useRef(focusPoint);
  focusPointRef.current = focusPoint;
  const activeInk = COUNTRY_INKS[f.country];

  const placeLabel = (index: number) => {
    const g = focusFor(index);
    return lang === 'bn' ? g.placeBn : g.place;
  };

  const applyCam = (cam: Camera) => {
    const svg = svgRef.current;
    if (svg) svg.setAttribute('viewBox', viewBoxOf(cam));
    const glow = glowRef.current;
    if (glow) {
      glow.setAttribute('cx', cam.x.toFixed(1));
      glow.setAttribute('cy', cam.y.toFixed(1));
      glow.setAttribute('r', (cam.hw * 0.95).toFixed(1));
    }
    const host = hostRef.current;
    if (!host) return;
    host.dataset.cam = `${cam.x.toFixed(1)},${cam.y.toFixed(1)},${cam.hw.toFixed(1)}`;

    /* The arrival label sits on the focus's real coordinates, in screen
       space: text inside the viewBox would scale with the camera and be
       unreadable on a phone-sized map. One transform write per frame —
       no layout, no transition, nothing re-rasterised. */
    const label = labelRef.current;
    if (!label) return;
    const size = hostSizeRef.current;
    if (!size.width || !size.height) return;
    const p = projectToScreen(cam, focusPointRef.current, size);
    const inside =
      p.x > 8 && p.y > 8 && p.x < size.width - 8 && p.y < size.height - 8;
    label.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
    label.dataset.on = inside ? 'true' : 'false';
  };

  /* Fly the camera when the page changes, and hand the map over to the
     new section as it arrives. One effect owns both, so nothing else can
     move the camera or flip the geography on its own. */
  useEffect(() => {
    const target = cameraFor(sectionIndex);
    const from = camRef.current;
    const handOver = () => {
      if (activeIndexRef.current === sectionIndex) return;
      activeIndexRef.current = sectionIndex;
      setActiveIndex(sectionIndex);
    };
    if (reducedMotion) {
      camRef.current = target;
      applyCam(target);
      handOver();
      return;
    }
    if (from.x === target.x && from.y === target.y && from.hw === target.hw) {
      handOver();
      return;
    }

    const timer = window.setTimeout(handOver, FLIGHT_MS * HANDOVER);
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      raf = 0;
      const t = Math.min(1, (now - start) / FLIGHT_MS);
      const k = easeInOut(t);
      const cam: Camera = {
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
        handOver();
      }
    };
    raf = requestAnimationFrame(step);
    return () => {
      window.clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sectionIndex, reducedMotion]);

  /* Cache the host size outside the camera loop. Reading clientWidth after
     changing the SVG viewBox on every frame can force synchronous layout. */
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const onResize = () => {
      hostSizeRef.current = { width: host.clientWidth, height: host.clientHeight };
      applyCam(camRef.current);
    };
    onResize();
    const observer = new ResizeObserver(onResize);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

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

  /* The active route: origin → this section's focus. Its packet
     remounts per section, so SMIL restarts cleanly on every flight. */
  const activeRoute = f.country === 'BGD' ? null : arc(ORIGIN_POINT, focusPoint);

  return (
    <>
      {/* the focus is real text, not only pixels — and it follows the
          ROUTE, not the animation, so a screen reader hears the page's
          geography the moment the page turns */}
      <span className="sr-only" aria-live="polite">{`${t.ui.mapFocus}: ${placeLabel(sectionIndex)}`}</span>

      <div
        ref={hostRef}
        className="worldmap"
        data-paused="false"
        data-section={f.section}
        data-country={f.country}
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

          {/* L1b — every country, each keeping its real shape. The
              section's active country carries its own ink; all others
              stay subdued political geography. */}
          <g className="worldmap-countries">
            {COUNTRY_ELEMENTS.map(({ iso, d }) => (
              <path
                key={iso}
                d={d}
                className={iso === f.country ? 'worldmap-country worldmap-country-active' : 'worldmap-country'}
                style={
                  iso === f.country && activeInk
                    ? ({ '--cf': activeInk.fill, '--cs': activeInk.stroke } as CSSProperties)
                    : undefined
                }
              />
            ))}
            {/* city-states carry no outline at 1:110m — a projected
                marker takes the active ink instead of a faked shape */}
            {MICRO_FOCUS.has(f.country) && activeInk && (
              <path
                className="worldmap-micro"
                d={`M${focusPoint.x} ${focusPoint.y - 3.4} L${focusPoint.x + 3.4} ${focusPoint.y} L${focusPoint.x} ${focusPoint.y + 3.4} L${focusPoint.x - 3.4} ${focusPoint.y} Z`}
                style={{ '--cf': activeInk.fill, '--cs': activeInk.stroke } as CSSProperties}
              />
            )}
          </g>

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
            {activeRoute && <path className="worldmap-active-route" d={activeRoute} />}
            {HUB_POINTS.map((p, i) => (
              <circle key={i} className="worldmap-hub" cx={p.x} cy={p.y} r={1.5} />
            ))}
          </g>

          {/* L3 — data flow: a few restrained packets along the arcs,
              plus one delivery along the active route. SMIL motion, not
              CSS: the geometry itself never animates. */}
          {!reducedMotion && (
            <g className="worldmap-flow">
              {PACKETS.map((p, i) => (
                <circle key={i} className="worldmap-packet" r={1.05}>
                  <animateMotion dur={`${p.dur}s`} begin={`${p.begin}s`} repeatCount="indefinite" path={p.d} />
                </circle>
              ))}
              {activeRoute && (
                <circle key={f.section} className="worldmap-packet worldmap-packet-active" r={1.15}>
                  <animateMotion dur="5.6s" begin="0.6s" repeatCount="indefinite" path={activeRoute} />
                </circle>
              )}
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

        {/* The arriving focus, named — placed on the same real
            coordinates as the marker, in the reader's language. Only the
            origin page is exempt: Dhaka already owns the most prominent
            marker on the map, so labelling it twice would be noise. */}
        {f.country !== 'BGD' && (
          <span
            ref={labelRef}
            className="worldmap-pin"
            data-on="false"
            style={{ '--pin-ink': activeInk?.stroke } as CSSProperties}
          >
            <span className="worldmap-pin-mark" />
            <span className="worldmap-pin-body">{placeLabel(activeIndex)}</span>
          </span>
        )}

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
    </>
  );
}
