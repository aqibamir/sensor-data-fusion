# Chapter 1 script — audit

Question asked: **can one person, starting from school maths, learn everything Chapter 1 needs from this story alone?**
Checked against (a) every Chapter-1 item on the lecture slides and (b) every prerequisite a beginner would trip over.

## A. Coverage of the lecture slides

| Slide item (L2 p.5–8, IMM p.3, IMM p.10) | Where in the script | Status |
|---|---|---|
| State examples: line, ℝ⁹ kinematic, two objects, extended target, class | Scene 1.3 | ✅ |
| “The unknown object state is expressed as a random variable” | Scene 1.2 | ✅ |
| pdf: probability by integration, non-negative, normalised | Scene 2 | ✅ |
| Expectation 𝔼[X] = ∫x p(x)dx | Scene 3 | ✅ |
| 𝔼[g(X)] for an observable g | Scene 3.2 (one line only) | ⚠️ too thin — needs a worked example |
| Conditional pdf p(x\|y) = p(x,y)/p(y), “impact of information on y on x” | Scene 7 | ✅ |
| Marginal p(x) = ∫p(x,y)dy = ∫p(x\|y)p(y)dy, “Enter y!” | Scene 6 | ✅ |
| Bayes p(x\|y) = p(y\|x)p(x)/∫…, “p(x\|y) ← p(y\|x), p(x)” | Scene 8 | ✅ |
| Gaussian 𝒩(x; x̄, P) with \|2πP\|, Pᵀ, P⁻¹ | Scene 9 | ⚠️ uses matrices that were never taught |
| Certain knowledge δ(x−y) as σ→0 limit | Scene 11 | ✅ |
| Affine transform 𝒩(x; x̄, X) → 𝒩(y; a + A x̄, A X Aᵀ) | Scene 10 | ⚠️ the shift **a** is not shown; matrices not taught |
| Lecture notation 𝔼[x] = x̄, ℂ[x] = P (used on the χ² and moment-matching slides) | — | ❌ missing |
| “optimal estimators: e.g. minimum mean squared error (MMSE)” (Bayesian-tracking slide) | — | ❌ missing — the mean IS the MMSE estimate |

## B. Beginner gaps (things the story silently assumed)

| Gap | Why a learner gets stuck | Fix |
|---|---|---|
| **Matrices** (vector, matrix × vector, transpose, inverse, determinant) | Scenes 9 and 10 are unreadable without them | **New Scene 8½ “Matrices are machines that move space”**: a 2×2 matrix shown as a transformation of a grid of cars (stretch, shear); transpose = flip over the diagonal; inverse = the undo machine; determinant = area scale factor. Only what Ch 1–3 need. |
| Discrete vs continuous: when Σ, when ∫ | Tables use Σ, curves use ∫ — never said explicitly | Scene 2.2 adds a side-by-side “table world ↔ sand world” bridge: Σ ↔ ∫, probability ↔ density × width |
| **Independence** p(x,y) = p(x)p(y) | Needed in Ch 5 (fusion: multiply sensor likelihoods) and Ch 7 (clutter). Only hinted at via ρ = 0 | Scene 7.3: two independent radars; the conditional slice never moves; definition and the product rule |
| 𝔼[g(x)] has no example | “observable” stays abstract | Scene 3.2: g(x) = travel time to the radar, or g(x) = (x − x̄)², which leads straight into the variance (Scene 4) |
| Variance → covariance matrix | Jump from one σ to a matrix P | Scene 5.3 builds P = ℂ[x] = 𝔼[(x − x̄)(x − x̄)ᵀ] entry by entry and names the notation ℂ |
| Why Gaussians? | Asserted, never motivated | Scene 9.0: many small random effects add up to a bell (a dice-sum demo: 1 die flat → 2 dice triangle → 10 dice bell) |
| The 1D Gaussian formula | Script jumps to the 2D formula | Scene 9.1 builds the 1D formula piece by piece first: exp(−½·(how many σ away)²) and why 1/√(2πσ²) |
| Likelihood is not a density in x | A common exam trap | Scene 8.2 note: the red columns don't add up to 1 — and they don't need to |
| Why the mean is “the best guess” | Mean is chosen without justification | Scene 3.4: MMSE — the mean minimises the average squared error (beam picture: try other guesses, the error meter is lowest at the pivot) |
| Shift **a** in the affine map | Only A was shown | Scene 10 adds a fixed offset (e.g. the radar is 70 m down the road: measured from the radar, y = x − 70) |

## C. Flow and load

- 12 scenes become 13 (with matrices), around 45–60 minutes of reading and playing. That's fine for the foundation chapter, as long as each scene ends with a check and the progress rail lets the learner stop and resume.
- Every scene still goes intuition → numbers → formula → in other words → forward link → check.
- The two hardest scenes (Bayes, 2D Gaussian) come straight after a short scene (Conditional, Matrices), so effort alternates.

## Verdict

With the fixes above, a motivated learner starting from school maths can learn everything Chapter 1 of the course needs from this story alone. Without them, Scenes 9–10 would lose them, because of the matrices.
