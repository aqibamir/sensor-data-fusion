import { ExplainBack } from '../../story/blocks';
import { PageShell } from '../../story/ChapterFrame';
import { Exercise, PlaceExercise, PM, PMB } from '../../story/practice';
import { useProgress } from '../../story/progress';

/** Explain-back questions for Chapter 1 (also listed in the story's Revise drawer). */
export const EXPLAIN1: { id: string; q: string }[] = [
  { id: 'ch1-e1', q: '1. What is a probability density, and how do you get a probability from it?' },
  { id: 'ch1-e2', q: '2. What is a marginal density, and where does it appear in tracking?' },
  { id: 'ch1-e3', q: '3. Explain a conditional density with a table and with a picture.' },
  { id: 'ch1-e4', q: "4. Derive Bayes' rule and name each term. Where does the likelihood come from?" },
  { id: 'ch1-e5', q: '5. What do x̄ and P mean in 𝒩(x; x̄, P), and why is the Mahalanobis distance better than a ruler?' },
  { id: 'ch1-e6', q: '6. What happens to a Gaussian under a linear map? Derive the new covariance.' },
  { id: 'ch1-e7', q: '7. Why is the mean used as the estimate, and when is it misleading?' },
];
export const EXERCISE_IDS1 = ['ch1-p1', 'ch1-p2', 'ch1-p3', 'ch1-p4', 'ch1-p5', 'ch1-p6', 'ch1-p7', 'ch1-p8'];

const bell = (x: number, m: number, s2: number) => Math.exp((-0.5 * (x - m) ** 2) / s2) / Math.sqrt(2 * Math.PI * s2);

export default function Practice1({ onHome }: { onHome: () => void }) {
  const p = useProgress();
  const solved = EXERCISE_IDS1.filter((id) => p.exercise[id] && p.exercise[id] !== 'revealed').length;
  const canExplain = EXPLAIN1.filter((e) => p.explain[e.id] === 'yes').length;

  return (
    <PageShell
      chapterId="ch1"
      chapterLabel="Chapter 1"
      view="practice"
      onHome={onHome}
      right={
        <span className="sx-top-meta">
          {solved}/{EXERCISE_IDS1.length} solved · {canExplain}/{EXPLAIN1.length} can explain
        </span>
      }
    >
      <div className="cx-intro">
        <div className="sx-kicker">Chapter 1 · Practice</div>
        <h1 className="sx-h2">Now you do the maths</h1>
        <p className="sx-lead">
          Eight short problems, all on our road and radar. You compute, the app checks. Use a calculator; decimals with a comma or a point both work. Hints come one at a time; the worked solution is always there — but try first.
        </p>
        <p className="sx-p">Your results stay in this browser and only tell you what to revisit. There's no score and no timer.</p>
      </div>

      {/* 1 — density as sand */}
      <Exercise
        id="ch1-p1"
        n={1}
        title="Sand between two cones"
        task={
          <p>
            A cheap radar only tells you the car is <b>somewhere between 40 m and 60 m</b>, every position equally likely. (a) How tall is the density <PM>p(x)</PM> on that stretch? (b) What's the probability the car is between <b>45 m and 52 m</b>?
          </p>
        }
        fields={[
          { label: '(a) height p(x)', answer: 0.05, tol: 0.0005, unit: 'per m' },
          { label: '(b) P(45 < x < 52)', answer: 0.35, tol: 0.005 },
        ]}
        hints={[<>All the sand (total 1) is spread evenly over the stretch. How long is the stretch?</>, <>Height = 1 ÷ width. Probability = area = width of the cone gap × height.</>]}
        solution={
          <>
            <p>Width = 60 − 40 = 20 m, so the height is 1/20 = <b>0.05 per metre</b> (area 20 × 0.05 = 1 ✓).</p>
            <p>Between 45 and 52 m: width 7 m × 0.05 = <b>0.35</b>, a 35 % chance.</p>
          </>
        }
      />

      {/* 2 — mean and spread */}
      <Exercise
        id="ch1-p2"
        n={2}
        title="Balance point and typical miss"
        task={
          <p>
            Our belief about the car: <b>90 m</b> with probability 0.2, <b>100 m</b> with 0.5, <b>110 m</b> with 0.3. Find the expectation <PM>{'\\mathbb E[x]'}</PM>, the variance <PM>{'\\mathbb V[x]'}</PM> and the standard deviation σ.
          </p>
        }
        fields={[
          { label: '𝔼[x]', answer: 101, tol: 0.05, unit: 'm' },
          { label: '𝕍[x]', answer: 49, tol: 0.1, unit: 'm²' },
          { label: 'σ', answer: 7, tol: 0.02, unit: 'm' },
        ]}
        hints={[<>Expectation: each position × its probability, all added up.</>, <>Variance: for each position, (position − mean)², times its probability, added up. σ is its square root.</>]}
        solution={
          <>
            <PMB>{'\\mathbb E[x] = 0.2\\cdot 90 + 0.5\\cdot 100 + 0.3 \\cdot 110 = 18 + 50 + 33 = 101\\ \\text{m}'}</PMB>
            <PMB>{'\\mathbb V[x] = 0.2\\cdot(-11)^2 + 0.5\\cdot(-1)^2 + 0.3\\cdot 9^2 = 24.2 + 0.5 + 24.3 = 49\\ \\text{m}^2'}</PMB>
            <p>
              σ = √49 = <b>7 m</b>: the typical miss of a guess of 101 m.
            </p>
          </>
        }
      />

      {/* 3 — joint, marginal, conditional */}
      <Exercise
        id="ch1-p3"
        n={3}
        title="A new car park"
        task={
          <>
            <p>Another car park, another table of joint probabilities:</p>
            <table className="sx-table px-table">
              <thead>
                <tr>
                  <th></th>
                  <th>slow</th>
                  <th>fast</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>near</td>
                  <td>0.20</td>
                  <td>0.20</td>
                </tr>
                <tr>
                  <td>far</td>
                  <td>0.10</td>
                  <td>0.50</td>
                </tr>
              </tbody>
            </table>
            <p>
              Find the marginal <PM>{'p(\\text{far})'}</PM>, and the two conditionals <PM>{'p(\\text{fast}\\mid\\text{far})'}</PM> and <PM>{'p(\\text{far}\\mid\\text{fast})'}</PM>. Are the two conditionals the same?
            </p>
          </>
        }
        fields={[
          { label: 'p(far)', answer: 0.6, tol: 0.005 },
          { label: 'p(fast | far)', answer: 0.8333, tol: 0.006 },
          { label: 'p(far | fast)', answer: 0.7143, tol: 0.006 },
        ]}
        hints={[<>Marginal = add the row. Conditional = keep only the row or column you were told about, and divide by its sum.</>, <>p(fast | far): stay in the “far” row. p(far | fast): stay in the “fast” column.</>]}
        solution={
          <>
            <p>
              p(far) = 0.10 + 0.50 = <b>0.60</b>.
            </p>
            <p>
              p(fast | far) = 0.50 / 0.60 = <b>0.833</b>. p(far | fast) = 0.50 / (0.20 + 0.50) = <b>0.714</b>. Different numbers — the bar is not symmetric. That's exactly why we need Bayes.
            </p>
          </>
        }
      />

      {/* 4 — Bayes by hand */}
      <Exercise
        id="ch1-p4"
        n={4}
        title="Bayes with three lampposts"
        task={
          <>
            <p>
              Three lampposts at <b>A</b>, <b>B</b>, <b>C</b>. Before the beep we believe the car is at A, B, C with probability <b>0.5, 0.3, 0.2</b>. The radar beeps; its likelihoods <PM>{'p(z\\mid x)'}</PM> for A, B, C are <b>0.1, 0.6, 0.9</b>.
            </p>
            <p>Compute the posterior probabilities.</p>
          </>
        }
        fields={[
          { label: 'p(A | z)', answer: 0.122, tol: 0.003 },
          { label: 'p(B | z)', answer: 0.439, tol: 0.003 },
          { label: 'p(C | z)', answer: 0.439, tol: 0.003 },
        ]}
        hints={[<>Step 1: multiply prior × likelihood at each lamppost.</>, <>Step 2: add the three products. Step 3: divide each product by that sum.</>]}
        solution={
          <>
            <p>Products: 0.5·0.1 = 0.05, 0.3·0.6 = 0.18, 0.2·0.9 = 0.18. Sum = 0.41.</p>
            <p>
              Posterior: 0.05/0.41 = <b>0.122</b>, 0.18/0.41 = <b>0.439</b>, 0.18/0.41 = <b>0.439</b>. A was the favourite, but the radar strongly disagreed; B and C now tie — B had the better prior, C the better likelihood.
            </p>
          </>
        }
      />

      {/* 5 — place the posterior by eye */}
      <PlaceExercise
        id="ch1-p5"
        n={5}
        title="Where does the new belief land?"
        task={
          <p>
            Prior belief: a bell around <b>100 m</b> with σ = 4 m (green). The radar reads <b>110 m</b> with error σ = 3 m (red likelihood). Without computing — just like in Scene 8 — drag your guess to where the <b>posterior</b> peaks.
          </p>
        }
        range={[92, 116]}
        answer={106.4}
        tol={1.5}
        unit="m"
        draw={(sx, g, reveal) => {
          const xs = Array.from({ length: 241 }, (_, i) => 92 + (24 * i) / 240);
          const path = (f: (x: number) => number) => xs.map((x, i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${(180 - f(x) * 900).toFixed(1)}`).join('');
          return (
            <>
              <line x1={sx(92)} x2={sx(116)} y1={180} y2={180} stroke="#a1a1aa" />
              {[95, 100, 105, 110, 115].map((t) => (
                <text key={t} x={sx(t)} y={196} fontSize={12} fill="#71717a" textAnchor="middle">
                  {t}
                </text>
              ))}
              <path d={path((x) => bell(x, 100, 16))} fill="none" stroke="#16a34a" strokeWidth={3} />
              <path d={path((x) => bell(110, x, 9))} fill="none" stroke="#dc2626" strokeWidth={3} strokeDasharray="7 5" />
              {reveal && <path d={path((x) => bell(x, 106.4, 5.76))} fill="none" stroke="#2563eb" strokeWidth={3.5} />}
              {g !== null && <line x1={sx(g)} x2={sx(g)} y1={20} y2={180} stroke="#18181b" strokeWidth={2} />}
              {g !== null && (
                <text x={sx(g)} y={14} fontSize={12} textAnchor="middle" fill="#18181b">
                  your guess
                </text>
              )}
            </>
          );
        }}
        explain={
          <>
            <p>
              The posterior (blue) peaks at <b>106.4 m</b>: between the prior and the reading, closer to the reading, because the radar (σ = 3) is surer than the prior (σ = 4). And it's narrower than both: σ = 2.4 m.
            </p>
            <p>Where do those numbers come from? Multiplying two bells gives a bell; Chapter 3 derives the exact rule (the Kalman update):</p>
            <PMB>{'\\bar x_{\\text{new}} = 100 + \\frac{16}{16 + 9}(110 - 100) = 106.4, \\qquad \\sigma^2_{\\text{new}} = 16 - \\frac{16^2}{16+9} = 5.76'}</PMB>
          </>
        }
      />

      {/* 6 — how many sigma */}
      <Exercise
        id="ch1-p6"
        n={6}
        title="How surprising is this pin?"
        task={
          <>
            <p>(a) A bell with σ = 5 m around 100 m. How tall is it at 110 m, as a fraction of its peak?</p>
            <p>
              (b) The car-park radar from Scene 10: along the beam σ = 10 m, across it σ = 40 m. A pin arrives <b>25 m along</b> and <b>20 m across</b> from where we expected. Compute the squared Mahalanobis distance <PM>{'d^2'}</PM> and <PM>d</PM> (in σ).
            </p>
          </>
        }
        fields={[
          { label: '(a) height ÷ peak', answer: 0.1353, tol: 0.003 },
          { label: '(b) d²', answer: 6.5, tol: 0.05 },
          { label: '(b) d', answer: 2.55, tol: 0.02, unit: 'σ' },
        ]}
        hints={[<>(a) 110 m is how many σ away? The bell's shape is e^(−½ · (that)²).</>, <>(b) The two directions are independent here: d² = (miss along ÷ σ along)² + (miss across ÷ σ across)².</>]}
        solution={
          <>
            <p>(a) 110 m is 2σ away → e^(−½·2²) = e^(−2) = <b>0.135</b> of the peak.</p>
            <PMB>{'\\text{(b)}\\quad d^2 = \\Big(\\frac{25}{10}\\Big)^2 + \\Big(\\frac{20}{40}\\Big)^2 = 6.25 + 0.25 = 6.5, \\qquad d = \\sqrt{6.5} \\approx 2.55\\,\\sigma'}</PMB>
            <p>Almost all of the surprise comes from the 25 m along the beam, where the radar is accurate.</p>
          </>
        }
      />

      {/* 7 — A X A^T */}
      <Exercise
        id="ch1-p7"
        n={7}
        title="Drive a belief for two seconds"
        task={
          <>
            <p>
              Position σ = 4 m, speed σ = 1 m/s, no correlation: <PM>{'\\mathbf X = \\begin{pmatrix}16 & 0\\\\ 0 & 1\\end{pmatrix}'}</PM>. The car drives for <b>Δt = 2 s</b>: <PM>{'\\mathbf A = \\begin{pmatrix}1 & 2\\\\ 0 & 1\\end{pmatrix}'}</PM>.
            </p>
            <p>
              Compute <PM>{'\\mathbf A\\mathbf X\\mathbf A^\\top'}</PM>: the new position variance, the new covariance between position and speed, and the new position σ.
            </p>
          </>
        }
        fields={[
          { label: 'position variance', answer: 20, tol: 0.05, unit: 'm²' },
          { label: 'covariance', answer: 2, tol: 0.05, unit: 'm²/s' },
          { label: 'position σ', answer: 4.47, tol: 0.02, unit: 'm' },
        ]}
        hints={[<>First compute A X (row times column), then multiply by Aᵀ = [[1, 0], [2, 1]].</>, <>A X = [[16, 2], [0, 1]]. Now (A X) Aᵀ.</>]}
        solution={
          <>
            <PMB>{'\\mathbf A\\mathbf X = \\begin{pmatrix}16 & 2\\\\ 0 & 1\\end{pmatrix}, \\qquad \\mathbf A\\mathbf X\\mathbf A^\\top = \\begin{pmatrix}16 & 2\\\\ 0 & 1\\end{pmatrix}\\begin{pmatrix}1 & 0\\\\ 2 & 1\\end{pmatrix} = \\begin{pmatrix}20 & 2\\\\ 2 & 1\\end{pmatrix}'}</PMB>
            <p>
              Position variance 16 → <b>20</b> (σ = √20 ≈ <b>4.47 m</b>): two seconds of uncertain speed (Δt² · 1 = 4) added to it. Covariance <b>2</b>: position and speed are now linked. Speed variance unchanged.
            </p>
          </>
        }
      />

      {/* 8 — matrix machine */}
      <Exercise
        id="ch1-p8"
        n={8}
        title="Run the machine"
        task={
          <p>
            <PM>{'\\mathbf A = \\begin{pmatrix}2 & 1\\\\ 0 & 3\\end{pmatrix}'}</PM> and <PM>{'\\mathbf x = (1, 2)^\\top'}</PM>. Compute both entries of <PM>{'\\mathbf A\\mathbf x'}</PM> and the determinant <PM>{'|\\mathbf A|'}</PM>. By what factor does this machine scale areas?
          </p>
        }
        fields={[
          { label: '(A x)₁', answer: 4, tol: 0.01 },
          { label: '(A x)₂', answer: 6, tol: 0.01 },
          { label: '|A|', answer: 6, tol: 0.01 },
        ]}
        hints={[<>Row times column: first row (2, 1) · (1, 2), second row (0, 3) · (1, 2).</>, <>For a 2×2 matrix [[a, b], [c, d]]: |A| = a·d − b·c.</>]}
        solution={
          <>
            <p>A x = (2·1 + 1·2, 0·1 + 3·2) = <b>(4, 6)</b>.</p>
            <p>|A| = 2·3 − 1·0 = <b>6</b>: every area is multiplied by 6 (the unit square becomes a parallelogram of area 6).</p>
          </>
        }
      />

      <div className="cx-intro">
        <div className="sx-kicker">For the oral exam</div>
        <h2 className="sx-h2">Explain it back</h2>
        <p className="sx-p">
          Say each answer out loud — as if the examiner just asked — then open the model answer and rate yourself honestly. “Not yet” is useful information, not a failure.
        </p>
      </div>
      <ExplainBack id={EXPLAIN1[0].id} q={EXPLAIN1[0].q}>
        <p>A non-negative function with total area 1 — “probability per unit”. Probabilities are areas: P(a &lt; x &lt; b) = ∫ₐᵇ p(x) dx. A single exact value has probability zero, and a density can be larger than 1.</p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN1[1].id} q={EXPLAIN1[1].q}>
        <p>p(x) = ∫ p(x, y) dy: add up over the variable you don't care about. It's the prediction step (integrate out the old state) and the denominator in Bayes' rule.</p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN1[2].id} q={EXPLAIN1[2].q}>
        <p>Keep only the part of the joint that matches what you learned, then rescale it to sum to 1: p(x|y) = p(x, y)/p(y). In the picture: slice the landscape, then stretch the slice to area 1.</p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN1[3].id} q={EXPLAIN1[3].q}>
        <p>
          p(x, z) = p(x|z)p(z) = p(z|x)p(x), so p(x|z) = p(z|x)p(x)/∫p(z|x)p(x)dx. Prior p(x), likelihood p(z|x), posterior p(x|z), normalisation in the denominator (independent of x). The likelihood comes from the sensor model: z = x + w with w ~ 𝒩(0, σ²) gives p(z|x) = 𝒩(z; x, σ²). Everything can additionally be conditioned on earlier data 𝒵 — that's the filtering step of Chapter 2.
        </p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN1[4].id} q={EXPLAIN1[4].q}>
        <p>x̄ is the mean (where the hill's top is); P the covariance (width and tilt; variances on the diagonal). The Mahalanobis distance measures misses in units of σ, direction by direction, so a 30 m miss along an accurate direction counts as much more surprising than 30 m along an inaccurate one.</p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN1[5].id} q={EXPLAIN1[5].q}>
        <p>It stays Gaussian: mean a + A x̄, covariance A X Aᵀ. Derivation: y − ȳ = A(x − x̄), so ℂ[y] = 𝔼[A(x − x̄)(x − x̄)ᵀAᵀ] = A 𝔼[(x − x̄)(x − x̄)ᵀ] Aᵀ = A X Aᵀ. Example: driving for Δt shears the (position, speed) ellipse — the Kalman prediction.</p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN1[6].id} q={EXPLAIN1[6].q}>
        <p>𝔼[(x − g)²] = 𝕍[x] + (x̄ − g)², which is smallest for g = x̄: the mean minimises the mean squared error (MMSE). It misleads when the belief has several bumps — it can land between them where the object never is — the reason PDAF “loses multimodality”.</p>
      </ExplainBack>
      <div className="cx-next">
        <a className="sx-cta" href="#/ch1">
          ← Back to the story
        </a>
        <a className="sx-cta sx-cta-ghost" href="#/ch1/deep">
          Want more? Deep dive →
        </a>
      </div>
    </PageShell>
  );
}
