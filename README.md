# The Pocket Systems Lab — Sobuj Miah

A bilingual (English / বাংলা), mobile-first portfolio in which a phone opens into one shared, navigable systems workshop. The spatial scene is authored in Three.js; project and profile information remains semantic HTML and works without WebGL.

## Requirements

- Node.js 20 or newer
- npm

## Local development

```sh
npm install
npm run dev
```

## Checks and production build

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

The build creates a static Vite output in `dist/`. It is suitable for GitHub Pages at the repository root. `.github/workflows/deploy.yml` builds and deploys after pushes to `main`, and also supports a manual run. Review local changes before pushing to `main`; a push publishes the resulting build to the public site.

The social preview is a locally generated `public/og.png`, derived only from the approved name, positioning, and brand palette. Regenerate it with `npm run make:og` when Python Pillow is available; the PNG is checked into the project so normal builds need no image-generation dependency.

## Experience

- Shared destinations: Lab, Work, Process, Services, About, Field Notes, Contact.
- Project routes use `?station=work&project=<slug>` and support back/forward.
- Six public projects have source-linked details and explicit verification/limitations.
- EN / বাংলা state persists in local storage; route and selected project are preserved on switching.
- Three.js scene is lazy-loaded and reduces pixel ratio, shadows, and render work on mobile. Portrait view opens in the readable text/schematic mode; landscape view opens in the 3D scene. The mode control lets visitors switch views. When WebGL is unavailable or reduced motion is requested, the same art direction and content remain available in the 2D schematic.
- Nonessential animation can be paused. No sound, analytics, external API, or contact form.

## Public assets & privacy

Only approved public repositories and profile links are included. Private repositories, protected asset stores, client material, phone number, and unapproved contacts are excluded. The email address is carried from the prior public profile; it is not delivery-tested, so review it before production publication. The local audit ledger is intentionally git-ignored and is not copied into the static website.

Fonts are requested from Google Fonts in the fully deployed site; the interface has local font fallbacks. In the sandbox preview, external font requests are unavailable, but the fallback is styled intentionally.

## Deployment state

This is the public repository `soobujmiah/soobujmiah.github.io`, deployed at `https://soobujmiah.github.io/`. Local edits remain unpublished until pushed; pushes to `main` deploy automatically. Check the Pages workflow run for the current deployment result, and preserve the existing repository history.
