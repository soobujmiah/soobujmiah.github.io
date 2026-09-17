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
    "nameAssemble": {
      "totalSeconds": 1.6,
      "outgoingSeconds": 0.22,
      "resolveSeconds": 0.34,
      "dissolveSeconds": 0.45,
      "microPx": 0.55,
      "breathSeconds": 6.5,
      "breathWindow": 0.42,
      "breathPx": 4.5,
      "guideShare": 0.62,
      "clusterShare": 0.3,
      "jitterShare": 0.15,
      "travelShare": 0.55,
      "settleBack": 0.7,
      "disperseRadius": 1.35,
      "maxParticles": 1700,
      "sampleStepPx": 2.6,
      "maxDpr": 2
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
- Identity wordmark: **Chakra Petch** (`--font-wordmark`, 500/700, Latin
  subset) — a squared technical face, self-hosted woff2 via `next/font`, no
  runtime third-party request. Bengali falls through to `--font-bengali`.
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
- Environment responds to paging: the map camera flies to each page's
  geographic focus (~1.25s ease-in-out viewBox flight) and the progress bar
  springs forward.
- Animate **transform + opacity only** (compositor-friendly). The identity
  mark's continuous life is pure CSS; its pointer loop writes CSS variables
  and stops itself the moment nothing is moving.
- `prefers-reduced-motion`: instant transitions, a fully static environment
  (no camera flight, no packets), no auto-advance, and the identity name
  becomes a calm static wordmark. Reduced motion removes animation, never
  functionality.

## 5b. Signature identity mark (`components/SignatureName.tsx`)

The hero name is the portfolio's centrepiece, and it is **constructed
rather than revealed**. The wordmark's own rendered ink is sampled into a
particle field, the field is dispersed, and every particle travels home to
the exact pixel it was sampled from — so the viewer watches the name being
computed into existence, then reads it as typography.

Stages, all inside one `MOTION.nameAssemble.totalSeconds` (1.6 s):

1. **Guides** — a hairline rule on the baseline with one tick per grapheme
   cluster: the construction frame the word is about to be built inside.
   Fades out over `guideShare` (0.62) of the assembly.
2. **Dispersed field** — every particle sits at its origin, faint and cool.
   Displacement grows with distance from the word's centre, so the outer
   letters travel furthest and the assembly sweeps inward.
3. **Convergence** — particles travel on `easeOutSettle` with a single
   controlled overshoot (`settleBack` 0.7) and land *exactly* on target.
   Clusters start left to right (`clusterShare` 0.3) with a deterministic
   spread inside each cluster (`jitterShare` 0.15); each travels for
   `travelShare` (0.55). The three shares sum to 1, so the last particle
   arrives precisely at the end.
4. **Seating** — one warm highlight at `WARM_AT` (0.72) of each particle's
   arrival, as material locks into place.

**The living mark.** The particle letterform is the *permanent* visual
state — there is no solid-text resting phase and therefore no loop point:
after the construction seats, every particle keeps a micro-drift
(`microPx`) and a staggered periodic breath wave (`breathSeconds`,
`breathWindow`, `breathPx`) that loosens it a few px along its own outward
direction and returns it on a sine-pulse envelope of one continuous clock.
Each breath ends exactly where it began, so the viewer can never identify
a restart frame. A language change dissolves the old particle glyphs
(`dissolveSeconds`) and samples the new ones — particles to particles,
never particles to text. One particle array, one canvas, one rAF chain for
the life of the component; teardown cancels frames, timers and listeners
and releases the backing store. `prefers-reduced-motion` never enters this
state: the static designed wordmark is rendered instead, and the DOM cells
remain the no-JS and accessible representation throughout.
5. **Resolve** — the canvas fades out over `resolveSeconds` (0.34) and the
   real DOM text fades in through the same duration, then the canvas
   releases its backing store. **The last frame is typography, not pixels.**

### Why the resting state is DOM text

The final name is real, selectable, crawlable text in the brand wordmark
faces. The canvas is scaffolding that exists only during construction. The
most important frame is the last one, and the cost of painting it as canvas
would be permanent: no selection, no crisp subpixel rendering, no text at
all for a crawler that does not run JavaScript.

### Why Bengali shaping cannot break

Nothing in this system addresses a character. The renderer draws whole
grapheme clusters (`app/graphemes.ts` → `Intl.Segmenter`, with a
combining-mark-aware fallback) and samples the pixels the browser produced,
so কার, মাত্রা, হসন্ত and যুক্তাক্ষর are correct by construction — there is no
code path that could detach a matra, because no code path ever refers to
one. The cluster strings drawn into the sample canvas are the same strings
the DOM renders, at positions measured from the DOM, so particle targets and
resolved glyphs coincide. `সবুজ মিয়া` is six clusters (`স` `বু` `জ` ` ` `মি`
`য়া`), never nine code points, and always resolves to exactly that text.

### Engineering contract (asserted by `scripts/check-design.mjs`)

- **Deterministic.** The seed derives from the name (FNV-1a) and every
  random value comes from `mulberry32`. No `Math.random`: a re-run after a
  language switch rebuilds the same wordmark, and server and client markup
  stay identical.
- **One-shot.** The loop ends. No `setInterval`, no idle cycle, no residual
  `requestAnimationFrame`; the canvas backing store is released on resolve.
- **Reflow-free.** The loop writes only to the canvas and to one `data-asm`
  attribute on the stage. It never touches text content and never writes a
  layout property, and the DOM cells are static from first paint — so there
  is no layout shift and no cumulative-shift risk from the identity.
- **Batched.** Particles are quantised into an eight-step colour ramp, so a
  frame is at most a dozen draw calls whatever the particle count, and the
  ramp doubles as the arrival signal.
- **Budgeted.** `particleBudget()` derives the field size from viewport
  width and `hardwareConcurrency` under the hard `maxParticles` ceiling
  (1700), and `sampleStepFor()` adapts the sampling step to meet it. A phone
  gets a smaller field, not a slower one. `maxDpr` caps the canvas at 2×.
- **Paused, not skipped.** A hidden tab stops the loop *and* the clock, so
  returning resumes the construction instead of jumping to the end.
- **Progressive.** `data-asm` absent is the legible state: with no
  JavaScript, or if the 2D context is unavailable, the real text is simply
  there.
- **Reduced motion.** No canvas is drawn and no timer is set; the wordmark
  is present with the same faces, inks and halo.
- **Never behind the splash.** The pager passes `armed`, false while the
  boot splash covers the page, so the construction is not spent unseen.

### Typography

Two deliberate display faces, both self-hosted woff2 through `next/font`
(no runtime third-party request), both **SIL Open Font License 1.1**:

| Face | Variable | Scripts | Weights | Role |
|---|---|---|---|---|
| [Chakra Petch](https://fonts.google.com/specimen/Chakra+Petch) | `--font-wordmark` | Latin | 500, 700 | squared technical face for `Sobuj Miah` |
| [Anek Bangla](https://fonts.google.com/specimen/Anek+Bangla) | `--font-wordmark-bn` | Bengali | 600, 700 | contemporary geometric face for `সবুজ মিয়া` |

Anek Bangla is deliberately *not* the body face (Noto Sans Bengali,
`--font-bengali`), so both scripts carry the same "this is the name" weight
rather than the English name being a brand mark and the Bengali name being
body copy. 600/700 are real instances: synthetic bold is what smears Indic
shaping. `body.lang-bn .hero-name` also resets `font-feature-settings` and
`letter-spacing`, because the Latin mark's stylistic set and negative
tracking both break Bengali shaping.

### Palette

| Role | Tokens | Band |
|---|---|---|
| Resolved name | `INKS` — 8 greens, one per cluster | hue 75–190, green-dominant |
| Material in motion | `ASSEMBLE_INKS` — 4 cool tones | hue 180–265, lightness 0.55–0.95 |
| Seating highlight | `LOCK_INK` — one amber | hue 20–70 |
| Condensation target | `RESOLVED_INK` | green family |
| Waiting material | `WAITING_INK` | cool band, alpha ≤ 0.35 |

No near-white ink, no rainbow, and no platform or effect colour outside
these bands. The construction canvas is `pointer-events: none` and paints no
surface of its own — the identity sits on the world-map environment, never
on a panel, and no `filter` is stacked on it.

## 5c. Identity clock (`components/IdentityClock.tsx`)

The homepage clock is the name's smaller sibling, in the same typographic
language: each digit's ink is sampled from the wordmark face (Chakra Petch;
Anek Bangla for Bengali digits) into an 11-row dot matrix — the resolved
particle state — and rendered as lit green dots. Sampling is capped at
7 columns so a matrix can never be wider than its fixed slot: digits
compress a hair instead of ever touching their neighbours. It is never a
generic system monospace; if sampling is unavailable it falls back to the
same wordmark face as plain text.

- **Order:** header → breathing space → clock → date/time metadata →
  name/identity → role → status → tagline → description → CTAs. The clock
  leads the home page content directly below the header (`part="time"`)
  with the bilingual date · timezone line (`part="date"`) attached
  directly beneath it as one block — the date is clock metadata, never a
  separate hero beat — and the name stays the dominant mark below.
- **Format:** `HH:MM:SS` 12-hour with a localized meridiem from the content
  tree (`AM`/`PM`, `এএম`/`পিএম`) and `localizeDigits` Bengali numerals — the
  Bengali clock contains no Latin characters. Timezone is `Asia/Dhaka`
  regardless of the visitor's clock.
- **Stability:** each digit slot is a fixed viewport (`overflow: hidden`,
  fixed width/height/baseline); a changed digit rolls vertically — the old
  face exits upward while the new one enters from below, clipped to the
  slot — and unchanged digits keep their DOM and never animate. The clock
  block itself cannot shift or drift. One timer per part, cleaned up on
  unmount/language change. Client-only first paint, so SSR output is
  unchanged.
- **Reduced motion:** no colon pulse, no digit roll — lit dots simply are.

## 6. Interaction states

| State | Treatment |
|---|---|
| Hover | subtle lift (`translateY(-2..-4px)`), border brightening, glow |
| Press | compression (`scale(0.95–0.96)`) on buttons and magnetic links |
| Focus | visible green outline (`:focus-visible`, 2px + 3px offset) |
| Active nav | accent dot glows (colour only — dot geometry never changes, so the track never re-centres); tabs get accent border + wash |
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
- The overlay is a **HUD that emerges from the bottom bar** — the bar is its
  physical origin and sole control. The panel is anchored above the bar,
  grows upward out of it (transform-origin at its bottom edge) and contracts
  back into it on close; a seam connector scales in from the bar end, the
  trigger sparks once on open, and the bar's `data-nav-open` glow keeps the
  relationship visible. The panel's hairline border is overlaid with
  segmented corner brackets and one asymmetric edge tick — instrument
  framing, never a conventional dialog box. Rows stagger in after the frame
  expands. It carries no large page number — the page itself already does.
- **Progress is one instrument with a fixed origin — a border trace, never a
  dot row.** The bottom control is ONE fixed-size pill button whose perimeter
  carries the trace: it travels clockwise from a fixed origin at
  bottom-centre (bottom edge → right cap → top edge → left cap), normalised
  with `pathLength=1` and animated by `stroke-dashoffset = 1 − progress`.
  Pressing anywhere on it opens the index HUD; the index glyph is part of
  the same button — there is no second trigger, no readout and no numbering
  inside the control. On the open HUD, the same progress travels along the
  panel's bottom edge. The formula is deterministic —
  `progress = activeIndex / (totalPages − 1)` — so page 1 = 0% and page 9 =
  100%. Only the trace's end point moves; the origin never re-centres and no
  element resizes or shifts.
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
not a spectacle — and it **travels with the story**.

**Page-aware camera.** Each of the nine sections owns one deterministic
geographic focus (`app/geo.ts` → `GEO_FOCUS`, aligned with `SECTION_IDS` by
index; Home is Bangladesh). When the pager turns a page, the camera flies to
the new focus by interpolating the SVG **viewBox attribute** (~1.25s,
ease-in-out, rAF) — never a CSS transform on map geometry. Deep links and
crawlers get the route's own camera server-rendered. Under reduced motion
the camera snaps instead of flying.

Layers, back to front (content always wins):

1. **Land + countries** — real geography, not a dot abstraction. Natural
   Earth 1:110m land beneath a per-country layer where every territory
   keeps its recognisable shape (`components/world-map-countries.ts`,
   generated by `tools/make-worldmap.py`). Inactive countries are subdued
   political hairlines; crisp at every zoom via
   `vector-effect: non-scaling-stroke`.
2. **Active country** — each focus carries its own restrained ink
   (`COUNTRY_INKS` in `app/geo.ts`: origin green, amber, blue, teal,
   indigo, rose, lime, cyan — all low-alpha technical tones, never bright).
   Activation is a class flip (fill/stroke recolour via CSS variables),
   never an animated geometry change. City-states with no 1:110m outline
   (Singapore) get a projected marker, never a faked shape.
3. **Focus glow** — a soft radial wash centred on the current page's
   geographic focus; panned by the camera like everything else.
4. **Data flow** — origin→hub arcs (static geometry, faint dashes) with a
   handful of travelling packets (SMIL `animateMotion`, ≤5 on screen,
   staggered cadence), plus one warm **active route** from the origin to
   the current section's focus, remounting per flight. Elegant technical,
   never radar, never a trading floor. Hidden entirely under reduced motion.
5. **Technical vector motifs** — circuit traces, orbital arcs, a waveform
   fragment, network nodes, coordinate ticks. Screen-space, decorative,
   static, very low ink: discovered, never shouted.
6. **Atmosphere** — the deep-green radial wash behind the land.

The active geography is also announced as real screen-reader text
(`ui.mapFocus`), so the focus never exists only visually.

Rules, so this never drifts back:

- **No grid.** There is no graticule, no tiling, no box or square motif and no
  repeating geometric overlay anywhere behind the hero. The previous 60px
  square grid (`.grid-bg` / `.pager-grid`) was deleted at the source.
- **No light layer.** Nothing behind the name may flash, panel, or bloom. The
  previous near-white sweep band (`.sig-sweep`) and the `#86efac` page-change
  flash were removed with their keyframes, not hidden.
- **Stability contract** — the map flickered before because geometry
  re-rasterised every frame (scaled land with `non-scaling-stroke`, scaled
  stroked circles, animated `stroke-dashoffset`). So: no CSS animation or
  transform on map geometry, ever. The origin halo pulses opacity only; the
  camera rewrites the viewBox attribute; packets follow SMIL motion paths.
- **Signals, not noise** — nine projected network hubs and four faint links.
  No pointer repulsion, no ripples, no scanline: the background must never
  compete with the name for attention.
- **Cost** — one inline map SVG plus one inline motif SVG, zero canvas, zero
  WebGL. The only rAF is the ~1.25s camera flight during page changes
  (self-stopping, snaps to destination if the tab hides mid-flight).
  Motion pauses via `data-paused` when the tab is hidden and the camera +
  packets are disabled entirely under reduced motion.

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
components/NavOverlay.tsx  the section index HUD, emerging from the bottom bar
components/PullToRefresh.tsx  real mobile pull-to-refresh gesture
components/SignatureName.tsx  the signature identity mark (§5b)
components/IdentityClock.tsx  the dot-matrix identity clock (§5c)
components/WorldMap.tsx   dark-green page-aware map environment (§9)
components/world-map-path.ts  generated land contours (do not edit)
components/world-map-countries.ts  generated per-country shapes (do not edit)
tools/make-worldmap.py    regenerates the contours from Natural Earth
components/sections.tsx  the nine curated pages
components/ui.tsx        cursor, magnetic, reveals, dots, carousel, chrome
scripts/check-content.mjs        bilingual parity + two-way purity gate
scripts/check-purity-adversarial.mjs  adversarial purity suite
scripts/check-design.mjs         token/document/CSS drift gate
scripts/check-build.mjs          routes, deep links, SEO assets, JS budget
```
