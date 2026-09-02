#!/usr/bin/env python3
"""Rebuilds assets/Sobuj_Miah_CV.pdf from the content/styles defined below.

There is no other editable CV source (Word/Docs/LaTeX) — this script and its
output PDF are the source of truth. To change the CV, edit the content in
this file, then regenerate:

    pip install reportlab
    python3 cv/build_cv.py        # run from the repo root
    # writes ../assets/Sobuj_Miah_CV.pdf

Fonts/colors/margins/layout were reverse-engineered from a prior ReportLab-
generated PDF to match its exact visual design (Helvetica family, green
section headers #1A4D2E, gray metadata #4B5563, dark body text #14181D).
Keep that palette and structure unless you intend to redesign the CV.
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle, ListFlowable, ListItem
)
from reportlab.lib.styles import ParagraphStyle

DARK = HexColor("#14181D")
GREEN = HexColor("#1A4D2E")
GRAY = HexColor("#4B5563")
RULE = HexColor("#C9D2C6")

MARGIN = 51.35433
CONTENT_W = A4[0] - 2 * MARGIN

styles = {
    "name": ParagraphStyle("name", fontName="Helvetica-Bold", fontSize=21, leading=24, textColor=DARK, spaceAfter=3),
    "subtitle": ParagraphStyle("subtitle", fontName="Helvetica-Bold", fontSize=10.5, leading=14, textColor=GREEN, spaceAfter=6),
    "contact": ParagraphStyle("contact", fontName="Helvetica", fontSize=8.5, leading=12, textColor=GRAY, spaceAfter=14),
    "h2": ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=10.5, leading=13, textColor=GREEN, spaceAfter=2),
    "body": ParagraphStyle("body", fontName="Helvetica", fontSize=9, leading=12.6, textColor=DARK, spaceAfter=0),
    "bodyGap": ParagraphStyle("bodyGap", fontName="Helvetica", fontSize=9, leading=12.6, textColor=DARK, spaceAfter=8),
    "jobtitle": ParagraphStyle("jobtitle", fontName="Helvetica-Bold", fontSize=9.5, leading=13, textColor=DARK),
    "jobdate": ParagraphStyle("jobdate", fontName="Helvetica-Oblique", fontSize=8.5, leading=11.5, textColor=GRAY, alignment=TA_RIGHT),
    "company": ParagraphStyle("company", fontName="Helvetica-Oblique", fontSize=8.5, leading=11.5, textColor=GRAY, spaceAfter=4),
    "bullet": ParagraphStyle("bullet", fontName="Helvetica", fontSize=9, leading=12.6, textColor=DARK, leftIndent=10, spaceAfter=2.5),
    "techlead": ParagraphStyle("techlead", fontName="Helvetica", fontSize=9, leading=12.6, textColor=DARK, spaceAfter=6),
    "skillLabel": ParagraphStyle("skillLabel", fontName="Helvetica-Bold", fontSize=9, leading=12.6, textColor=DARK),
    "skillValue": ParagraphStyle("skillValue", fontName="Helvetica", fontSize=9, leading=12.6, textColor=DARK),
    "eduBody": ParagraphStyle("eduBody", fontName="Helvetica", fontSize=9, leading=12.6, textColor=DARK),
}

def rule():
    return HRFlowable(width="100%", thickness=0.7, color=RULE, spaceBefore=0, spaceAfter=8, lineCap="round")

def section_header(title):
    return [Paragraph(title, styles["h2"]), rule()]

def job_row(title, dates):
    t = Table(
        [[Paragraph(title, styles["jobtitle"]), Paragraph(dates, styles["jobdate"])]],
        colWidths=[CONTENT_W - 140, 140],
    )
    t.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
    ]))
    return t

def bullets(items):
    return ListFlowable(
        [ListItem(Paragraph(i, styles["bullet"]), leftIndent=10, value="bulletchar") for i in items],
        bulletType="bullet", bulletFontSize=9, bulletColor=DARK, start="•",
        leftIndent=8, spaceBefore=2, spaceAfter=8,
    )

def skill_row(label, value):
    t = Table(
        [[Paragraph(label, styles["skillLabel"]), Paragraph(value, styles["skillValue"])]],
        colWidths=[90, CONTENT_W - 90],
    )
    t.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return t

story = []

story.append(Paragraph("SOBUJ MIAH", styles["name"]))
story.append(Paragraph(
    "Office Administration &middot; Operations Support &middot; Independent Software &amp; AI Systems Engineer",
    styles["subtitle"]))
story.append(Paragraph(
    "Savar, Dhaka, Bangladesh &middot; GMT+6 (flexible hours) &middot; soobujmiah@gmail.com<br/>"
    "linkedin.com/in/soobujmiah &middot; t.me/soobujmiah &middot; github.com/soobujmiah &middot; soobujmiah.github.io",
    styles["contact"]))

story += section_header("PROFESSIONAL SUMMARY")
story.append(Paragraph(
    "Detail-oriented operations professional with 8+ years across administration, operations and technical support in "
    "Bangladesh and Saudi Arabia &mdash; from Saudi Aramco gas-plant project sites to running the daily back office of an "
    "education organisation in Dhaka. Alongside this, a self-taught systems builder: Linux on Android, Termux/PRoot "
    "workflows, local AI runtimes and technical documentation. Working principle: document everything, verify before "
    "reporting, own the outcome. Open to freelance and remote work.",
    styles["bodyGap"]))

story += section_header("WORK EXPERIENCE")

jobs = [
    ("Office Administrator", "Mar 2023 – Present", "Rabeya Education Family &middot; Savar, Dhaka", [
        "Oversee daily operations as administrator across the organisation.",
        "Manage students&rsquo; online registration, data records, documents and filing system.",
        "Manage social media pages and groups; handle website SEO and content updates.",
        "Create promotional media &mdash; graphics and video.",
    ]),
    ("Computer Operator", "Sep 2022 – Feb 2023", "Monika Enterprise &middot; Savar, Dhaka", [
        "Managed the company&rsquo;s online activities and digital presence.",
        "Processed office documents and maintained the filing system.",
    ]),
    ("Coordinator", "2021 – 2022", "Abdullah Trading Pvt Ltd &middot; Jubail, Saudi Arabia", [
        "Coordinated site operations, logistics and team communication.",
    ]),
    ("Electrician", "2020 – 2021", "Saudi Electricity Company &amp; Khaled Juffali Company &middot; Jeddah, Saudi Arabia", [
        "Performed electrical installation and maintenance in industrial and residential settings.",
    ]),
    ("Progress Reporter", "2018 – 2020", "Fadhli Gas Plant Project &mdash; PCMC &middot; Saudi Arabia", [
        "Collected daily project progress data directly from site.",
        "Digitised and systematised field information into structured records.",
        "Submitted validated reports to project management authority.",
    ]),
    ("Fire Watcher", "2017 – 2018", "Fadhli Gas Plant Project — Saudi Aramco &middot; Saudi Arabia", [
        "Ensured work sites remained free of fire hazards.",
        "Monitored super-hot environments and equipment for fire risk.",
    ]),
    ("Email Marketing Specialist", "2015 – 2017", "Freelance &middot; Independent / Remote", [
        "Executed targeted email campaigns and managed subscriber lists.",
    ]),
]

for title, dates, company, items in jobs:
    story.append(job_row(title, dates))
    story.append(Paragraph(company, styles["company"]))
    story.append(bullets(items))

story += section_header("SELECTED TECHNICAL WORK")

story.append(Paragraph(
    "<b>Termux AI Workstation (flagship).</b> Complete Linux desktop and private AI inference lab built and documented "
    "entirely on an Android phone &mdash; no PC, no root. PRoot Debian/Xfce over Termux-X11 with D-Bus and PulseAudio; "
    "Mesa Turnip + Zink GPU-accelerated desktop graphics; llama.cpp serving GGUF models locally over HTTP with CPU "
    "inference validated on-device (Vulkan/NPU offload under active qualification); AI coding agents integrated for "
    "daily development.",
    styles["techlead"]))

story.append(Paragraph("<b>LAI &mdash; Bangla-first local AI (Android).</b>", styles["body"]))
story.append(bullets([
    "Device-validated local CPU inference (Qwen 2.5 1.5B via llama.cpp), verified model delivery and offline restore, "
    "and consent-gated automation with hash-chained audit.",
    "Reproduced and investigated a native Vulkan-bound crash on Adreno 825, separated independent configuration and "
    "pipeline failures, systematically eliminated tested application-level hypotheses, experimentally falsified an "
    "upstream candidate, and isolated the remaining failure to the GPU/driver execution boundary without overstating "
    "what could be proven from closed-source components.",
]))

story.append(Paragraph(
    "<b>Other public work.</b> Ternux (Android-to-Linux workstation), NpuHub (vendor-neutral local-AI architecture), "
    "GGEN (AI creative &amp; document studio foundation), DataKhoj (cross-platform data collection), RGEN (document "
    "automation). Public claim grading: soobujmiah.github.io/claims.html.",
    styles["techlead"]))

story += section_header("SKILLS")
story.append(skill_row("Administration",
    "Office administration, records &amp; filing, data entry, progress reporting, online registration, logistics coordination"))
story.append(skill_row("Digital operations",
    "Social media management, website SEO, content updates, graphics &amp; video, email marketing"))
story.append(skill_row("Office tools", "Microsoft Office, Google Workspace, documentation systems"))
story.append(skill_row("Linux &amp; systems",
    "Linux administration, Debian, shell scripting, Termux / PRoot / Termux-X11, Xfce, troubleshooting"))
story.append(skill_row("AI &amp; development",
    "llama.cpp, GGUF workflows, local LLM deployment, Git &amp; GitHub CI, Python, Kotlin, technical documentation"))
story.append(skill_row("Languages",
    "Bangla (native), English (fluent), Hindi &amp; Urdu (fluent conversational), Arabic (conversational)"))

story += section_header("EDUCATION")
story.append(Paragraph(
    "Self-educated (autodidact) &mdash; continuous independent research and practical application. Principle: "
    "&ldquo;Living till learning, dead upon stop learning.&rdquo;",
    styles["eduBody"]))

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "assets", "Sobuj_Miah_CV.pdf")

doc = SimpleDocTemplate(
    OUTPUT_PATH, pagesize=A4,
    leftMargin=MARGIN, rightMargin=MARGIN, topMargin=40, bottomMargin=40,
    title="Sobuj Miah - CV", author="Sobuj Miah",
)
doc.build(story)
print("built")
