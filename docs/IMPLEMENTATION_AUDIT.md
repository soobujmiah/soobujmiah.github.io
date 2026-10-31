# Portfolio Implementation Audit

## Current direction

The site follows the supplied source index visual language: graphite, lime/cyan accents, centered Sora hero, compact mono labels, restrained 2D lighting, and floating dock navigation. It remains multi-page, with a concise homepage preview and separate English/Bangla profile, services, experience, projects, research, and contact routes. 3D canvas and Three.js were removed. Spacing is compact and uses dividers with a few restrained project panels.

The bilingual content source is `src/data/site-content.json`. It contains the profile, seven dated work-history entries, six skill groups, six public project pages, and the GitHub profile service list plus the additional service categories from `/sdcard/index.html`. DataKhoj and Iqra Online Mart were removed from the portfolio at the owner's request. Selected engineering evidence is checked against the current public GitHub profile README. Unverified GPU/NPU paths stay labeled experimental, and device-specific proof is not generalized into unsupported claims.

## Implemented structure

- English and Bangla home, about, services, experience, projects, research, and contact pages.
- Eleven service detail routes and six public project detail routes in both languages.
- Functional top-left navigation drawer with direct links to every localized page.
- Static HTML route entries with unique metadata, canonical URLs, reciprocal `hreflang`, route-aware JSON-LD, sitemap, robots file, and a 404 page.
- Search Console verification meta tag and HTML file preserved.
- No WebGL or 3D runtime dependency; home and localized detail pages preserve crawlable content.

## Validation

Run `npm run build` to typecheck, generate all 48 routes, and verify metadata, sitemap, robots, Search Console assets, and bundle size.
