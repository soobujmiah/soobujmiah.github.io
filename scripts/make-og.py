#!/usr/bin/env python3
"""Build the social preview image for the Sobuj Miah portfolio.

Uses only Pillow and the DejaVu fonts available on the build machine, so the
asset can be regenerated locally without adding a browser dependency.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "og.png"
W, H = 1200, 630

INK = (238, 241, 245)
INK_SOFT = (203, 211, 221)
MUTED = (152, 162, 179)
DIM = (115, 125, 140)
LIME = (205, 255, 87)
MINT = (87, 232, 255)
BG = (6, 7, 10)
PANEL = (11, 14, 20)
LINE = (42, 47, 56)

image = Image.new("RGB", (W, H), BG)
pixels = image.load()
for y in range(H):
    for x in range(W):
        glow = max(0.0, 1.0 - (((x - 690) / 760) ** 2 + ((y - 270) / 560) ** 2) ** 0.5)
        pixels[x, y] = (int(6 + glow * 5), int(7 + glow * 9), int(10 + glow * 6))

draw = ImageDraw.Draw(image, "RGBA")

font_root = Path("/usr/share/fonts/truetype/dejavu")
if not font_root.exists():
    font_root = Path("/usr/share/fonts/truetype/liberation")


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    candidates = {
        "sans": ["DejaVuSans.ttf", "LiberationSans-Regular.ttf"],
        "bold": ["DejaVuSans-Bold.ttf", "LiberationSans-Bold.ttf"],
        "mono": ["DejaVuSansMono.ttf", "LiberationMono-Regular.ttf"],
    }[name]
    for candidate in candidates:
        path = font_root / candidate
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def text(x, y, value, face, fill):
    draw.text((x, y), value, font=face, fill=fill)


# Quiet technical grid on the right side.
for x in range(700, 1200, 64):
    draw.line((x, 0, x, H), fill=(255, 255, 255, 8), width=1)
for y in range(0, H, 64):
    draw.line((700, y, 1200, y), fill=(255, 255, 255, 8), width=1)

# Accent glows behind the terminal card.
draw.ellipse((690, 60, 1210, 580), fill=(87, 232, 255, 10))
draw.ellipse((820, 150, 1130, 470), fill=(205, 255, 87, 8))

# Status pill.
draw.rounded_rectangle((84, 76, 468, 108), radius=16, fill=(205, 255, 87, 16), outline=(205, 255, 87, 78), width=1)
draw.ellipse((99, 88, 107, 96), fill=LIME)
text(118, 82, "SOFTWARE  ·  LINUX ON ANDROID  ·  OPERATIONS", font("mono", 12), (190, 207, 160, 245))

# Name.
name_face = font("bold", 96)
name_x = 84
sobuj_w = draw.textlength("Sobuj", font=name_face)
text(name_x, 150, "Sobuj", name_face, INK)
text(name_x + sobuj_w + 22, 150, "Miah", name_face, LIME)

# Headline.
text(84, 292, "Practical systems,", font("bold", 44), INK_SOFT)
text(84, 344, "built to work.", font("bold", 44), LIME)

# Accent rule.
draw.line((84, 424, 156, 424), fill=MINT, width=2)

# Technology chips.
chips = ["Termux", "Debian", "ARM64", "llama.cpp"]
chip_face = font("mono", 12)
chip_x = 84
for chip in chips:
    width = int(draw.textlength(chip, font=chip_face)) + 26
    draw.rounded_rectangle((chip_x, 450, chip_x + width, 476), radius=13, fill=(255, 255, 255, 18), outline=(255, 255, 255, 34), width=1)
    text(chip_x + 13, 456, chip, chip_face, MUTED)
    chip_x += width + 8

# Footer.
text(84, 566, "SAVAR, DHAKA, BANGLADESH", font("mono", 11), DIM)
text(944, 566, "SOBUJMIAH.GITHUB.IO", font("mono", 11), LIME)

# Terminal card.
card = (760, 120, 1120, 510)
draw.rounded_rectangle(card, radius=20, fill=PANEL, outline=LINE, width=1)
draw.rounded_rectangle((760, 120, 1120, 164), radius=20, fill=(255, 255, 255, 14))
draw.rectangle((760, 146, 1120, 164), fill=(255, 255, 255, 14))
for index, colour in enumerate([(255, 107, 104), (255, 204, 85), (85, 202, 120)]):
    draw.ellipse((780 + index * 17, 136, 788 + index * 17, 144), fill=colour)
text(842, 134, "sobuj@android:~", font("mono", 11), DIM)

lines = [
    ("$", "whoami", LIME, INK),
    ("", "sobuj", INK_SOFT, INK),
    ("$", "uname -r", LIME, INK),
    ("", "6.1.x-android", INK_SOFT, INK),
    ("$", "ls projects/", LIME, INK),
    ("", "ternux  adt  lai", INK_SOFT, INK),
    ("$", "ls skills/", LIME, INK),
    ("", "termux  debian  arm64", INK_SOFT, INK),
]
y = 190
for prompt, command, colour, _ in lines:
    x = 784
    if prompt:
        text(x, y, prompt, font("mono", 12), colour)
        x += 24
    text(x, y, command, font("mono", 12), colour if prompt else MUTED)
    y += 28

# Corner marks.
draw.line((1120, 120, 1120, 150), fill=(205, 255, 87, 120), width=2)
draw.line((1090, 120, 1120, 120), fill=(205, 255, 87, 120), width=2)

image.save(OUT, format="PNG", optimize=True)
print(f"Wrote {OUT} ({OUT.stat().st_size} bytes; {W}x{H})")
