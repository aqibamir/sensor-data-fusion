# Chapter 5 — "Two Radars Are Better Than One"
### Screenplay for the fusion formula (Lecture 2 p.45–48; MHT p.11–14; Lecture 1 “Fusion: an example of space-time data processing”)

*Same format as Chapters 1–4. Depth target: at least Chapter 3's. The fusion formula is derived from the product formula, it is shown to equal stacking and sequential updates, the n-sensor version is proved, and two radars are fused by hand. Then Practice and a Deep-dive slot.*

**Why two radars at an airport?** It continues Chapter 4 directly. One radar gives a long, thin banana: sharp in range, blurry sideways. Put a second radar a few kilometres away looking from another angle, and its banana is sharp in a *different* direction. Cross them, and the two blurry directions cancel. You get a small, round spot that **neither sensor could produce alone**. That picture is the whole reason the field is called *sensor data fusion*. And it is literally what the lecture means by “spatially distributed or complementary sensors” (L1, L2 p.46).

---

## THE WORLD
| Object | Look | Role |
|---|---|---|
| **The airport** | Same scene as Ch 4 | continuity |
| **Radar A** | Ch 4's radar, west of the runway | sensor 1: z₁, R₁ |
| **Radar B** | A second radar on a hill to the north-east | sensor 2: z₂, R₂ |
| **The airliner** | Same jet | the truth |
| **Two ellipses** | Orange (A) and teal (B), each long and thin, pointing along its own beam | the two likelihoods |
| **The fused ellipse** | Blue, small, where the two cross | the fusion result |
| **The weight bar** | A see-saw between z₁ and z₂ showing where the fused point sits | “who gets trusted more” |
| **The information meter** | Stacked bars for R₁⁻¹, R₂⁻¹ and their sum | information adds |

To keep the formula clean, both radars report a **position** (each already converted to Cartesian as in Ch 4 Scene 3), so H₁ = H₂ = H = [I 0]. Converted covariances R₁, R₂ are full 2×2 matrices that point in different directions.

---

## PROLOGUE — "Each measurement is a cloud"
- *On screen:* radar A's blip and its long orange ellipse. A single radar can't tell *where along the ellipse's long axis* the plane is.
- *Narration:* the lecture's reminder (L2 p.46): **“Each measurement is modeled as a probability density function.”** Not a point. A cloud. So the question “how do I combine two measurements?” really means “how do I combine two clouds?”
- *Predict:* “Radar A says 100 m ± 10 m; radar B says 110 m ± 5 m. Where's the plane?” Most people say 105. The honest answer is **108**, because B is twice as precise and so counts four times as much. The chapter explains why.
- *Big question:* **What is the best single measurement you can build from two?**

## SCENE 1 — "Where fusion sits" (the big picture)
- Lecture 1's diagram: **tracking = processing along time** (prediction, measurement, filtering: Ch 2–4); **fusion = processing across space**, combining data from spatially distributed or complementary sensors.
- Two meanings, with one example each:
  - *spatially distributed*: same kind of sensor, different places (our two radars) → errors point different ways
  - *complementary*: different kinds of sensors measuring different things (a radar measuring range, a camera measuring only a bearing) → each fills the other's gap
- Lecture 1 also lists **fusion with already pre-processed tracking information** (combining finished tracks). Name it only; it isn't derived in the lecture. → Deep dive, labelled “beyond the lecture”.
- The one assumption the whole chapter rests on: **the sensors' errors are independent.** Without it, the formulas below are wrong. This is said here, used in Scene 2, and stress-tested in Scene 7.

## SCENE 2 — "Multiply the clouds" (the fusion formula, derived)
- Independence lets the joint likelihood split (L2 p.47):
  **p(z₁, z₂ | x) = p(z₁ | x) · p(z₂ | x) = 𝒩(z₁; Hx, R₁) · 𝒩(z₂; Hx, R₂)**
- Step 1 (symmetry of the bell): 𝒩(z₁; Hx, R₁) = **𝒩(Hx; z₁, R₁)**. A Gaussian only depends on the *difference* z − Hx, so you may swap “where the bell is” and “where you evaluate it”. Now it reads as “a bell over Hx centred on the measurement”.
- Step 2 (product formula, Ch 3 Scene 2, with Hx playing the variable):
  **𝒩(Hx; z₁, R₁) · 𝒩(z₂; Hx, R₂) ∝ 𝒩(Hx; z, R)** with
  **R = (R₁⁻¹ + R₂⁻¹)⁻¹** and **z = R (R₁⁻¹ z₁ + R₂⁻¹ z₂)**.
- Derive it in 1D (Derive, 4 moves): complete the square in Hx → precisions add: 1/σ² = 1/σ₁² + 1/σ₂² → the mean is the precision-weighted average. Then lift to matrices by direct analogy with Ch 3's Q⁻¹ = P⁻¹ + HᵀR⁻¹H.
- **Read the result aloud.** The two measurements behave exactly like **one** measurement z with covariance R. So any filter from Ch 3–4 can take the *fused* measurement as if it came from a single super-sensor.
- **The “∝” hides something useful.** The dropped factor is **𝒩(z₁; z₂, R₁ + R₂)**. It doesn't depend on x, and it scores how well the two reports *agree*. If it is tiny, the radars probably didn't see the same plane. That is Ch 6 (gating) and Ch 8 (association). One sentence plus a forward link.
- Check: why may we multiply p(z₁|x) and p(z₂|x)? (Independent sensor errors.)

## SCENE 3 — "Precision adds" (meaning of R)
- The lecture's names (L2 p.48): **R = (Σ R_i⁻¹)⁻¹** is the **harmonic mean** form. Inverse covariances (“precisions”, “information”) **add**.
- 1D numbers on the information meter: σ₁ = 10 → precision 0.01; σ₂ = 5 → 0.04; sum 0.05 → σ² = 20 → σ ≈ 4.47 m. **The fused result is better than the better sensor**, always, never worse.
- Two equal sensors: R = R₁/2 → σ shrinks by √2. Four equal sensors: σ halves. *Diminishing returns* (the √n law): show the curve.
- 2D, the hero moment: orange and teal ellipses, both long and thin, crossing at 90° → the fused ellipse is a small circle. Rotate radar B around the airport with a slider:
  - B at 90° to A: best geometry, round small ellipse
  - B right next to A (same viewing direction): the ellipses are parallel, and fusion barely helps sideways
  - *Lesson:* **geometry matters as much as accuracy.** That is why air-traffic radars, GPS satellites and the course exercise's two radars are spread out.
- Check (Ch 3 Scene 2 link): which form of the product formula is this? (The information form, Q⁻¹ = P⁻¹ + HᵀR⁻¹H.)

## SCENE 4 — "Trust is a weight" (meaning of z)
- **z = R Σ R_i⁻¹ z_i**: the lecture calls this the **arithmetic mean** form (L2 p.48). Precisely, it is a *weighted* arithmetic mean whose weights are **R·R_i⁻¹** (they add up to I).
- 1D by hand: z = 20 · (100/100 + 110/25) = 20 · (1 + 4.4) = **108** ✓ (the Prologue's answer). Weights 0.2 and 0.8.
- The see-saw: move σ₂ and watch the fused point slide towards the more precise sensor. σ₂ → 0: fused = z₂. σ₂ → ∞: fused = z₁ (a useless sensor is ignored, never harmful).
- 2D: weights are matrices, so a sensor can be trusted in one *direction* and ignored in another. Visual: the fused point takes its x from radar A (sharp in x) and its y from radar B (sharp in y). This is impossible with scalar weights, and it is the core of fusion.
- Exam phrasing: “The fused measurement is the precision-weighted mean; the fused covariance is the inverse of the summed precisions.”

## SCENE 5 — "Three roads, one destination" (stacking, sequential, fused)
- The lecture's **other option** (L2 p.47): don't fuse first; **stack** the sensors into one big measurement:
  **z = (z₁; …; z_n), H = (H₁; …; H_n), R = diag(R₁, …, R_n)**. The block-diagonal R *is* the independence assumption: zeros off the diagonal = no correlation between sensors.
- Stacking works even when the H_i differ (complementary sensors: e.g. one measures position, another only one coordinate). The fused-measurement formula needs **H_i = H for all sensors** (L2 p.47–48). That is the difference between the two options.
- A third road: run **two Kalman updates in a row**, one per sensor, with no prediction in between.
- *Demonstration:* the three results side by side, numerically identical (the engine computes all three):
  1. stacked update with H = (H; H), R = diag(R₁, R₂)
  2. sequential: update with z₁, then with z₂
  3. fused z, R → one update
- Why they agree (one line each): the posterior is prior × p(z₁|x) × p(z₂|x) in all three; only the order of multiplying changes, and multiplication doesn't care about order. In information form: P⁻¹ + HᵀR₁⁻¹H + HᵀR₂⁻¹H every time.
- *Practical use:* sequential is cheapest when reports arrive at different times; stacking is natural for one sensor with several channels; the fused form is best for explaining and for compressing many reports into one.
- **Slide-notation note:** L2 p.47 says “H_i = H_k for **all** i, k”, while MHT p.13 writes “for **i ≠ k**”. Same meaning (every sensor has the same H); the script says “all sensors share one H”.

## SCENE 6 — "More than two" (the n-sensor formula)
- The lecture's general case (L2 p.48, MHT p.14): **R = (Σ_{i=1}^n R_i⁻¹)⁻¹**, **z = R Σ_{i=1}^n R_i⁻¹ z_i**.
- Proof by induction (Derive, 3 moves): fuse 1 and 2 into (z₁₂, R₁₂); fuse that with 3; the precisions keep adding and the weighted sums keep adding. The order doesn't matter (Scene 5's argument).
- Sandbox: drop up to 5 radars around the airport, each with its own accuracy; the fused ellipse updates live. The learner discovers that one poor radar in a new direction can help more than another excellent one in a direction that's already covered.

## SCENE 7 — "When fusion lies" (the independence assumption, stress-tested)
- The formula *assumes* independent errors. Two ways that can fail, shown honestly:
  - **Same report counted twice** (e.g. the same radar data arriving via two networks): the formula thinks it has two sensors, so the covariance halves, but nothing new was learnt. The fused ellipse is *too small*: overconfident.
  - **Common error** (both radars share a clock or a map offset): errors move together; fusion can't average them away.
- *Visual:* toggle “duplicate radar A”. The blue ellipse shrinks, but the cloud of true positions does not. The ellipse no longer contains the truth 95% of the time; a counter shows the coverage dropping.
- Lesson for the exam: **independent errors is an assumption you must justify.** If it fails, fusion is overconfident, and an overconfident filter rejects good measurements later (Ch 6's gate gets too tight).
- How to fix correlated cases is beyond the lecture → Deep dive (labelled).

## SCENE 8 — "Fusion inside the tracker" (putting Ch 3–5 together)
- The full loop on the airport: predict (Ch 3) → both radars report → fuse (Ch 5) → filter (Ch 3; EKF/UKF from Ch 4 if fusing in polar) → repeat.
- Toggle: track with radar A only / B only / both. Readout: the size of the steady-state ellipse. Fusion wins on every step; with the radars at 90° it wins most.
- Irregular timing: A sweeps every 4 s, B every 5 s. Reports don't arrive together, so the tracker does sequential updates with a prediction between them (Ch 3's Δt_k). That is the real-world version of Scene 5's “third road”.
- **Link to the course exercise:** the exercise's car on the mountain pass is watched by **two radars** (MHT p.3–4). It is exactly this scene. The Practice page points to it as a project (no solution code; your own program is the course prerequisite).

## EPILOGUE — "Same physics, more eyes"
- One card: p(z₁, z₂|x) = Π p(z_i|x) (independence) → R = (Σ R_i⁻¹)⁻¹, z = R Σ R_i⁻¹ z_i; or stack H, R = diag(R_i); all equal to sequential updates.
- Where next: Ch 6. Before fusing anything you must ask **“is that blip even our plane?”**: the factor 𝒩(z₁; z₂, R₁ + R₂) from Scene 2 becomes the gate.

## PRACTICE (computation-heavy)
1. 1D fusion: z₁ = 100, σ₁ = 10; z₂ = 110, σ₂ = 5 → z and σ.
2. Three equal sensors, σ = 6 each → fused σ (√n law).
3. Fusion never hurts: show σ_fused < min(σ₁, σ₂) for σ₁ = 3, σ₂ = 30.
4. 2D: R₁ = diag(1, 25), R₂ = diag(25, 1), z₁ = (0, 0), z₂ = (5, 5) → R and z. Which coordinate comes from which sensor?
5. Place the fused point on the plot (PlaceExercise) for two given ellipses.
6. Build the stacked H and R for two position sensors (n = 4 state, H = [I 0]). Give the sizes.
7. Sequential vs fused: do two 1D Kalman updates (prior 𝒩(90, 100)) with z₁, then z₂ from Ex. 1; compare with one update using the fused measurement.
8. Geometry: two identical radars at 90° vs at 10° apart. Which fused ellipse is smaller and why? (multiple choice + numbers)
9. Duplicate data: what does the formula report if radar A's report is counted twice? Is that honest?
10. Complementary sensors: one measures x only (H₁ = (1, 0)), one y only (H₂ = (0, 1)). Can you use the fused-measurement formula? (No, the H differ; you stack.)
+ 6 explain-back questions (what “fusion” means and the two kinds; the derivation from the product formula; why precisions add; the weighted mean and matrix weights; stacking vs fused vs sequential; the independence assumption and what breaks).

## DEEP DIVE (planned)
Matrix proof of the fusion formula via the information form · why stacking with block-diagonal R gives exactly (Σ HᵀR_i⁻¹H) · track-to-track fusion and the cross-covariance problem (“beyond the lecture”) · covariance intersection for unknown correlations (“beyond the lecture”) · dilution of precision (geometry) and its GPS analogue.

---

## Audit
| Lecture item | Where |
|---|---|
| Fusion of data from spatially distributed or complementary sensors (L1, L2 p.46, MHT p.12) | Scene 1 |
| Tracking along time vs fusion across space diagram (L1 “FUSION: an example of space-time data processing”) | Scene 1 |
| Fusion with pre-processed tracking information (L1 list) | Scene 1 (named), Deep dive |
| “Each measurement is modeled as a probability density function” (L2 p.46) | Prologue |
| Independence → p(z₁, z₂|x) = p(z₁|x) p(z₂|x) (L2 p.47) | Scenes 1–2 |
| 𝒩(z₁; Hx, R₁) = 𝒩(Hx; z₁, R₁) swap (L2 p.47) | Scene 2 |
| ∝ 𝒩(Hx; R(R₁⁻¹z₁ + R₂⁻¹z₂), (R₁⁻¹ + R₂⁻¹)⁻¹) (L2 p.47–48) | Scene 2 |
| Option 1: stack H_i, R = diag(R₁…R_n) (L2 p.47, MHT p.13) | Scene 5 |
| Option 2: same H for all sensors (L2 p.47–48) | Scenes 2, 5 |
| n sensors: harmonic mean R, arithmetic mean z (L2 p.48, MHT p.14) | Scenes 3, 4, 6 |
| “for all i, k” vs “i ≠ k” wording (L2 p.47, MHT p.13) | Scene 5 note |
| Ch 3's “several sensors at once: stack” (L2 p.25 context) | Scene 5 |
| Exercise sheet: two radars (MHT p.3–4) | Scene 8, Practice |

| Beginner trap | Fix |
|---|---|
| “Just average them” | Prologue prediction (105 vs 108) + see-saw |
| Thinking more sensors can make it worse | Scene 3: precisions only add (if independent) |
| Missing why the direction of the ellipse matters | Scene 3 rotation slider + Scene 4 matrix weights |
| Believing stacking, sequential and fused are different methods | Scene 5: numerically identical, one-line reason |
| Forgetting the independence assumption | Stated in Scene 1, used in 2, broken in 7 |
| Inverting covariances feels abstract | “precision = information”, the information meter |

**Verdict:** every statement on L2 p.45–48, MHT p.11–14 and the fusion lines of Lecture 1 is mapped to a scene. Depth is at Chapter 3's level, with 4 derivations: the fusion formula from the product formula, the 1D precision sum, the equivalence of stacking, sequential and fused updates, and the n-sensor induction. The one slide wording difference is flagged. The lecture section is short, so the chapter adds depth through *meaning* (geometry, matrix weights, the independence failure) rather than extra formulas. Anything not in the lecture is labelled.

Out of scope on purpose: gating with 𝒩(z₁; z₂, R₁ + R₂) (Ch 6); association of reports to tracks (Ch 7–8); track-to-track fusion and correlated errors (Deep dive, beyond the lecture).
