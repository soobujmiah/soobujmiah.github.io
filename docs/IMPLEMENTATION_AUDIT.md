# Portfolio Implementation Audit

## Current direction

The site is a bilingual, multi-page portfolio built with React, TypeScript, and Vite. It uses a graphite base with lime and cyan accents, Sora display type, compact monospace labels, a floating bottom dock, and restrained scroll motion. There is no WebGL or 3D runtime.

The home page is a concise introduction: hero, profile preview, three featured services, three featured projects, and contact. Full profile, services, service details, experience, projects, project details, research, evidence, and contact each have separate English and Bangla routes.

## What changed in this polish

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

`npm run build` runs TypeScript, Vite, route generation, and a 52-check verification suite covering:

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
