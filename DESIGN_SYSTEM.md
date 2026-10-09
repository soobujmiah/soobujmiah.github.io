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
      "yPercent": 10,
      "rotateX": 6,
      "rotateY": 7,
      "scale": 0.955,
      "perspective": 1300,
      "opacitySeconds": 0.58,
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
    "tilt": {
      "maxRotateDeg": 5,
      "perspective": 900,
      "popZ": 14,
      "cornerScale": 1.015,
      "followSpring": {
        "stiffness": 150,
        "damping": 20,
        "mass": 1
      }
    },
    "depth": {
      "zRecede": 90,
      "zRise": 80,
      "contentLagMs": 40,
      "numeralParallax": 0.07,
      "revealRotateX": 4,
      "revealPerspective": 1200,
      "revealSpring": {
        "stiffness": 130,
        "damping": 18,
        "mass": 1
      }
    },
    "countUp": {
      "seconds": 1.1,
      "ease": "cubic-bezier(0.16, 1, 0.3, 1)"
    },
    "cameraDrift": {
      "maxOffsetHw": 0.02,
      "followSpring": {
        "stiffness": 60,
        "damping": 18,
        "mass": 1
      }
    },
    "nameAssemble": {
      "totalSeconds": 2.0,
      "outgoingSeconds": 0.22,
      "resolveSeconds": 0.34,
      "dissolveSeconds": 0.45,
      "microPx": 0.18,
      "breathSeconds": 8.0,
      "breathWindow": 0.2,
      "breathPx": 0.6,
      "guideShare": 0.55,
      "clusterShare": 0.3,
      "jitterShare": 0.15,
      "travelShare": 0.55,
      "settleBack": 0.55,
      "disperseRadius": 1.15,
      "maxParticles": 2800,
      "sampleStepPx": 2.2,
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

- Page padding: desktop `92px / 76px`, mobile `80px / 108px`.
- Content width: `max-w-5xl` (64rem); dense pages `max-w-6xl` (72rem).
- Card padding `p-4 / sm:p-5`; section gaps scale down on small screens.
- Breakpoints: `sm / md / lg` + `min-[1400px]`; short-height queries compact
  type/padding instead of clipping.
- Desktop editorial pattern: heading rail + content column. Dense collections:
  fitted grids on desktop, snap carousels below `lg`, accordion below `md`.

## 5. Motion language

- **Chapter change** (portfolio): direction-aware spring on content depth
  with a `1000ms` gesture lock; the environment carries the larger camera
  move and crossfade. Values are in the token block.
- Reveals: `0.7s cubic-bezier(0.16, 1, 0.3, 1)` fade-up; pages remount, so
  reveals replay on each entry.
- Micro: 0.1–0.5s; magnetic links ease-out 0.12s, release 0.5s expo.
- Environment responds to paging: the film world moves to the next shot over
  ~1.8s, or dissolves to the next location over ~1.1s; progress advances.
- Animate **transform + opacity only** (compositor-friendly). The identity
  mark's continuous life is pure CSS; its pointer loop writes CSS variables
  and stops itself the moment nothing is moving.
- `prefers-reduced-motion`: instant transitions, a fully static environment
  (no camera flight, no packets), no auto-advance, and the identity name
  becomes a calm static wordmark. Reduced motion removes animation, never
  functionality.

## 5b. Hero name

The name is real DOM text in the page's only `h1` (`.hero-name`). It enters
with a masked word-by-word rise (`NameReveal` in `components/sections.tsx`,
`cinema-word-*` in `globals.css`): transform only, no blur, no canvas. Without
JavaScript, or under reduced motion, it is simply present. The retired
particle construction, service-keyword morph and dot-matrix clock are gone
(see `docs/CINEMATIC_AUDIT.md`). The accessible name never depends on motion.

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
  `/research/`, `/experience/`, `/contact/` are
  static pages with their own server-rendered HTML, title, description,
  canonical URL and social card. The pager is the *presentation*; the route is
  the *address*. Legacy `#work`-style links are rewritten on load;
  `/stack/` and `/open-source/` remain canonicalized entry routes.
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
  `progress = activeIndex / (totalPages − 1)` — so page 1 = 0% and page 7 =
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

## 9. Background & atmosphere — Silicon Nocturne

One environment for the whole site: `components/SiliconWorld.tsx`, drawn by
`app/silicon.ts`. It is an **abstract, invented** floorplan of a phone
system-on-chip (CPU clusters, GPU shader array, NPU MAC array, memory
arrays, media blocks, DRAM interface, interconnect, I/O pad ring) seen by a
low camera with perspective. It is not a photograph or a real die, and no
real product's layout is implied. Block labels are never drawn.

- **Resolution-independent.** Vector lines drawn with Canvas 2D at native
  device pixels (DPR capped at 2). There is no raster or video asset.
- **Deterministic.** A seeded PRNG: the same seed always yields the same chip.
- **Camera per chapter** (`POSES`): Home wide establishing shot with a low
  horizon; Focus & Tools over the compute blocks; About over calm memory
  arrays; Work over the GPU; Research over the NPU; Experience tracking down
  a long bus; Contact pulled back to the I/O ring; Services and Verification
  calm static shots. Chapter changes fly the camera over 1.5 s.
- **Opening.** On a true entry to the home chapter the camera rises from the
  die surface (1.8 s). Any pointer, key or wheel input skips it.
- **Light.** A second canvas draws a few signal pulses along routes; the
  scene canvas is redrawn only while the camera flies.
- **Safety.** Paused when the tab is hidden; mobile uses a lighter plan;
  reduced motion draws one static frame per chapter with no pulses; without
  JavaScript a CSS gradient (`.silicon-world`) remains. A scrim
  (`.silicon-grade`) keeps text legible.

### Chapter compositions

Focus & Tools `.stack-layer` (layered stack) · About `.about-lead` + `.fact-grid`
· Work `.plate` (corner-ticked, square) · Research `.lab-notebook` with
`.lab-legend` · Experience `.rail` year rail · Contact `.contact-title` and
`.contact-primary`. No `backdrop-filter` surfaces in the pager chapters.

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
app/[section]/page.tsx   six section routes + two legacy aliases + metadata
app/robots.ts            robots.txt
app/sitemap.ts           sitemap.xml, one line per section
app/globals.css          tokens (§1), pager, overlay, name, carousels, a11y
components/Pager.tsx     discrete pager, gestures, paper-turn, route sync
components/NavOverlay.tsx  the section index HUD, emerging from the bottom bar
components/PullToRefresh.tsx  real mobile pull-to-refresh gesture
components/SiliconWorld.tsx  the Canvas 2D environment (§9)
app/silicon.ts           seeded chip generator, camera poses, projector (pure)
components/SiliconDocumentBackdrop.tsx  the same scene behind document routes
components/sections.tsx  the seven curated pages
components/ui.tsx        cursor, magnetic, reveals, dots, carousel, chrome
scripts/check-content.mjs        bilingual parity + two-way purity gate
scripts/check-purity-adversarial.mjs  adversarial purity suite
scripts/check-design.mjs         token/document/CSS drift gate
scripts/check-build.mjs          routes, deep links, SEO assets, JS budget
```

All shared section reveals now use the depth reveal variant. Presence cards tilt at most five degrees on
fine pointers; their content lifts fourteen pixels. Touch gestures retain
native scrolling and cards remain flat. Pointer cancellation, reduced-motion
changes, and pointer-capability changes reset the card immediately.

The verified
footer count animates only the generated
evidence value, preserves the final value in static HTML and its accessible
label, and restores that value when an animation is interrupted. Reduced
motion shows final counts and revealed content immediately.

`depth.contentLagMs` is reserved; the current page body moves with its shell.
This layer requires no additional animation library, WebGL runtime, hosted
asset, or paid service.
