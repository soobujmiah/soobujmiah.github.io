# 3D motion handoff

I continued the existing `feat/motion-3d-depth` implementation from `db4eecc`,
with a recovery branch at `snapshot/2026-10-06-motion-review`.

The implementation includes page z-depth, token-driven numeral parallax,
3D reveals, presence-card tilt, evidence-backed count-up, and pointer camera
drift. I corrected motion-preference transitions, touch camera input,
pointer cancellation, and flight/drift composition. Existing bilingual copy,
claim evidence, static routes, and the brand palette remain the source of truth.

Verification uses the existing content, purity, design, unit, verification,
lint, typecheck, and static-export gates. GitHub PR CI is authoritative for
build and export validation. This environment has Node/npm and authenticated
GitHub access on ARM64; no installed browser was found in the usual executable
paths. Visual mouse/touch and live reduced-motion inspection remains an owner
review boundary; automated checks do not establish visual quality.

Production publication requires owner approval: merging this repository's PR
triggers the GitHub Pages deployment workflow. Keep the feature branch and PR
for review until that approval is given. No temporary downloads or toolchain
installations were needed.

## 2026-10-09 — environment continuity

The background engine was rebuilt for continuity: velocity-preserving flight
retargets, a clamped engine clock, continuous depth fog, pivot-preserving
pointer orbit with an over-damped spring, chapter-light crossfades composed
away from text, a pixel budget with a one-way quality ratchet, and a single
lockstep render loop. Parameters, math and their tests: `docs/ENVIRONMENT.md`.
