# SEO Record — soobujmiah.github.io (Portfolio)

## Portfolio refinement — 2026-09-24

Repository-state audit and refinement at the working branch recorded in Git.
English routes keep their existing URLs; equivalent Bengali routes are now
independently rendered under `/bn/`. The sitemap contains both languages and
each page emits a self-canonical plus reciprocal `en`, `bn`, and `x-default`
alternates. Metadata, language purity, translation presence, routes, schema,
and sitemap output are covered by the source and exported-artifact checks.

- Updated identity copy to describe a long-running hands-on technology journey
  and current building, without inventing a start year or combining it with
  dated professional employment.
- Kept the existing pager, hero, transitions, service taxonomy, project
  details, visual system, and original English URLs.
- Clarified service categories and tightened repeated service descriptions;
  added concise project role statements to featured work.
- Shared Person/WebSite structured data continues to derive identity links
  from the existing contact data. Page-level service schema remains intact.
- Page-specific social images were not added; existing shared `og.png` remains
  the social preview image. No browser/device run is implied by this record.

| Field | Value |
|---|---|
| **SEO standard** | [soobujmiah SEO Standard v1](https://github.com/soobujmiah/soobujmiah.github.io/blob/main/docs/SEO_STANDARD.md) |
| **Last audit** | 2026-09-24 (portfolio content, route, and static-export audit; see refinement record below) |
| **Site status** | `LIVE_SITE` — https://soobujmiah.github.io/ (GitHub Pages, workflow deploy) |
| **Role in identity graph** | **Hub.** Every public project links back here; this site links to every public project. |
| **Search intent** | `Sobuj Miah` / `soobujmiah` identity → software, AI, practical technology, and digital services |

## Previous baseline (2026-09-16; superseded by the 2026-09-24 refinement above)

| Check | Result |
|---|---|
| `<title>`, meta description, canonical, `lang`, viewport | PASS (per-route, derived from `app/content.ts`) |
| robots / sitemap | PASS — `robots.txt` allows all, `sitemap.xml` lists 9 real routes |
| Open Graph / Twitter card / social image | PASS — `og.png` 1200×630 |
| JSON-LD | PASS — WebSite, ProfilePage, Person (address Dhaka/BD, sameAs 17 profiles), ItemList of projects |
| Bilingual (EN/বাংলা) | PASS — parity + purity enforced by `check:content` |
| 404 page | PASS — `app/not-found.tsx` |
| Practical/local service intent (Layer C/D) | **Implemented** — `/services/` hub + 8 intent pages (see below) |
| Location intent | PASS (Dhaka, Bangladesh already present; extended with "remote worldwide") |

## Historical phase log

The entries below preserve earlier decisions as dated snapshots; statements in
those entries describe the site at that phase and are superseded where the
current refinement record above differs.

### Changes made (2026-09-16)

Minimal, content-only, gate-verified. No route, component, animation, design token or URL changed.

- `app/content.ts` — `experience.services.items` (EN+BN): added website development & maintenance, custom software / small-business tools, computer setup & troubleshooting (Windows/Linux), Android & phone software support (setup, ADB, optimization), remote support (Bangladesh & worldwide).
- `app/content.ts` — `contact.sub` (EN+BN) and `seo.sections[7|8]` descriptions (Experience, Contact): one factual sentence on practical services + service area.
- `app/layout.tsx` — site-level `keywords` and Person `knowsAbout` extended with service terms (EN + 4 Bangla).

## Deliberately NOT changed

- No `/services/*` routes yet (directive §12: create only when dedicated pages are ready — next phase).
- No `LocalBusiness` schema, address, opening hours or storefront (directive §7).
- No title/tagline change — `Independent Software & AI Systems Engineer` remains canonical (gate-enforced).
- No hreflang alternates: the language switch is client-side on the same URL; there are no separate BN URLs to point at.

## Phase 2 — service-intent layer (2026-09-16)

- New routes (outside the pager, `app/services/`): `/services/`, `/services/web-development/`, `/services/software-development/`, `/services/computer-support/`, `/services/android-support/`, `/services/business-technology/`, `/services/graphics-design/`, `/services/office-administration/`, `/services/data-entry/`.
- Copy lives in `app/services-content.ts` (EN + BN, same parity/purity gates via `check:content`); pager routes never download it.
- Each page: unique title/description, exact canonical, OG/Twitter, `robots index,follow`, `Service` (provider → `#person`) + `BreadcrumbList` (+ `FAQPage` where FAQ exists). No `LocalBusiness`, offers, prices or ratings — `check:build` fails if any appear.
- Sitemap now lists 18 URLs (9 sections + 9 services); `check:build` asserts the exact count and per-route JS payload.
- Internal links: `/experience/` (below the services chips) and `/contact/` (after the intro) → `/services/`. Header/nav overlay/pager unchanged.
- `SECTION_IDS`, world-map focus, page transitions, design tokens, existing metadata and JSON-LD: unchanged.

## Phase 3 — geographic refinement (2026-09-19)

Preservation pass: commercial-intent, local and technical SEO audit with surgical changes only. No route, component, animation, design token, URL, title, or verification change.

- `app/services-content.ts` (EN+BN) — services hub meta description and availability line now read "Savar, Dhaka, Bangladesh" (refinement of the existing "Dhaka, Bangladesh"; workplaces in Savar are already listed on `/experience/`).
- `app/content.ts` (EN+BN) — `contact.sub` and the Experience/Contact route descriptions now read "Savar, Dhaka, Bangladesh" (same refinement, same evidence).
- `app/services/seo.ts` — `Service` `areaServed` extended from `[Bangladesh, Worldwide (remote)]` to `[Savar, Dhaka, Bangladesh, Worldwide (remote)]` (service area, not a storefront; no address/hours/prices/ratings).
- `app/layout.tsx` — site-level `keywords` gained the locality terms `Savar`, `Dhaka`, `সাভার`; GSC verification token untouched.

Deliberately NOT changed: homepage commercial sentence and Services links (already semantic, crawlable, well-linked); all `<title>`/canonical/OG/Twitter values; Person `address` (kept as Dhaka/BD — residence claim not invented); hero/about location lines (identity layer stays "Dhaka, Bangladesh"); sitemap/robots (18 URLs, valid); all 8 service-page descriptions (unique, already sufficient); no `LocalBusiness` schema (no storefront claim).

## Phase 4 — Person sameAs hygiene (2026-09-19 17:14 +06:00)

Final hygiene pass: structured-data output only. No route, component, copy, design token, URL, title, or verification change.

- `app/layout.tsx` — Person `sameAs` now filters contact-group hrefs to absolute HTTP/HTTPS URLs only (`.filter((href) => /^https?:\/\//i.test(href))`), so the single `mailto:` ecosystem entry no longer appears in JSON-LD. Visible Contact page unchanged: email stays exactly where it is.
- Result: `sameAs` carries the 17 canonical HTTPS identity URLs (GitHub, portfolio, LinkedIn, Peerlist, Product Hunt, Hugging Face, DEV.to, Hashnode, Medium, X, Instagram, Threads, Facebook, YouTube, Telegram, About.me, Buy Me a Coffee), de-duplicated as before.

Owner-confirmed keeps (explicitly NOT changed): `github.com/soobujmiah/datakhoj` stays private with its existing evidence links kept as-is; `https://wa.me/soobujmiah` kept exactly as-is. Person `address` (Dhaka/BD) untouched; no LocalBusiness, address, review, rating, or telephone data added.

Audit badge intentionally date-only (`SEO-audited 2026-09-19`, already current): the shields-badge convention records the day, and embedding the time would break its design. The exact timestamp lives here, in this record.
