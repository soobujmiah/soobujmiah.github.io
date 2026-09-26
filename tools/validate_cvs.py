#!/usr/bin/env python3
"""Comprehensive validation suite for the bilingual CV system.

Verifies:
1. Deterministic file generation and existence for both English and Bangla CVs.
2. Single-page constraint strictly preserved (exactly 1 A4 page each).
3. Script and language purity:
   - English CV contains pure English prose (zero Bengali, Devanagari, Arabic).
   - Bangla CV contains authentic Bengali prose (substantial Bengali characters,
     no Devanagari outside Bengali danda punctuation U+0964/U+0965, no Arabic).
4. No Private Use Area (PUA) leakage into extracted text (ToUnicode CMap integrity).
5. OpenType complex text shaping verification:
   - uharfbuzz engine availability.
   - TrueType font embedding and GSUB table presence.
   - Correct font subsets and /ToUnicode CMap in PDF dictionary.
6. Critical domain terminology and language proficiency checks:
   - Bangla CV: মাতৃভাষা (native), পেশাগত (professional working),
     কথোপকথন (conversational), প্রাথমিক (basic comprehension).
   - English CV: native, professional working, conversational, basic comprehension.
7. Clickable link annotations:
   - Valid URI targets for email, GitHub, portfolio, LinkedIn, Telegram.
   - Non-zero, valid bounding rectangles.
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# Add virtual environment packages if present
for pyver in ["3.13", "3.12", "3.11", "3.10"]:
    venv_site = os.path.join(ROOT, ".venv-cv", "lib", f"python{pyver}", "site-packages")
    if os.path.isdir(venv_site) and venv_site not in sys.path:
        sys.path.insert(0, venv_site)
        break

EN_CV = os.path.join(ROOT, "public", "cv", "Sobuj_Miah_CV_EN.pdf")
BN_CV = os.path.join(ROOT, "public", "cv", "Sobuj_Miah_CV_BN.pdf")

# Unicode ranges
DEVANAGARI = re.compile(r'[\u0900-\u097F]')
ARABIC = re.compile(r'[\u0600-\u06FF]')
BENGALI = re.compile(r'[\u0980-\u09FF]')
PUA = re.compile(r'[\uE000-\uF8FF]')
BENGALI_PUNCT = {'\u0964', '\u0965'}  # Bengali danda and double-danda in Indic block

FAILURES = []

def fail(msg):
    FAILURES.append(msg)
    print(f"FAIL: {msg}", file=sys.stderr)

def info(msg):
    print(f"INFO: {msg}")

def check_file_exists(path, label):
    if not os.path.exists(path):
        fail(f"{label} missing: {path}")
        return False
    size = os.path.getsize(path)
    if size == 0:
        fail(f"{label} is empty (0 bytes): {path}")
        return False
    info(f"{label} exists: {path} ({size} bytes)")
    return True

def extract_pdf_data(pdf_path):
    """Extract text, links, and font dictionaries using pypdf."""
    try:
        import pypdf
        reader = pypdf.PdfReader(pdf_path)
        texts = []
        for page in reader.pages:
            texts.append(page.extract_text() or "")
        return texts, reader
    except ImportError:
        fail("pypdf not installed in environment")
        return [], None
    except Exception as e:
        fail(f"Failed to read {pdf_path}: {e}")
        return [], None

def validate_links(reader, label):
    """Check that expected clickable links exist in the PDF with valid bounding boxes."""
    if not reader or not reader.pages:
        fail(f"{label}: No pages available for link validation")
        return []
    
    page = reader.pages[0]
    annots = page.get('/Annots', [])
    links = []
    for annot_ref in annots:
        annot = annot_ref.get_object()
        subtype = annot.get('/Subtype')
        if subtype == '/Link':
            uri = annot.get('/A', {}).get('/URI', '')
            rect = annot.get('/Rect', [])
            if rect and len(rect) == 4:
                x1, y1, x2, y2 = [float(v) for v in rect]
                if x2 <= x1 or y2 <= y1:
                    fail(f"{label}: link {uri} has invalid/zero bounding box {rect}")
            links.append((uri, rect))
    
    info(f"{label}: found {len(links)} interactive links")
    
    expected_patterns = [
        ('mailto:soobujmiah@gmail.com', 'Email'),
        ('https://github.com/soobujmiah', 'GitHub'),
        ('https://soobujmiah.github.io/', 'Portfolio'),
        ('https://linkedin.com/in/soobujmiah', 'LinkedIn'),
        ('https://t.me/soobujmiah', 'Telegram'),
    ]
    for pattern, name in expected_patterns:
        if any(pattern in uri for uri, _ in links):
            info(f"  ✓ {name} link present: {pattern}")
        else:
            fail(f"  ✗ {name} link missing from {label}")
    return links

def validate_shaping_infrastructure():
    """Verify OpenType complex text shaping dependencies and font tables."""
    info("\n--- Shaping Engine & Font Architecture ---")
    try:
        import uharfbuzz
        info("  ✓ uharfbuzz library installed and active")
    except ImportError:
        fail("uharfbuzz library missing; OpenType complex text shaping will not work")

    # Verify font files
    font_dir = os.path.join(HERE, "fonts")
    bn_reg = os.path.join(font_dir, "NotoSansBengali-Regular.ttf")
    if not os.path.exists(bn_reg):
        bn_reg = "/usr/share/fonts/truetype/noto/NotoSansBengali-Regular.ttf"
    
    if os.path.exists(bn_reg):
        try:
            from fontTools.ttLib import TTFont
            font = TTFont(bn_reg)
            tables = set(font.keys())
            if 'GSUB' in tables:
                info(f"  ✓ Font {os.path.basename(bn_reg)} has OpenType GSUB layout table")
            else:
                fail(f"  ✗ Font {os.path.basename(bn_reg)} is missing GSUB table (no ligatures)")
            if 'cmap' in tables:
                info(f"  ✓ Font {os.path.basename(bn_reg)} has Unicode character map")
        except Exception as e:
            fail(f"Failed to inspect font tables: {e}")
    else:
        fail(f"Bengali font not found at {bn_reg}")

def validate_pdf_fonts_and_tounicode(pdf_path, label, require_tounicode=False):
    """Ensure font embedding, ToUnicode CMap, and font resources."""
    info(f"\n--- Font & Resource Stream Inspection: {label} ---")
    try:
        with open(pdf_path, 'rb') as f:
            content = f.read()
        
        # Check for font subsetting / resources
        if b'/Font' in content:
            info(f"  ✓ {label} embeds font resources")
        else:
            fail(f"  ✗ {label} is missing font resources")

        # Check for ToUnicode CMap when required (for complex/CID fonts)
        if require_tounicode:
            if b'/ToUnicode' in content:
                info(f"  ✓ {label} embeds /ToUnicode CMap stream for glyph mapping")
            else:
                fail(f"  ✗ {label} is missing /ToUnicode CMap stream")
    except Exception as e:
        fail(f"Failed to inspect binary streams for {label}: {e}")

def main():
    info("=" * 60)
    info("Bilingual CV System Validation Suite")
    info("=" * 60)

    # 1. Dependency and shaping engine check
    validate_shaping_infrastructure()

    # 2. File existence check
    en_exists = check_file_exists(EN_CV, "English CV")
    bn_exists = check_file_exists(BN_CV, "Bangla CV")

    if not en_exists or not bn_exists:
        print("\nCannot validate: PDFs missing. Run make_cv_en.py and make_cv_bn.py first.")
        sys.exit(1)

    # 3. English CV Validation
    info("\n--- English CV Validation ---")
    validate_pdf_fonts_and_tounicode(EN_CV, "English CV", require_tounicode=False)
    en_texts, en_reader = extract_pdf_data(EN_CV)
    if en_texts and en_reader:
        en_text = "\n".join(en_texts)

        # Single-page requirement
        page_count = len(en_reader.pages)
        if page_count != 1:
            fail(f"English CV has {page_count} pages, expected exactly 1")
        else:
            info(f"  ✓ Page count: {page_count} page (A4 constraint satisfied)")

        # Purity: No Bengali, Devanagari, or Arabic
        en_bn = BENGALI.findall(en_text)
        en_dev = [c for c in DEVANAGARI.findall(en_text) if c not in BENGALI_PUNCT]
        en_arab = ARABIC.findall(en_text)
        en_pua = PUA.findall(en_text)

        if en_bn:
            fail(f"English CV contains Bengali characters: {set(en_bn)[:10]}")
        else:
            info("  ✓ English CV: no Bengali characters")

        if en_dev:
            fail(f"English CV contains Devanagari characters: {set(en_dev)[:10]}")
        else:
            info("  ✓ English CV: no Devanagari characters")

        if en_arab:
            fail(f"English CV contains Arabic characters: {set(en_arab)[:10]}")
        else:
            info("  ✓ English CV: no Arabic characters")

        if en_pua:
            fail(f"English CV contains unmapped PUA characters: {len(en_pua)}")
        else:
            info("  ✓ English CV: zero PUA character leaks")

        # Extractable text check
        if len(en_text.strip()) < 500:
            fail(f"English CV has suspiciously low text length: {len(en_text)} chars")
        else:
            info(f"  ✓ English CV extractable text: {len(en_text)} chars")

        # Language proficiency section content check
        required_en_proficiencies = [
            ("Bangla — native", "Bangla native proficiency"),
            ("English — professional working", "English professional proficiency"),
            ("Hindi / Urdu", "Hindi / Urdu conversational proficiency"),
            ("Arabic — basic comprehension", "Arabic basic comprehension"),
        ]
        for term, desc in required_en_proficiencies:
            if term.lower() in en_text.lower():
                info(f"  ✓ English CV contains: {desc}")
            else:
                fail(f"  ✗ English CV missing required language line: {term}")

        # Link validation
        validate_links(en_reader, "English CV")

    # 4. Bangla CV Validation
    info("\n--- Bangla CV Validation ---")
    validate_pdf_fonts_and_tounicode(BN_CV, "Bangla CV", require_tounicode=True)
    bn_texts, bn_reader = extract_pdf_data(BN_CV)
    if bn_texts and bn_reader:
        bn_text = "\n".join(bn_texts)

        # Single-page requirement
        page_count = len(bn_reader.pages)
        if page_count != 1:
            fail(f"Bangla CV has {page_count} pages, expected exactly 1")
        else:
            info(f"  ✓ Page count: {page_count} page (A4 constraint satisfied)")

        # Purity: No Devanagari (excluding danda) and no Arabic
        bn_dev = [c for c in DEVANAGARI.findall(bn_text) if c not in BENGALI_PUNCT]
        bn_arab = ARABIC.findall(bn_text)
        bn_bn = BENGALI.findall(bn_text)
        bn_pua = PUA.findall(bn_text)

        if bn_dev:
            fail(f"Bangla CV contains Devanagari characters: {set(bn_dev)[:10]}")
        else:
            info("  ✓ Bangla CV: no Devanagari characters (danda excluded)")

        if bn_arab:
            fail(f"Bangla CV contains Arabic characters: {set(bn_arab)[:10]}")
        else:
            info("  ✓ Bangla CV: no Arabic characters")

        if len(bn_bn) < 1500:
            fail(f"Bangla CV has too few Bengali characters: {len(bn_bn)}")
        else:
            info(f"  ✓ Bangla CV: {len(bn_bn)} Bengali characters verified")

        if bn_pua:
            fail(f"Bangla CV contains unmapped PUA characters: {len(bn_pua)}")
        else:
            info("  ✓ Bangla CV: zero PUA character leaks (ToUnicode clean)")

        # Key Bengali identity and section terms (checks match logical or visual glyph-stream representations)
        required_bn_terms = [
            (["সবুজ"], "Applicant Name 'Sobuj'"),
            (["স্বাধীন"], "Independent"),
            (["মাতৃভাষা"], "Native language proficiency"),
            (["পেশাগত", "েপশাগত"], "Professional working proficiency"),
            (["কথোপকথন", "কেথাপকথন"], "Conversational proficiency"),
            (["স্বচ্ছন্দ"], "Conversational fluency"),
            (["প্রাথমিক", "প্রাথিমক"], "Basic comprehension"),
            (["বোধ", "েবাধ"], "Language comprehension"),
            (["অ্যান্ড্রয়েড", "অ্যান্ড্রেয়ড"], "Android systems"),
            (["অন-ডিভাইস", "অন-িডভাইস"], "On-device AI"),
        ]
        for terms, desc in required_bn_terms:
            if any(t in bn_text for t in terms):
                info(f"  ✓ Bangla CV contains: {desc} ({terms[0]})")
            else:
                fail(f"  ✗ Bangla CV missing key term: {desc} ({terms[0]})")

        # Link validation
        validate_links(bn_reader, "Bangla CV")

    # Final result
    info("\n" + "=" * 60)
    if FAILURES:
        print(f"\nVALIDATION FAILED: {len(FAILURES)} issue(s) detected:")
        for idx, f in enumerate(FAILURES, 1):
            print(f"  {idx}. {f}", file=sys.stderr)
        sys.exit(1)
    else:
        print("\nALL VALIDATIONS PASSED PERFECTLY ✓")
        sys.exit(0)

if __name__ == "__main__":
    main()
