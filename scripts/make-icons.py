#!/usr/bin/env python3
"""Render the portfolio mark to PNG icons from the same geometry as icon.svg."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
BASE = 1024


def render() -> Image.Image:
    scale = BASE / 64
    image = Image.new("RGBA", (BASE, BASE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    def box(coords):
        return tuple(int(value * scale) for value in coords)

    draw.rounded_rectangle(box((0, 0, 64, 64)), radius=int(14 * scale), fill=(6, 7, 10, 255))
    draw.rounded_rectangle(box((0.75, 0.75, 63.25, 63.25)), radius=int(13.25 * scale), outline=(205, 255, 87, 72), width=max(1, int(1 * scale)))
    draw.polygon([(x * scale, y * scale) for x, y in [(20, 17), (35, 32), (20, 47), (26, 47), (41, 32), (26, 17)]], fill=(205, 255, 87, 255))
    draw.rounded_rectangle(box((42, 42, 51, 46)), radius=int(2 * scale), fill=(87, 232, 255, 255))
    return image


mark = render()
for name, size in [("icon-512.png", 512), ("icon-192.png", 192), ("apple-touch-icon.png", 180)]:
    out = ROOT / "public" / name
    mark.resize((size, size), Image.LANCZOS).save(out, format="PNG", optimize=True)
    print(f"Wrote {out} ({out.stat().st_size} bytes; {size}x{size})")
