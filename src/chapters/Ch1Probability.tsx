import { useMemo, useState } from 'react';
import { conditionalXgivenY, covFrom, ellipse, normal1, normal2 } from '../engine/gaussian';
import { M2, V2 } from '../engine/mat2';
import { mulberry32, randn } from '../engine/rng';
import { Axes, Camera, Curve, Dot, Density, Label, Lights, linspace, P3, Plane, Surface, useAnimated } from '../three/primitives';
import { H1, H2, JointSliceScene, PointCloud } from '../three/scenes';
import { JOINT, TableScene } from '../three/table';
import { Beat, ChapterShell } from '../ui/ChapterShell';
import { Controls, Derivation, Slider } from '../ui/controls';
import { BayesPipeline } from '../ui/discrete';
import { Card } from '../ui/ExplainCards';
import { ChapterIntro, Check, Connect, Everyday, FormulaExplained, Idea, NumTable, Pitfall, Predict, Question, Say, TryIt, Worked } from '../ui/learn';
import { Plot } from '../ui/Plot';
import { M, Tex } from '../ui/Tex';
import { C } from '../ui/theme';

// ------------------------------------------------------------------ data used by the beats

const xsM = linspace(80, 120, 801); // positions in metres
const uniform = (x: number) => (x >= 90 && x <= 110 ? 0.05 : 0);
const bumpy = (x: number, w = 0.6) => w * normal1(x, 96, 9) + (1 - w) * normal1(x, 108, 4);
const trapz = (xs: number[], ys: number[]) => ys.reduce((s, y, i) => (i ? s + 0.5 * (y + ys[i - 1]) * (xs[i] - xs[i - 1]) : 0), 0);
const between = (f: (x: number) => number, a: number, b: number) => {
  const xs = linspace(a, b, 600);
  return trapz(xs, xs.map(f));
};
const CELLS = [100, 110, 120, 130];
const PRIOR4 = [0.1, 0.4, 0.4, 0.1];

export default function Ch1Probability({ beat, setBeat }: { beat: number; setBeat: (b: number) => void }) {
  const [spread, setSpread] = useState(0.8);
  const [shape, setShape] = useState(1);
  const [a, setA] = useState(95);
  const [b, setB] = useState(100);
  const [w, setW] = useState(0.6);
  const [sig, setSig] = useState(5);
  const [sx, setSx] = useState(1.1);
  const [sy, setSy] = useState(0.9);
  const [rho, setRho] = useState(0.6);
  const [tabMode7, setTab7] = useState(1);
  const [collapse, setCollapse] = useState(0);
  const [tabMode8, setTab8] = useState(1);
  const [y0, setY0] = useState(0.8);
  const [renormC, setRenormC] = useState(0);
  const [z4, setZ4] = useState(125);
  const [r4, setR4] = useState(10);
  const [bm, setBm] = useState(-0.8);
  const [bP, setBP] = useState(1.2);
  const [bR, setBR] = useState(0.6);
  const [bz, setBz] = useState(1.2);
  const [bRen, setBRen] = useState(0);
  const [gx, setGx] = useState(0);
  const [gy, setGy] = useState(0);
  const [dt, setDt] = useState(1);
  const [morph, setMorph] = useState(1);
  const [dsig, setDsig] = useState(1);

  const P = covFrom(sx, sy, rho);
  const m0: V2 = [0, 0];
  const pdfF = shape ? (x: number) => bumpy(x) : uniform;
  const area = between(pdfF, a, b);
  const EX = trapz(
    xsM,
    xsM.map((x) => x * bumpy(x, w)),
  );
  const lik4 = CELLS.map((c) => Math.exp(-0.5 * ((z4 - c) / r4) ** 2));
  const prod4 = PRIOR4.map((p, i) => p * lik4[i]);
  const post4 = prod4.map((v) => v / prod4.reduce((s, x) => s + x, 0));
  const cloud = useMemo(() => {
    const r = mulberry32(3);
    return Array.from({ length: 900 }, () => [randn(r), randn(r) * 0.6, randn(r)] as P3);
  }, []);
  const pFast = JOINT[0][1] + JOINT[1][1];

  const beats: Beat[] = [
    // ------------------------------------------------------------ 0
    {
      title: 'Welcome: the car you cannot see',
      source: 'L1, L2 p.5',
      scene3d: <StateCloud cloud={cloud} spread={0.8} />,
      panel: (
        <>
          <Say>
            Imagine a dark night. A car is driving down a long straight road. You are sitting in a radar station. You <b>cannot see the car</b>. All you get is a beep every
            second: <i>“the car is at 103 metres.”</i> Next second: <i>“118 metres.”</i>
          </Say>
          <Say>
            But your radar is not perfect. When it says 103 m, the car might really be at 99 m, or 107 m. So here's the question that this <b>entire course</b> is about:
          </Say>
          <Question>
            <b>Where is the car — really?</b> And how sure can we be?
          </Question>
          <Say>
            To answer that honestly, we need a language for “I'm not sure”. That language is <b>probability</b>. This chapter gives you all of it — and I promise, every single
            piece comes back later in the course. Nothing here is decoration.
          </Say>
          <ChapterIntro
            why={<p>Every tracking method in the lectures (Kalman, PDAF, MHT, IMM, SLRT) is just a clever way of calculating with probability densities. If this chapter is solid, the rest is “just” applying it.</p>}
            needs={<p>Nothing! Only school maths: fractions, averages, and what a graph is.</p>}
            learn={[
              'Why the state of an object is a “random variable”',
              'What a probability density is, and why probability is an AREA',
              'Mean (expectation) and spread (variance, σ)',
              'Joint, marginal and conditional probabilities — first with a table, then with a 3D landscape',
              "Bayes' rule, with real numbers from a radar",
              'Gaussians in 1D and 2D, and the ellipses you will see all semester',
              'Why linear maps keep Gaussians Gaussian (this IS the Kalman prediction)',
            ]}
          />
        </>
      ),
    },
    // ------------------------------------------------------------ 1
    {
      title: 'The state is unknown — so we treat it as random',
      source: 'L2 p.5, V5 p.4',
      scene3d: <StateCloud cloud={cloud} spread={spread} />,
      panel: (
        <>
          <Say>
            Let's give things names. Everything we want to know about the car at time step <M>{'k'}</M> we pack into one list of numbers called the <b>state</b>,{' '}
            <M>{'\\x_k'}</M>. For our car on a straight road it could simply be its position, say <M>{'x_k = 103\\,\\text{m}'}</M>.
          </Say>
          <Everyday title="What can go into a state? (from the lecture)">
            <ul>
              <li>
                a position on a line: <M>{'x \\in \\mathbb R'}</M> — one number
              </li>
              <li>
                position, velocity and acceleration in 3D: <M>{'\\x = (\\mathbf r, \\mathbf v, \\mathbf a) \\in \\mathbb R^9'}</M> — nine numbers
              </li>
              <li>
                two cars at once: <M>{'\\x = (\\x_1, \\x_2)'}</M> with <M>{'\\x_i = (x_i, y_i, \\dot x_i, \\dot y_i)'}</M> — eight numbers (the dot means “rate of change”, i.e.
                speed)
              </li>
              <li>a big object with a shape (“extended target”): kinematics plus a size/shape description</li>
              <li>kinematics plus a class: is it a car, a truck, a bike?</li>
            </ul>
          </Everyday>
          <Say>
            Now the key move. We <b>never know</b> <M>{'\\x_k'}</M> exactly. So instead of claiming “the car is at 103 m”, we say “the car is <i>probably</i> around 103 m,
            maybe a bit more, maybe a bit less”. A quantity we're uncertain about, described by how likely each value is, is called a <b>random variable</b>.
          </Say>
          <Idea>We don't track the car. We track our BELIEF about the car — a cloud of possibilities, not a single point.</Idea>
          <TryIt>
            The yellow dot is the true car (nobody gets to see it — not even the radar). The blue cloud is our belief. Drag the slider: a <i>small</i> cloud means a good sensor and
            lots of data; a <i>big</i> cloud means we know little.
            <Controls>
              <Slider label="\text{uncertainty}" value={spread} min={0.15} max={1.5} onChange={setSpread} />
            </Controls>
          </TryIt>
          <Connect>
            The cloud has a name in the lectures: <M>{'p(\\x_k \\mid \\Z^k)'}</M> — “the probability density of the state at time k, given all data up to time k”. You'll see it
            on almost every slide. Chapter 2 is about how this cloud moves and shrinks over time.
          </Connect>
          <Check
            q="Why don't we just use the latest radar reading as the car's position?"
            options={[
              { text: 'Because the radar reading is always wrong', why: 'It is not always wrong — it is noisy. Usually close, never exact. We need a way to say HOW close.' },
              { text: 'Because the reading is noisy, and we want to also say how sure we are — and combine it with what we knew before', correct: true, why: 'Exactly. A single number hides the uncertainty. A probability density keeps it, so we can later combine old knowledge with new readings.' },
              { text: 'Because radars measure speed, not position', why: 'In this course the radar gives position-like quantities (range and angle). The issue is noise, not what is measured.' },
            ]}
          />
        </>
      ),
    },
    // ------------------------------------------------------------ 2
    {
      title: 'Probability lives in the AREA, not the height',
      source: 'L2 p.8, IMM p.3',
      scene2d: (
        <Plot
          x={[80, 120]}
          y={[0, 0.12]}
          series={[{ xs: xsM, ys: xsM.map(pdfF), color: C.post, label: 'p(x)\\ \\text{per metre}' }]}
          shade={{ series: 0, a, b, color: C.joint }}
          vlines={[
            { x: a, color: C.joint, dashed: true },
            { x: b, color: C.joint, dashed: true },
          ]}
        />
      ),
      panel: (
        <>
          <Say>
            Here's a puzzle that confuses almost everyone at first. The car is somewhere on a road. What is the probability that it is at <b>exactly</b> 100.000000… metres?
          </Say>
          <Predict
            q="What's the probability that the car is at EXACTLY 100 m (not 100.001, not 99.999)?"
            answer={
              <p>
                <b>Zero!</b> There are infinitely many possible positions, so any single exact point gets zero probability. That's why we can't use “probability of a point” for
                continuous quantities. We need something else: a <b>density</b>.
              </p>
            }
          />
          <Everyday title="Everyday example: sand on a road">
            <p>
              Imagine you have exactly <b>1 kg of sand</b> and you spread it along the road. Where the sand is piled high, the car is likely to be. Where there is no sand, it
              can't be there.
            </p>
            <p>
              The <b>height</b> of the sand pile at each spot is the density <M>{'p(x)'}</M>. How much sand lies between 95 m and 100 m? That's the probability that the car is
              in that stretch. Total sand = 1 kg = probability 1: the car is <i>somewhere</i>.
            </p>
          </Everyday>
          <Idea>A density is “probability per metre”. To get an actual probability, you measure the AREA under the curve over a stretch.</Idea>
          <FormulaExplained
            tex="P(a < x < b) = \int_a^b p(x)\,dx \qquad p(x)\ge 0, \qquad \int_{-\infty}^{\infty} p(x)\,dx = 1"
            symbols={[
              ['p(x)', 'the density: height of the sand pile at position x (units: probability per metre)'],
              ['\\int_a^b \\dots dx', '“add up the area between a and b” — the integral is just a very fine sum of thin strips'],
              ['p(x)\\ge 0', 'no negative sand'],
              ['\\int p(x)dx = 1', 'all the sand together = 1 (the car is certainly somewhere). This is called normalised.'],
            ]}
          />
          <Worked title="Worked example: the flat (uniform) belief">
            <p>Say the radar only tells us “the car is somewhere between 90 m and 110 m, no idea where”. Spread 1 kg of sand evenly over 20 metres:</p>
            <ul>
              <li>
                height = <M>{'1 / 20 = 0.05'}</M> per metre
              </li>
              <li>
                probability of being between 95 m and 100 m = width × height = <M>{'5 \\times 0.05 = 0.25'}</M> → 25 %
              </li>
            </ul>
            <p>Set the shape slider to “flat” and put a = 95, b = 100. The readout below says 0.250. Physics works!</p>
          </Worked>
          <TryIt>
            <Controls>
              <Slider label="\text{shape}" value={shape} min={0} max={1} step={1} onChange={setShape} fmt={(v) => (v ? 'bumpy' : 'flat')} />
              <Slider label="a\ (\text{m})" value={a} min={80} max={120} step={0.5} onChange={(v) => setA(Math.min(v, b))} fmt={(v) => v.toFixed(1)} />
              <Slider label="b\ (\text{m})" value={b} min={80} max={120} step={0.5} onChange={(v) => setB(Math.max(v, a))} fmt={(v) => v.toFixed(1)} />
            </Controls>
            <div className="readout">
              <Tex tex={`P(${a.toFixed(1)} < x < ${b.toFixed(1)}) = \\joint{${area.toFixed(3)}}`} />
            </div>
            Stretch a and b to cover everything: the area becomes 1.000. That is normalisation, live.
          </TryIt>
          <Pitfall>
            “Can a density be bigger than 1?” <b>Yes!</b> If you pile 1 kg of sand on just half a metre, the height must be 2 per metre so that the area is still 1. Only the{' '}
            <i>area</i> has to be ≤ 1, never the height.
          </Pitfall>
          <Connect>
            Every “p(…)” on the lecture slides is a density like this. When the slides write <M>{'\\int \\dots d\\x'}</M>, they're always adding up area (or volume in more
            dimensions).
          </Connect>
          <Check
            q="The car's position is spread evenly between 0 m and 4 m. What is the height p(x) of the density there?"
            options={[
              { text: '1', why: 'Then the area would be 4 × 1 = 4. Too much sand!' },
              { text: '0.25', correct: true, why: 'Area must be 1: width 4 × height 0.25 = 1.' },
              { text: '4', why: 'That would give area 16. Remember: area = 1, so height = 1 / width.' },
            ]}
          />
        </>
      ),
    },
    // ------------------------------------------------------------ 3
    {
      title: 'Expectation: where the sand pile balances',
      source: 'L2 p.8',
      scene2d: (
        <Plot x={[80, 120]} y={[0, 0.12]} series={[{ xs: xsM, ys: xsM.map((x) => bumpy(x, w)), color: C.post, label: 'p(x)', fill: true }]} vlines={[{ x: EX, color: C.joint, label: '\\mathbb E[x]' }]}>
          {(sx_, sy_) => <polygon points={`${sx_(EX)},${sy_(0)} ${sx_(EX) - 14},${sy_(0) + 22} ${sx_(EX) + 14},${sy_(0) + 22}`} fill={C.joint} />}
        </Plot>
      ),
      panel: (
        <>
          <Say>
            A cloud of possibilities is nice, but your boss wants <b>one number</b>: “where IS the car?” The most common answer is the <b>expectation</b> (also called the mean, or
            the expected value).
          </Say>
          <Everyday title="Everyday example: a die">
            <p>
              A fair die shows 1, 2, 3, 4, 5, 6, each with probability 1/6. The expectation is each value times its probability, added up:
            </p>
            <Tex tex="\mathbb E = 1\cdot\tfrac16 + 2\cdot\tfrac16 + 3\cdot\tfrac16 + 4\cdot\tfrac16 + 5\cdot\tfrac16 + 6\cdot\tfrac16 = 3.5" block />
            <p>You can never roll 3.5 — but it's the long-run average. Physically: if you put the die faces on a ruler as weights, 3.5 is where the ruler balances.</p>
          </Everyday>
          <Idea>The expectation is the balance point of the density: every possible value, weighted by how likely it is.</Idea>
          <FormulaExplained
            tex="\mathbb E[x] = \int x\, p(x)\, dx \qquad\qquad \mathbb E[g(x)] = \int g(x)\, p(x)\, dx"
            symbols={[
              ['\\mathbb E[x]', 'the expectation (mean) of x — our “best single guess” in the mean-squared-error sense'],
              ['x\\,p(x)', 'each position, weighted by how much sand is there'],
              ['g(x)', 'any quantity computed from the state (e.g. distance to the radar). The lectures call it an “observable”.'],
            ]}
          />
          <Predict
            q="The radar is confused: 50 % chance the car is at 90 m, 50 % chance it's at 110 m. Where is the expectation — and where is the car?"
            answer={
              <p>
                Expectation = <M>{'0.5 \\cdot 90 + 0.5 \\cdot 110 = 100'}</M> m. But the car is <b>never</b> at 100 m! It's either at 90 or 110. The mean can sit in a place
                that's impossible. Move the slider below to “50/50” and look at the yellow triangle sitting in the valley.
              </p>
            }
          />
          <TryIt>
            <Controls>
              <Slider label="\text{weight of left pile}" value={w} min={0} max={1} onChange={setW} />
            </Controls>
            <div className="readout">
              <Tex tex={`\\mathbb E[x] = \\joint{${EX.toFixed(1)}}\\ \\text{m}`} />
            </div>
          </TryIt>
          <Pitfall>The mean is NOT “the most likely position”. The highest point of the density (the mode) and the mean are different things when the density is lopsided or has two bumps.</Pitfall>
          <Connect>
            Remember this valley! In Chapter 8, the PDAF filter squeezes a two-bump belief into one bump at the mean — and the lecture's punchline is <i>“Problem: multimodality
            is lost!”</i>. That's exactly this picture. MHT keeps both bumps instead.
          </Connect>
          <Check
            q="A car is at 0 m with probability 0.8 and at 10 m with probability 0.2. What's the expectation?"
            options={[
              { text: '5 m', why: 'That would be the answer for 50/50. Here the left side is heavier.' },
              { text: '2 m', correct: true, why: '0.8 · 0 + 0.2 · 10 = 2 m. The balance point moves towards the heavier side.' },
              { text: '0 m', why: '0 m is the most likely position (the mode), but the mean also feels the 20 % at 10 m.' },
            ]}
          />
        </>
      ),
    },
    // ------------------------------------------------------------ 4
    {
      title: 'Spread: variance and the standard deviation σ',
      source: 'L2 p.8',
      scene2d: (
        <Plot
          x={[70, 130]}
          y={[0, 0.25]}
          series={[{ xs: linspace(70, 130, 601), ys: linspace(70, 130, 601).map((x) => normal1(x, 100, sig * sig)), color: C.post, label: '\\N(x;\\,100,\\,\\sigma^2)' }]}
          shade={{ series: 0, a: 100 - 2 * sig, b: 100 + 2 * sig, color: C.joint }}
          vlines={[
            { x: 100 - sig, color: C.accent, dashed: true, label: '\\pm 1\\sigma' },
            { x: 100 + sig, color: C.accent, dashed: true },
          ]}
        />
      ),
      panel: (
        <>
          <Say>
            Two radars both say “the car is at 100 m on average”. Radar A is a precision instrument. Radar B is from a cereal box. Same mean — completely different trust. We need a
            second number: <b>how spread out</b> is the belief?
          </Say>
          <FormulaExplained
            tex="\mathbb V[x] = \mathbb E\big[(x - \bar x)^2\big] = \sigma^2 \qquad\qquad \sigma = \sqrt{\mathbb V[x]}"
            symbols={[
              ['\\bar x', 'the mean, 𝔼[x]'],
              ['(x-\\bar x)^2', 'squared distance from the mean (squared so that left and right deviations both count as positive)'],
              ['\\mathbb V[x] = \\sigma^2', 'variance: the average squared distance from the mean (units: m²)'],
              ['\\sigma', 'standard deviation: the square root, back in metres. “Typical error size.”'],
            ]}
          />
          <Worked>
            <p>Back to the confused radar: 50 % at 90 m, 50 % at 110 m, mean 100 m.</p>
            <ul>
              <li>both possibilities are 10 m from the mean → squared distance 100 m²</li>
              <li>
                variance = <M>{'0.5\\cdot 100 + 0.5 \\cdot 100 = 100\\ \\text{m}^2'}</M>, so σ = 10 m
              </li>
            </ul>
          </Worked>
          <Everyday title="The 68 – 95 – 99.7 rule (for bell-shaped densities)">
            <p>For the bell curve (the Gaussian — more about it soon):</p>
            <NumTable head={['within', 'probability']} rows={[['± 1σ', '≈ 68 %'], ['± 2σ', '≈ 95 % (yellow area)'], ['± 3σ', '≈ 99.7 %']]} />
          </Everyday>
          <Predict
            q="Our belief: mean 100 m, σ = 5 m. Roughly how often will the car actually be more than 10 m away from 100 m?"
            answer={
              <p>
                10 m = 2σ. Inside ±2σ we have about 95 %, so outside: about <b>5 %</b>. Set σ = 5 below — the yellow area runs from 90 to 110 m.
              </p>
            }
          />
          <TryIt>
            <Controls>
              <Slider label="\sigma\ (\text{m})" value={sig} min={2} max={12} step={0.5} onChange={setSig} fmt={(v) => v.toFixed(1)} />
            </Controls>
            Notice: as σ grows, the bell gets wider and flatter — the area must stay 1, so it can't stay tall.
          </TryIt>
          <Connect>
            In the Kalman filter (Chapter 3) the matrix <M>{'\\mathbf P'}</M> is exactly this variance, grown up to several dimensions. Prediction makes <M>{'\\mathbf P'}</M>{' '}
            bigger, a measurement makes it smaller. And the “gating” of Chapter 6 asks “is this measurement more than ~3σ away?”
          </Connect>
          <Check
            q="Radar A has σ = 2 m, radar B has σ = 20 m. Which statement is right?"
            options={[
              { text: 'B is 10 times better because 20 > 2', why: 'Larger σ means MORE spread, i.e. LESS precise.' },
              { text: "A's variance is 4 m², B's is 400 m²: B's variance is 100× bigger", correct: true, why: 'Variance is σ². 10× the σ means 100× the variance.' },
              { text: 'They have the same variance because they have the same mean', why: 'Mean and spread are independent pieces of information.' },
            ]}
          />
        </>
      ),
    },
    // ------------------------------------------------------------ 5
    {
      title: 'Two unknowns at once: the joint table',
      source: 'L2 p.8, IMM p.3',
      scene3d: <TableScene mode="joint" />,
      panel: (
        <>
          <Say>
            Now we get serious. Real tracking never has just one unknown. We want <b>where</b> the car is AND <b>how fast</b> it goes. Let's start super simple: a table with only
            four boxes.
          </Say>
          <Everyday title="The setup">
            <p>
              We chop the possibilities into: position <b>near</b> or <b>far</b>, speed <b>slow</b> or <b>fast</b>. From experience on this road, the chances of each combination
              are:
            </p>
            <NumTable
              head={['', 'slow', 'fast']}
              rows={[
                ['near', JOINT[0][0].toFixed(2), JOINT[0][1].toFixed(2)],
                ['far', JOINT[1][0].toFixed(2), JOINT[1][1].toFixed(2)],
              ]}
            />
            <p>All four numbers add to 0.30 + 0.10 + 0.15 + 0.45 = 1.00. ✓ The 3D bars on the left are exactly these four numbers.</p>
          </Everyday>
          <Idea>A joint probability p(position, speed) answers “how likely is THIS position AND THIS speed together?”</Idea>
          <FormulaExplained
            tex="p(x, y), \qquad \sum_x \sum_y p(x,y) = 1 \quad\text{(table)} \qquad \iint p(x,y)\,dx\,dy = 1 \quad\text{(continuous)}"
            symbols={[
              ['p(x,y)', 'probability (or density) of x AND y together. The comma means “and”.'],
              ['\\sum_x\\sum_y', 'add up every box of the table'],
              ['\\iint \\dots dx\\,dy', 'the same thing when x and y are continuous: volume under a landscape'],
            ]}
          />
          <Predict
            q="Look at the numbers. Is a far-away car more likely to be slow or fast? What does that tell you?"
            answer={
              <p>
                Far & fast = 0.45 vs far & slow = 0.15 — far cars are mostly fast. Makes sense: fast cars <i>got</i> far! Position and speed are <b>connected</b> (statisticians say{' '}
                <i>correlated</i>). This connection is the secret engine of tracking: knowing the speed tells you something about where the car will be.
              </p>
            }
          />
          <Connect>
            The next two beats use this exact table to explain <b>marginal</b> and <b>conditional</b> probabilities. Then we switch to smooth landscapes — same ideas, infinitely
            many boxes.
          </Connect>
          <Check
            q="What's p(near, fast)?"
            options={[
              { text: '0.10', correct: true, why: 'Row “near”, column “fast”. That is the probability of both at once.' },
              { text: '0.55', why: '0.55 is p(fast) for ANY position (0.10 + 0.45). That is a marginal — next beat!' },
              { text: '0.40', why: '0.40 is p(near) for any speed (0.30 + 0.10).' },
            ]}
          />
        </>
      ),
    },
    // ------------------------------------------------------------ 6
    {
      title: 'From a table to a landscape: the joint density',
      source: 'L2 p.8',
      scene3d: (
        <>
          <Camera position={[6.5, 6, 7.5]} target={[0, 0.5, 0]} />
          <Lights />
          <Axes x={4} z={4} y={3} xLabel="x\ (\text{position})" zLabel="y\ (\text{speed})" yLabel="p(x,y)" />
          <Surface f={(x, y) => H2 * normal2([x, y], m0, P)} xr={[-4, 4]} yr={[-4, 4]} color={C.joint} />
          {[1, 2].map((c) => (
            <Curve key={c} points={ellipse(m0, P, c).map(([x, y]) => [x, 0.01, -y] as P3)} color={C.accent} width={1.5} />
          ))}
        </>
      ),
      panel: (
        <>
          <Say>
            Now cut the table into finer and finer boxes: 10 positions × 10 speeds, then 100 × 100, then infinitely many. The bars melt into a smooth <b>landscape</b>. The
            height is the joint density <M>{'p(x, y)'}</M>, and the <b>volume</b> under any patch is the probability of landing in that patch.
          </Say>
          <Everyday title="Reading the landscape">
            <ul>
              <li>Hill top = the most likely combination of position and speed.</li>
              <li>Wide hill = lots of uncertainty; narrow hill = we know a lot.</li>
              <li>
                <b>Tilted ridge</b> = the two variables are linked (like “far ↔ fast” in our table).
              </li>
            </ul>
          </Everyday>
          <FormulaExplained
            tex="\text{Cov}[x,y] = \mathbb E\big[(x-\bar x)(y-\bar y)\big], \qquad \rho = \frac{\text{Cov}[x,y]}{\sigma_x\,\sigma_y} \in [-1, 1]"
            symbols={[
              ['\\text{Cov}[x,y]', 'covariance: positive if “x above its mean” tends to come with “y above its mean”'],
              ['\\rho', 'correlation: covariance scaled to between −1 and +1. 0 = unrelated, ±1 = perfectly linked'],
              ['\\sigma_x, \\sigma_y', 'the standard deviations of x and y separately'],
            ]}
          />
          <Predict
            q="What happens to the hill when you set ρ = 0.9?"
            answer={<p>It becomes a narrow diagonal ridge. If you know y, x is almost pinned down — they move together. Try it below. Then try ρ = −0.9: the ridge flips direction.</p>}
          />
          <TryIt>
            <Controls>
              <Slider label="\sigma_x" value={sx} min={0.4} max={1.8} onChange={setSx} />
              <Slider label="\sigma_y" value={sy} min={0.4} max={1.8} onChange={setSy} />
              <Slider label="\rho" value={rho} min={-0.9} max={0.9} onChange={setRho} />
            </Controls>
            The orange rings on the floor are “contour lines” — places of equal height, like on a hiking map. For a Gaussian they are always ellipses.
          </TryIt>
          <Connect>
            In the Kalman filter the state is position AND velocity, and the covariance matrix <M>{'\\mathbf P'}</M> holds <M>{'\\sigma_x^2, \\sigma_y^2'}</M> on its diagonal and
            the covariance off the diagonal. When you see a tilted ellipse in Chapter 3, it's exactly this tilted ridge seen from above.
          </Connect>
          <Check
            q="The joint landscape is a perfectly round hill (ρ = 0). If I tell you y, what do you learn about x?"
            options={[
              { text: 'Nothing', correct: true, why: 'Round hill = independent. Every slice at any y has the same shape in x.' },
              { text: 'x is exactly equal to y', why: 'That would be ρ = 1 with equal σ — a razor-thin diagonal ridge.' },
              { text: 'x must be large', why: 'No link means no information transfers between them.' },
            ]}
          />
        </>
      ),
    },
    // ------------------------------------------------------------ 7
    {
      title: 'Marginal: forget a variable by adding it up',
      source: 'L2 p.8, IMM p.3',
      scene3d: tabMode7 ? <TableScene mode="marginal" /> : <MarginalScene P={P} collapse={collapse} />,
      panel: (
        <>
          <Question>We know the joint p(position, speed). But right now we only care about the position. What's p(position) alone?</Question>
          <Everyday title="With the table">
            <p>Just add along each row — speed doesn't matter, so we count both speeds:</p>
            <NumTable
              head={['', 'slow', 'fast', 'row sum = p(position)']}
              highlightCol={3}
              rows={[
                ['near', '0.30', '0.10', '0.40'],
                ['far', '0.15', '0.45', '0.60'],
              ]}
            />
            <p>
              So <M>{'p(\\text{near}) = 0.40'}</M> and <M>{'p(\\text{far}) = 0.60'}</M>. They add to 1 ✓. In the 3D view, watch the two bars of each row slide together and stack
              up — that stack IS the row sum.
            </p>
          </Everyday>
          <Idea>Marginalising = “I don't care about y” = add up (integrate) over all values of y.</Idea>
          <FormulaExplained
            tex="p(x) = \int p(x, y)\, dy \;=\; \int p(x \mid y)\, p(y)\, dy"
            symbols={[
              ['p(x)', 'the marginal density of x: what we believe about x if we ignore y'],
              ['\\int \\dots dy', 'add over all possible y (the row sum, for continuous y)'],
              ['p(x\\mid y)\\,p(y)', 'the same joint, written as a product (we will see why in the next beat). The lecture calls this trick “Enter y!”'],
            ]}
          />
          <TryIt>
            <Controls>
              <Slider label="\text{view}" value={tabMode7} min={0} max={1} step={1} onChange={setTab7} fmt={(v) => (v ? 'table' : 'landscape')} />
              {!tabMode7 && <Slider label="\text{push slices to the wall}" value={collapse} min={0} max={1} onChange={setCollapse} />}
            </Controls>
            In landscape view: slide every slice of the hill onto the back wall. What piles up there is the green curve <M>{'p(x)'}</M>.
          </TryIt>
          <Connect>
            <b>This is the single most important move in Chapter 2.</b> To predict where the car will be <i>next</i> second, we write the joint of (new position, old position)
            and integrate the old position away: <M>{'p(\\x_k) = \\int p(\\x_k \\mid \\x_{k-1})\\,p(\\x_{k-1})\\,d\\x_{k-1}'}</M>. That's the Chapman–Kolmogorov equation — it's
            just a marginal!
          </Connect>
          <Check
            q="From the table: what's p(fast), the probability of fast regardless of position?"
            options={[
              { text: '0.45', why: 'That is only far & fast. Near & fast also counts.' },
              { text: '0.55', correct: true, why: 'Column sum: 0.10 + 0.45 = 0.55.' },
              { text: '0.10', why: 'That is only near & fast.' },
            ]}
          />
        </>
      ),
    },
    // ------------------------------------------------------------ 8
    {
      title: 'Conditional: zoom into what you just learned',
      source: 'L2 p.8, IMM p.3',
      scene3d: tabMode8 ? <TableScene mode="conditional" /> : <ConditionalScene P={P} y0={y0} renorm={renormC} />,
      panel: (
        <>
          <Question>A police officer tells you: “the car is FAST.” Now what do you believe about its position?</Question>
          <Everyday title="With the table">
            <p>
              Once you know it's fast, the “slow” column is <b>impossible</b> — cross it out. Only the fast column remains: 0.10 (near) and 0.45 (far). But those add to 0.55, not 1!
              So we <b>rescale</b>: divide by 0.55.
            </p>
            <NumTable
              head={['position', 'p(position, fast)', '÷ p(fast) = 0.55', 'p(position | fast)']}
              highlightCol={3}
              rows={[
                ['near', '0.10', '0.10 / 0.55', (0.1 / pFast).toFixed(2)],
                ['far', '0.45', '0.45 / 0.55', (0.45 / pFast).toFixed(2)],
              ]}
            />
            <p>Before the tip, far was 60 %. After learning “fast”, far is 82 %. Information changed our belief!</p>
          </Everyday>
          <Idea>Conditioning = keep only the part of the world that matches what you learned, then rescale so it adds to 1 again.</Idea>
          <FormulaExplained
            tex="p(x \mid y) = \frac{p(x, y)}{p(y)} \qquad\Longleftrightarrow\qquad p(x, y) = p(x \mid y)\,p(y)"
            symbols={[
              ['p(x\\mid y)', '“probability of x GIVEN y”. The bar | means “given that we know”.'],
              ['p(x, y)', 'the joint: the surviving column (or the slice of the landscape)'],
              ['p(y)', 'the total of the surviving column — dividing by it is the rescaling'],
            ]}
          />
          <TryIt>
            <Controls>
              <Slider label="\text{view}" value={tabMode8} min={0} max={1} step={1} onChange={setTab8} fmt={(v) => (v ? 'table' : 'landscape')} />
              {!tabMode8 && (
                <>
                  <Slider label="\text{learned } y_0" value={y0} min={-3} max={3} onChange={setY0} />
                  <Slider label="\text{rescale}" value={renormC} min={0} max={1} step={1} onChange={setRenormC} fmt={(v) => (v ? 'on' : 'off')} />
                </>
              )}
            </Controls>
            In landscape view, the red plane cuts the hill at the value <M>{'y_0'}</M> you learned. The cut edge (yellow) is <M>{'p(x, y_0)'}</M>. Turn on “rescale” and it grows
            into the blue <M>{'p(x \\mid y_0)'}</M> with area 1.
          </TryIt>
          <Pitfall>
            <M>{'p(x \\mid y)'}</M> and <M>{'p(y \\mid x)'}</M> are <b>not</b> the same! p(far | fast) = 0.82, but p(fast | far) = 0.45 / 0.60 = 0.75. Mixing them up is the
            most common mistake in probability — and fixing it is exactly what Bayes' rule (next beat) is for.
          </Pitfall>
          <Connect>
            Every time a new radar reading arrives, the tracker does exactly this: it conditions on the new data. <M>{'p(\\x_k \\mid \\Z^k)'}</M> = belief about the state, GIVEN all
            measurements so far.
          </Connect>
          <Check
            q="Using the table: what is p(slow | near)?"
            options={[
              { text: '0.30', why: 'That is p(slow, near). You still need to divide by p(near).' },
              { text: '0.75', correct: true, why: 'Row “near” sums to 0.40. So 0.30 / 0.40 = 0.75.' },
              { text: '0.67', why: '0.30 / 0.45 would be p(near | slow) — the bar flipped!' },
            ]}
          />
        </>
      ),
    },
    // ------------------------------------------------------------ 9
    {
      title: "Bayes' rule: turning the question around",
      source: 'L2 p.8, IMM p.3',
      scene2d: <BayesPipeline cells={CELLS.map((c) => `${c} m`)} prior={PRIOR4} lik={lik4} labels={{ prior: 'prior p(x)', lik: 'likelihood p(z|x)' }} />,
      panel: (
        <>
          <Say>
            Here's the situation you'll face a thousand times this semester. The radar knows <b>how it makes mistakes</b>: “if the car is at x, I report something near x, with error
            σ”. That's <M>{'p(z \\mid x)'}</M>. But we want the opposite: “given the report z, where is the car?” That's <M>{'p(x \\mid z)'}</M>. Bayes flips the bar.
          </Say>
          <Everyday title="The setup: 4 possible positions">
            <p>
              Before the radar beeps, we think the car is at 100, 110, 120 or 130 m with probabilities <b>0.1, 0.4, 0.4, 0.1</b> (green row) — that's our <b>prior</b>.
            </p>
            <p>
              The radar beeps: <b>z = {z4.toFixed(0)} m</b>, and it has error σ = {r4.toFixed(0)} m. For each possible position we ask: <i>“if the car were really here, how plausible is
              a reading of {z4.toFixed(0)}?”</i> That's the <b>likelihood</b> (red row) — high for positions close to the reading.
            </p>
          </Everyday>
          <Idea>Posterior = prior × likelihood, then rescale so it adds up to 1. That's all Bayes' rule is.</Idea>
          <Derivation
            steps={[
              { tex: 'p(x, z) = p(x \\mid z)\\,p(z) \\quad\\text{and}\\quad p(x, z) = p(z \\mid x)\\,p(x)', why: 'Write the same joint in two ways, using the conditional rule from the last beat — once with x given z, once with z given x.' },
              { tex: '\\post{p(x \\mid z)} = \\frac{\\meas{p(z \\mid x)}\\;\\pred{p(x)}}{p(z)}', why: 'Set them equal and divide by p(z). Done — that is Bayes’ rule!' },
              { tex: 'p(z) = \\sum_x \\meas{p(z\\mid x)}\\,\\pred{p(x)} \\quad\\text{or}\\quad \\int \\meas{p(z\\mid x)}\\,\\pred{p(x)}\\,dx', why: 'The denominator is a marginal (add up the yellow row). It does not depend on x: it is just the “rescale to 1” number.' },
            ]}
          />
          <FormulaExplained
            tex="\post{p(x\mid z)} = \frac{\meas{p(z\mid x)}\,\pred{p(x)}}{\int \meas{p(z\mid x)}\,\pred{p(x)}\,dx}"
            symbols={[
              ['\\pred{p(x)}', 'prior: what we believed before the measurement'],
              ['\\meas{p(z\\mid x)}', 'likelihood: the sensor model. “If the car were at x, how likely is reading z?”'],
              ['\\post{p(x\\mid z)}', 'posterior: what we believe after the measurement'],
              ['\\int\\dots dx', 'normalisation constant — makes the posterior add up to 1'],
            ]}
          />
          <Worked title="Worked example — do it with a calculator!">
            <NumTable
              head={['position', 'prior', 'likelihood', 'prior × lik.', 'posterior']}
              highlightCol={4}
              rows={CELLS.map((c, i) => [`${c} m`, PRIOR4[i].toFixed(2), lik4[i].toFixed(3), prod4[i].toFixed(4), post4[i].toFixed(3)])}
            />
            <p>
              The likelihood here is <M>{'e^{-\\frac12 ((z - x)/\\sigma)^2}'}</M> — the bell-curve shape (its constant factor cancels when we rescale, so we can skip it). Sum of the
              product column = {prod4.reduce((s, v) => s + v, 0).toFixed(4)}; divide each entry by it to get the posterior.
            </p>
          </Worked>
          <Predict
            q="Make the radar MUCH worse (σ = 40 m). Will the posterior follow the reading, or stay close to the prior?"
            answer={<p>It stays close to the prior — a bad sensor's likelihood is almost flat (all positions look equally plausible), so multiplying by it barely changes anything. Now try σ = 3 m: the posterior jumps to the cell next to the reading. That's the whole balancing act of the Kalman filter, in four boxes.</p>}
          />
          <TryIt>
            <Controls>
              <Slider label="\meas{z}\ (\text{radar reading, m})" value={z4} min={90} max={140} step={1} onChange={setZ4} fmt={(v) => v.toFixed(0)} />
              <Slider label="\meas{\sigma}\ (\text{radar error, m})" value={r4} min={3} max={40} step={1} onChange={setR4} fmt={(v) => v.toFixed(0)} />
            </Controls>
          </TryIt>
          <Connect>
            This is the <b>filtering step</b> of every tracker in the course. In Chapter 2 the prior becomes the prediction <M>{'p(\\x_k \\mid \\Z^{k-1})'}</M>, and in Chapter 3,
            with Gaussians, the multiply-and-rescale gives the Kalman update formulas.
          </Connect>
          <Check
            q="Why can we ignore the constant in front of the likelihood (like 1/√(2πσ²))?"
            options={[
              { text: 'Because it is always 1', why: 'It is not 1 — but it does not matter, see the right answer.' },
              { text: 'Because it multiplies every cell equally and disappears when we rescale to sum 1', correct: true, why: 'Exactly. Anything that does not depend on x cancels in the normalisation. That is why the slides often write ∝ (“proportional to”).' },
              { text: 'Because the likelihood is not a probability', why: 'True that p(z|x) as a function of x does not need to sum to 1 — but that is not why the constant can be dropped.' },
            ]}
          />
        </>
      ),
    },
    // ------------------------------------------------------------ 10
    {
      title: 'Bayes in 3D: a slice of the joint landscape',
      source: 'L2 p.8, p.12',
      scene3d: <JointSliceScene m={bm} P={bP} R={bR} z0={bz} renorm={bRen} labels={{ prior: 'p(x)', lik: 'p(z_0\\mid x)', post: 'p(x\\mid z_0)', joint: 'p(x, z_0)' }} />,
      panel: (
        <>
          <Say>
            Now let me show you something beautiful. Take the four boxes of the last beat and make them infinitely many. Bayes' rule turns into a <b>geometric</b> picture — and
            you've already seen all its pieces.
          </Say>
          <Everyday title="What you're looking at">
            <ul>
              <li>
                Floor axes: <M>{'x'}</M> = true position, <M>{'z'}</M> = radar reading.
              </li>
              <li>
                Yellow landscape: the joint <M>{'p(x, z) = p(z \\mid x)\\,p(x)'}</M>. It's a diagonal ridge, because readings are close to the true position.
              </li>
              <li>
                Green curve on the back wall: the prior <M>{'p(x)'}</M> — the marginal of the landscape (beat 7!).
              </li>
              <li>
                Red plane: the reading <M>{'z_0'}</M> that actually arrived. Red dashed curve: the likelihood <M>{'p(z_0 \\mid x)'}</M> as a function of x.
              </li>
              <li>
                Yellow edge where the plane cuts: <M>{'p(x, z_0)'}</M>. Rescale it → blue posterior (beat 8!).
              </li>
            </ul>
          </Everyday>
          <Idea>Bayes' rule is just: slice the joint landscape at the measurement you got, and rescale the slice.</Idea>
          <Predict
            q="The prior says ‘around −0.8’, the reading says ‘1.2’. Will the posterior peak sit at −0.8, at 1.2, or in between?"
            answer={<p>In between — closer to whichever is more certain. With prior variance P = 1.2 and sensor variance R = 0.6, the sensor is more certain, so the posterior lands closer to the reading. Turn on “rescale” and look.</p>}
          />
          <TryIt>
            <Controls>
              <Slider label="\pred{\bar x}\ \text{prior mean}" value={bm} min={-2.5} max={2.5} onChange={setBm} />
              <Slider label="\pred{P}\ \text{prior variance}" value={bP} min={0.2} max={2.5} onChange={setBP} />
              <Slider label="\meas{R}\ \text{sensor variance}" value={bR} min={0.1} max={2.5} onChange={setBR} />
              <Slider label="\meas{z_0}\ \text{reading}" value={bz} min={-3} max={3} onChange={setBz} />
              <Slider label="\text{rescale}" value={bRen} min={0} max={1} step={1} onChange={setBRen} fmt={(v) => (v ? 'on' : 'off')} />
            </Controls>
            Make R tiny → posterior jumps to the reading. Make P tiny → posterior ignores the reading.
          </TryIt>
          <Connect>
            The label “area of slice = p(z₀)” in the scene is the normalisation constant. In Chapter 2 we'll see that read as a function of z, it's the <b>expected measurement</b>{' '}
            — the basis of gating (Chapter 6) and of MHT hypothesis weights (Chapter 8).
          </Connect>
        </>
      ),
    },
    // ------------------------------------------------------------ 11
    {
      title: 'The Gaussian: the bell curve, in 1D and 2D',
      source: 'L2 p.8',
      scene3d: <GaussScene m={[gx, gy]} P={P} />,
      panel: (
        <>
          <Say>
            Of all the shapes a density could have, one rules this course: the <b>Gaussian</b>, the bell curve. Measurement errors look like it (many tiny random effects add up to a
            bell — that's a famous theorem). And it has two magic properties we'll exploit again and again.
          </Say>
          <FormulaExplained
            tex="\N(\x;\,\bar\x,\,\mathbf P) = \frac{1}{\sqrt{|2\pi \mathbf P|}} \exp\!\Big(-\tfrac12\, \hl{(\x-\bar\x)^\top \mathbf P^{-1} (\x-\bar\x)}\Big)"
            symbols={[
              ['\\N(\\x;\\bar\\x,\\mathbf P)', 'read: “Gaussian density at x, with mean x̄ and covariance P”'],
              ['\\bar\\x', 'mean vector: where the top of the hill is'],
              ['\\mathbf P', 'covariance matrix: variances on the diagonal, covariances off the diagonal. Sets width and tilt.'],
              ['\\mathbf P^{-1}', 'its inverse — “divides” by the uncertainty, direction by direction'],
              ['\\hl{(\\dots)^\\top \\mathbf P^{-1} (\\dots)}', 'a squared distance from the mean, measured in units of σ (Mahalanobis distance)'],
              ['|2\\pi\\mathbf P|', 'a determinant — just makes the total volume equal 1'],
            ]}
          >
            <p>
              In 1D this is simply <M>{'\\N(x;\\bar x, \\sigma^2) = \\frac{1}{\\sqrt{2\\pi\\sigma^2}}\\,e^{-\\frac12 (x-\\bar x)^2/\\sigma^2}'}</M> — the orange part becomes{' '}
              <M>{'((x - \\bar x)/\\sigma)^2'}</M>: “how many σ away am I?”, squared.
            </p>
          </FormulaExplained>
          <Everyday title="Why the orange distance is smarter than a ruler">
            <p>
              A radar measures distance (range) well, σ = 10 m, but angle badly: sideways the error is σ = 50 m. A reading comes in <b>30 m off</b> from where we expected.
            </p>
            <ul>
              <li>30 m off <b>along the range</b>: that's 3σ — very suspicious, maybe a different object!</li>
              <li>30 m off <b>sideways</b>: that's 0.6σ — totally normal.</li>
            </ul>
            <p>Same 30 metres on a ruler, completely different meaning. The Mahalanobis distance captures this by dividing by the uncertainty in each direction.</p>
          </Everyday>
          <TryIt>
            The floor shows the 1σ, 2σ, 3σ ellipses: all points at the same Mahalanobis distance. Change the shape (these sliders are shared with beat 6):
            <Controls>
              <Slider label="\bar x_1" value={gx} min={-2} max={2} onChange={setGx} />
              <Slider label="\bar x_2" value={gy} min={-2} max={2} onChange={setGy} />
              <Slider label="\sigma_x" value={sx} min={0.4} max={1.8} onChange={setSx} />
              <Slider label="\sigma_y" value={sy} min={0.4} max={1.8} onChange={setSy} />
              <Slider label="\rho" value={rho} min={-0.9} max={0.9} onChange={setRho} />
            </Controls>
            <div className="readout">
              <Tex tex={`\\mathbf P = \\begin{pmatrix} \\sigma_x^2 & \\rho\\sigma_x\\sigma_y \\\\ \\rho\\sigma_x\\sigma_y & \\sigma_y^2 \\end{pmatrix} = \\begin{pmatrix} ${P[0][0].toFixed(2)} & ${P[0][1].toFixed(2)} \\\\ ${P[1][0].toFixed(2)} & ${P[1][1].toFixed(2)} \\end{pmatrix}`} />
            </div>
          </TryIt>
          <Connect>
            The two magic properties: (1) push a Gaussian through a linear map → still Gaussian (next beat). (2) multiply two Gaussians → still Gaussian (the “product formula”,
            Chapter 3). Because of these, the Kalman filter can describe the whole cloud with just <M>{'\\bar\\x'}</M> and <M>{'\\mathbf P'}</M> — forever. The Mahalanobis
            distance comes back as the gate in Chapter 6.
          </Connect>
          <Check
            q="What does a large off-diagonal entry in P mean?"
            options={[
              { text: 'Both variables are very uncertain', why: 'Uncertainty of each variable is on the DIAGONAL.' },
              { text: 'The two variables are strongly linked — the ellipse is tilted', correct: true, why: 'Off-diagonal = covariance. Large covariance = strong correlation = tilted ellipse.' },
              { text: 'The mean is far from zero', why: 'P says nothing about where the mean is — that is x̄.' },
            ]}
          />
        </>
      ),
    },
    // ------------------------------------------------------------ 12
    {
      title: 'Let the car drive: linear maps keep Gaussians Gaussian',
      source: 'IMM p.10',
      scene2d: <DriveScene dt={dt} morph={morph} />,
      panel: (
        <>
          <Say>
            Here's a demo that will come back in Chapter 3 as the <b>Kalman prediction</b>. Our state is (position, velocity). We're uncertain about both. Now the car drives for{' '}
            <M>{'\\Delta t'}</M> seconds. What happens to the cloud?
          </Say>
          <Everyday title="Simple physics">
            <p>
              New position = old position + velocity × <M>{'\\Delta t'}</M>. New velocity = old velocity (no acceleration for now). In matrix form:
            </p>
            <Tex tex="\begin{pmatrix} x' \\ v' \end{pmatrix} = \underbrace{\begin{pmatrix} 1 & \Delta t \\ 0 & 1 \end{pmatrix}}_{\mathbf A} \begin{pmatrix} x \\ v \end{pmatrix}" block />
          </Everyday>
          <Predict
            q="Every point in the cloud moves by its own velocity. Fast points move far, slow points move little. What shape does the cloud become?"
            answer={<p>It gets <b>sheared</b>: the fast (upper) points slide right, the slow (lower) ones less. A round cloud becomes a <b>tilted ellipse</b> — position and velocity are now correlated! And it's wider in position: the position uncertainty grew. Slide “drive” below.</p>}
          />
          <Idea>Push a Gaussian through a linear map: you get another Gaussian. Its mean moves by A, its covariance becomes A P Aᵀ.</Idea>
          <FormulaExplained
            tex="\x \sim \N(\bar\x,\, \mathbf X) \quad\xrightarrow{\;\mathbf y = \mathbf a + \mathbf A \x\;}\quad \mathbf y \sim \N(\mathbf a + \mathbf A\bar\x,\; \mathbf A \mathbf X \mathbf A^\top)"
            symbols={[
              ['\\mathbf A', 'the linear map (here: “drive for Δt”)'],
              ['\\mathbf a', 'a fixed shift (here zero)'],
              ['\\mathbf A \\mathbf X \\mathbf A^\\top', 'new covariance. 1D version: if y = a·x, then Var[y] = a²·Var[x] — the matrix version of “square the factor”.'],
            ]}
          />
          <Worked>
            <p>
              Position σ = 5 m (variance 25), velocity σ = 2 m/s (variance 4), no correlation. Drive <M>{'\\Delta t = 1'}</M> s:
            </p>
            <Tex
              tex="\mathbf A\mathbf X\mathbf A^\top = \begin{pmatrix}1&1\\0&1\end{pmatrix}\begin{pmatrix}25&0\\0&4\end{pmatrix}\begin{pmatrix}1&0\\1&1\end{pmatrix} = \begin{pmatrix}29&4\\4&4\end{pmatrix}"
              block
            />
            <p>
              Position variance went from 25 to <b>29</b> (σ ≈ 5.4 m): we're less sure where the car is, because we weren't sure how fast it was going. And a covariance of 4
              appeared: position and velocity are now linked. Physics works!
            </p>
          </Worked>
          <TryIt>
            <Controls>
              <Slider label="\text{drive}" value={morph} min={0} max={1} onChange={setMorph} />
              <Slider label="\Delta t\ (\text{s})" value={dt} min={0} max={3} onChange={setDt} />
            </Controls>
            The blue ellipse is the predicted <M>{'\\mathbf A\\mathbf X\\mathbf A^\\top'}</M>. The dots are individual “possible cars”, each driven by simple physics. They land
            exactly inside the predicted ellipse.
          </TryIt>
          <Connect>
            Chapter 3, Kalman prediction: <M>{'\\mathbf P_{k|k-1} = \\mathbf F\\,\\mathbf P_{k-1|k-1}\\mathbf F^\\top + \\mathbf D'}</M>. That's this beat with{' '}
            <M>{'\\mathbf A = \\mathbf F'}</M>, plus extra noise <M>{'\\mathbf D'}</M> because drivers don't keep a perfectly constant speed. It also comes back in the χ² derivation
            (Chapter 6) and the polar→Cartesian conversion (Chapter 4).
          </Connect>
          <Check
            q="1D: x has variance 4. What is the variance of y = 3x + 7?"
            options={[
              { text: '12', why: 'You multiplied by 3 — but variance scales with the SQUARE of the factor.' },
              { text: '36', correct: true, why: '3² · 4 = 36. The shift +7 moves the mean but does not change the spread.' },
              { text: '43', why: 'The +7 never affects the variance.' },
            ]}
          />
        </>
      ),
    },
    // ------------------------------------------------------------ 13
    {
      title: 'Certain knowledge is an infinitely thin spike',
      source: 'IMM p.3',
      scene2d: <Plot x={[-4, 4]} y={[0, 2.2]} series={[{ xs: linspace(-4, 4, 801), ys: linspace(-4, 4, 801).map((x) => normal1(x, 0.5, dsig * dsig)), color: C.post, fill: true, label: 'p(x)' }]} />,
      panel: (
        <>
          <Question>What if we knew the position perfectly — no uncertainty at all? What does the density look like?</Question>
          <Predict
            q="Squeeze a bell curve narrower and narrower (σ → 0). What happens to its height, and why?"
            answer={<p>The height shoots up to infinity — because the area must stay 1! All the sand piled onto one single point. That limiting object is the <b>Dirac delta</b>. Drag σ down below and watch.</p>}
          />
          <FormulaExplained
            tex="\delta(x - y) = \lim_{\sigma \to 0} \frac{1}{\sqrt{2\pi}\,\sigma}\, e^{-\frac12 \frac{(x-y)^2}{\sigma^2}}, \qquad \int \delta(x - y)\, f(y)\, dy = f(x)"
            symbols={[
              ['\\delta(x-y)', 'all probability sits exactly at x = y'],
              ['\\int \\delta(x-y) f(y)\\,dy = f(x)', 'the “sifting” property: integrating against a delta just picks out one value'],
            ]}
          />
          <TryIt>
            <Controls>
              <Slider label="\sigma" value={dsig} min={0.18} max={1.5} onChange={setDsig} />
            </Controls>
          </TryIt>
          <Connect>The sifting property is the trick that makes the χ² derivation in Chapter 6 work (“insert a delta, then integrate”).</Connect>
        </>
      ),
    },
    // ------------------------------------------------------------ 14
    {
      title: 'Chapter 1 on one page',
      source: '',
      scene2d: <ConceptMap />,
      panel: (
        <>
          <Say>Let's put it all together. If the examiner asks “what probability do you need for tracking?”, this is your answer.</Say>
          <NumTable
            head={['rule', 'formula', 'plain words', 'used for']}
            rows={[
              ['density', <Tex tex="P(a<x<b)=\int_a^b p\,dx" />, 'probability = area', 'everything'],
              ['expectation', <Tex tex="\mathbb E[x]=\int x\,p\,dx" />, 'balance point', 'state estimate'],
              ['marginal', <Tex tex="p(x)=\int p(x,y)dy" />, 'ignore y by adding it up', 'prediction (Ch 2)'],
              ['conditional', <Tex tex="p(x|y)=\tfrac{p(x,y)}{p(y)}" />, 'keep matching part, rescale', 'using data'],
              ['Bayes', <Tex tex="p(x|z)=\tfrac{p(z|x)p(x)}{p(z)}" />, 'prior × likelihood, rescale', 'filtering (Ch 2, 3)'],
              ['Gaussian', <Tex tex="\N(\x;\bar\x,\mathbf P)" />, 'bell; mean + covariance', 'Kalman (Ch 3)'],
              ['linear map', <Tex tex="\mathbf A\mathbf X\mathbf A^\top" />, 'Gaussian stays Gaussian', 'Kalman prediction'],
            ]}
          />
          <Idea>Tracking = keep a probability density of the state, move it with physics (marginal), and sharpen it with measurements (Bayes). Chapter 2 builds exactly that loop.</Idea>
        </>
      ),
    },
  ];

  const cards: Card[] = [
    {
      id: 'c1-pdf',
      beat: 2,
      q: 'What is a probability density function, and how do you get a probability out of it?',
      a: (
        <p>
          A non-negative function with total area 1 — “probability per unit”. You get a probability by integrating it over a region: <M>{'P(a<x<b)=\\int_a^b p(x)dx'}</M>. The
          probability of one exact value is zero. In tracking, the pdf of the state is our complete knowledge about the object.
        </p>
      ),
      followUp: 'Can p(x) be larger than 1? (Yes — a narrow density is tall; only the area must be 1.)',
    },
    {
      id: 'c1-marg',
      beat: 7,
      q: 'What is a marginal density, and where does it show up in tracking?',
      a: (
        <p>
          <M>{'p(x)=\\int p(x,y)dy=\\int p(x|y)p(y)dy'}</M>: add up (integrate) over the variable you don't care about — the row sums of a table. In tracking it is the prediction
          step: we integrate the old state <M>{'\\x_{k-1}'}</M> out of <M>{'p(\\x_k,\\x_{k-1}|\\Z^{k-1})'}</M>. The normalisation constant in Bayes is a marginal too.
        </p>
      ),
    },
    {
      id: 'c1-cond',
      beat: 8,
      q: 'Explain a conditional density — with a table and geometrically.',
      a: (
        <p>
          Table: keep only the row/column that matches what you learned, divide by its sum. Geometrically: cut the joint surface at the observed <M>{'y_0'}</M> and rescale the
          slice to area 1: <M>{'p(x|y)=p(x,y)/p(y)'}</M>.
        </p>
      ),
    },
    {
      id: 'c1-bayes',
      beat: 9,
      q: "Derive Bayes' rule and name each term in the tracking context.",
      a: (
        <>
          <p>
            Write the joint twice: <M>{'p(x,z)=p(x|z)p(z)=p(z|x)p(x)'}</M>, divide by <M>{'p(z)'}</M>: <M>{'p(x|z)=\\frac{p(z|x)p(x)}{\\int p(z|x)p(x)dx}'}</M>.
          </p>
          <p>
            <M>{'p(x)'}</M> = prior (prediction), <M>{'p(z|x)'}</M> = likelihood (sensor model), <M>{'p(x|z)'}</M> = posterior, denominator = normalisation constant (independent of
            x).
          </p>
        </>
      ),
      followUp: 'Why do we often write “∝” and ignore the denominator? (It is constant in x; we renormalise at the end.)',
    },
    {
      id: 'c1-gauss',
      beat: 11,
      q: 'What do x̄ and P mean in N(x; x̄, P)? What do the ellipses represent?',
      a: (
        <p>
          <M>{'\\bar\\x'}</M> is the mean, <M>{'\\mathbf P'}</M> the covariance (variances on the diagonal, covariances off it). Curves of equal density are ellipses{' '}
          <M>{'(\\x-\\bar\\x)^\\top\\mathbf P^{-1}(\\x-\\bar\\x)=c^2'}</M> — points at the same Mahalanobis distance. Off-diagonal entries tilt them.
        </p>
      ),
      followUp: 'Why is Mahalanobis distance better than Euclidean distance for a radar measurement?',
    },
    {
      id: 'c1-affine',
      beat: 12,
      q: 'What happens to a Gaussian under a linear map? Give a tracking example.',
      a: (
        <p>
          It stays Gaussian: mean <M>{'\\mathbf a+\\mathbf A\\bar\\x'}</M>, covariance <M>{'\\mathbf A\\mathbf X\\mathbf A^\\top'}</M>. Example: driving for Δt with{' '}
          <M>{'\\mathbf A=\\begin{pmatrix}1&\\Delta t\\\\0&1\\end{pmatrix}'}</M> shears the (position, velocity) ellipse and makes position more uncertain. That is the Kalman
          prediction.
        </p>
      ),
    },
    {
      id: 'c1-delta',
      beat: 13,
      q: 'How do you write “certain knowledge” as a density?',
      a: (
        <p>
          As a Dirac delta <M>{'\\delta(x-y)'}</M>, the limit of a Gaussian with σ → 0. Its sifting property <M>{'\\int\\delta(x-y)f(y)dy=f(x)'}</M> is used in the χ² derivation.
        </p>
      ),
    },
  ];

  return <ChapterShell id="ch1" num={1} title="Probability toolkit" beats={beats} cards={cards} beat={beat} setBeat={setBeat} />;
}

// ---------------------------------------------------------------- scenes

function StateCloud({ cloud, spread }: { cloud: P3[]; spread: number }) {
  const s = useAnimated(spread);
  const truth: P3 = [0.4, 1.4, -0.3];
  const est: P3 = [0, 1.3, 0];
  const pts = useMemo(() => cloud.map(([x, y, z]) => [est[0] + x * s, est[1] + y * s, est[2] + z * s] as P3), [cloud, s]);
  return (
    <>
      <Camera position={[5, 4, 6]} target={[0, 1.2, 0]} />
      <Lights />
      <gridHelper args={[10, 20, C.grid, C.grid]} />
      <PointCloud pts={pts} color={C.post} size={0.06} opacity={0.65} />
      <Dot position={truth} color={C.truth} r={0.1} />
      <Label position={[truth[0] + 0.5, truth[1] + 0.4, truth[2]]} color={C.truth}>
        true state (unknown)
      </Label>
      <Label position={[-2.2, 2.9, 0]} tex="p(\x_k \mid \Z^k)" color={C.post} size={18} />
    </>
  );
}

function MarginalScene({ P, collapse }: { P: M2; collapse: number }) {
  const t = useAnimated(collapse, 3);
  const wall = -4.4;
  const xs = linspace(-4, 4, 161);
  const marg = xs.map((x) => normal1(x, 0, P[0][0]));
  return (
    <>
      <Camera position={[7, 5, 6.5]} target={[0, 0.6, -1]} />
      <Lights />
      <Axes x={4} z={4} y={3} xLabel="x" zLabel="y" yLabel="p" />
      <Surface f={(x, y) => H2 * normal2([x, y], [0, 0], P)} xr={[-4, 4]} yr={[-4, 4]} color={C.joint} opacity={0.75 - 0.4 * t} zOf={(y) => (1 - t) * -y + t * wall} />
      <Density xs={xs} p={marg} scale={H1} z={wall - 0.05} color={C.pred} opacity={0.12 + 0.2 * t} />
      <Label position={[0, H1 * normal1(0, 0, P[0][0]) + 0.4, wall]} tex="p(x)=\int p(x,y)\,dy" color={C.pred} />
    </>
  );
}

function ConditionalScene({ P, y0, renorm }: { P: M2; y0: number; renorm: number }) {
  const t = useAnimated(renorm, 3);
  const xs = linspace(-4, 4, 161);
  const c = conditionalXgivenY([0, 0], P, y0);
  const pts = xs.map((x) => [x, (1 - t) * H2 * normal2([x, y0], [0, 0], P) + t * H1 * normal1(x, c.m, c.s2), -y0] as P3);
  const peak = Math.max(...pts.map((p) => p[1]));
  return (
    <>
      <Camera position={[6.5, 5, 7]} target={[0, 0.6, 0]} />
      <Lights />
      <Axes x={4} z={4} y={3} xLabel="x" zLabel="y" yLabel="p" />
      <Surface f={(x, y) => H2 * normal2([x, y], [0, 0], P)} xr={[-4, 4]} yr={[-4, 4]} color={C.joint} opacity={0.45} />
      <Plane center={[0, 1.5, -y0]} width={8} height={3} color={C.meas} opacity={0.08} />
      <Curve points={pts} color={t > 0.5 ? C.post : C.joint} width={4} />
      <Label position={[c.m, peak + 0.4, -y0]} tex={t > 0.5 ? 'p(x\\mid y_0)' : 'p(x, y_0)'} color={t > 0.5 ? C.post : C.joint} />
    </>
  );
}

function GaussScene({ m, P }: { m: V2; P: M2 }) {
  return (
    <>
      <Camera position={[6, 6.5, 7]} target={[0, 0.3, 0]} />
      <Lights />
      <Axes x={4} z={4} y={3} xLabel="x_1" zLabel="x_2" yLabel="\N" />
      <Surface f={(x, y) => H2 * normal2([x, y], m, P)} xr={[-4, 4]} yr={[-4, 4]} color={C.post} opacity={0.8} />
      {[1, 2, 3].map((c) => (
        <Curve key={c} points={ellipse(m, P, c).map(([x, y]) => [x, 0.01, -y] as P3)} color={C.accent} width={c === 1 ? 2.5 : 1.5} opacity={1 - 0.25 * (c - 1)} />
      ))}
      <Label position={[m[0], 0.05, -m[1] + 0.001]} tex="\bar\x" color={C.accent} />
    </>
  );
}

/** (position, velocity) cloud driven for Δt seconds: y = A x with A = [[1, Δt], [0, 1]]. */
function DriveScene({ dt, morph }: { dt: number; morph: number }) {
  const xbar: V2 = [-2.5, 1];
  const X: M2 = [
    [0.3, 0],
    [0, 0.25],
  ];
  const samples = useMemo(() => {
    const r = mulberry32(11);
    return Array.from({ length: 500 }, () => [xbar[0] + Math.sqrt(X[0][0]) * randn(r), xbar[1] + Math.sqrt(X[1][1]) * randn(r)] as V2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const A: M2 = [
    [1, dt],
    [0, 1],
  ];
  const mY: V2 = [xbar[0] + dt * xbar[1], xbar[1]];
  const PY: M2 = [
    [X[0][0] + dt * dt * X[1][1], dt * X[1][1]],
    [dt * X[1][1], X[1][1]],
  ];
  const W = 800,
    H = 460;
  const sx = (v: number) => W / 2 + v * 75;
  const sy = (v: number) => H / 2 + 60 - v * 75;
  const cur = samples.map(([x, v]) => [x + morph * (A[0][0] * x + A[0][1] * v - x), v] as V2);
  const path = (pts: V2[]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x)},${sy(y)}`).join('') + 'Z';
  return (
    <div className="plot">
      <svg viewBox={`0 0 ${W} ${H}`}>
        <line x1={20} x2={W - 20} y1={sy(0)} y2={sy(0)} stroke={C.axis} />
        <line x1={sx(0)} x2={sx(0)} y1={20} y2={H - 20} stroke={C.grid} />
        <text x={W - 20} y={sy(0) + 22} fill={C.muted} fontSize={14} textAnchor="end">
          position →
        </text>
        <text x={sx(0) + 8} y={30} fill={C.muted} fontSize={14}>
          velocity ↑
        </text>
        <path d={path(ellipse(xbar, X, 2))} fill="none" stroke={C.pred} strokeWidth={2} strokeDasharray="6 5" />
        <path d={path(ellipse(mY, PY, 2))} fill="none" stroke={C.post} strokeWidth={3} opacity={0.3 + 0.7 * morph} />
        {cur.map(([x, y], i) => (
          <circle key={i} cx={sx(x)} cy={sy(y)} r={2.6} fill={morph > 0.5 ? C.post : C.pred} opacity={0.7} />
        ))}
      </svg>
      <div className="plot-legend">
        <span style={{ color: C.pred }}>
          <span className="swatch" style={{ background: C.pred }} /> before driving (2σ)
        </span>
        <span style={{ color: C.post }}>
          <span className="swatch" style={{ background: C.post }} /> predicted <Tex tex="\N(\mathbf A\bar\x,\ \mathbf A\mathbf X\mathbf A^\top)" /> (2σ)
        </span>
      </div>
    </div>
  );
}

function ConceptMap() {
  const node = (x: number, y: number, t: string, c: string) => (
    <g>
      <rect x={x - 85} y={y - 22} width={170} height={44} rx={10} fill="#11141b" stroke={c} strokeWidth={2} />
      <text x={x} y={y + 5} fill={c} fontSize={15} textAnchor="middle">
        {t}
      </text>
    </g>
  );
  const edge = (x1: number, y1: number, x2: number, y2: number) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.axis} strokeWidth={2} />;
  return (
    <div className="plot">
      <svg viewBox="0 0 800 460">
        {edge(400, 50, 200, 150)}
        {edge(400, 50, 600, 150)}
        {edge(200, 150, 120, 260)}
        {edge(200, 150, 300, 260)}
        {edge(600, 150, 500, 260)}
        {edge(600, 150, 700, 260)}
        {edge(120, 260, 200, 380)}
        {edge(300, 260, 200, 380)}
        {edge(500, 260, 600, 380)}
        {edge(700, 260, 600, 380)}
        {node(400, 50, 'density p(x)', C.text)}
        {node(200, 150, 'joint p(x,y)', C.joint)}
        {node(600, 150, 'Gaussian N(x; x̄, P)', C.post)}
        {node(120, 260, 'marginal', C.pred)}
        {node(300, 260, 'conditional', C.meas)}
        {node(500, 260, 'linear map AXAᵀ', C.post)}
        {node(700, 260, 'product formula', C.post)}
        {node(200, 380, 'Bayes recursion (Ch 2)', C.accent)}
        {node(600, 380, 'Kalman filter (Ch 3)', C.accent)}
      </svg>
    </div>
  );
}
