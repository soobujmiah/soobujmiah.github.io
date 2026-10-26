# DESIGN SYSTEM — The Pocket Systems Lab (`soobujmiah.github.io`)

**Project:** Sobuj Miah — “The Pocket Systems Lab”  
**Opening Line:** “The workshop begins in your hand.”  
**Professional Positioning:** Independent Software & AI Systems Builder  
**Alignment:** The last retained ecosystem tokens (`skb/architecture/WEB_DESIGN_SYSTEM.md`) extended for The Pocket Systems Lab. On 2026-10-26 the former live portfolio repository and Pages root returned 404, so this rebuild follows the retained SKB spec and the owner's attached master prompt; it is not a source-code comparison to a currently accessible deployed portfolio.

## 1. Brand Tokens (`src/design-tokens.ts` & `:root`)

```json
{
  "bg": "#050507",
  "fg": "#e4e2df",
  "muted": "rgba(228,226,223,0.45)",
  "border": "rgba(228,226,223,0.07)",
  "accent": "#22c55e",
  "accentBright": "#4ade80",
  "accentGlow": "rgba(34,197,94,0.18)",
  "signal": "#10b981",
  "cardBg": "rgba(6,7,6,0.66)",
  "chrome": "#060608"
}
```

## 2. 3D Material & Lighting Language

- **Environment Atmosphere:** Deep graphite (`#050507`) with subtle exponential depth fog (`#060809`) and precision-milled floor plates (`#090b0e`).
- **Materials:**
  - *Anodized Graphite Chassis:* `#12151a`, roughness `0.38`, metalness `0.82`
  - *Brushed Alloy Frame:* `#262b33`, roughness `0.28`, metalness `0.88`
  - *Matte Polymer Substrates:* `#0d1014`, roughness `0.72`, metalness `0.18`
  - *Dark Optical Glass:* `#080d0b`, roughness `0.14`, metalness `0.25`, subtle transmission/opacity
  - *Restrained Signal Paths:* `#22c55e` / `#4ade80` emissive traces reserved strictly for active conduits, selected stations, and verified pathways; amber `#f59e0b` for experimental/qualification gates; crimson `#ef4444` for fail-closed hardware containment boundaries.
- **Camera & Motion:**
  - Smooth, critically damped interpolation (`reveal: 0.7s cubic-bezier(0.16, 1, 0.3, 1)`).
  - Interruptible at any moment by touch, click, Escape, or navigation controls.
  - Respects `prefers-reduced-motion: reduce` and provides an explicit HUD toggle to pause continuous animation or switch to the 2D Architectural Schematic fallback.

## 3. Typography

- **Display (English):** `Instrument Serif`, Georgia, serif (`--font-serif`)
- **Display (Bangla):** `Noto Serif Bengali`, serif (`--font-serif-bn`)
- **Body / UI (English):** `Inter`, system-ui, sans-serif (`--font-sans`)
- **Body / UI (Bangla):** `Noto Sans Bengali`, sans-serif (`--font-sans-bn`)
- **Technical Labels / Monospace:** `JetBrains Mono`, monospace (`--font-mono`)

## 4. Content & Evidence Integrity Rules

- **Zero Numeric Achievement Claims / Vanity Badges:** No KPI tiles, star counters, download counters, percentage bars, or test-count badges.
- **Explicit Evidence Grading:** Every project capability is labeled as **Verified** (`VERIFIED`), **Experimental** (`EXPERIMENTAL`), or **Planned / Boundary** (`BOUNDARY`).
- **Real Accessible HTML:** All essential copy is rendered in semantic DOM elements, never baked into WebGL canvas textures.
