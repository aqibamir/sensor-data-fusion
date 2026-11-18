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
- [x] Ch 3 "Bringing them home" — Kalman filter (`src/chapters/ch3/`), practice, deep-dive slot; screenplay in `docs/scripts/ch3-script.md`
- [x] Ch 4 "Landing blind" — EKF/UKF (`src/chapters/ch4/`)
- [x] Ch 5 "Smoke on the ridge" — sensor fusion (`src/chapters/ch5/`)
- [ ] Ch 0, Ch 6–10 (Ch 0 screenplay ready)

## Credits

Road models and textures in `public/road/` — Quaternius and ambientCG (CC0). Space textures in `public/space/` — three.js examples (MIT), derived from NASA imagery. Night skies in `public/hdri/` — Poly Haven (CC0).

### Copyright and course materials

- **No course materials are included.** The lecture slides (Koch / Gehlen, Fraunhofer FKIE, Uni Bonn) and the book (W. Koch, *Tracking and Sensor Data Fusion*, Springer 2014) are not part of this repository. All explanations, stories, figures and exercises are original; formulas are standard mathematics.
- Short attributed quotations from the lectures and the book (a sentence at most) appear for study purposes only.
- Every third-party asset is listed with its licence in the `CREDITS.md` next to it (`public/road/`, `public/sea/`, `public/space/`, `public/hdri/`): CC0 (Quaternius, Kenney, ambientCG, Poly Haven), MIT (three.js example textures), and NASA content (not copyrighted; credit NASA, no endorsement implied).
- Historical names (Berlin Airlift, GCA, Apollo, Osborne Firefinder, Admiral Shovell) are used descriptively.

