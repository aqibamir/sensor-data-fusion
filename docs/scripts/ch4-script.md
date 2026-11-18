# Chapter 4 — "Curved Worlds"
### Screenplay for non-linear sensors and dynamics: polar measurements, EKF, UKF (Lecture 2 p.30–43; MHT p.10)

*Same format as Chapters 1–3. Depth target: at least Chapter 3's. The polar conversion and its Jacobian are worked by hand, both EKF Jacobians are derived, the UKF is built from its σ-points, and the three methods are compared on one picture. Then Practice (computation-heavy) and a Deep-dive slot.*

**Why an airport?** A real airport surveillance radar is the best example of a curved sensor. It spins, and every sweep it reports **range and bearing**, never x and y. Its error has a shape you can *see*: small along the beam (range is measured from timing, which is precise), wide across it (bearing comes from the beam width, which is coarse). At long range that error isn't an ellipse any more. It is a **banana**. The whole chapter is about the banana: how to squeeze it back into a bell so that Chapter 3's five lines still work.
*(Factual claims kept careful: airport surveillance radars rotate at roughly 4–5 s per sweep and measure range by echo timing and bearing from the antenna direction. Exact accuracy figures are illustrative, not quoted from any specific radar.)*

---

## THE WORLD
| Object | Look | Role |
|---|---|---|
| **The airport at dusk** | Runway lights, terminal, low hills, an HDRI sky | the stage |
| **The radar** | A rotating radar antenna on a mast; a faint sweeping beam on the ground | the sensor: measures (r, φ) |
| **The airliner** | A twin-jet on approach, navigation lights blinking | the truth (amber trail) |
| **The blip** | A dot appearing where the beam crosses the plane | the measurement z = (r, φ) |
| **The error banana** | A glowing cloud of 2,000 sample points around the blip, curved along the range ring | the true measurement density, which is not Gaussian in (x, y) |
| **The ellipse** | A blue σ-ellipse laid over the banana | the Gaussian approximation (linearised, or from σ-points) |
| **The polar panel** | A side panel with axes r and φ, where the same cloud is a neat upright ellipse | “the sensor's own world is still Gaussian” |
| **The five σ-points** | Five bright beads with thin stalks showing their weights | the UKF's sample |

The state is position and velocity in the plane, x = (x, y, ẋ, ẏ). The measurement is z = (r, φ). To keep the pictures readable, the radar sits at the origin.

---

## PROLOGUE — "The straight line was a lie"
- *On screen:* the radar spins; the beam crosses the airliner; a blip lights up. We zoom in on the blip: the error cloud is a curved smear following the range ring.
- *Narration:* Chapter 3 ended with five lines that flew to the Moon, and one small print: **linear** dynamics, **linear** sensor, Gaussian noise. Real radars don't measure x and y. They measure *how far* and *which way*. And x = r cos φ is not a straight line.
- *Predict:* “If the bearing error is ±1° and the plane is 50 km away, how wide is the smear sideways?” → 50 km × 0.0175 ≈ **870 m**, while the range error might be only ~50 m. Long and thin. And curved.
- *Big question:* **The world is curved. Chapter 3 needs straight lines. What do we do?** The lecture's answer, in three words: **“Be wise — linearize!”** (L2 p.32). And then a second, cleverer answer: approximate the *density*, not the function (UKF).

## SCENE 1 — "Where linearity breaks" (the non-linear models)
- The two places Chapter 3 assumed straight lines (L2 p.33–35):
  - dynamics: x_k = F x_{k−1} + G v → in general **x_k = f(x_{k−1}) + G v_{k−1}** (example: an aircraft in a coordinated turn, where heading changes and sin/cos appear)
  - sensor: z_k = H x_k + w_k → in general **z_k = h(x_k) + w_k** (example: the radar)
- *Visual:* push a bell through a straight line → still a bell (Ch 1's linear-map rule). Push the same bell through a curve → a skewed, curved shape. Side by side, slider for how curved the function is.
- *Why this matters:* the product formula (Ch 3 Scene 2) only works for 𝒩(z; **H**x, R). With h(x), the likelihood as a function of x is no longer a bell, so posterior × likelihood is no longer a bell, and the filter would have to carry a whole curve again (Chapter 2's expensive problem).
- *Key sentence for the exam:* the Kalman filter is optimal only for linear models with additive Gaussian noise (MHT p.10). For non-linear models we **approximate** so that every density is a Gaussian again. The EKF and UKF are two different approximations.
- Check: which of these is linear in the state x = (x, y, ẋ, ẏ)? (a) position x; (b) range √(x² + y²); (c) x + Δt·ẋ; (d) bearing atan2(y, x). → (a) and (c).

## SCENE 2 — "The radar's own world" (polar measurements)
- The sensor model (L2 p.31): z_k = (r_k, φ_k), **R_k = diag(σ_r², σ_φ²)**. In the radar's own coordinates the error is a neat upright Gaussian: range and bearing errors independent.
- The polar panel shows it: an axis-aligned ellipse in (r, φ). The 3D world shows the same cloud mapped through x = r cos φ, y = r sin φ: a banana.
- *Hands-on:* sliders for distance r and σ_φ. At short range or small σ_φ the banana is almost an ellipse; far away or with a wide beam it visibly bends. **Linearisation is good when the curve is gentle over the size of the error.** That idea returns in every scene.
- The cross-range size: arc length = r · σ_φ (σ_φ in radians). It grows with distance, while range accuracy doesn't. That is why the ellipse gets *longer* the further the plane is.

## SCENE 3 — "Straighten the curve locally" (Taylor, 1st possibility)
- The lecture's first method (L2 p.31): convert the measurement to Cartesian coordinates, and approximate the conversion by a straight line near the measured point.
- The conversion: **t(z) = r (cos φ, sin φ)ᵀ**.
- Taylor series, first two terms, around a point s′ = (r′, φ′): **t(z) ≈ t(s′) + T (z − s′)**, with the Jacobian
  **T = ∂t/∂s = [[cos φ, −r sin φ], [sin φ, r cos φ]] = [[cos φ, −sin φ], [sin φ, cos φ]] · diag(1, r)**.
- Derive T entry by entry (Derive block, 4 moves): ∂(r cos φ)/∂r = cos φ, ∂(r cos φ)/∂φ = −r sin φ, and so on. Then show the factorisation: **a rotation by φ times a stretch by r** in the bearing direction. Picture: the upright polar ellipse is first stretched sideways by r (radians → metres), then rotated to point along the beam.
- Now Chapter 1's linear-map rule does the rest (L2 p.31 bottom): if z ~ 𝒩(x, R) and z′ = t + Tz, then **z′ ~ 𝒩(t + Tx, T R Tᵀ)**.
- The converted covariance: **T R Tᵀ = Rot(φ) · diag(σ_r², r²σ_φ²) · Rot(φ)ᵀ**. Read it aloud: σ_r along the beam, r·σ_φ across it, turned to the bearing.
- Then the ordinary Kalman filter runs with the converted measurement: z′ = position, **H = [I 0]**, R′ = T R Tᵀ, recomputed every scan (R depends on r and φ: the time-indexed R_k from Ch 3).
- *Visual:* the blue ellipse laid over the banana. At 5 km it fits perfectly. At 80 km with a 2° beam its middle fits, but the banana's tips stick out. The ellipse doesn't bend.
- *Honest limit:* T is evaluated at the measured point, not the true one, and the curvature is ignored. Both are fine while r·σ_φ is small compared with r (that is, while σ_φ is small in radians).
- Check: the plane is due north (φ = 90°). Which way does the long axis of the ellipse point? (East–west, across the beam.)

## SCENE 4 — "The Extended Kalman Filter" (2nd possibility: linearise the model, not the data)
- Instead of converting the measurement, keep z in polar coordinates and linearise **h** and **f** inside the filter (L2 p.32–36).
- The EKF, line by line, side by side with Chapter 3's card (changes in orange):
  - prediction: **x_{k|k−1} = f(x_{k−1|k−1})**, **P_{k|k−1} = F P Fᵀ + D**, with **F = ∂f/∂x evaluated at x_{k−1|k−1}**
  - filtering: **x_{k|k} = x_{k|k−1} + W (z_k − h(x_{k|k−1}))**, **P_{k|k} = P_{k|k−1} − W S Wᵀ**, with **H = ∂h/∂x evaluated at x_{k|k−1}**, **S = H P Hᵀ + R**, **W = P Hᵀ S⁻¹**
- The rule to remember: **the mean goes through the real non-linear function; the covariance goes through its Jacobian.** The Jacobian is “the best straight line at the current estimate”, and the covariance rules of Ch 3 need a straight line.
- Deriving the radar Jacobian (Derive, 5 moves): h(x) = (√(x² + y²), atan2(y, x)) →
  **H = [[x/r, y/r, 0, 0], [−y/r², x/r², 0, 0]]**. Meaning: the first row is the unit vector along the beam (range changes only if you move towards or away from the radar); the second is the across-beam direction divided by r (bearing changes faster when you're close). Zero columns: the radar measures no velocity.
- A non-linear f example: a constant-speed turn. F = ∂f/∂x evaluated at the current estimate. Just show that F now changes every step and depends on the estimate. Don't derive the full turn model; the lecture doesn't.
- *Visual:* tangent plane touching a curved surface h(x) at the estimate. Move the estimate and the tangent plane rolls with it.
- **Why the point of linearisation matters:** H is evaluated at the *prediction*, F at the previous *estimate*. If the estimate is far from the truth, the tangent is taken at the wrong place, the gain is wrong, and the filter can lose the target (divergence). Demo: start the EKF with a bad initial position, watch it recover or fail depending on P_{0|0}.
- **Slide-typo note** (shown discreetly): L2 p.36 writes the innovation as z_k − h(x_{k−1|k}). The index should be **h(x_{k|k−1})**, the predicted measurement.
- Check: why does the EKF still use h(·) itself in the innovation, but its Jacobian H in S and W? (The mean is pushed through the true function, which is more accurate. The covariance formulas need a matrix.)

## SCENE 5 — "Bend the cloud, not the function" (UKF idea)
- The lecture's motto (L2 p.38): **“It is easier to approximate a probability distribution than an arbitrary non-linear function.”**
- The three steps (L2 p.38, p.42):
  1. choose **σ-points** whose mean and covariance equal those of the density
  2. push each point through the non-linear function
  3. compute the new mean and covariance from the moved points
- *Visual:* five beads on the blue ellipse (centre + two along each axis), each with a stalk for its weight. Send them through the polar-to-Cartesian map: the beads land on the banana, and a new ellipse is fitted to where they landed. Compare with Scene 3's tangent ellipse: the UKF ellipse is shifted slightly *inwards* towards the radar, because the banana's middle bulges towards the radar. That shift is the mean error the EKF can't see.
- No Jacobians needed. The function only has to be *evaluated*, never differentiated. That is a real engineering advantage when f or h comes from a simulation or a lookup table.

## SCENE 6 — "Choosing the σ-points" (the recipe)
- Exact lecture recipe (L2 p.40–41): state dimension n → **2n + 1 points**:
  - x₀ = x̂, weight W⁰ with **−1 < W⁰ < 1**
  - **x_i = x̂ + (√(n/(1−W⁰) · P))_i** for i = 1…n
  - **x_{i+n} = x̂ − (√(n/(1−W⁰) · P))_i** for i = 1…n
  - **W^j = (1 − W⁰)/(2n)** for j = 1…2n
- Decode every symbol:
  - (√M)_i = the i-th column of a matrix square root of M: a matrix A with A Aᵀ = M (in practice the Cholesky factor). For a diagonal P it is just the standard deviations along each axis.
  - Why √(n/(1−W⁰))? So that the weighted spread of the points reproduces P exactly. Show the 1D case (n = 1): points x̂, x̂ ± √(P/(1−W⁰)), weights W⁰ and (1−W⁰)/2 each → weighted mean = x̂, weighted variance = 2·(1−W⁰)/2·P/(1−W⁰) = P ✓ (Derive, 3 moves).
  - The weights sum to 1: W⁰ + 2n·(1−W⁰)/(2n) = 1 ✓.
  - W⁰ is a tuning knob. Slider: larger W⁰ pushes the outer points further out (they must carry more spread with less weight). Negative W⁰ is allowed (bounds −1 < W⁰ < 1) and spreads them further still.
- Counting: our 4D state needs 9 points; a 6D state needs 13. Still tiny compared with Chapter 2's grid.
- **Slide-notation note:** L2 p.40 labels the weight W^j but says “for all i”. Same thing, j = i = 1…2n.

## SCENE 7 — "The Unscented Kalman Filter" (predict and filter)
- **Prediction** (L2 p.43): σ-points x_i of the previous posterior → **x_i^f = f(x_i)** → **x^f = Σ Wⁱ x_i^f**, **P^f = Σ Wⁱ (x_i^f − x^f)(x_i^f − x^f)ᵀ + D**. The sums run over i = 0…2n. D is added once, at the end, because the noise is additive.
- **Filtering** (L2 p.44): σ-points of the predicted density → through the sensor: **z_i^h = h(x_i)** → predicted measurement **z^h = Σ Wⁱ z_i^h**, its covariance **Cov(z) = Σ Wⁱ (z_i^h − z^h)(…)ᵀ + R**, the cross-covariance **Cov(x, z) = Σ Wⁱ (x_i − x^f)(z_i^h − z^h)ᵀ** → **W = Cov(x, z) Cov(z)⁻¹**, **x = x^f + W (z − z^h)**, **P = P^f − W Cov(z) Wᵀ**.
- Match the UKF's lines with Chapter 3's: Cov(z) **is S**; Cov(x, z) **is P Hᵀ** (in the linear case the two are literally equal; show it with h(x) = Hx in one line). So W = P Hᵀ S⁻¹ again. The UKF is the Kalman filter with the matrices *measured from points* instead of computed from H.
- **Slide-wording note:** L2 p.44 says “choose σ-points of the measurement density z_i”. The points are drawn from the **predicted state** density and then mapped by h. The slide's subscripts (Cov z_f vs z_h) are also mixed; the script uses one notation throughout.
- *Visual:* full UKF step on the airport scene. Beads around the predicted ellipse → mapped into the polar panel → compared with the blip → the update pulls the ellipse.

## SCENE 8 — "Three filters, one banana" (comparison)
- The playground: the airliner flies a long arc past the radar at 10–90 km. Toggle **converted-measurement KF / EKF / UKF**, each drawing its own ellipse in its own colour, plus a cloud of 2,000 true samples (the honest answer).
- Sliders: range, σ_φ, W⁰, process noise. What the learner sees:
  - close in, small σ_φ: all three are the same. Linearisation is harmless.
  - far out, wide beam: the tangent ellipse sits too far out and is too confident in the cross direction; the UKF ellipse fits the cloud better.
  - turn manoeuvre with a bad initial estimate: the EKF's tangent is taken at the wrong place, so it can diverge; the UKF is more forgiving.
- The exam-ready comparison table:
  | | Converted KF | EKF | UKF |
  |---|---|---|---|
  | What is approximated | the measurement conversion | the functions f, h (1st-order Taylor) | the density (σ-points) |
  | Needs derivatives | T (once per scan) | F and H (Jacobians) every step | none |
  | Cost | 1 KF step | 1 KF step + Jacobians | 2n+1 function evaluations |
  | Weak spot | large r·σ_φ | strong curvature, bad linearisation point | choice of W⁰; still a Gaussian at the end |
- Both EKF and UKF still end in a **single Gaussian**. If the true density has two humps (Ch 7–8) or several motion modes (Ch 9), neither can represent it. This is the honest limit and the bridge forward.

## EPILOGUE — "Curves, tamed"
- One card: the polar Jacobian and T R Tᵀ; the EKF (mean through f/h, covariance through Jacobians); the UKF (2n+1 points, 3 steps, Cov(x, z) Cov(z)⁻¹).
- Where next: Ch 5. The airport gets a **second radar** on the other side of the runway, and the two bananas cross.

## PRACTICE (computation-heavy)
1. Polar → Cartesian: r = 20 km, φ = 30° → (x, y).
2. Compute T at (r, φ) = (10 km, 90°) and the converted covariance T R Tᵀ for σ_r = 50 m, σ_φ = 1°. Which entry is bigger, and why?
3. Cross-range error: at which range does r·σ_φ exceed 1 km for σ_φ = 0.5°?
4. Derive the radar Jacobian H at x = (3, 4) km. Check: first row = unit vector (0.6, 0.8).
5. Linear or not? Classify four model functions.
6. One EKF update (2D position-only state, numbers given): h(x̂), H, S, W, x, P.
7. σ-points by hand: n = 1, x̂ = 2, P = 4, W⁰ = 1/3 → the three points and weights; check the mean and variance.
8. σ-points for a 2D diagonal P with W⁰ = 0 → five points (placed on a plot by dragging: PlaceExercise).
9. Push the 1D σ-points of Ex. 7 through h(x) = x²: UKF mean vs EKF mean vs the exact mean 𝔼[x²] = x̂² + P = 8. Which is closer?
10. Spot the slide typo in the EKF innovation (choose the correct index).
11. Match the table: which method needs Jacobians, which needs 2n+1 evaluations, which approximates the density?
+ 6 explain-back questions (why non-linearity breaks Kalman; the polar covariance and its shape; EKF: what goes through f and what through F; why the linearisation point matters; UKF in three steps; when EKF and UKF agree).

## DEEP DIVE (planned)
Bias of the converted measurement (the mean of r cos φ isn't r̂ cos φ̂) and debiased conversion · second-order EKF · iterated EKF · why the UKF captures the mean to second order (Taylor argument) · the general scaled σ-point family (α, β, κ) and how the lecture's W⁰ fits into it · coordinated-turn model in full.

---

## Audit
| Lecture item | Where |
|---|---|
| “The example of range, azimuth measurements” (L2 p.30) | World, Scene 2 |
| z_k = (r_k, φ_k), R_k = diag(σ_r², σ_φ²) (L2 p.31) | Scene 2 |
| Cartesian ↔ polar, t(z) = r(cos φ, sin φ) (L2 p.31) | Scene 3 |
| Taylor series, first two components around s′ (L2 p.31) | Scene 3 |
| Jacobian T and its factorisation (rotation × diag(1, r)) (L2 p.31) | Scene 3 |
| T R Tᵀ with diag(σ_r², (rσ_φ)²) (L2 p.31) | Scene 3 |
| Gaussian under linear transform 𝒩(z′; t + Tx, T R Tᵀ) (L2 p.31) | Scene 3 |
| “1. possibility” → implies a second one (EKF) (L2 p.31) | Scenes 3–4 |
| EKF motivation: non-linear dynamics and sensors, “Be wise linearize!” (L2 p.32–33) | Prologue, Scene 1 |
| Linear models vs f(x), h(x) side by side (L2 p.34–35) | Scene 1 |
| EKF formulas, F = ∂f/∂x at x_{k−1|k−1}, H = ∂h/∂x at x_{k|k−1} (L2 p.36) | Scene 4 |
| EKF innovation index typo (L2 p.36) | Scene 4 note, Practice 10 |
| UKF motivation sentence and 3 steps (L2 p.38–39, 42) | Scene 5 |
| σ-point recipe, 2n+1 points, −1 < W⁰ < 1, weights (L2 p.40–41) | Scene 6 |
| UKF prediction formulas incl. + D (L2 p.43) | Scene 7 |
| UKF filtering formulas, Cov(z) + R, Cov(x, z), W, x, P (L2 p.44) | Scene 7 |
| Terejanu UKF tutorial reference (L2 p.44) | Deep dive (reading) |
| Kalman is the “basis for EKF, UKF, …”; optimal only if linear + Gaussian (MHT p.10) | Scene 1, Scene 8 |

| Beginner trap | Fix |
|---|---|
| “Jacobian” is a scary word | Built entry by entry; shown as a tangent plane; factorised into rotate × stretch |
| Mixing up where to linearise (estimate vs prediction) | Scene 4 rule + divergence demo |
| √P of a matrix | Defined as “A with A Aᵀ = P”; diagonal case first |
| UKF looks like a new filter | Scene 7 maps every UKF line onto Ch 3's S, P Hᵀ, W |
| Thinking EKF/UKF fix everything | Scene 8: both still output one Gaussian |
| Radians vs degrees in r·σ_φ | Practice 2–3 force the conversion |

**Verdict:** every statement on L2 p.30–44 and the relevant MHT p.10 line is mapped to a scene. Depth is at Chapter 3's level, with 5 derivations: the polar Jacobian, T R Tᵀ, the radar measurement Jacobian, σ-points reproducing the mean and covariance, and UKF = KF for linear h. The three slide issues are flagged.

Out of scope on purpose: second-order and iterated EKF, debiased conversion, the scaled (α, β, κ) UKF (the lecture doesn't teach these; Deep dive only, labelled “beyond the lecture”); fusing two radars (Ch 5); multi-modal densities (Ch 7–9).
