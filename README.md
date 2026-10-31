# Sobuj Miah — Portfolio

A bilingual, mobile-first, multi-page portfolio for Sobuj Miah. Its visual direction follows `/sdcard/index.html`: graphite, lime and cyan, centered Sora typography, compact monospace labels, restrained 2D lighting, and a floating navigation dock. The home page is a concise introduction with service and project previews; full profile, services, experience, projects, research and contact pages remain separate routes.

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

Important text, links, and project evidence remain semantic HTML. Selected project evidence is checked against the public GitHub profile README, while experimental GPU/NPU paths stay identified as experimental. The project has no WebGL or 3D renderer dependency.

## Search and deployment

The existing Google Search Console meta tag and `public/google7974d87a16aa1b38.html` verification file are retained. The Pages workflow builds and deploys `main`. The public website is `https://soobujmiah.github.io/`.
