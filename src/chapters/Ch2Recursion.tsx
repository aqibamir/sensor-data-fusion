import { useEffect, useMemo, useState } from 'react';
import { normal1 } from '../engine/gaussian';
import { Grid, makeGrid, mixtureOnGrid, moments, predict, retrodict, transition, update } from '../engine/grid';
import { mulberry32, randn } from '../engine/rng';
import { Axes, Camera, Curve, Density, Dot, Label, Lights, linspace, P3, Surface, useAnimated } from '../three/primitives';
import { H1, JointSliceScene } from '../three/scenes';
import { Beat, ChapterShell } from '../ui/ChapterShell';
import { Button, Controls, Derivation, Slider } from '../ui/controls';
import { BayesPipeline, predictCells, PredictPipeline } from '../ui/discrete';
import { Card } from '../ui/ExplainCards';
import { ChapterIntro, Check, Connect, Everyday, FormulaExplained, Idea, NumTable, Pitfall, Predict, Question, Say, TryIt, Worked } from '../ui/learn';
import { Plot } from '../ui/Plot';
import { M, Tex } from '../ui/Tex';
import { C } from '../ui/theme';

// ---------------------------------------------------------------- simulation used by several beats

const G: Grid = makeGrid(-5, 7, 241);
const OFF = -1; // world x = state x + OFF
const DZ = 0.85; // world depth per time step
const K = 10;

/** Start belief: deliberately NOT Gaussian — two ideas about where the car starts. */
const prior0 = () =>
  mixtureOnGrid(G, [
    { w: 0.55, m: -3.6, s2: 0.25 },
    { w: 0.45, m: -1.2, s2: 0.3 },
  ]);

interface Run {
  truth: number[];
  z: number[];
  pred: number[][];
  filt: number[][];
  retro: number[][];
}

function simulate(seed: number, u: number, q: number, r: number): Run {
  const rand = mulberry32(seed);
  const truth = [-3.5];
  for (let k = 1; k <= K; k++) truth.push(truth[k - 1] + u + Math.sqrt(q) * randn(rand) * 0.6);
  const z = truth.map((x) => x + Math.sqrt(r) * randn(rand));
  const filt = [prior0()];
  const pred: number[][] = [filt[0]];
  for (let k = 1; k <= K; k++) {
    const p = predict(G, filt[k - 1], u, q);
    pred.push(p);
    filt.push(update(G, p, z[k], r).post);
  }
  return { truth, z, pred, filt, retro: retrodict(G, filt, pred, u, q) };
}

const worldX = (x: number) => x + OFF;
const zAt = (k: number) => 4 - k * DZ;

// discrete example: road cut into 10 m cells, car does ~20 m per second
const MOVES = [
  { step: 1, p: 0.25 },
  { step: 2, p: 0.5 },
  { step: 3, p: 0.25 },
];
const PREV_ONE = [0, 0.2, 0.6, 0.2, 0, 0, 0, 0, 0, 0];
const PREV_TWO = [0.5, 0, 0, 0, 0.5, 0, 0, 0, 0, 0];

// ---------------------------------------------------------------- chapter

export default function Ch2Recursion({ beat, setBeat }: { beat: number; setBeat: (b: number) => void }) {
  const [u, setU] = useState(0.8);
  const [q, setQ] = useState(0.3);
  const [r, setR] = useState(0.5);
  const [seed, setSeed] = useState(4);
  const [two, setTwo] = useState(0);
  const [mult, setMult] = useState(0);
  const [integ, setInteg] = useState(0);
  const [nPred, setNPred] = useState(1);
  const [zc, setZc] = useState(52);
  const [rc, setRc] = useState(10);
  const [fz, setFz] = useState(0.9);
  const [fR, setFR] = useState(0.5);
  const [fRen, setFRen] = useState(0);
  const [kShow, setKShow] = useState(0);
  const [auto, setAuto] = useState(false);
  const [showRetro, setShowRetro] = useState(0);
  const [lPick, setLPick] = useState(0);

  const run = useMemo(() => simulate(seed, u, q, r), [seed, u, q, r]);
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setKShow((k) => (k >= K ? k : k + 1)), 1100);
    return () => clearInterval(id);
  }, [auto]);
  useEffect(() => {
    if (kShow >= K) setAuto(false);
  }, [kShow]);

  const prevCells = two ? PREV_TWO : PREV_ONE;
  const nextCells = predictCells(PREV_ONE, MOVES);
  const fCells = [2, 3, 4, 5, 6]; // the cells where the prediction lives (20 … 60 m)
  const fPrior = fCells.map((i) => nextCells[i]);
  const fLik = fCells.map((i) => Math.exp(-0.5 * ((zc - i * 10) / rc) ** 2));
  const fm = 0.2;
  const fP = 0.9;

  const beats: Beat[] = [
    // ------------------------------------------------------------ 0
    {
      title: 'The navigator’s problem',
      source: 'L1, L2 p.6, p.9',
      scene3d: <OverviewScene run={run} />,
      panel: (
        <>
          <Say>
            Let me tell you how sailors crossed oceans for centuries, long before GPS. The navigator has two tools, and <b>neither is good enough alone</b>.
          </Say>
          <Everyday title="Tool 1 — dead reckoning (physics)">
            <p>
              “We were here at noon. We sail at 10 km/h heading east. So at 1 pm we're about 10 km east.” Great — but small errors (wind, currents) <b>pile up</b>. After a day of
              this, you could be 30 km off.
            </p>
          </Everyday>
          <Everyday title="Tool 2 — a sighting (measurement)">
            <p>
              “I can see the lighthouse at roughly that angle.” Useful — but rough, and only now and then. On its own, one sighting gives only a fuzzy idea of where you are.
            </p>
          </Everyday>
          <Say>
            The smart navigator <b>combines</b> them, over and over: move the estimate forward with physics (it gets fuzzier), then sharpen it with each sighting. Repeat forever.
          </Say>
          <Idea>Tracking = a loop of PREDICT (physics: belief moves and gets wider) and FILTER (measurement: belief gets sharper).</Idea>
          <Say>
            That loop is this whole chapter. In the scene on the left, time runs into the screen: blue = what we believe after a measurement, green = the prediction, red dot = the
            radar reading.
          </Say>
          <ChapterIntro
            why={<p>Chapter 1 gave us densities, marginals and Bayes. This chapter assembles them into a machine that runs forever — the “Bayesian recursion”. Kalman, EKF, UKF, PDAF, MHT and IMM are all just ways of running this machine.</p>}
            needs={
              <p>
                From Ch 1: marginal (“add up over what you don't care about”) and Bayes' rule (“prior × likelihood, then rescale”). That's it.
              </p>
            }
            learn={[
              'How to read the notation p(xₖ | Zᵏ⁻¹)',
              'The dynamics model and the Markov property',
              'Prediction (Chapman–Kolmogorov) — with a table, then in 3D, with every step named',
              'Why prediction always makes us less sure',
              'Filtering = Bayes with time indices, with real numbers',
              'The normalisation constant = the expected measurement',
              'Retrodiction: how later data improve what we believe about the past',
            ]}
          />
        </>
      ),
    },
    // ------------------------------------------------------------ 1
    {
      title: 'Reading the notation (it’s easier than it looks)',
      source: 'L2 p.9, MHT p.9',
      scene3d: <OverviewScene run={run} />,
      panel: (
        <>
          <Say>The slides are full of symbols like <M>{'p(\\x_k \\mid \\Z^{k-1})'}</M>. Let's decode them once and for all, because after this they'll read like plain English.</Say>
          <FormulaExplained
            tex="p(\x_k \mid \Z^{k-1})"
            symbols={[
              ['k', 'the time step: the radar beeps at k = 1, 2, 3, … (one beep every ΔT seconds)'],
              ['\\x_k', 'the true state at time k (e.g. position and velocity) — unknown'],
              ['\\z_k', 'the measurement that arrives at time k (e.g. “118 m”)'],
              ['\\Z^{k}', 'ALL measurements so far: {z₁, z₂, …, z_k}. Capital Z with a superscript = the whole history.'],
              ['p(\\x_k \\mid \\Z^{k-1})', '“what we believe about the state at time k, using data only up to time k−1” → a PREDICTION'],
              ['p(\\x_k \\mid \\Z^{k})', '“… using data up to time k, including the brand-new z_k” → a FILTERED belief'],
              ['p(\\x_l \\mid \\Z^{k}),\\ l<k', '“… about an EARLIER time l, using all data up to now” → RETRODICTION'],
            ]}
          />
          <Everyday title="A timeline">
            <NumTable
              head={['moment', 'data we have', 'belief', 'name']}
              rows={[
                ['just after beep 3', 'z₁, z₂, z₃', <Tex tex="p(\x_3\mid\Z^3)" />, 'filtered'],
                ['just before beep 4', 'z₁, z₂, z₃', <Tex tex="p(\x_4\mid\Z^3)" />, 'predicted'],
                ['just after beep 4', 'z₁ … z₄', <Tex tex="p(\x_4\mid\Z^4)" />, 'filtered'],
                ['looking back at 2', 'z₁ … z₄', <Tex tex="p(\x_2\mid\Z^4)" />, 'retrodicted'],
              ]}
            />
          </Everyday>
          <Idea>Left of the bar: WHICH time we're talking about. Right of the bar: which data we used. That's all.</Idea>
          <Connect>
            The Kalman filter (Ch 3) writes the same thing as subscripts: <M>{'\\x_{k|k-1}'}</M> = mean of <M>{'p(\\x_k\\mid\\Z^{k-1})'}</M>, and <M>{'\\mathbf P_{k|k-1}'}</M> its
            covariance. Read “k given k−1”.
          </Connect>
          <Check
            q="What does p(x₅ | Z⁷) describe?"
            options={[
              { text: 'A prediction of time 7 using data up to 5', why: 'Flipped: the LEFT side (x₅) is the time we ask about.' },
              { text: 'Our belief about time 5, using data up to time 7 — a retrodiction', correct: true, why: 'Asking about an earlier time with more data = retrodiction.' },
              { text: 'The 5th measurement', why: 'Measurements are z. x is the state.' },
            ]}
          />
        </>
      ),
    },
    // ------------------------------------------------------------ 2
    {
      title: 'The dynamics model: how the car moves',
      source: 'L2 p.10, p.21; MHT p.50',
      scene3d: <KernelScene u={u} q={q} />,
      panel: (
        <>
          <Question>If I tell you EXACTLY where the car was one second ago, where is it now?</Question>
          <Everyday>
            <p>
              The car goes about 20 m/s. One second ago it was at 100 m. So now it's around <b>120 m</b> — but the driver may have pressed the pedal a bit, or braked. So maybe 117,
              maybe 123. Not a single number: a little bell curve centred at 120 m.
            </p>
          </Everyday>
          <Idea>The dynamics model is a probability: “IF the car was at x_k-1, THEN here is the spread of places it can be at time k.”</Idea>
          <FormulaExplained
            tex="p(x_k \mid x_{k-1}) = \N(x_k;\; x_{k-1} + u,\; q)"
            symbols={[
              ['x_{k-1}', 'where the car was (assumed known, for this question)'],
              ['u', 'how far it normally moves in one step (here: 20 m)'],
              ['q', 'variance of the random extra movement (driver behaviour, wind…)'],
              ['p(x_k\\mid x_{k-1})', 'a bell around x_{k−1} + u. The lecture also calls it the transition density.'],
            ]}
          />
          <TryIt>
            The 3D picture shows this for EVERY possible old position at once: it's a <b>ridge</b> above the line <M>{'x_k = x_{k-1}+u'}</M>. Cut it at any fixed{' '}
            <M>{'x_{k-1}'}</M> and you see one bell.
            <Controls>
              <Slider label="u\ (\text{usual step})" value={u} min={-1.5} max={1.5} onChange={setU} />
              <Slider label="q\ (\text{randomness})" value={q} min={0.05} max={1.5} onChange={setQ} />
            </Controls>
            Big q → wide, low ridge (unpredictable driver). Small q → thin, sharp ridge (a train on rails).
          </TryIt>
          <Everyday title="The Markov property — like chess">
            <p>
              In chess, to decide the next move you only need the <b>current board</b>. How the pieces got there doesn't matter. Same here: to predict <M>{'x_k'}</M>, knowing{' '}
              <M>{'x_{k-1}'}</M> is enough. Older positions and old radar readings add nothing <i>once you know</i> <M>{'x_{k-1}'}</M>.
            </p>
            <Tex tex="p(\x_k \mid \x_{k-1}, \Z^{k-1}) = p(\x_k \mid \x_{k-1})" block />
          </Everyday>
          <Connect>
            In Chapter 3 the dynamics model becomes <M>{'\\N(\\x_k;\\, \\mathbf F\\x_{k-1},\\, \\mathbf D)'}</M>: <M>{'\\mathbf F'}</M> is the “drive for Δt” matrix from the last
            beat of Ch 1, and <M>{'\\mathbf D'}</M> is the random part (our q). In Chapter 9 (IMM) we'll have <i>several</i> dynamics models and switch between them.
          </Connect>
          <Pitfall>Markov does NOT mean “the past is useless”. The past is useful — but all of its usefulness is already contained in our belief about x_{'{k−1}'}.</Pitfall>
          <Check
            q="A car on a highway with cruise control vs. a child's remote-control car. Which needs a bigger q?"
            options={[
              { text: 'The highway car', why: 'Cruise control = very predictable motion = small q.' },
              { text: 'The remote-control car', correct: true, why: 'Erratic motion = more randomness per step = larger q.' },
              { text: 'Same, q only depends on the sensor', why: 'q describes the OBJECT’s motion. The sensor noise is a different number (R).' },
            ]}
          />
        </>
      ),
    },
    // ------------------------------------------------------------ 3
    {
      title: 'Prediction with a table: “add up where it came from”',
      source: 'L2 p.10',
      scene2d: <PredictPipeline prev={prevCells} moves={MOVES} />,
      panel: (
        <>
          <Question>We DON'T know exactly where the car was. We only have a belief. Where will it be one second later?</Question>
          <Everyday title="The setup">
            <p>Cut the road into 10 m cells. Right now we believe:</p>
            <NumTable head={['cell', '10 m', '20 m', '30 m']} rows={[['p(now)', '0.2', '0.6', '0.2']]} />
            <p>
              Each second the car moves forward <b>1 cell (25 %)</b>, <b>2 cells (50 %)</b> or <b>3 cells (25 %)</b>. That's our dynamics model.
            </p>
          </Everyday>
          <Say>
            Here's the trick. To find the probability of a cell next second, ask: <b>“from which cells could the car have come, and how likely was each route?”</b> Then add up all
            the routes.
          </Say>
          <Worked title="Worked example: p(40 m) next second">
            <NumTable
              head={['came from', 'p(was there)', 'needed move', 'p(that move)', 'route']}
              rows={[
                ['10 m', '0.2', '+3 cells', '0.25', '0.2 × 0.25 = 0.05'],
                ['20 m', '0.6', '+2 cells', '0.50', '0.6 × 0.50 = 0.30'],
                ['30 m', '0.2', '+1 cell', '0.25', '0.2 × 0.25 = 0.05'],
              ]}
            />
            <p>
              Total: <b>0.05 + 0.30 + 0.05 = 0.40</b>. In the picture, the 40 m bar is <b>stacked from three colours</b> — one per origin cell. Look!
            </p>
          </Worked>
          <Idea>Prediction = for every new cell, add up (probability of being in an old cell) × (probability of moving from there to here).</Idea>
          <FormulaExplained
            tex="\pred{p(x_k)} = \sum_{x_{k-1}} p(x_k \mid x_{k-1})\; \post{p(x_{k-1})}"
            symbols={[
              ['\\post{p(x_{k-1})}', 'how likely each old cell was (our current belief)'],
              ['p(x_k\\mid x_{k-1})', 'the dynamics model: chance of that move'],
              ['\\sum_{x_{k-1}}', 'add over every old cell = every route'],
            ]}
          />
          <Predict
            q="Before: 3 cells, spread from 10 to 30 m. After one second, how many cells have probability, and is the belief wider or narrower?"
            answer={<p>Now 5 cells (20 m to 60 m) have probability: 0.05, 0.25, 0.40, 0.25, 0.05. <b>Wider!</b> The randomness of the motion has been added on top of our existing uncertainty.</p>}
          />
          <TryIt>
            <Controls>
              <Slider label="\text{start belief}" value={two} min={0} max={1} step={1} onChange={setTwo} fmt={(v) => (v ? 'two guesses' : 'one bump')} />
            </Controls>
            “Two guesses”: we think the car is either at 0 m or at 40 m (50/50). Prediction moves BOTH guesses forward — it doesn't care that the belief has two bumps.
          </TryIt>
          <Connect>
            This sum is exactly the <b>marginal</b> from Ch 1, beat 7: we're adding up the joint <M>{'p(x_k, x_{k-1})'}</M> over the old position we don't care about any more.
            Next beat: the same thing with infinitely many cells.
          </Connect>
          <Check
            q="With the moves +1 (25 %), +2 (50 %), +3 (25 %) and the start belief 0.2 / 0.6 / 0.2 at 10 / 20 / 30 m, what is p(30 m) next second?"
            options={[
              { text: '0.05', why: 'You missed some routes. List EVERY cell the car could come from to reach 30 m.' },
              { text: '0.25', correct: true, why: 'From 10 m (+2): 0.2 × 0.5 = 0.10. From 20 m (+1): 0.6 × 0.25 = 0.15. Total 0.25.' },
              { text: '0.6', why: '0.6 is where most of the car was BEFORE moving.' },
            ]}
          />
        </>
      ),
    },
    // ------------------------------------------------------------ 4
    {
      title: 'Prediction in 3D: the Chapman–Kolmogorov equation',
      source: 'L2 p.10, p.15',
      scene3d: <ChapmanScene u={u} q={q} mult={mult} integ={integ} />,
      panel: (
        <>
          <Say>
            Now make the cells infinitely small. The sum becomes an integral, and the equation gets a fancy name: <b>Chapman–Kolmogorov</b>. Don't be scared by the name — it's
            the “add up where it came from” rule. Let's derive it the way the lecture does, and give every step its name, because the examiner will ask for exactly those names.
          </Say>
          <Derivation
            steps={[
              {
                tex: '\\pred{p(\\x_k\\mid\\Z^{k-1})} = \\int p(\\x_k, \\x_{k-1}\\mid\\Z^{k-1})\\, d\\x_{k-1}',
                why: '① Marginalisation. “Bring in the old state, then add it away.” We don’t know x_{k−1}, so we consider every possibility and add up.',
              },
              {
                tex: '= \\int p(\\x_k\\mid \\x_{k-1}, \\Z^{k-1})\\; p(\\x_{k-1}\\mid\\Z^{k-1})\\, d\\x_{k-1}',
                why: '② Conditional-pdf rule: p(a, b) = p(a | b) p(b). Split the joint into “where it goes, given where it was” × “where it was”.',
              },
              {
                tex: '= \\int \\underbrace{p(\\x_k\\mid \\x_{k-1})}_{\\text{dynamics model}}\\; \\underbrace{\\post{p(\\x_{k-1}\\mid\\Z^{k-1})}}_{\\text{previous posterior}}\\, d\\x_{k-1}',
                why: '③ Markov property: once we know x_{k−1}, the old data Z^{k−1} add nothing → drop them.',
              },
            ]}
          />
          <Idea>Prediction = (dynamics model) × (old belief), integrated over the old state. Same as the table, with an integral instead of a sum.</Idea>
          <Everyday title="What the 3D picture shows">
            <ul>
              <li>Green ridge = dynamics model over (old position, new position).</li>
              <li>Blue curve on the front wall = old belief (deliberately with two bumps).</li>
              <li>Step ① “multiply”: the ridge gets weighted by the old belief → two yellow bumps on the ridge = the joint p(new, old).</li>
              <li>Step ② “integrate”: add up along the old-position direction → the green prediction appears on the side wall.</li>
            </ul>
          </Everyday>
          <TryIt>
            <Controls>
              <Slider label="\text{① multiply by old belief}" value={mult} min={0} max={1} step={1} onChange={setMult} fmt={(v) => (v ? 'on' : 'off')} />
              <Slider label="\text{② integrate over } x_{k-1}" value={integ} min={0} max={1} step={1} onChange={setInteg} fmt={(v) => (v ? 'on' : 'off')} />
              <Slider label="q" value={q} min={0.05} max={1.5} onChange={setQ} />
            </Controls>
            With both on, increase q: the two bumps of the prediction blur together.
          </TryIt>
          <Connect>
            Ch 3: with Gaussians this integral can be solved with pen and paper (“product formula”). The result is the Kalman prediction{' '}
            <M>{'\\x_{k|k-1} = \\mathbf F\\x_{k-1|k-1}'}</M>, <M>{'\\mathbf P_{k|k-1} = \\mathbf F\\mathbf P\\mathbf F^\\top + \\mathbf D'}</M>.
          </Connect>
          <Check
            q="In which step of the derivation is the Markov assumption used?"
            options={[
              { text: '① when we integrate over x_{k−1}', why: 'That is marginalisation — always allowed, no assumption needed.' },
              { text: '② when we split the joint', why: 'That is the conditional-pdf rule — always allowed.' },
              { text: '③ when we drop Z^{k−1} from p(x_k | x_{k−1}, Z^{k−1})', correct: true, why: 'That’s the only place we assume something about the world: knowing x_{k−1} makes the old data redundant.' },
            ]}
          />
        </>
      ),
    },
    // ------------------------------------------------------------ 5
    {
      title: 'Prediction alone always smears',
      source: 'L2 p.9, L1 (maritime example)',
      scene3d: <SmearScene u={u} q={q} n={nPred} />,
      panel: (
        <>
          <Predict
            q="You predict 6 times in a row WITHOUT any new measurement. Will the belief ever get narrower again?"
            answer={<p><b>Never.</b> Each prediction adds the motion randomness (q) on top. Without new information, uncertainty can only grow. Drag the slider and watch the bell flatten.</p>}
          />
          <TryIt>
            <Controls>
              <Slider label="\text{steps without data}" value={nPred} min={0} max={6} step={1} onChange={setNPred} fmt={(v) => v.toFixed(0)} />
              <Slider label="q" value={q} min={0.05} max={1.5} onChange={setQ} />
            </Controls>
          </TryIt>
          <Everyday title="Real life: the ship example from Lecture 1">
            <p>
              Ships are seen by coastal radar only every few minutes, sometimes hours. Between sightings we can only predict — and a ship can change course a lot in an hour. The
              lecture's slide: “large time gaps between sensor updates → uncertainty of purely physical models”. Their fix: learn typical sea lanes from data (AIS) to predict better.
            </p>
          </Everyday>
          <Idea>Prediction never adds information. It moves the belief, and it always spreads it.</Idea>
          <Worked title="Numbers (Gaussian case)">
            <p>
              If the belief has variance P and each step adds variance q, after n predictions the variance is <M>{'P + n\\,q'}</M>. With P = 1 m², q = 4 m²: after 1 step 5 m² (σ ≈
              2.2 m), after 6 steps 25 m² (σ = 5 m).
            </p>
          </Worked>
          <Connect>That's why “prediction widens, filtering narrows” is the heartbeat of every tracker. Next: the filtering step that narrows it again.</Connect>
        </>
      ),
    },
    // ------------------------------------------------------------ 6
    {
      title: 'Filtering with a table: the radar beeps',
      source: 'L2 p.12',
      scene2d: <BayesPipeline cells={fCells.map((i) => `${i * 10} m`)} prior={fPrior} lik={fLik} labels={{ prior: 'prediction', lik: 'likelihood' }} />,
      panel: (
        <>
          <Say>
            We just predicted (green row): the car is at 20, 30, 40, 50 or 60 m with probabilities 0.05, 0.25, 0.40, 0.25, 0.05. <b>Beep!</b> The radar says{' '}
            <b>z = {zc} m</b>, with error σ = {rc} m. What now?
          </Say>
          <Say>
            You already know this from Ch 1 — it's Bayes' rule. The prediction plays the role of the <b>prior</b>.
          </Say>
          <Worked>
            <ol>
              <li>
                <b>Likelihood</b> (red): for each cell, “if the car were here, how plausible is the reading {zc} m?” Closer cells → higher.
              </li>
              <li>
                <b>Multiply</b> prediction × likelihood (yellow). Cells that are both predicted AND agree with the radar win.
              </li>
              <li>
                <b>Rescale</b> so the row sums to 1 (blue). That's the filtered belief <M>{'p(x_k \\mid \\Z^k)'}</M>.
              </li>
            </ol>
          </Worked>
          <Predict
            q="The radar reading is 52 m, the prediction peaks at 40 m. Where will the filtered belief peak?"
            answer={<p>Between them — at 40 m or 50 m depending on how good the radar is. With σ = 10 m it's a compromise. Make σ = 3 m: the radar wins (50 m). Make σ = 40 m: the prediction wins (40 m).</p>}
          />
          <TryIt>
            <Controls>
              <Slider label="\meas{z_k}\ (\text{m})" value={zc} min={10} max={80} step={1} onChange={setZc} fmt={(v) => v.toFixed(0)} />
              <Slider label="\meas{\sigma}\ (\text{radar error, m})" value={rc} min={3} max={40} step={1} onChange={setRc} fmt={(v) => v.toFixed(0)} />
            </Controls>
          </TryIt>
          <Idea>Filtering = prediction × likelihood, rescaled. The new measurement cuts away positions that don’t fit it.</Idea>
          <Connect>Next beat: the same with smooth curves and the time indices. In Ch 3, Gaussians make this a 3-line formula: the Kalman update.</Connect>
        </>
      ),
    },
    // ------------------------------------------------------------ 7
    {
      title: 'Filtering: Bayes with time indices',
      source: 'L2 p.12, p.15',
      scene3d: (
        <JointSliceScene
          m={fm}
          P={fP}
          R={fR}
          z0={fz}
          renorm={fRen}
          labels={{ prior: 'p(x_k\\mid\\Z^{k-1})', lik: 'p(z_k\\mid x_k)', post: 'p(x_k\\mid\\Z^{k})', joint: 'p(z_k\\mid x_k)p(x_k\\mid\\Z^{k-1})' }}
        />
      ),
      panel: (
        <>
          <Say>Let's write it the lecture's way. Three moves, each with a name:</Say>
          <Derivation
            steps={[
              { tex: '\\post{p(\\x_k\\mid\\Z^k)} = p(\\x_k\\mid \\z_k, \\Z^{k-1})', why: '① Unpack Z^k: “all data up to k” = “the new z_k” plus “all older data Z^{k−1}”.' },
              {
                tex: '= \\frac{p(\\z_k\\mid\\x_k, \\Z^{k-1})\\; \\pred{p(\\x_k\\mid\\Z^{k-1})}}{\\int p(\\z_k\\mid\\x_k,\\Z^{k-1})\\, p(\\x_k\\mid\\Z^{k-1})\\, d\\x_k}',
                why: "② Bayes' theorem — exactly as in Ch 1, with everything also conditioned on the old data Z^{k−1}.",
              },
              {
                tex: '= \\frac{\\overbrace{\\meas{p(\\z_k\\mid\\x_k)}}^{\\text{likelihood}}\\; \\overbrace{\\pred{p(\\x_k\\mid\\Z^{k-1})}}^{\\text{prior = prediction}}}{\\underbrace{\\int \\meas{p(\\z_k\\mid\\x_k)}\\, \\pred{p(\\x_k\\mid\\Z^{k-1})}\\, d\\x_k}_{\\text{normalisation constant}}}',
                why: '③ Sensor model: the radar reading depends only on where the car IS now — not on older readings. So drop Z^{k−1} from the likelihood.',
              },
            ]}
          />
          <FormulaExplained
            tex="\post{p(\x_k\mid\Z^k)} \;\propto\; \meas{p(\z_k\mid\x_k)}\;\pred{p(\x_k\mid\Z^{k-1})}"
            symbols={[
              ['\\meas{p(\\z_k\\mid\\x_k)}', 'likelihood = sensor model. “If the car were at x_k, how plausible is z_k?”'],
              ['\\pred{p(\\x_k\\mid\\Z^{k-1})}', 'prior = the prediction from the last step'],
              ['\\propto', '“proportional to” — equal up to the rescaling constant'],
            ]}
          />
          <TryIt>
            Same picture as Ch 1 beat 10 — the yellow landscape is the joint, the red plane is the reading, its rescaled slice is the new belief.
            <Controls>
              <Slider label="\meas{z_k}" value={fz} min={-3} max={3} onChange={setFz} />
              <Slider label="\meas{R}\ \text{(sensor variance)}" value={fR} min={0.1} max={2.5} onChange={setFR} />
              <Slider label="\text{rescale}" value={fRen} min={0} max={1} step={1} onChange={setFRen} fmt={(v) => (v ? 'on' : 'off')} />
            </Controls>
          </TryIt>
          <Check
            q="Which assumption lets us write p(z_k | x_k) instead of p(z_k | x_k, Z^{k−1})?"
            options={[
              { text: 'The Markov property of the dynamics', why: 'That one is used in the PREDICTION step.' },
              { text: 'The measurement depends only on the current state (sensor model; noise independent over time)', correct: true, why: 'Yes: given where the car is now, older readings tell us nothing extra about the new reading.' },
              { text: 'The Gaussian assumption', why: 'Nothing here needs Gaussians — it works for any density.' },
            ]}
          />
        </>
      ),
    },
    // ------------------------------------------------------------ 8
    {
      title: 'The rescaling constant tells you how surprised to be',
      source: 'V5 p.17; MHT p.10',
      scene2d: <ExpectedMeasPlot m={fm} P={fP} R={fR} z={fz} />,
      panel: (
        <>
          <Say>
            That boring denominator — the number we divide by to rescale — hides a gem. Read it as a function of the measurement <M>{'\\z_k'}</M>: <b>where did we expect the radar
            reading to land?</b>
          </Say>
          <FormulaExplained
            tex="p(\z_k\mid\Z^{k-1}) = \int \meas{p(\z_k\mid\x_k)}\, \pred{p(\x_k\mid\Z^{k-1})}\, d\x_k"
            symbols={[
              ['p(\\z_k\\mid\\Z^{k-1})', 'the expected-measurement density: before the beep, how likely is each possible reading?'],
              ['\\int \\dots d\\x_k', 'add over every place the car could be (marginal again!)'],
            ]}
          />
          <Everyday title="Why it's wider than the prediction">
            <p>
              Two things make the reading uncertain: we're not sure where the car is (green) AND the radar adds its own noise. So the orange curve is <b>wider</b> than the green one.
              In the Gaussian case: variance P + R.
            </p>
          </Everyday>
          <Predict
            q="A reading arrives far out in the tail of the orange curve. What might be going on?"
            answer={<p>Either something unusual happened (the car braked hard) — or the reading is <b>not from our car at all</b>: a different car, a bird, a reflection from a building (“clutter”). That suspicion is the idea behind <b>gating</b>.</p>}
          />
          <TryIt>
            <Controls>
              <Slider label="\meas{z_k}" value={fz} min={-3} max={3} onChange={setFz} />
              <Slider label="\meas{R}" value={fR} min={0.1} max={2.5} onChange={setFR} />
            </Controls>
            <div className="readout">
              <Tex tex={`p(z_k = ${fz.toFixed(2)}\\mid\\Z^{k-1}) = ${normal1(fz, fm, fP + fR).toFixed(3)}`} />
            </div>
          </TryIt>
          <Connect>
            Ch 3: in Kalman language it's <M>{'\\N(\\z_k;\\, \\mathbf H\\x_{k|k-1},\\, \\mathbf S)'}</M> with <M>{'\\mathbf S = \\mathbf H\\mathbf P\\mathbf H^\\top + \\mathbf R'}</M>{' '}
            (“innovation covariance”). Ch 6: gating = throw away readings too far out in this curve. Ch 8: in MHT, this number is the weight of each hypothesis. Ch 10: track
            extraction compares it against “just clutter”.
          </Connect>
        </>
      ),
    },
    // ------------------------------------------------------------ 9
    {
      title: 'Run the whole machine',
      source: 'L2 p.15',
      scene3d: <RunScene run={run} k={kShow} retro={0} />,
      panel: (
        <>
          <Say>
            Time for the live demo. The yellow line is the true car (we cheat and show it). Red dots are radar readings. Each slice going into the screen is our belief at one time
            step. Press <b>Step</b> and narrate out loud: “predict… measure… filter…”
          </Say>
          <div className="btn-row">
            <Button primary onClick={() => setKShow(Math.min(kShow + 1, K))}>
              Step k → {Math.min(kShow + 1, K)}
            </Button>
            <Button onClick={() => setAuto(!auto)}>{auto ? 'Pause' : 'Auto-play'}</Button>
            <Button onClick={() => setKShow(0)}>Reset</Button>
            <Button onClick={() => (setSeed(seed + 1), setKShow(0))}>New data</Button>
          </div>
          <Predict
            q="At k = 0 we have two guesses about where the car starts (two bumps). What happens to the wrong bump after the first couple of radar readings?"
            answer={<p>It <b>dies</b>. The readings are far from it, so its likelihood is tiny; prior × tiny ≈ 0. After one or two steps only the right bump survives. Press Step and watch.</p>}
          />
          <TryIt>
            <Controls>
              <Slider label="q\ (\text{car randomness})" value={q} min={0.05} max={1.5} onChange={setQ} />
              <Slider label="R\ (\text{radar noise})" value={r} min={0.05} max={3} onChange={setR} />
            </Controls>
            <ul>
              <li>Big R, small q: the filter trusts physics; the belief moves smoothly and ignores wild readings.</li>
              <li>Small R, big q: the filter trusts the radar; the belief jumps to every reading.</li>
            </ul>
            {kShow > 0 && (
              <div className="readout">
                <Tex
                  tex={`k=${kShow}:\\ \\text{variance}\\ \\pred{${moments(G, run.pred[kShow]).variance.toFixed(2)}}\\ \\text{(predicted)} \\to \\post{${moments(G, run.filt[kShow]).variance.toFixed(2)}}\\ \\text{(filtered)}`}
                />
              </div>
            )}
          </TryIt>
          <Idea>Predict (wider) → measure → filter (narrower) → predict … The width settles to a balance between motion randomness and sensor noise.</Idea>
        </>
      ),
    },
    // ------------------------------------------------------------ 10
    {
      title: 'Retrodiction: the present improves the past',
      source: 'L2 p.27–29; MHT p.9',
      scene3d: <RunScene run={run} k={K} retro={showRetro} pick={lPick} />,
      panel: (
        <>
          <Everyday title="A detective story">
            <p>
              At 9:00 pm the suspect was either in the kitchen or the garden — 50/50, no idea. At 9:01 a camera sees them at the garden gate. You can't get from the kitchen to the
              gate in one minute. So you now know: <b>at 9:00 they were in the garden</b>. New evidence changed what you believe about the <i>past</i>.
            </p>
          </Everyday>
          <Say>
            Our car run is the same story. At k = 0 the filter had two bumps. Later readings showed the car going one way — so looking back, the start must have been the left bump.
            Turn on retrodiction and look at k = 0.
          </Say>
          <Idea>Retrodiction = use ALL data (including later ones) to improve the belief about an earlier time. It runs backwards in time.</Idea>
          <Derivation
            steps={[
              { tex: '\\retro{p(\\x_l\\mid\\Z^k)} = \\int p(\\x_l, \\x_{l+1}\\mid\\Z^k)\\, d\\x_{l+1}', why: '① Marginalisation: bring in the NEXT state x_{l+1}, then add it away.' },
              { tex: '= \\int p(\\x_l\\mid\\x_{l+1}, \\Z^k)\\; \\retro{p(\\x_{l+1}\\mid\\Z^k)}\\, d\\x_{l+1}', why: '② Conditional rule. The second factor is the retrodiction one step later — so we can run backwards, step by step.' },
              {
                tex: 'p(\\x_l\\mid\\x_{l+1}, \\Z^k) = p(\\x_l\\mid\\x_{l+1}, \\Z^l) = \\frac{p(\\x_{l+1}\\mid\\x_l)\\; \\post{p(\\x_l\\mid\\Z^l)}}{\\int p(\\x_{l+1}\\mid\\x_l)\\, p(\\x_l\\mid\\Z^l)\\, d\\x_l}',
                why: '③ If we knew x_{l+1} exactly, data after l add nothing about x_l (Markov again). Then Bayes: dynamics model × the filtered belief at l.',
              },
              {
                tex: '\\retro{p(\\x_l\\mid\\Z^k)} = \\int \\frac{p(\\x_{l+1}\\mid\\x_l)\\; \\post{p(\\x_l\\mid\\Z^l)}}{\\pred{p(\\x_{l+1}\\mid\\Z^l)}}\\; \\retro{p(\\x_{l+1}\\mid\\Z^k)}\\, d\\x_{l+1}',
                why: '④ The denominator is just the prediction for l+1 (Chapman–Kolmogorov!). Every piece was already computed in the forward run.',
              },
            ]}
          />
          <TryIt>
            <Controls>
              <Slider label="\text{show retrodiction}" value={showRetro} min={0} max={1} step={1} onChange={setShowRetro} fmt={(v) => (v ? 'on' : 'off')} />
              <Slider label="l\ (\text{time to inspect})" value={lPick} min={0} max={K - 1} step={1} onChange={setLPick} fmt={(v) => v.toFixed(0)} />
            </Controls>
            <div className="readout">
              <Tex
                tex={`l=${lPick}:\\ \\text{variance}\\ \\post{${moments(G, run.filt[lPick]).variance.toFixed(3)}}\\ \\text{(filtered)} \\to \\retro{${moments(G, run.retro[lPick]).variance.toFixed(3)}}\\ \\text{(retrodicted)}`}
              />
            </div>
          </TryIt>
          <Pitfall>Retrodiction cannot be done in real time for the current moment — it needs FUTURE data. It's for “what really happened?” questions (e.g. reconstructing a track afterwards), and inside MHT to judge old hypotheses.</Pitfall>
          <Connect>
            Ch 3: for Gaussians this becomes the Rauch–Tung–Striebel formulas. Ch 8: MHT retrodicts hypothesis weights — “strong sons strengthen weak fathers”. That's this
            detective logic, applied to hypotheses.
          </Connect>
        </>
      ),
    },
    // ------------------------------------------------------------ 11
    {
      title: 'Chapter 2 on one page',
      source: 'MHT p.9, IMM p.2',
      scene2d: <LoopDiagram />,
      panel: (
        <>
          <Say>If the examiner says “explain Bayesian tracking”, you can now draw this loop and say:</Say>
          <NumTable
            head={['step', 'from → to', 'uses', 'rule']}
            rows={[
              ['prediction', <Tex tex="p(\x_{k-1}|\Z^{k-1})\to p(\x_k|\Z^{k-1})" />, 'dynamics model', 'marginal + Markov'],
              ['filtering', <Tex tex="p(\x_k|\Z^{k-1})\to p(\x_k|\Z^{k})" />, 'sensor data + sensor model', 'Bayes'],
              ['retrodiction', <Tex tex="p(\x_{l+1}|\Z^{k})\to p(\x_l|\Z^{k})" />, 'filtering output + dynamics', 'marginal + Bayes'],
            ]}
          />
          <Idea>Everything else in the course is a way to compute these three steps when exact computation is impossible.</Idea>
          <Connect>
            <ul>
              <li>
                <b>Kalman</b> (Ch 3): linear + Gaussian → exact, three-line formulas.
              </li>
              <li>
                <b>EKF / UKF</b> (Ch 4): non-linear → approximations.
              </li>
              <li>
                <b>PDAF / MHT</b> (Ch 8): we don't know which reading is ours → the belief becomes a mixture of bumps.
              </li>
              <li>
                <b>IMM</b> (Ch 9): we don't know which dynamics model is active → also a mixture.
              </li>
              <li>
                <b>SLRT</b> (Ch 10): how does the loop START? (“initiation of the pdf iteration”).
              </li>
            </ul>
          </Connect>
        </>
      ),
    },
  ];

  const cards: Card[] = [
    {
      id: 'c2-loop',
      beat: 0,
      q: 'What is the basic idea of Bayesian tracking? Name the three steps and what each one uses.',
      a: (
        <p>
          Iterative updating of conditional pdfs of the state given all data. <b>Prediction</b> <M>{'p(\\x_{k-1}|\\Z^{k-1})\\to p(\\x_k|\\Z^{k-1})'}</M> uses the dynamics model;{' '}
          <b>filtering</b> <M>{'p(\\x_k|\\Z^{k-1})\\to p(\\x_k|\\Z^k)'}</M> uses the new data and the sensor model; <b>retrodiction</b>{' '}
          <M>{'p(\\x_{l+1}|\\Z^k)\\to p(\\x_l|\\Z^k)'}</M> uses the filtering output and the dynamics model.
        </p>
      ),
    },
    {
      id: 'c2-ck',
      beat: 4,
      q: 'Derive the prediction equation (Chapman–Kolmogorov) and name every step.',
      a: (
        <>
          <Tex tex="p(\x_k|\Z^{k-1}) = \int p(\x_k,\x_{k-1}|\Z^{k-1})d\x_{k-1} = \int p(\x_k|\x_{k-1},\Z^{k-1})p(\x_{k-1}|\Z^{k-1})d\x_{k-1} = \int p(\x_k|\x_{k-1})\,p(\x_{k-1}|\Z^{k-1})\,d\x_{k-1}" block />
          <p>Marginalisation → conditional-pdf rule → Markov property. In words: for every new state, add up all routes from old states, weighted by how likely each old state was.</p>
        </>
      ),
      followUp: 'Where exactly is the Markov assumption used, and what would break without it?',
    },
    {
      id: 'c2-filter',
      beat: 7,
      q: 'Derive the filtering equation and name the likelihood, the prior and the normalisation constant.',
      a: (
        <>
          <Tex tex="p(\x_k|\Z^k) = \frac{p(\z_k|\x_k)\,p(\x_k|\Z^{k-1})}{\int p(\z_k|\x_k)\,p(\x_k|\Z^{k-1})\,d\x_k}" block />
          <p>Unpack Z^k = {'{z_k, Z^{k−1}}'}, apply Bayes, use that the reading depends only on the current state. Likelihood = sensor model; prior = prediction; denominator normalises.</p>
        </>
      ),
    },
    {
      id: 'c2-smear',
      beat: 5,
      q: 'Why does prediction increase the uncertainty and filtering decrease it?',
      a: <p>Prediction adds the randomness of the motion (every route is possible) and adds no information. Filtering multiplies by the likelihood, cutting away states that don't fit the measurement, and renormalising concentrates the probability.</p>,
    },
    {
      id: 'c2-expected',
      beat: 8,
      q: 'What is p(zₖ | Zᵏ⁻¹) and what is it used for?',
      a: <p>The normalisation constant of the filtering step, read as a function of the reading: where we expect the next measurement. Used for gating, innovation statistics, MHT hypothesis weights and track extraction.</p>,
    },
    {
      id: 'c2-retro',
      beat: 10,
      q: 'What is retrodiction, why is it useful, and how is it computed?',
      a: (
        <>
          <p>Estimating a past state with all data up to now, p(x_l | Z^k), l &lt; k. It is more accurate than filtering because later data also carry information about the past (detective example). Computed backwards:</p>
          <Tex tex="p(\x_l|\Z^k)=\int \frac{p(\x_{l+1}|\x_l)\,p(\x_l|\Z^l)}{p(\x_{l+1}|\Z^l)}\,p(\x_{l+1}|\Z^k)\,d\x_{l+1}" block />
        </>
      ),
      followUp: 'What does retrodiction become for Gaussians? (Rauch–Tung–Striebel — Ch 3.)',
    },
  ];

  return <ChapterShell id="ch2" num={2} title="The Bayesian recursion" beats={beats} cards={cards} beat={beat} setBeat={setBeat} />;
}

// ---------------------------------------------------------------- scenes

const S1 = 1.6;

function OverviewScene({ run }: { run: Run }) {
  const k = 3;
  const wx = G.xs.map(worldX);
  return (
    <>
      <Camera position={[-0.5, 4.2, 9.5]} target={[-1.8, 0.6, 1.8]} />
      <Lights />
      <gridHelper args={[12, 24, C.grid, C.grid]} position={[0, -0.001, 0]} />
      <Density xs={wx} p={run.filt[k - 1]} scale={S1} z={zAt(k - 1)} color={C.post} />
      <Label position={[-5.2, 0.4, zAt(k - 1)]} tex="p(x_{k-1}\mid\Z^{k-1})" color={C.post} />
      <Density xs={wx} p={run.pred[k]} scale={S1} z={zAt(k) + 0.25} color={C.pred} opacity={0.15} />
      <Label position={[-5.2, 0.4, zAt(k) + 0.25]} tex="p(x_k\mid\Z^{k-1})" color={C.pred} />
      <Density xs={wx} p={run.filt[k]} scale={S1} z={zAt(k) - 0.25} color={C.post} />
      <Label position={[-5.2, 0.4, zAt(k) - 0.25]} tex="p(x_k\mid\Z^{k})" color={C.post} />
      <Dot position={[worldX(run.z[k]), 0.02, zAt(k) - 0.25]} color={C.meas} r={0.1} />
      <Label position={[worldX(run.z[k]), -0.35, zAt(k) - 0.25]} tex="z_k" color={C.meas} />
      <Label position={[-6, 0, zAt(5) - 0.4]} color={C.muted}>
        time →
      </Label>
    </>
  );
}

function KernelScene({ u, q }: { u: number; q: number }) {
  return (
    <>
      <Camera position={[6.5, 5.5, 7]} target={[0, 0.5, 0]} />
      <Lights />
      <Axes x={4} z={4} y={3} xLabel="x_{k-1}" zLabel="x_k" yLabel="p" />
      <Surface f={(a, b) => 1.3 * transition(b, a, u, q)} xr={[-4, 4]} yr={[-4, 4]} color={C.pred} opacity={0.75} />
      <Curve points={linspace(-4, 4, 2).map((a) => [a, 0.01, -(a + u)] as P3)} color={C.accent} dashed width={2} />
      <Label position={[2.8, 0.2, -(2.8 + u) - 0.4]} tex="x_k = x_{k-1}+u" color={C.accent} />
    </>
  );
}

const xs8 = linspace(-4, 4, 161);
const prevPost = (x: number) => 0.55 * normal1(x, -2, 0.3) + 0.45 * normal1(x, 1, 0.45);

function ChapmanScene({ u, q, mult, integ }: { u: number; q: number; mult: number; integ: number }) {
  const tm = useAnimated(mult, 3);
  const ti = useAnimated(integ, 3);
  const dx = xs8[1] - xs8[0];
  const pred = xs8.map((b) => xs8.reduce((s, a) => s + transition(b, a, u, q) * prevPost(a), 0) * dx);
  const f = (a: number, b: number) => 1.3 * transition(b, a, u, q) * (1 - tm + tm * prevPost(a) * 1.6);
  const wall = 4.4;
  return (
    <>
      <Camera position={[-6, 6.5, 8]} target={[0.5, 0.5, 0]} />
      <Lights />
      <Axes x={4} z={4} y={3} xLabel="x_{k-1}" zLabel="x_k" yLabel="p" />
      <Surface f={f} xr={[-4, 4]} yr={[-4, 4]} color={tm > 0.5 ? C.joint : C.pred} opacity={0.8 - 0.25 * ti} />
      <Density xs={xs8} p={xs8.map(prevPost)} scale={H1} z={4.4} color={C.post} />
      <Label position={[-2, H1 * prevPost(-2) + 0.35, 4.4]} tex="p(x_{k-1}\mid\Z^{k-1})" color={C.post} />
      {ti > 0.02 && (
        <>
          <Curve points={xs8.map((b, i) => [wall, ti * H1 * pred[i], -b] as P3)} color={C.pred} width={4} />
          <Label position={[wall, ti * H1 * Math.max(...pred) + 0.4, -(-1.4 + u)]} tex="p(x_k\mid\Z^{k-1})" color={C.pred} />
        </>
      )}
    </>
  );
}

function SmearScene({ u, q, n }: { u: number; q: number; n: number }) {
  const g = useMemo(() => makeGrid(-6, 6, 241), []);
  const dens = useMemo(() => {
    const out = [mixtureOnGrid(g, [{ w: 1, m: -3, s2: 0.15 }])];
    for (let i = 1; i <= 6; i++) out.push(predict(g, out[i - 1], u * 0.8, q));
    return out;
  }, [g, u, q]);
  return (
    <>
      <Camera position={[0.5, 4.5, 8.5]} target={[0, 0.6, 0]} />
      <Lights />
      <gridHelper args={[12, 24, C.grid, C.grid]} />
      {dens.slice(0, n + 1).map((p, i) => (
        <Density key={i} xs={g.xs} p={p} scale={2} z={-i * 0.5} color={i === 0 ? C.post : C.pred} opacity={i === n ? 0.25 : 0.06} width={i === n ? 3.5 : 1.5} />
      ))}
      <Label position={[-3, 2 * Math.max(...dens[0]) + 0.3, 0]} tex="p(x_{k}\mid\Z^{k})" color={C.post} />
      {n > 0 && <Label position={[-3 + n * u * 0.8, 2 * Math.max(...dens[n]) + 0.35, -n * 0.5]} tex={`p(x_{k+${n}}\\mid\\Z^{k})`} color={C.pred} />}
    </>
  );
}

function ExpectedMeasPlot({ m, P, R, z }: { m: number; P: number; R: number; z: number }) {
  const xs = linspace(-4, 4, 401);
  return (
    <Plot
      x={[-4, 4]}
      y={[0, 0.65]}
      series={[
        { xs, ys: xs.map((x) => normal1(x, m, P)), color: C.pred, label: 'p(x_k\\mid\\Z^{k-1})', dashed: true, width: 2 },
        { xs, ys: xs.map((x) => normal1(x, m, P + R)), color: C.accent, fill: true, label: 'p(z_k\\mid\\Z^{k-1})' },
      ]}
      vlines={[{ x: z, color: C.meas, label: 'z_k' }]}
      points={[{ x: z, y: normal1(z, m, P + R), color: C.meas }]}
    />
  );
}

function RunScene({ run, k, retro, pick }: { run: Run; k: number; retro: number; pick?: number }) {
  const t = useAnimated(retro, 3);
  const wx = G.xs.map(worldX);
  const items = [];
  for (let i = 0; i <= k; i++) {
    const p = i === 0 && t === 0 ? run.filt[i] : run.filt[i].map((v, j) => (1 - t) * v + t * run.retro[i][j]);
    const isCur = i === k && t < 0.5;
    const hi = pick === i && t > 0.5;
    items.push(<Density key={'f' + i} xs={wx} p={p} scale={S1} z={zAt(i)} color={t > 0.5 ? C.retro : C.post} opacity={isCur || hi ? 0.28 : 0.1} width={isCur || hi ? 3.5 : 1.6} />);
    if (i > 0) items.push(<Dot key={'z' + i} position={[worldX(run.z[i]), 0.02, zAt(i)]} color={C.meas} r={0.07} />);
  }
  if (k > 0 && t < 0.5) items.push(<Density key="pred" xs={wx} p={run.pred[k]} scale={S1} z={zAt(k) + 0.3} color={C.pred} opacity={0.08} width={2} />);
  const truthPts = run.truth.slice(0, k + 1).map((x, i) => [worldX(x), 0.02, zAt(i)] as P3);
  return (
    <>
      <Camera position={[1, 6, 10]} target={[0, 0.3, 0]} />
      <Lights />
      <gridHelper args={[12, 24, C.grid, C.grid]} position={[0, -0.001, 0]} />
      {items}
      <Curve points={truthPts} color={C.truth} width={2} />
      {truthPts.length > 0 && <Dot position={truthPts[truthPts.length - 1]} color={C.truth} r={0.09} />}
      <Label position={[-6.2, 0, zAt(0)]} color={C.muted}>
        k = 0
      </Label>
      {k > 0 && (
        <Label position={[-6.2, 0, zAt(k)]} color={C.muted}>
          k = {k}
        </Label>
      )}
    </>
  );
}

function LoopDiagram() {
  const box = (x: number, y: number, w: number, label: string, color: string) => (
    <g>
      <rect x={x} y={y} width={w} height={64} rx={12} fill="#11141b" stroke={color} strokeWidth={2} />
      <foreignObject x={x} y={y + 14} width={w} height={44}>
        <div style={{ textAlign: 'center', color, fontSize: 20 }}>
          <Tex tex={label} />
        </div>
      </foreignObject>
    </g>
  );
  const arrow = (x1: number, y1: number, x2: number, y2: number, color: string) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2.5} markerEnd="url(#ah)" />;
  return (
    <div className="plot">
      <svg viewBox="0 0 800 460">
        <defs>
          <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill={C.muted} />
          </marker>
        </defs>
        {box(40, 60, 220, 'p(\\x_{k-1}\\mid\\Z^{k-1})', C.post)}
        {box(290, 60, 220, 'p(\\x_k\\mid\\Z^{k-1})', C.pred)}
        {box(540, 60, 220, 'p(\\x_k\\mid\\Z^{k})', C.post)}
        {box(290, 330, 220, 'p(\\x_l\\mid\\Z^{k})', C.retro)}
        {arrow(262, 92, 286, 92, C.pred)}
        {arrow(512, 92, 536, 92, C.post)}
        {arrow(650, 128, 470, 326, C.retro)}
        <path d="M650,128 C650,260 150,260 150,130" fill="none" stroke={C.muted} strokeWidth={2} strokeDasharray="6 5" markerEnd="url(#ah)" />
        <text x={274} y={45} fill={C.pred} fontSize={15} textAnchor="middle">
          dynamics model
        </text>
        <text x={524} y={45} fill={C.post} fontSize={15} textAnchor="middle">
          sensor data + model
        </text>
        <text x={600} y={250} fill={C.retro} fontSize={15}>
          filtering output + dynamics
        </text>
        <text x={330} y={255} fill={C.muted} fontSize={14}>
          k → k+1
        </text>
      </svg>
    </div>
  );
}
