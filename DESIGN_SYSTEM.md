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
- Cards: 14–16px radius, 1px border, subtle surface, hover lift.
- Dividers carry the structure between sections; boxes are not stacked for every idea.

## Navigation

The primary navigation is a floating pill dock fixed to the bottom centre. It contains a home link, page icons, a theme toggle, a language switch, and a lime contact action. On narrow screens, secondary pages collapse into the top-left menu.

The menu is a modal dialog with a backdrop, focus trap, Escape handling, and body scroll lock. It exposes every page in the current language plus the language switch.

## Motion

- A soft hero entrance and a marquee of services.
- Scroll-reveal on section headings and cards via `IntersectionObserver`.
- Hover lifts of 2–3px and 150–220ms transitions.
- `prefers-reduced-motion` disables all decorative animation and reveal transitions.

## Accessibility

- Semantic landmarks: `header`, `nav`, `main`, `aside`, `footer`.
- One `h1` per page; section headings use `h2`/`h3`.
- Skip link to `#main`.
- Visible focus rings using the lime accent.
- Icon-only controls have `aria-label`; decorative SVGs are `aria-hidden`.
- The menu traps focus, closes on Escape, and restores focus.
- Colour contrast is checked against both themes; body copy stays above 4.5:1.

## Search structure

Every route ships with a static HTML fallback, unique title and description, a keyword set, canonical URL, reciprocal `hreflang`, Open Graph/Twitter metadata, and route-aware JSON-LD. The build emits a sitemap with `lastmod` and reciprocal alternates, plus a noindexed 404 page.

Structured data describes the person, website, profile page, service catalog, service detail, project collection, software records, contact page, breadcrumbs, and the services FAQ. See [docs/SEO.md](docs/SEO.md).
