# Spatial portfolio redesign — 2026-10-12

## Direction and evidence

The portfolio is an architectural exhibit of a phone becoming a workstation.
This reflects the documented development chain: Android host, Termux,
PRoot Debian, ARM64 tooling, device validation and local AI runtime. The
projects extend from this foundation into software and evidence-led research.
The audience is potential collaborators, technical peers and clients who need
to understand both the work and its proof.

The reference research used [Bruno Simon's 3D portfolio](https://bruno-simon.com/)
for the lesson that one navigable world can carry the work, and the
[Three.js documentation](https://threejs.org/docs/) for the implementation
of lit geometry and camera movement. The resulting visual system is original:
a silicon city with grounded inscriptions, distinct district objects, and a
continuous camera path. It deliberately avoids stock sci-fi scenery.

## Composition

- One real, crawlable static route per chapter and language, with exactly one
  semantic heading and selectable body text.
- Desktop: a quiet reading datum on the left, visible monument and depth on
  the right. An illuminated sightline joins the two.
- Portrait: visible scene above the inscription; the page scrolls natively
  until its edge, then the pager advances. The footer and chapter control stay
  clear of the last content line.
- No card grids, floating statistics, status overlays or duplicate chapter
  captions. Project information is arranged as engraved records alongside
  the three-dimensional work district.
- English and Bengali share the same composition; Bengali uses its own font,
  shaping and numeral localization.

## Engine and failure paths

WebGL uses the existing lazy Three.js scene, now with brighter slab materials,
a broad hemisphere/key light, clearer floor and slower fog. Research objects
have solid surfaces. Canvas 2D uses stronger line contrast and retains its
chapter-specific focus. A CSS ground and sightline carry static HTML when
JavaScript is off. The scene is decorative and `aria-hidden`; links, evidence
and navigation remain DOM elements.

## Verification boundary

Repository gates, production export, EN/BN routes, desktop/portrait layouts,
Canvas 2D fallback, reduced motion, no-JavaScript HTML and navigation must be
rechecked after implementation. The local PRoot Chromium GPU aborts when
SwiftShader is forced (`/proc/bus/pci/devices` is unavailable), so this runtime
cannot supply a new visual screenshot of the WebGL renderer. The earlier
[WebGL qualification](CINEMATIC_3D.md) verified the preceding version; its
screenshots do not verify this redesign's lighting changes. This distinction
must be carried into the completion report.
