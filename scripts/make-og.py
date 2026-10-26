#!/usr/bin/env python3
"""Build the local, dependency-free Pocket Systems Lab social preview image."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "og.png"
W, H = 1200, 630

# Editorial dark graphite gradient; no external or unapproved imagery is used.
image = Image.new("RGB", (W, H))
pixels = image.load()
for y in range(H):
    for x in range(W):
        glow = max(0.0, 1.0 - (((x - 920) / 580) ** 2 + ((y - 350) / 470) ** 2) ** 0.5)
        shade = int(5 + glow * 5)
        pixels[x, y] = (shade, shade + int(glow * 4), shade + int(glow * 2))

draw = ImageDraw.Draw(image, "RGBA")
font_root = Path("/usr/share/fonts/truetype/dejavu")
if not font_root.exists():
    font_root = Path("/usr/share/fonts/truetype/liberation")

def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    candidates = {
        "serif": ["DejaVuSerif.ttf", "LiberationSerif-Regular.ttf"],
        "sans": ["DejaVuSans.ttf", "LiberationSans-Regular.ttf"],
        "mono": ["DejaVuSansMono.ttf", "LiberationMono-Regular.ttf"],
    }[name]
    for candidate in candidates:
        path = font_root / candidate
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()

# A hairline frame and quiet registration marks; no decorative grid or stock art.
draw.rectangle((0, 0, W, H), outline=(74, 222, 128, 76), width=2)
draw.line((52, 58, 88, 58), fill=(74, 222, 128, 74), width=1)
draw.line((1112, 570, 1148, 570), fill=(74, 222, 128, 54), width=1)

# Phone artifact: screen is ornamental; all site copy remains accessible HTML.
draw.rounded_rectangle((872, 104, 1056, 518), radius=31, fill=(11, 16, 14, 255), outline=(102, 133, 114, 210), width=3)
draw.rounded_rectangle((888, 127, 1040, 490), radius=20, fill=(5, 8, 7, 255), outline=(34, 197, 94, 165), width=2)
draw.rounded_rectangle((936, 113, 990, 119), radius=4, fill=(78, 91, 83, 255))
for i, width in enumerate((98, 72, 112, 84, 64)):
    yy = 194 + i * 38
    color = (74, 222, 128, 215) if i == 0 else (112, 135, 121, 120)
    draw.rounded_rectangle((911, yy, 911 + width, yy + 4), radius=2, fill=color)
draw.ellipse((954, 461, 970, 477), outline=(74, 222, 128, 170), width=2)

# Light path from the device to six stations.
path = [(872, 334), (790, 334), (748, 285), (683, 285), (635, 347), (550, 347)]
draw.line(path, fill=(34, 197, 94, 160), width=3, joint="curve")
for x, y in [(790, 334), (683, 285), (550, 347)]:
    draw.ellipse((x - 5, y - 5, x + 5, y + 5), fill=(74, 222, 128, 225))
for x, y, label in [(1084, 170, "01"), (1097, 256, "02"), (1082, 346, "03"), (1093, 438, "04")]:
    draw.ellipse((x - 14, y - 14, x + 14, y + 14), outline=(74, 222, 128, 100), width=1)
    draw.text((x - 7, y - 6), label, font=font("mono", 8), fill=(142, 168, 148, 210))

# Approved name, positioning, and concept line.
draw.rounded_rectangle((78, 86, 311, 116), radius=15, fill=(34, 197, 94, 20), outline=(74, 222, 128, 83), width=1)
draw.ellipse((94, 98, 102, 106), fill=(74, 222, 128, 255))
draw.text((114, 94), "THE POCKET SYSTEMS LAB", font=font("mono", 13), fill=(153, 224, 174, 245))
draw.text((78, 167), "Sobuj Miah", font=font("serif", 78), fill=(232, 231, 225, 255))
draw.text((80, 266), "The workshop begins", font=font("serif", 43), fill=(228, 226, 223, 242))
draw.text((80, 314), "in your hand.", font=font("serif", 43), fill=(74, 222, 128, 255))
draw.line((81, 386, 146, 386), fill=(74, 222, 128, 220), width=2)
draw.text((81, 410), "INDEPENDENT SOFTWARE & AI SYSTEMS BUILDER", font=font("mono", 12), fill=(174, 184, 177, 238))
draw.text((81, 454), "ANDROID-FIRST  /  EVIDENCE-LED  /  BILINGUAL", font=font("mono", 10), fill=(126, 140, 131, 223))
draw.text((81, 566), "SAVAR, DHAKA, BANGLADESH", font=font("mono", 10), fill=(107, 123, 113, 210))
draw.text((1018, 574), "PSL / 01", font=font("mono", 9), fill=(110, 151, 122, 210))

image.save(OUT, format="PNG", optimize=True)
print(f"Wrote {OUT} ({OUT.stat().st_size} bytes; {W}x{H})")
