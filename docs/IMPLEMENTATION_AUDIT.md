# Portfolio Implementation Audit

## Current direction

The site is a bilingual, multi-page portfolio built with React, TypeScript, and Vite. It uses a graphite base with lime and cyan accents, Sora display type, compact monospace labels, a single floating bottom dock, and restrained scroll motion. There is no WebGL or 3D runtime.

The home page is a concise introduction: hero, profile preview, an index of featured services, an index of selected work, and contact. Full profile, services, service details, experience, projects, project details, research, evidence, and contact each have separate English and Bangla routes.

## What changed in the latest pass

- Removed the top-left hamburger menu. It duplicated the dock, which already reaches every page; the dock now keeps all six page icons visible at every breakpoint instead of hiding the secondary pages.
- Fixed the hero role line. The `>` prompt, the role text, and the caret were separate flex items, so a long line broke them onto three different lines on phones. They are one inline flow now.
- Replaced the blinking caret with a real typewriter loop (type → hold → delete → retype) that segments on grapheme clusters, so Bengali conjuncts type whole. The full sentence stays available to screen readers.
- Closed the dead air above the hero badge: top padding drops from 88–128px to 30–104px depending on viewport, and the hero no longer forces a full viewport height on phones.
- Slimmed the footer to one metadata line plus social profiles and the claims link. It no longer repeats the name, the page title, or the page navigation.
- Cut home-page duplication. The heavy project grid and the service accordion duplicated the dedicated projects and services pages; both are now compact index rows that point at the full pages.
- Replaced the project list inside the terminal card with the current focus list, so the card no longer repeats the projects page either.
- Added a 2px scroll-progress bar and staggered reveal timing so several sections entering together cascade instead of appearing at once.
- Widened the keyword coverage: 32 English and 27 Bengali site-level terms, plus niche vocabulary for each project (`proot-distro`, `Termux:X11`, `GGUF quantization`, `AOSP build`, `on-device LLM`, and Bengali equivalents). See [SEO.md](SEO.md).
- Pinned the hero role line so the typewriter cannot move the page. The block reserves a fixed height and the inner line has a constant width, so the `>` prompt stays on the same left edge and nothing below shifts as text is typed and deleted.
- Rotated the hero role line through five trades instead of repeating one sentence: software and AI systems engineering, Linux on Android and Termux desktops, on-device local AI with llama.cpp, Flutter/web/Android development, and office operations. Both languages carry their own set.
- Linked the projects that ship their own site. Ternux and ADT now expose `website` in the content model, surface a "Visit website" link on the projects grid and a primary button on their detail pages, and publish it as `sameAs` in their JSON-LD.
- Added a client-facing "how it goes" section to the home page: scope in writing, checkpoints you can open, handover with notes. It describes process rather than promising outcomes, so it stays truthful.
- Added more motion: count-up hero stats, a breathing hero grid and drifting glow, a blur-resolve on section headings, and a cursor-following radial glow on service and project cards. Every one of them is disabled under `prefers-reduced-motion`.
- Enabled `scroll-behavior: smooth` for anchor and focus jumps.
- Added a next-page band to every top-level page: the next page's title, an arrow, and a lime progress line. Overscrolling at the bottom of a page, or dragging up on the band, continues to the next page in reading order, so the site reads as one continuous scroll while every page keeps its own URL. Detail pages keep their existing prev/next project navigation.
- Added ten regression checks covering the hamburger removal, the rotating typewriter, the home index rows, the footer, the progress bar, the pinned role line, the next-page band, the project website links, and the process strip.

## What changed in the earlier polish

- Replaced three generations of overlapping CSS with one coherent design system, including a working light theme.
- Added a focus-trapped, scroll-locked navigation menu and a proper mobile dock with secondary items collapsing out of the way.
- Rebuilt the home hero with a clearer role line, focus chips, and a four-stat row.
- Grouped the eleven services into Engineering, Operations, and Growth, and added a visible FAQ.
- Expanded every project with localized search metadata, an overview, highlights, stack, role, and state. Ternux, LAI, and ADT now have substantial detail pages.
- Added project-to-project navigation, related services, contact brief guidance, evidence verification steps, and a research "last reviewed" note.
- Rebuilt the static fallback HTML so crawlers receive the same keyword-rich content before React loads.
- Added per-route keyword metadata, richer JSON-LD, a sitemap with `lastmod` and reciprocal hreflang, a web manifest, raster icons, and a new social preview image.
- Fixed the stale `public/sitemap.xml`, which still listed removed projects and omitted the evidence page.

## Implemented structure

- 50 static route entries: 2 home routes, 14 shared pages, 22 service details, and 12 project details.
- One navigation surface: the bottom dock. No secondary menu to keep in sync.
- Unique title, description, keyword set, canonical URL, reciprocal `hreflang`, Open Graph/Twitter metadata, and route-aware JSON-LD on every route.
- Static semantic HTML fallback for every route, plus a noindexed `404.html`.
- Bilingual sitemap with `lastmod`, priority, and reciprocal `xhtml:link` alternates.
- Google Search Console verification meta tag and HTML file preserved.
- Web manifest, SVG favicon, 192/512 PNG icons, and Apple touch icon.
- No WebGL or 3D dependency; the application JS stays under 80 KiB gzipped.

## Content and evidence

The content source is `src/data/site-content.json`. It contains:

- Profile, availability, location, time zone, five languages, and four social links.
- Seven work-history entries across Bangladesh and Saudi Arabia.
- Six capability groups.
- Eleven services in three groups, each with summary, detail, deliverables, and search keywords.
- Six public projects with localized metadata, overview, highlights, stack, role, state, evidence, and boundary.
- Research status split into verified, experimental, and not claimed.
- A bilingual evidence page with source links and verification steps.
- A bilingual services FAQ and contact brief.

DataKhoj and Iqra Online Mart remain removed at the owner's request. Project evidence is checked against the public repositories; experimental GPU/NPU paths stay labelled experimental.

## Search structure

- `Person` with `knowsAbout`, `hasOfferCatalog`, `sameAs`, address, email, and telephone.
- `WebSite` and `ProfilePage` on the home and about routes.
- `CollectionPage` with an `ItemList` on services and projects.
- `Service` with provider, area served, and an offer catalog on service details.
- `SoftwareApplication` for app projects and `SoftwareSourceCode` for tooling projects, with repository and programming language.
- `ContactPage`, `BreadcrumbList`, and a services `FAQPage`.
- Per-route `meta name="keywords"`, `robots`, Open Graph, and Twitter metadata.
- Sitemap with `lastmod` and reciprocal hreflang; robots points to the sitemap.

See [SEO.md](SEO.md) for the keyword research and placement plan.

## Validation

`npm run build` runs TypeScript, Vite, route generation, and a 62-check verification suite covering:

- Bilingual content completeness and project/service metadata.
- Route matrix, unique titles, canonical tags, and one `h1` per route.
- Search Console assets, hreflang, JSON-LD, sitemap, robots, and the public sitemap mirror.
- Structured-data entity coverage.
- Asset presence and manifest configuration.
- Bundle size (currently about 75.7 KiB gzipped for application JS).

## Known limits

- The project evidence is self-documented from public repositories; it is not an independent audit.
- Work history is self-reported.
- Service descriptions are offers, not completed client outcomes.
- GPU/NPU claims remain device-specific and experimental.
- The stale `docs/audit-screenshots/` artifacts from earlier iterations, including the removed 3D experiment, were deleted in this pass. Capture fresh screenshots during the next visual review if an audit trail is needed.

## Visual review

The current site has no browser-based screenshot pipeline in the repository. The layout, light theme, and responsive breakpoints were verified through source review and the build checks. Add a Playwright or Chromium capture step if a repeatable visual audit becomes necessary.
