'use client';

/* ═══════════════════════════════════════════════════════════════
   WORLD MAP — the environment behind the identity.

   Concept: a dark, deep-green cartographic atmosphere that says
   "global presence, Bangladeshi origin". The hero name is the
   protagonist; this layer is the room it stands in.

   Stability rules (learned the hard way)
   --------------------------------------
   The previous version animated the map itself, which forced the
   renderer to re-rasterise a 29 KB vector path every frame:

     - `transform: scale()` on the land group while
       `vector-effect: non-scaling-stroke` was set  → stroke width had
       to be recomputed and the path re-tessellated continuously;
     - `transform: scale()` on stroked hub circles;
     - `stroke-dashoffset` on the link arcs.

   That is the background flicker. All three are gone. **Nothing in
   this component or its CSS moves geometry, and nothing animates
   except the opacity of one small origin ring** — opacity cannot
   re-tessellate anything, so the map cannot shimmer. Geometry is
   painted once per viewport and then never touched.

   The map no longer drifts. It is an environment, not a screensaver.

   Geography
   ---------
   - Natural Earth 1:110m land, Miller projection, generated offline by
     `tools/make-worldmap.py`.
   - Every marker is COMPUTED from real longitude/latitude via
     `app/geo.ts` — never hand-placed. `check-units` asserts the origin
     point falls inside the projected Bangladesh outline.
   - `preserveAspectRatio="xMidYMid meet"`: the whole world is always
     in frame, so Bangladesh can never be cropped out on a narrow
     viewport. This is why a phone shows a band rather than a filled
     screen — the alternative crops the origin away.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from 'react';
import { BANGLADESH_OUTLINE, WORLD_LAND } from './world-map-path';
import { HUB_POINTS, MAP_VIEWBOX, ORIGIN_POINT } from '@/app/geo';

/** Static links: origin → a few hubs, bowed upward so they read as arcs. */
const LINK_TARGETS = [0, 2, 4, 7] as const;

function arc(to: { x: number; y: number }) {
  const mx = (ORIGIN_POINT.x + to.x) / 2;
  const my = (ORIGIN_POINT.y + to.y) / 2;
  const lift = Math.min(46, Math.abs(to.x - ORIGIN_POINT.x) * 0.18);
  return `M${ORIGIN_POINT.x.toFixed(1)} ${ORIGIN_POINT.y.toFixed(1)} Q ${mx.toFixed(1)} ${(my - lift).toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
}

const LINKS = LINK_TARGETS.map((i) => arc(HUB_POINTS[i]));

export function WorldMap({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);

  /* The origin ring is the only animated thing here. Stop it when the
     tab is hidden — one attribute flip per visibility change, never a
     per-frame React update. */
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

  return (
    <div ref={hostRef} className="worldmap" data-paused="false" aria-hidden>
      <div className="worldmap-atmosphere" />
      <svg
        className="worldmap-svg"
        viewBox={MAP_VIEWBOX}
        preserveAspectRatio="xMidYMid meet"
        focusable="false"
      >
        <path className="worldmap-land" d={WORLD_LAND} />

        <g className="worldmap-network">
          {LINKS.map((d, i) => (
            <path key={i} className="worldmap-link" d={d} />
          ))}
          {HUB_POINTS.map((p, i) => (
            <circle key={i} className="worldmap-hub" cx={p.x} cy={p.y} r={1.5} />
          ))}
        </g>

        {/* Bangladesh — the origin, drawn from the real national outline */}
        <g className="worldmap-origin">
          <path className="worldmap-bd" d={BANGLADESH_OUTLINE} />
          <circle className="worldmap-origin-halo" cx={x} cy={y} r={6.5} />
          <circle className="worldmap-origin-ring" cx={x} cy={y} r={3.1} />
          <circle className="worldmap-origin-core" cx={x} cy={y} r={1.7} />
        </g>
      </svg>
    </div>
  );
}
