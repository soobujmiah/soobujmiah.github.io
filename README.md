# Sobuj Miah — Portfolio

Personal site for **Sobuj Miah** — office administrator, virtual assistant, and self-taught Linux / on-device AI developer in Savar, Dhaka.

Live at `https://soobujmiah.github.io/`.

## What's here

| File | Role |
|---|---|
| `index.html` | Complete single-page portfolio (static, no build step) |
| `styles.css` | Theme, layout, motion |
| `i18n.js` | English ↔ বাংলা dictionary |
| `app.js` | Mesh background, dock, language, theme |
| `claims.html` + `CLAIM_STATUS.md` | Public evidence model: verified / experimental / historical benchmark |
| `PORTFOLIO_CONTENT.md` | SKB-aligned public content policy and positioning |
| `fonts.css` + `fonts/` | Self-hosted fonts |
| `assets/Sobuj_Miah_CV.pdf` | Curated public CV (no phone/street address) |

## Public knowledge architecture

The private repository `soobujmiah/skb` is the source/context layer. This repository is the curated public presentation layer.

`PORTFOLIO_CONTENT.md` records the approved positioning and claim boundaries so future portfolio updates can be checked against the SKB rather than drifting independently.

Public claims must distinguish between:

- vision/specification
- implemented code
- tested behavior
- device-validated evidence
- production readiness

Private context, credentials, tokens, private datasets, and unnecessary sensitive details do not belong here. Personal contact surface is intentionally limited: email, Telegram, LinkedIn and GitHub are published; phone number, WhatsApp and street address are not.

## Features

- Dark / light theme (saved in `localStorage`)
- English / বাংলা toggle
- Floating dock with scroll progress
- Circuit-mesh background, typewriter role line, service accordion
- Flagship Termux AI Workstation + selected GitHub work, graded against `claims.html`
- Contact: email, Telegram, LinkedIn, GitHub

## Run locally

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

Then open `http://localhost:8080`.

## Publishing

The site is fully static. GitHub Pages serves the repository root from `main` (legacy mode) — pushing to `main` republishes. There is deliberately **no build pipeline**: the page works identically from the branch, which prevents deploy/content drift.

Do **not** put a personal access token in a remote URL or in chat.
