# Chapter 1 — second audit (against the platform outline)

*2026-11-17. Question: is Chapter 1 good enough as the first chapter of the platform, judged by the new chapter template (Story → Practice → Deep dive) and by “does it teach everything the course needs from it”?*

## Verdict
**The story is strong; the chapter is not finished.** It explains well but asserts too much, and it never makes the learner *do* the maths. Three structural gaps and six teaching gaps.

## A. Structure (template: Story → Practice → Deep dive)
| Part | Status | Gap |
|---|---|---|
| Story arc | ✅ 13 scenes, 47 steps | — |
| Practice | ❌ missing | 11 inline multiple-choice checks only test recognition. Nothing asks you to **compute** (a probability, a mean, a posterior, A X Aᵀ) and checks your number. |
| Explain-back | ⚠️ buried in the epilogue | Belongs to Practice, so the learner meets it after doing the maths. |
| Deep dive | ❌ no slot | No place for the “why exactly?” material. |
| Chapter navigation | ⚠️ one long scroll | No way to go straight to practice before an exam. |

## B. Teaching gaps (things a learner needs but the story asserts or skips)
| # | Gap | Why it matters | Fix |
|---|---|---|---|
| T1 | **Where the likelihood comes from.** Scene 8 uses p(z \| x) but never shows the sensor equation z = x + w, w ~ 𝒩(0, σ²) ⇒ p(z \| x) = 𝒩(z; x, σ²). | Chapter 3's z_k = H x_k + w_k and every likelihood later rest on this bridge. | New step in Scene 8: “the sensor model” |
| T2 | **Conditioning on background knowledge.** Bayes is shown as p(x \| z) only. | Chapter 2 writes p(x_k \| z_k, 𝒵^{k−1}) — Bayes with everything conditioned on past data. Without this, Chapter 2's derivation looks like magic. | Add to Bayes: every rule keeps working when you condition everything on extra knowledge |
| T3 | **Why the mean minimises the squared error** — only demonstrated with a slider. | An examiner's “why the mean?” deserves a two-line derivation: 𝔼[(x − g)²] = 𝕍[x] + (x̄ − g)². | Derivation in Scene 3.4 |
| T4 | **Why the covariance becomes A X Aᵀ** — asserted. | The single most important line for Kalman prediction. One derivation from the definition of ℂ. | Derivation in Scene 11 |
| T5 | **Moments.** Mean and variance are never named as the first and second moments. | Chapter 8's “moment matching” keeps exactly these two. | One paragraph in Scene 4 |
| T6 | **Notation X vs x.** The lecture writes 𝔼[X] (capital = the random variable). | Avoids confusion when reading the slides. | One line in Scene 1 |

## C. Practice set to add (all auto-checked, with hints and worked solutions)
1. Sand: probability under a flat density
2. Mean and σ of a three-position belief
3. Joint table → marginal and both conditionals
4. Bayes by hand with three lampposts
5. Place the posterior (estimate by eye, then see the exact answer)
6. How many σ away? (1D bell height and 2D Mahalanobis)
7. Drive a belief: compute A X Aᵀ
8. Matrix machine: A x and |A|
9. Explain it back (moved from the epilogue): seven questions with self-rating

## D. Deep-dive slot (planned topics, content later)
The Gaussian integral (why 1/√(2πσ²)) · the central limit theorem (why bells) · eigenvectors and the covariance ellipse · change of variables for non-linear maps (bridge to Chapter 4) · the Dirac delta, properly.
