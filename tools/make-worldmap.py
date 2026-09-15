#!/usr/bin/env python3
"""Generate the hero world-map path data for components/world-map-path.ts.

Source: Natural Earth 1:110m physical land polygons (public domain),
fetched as GeoJSON. The map is the environment behind the hero name, so
it is deliberately low-fidelity: Miller projection, cropped to the
inhabited latitudes, Douglas-Peucker simplified, and rounded to 0.1px.

Regenerate:
    curl -sL -o /tmp/land.json https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/110m/physical/ne_110m_land.json
    curl -sL -o /tmp/countries.json https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/110m/cultural/ne_110m_admin_0_countries.json
    python3 tools/make-worldmap.py

The output is committed, so the build never needs this script or network.
"""
import json
import math

SRC = "/tmp/land.json"
SRC_COUNTRIES = "/tmp/countries.json"
OUT = "components/world-map-path.ts"
OUT_COUNTRIES = "components/world-map-countries.ts"

W = 1000.0          # viewBox width in px (lon -180..180)
LAT_TOP, LAT_BOT = 84.0, -58.0   # crop: inhabited latitudes, no Antarctica
TOL = 0.9           # Douglas-Peucker tolerance in px
MIN_EXTENT = 2.2    # drop islands smaller than this in px


def miller_y(lat_deg):
    """Miller cylindrical northing, in px, relative to the equirect centre."""
    phi = math.radians(lat_deg)
    return -1.25 * math.log(math.tan(math.pi / 4 + 0.4 * phi)) * (W / (2 * math.pi))


def project(lon, lat):
    x = (lon + 180.0) / 360.0 * W
    return x, miller_y(lat)


def rdp(pts, tol):
    """Iterative Douglas-Peucker (recursion depth is unbounded on coastlines)."""
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        if j <= i + 1:
            continue
        ax, ay = pts[i]
        bx, by = pts[j]
        dx, dy = bx - ax, by - ay
        seg2 = dx * dx + dy * dy
        best, bestk = -1.0, -1
        for k in range(i + 1, j):
            px, py = pts[k]
            if seg2 == 0:
                d2 = (px - ax) ** 2 + (py - ay) ** 2
            else:
                t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / seg2))
                qx, qy = ax + t * dx, ay + t * dy
                d2 = (px - qx) ** 2 + (py - qy) ** 2
            if d2 > best:
                best, bestk = d2, k
        if best > tol * tol:
            keep[bestk] = True
            stack.append((i, bestk))
            stack.append((bestk, j))
    return [p for p, k in zip(pts, keep) if k]


def rings(geom):
    if geom["type"] == "Polygon":
        return geom["coordinates"]
    out = []
    for poly in geom["coordinates"]:
        out.extend(poly)
    return out


def simplify_ring(ring, tol):
    """Project, latitude-crop, and simplify one ring; None if unusable."""
    pts = []
    for lon, lat in ring:
        if lat < LAT_BOT - 2:
            continue
        pts.append(project(lon, min(lat, LAT_TOP)))
    if len(pts) < 4:
        return None
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    if (max(xs) - min(xs)) < MIN_EXTENT and (max(ys) - min(ys)) < MIN_EXTENT:
        return None
    simple = rdp(pts, tol)
    if len(simple) < 3:
        return None
    return simple


def country_ring(iso_a3, simplify_tol, decimals):
    """One country's outline as SVG path data, projected to map units."""
    data = json.load(open(SRC_COUNTRIES))
    for feat in data["features"]:
        if feat["properties"].get("ISO_A3") != iso_a3:
            continue
        geom = feat["geometry"]
        rings = [geom["coordinates"]] if geom["type"] == "Polygon" else geom["coordinates"]
        parts = []
        for poly in rings:
            for ring in poly:
                pts = [project(lon, lat) for lon, lat in ring]
                if simplify_tol:
                    pts = rdp(pts, simplify_tol)
                if len(pts) < 3:
                    continue
                parts.append("M" + " ".join(f"{x:.{decimals}f} {y:.{decimals}f}" for x, y in pts))
        return " ".join(parts)
    raise SystemExit(f"country {iso_a3} not found in {SRC_COUNTRIES}")


def main():
    data = json.load(open(SRC))
    path_parts = []
    kept = dropped = 0

    for feat in data["features"]:
        for ring in rings(feat["geometry"]):
            pts = []
            for lon, lat in ring:
                if lat < LAT_BOT:
                    continue
                pts.append(project(lon, min(lat, LAT_TOP)))
            if len(pts) < 4:
                continue
            xs = [p[0] for p in pts]
            ys = [p[1] for p in pts]
            if (max(xs) - min(xs)) < MIN_EXTENT and (max(ys) - min(ys)) < MIN_EXTENT:
                dropped += 1
                continue
            simple = rdp(pts, TOL)
            if len(simple) < 3:
                continue
            kept += 1
            cmd = "M" + " ".join(f"{x:.1f} {y:.1f}" for x, y in simple)
            path_parts.append(cmd)

    d = " ".join(path_parts)

    # Bangladesh is deliberately NOT simplified: it is only ~13 map units
    # wide, so every ring point carries real shape information.
    bd = country_ring("BGD", simplify_tol=0, decimals=2)

    with open(OUT, "w") as f:
        f.write(
            "/* GENERATED by tools/make-worldmap.py — do not edit by hand.\n"
            "   Natural Earth 1:110m contours (public domain), Miller projection.\n"
            "   The projection itself lives in app/geo.ts, which owns the viewBox.\n"
            "   Regenerate with that script. */\n\n"
            f"export const WORLD_LAND =\n  '{d}';\n\n"
            "/** Bangladesh — the origin. Rendered emphasised, never simplified. */\n"
            f"export const BANGLADESH_OUTLINE =\n  '{bd}';\n"
        )

    print(f"rings kept: {kept}  (dropped as sub-pixel: {dropped})")
    print(f"land path: {len(d)} chars ({len(d)/1024:.1f} KB)")
    print(f"bangladesh path: {len(bd)} chars, {bd.count('M')} ring(s)")

    # ── per-country layer ──
    # Every sovereign territory as its own recognisable shape (Natural Earth
    # admin-0, same projection/crop as the land). Micro-states that simplify
    # away below MIN_EXTENT get a projected centroid dot instead, so their
    # activation still has a home.
    countries = json.load(open(SRC_COUNTRIES))
    paths = {}
    dots = {}
    for feat in countries["features"]:
        props = feat["properties"]
        iso = props.get("ISO_A3")
        if iso in ("-99", None):
            iso = props.get("ISO_A3_EH")
        if iso in ("-99", None):
            continue
        geom = feat["geometry"]
        polys = [geom["coordinates"]] if geom["type"] == "Polygon" else geom["coordinates"]
        parts = []
        centroid = None
        for poly in polys:
            for ring in poly:
                simple = simplify_ring(ring, 0.9)
                if simple is None:
                    continue
                if centroid is None:
                    cx = sum(p[0] for p in simple) / len(simple)
                    cy = sum(p[1] for p in simple) / len(simple)
                    centroid = (cx, cy)
                parts.append("M" + " ".join(f"{x:.1f} {y:.1f}" for x, y in simple))
        if parts:
            paths[iso] = " ".join(parts)
        elif centroid is not None:
            dots[iso] = centroid
        else:
            # the whole country simplified away (city-states): project a
            # representative coordinate from the first ring
            first = (polys[0][0][0][0], polys[0][0][0][1])
            x, y = project(first[0], min(first[1], LAT_TOP))
            if LAT_BOT <= first[1]:
                dots[iso] = (x, y)

    with open(OUT_COUNTRIES, "w") as f:
        f.write(
            "/* GENERATED by tools/make-worldmap.py — do not edit by hand.\n"
            "   Natural Earth 1:110m admin-0 countries (public domain), Miller\n"
            "   projection, Douglas-Peucker simplified. Keyed by ISO 3166-1 alpha-3.\n"
            "   Regenerate with that script. */\n\n"
            "export const COUNTRY_PATHS: Record<string, string> = {\n"
        )
        for iso in sorted(paths):
            f.write(f"  {iso}: '{paths[iso]}',\n")
        f.write("};\n\n")
        f.write("/** Micro-states that carry no outline at this scale — projected dots. */\n")
        f.write("export const COUNTRY_DOTS: Record<string, { x: number; y: number }> = {\n")
        for iso in sorted(dots):
            x, y = dots[iso]
            f.write(f"  {iso}: {{ x: {x:.1f}, y: {y:.1f} }},\n")
        f.write("};\n")

    total = sum(len(v) for v in paths.values())
    print(f"country paths: {len(paths)} ({total/1024:.1f} KB raw), dots: {len(dots)}")
    for probe in ("BGD", "IND", "SAU", "GBR", "CAN", "BRA", "CHN"):
        if probe not in paths:
            raise SystemExit(f"focus country {probe} missing from generated paths")


if __name__ == "__main__":
    main()
