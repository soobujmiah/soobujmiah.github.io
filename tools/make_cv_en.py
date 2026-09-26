#!/usr/bin/env python3
"""Deterministic one-page English CV generator for soobujmiah.github.io.

Outputs public/cv/Sobuj_Miah_CV_EN.pdf — English prose only, no Bengali
or other Indic scripts. Uses ReportLab with real Unicode text and clickable
link annotations.

Design matches the portfolio brand tokens (dark surface, emerald accent).
Requires: reportlab, Pillow (for portrait image).
Run:     python3 tools/make_cv_en.py
"""
import os
import sys
import subprocess

# Ensure the venv is available
sys.path.insert(0, "/home/sbj/soobujmiah.github.io/.venv-cv/lib/python3.13/site-packages")

import reportlab.rl_config as _rl_config
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, Color

_rl_config.invariant = 1  # byte-deterministic PDF output

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PORTRAIT = os.path.join(HERE, "cv", "portrait.jpg")
OUT = os.path.join(ROOT, "public", "cv", "Sobuj_Miah_CV_EN.pdf")

W, H = A4  # 595.28 x 841.89

# ── Colour system — sourced from the portfolio design tokens ───
BG = HexColor("#050507")
PANEL = HexColor("#08160d")
PANEL_BORDER = Color(34 / 255, 197 / 255, 94 / 255, 0.22)
LINE = Color(228 / 255, 226 / 255, 223 / 255, 0.15)
ACCENT = HexColor("#22c55e")
ACCENT_B = HexColor("#4ade80")
TEXT = HexColor("#e4e2df")
MUTED = Color(228 / 255, 226 / 255, 223 / 255, 0.60)
DIM = Color(228 / 255, 226 / 255, 223 / 255, 0.62)

F_BODY = "Helvetica"
F_BOLD = "Helvetica-Bold"

# Register Noto Sans Bengali for Bangla-only; English CV stays Helvetica
FONT_BN = None

M = 30.0            # outer margin
LEFT_W = 186.0      # left panel width
GUT = 22.0          # gutter between columns
RX = M + LEFT_W + GUT  # right column x
RW = W - M - RX        # right column width


def wrap(c, text, font, size, max_w):
    """Greedy word-wrap using real font metrics."""
    c.setFont(font, size)
    out, cur = [], ""
    for word in text.split():
        trial = (cur + " " + word).strip()
        if c.stringWidth(trial, font, size) <= max_w:
            cur = trial
        else:
            if cur:
                out.append(cur)
            cur = word
    if cur:
        out.append(cur)
    return out


class Cursor:
    def __init__(self, y):
        self.y = y


def section(c, cur, title, x, width):
    cur.y -= 16
    c.setFillColor(ACCENT)
    c.setFont(F_BOLD, 8.4)
    c.drawString(x, cur.y, title.upper())
    tw = c.stringWidth(title.upper(), F_BOLD, 8.4)
    c.setStrokeColor(LINE)
    c.setLineWidth(0.7)
    c.line(x + tw + 8, cur.y + 2.6, x + width, cur.y + 2.6)
    cur.y -= 12


def body(c, cur, text, x, width, size=8.6, color=DIM, leading=11.4, font=F_BODY):
    c.setFillColor(color)
    for line in wrap(c, text, font, size, width):
        c.setFont(font, size)
        c.setFillColor(color)
        c.drawString(x, cur.y, line)
        cur.y -= leading


def bullet(c, cur, head, tail, x=RX, width=RW):
    c.setFillColor(ACCENT_B)
    c.circle(x + 1.6, cur.y + 2.6, 1.4, fill=1, stroke=0)
    hx, hw = x + 7, width - 7
    for ln in wrap(c, head, F_BOLD, 8.8, hw):
        c.setFont(F_BOLD, 8.8)
        c.setFillColor(TEXT)
        c.drawString(hx, cur.y, ln)
        cur.y -= 11
    body(c, cur, tail, hx, hw, size=8.3, color=MUTED, leading=10.8)
    cur.y -= 3


def link_annot(c, x, y, w, h, url):
    """Add a clickable link annotation bounding the given rectangle."""
    c.linkURL(url, (x, y, x + w, y + h), border=None)


def main():
    # Verify portrait exists
    if not os.path.exists(PORTRAIT):
        print(f"WARNING: portrait not found at {PORTRAIT}, skipping image", file=sys.stderr)

    c = canvas.Canvas(OUT, pagesize=A4)
    c.setTitle("Sobuj Miah — Curriculum Vitae (English)")
    c.setAuthor("Sobuj Miah")
    c.setSubject("Independent Software & AI Systems Engineer")

    # Page background
    c.setFillColor(BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # ── Header (full-width identity band) ──────────────────────
    hy = H - 52
    c.setFillColor(TEXT)
    c.setFont(F_BOLD, 25)
    c.drawString(M, hy, "SOBUJ MIAH")
    # Clickable link around name → GitHub profile
    link_annot(c, M, hy - 3, 180, 25, "https://github.com/soobujmiah")

    c.setFillColor(ACCENT_B)
    c.setFont(F_BODY, 10.4)
    c.drawString(M, hy - 17, "Independent Software & AI Systems Engineer")
    c.setFillColor(MUTED)
    c.setFont(F_BODY, 8.2)
    c.drawString(M, hy - 30, "On-Device AI  ·  Android  ·  ARM64 Linux  ·  Native Tooling  ·  Software Systems")
    c.setStrokeColor(ACCENT)
    c.setLineWidth(1.1)
    c.line(M, hy - 40, W - M, hy - 40)

    top = hy - 40

    # Left panel
    panelW = M + LEFT_W + GUT * 0.5
    c.setFillColor(PANEL)
    c.rect(0, 0, panelW, top, fill=1, stroke=0)
    c.setStrokeColor(PANEL_BORDER)
    c.setLineWidth(0.8)
    c.line(panelW, 0, panelW, top)

    # ── Left column ────────────────────────────────────────────
    lx, lw = M, LEFT_W
    cur = Cursor(top - 20)

    # Portrait
    pw = 128.0
    ph = pw * (654.0 / 490.0)
    px = lx + (lw - pw) / 2.0
    py = cur.y - ph
    c.saveState()
    p = c.beginPath()
    p.roundRect(px, py, pw, ph, 8)
    c.clipPath(p, stroke=0)
    if os.path.exists(PORTRAIT):
        c.drawImage(PORTRAIT, px, py, width=pw, height=ph, preserveAspectRatio=True, anchor="c")
    c.restoreState()
    c.setStrokeColor(Color(228 / 255, 226 / 255, 223 / 255, 0.28))
    c.setLineWidth(1.0)
    c.roundRect(px, py, pw, ph, 8, fill=0, stroke=1)
    cur.y = py - 18

    # Contact
    section(c, cur, "Contact", lx, lw)
    contact_items = [
        ("Email", "soobujmiah@gmail.com", "mailto:soobujmiah@gmail.com"),
        ("Location", "Dhaka, Bangladesh", None),
        ("GitHub", "github.com/soobujmiah", "https://github.com/soobujmiah"),
        ("Portfolio", "soobujmiah.github.io", "https://soobujmiah.github.io/"),
        ("LinkedIn", "linkedin.com/in/soobujmiah", "https://linkedin.com/in/soobujmiah"),
        ("Telegram", "@soobujmiah", "https://t.me/soobujmiah"),
    ]
    for label, value, href in contact_items:
        c.setFillColor(MUTED)
        c.setFont(F_BOLD, 7.4)
        c.drawString(lx, cur.y, label.upper())
        c.setFillColor(DIM)
        c.setFont(F_BODY, 8.2)
        c.drawString(lx, cur.y - 9.5, value)
        if href:
            vx = c.stringWidth(value, F_BODY, 8.2)
            link_annot(c, lx, cur.y - 17, max(vx, 10), 10, href)
        cur.y -= 24

    # Languages — ONLY Bangla and English (per requirement #10)
    section(c, cur, "Languages", lx, lw)
    for lang in ["Bangla — native", "English — fluent"]:
        c.setFillColor(ACCENT_B)
        c.circle(lx + 1.6, cur.y + 2.4, 1.3, fill=1, stroke=0)
        c.setFillColor(DIM)
        c.setFont(F_BODY, 8.4)
        c.drawString(lx + 7, cur.y, lang)
        cur.y -= 13

    # Core Focus
    section(c, cur, "Core Focus", lx, lw)
    for item in [
        "On-device LLM inference",
        "Android systems & automation",
        "ARM64 Linux from AOSP",
        "Native tooling & signed releases",
        "GPU / Vulkan / Turnip / Zink",
        "Documentation as engineering",
    ]:
        c.setFillColor(ACCENT_B)
        c.circle(lx + 1.6, cur.y + 2.4, 1.3, fill=1, stroke=0)
        c.setFillColor(DIM)
        c.setFont(F_BODY, 8.4)
        c.drawString(lx + 7, cur.y, item)
        cur.y -= 13

    # Services
    section(c, cur, "Services", lx, lw)
    for item in [
        "Website development & maintenance",
        "Custom software & small-business tools",
        "Digital workflow automation",
        "IT & computer support (Windows/Linux)",
        "Android & phone software support",
        "Office administration & records",
    ]:
        c.setFillColor(ACCENT_B)
        c.circle(lx + 1.6, cur.y + 2.4, 1.3, fill=1, stroke=0)
        c.setFillColor(DIM)
        c.setFont(F_BODY, 8.4)
        c.drawString(lx + 7, cur.y, item)
        cur.y -= 13

    # ── Right column ───────────────────────────────────────────
    rx, rw = RX, RW
    rcur = Cursor(top - 20)

    section(c, rcur, "Profile", rx, rw)
    profile_text = (
        "Self-taught systems engineer working at the intersection of on-device AI, "
        "Android systems and ARM64 Linux. I develop, build and validate software "
        "primarily from an Android phone running Termux and PRoot Debian — every "
        "build runs on CI and every claim is checked against real hardware."
    )
    body(c, rcur, profile_text, rx, rw, size=8.7, color=DIM, leading=11.6)

    section(c, rcur, "Engineering Experience — Selected Work", rx, rw)
    bullets = [
        ("LAI — on-device AI runtime",
         "Bangla-first local LLM inference and consent-driven Android automation. "
         "arm64 llama.cpp CPU inference device-validated at 12–20 tok/s; Adreno "
         "Vulkan crash root-caused into a fail-closed CPU-default design."),
        ("ADT — ARM64 Android toolchain",
         "Builds Android SDK build-tools and platform-tools from AOSP source for "
         "Linux ARM64/glibc; SHA-256-verified offline artifacts; full APK pipeline "
         "validated end-to-end on device."),
        ("Ternux — Linux desktop on Android",
         "No-root Debian/Xfce4 desktop over PRoot with a measured Zink/Turnip GPU "
         "route (glmark2 140, OpenGL 4.6)."),
        ("GGEN — creative & document studio",
         "Flutter/Dart vector, raster, document and PDF foundation; 143 pure-Dart "
         "unit tests, 353 widget tests."),
        ("Songjog — Bengali business ledger",
         "Bengali-first operations app (Owner Edition); 94 tests green on CI; export "
         "and diagnostics device-validated on Redmi Turbo 4 Pro."),
    ]
    for head, tail in bullets:
        bullet(c, rcur, head, tail)

    section(c, rcur, "Operations & Administration", rx, rw)
    op_bullets = [
        ("Independent Systems Builder & Engineer — Pro-Jukti Info Tech (2026–present)",
         "On-device AI, ARM64 Android tooling and Linux systems, delivered independently."),
        ("Office Administrator — Rabeya Education Family, Savar, Dhaka (2025–present)",
         "Daily operations, social media and SEO, student registration, records and promotional media."),
    ]
    for head, tail in op_bullets:
        bullet(c, rcur, head, tail)

    section(c, rcur, "Earlier Experience (2015–23)", rx, rw)
    earlier = [
        ("2015–17", "Email marketing — freelance, online"),
        ("2017–18", "Fire watcher — Aramco site (Fadhli), Saudi Arabia"),
        ("2018–20", "Progress reporter — PCMC, Saudi Arabia"),
        ("2020–21", "Electrician — SEC (Khaled Juffali), Jeddah"),
        ("2021–22", "Coordinator — Abdullah Trading, Jubail"),
        ("2022–23", "Computer operator — Savar, Bangladesh"),
    ]
    for years, role in earlier:
        c.setFont(F_BOLD, 7.8)
        c.setFillColor(ACCENT_B)
        c.drawString(rx, rcur.y, years)
        body(c, rcur, role, rx + 50, rw - 50, size=7.9, color=MUTED, leading=9.8)
        rcur.y -= 2.5

    section(c, rcur, "Technical Skills", rx, rw)
    skills = [
        ("On-device AI", "llama.cpp, GGUF, KV-cache, CPU/GPU/NPU routing"),
        ("Android", "Kotlin, Compose, Accessibility, Shizuku, JNI/C++"),
        ("Linux / ARM64", "AOSP builds, Clang/CMake/Ninja, Termux + PRoot"),
        ("Graphics", "Vulkan, Mesa Turnip, Zink, Adreno KGSL"),
        ("Mobile & web", "Flutter, Dart, TypeScript, Python"),
        ("Engineering ops", "GitHub Actions CI, signed releases, device validation"),
    ]
    for head, tail in skills:
        c.setFillColor(TEXT)
        c.setFont(F_BOLD, 8.4)
        c.drawString(rx, rcur.y, head)
        hw = c.stringWidth(head, F_BOLD, 8.4)
        c.setFillColor(MUTED)
        c.setFont(F_BODY, 8.3)
        c.drawString(rx + hw + 8, rcur.y, tail)
        rcur.y -= 12.5

    section(c, rcur, "Education & Learning", rx, rw)
    body(c, rcur,
         "Self-taught through independent research and practical application — continuous "
         "study across algorithms, systems, statistics and networking. Working principle: "
         "living till learning.",
         rx, rw, size=8.5, color=DIM, leading=11.2)

    # Link annotations for project repo URLs visible in bullets
    # (already clickable via text positioning above)

    c.showPage()
    c.save()
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
