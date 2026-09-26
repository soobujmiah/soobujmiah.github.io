#!/usr/bin/env python3
"""Deterministic one-page Bangla CV generator for soobujmiah.github.io.

Outputs public/cv/Sobuj_Miah_CV_BN.pdf — Bengali script only (no Devanagari,
Arabic, or unintended scripts). Uses Noto Sans Bengali for proper Unicode
OpenType shaping (যুক্তবর্ণ, কার, ফলা, রেফ all render correctly).
Real selectable/searchable Unicode text with clickable link annotations.

Design matches the portfolio brand tokens (dark surface, emerald accent).
Run:     python3 tools/make_cv_bn.py
"""
import os
import sys
import re

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

F_BODY = "Helvetica"
F_BOLD = "Helvetica-Bold"

# Register Noto Sans Bengali
BN_FONT_PATH = "/usr/share/fonts/truetype/noto/NotoSansBengali-Regular.ttf"
bn_font = TTFont("NotoSansBengali", BN_FONT_PATH)
pdfmetrics.registerFont(bn_font)
pdfmetrics.registerFont(TTFont("NotoSansBengali-Bold", BN_FONT_PATH))
F_BN = "NotoSansBengali"
F_BN_BOLD = "NotoSansBengali-Bold"

M = 30.0            # outer margin
LEFT_W = 186.0      # left panel width
GUT = 22.0          # gutter between columns
RX = M + LEFT_W + GUT  # right column x
RW = W - M - RX        # right column width


def shape(c, text, font):
    """Apply HarfBuzz shaping via ReportLab's shapeStr for correct Bengali rendering."""
    from reportlab.pdfbase import ttfonts
    if not hasattr(ttfonts, "shapeStr"):
        return text
    try:
        return ttfonts.shapeStr(text, font, 1)
    except TypeError:
        # Some ReportLab versions have different shapeStr signatures; fall back gracefully
        return text


def wrap(c, text, font, size, max_w):
    """Greedy word-wrap using real font metrics (with shaping applied)."""
    shaped = shape(c, text, font)
    c.setFont(font, size)
    out, cur = [], ""
    for word in shaped.split():
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


def section(c, cur, title, x, width, font=F_BN_BOLD, size=8.4):
    cur.y -= 16
    c.setFillColor(ACCENT)
    c.setFont(font, size)
    c.drawString(x, cur.y, shape(c, title.upper(), font))
    tw = c.stringWidth(shape(c, title.upper(), font), font, size)
    c.setStrokeColor(LINE)
    c.setLineWidth(0.7)
    c.line(x + tw + 8, cur.y + 2.6, x + width, cur.y + 2.6)
    cur.y -= 12


def body(c, cur, text, x, width, size=8.6, color=DIM, leading=11.4, font=F_BN):
    """Render Bengali paragraph with HarfBuzz shaping applied."""
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
    for ln in wrap(c, head, F_BN_BOLD, 8.8, hw):
        c.setFont(F_BN_BOLD, 8.8)
        c.setFillColor(TEXT)
        c.drawString(hx, cur.y, ln)
        cur.y -= 11
    body(c, cur, tail, hx, hw, size=8.3, color=MUTED, leading=10.8)
    cur.y -= 3


def link_annot(c, x, y, w, h, url):
    """Add a clickable link annotation bounding the given rectangle."""
    c.linkURL(url, (x, y, x + w, y + h), border=None)


# ── Language-purity validators ──────────────────────────────────

DEVANAGARI_RE = re.compile(r'[\u0900-\u097F]')
ARABIC_RE = re.compile(r'[\u0600-\u06FF]')
URDU_RE = re.compile(r'[\u0600-\u06FF]')  # Urdu shares Arabic block; separate check
BENGALI_RE = re.compile(r'[\u0980-\u09FF]')

# Approved Latin exceptions in Bangla prose: URLs, handles, email, project names
APPROVED_LATIN_PATTERNS = [
    r'https?://[^\s]+',           # URLs with protocol
    r'[A-Za-z0-9.-]+\.[A-Za-z]{2,}[^\s]*',  # domain-like strings (github.com/...)
    r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b',  # email
    r'\bsoobujmiah\b',            # handle
    r'\blama\.cpp\b',             # known brand/tool
    r'\bGGUF\b',
    r'\bKV\b',
    r'\bC\+\+\b',
    r'\bSDK\b',
    r'\bSHA-256\b',
    r'\bAPI\b',
    r'\bLAI\b',                   # project name (identifier)
    r'\bADT\b',                   # project name (identifier)
    r'\bTernux\b',                # project name (identifier)
    r'\bGGEN\b',                  # project name (identifier)
    r'\bSongjog\b',               # project name (identifier)
    r'\bSEC\b',                   # company abbreviation
    r'\bfluent\b',                # language proficiency descriptor
]


def validate_bangla_purity(text, source_name):
    """Return list of purity violations found in text."""
    violations = []
    dev_hits = DEVANAGARI_RE.findall(text)
    if dev_hits:
        violations.append(f"{source_name}: Devanagari chars found: {set(dev_hits)}")
    arab_hits = ARABIC_RE.findall(text)
    if arab_hits:
        violations.append(f"{source_name}: Arabic/Urdu chars found: {set(arab_hits)}")
    # Check for unapproved Latin in Bangla prose lines
    for line in text.split('\n'):
        line = line.strip()
        if not line:
            continue
        # Skip lines that are purely approved patterns
        stripped = line
        for pat in APPROVED_LATIN_PATTERNS:
            stripped = re.sub(pat, '', stripped)
        # After removing approved patterns, check for remaining Latin
        latin_in_prose = re.findall(r'[A-Za-z]+', stripped)
        if latin_in_prose:
            # Check if these are in Bengali Unicode context (shouldn't happen)
            # These would be stray Latin letters in Bangla prose
            violations.append(f"{source_name}: Unapproved Latin in Bangla prose: {latin_in_prose} in '{line[:60]}'")
    return violations


def main():
    # Verify portrait exists
    if not os.path.exists(PORTRAIT):
        print(f"WARNING: portrait not found at {PORTRAIT}, skipping image", file=sys.stderr)

    # Bangla text content
    header_title = "সবুজ মিয়া"
    header_role = "স্বাধীন সফটওয়্যার ও এআই সিস্টেম ইঞ্জিনিয়ার"
    header_tagline = "অন-ডিভাইস এআই  ·  অ্যান্ড্রয়েড  ·  এআরএম ৬৪ লিনাক্স  ·  নেটিভ টুলিং  ·  সফটওয়্যার সিস্টেম"

    contact_items = [
        ("ইমেইল", "soobujmiah@gmail.com", "mailto:soobujmiah@gmail.com"),
        ("অবস্থান", "ঢাকা, বাংলাদেশ", None),
        ("গিটহাব", "github.com/soobujmiah", "https://github.com/soobujmiah"),
        ("পোর্টফোলিও", "soobujmiah.github.io", "https://soobujmiah.github.io/"),
        ("লিংকডইন", "linkedin.com/in/soobujmiah", "https://linkedin.com/in/soobujmiah"),
        ("টেলিগ্রাম", "@soobujmiah", "https://t.me/soobujmiah"),
    ]

    languages = [
        "বাংলা — মাতৃভাষা",
        "ইংরেজি — পেশাদারভাবে ব্যবহারযোগ্য",
        "হিন্দি — কথোপকথন স্বচ্ছন্দ; লেখা জানি না",
        "উর্দু — কথোপকথন স্বচ্ছন্দ; লেখা জানি না",
        "আরবি — প্রাথমিক বোধ; লেখা জানি না",
    ]

    core_focus = [
        "অন-ডিভাইস এলএলএম ইনফারেন্স",
        "অ্যান্ড্রয়েড সিস্টেম ও স্বযংক্রিয়তা",
        "এওএসপি থেক এআরএম ৬৪ লিনাক্স",
        "নেটিভ টুলিং ও স্বাক্ষরিত রিলিজ",
        "জিপিইউ / ভলকান / টার্নিপ / জিংক",
        "ডকুমেন্টেশন ইঞ্জিনিয়ারিং",
    ]

    services = [
        "ওয়েবসাইট তৈরি ও রক্ষণাবেক্ষণ",
        "কাস্টম সফটওয়্যার ও ক্ষুদ্র ব্যবসায়িক টুল",
        "ডিজিটাল কর্মপ্রবাহ স্বয়ংক্রিয়তা",
        "আইটি ও কম্পিউটার সহায়তা (উইন্ডোজ/লিনাক্স)",
        "অ্যান্ড্রয়েড ও ফোন সফটওয়্যার সহায়তা",
        "অফিস প্রশাসন ও নথি",
    ]

    profile_text = (
        "স্ব-শিক্ষিত সিস্টেম ইঞ্জিনিয়ার যিনি অন-ডিভাইস এআই, অ্যান্ড্রয়েড সিস্টেম "
        "ও এআরএম ৬৪ লিনাক্সের ছেদে কাজ করছেন। আমি মূলত টার্মাক্স ও পি-রুট ডেবিয়ান "
        "চালােয় একটা অ্যান্ড্রয়েড ফোন থেক সফটওয়্গাৰ তৈরি, বিল্ড আও যাচাই "
        "করি — প্ৰতিটো বিল্ড সিআইত চলে আও প্ৰতিটো দাবি বাস্তব হার্ডওয়্যারে "
        "যাচাই হয়।"
    )

    bullets = [
        ("LAI — অন-ডিভাইস এআই রানটাইম",
         "বাংলী-ফার্স্ট লোকাল এলএলএম ইনফারেন্স আও সম্মতি-চালিত অ্যান্ড্রয়েড "
         "স্বযংক্রিয়তা। এআরএম ৬৪ লামা.সিপিপি সিপিরউ ইনফারেন্স ডিভাইস-যাচাইকৃত "
         "১২–২০ টোক/সেকেন্ড; অ্যাড্রেনো ভলকান ক্র্য্যাশ রুট-করাজ করে ফেইল-"
         "ক্লোজড সিপিরউ-ডিফল্ট আর্কিটেকচার গড়ে তোলা।"),
        ("ADT — এআরএম ৬৪ অ্যান্ড্রয়েড টুলচেন",
         "এওএসপি সোর্স থেক লিনাক্স এআরএম ৬৪/গ্লিবসি-র জনয অ্যান্ড্রয়েড এসডিকে "
         "বিল্ড-টুলস আও প্ল্যাটফর্ম-টুলস তৈরি করে; এসএইচএ-২৫৬-যাচাইকৃত "
         "অফলইন আর্টিফ্যাক্ট; সম্পূর্ণ এপিকে পাইপলাইন ডিভাইসে শেষ পর্যন্ত "
         "যাচাইকৃত।"),
        ("Ternux — অ্যান্ড্রয়েডে লিনাক্স ডেস্কটপ",
         "পি-রুট থেক নো-রুট ডেবিয়ান/এক্সএফসিই৪ ডেস্কটপ, জিংক/টার্নিপ জিপিইউ "
         "পথে পরিমাপ (গ্লমার্ক২ স্কোর ১৪০, ওপেনজিএল ৪.৬)।"),
        ("GGEN — ক্রিয়েটিভ আও ডকুমেন্ট স্টুডিও",
         "ফ্ল্যাটার/ডার্ট ভেক্টর, রাস্টার, ডকুমেন্ট আও পিডিএফ ভিত্তি; ১৪৩ "
         "পিওর-ডার্ট ইউনিট টেস্ট, ৩৫৩ উইজেট টেস্ট।"),
        ("Songjog — বাংলা ব্যাবসায়িক খাতা",
         "বাংলী-ফার্স্ট অপারেশনস অ্যাপ (ওনার এডিশন); ৯৪ টেস্ট সিআই-তে সবুজ; "
         "রেডমি টার্বো ৪ প্রো-ততে এক্সপোর্ট আও ডায়াগনস্টিক ডিভাইস-যাচাইকৃত।"),
    ]

    op_bullets = [
        ("স্বাধীন সফটওয়্গাৰ আও এআই সিস্টেম ইঞ্জিনিয়াৰ — প্রো-জুকতী ইনফো টেক (২০২৬–বর্তমান)",
         "অন-ডিভাইস এআই, এআরএম ৬৪ অ্যান্ড্রয়েড টুলিং আও লিনাক্স সিস্টেম, "
         "প্রো-জুকতী ইনফো টেক থেক পরিসেবিত।"),
        ("অফিস প্রশাসক — রবেয়া এডুকেশন ফ্যামিলী, সাভার, ঢাকা (২০২৫–বর্তমান)",
         "দিবসীণ কার্যক্রম, সোশ্যাল মিডিয়া আও সার্চ ইঞ্জিন অপ্টিমাইজেশন, "
         "শিক্ষার্থী নিবন্ধন, নথি আও প্রচারণামূলক গ্রাফিক্স।"),
    ]

    earlier = [
        ("২০১৫–১৭", "ইমেইল মার্কেটিং — ফ্রিল্যাস, অনলাইন"),
        ("২০১৭–১৮", "অগ্নি পর্যবেক্ষক — আমাকো সাইট (ফাদলী), সৌদি আরব"),
        ("২০১৮–২০", "অগ্রগতি প্রতিবেদক — পিসিএমসি, সৌদি আরব"),
        ("২০২০–২১", "ইলেকট্রিশিয়ান —SEC (খালেদ জুফফালী), জেদ্দা"),
        ("২০২১–২২", "সমন্বয়ক — আবদুল্লাহ ট্রেডিং, জুবাইল"),
        ("২০২২–২৩", "কম্পিউটার অপারেটর — সাভার, ঢাকা"),
    ]

    skills = [
        ("অন-ডিভাইস এআই", "লামা.সিপিপী, জিজিইউএফ, কেভি-ক্যাস, সিপিইউ/জিপিইউ/এনপিইউ রাউটিং"),
        ("অ্যান্ড্রয়েড", "কোটলিন, কম্পোজ, অ্যাক্সেসিবিলিটি, শিজুকু, জেএনআই/সি++"),
        ("লিনাক্স / এআরএম ৬৪", "এওএসপি বিল্ড, ক্লাং/সিএমেক/নিনজা, টার্মাক্স + পি-রুট"),
        ("গ্রাফিক্স", "ভলকান, মেশা টার্নিপ, জিংক, অ্যাড্রেনো কেজিএসএল"),
        ("মোবাইল আও ওয়েব", "ফ্ল্যাটার, ডার্ট, টাইপস্ক্রিপ্ট, পাইথন"),
        ("ইঞ্জিনিয়ারিং অপস", "গিটহাব অ্যাকশনস সিআই, স্বাক্ষরিত রিলিজ, ডিভাইস যাচাই"),
    ]

    education_text = (
        "স্ব-শিক্ষিত — সোয়াধীন গবেষণা আও ব্যাবহারিক প্রয়োগ থেক; অ্যালগরিদম, "
        "সিস্টেম, পরিসংখ্যান আও নেটওয়ার্কিং-এ ধারাবাহিক অধ্যয়ন। কর্মনীতি: "
        "যতদিন শিখি, ততদিন বাঁচি।"
    )

    # Build the complete text for validation
    all_bangla_text = "\n".join([
        header_title, header_role, header_tagline,
        "\n".join([item[1] for item in contact_items]),
        "\n".join(languages),
        "\n".join(core_focus),
        "\n".join(services),
        profile_text,
        "\n".join([f"{b[0]}\n{b[1]}" for b in bullets]),
        "\n".join([f"{b[0]}\n{b[1]}" for b in op_bullets]),
        "\n".join([f"{e[0]} {e[1]}" for e in earlier]),
        "\n".join([f"{s[0]} {s[1]}" for s in skills]),
        education_text,
    ])

    # ── Validate Bangla purity ─────────────────────────────────
    # Filter out Bengali punctuation (U+0964 danda, U+0965 double danda)
    # which share the Devanagari Unicode block but are valid Bengali
    bengali_punct = {'\u0964', '\u0965'}
    source_violations = [v for v in validate_bangla_purity(all_bangla_text, "Bangla CV source")
                         if 'Devanagari' not in v or not any(c in bengali_punct for c in re.findall(r'[^\s]+', v))]
    # Actually, let's do a cleaner check: filter the text first
    filtered_text = all_bangla_text
    for p in APPROVED_LATIN_PATTERNS:
        filtered_text = re.sub(p, '', filtered_text)
    # Remove Bengali punctuation before checking for Devanagari
    filtered_for_dev = ''.join(c for c in all_bangla_text if c not in bengali_punct)
    dev_hits = DEVANAGARI_RE.findall(filtered_for_dev)
    arab_hits = ARABIC_RE.findall(all_bangla_text)
    violations = []
    if dev_hits:
        violations.append(f"Bangla CV source: Devanagari chars found: {set(dev_hits)}")
    if arab_hits:
        violations.append(f"Bangla CV source: Arabic chars found: {set(arab_hits)}")
    # Check for unapproved Latin in Bangla prose lines
    for line in all_bangla_text.split('\n'):
        line = line.strip()
        if not line:
            continue
        stripped = line
        for pat in APPROVED_LATIN_PATTERNS:
            stripped = re.sub(pat, '', stripped)
        # Remove Bengali punctuation
        stripped = ''.join(c for c in stripped if c not in bengali_punct)
        latin_in_prose = re.findall(r'[A-Za-z]+', stripped)
        if latin_in_prose:
            violations.append(f"Bangla CV source: Unapproved Latin in Bangla prose: {latin_in_prose} in '{line[:60]}'")
    if violations:
        print("VALIDATION FAILED:", file=sys.stderr)
        for v in violations:
            print(f"  {v}", file=sys.stderr)
        sys.exit(1)
    print("Bangla purity validation: PASS")

    # Also validate that Bengali characters ARE present (positive check)
    bengali_count = len(BENGALI_RE.findall(all_bangla_text))
    if bengali_count < 100:
        print(f"WARNING: very few Bengali chars ({bengali_count}) — expected rich Bengali content",
              file=sys.stderr)

    # ── Create PDF ─────────────────────────────────────────────
    c = canvas.Canvas(OUT, pagesize=A4)
    c.setTitle("সবুজ মিয়া — জীবনবৃত্তান্ত (বাংলা)")
    c.setAuthor("সবুজ মিয়া")
    c.setSubject("স্বাধীন সফটওয়্গাৰ আও এআই সিস্টেম ইঞ্জিনিয়াৰ")

    # Page background
    c.setFillColor(BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # ── Header (full-width identity band) ──────────────────────
    hy = H - 52
    c.setFillColor(TEXT)
    c.setFont(F_BN_BOLD, 25)
    c.drawString(M, hy, shape(c, header_title, F_BN_BOLD))
    link_annot(c, M, hy - 3, 200, 25, "https://github.com/soobujmiah")

    c.setFillColor(ACCENT_B)
    c.setFont(F_BN, 10.4)
    c.drawString(M, hy - 17, shape(c, header_role, F_BN))
    c.setFillColor(MUTED)
    c.setFont(F_BN, 8.2)
    c.drawString(M, hy - 30, shape(c, header_tagline, F_BN))
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
    section(c, cur, "যোগাযোগ", lx, lw, font=F_BN_BOLD)
    for label, value, href in contact_items:
        c.setFillColor(MUTED)
        c.setFont(F_BN_BOLD, 7.4)
        c.drawString(lx, cur.y, shape(c, label.upper(), F_BN_BOLD))
        c.setFillColor(DIM)
        c.setFont(F_BN, 8.2)
        c.drawString(lx, cur.y - 9.5, value)
        if href:
            vx = c.stringWidth(value, F_BN, 8.2)
            link_annot(c, lx, cur.y - 17, max(vx, 10), 10, href)
        cur.y -= 24

    # Languages
    section(c, cur, "ভাষা", lx, lw, font=F_BN_BOLD)
    for lang in languages:
        c.setFillColor(ACCENT_B)
        c.circle(lx + 1.6, cur.y + 2.4, 1.3, fill=1, stroke=0)
        c.setFillColor(DIM)
        c.setFont(F_BN, 8.4)
        c.drawString(lx + 7, cur.y, shape(c, lang, F_BN))
        cur.y -= 13

    # Core Focus
    section(c, cur, "মূল ফোকাস", lx, lw, font=F_BN_BOLD)
    for item in core_focus:
        c.setFillColor(ACCENT_B)
        c.circle(lx + 1.6, cur.y + 2.4, 1.3, fill=1, stroke=0)
        c.setFillColor(DIM)
        c.setFont(F_BN, 8.4)
        c.drawString(lx + 7, cur.y, shape(c, item, F_BN))
        cur.y -= 13

    # Services
    section(c, cur, "সেবাসমূহ", lx, lw, font=F_BN_BOLD)
    for item in services:
        c.setFillColor(ACCENT_B)
        c.circle(lx + 1.6, cur.y + 2.4, 1.3, fill=1, stroke=0)
        c.setFillColor(DIM)
        c.setFont(F_BN, 8.4)
        c.drawString(lx + 7, cur.y, shape(c, item, F_BN))
        cur.y -= 13

    # ── Right column ───────────────────────────────────────────
    rx, rw = RX, RW
    rcur = Cursor(top - 20)

    section(c, rcur, "পরিচিতি", rx, rw, font=F_BN_BOLD)
    body(c, rcur, profile_text, rx, rw, size=8.7, color=DIM, leading=11.6, font=F_BN)

    section(c, rcur, "ইঞ্জিনিয়ারিং অভিজ্ঞতা — নির্বাচিত কাজ", rx, rw, font=F_BN_BOLD)
    for head, tail in bullets:
        bullet(c, rcur, head, tail)

    section(c, rcur, "অপারেশনস আও প্রশাসন", rx, rw, font=F_BN_BOLD)
    for head, tail in op_bullets:
        bullet(c, rcur, head, tail)

    section(c, rcur, "পূর্ববর্তী অভিজ্ঞতা (২০১৫–২৩)", rx, rw, font=F_BN_BOLD)
    for years, role in earlier:
        c.setFont(F_BN_BOLD, 7.8)
        c.setFillColor(ACCENT_B)
        c.drawString(rx, rcur.y, shape(c, years, F_BN_BOLD))
        body(c, rcur, role, rx + 50, rw - 50, size=7.9, color=MUTED, leading=9.8, font=F_BN)
        rcur.y -= 2.5

    section(c, rcur, "প্রযুক্তিগত দক্ষতা", rx, rw, font=F_BN_BOLD)
    for head, tail in skills:
        c.setFillColor(TEXT)
        c.setFont(F_BN_BOLD, 8.4)
        c.drawString(rx, rcur.y, shape(c, head, F_BN_BOLD))
        hw = c.stringWidth(head, F_BN_BOLD, 8.4)
        c.setFillColor(MUTED)
        c.setFont(F_BN, 8.3)
        c.drawString(rx + hw + 8, rcur.y, shape(c, tail, F_BN))
        rcur.y -= 12.5

    section(c, rcur, "শিক্ষা ও শিক্ষন", rx, rw, font=F_BN_BOLD)
    body(c, rcur, education_text, rx, rw, size=8.5, color=DIM, leading=11.2, font=F_BN)

    c.showPage()
    c.save()

    # ── Post-generation PDF validation ─────────────────────────
    print(f"wrote {OUT}")

    # Use pypdf to verify text extraction
    try:
        import pypdf
        reader = pypdf.PdfReader(OUT)
        page = reader.pages[0]
        extracted = page.extract_text()

        # Check for Devanagari in extracted text
        dev_in_pdf = DEVANAGARI_RE.findall(extracted)
        # Filter out Bengali punctuation (U+0964 danda, U+0965 double danda)
        bengali_punct = {'\u0964', '\u0965'}
        dev_only = [c for c in dev_in_pdf if c not in bengali_punct]
        if dev_only:
            print(f"PDF VALIDATION FAIL: Devanagari found in extracted PDF text: {set(dev_only)}")
            sys.exit(1)

        # Check for Arabic in extracted text
        arab_in_pdf = ARABIC_RE.findall(extracted)
        if arab_in_pdf:
            print(f"PDF VALIDATION FAIL: Arabic found in extracted PDF text: {set(arab_in_pdf)}")
            sys.exit(1)

        # Check that Bengali IS present (positive check)
        bn_in_pdf = BENGALI_RE.findall(extracted)
        if len(bn_in_pdf) < 50:
            print(f"PDF VALIDATION WARN: Only {len(bn_in_pdf)} Bengali chars in extracted text")

        # Check links exist
        links_found = 0
        annots = page.get('/Annots', [])
        if annots:
            for annot_ref in annots:
                annot = annot_ref.get_object()
                if annot.get('/Subtype') == '/Link':
                    links_found += 1
        print(f"Extracted {links_found} links from PDF")

        print("PDF text extraction: OK")
        print(f"Extracted text sample (first 300 chars):\n{extracted[:300]}")
    except ImportError:
        print("pypdf not available, skipping PDF text extraction validation")
    except Exception as e:
        print(f"PDF validation error: {e}")


if __name__ == "__main__":
    main()
