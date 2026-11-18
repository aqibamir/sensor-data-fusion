import { useState } from 'react';
import { Ahead, Ask, Controls, Derive, Example, Formula, InOtherWords, Knob, Lead, M, P, Q, Quiz, Readout, Rule, Table, Toggle, Trap } from '../../story/blocks';
import { Scene, StoryShell } from '../../story/StoryShell';

import { Tex } from '../../ui/Tex';
import { DEFAULTS, Params } from './params';
import { EXPLAIN1 } from './Practice1';
import { bayes8, CELLS8, Phi, PRIOR8, World1 } from './World1';

const BINS = ['4 m', '2 m', '1 m', '0.5 m', '0.25 m', 'smooth'];
const RESL = ['2×2', '4×4', '8×8', '32×32', 'smooth'];

export default function Chapter1({ onHome }: { onHome: () => void }) {
  const [p, setP] = useState<Params>(DEFAULTS);
  const set = <K extends keyof Params>(k: K) => (v: Params[K]) => setP((q) => ({ ...q, [k]: v }));
  const b8 = bayes8(p.z8, p.s8);
  const sand = Phi((p.b - 100) / 5) - Phi((p.a - 100) / 5);
  const mean3 = 0.6 * 96 + 0.4 * 108;
  const var3 = 0.6 * (9 + (96 - mean3) ** 2) + 0.4 * (4 + (108 - mean3) ** 2);
  const mse = var3 + (p.guess - mean3) ** 2;

  const scenes: Scene[] = [
    /* ================================================================ 0 */
    {
      id: 'cold-open',
      kicker: 'Prologue',
      title: 'A car in the dark',
      concept: 'Why we need probability',
      steps: [
        {
          id: 's0.1',
          body: (
            <>
              <Lead>It's eleven at night. A car is driving down a long, straight road. For now, you can see it: headlights, tail lights, wheels turning as it passes the distance posts.</Lead>
              <P>Keep an eye on the posts by the road. They're marked every 10 metres. In this chapter, every number you meet will be a distance you can see on this road.</P>
            </>
          ),
        },
        {
          id: 's0.2',
          body: (
            <>
              <P>
                At the start of the road stands a <b>radar</b>. About once a second it sends out a pulse — watch the red ring — and reports one number: how far down the road the car is.
              </P>
              <P>
                It just reported <Q c="meas">103 m</Q>. But the car is really at <Q c="truth">100 m</Q>. The radar is close, but not exact. It never is: electronics are noisy, the beam is fuzzy, the car is a big object, not a dot.
              </P>
            </>
          ),
        },
        {
          id: 's0.3',
          body: (
            <>
              <P>Now turn off the lights.</P>
              <P>
                This is what a tracking system actually experiences. It <b>never sees the car</b>. It only gets these red pins, one per second, each a little bit wrong: 103 m… 118 m… 131 m…
              </P>
              <P>An air-traffic controller, a self-driving car, a navy ship — all of them live in this dark, and all of them must answer the same question, every second, reliably.</P>
            </>
          ),
        },
        {
          id: 's0.4',
          body: (
            <>
              <Lead>Where is the car — really? And how sure are we?</Lead>
              <P>
                That double question is the whole course. To answer the second half honestly, we need a language for “I'm not sure”. That language is <b>probability</b>, and this chapter
                teaches you all of it that tracking needs.
              </P>
              <P>Here's the route. Each stop builds on the last, and I'll show you where each one comes back later in the course:</P>
              <ol>
                <li>a belief instead of a position</li>
                <li>probability as sand: densities</li>
                <li>one best number: the mean</li>
                <li>how sure: variance and σ</li>
                <li>two unknowns at once: joint probability</li>
                <li>forgetting a variable: the marginal</li>
                <li>learning something: the conditional</li>
                <li>Bayes' rule: how a radar beep changes your mind</li>
                <li>matrices, the machines that move space</li>
                <li>the bell curve (Gaussian), in 1D and 2D</li>
                <li>what driving does to a belief</li>
              </ol>
              <P>You need nothing but school maths. Scroll on.</P>
            </>
          ),
        },
      ],
    },
    /* ================================================================ 1 */
    {
      id: 'belief',
      kicker: 'Scene 1',
      title: 'We track a belief, not a car',
      concept: 'State · random variable',
      steps: [
        {
          id: 's1.1',
          body: (
            <>
              <P>Let's play a game. I freeze the car at the 100 m post — you can just about see its outline — and the radar measures once.</P>
              <Ask q={<>The radar says 97 m. If that's all you had, where would you say the car is?</>}>
                <p>
                  “Around 97 m” — but not “exactly 97 m”. You know this radar is usually off by a few metres. So the honest answer isn't a single number. It's a <b>range, with some positions more plausible than others</b>.
                </p>
              </Ask>
            </>
          ),
        },
        {
          id: 's1.2',
          body: (
            <>
              <P>
                Picture every place the car could be as a <Q c="belief">ghost car</Q>. More ghosts where it's more likely, fewer where it's less likely. This cloud of ghosts is our <b>belief</b>.
              </P>
              <P>Now change the radar. A good radar makes the ghosts huddle together; a poor one spreads them all over the road.</P>
              <Controls>
                <Knob label="Radar error" value={p.sig1} min={0.5} max={10} step={0.5} onChange={set('sig1')} unit=" m" />
              </Controls>
              <Rule>We don't track the car. We track our belief about the car: a cloud of possibilities, not a point.</Rule>
              <P>
                Mathematicians call a quantity like this — something we describe by how plausible each of its values is — a <b>random variable</b>. The car's position isn't random in the sense of dice;
                it's random because <i>we don't know it</i>.
              </P>
              <P>
                A note on notation you'll meet on the slides: a capital letter like <M>X</M> often names the random variable itself (“the car's position, whatever it is”), and a small <M>x</M> a particular value it could take (“100 m”). So <M>{'\mathbb E[X]'}</M> on a slide and <M>{'\mathbb E[x]'}</M> here mean the same thing.
              </P>
            </>
          ),
        },
        {
          id: 's1.3',
          body: (
            <>
              <P>
                Everything we want to know about the car at time step <M>k</M> is packed into one list of numbers called the <b>state</b>, <M>{'\\mathbf x_k'}</M>. On our road it's one number — the position. The lecture shows bigger states:
              </P>
              <Table
                head={['State', 'Numbers', 'Example']}
                rows={[
                  [<M>{'x \\in \\mathbb R'}</M>, '1', 'position on a line (our road)'],
                  [<M>{'\\mathbf x = (\\mathbf r, \\mathbf v, \\mathbf a) \\in \\mathbb R^9'}</M>, '9', 'position, velocity, acceleration in 3D'],
                  [<M>{'\\mathbf x = (\\mathbf x_1, \\mathbf x_2)'}</M>, '8', 'two cars, each (x, y, ẋ, ẏ)'],
                  ['kinematics + shape', '…', 'a ship, a convoy ("extended target")'],
                  ['kinematics + class', '…', 'car, truck or bike?'],
                ]}
              />
              <P>
                A dot over a letter means “rate of change”: <M>{'\\dot x'}</M> is the speed along x. Now let's name the ghost cloud the way the lecture does:
              </P>
              <Formula
                tex="p(\mathbf x_k \mid \mathcal Z^k)"
                rows={[
                  ['p(\\,\\cdot\\,)', 'how plausible each value is — the shape of the ghost cloud', 'belief'],
                  ['\\mathbf x_k', 'the state at time step k (here: the position)'],
                  ['\\mid', 'read: “given”'],
                  ['\\mathcal Z^k', 'all radar readings up to now: z₁, z₂, …, z_k'],
                ]}
              />
              <InOtherWords>“Our belief about where the car is, given everything the radar has told us so far.” You'll see this expression on nearly every slide of the course.</InOtherWords>
              <Ahead>Chapter 2 is about how this cloud moves when the car drives (it spreads) and how it shrinks when a new red pin arrives.</Ahead>
              <Quiz
                id="ch1-q1"
                label="Why don't we simply use the latest radar reading as the car's position?"
                q="Why don't we simply use the latest radar reading as the car's position?"
                options={[
                  { t: 'Because the radar is always wrong.', why: 'It isn’t always wrong — it’s noisy: usually close, never exact. The point is to say HOW close.' },
                  { t: 'Because a single number hides how sure we are, and can’t be combined with what we knew before.', ok: true, why: 'A belief keeps the uncertainty, so later we can combine old knowledge with each new reading — that is exactly what tracking does.' },
                  { t: 'Because radars measure speed, not position.', why: 'Our radar measures distance. The issue is noise, not what it measures.' },
                ]}
              />
            </>
          ),
        },
      ],
    },
    /* ================================================================ 2 */
    {
      id: 'density',
      kicker: 'Scene 2',
      title: 'Probability is sand',
      concept: 'Probability density function (pdf)',
      steps: [
        {
          id: 's2.1',
          body: (
            <>
              <P>A puzzle first. We're zoomed in on the road between 99 m and 101 m.</P>
              <Ask q={<>What's the probability that the car is at <b>exactly</b> 100.000000… metres?</>}>
                <p>
                  <b>Zero.</b> Between 99 and 101 there are infinitely many positions — 100.1, 100.01, 100.001… If each had a positive chance, the chances would add up to infinity. So for a
                  continuous quantity, “the probability of one exact point” is useless. We need a different object.
                </p>
              </Ask>
            </>
          ),
        },
        {
          id: 's2.2',
          body: (
            <>
              <P>
                Here's an experiment. The car is parked at 100 m. The radar measures it <b>500 times</b>, as fast as it can. Every reading drops into a 2-metre-wide bin on the road and
                becomes a grain of <Q c="sand">sand</Q>.
              </P>
              <P>Watch the piles grow. Most readings land near 100 m, fewer at 95 or 105, almost none at 85. The pile's shape is how the radar's errors are spread.</P>
            </>
          ),
        },
        {
          id: 's2.3',
          body: (
            <>
              <P>Now make the bins thinner. 2 m, 1 m, half a metre… The jagged staircase gets finer and finer until it's a smooth dune.</P>
              <Controls>
                <Toggle options={BINS} value={p.bin} onChange={set('bin')} />
              </Controls>
              <P>
                The column heights are scaled as “share of the sand per metre of road”, so the staircase doesn't collapse as the bins get thinner. The smooth curve at the end is called a{' '}
                <b>probability density function</b>, written <M>p(x)</M>.
              </P>
              <Table
                head={['Table world (few boxes)', 'Sand world (a smooth dune)']}
                rows={[
                  ['probability of each box', 'density p(x): probability per metre'],
                  ['add boxes up: Σ', 'add thin strips: ∫ … dx'],
                  ['all boxes sum to 1', 'all the sand weighs 1'],
                ]}
              />
              <InOtherWords>Σ (sum) is for boxes, ∫ (integral) is for smooth curves. They do the same job. Whenever you see ∫ on a slide, think: “add up the sand”.</InOtherWords>
            </>
          ),
        },
        {
          id: 's2.4',
          body: (
            <>
              <P>
                Here's the rule that makes densities useful. Imagine the dune contains exactly <b>1 kg</b> of sand. Put two orange cones on the road. The amount of sand between the cones{' '}
                <b>is</b> the probability that the car is between them.
              </P>
              <Controls>
                <Knob label="Cone a" value={p.a} min={75} max={125} step={1} onChange={(v) => set('a')(Math.min(v, p.b))} fmt={(v) => v.toFixed(0)} unit=" m" />
                <Knob label="Cone b" value={p.b} min={75} max={125} step={1} onChange={(v) => set('b')(Math.max(v, p.a))} fmt={(v) => v.toFixed(0)} unit=" m" />
              </Controls>
              <Readout>
                Sand between the cones: <b>{sand.toFixed(3)}</b> → a {(sand * 100).toFixed(1)} % chance the car is between {p.a} m and {p.b} m.
              </Readout>
              <P>Push the cones all the way apart: the reading approaches 1.000 — all the sand. The car is certainly <i>somewhere</i>.</P>
              <Formula
                tex="\begin{gathered} P(a < x < b) = \int_a^b p(x)\,dx \\ p(x)\ge 0, \qquad \int_{-\infty}^{\infty} p(x)\,dx = 1 \end{gathered}"
                rows={[
                  ['P(a<x<b)', 'the probability that the position lies between the cones', 'area'],
                  ['\\int_a^b \\dots dx', 'the integral: add up thin strips of sand from a to b. The ∫ sign is a stretched S, for “sum”.', 'area'],
                  ['p(x)\\ge 0', 'no negative sand'],
                  ['\\int p(x)\\,dx = 1', 'all the sand together weighs 1 — the density is “normalised”'],
                ]}
              />
              <Rule>Height means nothing on its own. Area is probability.</Rule>
            </>
          ),
        },
        {
          id: 's2.5',
          body: (
            <>
              <P>A calculation you can do in your head. Suppose the radar only says “somewhere between 90 and 110 m, no idea where”. Spread the sand evenly.</P>
              <Example>
                <ul>
                  <li>1 kg over 20 metres → height = 1 ÷ 20 = <b>0.05 per metre</b></li>
                  <li>between 95 m and 100 m: width × height = 5 × 0.05 = <b>0.25</b></li>
                </ul>
                <p>A 25 % chance. Look at the stage: the bright block between the cones is exactly a quarter of the strip.</p>
              </Example>
            </>
          ),
        },
        {
          id: 's2.6',
          body: (
            <>
              <P>Now the trap. Squeeze the same kilogram of sand into just half a metre.</P>
              <Controls>
                <Toggle options={['spread over 20 m', 'squeezed into 0.5 m']} value={p.squeeze} onChange={set('squeeze')} />
              </Controls>
              <P>The pile has to be 2 per metre tall, or the sand wouldn't fit: width 0.5 × height 2 = 1.</P>
              <Trap>A density can be larger than 1. Only the area is limited to 1, never the height. If an examiner asks “can p(x) be 7?”, the answer is yes.</Trap>
              <Ahead>Every p(…) on the lecture slides is a dune like this, and every ∫ … dx is “add up the sand”. Even in 9 dimensions, it's still sand — just in a space you can't draw.</Ahead>
              <Quiz
                id="ch1-q2"
                label="The car is spread evenly between 0 m and 4 m. How tall is p(x) there?"
                q="The car is spread evenly between 0 m and 4 m. How tall is p(x) there?"
                options={[
                  { t: '1', why: 'Then the area would be 4 × 1 = 4 — four kilograms of sand.' },
                  { t: '0.25 per metre', ok: true, why: 'Width 4 × height 0.25 = 1. Height = 1 ÷ width.' },
                  { t: '4', why: 'That gives area 16. Remember: area must be 1.' },
                ]}
              />
            </>
          ),
        },
      ],
    },
    /* ================================================================ 3 */
    {
      id: 'mean',
      kicker: 'Scene 3',
      title: 'One number, please',
      concept: 'Expectation · MMSE',
      steps: [
        {
          id: 's3.1',
          body: (
            <>
              <P>A dune is honest, but your boss wants one number: “Where is the car?”</P>
              <P>
                Here's the most common answer. Put the dune on a wooden beam and slide a pivot underneath until the beam stops tipping. That balance point is called the <b>expectation</b>,
                or mean, written <M>{'\\mathbb E[x]'}</M> or <M>{'\\bar x'}</M>.
              </P>
              <P>This dune is lopsided — more sand on the left, a smaller hump on the right — so the balance point isn't simply at the highest point.</P>
            </>
          ),
        },
        {
          id: 's3.2',
          body: (
            <>
              <P>Let's see the rule with something you know: a die. The faces 1 to 6 each come up with probability ⅙.</P>
              <Example>
                <Tex tex="\mathbb E = 1\cdot\tfrac16 + 2\cdot\tfrac16 + 3\cdot\tfrac16 + 4\cdot\tfrac16 + 5\cdot\tfrac16 + 6\cdot\tfrac16 = 3.5" block />
                <p>You can never roll a 3.5. But put six equal weights on a ruler at 1…6, and it balances at 3.5. Each value, times how likely it is, all added up.</p>
              </Example>
              <Formula
                tex="\begin{gathered} \mathbb E[x] = \int x\,p(x)\,dx \\ \mathbb E[g(x)] = \int g(x)\,p(x)\,dx \end{gathered}"
                rows={[
                  ['\\mathbb E[x]', 'the expectation: the balance point of the dune', 'mean'],
                  ['x\\,p(x)', 'each position, weighted by how much sand sits there'],
                  ['g(x)', 'anything you compute from the state. The lecture calls it an “observable”.'],
                ]}
              />
              <Example title="An observable, worked">
                <p>
                  The radar's pulse travels at the speed of light, so the echo time is <M>{'g(x) = 2x / c'}</M>. The expected echo time is <M>{'\\mathbb E[g(x)] = 2\\,\\mathbb E[x]/c'}</M> — weight each possible echo time by its sand.
                </p>
                <p>
                  A much more important observable: <M>{'g(x) = (x-\\bar x)^2'}</M>, the squared miss. Its expectation is the <b>variance</b> — that's the next scene.
                </p>
              </Example>
            </>
          ),
        },
        {
          id: 's3.3',
          body: (
            <>
              <P>Now a trick question. Two garages stand by the road, at 90 m and at 110 m. The radar is confused: half the sand piles at each garage, none in between.</P>
              <Ask q="Where does the beam balance — and is the car ever there?">
                <p>
                  It balances at <b>100 m</b>: 0.5 × 90 + 0.5 × 110. But that's the empty road between the garages. The car is <b>never</b> at 100 m. The mean can sit in a place that's impossible.
                </p>
              </Ask>
              <Controls>
                <Knob label="Share of sand at the left garage" value={p.w3} min={0} max={1} step={0.01} onChange={set('w3')} fmt={(v) => `${Math.round(v * 100)} %`} />
              </Controls>
              <Trap>The mean is not “the most likely position”. When a belief has two bumps, the mean can fall into the valley between them.</Trap>
              <Ahead>
                Remember this picture. In Chapter 8, the PDAF filter squeezes a two-bump belief into one bump at its mean, and the lecture's verdict is “Problem: multimodality is lost!”. This beam is
                exactly what that means. MHT keeps both garages instead.
              </Ahead>
            </>
          ),
        },
        {
          id: 's3.4',
          body: (
            <>
              <P>So why is the mean the standard answer, if it can be misleading? Because it's the best guess in one precise sense.</P>
              <P>
                Suppose you must report one number, and you're penalised by the <b>square</b> of your miss. Try different guesses below and watch the average penalty:
              </P>
              <Controls>
                <Knob label="Your guess" value={p.guess} min={88} max={112} step={0.1} onChange={set('guess')} unit=" m" />
              </Controls>
              <Readout>
                Average squared miss: <b>{mse.toFixed(1)} m²</b> {Math.abs(p.guess - mean3) < 0.3 ? '← the smallest possible' : `(the mean ${mean3.toFixed(1)} m would give ${var3.toFixed(1)} m²)`}
              </Readout>
              <Rule>The mean is the guess with the smallest average squared error. That's why the lecture calls it the minimum mean squared error (MMSE) estimator.</Rule>
              <P>The slider shows it; here's why it must be so. Two lines of algebra, and every step is something you already know:</P>
              <Derive
                steps={[
                  { tex: '\\mathbb E\\big[(x-g)^2\\big] = \\mathbb E\\big[\\big((x-\\bar x) + (\\bar x - g)\\big)^2\\big]', why: 'Sneak the mean in: subtract x̄ and add it back. Nothing changed.' },
                  { tex: '= \\mathbb E\\big[(x-\\bar x)^2\\big] + 2(\\bar x - g)\\,\\underbrace{\\mathbb E[x-\\bar x]}_{=\\,0} + (\\bar x - g)^2', why: 'Multiply out the square. The middle term vanishes: on average, x misses its own mean by zero.' },
                  { tex: '= \\mathbb V[x] + (\\bar x - g)^2', why: 'The first term is the variance — it doesn’t depend on your guess. The second is never negative and is zero only when g = x̄. So the best guess is the mean, and the smallest possible error is the variance.' },
                ]}
              />
              <Quiz
                id="ch1-q3"
                label="A car is at 0 m with probability 0.8 and at 10 m with probability 0.2. What's the expec…"
                q="A car is at 0 m with probability 0.8 and at 10 m with probability 0.2. What's the expectation?"
                options={[
                  { t: '5 m', why: 'That would be the 50/50 case. Here the left side is much heavier.' },
                  { t: '2 m', ok: true, why: '0.8 · 0 + 0.2 · 10 = 2. The balance point leans towards the heavier side.' },
                  { t: '0 m', why: '0 m is the most likely position, but the mean also feels the 20 % at 10 m.' },
                ]}
              />
            </>
          ),
        },
      ],
    },
    /* ================================================================ 4 */
    {
      id: 'spread',
      kicker: 'Scene 4',
      title: 'How sure are we?',
      concept: 'Variance · standard deviation σ',
      steps: [
        {
          id: 's4.1',
          body: (
            <>
              <P>
                Two radars watch the same parked car. The top one is a precision instrument. The bottom one is cheap. Each fires 50 times. Both are right <i>on average</i> — both clouds of pins are centred
                on 100 m.
              </P>
              <P>Would you trust them equally? Of course not. One number — the mean — can't tell them apart. We need a second number: how spread out.</P>
            </>
          ),
        },
        {
          id: 's4.2',
          body: (
            <>
              <P>Let's build that number with your hands. Take a few pins from the cheap radar:</P>
              <ol>
                <li>measure how far each one is from the mean (the orange rubber bands),</li>
                <li>square that distance — draw it as an actual square (left and right misses both count positive, and big misses count a lot),</li>
                <li>average the squares.</li>
              </ol>
              <P>That average is the <b>variance</b>. Its square root, back in metres, is the <b>standard deviation</b> σ: the size of a typical miss.</P>
              <Formula
                tex="\begin{gathered} \mathbb V[x] = \mathbb E\big[(x-\bar x)^2\big] = \sigma^2 \\ \sigma = \sqrt{\mathbb V[x]} \end{gathered}"
                rows={[
                  ['\\bar x', 'the mean, 𝔼[x]'],
                  ['(x-\\bar x)^2', 'one squared miss: an orange square', 'sq'],
                  ['\\mathbb E[\\cdots]', 'averaged over the whole belief'],
                  ['\\sigma', 'standard deviation: “typical miss”, in metres'],
                ]}
              />
              <Example>
                <p>The two-garage belief: 90 m and 110 m, half each, mean 100 m.</p>
                <ul>
                  <li>each possibility misses the mean by 10 m → squared miss 100 m²</li>
                  <li>variance = 0.5 × 100 + 0.5 × 100 = 100 m², so σ = 10 m</li>
                </ul>
              </Example>
            </>
          ),
        },
        {
          id: 's4.3',
          body: (
            <>
              <P>For the bell-shaped dunes you'll meet all semester, σ comes with a handy rule — the painted bands on the road:</P>
              <Table head={['Within', 'Share of the sand']} rows={[['± 1σ', '≈ 68 %'], ['± 2σ', '≈ 95 %'], ['± 3σ', '≈ 99.7 %']]} />
              <Ask q="Our belief: mean 100 m, σ = 5 m. Roughly how often is the car more than 10 m away from 100 m?">
                <p>10 m is 2σ. About 95 % of the sand is within ±2σ, so the car is outside about <b>5 %</b> of the time.</p>
              </Ask>
              <Controls>
                <Knob label="σ" value={p.sig4} min={2} max={10} step={0.5} onChange={set('sig4')} unit=" m" />
              </Controls>
              <P>Make σ bigger: the bell gets wider and flatter. It has to — there's still exactly 1 kg of sand.</P>
              <P>
                One more word you'll need. The mean and the variance are called the <b>first two moments</b> of a density: the mean says <i>where</i> the sand is, the variance <i>how spread out</i>. For a bell, these two numbers describe it completely — remember that, because in Chapter 8 “moment matching” replaces a complicated belief by the bell with the same mean and variance.
              </P>
              <Ahead>
                The Kalman filter's matrix <M>{'\\mathbf P'}</M> is this variance, grown up to several dimensions. Prediction makes it bigger, a measurement makes it smaller. And “gating”
                (Chapter 6) asks: is a new pin more than about 3σ away?
              </Ahead>
              <Quiz
                id="ch1-q4"
                label="Radar A has σ = 2 m, radar B has σ = 20 m. Which is true?"
                q="Radar A has σ = 2 m, radar B has σ = 20 m. Which is true?"
                options={[
                  { t: 'B is better, because 20 > 2.', why: 'A larger σ means more spread — less precise.' },
                  { t: 'B’s variance is 100 times A’s.', ok: true, why: 'Variance is σ²: 400 m² versus 4 m². Ten times the σ is a hundred times the variance.' },
                  { t: 'Same mean, so same variance.', why: 'Mean and spread are separate pieces of information — that’s the whole point of this scene.' },
                ]}
              />
            </>
          ),
        },
      ],
    },
    /* ================================================================ 5 */
    {
      id: 'joint',
      kicker: 'Scene 5',
      title: 'Two unknowns at once',
      concept: 'Joint pdf · covariance',
      steps: [
        {
          id: 's5.1',
          body: (
            <>
              <P>
                Real trackers never want just the position. They want the <b>speed</b> too — because the speed tells you where the car will be next second. So from now on we're unsure about two
                things at once.
              </P>
            </>
          ),
        },
        {
          id: 's5.2',
          body: (
            <>
              <P>
                An experiment. A hundred cars leave a car park (we're looking at it from above, on the field behind the road). Each has its own start and its own speed: <b style={{ color: '#ea580c' }}>orange</b> cars are fast, <b style={{ color: '#0d9488' }}>teal</b> cars slow.
              </P>
              <P>Five seconds later, we sort them two ways: <b>near</b> (under 100 m) or <b>far</b>, and <b>slow</b> or <b>fast</b>. Watch where the orange ones end up.</P>
            </>
          ),
        },
        {
          id: 's5.3',
          body: (
            <>
              <P>Now we count them into a table and divide by 100. The bars on the field are these four numbers:</P>
              <Table
                head={['', 'slow', 'fast']}
                rows={[
                  ['near', '30 cars → 0.30', '10 cars → 0.10'],
                  ['far', '15 cars → 0.15', '45 cars → 0.45'],
                ]}
              />
              <P>
                Each box is a <b>joint probability</b>: the chance of a position <i>and</i> a speed together, written <M>{'p(x, y)'}</M>. The comma means “and”. All four add up to 1.
              </P>
              <Ask q="Is a far car more likely to be slow, or fast? What does that tell you?">
                <p>
                  Fast: 0.45 against 0.15. Of course — fast cars <i>got</i> far. Position and speed are linked; statisticians say they're <b>correlated</b>. This link is the engine of tracking:
                  knowing the speed tells you about the position.
                </p>
              </Ask>
              <Formula
                tex="\begin{gathered} p(x, y) \\ \sum_x\sum_y p(x,y) = 1 \qquad \iint p(x,y)\,dx\,dy = 1 \end{gathered}"
                rows={[
                  ['p(x,y)', 'probability of x AND y together'],
                  ['\\sum\\sum', 'add every box of the table'],
                  ['\\iint', 'the same for smooth quantities: volume under a landscape'],
                ]}
              />
              <Quiz
                id="ch1-q5"
                label="What is p(near, fast)?"
                q="What is p(near, fast)?"
                options={[
                  { t: '0.10', ok: true, why: 'Row “near”, column “fast”: both at once.' },
                  { t: '0.55', why: 'That’s p(fast) for any position — a marginal (next scene).' },
                  { t: '0.40', why: 'That’s p(near) for any speed.' },
                ]}
              />
            </>
          ),
        },
        {
          id: 's5.4',
          body: (
            <>
              <P>Ask finer questions — not near/far but every metre, not slow/fast but every km/h — and the table gets more and more boxes. Watch the bars melt into a smooth landscape.</P>
              <Controls>
                <Toggle options={RESL} value={p.res} onChange={set('res')} />
              </Controls>
              <P>
                The height of the landscape is the <b>joint density</b> <M>{'p(x, y)'}</M>. The <b>volume</b> under a patch is the probability of landing in that patch — the same sand idea, one
                dimension up. And notice the shape: a <b>tilted ridge</b>. That tilt is the correlation, “fast goes with far”.
              </P>
            </>
          ),
        },
        {
          id: 's5.5',
          body: (
            <>
              <P>Let's measure the tilt. Covariance asks: when x is above its mean, does y tend to be above its mean too?</P>
              <Formula
                tex="\begin{gathered} \text{Cov}[x,y] = \mathbb E\big[(x-\bar x)(y-\bar y)\big] \\ \rho = \frac{\text{Cov}[x,y]}{\sigma_x\sigma_y} \in [-1,1] \end{gathered}"
                rows={[
                  ['(x-\\bar x)(y-\\bar y)', 'positive when both miss in the same direction'],
                  ['\\text{Cov}', 'covariance: the average of that product'],
                  ['\\rho', 'correlation: covariance scaled to between −1 and 1. 0 means unrelated.', 'cov'],
                ]}
              />
              <Controls>
                <Knob label="Correlation ρ" value={p.rho} min={-0.9} max={0.9} step={0.05} onChange={set('rho')} fmt={(v) => v.toFixed(2)} />
                <Knob label="σ position" value={p.sx} min={0.5} max={1.8} step={0.05} onChange={set('sx')} fmt={(v) => v.toFixed(2)} />
                <Knob label="σ speed" value={p.sy} min={0.5} max={1.8} step={0.05} onChange={set('sy')} fmt={(v) => v.toFixed(2)} />
              </Controls>
              <P>The orange rings on the floor are contour lines — places of equal height, like on a hiking map. For this kind of landscape they're always ellipses.</P>
              <P>The lecture collects all these spreads into one table, the <b>covariance matrix</b>:</P>
              <Formula
                tex="\begin{gathered} \mathbb E[\mathbf x] = \bar{\mathbf x} \\ \mathbb C[\mathbf x] = \mathbf P = \begin{pmatrix} \sigma_x^2 & \text{Cov}[x,y] \\ \text{Cov}[x,y] & \sigma_y^2\end{pmatrix} \end{gathered}"
                rows={[
                  ['\\mathbb C[\\mathbf x] = \\mathbf P', 'the covariance matrix: spreads on the diagonal, covariances off it'],
                  ['\\mathbb E[\\mathbf x] = \\bar{\\mathbf x}', 'the mean, now a list (vector): mean position, mean speed'],
                ]}
                note="The lecture writes 𝔼[x] = x̄ and ℂ[x] = P everywhere — on the χ² slides, in moment matching, in Kalman."
              />
              <P>
                Two properties every covariance matrix has, worth saying in an exam: it is <b>symmetric</b> (Cov[x, y] = Cov[y, x], so P = Pᵀ), and its diagonal entries — the variances — are <b>never negative</b>. More strongly, P is positive (semi-)definite: no direction can have negative spread. That's why the σ-contours are always ellipses, never something stranger.
              </P>
              <Ahead>
                In the Kalman filter the state is (position, velocity) and <M>{'\\mathbf P'}</M> is exactly this matrix. A tilted ellipse in Chapter 3 is this tilted ridge, seen from above.
              </Ahead>
            </>
          ),
        },
      ],
    },
    /* ================================================================ 6 */
    {
      id: 'marginal',
      kicker: 'Scene 6',
      title: 'Forgetting a variable',
      concept: 'Marginal density',
      steps: [
        {
          id: 's6.1',
          body: (
            <>
              <P>Suppose right now you only care <i>where</i> the car is, not how fast. Watch the bars: in each row, the slow and fast bars slide together and stack.</P>
              <Table
                head={['', 'slow', 'fast', 'row sum']}
                hlCol={3}
                rows={[
                  ['near', '0.30', '0.10', '0.40'],
                  ['far', '0.15', '0.45', '0.60'],
                ]}
              />
              <P>
                The stacks are <M>{'p(\\text{near}) = 0.40'}</M> and <M>{'p(\\text{far}) = 0.60'}</M>. Adding over the variable you don't care about is called taking the <b>marginal</b>. (The name comes from writing these sums in the margin of the table.)
              </P>
            </>
          ),
        },
        {
          id: 's6.2',
          body: (
            <>
              <P>On the landscape, the same move is a bulldozer. Drive the blade across, pushing all the sand along the speed direction against the back wall.</P>
              <Controls>
                <Knob label="Bulldozer" value={p.push} min={0} max={1} step={0.01} onChange={set('push')} fmt={(v) => `${Math.round(v * 100)} %`} />
              </Controls>
              <P>
                What piles up against the wall — the <Q c="prior">green curve</Q> — is the density of the position alone. All speeds have been added in.
              </P>
              <Formula
                tex="p(x) = \int p(x, y)\,dy \;=\; \int p(x\mid y)\,p(y)\,dy"
                rows={[
                  ['p(x)', 'the marginal: what we believe about x, ignoring y'],
                  ['\\int \\dots dy', 'bulldoze over every speed (a row sum for smooth y)'],
                  ['p(x\\mid y)\\,p(y)', 'the joint written as a product — the next scene shows why. The lecture calls this trick “Enter y!”'],
                ]}
              />
              <Ahead>
                This is the most important move of Chapter 2. To predict where the car will be next second, you consider every place it could be <i>now</i> and bulldoze over them: <M>{'p(\\mathbf x_k) = \\int p(\\mathbf x_k\\mid\\mathbf x_{k-1})\\,p(\\mathbf x_{k-1})\\,d\\mathbf x_{k-1}'}</M>.
                It has a scary name — the Chapman–Kolmogorov equation — but it's just a marginal.
              </Ahead>
              <Quiz
                id="ch1-q6"
                label="From the table: what is p(fast), whatever the position?"
                q="From the table: what is p(fast), whatever the position?"
                options={[
                  { t: '0.45', why: 'That’s only far & fast. Near & fast counts too.' },
                  { t: '0.55', ok: true, why: 'Column sum: 0.10 + 0.45.' },
                  { t: '0.10', why: 'That’s only near & fast.' },
                ]}
              />
            </>
          ),
        },
      ],
    },
    /* ================================================================ 7 */
    {
      id: 'conditional',
      kicker: 'Scene 7',
      title: 'Learning something',
      concept: 'Conditional pdf · independence',
      steps: [
        {
          id: 's7.1',
          body: (
            <>
              <P>A police car pulls up, lights flashing: <b>“That car is FAST.”</b> What do you now believe about its position?</P>
              <Controls>
                <Toggle options={['before the tip', 'after the tip']} value={p.tip} onChange={set('tip')} />
              </Controls>
              <P>
                Everything slow is now impossible — that column falls away. What's left, 0.10 and 0.45, only adds up to 0.55. So we <b>stretch</b> both bars by the same factor, 1 ÷ 0.55, until they add up to 1 again.
              </P>
              <Table
                head={['position', 'p(position, fast)', '÷ p(fast)', 'p(position | fast)']}
                hlCol={3}
                rows={[
                  ['near', '0.10', '÷ 0.55', '0.18'],
                  ['far', '0.45', '÷ 0.55', '0.82'],
                ]}
              />
              <P>Before the tip, “far” was 60 %. After it, 82 %. Information changed the belief.</P>
              <Formula
                tex="\begin{gathered} p(x\mid y) = \frac{p(x, y)}{p(y)} \\ \Longleftrightarrow\quad p(x, y) = p(x\mid y)\,p(y) \end{gathered}"
                rows={[
                  ['p(x\\mid y)', 'the conditional: belief about x after learning y (“x given y”)'],
                  ['p(x, y)', 'the part of the joint that agrees with what we learned'],
                  ['p(y)', 'how much of it there was — dividing by it is the stretch'],
                ]}
              />
            </>
          ),
        },
        {
          id: 's7.2',
          body: (
            <>
              <P>On the landscape: a red knife cuts it at the speed you were told. The cut edge is <M>{'p(x, y_0)'}</M>. Then rescale it to area 1: that's <M>{'p(x\\mid y_0)'}</M>.</P>
              <Controls>
                <Knob label="Speed you were told" value={p.y0} min={-3} max={3} step={0.05} onChange={set('y0')} fmt={(v) => v.toFixed(2)} />
                <Toggle options={['cut', 'cut + rescale']} value={p.renorm} onChange={set('renorm')} />
              </Controls>
              <P>Move the knife. Because the ridge is tilted, the slice's peak moves with it: a faster car is probably further along.</P>
            </>
          ),
        },
        {
          id: 's7.3',
          body: (
            <>
              <P>Now flatten the tilt to zero (ρ = 0) and move the knife again. The slice never moves. When knowing y tells you nothing about x, the two are <b>independent</b>:</P>
              <Controls>
                <Knob label="Speed you were told" value={p.y0} min={-3} max={3} step={0.05} onChange={set('y0')} fmt={(v) => v.toFixed(2)} />
              </Controls>
              <Formula
                tex="\begin{gathered} \text{independent:}\quad p(x\mid y) = p(x) \\ \Longleftrightarrow\quad p(x,y) = p(x)\,p(y) \end{gathered}"
                rows={[
                  ['p(x)\\,p(y)', 'for independent things, the joint is just the product'],
                ]}
              />
              <Ahead>
                Independence is how we combine several sensors (Chapter 5: two radars with independent errors → multiply their likelihoods), and how we model false alarms (Chapter 7).
              </Ahead>
              <Trap>
                <M>{'p(x\\mid y)'}</M> is not <M>{'p(y\\mid x)'}</M>. Here p(far | fast) = 0.82, but p(fast | far) = 0.45 / 0.60 = 0.75. Mixing them up is the most common mistake in all of probability — and fixing it is exactly what Bayes' rule is for.
              </Trap>
              <Quiz
                id="ch1-q7"
                label="From the table: what is p(slow | near)?"
                q="From the table: what is p(slow | near)?"
                options={[
                  { t: '0.30', why: 'That’s p(slow, near). You still have to divide by p(near) = 0.40.' },
                  { t: '0.75', ok: true, why: '0.30 / 0.40 = 0.75.' },
                  { t: '0.67', why: '0.30 / 0.45 is p(near | slow) — the bar flipped.' },
                ]}
              />
            </>
          ),
        },
      ],
    },
    /* ================================================================ 8 */
    {
      id: 'bayes',
      kicker: 'Scene 8',
      title: 'Bayes: the radar beeps',
      concept: "Bayes' rule · likelihood",
      steps: [
        {
          id: 's8.1',
          body: (
            <>
              <Lead>This is the heart of the chapter, and of the course.</Lead>
              <P>
                Four lampposts stand at 100, 110, 120 and 130 m. Before the radar says anything, experience tells us the car is usually near the middle two. The green columns are this{' '}
                <Q c="prior">prior</Q> belief: 0.1, 0.4, 0.4, 0.1.
              </P>
            </>
          ),
        },
        {
          id: 's8.2',
          body: (
            <>
              <P>
                Beep. The radar reports <Q c="meas">z = {p.z8} m</Q>, and we know its typical error is σ = {p.s8} m. For each lamppost we ask the radar's own question:{' '}
                <i>“If the car were really here, how plausible is a reading of {p.z8}?”</i>
              </P>
              <P>
                The answers are the red columns, the <Q c="meas">likelihood</Q> <M>{'p(z\\mid x)'}</M>. Lampposts close to the reading score high; far ones score almost nothing. The red curve on the
                road is the same bell, for every position.
              </P>
              <Trap>The red columns don't add up to 1, and they don't need to. A likelihood answers “how well does this position explain the reading?”, not “how likely is this position?”.</Trap>
            </>
          ),
        },
        {
          id: 's8.2b',
          body: (
            <>
              <P>Where does that red bell actually come from? From a one-line description of the radar, called the <b>sensor model</b> (or measurement model):</P>
              <Formula
                tex="\begin{gathered} z = x + w, \qquad w \sim \mathcal N(0,\,\sigma^2) \\ \Downarrow \\ p(z\mid x) = \mathcal N(z;\, x,\, \sigma^2) \end{gathered}"
                rows={[
                  ['z', 'the reading the radar reports'],
                  ['x', 'the true position (unknown)'],
                  ['w', 'the radar’s error: a random number, bell-shaped around 0 with spread σ'],
                  ['p(z\\mid x)', 'if the car is at x, the reading is x plus a random error — so the reading is a bell centred on x. That bell, read as a function of x, is the likelihood.', 'lik'],
                ]}
              />
              <Example>
                <p>
                  Car at 120 m, σ = 10 m. Readings between 110 and 130 m happen 68 % of the time (±1σ); a reading of 150 m (3σ away) almost never does. So if the radar <i>says</i> 125 m, positions near 125 explain it well and positions far away explain it badly — exactly the red columns.
                </p>
              </Example>
              <Ahead>
                In Chapter 3 the sensor model grows up to <M>{'\\mathbf z_k = \\mathbf H\\mathbf x_k + \\mathbf w_k'}</M>: <M>{'\\mathbf H'}</M> picks out what the sensor can see (say, only the position, not the speed), and <M>{'\\mathbf w_k \\sim \\mathcal N(\\mathbf 0, \\mathbf R)'}</M> is its error. Same idea, with matrices.
              </Ahead>
            </>
          ),
        },
        {
          id: 's8.3',
          body: (
            <>
              <P>Now combine what we believed with what the radar says: at every lamppost, <b>multiply</b> green × red. The columns merge into gold.</P>
              <Ask q={`120 m and 130 m are equally close to ${p.z8} m, so they get the same likelihood. Which one ends up taller?`}>
                <p>120 m — because the prior already favoured it 4 to 1 (0.4 against 0.1). Equal evidence, unequal starting points.</p>
              </Ask>
            </>
          ),
        },
        {
          id: 's8.4',
          body: (
            <>
              <P>The gold columns only add up to {b8.sum.toFixed(3)}. Stretch them all by the same factor so they sum to 1 — they turn blue. That's the <Q c="post">posterior</Q>: what we believe after the beep.</P>
              <Example title="The whole calculation — check it with a calculator">
                <Table
                  head={['lamppost', 'prior', 'likelihood', 'prior × lik.', 'posterior']}
                  hlCol={4}
                  rows={CELLS8.map((c, i) => [`${c} m`, PRIOR8[i].toFixed(2), b8.lik[i].toFixed(3), b8.prod[i].toFixed(4), b8.post[i].toFixed(3)])}
                />
                <p>
                  Likelihood here: <M>{'e^{-\\frac12((z-x)/\\sigma)^2}'}</M>. Its constant factor in front would cancel in the stretch, so we leave it out. Sum of the gold column = {b8.sum.toFixed(4)}.
                </p>
              </Example>
              <Controls>
                <Knob label="Radar reading z" value={p.z8} min={95} max={140} step={1} onChange={set('z8')} fmt={(v) => v.toFixed(0)} unit=" m" />
                <Knob label="Radar error σ" value={p.s8} min={3} max={40} step={1} onChange={set('s8')} fmt={(v) => v.toFixed(0)} unit=" m" />
              </Controls>
              <P>Play: a terrible radar (σ = 40 m) gives an almost flat red row, and the posterior stays close to the prior. A great radar (σ = 3 m) and the posterior jumps to the lamppost nearest the reading.</P>
            </>
          ),
        },
        {
          id: 's8.5',
          body: (
            <>
              <P>You've just done Bayes' rule by hand. Now let's see why it's true — it takes three moves, and you already know each one.</P>
              <Derive
                steps={[
                  { tex: 'p(x, z) = p(x\\mid z)\\,p(z) \\quad\\text{and}\\quad p(x, z) = p(z\\mid x)\\,p(x)', why: 'Write the same joint two ways, using the conditional rule from Scene 7.' },
                  { tex: '\\textcolor{#2563EB}{p(x\\mid z)} = \\frac{\\textcolor{#DC2626}{p(z\\mid x)}\\,\\textcolor{#16A34A}{p(x)}}{p(z)}', why: 'Set them equal and divide by p(z). That is Bayes’ rule.' },
                  { tex: 'p(z) = \\sum_x p(z\\mid x)\\,p(x) \\quad\\text{or}\\quad \\int p(z\\mid x)\\,p(x)\\,dx', why: 'The denominator is a marginal: the sum of the gold column. It doesn’t depend on x — it is only the stretch factor.' },
                ]}
              />
              <Formula
                tex="\textcolor{#2563EB}{p(x\mid z)} = \frac{\textcolor{#DC2626}{p(z\mid x)}\;\textcolor{#16A34A}{p(x)}}{\int p(z\mid x)\,p(x)\,dx}"
                rows={[
                  ['p(x)', 'prior: belief before the beep (green)'],
                  ['p(z\\mid x)', 'likelihood: the radar’s model of its own errors (red)'],
                  ['p(x\\mid z)', 'posterior: belief after the beep (blue)'],
                  ['\\int \\dots dx', 'normalisation: the stretch that makes it sum to 1'],
                ]}
              />
              <InOtherWords>The lecture writes it as p(x|z) ← p(z|x), p(x): turn the sensor's knowledge about itself into knowledge about the car.</InOtherWords>
              <P>
                One more property makes Bayes usable for tracking. Every rule in this chapter keeps working if you <b>condition everything on some extra knowledge</b> — call it 𝒵, say “all the earlier radar readings”. Just add “| 𝒵” everywhere:
              </P>
              <Formula
                tex="p(x\mid z, \mathcal Z) = \frac{p(z\mid x, \mathcal Z)\;p(x\mid \mathcal Z)}{p(z\mid \mathcal Z)}"
                rows={[
                  ['p(x\\mid \\mathcal Z)', 'the prior: what the earlier readings already told us'],
                  ['p(z\\mid x, \\mathcal Z)', 'the likelihood of the new reading (usually the old readings add nothing here: p(z | x))'],
                  ['p(x\\mid z, \\mathcal Z)', 'the new belief, using old readings and the new one'],
                ]}
              />
              <Ahead>This is literally the filtering step of Chapter 2: yesterday's posterior becomes today's prior, and each beep updates it. It's Bayes, run over and over.</Ahead>
            </>
          ),
        },
        {
          id: 's8.6',
          body: (
            <>
              <P>
                Now give the road infinitely many lampposts. The columns become curves: a <Q c="prior">green prior dune</Q>, the <Q c="meas">red likelihood</Q>, and their rescaled product, the{' '}
                <Q c="post">blue posterior</Q>.
              </P>
              <Controls>
                <Knob label="Radar reading z" value={p.z8} min={95} max={140} step={1} onChange={set('z8')} fmt={(v) => v.toFixed(0)} unit=" m" />
                <Knob label="Radar error σ" value={p.s8} min={3} max={25} step={1} onChange={set('s8')} fmt={(v) => v.toFixed(0)} unit=" m" />
              </Controls>
              <Rule>The posterior sits between what we expected and what the radar said — closer to whichever is surer — and it's narrower than both. Combining information always sharpens.</Rule>
              <Ahead>This is the filtering step of every tracker in the course. In Chapter 3, with bell curves, this multiply-and-stretch becomes three lines of algebra: the Kalman update.</Ahead>
              <Quiz
                id="ch1-q8"
                label="Why may we drop constant factors like 1/√(2πσ²) from the likelihood?"
                q="Why may we drop constant factors like 1/√(2πσ²) from the likelihood?"
                options={[
                  { t: 'Because they equal 1.', why: 'They don’t — but see the right answer.' },
                  { t: 'They multiply every position equally, so they cancel in the final stretch.', ok: true, why: 'Anything that doesn’t depend on x disappears in the normalisation. That’s why slides often write ∝, “proportional to”.' },
                  { t: 'Because likelihoods are not probabilities.', why: 'True, but that’s not why the constant can go.' },
                ]}
              />
            </>
          ),
        },
      ],
    },
    /* ================================================================ 9 */
    {
      id: 'matrices',
      kicker: 'Scene 9',
      title: 'Matrices: machines that move space',
      concept: 'Matrix · transpose · inverse · determinant',
      steps: [
        {
          id: 's9.1',
          body: (
            <>
              <P>
                From now on the state is a list — a <b>vector</b> — like <M>{'\\mathbf x = (\\text{position}, \\text{speed})'}</M>. The formulas ahead use <b>matrices</b> to transform such lists. If you've never met them, this short scene is all you need.
              </P>
              <P>A matrix is a small table of numbers that acts like a machine: a vector goes in, a new vector comes out. The rule is “row times column”:</P>
              <Example>
                <Tex tex="\begin{pmatrix} 1 & 1 \\ 0 & 1\end{pmatrix}\begin{pmatrix}1\\2\end{pmatrix} = \begin{pmatrix}1\cdot 1 + 1\cdot 2\\ 0\cdot 1 + 1\cdot 2\end{pmatrix} = \begin{pmatrix}3\\2\end{pmatrix}" block />
                <p>Read it as physics: a car at position 1 with speed 2 drives for one second → position 1 + 2 = 3, speed still 2. This matrix is the “drive for one second” machine.</p>
              </Example>
              <Controls>
                <Knob label="Run the machine" value={p.mm} min={0} max={1} step={0.01} onChange={set('mm')} fmt={(v) => `${Math.round(v * 100)} %`} />
              </Controls>
            </>
          ),
        },
        {
          id: 's9.2',
          body: (
            <>
              <P>
                Now feed <i>every</i> point of the plane through the machine at once. The grid on the field is “all possible (position, speed) pairs”; each small block is a car. Slow cars (teal) at the bottom, fast ones (orange) at the top.
              </P>
              <Controls>
                <Toggle options={['drive', 'stretch', 'rotate']} value={['drive', 'stretch', 'rotate'].indexOf(p.preset)} onChange={(i) => set('preset')((['drive', 'stretch', 'rotate'] as const)[i])} />
                <Knob label="Run the machine" value={p.mm} min={0} max={1} step={0.01} onChange={set('mm')} fmt={(v) => `${Math.round(v * 100)} %`} />
              </Controls>
              <P>
                <b>Drive</b> shears the grid: fast cars move further than slow ones. <b>Stretch</b> doubles every position. <b>Rotate</b> turns the plane. A matrix is completely described by where it sends the two arrows: the <span style={{ color: '#ea580c' }}>orange</span> one (1, 0) and the <span style={{ color: '#2563eb' }}>blue</span> one (0, 1). Their landing points are the matrix's two columns.
              </P>
            </>
          ),
        },
        {
          id: 's9.3',
          body: (
            <>
              <P>Three more words appear in the formulas ahead. Each has a picture:</P>
              <Table
                head={['Word', 'Symbol', 'Picture']}
                rows={[
                  ['determinant', <M>{'|\\mathbf A|'}</M>, 'how much the machine scales area: the gold square becomes a parallelogram of this area'],
                  ['inverse', <M>{'\\mathbf A^{-1}'}</M>, 'the undo machine: run A, then A⁻¹, and every point is back home'],
                  ['transpose', <M>{'\\mathbf A^{\\top}'}</M>, 'flip the table over its diagonal: rows become columns'],
                ]}
              />
              <Controls>
                <Toggle options={['drive', 'stretch', 'rotate']} value={['drive', 'stretch', 'rotate'].indexOf(p.preset)} onChange={(i) => set('preset')((['drive', 'stretch', 'rotate'] as const)[i])} />
                <Knob label="Run the machine" value={p.mm} min={0} max={1} step={0.01} onChange={set('mm')} fmt={(v) => `${Math.round(v * 100)} %`} />
                <Toggle options={['A only', 'A then A⁻¹ (undo)']} value={p.undo} onChange={set('undo')} />
              </Controls>
              <Example>
                <Tex tex="\mathbf A = \begin{pmatrix} 1 & 1\\ 0 & 1\end{pmatrix}\quad |\mathbf A| = 1\cdot1 - 1\cdot 0 = 1 \quad \mathbf A^{-1} = \begin{pmatrix} 1 & -1\\ 0 & 1\end{pmatrix} \quad \mathbf A^\top = \begin{pmatrix} 1 & 0\\ 1 & 1\end{pmatrix}" block />
                <p>Driving shears space but keeps area (determinant 1). Driving backwards for one second undoes it.</p>
              </Example>
              <Ahead>
                You now know every matrix operation in Chapters 1–3: <M>{'\\mathbf A\\mathbf x'}</M> (move a point), <M>{'\\mathbf P^{-1}'}</M> (in the bell curve), <M>{'|2\\pi\\mathbf P|'}</M> (its normalisation), and{' '}
                <M>{'\\mathbf A\\mathbf X\\mathbf A^\\top'}</M> (moving a whole cloud — Scene 11).
              </Ahead>
              <Quiz
                id="ch1-q9"
                label="Stretch doubles every position and keeps speeds. What is its determinant?"
                q="Stretch doubles every position and keeps speeds. What is its determinant?"
                options={[
                  { t: '1', why: 'Area does change: a 1×1 square becomes 2×1.' },
                  { t: '2', ok: true, why: '2·1 − 0·0 = 2. The gold square doubles in area.' },
                  { t: '4', why: 'Only one direction is doubled, so area doubles, not quadruples.' },
                ]}
              />
            </>
          ),
        },
      ],
    },
    /* ================================================================ 10 */
    {
      id: 'gaussian',
      kicker: 'Scene 10',
      title: 'The bell curve',
      concept: 'Gaussian · Mahalanobis distance',
      steps: [
        {
          id: 's10.1',
          body: (
            <>
              <P>One shape rules this course: the bell, or <b>Gaussian</b>. Why this one? Here's the reason in one experiment.</P>
              <P>Roll one die: every sum from 1 to 6 is equally likely — flat. Now add up two dice, three, ten…</P>
              <Controls>
                <Knob label="Number of dice" value={p.dice} min={1} max={10} step={1} onChange={set('dice')} fmt={(v) => v.toFixed(0)} />
              </Controls>
              <P>
                The flat shape turns into a triangle, then a bell. Any sum of many small, independent random effects ends up bell-shaped. A radar's error is exactly that: thermal noise, beam
                width, reflections, rounding — all added together.
              </P>
            </>
          ),
        },
        {
          id: 's10.2',
          body: (
            <>
              <P>Let's build the formula from what the bell <i>does</i>. Its height should depend only on “how many σ away from the mean am I?” — and fall off fast:</P>
              <Formula
                tex="\mathcal N(x;\,\bar x,\,\sigma^2) = \frac{1}{\sqrt{2\pi\sigma^2}}\;\exp\!\Big(-\tfrac12\Big(\frac{x-\bar x}{\sigma}\Big)^2\Big)"
                rows={[
                  ['\\frac{x-\\bar x}{\\sigma}', 'how many σ you are from the mean (the orange markers)'],
                  ['\\exp(-\\tfrac12 \\cdots^2)', 'the shape: 1σ away → 61 % of the peak, 2σ → 13.5 %, 3σ → 1.1 %'],
                  ['\\frac{1}{\\sqrt{2\\pi\\sigma^2}}', 'the height that makes the total sand exactly 1', 'norm'],
                  ['\\mathcal N(x;\\bar x,\\sigma^2)', 'read: bell density at x, with mean x̄ and variance σ². The semicolon separates “where” from “which bell”.'],
                ]}
              />
              <Controls>
                <Knob label="σ" value={p.sig10} min={2} max={10} step={0.5} onChange={set('sig10')} unit=" m" />
              </Controls>
              <P>Change σ. The orange markers move with it: the shape is always the same, just stretched. That's why one number, σ, describes all of it.</P>
            </>
          ),
        },
        {
          id: 's10.3',
          body: (
            <>
              <P>
                Back to a real radar, now seen from above on a car park. Radars are good at <b>distance</b> (range) but poor at <b>angle</b>. So the cloud of possible positions isn't round. It's a long, thin
                ellipse lying across the beam: here, σ = 10 m along the beam and σ = 40 m across it.
              </P>
              <P>The orange rings are the 1σ, 2σ and 3σ ellipses.</P>
            </>
          ),
        },
        {
          id: 's10.4',
          body: (
            <>
              <P>Two pins arrive. Both are exactly 30 m from where we expected the car.</P>
              <Ask q="Which one is more suspicious — A (along the beam) or B (sideways)?">
                <p>
                  <b>A.</b> Along the beam σ = 10 m, so 30 m is 3σ — that almost never happens; maybe it's a different car! Sideways σ = 40 m, so 30 m is only 0.75σ — perfectly normal. Same 30 m on a ruler,
                  completely different meaning.
                </p>
              </Ask>
              <P>
                So distance must be measured in σ's, direction by direction. That's the <b>Mahalanobis distance</b> (Mahalanobis, 1936). Every point on one orange ring has the same
                Mahalanobis distance.
              </P>
              <Ahead>Gating in Chapter 6 is exactly this: ignore pins outside the 3σ ellipse. And the χ² distribution tells you how often a true pin lands outside it.</Ahead>
            </>
          ),
        },
        {
          id: 's10.5',
          body: (
            <>
              <P>Now the full 2D bell, as on the lecture slide. Every piece is something you've already seen:</P>
              <Formula
                tex="\begin{gathered} \mathcal N(\mathbf x;\,\bar{\mathbf x},\,\mathbf P) = \frac{1}{\sqrt{|2\pi\mathbf P|}} \\ \times\exp\!\Big(-\tfrac12\,(\mathbf x-\bar{\mathbf x})^\top \mathbf P^{-1}(\mathbf x-\bar{\mathbf x})\Big) \end{gathered}"
                rows={[
                  ['\\bar{\\mathbf x}', 'the mean vector: where the hill’s top is'],
                  ['\\mathbf P', 'the covariance matrix from Scene 5: width and tilt'],
                  ['(\\mathbf x-\\bar{\\mathbf x})^\\top \\mathbf P^{-1}(\\mathbf x-\\bar{\\mathbf x})', 'the Mahalanobis distance, squared: “how many σ away”, in every direction at once. P⁻¹ divides by the spread.', 'maha'],
                  ['|2\\pi\\mathbf P|', 'a determinant (Scene 9): makes the total volume exactly 1'],
                ]}
              />
              <P>In 1D this reduces exactly to the formula of two steps ago: P becomes σ², P⁻¹ becomes 1/σ², and the determinant becomes 2πσ².</P>
              <Controls>
                <Knob label="σ position" value={p.sx10} min={0.5} max={1.8} step={0.05} onChange={set('sx10')} fmt={(v) => v.toFixed(2)} />
                <Knob label="σ speed" value={p.sy10} min={0.5} max={1.8} step={0.05} onChange={set('sy10')} fmt={(v) => v.toFixed(2)} />
                <Knob label="Correlation ρ" value={p.rho10} min={-0.9} max={0.9} step={0.05} onChange={set('rho10')} fmt={(v) => v.toFixed(2)} />
              </Controls>
              <Ahead>
                Bells have two magic properties: a bell pushed through a matrix machine stays a bell (next scene), and bell × bell is a bell (the “product formula”, Chapter 3). That's why the Kalman filter
                can describe a whole cloud with just <M>{'\\bar{\\mathbf x}'}</M> and <M>{'\\mathbf P'}</M>, forever.
              </Ahead>
              <Quiz
                id="ch1-q10"
                label="What does a large off-diagonal entry in P mean?"
                q="What does a large off-diagonal entry in P mean?"
                options={[
                  { t: 'Both variables are very uncertain.', why: 'Each variable’s own uncertainty sits on the diagonal.' },
                  { t: 'The variables are strongly linked: the ellipse is tilted.', ok: true, why: 'Off-diagonal = covariance. Large covariance = strong correlation = tilted ellipse.' },
                  { t: 'The mean is far from zero.', why: 'P says nothing about where the mean is — that’s x̄.' },
                ]}
              />
            </>
          ),
        },
      ],
    },
    /* ================================================================ 11 */
    {
      id: 'drive',
      kicker: 'Scene 11',
      title: 'What driving does to a belief',
      concept: 'Linear maps of Gaussians · AXAᵀ',
      steps: [
        {
          id: 's11.1',
          body: (
            <>
              <P>
                Last big idea, and it's half of the Kalman filter. Our belief now covers position <i>and</i> speed: ghost cars on the road, each with its own position (σ = 5 m) and its own speed (20 m/s, σ = 2 m/s). On the field behind, each ghost is a dot: position across, speed up.
              </P>
              <Ask q="Every ghost drives for one second at its own speed. What shape does the cloud of dots become?">
                <p>
                  Fast ghosts go further than slow ones, so the top of the cloud slides right more than the bottom. The round cloud <b>shears</b> into a tilted ellipse. Position and speed have become
                  correlated, and the position got <i>less</i> certain — because we weren't sure of the speed.
                </p>
              </Ask>
              <Controls>
                <Knob label="Drive" value={p.drive} min={0} max={1} step={0.01} onChange={set('drive')} fmt={(v) => `${Math.round(v * 100)} %`} />
                <Knob label="Time Δt" value={p.dt} min={0.2} max={3} step={0.1} onChange={set('dt')} unit=" s" />
              </Controls>
              <P>
                This is the “drive” machine from Scene 9, <M>{'\\mathbf A = \\begin{pmatrix}1 & \\Delta t\\\\ 0 & 1\\end{pmatrix}'}</M>, applied to a whole bell. The result is another bell:
              </P>
              <Formula
                tex="\begin{gathered} \mathbf x \sim \mathcal N(\bar{\mathbf x},\,\mathbf X) \\ \big\downarrow\;\; \mathbf y = \mathbf a + \mathbf A\mathbf x \\ \mathbf y\sim\mathcal N(\mathbf a + \mathbf A\bar{\mathbf x},\;\mathbf A\mathbf X\mathbf A^\top) \end{gathered}"
                rows={[
                  ['\\mathbf A\\bar{\\mathbf x}', 'the mean simply goes through the machine'],
                  ['\\mathbf A\\mathbf X\\mathbf A^\\top', 'the new covariance — the blue ellipse. In 1D: y = a·x gives Var[y] = a²·Var[x].', 'AXA'],
                  ['\\mathbf a', 'a fixed shift. E.g. measuring from the radar at 70 m instead of from the road start: y = x − 70. It moves the mean, never the spread.'],
                ]}
              />
              <P>Why A X Aᵀ? Not a rule to memorise — it falls straight out of the definition of the covariance:</P>
              <Derive
                steps={[
                  { tex: '\\mathbf y - \\bar{\\mathbf y} = (\\mathbf a + \\mathbf A\\mathbf x) - (\\mathbf a + \\mathbf A\\bar{\\mathbf x}) = \\mathbf A(\\mathbf x - \\bar{\\mathbf x})', why: 'How far y is from its mean: the shift a cancels, only A acting on x’s own miss is left.' },
                  { tex: '\\mathbb C[\\mathbf y] = \\mathbb E\\big[(\\mathbf y-\\bar{\\mathbf y})(\\mathbf y-\\bar{\\mathbf y})^\\top\\big] = \\mathbb E\\big[\\mathbf A(\\mathbf x-\\bar{\\mathbf x})(\\mathbf x-\\bar{\\mathbf x})^\\top\\mathbf A^\\top\\big]', why: 'Definition of the covariance matrix (Scene 5), then insert the line above. Transposing a product flips the order: (A v)ᵀ = vᵀ Aᵀ.' },
                  { tex: '= \\mathbf A\\,\\mathbb E\\big[(\\mathbf x-\\bar{\\mathbf x})(\\mathbf x-\\bar{\\mathbf x})^\\top\\big]\\,\\mathbf A^\\top = \\mathbf A\\mathbf X\\mathbf A^\\top', why: 'A is a fixed matrix, so it slides out of the average — just like a constant factor in 𝔼[3x] = 3𝔼[x]. What’s left inside is X.' },
                ]}
              />
              <Example>
                <p>Position variance 25 m², speed variance 4 m²/s², no correlation, drive Δt = 1 s:</p>
                <Tex
                  tex="\mathbf A\mathbf X\mathbf A^\top = \begin{pmatrix}1&1\\0&1\end{pmatrix}\begin{pmatrix}25&0\\0&4\end{pmatrix}\begin{pmatrix}1&0\\1&1\end{pmatrix} = \begin{pmatrix}29&4\\4&4\end{pmatrix}"
                  block
                />
                <p>Position variance 25 → 29 (σ from 5 to 5.4 m): we're less sure where the car is. And a covariance of 4 appeared: position and speed are now linked. Physics works!</p>
              </Example>
              <Ahead>
                Chapter 3, Kalman prediction: <M>{'\\mathbf P_{k|k-1} = \\mathbf F\\,\\mathbf P_{k-1|k-1}\\mathbf F^\\top + \\mathbf D'}</M>. That's this scene with <M>{'\\mathbf A = \\mathbf F'}</M>, plus extra spread <M>{'\\mathbf D'}</M> because drivers don't hold a perfectly constant speed.
              </Ahead>
              <Quiz
                id="ch1-q11"
                label="1D: x has variance 4. What is the variance of y = 3x + 7?"
                q="1D: x has variance 4. What is the variance of y = 3x + 7?"
                options={[
                  { t: '12', why: 'Variance scales with the square of the factor.' },
                  { t: '36', ok: true, why: '3² · 4 = 36. The +7 shifts the mean but not the spread.' },
                  { t: '43', why: 'A shift never changes the spread.' },
                ]}
              />
            </>
          ),
        },
      ],
    },
    /* ================================================================ 12 */
    {
      id: 'certainty',
      kicker: 'Scene 12',
      title: 'Lights on',
      concept: 'Dirac delta',
      steps: [
        {
          id: 's12.1',
          body: (
            <>
              <P>The headlights come back on. What if we knew the position perfectly? Squeeze the bell narrower and narrower.</P>
              <Controls>
                <Knob label="σ" value={p.dsig} min={0.15} max={8} step={0.05} onChange={set('dsig')} fmt={(v) => v.toFixed(2)} unit=" m" />
              </Controls>
              <P>The area must stay 1, so the peak shoots up. In the limit, all the sand sits on one point: an infinitely thin, infinitely tall needle. It's called the <b>Dirac delta</b>.</P>
              <Formula
                tex="\begin{gathered} \delta(x-y) = \lim_{\sigma\to 0}\mathcal N(x;\,y,\,\sigma^2) \\ \int \delta(x-y)\,f(y)\,dy = f(x) \end{gathered}"
                rows={[
                  ['\\delta(x-y)', '“certain knowledge”: all the probability at x = y'],
                  ['\\int \\delta\\, f\\, dy = f(x)', 'the sifting property: integrating against a needle just picks out one value'],
                ]}
              />
              <Ahead>The sifting property is the trick behind the χ² derivation in Chapter 6: “insert a delta, then integrate”.</Ahead>
            </>
          ),
        },
      ],
    },
    /* ================================================================ 13 */
    {
      id: 'finale',
      kicker: 'Epilogue',
      title: 'What you now know',
      concept: 'Summary · explain it back',
      steps: [
        {
          id: 's13.1',
          body: (
            <>
              <Lead>Tracking is: keep a belief about the state, move it with physics, sharpen it with measurements. You now own every tool for that.</Lead>
              <Table
                head={['Tool', 'Formula', 'Picture', 'Used for']}
                rows={[
                  ['density', <M>{'P(a<x<b)=\\int_a^b p\\,dx'}</M>, 'sand between cones', 'everything'],
                  ['mean', <M>{'\\mathbb E[x]=\\int x\\,p\\,dx'}</M>, 'balance point', 'the estimate (MMSE)'],
                  ['variance', <M>{'\\mathbb E[(x-\\bar x)^2]'}</M>, 'average square', 'how sure: P'],
                  ['marginal', <M>{'\\int p(x,y)\\,dy'}</M>, 'bulldozer', 'prediction (Ch 2)'],
                  ['conditional', <M>{'p(x,y)/p(y)'}</M>, 'knife + stretch', 'using data'],
                  ['Bayes', <M>{'p(z|x)p(x)/p(z)'}</M>, 'green × red → blue', 'filtering (Ch 2, 3)'],
                  ['Gaussian', <M>{'\\mathcal N(\\mathbf x;\\bar{\\mathbf x},\\mathbf P)'}</M>, 'bell, ellipses', 'Kalman (Ch 3)'],
                  ['linear map', <M>{'\\mathbf A\\mathbf X\\mathbf A^\\top'}</M>, 'sheared cloud', 'Kalman prediction'],
                ]}
              />
              <P>
                <b>Now prove it to yourself.</b> Reading a chapter isn't the same as being able to do it. The <b>Practice</b> page has eight short exercises — you compute, the app checks — and the explain-it-back questions for the oral exam.
              </P>
              <button className="sx-cta" onClick={() => (window.location.hash = '#/ch1/practice')}>
                Go to Practice →
              </button>
              <P>Next: Chapter 2 sets this belief in motion — predict, measure, repeat.</P>
            </>
          ),
        },
      ],
    },
  ];

  return <StoryShell chapterId="ch1" chapterLabel="Chapter 1" title="The car in the dark" scenes={scenes} onHome={onHome} renderWorld={(step, hl, nonce) => <World1 step={step} hl={hl} p={p} nonce={nonce} />} extraItems={EXPLAIN1.map((e) => ({ id: e.id, kind: 'explain' as const, label: e.q, step: '#/ch1/practice' }))} />;
}
