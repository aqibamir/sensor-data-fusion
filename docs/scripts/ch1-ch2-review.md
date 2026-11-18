# Course-reviewer pass — Chapters 1 and 2 (built content)

*2026-11-18. Every statement on the slides each chapter claims (Ch 1: L2 p.5–8, IMM p.3, IMM p.10, V5 p.4–6; Ch 2: L2 p.6–15, 27–28, MHT p.9, 50–51, V5 p.3, 7, 17) checked against the live chapter.*

## Chapter 1 — coverage
| Slide statement | Covered in |
|---|---|
| State examples incl. ℝ⁹, two objects, extended target, class | Scene 1 |
| “The unknown object state is expressed as a random variable …” | Scene 1 |
| pdf: normalised, non-negative (L2: p ≥ 0; V5 writes p > 0), probability by integration | Scene 2 |
| 𝔼[X], 𝔼[g(X)] (observable) | Scene 3 |
| Joint, conditional, marginal (“Enter y!”), Bayes (“p(x\|y) ← p(y\|x), p(x)”) | Scenes 5–8 |
| Gaussian 𝒩(x; x̄, P) with \|2πP\| | Scene 10 |
| Certain knowledge δ(x − y) | Scene 12 |
| Affine transform of Gaussians (IMM p.10) | Scene 11 (with derivation) |
| 𝔼[x] = x̄, ℂ[x] = P notation | Scene 5 |

**Gap found and fixed:** covariance matrix properties were never stated — added: P is symmetric (P = Pᵀ), variances non-negative, positive (semi-)definite → contours are ellipses.
**Verdict:** complete against the slides.

## Chapter 2 — coverage
| Slide statement | Covered in |
|---|---|
| Iterative updating of conditional pdfs; prediction / filtering / retrodiction table with dynamics model, road maps, sensor data, sensor model, filtering output | Prologue, Scenes 2, 9, Epilogue |
| Finite mixture (data, model, road network), optimal estimators (MMSE), initiation | Epilogue |
| Chapman–Kolmogorov with marginalisation, conditional rule, Markov | Scenes 3–4 |
| Linear Gauss–Markov transition, “realistic?” | Scene 2 |
| Bayes filtering, likelihood, normalisation constant | Scenes 6–7 |
| Iteration formula (MHT p.51) | Scene 7 |
| Expected measurement, used for gating / innovation statistics | Scene 8 |
| Retrodiction derivation (L2 p.27–28) | Scene 10 |
| Data fusion: along time / across sensors (L2 p.6) | Ch 0 (by design) |

**Gaps found and fixed:**
1. The lecture's notation **Z_k (this scan: a set of m_k readings) vs 𝒵^k (all scans)** was missing — now a “careful” box in Scene 1.
2. The lecture's general likelihood **ℓ(x_k; Z_k, m_k) ∝ p(Z_k, m_k | x_k)** and its two cases (1 reading: 𝒩(z; Hx, R); m_k readings with clutter: (1−P_D)ρ_F + P_D Σ 𝒩(…), MHT p.51) — now in Scene 6, with the clutter case marked as a preview of Ch 7–8.

**Verdict:** complete against the slides.
