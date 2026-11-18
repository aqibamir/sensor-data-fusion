import { ExplainBack } from '../../story/blocks';
import { PageShell } from '../../story/ChapterFrame';
import { Exercise, PlaceExercise, PMB } from '../../story/practice';
import { useProgress } from '../../story/progress';

export const EXPLAIN5: { id: string; q: string }[] = [
  { id: 'ch5-e1', q: '1. What is sensor data fusion? Explain “along time” vs “across space”, and homogeneous vs heterogeneous sensors.' },
  { id: 'ch5-e2', q: '2. Derive the fusion formula for two sensors from the product formula. Which assumption do you need?' },
  { id: 'ch5-e3', q: '3. Why do precisions add, and why is the formula written with inverse covariances (think of a bearing)?' },
  { id: 'ch5-e4', q: '4. Explain the square-root law and the geometric fusion gain.' },
  { id: 'ch5-e5', q: '5. Show that stacking, sequential updates and the fused measurement give the same result.' },
  { id: 'ch5-e6', q: '6. What are ghosts, and how can you get rid of them?' },
  { id: 'ch5-e7', q: '7. Measurement fusion vs track-to-track fusion: definitions, advantages, disadvantages.' },
  { id: 'ch5-e8', q: '8. Why does naive track-to-track fusion double-count, and what is a tracklet?' },
];
export const EXERCISE_IDS5 = Array.from({ length: 14 }, (_, i) => `ch5-p${i + 1}`);

const bell = (x: number, m: number, s2: number) => Math.exp((-0.5 * (x - m) ** 2) / s2) / Math.sqrt(2 * Math.PI * s2);

export default function Practice5({ onHome }: { onHome: () => void }) {
  const p = useProgress();
  const solved = EXERCISE_IDS5.filter((id) => p.exercise[id] && p.exercise[id] !== 'revealed').length;
  const canExplain = EXPLAIN5.filter((e) => p.explain[e.id] === 'yes').length;
  return (
    <PageShell
      chapterId="ch5"
      chapterLabel="Chapter 5"
      view="practice"
      onHome={onHome}
      right={
        <span className="sx-top-meta">
          {solved}/{EXERCISE_IDS5.length} solved · {canExplain}/{EXPLAIN5.length} can explain
        </span>
      }
    >
      <div className="cx-intro">
        <div className="sx-kicker">Chapter 5 · Practice</div>
        <h1 className="sx-h2">Pin it on the map</h1>
        <p className="sx-lead">Fourteen problems on combining sensors. Inverting a diagonal matrix just means inverting each diagonal entry.</p>
      </div>

      <Exercise
        id="ch5-p1"
        n={1}
        title="Two reports, one road"
        task={<p>Report 1: 100 m, σ = 10 m. Report 2: 110 m, σ = 5 m. Independent. Fused value and σ?</p>}
        fields={[
          { label: 'fused z', answer: 108, tol: 0.05, unit: 'm' },
          { label: 'fused σ', answer: 4.472, tol: 0.01, unit: 'm' },
        ]}
        hints={[<>Precisions add: 1/σ² = 1/100 + 1/25.</>, <>z = σ²(100/100 + 110/25).</>]}
        solution={<PMB>{'\\sigma^2 = \\frac{1}{0.01 + 0.04} = 20,\\quad z = 20\\,(1 + 4.4) = 108,\\quad \\sigma = \\sqrt{20} = 4.47'}</PMB>}
      />

      <Exercise
        id="ch5-p2"
        n={2}
        title="The square-root law"
        task={<p>Four identical, independent towers, each with σ = 8 (same direction). Fused σ?</p>}
        fields={[{ label: 'fused σ', answer: 4, tol: 0.01 }]}
        hints={[<>R/S: the variance divides by 4, the σ by √4.</>]}
        solution={<p>σ² = 64/4 = 16 → σ = 4. Four sensors only halve the error when they all look the same way.</p>}
      />

      <Exercise
        id="ch5-p3"
        n={3}
        title="Fusion never hurts"
        task={<p>σ₁ = 3, σ₂ = 30, independent. Fused σ?</p>}
        fields={[{ label: 'fused σ', answer: 2.985, tol: 0.005 }]}
        hints={[<>1/σ² = 1/9 + 1/900.</>]}
        solution={<p>σ² = 1/(0.1111 + 0.0011) = 8.911 → σ = 2.985 — slightly better than the good sensor, never worse.</p>}
      />

      <Exercise
        id="ch5-p4"
        n={4}
        title="Matrix weights"
        task={<p>R₁ = diag(1, 25), R₂ = diag(25, 1), z₁ = (0, 0), z₂ = (5, 5). Compute R and z.</p>}
        fields={[
          { label: 'R₁₁ (= R₂₂)', answer: 0.9615, tol: 0.001 },
          { label: 'z₁ (east)', answer: 0.1923, tol: 0.001 },
          { label: 'z₂ (north)', answer: 4.8077, tol: 0.001 },
        ]}
        hints={[<>R⁻¹ = diag(1 + 1/25, 1/25 + 1) = diag(1.04, 1.04).</>, <>z = R(R₁⁻¹z₁ + R₂⁻¹z₂) = R·(5/25, 5).</>]}
        solution={<p>R = diag(1/1.04) = diag(0.9615); z = 0.9615·(0.2, 5) = (0.192, 4.808). East comes almost entirely from sensor 1 (sharp in x), north from sensor 2 (sharp in y).</p>}
      />

      <Exercise
        id="ch5-p5"
        n={5}
        title="Bearings in information form"
        task={<p>Two bearing lines with information matrices Y₁ = diag(0, 1/4) and Y₂ = diag(1/9, 0). Fused covariance? (Each one alone has no covariance — why?)</p>}
        fields={[
          { label: 'R₁₁', answer: 9, tol: 0.01 },
          { label: 'R₂₂', answer: 4, tol: 0.01 },
        ]}
        hints={[<>Add the information matrices first, invert at the end.</>]}
        solution={<p>Y = diag(1/9, 1/4) → R = diag(9, 4). Alone, each Y is singular (zero information along its line), so its inverse doesn't exist — that's why fusion is written with inverses.</p>}
      />

      <Exercise
        id="ch5-p6"
        n={6}
        title="Geometry"
        task={<p>Two identical sensors, each σ = 1 across and σ = 10 along their line of sight, looking at 90° to each other. What is the fused σ in each direction? (Type 1 if 10° apart would be better, 2 if worse.)</p>}
        fields={[
          { label: 'fused σ', answer: 0.995, tol: 0.003 },
          { label: '10° apart: better (1) / worse (2)', answer: 2, tol: 0 },
        ]}
        hints={[<>In the x–y frame: Y₁ = diag(1/100, 1), Y₂ = diag(1, 1/100).</>]}
        solution={<p>Y = diag(1.01, 1.01) → σ = 1/√1.01 = 0.995 in both directions: round and small. At 10° both long axes point nearly the same way, so the along-line error stays large — worse.</p>}
      />

      <PlaceExercise
        id="ch5-p7"
        n={7}
        title="Where does the fused report sit?"
        task={<p>Report 1 at 0 with σ = 2; report 2 at 6 with σ = 1. Drag to the fused value.</p>}
        range={[-2, 8]}
        answer={4.8}
        tol={0.3}
        unit=""
        draw={(sx, g, reveal) => {
          const xs = Array.from({ length: 201 }, (_, i) => -2 + (10 * i) / 200);
          const path = (f: (x: number) => number) => xs.map((x, i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${(180 - f(x) * 300).toFixed(1)}`).join('');
          return (
            <>
              <line x1={sx(-2)} x2={sx(8)} y1={180} y2={180} stroke="#a1a1aa" />
              {[-2, 0, 2, 4, 6, 8].map((t) => (
                <text key={t} x={sx(t)} y={196} fontSize={12} fill="#71717a" textAnchor="middle">
                  {t}
                </text>
              ))}
              <path d={path((x) => bell(x, 0, 4))} fill="none" stroke="#f97316" strokeWidth={3} />
              <path d={path((x) => bell(x, 6, 1))} fill="none" stroke="#14b8a6" strokeWidth={3} />
              {reveal && <path d={path((x) => bell(x, 4.8, 0.8))} fill="none" stroke="#2563eb" strokeWidth={3.5} />}
              {g !== null && <line x1={sx(g)} x2={sx(g)} y1={20} y2={180} stroke="#18181b" strokeWidth={2} />}
            </>
          );
        }}
        explain={
          <>
            <p>The sharper report counts four times as much: z = (0/4 + 6/1)/(1/4 + 1) = <b>4.8</b>, variance 0.8.</p>
            <PMB>{'z = \\frac{0\\cdot\\frac14 + 6\\cdot 1}{\\frac14 + 1} = 4.8'}</PMB>
          </>
        }
      />

      <Exercise
        id="ch5-p8"
        n={8}
        title="Stack it"
        task={<p>State x = (x, y, ẋ, ẏ). Two sensors measure the position (H = (I, O)), a third measures only x. What are the sizes of the stacked H and R?</p>}
        fields={[
          { label: 'H rows', answer: 5, tol: 0 },
          { label: 'H columns', answer: 4, tol: 0 },
          { label: 'R rows (= columns)', answer: 5, tol: 0 },
        ]}
        hints={[<>Rows add up: 2 + 2 + 1.</>]}
        solution={<p>H is 5×4, R = diag(R₁, R₂, σ₃²) is 5×5. The fused-measurement formula would not work here — the H differ — but stacking does.</p>}
      />

      <Exercise
        id="ch5-p9"
        n={9}
        title="Sequential = fused"
        task={<p>Prior 𝒩(90, 100). Update with z₁ = 100 (σ² = 100), then with z₂ = 110 (σ² = 25). Compare with one update using the fused report (108, 20).</p>}
        fields={[
          { label: 'sequential mean', answer: 105, tol: 0.05 },
          { label: 'sequential variance', answer: 16.667, tol: 0.01 },
          { label: 'fused-update mean', answer: 105, tol: 0.05 },
        ]}
        hints={[<>After z₁: mean 95, variance 50.</>, <>Then 1/P = 1/50 + 1/25 and mean = P(95/50 + 110/25).</>]}
        solution={<p>Sequential: 1/P = 1/50 + 1/25 → P = 16.67, mean = 16.67·(1.9 + 4.4) = 105. Fused: 1/P = 1/100 + 1/20 → 16.67, mean = 16.67·(0.9 + 5.4) = 105. Identical.</p>}
      />

      <Exercise
        id="ch5-p10"
        n={10}
        title="More often, more reliably"
        task={<p>Towers report every 10 and 15 minutes; they see the smoke with probabilities 0.6 and 0.7. Mean cumulative interval T_c and combined P_D?</p>}
        fields={[
          { label: 'T_c', answer: 6, tol: 0.01, unit: 'min' },
          { label: 'P_D', answer: 0.88, tol: 0.002 },
        ]}
        hints={[<>1/T_c = 1/10 + 1/15.</>, <>P_D = 1 − (1 − 0.6)(1 − 0.7).</>]}
        solution={<p>1/T_c = 0.1667 → T_c = 6 min. P_D = 1 − 0.4·0.3 = 0.88.</p>}
      />

      <Exercise
        id="ch5-p11"
        n={11}
        title="Count the ghosts"
        task={<p>Two fires, two bearing-only towers. How many line crossings, and how many ghosts? With a third tower in general position, at how many points do all three lines meet?</p>}
        fields={[
          { label: 'crossings', answer: 4, tol: 0 },
          { label: 'ghosts', answer: 2, tol: 0 },
          { label: 'triple points', answer: 2, tol: 0 },
        ]}
        hints={[<>Each of A’s 2 lines crosses each of B’s 2 lines.</>]}
        solution={<p>2 × 2 = 4 crossings, 2 real, 2 ghosts. A third tower's lines pass only through the real fires, so only 2 points have all three lines.</p>}
      />

      <Exercise
        id="ch5-p12"
        n={12}
        title="A tracklet"
        task={<p>A tower's logbook: predicted 𝒩(8, 20), filtered 𝒩(10, 5). What does its tracklet (the new information alone) say?</p>}
        fields={[
          { label: 'tracklet variance P*', answer: 6.667, tol: 0.01 },
          { label: 'tracklet mean x*', answer: 10.667, tol: 0.01 },
        ]}
        hints={[<>1/P* = 1/5 − 1/20.</>, <>x* = P*(10/5 − 8/20).</>]}
        solution={<PMB>{'\\frac1{P^*} = \\frac15 - \\frac1{20} = \\frac3{20},\\ P^* = 6.67,\\quad x^* = 6.67\\,(2 - 0.4) = 10.67'}</PMB>}
      />

      <Exercise
        id="ch5-p13"
        n={13}
        title="Name the architecture"
        task={
          <p>
            (a) Radars send all plots to one centre. (b) Ships each run a tracker and radio their tracks to headquarters. (c) Two centres both receive all plots. (d) Drones send their tracks to two ground stations. How many are track-to-track fusion? How many are distributed?
          </p>
        }
        fields={[
          { label: 'track-to-track', answer: 2, tol: 0 },
          { label: 'distributed', answer: 2, tol: 0 },
        ]}
        hints={[<>Track-to-track: estimates are sent. Distributed: more than one fusion centre.</>]}
        solution={<p>Track-to-track: (b), (d). Distributed: (c), (d). (a) is centralized measurement fusion.</p>}
      />

      <Exercise
        id="ch5-p14"
        n={14}
        title="Counted twice"
        task={<p>A 2D report is entered twice, so the tracker believes a covariance half as big as the truth. How often (in %) does its “95%” ellipse (χ² = 5.99) actually contain the fire?</p>}
        fields={[{ label: 'true coverage', answer: 77.7, tol: 0.5, unit: '%' }]}
        hints={[<>The claimed ellipse is the true 95% ellipse scaled so χ² = 5.99/2 under the truth.</>, <>For 2 dimensions: P(χ² ≤ c) = 1 − e^{'{−c/2}'}.</>]}
        solution={<p>1 − e^{'{−5.99/4}'} = 1 − 0.224 = 77.7%. It claims 95% and delivers less than 78% — overconfidence.</p>}
      />

      <div className="cx-intro">
        <div className="sx-kicker">For the oral exam</div>
        <h2 className="sx-h2">Explain it back</h2>
      </div>
      <ExplainBack id={EXPLAIN5[0].id} q={EXPLAIN5[0].q}>
        <p>Tracking processes data along time with evolution models (predict, filter, retrodict); fusion combines data across space — from spatially distributed sensors (same kind, different places: homogeneous, same measurement function h) or complementary ones (different kinds, heterogeneous h). The goal is one consistent estimate better than any single sensor’s.</p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN5[1].id} q={EXPLAIN5[1].q}>
        <p>With independent errors, p(z₁, z₂|x) = 𝒩(z₁; Hx, R₁) 𝒩(z₂; Hx, R₂). Swap to 𝒩(Hx; z₁, R₁), apply the product formula: ∝ 𝒩(Hx; z, R) with R = (R₁⁻¹ + R₂⁻¹)⁻¹ and z = R(R₁⁻¹z₁ + R₂⁻¹z₂). The dropped factor 𝒩(z₁; z₂, R₁ + R₂) measures how well the reports agree (gating later). For S sensors by induction: R = (Σ Rₛ⁻¹)⁻¹, z = R Σ Rₛ⁻¹ zₛ.</p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN5[2].id} q={EXPLAIN5[2].q}>
        <p>Inverse covariance is information; independent evidence adds information (completing the square adds the quadratic coefficients). A bearing gives zero information along its line, so its covariance is infinite there and R does not exist — but R⁻¹ does. Adding information matrices from different directions gives an invertible sum: you invert only at the end.</p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN5[3].id} q={EXPLAIN5[3].q}>
        <p>Identical sensors in the same orientation: z is the plain mean and R/S — σ shrinks only by √S. Ellipses in different orientations intersect (harmonic mean), giving a much larger reduction: the geometric fusion gain. Best when the lines of sight are near 90°; useless when they are parallel. Limits: bearings only → triangulation, ranges only → trilateration.</p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN5[4].id} q={EXPLAIN5[4].q}>
        <p>Stacking: z = (z₁; z₂), H = (H₁; H₂), R = diag(R₁, R₂) in one Kalman update. Sequential: one update per sensor without prediction in between. Fused: one update with (z, R) from the Fusion Equation (needs equal H). All give the same posterior because each computes prior × p(z₁|x) × p(z₂|x) — in information form P⁻¹ + Σ HᵀRₛ⁻¹H — just in a different order.</p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN5[5].id} q={EXPLAIN5[5].q}>
        <p>With several objects and bearing-only sensors, every bearing of one sensor crosses every bearing of the other; not all crossings are objects — the extra ones are ghosts (2 objects, 2 sensors: 4 crossings, 2 ghosts). A third sensor in a new direction confirms only the real ones. With missed, false or merged reports de-ghosting is hard: it is a data association problem.</p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN5[6].id} q={EXPLAIN5[6].q}>
        <p>Measurement fusion sends raw reports and their R to the fusion centre(s); track-to-track fusion sends each site’s local estimate and covariance. Measurement fusion is closer to optimal. Track-to-track: less channel load (clutter and false tracks removed locally), robust to registration errors and site failures; but slower, poorer track quality and initiation, and hard with passive sensors that cannot form tracks alone. Centralized = one fusion centre, distributed = several; full- vs reduced-rate communication.</p>
      </ExplainBack>
      <ExplainBack id={EXPLAIN5[7].id} q={EXPLAIN5[7].q}>
        <p>Local tracks share the same prior (initial guess and dynamics model), so their errors are correlated; the Fusion Equation assumes independence and counts the shared part twice — overconfident. A Frenkel tracklet recovers the local likelihood as filtered ÷ predicted: (P*)⁻¹ = P_{'{k|k}'}⁻¹ − P_{'{k|k−1}'}⁻¹ — posterior information minus prior information. Tracklets are independent and can be fused exactly, then combined with the global prior by Bayes.</p>
      </ExplainBack>
      <div className="cx-next">
        <a className="sx-cta" href="#/ch5">
          ← Back to the story
        </a>
        <a className="sx-cta sx-cta-ghost" href="#/ch5/deep">
          Want more? Deep dive →
        </a>
      </div>
    </PageShell>
  );
}
