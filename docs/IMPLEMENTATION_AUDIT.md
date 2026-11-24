# Portfolio Implementation Audit

## Current direction

The site is a bilingual, multi-page portfolio built with React, TypeScript, and Vite. It uses a graphite base with lime and cyan accents, Sora display type, compact monospace labels, a single floating bottom dock, and restrained scroll motion. There is no WebGL or 3D runtime.

The home page is a concise introduction: hero, profile preview, an index of featured services, an index of selected work, and contact. Full profile, services, service details, experience, projects, project details, research, evidence, and contact each have separate English and Bangla routes.

## What changed in the latest pass

- Reduced the footer to a single centred **Claims & limits** link on every page; the place, time-zone and hours line is gone.
- Enriched the Claims & limits page with real repository data: a table of all six public repositories (license, primary language, created and last-push dates, latest release, live site where one exists), read from the GitHub API on 24 November 2026 and stored per project as `repo` in the content model, plus a claim / evidence / limit column set per project built from the project's own highlights, evidence and boundary. Two genuine limits are now visible in the table: Songjog declares no license and Ternuxx ships only a pre-release and a custom license.
- Home page contact section now offers only email, phone and Telegram as three equal dark buttons in one row; the 21-link profile row is gone from the home page.
- Contact page: every channel and profile is now an icon-only circle (24px mark in a 50px circle), all in one centred cluster, equal size and spacing, ordered by importance (direct channels first, then GitHub, LinkedIn, Stack Overflow…). The address and number are spelled out in the meta aside.
- Made Back actually work. The earlier guard only recognised a fresh `back_forward` load, but browsers usually restore the previous page from bfcache, which keeps the old listeners alive with the band still armed at the bottom — so the first wheel notch or thumb-flick after pressing Back pushed forward again. The band now has a single rule that covers both cases: a page reached through history starts **cold** and ignores wheel spin and drags until the reader has climbed 240px away from the end and come back. `pageshow` resets the frozen state on bfcache restores, the `navigating` guard and a cancelled synthesised tap stop one gesture from pushing two history entries, and a cold band says so ("Scroll up to keep reading, or tap to continue"). A tap on the band always works.
- Shortened every rotating hero role to one line (≤ 40 Latin characters, ≤ 30 Bengali graphemes; longest was 50) and put the primary title first. The role block now reserves a single line at every breakpoint instead of two on phones, so it no longer reads as a wrapped sentence.
- Removed the social profiles from the footer (the contact page lists them all and the dock reaches it from anywhere).
- Rebuilt the contact page as one panel (first as a chip directory, now as the circle cluster above). The sprite gained hand-written `mail` and `phone` marks (23 symbols).
- Removed the top-left hamburger menu. It duplicated the dock, which already reaches every page; the dock now keeps all six page icons visible at every breakpoint instead of hiding the secondary pages.
- Fixed the hero role line. The `>` prompt, the role text, and the caret were separate flex items, so a long line broke them onto three different lines on phones. They are one inline flow now.
- Replaced the blinking caret with a real typewriter loop (type → hold → delete → retype) that segments on grapheme clusters, so Bengali conjuncts type whole. The full sentence stays available to screen readers.
- Closed the dead air above the hero badge: top padding drops from 88–128px to 30–104px depending on viewport, and the hero no longer forces a full viewport height on phones.
- Slimmed the footer to one metadata line. It no longer repeats the name, the page title, or the page navigation.
- Cut home-page duplication. The heavy project grid and the service accordion duplicated the dedicated projects and services pages; both are now compact index rows that point at the full pages.
- Replaced the project list inside the terminal card with the current focus list, so the card no longer repeats the projects page either.
- Added a 2px scroll-progress bar and staggered reveal timing so several sections entering together cascade instead of appearing at once.
- Widened the keyword coverage: 32 English and 27 Bengali site-level terms, plus niche vocabulary for each project (`proot-distro`, `Termux:X11`, `GGUF quantization`, `AOSP build`, `on-device LLM`, and Bengali equivalents). See [SEO.md](SEO.md).
- Pinned the hero role line so the typewriter cannot move the page. The block reserves a fixed height and the inner line has a constant width, so the `>` prompt stays on the same left edge and nothing below shifts as text is typed and deleted.
- Stopped the overscroll-to-next-page trigger firing when the reader scrolled back (superseded by the cold-band rule above). A downward drag on the band never navigates. `overscroll-behavior-y: contain` also stops Android Chrome turning a drag at the top into a pull-to-refresh.
- Removed the profile row from the contact page footer (it repeated the 21 profiles the body lists); the footer change above then removed it from every page.
- Centred the hero role line without letting the `>` prompt drift: a hidden ghost copy of each sentence fixes the block's width, so short roles sit in the middle of the page and the prompt stays put through the whole type/delete cycle.
- Removed a duplicated lede on the contact page — `PageHeading` and the page body were both printing "Share the task, the constraints, and the outcome you need."
- Added all 21 profiles to the contact page, grouped by what each one is for and each with a brand mark (now rendered as circles). The marks come from a generated external SVG sprite, so they add nothing to the JavaScript bundle.
- Rotated the hero role line through five trades instead of repeating one sentence: software and AI systems engineering, Linux on Android and Termux desktops, on-device local AI with llama.cpp, Flutter/web/Android development, and office operations. Both languages carry their own set.
- Linked the projects that ship their own site. Ternux and ADT now expose `website` in the content model, surface a "Visit website" link on the projects grid and a primary button on their detail pages, and publish it as `sameAs` in their JSON-LD.
- Added a client-facing "how it goes" section to the home page: scope in writing, checkpoints you can open, handover with notes. It describes process rather than promising outcomes, so it stays truthful.
- Added more motion: count-up hero stats, a breathing hero grid and drifting glow, a blur-resolve on section headings, and a cursor-following radial glow on service and project cards. Every one of them is disabled under `prefers-reduced-motion`.
- Enabled `scroll-behavior: smooth` for anchor and focus jumps.
- Added a next-page band to every top-level page: the next page's title, an arrow, and a lime progress line. Overscrolling at the bottom of a page, or dragging up on the band, continues to the next page in reading order, so the site reads as one continuous scroll while every page keeps its own URL. Detail pages keep their existing prev/next project navigation.
- Added regression checks covering the hamburger removal, the rotating typewriter, the home index rows, the footer, the progress bar, the pinned role line, the next-page band, the project website links, the process strip, the contact circle cluster, the sprite, the single-page-only profiles, the one-line roles, the scroll-back guard, the once-only drag navigation, the repository facts, and the footer (72 checks in total).

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

`npm run build` runs TypeScript, Vite, route generation, and a 72-check verification suite covering:

- Bilingual content completeness and project/service metadata.
- Route matrix, unique titles, canonical tags, and one `h1` per route.
- Search Console assets, hreflang, JSON-LD, sitemap, robots, and the public sitemap mirror.
- Structured-data entity coverage.
- Asset presence and manifest configuration.
- Bundle size (currently about 81.2 KiB gzipped for application JS; the budget moved from 80 to 85 KiB when the evidence table and the contact circles were added).

## Known limits

- The project evidence is self-documented from public repositories; it is not an independent audit.
- Work history is self-reported.
- Service descriptions are offers, not completed client outcomes.
- GPU/NPU claims remain device-specific and experimental.
- The stale `docs/audit-screenshots/` artifacts from earlier iterations, including the removed 3D experiment, were deleted in this pass. Capture fresh screenshots during the next visual review if an audit trail is needed.

## Visual review

The current site has no browser-based screenshot pipeline in the repository. The layout, light theme, and responsive breakpoints were verified through source review and the build checks. Add a Playwright or Chromium capture step if a repeatable visual audit becomes necessary.
