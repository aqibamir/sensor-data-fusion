# Chapter 2 — "The Ship in the Fog"
### Screenplay for the Bayesian recursion (prediction · filtering · retrodiction)

*Same format as Chapter 1: one persistent 3D world pinned left, the story scrolling right, every step changes the world. Predict-first before every reveal, a table version before every curve, every symbol explained, derivations with named moves, a forward link and a check at the end of each scene. Then Practice and Deep dive.*

**Why a ship?** Chapter 1 asked “where is the car *now*?”. Chapter 2 asks “where is it *as time passes*?” — and nothing makes that more vivid than a ship at sea before GPS: long stretches of guessing, rare glimpses of land, and a terrible price for getting it wrong. It also connects to Lecture 1's maritime-surveillance slide (“large time gaps between sensor updates”).

---

## THE WORLD
| Object | Look | Role |
|---|---|---|
| **The sea lane** | Dark water, a straight shipping lane marked by buoys every 10 nautical miles (the x-axis) | the state space |
| **The ship** | A small sailing ship with a lantern, wake behind it | the truth (shown faintly, or hidden) |
| **Ghost ships** | Translucent blue copies | the belief |
| **Fog bank** | Moving fog that hides the ship and the coast | “no measurement now” |
| **Lighthouses** | On the coast beside the lane; the beam sweeps; a sighting drops a red pin on the lane | measurements |
| **The logbook** | An open book floating beside the lane, pages turning | the time axis (k) and the data 𝒵ᵏ |
| **Time ribbon** | Each hour's belief drawn as a curve on its own page, stacked into the distance | the recursion over time |
| **Rocks** | A reef near the lane | stakes |

Colours as always: truth = amber, measurement = red, prediction/prior = green, posterior = blue, retrodiction = purple, sand/joint = gold.

---

## PROLOGUE — "October 1707"
- *On screen:* storm-grey sea, fog. Four warships sail in line. A caption: *22 October 1707, off the Isles of Scilly.*
- *Narration:* “Admiral Shovell's fleet is sailing home. For days the fog has hidden the sun and the coast. The navigators do the only thing they can: from the last known position, speed and heading, they work out where the fleet must be now — hour after hour, without a single sighting.” (Kept historically careful: the fleet struck the rocks of the Scilly Isles; well over a thousand sailors died; navigation errors were a major cause, and the disaster helped lead to the Longitude Act of 1714.)
- *Step 2:* the fleet's *believed* position (a ghost ship) sails calmly in open water; the *real* fleet (amber, faint) drifts towards the reef. The gap grows each hour.
- *Predict:* “Each hour of guessing adds a small error. After 3 days of fog, is the error 3 days' worth of small errors — or something worse?”
- *Reveal:* the errors don't cancel: the uncertainty keeps growing. Without new information, it can only grow.
- *Big question:* **How do you keep knowing where you are when the world only gives you rare, noisy glimpses?** This chapter is the answer — a loop that every tracker in this course runs.
- *Roadmap:* reading the notation → how the ship moves → predicting (with a table, then in 3D) → why fog makes you lost → the lighthouse → filtering → how surprised to be → the full voyage → the inquiry: rewriting the past.

## SCENE 1 — "Hours, sightings, and a notation that tells a story"
- The logbook opens: hour 1, 2, 3… Each hour k: the true state xₖ (unknown), maybe a sighting zₖ.
- Timeline table: *after sighting 3* p(x₃|𝒵³) “filtered” · *before sighting 4* p(x₄|𝒵³) “predicted” · *after 4* p(x₄|𝒵⁴) · *looking back at hour 2* p(x₂|𝒵⁴) “retrodicted”.
- Rule: **left of the bar: which hour. Right of the bar: which sightings we used.**
- Kalman shorthand preview: x_{k|k−1}, P_{k|k−1} — “k given k−1”.
- Check: what does p(x₅|𝒵⁷) describe?

## SCENE 2 — "If I knew exactly where we were…" (the dynamics model)
- Ship at a known buoy; it sails one hour at ~10 knots; current and steering add randomness. Ghosts spread into a small bell 10 nm ahead.
- Formula: p(xₖ|xₖ₋₁) = 𝒩(xₖ; xₖ₋₁ + u, q). Symbols explained.
- 3D: the **ridge** over (old position, new position). Sliders u, q. Train-on-rails (small q) vs rowing boat in a storm (big q).
- **Markov property** with the logbook: to plan the next hour you need only the current position — earlier pages add nothing *once you know it*. Formula p(xₖ|xₖ₋₁, 𝒵ᵏ⁻¹) = p(xₖ|xₖ₋₁). Pitfall: Markov doesn't mean the past is useless — its usefulness is already inside the current belief.
- Forward: Ch 3 makes this 𝒩(xₖ; F xₖ₋₁, D); Ch 9 (IMM) uses several such models.

## SCENE 3 — "Predicting with a table" (add up where it came from)
- Lane cut into 10-nm cells. Belief now 0.2 / 0.6 / 0.2 at cells 1–3; each hour the ship moves +1 (25 %), +2 (50 %), +3 (25 %).
- Columns on the water; next hour's columns are **stacked in colours by origin cell**. Worked: p(cell 4) = 0.05 + 0.30 + 0.05 = 0.40.
- Predict: wider or narrower after one hour? → 5 cells, wider.
- Toggle “two guesses” (we don't know which harbour we left): prediction moves both bumps.
- Formula: p(xₖ) = Σ p(xₖ|xₖ₋₁) p(xₖ₋₁). Forward: this sum is Ch 1's marginal.
- Check: p(cell 3) next hour = 0.25.

## SCENE 4 — "Chapman–Kolmogorov" (the same, with infinitely many cells)
- 3D ridge × old belief (two bumps) → joint (gold) → integrate → prediction on the wall (green).
- Derivation with three named moves: ① marginalisation ② conditional-pdf rule ③ Markov. Check: which move uses an assumption? (③)
- Forward: Gaussian case solved by hand in Ch 3 (x̄ + u, P + q → F x̄, F P Fᵀ + D).

## SCENE 5 — "Lost in the fog" (why prediction only ever spreads)
- Fog rolls in. Predict 1, 2 … 6 hours without sightings; the bell flattens. Scilly reprise: the fleet's ghost cloud now covers the reef.
- Predict-first: will it ever narrow again without a sighting? → never.
- Worked: variance after n hours = P + n q (P = 1, q = 4 → σ 2.2 after 1 h, 5 after 6 h).
- Rule: prediction moves and widens; it never adds information.
- Lecture link: maritime slide — sparse updates, AIS-learned sea lanes for better prediction.

## SCENE 6 — "A light in the fog" (the measurement and the filtering table)
- The fog tears open; a lighthouse beam; the keeper's position fix drops a red pin. Sensor model z = x + w (from Ch 1) → likelihood ℓ(xₖ; zₖ) = p(zₖ|xₖ).
- Lecture notation: ℓ(xₖ; zₖ) — “the likelihood, a function of the state, for a given reading”.
- Table: prediction 0.05/0.25/0.40/0.25/0.05 × likelihood → gold → rescale → blue. Sliders: reading, sighting accuracy.
- Predict: reading 52 nm, prediction peaks at 40 nm — where does the new belief peak?

## SCENE 7 — "Filtering: Bayes, with time stamps"
- JointSlice 3D (from Ch 1), now labelled with k.
- Derivation: ① unpack 𝒵ᵏ = {zₖ, 𝒵ᵏ⁻¹} ② Bayes conditioned on 𝒵ᵏ⁻¹ (Ch 1's “background knowledge”) ③ sensor model: zₖ depends only on xₖ.
- Lecture's compact form: p(xₖ|𝒵ᵏ) = ℓ(xₖ; zₖ) p(xₖ|𝒵ᵏ⁻¹) / ∫ ℓ p dxₖ — the “iteration formula” (MHT p.54).
- Check: which assumption drops 𝒵ᵏ⁻¹ from the likelihood?

## SCENE 8 — "How surprised should we be?" (the expected measurement)
- Before the sighting: where do we *expect* the light? p(zₖ|𝒵ᵏ⁻¹) = ∫ p(zₖ|xₖ) p(xₖ|𝒵ᵏ⁻¹) dxₖ — wider than the prediction (variance P + R in the Gaussian case).
- Lewin moment — **the wreckers' false light**: Cornish legend tells of false lights luring ships onto rocks. A light appears far out in the tail. Is it ours?
- Forward: gating (Ch 6), clutter (Ch 7), MHT hypothesis weights (Ch 8), track birth (Ch 10).

## SCENE 9 — "The voyage" (run the whole loop)
- Time ribbon in 3D: each hour a page; Step / Auto / Reset / New voyage. The start belief has two bumps (which harbour did we leave?); the wrong one dies after the first sightings.
- Sliders q (sea state) and R (lighthouse accuracy). Narrate: predict… sight… filter…
- Readout: predicted vs filtered variance each hour; it settles to a steady width.
- Rule: predict (wider) → sight → filter (narrower) → repeat.

## SCENE 10 — "The board of inquiry" (retrodiction)
- After the voyage, an inquiry reads the whole logbook: “where *exactly* was the ship at hour 2?” Later sightings tell us about the past.
- Detective example: kitchen or garden at 9 pm; seen at the garden gate at 9:01.
- Derivation, 4 named moves (marginalise the next state → conditional → Markov + Bayes → denominator = prediction).
- 3D: the ribbon turns purple and sharpens backwards; hour 0's false bump disappears.
- Pitfall: retrodiction needs future data — it's for reconstruction, and inside MHT.
- Forward: Rauch–Tung–Striebel (Ch 3); “strong sons strengthen weak fathers” (Ch 8).

## EPILOGUE — "The loop"
- The loop diagram; one-page table (prediction / filtering / retrodiction: from → to, uses, rule).
- The lecture's three bullets: finite mixtures (ambiguity in data, model, road network), optimal estimators (MMSE), initiation of the pdf iteration (track extraction).
- Where it goes: Kalman (Gaussian & linear), EKF/UKF, PDAF/MHT, IMM, SLRT.
- → Practice.

## PRACTICE (auto-checked)
1. Read the notation (which hour, which data) — numeric answers.
2. Predict a 3-cell belief one hour (table).
3. Two hours of fog: variance P + 2q, σ.
4. Filter by hand: prediction × likelihood → posterior (3 cells).
5. Expected measurement: prediction σ, sighting σ → σ of the expected reading.
6. Retrodiction by hand on a 2-cell, 2-hour logbook.
7. Place it: after one sighting, drag the filtered peak.
+ 6 explain-back questions (loop, Chapman–Kolmogorov, Markov, filtering derivation, expected measurement, retrodiction).

## DEEP DIVE (planned)
Markov chains and transition matrices · why the recursion is exact (proof by induction) · conditional independence, formally · grid filters and particle filters (how computers run this loop for any shape).

---

## Audit (against the lecture and a beginner)
| Lecture item | Where | Status |
|---|---|---|
| Iterative updating of conditional pdfs; prediction / filtering / retrodiction table (MHT p.9) | Prologue, Epilogue | ✅ |
| Chapman–Kolmogorov with marginalisation, conditional rule, Markov (L2 p.10, 15) | Scenes 3–4 | ✅ |
| “dynamics model, **road maps**” as prior knowledge in prediction (MHT p.9) | — | ➕ add to Scene 2: sea lanes / road maps restrict where the object can go |
| Linear Gauss–Markov transition 𝒩(xₖ; F xₖ₋₁, D) — “realistic?” (MHT p.54) | Scene 2 forward link | ➕ add the slide's own question: is a straight-line model realistic? (answer: for short times; manoeuvres need IMM) |
| Bayes filtering with likelihood ℓ(xₖ; zₖ) and normalisation (L2 p.12, MHT p.54) | Scenes 6–7 | ✅ |
| Expected measurements p(zₖ \| 𝒵ᵏ⁻¹), “used for gating” (V5 p.17) | Scene 8 | ✅ |
| Retrodiction derivation (L2 p.27–28) | Scene 10 | ✅ |
| Finite mixture / optimal estimators / initiation (MHT p.9) | Epilogue | ✅ |

| Beginner trap | Fix |
|---|---|
| “k” vs “k−1” confusion | Scene 1 timeline + the logbook prop on screen in every scene |
| Why the expected-measurement spread is P + R, not P | Scene 8 worked example: two independent uncertainties add as variances (Ch 1: variances of independent errors add) |
| Retrodiction feels like cheating (using the future) | Scene 10 pitfall: it's for afterwards, not for steering now |
| Prediction and filtering both use Bayes? | Epilogue table: prediction = marginal, filtering = Bayes |

**Verdict:** covers every Chapter 2 slide once the two ➕ items are added. Depth matches Chapter 1: three derivations (Chapman–Kolmogorov, filtering, retrodiction) instead of one.
