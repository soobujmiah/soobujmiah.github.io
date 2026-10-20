# Sobuj Miah — Independent Software & AI Systems Engineer

Portfolio source for [soobujmiah.github.io](https://soobujmiah.github.io), built as a bilingual, mobile-first field atlas around practical software, Android engineering, and evidence-led systems work.

The site uses semantic HTML, CSS, inline SVG, and lightweight JavaScript. The home experience lazily loads a self-hosted Three.js module for its scroll-responsive 3D terrain and mobile workstation; the rest of the site has no runtime package dependencies, trackers, or remote font requests. If WebGL is unavailable or reduced motion is requested, the regular page and static visual fallback remain available. The Three.js license is included in `vendor/THREE-LICENSE.txt`.

## Local preview

Open `index.html` in a browser or serve this directory with a static file server.

## Deployment

The `main` branch deploys to GitHub Pages through `.github/workflows/pages.yml`. The workflow publishes only the website files, not repository documentation or review materials.
