# Sobuj Miah — Brand Design System

The portfolio (`soobujmiah.github.io`) is the **root of a visual ecosystem**.
Future repository websites (project deep-dives) must feel like members of the
same family: **same brand → different context**.

- **Portfolio** — cinematic, curated, immersive, narrative. Answers *who*,
  *strongest areas*, *selected work*, *evidence*, *now building*.
- **Project site** — technical, detailed, documentation-oriented. Answers
  *what, why, architecture, implementation, tests, evidence, limitations,
  roadmap, source*.

Per SKB product principles, each product keeps an independent design
language — so project sites share this DNA but are **not pixel copies** of
the portfolio. Core brand consistency must always win over per-site
decoration.

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
| `--green-soft/mid` | `8% / 15%` green | tinted surface washes |
| `CARD_BG` | `rgba(6,7,6,0.66)` + `backdrop-blur-md` | card surface over live bg |

**Rule:** dark, premium, technical, controlled. The accent must stay
recognizable but never flood the interface — no neon cyberpunk.

## 2. Surfaces & borders

- Cards: 12px radius (`rounded-xl`), 1px border at 8–10% white, translucent
  fill + backdrop blur so the living background shows through faintly.
- Accent surfaces (now-building, route cards): 1px border at 20–35% green,
  6–7% green fill.
- Separation comes from **depth** (layering, blur, vignette) more than from
  heavy borders.

## 3. Typography

- Latin/UI: Inter (`--font-inter`). Bengali: Noto Sans Bengali → SolaimanLipi
  → Siyam Rupali → Nirmala UI fallback stack (`body.lang-bn`).
- Mono/labels/eyebrows/counters: JetBrains Mono (`--font-mono`).
- Eyebrow: 10px mono, uppercase, `tracking-[0.3em]`, accent color. Wide
  tracking breaks Indic shaping — `body.lang-bn` collapses all tracking.
- Headings: tight (`tracking-tight`, leading 1.1–1.12), fluid `clamp()`.
- Body: 13–14px, relaxed leading (1.7–1.75), 55–65% white.
- Counters: `tabular-nums`; rendered in the active script (Bengali digits in
  BN mode) via `localizeDigits()` — UI chrome only; benchmarks, versions,
  and test counts stay Latin.

## 4. Spacing & layout

- Page padding: desktop `92px / 76px`, mobile `80px / 108px` (header/footer
  clearances live inside the measured box).
- Content width: `max-w-5xl` (64rem); dense pages `max-w-6xl` (72rem).
- Card padding `p-4 / sm:p-5`; section gaps scale down on small screens.
- Breakpoints: `sm / md / lg` + `min-[1400px]` for 4-up grids; short-height
  queries compact type/padding instead of clipping.
- Desktop editorial pattern: heading rail + content column (About,
  Experience, Contact). Dense collections: fitted grids on desktop, snap
  carousels below `lg`, accordion below `md`.

## 5. Motion language

- **Page turn** (portfolio): spring `{ stiffness: 170, damping: 27, mass: 0.9 }`
  on `y ±7%` + `rotateX ±5°` + `scale 0.985`, opacity `0.4s easeOut`,
  `transformPerspective: 1400`. Direction-aware, forward/backward coherent.
  1000ms flip lock — one gesture, one page. Restrained: felt, not noticed.
- Reveals: `0.7s cubic-bezier(0.16, 1, 0.3, 1)` fade-up; pages remount, so
  reveals replay on each entry.
- Micro: 0.1–0.5s; magnetic links ease-out 0.12s, release 0.5s expo.
- Environment responds to paging: background grid drifts 14px/page (1s
  expo), canvas emits a pulse ring, progress bar springs forward.
- Animate **transform + opacity only** (compositor-friendly). Canvas: capped
  DPR (≤1.5), modest particle counts, pause when hidden.
- `prefers-reduced-motion`: instant transitions, static background frame, no
  auto-advance, no glitch loops. Reduced motion removes animation, never
  functionality.

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
| `Explore ↗` pill | verified project/demo website | `websiteUrl` — set **only** for repos with a verified live site (`has_pages`), never fabricated |
| Arrow icon button | source repository | `repo` (aria: `{name} {repoWord}`) |
| `Code ↗` text | source repository (compact rows) | `repo` |
| GitHub route card | everything else | profile URL (single route, not a directory) |

External links: `target="_blank" rel="noreferrer"`. When a project gains its
own website, the portfolio exposes it through the existing `websiteUrl` slot —
no model change needed.

## 8. Navigation philosophy

- Portfolio: discrete pager — wheel ticks, vertical swipes, arrows/PageUp/
  PageDown/Home/End, dots, nav links, `#page-id` deep links.
- Pages center when they fit and **scroll internally** when they don't
  (viewport-first when possible, content-first when necessary). Gestures
  yield to the inner scroller until its edges, then turn the page. Never
  clip, truncate, or shrink content to preserve composition.
- Horizontal gestures always belong to carousels; vertical paging never
  fights them (dominant-axis detection).
- Project sites may use conventional documentation navigation instead of a
  pager — the pager is a portfolio trait, not a brand requirement.

## 9. Background & atmosphere

Alive when idle, calm always: drifting particle network, pointer
repulsion + glow, tap ripples, slow scanline, page-change pulse. No WebGL,
no heavy shaders, no aggressive loops. Content always wins over effects.

## 10. Accessibility

- Full keyboard operation (paging + inner-scroll chunking + carousels +
  accordion + tabs), labeled scroll regions, localized aria throughout.
- Readable contrast on all text; touch targets ≥ 32px (dots excepted, they
  are redundant with swipe).
- Semantic structure per page; decorative layers `aria-hidden`.
- Reduced-motion support as specified in §5.

## 11. Bilingual rules

- Every user-facing string exists in `en` and `bn` with identical keys
  (`app/content.ts`), enforced by `scripts/check-content.mjs` on every build.
- Technical identifiers stay Latin in both languages (Kotlin, Flutter,
  llama.cpp, Vulkan, GGUF, ARM64, repo names, versions, benchmarks).
- Company/product proper nouns stay Latin. Bangla prose must be
  professionally written — never machine-translation-style.
- `npm run check` also enforces: EN tree contains zero Bengali characters,
  `selected` ⊆ repos in both languages, 9 page labels, valid nav scenes.

## 12. Project-site inheritance checklist

A future repository website should:

1. Import these tokens (§1–§4) verbatim for chrome, text, and surfaces.
2. Reuse the motion curves/springs (§5) and interaction states (§6).
3. Reuse the link language (§7) — Explore/Source/Code mean the same things.
4. Follow the a11y (§10) and bilingual (§11) rules.
5. Adapt information architecture freely (docs nav, deep hierarchy).
6. Optionally add **one** project motif (e.g. a secondary accent or hero
   treatment) that coexists with — never overpowers — the core green/black
   identity, and passes contrast + reduced-motion requirements.

## 13. File map (portfolio implementation)

```text
app/content.ts        bilingual copy + curated structure (selected, websiteUrl)
app/language.tsx      provider, persistence, digit localization, tab-title sync
app/page.tsx          discrete pager, gestures, paper-turn transition
app/globals.css       tokens (§1), pager, carousels, dots, responsive, a11y
components/ui.tsx     cursor, magnetic, reveals, dots, carousel, chrome
components/sections.tsx  the nine curated pages
components/TechBackground.tsx  living canvas (§9)
components/MatrixName.tsx      hero name treatment
scripts/check-content.mjs      bilingual + model gate (runs on prebuild)
```
