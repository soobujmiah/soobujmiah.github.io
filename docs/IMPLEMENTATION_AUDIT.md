# Portfolio Implementation Audit

## Current direction

The former Pocket Systems Lab artwork and its central 3D schematic were replaced by a new engineering workbench scene and direct, bilingual content routes. The previous scene is historical and is not part of the active site.

The current portfolio organizes Sobuj Miah's work across operations, office administration, software, Android/Linux systems, local AI, research, and practical digital services. Public project descriptions link to their source repositories and distinguish implemented evidence from experiments and limitations. Private repositories and unverified performance or hardware claims are omitted.

## Implemented structure

- English and Bangla home, about, services, experience, projects, research, and contact pages.
- Eleven service detail routes and eight public project detail routes in both languages.
- Static HTML route entries with unique metadata, canonical URLs, reciprocal `hreflang`, route-aware JSON-LD, sitemap, robots file, and a 404 page.
- A lazily loaded Three.js phone and workbench with responsive camera framing, reduced-motion support, and semantic HTML for all essential content.
- Preserved Google Search Console verification meta tag and HTML file.

## Validation

Run `npm run check` and `npm run build`. Build verification checks the complete bilingual route matrix, metadata uniqueness, verification assets, route-aware structured data, sitemap coverage, page size budgets, accessible scene controls, and the GitHub Pages output.

The native Termux Firefox review at a 752 × 1630 viewport exposed an overly dark scene overlay. The mobile wash was reduced so the workbench remains visible beneath the hero copy. A final native Firefox visual check should be recorded after the production build.

### Native Firefox visual follow-up — 2026-10-31

I captured the already-open native Termux:X11 Firefox at 752 × 1630 without sending keyboard or pointer input. The loaded preview showed a large phone scene whose display was obscured by the compact-view overlay, so I reduced the overlay opacity and raised the display-text contrast. The current production build passes the route, accessibility, and bundle checks, but the open Firefox tab still has the earlier rendered page; I did not issue a refresh event. The updated appearance therefore needs a visual confirmation after the owner refreshes the local or deployed page.
