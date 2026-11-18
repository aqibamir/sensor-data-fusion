# Chapter 3 — "Bringing Them Home"
### Screenplay for the Kalman filter (Lecture 2 p.16–29; V5 p.8–10; MHT p.10–12, p.49)

*Same format as Chapters 1–2. Depth target: at least Chapter 2's — every Kalman equation derived from Chapter 2's loop, the product formula proven, a full numeric hour by hand, and RTS retrodiction. Then Practice (heavy on computation) and a Deep-dive slot.*

**Why Apollo?** The Kalman filter isn't an abstract invention that later found a use — it flew. In the 1960s, Stanley Schmidt's group at NASA Ames adapted Rudolf Kálmán's 1960 filter (in its extended, non-linear form) for Apollo navigation. It's the perfect story for a chapter whose message is: *when everything is a bell curve and the physics is linear, Chapter 2's loop becomes a handful of matrix formulas a 1960s computer could run.*
*(Historical claims kept careful: Kálmán published in 1960; Schmidt's team at NASA Ames developed the extended Kalman filter for Apollo's navigation; the Apollo Guidance Computer had very little memory, which is why a recursive filter mattered.)*

---

## THE WORLD
| Object | Look | Role |
|---|---|---|
| **Earth and Moon** | Earth glowing on the left, the Moon on the right, deep space with stars | the stage |
| **The spacecraft** | A small command/service module; thruster puffs | the truth (amber trail) |
| **Tracking stations** | Three dish antennas on Earth (Goldstone, Madrid, Canberra — the real Deep Space Network sites) sending beams | measurements (range) |
| **The belief ellipse** | A glowing blue ellipse around the craft in the (distance, speed) plane, shown both around the craft and on a side panel (“phase board”) | the Gaussian 𝒩(x; x̂, P) |
| **The computer** | A small panel with blinking digits showing x̂ and P | the filter's memory: just two things |
| **Mission control** | A wall screen with the trajectory | retrodiction (post-flight reconstruction) |

To keep the maths in 2D, the state is **(distance from Earth r, radial speed ṙ)** — the lecture's “position and velocity” example in one dimension.

---

## PROLOGUE — "Two numbers and a matrix"
- *On screen:* the spacecraft coasts towards the Moon; a station's beam touches it; numbers flicker.
- *Narration:* Chapter 2 showed the perfect recipe: carry a belief forward, update it with every measurement. But it has a catch — the belief is a whole curve. Storing and updating a curve over thousands of points is expensive. The Apollo computer had about 4 kilobytes of erasable memory.
- *Predict:* “What if the belief were always a bell? How many numbers would the computer need to remember?” → **a mean and a covariance**: for (r, ṙ), 2 + 3 numbers. Forever.
- *Big question:* **When does a bell stay a bell — and what are the formulas?** That's the Kalman filter.

## SCENE 1 — "Why bells stay bells" (the Gaussian assumptions)
- Chapter 2's three ingredients, each assumed Gaussian (L2 p.16):
  - previous posterior p(x_{k−1}|𝒵^{k−1}) = 𝒩(x_{k−1}; x_{k−1|k−1}, P_{k−1|k−1})
  - dynamics p(x_k|x_{k−1}) = 𝒩(x_k; F x_{k−1}, D)
  - sensor p(z_k|x_k) = 𝒩(z_k; H x_k, R)
  → then prior and posterior are Gaussian too.
- The two magic properties from Chapter 1, now doing real work: linear maps keep bells bells; bell × bell = bell (proved next scene).
- Notation decoded: x_{k|k−1} = mean of p(x_k|𝒵^{k−1}); P_{k|k−1} its covariance. “k given k−1.”
- Equations as physics: x_k = F x_{k−1} + G v_k (L2 p.21); z_k = H x_k + w_k (L2 p.24).

## SCENE 2 — "The product formula" (the engine of the whole course)
- 3D: two bell landscapes over the same plane — a wide prior and a narrow “ridge” likelihood — multiplied point by point; the product is a smaller bell. A slider morphs one into the product.
- Statement (MHT p.11, three equivalent forms):
  𝒩(z; Hx, R) 𝒩(x; y, P) = 𝒩(z; Hy, S) × { 𝒩(x; y + Wν, P − WSWᵀ) | 𝒩(x; Q(P⁻¹y + HᵀR⁻¹z), Q) | 𝒩(x; y + Wν, (I − WH)P) }
  with ν = z − Hy, S = HPHᵀ + R, W = PHᵀS⁻¹, Q⁻¹ = P⁻¹ + HᵀR⁻¹H.
- Every symbol tied to a picture: ν = gap between reading and prediction; S = spread of that gap; W = how far to move; Q = information adds (Chapter 2's “1/P = 1/P_pred + 1/R”, now with matrices).
- Key remark: the first factor 𝒩(z; Hy, S) **does not depend on x** — it's the normalisation constant, i.e. Chapter 2's expected measurement.
- 1D proof by completing the square (Derive, 4 moves). Matrix proof → Deep dive.
- Check: which factor is independent of x and what is it?

## SCENE 3 — "Prediction" (Chapman–Kolmogorov, solved)
- Derivation (L2 p.17–19): CK integral → product formula with the roles of “z” played by x_k → the x_{k−1} factor integrates to 1 → result 𝒩(x_k; F x_{k−1|k−1}, F P Fᵀ + D).
- Results: **x_{k|k−1} = F x_{k−1|k−1}**, **P_{k|k−1} = F P_{k−1|k−1} Fᵀ + D**. Chapter 1's A X Aᵀ plus Chapter 2's “uncertainties add”.
- Interpretation table (L2 p.20): F = transition matrix (drift), D = process-noise covariance (diffusion); E[x_k|x_{k−1}] and Cov[x_k|x_{k−1}].
- 3D: the ellipse on the phase board shears (F) and then swells (D).

## SCENE 4 — "Where does D come from?" (the piecewise constant white acceleration model)
- The lecture's model: F = [[I, ΔT I], [0, I]], D = σ² [[¼ΔT⁴ I, ½ΔT³ I], [½ΔT³ I, ΔT² I]].
- Derivation from physics: during one step a constant random acceleration a ~ 𝒩(0, σ²) acts; position changes by ½aΔT², speed by aΔT → G = (½ΔT², ΔT)ᵀ, D = G σ² Gᵀ.
- Sliders ΔT and σ: watch D's ellipse tilt (position and speed errors correlated, because one push moves both).
- Check: doubling ΔT multiplies the position-variance term by? (16.)

## SCENE 5 — "Filtering" (Bayes, solved)
- Derivation (L2 p.22–23): Bayes → product formula → the normalisation cancels the x-independent factor.
- Results, built one at a time with meaning:
  - innovation **ν = z − H x_{k|k−1}** (what's new)
  - innovation covariance **S = H P_{k|k−1} Hᵀ + R** (how big “new” normally is)
  - Kalman gain **W = P_{k|k−1} Hᵀ S⁻¹** (how much to trust what's new)
  - **x_{k|k} = x_{k|k−1} + W ν**, **P_{k|k} = P_{k|k−1} − W S Wᵀ**
- The gain as a dial: P small / R large → W → 0 (ignore the reading); P large / R small → W → H⁻¹-like (jump to it). Slider demo on the phase board.
- **Key insight: you can't measure speed, but the filter learns it** — H = (1, 0) measures range only; the correlation in P (from Scene 3's shear) lets each range update correct the speed. Visual: the ellipse's tilt makes a range-only correction move the speed estimate.
- Slide-typo notes (shown discreetly): L2 p.25 writes x_{k|k} = x_{k|k−1} + Wν “= W(z − Hx_{k|k−1})” — the right side is missing x_{k|k−1}; V5 p.20 writes ν = Hx − z (sign flipped).

## SCENE 6 — "One full step by hand" (numbers)
- 1D first (position only): P = 4, q = 9, R = 9, x̂ = 40, z = 50 → predict 13 → S = 22 → W = 0.59 → x = 45.9, P = 5.32 (matches Ch 2's information rule).
- Then 2D (r, ṙ) with ΔT = 1: full F, D, H = (1, 0), compute x_{k|k−1}, P_{k|k−1}, S, W, x_{k|k}, P_{k|k} — a worked table you can follow with a calculator; the same numbers shown live by the engine.

## SCENE 7 — "Trans-lunar coast" (the filter running)
- Playground: the craft coasts; stations measure range every ΔT; Step/Play; the ellipse breathes (predict grows, update shrinks); readouts of x̂, P, W, ν/√S.
- Sliders σ (process noise), R, ΔT. Mistuning demo: tell the filter σ is tiny while the truth manoeuvres (a mid-course burn) → innovations grow too big and one-sided, the estimate lags (Ch 2's “white innovations” check) → motivation for IMM (Ch 9).
- Steady state: the gain settles (Ch 2's steady width, now with a constant W).

## SCENE 8 — "When is Kalman optimal?" (assumptions and limits)
- Optimal (minimum mean squared error, and the exact Bayes posterior) **if** dynamics and sensor are linear with additive Gaussian noise (L2 p.25).
- What breaks it: non-linear sensors (range/azimuth → Ch 4), unknown data origin (clutter → Ch 7–8), changing dynamics (Ch 9). The Kalman filter is the **basis** for EKF, UKF, IMM, MHT.

## SCENE 9 — "The post-flight report" (RTS retrodiction)
- Mission control reconstructs the whole trajectory after landing.
- Derivation (L2 p.27–29, MHT p.49): Chapter 2's retrodiction + product formula →
  W_{l|l+1} = P_{l|l} Fᵀ P_{l+1|l}⁻¹; x_{l|k} = x_{l|l} + W (x_{l+1|k} − x_{l+1|l}); P_{l|k} = P_{l|l} + W (P_{l+1|k} − P_{l+1|l}) Wᵀ.
- Visual: ellipses shrink backwards along the trajectory; the reconstructed path is smoother than the filtered one.
- Check: why is P_{l|k} ≤ P_{l|l}? (P_{l+1|k} − P_{l+1|l} is “negative”: later data only remove uncertainty.)

## EPILOGUE — "Five lines that flew to the Moon"
- The full Kalman filter on one card: prediction (2 lines), filtering (4 lines), retrodiction (3 lines).
- Where next: Ch 4 (curved sensors: EKF, UKF), Ch 5 (several sensors: fusion formula = stacking H and R).

## PRACTICE (computation-heavy)
1. Complete the square: product of two 1D bells.
2. Prediction with F and D (2D, ΔT = 2).
3. Build D from the white-acceleration model.
4. One filtering step in 1D (ν, S, W, x, P).
5. One filtering step in 2D with H = (1, 0) — does the speed estimate change?
6. Gain intuition: place W on a slider for given P and R.
7. RTS one step back (1D).
8. Spot the slide typo (choose the correct x_{k|k} formula).
+ 6 explain-back questions (assumptions; product formula; prediction derivation; filtering & gain; why speed is learnt; RTS).

## DEEP DIVE (planned)
Product formula in matrix form (proof via the matrix inversion lemma) · the three forms of the covariance update and Joseph form · information filter · Kalman as least squares · steady-state Riccati equation · the history (Kálmán, Schmidt, Apollo).

---

## Audit
| Lecture item | Where |
|---|---|
| Gaussian idea: posterior, dynamics, prior, measurement, posterior (L2 p.16, V5 p.8) | Scene 1 |
| Product formula, three forms (MHT p.11, V5 p.9, L2 p.18) | Scene 2 |
| Prediction derivation via product formula (L2 p.17–19, MHT p.55) | Scene 3 |
| F, D meanings, E/Cov of transition (L2 p.20) | Scene 3 |
| Piecewise constant white acceleration model (L2 p.20) | Scene 4 |
| Linear Markov process x_k = F x_{k−1} + G v_k (L2 p.21) | Scenes 1, 4 |
| Filtering derivation, W, S, ν, update (L2 p.22–23, 25) | Scene 5 |
| Measurement equation z = Hx + w (L2 p.24) | Scenes 1, 5 |
| Summary card, optimality, basis for EKF/UKF/IMM/MHT (L2 p.25, V5 p.10) | Scene 8, Epilogue |
| Expected measurement 𝒩(z; Hx_{k|k−1}, S) (MHT p.10, V5 p.18) | Scene 2 (normalisation factor), Scene 5 |
| Retrodiction / RTS (L2 p.27–29, MHT p.49) | Scene 9 |
| Slide typos (L2 p.25, V5 p.20) | Scene 5 notes |

| Beginner trap | Fix |
|---|---|
| Matrix algebra overload | Every result shown first in 1D (Scene 6), then in 2D; Chapter 1's matrix scene linked |
| “Why does a range-only radar know the speed?” | Scene 5 key-insight visual |
| Three covariance-update forms look like three different results | Scene 2: shown equal; Deep dive: proof |
| Kalman = magic | Every line derived from Chapter 2's loop + Chapter 1's two Gaussian properties |

**Verdict:** covers all Kalman material in the decks; depth above Chapter 2 (5 derivations: product formula, prediction, white-acceleration D, filtering, RTS).
