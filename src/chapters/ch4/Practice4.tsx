import { ExplainBack } from '../../story/blocks';
import { PageShell } from '../../story/ChapterFrame';
import { Exercise, PlaceExercise, PMB } from '../../story/practice';
import { useProgress } from '../../story/progress';

export const EXPLAIN4: { id: string; q: string }[] = [
  { id: 'ch4-e1', q: '1. What is a sensor model? Name the two questions you answer to build one.' },
  { id: 'ch4-e2', q: '2. Why does a non-linear sensor or dynamics model break the Kalman filter?' },
  { id: 'ch4-e3', q: '3. Convert a range–bearing measurement to Cartesian: give T and T R Tᵀ and describe the ellipse.' },
  { id: 'ch4-e4', q: '4. State the EKF. What goes through f/h, what through F/H, and where are the Jacobians evaluated?' },
  { id: 'ch4-e5', q: '5. Explain the UKF in three steps and give the σ-point recipe.' },
  { id: 'ch4-e6', q: '6. Compare converted KF, EKF and UKF. When do they agree?' },
  { id: 'ch4-e7', q: '7. Why can no single Gaussian describe a TDoA likelihood, and what do you use instead?' },
];
export const EXERCISE_IDS4 = Array.from({ length: 13 }, (_, i) => `ch4-p${i + 1}`);

export default function Practice4({ onHome }: { onHome: () => void }) {
  const p = useProgress();
  const solved = EXERCISE_IDS4.filter((id) => p.exercise[id] && p.exercise[id] !== 'revealed').length;
  const canExplain = EXPLAIN4.filter((e) => p.explain[e.id] === 'yes').length;
  return (
    <PageShell
      chapterId="ch4"
      chapterLabel="Chapter 4"
      view="practice"
      onHome={onHome}
      right={
        <span className="sx-top-meta">
          {solved}/{EXERCISE_IDS4.length} solved · {canExplain}/{EXPLAIN4.length} can explain
        </span>
      }
    >
      <div className="cx-intro">
        <div className="sx-kicker">Chapter 4 · Practice</div>
        <h1 className="sx-h2">Talk them down</h1>
        <p className="sx-lead">Thirteen problems on curved sensors. Angles in degrees unless stated; convert to radians when you multiply by a distance.</p>
      </div>

      <Exercise
        id="ch4-p1"
        n={1}
        title="Polar → Cartesian"
        task={<p>The radar reports r = 20 km, φ = 30° (from the x-axis). Where is the plane?</p>}
        fields={[
          { label: 'x', answer: 17.32, tol: 0.02, unit: 'km' },
          { label: 'y', answer: 10, tol: 0.02, unit: 'km' },
        ]}
        hints={[<>x = r cos φ, y = r sin φ.</>]}
        solution={<PMB>{'x = 20\\cos 30^\\circ = 17.32,\\quad y = 20\\sin 30^\\circ = 10'}</PMB>}
      />

      <Exercise
        id="ch4-p2"
        n={2}
        title="The converted covariance"
        task={<p>Plane due north: r = 10 km, φ = 90°. σr = 50 m, σφ = 1°. Compute the diagonal of R′ = T R Tᵀ in km².</p>}
        fields={[
          { label: 'R′ₓₓ (east–west)', answer: 0.0305, tol: 0.0005, unit: 'km²' },
          { label: 'R′ᵧᵧ (north–south)', answer: 0.0025, tol: 0.0001, unit: 'km²' },
        ]}
        hints={[<>At φ = 90° the beam points along y, so the across-beam spread r·σφ lies along x.</>, <>σφ = 1° = 0.01745 rad; r·σφ = 0.1745 km.</>]}
        solution={<PMB>{"R'_{xx} = (r\\sigma_\\varphi)^2 = 0.1745^2 = 0.0305,\\qquad R'_{yy} = \\sigma_r^2 = 0.05^2 = 0.0025"}</PMB>}
      />

      <Exercise
        id="ch4-p3"
        n={3}
        title="When is the smear wider than the runway?"
        task={<p>σφ = 0.1°. Beyond what range does the across-beam spread r·σφ exceed the runway half-width, 22 m?</p>}
        fields={[{ label: 'range', answer: 12.6, tol: 0.15, unit: 'km' }]}
        hints={[<>0.1° = 0.001745 rad. Solve r · 0.001745 = 0.022 km.</>]}
        solution={<p>r = 0.022 / 0.001745 ≈ 12.6 km.</p>}
      />

      <Exercise
        id="ch4-p4"
        n={4}
        title="The radar Jacobian"
        task={<p>Plane at (x, y) = (3, 4) km. Compute the four position entries of H = ∂h/∂(x, y).</p>}
        fields={[
          { label: '∂r/∂x', answer: 0.6, tol: 0.005 },
          { label: '∂r/∂y', answer: 0.8, tol: 0.005 },
          { label: '∂φ/∂x', answer: -0.16, tol: 0.003, unit: '1/km' },
          { label: '∂φ/∂y', answer: 0.12, tol: 0.003, unit: '1/km' },
        ]}
        hints={[<>r = 5. Row 1 = (x/r, y/r), row 2 = (−y/r², x/r²).</>]}
        solution={<PMB>{'\\mathbf H = \\begin{pmatrix}0.6 & 0.8\\\\ -0.16 & 0.12\\end{pmatrix}'}</PMB>}
      />

      <Exercise
        id="ch4-p5"
        n={5}
        title="Homogeneous or heterogeneous?"
        task={<p>A second sensor measures only the range r = √(x² + y²), with its own σr. Is it homogeneous with our range–bearing radar? Type 1 for homogeneous, 0 for heterogeneous. And how many rows does its H have?</p>}
        fields={[
          { label: 'homogeneous? (1/0)', answer: 0, tol: 0 },
          { label: 'rows of H', answer: 1, tol: 0 },
        ]}
        hints={[<>Homogeneous means the same measurement function h.</>]}
        solution={<p>Heterogeneous: its h is only the first component of ours. One measured number → H has one row (x/r, y/r, 0, 0).</p>}
      />

      <Exercise
        id="ch4-p6"
        n={6}
        title="Linear or not?"
        task={<p>How many of these are linear in the state (x, y, ẋ, ẏ)? (a) 3y; (b) √(x² + y²); (c) x + Δt·ẋ; (d) atan2(y, x); (e) ẋ − ẏ.</p>}
        fields={[{ label: 'number of linear ones', answer: 3, tol: 0 }]}
        hints={[<>Linear = a sum of state entries times constants.</>]}
        solution={<p>(a), (c), (e) are linear; (b) and (d) are curved.</p>}
      />

      <Exercise
        id="ch4-p7"
        n={7}
        title="One EKF update"
        task={
          <p>
            Position-only state, prediction x̂ = (3, 4) km, P = 0.01·I. The radar reports r = 5.1 km and exactly the predicted bearing. R = diag(0.0025 km², 0.0001 rad²). Compute the updated position.
          </p>
        }
        fields={[
          { label: 'x', answer: 3.048, tol: 0.002, unit: 'km' },
          { label: 'y', answer: 4.064, tol: 0.002, unit: 'km' },
        ]}
        hints={[
          <>h(x̂) = (5, φ̂), so ν = (0.1, 0). H from Exercise 4.</>,
          <>H P Hᵀ = 0.01·H Hᵀ = diag(0.01, 0.0004). S = diag(0.0125, 0.0005).</>,
          <>Only the range column of W matters: W·(0.1, 0) = 0.01·(0.6, 0.8)/0.0125 · 0.1.</>,
        ]}
        solution={<PMB>{'\\mathbf W_{:,1} = \\frac{0.01}{0.0125}(0.6, 0.8) = (0.48, 0.64),\\quad \\hat{\\mathbf x} = (3,4) + 0.1\\,(0.48, 0.64) = (3.048, 4.064)'}</PMB>}
      />

      <Exercise
        id="ch4-p8"
        n={8}
        title="σ-points by hand"
        task={<p>n = 1, x̂ = 2, P = 4, W⁰ = 1/3. Compute the two outer σ-points and their weight.</p>}
        fields={[
          { label: 'x⁺', answer: 4.449, tol: 0.01 },
          { label: 'x⁻', answer: -0.449, tol: 0.01 },
          { label: 'weight of each', answer: 0.3333, tol: 0.002 },
        ]}
        hints={[<>Offset = √(n/(1−W⁰)·P) = √(1/(2/3)·4) = √6.</>]}
        solution={<p>x± = 2 ± √6 = 4.449 and −0.449; weights (1 − 1/3)/2 = 1/3 each. Check: mean 2, variance (1/3)(6 + 6) = 4 ✓.</p>}
      />

      <Exercise
        id="ch4-p9"
        n={9}
        title="Through a curve: UKF vs EKF"
        task={<p>Push the σ-points of Exercise 8 through h(x) = x². What mean does the UKF predict? What does the EKF predict (h of the mean)? The exact mean is 𝔼[x²] = x̂² + P.</p>}
        fields={[
          { label: 'UKF mean', answer: 8, tol: 0.02 },
          { label: 'EKF mean', answer: 4, tol: 0.02 },
          { label: 'exact', answer: 8, tol: 0.02 },
        ]}
        hints={[<>UKF: (1/3)(2² + 4.449² + 0.449²).</>]}
        solution={<p>UKF: (4 + 19.80 + 0.20)/3 = 8 — exact. EKF: h(2) = 4, off by P = 4. The EKF ignores the curvature; σ-points feel it.</p>}
      />

      <PlaceExercise
        id="ch4-p10"
        n={10}
        title="Place a σ-point"
        task={<p>2D state, x̂ = (0, 0), P = diag(9, 1), W⁰ = 0. Drag to where the σ-point x¹ sits on the x-axis.</p>}
        range={[0, 8]}
        answer={4.243}
        tol={0.35}
        unit=""
        draw={(sx, g, reveal) => (
          <>
            <line x1={sx(0)} x2={sx(8)} y1={150} y2={150} stroke="#a1a1aa" />
            {[0, 2, 4, 6, 8].map((t) => (
              <text key={t} x={sx(t)} y={168} fontSize={12} fill="#71717a" textAnchor="middle">
                {t}
              </text>
            ))}
            <ellipse cx={sx(0)} cy={150} rx={sx(3) - sx(0)} ry={30} fill="rgba(59,130,246,0.12)" stroke="#2563eb" />
            <text x={sx(3)} y={110} fontSize={12} fill="#2563eb">1σ = 3</text>
            {reveal && <circle cx={sx(4.243)} cy={150} r={7} fill="#9333ea" />}
            {g !== null && <line x1={sx(g)} x2={sx(g)} y1={60} y2={150} stroke="#18181b" strokeWidth={2} />}
          </>
        )}
        explain={
          <>
            <p>
              Offset = column of √(n/(1−W⁰)·P) = √(2·9) = <b>4.24</b> — further out than 1σ, because with n = 2 each outer point carries only weight 1/4.
            </p>
            <PMB>{'\\mathbf x^1 = \\hat{\\mathbf x} + \\big(\\sqrt{2\\mathbf P}\\big)_1 = (\\sqrt{18},\\,0) = (4.24, 0)'}</PMB>
          </>
        }
      />

      <Exercise
        id="ch4-p11"
        n={11}
        title="Spot the slide typo"
        task={
          <p>
            Lecture 2, p.36 writes the EKF innovation as z − h(x_{'{k−1|k}'}). Which index is correct? Type <b>1</b> for x_{'{k|k−1}'} (predicted), <b>2</b> for x_{'{k−1|k−1}'} (previous filtered).
          </p>
        }
        fields={[{ label: 'correct form', answer: 1, tol: 0 }]}
        hints={[<>The innovation compares the new measurement with what you <i>expected</i> to measure now.</>]}
        solution={<p>x_{'{k|k−1}'}: the prediction for time k given data up to k−1. h of it is the predicted measurement.</p>}
      />

      <Exercise
        id="ch4-p12"
        n={12}
        title="TDoA"
        task={<p>Two receivers 10 km apart; the emitter is 2 km closer to receiver 1. Type 1 if the possible positions form a line, 2 for a circle, 3 for a hyperbola. If the distances were equal, what would the TDoA value be (km)?</p>}
        fields={[
          { label: 'curve (1/2/3)', answer: 3, tol: 0 },
          { label: 'TDoA for equal distances', answer: 0, tol: 0 },
        ]}
        hints={[<>A constant difference of distances to two fixed points is the definition of a hyperbola.</>]}
        solution={<p>Hyperbola. Equal distances give h_t = 0 — the special branch is the perpendicular bisector.</p>}
      />

      <Exercise
        id="ch4-p13"
        n={13}
        title="Count the σ-points"
        task={<p>How many σ-points does the UKF need for a 6D state (3D position and velocity)? And what is the weight of each outer point if W⁰ = 0.4?</p>}
        fields={[
          { label: 'number of points', answer: 13, tol: 0 },
          { label: 'outer weight', answer: 0.05, tol: 0.0005 },
        ]}
        hints={[<>2n + 1 points; outer weights (1 − W⁰)/(2n).</>]}
        solution={<p>2·6 + 1 = 13; (1 − 0.4)/12 = 0.05.</p>}
      />

      <div className="cx-intro">
        <div className="sx-kicker">For the oral exam</div>
        <h2 className="sx-h2">Explain it back</h2>
      </div>
      <ExplainBack id={EXPLAIN4[0].id} q={EXPLAIN4[0].q}>
        <p>A sensor model is the likelihood p(z|x): it holds all sensor properties and lets you simulate the sensor. Question 1: what is measured — the measurement function h. Question 2: how well — an additive, unbiased Gaussian error with covariance R. Together: z = h(x) + w ⇔ 𝒩(z; h(x), R). Same h: homogeneous sensors; different h: heterogeneous.</p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN4[1].id} q={EXPLAIN4[1].q}>
        <p>Kalman relies on two facts: a linear map of a Gaussian is Gaussian, and the product formula for 𝒩(z; Hx, R)·𝒩(x; …). With a curved f or h the transformed density is bent and skewed, the likelihood is not Gaussian in x, and the posterior is no longer Gaussian — the filter would have to store whole curves. So we approximate to keep everything Gaussian.</p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN4[2].id} q={EXPLAIN4[2].q}>
        <p>t(r, φ) = r(cos φ, sin φ). Taylor to first order around the measurement: Jacobian T = [[cos φ, −r sin φ], [sin φ, r cos φ]] = rotation D_φ × dilation diag(1, r). Linear transform of a Gaussian: R′ = T R Tᵀ = D_φ diag(σr², r²σφ²) D_φᵀ — σr along the beam, r·σφ across, so the ellipse gets longer with range and turns with the bearing. Then a normal KF with H = (I, O).</p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN4[3].id} q={EXPLAIN4[3].q}>
        <p>x_{'{k|k−1}'} = f(x_{'{k−1|k−1}'}), P = F P Fᵀ + D with F = ∂f/∂x at x_{'{k−1|k−1}'}; ν = z − h(x_{'{k|k−1}'}), S = H P Hᵀ + R, W = P Hᵀ S⁻¹ with H = ∂h/∂x at x_{'{k|k−1}'}; x = x̂ + Wν, P = P − W S Wᵀ. Mean through the true functions, covariance through the Jacobians. A bad linearisation point gives a wrong gain and can make the filter diverge.</p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN4[4].id} q={EXPLAIN4[4].q}>
        <p>“Easier to approximate a distribution than a non-linear function”: (1) choose 2n + 1 σ-points with the density’s mean and covariance — x⁰ = x̂, xⁱ = x̂ ± (√(n/(1−W⁰)P))ᵢ, weights W⁰ and (1−W⁰)/(2n); (2) push them through f or h; (3) recompute mean and covariance (+D or +R). The gain is W = Cov(x, z) Cov(z)⁻¹ — Ch 3’s P Hᵀ S⁻¹ measured from points. No derivatives needed.</p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN4[5].id} q={EXPLAIN4[5].q}>
        <p>Converted KF approximates the measurement conversion (T once per scan); EKF linearises f and h at the estimate (Jacobians each step; sensitive to the linearisation point); UKF approximates the density with σ-points (no derivatives, captures the curvature-induced shift of the mean). They agree when the functions are nearly straight over the size of the uncertainty — e.g. close to the radar or with a narrow beam. All three still output one Gaussian.</p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN4[6].id} q={EXPLAIN4[6].q}>
        <p>A TDoA measurement fixes |r − p₁| − |r − p₂|, whose solution set is a hyperbola: the likelihood is a long curved ridge, not a hump around one point. One Gaussian can’t follow it. Use a Gaussian mixture (several locally linearised Gaussians — the book’s preferred tool) or a particle filter (random samples; exact in principle but expensive).</p>
      </ExplainBack>
      <div className="cx-next">
        <a className="sx-cta" href="#/ch4">
          ← Back to the story
        </a>
        <a className="sx-cta sx-cta-ghost" href="#/ch4/deep">
          Want more? Deep dive →
        </a>
      </div>
    </PageShell>
  );
}
