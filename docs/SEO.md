# SEO Record — soobujmiah.github.io (Portfolio)

| Field | Value |
|---|---|
| **SEO standard** | [soobujmiah SEO Standard v1](https://github.com/soobujmiah/soobujmiah.github.io/blob/main/docs/SEO_STANDARD.md) |
| **Last audit** | 2026-09-16 |
| **Site status** | `LIVE_SITE` — https://soobujmiah.github.io/ (GitHub Pages, workflow deploy) |
| **Role in identity graph** | **Hub.** Every public project links back here; this site links to every public project. |
| **Search intent** | `Sobuj Miah` / `soobujmiah` identity → engineering positioning + practical technology services |

## Audit result (2026-09-16)

| Check | Result |
|---|---|
| `<title>`, meta description, canonical, `lang`, viewport | PASS (per-route, derived from `app/content.ts`) |
| robots / sitemap | PASS — `robots.txt` allows all, `sitemap.xml` lists 9 real routes |
| Open Graph / Twitter card / social image | PASS — `og.png` 1200×630 |
| JSON-LD | PASS — WebSite, ProfilePage, Person (address Dhaka/BD, sameAs 17 profiles), ItemList of projects |
| Bilingual (EN/বাংলা) | PASS — parity + purity enforced by `check:content` |
| 404 page | PASS — `app/not-found.tsx` |
| Practical/local service intent (Layer C/D) | **GAP → fixed** (see below) |
| Location intent | PASS (Dhaka, Bangladesh already present; extended with "remote worldwide") |

## Changes made (2026-09-16)

Minimal, content-only, gate-verified. No route, component, animation, design token or URL changed.

- `app/content.ts` — `experience.services.items` (EN+BN): added website development & maintenance, custom software / small-business tools, computer setup & troubleshooting (Windows/Linux), Android & phone software support (setup, ADB, optimization), remote support (Bangladesh & worldwide).
- `app/content.ts` — `contact.sub` (EN+BN) and `seo.sections[7|8]` descriptions (Experience, Contact): one factual sentence on practical services + service area.
- `app/layout.tsx` — site-level `keywords` and Person `knowsAbout` extended with service terms (EN + 4 Bangla).

## Deliberately NOT changed

- No `/services/*` routes yet (directive §12: create only when dedicated pages are ready — next phase).
- No `LocalBusiness` schema, address, opening hours or storefront (directive §7).
- No title/tagline change — `Independent Software & AI Systems Engineer` remains canonical (gate-enforced).
- No hreflang alternates: the language switch is client-side on the same URL; there are no separate BN URLs to point at.
