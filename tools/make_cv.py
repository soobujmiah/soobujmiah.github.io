#!/usr/bin/env python3
"""Deterministic one-page CV generator for soobujmiah.github.io.

Reads the committed portrait (tools/cv/portrait.jpg) and the reconciled
content below, and emits public/cv/Sobuj_Miah_CV.pdf.

The content hierarchy follows the portfolio's own evidence:
  primary  -> soobujmiah/soobujmiah.github.io (positioning, projects, skills)
  primary  -> the public repositories (demonstrated engineering work)
  secondary-> the supplied reference CV (used only where it adds supportable,
              non-conflicting context; its disputed/least-supported employer
              entries are NOT reproduced)

Design: one A4 page, dark charcoal surface, a single restrained brand accent
(emerald, matching the portfolio), white typography, a left profile panel with
the portrait, and a right column carrying the professional record.

Requires: reportlab, Pillow.
Run:      python3 tools/make_cv.py
"""
import os

import reportlab.rl_config as _rl_config

_rl_config.invariant = 1  # byte-deterministic PDF output (fixed timestamps/IDs)

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PORTRAIT = os.path.join(HERE, "cv", "portrait.jpg")
OUT = os.path.join(ROOT, "public", "cv", "Sobuj_Miah_CV.pdf")

W, H = A4  # 595.28 x 841.89

# Palette — one brand accent on near-black, white type.
BG = HexColor("#0a0e0c")
PANEL = HexColor("#101613")
LINE = HexColor("#233029")
ACCENT = HexColor("#22c55e")
ACCENT_B = HexColor("#4ade80")
TEXT = HexColor("#e9e7e4")
MUTED = HexColor("#9fb0a6")
DIM = HexColor("#c9d2cc")

F_BODY = "Helvetica"
F_BOLD = "Helvetica-Bold"

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
    # accent tick + rule
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
    # head (bold, wrapped if long) then tail on following wrapped lines
    hx, hw = x + 7, width - 7
    for ln in wrap(c, head, F_BOLD, 8.8, hw):
        c.setFont(F_BOLD, 8.8)
        c.setFillColor(TEXT)
        c.drawString(hx, cur.y, ln)
        cur.y -= 11
    body(c, cur, tail, hx, hw, size=8.3, color=MUTED, leading=10.8)
    cur.y -= 3


def main():
    c = canvas.Canvas(OUT, pagesize=A4)
    c.setTitle("Sobuj Miah — Curriculum Vitae")
    c.setAuthor("Sobuj Miah")
    c.setSubject("Independent Software & AI Systems Engineer")

    # Surfaces
    c.setFillColor(BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(PANEL)
    c.rect(0, 0, M + LEFT_W + GUT * 0.5, H, fill=1, stroke=0)

    # ── Header ────────────────────────────────────────────────
    hy = H - 52
    c.setFillColor(TEXT)
    c.setFont(F_BOLD, 25)
    c.drawString(M, hy, "SOBUJ MIAH")
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

    # ── Left column ───────────────────────────────────────────
    lx = M
    lw = LEFT_W
    cur = Cursor(top - 20)

    # Portrait (CV-only photograph), rounded, contained
    pw = 128.0
    ph = pw * (654.0 / 490.0)
    px = lx + (lw - pw) / 2.0
    py = cur.y - ph
    c.saveState()
    p = c.beginPath()
    p.roundRect(px, py, pw, ph, 8)
    c.clipPath(p, stroke=0)
    c.drawImage(PORTRAIT, px, py, width=pw, height=ph, preserveAspectRatio=True, anchor="c")
    c.restoreState()
    c.setStrokeColor(ACCENT)
    c.setLineWidth(1.0)
    c.roundRect(px, py, pw, ph, 8, fill=0, stroke=1)
    cur.y = py - 18

    section(c, cur, "Contact", lx, lw)
    for label, value in [
        ("Email", "soobujmiah@gmail.com"),
        ("Location", "Dhaka, Bangladesh"),
        ("GitHub", "github.com/soobujmiah"),
        ("Web", "soobujmiah.github.io"),
        ("LinkedIn", "linkedin.com/in/soobujmiah"),
        ("Telegram", "@soobujmiah"),
    ]:
        c.setFillColor(MUTED)
        c.setFont(F_BOLD, 7.4)
        c.drawString(lx, cur.y, label.upper())
        c.setFillColor(DIM)
        c.setFont(F_BODY, 8.2)
        c.drawString(lx, cur.y - 9.5, value)
        cur.y -= 24

    section(c, cur, "Languages", lx, lw)
    for lang in ["Bangla — native", "English — fluent", "Hindi / Urdu — fluent conversational", "Arabic — conversational"]:
        c.setFillColor(ACCENT_B)
        c.circle(lx + 1.6, cur.y + 2.4, 1.3, fill=1, stroke=0)
        c.setFillColor(DIM)
        c.setFont(F_BODY, 8.4)
        c.drawString(lx + 7, cur.y, lang)
        cur.y -= 13

    section(c, cur, "Core Focus", lx, lw)
    for item in ["On-device LLM inference", "Android systems & automation", "ARM64 Linux from AOSP", "Native tooling & signed releases", "GPU / Vulkan / Turnip / Zink", "Documentation as engineering"]:
        c.setFillColor(ACCENT_B)
        c.circle(lx + 1.6, cur.y + 2.4, 1.3, fill=1, stroke=0)
        c.setFillColor(DIM)
        c.setFont(F_BODY, 8.4)
        c.drawString(lx + 7, cur.y, item)
        cur.y -= 13

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

    # ── Right column ──────────────────────────────────────────
    rx, rw = RX, RW
    rcur = Cursor(top - 20)

    section(c, rcur, "Profile", rx, rw)
    body(c, rcur,
         "Self-taught systems engineer working at the intersection of on-device AI, Android systems and "
         "ARM64 Linux. I develop, build and validate software primarily from an Android phone running Termux "
         "and PRoot Debian — every build runs on CI and every claim is checked against real hardware. "
         "I combine this with 8+ years of operations, administration and industrial-site experience across "
         "Bangladesh and Saudi Arabia.",
         rx, rw, size=8.7, color=DIM, leading=11.6)

    section(c, rcur, "Selected Engineering Work", rx, rw)
    bullet(c, rcur, "LAI — on-device AI runtime",
           "Bangla-first local LLM inference and consent-driven Android automation. arm64 llama.cpp CPU inference "
           "device-validated at 12–20 tok/s; Adreno Vulkan crash root-caused into a fail-closed CPU-default design.")
    bullet(c, rcur, "ADT — ARM64 Android toolchain",
           "Builds Android SDK build-tools and platform-tools from AOSP source for Linux ARM64/glibc; SHA-256-verified "
           "offline artifacts; full APK pipeline validated end-to-end on device.")
    bullet(c, rcur, "Ternux — Linux desktop on Android",
           "No-root Debian/Xfce4 desktop over PRoot with a measured Zink/Turnip GPU route (glmark2 140, OpenGL 4.6).")
    bullet(c, rcur, "GGEN — creative & document studio",
           "Flutter/Dart vector, raster, document and PDF foundation; 143 pure-Dart unit tests, 353 widget tests.")
    bullet(c, rcur, "Songjog — Bengali business ledger",
           "Bengali-first operations app (Owner Edition); 94 tests green on CI; export and diagnostics device-validated.")

    section(c, rcur, "Operations & Administration", rx, rw)
    bullet(c, rcur, "Independent Systems Builder & Engineer — Pro-Jukti Info Tech (2026–present)",
           "On-device AI, ARM64 Android tooling and Linux systems, delivered independently.")
    bullet(c, rcur, "Office Administrator — Rabeya Education Family, Savar, Dhaka (2025–present)",
           "Daily operations, social media and SEO, student registration, records and promotional media.")
    body(c, rcur,
         "Earlier: eight years across office administration, digital operations and industrial-site roles "
         "(progress reporting, fire safety, electrical, coordination) in Bangladesh and Saudi Arabia.",
         rx, rw, size=8.3, color=MUTED, leading=10.8)

    section(c, rcur, "Technical Skills", rx, rw)
    for head, tail in [
        ("On-device AI", "llama.cpp, GGUF, KV-cache, CPU/GPU/NPU routing"),
        ("Android", "Kotlin, Compose, Accessibility, Shizuku, JNI/C++"),
        ("Linux / ARM64", "AOSP builds, Clang/CMake/Ninja, Termux + PRoot"),
        ("Graphics", "Vulkan, Mesa Turnip, Zink, Adreno KGSL"),
        ("Mobile & web", "Flutter, Dart, TypeScript, Python"),
        ("Engineering ops", "GitHub Actions CI, signed releases, device validation"),
    ]:
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
         "Self-taught through independent research and practical application — continuous study across algorithms, "
         "systems, statistics and networking. Working principle: living till learning.",
         rx, rw, size=8.5, color=DIM, leading=11.2)

    c.showPage()
    c.save()
    print("wrote", OUT)


if __name__ == "__main__":
    main()
