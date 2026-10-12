# Handoff — soobujmiah.github.io

> **TEMPORARY FILE. DELETE IT WHEN THE WORK IN §6 IS DONE.**
>
> This is a session handoff, not a standing document. It exists so the next agent can
> pick up mid-stream. Once the open items in §6 are finished or formally dropped,
> **delete this file in the same PR** and move anything still true into
> `README.md`, `DESIGN_SYSTEM.md`, `docs/`, or SKB — wherever it actually belongs.
> A handoff that outlives its session becomes a lie: the previous one described a
> particle name and a world map that had already been deleted, and it misled the
> session that wrote this one.
>
> The permanent agent contract is `AI_ASSISTANT.md`. Read that first; this second.

Written 2026-10-12 by a Claude Code CLI session (PRoot Debian on the Redmi Turbo 4 Pro).
**Verify any claim here against live state before relying on it** (see §7).

---

## 1. State at handoff

| Item | Value |
|---|---|
| Repo | `soobujmiah/soobujmiah.github.io`, clone at `~/portfolio` |
| `main` | `4fa76f1`, clean tree, in sync with origin |
| Deployed | Yes — GitHub Pages, deploy run `38221039067` succeeded |
| Open PRs | **#42** only (`feat: synchronize verification evidence across portfolio and CV`) — not reviewed by this session |
| SKB | `~/skb` at `ab00fba`, clean, pushed. `repositories/portfolio.md` updated 2026-10-12 |
| `node_modules` | reinstalled from the lockfile; `npm run build` verified green locally |

**Read first:** `~/portfolio/AI_ASSISTANT.md`, then SKB `~/skb/ASSISTANT_CONTEXT.md`,
then `~/portfolio/DESIGN_SYSTEM.md` §5b and §9, then `~/portfolio/docs/ENVIRONMENT.md`.

---

## 2. Architecture (verified this session)

Next.js **15.5.27** static export, React 18, TypeScript strict, Tailwind **3.4**,
framer-motion 11. **Those are the only runtime dependencies. No Three.js, no R3F, no
GSAP in the main site.**

**Eight pager chapters** (`app/sections.ts` is the single registry):
`home · presence · about · workstation · work · research · experience · contact`
plus 9 service pages and 1 verification page, all mirrored under `/bn/`.
**40 exported routes = 36 primary + 4 legacy aliases.**

- `components/Pager.tsx` — discrete chapter pager, one scene in the DOM at a time,
  real static URL per chapter, native inner scroll, flips only at scroll edges.
- `components/SiliconWorld.tsx` + `app/silicon.ts` — "Silicon Nocturne", a procedural
  Canvas 2D phone-SoC floorplan with a per-chapter camera. Parameters: `docs/ENVIRONMENT.md`.
- `components/sections.tsx` — every scene, including `WorkstationScene`.

---

## 3. What this session shipped (all merged and live)

| PR | What |
|---|---|
| #62 | **Signature name**: the canonical name as per-grapheme CSS 3D with one green gleam pass. Retired `MOTION.nameAssemble` (17 dead particle tokens) → `MOTION.signature`. Corrected 4 false claims in `README.md`. |
| #63 | **Three doubled `<title>`s** (`/bn/`, `/verification/`, `/bn/verification/`) + a gate that catches the class. |
| #64 | **Hero location printed twice** → once; status line now leads, matching the hierarchy `globals.css` always documented. |
| #65 | **`workstation` chapter** — the mobile workstation as a six-layer stack. |
| #66 | **a11y**: `<main>` landmark on all 8 chapters; closed nav overlay made `inert`. **AI positioning** moved off the lead. |
| #67 | **`/3d-prototype/` published** (was 404), with a private repo link removed. |
| #56/57/58/60 | Dependency bumps incl. **next 15.5.27**. #59 (Tailwind v4) closed — see §6. |

SKB knowledge returned in `~/skb` commit `ab00fba`.

---

## 4. Traps — read before writing code

**These are enforced. Violating one fails the build, not review.**

1. **`check-build` asserts the literal string `<h1 class="hero-name">`.** Adding any
   attribute to that `h1` breaks the gate. Hero tokens ride on an inner `.sig-stage`.
2. **The hero name must ship as real DOM text** with ≥2 spans whose class is exactly
   `cinema-word` or `cinema-word cinema-word--play`. **No canvas, no image text.**
3. **Retired motifs are banned in the shipped CSS**: `sig-sweep`, `sigFlash`, `86efac`,
   `134,239,172`, `220,255,230`, `blur(80px)`, `grid-bg`, `pager-grid`. The scan reads
   the built stylesheet, so **do not even write these strings in a CSS comment.**
   The retired `.sig-sweep` was a near-white band *behind* the name; any new
   "light across the letterforms" must be a brand-green halo on the glyphs.
4. **Retired components may not come back**: `SignatureName.tsx`, `WorldMap.tsx`,
   `CinematicWorld.tsx`, `LivingAtmosphere.tsx`, `IdentityClock.tsx`, `public/cinema`.
5. **Two-way language purity.** EN fields may contain zero Bengali codepoints; BN
   fields zero Latin, **including tool names** — the BN tree transliterates
   (`টারমাক্স`, `পি-রুট`, `এওএসপি`, `ভলকান`). Fields that must stay verbatim ASCII go in
   `IDENTIFIER_PATHS` in `scripts/check-content.mjs`.
6. **Bengali must be split by grapheme cluster, never code point** (`app/graphemes.ts`).
   Verified: `ক্ষ` and `স্ট্র` stay whole; `সবুজ মিয়া` → `স | বু | জ | মি | য়া`.
7. **Digits must localise.** Use `localizeDigits(value, lang)`. Runtime-generated
   digits are invisible to the content gate — this session shipped Latin `01`–`06`
   into the Bengali tree and only a screenshot caught it.
8. **Never hand-edit verification claim numbers.** Regenerate; see `AI_ASSISTANT.md`.
9. **`title.template`.** The root layout appends `— <name>`. Any page whose own title
   already ends with the name must use `title: { absolute: … }`, or it ships twice.
   Uniqueness checks cannot catch it — a doubled title is still unique.
10. **One registry.** `app/sections.ts` is the only chapter list. It used to be
    duplicated in four places; `check-build`'s copy was the dangerous one because it
    derives expected `data-shot` indices from it.

---

## 5. Environment facts (verified 2026-10-12)

- **WebGL does not work here.** Headful Chromium 154 on Xvfb reports
  `webgl1: false, webgl2: false`; forcing SwiftShader aborts the browser
  (`GPU process isn't usable`). Root cause: PRoot has no `/proc/bus/pci/devices`.
  **A WebGL scene cannot be visually verified in this environment.** Canvas 2D, CSS
  and SVG verify fine.
- **Browser harness** (this is how to see your own work):
  ```bash
  cd ~/portfolio-handoff && bash browser.sh          # chromium on Xvfb :99, CDP 9400
  WAIT=5000 node shoot.mjs <base> <outDir> /route/   # desktop + phone, EN/BN
  ```
  `playwright-core` 1.64 is installed there. `browser.sh` checks for *any* `Xvfb`
  process, so a leftover on another display makes it skip starting `:99` — kill
  stragglers first.
- **Build locally.** `npm run build && npm run check:build`. Earlier guidance was
  "CI will build it"; that cost this session two CI round trips on failures a
  90-second local build caught immediately. `check-build` only runs against `out/`.
- **The shell is Termux zsh, not bash.** `pkill -f '<pattern>'` **matches and kills
  its own shell** — this bit twice. Use PIDs.
- **Screenshots can lie.** A CSS fix that "looked applied" was not: the media query
  was authored above the rules it overrode. Read computed styles over CDP instead.

---

## 6. Known open items

1. **#42** — `feat: synchronize verification evidence across portfolio and CV`. Open,
   not reviewed by this session.
2. **Tailwind v4 migration.** Dependabot #59 was **closed** (comment on the PR). It is
   a v3.4 → v4.3 breaking change, not a bump: v4 drops `tailwind.config.js` for
   CSS-first config and needs `@tailwindcss/postcss`. Verified locally — it fails with
   `Build failed because of webpack errors ./app/globals.css (postcss-loader)`.
3. **`repo.apiloop.build.passing` is failing**, so the footer reads "16/17 checks
   passing" publicly. **This is correct, not a portfolio bug** — apiloop's CI genuinely
   failed 2026-09-29. Fixing it means fixing `soobujmiah/apiloop`, a different repo.
4. **Phase 4 of the brief — project case studies.** Not done. The brief wants each
   project as problem → architecture → verified technologies → results → source →
   limitations → remaining work, with explicit Verified / In Progress / Planned states.
   Projects currently carry a status plus one evidence line.
5. **Work chapter re-composition.** Listed as "not done" in `docs/CINEMATIC_AUDIT.md`
   before this session, still not done.
6. **`profile.title`** still reads "Independent Software & AI Systems Engineer". The
   owner's correction (2026-10-12) was *"local ai is not main but we can run local
   ai"*. The tagline and Focus & Tools list were reordered; **the title was
   deliberately left alone** — it is gate-locked as `CANONICAL_TITLE` in
   `check-content.mjs` and changing it is the owner's call.
7. **`/3d-prototype/` carries `noindex,follow`** plus a canonical to the real site, so
   it will not rank. Remove that one meta tag if it should.

### Closed, do not reopen without reason

- **The right-edge seam** (`docs/CINEMATIC_AUDIT.md` finding 5) **does not reproduce.**
  Measured 0 horizontal overflow across 8 routes × 2 viewports (1440×900, 390×844@2x).
  It went with the oversized plates that caused it.

---

## 7. How to not repeat this session's mistakes

- **`git fetch` before branching.** This session audited a `main` that was 17 commits
  stale, which produced a conflicting PR and blocked CI entirely.
- **Treat any handoff, including this one, as a claim to verify.** The previous
  handoff described a particle name and a world map that had already been deleted.
- **Measure, don't look.** Two defects this session were invisible in screenshots and
  obvious in computed styles / `curl`.
- **The owner merges on evidence.** State what passed, what failed, and what was not
  checked. Never report a gate as passing without running it.
- **Authority:** commit, push, open a PR and merge are pre-authorised for ordinary work
  once gates pass. Force-push, branch/repo deletion, non-GET `gh api` and A4 actions
  need an explicit confirmed command. Never build Android APKs locally.

---

## 8. Baseline commands

```bash
cd ~/portfolio
npm run check          # 5 gates: content, design, purity, units, verification
npx tsc --noEmit       # typecheck
npx next lint          # lint
npm run build          # gates (prebuild) + static export to ./out
npm run check:build    # validates the export — needs ./out
```

Last full local run on `4fa76f1`: all five gates PASS (105 logic checks),
typecheck clean, lint clean, `check-build` PASS (40 routes, heaviest route
234 KB gz against a 274 KB ceiling, site-wide 343 KB against 388 KB).
