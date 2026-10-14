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

The 2026-10-14 rebuild replaced the motion tokens outright. Nine groups
(page turn, reveal, magnetic, tilt, depth, count-up, camera drift, signature,
pull-to-refresh) described a stack of coexisting animation systems; the site
now has one moving thing, so there are four groups. `check-units.mjs` asserts
each retired group is gone, so a half-finished revert cannot leave both
vocabularies in the file at once. The colour tokens are unchanged: they are
the canonical ecosystem palette and ARMS, Ternux and ADT inherit them.

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
    "flight": {
      "depth": 1.5,
      "lateral": 1.05,
      "lift": 1.05,
      "roll": 1.2
    },
    "parallax": {
      "lateral": 1.5,
      "lift": 0.9
    },
    "settle": {
      "seconds": 0.72,
      "ease": "cubic-bezier(0.16, 1, 0.3, 1)",
      "staggerSeconds": 0.05
    },
    "input": {
      "lockMs": 900,
      "wheelDelta": 24,
      "swipePx": 60
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

**There is no card.** In the eight chapters, separation comes from a single
hairline rule (`--border`, 7% white), indentation and leading. Nothing is
enclosed, nothing is blurred, nothing is translucent over the environment:
`backdrop-filter` is gate-banned from the new surface area, because stacking
translucent plates over a live background is what made the previous build
read as overlapping layers rather than one place.

- A label sits **on** a hairline: `.block-label` carries a green-tinted rule
  (26% accent) under it; `.row` and `.record-title` use the neutral hairline.
- `--card` survives as a token for the service and verification documents and
  for inheriting project sites, which are long-form pages rather than strata.
- The chrome (`--chrome`) is a flat surface with a 1px top or bottom rule. It
  does not blur what passes behind it.

## 3. Typography

- Latin/UI: Inter (`--font-inter`). Bangla: **Noto Sans Bengali**
  (`--font-bengali`), loaded as a real webfont through `next/font/google`.
- Mono/labels/eyebrows/counters: JetBrains Mono (`--font-mono`).
- Display (hero name, page `h1`/`h2`): **Instrument Serif** (`--font-serif`,
  400, Latin) for an editorial, film-title tone. Bengali headings use
  **Noto Serif Bengali** (`--font-serif-bn`, 500/600), never negative
  tracking. Retired: Space Grotesk, Chakra Petch, Anek Bangla.
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

One reading column, one gutter, one gauge. The tokens live in
`app/globals.css :root` next to the colours:

| Token | Value | What it is |
|---|---|---|
| `--measure` | `64ch` | the reading column; prose never exceeds it |
| `--gutter` | `clamp(18px, 5vw, 56px)` | the page gutter, phone → desktop |
| `--rail-width` | `232px` | the depth gauge's column (desktop only) |
| `--head-height` / `--foot-height` | `52px` / `46px` | the chrome the chapter page sits between |

- The chapter is the only scroller. It never clips, truncates or shrinks
  content to preserve a composition.
- Desktop reserves the right field for the depth gauge; below `900px` the
  gauge becomes one strip of ticks above the footer.
- Hierarchy comes from **indentation, leading and one hairline rule**. There
  are no cards, no rounded panels, no translucent plates and no blurred
  surfaces anywhere in the chapters — that vocabulary is what made the
  previous build read as stacked layers.

## 5. Motion language

There is **one** moving thing: the camera travelling into the machine.
Everything else is the text settling after it. The token block has four
groups and no more.

- **Flight** (`MOTION.flight`) — the camera's four axes, critically damped:
  depth `1.5s`, lateral/lift `1.05s`, roll `1.2s`. Depth is deliberately the
  slowest: entering a stratum must read as travel, not as a cut. A retarget
  mid-flight inherits velocity, so paging again bends the path instead of
  snapping it.
- **Input** (`MOTION.input`) — `lockMs: 900`, so one wheel tick, swipe or
  arrow press is worth exactly one stratum; `wheelDelta: 24` ignores trackpad
  jitter; `swipePx: 60` requires a deliberate gesture. Gestures yield to the
  chapter's own scroller until its edges.
- **Settle** (`MOTION.settle`) — `0.72s cubic-bezier(0.16, 1, 0.3, 1)`, one
  entrance per chapter with a `0.05s` stagger between the head and the body.
  It is a CSS animation keyed on the stratum, so it costs no JavaScript.
- **Parallax** (`MOTION.parallax`) — a small camera nudge from the pointer,
  fine pointers only. Touch never gets it: a finger is already the thing
  being tracked.

Rules that outlive any particular number:

- Animate **transform and opacity only**.
- No animation library. The site ships none; the camera is rAF over damped
  scalars, the settle is CSS.
- `prefers-reduced-motion`: no animation loop at all — one static frame per
  stratum, no settle, no transitions. Reduced motion removes animation, never
  functionality.

## 5b. The identity

The canonical name — `Sobuj Miah` / `সবুজ মিয়া` — is the first stratum's
heading, and it is **real DOM text in the page's only `h1`**
(`h1.chapter-heading.chapter-heading--name`), set in Instrument Serif
(Noto Serif Bengali for Bangla).

It is **one element**, not a per-grapheme construction. The retired build
split it into animated cluster boxes with a travelling gleam; that machinery,
its `.sig-*` classes and its near-white `#86efac` ink are gate-banned by
`check-design.mjs` and `check-build.mjs`, which also assert the `h1` reads
exactly the canonical name as plain text.

Bengali is still first-class, and `app/graphemes.ts` still exists with its
unit checks: the name is set as one line, so its conjuncts (`ক্ষ`, `স্ট্র`)
and matra-carrying consonants (`মি`, `বু`, `য়া`) must never be split by
tracking or by a line break. `body.lang-bn` collapses the tracking for
exactly that reason.

## 6. Interaction states

| State | Treatment |
|---|---|
| Hover | colour only — a link's ink and underline move to `--accent-bright`; nothing lifts, scales or glows |
| Focus | `:focus-visible` — 1px `--accent-bright` outline, 3px offset |
| Current chapter | the rail tick keeps the accent border, index and full-strength ink; its geometry never changes, so the gauge never re-centres |
| State marks | `◆` filled for verified/live/now, `◇` hollow for experimental/investigating, `·` for neutral. Colour is information here and nowhere else |

The custom cursor is gone: the site uses the system cursor, and
`cursor: none` no longer appears in the stylesheet.

## 7. Link language (shared across the ecosystem)

Every outbound reference in the site is one component, `Ref`
(`components/record.tsx`): mono, underlined with a green underline, with a
trailing `↗` for external targets and `→` for internal routes. There are no
buttons, pills or plain anchors competing with it.

| Element | Meaning | Destination |
|---|---|---|
| `Ref` with `↗` | leaves the site | an external URL; `rel="noreferrer noopener"`, new tab |
| `Ref` with `→` | stays in the site | a real static route |
| `Ref strong` | the one reference a chapter wants read first | e.g. `Explore my work`, a contact channel |
| `liveSiteWord` / `repoWord` | a verified live site / its source | `websiteUrl` — set **only** for repos with a verified live site, never fabricated — and `repo` |

## 8. Navigation philosophy

- **The navigation is the instrument.** The depth rail
  (`components/DepthRail.tsx`) is a gauge: eight ticks, the current stratum
  lit, the ones ahead still legible so the reader can see there is more
  machine below. There is no overlay, no dialog and no second navigation
  system — the previous build's HUD panel was a surface on top of the page,
  which is precisely the layering this rebuild removed.
- **Every chapter is a real route.** `/`, `/presence/`, `/about/`,
  `/workstation/`, `/work/`, `/research/`, `/experience/`, `/contact/` are
  static pages with their own server-rendered HTML, title, description,
  canonical URL and social card. The journey is the *presentation*; the route
  is the *address*. Every rail tick is a real anchor, so it works with
  JavaScript disabled, is crawlable, and middle-clicks into a new tab.
  Legacy `#work`-style links are rewritten on load; `/stack/` and
  `/open-source/` remain canonicalized entry routes.
- **Depth, not pages.** Wheel, swipe, arrows, `PageUp`/`PageDown`,
  `Home`/`End` and the rail all do one thing: change the stratum. Input
  yields to the chapter's inner scroller until its edges, then goes deeper.
  Horizontal gestures are never paging (dominant-axis detection).
- **Where am I** is answered twice, in the document itself: the chapter's
  depth line (`04 / 08 · Userland`) and the rail's head (`Depth 04/08`).
  Nothing floats over the page to say it.
- Back/forward move the camera, not just the address bar.

## 9. The stage — inside one device

The eight chapters are eight **strata** of one machine, and the reader travels
into it along the depth axis. `components/stage-scene.ts` (Three.js, loaded
only after a successful WebGL probe) is the one renderer;
`components/StageFallback.tsx` draws the same strata from the same numbers in
Canvas 2D when WebGL is unavailable; `app/globals.css` carries a gradient so
the no-JavaScript page still has depth. All of it is procedural: no model, no
texture, no stock raster or video ships, ever.

Two rules are load-bearing, and both are machine-checked:

1. **One subject.** A chapter changes the camera and what is emphasised. It
   may never introduce a second environment. `check-design.mjs` allows
   exactly one module to import `three` and exactly one `<Stage>` mount.
2. **The world tells the truth.** The marks etched into the strata are the
   verification state, distributed from `app/verification-summary.json` — the
   same projection the footer's proof line and `/verification/` read. A
   failing machine check is a visibly dark mark. The scene cannot flatter the
   work.

Full architecture, camera maths, quality policy and budgets:
[`docs/STAGE.md`](docs/STAGE.md).

## 10. Accessibility

- Full keyboard operation: `ArrowUp`/`ArrowDown`, `PageUp`/`PageDown`,
  `Home`/`End` move between strata, and chunk-scroll the chapter first while
  it still has text in that direction. Every rail tick is a real link, so
  `Tab` reaches all eight and `Enter` works. Keys are ignored while focus is
  in a form control.
- The chapter is the page's `<main>`, labelled with the chapter's own name;
  the depth rail is a `<nav>` labelled "Depth"; the environment is
  `aria-hidden`.
- Real markup for real structure: label → value pairs are a `<dl>`, the rail
  is an `<ol>`, the current tick carries `aria-current="page"`. A crawler and
  a screen reader get the structure, not a visual convention.
- State marks are `aria-hidden` glyphs: the state is always also in the
  text (`Verified`, `Experimental`, the status label), never colour alone.
- Readable contrast on all text; touch targets ≥ 32px.
- Reduced-motion support as specified in §5 — it removes animation, never
  functionality.

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
                         the depth rail and the build validators
app/stage.ts             the stage's pure maths: strata, stations, camera
                         flight, quality policy, presence, evidence marks
app/content.ts           bilingual copy + curated structure
app/language.tsx         provider, persistence, digit localization, title sync
app/graphemes.ts         Bengali-safe grapheme segmentation
app/verification.ts      the generated evidence projection (+ summary JSON)
app/(en)/ app/(bn)/      the routes; home, chapters, services, verification
app/robots.ts            robots.txt
app/sitemap.ts           sitemap.xml, one line per route
app/globals.css          tokens (§1), stage, journey, record system, type,
                         documents, reduced motion — in that order
components/Journey.tsx   the host: input → one depth change, URL sync
components/Stage.tsx     the one environment host (probe, lazy load, pause)
components/stage-scene.ts the only module that imports three.js
components/StageFallback.tsx the same machine in Canvas 2D, no WebGL
components/record.tsx    the typographic system (§5b, §6, §7)
components/chapters.tsx  the eight chapters, built only from content.ts
components/DepthRail.tsx the navigation, which is the depth gauge (§8)
components/chrome.tsx    one masthead + one footer for the whole site
scripts/check-content.mjs        bilingual parity + two-way purity gate
scripts/check-purity-adversarial.mjs  adversarial purity suite
scripts/check-design.mjs         token/document/CSS drift + one-subject gate
scripts/check-units.mjs          100 logic checks (stage, tokens, routing,
                                 segmentation, digits)
scripts/check-build.mjs          routes, deep links, SEO assets, JS budget
scripts/check-verification.mjs   the evidence registry and its copy
docs/STAGE.md            the shipped architecture, in full
```

This layer requires no animation library, no hosted asset and no paid
service. The only runtime dependency the environment adds is `three`, and it
is loaded lazily, after a successful WebGL probe, by exactly one module.
