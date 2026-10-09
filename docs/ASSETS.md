# Asset provenance

| Asset | Origin | Licence |
|---|---|---|
| Silicon Nocturne environment | Generated at runtime by `app/silicon.ts` from a fixed seed. An abstract, invented layout; not a photograph or a real die. | Project code |
| Instrument Serif, Noto Serif Bengali, Inter, Noto Sans Bengali, JetBrains Mono | Google Fonts via `next/font`, self-hosted at build time (no runtime third-party request) | SIL OFL |
| `public/og.png` | `tools/make-og.py` | Project |
| `public/cv/*` | `tools/make_cv*.py` | Project |

Removed in this pass: `public/cinema/*` — Pexels stock footage and frames
(videos by Fernando Paleta and MrColo, an animated tunnel). They were
unrelated to the work and below screen resolution. The site now ships no
video and no photographic raster other than the social preview image.
