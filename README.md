# Sobuj Miah — Portfolio

A bilingual, mobile-first, multi-page portfolio for Sobuj Miah. It combines a clean graphite, lime, and cyan visual system with source-linked project evidence, practical service pages, and a crawlable English/Bangla route structure.

## Develop and verify

```sh
npm install
npm run dev
npm run check
npm run build
npm run preview
```

`npm run build` typechecks, builds the client, generates 50 static route entries under `dist/`, writes the bilingual sitemap and robots file, and runs the 74-check verification suite.

## Content model

`src/data/site-content.json` is the single source for both languages. It contains:

- Profile, availability, location, languages, and the social links shown as an ordered circle cluster on the contact page.
- Eight page groups in English and Bangla, including page-level titles, descriptions, and keyword sets.
- Eleven services grouped into Engineering, Operations, and Growth, each with detail copy, deliverables, and search keywords.
- Six public projects with localized search metadata, an overview, highlights, stack, evidence, and an explicit boundary.
- Seven work-history entries, six capability groups, research status, and the evidence page copy.

The UI renders this content directly. The build also emits a semantic HTML fallback for every route, so crawlers and no-JS visitors receive the same core information before React loads.

## Routes and search

Each generated route has a unique title, description, keyword set, canonical URL, reciprocal `hreflang` links, Open Graph/Twitter metadata, route-aware JSON-LD, and a static HTML fallback. The sitemap includes `lastmod`, priority, and reciprocal `xhtml:link` alternates.

Structured data covers `Person`, `WebSite`, `ProfilePage`, `CollectionPage`, `Service`, `SoftwareApplication`, `SoftwareSourceCode`, `ContactPage`, `BreadcrumbList`, and a services `FAQPage`.

The Search Console verification meta tag and `public/google7974d87a16aa1b38.html` are preserved. The public website is `https://soobujmiah.github.io/`.

See [docs/SEO.md](docs/SEO.md) for the keyword research and placement plan.

## Assets

- `public/og.png` — 1200×630 social preview.
- `public/icon.svg` — terminal-prompt mark.
- `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png` — raster icons.
- `public/site.webmanifest` — install metadata.

Regenerate locally with:

```sh
npm run make:assets
```

These scripts use Pillow and the DejaVu fonts available on the build machine. They are not part of the site runtime.

## Design and documentation

- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) — palette, type, layout, components, motion, and accessibility.
- [docs/IMPLEMENTATION_AUDIT.md](docs/IMPLEMENTATION_AUDIT.md) — what is implemented, what changed, and what remains experimental.
- [docs/SEO.md](docs/SEO.md) — keyword clusters, search intent, page mapping, and measurement.

## Deployment

The Pages workflow builds and deploys `main`. It runs `npm run check`, `npm run build`, and uploads `dist/`.
