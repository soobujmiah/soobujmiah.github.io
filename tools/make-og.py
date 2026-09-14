#!/usr/bin/env python3
"""Generate the portfolio social card (public/og.png).

Run manually when the identity changes:

    python3 tools/make-og.py

Requires Pillow and two font files (not vendored — see FONTS below).
This is a build asset, not a build step: CI does not run Python. The
generated PNG is committed, and `scripts/check-build.mjs` verifies from
the built artifact that it exists as a real 1200x630 PNG.

Visual language follows DESIGN_SYSTEM.md: near-black canvas, a single
restrained green accent, hairline grid, particle network, and the
signature-name decode motif reduced to something that reads at
thumbnail size on LinkedIn, X, Telegram and WhatsApp.
"""
from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1200, 630
BG = (5, 5, 7)
FG = (228, 226, 223)
ACCENT = (34, 197, 94)
ACCENT_BRIGHT = (74, 222, 128)
SIGNAL = (16, 185, 129)

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / "public" / "og.png"

FONTS = {
    "inter": "/tmp/ogfonts/Inter.ttf",
    "bengali": "/tmp/ogfonts/NotoSansBengali.ttf",
}


def load(kind: str, size: int, weight: int | None = None) -> ImageFont.FreeTypeFont:
    font = ImageFont.truetype(FONTS[kind], size)
    if weight is not None:
        try:
            axes = font.get_variation_axes()
            values = []
            for axis in axes:
                name = axis["name"]
                if isinstance(name, bytes):
                    name = name.decode()
                if name == "wght":
                    values.append(weight)
                elif name == "opsz":
                    values.append(min(max(axis["minimum"], 32), axis["maximum"]))
                else:
                    values.append(axis["default"])
            font.set_variation_by_axes(values)
        except Exception:  # static font — weight is already baked in
            pass
    return font


def letterspaced(draw: ImageDraw.ImageDraw, xy, text, font, fill, spacing):
    """PIL has no tracking; draw glyph by glyph so we control it."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + spacing
    return x


def radial_glow(base: Image.Image, cx: int, cy: int, radius: int, color, peak: float):
    layer = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(layer)
    steps = 70
    for i in range(steps, 0, -1):
        r = int(radius * i / steps)
        a = peak * (1 - i / steps) ** 1.7
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=tuple(int(c * a) for c in color))
    layer = layer.filter(ImageFilter.GaussianBlur(radius * 0.16))
    return Image.fromarray(_screen(base, layer))


def _screen(a: Image.Image, b: Image.Image):
    import numpy as np

    # int32 is required: (255 - x) * (255 - y) reaches 65025, which wraps
    # in int16 and turns the whole screen blend white.
    x = np.asarray(a, dtype=np.int32)
    y = np.asarray(b, dtype=np.int32)
    out = 255 - ((255 - x) * (255 - y)) // 255
    return out.clip(0, 255).astype("uint8")


def main() -> None:
    base = Image.new("RGB", (W, H), BG)

    # ── ambient field: two soft green wells, screen-blended ──
    base = radial_glow(base, 250, 150, 720, (26, 92, 60), 0.55)
    base = radial_glow(base, 1120, 560, 620, (14, 60, 44), 0.40)

    draw = ImageDraw.Draw(base, "RGBA")

    # ── hairline grid ──
    for x in range(0, W, 32):
        draw.line([(x, 0), (x, H)], fill=(228, 226, 223, 7), width=1)
    for y in range(0, H, 32):
        draw.line([(0, y), (W, y)], fill=(228, 226, 223, 7), width=1)

    # ── particle network (echoes the live canvas, kept faint) ──
    rnd = random.Random(20260914)
    nodes = []
    for _ in range(46):
        nx = rnd.uniform(560, W)
        ny = rnd.uniform(40, H - 40)
        nodes.append((nx, ny, rnd.uniform(1.0, 2.4)))
    for i, (ax, ay, _) in enumerate(nodes):
        for bx, by, _ in nodes[i + 1 :]:
            dist = math.hypot(ax - bx, ay - by)
            if dist < 148:
                alpha = int(46 * (1 - dist / 148))
                draw.line([(ax, ay), (bx, by)], fill=(34, 197, 94, alpha), width=1)
    for nx, ny, nr in nodes:
        draw.ellipse([nx - nr, ny - nr, nx + nr, ny + nr], fill=(74, 222, 128, 130))

    # ── decode motif: falling glyph columns that resolve into the dark ──
    # Drawn on their own layer and masked with a vertical fade, so the
    # columns dissolve rather than floating as hard-edged stacks.
    glyph_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glyph_layer)
    glyph_font = load("inter", 15, 400)
    glyphs = "0123456789ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ"
    for col in range(8):
        x = 918 + col * 33
        top = rnd.uniform(20, 210)
        for k in range(rnd.randint(3, 6)):
            y = top + k * 17
            if y > H - 40:
                break
            alpha = int(140 * (1 - k / 6))
            gd.text((x, y), glyphs[rnd.randrange(len(glyphs))], font=glyph_font, fill=(74, 222, 128, alpha))

    fade = Image.new("L", (W, H), 0)
    fd = ImageDraw.Draw(fade)
    for y in range(H):
        fd.line([(0, y), (W, y)], fill=max(0, int(255 * (1 - (y / H) ** 1.5))))
    glyph_layer.putalpha(Image.composite(glyph_layer.getchannel("A"), Image.new("L", (W, H), 0), fade))
    base = Image.alpha_composite(base.convert("RGBA"), glyph_layer).convert("RGB")

    # ── vignette ──
    vig = Image.new("L", (W, H), 0)
    vd = ImageDraw.Draw(vig)
    vd.ellipse([-220, -180, W + 220, H + 180], fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(150))
    base = Image.composite(base, Image.new("RGB", (W, H), (0, 0, 0)), vig)
    draw = ImageDraw.Draw(base, "RGBA")

    # ── content: left column ──
    x0 = 84

    # status dot + eyebrow
    draw.ellipse([x0, 116, x0 + 7, 123], fill=ACCENT)
    eyebrow = load("inter", 15, 500)
    letterspaced(
        draw, (x0 + 20, 111), "ON-DEVICE AI  ·  ANDROID  ·  ARM64  ·  GPU/NPU",
        eyebrow, ACCENT_BRIGHT, 2.6,
    )

    # name — the dominant element
    name = load("inter", 112, 700)
    draw.text((x0 - 6, 152), "Sobuj Miah", font=name, fill=FG)

    # single professional descriptor
    role = load("inter", 27, 450)
    draw.text((x0 - 2, 300), "Independent Software Developer &", font=role, fill=(214, 212, 208))
    draw.text((x0 - 2, 336), "On-Device AI Systems Builder", font=role, fill=(214, 212, 208))

    # supporting line
    sub = load("inter", 19, 400)
    draw.text(
        (x0 - 2, 396),
        "Every build runs on CI. Every claim checked against a real device.",
        font=sub, fill=(150, 148, 145),
    )

    # accent rule
    draw.line([(x0, 462), (x0 + 86, 462)], fill=ACCENT, width=2)

    # footer row
    foot = load("inter", 20, 500)
    letterspaced(draw, (x0, 494), "SOOBUJMIAH.GITHUB.IO", foot, ACCENT_BRIGHT, 1.8)

    bn = load("bengali", 26, 500)
    btext = "সবুজ মিয়া"
    bw = draw.textlength(btext, font=bn)
    draw.text((W - 84 - bw, 488), btext, font=bn, fill=(228, 226, 223, 200))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    base.save(OUT, "PNG", optimize=True)
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB, {base.size[0]}x{base.size[1]})")


if __name__ == "__main__":
    main()
