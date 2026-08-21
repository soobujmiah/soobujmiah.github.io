# Sobuj Miah — Portfolio

Personal site for **Sobuj Miah** — office administrator, virtual assistant, and self-taught Linux / on-device AI engineer in Savar, Dhaka.

Live at `https://soobujmiah.github.io/`.

## What’s here

| File | Role |
|---|---|
| `index.html` | Page structure and public presentation |
| `styles.css` | Theme, layout, motion |
| `i18n.js` | English ↔ Bangla dictionary |
| `app.js` | Mesh background, dock, language, theme |
| `PORTFOLIO_CONTENT.md` | SKB-aligned public content policy and positioning |
| `fonts.css` + `fonts/` | Self-hosted fonts |
| `assets/Sobuj_Miah_CV.pdf` | Downloadable CV |

## Public knowledge architecture

The private repository `soobujmiah/skb` is the source/context layer. This repository is the curated public presentation layer.

`PORTFOLIO_CONTENT.md` records the approved positioning and claim boundaries so future portfolio updates can be checked against the SKB rather than drifting independently.

Public claims must distinguish between:

- vision/specification
- implemented code
- tested behavior
- device-validated evidence
- production readiness

Private context, credentials, tokens, private datasets, and unnecessary sensitive details do not belong here.

## Features

- Dark / light theme (saved in `localStorage`)
- English / বাংলা toggle
- Floating dock with scroll progress
- Circuit-mesh background, typewriter role line, service accordion
- Flagship Termux AI Workstation + selected GitHub work
- Contact: email, WhatsApp, Telegram, phone, LinkedIn, GitHub

## Run locally

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

Then open `http://localhost:8080`.

## Publish to GitHub Pages

Push this repository's `main` branch and configure GitHub Pages to serve the repository root.

Do **not** put a personal access token in a remote URL or in chat.
