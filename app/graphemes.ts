/* ═══════════════════════════════════════════════════════════════
   GRAPHEME SEGMENTATION

   The signature name animates one glyph at a time. Splitting Bengali
   text by code point would tear clusters apart — `মি` is base
   consonant + pre-base vowel sign, and `ক্ষ` is a conjunct — and the
   renderer would produce broken glyphs mid-animation.

   `Intl.Segmenter` with `granularity: 'grapheme'` handles this
   correctly wherever it exists. The fallback walks code points and
   attaches combining marks (U+09BC nukta, U+09BE–U+09CD matras and
   signs, plus the length marks) to the cluster they modify.

   Pure logic, no React — so `scripts/check-units.mjs` can compile and
   test it directly, including the fallback path.
   ═══════════════════════════════════════════════════════════════ */

const COMBINING = /[\u09BC\u09BE-\u09CD\u09D7\u09E2\u09E3]/;

export function segmentGraphemes(text: string): string[] {
  try {
    const Seg = (
      Intl as unknown as {
        Segmenter?: new (l?: string, o?: object) => { segment(s: string): Iterable<{ segment: string }> };
      }
    ).Segmenter;
    if (typeof Seg === 'function') {
      const seg = new Seg('bn', { granularity: 'grapheme' });
      const out: string[] = [];
      for (const part of seg.segment(text)) out.push(part.segment);
      if (out.length > 0) return out;
    }
  } catch {
    /* fall through to the manual splitter */
  }
  const out: string[] = [];
  for (const ch of Array.from(text)) {
    if (out.length > 0) {
      const prev = out[out.length - 1];
      /* A combining mark always belongs to the cluster before it, and a
         consonant that follows a virama (U+09CD) is the second half of a
         conjunct — ক + ্ + ষ is one glyph, so it must be one cluster. */
      if (COMBINING.test(ch) || prev.endsWith('\u09CD')) {
        out[out.length - 1] = prev + ch;
        continue;
      }
    }
    out.push(ch);
  }
  return out;
}
