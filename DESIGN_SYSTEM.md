# Design System — Sobuj Miah Portfolio

## Direction

The portfolio is a quiet, engineering-led personal site. It uses a graphite base, a lime action accent, and a cyan technical accent. Type and dividers do most of the organising; cards are reserved for services, projects, and supporting facts. There is no 3D scene, WebGL renderer, or decorative artwork.

The home page is a concise introduction. Profile, services, experience, projects, research, evidence, and contact each have a dedicated English and Bangla route.

## Palette

| Token | Dark | Light | Use |
| --- | --- | --- | --- |
| `--bg` | `#06070a` | `#f6f7f3` | Page background |
| `--panel` | `#0b0e14` | `#ffffff` | Cards, menu, aside |
| `--panel-2` | `#0e1219` | `#f7f8f4` | Subtle surfaces |
| `--ink` | `#eef1f5` | `#141910` | Primary text |
| `--ink-soft` | `#cbd3dd` | `#2c3328` | Body copy |
| `--muted` | `#98a2b3` | `#56604f` | Secondary copy |
| `--dim` | `#737d8c` | `#6f7867` | Labels, metadata |
| `--lime` / `--accent` | `#cdff57` | `#4f7a00` | Text accent, borders, focus |
| `--accent-bg` | `#cdff57` | `#cdff57` | Buttons and contact action |
| `--mint` | `#57e8ff` | `#007e8d` | Technical labels, states |

The light theme keeps the same lime/cyan identity but darkens the text accents for contrast. Buttons keep the bright lime background with near-black text in both themes.

The stored choice (`localStorage['sm-theme']`) wins. On a first visit with no stored choice, the boot script in `index.html` follows `prefers-color-scheme: light`, so the page paints in the OS theme before the first frame instead of flashing dark.

## Typography

- Display: **Sora** — headlines, project names, section titles.
- Body: **Inter** — prose and interface copy.
- Labels: **JetBrains Mono** — eyebrows, metadata, terminal details.
- Bengali: **Anek Bangla** for display and **Hind Siliguri** for body copy.

Headlines use tight tracking (`-.055em` to `-.075em`) and `text-wrap: balance`. Body copy uses a 1.7–1.95 line height. Bengali line heights are raised to 1.85–1.95 and letter-spacing is removed where it would distort conjuncts.

## Layout

- Content width: 1200px.
- Side padding: `clamp(22px, 5.4vw, 82px)`.
- Section rhythm: `clamp(43px, 6vw, 76px)` vertical padding.
- Page rhythm: `clamp(86px, 10vw, 118px)` top padding, with extra bottom clearance for the floating dock.
- Home hero: `clamp(72px, 8vw, 104px)` top padding, dropping to `clamp(30px, 8vw, 46px)` on phones so the badge sits close to the top of the viewport instead of floating in dead air.
- Cards: 14–16px radius, 1px border, subtle surface, hover lift.
- Dividers carry the structure between sections; boxes are not stacked for every idea.

## Navigation

The primary navigation is a single floating pill dock fixed to the bottom centre. It holds a home link, all six page icons, a theme toggle, a language switch, and a lime contact action. There is deliberately **no top-left hamburger menu** — the dock already reaches every page, and a second navigation control duplicated it.

Because the dock is the only navigation, every entry stays visible at every breakpoint instead of collapsing away. Below 620px the dock tightens to 36px targets and the language switch becomes icon-only; below 430px it drops to 28px targets so all ten controls still fit a 320px viewport.

## Page-to-page flow

Every top-level page ends in a **next-page band**: the next page's title, a large arrow, and a thin lime progress line. It is a real link, so it is keyboard reachable and crawlable.

Scrolling past the end of a page continues the flow rather than dead-ending: a sustained overscroll (420px of accumulated wheel delta at the bottom) or a 90px upward drag on the band opens the next page. Detail pages are excluded — projects and services already carry their own prev/next navigation — and the last page (Contact) has no band. Reading order is Home → About → Services → Projects → Experience → Research → Evidence → Contact, matching the dock.

## Motion

- The hero role line is a **rotating typewriter**: it types one trade, holds three seconds, deletes it, pauses, and types the next. Five roles cycle in both languages (`site.roles`). It splits on grapheme clusters with `Intl.Segmenter` so Bengali conjuncts and vowel marks are never torn mid-character. All five roles are always present for assistive tech in an `.sr-only` span, joined with `·`; the animated copy is `aria-hidden`.
- The line never moves the page. `.source-role` reserves a fixed height (two lines on phones, one on desktop) so the block below it cannot jump as text is added and removed, and `.role-line` is a fixed-width (`min(80ch, 100%)`), left-aligned inner block. Because its width is constant, the `>` prompt stays pinned to the same left edge for the whole cycle instead of re-centring with every character.
- A 2px scroll-progress bar along the top edge reports page position in the lime/mint gradient.
- The four hero stats count up from zero over 900ms once they enter the viewport, with an ease-out curve. Reduced motion renders the final number immediately.
- `html { scroll-behavior: smooth }` makes anchor and focus jumps glide; reduced motion resets it to instant.
- The hero grid breathes and the cyan glow drifts on slow loops, so the first screen is never fully static.
- Section headings arrive with a slight blur that resolves as they fade in, which reads softer than a plain opacity fade.
- Service and project cards carry a radial glow that follows the cursor (`--mx` / `--my` custom properties set from a passive pointermove listener), falling back to the centre without JavaScript.
- Scroll-reveal on section headings and cards via `IntersectionObserver`, with up to 280ms of stagger when several elements enter the viewport together. `data-reveal="left"`, `"right"`, and `"scale"` offer directional variants.
- Hover lifts of 2–3px and 150–220ms transitions.
- `prefers-reduced-motion` disables the typewriter (the sentence renders whole), the progress bar, the marquee, and every reveal transition.

## Accessibility

- Semantic landmarks: `header`, `nav`, `main`, `aside`, `footer`.
- One `h1` per page; section headings use `h2`/`h3`.
- Skip link to `#main`.
- Visible focus rings using the lime accent.
- Icon-only controls have `aria-label`; decorative SVGs are `aria-hidden`.
- The typewriter's animated text is `aria-hidden`; the real sentence lives in an `.sr-only` span so the accessible name never changes mid-animation.
- Colour contrast is checked against both themes; body copy stays above 4.5:1.

## Search structure

Every route ships with a static HTML fallback, unique title and description, a keyword set, canonical URL, reciprocal `hreflang`, Open Graph/Twitter metadata, and route-aware JSON-LD. The build emits a sitemap with `lastmod` and reciprocal alternates, plus a noindexed 404 page.

Structured data describes the person, website, profile page, service catalog, service detail, project collection, software records, contact page, breadcrumbs, and the services FAQ. See [docs/SEO.md](docs/SEO.md).

## Client-facing strip

Between selected work and contact, the home page carries a short "how it goes" section: three process promises — scope in writing, checkpoints you can open, handover with notes. It describes how an engagement runs rather than claiming results, so it stays accurate for a portfolio with self-reported history.

## Social profiles

The contact page lists every profile in five typed groups — Social, Messaging, Code & writing, Profiles & publishing, Support & identity — rather than one undifferentiated row. Each link carries its brand mark in a dark rounded badge (`--icon-badge` / `--icon-ink`), tinted per theme.

The marks live in `public/social-icons.svg`, an external `<symbol>` sprite generated from `simple-icons` by `npm run make:social`. Keeping them out of the React bundle means the logos cost the JavaScript nothing; the browser only fetches the sprite on pages that render an icon, and caches it afterwards. LinkedIn is hand-written because `simple-icons` does not ship it.

## Footer

The footer is intentionally one line of metadata (year, location, timezone) plus the social profiles and a link to the claims page. It repeats neither the name nor the page title — those already sit in the hero — and carries no page navigation, because the fixed dock is always on screen.
