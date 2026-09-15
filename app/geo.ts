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

/* ═══════════════════════════════════════════════════════════════
   PAGE-TO-MAP CAMERA — one deterministic geographic focus per
   section, aligned with SECTION_IDS (app/sections.ts) by index.

   Home is Bangladesh (the origin). The other eight positions are
   chosen for meaningful global coverage AND for the owner's real
   geography: his work history in Saudi Arabia, freelance/remote
   ties toward North America and Europe, and the technology hubs
   his engineering work points at. Reordering sections reorders the
   camera with them — the mapping lives in one place.
   ═══════════════════════════════════════════════════════════════ */
export interface PageFocus {
  section: string;
  place: string;
  lon: number;
  lat: number;
  zoom: number;
}

export const GEO_FOCUS: readonly PageFocus[] = [
  { section: 'home', place: 'Dhaka, Bangladesh', lon: 90.4, lat: 23.8, zoom: 1.5 },
  { section: 'presence', place: 'Riyadh, Arabia', lon: 46.7, lat: 24.7, zoom: 2.8 },
  { section: 'about', place: 'Jeddah, Arabia', lon: 39.2, lat: 21.5, zoom: 2.8 },
  { section: 'work', place: 'London', lon: 0.1, lat: 51.5, zoom: 3.0 },
  { section: 'research', place: 'Toronto', lon: -79.4, lat: 43.7, zoom: 2.9 },
  { section: 'stack', place: 'Bengaluru', lon: 77.6, lat: 12.97, zoom: 3.0 },
  { section: 'open-source', place: 'Shenzhen', lon: 114.1, lat: 22.5, zoom: 3.0 },
  { section: 'experience', place: 'São Paulo', lon: -46.6, lat: -23.5, zoom: 2.9 },
  { section: 'contact', place: 'Singapore', lon: 103.8, lat: 1.4, zoom: 3.1 },
] as const;

/** Half the full map width; the camera aperture is derived from it. */
export const HALF_WORLD = MAP_WIDTH / 2;

/** Projected focus centre plus the camera aperture for a page focus. */
export function focusCamera(f: PageFocus) {
  const p = projectPoint(f.lon, f.lat);
  const hw = HALF_WORLD / f.zoom;
  return { cx: p.x, cy: p.y, hw };
}

/**
 * Clamp a camera centre so the aperture stays on the map. Vertically it
 * never leaves the projected latitudes; horizontally it may overshoot a
 * little (the atmosphere gradient continues past the map's edge), which
 * is what keeps Dhaka centred on Home despite the Pacific margin.
 */
export function clampCamera(cx: number, cy: number, hw: number) {
  const over = hw * 0.25;
  /* when the aperture is taller than the projected map (the Home-wide
     view), centre it vertically instead of clamping into emptiness */
  const y = TOP + hw > BOTTOM - hw ? (TOP + BOTTOM) / 2 : Math.min(Math.max(cy, TOP + hw), BOTTOM - hw);
  return {
    x: Math.min(Math.max(cx, hw - over), MAP_WIDTH - hw + over),
    y,
    hw,
  };
}

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
