# Sobuj Miah — Engineering Portfolio

Public developer portfolio for **Sobuj Miah** — Self-Taught Technology Builder focused on Android, ARM64 Linux, AI Systems, Developer Tooling, and Real-Device Engineering.

Live at: `https://soobujmiah.github.io/`

## Core Architecture

| File | Role |
|---|---|
| `index.html` | Complete semantic single-page portfolio (static, zero build step) |
| `styles.css` | Design system, layout, dark/light themes, responsive grids, and case study components |
| `i18n.js` | High-fidelity English ↔ বাংলা bilingual dictionary |
| `app.js` | Interactive canvas circuit mesh background, floating dock scrollspy, theme toggles, and typewriter |
| `claims.html` + `CLAIM_STATUS.md` | Public evidence grading model (Verified / Experimental / Historical Benchmark) |
| `PORTFOLIO_CONTENT.md` | Positioning, specialization pillars, and claim boundaries |
| `fonts.css` + `fonts/` | Self-hosted web fonts (`Inter`, `JetBrains Mono`, `Sora`, `Anek Bangla`, `Hind Siliguri`) |
| `assets/Sobuj_Miah_CV.pdf` | Curated public engineering CV |

## Engineering Specializations

1. **ARM64 Toolchain & Developer Tooling:** Native aarch64 build pipelines, AAPT2, D8/R8, Clang, CMake, Ninja, and SDK/NDK integration.
2. **On-Device AI Systems & Inference:** Local LLM execution via llama.cpp, GGUF quantization, KV-cache prefix reuse, and model integrity verification.
3. **Linux Userspace on Android:** PRoot Debian, Termux-X11, and Mesa Turnip/Zink GPU virtualization on Adreno 825 hardware.
4. **Android Native & Systems Automation:** Kotlin, Flutter, Shizuku (UID 2000) privileged execution, and Accessibility consent boundaries.
5. **Real-Device Validation & Root-Cause Debugging:** Systematic investigation from symbolized crash dumps (`SIGSEGV` in `vulkan.adreno.so`) to verified CPU fallbacks.
6. **Operations & Systems Support:** 8+ years of high-consequence operational discipline from Saudi Aramco industrial sites to educational administration in Dhaka.

## Run Locally

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

Open `http://localhost:8080` in your browser.

## Publishing

The site is served directly by GitHub Pages from `main` root. Pushing to `main` updates the live site immediately with zero deployment drift.
