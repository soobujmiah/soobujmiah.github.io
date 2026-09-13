# Sobuj Miah — Portfolio

Personal portfolio of **Sobuj Miah**, Independent Software Developer & On-Device AI
Systems Builder. Live at **https://soobujmiah.github.io**.

Discrete paper-turn pager (Next.js static export + framer-motion),
fully bilingual **English / বাংলা**, green-on-black theme.

## Stack

- Next.js 14 (static export), React 18, TypeScript, Tailwind CSS
- framer-motion for spring paper-turn page transitions + inner page scroll
- GitHub Pages deploy via `.github/workflows/deploy.yml` (lint → build → upload `./out`)

## Develop

```bash
npm install
npm run dev      # local dev server
npm run lint     # ESLint (next/core-web-vitals)
npm run build    # static export to ./out
```

`npm run build` is the authoritative check — it runs lint, type-check, and the
static export. The deploy workflow runs the same steps on every push to `main`.

## Content model

All user-facing copy lives in **`app/content.ts`** — one `en` tree and one `bn`
tree with identical keys, enforced by `scripts/check-content.mjs` (runs on
`prebuild` and via `npm run check`: key parity, EN purity, selected-subset,
labels/nav sanity). Structure (repo URLs, accents, years, topics) lives
alongside the copy so each language tree is complete and reviewable.
`websiteUrl` is set ONLY for repositories with a verified live site (never
fabricate); the UI maps it to `Explore`, repos to Source/Code links.

- `app/language.tsx` — `LanguageProvider` + `useLang()` hook. Preference
  persists to guarded `localStorage` (never throws in private mode / old
  WebViews) and syncs `<html lang>`, tab title, and meta description.
- `app/page.tsx` — **discrete pager**: fixed 100dvh root. Pages center when
  they fit and scroll internally when they don't (viewport-first when
  possible, content-first when necessary). Wheel ticks, vertical swipes,
  arrows/PageUp/PageDown/Home/End, dots, and nav links yield to inner
  content until its edges, then flip exactly one page (paper-turn: spring
  tilt + depth scale + fade, ~1s flip lock, `#page-id` hashes).
- `components/TechBackground.tsx` — live canvas background behind the
  transparent pages: drifting particle network, pointer repulsion + glow,
  tap ripples, scanline sweep, and a pulse on every page change. Pauses
  off-screen, renders one static frame under reduced motion.
- `components/sections.tsx` — the nine curated pages (Hero → Contact).
  Featured-work spotlight on desktop, snap carousels below `lg`, Selected
  Open Source (curated subset + GitHub route, never a directory),
  Experience accordion below `md` / timeline above.
- `components/ui.tsx` — cursor, magnetic links, reveals, preloader, header
  (with EN/BN toggle), footer, page progress, page dots, snap carousel.

Visual language is specified in `DESIGN_SYSTEM.md` — the shared DNA for this
portfolio and future repository websites (same brand, different context).

### i18n rules (must follow)

1. **Technical identifiers stay Latin in both languages** — Kotlin, llama.cpp,
   Vulkan, GGUF, repo names, versions, benchmark figures. Bangla semantic
   translation of domain terms produces wrong-meaning substitutions.
2. Company/product proper nouns stay Latin (e.g. `Rabeya Education Family`).
3. Wide `letter-spacing` breaks Indic shaping — `body.lang-bn` collapses all
   tracking automatically (see `globals.css`).
4. Every new user-facing string needs both `en` and `bn` in `content.ts`.

## Claim-verification log

The footer promises every claim is backed by CI or real-device evidence. Numbers
below were last re-verified **2026-09-13** against live repository state:

| Claim (site) | Verification |
|---|---|
| GGEN: 143 pure-Dart unit tests | `test(` declarations counted at live head `b49d4d5` — exact match |
| GGEN: 353 widget/controller tests | 237 `test(` + 116 `testWidgets(` at live head `b49d4d5` — exact match |
| LAI: 12–20 tok/s decode | Recorded device runs in `soobujmiah/lai` docs (range, not peak) |
| Ternux: glmark2 score 140 (OpenGL 4.6) | `docs/BENCHMARKS.md` at live head |
| Ternux: Blender 4.3.2 on Zink/Adreno/Turnip | `docs/BENCHMARKS.md` + `docs/USAGE.md` at live head |
| Songjog: 94 tests green on CI | CI green at live head `742ae5b`; device Record 5 verified 2026-09-12 |
| ADT: end-to-end ARM64 APK pipeline | 3 published releases (v35.0.2/v36.0.0/v37.0.0) + device validation |
| Selected repos (7 + GitHub route) | Curated subset of the 12 site-eligible repos (14 public − profile repo − this site); featured work not repeated. Live API listing, 2026-09-13 |
| Live-site links (ternux, iqra, arms) | `has_pages=true` via live GitHub API, 2026-09-13 |

Re-verify before reusing any figure professionally if significant time has passed.

## Project structure

```text
app/
  content.ts     bilingual copy (en/bn trees) + curated structure
  language.tsx   language provider + hook + digit localization
  layout.tsx     metadata, JSON-LD, fonts, viewport
  page.tsx       discrete pager + gestures + paper-turn transition
  globals.css    tokens, pager, inner scroll, carousels, responsive, a11y
  icon.svg       favicon
  not-found.tsx  bilingual 404 → 404.html on export
components/
  TechBackground.tsx  live canvas background (particles, ripples, pulses)
  sections.tsx        the nine curated pages (spotlight, carousels, accordion)
  ui.tsx              cursor, links, reveals, header, footer, dots, carousel
  MatrixName.tsx      animated hero name
scripts/
  check-content.mjs   bilingual + model gate (prebuild + npm run check)
DESIGN_SYSTEM.md      shared visual DNA for portfolio + future project sites
```

## Owner context

This repository is operated under Sobuj's SKB project-bootstrap standard —
see `AI_ASSISTANT.md`. Non-trivial decisions should consult `soobujmiah/skb`
starting at `ASSISTANT_CONTEXT.md`. GitHub is the canonical project memory.
