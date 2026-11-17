# Fusion Explorer — Design

An interactive, 3Blue1Brown-style web app that teaches the *Introduction to Sensor Data Fusion* course (Prof. W. Koch / J. Gehlen, Fraunhofer FKIE, Univ. Bonn, WS 2026-27), exactly up to what the lectures cover.

## 1. Intent and why

The learner has an **oral exam** on this course. Every topic currently feels shaky. The goal is that they can **explain every concept and walk through every derivation in their own words, calmly**, because they have *seen* and *played with* each idea, not just read it.

So the app must do three things for every concept:
1. **Build intuition visually.** Moving pictures of densities, ellipses, gates and hypothesis trees.
2. **Let the learner experiment.** Real filters run underneath. Sliders change real results.
3. **Rehearse the exam.** Step-by-step derivations with the *why* of each step, and "explain it back" cards with examiner-style questions.

## 2. Goals, non-goals, anti-goals

**Goals**
- Cover every concept in the five lecture decks, in lecture order (see §5).
- Assume only basic probability. Everything else is built up from scratch.
- Use notation **identical to the slides**: `x_{k|k-1}, P_{k|k-1}, F, D, H, R, W, S, ν, Z^k, P_D, ρ_F, |FoV|, j_k, A, B, P_0, P_1`.
- Show every derivation the slides show, one step at a time, each step labelled with the rule it uses (marginalization, conditional pdf, Markov property, Bayes, product formula, …).
- End every chapter with exam questions and model answers that stay hidden until the learner has tried.
- Run locally in the browser from the course folder.

**Non-goals**
- Nothing beyond the lectures. Particle filter, PHD, tensor tracking, JPDA internals, extended targets etc. appear on Lecture 2 slide 4 *only as names*. The app may mention them in one line and goes no further. The same applies to the Koch book: it is a source for checking correctness only, never for extra scope.
- Not a homework solver. The exercise scenario is reused as the *setting* for demos, but the app does not hand out exercise code.
- Not a general tracking toolkit.

**Anti-goals (failure even if it "works")**
- **Wrong math.** Any formula, sign or animation that contradicts the slides (or correct mathematics, where a slide has a typo) is a bug of the highest severity.
- **Notation drift.** Symbols that differ from what the examiner will write on the board.
- **Eye candy that hides the derivation.** Every scene must connect to the formulas on screen.
- **Overload.** One idea per step. No wall of equations without a picture next to it.

## 3. Constraints

- Desktop browser is primary. It should still be usable on a laptop screen (≥1280 px). Phone layout is nice-to-have.
- Runs offline after `npm install`; no backend.
- Lives in `Sensor Data Fusion/fusion-explorer/`, next to the lecture PDFs.
- Delivered in **4 stages**, so the learner can start studying stage 1 while later stages are built.

## 4. Approaches considered

| | Approach | Trade-off | Verdict |
|---|---|---|---|
| A | **Live interactive web app.** React + Three.js scenes and KaTeX formulas on top of a tested TypeScript math engine that really runs KF/EKF/UKF/PDAF/MHT/IMM/SLRT | Most work. But the only option where "what if P_D = 0.5?" gives a real answer, and that kind of experimenting builds understanding | **Chosen** |
| B | Scripted browser animations (play/pause/step, no real filter) | Faster and more polished per scene, but passive | Rejected: weakens the "interactive" goal |
| C | Manim videos (3Blue1Brown's own tool) | Most faithful look, zero interactivity | Rejected |

The learner approved A, delivered in stages.

## 5. Content map — chapter by chapter

Each chapter follows the same arc: **Hook → Intuition scene → Interactive playground → Derivation walkthrough → Explain-it-back cards.** Slide references: L1 = "Introduction … 1", L2 = "Lecture 2", MHT = "MHT - IMM" deck (Koch), IMM = "IMM" deck (Koch), V5 = "MHT-IMM-SLRT" (Gehlen).

### Ch 0 — Why tracking and fusion? (L1; light)
- Natural intelligence tracks and fuses senses. Fusion is a branch of AI.
- The **processing chain** as an animated pipeline, one stage lighting up at a time (L1 slides 36–44): received signals → detection (data-rate reduction) → plots, including false ones → **association** (core function) → track maintenance (update) → track initiation → context (topography) → track-to-track fusion → user interface.
- The generic tracking & fusion system block diagram (MHT slide 2).
- "Known unknowns": target dynamics, sensor performance, clutter. Model-based vs data-driven.
- Tracking = prediction / filtering / retrodiction along time. Fusion = across sensors.
- The "methodological essence" Q&A list (L1 slide 47) as the chapter's exam cards.
- Five pillars and OODA levels: one compact diagram, no depth.

### Ch 1 — Probability toolkit (L2 slides 5–8; IMM slide 3)
- The object state as a random variable. State examples: 1D position, 9D kinematic, joint 2-object state, extended state, state + class.
- pdf rules, each with a live 3D/2D picture: normalisation, probability as area, expectation, **marginal** (a 3D joint surface flattened onto an axis), **conditional** (a slice of the surface, renormalised), **Bayes**.
- Gaussian N(x; x̄, P): a 2D bell surface. Drag the covariance entries and watch the ellipse rotate and stretch.
- The affine transform of a Gaussian: N(x; x̄, X) → N(y; a + A x̄, A X Aᵀ).
- Certain knowledge as a delta function (σ → 0).

### Ch 2 — The Bayesian tracking recursion (L2 9–15; MHT 9, 49–51)
- The big picture: prediction (dynamics model) → filtering (sensor model) → retrodiction (filtering output + dynamics), as one loop diagram.
- **Chapman–Kolmogorov derivation**, three steps each labelled: marginalization → conditional pdf → Markov property.
- **Bayes filtering derivation**: unpack Z^k, Bayes, likelihood × prior / normalisation constant.
- Generic retrodiction: p(x_l | Z^k) from p(x_{l+1} | Z^k).
- Scene: a 1D non-Gaussian density (grid-based) that is predicted (smeared) and then multiplied by a likelihood. The learner sees *why* it is a product and *why* it is renormalised.

### Ch 3 — Kalman filter (L2 16–29; MHT 10–12; V5 8–10, 17–18)
- The idea: everything is Gaussian (posterior, dynamics, measurement), so everything stays Gaussian.
- **The product formula** (all three forms on MHT slide 11). Scene: two 3D Gaussian surfaces multiply. One factor, N(z; Hy, S), does not depend on x; the other is the new Gaussian in x.
- **Prediction derivation** step by step, ending in x_{k|k-1} = F x_{k-1|k-1} and P_{k|k-1} = F P Fᵀ + D. Scene: the ellipse moves *and* grows.
- **Piecewise-constant white acceleration model**: F and D with Δt, and a slider for σ. Shows how D inflates the ellipse.
- **Filtering derivation**: innovation ν = z − H x_{k|k-1}, S = H P Hᵀ + R, W = P Hᵀ S⁻¹, x_{k|k} = x_{k|k-1} + W ν, P_{k|k} = P_{k|k-1} − W S Wᵀ. Scene: the ellipse shrinks toward the measurement. Sliders for R and P show the gain W trading off "trust the model" vs "trust the sensor".
- **Expected measurement** p(z_k | Z^{k-1}) = N(z_k; H x_{k|k-1}, S) as a side result. (Used again in Ch 6.)
- **RTS retrodiction**: x_{l|k} = x_{l|l} + W_{l|l+1}(x_{l+1|k} − x_{l+1|l}), etc. Scene: a past track becomes smoother once later data arrive; the ellipses shrink backwards in time.
- Optimality conditions (linear models, additive Gaussian noise). Basis for EKF, UKF, IMM, MHT.
- Playground: the exercise scenario (car on the mountain-pass road, 2 radars) with a live KF track.

### Ch 4 — Non-linear models: polar sensors, EKF, UKF (L2 30–44)
- Range/azimuth measurements, R = diag(σ_r², σ_φ²).
- **Polar → Cartesian linearisation**: T, and T R Tᵀ as a rotated, range-stretched ellipse. Scene: a banana-shaped true error cloud vs its Gaussian approximation. A range slider shows how the cross-range error grows like r·σ_φ.
- **EKF**: replace F and H by Jacobians of f and h. Formula table.
- **UKF**: "approximating a distribution is easier than approximating a non-linear function". The 2n+1 sigma points with weights W⁰ and (1−W⁰)/2n. Scene: sigma points pushed through a non-linear function; the reconstructed mean and covariance compared side by side with EKF linearisation and a Monte-Carlo cloud. Prediction and filtering equations as on L2 43–44.

### Ch 5 — The fusion formula (L2 45–48; V5 11–14)
- Each measurement is a pdf. For independent sensors, the joint likelihood is a product.
- Option 1: stack H and R = diag(R_1 … R_n).
- Option 2 (same H): R = (Σ R_i⁻¹)⁻¹ (harmonic mean), z = R Σ R_i⁻¹ z_i (weighted arithmetic mean).
- Scene: two radars with differently shaped polar ellipses. Their intersection forms the fused ellipse, which is tighter than either alone. Drag the sensor positions (ties back to Ch 4) and watch the fused ellipse change.

### Ch 6 — Gating and the χ² distribution (MHT 12–13; IMM 7–21; V5 17–21)
- Innovation, innovation covariance, **Mahalanobis distance** ν Sᵀ⁻¹ ν (a short aside on Mahalanobis).
- The expectation gate ν S⁻¹ ν ≤ λ(P_c) as an ellipse/ellipsoid. Why plain Euclidean distance is wrong (correlations).
- **χ² derivation**, step by step as on the IMM slides:
  - whitening u = P^{-1/2}(x − x̄), so q = Σ u_i²
  - n-dimensional polar coordinates and the solid-angle element
  - the volume of the n-sphere
  - the Gamma function: Γ(z+1) = zΓ(z), Γ(½) = √π (a short aside on Euler, Legendre, Pearson)
  - the result p(q) = q^{n/2−1} e^{−q/2} / (2^{n/2} Γ(n/2)), with E = n and V = 2n
- Scene: sample many Gaussian points, compute q for each, and watch the histogram converge to the χ²_n curve. Toggle n = 1, 2, 3. A 3D scene shows the gate ellipsoid in n = 3.
- Correlation probability P_c = 1 − Q(λ | n). An interactive χ² table: pick n and P_c and read off λ, with the gate in the scene resizing to match.

### Ch 7 — Detection, clutter and the likelihood for ambiguous data (MHT 5–22; V5 22–24)
- Highly uncertain data: imprecise, unresolved, false, missing (the "radar clutter" image).
- The **assignment problem** (MHT slide 7): known vs possible targets, true vs false plots, one hypothesis = one assignment.
- The **detection process**:
  - errors of the 1st and 2nd kind; P_D = 1 − P_I, P_F = P_II
  - Swerling I: P_D = P_F^{1/(1+SNR)}, with an interactive SNR slider
  - design rule: maximise P_D for a given P_F
- **False measurements**:
  - Poisson count with mean n̄ = ρ_F |FoV|
  - uniformly distributed in the FoV
  - Scene: random clutter scans drawn live from these distributions
- **The n_k + 1 interpretations** (E_0: not detected; E_j: z_j is the target). The likelihood derivation step by step, ending in p(Z_k, n_k | x_k) ∝ (1 − P_D) ρ_F + P_D Σ_j N(z_k^j; H x_k, R).
- Scene: this likelihood drawn as a surface over the state space: a flat floor (1−P_D)ρ_F plus bumps at each measurement. Sliders for P_D and ρ_F.
- Unresolved targets mentioned in one line only (as on the slides).

### Ch 8 — Mixture densities: NN, PDAF, MHT (MHT 23–51; IMM 22–37; V5 25–27)
- The **growing memory disaster**: N hypotheses and m data give N(m+1) continuations. Scene: a tree exploding.
- **Mono-hypothesis approximations**:
  - gating → KF
  - nearest neighbour: hard decision, not adaptive
  - PDAF: global combining
- **Moment matching**: x = Σ p_H x_H, P = Σ p_H [P_H + (x_H − x)(x_H − x)ᵀ], with the **spread term** shown visually. Scene: a 2-component mixture and its matched single Gaussian. Drag the components apart and watch the matched Gaussian get wider.
- **PDAF equations**:
  - weights p_k^j (the j = 0 weight from (1−P_D)ρ_F)
  - combined innovation
  - covariance = Kalman part + spread of innovations
- **PDAF properties** and "**multimodality is lost**".
- **The NN / PDAF / MHT 1D comparison** (MHT slides 31–47), rebuilt as an animated, steppable sequence: measurements, gate, NN (red) vs PDAF (blue) vs MHT (black), the next prediction (green) with two gates, new measurements, and the divergence over time.
- **MHT**:
  - hypothesis tree
  - weights normalised after all hypotheses are computed
  - the double sum when the prior is already a mixture
  - adaptive approximations: individual gating (→ KF), pruning (→ NN), local combining (→ PDAF)
- **Successive local combining**: similarity d(H1, H2) = (x₁ − x₂)ᵀ(P₁ + P₂)⁻¹(x₁ − x₂) < μ. The merging algorithm is animated on the tree.
- **Retrodiction for Gaussian mixtures** and of the hypothesis weights: "strong sons strengthen weak fathers; weak sons weaken even strong fathers; if all sons die, the father dies." Animated on the tree.
- Playground: the mountain-pass scenario with clutter. Run NN, PDAF and MHT side by side. Sliders: P_D, ρ_F, gate λ, pruning threshold.

### Ch 9 — Interacting Multiple Models (MHT 52–71; IMM 38–55; V5 30–40)
- Motivation: flight phases (airport, take-off, cruise, landing). One dynamics model is not enough.
- **The Markov chain over models**: the M1/M2/M3 graph with P(i|j). Each column of the transition matrix sums to 1. Scene: an animated 3-node graph; edit the probabilities and see the matrix update and the stationary behaviour.
- **Augmented state** (x_k, j_k): x is observed, j is hidden → a Hidden Markov Model.
- **The IMM dynamics** p(x_k, j_k | x_{k-1}, j_{k-1}) = p(j_k | j_{k-1}) N(x_k; F^{j_k} x_{k-1}, D^{j_k}).
- **Prediction**: the double sum (r² components) → the **mixing step** reduces it to r components by moment matching.
- **Filtering**: the mixture coefficients p(j_k | Z^k), with a per-model Kalman update. The case r = 1 is exactly the Kalman filter.
- **IMM retrodiction**: the exponential growth of model histories, approximated by moment matching. Generalise to model histories of variable length (one line, as on the slide).
- Playground: a target that goes straight, turns, then goes straight again. Shown: a single KF with small D (lags in the turn), a single KF with large D (noisy), and an IMM with live mode-probability bars.

### Ch 10 — Track extraction: the Sequential Likelihood Ratio Test (V5 41–50)
- Motivation: how is a track *born*? Assumptions: well-separated targets, scan-wise data.
- Hypotheses h₁ (exactly one target + clutter) vs h₀ (only clutter). P₁ ≈ P_D-like and P₀ ≈ P_F-like.
- LR(k) = p(Z^k | h₁) / p(Z^k | h₀), with equal priors.
- The recursive derivation LR(k) = LR(k−1) × [ … ] / (|FoV|^{−m_k} p_F(m_k)).
- **Decision rule**: LR < A → accept h₀; LR > B → accept h₁ (start the track, reset LR = 1); otherwise wait for another scan.
- **Wald approximations**: A ≈ (1 − P₁)/(1 − P₀), B ≈ P₁/P₀. The decision length is a random variable.
- Track initialisation by moment matching over all interpretations.
- Scene: an LR(k) curve on a log axis between horizontal A and B bands, updating scan by scan beside a 2D clutter scene. Sliders for P₀, P₁, P_D, ρ_F. A run counter shows the average decision length and the false-track rate.

### Exam Review page (built in stage 4)
All "explain it back" cards from every chapter in one place, filterable by chapter, with a "shuffle" mode for mock oral-exam practice.

## 6. How it's made (the builder's calls, already settled)

- **Stack**:
  - Vite + React + TypeScript
  - `three` via `@react-three/fiber` + `@react-three/drei` for 3D
  - plain SVG/Canvas for 2D plots
  - KaTeX for formulas
  - Vitest for tests
- **Math engine** (`src/engine/`), pure TypeScript and UI-free:
  - small dense linear algebra (n ≤ 9): multiply, transpose, inverse, Cholesky, matrix square root
  - Gaussian sampling
  - KF, RTS, EKF, UKF
  - fusion formula
  - Mahalanobis / χ² (pdf, CDF, quantile)
  - clutter generation
  - NN, PDAF, MHT (with pruning and local combining)
  - IMM (with mixing)
  - SLRT
  - the exercise scenario generator and radar simulator
  - Every algorithm is unit-tested against hand-computed values or known identities (e.g. IMM with r = 1 equals KF; PDAF with P_D = 1, ρ_F → 0 and one measurement equals KF; the χ² sample mean ≈ n).
- **Chapter structure**: each chapter is a sequence of **beats**. A beat = narration text + formula (with highlighted terms) + scene state. Next/Back buttons and arrow keys step through beats. Highlighted formula terms and scene objects share a colour, e.g. ν is always the same colour everywhere.
- **Visual style**: a 3Blue1Brown feel. Dark background, a consistent colour per quantity (prediction = green, measurement = red, posterior = blue, as in the MHT slides), smooth tweened transitions between beats.
- **Explain-it-back cards**: a question, a "think first" pause, then a reveal of the model answer plus a pointer to the beat that shows it.
- **Progress** (beats seen, cards marked "I can explain this") is stored in the browser's localStorage. It is a convenience only, and the app works without it.
- **Slide typos**: where a slide contains an obvious typo (e.g. L2 slide 25 writes x_{k|k} = x_{k|k-1} + Wν = W(z − Hx); V5 slide 20 writes ν = Hx − z), the app shows the correct formula and adds a small "note: slide shows …" marker, so the learner is not confused in the exam.

## 6a. The exercise scenario (from MHT deck slides 3–4)

Used as the setting for the playgrounds in Ch 3, 4, 5 and 8.

- **Ground truth**:
  - road: r(t) = (v t, a_y sin(4π v t / a_x), a_z sin(π v t / a_x))ᵀ
  - parameters: v = 20 km/h, a_x = 10 km, a_y = a_z = 1 km, t ∈ [0, a_x / v]
  - velocity ṙ(t) and acceleration r̈(t) come from the analytic derivatives
- **Sensors**:
  - ΔT = 2 s
  - 2 radars at r_s¹ = (0, 100 km, 10 km) and r_s² = (100 km, 0, 10 km)
  - state x_k = (r_kᵀ, ṙ_kᵀ)ᵀ at t_k = kΔT
- **Measurement**:
  - z_k = (range, azimuth) + (σ_r·N(0,1), σ_φ·N(0,1)), with σ_r = 10 m and σ_φ = 0.1°
  - no elevation measurement
  - the range term is taken from the slide formula as written: √((x−x_s)²+(y−y_s)²+(z−z_s)² − z_s²)
  - azimuth = arctan((y−y_s)/(x−x_s)), implemented as atan2
- **Cartesian conversion**: z_r (cos z_φ, sin z_φ)ᵀ + r_s.
- Ch 7, 8 and 10 add Poisson clutter on top (ρ_F, P_D sliders). Ch 9 adds a manoeuvring variant.
- *Builder's call:* playgrounds run on this scenario because it is the one the learner knows. The course prerequisite is that the learner writes and explains their *own* program, so the app never presents its engine code as an exercise solution, and it shows no "here is the code" panels.

## 6b. Checking the math (builder's call)

The learner can't yet catch errors, so:
- Each stage includes a **formula audit**. Every formula, derivation step and model answer in that stage's chapters is checked line by line against the cited slide. The checklist is kept in `docs/audit/stage-N.md`, with one row per formula, its slide reference and a check mark.
- Engine unit tests cover the numbers. The audit covers the text and the formulas.
- Wherever possible, derivation beats show numbers computed by the engine next to the symbols (e.g. W for the current slider values), so the text and the engine check each other.

## 7. Delivery stages

| Stage | Chapters | Also includes |
|---|---|---|
| 1 | Ch 0–3 (Why, Probability, Bayes recursion, Kalman + RTS) | App shell, navigation, beat system, engine core + KF tests, exercise scenario |
| 2 | Ch 4–6 (Polar/EKF/UKF, Fusion, Gating & χ²) | |
| 3 | Ch 7–8 (Clutter likelihood, NN/PDAF/MHT) | |
| 4 | Ch 9–10 (IMM, SLRT) | Exam Review page |

Each stage ends with the learner running it locally and giving feedback before the next stage starts.

## 8. Left to the builder

- Exact scene compositions, camera angles, colours beyond the fixed per-quantity mapping, and animation timing.
- Wording of narration and model answers, as long as it uses slide notation and stays within lecture scope.
- Internal code organisation beyond `src/engine/` being UI-free and tested.
- Default parameter values for the playgrounds (the exercise values, ΔT = 2 s, σ_r = 10 m, σ_φ = 0.1°, v = 20 km/h, are the starting point where they apply).
