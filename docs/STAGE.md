# Inside One Device — the stage

The architecture of the 2026-10-14 rebuild. This document is the reference for
`app/stage.ts`, `components/stage-scene.ts`, `components/Stage.tsx`,
`components/StageFallback.tsx`, `components/record.tsx` and
`components/Journey.tsx`. It supersedes `docs/ENVIRONMENT.md`,
`docs/CINEMATIC_3D.md`, `docs/SPATIAL_PORTFOLIO.md` and
`docs/MOTION_HANDOFF.md`, which describe the systems this rebuild removed and
are kept only as history.

## 1. Why it was rebuilt

Three independent visual systems were mounted at the same time:

| System | Added | What it drew |
|---|---|---|
| `CinematicWorld.tsx` + `cinematic-scene.ts` | PR #73 | a WebGL "silicon city" of eight districts spread to `z = -232` |
| `SiliconWorld.tsx` + `app/silicon.ts` | PR #52 | a Canvas 2D chip floorplan, also used behind the documents |
| `WorldStory.tsx` | PR #48 → #73 | a text overlay with projected pins onto whichever world was live |

Each was good work. None replaced its predecessor, so by PR #73 the page was
compositing a district map, a floorplan and an overlay simultaneously, plus
five framer-motion spring systems (page turn, tilt, reveal, signature, camera
drift). The site did not read as a place — it read as layers, which is exactly
what a reader reported.

The failure was structural, not aesthetic: nothing in the repository made a
second environment impossible. So the rebuild is not a new skin. It is **one
subject**, with gates that make a second one fail the build.

## 2. The concept

Everything in this portfolio was built from inside a single Android phone. So
the site is not a page with a picture of a device on it. **The site is inside
the device**, and the reader travels *into* it along the depth axis.

Each chapter is a **stratum** of the real stack, in real dependency order:

| # | Stratum | Chapter | What the layer is |
|---|---|---|---|
| 0 | `surface` | home | the glass: identity, the thing you touch first |
| 1 | `display` | presence | focus & tools — the instruments on the surface |
| 2 | `silicon` | about | the constraint the work is shaped by |
| 3 | `userland` | workstation | Termux → PRoot Debian, the workstation itself |
| 4 | `toolchain` | work | the projects that needed native ARM64 tooling |
| 5 | `frontier` | research | the experimental, unqualified edge |
| 6 | `bus` | experience | the long line through the years |
| 7 | `port` | contact | the way out of the machine, to people |

Moving on means going **deeper**, not further down a page. Every stratum
carries a central aperture, so the chapters ahead are visible through the ones
in front, fading into haze: the reader can always see there is more machine
behind this one.

## 3. The two architectural rules

**One subject.** A chapter may change the camera's depth and what is
emphasised. It may never introduce a second environment.

**The world tells the truth.** The instrument marks etched into the strata are
not decoration. Their count and state come from
`app/verification-summary.json` — the same generated projection the footer's
proof line and `/verification/` read. One machine check is currently failing,
so one mark is visibly dark. The scene cannot flatter the work.

Both rules are enforced by `scripts/check-design.mjs`:

- the retired files must not exist (by path);
- the retired vocabulary must not appear in any new file (by class name);
- **exactly one module may import `three`** — `components/stage-scene.ts`;
- `components/Journey.tsx` must mount **exactly one** `<Stage>`;
- `Stage` must probe WebGL, lazy-load the scene, fall back, pause when hidden
  or off-screen, honour reduced motion, resize at native resolution, and feed
  the evidence summary into the scene;
- `StageFallback` must draw the **same strata from `app/stage.ts`** with the
  same discipline;
- both document shells must use the one shared chrome.

## 4. The layers of the implementation

```text
app/stage.ts              pure math: strata, stations, flight, quality,
                          presence, evidence marks, motes. No three.js.
                          100 unit checks in scripts/check-units.mjs.
components/stage-scene.ts the only module that imports three.js. Consumes
                          the numbers above; owns none of them.
components/Stage.tsx      the host: WebGL probe, lazy import, pause policy,
                          pointer parallax, reduced motion, resize.
components/StageFallback.tsx the same machine in Canvas 2D, for browsers
                          with no WebGL at all.
components/record.tsx     the typographic system (Chapter · Block · Rows ·
                          Record · Ref · Tags · Prose). Server-renderable.
components/chapters.tsx   the eight chapters, built only from content.ts.
components/DepthRail.tsx  the navigation, which is a depth gauge.
components/chrome.tsx     one masthead and one footer for the whole site.
components/Journey.tsx    input → one depth change at a time; URL sync.
```

The direction of dependency is the point: numbers never depend on the
renderer, and the renderer never invents a number.

## 5. Camera

The camera is four independently damped scalars — depth, lateral, lift, roll —
aimed down the depth axis, so attitude is roll only and no quaternion is
needed. Each axis chases its station with `smoothDamp` (critically damped: no
overshoot, continuous velocity, and a retarget mid-flight inherits momentum,
so a fast reader bends the path instead of cutting it).

Flight times come from `MOTION.flight` in `app/design-tokens.ts`. Depth is the
slowest axis (1.5 s) because entering a stratum must read as travel.
`MOTION.input.lockMs` (900 ms) is the gesture lock, so one wheel tick, swipe or
arrow press is worth exactly one stratum.

Framing: `FOV` is 54°, and `portraitCompensation` stands the camera further off
as the viewport narrows, instead of maintaining a second station table for
phones. `subjectOffset` shifts the machine off-axis **only** in landscape,
where the text column does not cover it.

## 6. Quality policy

- `pixelRatioFor3D` — a cap by pointer class (2× fine, 1.5× coarse) *and* a
  hard pixel budget, whichever is tighter, with a 0.75 floor so edges never
  dissolve.
- `ratchetScale` — a sustained slow frame average steps the render scale down
  once, one-way, never back up, floor 0.6. No oscillation.
- `stratumPresence` is the scene's **only** brightness authority: a chapter
  cannot light itself independently, which is what keeps a composition from
  accumulating layer by layer.
- The scene pauses on `visibilitychange` and when the host scrolls off screen.
- Under `prefers-reduced-motion` there is no animation loop at all: one static
  frame per stratum.

## 7. What a reader gets without JavaScript

Everything that matters. Each route is a static document whose chapter text is
in the HTML; `.stage` carries a CSS gradient so the page still has depth; the
depth rail is a list of real anchors to real routes, so navigation works; and
the masthead, footer and proof line are plain markup. The canvas ships **empty**
— `scripts/check-build.mjs` asserts exactly one canvas per route and that no
canvas carries content.

Measured on the home route: **868 visible characters** of server-rendered text
(the 2026-10 audit baseline, before any of this work, was 226).

## 8. Budgets after the rebuild

| Measure | Before | After |
|---|---|---|
| site-wide JS, gzipped | 494 KB | **422 KB** |
| largest single chunk | 190 KB ceiling, ~185 KB used | **82 KB** |
| heaviest route | 272 KB | **186 KB** (`/services/`, which loads no 3D at all) |

framer-motion, the pager, the tilt cards, the story overlay, the HUD overlay,
the pull-to-refresh gesture and the custom cursor were deleted outright rather
than ported. The ceilings in `check-build.mjs` were lowered to sit just above
what actually ships, so the next regression is caught instead of absorbed by
headroom left over from a heavier build.
