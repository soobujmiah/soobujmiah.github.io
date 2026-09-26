#!/usr/bin/env python3
"""Deterministic one-page Bangla CV generator for soobujmiah.github.io.

Outputs public/cv/Sobuj_Miah_CV_BN.pdf — professional Bengali CV with faithful
semantic parity to the English CV, correct Bengali OpenType complex text shaping
(যুক্তবর্ণ, কার, ফলা, রেফ, মাত্রা), and searchable/selectable Unicode text.

Uses HarfBuzz OpenType shaping via ReportLab and Noto Sans Bengali with Latin glyphs.
Byte-deterministic output via reportlab invariant mode.

Run:     python3 tools/make_cv_bn.py
"""
import os
import sys
import json

# Prefer project virtual environment packages if present
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# Project evidence/status source of truth.
with open(os.path.join(ROOT, "data", "verification.json"), encoding="utf-8") as _f:
    VERIFICATION = json.load(_f)["projects"]
VENV_PKGS = os.path.join(ROOT, ".venv-cv", "lib", f"python{sys.version_info.major}.{sys.version_info.minor}", "site-packages")
if os.path.isdir(VENV_PKGS) and VENV_PKGS not in sys.path:
    sys.path.insert(0, VENV_PKGS)

import reportlab.rl_config as _rl_config
_rl_config.invariant = 1  # byte-deterministic PDF output

from reportlab.pdfbase import pdfmetrics, ttfonts
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, Color

# ── Enhanced ToUnicode CMap for searchable/selectable Bengali ───
# Maps OpenType Bengali ligature glyph names to canonical Unicode character sequences
GLYPH_TO_UNICODE = {
    'sababeng': '\u09b8\u09cd\u09ac',
    'yapostformbeng': '\u09cd\u09af',
    'sattabeng': '\u09b8\u09cd\u099f',
    'ivowelsign1beng': '\u09bf',
    'ivowelsign2beng': '\u09bf',
    'ivowelsign3beng': '\u09bf',
    'nyajabeng': '\u099e\u09cd\u099c',
    'naddarabeng': '\u09a8\u09cd\u09a1\u09cd\u09b0',
    'kasabeng': '\u0995\u09cd\u09b8',
    'evowelsigninibeng': '\u09c7',
    'ttibeng': '\u099f\u09bf',
    'rephbeng': '\u09b0\u09cd',
    'nadabeng': '\u09a8\u09cd\u09a6',
    'cachabeng': '\u099a\u09cd\u099b',
    'parabeng': '\u09aa\u09cd\u09b0',
    'nasabeng': '\u09a8\u09cd\u09b8',
    'karabeng': '\u0995\u09cd\u09b0',
    'kassabeng': '\u0995\u09cd\u09b7',
    'nattabeng': '\u09a8\u09cd\u099f',
    'aivowelsigninibeng': '\u09c8',
    'mapabeng': '\u09ae\u09cd\u09aa',
    'naddabeng': '\u09a8\u09cd\u09a1',
    'sathabeng': '\u09b8\u09cd\u09a5',
    'rubeng': '\u09b0\u09c1',
    'laddabeng': '\u09b2\u09cd\u09a1',
    'satabeng': '\u09b8\u09cd\u09a4',
    'katabeng': '\u0995\u09cd\u09a4',
    'lapabeng': '\u09b2\u09cd\u09aa',
    'janyabeng': '\u099c\u09cd\u099e',
    'mamabeng': '\u09ae\u09cd\u09ae',
    'ddarabeng': '\u09a1\u09cd\u09b0',
    'kalabeng': '\u0995\u09cd\u09b2',
    'lattabeng': '\u09b2\u09cd\u099f',
    'palabeng': '\u09aa\u09cd\u09b2',
    'kattabeng': '\u0995\u09cd\u099f',
    'shubeng': '\u09b6\u09c1',
    'natabeng': '\u09a8\u09cd\u09a4',
    'sakabeng': '\u09b8\u09cd\u0995',
    'phalabeng': '\u09ab\u09cd\u09b2',
    'nattarabeng': '\u09a8\u09cd\u099f\u09cd\u09b0',
    'ssatthabeng': '\u09b7\u09cd\u09a0',
    'rephiivowelsignbeng': '\u09b0\u09cd\u09c0',
    'nadhabeng': '\u09a8\u09cd\u09a7',
    'garabeng': '\u0997\u09cd\u09b0',
    'pharabeng': '\u09ab\u09cd\u09b0',
    'ganabeng': '\u0997\u09cd\u09a8',
    'ttaribeng': '\u099f\u09cd\u09b0\u09bf',
    'dadabeng': '\u09a6\u09cd\u09a6',
    'nababeng': '\u09a8\u09cd\u09ac',
    'badabeng': '\u09ac\u09cd\u09a6',
    'lalabeng': '\u09b2\u09cd\u09b2',
    'ttarabeng': '\u099f\u09cd\u09b0',
    'uvowelsigntallbeng': '\u09c1',
    'uvowelsignlongbeng': '\u09c2',
    'sanabeng': '\u09b8\u09cd\u09a8',
    'barabeng': '\u09ac\u09cd\u09b0',
    'nyacabeng': '\u099e\u09cd\u099a',
    'darubeng': '\u09a6\u09cd\u09b0\u09c1',
    'hyphen': '-',
    'comma': ',',
    'two': '২',
    'five': '৫',
    'six': '৬',
}

FONT_PUA_MAPS = {}

orig_addPrivate = ttfonts.TTFont._TTFont__addPrivate
def custom_addPrivate(self, name, gid, advance):
    uchar = orig_addPrivate(self, name, gid, advance)
    fname = self.face.name.decode() if hasattr(self.face.name, 'decode') else str(self.face.name)
    if fname not in FONT_PUA_MAPS:
        FONT_PUA_MAPS[fname] = {}
    if name in GLYPH_TO_UNICODE:
        FONT_PUA_MAPS[fname][uchar] = GLYPH_TO_UNICODE[name]
    return uchar

ttfonts.TTFont._TTFont__addPrivate = custom_addPrivate

def enhanced_makeToUnicodeCMap(fontname, subset):
    fname = fontname.split('+', 1)[-1]
    pua_map = FONT_PUA_MAPS.get(fname, {})
    cmap = [
        "/CIDInit /ProcSet findresource begin",
        "12 dict begin",
        "begincmap",
        "/CIDSystemInfo",
        f"<< /Registry ({fontname})",
        f"/Ordering ({fontname})",
        "/Supplement 0",
        ">> def",
        f"/CMapName /{fontname} def",
        "/CMapType 2 def",
        "1 begincodespacerange",
        f"<00> <{len(subset) - 1:02X}>",
        "endcodespacerange",
        f"{len(subset)} beginbfchar"
    ]
    for i, v in enumerate(subset):
        if v in pua_map:
            seq = pua_map[v]
            hex_seq = "".join(f"{ord(c):04X}" for c in seq)
            cmap.append(f"<{i:02X}> <{hex_seq}>")
        else:
            cmap.append(f"<{i:02X}> <{v:04X}>")
    cmap.extend([
        "endbfchar",
        "endcmap",
        "CMapName currentdict /CMap defineresource pop",
        "end",
        "end"
    ])
    return "\n".join(cmap)

ttfonts.makeToUnicodeCMap = enhanced_makeToUnicodeCMap

PORTRAIT = os.path.join(HERE, "cv", "portrait.jpg")
OUT = os.path.join(ROOT, "public", "cv", "Sobuj_Miah_CV_BN.pdf")

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

# ── Font setup ──────────────────────────────────────────────────
# Locate bundled or system Noto Sans Bengali font files
FONT_DIR = os.path.join(HERE, "fonts")
BN_REG_PATH = os.path.join(FONT_DIR, "NotoSansBengali-Regular.ttf")
BN_BOLD_PATH = os.path.join(FONT_DIR, "NotoSansBengali-Bold.ttf")

if not os.path.exists(BN_REG_PATH):
    # Fallback to system fonts
    BN_REG_PATH = "/usr/share/fonts/truetype/noto/NotoSansBengali-Regular.ttf"
    BN_BOLD_PATH = "/usr/share/fonts/truetype/noto/NotoSansBengali-Bold.ttf"

F_BN = "NotoSansBengali"
F_BN_BOLD = "NotoSansBengali-Bold"

pdfmetrics.registerFont(TTFont(F_BN, BN_REG_PATH))
pdfmetrics.registerFont(TTFont(F_BN_BOLD, BN_BOLD_PATH if os.path.exists(BN_BOLD_PATH) else BN_REG_PATH))

# ── Bengali OpenType Shaping ─────────────────────────────────────
def is_bengali_char(c):
    return 0x0980 <= ord(c) <= 0x09FF

def shape_word(word, font, size):
    """Shape a single Bengali word using HarfBuzz."""
    if not any(is_bengali_char(c) for c in word):
        return word
    try:
        shaped = ttfonts.shapeStr(word, font, size)
        return shaped
    except Exception:
        return word

def measure_line(c, line_text, font, size):
    """Measure visual width of text taking HarfBuzz shaping into account."""
    words = line_text.split(" ")
    total_w = 0.0
    space_w = c.stringWidth(" ", font, size)
    for i, w in enumerate(words):
        if not w:
            continue
        if i > 0:
            total_w += space_w
        if any(is_bengali_char(ch) for ch in w):
            shaped = shape_word(w, font, size)
            total_w += c.stringWidth(shaped, font, size)
        else:
            total_w += c.stringWidth(w, font, size)
    return total_w

def draw_line(c, x, y, line_text, font, size):
    """Draw line with word-level HarfBuzz shaping to preserve ShapedStr and __shapeData__."""
    words = line_text.split(" ")
    cur_x = x
    space_w = c.stringWidth(" ", font, size)
    for i, w in enumerate(words):
        if not w:
            continue
        if i > 0:
            cur_x += space_w
        if any(is_bengali_char(ch) for ch in w):
            shaped = shape_word(w, font, size)
            c.drawString(cur_x, y, shaped)
            cur_x += c.stringWidth(shaped, font, size)
        else:
            c.drawString(cur_x, y, w)
            cur_x += c.stringWidth(w, font, size)

def wrap_text(c, text, font, size, max_w):
    """Greedy word-wrap using real shaped font metrics."""
    words = text.split(" ")
    lines = []
    cur_line = ""
    for w in words:
        trial = (cur_line + " " + w).strip()
        if measure_line(c, trial, font, size) <= max_w:
            cur_line = trial
        else:
            if cur_line:
                lines.append(cur_line)
            cur_line = w
    if cur_line:
        lines.append(cur_line)
    return lines

# ── Layout Helpers ──────────────────────────────────────────────
class Cursor:
    def __init__(self, y):
        self.y = y

M = 30.0            # outer margin
LEFT_W = 186.0      # left panel width
GUT = 22.0          # gutter between columns
RX = M + LEFT_W + GUT  # right column x
RW = W - M - RX        # right column width

def section(c, cur, title, x, width, font=F_BN_BOLD, size=8.4):
    cur.y -= 16
    c.setFillColor(ACCENT)
    c.setFont(font, size)
    draw_line(c, x, cur.y, title, font, size)
    tw = measure_line(c, title, font, size)
    c.setStrokeColor(LINE)
    c.setLineWidth(0.7)
    c.line(x + tw + 8, cur.y + 2.6, x + width, cur.y + 2.6)
    cur.y -= 12

def body(c, cur, text, x, width, size=8.6, color=DIM, leading=11.4, font=F_BN):
    c.setFillColor(color)
    for line in wrap_text(c, text, font, size, width):
        c.setFont(font, size)
        c.setFillColor(color)
        draw_line(c, x, cur.y, line, font, size)
        cur.y -= leading

def bullet(c, cur, head, tail, x=RX, width=RW):
    c.setFillColor(ACCENT_B)
    c.circle(x + 1.6, cur.y + 2.6, 1.4, fill=1, stroke=0)
    hx, hw = x + 7, width - 7
    for ln in wrap_text(c, head, F_BN_BOLD, 8.8, hw):
        c.setFont(F_BN_BOLD, 8.8)
        c.setFillColor(TEXT)
        draw_line(c, hx, cur.y, ln, F_BN_BOLD, 8.8)
        cur.y -= 11
    body(c, cur, tail, hx, hw, size=8.3, color=MUTED, leading=10.8, font=F_BN)
    cur.y -= 3

def link_annot(c, x, y, w, h, url):
    """Add a clickable link annotation bounding the given rectangle."""
    c.linkURL(url, (x, y, x + w, y + h), thickness=0)

# ── Main Generator ──────────────────────────────────────────────
def main():
    c = canvas.Canvas(OUT, pagesize=A4)
    c.setTitle("Sobuj Miah — Curriculum Vitae (Bengali)")
    c.setAuthor("Sobuj Miah")
    c.setSubject("Independent Software & AI Systems Engineer")

    # Background
    c.setFillColor(BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # ── Header (full-width identity band) ──────────────────────
    hy = H - 52
    c.setFillColor(TEXT)
    c.setFont(F_BN_BOLD, 25)
    draw_line(c, M, hy, "সবুজ মিয়া", F_BN_BOLD, 25)
    link_annot(c, M, hy - 3, 200, 25, "https://github.com/soobujmiah")

    c.setFillColor(ACCENT_B)
    c.setFont(F_BN, 10.4)
    draw_line(c, M, hy - 17, "স্বাধীন সফটওয়্যার ও এআই সিস্টেম ইঞ্জিনিয়ার", F_BN, 10.4)

    c.setFillColor(MUTED)
    c.setFont(F_BN, 8.2)
    draw_line(c, M, hy - 30, "অন-ডিভাইস এআই  ·  অ্যান্ড্রয়েড  ·  এআরএম৬৪ লিনাক্স  ·  নেটিভ টুলিং  ·  সফটওয়্যার সিস্টেম", F_BN, 8.2)

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
    section(c, cur, "যোগাযোগ", lx, lw)
    contact_items = [
        ("ইমেইল", "soobujmiah@gmail.com", "mailto:soobujmiah@gmail.com"),
        ("অবস্থান", "ঢাকা, বাংলাদেশ", None),
        ("গিটহাব", "github.com/soobujmiah", "https://github.com/soobujmiah"),
        ("পোর্টফোলিও", "soobujmiah.github.io", "https://soobujmiah.github.io/"),
        ("লিংকডইন", "linkedin.com/in/soobujmiah", "https://linkedin.com/in/soobujmiah"),
        ("টেলিগ্রাম", "@soobujmiah", "https://t.me/soobujmiah"),
    ]
    for label, value, href in contact_items:
        c.setFillColor(MUTED)
        c.setFont(F_BN_BOLD, 7.4)
        draw_line(c, lx, cur.y, label, F_BN_BOLD, 7.4)
        c.setFillColor(DIM)
        c.setFont(F_BN, 8.2)
        draw_line(c, lx, cur.y - 9.5, value, F_BN, 8.2)
        if href:
            vx = measure_line(c, value, F_BN, 8.2)
            link_annot(c, lx, cur.y - 17, max(vx, 10), 10, href)
        cur.y -= 24

    # Language Proficiency — Accurate representation matching Section 9 & 10
    section(c, cur, "ভাষা", lx, lw)
    languages = [
        "বাংলা — মাতৃভাষা",
        "ইংরেজি — পেশাগত কার্যোপযোগী",
        "হিন্দি / উর্দু — কথোপকথন স্বচ্ছন্দ (লেখাহীন)",
        "আরবি — প্রাথমিক বোধ",
    ]
    for lang in languages:
        c.setFillColor(ACCENT_B)
        c.circle(lx + 1.6, cur.y + 2.4, 1.3, fill=1, stroke=0)
        c.setFillColor(DIM)
        c.setFont(F_BN, 8.4)
        draw_line(c, lx + 7, cur.y, lang, F_BN, 8.4)
        cur.y -= 13

    # Core Focus
    section(c, cur, "মূল ফোকাস", lx, lw)
    core_focus = [
        "অন-ডিভাইস এলএলএম ইনফারেন্স",
        "অ্যান্ড্রয়েড সিস্টেম ও স্বয়ংক্রিয়তা",
        "এওএসপি থেকে এআরএম৬৪ লিনাক্স",
        "নেটিভ টুলিং ও স্বাক্ষরিত রিলিজ",
        "জিপিইউ / ভলকান / টার্নিপ / জিংক",
        "ডকুমেন্টেশন ইঞ্জিনিয়ারিং",
    ]
    for item in core_focus:
        c.setFillColor(ACCENT_B)
        c.circle(lx + 1.6, cur.y + 2.4, 1.3, fill=1, stroke=0)
        c.setFillColor(DIM)
        c.setFont(F_BN, 8.4)
        draw_line(c, lx + 7, cur.y, item, F_BN, 8.4)
        cur.y -= 13

    # Services
    section(c, cur, "সেবাসমূহ", lx, lw)
    services = [
        "ওয়েবসাইট তৈরি ও রক্ষণাবেক্ষণ",
        "কাস্টম সফটওয়্যার ও ব্যবসায়িক টুল",
        "ডিজিটাল কর্মপ্রবাহ স্বয়ংক্রিয়তা",
        "আইটি ও কম্পিউটার সহায়তা (লিনাক্স/উইন্ডোজ)",
        "অ্যান্ড্রয়েড ও ফোন সফটওয়্যার সহায়তা",
        "অফিস প্রশাসন ও নথি ব্যবস্থাপনা",
    ]
    for item in services:
        c.setFillColor(ACCENT_B)
        c.circle(lx + 1.6, cur.y + 2.4, 1.3, fill=1, stroke=0)
        c.setFillColor(DIM)
        c.setFont(F_BN, 8.4)
        draw_line(c, lx + 7, cur.y, item, F_BN, 8.4)
        cur.y -= 13

    # ── Right column ───────────────────────────────────────────
    rx, rw = RX, RW
    rcur = Cursor(top - 20)

    section(c, rcur, "পরিচিতি", rx, rw)
    profile_text = (
        "অন-ডিভাইস এআই, অ্যান্ড্রয়েড সিস্টেম ও এআরএম৬৪ লিনাক্সের সংযোগস্থলে কাজ করা "
        "একজন স্ব-শিক্ষিত সিস্টেম ইঞ্জিনিয়ার। টার্মাক্স ও পি-রুট ডেবিয়ান চালিয়ে সম্পূর্ণ "
        "অ্যান্ড্রয়েড ফোন থেকেই সিস্টেম ডেভেলপ করি — প্রতিটি বিল্ড সিআই-তে চলে এবং প্রতিটি "
        "দাবি স্ন্যাপড্রাগন ৮এস জেন ৪ রেফারেন্স ডিভাইসে বাস্তব হার্ডওয়্যারে যাচাই করা। এর সাথে "
        "যুক্ত রয়েছে বাংলাদেশ ও সৌদি আরব জুড়ে ৮+ বছরের অপারেশনস, প্রশাসন ও সাইটের বাস্তব অভিজ্ঞতা।"
    )
    body(c, rcur, profile_text, rx, rw, size=8.7, color=DIM, leading=11.6)

    section(c, rcur, "ইঞ্জিনিয়ারিং অভিজ্ঞতা — নির্বাচিত কাজ", rx, rw)
    bullets = [
        ("LAI — অন-ডিভাইস এআই রানটাইম (v0.9.7)",
         "বাংলা-ফার্স্ট লোকাল এলএলএম ইনফারেন্স ও সম্মতি-চালিত অ্যান্ড্রয়েড স্বয়ংক্রিয়তা। "
         "এআরএম৬৪ llama.cpp সিপিইউ ইনফারেন্স ডিভাইসে যাচাইকৃত ১২–২০ টোকেন/সেকেন্ড ও কেভি-প্রিফিক্স "
         "রিউজ (স্ন্যাপড্রাগন ৮এস জেন ৪); ফেইল-ক্লোজড সিপিইউ-ডিফল্ট আর্কিটেকচার গড়ে তোলা হয়েছে।"),
        ("ADT — এআরএম৬৪ অ্যান্ড্রয়েড টুলচেন (v37.0.0)",
         "এওএসপি সোর্স থেকে লিনাক্স এআরএম৬৪/glibc-এর জন্য অ্যান্ড্রয়েড এসডিকে টুলস "
         "(এপিআই ৩৬ যাচাইকৃত); SHA-256 অফলাইন রিলিজ; সম্পূর্ণ নেটিভ এপিকে পাইপলাইন "
         "(বিল্ড, সাইন, ইনস্টল ও জেএনআই লোড) ডিভাইসে যাচাইকৃত।"),
        ("Ternux — অ্যান্ড্রয়েডে লিনাক্স ডেস্কটপ (v1.4.0)",
         "নো-রুট ডেবিয়ান/Xfce4 ডেস্কটপ, Termux:X11 ডিসপ্লে ও পালস-অডিও ব্রিজ; "
         "পরিমাপকৃত Zink/Turnip জিপিইউ পথ (glmark2 স্কোর ১৪০, OpenGL ৪.৬) এবং ডক্টর ও বেঞ্চমার্ক টুলিং।"),
        ("GGEN — ক্রিয়েটিভ ও ডকুমেন্ট স্টুডিও",
         "ফ্লাটার/ডার্ট স্টুডিও ফাউন্ডেশন: ১৪৩টি পিওর-ডার্ট ইউনিট টেস্ট ও ৩৫৩টি উইজেট/কন্ট্রোলার টেস্ট; "
         "ডিটারমিনিস্টিক টেক্সট-লেআউট ইঞ্জিন এবং ট্রানজ্যাকশনাল SHA-256 স্টেট ইন্টিগ্রিটি।"),
        ("Songjog — বাংলা ব্যবসায়িক খাতা (ওনার এডিশন)",
         "বাংলা-ফার্স্ট ব্যবসায়িক কার্যক্রম অ্যাপ; দ্রুত দৈনিক হিসাব, স্থানীয় SQLite রেকর্ড "
         "ও অডিটযোগ্য সমন্বয়; সিআই-তে ৯৪টি টেস্ট সফল; রেডমি টার্বো ৪ প্রো ডিভাইসে এক্সপোর্ট ও ডায়াগনস্টিকস যাচাইকৃত।"),
    ]
    for head, tail in bullets:
        bullet(c, rcur, head, tail)

    section(c, rcur, "অপারেশনস ও প্রশাসন", rx, rw)
    op_bullets = [
        ("স্বাধীন সফটওয়্যার ও এআই সিস্টেম ইঞ্জিনিয়ার — প্রো-যুক্তি ইনফো টেক (২০২৬–বর্তমান)",
         "অন-ডিভাইস এআই, এআরএম৬৪ অ্যান্ড্রয়েড টুলিং ও লিনাক্স সিস্টেম, স্বাধীনভাবে পরিচালিত।"),
        ("অফিস প্রশাসক — রাবেয়া এডুকেশন ফ্যামিলি, সাভার, ঢাকা (২০২৫–বর্তমান)",
         "দৈনন্দিন কার্যক্রম পরিচালনা, সোশ্যাল মিডিয়া ও এসইও, শিক্ষার্থী নিবন্ধন, নথি ব্যবস্থাপনা এবং প্রচারমূলক গ্রাফিক্স।"),
    ]
    for head, tail in op_bullets:
        bullet(c, rcur, head, tail)

    section(c, rcur, "পূর্ববর্তী অভিজ্ঞতা (২০১৫–২৩)", rx, rw)
    earlier = [
        ("২০১৫–১৭", "ইমেইল মার্কেটিং — ফ্রিল্যান্স, অনলাইন"),
        ("২০১৭–১৮", "অগ্নি পর্যবেক্ষক — আরামকো সাইট (ফাধলি), সৌদি আরব"),
        ("২০১৮–২০", "অগ্রগতি প্রতিবেদক — পিসিএমসি, সৌদি আরব"),
        ("২০২০–২১", "ইলেকট্রিশিয়ান — এসইসি (খালেদ জুফফালী), জেদ্দা, সৌদি আরব"),
        ("২০২১–২২", "সমন্বয়কারী — আব্দুল্লাহ ট্রেডিং, জুবাইল, সৌদি আরব"),
        ("২০২২–২৩", "কম্পিউটার অপারেটর — সাভার, ঢাকা, বাংলাদেশ"),
    ]
    for years, role in earlier:
        c.setFont(F_BN_BOLD, 7.8)
        c.setFillColor(ACCENT_B)
        draw_line(c, rx, rcur.y, years, F_BN_BOLD, 7.8)
        body(c, rcur, role, rx + 50, rw - 50, size=7.9, color=MUTED, leading=9.8, font=F_BN)
        rcur.y -= 2.5

    section(c, rcur, "প্রযুক্তিগত দক্ষতা", rx, rw)
    skills = [
        ("অন-ডিভাইস এআই", "llama.cpp, GGUF, KV-ক্যাশ, CPU/GPU/NPU রাউটিং"),
        ("অ্যান্ড্রয়েড", "Kotlin, Compose, Accessibility, Shizuku, JNI/C++"),
        ("লিনাক্স / এআরএম৬৪", "AOSP বিল্ড, Clang/CMake/Ninja, টার্মাক্স + পি-রুট"),
        ("গ্রাফিক্স", "Vulkan, Mesa Turnip, Zink, Adreno KGSL"),
        ("মোবাইল ও ওয়েব", "Flutter, Dart, TypeScript, Python"),
        ("ইঞ্জিনিয়ারিং অপস", "GitHub Actions CI, স্বাক্ষরিত রিলিজ, ডিভাইস যাচাই"),
    ]
    for head, tail in skills:
        c.setFillColor(TEXT)
        c.setFont(F_BN_BOLD, 8.4)
        draw_line(c, rx, rcur.y, head, F_BN_BOLD, 8.4)
        hw = measure_line(c, head, F_BN_BOLD, 8.4)
        c.setFillColor(MUTED)
        c.setFont(F_BN, 8.3)
        draw_line(c, rx + hw + 8, rcur.y, tail, F_BN, 8.3)
        rcur.y -= 12.5

    section(c, rcur, "শিক্ষা ও ধারাবাহিক শিখন", rx, rw)
    education_text = (
        "স্বাধীন গবেষণা ও ব্যবহারিক প্রয়োগের মাধ্যমে স্ব-শিক্ষিত — অ্যালগরিদম, সিস্টেম, "
        "পরিসংখ্যান ও নেটওয়ার্কিং বিষয়ে ধারাবাহিক অধ্যয়ন। কর্মনীতি: যতদিন শিখি, ততদিন বাঁচি।"
    )
    body(c, rcur, education_text, rx, rw, size=8.5, color=DIM, leading=11.2, font=F_BN)

    c.showPage()
    c.save()
    print(f"wrote {OUT}")

if __name__ == "__main__":
    main()
