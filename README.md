# Distill

Upload an image, get back design vocabulary: a measured color palette,
inferred typography/spacing/grid, descriptive style vocabulary, and an
implementation brief — all as one paste-ready markdown file.

## v1 scope

- **Input**: editorial/print layouts and UI/website screenshots only (both
  are flat 2D compositions readable from pixels alone). Architecture,
  interiors, and other 3D/physical subjects are deferred to a later version.
- **No DOM/CSS scraping** — extraction is pure image inference, so it works
  on screenshots with no live source (Dribbble shots, PDFs, photos of print).
- **Two extraction layers, kept separate on purpose**:
  - `src/lib/color-extraction.ts` — deterministic, pixel-measured palette
    (k-means via `node-vibrant`) plus a WCAG contrast check. No model
    involved; these values are exact.
  - `src/lib/vision-analysis.ts` — a single Claude vision call that infers
    typography, spacing scale, grid, style vocabulary, and the
    implementation brief. These values are approximate by nature (a vision
    model can't read exact hex/px off a raster image), and are worded that
    way in the output.
- `src/lib/markdown-export.ts` combines both into the exported file: a
  machine-parseable YAML front-matter block (tokens) plus a human-readable
  body (vocabulary + brief).

## Setup

```bash
cp .env.example .env.local
# add your ANTHROPIC_API_KEY to .env.local

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), upload an image, copy
the generated markdown.

## Known gaps (tracked, not yet built)

- No accounts, history, or saved runs.
- No multi-image merge (comparing several references into one system).
- Editorial vs. UI domain is auto-classified by the model — no manual
  override in the UI yet.
