# Handoff — soobujmiah.github.io

> **TEMPORARY FILE. DELETE IT WHEN THE WORK IN §6 IS DONE.**
>
> This is a session handoff, not a standing document. It exists so the next agent can
> pick up mid-stream. Once the open items in §6 are finished or formally dropped,
> **delete this file in the same PR** and move anything still true into
> `README.md`, `DESIGN_SYSTEM.md`, `docs/`, or SKB — wherever it actually belongs.
> A handoff that outlives its session becomes a lie.
>
> The permanent agent contract is `AI_ASSISTANT.md`. Read that first; this second.
> The shipped architecture is `docs/STAGE.md`. Read that before touching the
> environment, the chapters or the stylesheet.

Written 2026-10-14 by a Claude Code CLI session (PRoot Debian on the Redmi Turbo 4 Pro).
**Verify any claim here against live state before relying on it** (see §7).

---

## 1. State at handoff

| Item | Value |
|---|---|
| Repo | `soobujmiah/soobujmiah.github.io`, clone at `~/portfolio` |
| Branch | `feat/inside-one-device` → **PR #74**, CI green (build, test, repo-contract) |
| `main` | `2523027` at branch point (rebased onto it) |
| Deployed | See §6 item 1 — merging PR #74 is what ships it |
| `node_modules` | present; `npm run build` verified green locally |

**Read first:** `~/portfolio/AI_ASSISTANT.md`, then SKB `~/skb/ASSISTANT_CONTEXT.md`,
then `~/portfolio/docs/STAGE.md`, then `DESIGN_SYSTEM.md` §5, §8 and §9.

---

## 2. Architecture (verified this session)

Next.js **15.5.27** static export, React 18, TypeScript strict, Tailwind **3.4**.
`three` is the only environment dependency, imported by **exactly one module**, and
only after a successful WebGL probe. **framer-motion is no longer imported anywhere**
(it is still listed in `package.json` — see §6).

**Eight chapters** (`app/sections.ts` is the single registry):
`home · presence · about · workstation · work · research · experience · contact`
plus 9 service pages and 1 verification page, all mirrored under `/bn/`.
**40 exported routes = 36 primary + 4 legacy aliases.**

The concept, the strata table, the camera maths, the quality policy and the
one-subject enforcement are all in [`docs/STAGE.md`](docs/STAGE.md). In short:

- `app/stage.ts` — pure maths (strata, stations, flight, DPR policy, presence,
  evidence marks, dust). No renderer import. 100 unit checks.
- `components/Stage.tsx` → `components/stage-scene.ts` — the one WebGL
  environment, lazily imported after a context probe.
- `components/StageFallback.tsx` — the same machine in Canvas 2D.
- `components/record.tsx` → `components/chapters.tsx` — the typographic system
  and the eight chapters, all server-renderable.
- `components/Journey.tsx` — input → one depth change at a time, URL sync.
- `components/DepthRail.tsx`, `components/chrome.tsx` — the gauge, and the one
  masthead/footer the service and verification documents also mount.

---

## 3. What this session shipped (on the branch, not yet merged)

A scratch rebuild, requested as "puro clean kora, scratch theke remake, current
design nibo na, three.js diye ekta cinematic living website".

**Deleted outright** (not ported): `Pager.tsx`, `NavOverlay.tsx`, `WorldStory.tsx`,
`CinematicWorld.tsx`, `cinematic-scene.ts`, `app/cinematic.ts`, `SiliconWorld.tsx`,
`app/silicon.ts`, `SiliconDocumentBackdrop.tsx`, `TiltCard.tsx`, `DocumentMotion.tsx`,
`PullToRefresh.tsx`, `sections.tsx`, `ui.tsx`, and ~2,000 lines of `globals.css`.
Nine of the ten motion token groups went with them.

**Kept deliberately:** `content.ts` (and its two-way purity), the section registry
and every route/SEO contract, `verification/` and the generated proof line, the
brand colour tokens, `graphemes.ts`, and the `smoothDamp`/DPR/ratchet maths — those
were correct, and only the layers above them were the problem.

| Measure | Before | After |
|---|---|---|
| visible server-rendered text, home | 226 (audit baseline) | **868** |
| site-wide JS, gzipped | 494 KB | **422 KB** |
| largest chunk | ~185 KB | **82 KB** |
| heaviest route | 272 KB | **186 KB** |
| motion token groups | 10 | **4** |

Gate ceilings in `check-build.mjs` were lowered to sit just above what ships.

---

## 4. Traps — read before writing code

**These are enforced. Violating one fails the build, not review.**

1. **One environment.** `check-design.mjs` asserts that exactly one module imports
   `three` (`components/stage-scene.ts`) and that `Journey.tsx` mounts exactly one
   `<Stage>`. A second scene, backdrop or overlay fails the build by design — that
   is the whole point of the rebuild.
2. **The retired systems may not come back**, by path or by class name. The banned
   list includes `cinematic-world`, `silicon-world`, `world-beat`, `cinema-word`,
   `hero-name`, `pager-*`, `sig-sweep`, `backdrop-filter`/`backdrop-blur`,
   `mix-blend-mode`, and the older stock-media motifs. The scan reads source **and**
   the built stylesheet, so **do not write these strings even in a comment.**
3. **`check-build` asserts the literal `class="stage" aria-hidden="true"
   data-stratum="N"`** per route, exactly one `<canvas>` per route, and that the
   home `h1.chapter-heading` reads exactly `Sobuj Miah` as plain text.
4. **The stage is a readout.** Marks come from `app/verification-summary.json` via
   `distributeMarks`. Do not decorate it with invented marks; a unit check asserts a
   failing claim is always visible and never lands on stratum 0.
5. **Two-way language purity.** EN fields: zero Bengali codepoints. BN fields: zero
   Latin, including tool names (`টারমাক্স`, `পি-রুট`, `ভলকান`). Verbatim-ASCII fields
   live in `IDENTIFIER_PATHS` in `scripts/check-content.mjs`.
6. **Digits must localise.** `localizeDigits(value, lang)`. Runtime-generated digits
   are invisible to the content gate — this session shipped Latin `01`–`06` into the
   Bengali workstation chapter and only a rendered page caught it. Again.
7. **Arrows live in `Ref`, not in copy.** Several `content.ts` labels have an arrow
   baked in ("Code ↗"). `Ref` strips a trailing arrow and renders its own, so a
   call site must not add one either.
8. **Never hand-edit verification claim numbers.** Regenerate; see `AI_ASSISTANT.md`.
9. **`title.template`.** The root layout appends `— <name>`; a page whose own title
   ends with the name must use `title: { absolute: … }` or it ships twice.
10. **One registry.** `app/sections.ts` is the only chapter list; `check-build`
    derives its expected `data-stratum` indices from it.

---

## 5. Environment facts (verified 2026-10-14)

- **WebGL still does not work here.** Chromium 154 on Xvfb reports
  `webgl: false` (PRoot has no `/proc/bus/pci/devices`; SwiftShader aborts the
  browser). **Everything visually verified this session was therefore the Canvas 2D
  fallback.** The WebGL stage is verified only by its unit tests, its gates and code
  review — *not* by looking at it. Someone with a real GPU must confirm
  `components/stage-scene.ts` renders as intended before this is called done.
- **Browser harness** (this is how to see your own work):
  ```bash
  cd ~/portfolio/out && setsid python3 -m http.server 8099 &   # serve the export
  cd ~/portfolio-handoff && bash browser.sh                    # chromium on Xvfb :99, CDP 9400
  WAIT=4000 node shoot.mjs http://127.0.0.1:8099 <outDir> / /work/
  node probe.mjs                                               # computed styles / metrics
  ```
- **Measure, don't look.** The stray hairline at `x=389` on the desktop frame was
  found by reading pixel luminance out of the PNG, not by eye; it was the nearest
  stratum's outer edge, and `StageFallback` now suppresses the edge of any plane
  that overflows the frame.
- **The shell is Termux zsh, not bash.** `pkill -f '<pattern>'` **matches and kills
  its own shell** — it happened again this session. Use PIDs, or `setsid`.
- **Build locally.** `npm run build && npm run check:build`. `check-build` only runs
  against `out/`.

---

## 6. Known open items

1. **The WebGL scene is visually unverified** (§5). Highest-value next check: open
   the live site on the phone and confirm `components/stage-scene.ts` renders the
   strata, the aperture and the evidence marks as intended. Everything verified so
   far was the Canvas 2D fallback.
2. **`repo.apiloop.build.passing` is failing**, so the footer reads "16/17 checks
   passing" publicly. **That is correct, not a bug** — apiloop's CI genuinely failed
   2026-09-29. Fixing it means fixing `soobujmiah/apiloop`.
3. **Phase 4 of the brief — project case studies.** Still not done. Projects now
   carry status, role, evidence, topics and both links in one record shape, which is
   the structure a case study would extend.
4. **`profile.title`** still reads "Independent Software & AI Systems Engineer" and
   is gate-locked as `CANONICAL_TITLE`. Changing it is the owner's call.
5. **`/3d-prototype/` carries `noindex,follow`** plus a canonical to the real site.

---

## 7. How to not repeat this session's mistakes

- **`git fetch` before branching.**
- **Treat any handoff, including this one, as a claim to verify.**
- **Report what was actually run.** This session verified the 2D path, the markup,
  the gates and the budgets; it did **not** verify the WebGL render, and says so.
- **The owner merges on evidence.** State what passed, what failed, and what was not
  checked.
- **Authority:** commit, push, open a PR and merge are pre-authorised for ordinary
  work once gates pass. Force-push, branch/repo deletion, non-GET `gh api` and A4
  actions need an explicit confirmed command. Never build Android APKs locally.

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

Last full local run on this branch: all five gates PASS (100 logic checks),
typecheck clean, lint clean, `check-build` PASS (40 routes, home 868 visible chars,
heaviest route 185 KB gz against a 200 KB ceiling, site-wide 422 KB against 440 KB).

36 stale remote branches remain, each one the head of an already-merged (squashed)
PR, so their content is on `main` and the refs are dead weight. They are listed with
their PR numbers in the session log; deleting them is one `git push origin --delete`
per branch and needs the owner's explicit go-ahead.
