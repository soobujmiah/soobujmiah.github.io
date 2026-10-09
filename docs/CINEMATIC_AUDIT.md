# Cinematic audit — why the previous layer looked low quality

Audited 2026-10-09 against `main` @ `0f7d65a` (PRs #48–#51). Before screenshots
were taken of the live site at 1440×900 and 390×844@2x. This document records
the findings and what replaced them. It is an audit, not a claim of visual
verification of the new build: the new scene was gate-checked, not browser-tested
(see "Verification status").

## 1. What was wrong

| # | Finding | Evidence |
|---|---|---|
| 1 | Stock footage far below screen resolution: WebP plates 1280×720, MP4 loops 1280×720 and 640×360, drawn full-viewport with `cover` plus up to 1.24× zoom. On a portrait phone that is roughly a 6–7× upscale. | `public/cinema/*` (about 17.6 MB) |
| 2 | Footage unrelated to the work: a Mexico City drone shot (a third-party hotel logo sat behind the name on desktop), a generic neon tunnel, a server-rack close-up. | before screenshots |
| 3 | Text over busy imagery: intro, status and tagline sat on lit buildings. | before screenshots |
| 4 | Gimmicky identity: a particle name that kept morphing into service keywords, plus a large dot-matrix clock competing with it. | `SignatureName.tsx` (1070 lines), `name-motion.ts`, `IdentityClock.tsx` |
| 5 | A vertical seam near the right edge at desktop and phone sizes. Most likely cause: oversized plates (`inset: -4%` plus scale and pan) exposing an edge. The cause was not isolated before the plates were removed, so it is **unconfirmed**; it needs a look in a browser. | before screenshots |
| 6 | No single visual system: world map, plates, video, vignette, noise, pointer light, a scene-cut flash and a giant numeral all at once; six font families. | `globals.css`, `site-layout.tsx` |
| 7 | Card monotony: almost every section is translucent rounded cards with backdrop blur. | `components/sections.tsx` |

## 2. What replaced it

**Silicon Nocturne** — one procedural, resolution-independent environment about
the actual subject (on-device software and AI on phone silicon). See
`DESIGN_SYSTEM.md` §9. Removed: all stock media, the world map and its
generated geometry, the particle name, the keyword morph, the clock, the
pointer light, the scene-cut flash, the giant numerals, and three font
families. Added: an editorial serif for display type (Latin and Bengali) and a
masked name reveal.

Gates were updated deliberately, with the reason recorded in each script:
`check-design.mjs` (asserts the removals and that the new scene is wired in),
`check-units.mjs` (the generator, the PRNG, the camera and the projector),
`check-build.mjs` (no stock media ships; every chapter server-renders the
environment; the name is real text).

## 3. Not done in this pass

- **Per-section compositions.** Chapters still use their existing card layouts
  over the new environment. Giving each its own composition is the next step.
- The unused `MOTION.nameAssemble`/`nameCycle` token groups remain in
  `app/design-tokens.ts` because the token block is documented and checked;
  retire them together with their docs in a follow-up.
- The seam (finding 5) is not root-caused.

## 4. Verification status

| Check | Status |
|---|---|
| `npm run check` (content, design, purity, units, verification) | passed |
| `npm run build` and `node scripts/check-build.mjs` | passed |
| Type check | passed |
| Visual check in a browser (desktop, phone, EN, BN), reduced motion, keyboard paging, console errors | **unverified** — WebGL and headless Chromium are unavailable in the build environment; the owner tests |
| Lighthouse / live deploy | **not measured** |
