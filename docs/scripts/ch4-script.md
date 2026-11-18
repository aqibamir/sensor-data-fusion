# Chapter 4 — "Landing Blind"
### Screenplay for non-linear sensors and dynamics: polar measurements, sensor models, EKF, UKF

**Sources.** **[L]** Lecture 2 p.30–44, MHT p.10. **[B]** Koch, *Tracking and Sensor Data Fusion* (2014): §2.3 intro (likelihood = sensor model), §2.3.1 (Gaussian likelihoods, range–azimuth, Doppler, TDoA/FDoA), §3.1.2 (Gaussian mixtures, particle filtering), App. A.3 (affine transforms of Gaussians), App. A.5 (product formula). The book handles non-linearity through Taylor linearisation and clever coordinate choices; it does not treat the UKF, so the lecture is the source for that. Every scene tags its source. Book material beyond the lecture is marked **[B+]**: exam-safe background that makes your answers deeper.

*Depth target: at least Chapter 3's. Same format: Prologue, scenes, Epilogue, Practice, Deep dive, Audit.*

---

## WHY THIS STORY
Winter 1948. The Berlin Airlift: cargo planes land in Berlin every few minutes, day and night, in any weather. In thick fog the pilot sees nothing. He is “talked down” over the radio by a controller sitting in a truck beside the runway, watching a **radar**. The system was called **Ground-Controlled Approach (GCA)**, developed during WWII at MIT's Radiation Laboratory (Luis Alvarez's group).
*(Historical claims kept careful: GCA was developed at the MIT Rad Lab during WWII and was used by the Allies, including during the Berlin Airlift of 1948–49. Specific radar accuracies in this chapter are illustrative, not historical.)*

Why it is *the* story for this chapter:
- The radar measures **how far** and **which direction**, never x and y. The truth is curved.
- Far out, the radar's error is a huge curved smear (the banana). Near the runway, the controller needs metre-level precision. **The same sensor is nearly linear close in and badly non-linear far out**, so the chapter's central question happens *during one approach*.
- The aircraft **turns** onto the final approach line: non-linear dynamics too.
- The stakes are visceral. A wrong ellipse here isn't a bad grade; it's a plane in the trees.

## THE WORLD
| Object | Look | Role |
|---|---|---|
| **Fog-bound airfield at night** | Runway lights barely visible, thick volumetric fog, a control truck with a rotating dish | the stage |
| **The aircraft** | A twin-engine cargo plane (C-47 style), landing lights glowing in the fog | the truth (amber trail, hidden from the controller by fog) |
| **The radar dish** | Rotating; a faint beam sweeping the fog | sensor: z = (r, φ) |
| **The controller's scope** | A round green radar screen (PPI) with range rings, on a side panel | what the sensor “sees” |
| **The blip + error banana** | A cloud of 2,000 sample points around the blip, bent along its range ring | the true measurement density |
| **The blue ellipse** | Gaussian approximation over the banana | linearisation / σ-points |
| **The polar panel** | Axes r and φ; the same cloud is an upright, neat ellipse | “the sensor's own world is still Gaussian” |
| **The glide path** | A thin glowing corridor down to the runway threshold | the precision the pilot needs (“the tunnel”) |
| **Radio captions** | The controller's voice as captions: “On course… slightly left… 2 miles…” | the filter's output, spoken |

State x = (x, y, ẋ, ẏ) in the ground plane, radar at the origin, runway along the x-axis. Measurement z = (r, φ).

---

## PROLOGUE — "Fog"
- *On screen:* cockpit view: windshield white with fog. Cut to the truck: a green blip on the round scope. Radio: “*Easy 44, this is GCA. Do not acknowledge further transmissions. Turn left heading 270.*”
- *Narration:* The pilot can't see. The controller can't see either; he only has the radar. And the radar doesn't say *where* the plane is. It says **how far** (echo delay) and **which way** (where the dish was pointing). Chapter 3's five lines assumed the sensor measures something linear like z = Hx. **x = r cos φ is not linear.**
- *Predict:* “The bearing error is ±1°. The plane is 20 km out. How wide is the uncertainty sideways?” → 20,000 m × 0.0175 ≈ **350 m**. The runway is 45 m wide. At 1 km out the same ±1° is ±17 m. *Same sensor, totally different story depending on distance.*
- *Big question:* **The world is curved. The Kalman filter needs straight lines. How do we land this plane?**
- Three answers, in order of the chapter: (1) bend the *measurement* into a straight-line world (conversion); (2) straighten the *functions* at the current guess (EKF, **“Be wise — linearize!”** [L p.32]); (3) bend a few *sample points* instead of the function (UKF [L p.38]).

## SCENE 1 — "What a sensor really is" (the likelihood as a sensor model) [B §2.3, §2.3.1; L p.31]
- [B §2.3] A sensor model **is** a likelihood function p(z_k | x_k): it holds everything about the sensor (accuracy, beam width, detection probability, false alarms). Turned around, it is a recipe for **simulating** the sensor: draw z from p(z | x). That's exactly how the course exercise's sensor simulator works.
- [B §2.3.1] Building a sensor model means answering **two questions**:
  1. **What is measured?** The *measurement function* h_k: x_k ↦ h_k(x_k). For our radar, h(x) = (√(x² + y²), atan2(y, x)).
  2. **How well?** Additive Gaussian, unbiased error with covariance R_k. Errors at different times and from different sensors are independent.
  → together: **z_k = h_k(x_k) + w_k ⇔ p(z_k | x_k) = 𝒩(z_k; h_k(x_k), R_k)** [B eq. 2.15].
- [B §2.3.1] **[B+] Vocabulary:** sensors with the same h are **homogeneous**, otherwise **heterogeneous**. That matters in Ch 5.
- [B §2.3] **[B+]** Likelihoods are only needed **up to a factor independent of x**. Bayes normalises anyway. (We used this silently in Ch 2–3.)
- Check: which of the two questions does R answer? (How well.)

## SCENE 2 — "Where straight lines break" (non-linear models) [L p.33–35; MHT p.10]
- Side by side (L p.34–35): linear **x_k = F x_{k−1} + G v**, **z_k = H x_k + w** vs non-linear **x_k = f(x_{k−1}) + G v**, **z_k = h(x_k) + w**.
- Examples from the story: the **radar** (h non-linear); the **turn onto final** (f non-linear: heading changes, sin/cos appear).
- *Visual:* push a Gaussian through a straight line → still a Gaussian (Ch 1). Push it through a curve → skewed, bent. A slider controls how curved the function is.
- Why Kalman breaks: the product formula (Ch 3) needs 𝒩(z; **Hx**, R). With h(x) the likelihood over x isn't a bell, so the posterior isn't a bell, so we'd be back to Ch 2's expensive curves.
- Exam sentence: **Kalman is optimal only for linear models with additive Gaussian noise (MHT p.10). For non-linear ones we approximate so that every density is Gaussian again. Conversion, EKF and UKF are three different approximations.**
- Check: which is linear in (x, y, ẋ, ẏ)? x + Δt ẋ ✓; √(x² + y²) ✗; atan2(y, x) ✗; 3y ✓.

## SCENE 3 — "The banana" (the polar error) [L p.31; B §2.3.1, Fig. 2.1]
- Sensor model [L p.31; B]: z = (r, φ), **R = diag(σ_r², σ_φ²)**. Range and bearing errors are independent: in the radar's own coordinates the error is an upright ellipse (polar panel).
- Mapped into the ground plane by x = r cos φ, y = r sin φ, the cloud becomes a **banana** curved along the range ring.
- Hands-on: drag the plane closer and further; change σ_φ. Close in: an ellipse. Far out: a banana.
- Two numbers to remember: along the beam the spread is **σ_r** (constant); across the beam it is **r · σ_φ** (grows with distance) [B: “the cross-range semi-axis increases with increasing range, while the other semi-axis remains constant”].
- **The rule of the chapter:** linearisation is good when the function is nearly straight over the size of the error, i.e. when σ_φ (in radians) is small. Every later scene comes back to this.

## SCENE 4 — "Bend the measurement" (1st possibility: converted measurements) [L p.31; B §2.3.1, App. A.3]
- Convert the measurement: **t(r, φ) = r (cos φ, sin φ)ᵀ**, linearised around the measured point s′ by a Taylor series up to first order: **t(z) ≈ t(s′) + T (z − s′)**.
- The Jacobian, derived entry by entry (Derive, 4 moves):
  **T = ∂t/∂(r, φ) = [[cos φ, −r sin φ], [sin φ, r cos φ]]**
- The book's beautiful factorisation [B eq. 2.17]: **T = D_φ · S_r**, a **rotation** by φ times a **dilation** diag(1, r). Picture: take the upright polar ellipse, stretch it sideways by r (radians → metres), then turn it to point along the beam.
- Transform the Gaussian (Ch 1's linear-map rule; [L p.31 bottom], [B App. A.3]): z′ = t + Tz, so **𝒩(z; x, R) → 𝒩(z′; t + Tx, T R Tᵀ)**.
- Result [B eq. 2.18]: **R′ = D_φ · diag(σ_r², r² σ_φ²) · D_φᵀ**. Read it aloud: σ_r along the beam, r·σ_φ across, rotated to the bearing.
- Then the ordinary Kalman filter runs with **H = (I, O)** (it picks the position out of the state) [B eq. 2.19], with R′ recomputed every scan (time-indexed R_k from Ch 3). **R depends on where the object is relative to the sensor**, which is the seed of Ch 5's *geometric fusion gain* [B Fig. 2.1].
- *Visual:* the blue ellipse over the banana. Close: perfect. Far, wide beam: the middle fits, the tips stick out.
- **[B+] Honest limit:** the converted measurement is slightly **biased**: the average of r cos φ isn't r̂ cos φ̂, because the banana bulges towards the radar. The book points to “unbiased converted measurements” (Bar-Shalom) for the fix → Deep dive.
- Controller's view: far out, the controller says only “*about 6 miles, roughly on course*”; close in, “*10 feet left of centreline*”. The ellipse is literally what he can promise.
- Check: plane due north (φ = 90°): long axis of the ellipse? (East–west, across the beam.)

## SCENE 5 — "The Extended Kalman Filter" (2nd possibility: straighten the model) [L p.32–36; B §2.3.1]
- Keep z in polar coordinates; linearise h and f **inside** the filter at the current best guess.
- The EKF, line by line, next to Ch 3's card (changes in orange) [L p.36]:
  - predict: **x_{k|k−1} = f(x_{k−1|k−1})**, **P_{k|k−1} = F P Fᵀ + D**, with **F = ∂f/∂x evaluated at x_{k−1|k−1}**
  - filter: **x_{k|k} = x_{k|k−1} + W (z_k − h(x_{k|k−1}))**, **P_{k|k} = P_{k|k−1} − W S Wᵀ**, with **H = ∂h/∂x evaluated at x_{k|k−1}**, **S = H P Hᵀ + R**, **W = P Hᵀ S⁻¹**
- The rule: **the mean goes through the real curve; the covariance goes through its tangent (Jacobian).**
- The radar Jacobian (Derive, 5 moves): **H = [[x/r, y/r, 0, 0], [−y/r², x/r², 0, 0]]**. Row 1 = unit vector along the beam. Row 2 = across-beam direction ÷ r (bearing changes faster when you're close). Zeros: this radar measures no velocity.
- **The turn onto final**: f = coordinated turn; F changes every step and depends on the estimate. Shown, not derived (the lecture doesn't derive it).
- *Visual:* the tangent plane touching the curved surface h(x) at the estimate; move the estimate and the tangent rolls with it.
- **Why the linearisation point matters:** bad initial position → tangent at the wrong place → wrong gain → divergence. Demo: two EKFs, one honest P₀, one overconfident; the second loses the plane in the turn. Controller: “*Easy 44, radar contact lost.*”
- **[B+] Book's smarter alternative for curved sensors** [B §2.3.1, Doppler]: rotate the coordinate system so one axis points along the beam. Then a radial measurement (range-rate from Doppler) becomes a measurement of **one Cartesian component**, so it is linear in that frame. The book reports that with real data this is **significantly more robust than Taylor expansion**. Lesson: *sometimes the best linearisation is a better choice of coordinates.*
- **Slide-typo note:** L p.36 writes h(x_{k−1|k}); the correct index is **h(x_{k|k−1})**.
- Check: why does the innovation use h itself but S and W use H?

## SCENE 6 — "Bend the cloud, not the function" (UKF idea) [L p.38–39, 42]
- Motto [L p.38]: **“It is easier to approximate a probability distribution than an arbitrary non-linear function.”**
- Three steps: (1) choose σ-points with the density's mean and covariance; (2) push each through the function; (3) recompute mean and covariance.
- *Visual:* five beads on the blue ellipse, sent through the polar → Cartesian map, landing on the banana. A new ellipse is fitted to them, **shifted slightly towards the radar** compared with Scene 4's. That shift is exactly the bias from Scene 4's honest limit, which the UKF catches automatically.
- No derivatives needed: f and h only have to be *evaluated*. Useful when they come from a simulation or a table.

## SCENE 7 — "Choosing the σ-points" [L p.40–41]
- n-dim state → **2n + 1 points**: x₀ = x̂ with weight W⁰ (**−1 < W⁰ < 1**); **x_i = x̂ ± (√(n/(1−W⁰) · P))_i** for i = 1…n; **W^j = (1 − W⁰)/(2n)**.
- (√M)_i = i-th column of A with A Aᵀ = M (Cholesky). For a diagonal P it is just the σ's.
- Proof in 1D (Derive, 3 moves): weighted mean = x̂; weighted variance = 2·(1−W⁰)/2 · P/(1−W⁰) = P ✓. Weights sum to 1 ✓.
- W⁰ slider: bigger W⁰ pushes the outer points further out.
- Count: 4D → 9 points; 6D → 13. Tiny compared with Ch 2's grid.
- **Slide-notation note:** L p.40 labels the weight W^j but says “for all i”.

## SCENE 8 — "The Unscented Kalman Filter" [L p.43–44]
- **Predict** [L p.43]: x_i^f = f(x_i); **x^f = Σ Wⁱ x_i^f**; **P^f = Σ Wⁱ (x_i^f − x^f)(·)ᵀ + D**.
- **Filter** [L p.44]: z_i^h = h(x_i); **z^h = Σ Wⁱ z_i^h**; **Cov(z) = Σ Wⁱ (z_i^h − z^h)(·)ᵀ + R**; **Cov(x, z) = Σ Wⁱ (x_i − x^f)(z_i^h − z^h)ᵀ**; **W = Cov(x, z) Cov(z)⁻¹**; **x = x^f + W(z − z^h)**; **P = P^f − W Cov(z) Wᵀ**.
- The mapping to Ch 3: Cov(z) **is S**; Cov(x, z) **is P Hᵀ** (equal exactly when h is linear, a one-line proof). The UKF is Kalman with its matrices *measured from points*.
- **Slide-wording note:** L p.44 says “σ-points of the measurement density z_i”. They are points of the **predicted state** density, mapped by h.

## SCENE 9 — "The approach" (all three, one landing)
- The full approach: the plane appears 30 km out, turns onto final, descends to the threshold. Toggle **converted KF / EKF / UKF**, each with its own ellipse, plus 2,000 true samples.
- What you see:
  - far out: the converted-measurement ellipse is too far out and too confident sideways; the UKF fits better
  - during the turn with a bad start: the EKF can diverge; the UKF is more forgiving
  - the last 2 km: all three agree, because the curve is straight at this scale
- The glide-path tunnel: the ellipse must fit inside it before the controller clears the landing. Readout: “*fits / doesn't fit*”.
- Comparison table:
  | | Converted KF | EKF | UKF |
  |---|---|---|---|
  | Approximates | the measurement conversion | f and h (1st-order Taylor) | the density (σ-points) |
  | Derivatives | T once per scan | Jacobians F, H every step | none |
  | Cost | 1 KF step | 1 KF step + Jacobians | 2n + 1 function evaluations |
  | Weak spot | large r·σ_φ, bias | strong curvature, bad linearisation point | choice of W⁰; still one Gaussian |
- Radio: “*Easy 44, over threshold, take over visually.*” Lights appear through the fog.

## SCENE 10 — "When one bell isn't enough" (beyond Gaussian) [B §3.1.2, §2.3.1 TDoA/FDoA]
- EKF and UKF both end in **one Gaussian**. Some sensors produce likelihoods no single bell can describe.
- **[B+] The book's example, TDoA** [B eq. 2.21–2.22]: two receivers hear a radio emitter; the *time difference* of arrival fixes **|r − p₁| − |r − p₂|**: a **hyperbola**, not a point. **FDoA** (frequency difference, from Doppler) gives another curve [B eq. 2.23]. The book notes the two are complementary: TDoA acts roughly like a bearing, FDoA roughly like a distance. Visual: the hyperbola-shaped likelihood ridge.
- **[B+] Two ways out** [B §3.1.2]:
  - **Gaussian mixtures**: a weighted sum Σ pᵢ 𝒩(x; xᵢ, Pᵢ), each piece linearised locally. The book's preferred tool, used again in Ch 7–9 (PDAF, MHT, IMM are all mixtures).
  - **Particle filters**: represent the density by random samples; “numerically exact” but expensive. Used as a benchmark, or when the likelihood can only be computed point by point (e.g. multipath in cities via ray tracing).
- One sentence: the UKF's σ-points are *deterministic* chosen samples; particles are *random* ones. Same instinct, different scale.

## EPILOGUE — "Wheels down"
- One card: the sensor model as two questions; T = rotation × dilation, R′ = D diag(σ_r², r²σ_φ²) Dᵀ; the EKF rule (mean through the curve, covariance through the tangent); the UKF (2n + 1 points, three steps); beyond: mixtures and particles.
- Where next: Ch 5. One radar gives one long ellipse. What if **two observers look from different directions**?

## PRACTICE (computation-heavy)
1. Polar → Cartesian: r = 20 km, φ = 30°.
2. T and R′ at (10 km, 90°) with σ_r = 50 m, σ_φ = 1°. Which entry dominates?
3. At what range does r·σ_φ exceed the runway half-width (22 m) for σ_φ = 0.1°?
4. Radar Jacobian at (3, 4) km; check row 1 = (0.6, 0.8).
5. Sensor model: write h and R for a sensor measuring only range. Homogeneous with our radar or not?
6. Linear or not? Classify four functions.
7. One EKF update (position-only, numbers given): h(x̂), H, S, W, x, P.
8. σ-points by hand: n = 1, x̂ = 2, P = 4, W⁰ = 1/3; check mean and variance.
9. Push them through h(x) = x²: UKF mean vs EKF mean vs exact (8). (Surprise: the UKF is exact here.)
10. Place the five 2D σ-points (PlaceExercise).
11. Spot the EKF index typo.
12. TDoA: two receivers 10 km apart, the emitter is 2 km closer to receiver 1. Sketch the curve of possible positions (MC: line / circle / hyperbola).
13. Match the method to its property (converted / EKF / UKF / particle / mixture).
+ 7 explain-back questions (sensor model as two questions; why non-linearity breaks Kalman; the polar covariance and its shape; EKF rule and linearisation point; UKF in three steps; when all methods agree; why one Gaussian can't hold a TDoA likelihood).

## DEEP DIVE (planned)
Unbiased converted measurements · why the UKF gets the mean right to second order · scaled σ-points (α, β, κ) vs the lecture's W⁰ · iterated EKF · the book's rotated-frame Doppler trick worked out · the coordinated-turn model · Gaussian-mixture likelihoods for TDoA/FDoA · a minimal particle filter on the banana.

---

## Audit
| Item | Source | Where |
|---|---|---|
| Range/azimuth example, R = diag(σ_r², σ_φ²) | L p.30–31; B §2.3.1 | Scene 3 |
| t(z), Taylor around s′, Jacobian T | L p.31; B eq. 2.16–2.17 | Scene 4 |
| T = rotation × dilation | L p.31; B eq. 2.17 | Scene 4 |
| T R Tᵀ, 𝒩(z′; t + Tx, T R Tᵀ) | L p.31; B eq. 2.18, App. A.3 | Scene 4 |
| H = (I, O), likelihood 𝒩(z; Hx, R) | B eq. 2.19; L p.31 | Scene 4 |
| R depends on sensor–object geometry (Fig. 2.1) | B §2.3.1 | Scene 4 (→ Ch 5) |
| Unbiased converted measurements | B §2.3.1 ref. | Scene 4 note, Deep dive |
| Likelihood = sensor model; simulation; known up to a factor | B §2.3, eq. 2.13 | Scene 1 |
| Two questions: measurement function and error quality; z = h(x) + w ⇔ 𝒩(z; h(x), R) | B §2.3.1, eq. 2.14–2.15 | Scene 1 |
| Homogeneous vs heterogeneous sensors | B §2.3.1 | Scene 1 |
| Non-linear motivation, “Be wise linearize!” | L p.32–35 | Prologue, Scene 2 |
| Kalman optimal only if linear-Gaussian; basis for EKF/UKF | MHT p.10 | Scene 2 |
| EKF formulas, F and H Jacobians and where evaluated | L p.36 | Scene 5 |
| EKF index typo | L p.36 | Scene 5, Practice 11 |
| Doppler range-rate h; rotated-frame alternative, more robust than Taylor | B §2.3.1, eq. 2.20, Fig. 2.2 | Scene 5 [B+] |
| UKF motivation and three steps | L p.38–39, 42 | Scene 6 |
| σ-point recipe and weights | L p.40–41 | Scene 7 |
| UKF prediction and filtering formulas | L p.43–44 | Scene 8 |
| TDoA/FDoA likelihoods, complementary roles | B §2.3.1, eq. 2.21–2.23, Fig. 2.3–2.4 | Scene 10 [B+] |
| Gaussian mixtures, particle filtering | B §3.1.2 | Scene 10 [B+] |

| Beginner trap | Fix |
|---|---|
| “Jacobian” is scary | entry by entry; tangent plane; rotation × dilation |
| Where to linearise | Scene 5 rule + divergence demo |
| √ of a matrix | “A with A Aᵀ = P”; diagonal first |
| UKF looks like a new filter | Scene 8 maps it onto S and P Hᵀ |
| Thinking EKF/UKF fix everything | Scene 10: one bell can't hold a hyperbola |
| Degrees vs radians | Practice 2–3 |

**Verdict:** every statement on L p.30–44 and MHT p.10 is mapped. Book §2.3–2.3.1 and §3.1.2 are fully used: the sensor-model concept, both questions, geometry dependence, Doppler, TDoA/FDoA, mixtures and particles. The book has no UKF and no general EKF section, so the lecture leads there. There are 6 derivations: the polar Jacobian, R′, the radar H, σ-point moments, UKF = KF for linear h, and the linear-map rule. The three slide issues are flagged.

Kept for later chapters: ambiguous data, false alarms and detection probability in the likelihood (B §2.3.3 → Ch 7); multiple-sensor likelihood (B §2.3.2 → Ch 5); IMM model (B §2.2.2 → Ch 9).
