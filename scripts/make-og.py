#!/usr/bin/env python3
"""Build the local, dependency-free Sobuj Miah portfolio social preview image."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "og.png"
W, H = 1200, 630

# Source index.html visual language: graphite, lime and cyan; no 3D mockups.
image = Image.new("RGB", (W, H))
pixels = image.load()
for y in range(H):
    for x in range(W):
        glow = max(0.0, 1.0 - (((x - 660) / 720) ** 2 + ((y - 250) / 520) ** 2) ** 0.5)
        pixels[x, y] = (int(6 + glow * 4), int(7 + glow * 8), int(10 + glow * 5))

draw = ImageDraw.Draw(image, "RGBA")
font_root = Path("/usr/share/fonts/truetype/dejavu")
if not font_root.exists():
    font_root = Path("/usr/share/fonts/truetype/liberation")

def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    candidates = {
        "serif": ["DejaVuSans.ttf", "LiberationSans-Regular.ttf"],
        "sans": ["DejaVuSans.ttf", "LiberationSans-Regular.ttf"],
        "mono": ["DejaVuSansMono.ttf", "LiberationMono-Regular.ttf"],
    }[name]
    for candidate in candidates:
        path = font_root / candidate
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()

# Restrained 2D halo and orbit accents, matching the homepage hero.
draw.ellipse((760, 72, 1190, 502), outline=(87, 232, 255, 55), width=2)
draw.ellipse((810, 122, 1140, 452), outline=(205, 255, 87, 70), width=2)
draw.ellipse((930, 242, 1020, 332), outline=(205, 255, 87, 110), width=2)
draw.ellipse((971, 283, 979, 291), fill=(205, 255, 87, 230))

# Approved name, positioning, and concept line.
draw.rounded_rectangle((78, 86, 373, 116), radius=15, fill=(205, 255, 87, 16), outline=(205, 255, 87, 73), width=1)
draw.ellipse((94, 98, 102, 106), fill=(205, 255, 87, 255))
draw.text((114, 94), "SOFTWARE · SYSTEMS · OPERATIONS", font=font("mono", 13), fill=(190, 207, 160, 245))
draw.text((78, 167), "Sobuj", font=font("serif", 78), fill=(237, 239, 242, 255))
draw.text((290, 167), "Miah", font=font("serif", 78), fill=(205, 255, 87, 255))
draw.text((81, 276), "Practical technology,", font=font("serif", 43), fill=(228, 231, 235, 242))
draw.text((81, 326), "made useful.", font=font("serif", 43), fill=(205, 255, 87, 255))
draw.line((81, 398, 146, 398), fill=(87, 232, 255, 220), width=2)
draw.text((81, 423), "SOFTWARE  /  LINUX  /  OPERATIONS SUPPORT", font=font("mono", 12), fill=(174, 184, 177, 238))
draw.text((81, 566), "SAVAR, DHAKA, BANGLADESH", font=font("mono", 10), fill=(145, 153, 166, 210))
draw.text((1018, 574), "SM / 01", font=font("mono", 9), fill=(145, 153, 166, 210))

image.save(OUT, format="PNG", optimize=True)
print(f"Wrote {OUT} ({OUT.stat().st_size} bytes; {W}x{H})")
