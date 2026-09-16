# soobujmiah SEO Standard — v1 (2026-09-16)

Reusable checklist for every public `soobujmiah` repository. Principle: **Preserve → Audit → Improve → Verify → Never fabricate.**

## Identity graph

```
Project → Sobuj Miah → soobujmiah → https://soobujmiah.github.io/   (every project links to the hub)
Portfolio → Project                                                  (hub links to every real project)
```

Private repositories (e.g. `skb`) are never an SEO surface.

## Site classification (verify live, never assume)

`LIVE_SITE` · `NO_LIVE_SITE` · `PRIVATE` · `UNKNOWN` — only `LIVE_SITE` gets website-level changes; public repos always get repository-level SEO.

## Repository-level checklist (all public repos)

- [ ] Description: one sentence stating *what it is* with its primary intent terms (no generic "tools").
- [ ] Homepage URL set to the live site (if any) or left empty — never a fake URL.
- [ ] Topics: 8–15 accurate topics (`android`, `arm64`, … plus intent terms); no trending/unrelated topics.
- [ ] README H1 + one-line tagline that matches the description.
- [ ] README states author "Sobuj Miah" and links to https://soobujmiah.github.io/.
- [ ] README carries the SEO badge → `docs/SEO.md` (audit date, status, changes, non-changes).
- [ ] No unverified performance / acceleration / release claims in SEO copy.

## Website-level checklist (LIVE_SITE only)

`<title>` · meta description · canonical · `lang` · viewport · `robots` meta · `robots.txt` · `sitemap.xml` · Open Graph (`og:title/description/url/image/type/locale/site_name`) · Twitter card · favicon · social image 1200×630 · JSON-LD (`SoftwareApplication` for software, `Person` author → portfolio, `BreadcrumbList` → portfolio) · `hreflang` when separate language URLs exist · one `<h1>` · semantic landmarks · image alt · 404 · backlink to portfolio · backlink to GitHub source · no accidental `noindex`.

## Search intents (one per surface — never identical sites)

| Surface | Intent |
|---|---|
| Portfolio | Sobuj Miah / soobujmiah identity; engineering + practical technology services |
| Ternux | Linux desktop on Android · Termux · Debian · no-root · Adreno/Turnip |
| ADT | native ARM64 Android development toolchain for Linux |
| LAI | local / on-device / offline Bangla-first AI on Android |
| GGEN | Android-first Flutter creative & document studio |

## New-repository procedure

1. Define search intent → 2. description → 3. topics → 4. README → 5. decide on website → 6. full technical SEO if website → 7. link to/from portfolio → 8. structured data → 9. sitemap/robots → 10. verify indexability → 11. add `docs/SEO.md` + badge.

## Badge

```markdown
[![SEO audited](https://img.shields.io/badge/SEO-audited%20YYYY--MM--DD-22c55e?style=flat-square)](docs/SEO.md)
```
Update the date in the badge and `docs/SEO.md` on every re-audit; the badge is the "we did SEO here" marker.
