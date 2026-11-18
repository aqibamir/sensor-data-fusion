import { useEffect, useMemo, useState } from 'react';
import { coast, kfPredict, kfUpdate } from '../../engine/kalman2';
import { Ahead, Ask, Controls, Derive, Example, Formula, InOtherWords, Knob, Lead, M, P, Quiz, Readout, Rule, Table, Toggle, Trap } from '../../story/blocks';
import { Scene, StoryShell } from '../../story/StoryShell';
import { Tex } from '../../ui/Tex';
import { DEFAULTS3, EXAMPLE, EXAMPLE_FILT, Params3, STEPS3 } from './model';
import { EXPLAIN3 } from './Practice3';
import { World3 } from './World3';

const f2 = (v: number) => v.toFixed(2);
const f3 = (v: number) => v.toFixed(3);

export default function Chapter3({ onHome }: { onHome: () => void }) {
  const [p, setP] = useState<Params3>(DEFAULTS3);
  const set = <K extends keyof Params3>(k: K) => (v: Params3[K]) => setP((q) => ({ ...q, [k]: v }));
  const run = useMemo(
    () => coast({ seed: p.seed, steps: STEPS3, dt: 1, R: p.R, s2True: 0.02, s2Filter: p.s2Filter, burnAt: p.burn ? 6 : -1, burn: 1.6 }),
    [p.seed, p.R, p.s2Filter, p.burn],
  );
  const [auto, setAuto] = useState(false);
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setP((q) => (q.k >= STEPS3 ? (setAuto(false), q) : { ...q, k: q.k + 1 })), 1100);
    return () => clearInterval(id);
  }, [auto]);

  // the worked example (Scene 6), computed by the engine so text and 3D always agree
  const exPred = kfPredict(EXAMPLE_FILT, EXAMPLE.dt, EXAMPLE.s2);
  const exUpd = kfUpdate(exPred, EXAMPLE.z, EXAMPLE.R);
  const info = p.k > 0 ? run.info[p.k] : null;
  const W1 = (P: number, R: number) => P / (P + R);
  const gScale = 9 * p.Pscale;

  const scenes: Scene[] = [
    /* ============================================================ prologue */
    {
      id: 'c3-prologue',
      kicker: 'Prologue',
      title: 'Two numbers and a matrix',
      concept: 'Why the Kalman filter',
      steps: [
        {
          id: 's0.1',
          body: (
            <>
              <Lead>A spacecraft coasts from the Earth towards the Moon. Every so often a giant dish antenna on Earth bounces a radio signal off it and measures one thing: its distance.</Lead>
              <P>
                In the 1960s, the people who had to steer Apollo had exactly Chapter 2's problem: a moving object, rare and noisy measurements, and a need to know where it is <i>now</i>. Chapter 2 gave the perfect recipe — predict, measure, update, repeat. But it has a catch.
              </P>
              <P>
                The belief in Chapter 2 was a whole <b>curve</b>. On the stage it was stored as hundreds of numbers, and every prediction combined all of them with all of them. The Apollo guidance computer had about <b>4 kilobytes</b> of erasable memory and was slower than a modern pocket calculator.
              </P>
            </>
          ),
        },
        {
          id: 's0.2',
          body: (
            <>
              <Ask q="Suppose the belief were ALWAYS a bell curve. How many numbers would the computer need to remember about a (distance, speed) belief?">
                <p>
                  <b>Five.</b> Two for the mean (distance, speed) and three for the covariance matrix (two variances and one covariance — P is symmetric, Chapter 1). Not hundreds. Five. Forever.
                </p>
              </Ask>
              <P>
                That's the deal the <b>Kalman filter</b> makes: if everything is bell-shaped and every model is a straight-line (linear) one, Chapter 2's loop becomes a handful of matrix formulas — light enough for a 1960s computer, and still exact.
              </P>
              <P>
                Rudolf Kálmán published the filter in 1960. At NASA Ames, Stanley Schmidt's group quickly adapted it — in an extended, non-linear form (Chapter 4) — for Apollo's navigation. It has been inside almost every navigation system since: aircraft, phones, cars, radars.
              </P>
              <P>This chapter derives every line of it from what you already know. Nothing will be pulled out of a hat.</P>
            </>
          ),
        },
      ],
    },
    /* ============================================================ 1 */
    {
      id: 'c3-gauss',
      kicker: 'Scene 1',
      title: 'Why bells stay bells',
      concept: 'Kalman assumptions · notation',
      steps: [
        {
          id: 's1.1',
          body: (
            <>
              <P>
                The board behind the spacecraft is the <b>phase board</b>: across, the distance r; up, the speed ṙ (the dot means “rate of change”). Our belief is the blue ellipse — a bell seen from above, as in Chapter 1. The state vector is <M>{'\\mathbf x = (r, \\dot r)^\\top'}</M>.
              </P>
              <P>The Kalman filter assumes that all three ingredients of Chapter 2's loop are Gaussian (Lecture 2, slide 16):</P>
              <Formula
                tex="\begin{gathered} p(\mathbf x_{k-1}\mid\mathcal Z^{k-1}) = \mathcal N(\mathbf x_{k-1};\, \mathbf x_{k-1|k-1},\, \mathbf P_{k-1|k-1}) \\ p(\mathbf x_k\mid\mathbf x_{k-1}) = \mathcal N(\mathbf x_k;\, \mathbf F_{k|k-1}\mathbf x_{k-1},\, \mathbf D_{k|k-1}) \\ p(\mathbf z_k\mid\mathbf x_k) = \mathcal N(\mathbf z_k;\, \mathbf H_k\mathbf x_k,\, \mathbf R_k) \end{gathered}"
                rows={[
                  ['\\mathbf x_{k-1|k-1}, \\mathbf P_{k-1|k-1}', 'mean and covariance of the last belief (“k−1 given k−1”)'],
                  ['\\mathbf F_{k|k-1}', 'the dynamics matrix: how the state moves in one step'],
                  ['\\mathbf D_{k|k-1}', 'the random part of the motion (process noise covariance)'],
                  ['\\mathbf H_k', 'the measurement matrix: what the sensor sees of the state'],
                  ['\\mathbf R_k', 'the measurement error covariance'],
                ]}
              />
              <P>And these are the same models written as physics equations (slides 21 and 24):</P>
              <Formula
                tex="\mathbf x_k = \mathbf F_k\mathbf x_{k-1} + \mathbf G_k\mathbf v_k, \qquad \mathbf z_k = \mathbf H_k\mathbf x_k + \mathbf w_k"
                rows={[
                  ['\\mathbf G_k\\mathbf v_k', 'random push on the state; vₖ is Gaussian noise, Gₖ says how it enters. Its covariance is Dₖ = Gₖ Σᵥ Gₖᵀ.'],
                  ['\\mathbf w_k', 'the normally distributed measurement error, covariance Rₖ'],
                ]}
              />
              <InOtherWords>“Next state = a matrix times this state, plus Gaussian noise. Measurement = a matrix times the state, plus Gaussian noise.” Linear plus Gaussian — that's the whole assumption.</InOtherWords>
            </>
          ),
        },
        {
          id: 's1.2',
          body: (
            <>
              <P>Why does this keep the belief a bell forever? It's an argument by induction — exactly the arrows on the lecture slide:</P>
              <ol>
                <li>Start: the first belief is a bell.</li>
                <li>Prediction: a linear map of a bell is a bell (Chapter 1, A X Aᵀ), and adding independent Gaussian noise keeps it a bell. → The prior is a bell.</li>
                <li>Filtering: bell × bell is a bell (the product formula, next scene). → The posterior is a bell.</li>
                <li>So if step k−1 is a bell, step k is a bell. By induction: every step.</li>
              </ol>
              <Rule>Linear models + Gaussian noise ⇒ the belief stays Gaussian ⇒ the filter only stores a mean and a covariance.</Rule>
              <P>The subscripts say which data each one uses (Chapter 2's notation):</P>
              <Table
                head={['Symbol', 'Meaning', 'As a formula']}
                rows={[
                  [<M>{'\\mathbf x_{k|k-1}'}</M>, 'predicted mean', <M>{'\\mathbb E[\\mathbf x_k\\mid\\mathcal Z^{k-1}]'}</M>],
                  [<M>{'\\mathbf P_{k|k-1}'}</M>, 'predicted covariance', <M>{'\\mathbb C[\\mathbf x_k\\mid\\mathcal Z^{k-1}]'}</M>],
                  [<M>{'\\mathbf x_{k|k}'}</M>, 'filtered mean (the estimate)', <M>{'\\mathbb E[\\mathbf x_k\\mid\\mathcal Z^{k}]'}</M>],
                  [<M>{'\\mathbf P_{k|k}'}</M>, 'filtered covariance', <M>{'\\mathbb C[\\mathbf x_k\\mid\\mathcal Z^{k}]'}</M>],
                ]}
              />
              <Quiz
                id="ch3-q1"
                label="What does x_{k|k−1} mean?"
                q="What is x_{k|k−1}?"
                options={[
                  { t: 'The state at time k−1, using data up to k.', why: 'The first index is the time we ask about (k); the second is the data used.' },
                  { t: 'The mean of our belief about time k, using data up to k−1 — the prediction.', ok: true, why: '“k given k−1”: predicted mean.' },
                  { t: 'The measurement at time k.', why: 'Measurements are z.' },
                ]}
              />
            </>
          ),
        },
        {
          id: 's1.3',
          body: (
            <>
              <P>Three practical details, before the algebra.</P>
              <P>
                <b>The models may change every step.</b> That's why they carry indices: <M>{'\\mathbf F_{k|k-1}, \\mathbf D_{k|k-1}, \\mathbf H_k, \\mathbf R_k'}</M>. The time between two reports can differ each time (Scene 4), and a sensor's accuracy can depend on distance (Chapter 4). The formulas don't mind.
              </P>
              <P>
                <b>Sizes.</b> With a state of n numbers and a measurement of m numbers, every matrix has a fixed shape. Check it once and the formulas stop being scary:
              </P>
              <Table
                head={['Thing', 'Size', 'Our spacecraft (n = 2, m = 1)']}
                rows={[
                  ['x, x̂', 'n × 1', '2 × 1'],
                  ['P, F, D', 'n × n', '2 × 2'],
                  ['z, ν', 'm × 1', '1 × 1'],
                  ['H', 'm × n', '1 × 2: H = (1, 0)'],
                  ['R, S', 'm × m', '1 × 1'],
                  ['W (gain)', 'n × m', '2 × 1'],
                ]}
              />
              <P>
                <b>What the matrices mean</b> (the lecture's annotations): <M>{'\\mathbf F\\hat{\\mathbf x} = \\mathbb E[\\mathbf x_k\\mid\\mathbf x_{k-1}]'}</M> — where the dynamics push the mean; <M>{'\\mathbf D = \\text{Cov}[\\mathbf x_k\\mid\\mathbf x_{k-1}]'}</M> — how much they scatter it; <M>{'\\mathbf R = \\text{Cov}[\\mathbf z_k\\mid\\mathbf x_k]'}</M>; and the innovation covariance <M>{'\\mathbf S = \\text{Cov}[\\mathbf z_k\\mid\\mathcal Z^{k-1}]'}</M>.
              </P>
            </>
          ),
        },
      ],
    },
    /* ============================================================ 2 */
    {
      id: 'c3-product',
      kicker: 'Scene 2',
      title: 'Bell × bell = bell',
      concept: 'The product formula',
      steps: [
        {
          id: 's2.1',
          body: (
            <>
              <P>
                Everything in this chapter rests on one identity: the <b>product formula</b>. On the stage: a tilted bell (the prior over position and speed) and a red band (a range measurement — it only knows about position). Multiply them point by point.
              </P>
              <Controls>
                <Toggle options={['the two factors', 'their product']} value={p.prod} onChange={set('prod')} />
                <Knob label="Measurement z" value={p.pz} min={-3} max={3} step={0.05} onChange={set('pz')} fmt={f2} />
                <Knob label="Measurement variance R" value={p.pR} min={0.1} max={3} step={0.05} onChange={set('pR')} fmt={f2} />
              </Controls>
              <Ask q="The measurement says nothing about speed. Will the product's peak move in the speed direction?">
                <p>
                  <b>Yes</b> — because the prior is tilted (position and speed are correlated), sliding along position also slides along speed. Look at the blue ellipses after you switch to “their product”. This is how a radar that only measures distance still learns the speed (Scene 5).
                </p>
              </Ask>
              <P>The product is again a bell — smaller, and centred somewhere between the prior and the measurement. That's the product formula in a picture.</P>
            </>
          ),
        },
        {
          id: 's2.2',
          body: (
            <>
              <P>Here it is exactly as on the lecture slide (MHT deck, slide 11):</P>
              <Formula
                tex="\mathcal N(\mathbf z;\mathbf H\mathbf x,\mathbf R)\,\mathcal N(\mathbf x;\mathbf y,\mathbf P) = \underbrace{\mathcal N(\mathbf z;\mathbf H\mathbf y,\mathbf S)}_{\text{independent of }\mathbf x}\times\begin{cases}\mathcal N(\mathbf x;\,\mathbf y + \mathbf W\boldsymbol\nu,\ \mathbf P - \mathbf W\mathbf S\mathbf W^\top)\\ \mathcal N(\mathbf x;\,\mathbf Q(\mathbf P^{-1}\mathbf y + \mathbf H^\top\mathbf R^{-1}\mathbf z),\ \mathbf Q)\\ \mathcal N(\mathbf x;\,\mathbf y + \mathbf W\boldsymbol\nu,\ (\mathbf I - \mathbf W\mathbf H)\mathbf P)\end{cases}"
                rows={[
                  ['\\boldsymbol\\nu = \\mathbf z - \\mathbf H\\mathbf y', 'innovation: the gap between what we measured and what we expected'],
                  ['\\mathbf S = \\mathbf H\\mathbf P\\mathbf H^\\top + \\mathbf R', 'how big that gap normally is (prior uncertainty seen through H, plus sensor error)'],
                  ['\\mathbf W = \\mathbf P\\mathbf H^\\top\\mathbf S^{-1}', 'the gain: how far to move towards the measurement'],
                  ['\\mathbf Q^{-1} = \\mathbf P^{-1} + \\mathbf H^\\top\\mathbf R^{-1}\\mathbf H', 'information adds (Chapter 2, Scene 6), in matrix form'],
                ]}
              />
              <P>The three lines in the brace are the <b>same</b> bell written three ways (shown equal in the Deep dive; checked numerically in our tests). Now the proof, in one dimension (H = 1), by completing the square:</P>
              <Derive
                steps={[
                  { tex: '\\mathcal N(z;x,R)\\,\\mathcal N(x;y,P) \\propto \\exp\\!\\Big(-\\tfrac12\\Big[\\frac{(z-x)^2}{R} + \\frac{(x-y)^2}{P}\\Big]\\Big)', why: 'Write both bells; keep only the exponents (constants come back at the end).' },
                  { tex: '\\frac{(z-x)^2}{R} + \\frac{(x-y)^2}{P} = x^2\\Big(\\frac1R + \\frac1P\\Big) - 2x\\Big(\\frac zR + \\frac yP\\Big) + \\frac{z^2}{R} + \\frac{y^2}{P}', why: 'Multiply out and sort by powers of x.' },
                  { tex: '= \\frac{(x - \\mu)^2}{Q} + \\frac{(z - y)^2}{P + R}, \\qquad \\frac1Q = \\frac1P + \\frac1R,\\quad \\mu = Q\\Big(\\frac yP + \\frac zR\\Big)', why: 'Complete the square in x. What is left over (no x in it) turns out to be (z − y)² / (P + R).' },
                  { tex: '\\Rightarrow\\; \\mathcal N(z;\\,y,\\,P+R)\\;\\times\\;\\mathcal N(x;\\,\\mu,\\,Q)', why: 'Two bells: one in z only (S = P + R), one in x. The constants work out exactly — that is the product formula.' },
                  { tex: 'W = \\frac{P}{P+R}: \\quad \\mu = y + W(z - y), \\qquad Q = P - W^2(P+R) = (1 - W)P', why: 'Rewrite μ and Q with the gain: these are the first and third lines of the brace, in 1D.' },
                ]}
              />
              <Rule>The first factor, 𝒩(z; Hy, S), has no x in it. When we normalise a posterior, it's exactly what cancels — it's Chapter 2's expected measurement.</Rule>
              <Ahead>
                That “leftover” factor is not wasted: evaluated at the actual measurement, it tells how well the filter predicted the data. PDAF and MHT (Chapter 8) use it to weight competing hypotheses, IMM (Chapter 9) to weight competing motion models.
              </Ahead>
              <Quiz
                id="ch3-q2"
                label="Which factor of the product formula is independent of x?"
                q="In the product formula, which factor does not depend on x — and what is it?"
                options={[
                  { t: '𝒩(x; y + Wν, P − WSWᵀ) — the posterior.', why: 'That one is all about x.' },
                  { t: '𝒩(z; Hy, S) — the expected-measurement density, i.e. the normalisation constant.', ok: true, why: 'Exactly. It cancels in Bayes’ rule, and later chapters use its value to score hypotheses.' },
                  { t: 'Neither — both depend on x.', why: 'Look again: z, H, y and S contain no x.' },
                ]}
              />
            </>
          ),
        },
      ],
    },
    /* ============================================================ 3 */
    {
      id: 'c3-predict',
      kicker: 'Scene 3',
      title: 'Prediction',
      concept: 'x_{k|k−1} = F x, P_{k|k−1} = F P Fᵀ + D',
      steps: [
        {
          id: 's3.1',
          body: (
            <>
              <P>Chapter 2's prediction is the Chapman–Kolmogorov integral. Insert the bells and use the product formula once:</P>
              <Derive
                steps={[
                  { tex: 'p(\\mathbf x_k\\mid\\mathcal Z^{k-1}) = \\int \\mathcal N(\\mathbf x_k;\\,\\mathbf F\\mathbf x_{k-1},\\,\\mathbf D)\\;\\mathcal N(\\mathbf x_{k-1};\\,\\mathbf x_{k-1|k-1},\\,\\mathbf P_{k-1|k-1})\\,d\\mathbf x_{k-1}', why: 'Chapman–Kolmogorov (Chapter 2) with the two Gaussian ingredients.' },
                  { tex: '= \\int \\mathcal N(\\mathbf x_k;\\,\\mathbf F\\mathbf x_{k-1|k-1},\\,\\mathbf F\\mathbf P_{k-1|k-1}\\mathbf F^\\top + \\mathbf D)\\;\\mathcal N(\\mathbf x_{k-1};\\,\\dots)\\,d\\mathbf x_{k-1}', why: 'Product formula, with the roles: “z” → xₖ, “H” → F, “R” → D, “x” → xₖ₋₁. The first factor has no xₖ₋₁ in it.' },
                  { tex: '= \\mathcal N(\\mathbf x_k;\\,\\mathbf F\\mathbf x_{k-1|k-1},\\,\\mathbf F\\mathbf P_{k-1|k-1}\\mathbf F^\\top + \\mathbf D)', why: 'Pull it out of the integral; the remaining bell in xₖ₋₁ integrates to 1 (all the sand).' },
                ]}
              />
              <Formula
                tex="\mathbf x_{k|k-1} = \mathbf F_{k|k-1}\,\mathbf x_{k-1|k-1}, \qquad \mathbf P_{k|k-1} = \mathbf F_{k|k-1}\mathbf P_{k-1|k-1}\mathbf F_{k|k-1}^\top + \mathbf D_{k|k-1}"
                rows={[
                  ['\\mathbf F', 'the transition matrix — the lecture also calls it the drift: it moves the cloud'],
                  ['\\mathbf F\\mathbf P\\mathbf F^\\top', 'Chapter 1’s A X Aᵀ: the old ellipse, sheared by the motion'],
                  ['\\mathbf D', 'the diffusion matrix: it spreads the cloud (like ink in water)'],
                ]}
              />
              <TryItBoard>
                <Toggle options={['last posterior', '+ shear (F P Fᵀ)', '+ swell (+ D)']} value={p.predStage} onChange={set('predStage')} />
              </TryItBoard>
              <InOtherWords>Prediction = Chapter 1's linear map (shear) + Chapter 2's “uncertainties add” (swell). Nothing else.</InOtherWords>
              <P>Predicting several steps ahead without data is just repeating this — or using one bigger time gap in F and D. It's Chapter 2's fog, in matrix form.</P>
            </>
          ),
        },
      ],
    },
    /* ============================================================ 4 */
    {
      id: 'c3-D',
      kicker: 'Scene 4',
      title: 'Where D comes from',
      concept: 'Piecewise constant white acceleration · Δt',
      steps: [
        {
          id: 's4.1',
          body: (
            <>
              <P>
                F is pure physics. But D — “how much does the motion scatter?” — needs a model of what we <i>don't</i> know. The lecture's choice: during each interval, an unknown, random, <b>constant acceleration</b> acts; a new independent one in the next interval. Its name: the <b>piecewise constant white acceleration model</b>.
              </P>
              <Derive
                steps={[
                  { tex: 'r_k = r_{k-1} + \\dot r_{k-1}\\,\\Delta t_k + \\tfrac12 a\\,\\Delta t_k^2, \\qquad \\dot r_k = \\dot r_{k-1} + a\\,\\Delta t_k', why: 'School physics with constant acceleration a over the interval Δtₖ = tₖ − tₖ₋₁.' },
                  { tex: '\\mathbf x_k = \\underbrace{\\begin{pmatrix}1 & \\Delta t_k\\\\ 0 & 1\\end{pmatrix}}_{\\mathbf F}\\mathbf x_{k-1} + \\underbrace{\\begin{pmatrix}\\tfrac12\\Delta t_k^2\\\\ \\Delta t_k\\end{pmatrix}}_{\\mathbf G} a, \\qquad a\\sim\\mathcal N(0,\\sigma^2)', why: 'Written with matrices: this is x = F x + G v from Scene 1.' },
                  { tex: '\\mathbf D = \\mathbf G\\,\\sigma^2\\,\\mathbf G^\\top = \\sigma^2\\begin{pmatrix}\\tfrac14\\Delta t_k^4 & \\tfrac12\\Delta t_k^3\\\\ \\tfrac12\\Delta t_k^3 & \\Delta t_k^2\\end{pmatrix}', why: 'Covariance of G a: Chapter 1’s linear-map rule with A = G and X = σ².' },
                ]}
              />
              <Controls>
                <Knob label="Time gap Δt" value={p.dt} min={0.25} max={3} step={0.05} onChange={set('dt')} unit=" h" fmt={f2} />
                <Knob label="Acceleration variance σ²" value={p.s2} min={0.005} max={0.3} step={0.005} onChange={set('s2')} fmt={f3} />
              </Controls>
              <P>
                The D-ellipse on the board is <b>tilted</b>: one random push changes position and speed <i>together</i>. And Δt matters enormously — position variance grows like Δt⁴. <b>Δtₖ = tₖ − tₖ₋₁</b> carries an index because reports arrive at irregular times: a radar sweep, a missed detection, a ship's AIS message every few minutes. F and D are rebuilt for every gap.
              </P>
              <P>
                <b>From 1D to 3D.</b> The lecture writes the same model with identity blocks: <M>{'\\mathbf F = \\begin{pmatrix}\\mathbf I & \\Delta t\\,\\mathbf I\\\\ \\mathbf 0 & \\mathbf I\\end{pmatrix}'}</M> for the state (x, y, z, ẋ, ẏ, ż), with <b>I</b> the 3×3 identity. Written out:
              </P>
              <Tex
                tex="\mathbf F = \begin{pmatrix} 1&0&0&\Delta t&0&0\\ 0&1&0&0&\Delta t&0\\ 0&0&1&0&0&\Delta t\\ 0&0&0&1&0&0\\ 0&0&0&0&1&0\\ 0&0&0&0&0&1\end{pmatrix}"
                block
              />
              <P>It's our 1D (r, ṙ) story, copied three times — once for each direction.</P>
              <P>
                <b>σ is a design choice.</b> Small σ says “this object flies straight” — smooth estimates, but it lags in a manoeuvre. Large σ says “expect surprises” — quick to follow, but noisy. You'll see both in Scene 7.
              </P>
              <Quiz
                id="ch3-q3"
                label="Doubling Δt multiplies the position-variance term of D by?"
                q="If the time gap Δt doubles, the position-variance entry ¼σ²Δt⁴ of D gets multiplied by…"
                options={[
                  { t: '2', why: 'It goes with the 4th power of Δt.' },
                  { t: '4', why: 'That would be Δt², the speed-variance entry.' },
                  { t: '16', ok: true, why: '2⁴ = 16. Long gaps are expensive: half from the unknown speed change (Δt), half from where it took the object (½Δt²), squared.' },
                ]}
              />
            </>
          ),
        },
      ],
    },
    /* ============================================================ 5 */
    {
      id: 'c3-filter',
      kicker: 'Scene 5',
      title: 'Filtering',
      concept: 'ν, S, W · the Kalman update',
      steps: [
        {
          id: 's5.1',
          body: (
            <>
              <P>Chapter 2's filtering step is Bayes: likelihood × prior, normalised. Insert the bells:</P>
              <Derive
                steps={[
                  { tex: 'p(\\mathbf x_k\\mid\\mathcal Z^k) = \\frac{\\mathcal N(\\mathbf z_k;\\,\\mathbf H\\mathbf x_k,\\,\\mathbf R)\\;\\mathcal N(\\mathbf x_k;\\,\\mathbf x_{k|k-1},\\,\\mathbf P_{k|k-1})}{\\int \\mathcal N(\\mathbf z_k;\\,\\mathbf H\\mathbf x_k,\\,\\mathbf R)\\;\\mathcal N(\\mathbf x_k;\\,\\mathbf x_{k|k-1},\\,\\mathbf P_{k|k-1})\\,d\\mathbf x_k}', why: 'Chapter 2’s filtering equation with Gaussian likelihood and prior.' },
                  { tex: '= \\frac{\\mathcal N(\\mathbf z_k;\\,\\mathbf H\\mathbf x_{k|k-1},\\,\\mathbf S)\\;\\mathcal N(\\mathbf x_k;\\,\\mathbf x_{k|k-1} + \\mathbf W\\boldsymbol\\nu,\\,\\mathbf P_{k|k-1} - \\mathbf W\\mathbf S\\mathbf W^\\top)}{\\mathcal N(\\mathbf z_k;\\,\\mathbf H\\mathbf x_{k|k-1},\\,\\mathbf S)}', why: 'Product formula on top; on the bottom the same, integrated over xₖ — the x-bell gives 1, leaving 𝒩(z; Hx, S).' },
                  { tex: '= \\mathcal N(\\mathbf x_k;\\,\\mathbf x_{k|k-1} + \\mathbf W\\boldsymbol\\nu,\\,\\mathbf P_{k|k-1} - \\mathbf W\\mathbf S\\mathbf W^\\top)', why: 'The x-free factor cancels. What remains is the new belief — a bell.' },
                ]}
              />
              <P>Read off the four lines of the Kalman update. Learn them in this order — each one needs the one before:</P>
              <Formula
                tex="\begin{gathered} \boldsymbol\nu_{k|k-1} = \mathbf z_k - \mathbf H\mathbf x_{k|k-1} \qquad \mathbf S_{k|k-1} = \mathbf H\mathbf P_{k|k-1}\mathbf H^\top + \mathbf R_k \\ \mathbf W_{k|k-1} = \mathbf P_{k|k-1}\mathbf H^\top\mathbf S_{k|k-1}^{-1} \\ \mathbf x_{k|k} = \mathbf x_{k|k-1} + \mathbf W_{k|k-1}\boldsymbol\nu_{k|k-1} \qquad \mathbf P_{k|k} = \mathbf P_{k|k-1} - \mathbf W_{k|k-1}\mathbf S_{k|k-1}\mathbf W_{k|k-1}^\top \end{gathered}"
                rows={[
                  ['\\boldsymbol\\nu', 'innovation — what is new in the measurement'],
                  ['\\mathbf S', 'innovation covariance — how big “new” normally is'],
                  ['\\mathbf W', 'Kalman gain matrix — how much to trust what is new'],
                  ['\\mathbf x_{k|k}', 'move the prediction by the gain times the innovation'],
                  ['\\mathbf P_{k|k}', 'shrink the uncertainty — by the part the measurement explained'],
                ]}
              />
              <Trap>
                Two slide typos to be aware of (so you don't learn them wrong): Lecture 2, slide 25 writes x_{'{k|k}'} = x_{'{k|k−1}'} + Wν “= W(z − Hx_{'{k|k−1}'})” — the right-hand side is missing the x_{'{k|k−1}'} term. Lecture 5, slide 20 writes ν = Hx − z; the sign convention used everywhere else (and here) is <b>ν = z − Hx</b>.
              </Trap>
            </>
          ),
        },
        {
          id: 's5.2',
          body: (
            <>
              <P>
                The gain W is a <b>dial between trusting the prediction and trusting the sensor</b>. In 1D: W = P / (P + R). Play with the board: the green ellipse is the prediction, the red band the measurement, the blue ellipse the result.
              </P>
              <Controls>
                <Knob label="Prediction uncertainty (× P)" value={p.Pscale} min={0.1} max={4} step={0.05} onChange={set('Pscale')} fmt={f2} />
                <Knob label="Measurement variance R" value={p.fR} min={0.3} max={40} step={0.1} onChange={set('fR')} fmt={(v) => v.toFixed(1)} />
                <Knob label="Measurement offset" value={p.zOff} min={-8} max={8} step={0.1} onChange={set('zOff')} fmt={(v) => v.toFixed(1)} />
              </Controls>
              <Readout>
                Position gain W₁ = P₁₁ / (P₁₁ + R) = {f2(gScale)} / ({f2(gScale)} + {p.fR.toFixed(1)}) = <b>{f3(W1(gScale, p.fR))}</b>
              </Readout>
              <Table
                head={['Situation', 'Gain', 'Behaviour']}
                rows={[
                  ['prediction very sure (P small), sensor poor (R large)', 'W → 0', 'ignore the measurement'],
                  ['prediction poor (P large), sensor sharp (R small)', 'W → 1 (for position)', 'jump to the measurement'],
                  ['equally sure', 'W = ½', 'meet in the middle'],
                ]}
              />
            </>
          ),
        },
        {
          id: 's5.3',
          body: (
            <>
              <P>
                Now the most surprising thing about the Kalman filter. The tracking station measures <b>only distance</b> — H = (1, 0). Yet after a few measurements the filter knows the <b>speed</b> very well. How?
              </P>
              <Controls>
                <Knob label="Correlation in the prediction" value={p.corr} min={0} max={1.4} step={0.05} onChange={set('corr')} fmt={f2} />
                <Knob label="Measurement offset" value={p.zOff} min={-8} max={8} step={0.1} onChange={set('zOff')} fmt={(v) => v.toFixed(1)} />
              </Controls>
              <P>
                The gain's second entry is <M>{'W_2 = P_{12} / S'}</M> — the <b>covariance</b> between position and speed, divided by S. Prediction creates that covariance (the shear: a faster ship got further). So when the measurement says “further than expected”, the filter concludes “probably faster than expected, too” and corrects the speed (the yellow arrow). Set the correlation to 0: the arrow vanishes — the speed can't be learned from one measurement any more.
              </P>
              <Rule>You can't measure speed, but the filter learns it: the correlation in P carries information from what we measure to what we don't.</Rule>
              <Quiz
                id="ch3-q4"
                label="Why can a range-only radar update the speed?"
                q="Why does a range-only measurement (H = (1, 0)) change the speed estimate?"
                options={[
                  { t: 'It doesn’t — speed only changes in the prediction.', why: 'Watch the yellow arrow: it does.' },
                  { t: 'Because the gain’s speed entry is P₁₂/S: position and speed are correlated in the prediction.', ok: true, why: 'The off-diagonal of P links them; without it (P₁₂ = 0) a single range update leaves the speed alone.' },
                  { t: 'Because the radar secretly measures Doppler speed.', why: 'Not in this model: H = (1, 0).' },
                ]}
              />
            </>
          ),
        },
        {
          id: 's5.4',
          body: (
            <>
              <P>Four practical cases the exam likes:</P>
              <ul>
                <li>
                  <b>What H looks like.</b> A radar converted to Cartesian coordinates measures position only: <M>{'\\mathbf H = (\\mathbf I\\;\\;\\mathbf 0)'}</M> (3 × 6). Our spacecraft: H = (1, 0).
                </li>
                <li>
                  <b>How surprising was it?</b> <M>{'\\boldsymbol\\nu^\\top\\mathbf S^{-1}\\boldsymbol\\nu'}</M> is the squared Mahalanobis distance of the innovation (Chapter 1). If the filter is right, it follows a χ² distribution with m degrees of freedom — the basis of gating (Chapter 6).
                </li>
                <li>
                  <b>No measurement this step</b> (missed detection, no report): skip the update — x_{'{k|k}'} = x_{'{k|k−1}'}, P_{'{k|k}'} = P_{'{k|k−1}'}.
                </li>
                <li>
                  <b>Several sensors at once</b>: stack their H's on top of each other and put their R's in a block-diagonal R, then do one update. That's Chapter 5's fusion formula.
                </li>
              </ul>
            </>
          ),
        },
      ],
    },
    /* ============================================================ 6 */
    {
      id: 'c3-byhand',
      kicker: 'Scene 6',
      title: 'One full step, by hand',
      concept: 'Worked example (1D, then 2D)',
      steps: [
        {
          id: 's6.1',
          body: (
            <>
              <P>First in one dimension (position only), so every number is visible:</P>
              <Example title="1D: P = 4, q = 9, R = 9, predicted mean 40, measurement 50">
                <Tex tex="P_{k|k-1} = 4 + 9 = 13, \qquad S = 13 + 9 = 22, \qquad W = 13/22 = 0.591" block />
                <Tex tex="\nu = 50 - 40 = 10, \quad x_{k|k} = 40 + 0.591\cdot 10 = 45.9, \quad P_{k|k} = 13 - 0.591^2\cdot 22 = 5.32" block />
                <p>Check with Chapter 2's information rule: 1/13 + 1/9 = 1/5.32 ✓. Same answer, two routes.</p>
              </Example>
            </>
          ),
        },
        {
          id: 's6.2',
          body: (
            <>
              <P>Now the real thing: (distance, speed) in thousands of km and km/h, one hour, a range measurement. These numbers are computed live by the same engine that draws the board.</P>
              <Example title="2D: one hour, then a range measurement">
                <p>
                  Last posterior: <M>{`\\mathbf x = (${EXAMPLE_FILT.x[0]}, ${EXAMPLE_FILT.x[1]})^\\top, \\ \\mathbf P = \\begin{pmatrix}4 & 0\\\\ 0 & 0.25\\end{pmatrix}`}</M>, Δt = 1 h, σ² = 0.04, measurement z = {EXAMPLE.z}, R = {EXAMPLE.R}.
                </p>
                <Table
                  head={['Quantity', 'Formula', 'Value']}
                  rows={[
                    ['D', 'σ²[[¼, ½], [½, 1]]', '[[0.01, 0.02], [0.02, 0.04]]'],
                    ['x_{k|k−1}', 'F x', `(${f2(exPred.x[0])}, ${f2(exPred.x[1])})`],
                    ['P_{k|k−1}', 'F P Fᵀ + D', `[[${f2(exPred.P[0][0])}, ${f2(exPred.P[0][1])}], [${f2(exPred.P[1][0])}, ${f2(exPred.P[1][1])}]]`],
                    ['ν', 'z − H x', f2(exUpd.nu)],
                    ['S', 'H P Hᵀ + R', f2(exUpd.S)],
                    ['W', 'P Hᵀ / S', `(${f3(exUpd.W[0])}, ${f3(exUpd.W[1])})`],
                    ['x_{k|k}', 'x + W ν', `(${f2(exUpd.x[0])}, ${f3(exUpd.x[1])})`],
                    ['P_{k|k}', 'P − W S Wᵀ', `[[${f3(exUpd.P[0][0])}, ${f3(exUpd.P[0][1])}], [${f3(exUpd.P[1][0])}, ${f3(exUpd.P[1][1])}]]`],
                  ]}
                />
                <p>
                  Notice the speed: it moved from 4 to {f3(exUpd.x[1])} — from a range-only measurement, thanks to the covariance {f2(exPred.P[0][1])} created by one hour of prediction. And the position variance fell from {f2(exPred.P[0][0])} to {f3(exUpd.P[0][0])}.
                </p>
              </Example>
            </>
          ),
        },
      ],
    },
    /* ============================================================ 7 */
    {
      id: 'c3-coast',
      kicker: 'Scene 7',
      title: 'Trans-lunar coast',
      concept: 'The filter running · tuning · initialisation',
      steps: [
        {
          id: 's7.1',
          body: (
            <>
              <P>Let it fly. Each step: one hour, one range measurement. The board shows the green prediction, the red measurement band and the blue posterior; the yellow dot is the truth (which the filter never sees).</P>
              <div className="sx-controls">
                <div className="px-actions">
                  <button className="sx-btn sx-btn-dark" onClick={() => set('k')(Math.min(p.k + 1, STEPS3))}>
                    Next hour → {Math.min(p.k + 1, STEPS3)}
                  </button>
                  <button className="sx-btn" onClick={() => setAuto(!auto)}>
                    {auto ? 'Pause' : 'Play'}
                  </button>
                  <button className="sx-btn" onClick={() => set('k')(0)}>
                    Restart
                  </button>
                  <button className="sx-btn" onClick={() => setP((q) => ({ ...q, seed: q.seed + 1, k: 0 }))}>
                    New flight
                  </button>
                </div>
                <Knob label="Filter’s σ² (assumed manoeuvrability)" value={p.s2Filter} min={0.001} max={0.5} step={0.001} onChange={set('s2Filter')} fmt={f3} />
                <Knob label="Measurement variance R" value={p.R} min={0.5} max={25} step={0.5} onChange={set('R')} fmt={(v) => v.toFixed(1)} />
                <Toggle options={['coast only', 'mid-course burn at hour 6']} value={p.burn} onChange={set('burn')} />
              </div>
              {info && (
                <Readout>
                  Hour {p.k}: innovation ν = {f2(info.nu)}, √S = {f2(Math.sqrt(info.S))} → <b>{f2(info.nu / Math.sqrt(info.S))} σ</b> · gain W = ({f3(info.W[0])}, {f3(info.W[1])}) · speed estimate {f3(run.filt[p.k].x[1])} (true {f3(run.truth[p.k][1])})
                </Readout>
              )}
              <Ask q="Turn on the mid-course burn but keep the filter's σ² tiny (it 'believes' the craft flies straight). What happens to the innovations after hour 6?">
                <p>
                  They become <b>too big and all on one side</b> (several σ, same sign, hour after hour) — the filter lags behind the real craft because it refuses to believe in a change. Raise σ² and it catches up, at the price of noisier estimates. Persistently non-white innovations mean the model is wrong — the motivation for running several motion models at once (IMM, Chapter 9).
                </p>
              </Ask>
              <P>Run it to the end without the burn and watch the gain settle: it converges to a constant — Chapter 2's steady width, now with a steady W.</P>
            </>
          ),
        },
        {
          id: 's7.2',
          body: (
            <>
              <P>
                <b>How does the filter start?</b> The loop needs a first belief, x_{'{0|0}'} and P_{'{0|0}'}. A simple, honest start from the first two measurements z₁ (at t₁) and z₂ (at t₂):
              </P>
              <Formula
                tex="\hat r = z_2, \qquad \hat{\dot r} = \frac{z_2 - z_1}{t_2 - t_1}, \qquad \mathbf P_{0|0} = \begin{pmatrix} R & R/\Delta t\\ R/\Delta t & 2R/\Delta t^2\end{pmatrix}"
                rows={[
                  ['\\hat{\\dot r}', 'the speed from two positions: difference over time'],
                  ['2R/\\Delta t^2', 'its variance: two independent errors (2R), divided by Δt² — Chapter 1’s Var[ax] = a² Var[x]'],
                ]}
              />
              <P>
                The point is honesty. If P_{'{0|0}'} truthfully says “I know little”, a poor start is forgotten after a few measurements. If P_{'{0|0}'} is overconfident, the filter believes its bad start and lags for a long time. (The proper way to decide that there is something to track at all is Chapter 10's sequential likelihood ratio test.)
              </P>
              <Ahead>
                The course exercise — the car on the mountain-pass road with two radars (MHT deck, slides 3–4) — is exactly a filter like this one, in 2D/3D. Writing and explaining your own program is a prerequisite of the course, so this platform explains it rather than handing you code.
              </Ahead>
            </>
          ),
        },
      ],
    },
    /* ============================================================ 8 */
    {
      id: 'c3-optimal',
      kicker: 'Scene 8',
      title: 'When is it the best possible?',
      concept: 'Optimality and limits',
      steps: [
        {
          id: 's8.1',
          body: (
            <>
              <P>The lecture's summary card says the Kalman filter is the <b>optimal solution if the dynamics and sensor models are linear and have additive Gaussian noise</b>. Optimal in the strongest sense: it doesn't approximate Chapter 2's loop — it <i>is</i> Chapter 2's loop, exactly, and its mean is the minimum-mean-squared-error estimate (Chapter 1).</P>
              <Table
                head={['When this breaks…', '…the course uses', 'Chapter']}
                rows={[
                  ['the sensor or the motion is curved (range & angle, turning)', 'EKF (linearise), UKF (sigma points)', '4'],
                  ['several sensors at once', 'the fusion formula (stack H and R)', '5'],
                  ['we don’t know which measurement is ours (clutter)', 'gating, PDAF, MHT', '6–8'],
                  ['the motion model changes (manoeuvres)', 'IMM', '9'],
                ]}
              />
              <Rule>The Kalman filter is the basis of everything that follows: EKF, UKF, IMM and MHT all run Kalman steps inside.</Rule>
            </>
          ),
        },
      ],
    },
    /* ============================================================ 9 */
    {
      id: 'c3-rts',
      kicker: 'Scene 9',
      title: 'The post-flight report',
      concept: 'Rauch–Tung–Striebel retrodiction',
      steps: [
        {
          id: 's9.1',
          body: (
            <>
              <P>After splashdown, mission control reconstructs the whole flight with all the data — Chapter 2's board of inquiry. With bells, the retrodiction integral can be solved too:</P>
              <Derive
                steps={[
                  { tex: 'p(\\mathbf x_l\\mid\\mathbf x_{l+1}, \\mathcal Z^l) \\propto \\mathcal N(\\mathbf x_{l+1};\\,\\mathbf F\\mathbf x_l,\\,\\mathbf D)\\;\\mathcal N(\\mathbf x_l;\\,\\mathbf x_{l|l},\\,\\mathbf P_{l|l})', why: 'Chapter 2, move ③: dynamics model × filtered belief at l (Bayes, “looking backwards”).' },
                  { tex: '= \\mathcal N\\big(\\mathbf x_l;\\,\\mathbf x_{l|l} + \\mathbf W_{l|l+1}(\\mathbf x_{l+1} - \\mathbf x_{l+1|l}),\\ \\mathbf P_{l|l} - \\mathbf W_{l|l+1}\\mathbf P_{l+1|l}\\mathbf W_{l|l+1}^\\top\\big), \\quad \\mathbf W_{l|l+1} = \\mathbf P_{l|l}\\mathbf F^\\top\\mathbf P_{l+1|l}^{-1}', why: 'Product formula with “z” → xₗ₊₁, “H” → F, “R” → D; here S = F P Fᵀ + D = Pₗ₊₁|ₗ, the prediction covariance.' },
                  { tex: 'p(\\mathbf x_l\\mid\\mathcal Z^k) = \\int(\\text{that bell})\\;\\mathcal N(\\mathbf x_{l+1};\\,\\mathbf x_{l+1|k},\\,\\mathbf P_{l+1|k})\\,d\\mathbf x_{l+1}', why: 'Chapter 2, moves ①–②: average over the retrodicted belief one step later.' },
                  { tex: '\\mathbf x_{l|k} = \\mathbf x_{l|l} + \\mathbf W_{l|l+1}(\\mathbf x_{l+1|k} - \\mathbf x_{l+1|l}), \\quad \\mathbf P_{l|k} = \\mathbf P_{l|l} + \\mathbf W_{l|l+1}(\\mathbf P_{l+1|k} - \\mathbf P_{l+1|l})\\mathbf W_{l|l+1}^\\top', why: 'The mean is linear in xₗ₊₁, so Chapter 1’s linear-map rule gives the result. These are the RTS formulas (Lecture 2, slide 29).' },
                ]}
              />
              <P>
                <b>In practice</b>: run the filter forwards and <i>store</i> x_{'{l|l}'}, P_{'{l|l}'}, x_{'{l+1|l}'}, P_{'{l+1|l}'} for every step. Then walk backwards, l = k−1, …, 0. Each step needs F (not D) and the inverse of the predicted covariance.
              </P>
              <Quiz
                id="ch3-q5"
                label="Why is P_{l|k} never larger than P_{l|l}?"
                q="Why is the retrodicted covariance P_{l|k} never larger than the filtered P_{l|l}?"
                options={[
                  { t: 'Because W is always small.', why: 'W can be large; that’s not the reason.' },
                  { t: 'Because P_{l+1|k} − P_{l+1|l} is “negative”: later data only remove uncertainty.', ok: true, why: 'The correction term W(P_{l+1|k} − P_{l+1|l})Wᵀ subtracts uncertainty — information never hurts.' },
                  { t: 'Because retrodiction ignores the dynamics.', why: 'It uses F explicitly.' },
                ]}
              />
            </>
          ),
        },
        {
          id: 's9.2',
          body: (
            <>
              <P>Each line on the stage is one hour's ±2σ position bar (yellow dot: the truth). Switch to the post-flight report: the bars shrink — most in the middle of the flight, not at all at the last hour (nothing newer to correct it with).</P>
              <Controls>
                <Toggle options={['filtered (in flight)', 'retrodicted (post-flight)']} value={p.retro} onChange={set('retro')} />
              </Controls>
              <Readout>
                Hour 3: filtered σ = {f3(Math.sqrt(run.filt[3].P[0][0]))} → retrodicted σ = {f3(Math.sqrt(run.smooth[3].P[0][0]))} (thousand km).
              </Readout>
            </>
          ),
        },
      ],
    },
    /* ============================================================ epilogue */
    {
      id: 'c3-epilogue',
      kicker: 'Epilogue',
      title: 'The lines that flew to the Moon',
      concept: 'Summary',
      steps: [
        {
          id: 's10.1',
          body: (
            <>
              <Lead>The whole Kalman filter fits on one card. You can now derive every line of it.</Lead>
              <Table
                head={['Step', 'Formulas', 'Comes from']}
                rows={[
                  ['predict', <M>{'\\mathbf x_{k|k-1} = \\mathbf F\\mathbf x_{k-1|k-1},\\ \\mathbf P_{k|k-1} = \\mathbf F\\mathbf P\\mathbf F^\\top + \\mathbf D'}</M>, 'CK + product formula'],
                  ['innovate', <M>{'\\boldsymbol\\nu = \\mathbf z - \\mathbf H\\mathbf x_{k|k-1},\\ \\mathbf S = \\mathbf H\\mathbf P\\mathbf H^\\top + \\mathbf R'}</M>, 'expected measurement'],
                  ['gain', <M>{'\\mathbf W = \\mathbf P\\mathbf H^\\top\\mathbf S^{-1}'}</M>, 'product formula'],
                  ['update', <M>{'\\mathbf x_{k|k} = \\mathbf x_{k|k-1} + \\mathbf W\\boldsymbol\\nu,\\ \\mathbf P_{k|k} = \\mathbf P - \\mathbf W\\mathbf S\\mathbf W^\\top'}</M>, 'Bayes + product formula'],
                  ['retrodict', <M>{'\\mathbf W_l = \\mathbf P_{l|l}\\mathbf F^\\top\\mathbf P_{l+1|l}^{-1}'}</M>, 'RTS'],
                ]}
              />
              <P>Assumptions: linear models, additive Gaussian noise. Then it's exact and optimal. Next: what to do when the world is curved (Chapter 4).</P>
              <P>
                <b>Now compute it yourself.</b> Practice has eleven problems — from completing the square to initialising a track — and the explain-back questions.
              </P>
              <button className="sx-cta" onClick={() => (window.location.hash = '#/ch3/practice')}>
                Go to Practice →
              </button>
            </>
          ),
        },
      ],
    },
  ];

  return (
    <StoryShell
      chapterId="ch3"
      chapterLabel="Chapter 3"
      title="Bringing them home"
      scenes={scenes}
      onHome={onHome}
      renderWorld={(step, _hl, nonce) => <World3 step={step} p={p} run={run} nonce={nonce} example={{ prior: exPred, z: EXAMPLE.z, R: EXAMPLE.R }} />}
      extraItems={EXPLAIN3.map((e) => ({ id: e.id, kind: 'explain' as const, label: e.q, step: '#/ch3/practice' }))}
    />
  );
}

const TryItBoard = ({ children }: { children: React.ReactNode }) => <div className="sx-controls">{children}</div>;
