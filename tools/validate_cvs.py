#!/usr/bin/env python3
"""Validation suite for the bilingual CV system.

Runs language-purity checks on generated PDFs and verifies:
- Both PDFs exist
- Both are single-page
- English CV has no Bengali/Devanagari/Arabic
- Bangla CV has no Devanagari/Arabic
- Bangla CV has substantial Bengali content
- PDFs contain text (not scanned images)
- Expected links are present
"""
import os
import re
import sys

sys.path.insert(0, "/home/sbj/soobujmiah.github.io/.venv-cv/lib/python3.13/site-packages")

EN_CV = "/home/sbj/soobujmiah.github.io/public/cv/Sobuj_Miah_CV_EN.pdf"
BN_CV = "/home/sbj/soobujmiah.github.io/public/cv/Sobuj_Miah_CV_BN.pdf"

# Unicode ranges
DEVANAGARI = re.compile(r'[\u0900-\u097F]')
ARABIC = re.compile(r'[\u0600-\u06FF]')
BENGALI = re.compile(r'[\u0980-\u09FF]')

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
    info(f"{label} exists: {path} ({os.path.getsize(path)} bytes)")
    return True

def extract_text(pdf_path):
    """Extract text from PDF using pypdf."""
    try:
        import pypdf
        reader = pypdf.PdfReader(pdf_path)
        texts = []
        for page in reader.pages:
            texts.append(page.extract_text() or "")
        return texts, reader
    except ImportError:
        fail("pypdf not installed")
        return [], None
    except Exception as e:
        fail(f"Failed to read {pdf_path}: {e}")
        return [], None

def validate_links(pdf_path, label):
    """Check that expected links exist in the PDF."""
    try:
        import pypdf
        reader = pypdf.PdfReader(pdf_path)
        page = reader.pages[0]
        annots = page.get('/Annots', [])
        links = []
        for annot_ref in annots:
            annot = annot_ref.get_object()
            subtype = annot.get('/Subtype')
            if subtype == '/Link':
                uri = annot.get('/A', {}).get('/URI', '')
                rect = annot.get('/Rect', [])
                links.append((uri, rect))
        info(f"{label}: found {len(links)} links")
        
        # Check for key links
        expected_patterns = [
            ('mailto:soobujmiah@gmail.com', 'email'),
            ('https://github.com/soobujmiah', 'github'),
            ('https://soobujmiah.github.io/', 'portfolio'),
            ('https://linkedin.com/in/soobujmiah', 'linkedin'),
            ('https://t.me/soobujmiah', 'telegram'),
        ]
        for pattern, name in expected_patterns:
            if any(pattern in uri for uri, _ in links):
                info(f"  ✓ {name} link present")
            else:
                fail(f"  ✗ {name} link missing from {label}")
        return links
    except Exception as e:
        fail(f"Link validation failed for {label}: {e}")
        return []

def main():
    info("=" * 60)
    info("CV Validation Suite")
    info("=" * 60)
    
    # Check files exist
    en_exists = check_file_exists(EN_CV, "English CV")
    bn_exists = check_file_exists(BN_CV, "Bangla CV")
    
    if not en_exists or not bn_exists:
        print("\nCannot validate: PDFs missing. Run make_cv_en.py and make_cv_bn.py first.")
        sys.exit(1)
    
    # Bengali punctuation that shares Devanagari Unicode block
    bengali_punct = {'\u0964', '\u0965'}  # danda, double danda

    # Extract and validate English CV
    info("\n--- English CV ---")
    en_texts, en_reader = extract_text(EN_CV)
    if en_texts:
        en_text = "\n".join(en_texts)
        
        # Page count
        page_count = len(en_reader.pages) if en_reader else 0
        if page_count != 1:
            fail(f"English CV has {page_count} pages, expected 1")
        else:
            info(f"English CV: {page_count} page(s) ✓")
        
        # Language purity
        en_dev = DEVANAGARI.findall(en_text)
        en_arab = ARABIC.findall(en_text)
        en_bn = BENGALI.findall(en_text)
        
        if en_dev:
            fail(f"English CV contains Devanagari: {set(en_dev)}")
        else:
            info("English CV: no Devanagari ✓")
        
        if en_arab:
            fail(f"English CV contains Arabic: {set(en_arab)}")
        else:
            info("English CV: no Arabic ✓")
        
        if en_bn:
            fail(f"English CV contains Bengali: {set(en_bn)[:20]}...")
        else:
            info("English CV: no Bengali ✓")
        
        # Check text is present (not empty/scanned)
        if len(en_text.strip()) < 100:
            fail("English CV appears to have no extractable text (possible scan/image PDF)")
        else:
            info(f"English CV: {len(en_text)} chars of text ✓")
        
        # Validate links
        validate_links(EN_CV, "English CV")
    
    # Extract and validate Bangla CV
    info("\n--- Bangla CV ---")
    bn_texts, bn_reader = extract_text(BN_CV)
    if bn_texts:
        bn_text = "\n".join(bn_texts)
        
        # Page count
        page_count = len(bn_reader.pages) if bn_reader else 0
        if page_count != 1:
            fail(f"Bangla CV has {page_count} pages, expected 1")
        else:
            info(f"Bangla CV: {page_count} page(s) ✓")
        
        # Language purity
        bn_dev = DEVANAGARI.findall(bn_text)
        bn_arab = ARABIC.findall(bn_text)
        bn_bn = BENGALI.findall(bn_text)

        # Filter out Bengali punctuation (U+0964, U+0965) from Devanagari count
        devanagari_only = [c for c in bn_dev if c not in bengali_punct]
        if devanagari_only:
            fail(f"Bangla CV contains Devanagari (excl. Bengali punctuation): {set(devanagari_only)}")
        else:
            info("Bangla CV: no Devanagari (Bengali punctuation allowed) ✓")
        
        if bn_arab:
            fail(f"Bangla CV contains Arabic: {set(bn_arab)}")
        else:
            info("Bangla CV: no Arabic ✓")
        
        # Bengali should be present
        if not bn_bn:
            fail("Bangla CV contains no Bengali text!")
        else:
            info(f"Bangla CV: {len(bn_bn)} Bengali chars ✓")
        
        # Check text is present
        if len(bn_text.strip()) < 100:
            fail("Bangla CV appears to have no extractable text")
        else:
            info(f"Bangla CV: {len(bn_text)} chars of text ✓")
        
        # Validate links
        validate_links(BN_CV, "Bangla CV")
        
        # Show sample of extracted text
        info(f"\nBangla CV text sample:\n{bn_text[:500]}")
    
    # Summary
    info("\n" + "=" * 60)
    if FAILURES:
        print(f"\nVALIDATION FAILED: {len(FAILURES)} issue(s)")
        for f in FAILURES:
            print(f"  - {f}")
        sys.exit(1)
    else:
        print("\nALL VALIDATIONS PASSED ✓")
        sys.exit(0)


if __name__ == "__main__":
    main()
