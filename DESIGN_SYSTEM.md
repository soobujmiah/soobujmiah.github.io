# Sobuj Miah — Brand Design System

The portfolio (`soobujmiah.github.io`) is the **root of a visual ecosystem**.
Future repository websites (project deep-dives) must feel like members of the
same family: **same brand → different context**.

- **Portfolio** — cinematic, curated, immersive, narrative. Answers *who*,
  *strongest areas*, *selected work*, *evidence*, *now building*.
- **Project site** — technical, detailed, documentation-oriented. Answers
  *what, why, architecture, implementation, tests, evidence, limitations,
  roadmap, source*.

Core brand consistency always wins over per-site decoration.

## 0. The tokens are machine-checked

Everything below is generated from `app/design-tokens.ts` and verified by
`scripts/check-design.mjs` on every build. That script also compares
`app/globals.css :root` and the browser `themeColor`, and **fails the build**
if any of the three disagree.

This exists because they previously *did* disagree: the documentation
advertised a page-turn spring of `170/27/0.9` with `±7%` / `rotateX ±5°` /
`perspective 1400`, while the shipped component used `140/22/1.0`, `±6%`,
`±3.5°`, `perspective 1800`. Any project site inheriting the prose would have
silently drifted from the portfolio. The values below are the **shipped**
values; the prose was corrected to match, not the other way round.

### Token block (source of truth)

A project site may import `app/design-tokens.ts` directly, or copy the block
below verbatim. Both stay correct — the gate guarantees it.

<!-- design-tokens:start -->
```json
{
  "brand": {
    "bg": "#050507",
    "fg": "#e4e2df",
    "muted": "rgba(228,226,223,0.45)",
    "border": "rgba(228,226,223,0.07)",
    "accent": "#22c55e",
    "accentBright": "#4ade80",
    "accentGlow": "rgba(34,197,94,0.18)",
    "signal": "#10b981",
    "cardBg": "rgba(6,7,6,0.66)",
    "chrome": "#060608"
  },
  "pageTurn": {
    "spring": {
      "stiffness": 140,
      "damping": 22,
      "mass": 1
    },
    "yPercent": 6,
    "rotateX": 3.5,
    "scale": 0.99,
    "perspective": 1800,
    "opacitySeconds": 0.4,
    "flipLockMs": 1000
  },
  "reveal": {
    "seconds": 0.7,
    "ease": "cubic-bezier(0.16, 1, 0.3, 1)"
  },
  "magnetic": {
    "followSeconds": 0.12,
    "releaseSeconds": 0.5,
    "pressSeconds": 0.1
  },
  "canvas": {
    "maxDpr": 1.5
  },
  "name": {
    "decodeSeconds": 1.5,
    "lockSeconds": 0.55,
    "lockStaggerSeconds": 0.065,
    "pointerRadiusPx": 130,
    "pointerMaxShiftPx": 5,
    "fragmentsPerGlyph": 5,
    "maxFragments": 72,
    "fragmentLifeTicks": 34,
    "fragmentCooldownMs": 150
  },
  "pullToRefresh": {
    "armPx": 12,
    "thresholdPx": 76,
    "resistance": 2.2,
    "maxPx": 118
  }
}
```
<!-- design-tokens:end -->

## 1. Brand tokens (`app/globals.css :root`)

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#050507` | page/canvas base — near-black, green-tinted |
| `--fg` | `#e4e2df` | primary text — warm off-white, never pure white |
| `--muted` | `rgba(228,226,223,0.45)` | secondary text |
| `--border` | `rgba(228,226,223,0.07)` | hairlines |
| `--accent` | `#22c55e` | brand green — CTAs, active states, key numerals |
| `--accent-bright` | `#4ade80` | bright green — small labels, glows, live states |
| `--accent-glow` | `rgba(34,197,94,0.18)` | soft green wash |
| `--signal` | `#10b981` | deep green — gradient end, variety |
| `--card` | `rgba(6,7,6,0.66)` | card surface over the live background |
| `--green-soft/mid` | `8% / 15%` green | tinted surface washes |
| `--chrome` | `#060608` | header/footer surface — the only slightly bluer black |

**Rule:** dark, premium, technical, controlled. The accent must stay
recognizable but never flood the interface — no neon cyberpunk.

## 2. Surfaces & borders

- Cards: 12px radius (`rounded-xl`), 1px border at 8–10% white, translucent
  fill (`--card`) + backdrop blur so the living background shows through.
- Accent surfaces (now-building, route cards): 1px border at 20–35% green,
  6–7% green fill.
- Separation comes from **depth** (layering, blur, vignette) more than from
  heavy borders.

## 3. Typography

- Latin/UI: Inter (`--font-inter`). Bangla: **Noto Sans Bengali**
  (`--font-bengali`), loaded as a real webfont through `next/font/google`.
- Mono/labels/eyebrows/counters: JetBrains Mono (`--font-mono`).
- Eyebrow: 10px mono, uppercase, `tracking-[0.3em]`, accent color.
- Headings: tight (`tracking-tight`, leading 1.1–1.12), fluid `clamp()`.
- Body: 13–14px, relaxed leading (1.7–1.75), 55–65% white.
- Counters: `tabular-nums`; rendered in the active script via
  `localizeDigits()`.

### Bangla typography (deliberate, not a fallback)

Bengali metrics are not Latin metrics. When `body.lang-bn` is active:

- font stack becomes `--font-bengali` first — **including the mono slots and
  page numerals**, which were previously Inter and therefore rendered Bengali
  digits in a font with no Bengali coverage;
- line-height opens to `1.85` for body copy and `1.34` for headings, because
  matras above and descenders below clip at Latin leading;
- all letter-spacing collapses to ≤ `0.01em` — wide tracking breaks Indic
  shaping and can split conjuncts;
- `overflow-wrap: break-word` so long Bengali compounds wrap instead of
  overflowing narrow viewports.

Bengali numerals are used inside Bangla prose. Latin stays Latin inside the
English tree. Neither language borrows the other's script.

## 4. Spacing & layout

- Page padding: desktop `92px / 76px`, mobile `80px / 108px`.
- Content width: `max-w-5xl` (64rem); dense pages `max-w-6xl` (72rem).
- Card padding `p-4 / sm:p-5`; section gaps scale down on small screens.
- Breakpoints: `sm / md / lg` + `min-[1400px]`; short-height queries compact
  type/padding instead of clipping.
- Desktop editorial pattern: heading rail + content column. Dense collections:
  fitted grids on desktop, snap carousels below `lg`, accordion below `md`.

## 5. Motion language

- **Page turn** (portfolio): direction-aware spring on `y`, `rotateX` and
  `scale`, with a `1000ms` flip lock — one gesture, one page. Restrained:
  felt, not noticed. Values are in the token block.
- Reveals: `0.7s cubic-bezier(0.16, 1, 0.3, 1)` fade-up; pages remount, so
  reveals replay on each entry.
- Micro: 0.1–0.5s; magnetic links ease-out 0.12s, release 0.5s expo.
- Environment responds to paging: the map drifts on a 150s cycle at a fixed
  rate, progress bar springs forward, and the name takes one short *local*
  decode pulse (never a full replay).
- Animate **transform + opacity only** (compositor-friendly). The fragment
  canvas is capped in DPR (≤1.5), fragment count and lifetime, and stops
  entirely when nothing is disturbed.
- `prefers-reduced-motion`: instant transitions, a fully static environment,
  no auto-advance, no glitch loops, and the signature name becomes a calm
  static mark. Reduced motion removes animation, never functionality.

## 5b. Signature name (`components/SignatureName.tsx`)

The identity mark is the portfolio's centrepiece and follows its own rules.
**The letters are the living object** — every effect is glyph-local.

- **Concept** — `digital signal → diffusion → reconstruction → stable
  identity`. A disturbed letter fades and drifts, hands over to Matrix-style
  glyph fragments drawn *inside its own box*, then intelligently settles back
  into exact typography.
- **Nothing sweeps across the name.** There is no full-width overlay, no scan
  bar, no panel and no light flash. Idle life is per-glyph (`sigSignal`, a slow
  signal travelling letter to letter, colour/opacity only).
- **Legibility first.** The real name is always real DOM text in the correct
  font, selectable, painted *above* the fragment canvas (canvas `z-index: 0`,
  glyphs `z-index: 1`). The canvas can never obscure it, and a dissolving glyph
  only ever dips to ~32% opacity while its own fragments stand in.
- **Grapheme-safe.** Clusters are produced by `Intl.Segmenter`, with a
  combining-mark-aware fallback, so Bengali conjuncts and matras (`মি`, `ক্ষ`)
  are never split. Splitting them by code point would corrupt the shaping.
- **Bounded cost.** One canvas sized to the name, DPR ≤1.5, a hard cap of 72
  live fragments, per-glyph spawn cooldown, and an rAF loop that stops itself
  the moment nothing is disturbed. The pointer writes CSS custom properties
  (`--sx`, `--sy`, `--d`) and never re-renders React.
- **Interaction states** — reveal (per-letter stabilisation out of its own
  fragments), idle (glyph-local breathing), pointer proximity (local
  diffusion that converges back), tap/drag (localised disturbance and a
  rate-limited trail), page change (a short *local* decode pulse on a few
  letters, never a full replay), and recovery (pointer leave, cancel, up,
  blur, resize and tab-hide all reset every glyph).
- **Palette** — green family only: `--accent`, `--accent-bright`, `--signal`,
  and a single adjacent emerald. No near-white, no cyan, no rainbow.
- Matrix influence is carried by **motion language**, not by rain: the fragment
  set is digits plus a few katakana.

## 6. Interaction states

| State | Treatment |
|---|---|
| Hover | subtle lift (`translateY(-2..-4px)`), border brightening, glow |
| Press | compression (`scale(0.95–0.96)`) on buttons and magnetic links |
| Focus | visible green outline (`:focus-visible`, 2px + 3px offset) |
| Active nav | accent dot stretches + glows; tabs get accent border + wash |
| Disabled | `opacity-25`, no pointer events |

## 7. Link language (shared across the ecosystem)

| Element | Meaning | Destination |
|---|---|---|
| `Explore ↗` pill | verified project/demo website | `websiteUrl` — set **only** for repos with a verified live site, never fabricated |
| Arrow icon button | source repository | `repo` (aria: `{name} {repoWord}`) |
| `Code ↗` text | source repository (compact rows) | `repo` |
| GitHub route card | everything else | profile URL (single route, not a directory) |

External links: `target="_blank" rel="noreferrer"`. When a project gains its
own website, the portfolio exposes it through the existing `websiteUrl` slot —
no model change needed.

## 8. Navigation philosophy

- Portfolio: discrete pager — wheel ticks, vertical swipes, arrows/PageUp/
  PageDown/Home/End, dots, nav links, and the section index overlay.
- **Every section is a real route.** `/`, `/presence/`, `/about/`, `/work/`,
  `/research/`, `/stack/`, `/open-source/`, `/experience/`, `/contact/` are
  static pages with their own server-rendered HTML, title, description,
  canonical URL and social card. The pager is the *presentation*; the route is
  the *address*. Legacy `#work`-style links are rewritten on load.
- The **index overlay** opened from the pager control is a view onto the same
  sections, not a second navigation system. It is a
  `role="dialog" aria-modal="true"` with focus moved to the current row, focus
  returned to the trigger on close, Escape/backdrop close, arrow/Home/End
  movement, and a Tab trap. Rows are real anchors, so middle-click and crawlers
  work even though a normal click drives the pager.
- Pages center when they fit and **scroll internally** when they don't.
  Gestures yield to the inner scroller until its edges, then turn the page.
  Never clip, truncate, or shrink content to preserve composition.
- Horizontal gestures always belong to carousels; vertical paging never fights
  them (dominant-axis detection).
- **Pull-to-refresh** exists only at the genuine top of the site (first
  section, inner scroller at `scrollTop 0`), requires an intentional vertical
  pull, and performs a real `location.reload()`. On every other section a
  downward pull keeps its original meaning — turn back one page.

## 9. Background & atmosphere

A **dark, deep-green global map** (`components/WorldMap.tsx`): Natural Earth
1:110m land contours in a Miller projection, cropped to the inhabited
latitudes and simplified by `tools/make-worldmap.py`. It is an environment,
not a spectacle.

Rules, so this never drifts back:

- **No grid.** There is no graticule, no tiling, no box or square motif and no
  repeating geometric overlay anywhere behind the hero. The previous 60px
  square grid (`.grid-bg` / `.pager-grid`) was deleted at the source.
- **No light layer.** Nothing behind the name may flash, panel, or bloom. The
  previous near-white sweep band (`.sig-sweep`) and the `#86efac` page-change
  flash were removed with their keyframes, not hidden.
- **Contours only** — land fill `rgba(16,185,129,0.055)`, coastline hairline
  `rgba(52,211,153,0.16)`. Contrast stays far below the name's.
- **Signals, not noise** — nine projected network hubs and three faint links.
  No pointer repulsion, no ripples, no scanline: the background must never
  compete with the name for attention.
- **Cost** — one inline SVG, zero canvas, zero rAF. Motion is CSS
  transform/opacity, paused via `data-paused` when the tab is hidden and
  disabled entirely under reduced motion.

## 10. Accessibility

- Full keyboard operation (paging + inner-scroll chunking + carousels +
  accordion + tabs + the index overlay), labeled scroll regions, localized
  aria throughout — in Bangla mode the accessibility labels are Bangla too.
- Readable contrast on all text; touch targets ≥ 32px (dots excepted, they are
  redundant with swipe).
- Semantic structure per page; decorative layers `aria-hidden`.
- Reduced-motion support as specified in §5.

## 11. Bilingual rules

- Every user-facing string exists in `en` and `bn` with identical keys
  (`app/content.ts`), enforced by `scripts/check-content.mjs` on every build.
- **Two-way purity, both mandatory:**
  - the EN tree contains **zero Bengali codepoints**;
  - the BN tree contains **zero Latin letters**, except a small enumerated set
    of verbatim *data* — the e-mail address, real account handles, repository
    slugs that must match the URL path, and URLs/hex values. That list is
    declared explicitly in `IDENTIFIER_PATHS` inside the gate, so the size of
    the exception is provable rather than claimed.
- Everything a visitor reads as a word is Bangla, including technology,
  company and product names (কোটলিন, গিটহাব, লামা.সিপিপি, স্ন্যাপড্রাগন) and
  section labels. Bangla prose is written natively — never
  machine-translation-style, and never patched with leftover English.
- The gate proves it can still fail: it self-tests its own predicates on every
  run, and `scripts/check-purity-adversarial.mjs` injects adversarial strings
  into copies of the real content and asserts a non-zero exit for each, with
  an unmodified control that must pass.

## 12. Project-site inheritance checklist

A future repository website should:

1. Import the token block (§0) verbatim, or copy `app/design-tokens.ts`.
2. Reuse the motion curves/springs (§5) and interaction states (§6).
3. Reuse the link language (§7) — Explore/Source/Code mean the same things.
4. Follow the a11y (§10) and bilingual (§11) rules — including two-way purity.
5. Adapt information architecture freely (docs nav, deep hierarchy).
6. Optionally add **one** project motif (e.g. a secondary accent or hero
   treatment) that coexists with — never overpowers — the core green/black
   identity, and passes contrast + reduced-motion requirements.

A project site that only wants the *values* can read them out of the token
block above. A site that wants the guarantee should import
`app/design-tokens.ts`, because `scripts/check-design.mjs` keeps that file,
this document and the CSS in agreement.

## 13. File map (portfolio implementation)

```text
app/design-tokens.ts     brand + motion tokens (machine-checked root)
app/sections.ts          the canonical section list — drives routes, sitemap,
                         the index overlay and the build validators
app/content.ts           bilingual copy + curated structure
app/language.tsx         provider, persistence, digit localization, title sync
app/page.tsx             home route (section 0)
app/[section]/page.tsx   the eight other static section routes + metadata
app/robots.ts            robots.txt
app/sitemap.ts           sitemap.xml, one line per section
app/globals.css          tokens (§1), pager, overlay, name, carousels, a11y
components/Pager.tsx     discrete pager, gestures, paper-turn, route sync
components/NavOverlay.tsx  the section index dialog
components/PullToRefresh.tsx  real mobile pull-to-refresh gesture
components/SignatureName.tsx  the hero identity mark (§5b)
components/WorldMap.tsx   dark-green global map environment (§9)
components/world-map-path.ts  generated land contours (do not edit)
tools/make-worldmap.py    regenerates the contours from Natural Earth
components/sections.tsx  the nine curated pages
components/ui.tsx        cursor, magnetic, reveals, dots, carousel, chrome
scripts/check-content.mjs        bilingual parity + two-way purity gate
scripts/check-purity-adversarial.mjs  adversarial purity suite
scripts/check-design.mjs         token/document/CSS drift gate
scripts/check-build.mjs          routes, deep links, SEO assets, JS budget
```
