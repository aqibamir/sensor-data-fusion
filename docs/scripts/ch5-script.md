# Chapter 5 — "Smoke on the Ridge"
### Screenplay for sensor data fusion: the fusion formula, geometric fusion gain, architectures, track-to-track fusion

**Sources.** **[L]** Lecture 2 p.45–48; MHT p.11–14; Lecture 1 (“Fusion: an example of space-time data processing”, the generic fusion system list). **[B]** Koch (2014): §2.3.1 Fig. 2.1 (geometry), **§2.3.2 Multiple Sensor Likelihood** (fusion equation, geometric fusion gain, triangulation and trilateration, ghosts, cumulative detection), **§3.1.1** (fusion architectures), **§3.1.3** (track-to-track fusion pros and cons), **Ch 6** (Frenkel tracklets, tracklet fusion, Gaussian product densities, distributed Kalman filtering), App. A.5 (product formula). **[B+]** marks book material beyond the lecture.

*Depth target: above Chapter 3's. The lecture section is short; the book gives this chapter its depth.*

---

## WHY THIS STORY
For a century, forests have been watched from **fire lookout towers** on mountain tops. A lookout who sees smoke can't tell how *far* away it is; only the **direction**. So they read the bearing off a sighting instrument over a map (the **Osborne Firefinder**, US Forest Service, early 20th century) and phone it to the dispatcher. The dispatcher draws **a line from each tower**, and where the lines cross is the fire.
*(Historical claims kept careful: the Osborne Firefinder was invented by W. B. Osborne of the US Forest Service in the 1910s and is still used in some lookouts; crossing bearings from two or more towers is the classic way to locate a fire.)*

Why it is *the* story for fusion:
- One tower knows **almost nothing** (a line). Two towers know **almost everything** (a point). Fusion makes something out of nothing; you can see it.
- Where the towers stand decides everything: the book's **geometric fusion gain**.
- Two fires → four crossings → **ghost fires** [B Fig. 2.5]. Fusion's dark side, and the bridge to Ch 7–8.
- Haze hides smoke from one tower but not the other → **cumulative detection** [B eq. 2.30].
- Phone lines are limited → towers send summaries, not every sighting → **track-to-track fusion** [B Ch 6].
- Stakes: smokejumpers are dropped where the dispatcher's ellipse says. Too small an ellipse (overconfidence) and they land in the wrong valley.

## THE WORLD
| Object | Look | Role |
|---|---|---|
| **Forested mountain range** | Late summer afternoon, golden light, ridges fading into haze (HDRI sky, terrain) | the stage |
| **Tower A** “Eagle Peak” | Wooden lookout cabin on stilts, glass all round | sensor 1 |
| **Tower B** “Bald Ridge” | Second tower on another peak | sensor 2 |
| **Tower C** (later) | A third, optional | n sensors |
| **Smoke column** | Volumetric smoke rising from the trees, drifting with the wind | the truth (a fire that slowly moves: x = (x, y, ẋ, ẏ)) |
| **Bearing wedges** | A thin glowing wedge from each tower towards the smoke, orange (A), teal (B) | each tower's likelihood |
| **Dispatcher's map** | Side panel: a paper map table with pins, string lines and the fused ellipse | the fusion centre |
| **Fused ellipse** | Blue, where the wedges cross | the fusion result |
| **Information meter** | Stacked bars for R₁⁻¹, R₂⁻¹ and their sum (per direction) | “information adds” |
| **Spotter plane** | Small plane that flies over occasionally and radios a rough position | a *heterogeneous* sensor |

---

## PROLOGUE — "A line is not a place"
- *On screen:* Tower A. The lookout sees a thin wisp of smoke, sights it: “*Smoke, bearing 047.*” A glowing line stretches from the tower across ten kilometres of forest. *Where* along it? No idea.
- *Narration:* Each measurement is a **cloud**, a probability density [L p.46]. This one is a cloud that is extremely thin sideways and *endless* along the line. A single tower can't place the fire.
- Tower B calls in: “*Smoke, bearing 312.*” A second line. They cross. **A place.**
- *Predict:* “Two towers report the same fire. Tower A is good to ±10 m on a test target, tower B to ±5 m. A says 100, B says 110. Where's the fire?” Most say 105. The honest answer is **108**. Why is the chapter.
- *Big question:* **How do you combine clouds from several sensors into one, and when does that go wrong?**

## SCENE 1 — "Time and space" (what fusion is) [L1; B §1.3.3, §3.1.1]
- Lecture 1's picture: **tracking = processing along time** (prediction → measurement → filtering, Ch 2–4); **fusion = processing across space**, combining data from *spatially distributed* or *complementary* sensors [L1, L p.46, MHT p.12].
  - spatially distributed: same kind of sensor, different places (towers A, B) → *homogeneous* sensors [B §2.3.1]
  - complementary: different kinds (tower + spotter plane) → *heterogeneous*
- Lecture 1's generic fusion system lists **“fusion with already pre-processed tracking information”**: combining finished tracks. That is Scene 8.
- The single assumption everything rests on: **sensor errors are independent** [L p.47; B §2.3.1, §2.3.2]. Said here, used in Scene 2, broken in Scene 9.

## SCENE 2 — "Multiply the clouds" (the fusion equation, derived) [L p.47–48; MHT p.13–14; B §2.3.2, App. A.5]
- Independence → the joint likelihood factorises [L p.47; B eq. 2.25]:
  **p(z₁, z₂ | x) = p(z₁|x) p(z₂|x) = 𝒩(z₁; Hx, R₁) 𝒩(z₂; Hx, R₂)**
- Move 1, symmetry: 𝒩(z₁; Hx, R₁) = **𝒩(Hx; z₁, R₁)**. A Gaussian depends only on the difference.
- Move 2, the product formula (Ch 3 Scene 2) with Hx as the variable →
  **∝ 𝒩(Hx; z, R)**, **R = (R₁⁻¹ + R₂⁻¹)⁻¹**, **z = R(R₁⁻¹z₁ + R₂⁻¹z₂)**
- 1D proof by completing the square (Derive, 4 moves); matrix version = Ch 3's information form.
- **Meaning:** all sensors together behave like **one effective measurement** z with **effective covariance** R [B eq. 2.26]. Any Ch 3–4 filter can take it as if from a single super-sensor.
- **What the “∝” hides:** the dropped factor **𝒩(z₁; z₂, R₁ + R₂)** is independent of x and scores whether the two reports *agree*. A tiny value means the towers probably saw different smokes → Ch 6 gating, Ch 8 association.
- **n sensors, by induction** [B §2.3.2: “an induction argument directly yields…”; L p.48]: **R = (Σ R_s⁻¹)⁻¹**, **z = R Σ R_s⁻¹ z_s** [B eq. 2.27–2.28]. Fuse 1 and 2, then fuse that with 3; precisions keep adding.
- Names: R is the **harmonic mean** of the covariances, z the **(matrix-)weighted arithmetic mean** [L p.48; B §2.3.2]. The book calls R = (Σ R_s⁻¹)⁻¹ **the Fusion Equation**.

## SCENE 3 — "Trust is a weight" (the weighted mean)
- 1D by hand: z = 20·(100/100 + 110/25) = **108** ✓. Weights 0.2 and 0.8. σ = √20 ≈ 4.47 m: **better than the best tower**.
- [B §2.3.2] “Poor” measurements contribute less than “good” ones. The see-saw: σ_B → 0 → trust B fully; σ_B → ∞ → B is ignored (never harmful).
- In 2D the weights are **matrices**: a tower can be trusted *across* its line and ignored *along* it. The fused point takes its east–west position from one tower and its north–south from the other. Scalar weights could never do this; this is the essence of fusion.

## SCENE 4 — "Where you stand matters" (geometric fusion gain) [B §2.3.2 conclusions 1–4, Fig. 2.1]
The book's four conclusions, each a hands-on moment:
1. **Same R for every sensor:** z = simple average, **R/S**: the **square-root law** (σ shrinks by √S). Two equal towers in the *same* spot: only a √2 improvement. Diminishing-returns curve.
2. **Differently oriented ellipses → a much bigger gain: the geometric fusion gain.** Slider: move tower B around the forest. At 90° crossing: a small round spot. Nearly in line with A: two parallel wedges; along the line almost nothing is gained. Readout: fused area vs best single area.
3. **The fused ellipse is the “intersection” of the individual ellipses**, computed by the harmonic mean, the Fusion Equation.
4. **Limiting cases:** very thin wedges (σ_r ≫ r σ_φ, i.e. bearings only) → **triangulation**; range-only sensors (rings) → **trilateration**. Our towers are the triangulation case; show trilateration with three “distance-only” sensors as a side toggle.
- **Information picture** (why a line can be fused at all): a bearing gives **zero information along its line**. R⁻¹ has a zero there, while R itself is infinite. Precisions (R⁻¹) can be added even when one is zero; covariances can't. That is why the formula is written with inverses. The information meter shows per-direction bars: A fills east–west, B fills north–south, together a full bar.
- The book says it holds in 3D too, and for bistatic range and range-rate sensors.
- Check: three towers on a straight line, fire far away on their axis. Good geometry? (No: all wedges nearly parallel.)

## SCENE 5 — "Three roads, one place" (stacking, sequential, fused) [L p.47; MHT p.13; Ch 3]
- **Stacking** [L p.47]: z = (z₁; …; z_n), **H = (H₁; …; H_n)**, **R = diag(R₁, …, R_n)**. The zeros off the diagonal *are* the independence assumption.
- Stacking works for **heterogeneous** sensors (different H_i): the spotter plane's position report (H = (I, O)) together with tower bearings. The fused-measurement formula needs **one shared H** [L p.47–48; B eq. 2.24 “the same linear function H_k x_k”].
- **Sequential**: one Kalman update per sensor, no prediction in between.
- Demo: all three produce the **same** posterior (engine computes them side by side). Reason: prior × p(z₁|x) × p(z₂|x) in any order; information form P⁻¹ + Σ HᵀR_s⁻¹H.
- When to use which: sequential when reports arrive at different times; stacking for mixed sensors; fused form for explaining and compressing.
- **Slide-wording note:** L p.47 “H_i = H_k for all i, k” vs MHT p.13 “for i ≠ k”. Same meaning.

## SCENE 6 — "Fusion inside the tracker" (time + space) [L1; Ch 3; B §2.3.2 cumulative detection]
- The fire drifts with the wind. The full loop at the dispatcher: predict (Ch 3) → towers report → fuse → filter → repeat.
- Toggle: A only / B only / both. With one tower the ellipse stays long forever (the along-line direction is never observed); with both it shrinks and stays small.
- Irregular timing: A reports every 10 min, B every 15 → sequential updates with predictions between them (Ch 3's Δt_k).
- **[B+] More eyes, more often** [B eq. 2.29]: the **mean cumulative data innovation interval** 1/T_c = Σ 1/T_s. Two towers at 10 and 15 min → T_c = 6 min. Fusion also raises the **data rate**.
- **[B+] Seeing through haze** [B eq. 2.30]: each tower spots smoke only with probability P_D^s (haze, sun glare). Combined: **P_D = 1 − Π(1 − P_D^s)**. The time-weighted version P_D^c = 1 − Π(1 − P_D^s)^{T_c/T_s} shows a slow sensor contributes less even if it is good. Hands-on: haze slider on tower A only; the dispatcher keeps the fire thanks to B.
- **Course exercise link:** two radars watching a car on a mountain pass (MHT p.3–4) is this scene with radars instead of towers. Your own program, no solution code here.

## SCENE 7 — "Ghost fires" (when crossings lie) [B §2.3.2, Fig. 2.5]
- Lightning strikes twice: **two smokes**. Each tower reports two bearings. The dispatcher draws four lines → **four crossings, only two real**. The others are **ghosts**.
- [B] With more objects the number of ghosts grows much faster than the number of real objects. With missed, false or merged bearings, **de-ghosting is far from trivial**.
- Visual: the four crossings; a third tower (C) cuts through only the real ones. Lesson: a third sensor in a new direction is the classic de-ghosting tool.
- This is the first appearance of the **data association problem** (which report belongs to which object) → Ch 6 (gating), Ch 7 (clutter), Ch 8 (NN, PDAF, MHT).

## SCENE 8 — "Phone lines are busy" (fusion architectures, track-to-track) [B §3.1.1, §3.1.3, Ch 6; L1]
- **[B §3.1.1] The vocabulary** (exam-quotable):
  - **centralized**: one fusion centre / **distributed**: several
  - **measurement fusion**: raw sensor data (+ their R) are sent / **track-to-track fusion**: each site sends its own estimate x and covariance P
  - **full-rate** vs **reduced-rate** communication
  - Everything so far = (centralized) measurement fusion. The book: **measurement fusion architectures generally come closer to optimal fusion.**
- **[B §3.1.3] Why anyone does track-to-track fusion anyway:**
  - less load on the channel (false tracks and clutter are removed locally)
  - more robust to sensor registration errors (each site's own track is self-consistent)
  - if one site or link fails, the system still works
  - Downsides: slower reaction, poorer track quality, worse track initiation (each sensor's data rate is lower), and trouble when mixing active and passive sensors (a lookout's bearing-only track is hard to form alone).
- In the story: the towers keep their own logbooks (local tracks) and phone the dispatcher only every hour.
- **The trap:** two local tracks that both used the *same prediction* (the same fire model, the same start) are **not independent**. Naively fusing them with the Fusion Equation double-counts the shared prior → overconfident.
- **[B Ch 6] The exact fix: Frenkel tracklets.** From a local track's filtered and predicted densities, recover the **local likelihood** (the “new information” only) [B eq. 6.3]:
  **ℓ_k^s(x) ∝ 𝒩(x; x^s_{k|k}, P^s_{k|k}) / 𝒩(x; x^s_{k|k−1}, P^s_{k|k−1})**
  A quotient of Gaussians is a Gaussian (product formula, second form) with
  **(P*)⁻¹ = (P^s_{k|k})⁻¹ − (P^s_{k|k−1})⁻¹**, **x* = P*((P^s_{k|k})⁻¹x^s_{k|k} − (P^s_{k|k−1})⁻¹x^s_{k|k−1})** [B eq. 6.6–6.7].
  Read it in information language: *posterior information − prior information = what this sensor added.* The tracklets of all sensors are independent again and fuse with the Fusion Equation [B eq. 6.10–6.11], then Bayes gives the optimal fused track [B eq. 6.14–6.15].
- **[B+] Reduced-rate fusion (sketch)** [B §6.2]: write the global density as a **product of S Gaussians**, one per sensor. Fusing them is the convex combination P⁻¹ = Σ (P^s)⁻¹, x = P Σ (P^s)⁻¹ x^s [B eq. 6.22–6.23]. The trick: Kalman covariances **don't depend on the measurements**, so every site can compute everyone's covariances locally (“globalisation”), and the sites only need to talk *when* a fused picture is wanted. Limit: this breaks for IMM/PDA, where covariances depend on the data. One-scene overview; the full prediction and retrodiction updates go to the Deep dive.
- Check: why can't the dispatcher just apply the Fusion Equation to the towers' hourly estimates? (Shared prior → not independent → double counting.)

## SCENE 9 — "When fusion lies" (the independence assumption, stress-tested)
- **Same report twice** (the same bearing phoned in by two people): the formula halves the covariance, but nothing new was learnt. The ellipse is **too small**.
- **Common error** (both towers' maps misaligned the same way, i.e. a registration error): errors move together and don't average out.
- Visual: toggle “duplicate report”. The ellipse shrinks; the cloud of true positions doesn't; the coverage counter falls from 95% to ~78%. The smokejumpers land in the wrong valley.
- Lesson: **independence is an assumption you must justify.** Overconfidence also poisons Ch 6 (gates too tight → real reports rejected).

## EPILOGUE — "Lines become a place"
- One card: p(z₁…z_S|x) = Π 𝒩(z_s; Hx, R_s) → **R = (Σ R_s⁻¹)⁻¹, z = R Σ R_s⁻¹ z_s**; = stacking = sequential; the √S law vs geometric gain; triangulation and trilateration; ghosts; 1/T_c = Σ 1/T_s, P_D = 1 − Π(1 − P_D^s); measurement vs track-to-track; tracklet = posterior info − prior info.
- Where next: Ch 6. Before fusing anything: **“Is this report even our fire?”** The factor 𝒩(z₁; z₂, R₁ + R₂) becomes a gate.

## PRACTICE (computation-heavy)
1. 1D fusion: 100 ± 10 and 110 ± 5 → z, σ.
2. Square-root law: four equal towers, σ = 8 → fused σ.
3. Fusion never hurts: σ₁ = 3, σ₂ = 30.
4. 2D: R₁ = diag(1, 25), R₂ = diag(25, 1), z₁ = (0, 0), z₂ = (5, 5) → R, z. Which coordinate comes from whom?
5. Bearing-only in information form: R₁⁻¹ = diag(0, 1/4), R₂⁻¹ = diag(1/9, 0) → fused R. Why can't you compute it with R₁, R₂ directly?
6. Geometry: identical wedges crossing at 90° vs 10°. Compare the fused areas.
7. Place the fused point (PlaceExercise).
8. Stack H and R for two position sensors plus one sensor measuring only x. Give the sizes.
9. Sequential vs fused: two 1D updates from the prior 𝒩(90, 100) vs one fused update. Same?
10. Cumulative: T₁ = 10 min, T₂ = 15 min → T_c. P_D¹ = 0.6, P_D² = 0.7 → P_D.
11. Ghosts: two fires, two towers → how many crossings? With three towers, how many points where all three lines meet?
12. Tracklet in 1D: predicted P = 20, filtered P = 5 → tracklet variance (1/P* = 1/5 − 1/20 → P* = 20/3). Interpret.
13. Architectures: classify four systems as centralized/distributed and measurement/track-to-track fusion.
14. Duplicate data: what does the formula report, and is it honest?
+ 8 explain-back questions (what fusion is: time vs space, homogeneous/heterogeneous; derive the fusion equation; why precisions add and why bearings need the information form; geometric fusion gain and the square-root law; stacking = sequential = fused; ghosts; measurement vs track-to-track fusion, pros and cons; why naive track fusion double-counts and what a tracklet is).

## DEEP DIVE (planned)
Matrix proof via the information form · tracklet fusion in full (B eq. 6.8–6.15) · the distributed Kalman filter: globalised prediction and retrodiction (B §6.2.3–6.2.4) and the simulated example (B §6.3) · covariance intersection for unknown correlations [beyond book and lecture, labelled] · dilution of precision (GPS) · de-ghosting strategies.

---

## Audit
| Item | Source | Where |
|---|---|---|
| Spatially distributed / complementary sensors | L1; L p.46; MHT p.12 | Scene 1 |
| Tracking along time vs fusion across space | L1 | Scene 1 |
| Fusion with pre-processed tracking information | L1; B §3.1.3, Ch 6 | Scenes 1, 8 |
| “Each measurement is a pdf” | L p.46 | Prologue |
| Independence → product of likelihoods | L p.47; B eq. 2.25 | Scene 2 |
| Symmetry swap, product formula result | L p.47–48; B App. A.5 | Scene 2 |
| Effective measurement and covariance, induction to S sensors | B eq. 2.26–2.28; L p.48; MHT p.14 | Scene 2 |
| Harmonic / arithmetic mean, “Fusion Equation” | L p.48; B §2.3.2 | Scenes 2–3 |
| Poor measurements contribute less | B §2.3.2 | Scene 3 |
| Square-root law, geometric fusion gain, intersection of ellipses | B §2.3.2 (1)–(3), Fig. 2.1 | Scene 4 |
| Triangulation / trilateration limits; 3D, bistatic | B §2.3.2 (4) | Scene 4 |
| Stacking H, R = diag(R_i); same H option | L p.47; MHT p.13 | Scene 5 |
| “all i, k” vs “i ≠ k” wording | L p.47; MHT p.13 | Scene 5 note |
| Mean cumulative data innovation interval | B eq. 2.29 | Scene 6 |
| Cumulative detection probability | B eq. 2.30 | Scene 6 |
| Ghosts with bearings-only sensors, de-ghosting | B §2.3.2, Fig. 2.5 | Scene 7 |
| Centralized/distributed, measurement/track-to-track, full/reduced rate; measurement fusion closer to optimal | B §3.1.1 | Scene 8 |
| T2TF advantages and disadvantages | B §3.1.3 | Scene 8 |
| Optimal T2TF definition (eq. 3.7) | B §3.1.3 | Scene 8 |
| Frenkel tracklets, tracklet fusion | B §6.1, eq. 6.3–6.15 | Scene 8 |
| Gaussian product densities, convex combination, globalisation, limits for IMM/PDA | B §6.2, eq. 6.17–6.23 | Scene 8 [B+], Deep dive |
| Exercise sheet: two radars | MHT p.3–4 | Scene 6 |

| Beginner trap | Fix |
|---|---|
| “Just average” | Prologue 105 vs 108; see-saw |
| More sensors can hurt? | Precisions only add (if independent) |
| A bearing has infinite covariance, so how do you fuse it? | Scene 4 information picture; Practice 5 |
| Geometry ignored | Scene 4 slider: 90° vs in-line |
| Thinking stacking, sequential and fused differ | Scene 5 demo |
| Fusing tracks like measurements | Scene 8 double-count + tracklets |
| Forgetting independence | Scenes 1, 2, 8, 9 |

**Verdict:** every statement on L p.45–48, MHT p.11–14 and the fusion lines of Lecture 1 is mapped. Book §2.3.2 is used completely (all four conclusions, ghosts, cumulative detection), as are §3.1.1, §3.1.3 and the core of Ch 6 (tracklets, product densities). There are 6 derivations: the fusion equation, n-sensor induction, the 1D precision sum, stacking = sequential = fused, the bearing-only information form, and the tracklet as a Gaussian quotient. The slide wording difference is flagged.

Kept for later chapters: the gating use of 𝒩(z₁; z₂, R₁ + R₂) (Ch 6); association and de-ghosting algorithms (Ch 7–8).
