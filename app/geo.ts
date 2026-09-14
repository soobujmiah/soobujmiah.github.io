/* ═══════════════════════════════════════════════════════════════
   GEO — the single source of truth for the hero map's projection.

   The world map is drawn from Natural Earth 1:110m contours that were
   projected offline by `tools/make-worldmap.py`. This module holds the
   same projection so every marker, hub and outline is *computed from
   real longitude/latitude* rather than eyeballed in pixels.

   If the Python generator and this file ever disagree, the range check
   in `scripts/check-units.mjs` fails: it parses the generated path data
   and asserts every coordinate lands inside the viewBox defined here.
   ═══════════════════════════════════════════════════════════════ */

/** viewBox width in map units (equirectangular: lon -180..180). */
export const MAP_WIDTH = 1000;

/** Latitude crop. Antarctica is excluded; the map covers the inhabited world. */
export const MAP_LAT_TOP = 84;
export const MAP_LAT_BOTTOM = -58;

const PAD = 6;

/** Miller cylindrical northing, in map units. */
export function millerY(latDeg: number): number {
  const phi = (latDeg * Math.PI) / 180;
  return -1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * phi)) * (MAP_WIDTH / (2 * Math.PI));
}

/** Project a geographic coordinate into map units. */
export function projectPoint(lon: number, lat: number): { x: number; y: number } {
  return { x: ((lon + 180) / 360) * MAP_WIDTH, y: millerY(lat) };
}

const TOP = millerY(MAP_LAT_TOP);
const BOTTOM = millerY(MAP_LAT_BOTTOM);

/** The SVG viewBox every map layer is drawn in. */
export const MAP_VIEWBOX = `0 ${(TOP - PAD).toFixed(1)} ${MAP_WIDTH} ${(BOTTOM - TOP + PAD * 2).toFixed(1)}`;

/** Where the work happens. Real coordinates — Dhaka, Bangladesh. */
export const ORIGIN = { lon: 90.4, lat: 23.8, name: 'Dhaka' } as const;

/**
 * The origin marker, projected — never hand-placed. `check-units` asserts
 * this point falls inside the Bangladesh outline, so it cannot drift.
 */
export const ORIGIN_POINT = projectPoint(ORIGIN.lon, ORIGIN.lat);

/**
 * The global network this identity is connected to. Real coordinates,
 * projected by the same maths as the land.
 */
export const HUBS = [
  { lon: 0.1, lat: 51.5 }, // London
  { lon: -122.4, lat: 37.8 }, // San Francisco
  { lon: 103.8, lat: 1.4 }, // Singapore
  { lon: 13.4, lat: 52.5 }, // Berlin
  { lon: 139.7, lat: 35.7 }, // Tokyo
  { lon: 151.2, lat: -33.9 }, // Sydney
  { lon: 36.8, lat: -1.3 }, // Nairobi
  { lon: -46.6, lat: -23.5 }, // São Paulo
  { lon: -79.4, lat: 43.7 }, // Toronto
] as const;

export const HUB_POINTS = HUBS.map((h) => projectPoint(h.lon, h.lat));

/** True when (x, y) lies inside the closed ring of `[x, y, x, y, …]` pairs. */
export function pointInRing(x: number, y: number, ring: readonly number[]): boolean {
  let inside = false;
  const n = ring.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = ring[i * 2];
    const yi = ring[i * 2 + 1];
    const xj = ring[j * 2];
    const yj = ring[j * 2 + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
