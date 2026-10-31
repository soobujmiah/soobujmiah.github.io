# Portfolio implementation audit

**Date:** 2026-10-31
**Scope:** Implementation and verification of the existing public portfolio, including native Termux:X11 Firefox review.

## Outcome

I kept the existing Pocket Systems Lab direction and improved its project evidence, keyboard access, text alternatives, page metadata, and deployment documentation. I added bilingual field notes for Ternux/Android, the ADT ARM64 toolchain, LAI local inference, and GGEN. Each note states its evidence and boundary, and links to a public source. I retained the six existing featured projects; I did not invent entries for private or unavailable repositories.

## Changes

- Added project-aware titles, descriptions, canonical and social URL metadata, and direct project-route fallback content.
- Added a skip link and keyboard transition from the 3D scene to its readable text view. Replaced misleading tab semantics with a labelled group of buttons and pressed states.
- Added a visible, labelled action for switching between the 3D scene and its readable view, plus bilingual labels.
- Replaced the empty Notes archive with sourced field notes and matching 3D scene summaries.
- Updated the route generator, sitemap date, portfolio verifier, README deployment description, and historical note in the design-system document.

## Verification

- `npm run check`: TypeScript, lint (9 files), and source verifier passed (15/15 checks).
- `npm run build`: production build completed; 12 direct routes generated and production-output verification passed (36/36 checks).
- Initial gzipped JS was 65.2 KiB against the 80 KiB budget. The lazy 3D route and Three.js payload totaled 134.2 KiB against the 140 KiB budget.
- Production preview returned HTTP 200 for the home page, six station routes, and six project routes. Titles, headings, canonicals, project source links, and referenced JS/CSS assets were present and returned successfully.
- The Pages workflow run `41185830856` for commit `3712a55` completed both build and deploy successfully. The live home, Notes, and Ternuxx project routes returned HTTP 200 with the updated content and route metadata.
- `git diff --check` passed.

## Xvfb visual review

Firefox under Xvfb captured screenshots at 1440×1000 desktop and 390×844 mobile. The 3D scene renders in the desktop capture; the mobile heading, calls to action, menu, and scene controls fit in the viewport. Screenshots: [desktop](audit-screenshots/desktop.png) · [mobile](audit-screenshots/mobile.png). These captures are headless Xvfb evidence and do not establish a native Termux:X11 Firefox pass.

The earlier PRoot Firefox session logged a missing `libpci` warning. Native Termux visual evidence is recorded below.

### Native Termux follow-up — 2026-10-31

The Ternuxx native session repair was applied locally and `tx status` reports XFCE on display `:1`. I inspected the already-open native Firefox at the local preview (`http://127.0.0.1:4174/`, X11 size 752×1155) and opened `/notes/`. The portrait scene initially used a landscape panel because its layout only checked for widths below 600px. I changed the 3D layout to use viewport orientation and fixed the canvas text wrapper. Portrait opens in Text view, where the Notes heading and all four bilingual cards, evidence boundaries, and source links are readable. The earlier optional 3D view had a small centered panel and text artifacts. The follow-up below fixes that by increasing portrait camera framing and canvas text size, allowing three lines per note, and switching compact viewports to low-power rendering (pixel ratio 1, shadows disabled). The Notes portrait 3D panel now fills most of the screen and all four summaries are readable. Capture: [portrait 3D fixed](audit-screenshots/native-firefox-portrait-3d-fixed.png). Other captures: [portrait default](audit-screenshots/native-firefox-portrait-default.png) · [initial issue](audit-screenshots/native-firefox-3d-issue.png) · [Notes text view](audit-screenshots/native-firefox-notes-text.png). The check used the already-running native Firefox process; no Android browser was opened.

## Release state

### Follow-up fixes — 2026-10-31

- Upgraded Vite to 6.4.5, which includes patched Vite/esbuild versions covering all nine open Dependabot alerts. `npm audit` now reports zero vulnerabilities.
- Updated GitHub Actions to Node 24-compatible releases: checkout v7.0.1, setup-node v7.1.0, upload-pages-artifact v5.0.0, and deploy-pages v5.0.1.
- Added `npm audit --audit-level=low` to the Pages build workflow so future vulnerable dependency updates fail CI.
- `npm run check` passed (16/16 source checks); `npm run build` passed (37/37 production checks). Native Termux:X11 Firefox at 752×1155 displayed the updated portrait 3D Notes view clearly, and the live Notes route returned HTTP 200 after deployment.
- GitHub's dependency SBOM now lists Vite 6.4.5 and esbuild 0.25.12. Local `npm audit` reports zero vulnerabilities, but the Dependabot API still listed nine open alert records last updated 2026-10-26; those records had not refreshed after the fixed lockfile reached `main`.

The repository deploys on pushes to `main`, as described above. Workflow run `41187064985` deployed commit `efc005f` successfully. A later follow-up adds the npm audit CI step; verify that run before closing the follow-up milestone.
