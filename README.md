# Sobuj Miah — Portfolio

Personal portfolio of **Sobuj Miah**, Independent Software Developer & On-Device AI
Systems Builder. Live at **https://soobujmiah.github.io**.

Cinematic fixed-scene scroll experience (Next.js static export + framer-motion),
fully bilingual **English / বাংলা**, green-on-black theme.

## Stack

- Next.js 14 (static export), React 18, TypeScript, Tailwind CSS
- framer-motion for scroll-driven scene transitions
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
tree with identical keys. Structure (repo URLs, accents, years, topics) lives
alongside the copy so each language tree is complete and reviewable.

- `app/language.tsx` — `LanguageProvider` + `useLang()` hook. Preference
  persists to guarded `localStorage` (never throws in private mode / old
  WebViews) and syncs `<html lang>` for assistive tech.
- `app/page.tsx` — **discrete pager**: fixed 100dvh root, zero vertical
  scrolling (`body { overflow: hidden }`). Wheel ticks, vertical swipes,
  arrow/PageUp/PageDown/Home/End keys, dots, and nav links each flip exactly
  one page (`AnimatePresence` slide/fade, ~1s flip lock, `#page-id` hashes).
- `components/TechBackground.tsx` — live canvas background behind the
  transparent pages: drifting particle network, pointer repulsion + glow,
  tap ripples, scanline sweep, and a pulse on every page change. Pauses
  off-screen, renders one static frame under reduced motion.
- `components/sections.tsx` — the nine pages (Hero → Contact). Every page
  fits its viewport: dense collections become horizontal snap carousels on
  phones (Work incl. Songjog slide, Open Source 3×2×2) or a fitted grid /
  timeline on desktop; Experience is an accordion on phones.
- `components/ui.tsx` — cursor, magnetic links, reveals, preloader, header
  (with EN/বাং toggle), footer, page progress, page dots, snap carousel.

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
| 12 repo cards / star counts | Live GitHub API listing, 2026-09-13 (14 public repos total: 12 shown + profile repo + this site) |
| Live-site links (ternux, iqra, arms) | `has_pages=true` via live GitHub API, 2026-09-13 |

Re-verify before reusing any figure professionally if significant time has passed.

## Project structure

```text
app/
  content.ts     bilingual copy (en/bn trees)
  language.tsx   language provider + hook
  layout.tsx     metadata, JSON-LD, fonts, viewport
  page.tsx       discrete pager + navigation
  globals.css    theme, pager, carousels, cursor, responsive, reduced-motion
  icon.svg       favicon
  not-found.tsx  bilingual 404 → 404.html on export
components/
  TechBackground.tsx  live canvas background (particles, ripples, pulses)
  sections.tsx        the nine page contents (carousels, accordion)
  ui.tsx              cursor, links, reveals, header, footer, dots, carousel
  MatrixName.tsx      animated hero name
```

## Owner context

This repository is operated under Sobuj's SKB project-bootstrap standard —
see `AI_ASSISTANT.md`. Non-trivial decisions should consult `soobujmiah/skb`
starting at `ASSISTANT_CONTEXT.md`. GitHub is the canonical project memory.
