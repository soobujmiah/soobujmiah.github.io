# Sobuj Miah — Portfolio

Personal site for **Sobuj Miah** — office administrator, virtual assistant, and self-taught Linux / on-device AI engineer in Savar, Dhaka.

Live locally from this folder. Designed for GitHub Pages at `https://soobujmiah.github.io/`.

## What’s here

| File | Role |
|---|---|
| `index.html` | Page structure |
| `styles.css` | Theme, layout, motion |
| `i18n.js` | English ↔ Bangla dictionary |
| `app.js` | Mesh background, dock, language, theme |
| `fonts.css` + `fonts/` | Self-hosted Sora, Inter, JetBrains Mono, Hind Siliguri, Anek Bangla |
| `assets/Sobuj_Miah_CV.pdf` | Downloadable CV |

## Features

- Dark / light theme (saved in `localStorage`)
- English / বাংলা toggle
- Floating dock with scroll progress
- Circuit-mesh background, typewriter role line, service accordion
- Flagship Termux AI Workstation + selected GitHub work
- Contact: email, WhatsApp, Telegram, phone, LinkedIn, GitHub

## Run locally

```bash
cd portfolio
python3 -m http.server 8080 --bind 0.0.0.0
```

Then open `http://localhost:8080`.

## Publish to GitHub Pages

1. Create a public repo named **`soobujmiah.github.io`**
2. Push this folder to the `main` branch (the files must sit at the repo root)
3. In repo **Settings → Pages**, set Source to `main` / root
4. Site will be at `https://soobujmiah.github.io/`

```bash
git init
git add .
git commit -m "Publish portfolio"
git branch -M main
git remote add origin https://github.com/soobujmiah/soobujmiah.github.io.git
git push -u origin main
```

Do **not** put a personal access token in the remote URL or in chat.

## Security

If a GitHub token (`ghp_…`) was pasted in chat, revoke it immediately:

https://github.com/settings/tokens

Then create a new token only if you still need one, and never share it.
