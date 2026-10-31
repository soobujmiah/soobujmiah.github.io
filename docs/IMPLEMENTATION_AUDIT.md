# Portfolio Implementation Audit

## Current direction

The project keeps the existing React/Vite/Three.js application and replaces the previous flat, front-on phone scene with a physically layered engineering workbench. The new scene uses oblique perspective, a raised phone cradle, a visible side profile, a high-contrast display, four elevated work modules, routed 3D traces, and restrained parallax. It stays decorative while the content and navigation remain semantic HTML.

The bilingual content source is `src/data/site-content.json`. It carries the profile, the seven dated work-history entries, six skill groups, the eight public project pages, and the complete GitHub README service list plus three source-file service categories. The original SD-card file includes unsupported GPU/LLM throughput, context-size, and NPU claims; these were not repeated as verified achievements. The copy keeps CPU inference as the verified AI baseline and states device-specific limits for GPU/NPU work.

## Implemented structure

- English and Bangla home, about, services, experience, projects, research, and contact pages.
- Eleven service detail routes and eight public project detail routes in both languages.
- Static HTML route entries with unique metadata, canonical URLs, reciprocal `hreflang`, route-aware JSON-LD, sitemap, robots file, and a 404 page.
- A lazy-loaded Three.js workbench, adaptive camera framing, reduced-motion support with a visible play/pause control, and a CSS depth fallback.
- Preserved Google Search Console verification meta tag and HTML file.

## Validation

- `npm run check`: TypeScript, source hygiene, and 21 portfolio-source checks passed.
- `npm run build`: all 52 bilingual route files and 33 production checks passed.
- Gzipped initial JavaScript: 66.4 KiB; lazy scene plus Three.js: 129.8 KiB.
- `npm audit --audit-level=low`: zero vulnerabilities.
- Local route and Search Console asset requests returned HTTP 200.

## Native Firefox review

The already-open native Termux:X11 Firefox showed the prior render: a dark, front-on phone face with almost no visible 3D depth. This observation drove the camera, geometry, display UV, and overlay changes. Native Firefox now renders the angled, lit workbench and readable module displays. Its visible “Pause 3D motion” control confirms playback is active; frame samples from the phone/workbench area changed over time. The control stays inside the hero content so it remains visible and keyboard-accessible. On reduced-motion systems the scene starts paused, with an explicit play control available.
