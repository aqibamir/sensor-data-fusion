# Fusion Explorer

Interactive 3D explanations of the *Introduction to Sensor Data Fusion* lectures — see `docs/2026-11-17-fusion-explorer-design.md`.

## Run

```bash
npm install      # once
npm run dev      # then open http://localhost:5173
npm test         # math-engine tests
```

## Layout

- `src/engine/` — UI-free math (Gaussians, grid-based Bayes recursion), unit-tested in `engine.test.ts`
- `src/three/` — reusable 3D pieces (surfaces, densities, labels, camera)
- `src/ui/` — chapter shell (beats, derivations, explain-it-back cards), sliders, 2D plots
- `src/chapters/` — one file per chapter

## Status

- [x] Ch 1 "The car in the dark" — scrollytelling chapter: 3D night-road world (`src/chapters/ch1/`), screenplay + audit in `docs/scripts/`
- [x] Ch 2 "The ship in the fog" — Bayesian recursion: story (`src/chapters/ch2/`), practice, deep-dive slot; screenplay in `docs/scripts/ch2-script.md`
- [ ] Ch 3–10
