'use client';

/* ═══════════════════════════════════════════════════════════════
   WORLD MAP — the environment behind the identity.

   Concept: a dark, deep-green cartographic atmosphere. The hero name
   is the protagonist; this layer is the room it stands in.

   Design rules
   ------------
   - Contours only: Natural Earth 1:110m land, Miller-projected,
     simplified (see tools/make-worldmap.py). No graticule, no grid,
     no tiles, no boxes — the previous square-grid motif is gone.
   - Very low contrast: the land is a whisper, the coastlines a
     hairline. Nothing here competes with the name.
   - Green family only (--accent / --signal). No near-white, no cyan.
   - Cheap: one inline SVG, zero canvas, zero rAF. Motion is CSS
     transform/opacity, so it composites on the GPU. Paused when the
     tab is hidden and entirely static under prefers-reduced-motion.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from 'react';
import { WORLD_LAND, WORLD_VIEWBOX } from './world-map-path';

/** Network hubs, projected with the same Miller maths as the land path. */
const HUBS: Array<{ x: number; y: number; r: number; home?: boolean }> = [
  { x: 751.1, y: -67.4, r: 3.0, home: true }, // Dhaka
  { x: 499.7, y: -157.3, r: 2.1 }, // London
  { x: 160.0, y: -110.2, r: 2.1 }, // San Francisco
  { x: 788.3, y: -3.9, r: 2.0 }, // Singapore
  { x: 537.2, y: -161.0, r: 1.9 }, // Berlin
  { x: 888.1, y: -103.5, r: 2.1 }, // Tokyo
  { x: 920.0, y: 97.9, r: 1.9 }, // Sydney
  { x: 602.2, y: 3.6, r: 1.9 }, // Nairobi
  { x: 370.6, y: 66.5, r: 1.9 }, // São Paulo
];

/** Faint links out of the home hub — the network, not a route map. */
const LINKS = [
  'M751.1 -67.4 Q 620 -150 499.7 -157.3',
  'M751.1 -67.4 Q 820 -40 888.1 -103.5',
  'M751.1 -67.4 Q 690 10 602.2 3.6',
];

export function WorldMap({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);

  /* Suspend the drift/pulse while the tab is hidden — one attribute
     flip per visibility change, never a per-frame React update. */
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

  return (
    <div ref={hostRef} className="worldmap" data-paused="false" aria-hidden>
      <div className="worldmap-atmosphere" />
      <svg
        className="worldmap-svg"
        viewBox={WORLD_VIEWBOX}
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <g className="worldmap-drift">
          <path className="worldmap-land" d={WORLD_LAND} />
        </g>
        <g className="worldmap-signals">
          {LINKS.map((d, i) => (
            <path key={i} className="worldmap-link" d={d} style={{ animationDelay: `${i * 2.6}s` }} />
          ))}
          {HUBS.map((h, i) => (
            <g key={i} className={h.home ? 'worldmap-hub worldmap-hub-home' : 'worldmap-hub'}>
              <circle
                cx={h.x}
                cy={h.y}
                r={h.r}
                className="worldmap-hub-core"
                style={{ animationDelay: `${(i * 1.15).toFixed(2)}s` }}
              />
              <circle
                cx={h.x}
                cy={h.y}
                r={h.r * 2.6}
                className="worldmap-hub-halo"
                style={{ animationDelay: `${(i * 1.15).toFixed(2)}s` }}
              />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
