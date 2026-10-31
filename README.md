# Sobuj Miah — Portfolio

A bilingual, mobile-first portfolio for Sobuj Miah, an office-operations professional and self-taught software and systems builder. It pairs semantic page content with a Three.js engineering workbench: one large phone artifact connected to grounded modules for operations, Linux, local AI, and software.

## Develop and verify

```sh
npm install
npm run dev
npm run check
npm run build
npm run preview
```

`src/data/site-content.json` is the English and Bangla content source. The build generates 52 static route entries under `dist/`, each with a direct-load HTML fallback, unique title and description, canonical URL, language alternates, and route-specific structured data. It also generates a sitemap, robots file, and 404 page for GitHub Pages.

The route families include `/about/`, `/bn/about/`, `/services/`, every service detail, `/projects/`, every public project detail, experience, research, and contact pages. Public project notes state evidence boundaries; private repositories and unverified capability claims are excluded.

The 3D scene loads separately from the initial app bundle, adapts its camera to viewport shape, and pauses for reduced-motion preferences or the visitor's motion control. The canvas is decorative; all important text, links, and project content remain accessible HTML.

## Search and deployment

The existing Google Search Console meta tag and `public/google7974d87a16aa1b38.html` verification file are retained. The Pages workflow builds and deploys `main`. The public website is `https://soobujmiah.github.io/`.
