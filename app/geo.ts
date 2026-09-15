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
  /**
   * The same place in Bengali. The map's arrival label is real text on
   * screen, so it has to speak the reader's language — the sr-only line
   * already did, and now both come from this one field.
   */
  placeBn: string;
  /** ISO 3166-1 alpha-3 of the active country for this section. */
  country: string;
  lon: number;
  lat: number;
  zoom: number;
}

export const GEO_FOCUS: readonly PageFocus[] = [
  { section: 'home', place: 'Dhaka, Bangladesh', country: 'BGD', lon: 90.4, lat: 23.8, zoom: 2.1, placeBn: 'ঢাকা, বাংলাদেশ' },
  { section: 'presence', place: 'Riyadh, Saudi Arabia', country: 'SAU', lon: 46.7, lat: 24.7, zoom: 2.8, placeBn: 'রিয়াদ, সৌদি আরব' },
  { section: 'about', place: 'Jeddah, Saudi Arabia', country: 'SAU', lon: 39.2, lat: 21.5, zoom: 2.8, placeBn: 'জেদ্দা, সৌদি আরব' },
  { section: 'work', place: 'London', country: 'GBR', lon: 0.1, lat: 51.5, zoom: 3.0, placeBn: 'লন্ডন' },
  { section: 'research', place: 'Toronto', country: 'CAN', lon: -79.4, lat: 43.7, zoom: 2.9, placeBn: 'টরন্টো' },
  { section: 'stack', place: 'Bengaluru', country: 'IND', lon: 77.6, lat: 12.97, zoom: 3.0, placeBn: 'বেঙ্গালুরু' },
  { section: 'open-source', place: 'Shenzhen', country: 'CHN', lon: 114.1, lat: 22.5, zoom: 3.0, placeBn: 'শেনচেন' },
  { section: 'experience', place: 'São Paulo', country: 'BRA', lon: -46.6, lat: -23.5, zoom: 2.9, placeBn: 'সাও পাওলো' },
  { section: 'contact', place: 'Singapore', country: 'SGP', lon: 103.8, lat: 1.4, zoom: 3.1, placeBn: 'সিঙ্গাপুর' },
] as const;

/* ── active-country inks ──
   Each focus country carries its own colour so the active territory is
   identifiable at a glance — but every ink is a low-alpha technical tone
   from the portfolio palette family (greens + cool accents + one warm
   band). Inactive countries stay subdued; content always wins. */
export interface CountryInk {
  fill: string;
  stroke: string;
}

export const COUNTRY_INKS: Record<string, CountryInk> = {
  BGD: { fill: 'rgba(34,197,94,0.30)', stroke: 'rgba(74,222,128,0.60)' }, /* origin green */
  SAU: { fill: 'rgba(217,119,6,0.16)', stroke: 'rgba(245,158,11,0.55)' }, /* amber */
  GBR: { fill: 'rgba(59,130,246,0.15)', stroke: 'rgba(96,165,250,0.55)' }, /* blue */
  CAN: { fill: 'rgba(45,212,191,0.14)', stroke: 'rgba(45,212,191,0.50)' }, /* teal */
  IND: { fill: 'rgba(129,140,248,0.15)', stroke: 'rgba(129,140,248,0.55)' }, /* indigo */
  CHN: { fill: 'rgba(244,63,94,0.13)', stroke: 'rgba(251,113,133,0.50)' }, /* rose */
  BRA: { fill: 'rgba(163,230,53,0.14)', stroke: 'rgba(163,230,53,0.50)' }, /* lime */
  SGP: { fill: 'rgba(103,232,249,0.16)', stroke: 'rgba(103,232,249,0.60)' }, /* cyan */
};

/**
 * Focus countries with no outline at Natural Earth 1:110m scale
 * (city-states simplify away entirely). They get a projected marker at
 * their real coordinates instead of a fabricated shape.
 */
export const MICRO_FOCUS = new Set(['SGP']);

/** Half the full map width; the camera aperture is derived from it. */
export const HALF_WORLD = MAP_WIDTH / 2;

/** Projected focus centre plus the camera aperture for a page focus. */
export function focusCamera(f: PageFocus) {
  const p = projectPoint(f.lon, f.lat);
  const hw = HALF_WORLD / f.zoom;
  return { cx: p.x, cy: p.y, hw };
}

/**
 * Clamp a camera centre so the aperture stays on the map — but never at
 * the cost of the page's own focus.
 *
 * The frame is a square aperture of half-width `hw`, and what has to be
 * visible inside it is the page's geography: a focus pinned to the map's
 * edge reads as a page that never arrived. So the vertical axis now gets
 * the same licence the horizontal axis always had — a quarter of the
 * aperture may hang past the map's edge, where the atmosphere gradient
 * simply continues — and inside that slack the camera centres the focus
 * exactly: São Paulo used to sit 33% off centre because the frame was
 * pinned to the southern crop, and every other page sat wherever the
 * clamp left it. `check-units` now asserts the focus lands on the
 * frame's centre — within a pixel, on phone and desktop viewports — for
 * all nine sections.
 *
 * If a future zoom were wide enough that even the slack cannot cover the
 * projected latitudes, the frame centres on the map instead of clamping
 * into emptiness — deterministic either way.
 */
export function clampCamera(cx: number, cy: number, hw: number) {
  const over = hw * 0.25;
  /* Vertical slack is larger than horizontal on purpose. The horizontal
     overshoot exists so Home can keep Dhaka centred across the Pacific
     margin; vertically the map is cropped through open ocean at both
     ends (the Antarctic crop is sea, not coastline), so a frame that
     hangs past it shows more atmosphere and no cut edge. It buys the one
     thing that matters here: the focus can be centred exactly. */
  const overY = hw * 0.35;
  const yLo = TOP + hw - overY;
  const yHi = BOTTOM - hw + overY;
  const y = yLo > yHi ? (TOP + BOTTOM) / 2 : Math.min(Math.max(cy, yLo), yHi);
  return {
    x: Math.min(Math.max(cx, hw - over), MAP_WIDTH - hw + over),
    y,
    hw,
  };
}

/** A camera is the map-unit rectangle the SVG viewBox shows. */
export interface Camera {
  x: number;
  y: number;
  hw: number;
}

/**
 * THE camera for a section.
 *
 * One derivation, consumed by the component that renders the map and by
 * the checks that assert its framing, so the rendered state and the
 * promised state cannot drift apart — and nothing else is allowed to
 * compute a camera.
 */
export function cameraFor(index: number): Camera {
  const f = GEO_FOCUS[index] ?? GEO_FOCUS[0];
  const c = focusCamera(f);
  return clampCamera(c.cx, c.cy, c.hw);
}

/**
 * Project a map-unit point into screen pixels for a camera.
 *
 * The map is an SVG with `preserveAspectRatio="xMidYMid meet"`, so the
 * square aperture scales to fit the smaller side of the container and is
 * centred in it. This is the one place that mapping is written down; the
 * arrival label uses it to sit on the real coordinates, and `check-units`
 * asserts that every section's focus lands on the frame's centre through
 * it — which is what "correctly framed" means for this site.
 */
export function projectToScreen(
  cam: Camera,
  point: { x: number; y: number },
  size: { width: number; height: number }
): { x: number; y: number } {
  const side = Math.min(size.width, size.height);
  const scale = side / (cam.hw * 2);
  return {
    x: (size.width - side) / 2 + (point.x - (cam.x - cam.hw)) * scale,
    y: (size.height - side) / 2 + (point.y - (cam.y - cam.hw)) * scale,
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
