# Design System — Sobuj Miah Portfolio

## Direction

An editorial field-workbench for an operations professional who also builds software and Android/Linux systems. The visual signature is a large, angled phone on a grounded engineering bench, linked to four useful domains: operations, Linux, local AI, and software. The scene supports the story; readable HTML remains the primary interface.

## Palette and type

- Near-black green `#07100c` for the page and deep panels.
- Warm pale green for primary text, muted sage for supporting copy.
- Mint `#62dbb2` for evidence and navigation signals.
- Lime `#cfff69` for action and emphasis.
- Instrument Serif paired with Inter and JetBrains Mono; Bengali uses Noto Sans Bengali and Noto Serif Bengali with system fallbacks.

## Composition

- Wide screens place the semantic hero copy to the left and the workbench to the right.
- Portrait screens keep the full-width phone composition below the hero copy, with a low-opacity wash so the 3D display remains visible.
- Reusable editorial sections use a restrained grid, thin rules, generous spacing, and dark green surfaces.
- Project cards link to an internal detail page and the public repository, and state each project's current boundary.

## Motion and access

Scene movement is slow and pointer response is subtle. The 3D scene is lazy-loaded and uses a capped pixel ratio. Reduced-motion preference stops animation; a keyboard-accessible pause control is available otherwise. The canvas is decorative and all content is available in semantic HTML. Layouts collapse without horizontal scrolling at compact widths.

## Search structure

Each English and Bengali route has a static crawlable fallback, unique metadata, canonical and reciprocal language alternate links, and JSON-LD describing the person and current page. The build produces a route sitemap and 404 page. Google Search Console verification remains in place.
