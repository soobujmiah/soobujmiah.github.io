# Design System — Sobuj Miah Portfolio

## Direction

The design follows `/sdcard/index.html`: graphite background, lime and cyan accents, centered Sora hero type, compact monospace labels, soft 2D light, and a small floating navigation dock. The site stays multi-page. The home page introduces Sobuj and previews a few services and projects; profile, service, experience, project, research, evidence, and contact content each has its own localized route.

No 3D scene, WebGL renderer, or faux-depth artwork is used. Open layouts, short section gaps, dividers, and a limited number of compact panels keep the page from feeling like a stack of boxes. On narrow screens the preview grids collapse and the dock remains usable above the safe area.

## Palette and type

- Graphite `#06070a`, raised graphite panels, and pale text.
- Lime `#cdff57` for emphasis and primary actions.
- Cyan `#57e8ff` for secondary technical details.
- Sora display type, Inter body copy, JetBrains Mono labels, and Hind Siliguri/Anek Bangla for Bengali.
- Optional light theme uses the same lime/cyan accents over a warm near-white surface.

## Content and evidence

The portfolio content is bilingual and keeps project status boundaries visible. Selected engineering evidence was refined against the public GitHub profile README: Ternux's measured Android rendering route, ADT's ARM64 build and device-validation pipeline, LAI's CPU inference and gated GPU path, GGEN's deterministic layout and file persistence, and Songjog's local records and validated exports. Claims that are experimental remain labeled as such.

## Search structure

The bilingual evidence page links project claims to public sources and states the limits of that support. Each English and Bengali route has a static crawlable fallback, unique metadata, canonical and reciprocal language alternate links, and route-aware JSON-LD. The build produces a route sitemap and 404 page. Google Search Console verification remains in place.
