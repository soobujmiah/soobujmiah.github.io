# Environment engine — Silicon Nocturne

The site's continuous background: one abstract, seeded floorplan of a phone
system-on-chip, seen by a perspective camera that moves between chapters.
Pure math lives in `app/silicon.ts` (unit-tested in `scripts/check-units.mjs`);
`components/SiliconWorld.tsx` owns the canvases, the clock and the inputs.
Design intent and identity rules are in `DESIGN_SYSTEM.md` §9; this file
records the **parameters** and why they have the values they have.

The background is decorative: the container is `aria-hidden="true"`,
`pointer-events: none`, and never receives focus or input.

## 1. Clock

| Parameter | Value | Why |
|---|---|---|
| `MAX_FRAME_GAP_MS` | 50 | Engine time advances by `min(real gap, 50 ms)` (`clockStep`). A background tab, a GC pause or a debugger stop never makes the camera jump: motion resumes where it paused. |
| Loop | one `requestAnimationFrame` | Scheduled only while something moves (`motionOn \|\| active`), never twice (guarded by the pending-frame handle), cancelled when the tab is hidden and on unmount. No React state is written per frame. |

All motion is a function of engine time, so it looks identical at 30, 60 or
120 Hz.

## 2. Camera flight between chapters

A pose is `{ x, z, h, yaw, pitch, fov }`. A flight from pose **a** to **b**
over `FLIGHT_MS = 1500` ms:

```
s(t)  = smootherstep(t) = 6t⁵ − 15t⁴ + 10t³          (C², zero velocity and acceleration at both ends)
g(t)  = quintic Hermite velocity basis                 (g(0)=g(1)=0, g'(0)=1, g'(1)=0)
P(t)  = a + (b − a)·s(t) + v·g(t)
h(t) += lift · sin(π·s(t)),  lift = min(140, 0.14 · ground distance)
```

- **Yaw** always takes the short way round (`shortYaw`).
- **Lift** raises the camera mid-flight like a crane move. Because
  `s'(0) = 0`, the arc adds no velocity at the start.
- **Retarget** (paging again mid-flight): the new flight starts at the current
  pose with the current velocity `v`, rescaled to the new duration. Position
  *and* velocity stay continuous, so there is no snap and no visible
  "re-start". (Old behaviour: the velocity dropped to zero on every retarget.)
- **Intro skip:** input during the 1.8 s opening finishes the reveal over
  `SKIP_MS = 450` ms instead of cutting.

## 3. Orbit, dolly and ambient motion

`orbitPose(p, ox, oy, amp, aspect)` moves the camera by `amp` × the view's
half-width/half-height **at the look-at point** and re-aims at that point.
The chapter's subject stays fixed on screen; nearer geometry slides one way
and farther geometry the other. That's real depth parallax, not a 2D pan.

| Parameter | Value | Why |
|---|---|---|
| `amp` (`MOTION.cameraDrift.maxOffsetHw`) | 0.02 | ±2 % of the view: felt, not seen. |
| Follow spring | k = 60, c = 18, m = 1 | Damping ratio ζ = c / (2√(km)) ≈ 1.16: slightly over-damped, so it never overshoots. Semi-implicit Euler sub-stepped at ≤ 8 ms (`springStep`), so it's stable and frame-rate independent. |
| Pointer input | fine pointers only | `(hover: hover) and (pointer: fine)`. Touch never moves the camera. Pointer and scroll listeners are passive; nothing calls `preventDefault`. |
| Scroll dolly `DOLLY_MAX` | 0.07 | At the end of a long page the camera has moved 7 % of the way to its look-at point, through the same spring, so there are no jumps. |
| Ambient orbit `ambientOrbit` | Lissajous, 37 s × 53 s periods | Incommensurate periods never visibly repeat. |
| `AMBIENT_AMP` | 0.42 | Fraction of the pointer range used by the ambient drift. Its amplitude eases on/off over ~2 s. |
| `AMBIENT_FRAME_MS` | 125 | The ambient orbit's fastest on-screen point moves ≈ 1.9 px/s at 1440×900, so a 125 ms step is ≤ 0.25 px, below what anti-aliased lines can show. Unit-tested over every chapter pose. Pointer, scroll, flight and crossfade motion still redraw every frame. |

Ambient orbit and dolly run only on fine-pointer, full-detail screens at
quality level 0. Phones hold the camera still between chapters.

## 4. Depth fog and atmosphere

Fog is continuous in distance, so nothing pops between hard depth bands:

```
visibility(r) = exp(−(r / FOG_DISTANCE)^FOG_SHAPE),   FOG_DISTANCE = 1150, FOG_SHAPE = 1.6
```

For the floor plane, the distance along a screen row's ray is `h / sin(θ)`,
where θ is the row's angle below the horizon. So the fog is an **exact**
vertical gradient. `atmosphere()` folds sky, fog and the horizon glow into
**one** gradient using exact source-over algebra:

```
fog (colour F, alpha f) then glow (G, g)  ≡  one layer:
a = 1 − (1 − f)(1 − g),   C = (F·f·(1 − g) + G·g) / a
above the horizon:        C = S·(1 − g) + G·g,  a = 1   (opaque sky)
```

40 depth-spaced stops keep the canvas's linear interpolation within
**0.93/255** of the separate passes (unit-tested ≤ 1/255 over every chapter
pose, against background, wire and lit-wire colours). This is one full-screen
fill instead of three.

## 5. Chapter light

Each chapter lights the region of the chip it is about (`FOCUS`).

| Parameter | Value | Why |
|---|---|---|
| `lightAt` | 1 in the region core, smooth falloff across `LIGHT_EDGE = 170` | A pool of light, not a rectangle. |
| `litLevels` thresholds | 0.26 / 0.62 | Two lit tiers per line, precomputed once per plan. No per-frame light maths. |
| `LIT_GAIN` | [0, 0.28, 0.6] | Lit overlay strength per tier. Tuned with the readability gate (§8), so lit lines never cost text contrast. |
| `chapterGain(rects)` | `clamp(7·10⁵ / area, 0.25, 1)` | Big regions (the I/O ring) are lit more gently than small ones, so a large chapter can't flood the screen. |
| Light pool | ground disc of radius `min(520, 0.55 · extent + 100)`, peak alpha 0.07 × gain | Projected as a perspective-correct ellipse from a pre-rendered 128 px sprite. It's drawn into the scene layer beneath the wires and inside the fog, so it costs nothing while the camera rests. |
| `FOCUS_MS` | 1100 | Crossfade between the previous and the current chapter's light (smootherstep). |

Camera poses are composed so lit regions sit in the layout's negative space.
For example, About's memory arrays occupy the empty lower-left, not the text
column: about 10 % of the region falls inside the text box, down from 32 %,
with the same share of the region on screen.
The pose was found by a numeric search with the real projector.

## 6. Signal pulses

Seeded routes, each with its own speed and phase. A pulse is a 150-unit tail
(`PULSE_TAIL`) drawn in 10 segments with rising alpha and width. It fades in
after leaving its start and out before reaching its end, so nothing pops.
Pulses on the lit region burn brighter (weight 0.32 → 1.0, crossfaded with
the light). Pulses are the only per-frame drawing while the camera rests.

## 7. Performance budget

| Parameter | Value | Why |
|---|---|---|
| DPR | capped at 2 | Beyond 2× there's no visible gain for 1 px lines. |
| `PIXEL_BUDGET` per canvas | 2.6 MP / 1.4 MP / 0.9 MP by quality level | `pixelRatioFor` lowers the render scale to fit, never below 1×. A 1440×900 screen at 2× renders at ≈ 1.42× (2040×1275); a 2× 1440p screen renders at 1×. |
| Quality ratchet | steps down when the median of the last 45 motion-frame intervals > 30 ms | One-way per session (`sessionStorage['silicon:quality']`). Level 1 shrinks the budget and stops ambient motion; level 2 also switches to the lite plan. |
| Lite plan | phones (< 700 px) and quality 2 | Fewer detail lines. |
| Pose handoff | `sessionStorage['silicon:pose']`, valid 4 s | Navigating between routes continues from the current camera instead of restarting. |
| Hidden tab | loop cancelled | `visibilitychange`. The clock clamp (§1) makes resumption seamless. |

Scene and light canvases redraw in lockstep, so pulses never slide against
the wires. The scene canvas redraws only while something moves (flight,
crossfade, pointer spring, dolly) or on the ambient cadence.

## 8. Reduced motion and fallbacks

- `prefers-reduced-motion: reduce`: one static, fully revealed frame per
  chapter with the chapter light. No flight, orbit, dolly, ambient drift or
  pulses. The rAF loop doesn't run at all.
- No JavaScript: the CSS gradient on `.silicon-world` remains, and the
  `.silicon-grade` scrim keeps text legible.
- Server HTML contains the empty canvases only, so the environment never
  blocks first paint.

## 9. Verification

`npm run check:units` locks the math: flight continuity under retarget, yaw
wrap, orbit pivot preservation, spring stability, clock clamping, fog
monotonicity, atmosphere equivalence, ambient step bound, light thresholds,
chapter gain and pixel budgets.

Visual readability is checked with a separate Playwright harness, not part of
CI. For every visible text element, it renders the page with text made
transparent and compares the text's contrast on the real background (95th
percentile, inset from borders) against the flat brand background. Results
for each change are in its PR.
