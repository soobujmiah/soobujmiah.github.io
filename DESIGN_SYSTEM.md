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

Scrolling past the end of a page continues the flow rather than dead-ending: a sustained overscroll (520px of accumulated wheel delta at the bottom) or a 90px upward drag on the band opens the next page. A tap on the band always works.

The band is **armed** only once the reader has earned it. A fresh page is armed from the start; a page reached through the browser's Back or Forward button starts **cold** — wheel spin and drags on the band do nothing until the reader has climbed at least 240px away from the end and come back. This is what makes Back work: a history restore lands exactly where the reader left off, on the band, usually with the wheel or a thumb still moving, and an armed band would push straight forward again — which readers experienced as "back doesn't work, it just refreshes". The rule holds for both kinds of restore (a fresh `back_forward` load and a bfcache restore, which keeps the old listeners alive — hence the `pageshow` reset), and the band's caption changes to "Scroll up to keep reading, or tap to continue" while it is cold. A drag that does navigate cancels the synthesised tap, so a single gesture never pushes two history entries.

Three guards keep that from misfiring:

- **It never arms on a back/forward restore.** A back/forward navigation lands at the bottom of the page with the wheel still turning; arming there would push forward again immediately, which made "going back" feel like the page had reloaded.
- **The reader must have scrolled down first.** Arriving at a page and nudging the wheel does nothing until `scrollY` has passed 80px in this view.
- **A 1.2s settle window** after load absorbs the leftover inertia from the previous page.

A downward drag on the band is the reader asking to scroll back up, so it never navigates.

`html { overscroll-behavior-y: contain }` additionally stops Android Chrome turning an upward drag at the top of the page into a pull-to-refresh, which readers kept reading as the site reloading itself. Detail pages are excluded — projects and services already carry their own prev/next navigation — and the last page (Contact) has no band. Reading order is Home → About → Services → Projects → Experience → Research → Evidence → Contact, matching the dock.

## Motion

- The hero role line is a **rotating typewriter**: it types one trade, holds three seconds, deletes it, pauses, and types the next. Five roles cycle in both languages (`site.roles`). It splits on grapheme clusters with `Intl.Segmenter` so Bengali conjuncts and vowel marks are never torn mid-character. All five roles are always present for assistive tech in an `.sr-only` span, joined with `·`; the animated copy is `aria-hidden`.
- The line never moves the page. `.source-role` reserves one fixed line of height so the block below it cannot jump as text is added and removed, and every role is kept short enough to actually fit that line on a 320px phone (≤ 40 Latin characters, ≤ 30 Bengali graphemes). The block is centred: a hidden `.role-ghost` copy of the finished sentence fixes the `.role-line` width, the visible `.role-live` sits absolutely on top of it, so short roles sit in the middle of the page while the `>` prompt stays pinned to the left edge of that line for the whole cycle instead of re-centring with every character. The primary title (`Software & AI systems engineer`) opens the cycle; the specialist trades follow.
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

## Contact chips

Every way to reach the owner lives on the contact page and nowhere else, as one compact chip directory in the spirit of Stack Overflow's profile links: 22 small chips in five labelled rows — **Direct** (email, phone, Telegram — outlined in the accent because they are the fastest routes), **Social**, **Code & writing**, **Profiles & publishing**, **Support & identity**. Telegram and WhatsApp are not repeated in the Social row, since the Direct row already reaches them. A chip is a real link with a 20px brand badge and a short label; the group label is an 8.5px monospace caption. Density is deliberate — this is a directory, not a set of feature cards.

The marks live in `public/social-icons.svg`, an external `<symbol>` sprite generated from `simple-icons` by `npm run make:social` (23 symbols: 21 brands plus hand-written `mail` and `phone`). Keeping them out of the React bundle means the logos cost the JavaScript nothing; the browser only fetches the sprite on pages that render an icon, and caches it afterwards. LinkedIn is hand-written because `simple-icons` does not ship it.

## Footer

The footer is the same one line on every page: copyright year, place, time zone, and the **Claims & limits** link. Nothing else. It carries no social profiles (they all live on the contact page, which the fixed dock reaches from anywhere), no page navigation (the dock is always on screen), and neither the name nor the page title (those already sit in the hero).
