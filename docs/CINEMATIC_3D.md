# Cinematic 3D environment — research, architecture and decisions

Recorded 2026-10-12 before implementation; the Verification section is
updated with measured results as they are produced. This document is the
Phase 0 research record and the Phase 2 architecture record for replacing
the Canvas 2D environment with a real-time WebGL environment.

## 1. Phase 0 — repository audit (what exists today)

- Framework: Next.js 15.5.27 (static export, `output: 'export'`,
  `trailingSlash`), React 18.3, TypeScript strict, Tailwind 3, framer-motion 11.
- Presentation: a discrete pager (`components/Pager.tsx`) over eight chapters
  (`app/sections.ts`), each with its own server-rendered static route in both
  languages. Wheel, touch, keyboard and direct navigation already work and are
  gate-checked.
- Environment: `components/SiliconWorld.tsx` + `app/silicon.ts` — a procedural
  Canvas 2D chip floorplan ("Silicon Nocturne", `DESIGN_SYSTEM.md` §9) with
  C² camera flights, pointer orbit, pixel budget and a quality ratchet.
- Gates: `check-content` (bilingual parity), `check-purity-adversarial`
  (language purity), `check-design` (tokens = docs = CSS; environment wiring),
  `check-units` (compiled-TS logic tests), `check-verification` (claim
  evidence), `check-build` (routes, metadata, JS budgets) — all run as
  `prebuild` and in CI (`.github/workflows/deploy.yml`), which deploys `out/`
  to GitHub Pages with `actions/deploy-pages` on merge to `main`.
- Deployment target: user root domain (`soobujmiah.github.io`), so no
  `basePath`/subpath handling is required; absolute `/…` asset URLs are
  correct. `.nojekyll` is present.

### Retain / replace / remove

- Retain: all routes, bilingual content, SEO/structured data, the pager and
  its accessibility model, every gate, the deploy workflow, `app/silicon.ts`
  (fallback + document backdrops), DOM project cards and the workstation
  stack copy (they are the accessible controls the 3D scene mirrors).
- Replace: the pager's mounted environment — `SiliconWorld` becomes the
  WebGL-unavailable fallback behind a new WebGL environment.
- Remove: nothing else. No stock media returns (CINEMATIC_AUDIT.md findings
  stand).

## 2. Phase 0 — reference research (inspected 2026-10-12)

- `pmndrs/react-three-next` (MIT): R3F integration pattern with Next; its
  current template targets R3F 8/React 18 era; canvas is a persistent layer
  behind DOM pages — the layering model used here.
- `haitham-kh/project-universe-` (live on GitHub Pages): R3F 9 +
  `@react-three/postprocessing` + GSAP + Lenis on Next 16/React 19; deploys
  `out/` with `gh-pages`. Confirms a real Three.js scene exports statically
  to Pages with no server runtime.
- `Jonathan-Jesni/portfolio-ver-2`: R3F 9 + GSAP/Lenis on Next 16/React 19.
- Three.js r186 and `@types/three` 0.186 are current on npm.

Key compatibility finding: **React Three Fiber v9 requires React 19**; this
repository is React 18 and upgrading React is out of scope for an
environment swap. R3F v8 (React 18) is no longer the current line. Plain
`three` has no React coupling at all.

## 3. Phase 2 — architecture decisions (ADRs)

### ADR-1 — plain `three`, no R3F/drei

The scene is one persistent environment driven imperatively by the pager
index. R3F's value (declarative scene graphs inside React trees) is not used
by this design, R3F 9 would force a React 19 migration, and R3F 8 would pin
a legacy line. Cost matters too: `three` alone is one lazy chunk; R3F + drei
would add more. Decision: `three` r186 only, imported inside one dynamically
loaded module so no pager route pays for it at parse time.

### ADR-2 — no GSAP/ScrollTrigger/Lenis

ScrollTrigger choreographs continuous document scroll. This site's
established, gate-checked interaction model is a discrete pager with inner
scrollers — there is no document scroll to trigger from, and adding one
would hijack reading (`docs/CINEMATIC_AUDIT.md` motivation). Scroll input
(wheel/touch/keyboard) already drives chapter progression; the camera flies
on that same signal through velocity-preserving C² flights (the proven
`silicon.ts` approach, re-derived in 3D in `app/cinematic.ts`). One rAF
loop; no competing animation systems.

### ADR-3 — WebGL is primary, Canvas 2D is the fallback

`CinematicWorld` probes for a WebGL2/WebGL context first. Success → lazy
load the `three` scene module. Failure or runtime error → mount the existing
`SiliconWorld` Canvas 2D environment unchanged. No JavaScript → the CSS
gradient fallback and fully server-rendered chapter content remain readable.

### ADR-4 — typography

"SOBUJ MIAH" is real extruded `TextGeometry` lit in the scene, using the
helvetiker bold typeface JSON from the three.js repository (MIT), served
from `/fonts/` (cacheable, outside the JS budget; the scene renders without
it if the fetch fails). The Bengali identity "সবুজ মিয়া" stays DOM text with
`Noto Serif Bengali` — Bengali shaping (conjuncts, vowel signs, য়া) is
correct in the browser text stack and is NOT reliably correct in triangulated
glyph extrusion, and the grapheme pipeline (`app/graphemes.ts`) already
animates it safely. Honest boundary: no Bengali glyph extrusion.

### ADR-5 — no downloaded 3D models or textures

The environment is 100% procedural (instanced boxes, lattices, extruded
text, canvas-generated grid texture). Zero GLB/texture downloads, zero
third-party visual assets, no licensing risk, and the whole world costs
less than one hero photograph.

## 4. The world — "Silicon Nocturne, dimensional"

The existing brand environment (a nocturnal chip floorplan) becomes a real
dimensional place: a dark wafer plain under a green signal horizon, with one
district per chapter. One coherent space; the camera never cuts, it flies.

| # | Chapter | District composition |
|---|---------|----------------------|
| 0 | home | identity plaza — extruded SOBUJ MIAH on the wafer, rim-lit |
| 1 | presence | measurement field — a bank of instanced columns |
| 2 | about | quiet quad — concentric rings and low slabs |
| 3 | workstation | the layer tower — six slabs that separate into the exploded stack: Android host → Termux → PRoot Debian → ARM64 toolchain → ADB validation → local AI runtime |
| 4 | work | three monuments — LAI (monolith, pulsing core), GGEN (layered sheets), SKB (knowledge lattice) |
| 5 | research | floating wireframe polyhedra over a notebook grid |
| 6 | experience | the year rail — a long bridge of markers |
| 7 | contact | the overlook — camera rises toward the horizon glow |

The DOM chapters remain the content and the accessible interaction surface
(links, cards, keyboard focus); the scene gives them a place. Project
monuments brighten when their chapter is active; the camera orbit follows
the pointer. Claims discipline: the monuments and the stack visualize only
what `app/content.ts` already states with evidence.

## 5. Performance and quality policy

- DPR capped (2 fine-pointer, 1.5 coarse) AND a hard pixel budget; both in
  `app/cinematic.ts` as pure, unit-tested functions.
- One-way quality ratchet: sustained slow frames step the render scale down,
  never up (no oscillation).
- rAF paused when `document.hidden`; rendering is skipped entirely under
  reduced motion except single static frames per chapter.
- `ResizeObserver`-driven resize, full `dispose()` of geometries, materials
  and the renderer on unmount.
- The `three` scene module is a code-split chunk loaded only after a
  successful WebGL probe; the typeface JSON loads from `/fonts/` only when
  that chunk runs.

## 6. Verification status

- Gate results, bundle measurements and browser evidence are recorded in the
  pull request and below as they are produced.
- Measured after implementation (this machine, production build):
  - `npm run check` — content/design/purity/units/verification: PASS
    (check-units now covers the 3D flight, shot table, DPR policy and
    explode logic; 36 new assertions).
  - `npm run typecheck`, `npm run lint` — PASS.
  - `npm run build` + `npm run check:build` — PASS; 76 routes exported.
  - Site-wide gzipped JS: measured 494 KB across 36 chunks (budget ceiling
    500 KB); largest single chunk 83 KB gz; the three.js scene loads as
    lazy chunks no pager route references from HTML — the heaviest route
    payload is 234 KB gz, unchanged and under its 274 KB ceiling. Budget
    rationale updated in `scripts/check-build.mjs`.
  - Headless Chromium 156 (SwiftShader/Vulkan WebGL), 19/19 scenario checks
    PASS: live WebGL context on desktop 1440×900 and mobile 390×844@2x;
    keyboard/wheel-driven chapter+camera progression across all eight
    routes with zero console errors; deep link /work/ boots at its own
    shot with 24 real GitHub links in HTML; reduced-motion renders static
    compositions and navigation still works; `--disable-webgl` mounts the
    SiliconWorld 2D fallback with the name as real DOM text; the mobile
    backing store respects the 1.5 MP coarse-pointer budget (740,610 px);
    Bengali identity renders as shaped DOM text on /bn/. Screenshot
    evidence was reviewed for the identity, workstation, work and contact
    compositions. Software-rendered FPS is not representative of real
    devices and is not reported as a performance claim.
- Owner review boundary: visual quality and real-device performance on
  physical phones (including the Redmi Turbo 4 Pro) remain unverified until
  inspected on the live deployment; this document does not claim them.
