import { ExplainBack } from '../../story/blocks';
import { PageShell } from '../../story/ChapterFrame';
import { Exercise, PlaceExercise, PM, PMB } from '../../story/practice';
import { useProgress } from '../../story/progress';

export const EXPLAIN2: { id: string; q: string }[] = [
  { id: 'ch2-e1', q: '1. What is the basic idea of Bayesian tracking? Name the three steps and what each one uses.' },
  { id: 'ch2-e2', q: '2. Derive the prediction (Chapman–Kolmogorov) equation and name every move.' },
  { id: 'ch2-e3', q: '3. What is the Markov property, where is it used, and why does it NOT mean the past is useless?' },
  { id: 'ch2-e4', q: '4. Derive the filtering equation. Which assumption lets you write the likelihood as ℓ(xₖ; zₖ)?' },
  { id: 'ch2-e5', q: '5. What is p(zₖ | 𝒵ᵏ⁻¹), why is it wider than the prediction, and what is it used for?' },
  { id: 'ch2-e6', q: '6. What is retrodiction, how is it computed, and why can it not help you steer?' },
];
export const EXERCISE_IDS2 = ['ch2-p1', 'ch2-p2', 'ch2-p3', 'ch2-p4', 'ch2-p5', 'ch2-p6', 'ch2-p7'];

const bell = (x: number, m: number, s2: number) => Math.exp((-0.5 * (x - m) ** 2) / s2) / Math.sqrt(2 * Math.PI * s2);

export default function Practice2({ onHome }: { onHome: () => void }) {
  const p = useProgress();
  const solved = EXERCISE_IDS2.filter((id) => p.exercise[id] && p.exercise[id] !== 'revealed').length;
  const canExplain = EXPLAIN2.filter((e) => p.explain[e.id] === 'yes').length;
  return (
    <PageShell
      chapterId="ch2"
      chapterLabel="Chapter 2"
      view="practice"
      onHome={onHome}
      right={
        <span className="sx-top-meta">
          {solved}/{EXERCISE_IDS2.length} solved · {canExplain}/{EXPLAIN2.length} can explain
        </span>
      }
    >
      <div className="cx-intro">
        <div className="sx-kicker">Chapter 2 · Practice</div>
        <h1 className="sx-h2">Navigate it yourself</h1>
        <p className="sx-lead">Seven problems on our sea lane. Predict, sight, filter, look back — by hand. Use a calculator; commas or points both work.</p>
        <p className="sx-p">Results stay in this browser and only show you what to revisit.</p>
      </div>

      <Exercise
        id="ch2-p1"
        n={1}
        title="Read the logbook"
        task={
          <p>
            The examiner writes <PM>{'p(x_6 \\mid \\mathcal Z^4)'}</PM>. (a) Which hour is it about? (b) How many sightings were used? (c) Type 1 if it's a prediction, 2 for filtering, 3 for retrodiction.
          </p>
        }
        fields={[
          { label: '(a) hour', answer: 6, tol: 0 },
          { label: '(b) sightings used', answer: 4, tol: 0 },
          { label: '(c) 1 / 2 / 3', answer: 1, tol: 0 },
        ]}
        hints={[<>Left of the bar: the hour. Right of the bar: the logbook up to which hour.</>, <>Asking about a later hour than your data reaches is a prediction.</>]}
        solution={<p>Hour <b>6</b>, using sightings z₁…z₄ (<b>4</b>). Since 6 &gt; 4, it's a <b>prediction</b> — two hours ahead of the last sighting.</p>}
      />

      <Exercise
        id="ch2-p2"
        n={2}
        title="Sail one hour (table)"
        task={
          <p>
            Belief now: <b>0 nm: 0.5</b>, <b>10 nm: 0.5</b>. Each hour the ship moves one cell (+10 nm) with probability 0.7, or two cells (+20 nm) with 0.3. Predict the belief one hour later at 10, 20 and 30 nm.
          </p>
        }
        fields={[
          { label: 'p(10 nm)', answer: 0.35, tol: 0.003 },
          { label: 'p(20 nm)', answer: 0.5, tol: 0.003 },
          { label: 'p(30 nm)', answer: 0.15, tol: 0.003 },
        ]}
        hints={[<>For each new cell: list every old cell it could have come from, multiply (was there) × (that move), add.</>, <>20 nm can be reached from 0 nm (+2) or from 10 nm (+1).</>]}
        solution={
          <>
            <p>10 nm: only from 0 (+1): 0.5 × 0.7 = <b>0.35</b>.</p>
            <p>20 nm: from 0 (+2): 0.5 × 0.3 = 0.15, from 10 (+1): 0.5 × 0.7 = 0.35 → <b>0.50</b>.</p>
            <p>30 nm: from 10 (+2): 0.5 × 0.3 = <b>0.15</b>. Total 1.00 ✓.</p>
          </>
        }
      />

      <Exercise
        id="ch2-p3"
        n={3}
        title="Three hours of fog"
        task={
          <p>
            Our belief has variance <b>P = 4 nm²</b>. Each hour of sailing adds <b>q = 9 nm²</b>. After <b>3 hours</b> without a sighting, what are the variance and σ?
          </p>
        }
        fields={[
          { label: 'variance', answer: 31, tol: 0.05, unit: 'nm²' },
          { label: 'σ', answer: 5.568, tol: 0.02, unit: 'nm' },
        ]}
        hints={[<>Independent pushes: variances add, one q per hour.</>, <>σ is the square root of the variance.</>]}
        solution={<PMB>{'P + 3q = 4 + 27 = 31\\ \\text{nm}^2, \\qquad \\sigma = \\sqrt{31} \\approx 5.57\\ \\text{nm}'}</PMB>}
      />

      <Exercise
        id="ch2-p4"
        n={4}
        title="The lighthouse (filter by hand)"
        task={
          <p>
            Prediction for three cells A, B, C: <b>0.2, 0.5, 0.3</b>. The lighthouse sighting has likelihoods <b>0.9, 0.3, 0.1</b>. Compute the filtered belief.
          </p>
        }
        fields={[
          { label: 'p(A | 𝒵ᵏ)', answer: 0.5, tol: 0.003 },
          { label: 'p(B | 𝒵ᵏ)', answer: 0.4167, tol: 0.003 },
          { label: 'p(C | 𝒵ᵏ)', answer: 0.0833, tol: 0.003 },
        ]}
        hints={[<>Multiply prediction × likelihood in each cell.</>, <>Then divide each product by the sum of all three.</>]}
        solution={
          <>
            <p>Products: 0.18, 0.15, 0.03. Sum 0.36.</p>
            <p>
              Filtered: <b>0.500, 0.417, 0.083</b>. B was the favourite before, but the light pointed to A.
            </p>
          </>
        }
      />

      <Exercise
        id="ch2-p5"
        n={5}
        title="Where should the light appear?"
        task={
          <p>
            Prediction: mean 40 nm, <b>σ = 4 nm</b>. Sighting error: <b>σ = 3 nm</b>. (a) What's the σ of the expected sighting <PM>{'p(z_k\\mid\\mathcal Z^{k-1})'}</PM>? (b) A light appears at 55 nm. How many of those σ away is it?
          </p>
        }
        fields={[
          { label: '(a) σ of expected sighting', answer: 5, tol: 0.02, unit: 'nm' },
          { label: '(b) distance', answer: 3, tol: 0.02, unit: 'σ' },
        ]}
        hints={[<>z = x + w with independent errors: add the variances, not the σ's.</>, <>(55 − 40) ÷ σ of the expected sighting.</>]}
        solution={
          <>
            <PMB>{'\\sigma_z = \\sqrt{4^2 + 3^2} = \\sqrt{25} = 5\\ \\text{nm}, \\qquad \\frac{55 - 40}{5} = 3\\,\\sigma'}</PMB>
            <p>3σ out: a suspicious light. Ours — or a false one? (Gating, Chapter 6.)</p>
          </>
        }
      />

      <Exercise
        id="ch2-p6"
        n={6}
        title="The inquiry (retrodiction by hand)"
        task={
          <>
            <p>
              At hour 0 the ship is in the <b>west</b> or <b>east</b> channel, 50/50. Each hour it stays in its channel with probability 0.8 and switches with 0.2. At hour 1 a sighting gives likelihoods <b>west 0.1, east 0.9</b>.
            </p>
            <p>
              (a) The filtered belief at hour 1: <PM>{'p(x_1 = \\text{east}\\mid \\mathcal Z^1)'}</PM>? (b) The inquiry: <PM>{'p(x_0 = \\text{east}\\mid \\mathcal Z^1)'}</PM>?
            </p>
          </>
        }
        fields={[
          { label: '(a) east at hour 1', answer: 0.9, tol: 0.003 },
          { label: '(b) east at hour 0 (retrodicted)', answer: 0.74, tol: 0.003 },
        ]}
        hints={[
          <>(a) Predict hour 1 first (it stays 50/50 by symmetry), then multiply by the likelihood and rescale.</>,
          <>(b) If the ship is east at hour 1, how likely was it east at hour 0? Bayes: 0.8 × 0.5 / 0.5 = 0.8. If west at hour 1: 0.2.</>,
          <>(b) Average those over the hour-1 belief: 0.8 × p(east₁) + 0.2 × p(west₁).</>,
        ]}
        solution={
          <>
            <p>(a) Prediction 0.5/0.5; × likelihood → 0.05, 0.45; rescale → west 0.1, east <b>0.9</b>.</p>
            <p>(b) p(east₀ | east₁) = 0.8, p(east₀ | west₁) = 0.2. So p(east₀ | 𝒵¹) = 0.8 · 0.9 + 0.2 · 0.1 = <b>0.74</b>.</p>
            <p>At hour 0 the navigator said 50/50. The inquiry, knowing about hour 1, says 74 % east. Later evidence rewrote the past.</p>
          </>
        }
      />

      <PlaceExercise
        id="ch2-p7"
        n={7}
        title="Where does the light pull the belief?"
        task={
          <p>
            Prediction (green): 40 nm, σ = 4 nm. The lighthouse puts us at <b>50 nm</b>, σ = 4 nm (red). Both equally sure. Drag your guess to where the filtered belief peaks.
          </p>
        }
        range={[30, 60]}
        answer={45}
        tol={1.5}
        unit="nm"
        draw={(sx, g, reveal) => {
          const xs = Array.from({ length: 241 }, (_, i) => 30 + (30 * i) / 240);
          const path = (f: (x: number) => number) => xs.map((x, i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${(180 - f(x) * 900).toFixed(1)}`).join('');
          return (
            <>
              <line x1={sx(30)} x2={sx(60)} y1={180} y2={180} stroke="#a1a1aa" />
              {[30, 35, 40, 45, 50, 55, 60].map((t) => (
                <text key={t} x={sx(t)} y={196} fontSize={12} fill="#71717a" textAnchor="middle">
                  {t}
                </text>
              ))}
              <path d={path((x) => bell(x, 40, 16))} fill="none" stroke="#16a34a" strokeWidth={3} />
              <path d={path((x) => bell(50, x, 16))} fill="none" stroke="#dc2626" strokeWidth={3} strokeDasharray="7 5" />
              {reveal && <path d={path((x) => bell(x, 45, 8))} fill="none" stroke="#2563eb" strokeWidth={3.5} />}
              {g !== null && <line x1={sx(g)} x2={sx(g)} y1={20} y2={180} stroke="#18181b" strokeWidth={2} />}
            </>
          );
        }}
        explain={
          <>
            <p>
              Exactly halfway: <b>45 nm</b>, because both sources are equally sure. And narrower than either: variance 8 nm² instead of 16 (σ ≈ 2.8 nm) — two equal, independent pieces of evidence halve the variance.
            </p>
            <PMB>{'\\bar x = 40 + \\frac{16}{16+16}(50-40) = 45, \\qquad \\sigma^2 = 16 - \\frac{16^2}{32} = 8'}</PMB>
          </>
        }
      />

      <div className="cx-intro">
        <div className="sx-kicker">For the oral exam</div>
        <h2 className="sx-h2">Explain it back</h2>
        <p className="sx-p">Say it out loud first, then compare and rate yourself honestly.</p>
      </div>
      <ExplainBack id={EXPLAIN2[0].id} q={EXPLAIN2[0].q}>
        <p>
          Iterative updating of the conditional pdf of the state given all data. <b>Prediction</b> p(xₖ₋₁|𝒵ᵏ⁻¹) → p(xₖ|𝒵ᵏ⁻¹) uses the dynamics model (and prior knowledge such as road maps). <b>Filtering</b> p(xₖ|𝒵ᵏ⁻¹) → p(xₖ|𝒵ᵏ) uses the new data and the sensor model (likelihood). <b>Retrodiction</b> p(xₗ₊₁|𝒵ᵏ) → p(xₗ|𝒵ᵏ) uses the filtering results and the dynamics model.
        </p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN2[1].id} q={EXPLAIN2[1].q}>
        <p>
          p(xₖ|𝒵ᵏ⁻¹) = ∫ p(xₖ, xₖ₋₁|𝒵ᵏ⁻¹) dxₖ₋₁ (marginalisation) = ∫ p(xₖ|xₖ₋₁, 𝒵ᵏ⁻¹) p(xₖ₋₁|𝒵ᵏ⁻¹) dxₖ₋₁ (conditional-pdf rule) = ∫ p(xₖ|xₖ₋₁) p(xₖ₋₁|𝒵ᵏ⁻¹) dxₖ₋₁ (Markov). In words: for every new position, add up all routes from old positions, weighted by how likely each old position was.
        </p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN2[2].id} q={EXPLAIN2[2].q}>
        <p>
          Given the current state, the next state doesn't depend on older states or old data: p(xₖ|xₖ₋₁, 𝒵ᵏ⁻¹) = p(xₖ|xₖ₋₁). It's used in the prediction (and, backwards, in retrodiction). The past isn't useless — its information is already contained in the current belief, so the loop only has to carry one belief forward.
        </p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN2[3].id} q={EXPLAIN2[3].q}>
        <p>
          p(xₖ|𝒵ᵏ) = p(xₖ|zₖ, 𝒵ᵏ⁻¹) = p(zₖ|xₖ, 𝒵ᵏ⁻¹) p(xₖ|𝒵ᵏ⁻¹) / ∫ … dxₖ (Bayes with background knowledge). Assumption: given the current state, today's measurement is independent of earlier measurements, so p(zₖ|xₖ, 𝒵ᵏ⁻¹) = p(zₖ|xₖ) = ℓ(xₖ; zₖ). Result: likelihood × prediction, normalised.
        </p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN2[4].id} q={EXPLAIN2[4].q}>
        <p>
          The expected measurement: ∫ p(zₖ|xₖ) p(xₖ|𝒵ᵏ⁻¹) dxₖ, the normalisation constant of the filtering step read as a function of z. It's wider because it combines the state's uncertainty and the independent sensor error (variances add: P + R; in general S = HPHᵀ + R). Used for gating, innovation statistics, MHT hypothesis weights and track extraction.
        </p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN2[5].id} q={EXPLAIN2[5].q}>
        <p>
          p(xₗ|𝒵ᵏ) for l &lt; k: the belief about a past time using later data too, computed backwards: p(xₗ|𝒵ᵏ) = ∫ [p(xₗ₊₁|xₗ) p(xₗ|𝒵ˡ) / p(xₗ₊₁|𝒵ˡ)] p(xₗ₊₁|𝒵ᵏ) dxₗ₊₁ — only filtering and prediction results are needed. It needs future data, so it's for reconstruction (and judging hypotheses in MHT), not for real-time decisions. For Gaussians: Rauch–Tung–Striebel.
        </p>
      </ExplainBack>
      <div className="cx-next">
        <a className="sx-cta" href="#/ch2">
          ← Back to the story
        </a>
        <a className="sx-cta sx-cta-ghost" href="#/ch2/deep">
          Want more? Deep dive →
        </a>
      </div>
    </PageShell>
  );
}
