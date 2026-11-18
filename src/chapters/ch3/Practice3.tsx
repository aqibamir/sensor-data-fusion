import { ExplainBack } from '../../story/blocks';
import { PageShell } from '../../story/ChapterFrame';
import { Exercise, PM, PMB } from '../../story/practice';
import { useProgress } from '../../story/progress';

export const EXPLAIN3: { id: string; q: string }[] = [
  { id: 'ch3-e1', q: '1. What are the assumptions of the Kalman filter, and why does the belief stay Gaussian?' },
  { id: 'ch3-e2', q: '2. State the product formula and say what each factor means.' },
  { id: 'ch3-e3', q: '3. Derive the Kalman prediction from Chapman–Kolmogorov. What are F and D?' },
  { id: 'ch3-e4', q: '4. Derive the Kalman update. Define ν, S and W, and explain what the gain does.' },
  { id: 'ch3-e5', q: '5. Why does a range-only measurement improve the speed estimate?' },
  { id: 'ch3-e6', q: '6. What is RTS retrodiction, and how is it computed?' },
];
export const EXERCISE_IDS3 = Array.from({ length: 11 }, (_, i) => `ch3-p${i + 1}`);

export default function Practice3({ onHome }: { onHome: () => void }) {
  const p = useProgress();
  const solved = EXERCISE_IDS3.filter((id) => p.exercise[id] && p.exercise[id] !== 'revealed').length;
  const canExplain = EXPLAIN3.filter((e) => p.explain[e.id] === 'yes').length;
  return (
    <PageShell
      chapterId="ch3"
      chapterLabel="Chapter 3"
      view="practice"
      onHome={onHome}
      right={
        <span className="sx-top-meta">
          {solved}/{EXERCISE_IDS3.length} solved · {canExplain}/{EXPLAIN3.length} can explain
        </span>
      }
    >
      <div className="cx-intro">
        <div className="sx-kicker">Chapter 3 · Practice</div>
        <h1 className="sx-h2">Fly it yourself</h1>
        <p className="sx-lead">Eleven problems, from completing the square to starting a track. A calculator helps; commas or points both work.</p>
      </div>

      <Exercise
        id="ch3-p1"
        n={1}
        title="Bell × bell (complete the square)"
        task={<p>Prior <PM>{'\\mathcal N(x; 10, 4)'}</PM>, measurement z = 14 with R = 4 (H = 1). What are the mean and variance of the posterior?</p>}
        fields={[
          { label: 'mean', answer: 12, tol: 0.01 },
          { label: 'variance', answer: 2, tol: 0.01 },
        ]}
        hints={[<>Information adds: 1/Q = 1/P + 1/R.</>, <>Mean: Q (y/P + z/R), or y + W(z − y) with W = P/(P + R).</>]}
        solution={<PMB>{'\\frac1Q = \\frac14 + \\frac14 \\Rightarrow Q = 2, \\qquad \\mu = 2\\Big(\\frac{10}{4} + \\frac{14}{4}\\Big) = 12'}</PMB>}
      />

      <Exercise
        id="ch3-p2"
        n={2}
        title="Predict two hours"
        task={
          <p>
            <PM>{'\\mathbf x = (0, 3)^\\top'}</PM>, <PM>{'\\mathbf P = \\text{diag}(1, 0.5)'}</PM>, Δt = 2, and ignore D for this problem. Compute the predicted position, P₁₁ and P₁₂.
          </p>
        }
        fields={[
          { label: 'predicted position', answer: 6, tol: 0.01 },
          { label: 'P₁₁', answer: 3, tol: 0.01 },
          { label: 'P₁₂', answer: 1, tol: 0.01 },
        ]}
        hints={[<>F = [[1, 2], [0, 1]]. Position = r + Δt·ṙ.</>, <>F P Fᵀ: P₁₁ = P₁₁ + 2Δt P₁₂ + Δt² P₂₂, P₁₂ = P₁₂ + Δt P₂₂.</>]}
        solution={<PMB>{'\\mathbf x = (6, 3), \\quad \\mathbf F\\mathbf P\\mathbf F^\\top = \\begin{pmatrix}1 + 4\\cdot 0.5 & 2\\cdot 0.5\\\\ 1 & 0.5\\end{pmatrix} = \\begin{pmatrix}3 & 1\\\\ 1 & 0.5\\end{pmatrix}'}</PMB>}
      />

      <Exercise
        id="ch3-p3"
        n={3}
        title="Build D"
        task={<p>Piecewise constant white acceleration with σ² = 0.5 and Δt = 2. Compute the three entries of D.</p>}
        fields={[
          { label: 'D₁₁ = ¼σ²Δt⁴', answer: 2, tol: 0.01 },
          { label: 'D₁₂ = ½σ²Δt³', answer: 2, tol: 0.01 },
          { label: 'D₂₂ = σ²Δt²', answer: 2, tol: 0.01 },
        ]}
        hints={[<>Δt⁴ = 16, Δt³ = 8, Δt² = 4.</>]}
        solution={<p>¼·0.5·16 = 2, ½·0.5·8 = 2, 0.5·4 = 2. (A coincidence of these numbers — usually they differ.)</p>}
      />

      <Exercise
        id="ch3-p4"
        n={4}
        title="One update in 1D"
        task={<p>Predicted mean 20, P = 9. Measurement z = 26, R = 3. Compute S, W, the new mean and the new variance.</p>}
        fields={[
          { label: 'S', answer: 12, tol: 0.01 },
          { label: 'W', answer: 0.75, tol: 0.005 },
          { label: 'x_{k|k}', answer: 24.5, tol: 0.01 },
          { label: 'P_{k|k}', answer: 2.25, tol: 0.01 },
        ]}
        hints={[<>S = P + R, W = P / S, ν = z − x.</>, <>P_new = P − W² S.</>]}
        solution={<PMB>{'S = 12,\\ W = 0.75,\\ \\nu = 6,\\ x = 20 + 4.5 = 24.5,\\ P = 9 - 0.5625\\cdot 12 = 2.25'}</PMB>}
      />

      <Exercise
        id="ch3-p5"
        n={5}
        title="Range-only, 2D: does the speed change?"
        task={
          <p>
            <PM>{'\\mathbf x = (10, 1)^\\top,\\ \\mathbf P = \\begin{pmatrix}4 & 2\\\\ 2 & 2\\end{pmatrix}'}</PM>, H = (1, 0), R = 4, z = 14. Compute both gain entries and the new speed.
          </p>
        }
        fields={[
          { label: 'W₁', answer: 0.5, tol: 0.005 },
          { label: 'W₂', answer: 0.25, tol: 0.005 },
          { label: 'new speed', answer: 2, tol: 0.01 },
        ]}
        hints={[<>S = P₁₁ + R. W = (P₁₁, P₂₁)ᵀ / S.</>, <>ν = 14 − 10. New speed = 1 + W₂ ν.</>]}
        solution={<p>S = 8, W = (0.5, 0.25), ν = 4 → position 12, speed 1 + 0.25·4 = <b>2</b>. The covariance P₁₂ = 2 carried the range information into the speed.</p>}
      />

      <Exercise
        id="ch3-p6"
        n={6}
        title="Gain intuition"
        task={<p>Position gain W = P/(P + R) in 1D. (a) P = 16, R = 4. (b) P = 1, R = 99.</p>}
        fields={[
          { label: '(a) W', answer: 0.8, tol: 0.005 },
          { label: '(b) W', answer: 0.01, tol: 0.001 },
        ]}
        hints={[<>Just the formula — but say in words what each result means.</>]}
        solution={<p>(a) 0.8: the prediction is vague, the sensor sharp — move most of the way to the measurement. (b) 0.01: the prediction is sure, the sensor poor — nearly ignore it.</p>}
      />

      <Exercise
        id="ch3-p7"
        n={7}
        title="RTS one step back (1D)"
        task={
          <p>
            F = 1. Filtered at l: x = 10, P = 4. Predicted for l+1: x = 10, P = 8. Retrodicted at l+1: x = 14, P = 3. Compute W, x_{'{l|k}'} and P_{'{l|k}'}.
          </p>
        }
        fields={[
          { label: 'W', answer: 0.5, tol: 0.005 },
          { label: 'x_{l|k}', answer: 12, tol: 0.01 },
          { label: 'P_{l|k}', answer: 2.75, tol: 0.01 },
        ]}
        hints={[<>W = P_{'{l|l}'} F / P_{'{l+1|l}'}.</>, <>x = 10 + W(14 − 10); P = 4 + W²(3 − 8).</>]}
        solution={<PMB>{'W = 4/8 = 0.5,\\quad x_{l|k} = 10 + 0.5\\cdot 4 = 12,\\quad P_{l|k} = 4 + 0.25\\cdot(3 - 8) = 2.75'}</PMB>}
      />

      <Exercise
        id="ch3-p8"
        n={8}
        title="Spot the slide typo"
        task={
          <p>
            Which update is correct? Type <b>1</b> for x_{'{k|k}'} = W(z − H x_{'{k|k−1}'}), or <b>2</b> for x_{'{k|k}'} = x_{'{k|k−1}'} + W(z − H x_{'{k|k−1}'}).
          </p>
        }
        fields={[{ label: 'correct form', answer: 2, tol: 0 }]}
        hints={[<>If the measurement equals the prediction (ν = 0), what should the estimate be?</>]}
        solution={<p>Form 2. With ν = 0 the estimate must stay at the prediction; form 1 would give 0. Form 1 is the typo on Lecture 2, slide 25.</p>}
      />

      <Exercise
        id="ch3-p9"
        n={9}
        title="Matrix sizes"
        task={<p>State size n = 6, measurement size m = 3. How many rows and columns do H and W have?</p>}
        fields={[
          { label: 'H rows', answer: 3, tol: 0 },
          { label: 'H columns', answer: 6, tol: 0 },
          { label: 'W rows', answer: 6, tol: 0 },
          { label: 'W columns', answer: 3, tol: 0 },
        ]}
        hints={[<>H maps a state (n) to a measurement (m). W maps an innovation (m) to a state correction (n).</>]}
        solution={<p>H is 3 × 6, W is 6 × 3.</p>}
      />

      <Exercise
        id="ch3-p10"
        n={10}
        title="Irregular reports"
        task={<p>σ² = 1. Compute the position-variance entry ¼σ²Δt⁴ of D for (a) Δt = 0.5 and (b) Δt = 3.</p>}
        fields={[
          { label: '(a) Δt = 0.5', answer: 0.015625, tol: 0.0005 },
          { label: '(b) Δt = 3', answer: 20.25, tol: 0.01 },
        ]}
        hints={[<>0.5⁴ = 0.0625; 3⁴ = 81.</>]}
        solution={<p>(a) 0.0156, (b) 20.25 — a 6× longer gap adds about 1300× more position variance. That's why F and D are rebuilt for every Δtₖ.</p>}
      />

      <Exercise
        id="ch3-p11"
        n={11}
        title="Start a track"
        task={<p>Two range measurements: z₁ = 100 at t = 0 h, z₂ = 106 at t = 2 h, each with R = 4. Give the initial position, speed and speed variance.</p>}
        fields={[
          { label: 'position', answer: 106, tol: 0.01 },
          { label: 'speed', answer: 3, tol: 0.01 },
          { label: 'speed variance', answer: 2, tol: 0.01 },
        ]}
        hints={[<>Speed = (z₂ − z₁) / Δt.</>, <>Variance of a difference of two independent errors: 2R; divided by Δt².</>]}
        solution={<p>Position 106, speed 6/2 = 3, speed variance 2·4/2² = 2.</p>}
      />

      <div className="cx-intro">
        <div className="sx-kicker">For the oral exam</div>
        <h2 className="sx-h2">Explain it back</h2>
      </div>
      <ExplainBack id={EXPLAIN3[0].id} q={EXPLAIN3[0].q}>
        <p>Linear dynamics and sensor models with additive Gaussian noise, and a Gaussian start. A linear map plus independent Gaussian noise keeps a Gaussian Gaussian (prediction), and the product of Gaussians is Gaussian (filtering) — so by induction the belief stays Gaussian and only its mean and covariance need storing. Under these assumptions the filter is exact and optimal (MMSE).</p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN3[1].id} q={EXPLAIN3[1].q}>
        <p>𝒩(z; Hx, R) 𝒩(x; y, P) = 𝒩(z; Hy, S) · 𝒩(x; y + Wν, P − WSWᵀ), with ν = z − Hy, S = HPHᵀ + R, W = PHᵀS⁻¹ (equivalently 𝒩(x; Q(P⁻¹y + HᵀR⁻¹z), Q) with Q⁻¹ = P⁻¹ + HᵀR⁻¹H). The first factor is independent of x: the expected-measurement density and normalisation constant; the second is the posterior.</p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN3[2].id} q={EXPLAIN3[2].q}>
        <p>p(xₖ|𝒵ᵏ⁻¹) = ∫ 𝒩(xₖ; F xₖ₋₁, D) 𝒩(xₖ₋₁; x̂, P) dxₖ₋₁; the product formula gives 𝒩(xₖ; F x̂, F P Fᵀ + D) times a bell in xₖ₋₁ that integrates to 1. F is the transition matrix (drift), D the process-noise covariance (diffusion), e.g. from the piecewise constant white acceleration model with Δtₖ = tₖ − tₖ₋₁.</p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN3[3].id} q={EXPLAIN3[3].q}>
        <p>Bayes with Gaussian likelihood and prior; the product formula; the x-free factor cancels with the normaliser. ν = z − H x_{'{k|k−1}'} (innovation), S = H P Hᵀ + R (its covariance), W = P Hᵀ S⁻¹ (gain), x = x̂ + Wν, P = P − WSWᵀ. The gain balances trust: small when the prediction is sure or the sensor poor, large in the opposite case.</p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN3[4].id} q={EXPLAIN3[4].q}>
        <p>Because the prediction creates a covariance between position and speed (F shears the ellipse). The speed entry of the gain is P₁₂/S, so an unexpected range also corrects the speed. Without correlation, a single range measurement would not change the speed.</p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN3[5].id} q={EXPLAIN3[5].q}>
        <p>Retrodiction for Gaussians (Rauch–Tung–Striebel): run the filter forward storing filtered and predicted means/covariances, then backwards: Wₗ = Pₗ|ₗ Fᵀ Pₗ₊₁|ₗ⁻¹, xₗ|ₖ = xₗ|ₗ + Wₗ(xₗ₊₁|ₖ − xₗ₊₁|ₗ), Pₗ|ₖ = Pₗ|ₗ + Wₗ(Pₗ₊₁|ₖ − Pₗ₊₁|ₗ)Wₗᵀ. Derived from Chapter 2's retrodiction integral with the product formula.</p>
      </ExplainBack>
      <div className="cx-next">
        <a className="sx-cta" href="#/ch3">
          ← Back to the story
        </a>
        <a className="sx-cta sx-cta-ghost" href="#/ch3/deep">
          Want more? Deep dive →
        </a>
      </div>
    </PageShell>
  );
}
