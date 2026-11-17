import { useEffect, useMemo, useState } from 'react';
import { moments } from '../../engine/grid';
import { Ahead, Ask, Controls, Derive, Example, Formula, InOtherWords, Knob, Lead, M, P, Q, Quiz, Readout, Rule, Table, Toggle, Trap } from '../../story/blocks';
import { Scene, StoryShell } from '../../story/StoryShell';
import { Tex } from '../../ui/Tex';
import { DEFAULTS2, filterCells, G2, HOURS, Params2, PREV_ONE, predictCells, sail } from './model';
import { EXPLAIN2 } from './Practice2';
import { World2 } from './World2';

export default function Chapter2({ onHome }: { onHome: () => void }) {
  const [p, setP] = useState<Params2>(DEFAULTS2);
  const set = <K extends keyof Params2>(k: K) => (v: Params2[K]) => setP((q) => ({ ...q, [k]: v }));
  const voyage = useMemo(() => sail(p.seed, 10, p.qv, p.r), [p.seed, p.qv, p.r]);
  const [auto, setAuto] = useState(false);
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setP((q) => (q.k >= HOURS ? (setAuto(false), q) : { ...q, k: q.k + 1 })), 1200);
    return () => clearInterval(id);
  }, [auto]);

  const cells = predictCells(PREV_ONE).next;
  const prior6 = cells.slice(2, 7);
  const f6 = filterCells(prior6, [20, 30, 40, 50, 60], p.zc, p.rc);
  const peak6 = [20, 30, 40, 50, 60][f6.post.indexOf(Math.max(...f6.post))];
  const v = (arr: number[]) => moments(G2, arr).variance;

  const scenes: Scene[] = [
    /* ============================================================ prologue */
    {
      id: 'c2-prologue',
      kicker: 'Prologue',
      title: 'October 1707',
      concept: 'Why we need the tracking loop',
      steps: [
        {
          id: 's0.1',
          body: (
            <>
              <Lead>22 October 1707. A fleet of the Royal Navy is sailing home from the Mediterranean, under Admiral Sir Cloudesley Shovell. For days there has been fog. No sun, no stars, no coastline.</Lead>
              <P>
                How do you know where you are, with nothing to see? The navigators do the only thing possible. They take the last position they were sure of, and every hour they work out: <i>at this speed, on this heading, we must now be here.</i> It's called <b>dead reckoning</b>.
              </P>
            </>
          ),
        },
        {
          id: 's0.2',
          body: (
            <>
              <P>
                Watch two ships. The <Q c="belief">blue ghost</Q> is where the navigators <i>believe</i> the fleet is: calmly following its course. The <Q c="truth">real ship</Q> is where it actually is. A current the navigators can't feel, a slightly wrong speed estimate, a compass that's a little off: each hour adds a small error.
              </P>
              <P>
                The two drift apart. Hour after hour, nobody on board can tell. That evening, the fleet hit the rocks of the Isles of Scilly. Four ships were lost, and well over a thousand sailors died. The disaster is one of the reasons Britain passed the Longitude Act of 1714 — a prize for anyone who could tell a ship where it is.
              </P>
              <Trap>We keep the history honest: historians still debate exactly which errors mattered most (latitude, longitude, charts, currents). For us, the lesson is the mechanism — guessing forward without measurements lets errors grow unnoticed.</Trap>
            </>
          ),
        },
        {
          id: 's0.3',
          body: (
            <>
              <Ask q="Each hour of guessing adds a small, random error. After many hours, do the errors cancel out — or does the uncertainty keep growing?">
                <p>
                  <b>It keeps growing.</b> Errors are random: some push forward, some back. They don't cancel to zero — they pile up like a random walk. On the stage, each green curve is the navigators' belief after one more hour of guessing. Every hour it gets <b>wider and flatter</b>. Without new information, uncertainty can only grow. You'll see exactly <i>how fast</i> in Scene 5.
                </p>
              </Ask>
            </>
          ),
        },
        {
          id: 's0.4',
          body: (
            <>
              <Lead>How do you keep knowing where you are, when the world only gives you rare, noisy glimpses?</Lead>
              <P>
                That's the question of this chapter, and the answer is a <b>loop</b> that every tracker in this course runs: <Q c="prior">predict</Q> where the ship has gone, <Q c="meas">sight</Q> something, <Q c="post">update</Q> the belief — and repeat. Later, look back and <b>rewrite the past</b> with everything you've learned.
              </P>
              <P>The route through this chapter:</P>
              <ol>
                <li>the logbook: reading the notation</li>
                <li>how a ship moves: the dynamics model and the Markov property</li>
                <li>predicting with a table</li>
                <li>predicting with smooth curves: the Chapman–Kolmogorov equation</li>
                <li>why fog makes you lost — exactly how fast</li>
                <li>a light in the fog: the likelihood, and filtering with a table</li>
                <li>filtering, derived</li>
                <li>how surprised to be: the expected measurement</li>
                <li>the whole voyage, step by step</li>
                <li>the board of inquiry: retrodiction</li>
              </ol>
              <P>You need Chapter 1: densities, the marginal (“add up over what you don't care about”), and Bayes' rule (“prior × likelihood, then rescale”). That's all.</P>
            </>
          ),
        },
      ],
    },
    /* ============================================================ 1 */
    {
      id: 'c2-logbook',
      kicker: 'Scene 1',
      title: 'The logbook',
      concept: 'Time steps · notation p(xₖ | 𝒵ᵏ)',
      steps: [
        {
          id: 's1.1',
          body: (
            <>
              <P>
                A navigator keeps a logbook: one line per hour. Each hour <M>k</M> the ship has a true position <M>{'x_k'}</M> (which nobody knows exactly) and, sometimes, a <b>sighting</b> <M>{'z_k'}</M> — a lighthouse, a church tower, a depth sounding.
              </P>
              <P>
                On the stage, each hour is a “page” going into the distance. On page 2 the <Q c="post">blue</Q> curve is the belief after the second sighting. Page 3 has two curves: the <Q c="prior">green</Q> one before the third sighting, the <Q c="post">blue</Q> one after it. Notice how the sighting (red dot) pulls the blue curve tight.
              </P>
            </>
          ),
        },
        {
          id: 's1.2',
          body: (
            <>
              <P>The slides describe every one of these curves with one compact expression. Let's decode it once, properly:</P>
              <Formula
                tex="p(x_k \mid \mathcal Z^{\,l})"
                rows={[
                  ['k', 'the hour we are asking about'],
                  ['x_k', 'the true position at hour k (unknown)'],
                  ['z_k', 'the sighting written in the logbook at hour k'],
                  ['\\mathcal Z^{\\,l} = \\{z_1, \\dots, z_l\\}', 'all sightings up to hour l: the logbook so far'],
                  ['p(x_k \\mid \\mathcal Z^{\\,l})', 'our belief about hour k, using the logbook up to hour l'],
                ]}
              />
              <Table
                head={['Moment', 'Logbook used', 'Belief', 'Name']}
                rows={[
                  ['just after sighting 3', 'z₁, z₂, z₃', <M>{'p(x_3\\mid\\mathcal Z^3)'}</M>, 'filtered (l = k)'],
                  ['just before sighting 4', 'z₁, z₂, z₃', <M>{'p(x_4\\mid\\mathcal Z^3)'}</M>, 'predicted (l < k)'],
                  ['just after sighting 4', 'z₁ … z₄', <M>{'p(x_4\\mid\\mathcal Z^4)'}</M>, 'filtered'],
                  ['afterwards, about hour 2', 'z₁ … z₄', <M>{'p(x_2\\mid\\mathcal Z^4)'}</M>, 'retrodicted (l > k)'],
                ]}
              />
              <Rule>Left of the bar: which hour we ask about. Right of the bar: which pages of the logbook we used.</Rule>
              <P>
                So the whole chapter is just three ways to fill this table: compare <M>k</M> with <M>l</M>. Predicted (<M>{'k > l'}</M>), filtered (<M>{'k = l'}</M>), retrodicted (<M>{'k < l'}</M>).
              </P>
              <Ahead>
                Chapter 3 writes the same thing as subscripts: <M>{'x_{k|k-1}'}</M> is the mean of <M>{'p(x_k\\mid\\mathcal Z^{k-1})'}</M>, and <M>{'P_{k|k-1}'}</M> its variance. Read “k given k − 1”.
              </Ahead>
              <Quiz
                id="ch2-q1"
                label="What does p(x₅ | 𝒵⁷) describe?"
                q="What does p(x₅ | 𝒵⁷) describe?"
                options={[
                  { t: 'A prediction of hour 7 using the logbook up to hour 5.', why: 'Flipped: the left side (x₅) is the hour we ask about.' },
                  { t: 'Our belief about hour 5, using the logbook up to hour 7 — a retrodiction.', ok: true, why: 'Asking about an earlier hour with more pages of the logbook: retrodiction.' },
                  { t: 'The fifth sighting.', why: 'Sightings are z. x is the true position.' },
                ]}
              />
            </>
          ),
        },
      ],
    },
    /* ============================================================ 2 */
    {
      id: 'c2-dynamics',
      kicker: 'Scene 2',
      title: '“If I knew exactly where we were…”',
      concept: 'Dynamics model · Markov property',
      steps: [
        {
          id: 's2.1',
          body: (
            <>
              <Ask q="Suppose you knew EXACTLY that the ship is at 30 nm now. It sails at about 10 knots (10 nm per hour). Where is it in one hour?">
                <p>
                  Around 40 nm — but not exactly. The wind gusts, the current pushes, the helmsman wanders. So even from a perfectly known start, the answer is a <b>little bell</b> around 40 nm. On the stage: the ship sails, then a cloud of ghosts appears where it might be.
                </p>
              </Ask>
              <Formula
                tex="p(x_k \mid x_{k-1}) = \mathcal N(x_k;\; x_{k-1} + u,\; q)"
                rows={[
                  ['x_{k-1}', 'where the ship was (pretend we know it, for this question)'],
                  ['u', 'how far it usually sails in one hour (10 nm)'],
                  ['q', 'variance of the random part: wind, current, steering (nm²)'],
                  ['p(x_k \\mid x_{k-1})', 'the dynamics model (or transition density): if the ship was there, here’s where it can be now'],
                ]}
              />
              <Controls>
                <Knob label="Usual progress u" value={p.u} min={4} max={16} step={1} onChange={set('u')} fmt={(x) => x.toFixed(0)} unit=" nm" />
                <Knob label="Randomness q" value={p.q} min={1} max={36} step={1} onChange={set('q')} fmt={(x) => x.toFixed(0)} unit=" nm²" />
              </Controls>
              <InOtherWords>The dynamics model is a promise of the form “IF it was there, THEN it's now somewhere here, with this spread.”</InOtherWords>
            </>
          ),
        },
        {
          id: 's2.2',
          body: (
            <>
              <P>
                Now do that for <i>every</i> possible starting point at once. Along the lane: the old position. Towards you: the new position. The height: how likely that move is. You get a <b>ridge</b> sitting on the line “new = old + u”.
              </P>
              <Controls>
                <Knob label="Usual progress u" value={p.u} min={4} max={16} step={1} onChange={set('u')} fmt={(x) => x.toFixed(0)} unit=" nm" />
                <Knob label="Randomness q" value={p.q} min={1} max={36} step={1} onChange={set('q')} fmt={(x) => x.toFixed(0)} unit=" nm²" />
              </Controls>
              <P>Turn q down: a razor-thin ridge — a train on rails. Turn it up: a broad, low ridge — a rowing boat in a storm. Cut the ridge at any old position and you get one bell, the one from the last step.</P>
            </>
          ),
        },
        {
          id: 's2.3',
          body: (
            <>
              <P>Two more ideas hide in this model, and the examiner likes both.</P>
              <H3>1. The Markov property</H3>
              <P>
                To plan the next hour, the navigator needs only <b>the current position</b>. Where the ship was yesterday, or what the lighthouse said last week, adds nothing — <i>once you know where it is now</i>. Like chess: the next move depends on the board, not on how the pieces got there.
              </P>
              <Formula
                tex="p(x_k \mid x_{k-1}, \mathcal Z^{k-1}) = p(x_k \mid x_{k-1})"
                rows={[
                  ['x_{k-1}', 'given the previous state…'],
                  ['\\mathcal Z^{k-1}', '…the old sightings can be dropped'],
                ]}
              />
              <Trap>Markov does not mean “the past is useless”. The past is very useful — but all its usefulness is already inside our belief about xₖ₋₁. That's why the loop only ever has to carry one belief forward, not the whole logbook.</Trap>
              <H3>2. Prior knowledge: road maps and sea lanes</H3>
              <P>
                The lecture's slide lists “dynamics model, <b>road maps</b>” as what we use to predict. A ship in a shipping lane, a car on a road network, a plane on an air corridor: knowing <i>where things can go</i> makes predictions much sharper. On the stage, the lane is shaded — that's prior knowledge too.
              </P>
              <P>
                And the slide asks a fair question about the simple straight-line model 𝒩(xₖ; F xₖ₋₁, D): <i>realistic?</i> For short times, yes. But ships turn, aircraft manoeuvre. That's why Chapter 9 (IMM) runs several dynamics models at once.
              </P>
              <Quiz
                id="ch2-q2"
                label="Which vessel needs the bigger q?"
                q="A container ship on autopilot vs. a sailing dinghy in gusty wind. Which needs the bigger q?"
                options={[
                  { t: 'The container ship.', why: 'Autopilot = very predictable = small q.' },
                  { t: 'The dinghy.', ok: true, why: 'Erratic motion = more randomness per hour = bigger q.' },
                  { t: 'Both the same; q depends on the lighthouse.', why: 'q describes the vessel’s motion. The sighting’s noise is a different number (R).' },
                ]}
              />
            </>
          ),
        },
      ],
    },
    /* ============================================================ 3 */
    {
      id: 'c2-table',
      kicker: 'Scene 3',
      title: 'Predicting with a table',
      concept: 'Prediction · “add up where it came from”',
      steps: [
        {
          id: 's3.1',
          body: (
            <>
              <P>Now the real situation: we <i>don't</i> know exactly where the ship is. We only have a belief. Cut the lane into 10-nm cells. Our belief right now (the columns at the back, one colour per cell):</P>
              <Table head={['cell', '10 nm', '20 nm', '30 nm']} rows={[['p(now)', '0.2', '0.6', '0.2']]} />
              <P>
                In one hour the ship moves <b>+1 cell (25 %)</b>, <b>+2 cells (50 %)</b> or <b>+3 cells (25 %)</b>. Here's the trick: for each cell next hour, ask <b>“from where could it have come, and how likely was each route?”</b> — then add the routes.
              </P>
              <Example title="Work it out: p(40 nm) next hour">
                <Table
                  head={['came from', 'p(was there)', 'needed move', 'p(move)', 'route']}
                  rows={[
                    ['10 nm', '0.2', '+3', '0.25', '0.05'],
                    ['20 nm', '0.6', '+2', '0.50', '0.30'],
                    ['30 nm', '0.2', '+1', '0.25', '0.05'],
                  ]}
                />
                <p>
                  Total <b>0.40</b>. On the stage, the 40-nm column in front is <b>stacked in three colours</b> — one per cell it came from. Every column next hour is a sum of routes.
                </p>
              </Example>
              <Formula
                tex="p(x_k) = \sum_{x_{k-1}} p(x_k\mid x_{k-1})\;p(x_{k-1})"
                rows={[
                  ['p(x_{k-1})', 'how likely each old cell was'],
                  ['p(x_k \\mid x_{k-1})', 'the dynamics model: chance of that move'],
                  ['\\sum_{x_{k-1}}', 'add every route into the new cell'],
                ]}
              />
              <Ask q="Before: 3 cells (10–30 nm). After one hour: how many cells hold probability — and is the belief wider or narrower?">
                <p>
                  Five cells (20–60 nm): 0.05, 0.25, 0.40, 0.25, 0.05. <b>Wider.</b> The randomness of the sailing has been added on top of the uncertainty we already had.
                </p>
              </Ask>
              <Quiz
                id="ch2-q3"
                label="p(30 nm) one hour later"
                q="Same numbers: what is p(30 nm) one hour later?"
                options={[
                  { t: '0.05', why: 'You missed a route — list every cell the ship could come from.' },
                  { t: '0.25', ok: true, why: 'From 10 nm (+2): 0.2 × 0.5 = 0.10. From 20 nm (+1): 0.6 × 0.25 = 0.15. Total 0.25.' },
                  { t: '0.6', why: '0.6 is where most of the ship was BEFORE sailing.' },
                ]}
              />
            </>
          ),
        },
        {
          id: 's3.2',
          body: (
            <>
              <P>
                A harder start. Fog at dawn: we're not sure whether we left the <b>western harbour (0 nm)</b> or the <b>eastern one (40 nm)</b> — 50/50. Our belief has two bumps.
              </P>
              <Controls>
                <Toggle options={['one bump', 'two harbours']} value={p.two} onChange={set('two')} />
              </Controls>
              <P>
                Prediction doesn't care: it moves <b>both</b> bumps forward and widens each. It never decides between them — only a measurement can. Hold on to that; it's the reason MHT exists (Chapter 8).
              </P>
              <Ahead>This sum over old cells is exactly Chapter 1's <b>marginal</b>: we add up the joint p(new, old) over the old position we no longer care about.</Ahead>
            </>
          ),
        },
        {
          id: 's3.3',
          body: (
            <>
              <P>Step back and write down <b>every route at once</b>. One row per new cell, one column per old cell, and in each box the chance of that move. That's the dynamics model as a table — a <b>transition matrix</b> <M>{'\\mathbf T'}</M>:</P>
              <Table
                head={['new ↓ / old →', '10', '20', '30']}
                rows={[
                  ['20 nm', '0.25', '0', '0'],
                  ['30 nm', '0.50', '0.25', '0'],
                  ['40 nm', '0.25', '0.50', '0.25'],
                  ['50 nm', '0', '0.25', '0.50'],
                  ['60 nm', '0', '0', '0.25'],
                ]}
              />
              <P>
                Each <b>column adds up to 1</b>: wherever the ship was, it has to go <i>somewhere</i>. And the prediction is just Chapter 1's matrix machine — row times column:
              </P>
              <Formula
                tex="\begin{pmatrix} p(20)\\ p(30)\\ p(40)\\ p(50)\\ p(60)\end{pmatrix} = \begin{pmatrix} .25&0&0\\ .5&.25&0\\ .25&.5&.25\\ 0&.25&.5\\ 0&0&.25\end{pmatrix}\begin{pmatrix} 0.2\\ 0.6\\ 0.2\end{pmatrix} = \begin{pmatrix} 0.05\\ 0.25\\ 0.40\\ 0.25\\ 0.05\end{pmatrix}"
                rows={[
                  ['\\mathbf T_{ji}', 'chance of moving from old cell i to new cell j: p(xₖ = j | xₖ₋₁ = i)'],
                  ['\\mathbf T\\,\\mathbf p', 'row j of T times the old belief = “add up every route into j”'],
                ]}
              />
              <InOtherWords>Prediction with a table is one matrix–vector product. Chapman–Kolmogorov is the same product with infinitely many rows and columns.</InOtherWords>
              <Ahead>
                Remember this table. In Chapter 9 (IMM) the lecture draws exactly such a matrix for <i>switching between motion models</i> (M1, M2, M3 with P(i | j), each column summing to 1). Same idea, different state.
              </Ahead>
              <Quiz
                id="ch2-q8"
                label="Why must each column of the transition table add up to 1?"
                q="Why must every column of the transition table add up to 1?"
                options={[
                  { t: 'Because the belief must add up to 1.', why: 'Close — but the reason is per column: it’s about one starting cell.' },
                  { t: 'Because from any starting cell, the ship must end up somewhere.', ok: true, why: 'Column i lists all the places a ship starting in cell i can go. Those chances must total 1 — and that’s exactly why the prediction still adds up to 1.' },
                  { t: 'Because the rows are symmetric.', why: 'Rows don’t have to add up to anything special.' },
                ]}
              />
            </>
          ),
        },
      ],
    },
    /* ============================================================ 4 */
    {
      id: 'c2-ck',
      kicker: 'Scene 4',
      title: 'Infinitely many cells',
      concept: 'Chapman–Kolmogorov equation',
      steps: [
        {
          id: 's4.1',
          body: (
            <>
              <P>
                Make the cells infinitely small: the sum becomes an integral, and the rule gets a grand name — the <b>Chapman–Kolmogorov equation</b>. It's still “add up where it came from”. Let's derive it the way the lecture does; the names of the three moves are what you say in the exam.
              </P>
              <Derive
                steps={[
                  { tex: 'p(x_k\\mid\\mathcal Z^{k-1}) = \\int p(x_k, x_{k-1}\\mid\\mathcal Z^{k-1})\\,dx_{k-1}', why: '① Marginalisation: we don’t know the old position, so bring it in and add it away (Chapter 1, the bulldozer).' },
                  { tex: '= \\int p(x_k\\mid x_{k-1}, \\mathcal Z^{k-1})\\;p(x_{k-1}\\mid\\mathcal Z^{k-1})\\,dx_{k-1}', why: '② Conditional-pdf rule p(a, b) = p(a | b) p(b): “where it goes, given where it was” × “where it was”.' },
                  { tex: '= \\int \\underbrace{p(x_k\\mid x_{k-1})}_{\\text{dynamics model}}\\;\\underbrace{p(x_{k-1}\\mid\\mathcal Z^{k-1})}_{\\text{previous posterior}}\\,dx_{k-1}', why: '③ Markov property: once the old position is known, the old logbook adds nothing — drop 𝒵ᵏ⁻¹.' },
                ]}
              />
              <P>On the stage: the green ridge (dynamics), the old belief on the front wall (two bumps). Multiply them: the ridge is weighted by the old belief — two golden bumps. Then integrate along the old position: the prediction appears on the side wall.</P>
              <Controls>
                <Toggle options={['ridge', '① × old belief']} value={p.mult} onChange={set('mult')} />
                <Toggle options={['—', '② integrate over xₖ₋₁']} value={p.integ} onChange={set('integ')} />
                <Knob label="Randomness q" value={p.q} min={1} max={36} step={1} onChange={set('q')} fmt={(x) => x.toFixed(0)} unit=" nm²" />
              </Controls>
              <P>With both on, raise q: the two bumps of the prediction blur together.</P>
              <Ahead>Chapter 3: with bell curves, this integral is solved with pen and paper — the Kalman prediction x̄ + u (or F x̄) and P + q (or F P Fᵀ + D).</Ahead>
              <Quiz
                id="ch2-q4"
                label="Which move of the derivation is an assumption?"
                q="Which of the three moves is an assumption about the world (not just a rule of probability)?"
                options={[
                  { t: '① Marginalisation', why: 'Always allowed — it’s the law of total probability.' },
                  { t: '② Conditional-pdf rule', why: 'Always allowed — it’s the definition of a conditional.' },
                  { t: '③ Dropping 𝒵ᵏ⁻¹ (Markov)', ok: true, why: 'That’s a statement about how ships move: the next position depends only on the current one.' },
                ]}
              />
            </>
          ),
        },
      ],
    },
    /* ============================================================ 5 */
    {
      id: 'c2-fog',
      kicker: 'Scene 5',
      title: 'Lost in the fog',
      concept: 'Prediction only spreads · variances add',
      steps: [
        {
          id: 's5.1',
          body: (
            <>
              <P>Back to 1707. Fog, no sightings. Predict one hour, then another, then another…</P>
              <Controls>
                <Knob label="Hours without a sighting" value={p.fogHours} min={0} max={6} step={1} onChange={set('fogHours')} fmt={(x) => x.toFixed(0)} />
              </Controls>
              <P>
                Look at the rocks beside the lane. After one hour the belief is narrow and the rocks are clearly outside it. After six, the belief is so wide that the rocks are well inside it — and the navigators have no way of knowing whether they're about to hit them.
              </P>
              <Rule>Prediction moves the belief and widens it. It never adds information.</Rule>
            </>
          ),
        },
        {
          id: 's5.2',
          body: (
            <>
              <P>Exactly <i>how</i> fast does it widen? Write one hour of sailing as an equation: new position = old position + usual progress + a random push.</P>
              <Derive
                steps={[
                  { tex: 'x_k = x_{k-1} + u + w_k, \\qquad w_k \\sim \\mathcal N(0, q)', why: 'The dynamics model as an equation (the same idea as the sensor model z = x + w in Chapter 1).' },
                  { tex: '\\mathbb V[x_k] = \\mathbb V[x_{k-1}] + \\mathbb V[w_k] + 2\\,\\text{Cov}[x_{k-1}, w_k]', why: 'Variance of a sum. The fixed u shifts the mean but never the spread.' },
                  { tex: '= P + q', why: 'This hour’s push is independent of where we were, so the covariance is 0. Variances of independent errors simply add.' },
                  { tex: '\\mathbb V[x_{k+n}] = P + n\\,q, \\qquad \\sigma = \\sqrt{P + n\\,q}', why: 'Repeat for n hours: each hour adds q.' },
                ]}
              />
              <Example>
                <p>Start: P = 4 nm² (σ = 2 nm). Each hour: q = 9 nm².</p>
                <ul>
                  <li>after 1 hour: 4 + 9 = 13 → σ ≈ 3.6 nm</li>
                  <li>after 6 hours: 4 + 54 = 58 → σ ≈ 7.6 nm</li>
                  <li>after 3 days (72 hours): 4 + 648 = 652 → σ ≈ 25.5 nm</li>
                </ul>
                <p>Notice: σ grows like the <b>square root</b> of time. Twice as long in the fog doesn't double the uncertainty — but it never stops growing. Three days of fog: a typical error of 25 nm. More than enough to miss an island.</p>
              </Example>
              <Ahead>
                This is the Kalman prediction for variances in one dimension: <M>{'P_{k|k-1} = P_{k-1|k-1} + q'}</M>. With position and speed it becomes <M>{'\\mathbf F\\mathbf P\\mathbf F^\\top + \\mathbf D'}</M> — Chapter 1's A X Aᵀ plus the push.
              </Ahead>
              <P>
                The lecture's maritime slide makes the same point for modern ships: coastal radars see them only every few minutes or hours, so between updates the belief spreads — and the remedy shown there is better prediction (learning typical sea lanes from ship position reports, AIS).
              </P>
              <Quiz
                id="ch2-q5"
                label="Variance after 4 foggy hours"
                q="P = 1 nm², q = 4 nm² per hour. What is σ after 4 hours of fog?"
                options={[
                  { t: '17 nm', why: '17 nm² is the variance. σ is its square root.' },
                  { t: '≈ 4.1 nm', ok: true, why: '1 + 4·4 = 17 nm², σ = √17 ≈ 4.1 nm.' },
                  { t: '5 nm', why: 'Standard deviations don’t add (1 + 4 = 5 is wrong) — variances do.' },
                ]}
              />
            </>
          ),
        },
      ],
    },
    /* ============================================================ 6 */
    {
      id: 'c2-light',
      kicker: 'Scene 6',
      title: 'A light in the fog',
      concept: 'Likelihood ℓ(xₖ; zₖ) · filtering with a table',
      steps: [
        {
          id: 's6.1',
          body: (
            <>
              <P>
                Then — the fog tears open. A lighthouse! From its bearing, the navigator works out a position along the lane: <Q c="meas">z = {p.zc} nm</Q>. Not perfect: the bearing is rough, the chart is old. Say its error is σ = {p.rc} nm.
              </P>
              <P>Chapter 1 told us how to turn a sighting into evidence. The sensor model:</P>
              <Formula
                tex="z_k = x_k + w_k,\quad w_k \sim \mathcal N(0, R) \;\Longrightarrow\; \ell(x_k;\,z_k) = p(z_k\mid x_k) = \mathcal N(z_k;\,x_k,\,R)"
                rows={[
                  ['z_k', 'the position the sighting gives'],
                  ['R', 'variance of the sighting error (R = σ²)'],
                  ['\\ell(x_k; z_k)', 'the likelihood, written the lecture’s way: a function of the position x, for the reading z we got. How well would the ship at x explain this sighting?', 'lik'],
                ]}
              />
              <Controls>
                <Knob label="Sighting z" value={p.zc} min={20} max={70} step={1} onChange={set('zc')} fmt={(x) => x.toFixed(0)} unit=" nm" />
                <Knob label="Sighting error σ" value={p.rc} min={3} max={30} step={1} onChange={set('rc')} fmt={(x) => x.toFixed(0)} unit=" nm" />
              </Controls>
              <Trap>The red curve is not a belief: it doesn't have to add up to 1. It's a score per position — “how well does this position explain what we saw?”</Trap>
            </>
          ),
        },
        {
          id: 's6.2',
          body: (
            <>
              <P>
                Now combine. At every cell, the <Q c="prior">green</Q> column is the prediction (from Scene 3: 0.05, 0.25, 0.40, 0.25, 0.05 at 20–60 nm), the <Q c="meas">red</Q> column the likelihood of the sighting. Bayes, from Chapter 1: <b>multiply, then rescale</b>.
              </P>
              <Example title="The whole calculation">
                <Table
                  head={['cell', 'prediction', 'likelihood', 'pred × lik', 'filtered']}
                  hlCol={4}
                  rows={[20, 30, 40, 50, 60].map((c, i) => [`${c} nm`, prior6[i].toFixed(2), f6.lik[i].toFixed(3), f6.prod[i].toFixed(4), f6.post[i].toFixed(3)])}
                />
                <p>Sum of the products: {f6.sum.toFixed(4)}. Divide every product by it.</p>
              </Example>
              <Ask q={`The prediction peaks at 40 nm; the sighting says ${p.zc} nm. Where does the filtered belief peak?`}>
                <p>
                  At <b>{peak6} nm</b> (with these settings). It's a compromise, pulled towards whichever is surer. Make the sighting sharp (σ = 3): it wins. Make it vague (σ = 30): the prediction wins.
                </p>
              </Ask>
              <Controls>
                <Knob label="Sighting z" value={p.zc} min={20} max={70} step={1} onChange={set('zc')} fmt={(x) => x.toFixed(0)} unit=" nm" />
                <Knob label="Sighting error σ" value={p.rc} min={3} max={30} step={1} onChange={set('rc')} fmt={(x) => x.toFixed(0)} unit=" nm" />
              </Controls>
            </>
          ),
        },
        {
          id: 's6.3',
          body: (
            <>
              <P>Watch the columns merge into the <Q c="post">filtered</Q> belief. Compare its width to the prediction's: narrower. A sighting is the only thing that ever shrinks the belief.</P>
              <Rule>Prediction widens, filtering narrows. That push and pull is the heartbeat of every tracker.</Rule>
              <P>
                How much narrower, exactly? For bell-shaped beliefs there's a rule so beautiful it's worth seeing now (Chapter 3 derives it properly). Prediction <b>adds variances</b>. Filtering <b>adds the inverse</b> — <i>1/variance</i>, which statisticians call <b>information</b> or precision:
              </P>
              <Formula
                tex="\underbrace{P_{\text{pred}} = P + q}_{\text{prediction: uncertainties add}} \qquad \underbrace{\frac{1}{P_{\text{filt}}} = \frac{1}{P_{\text{pred}}} + \frac{1}{R}}_{\text{filtering: information adds}}"
                rows={[
                  ['P + q', 'one hour of sailing adds its randomness'],
                  ['1/P', 'how much we know (big when the belief is narrow)'],
                  ['1/R', 'how much the sighting knows'],
                ]}
              />
              <Example>
                <p>Belief σ = 2 nm (P = 4). One hour of sailing, q = 9: P_pred = 13. Then a sighting with σ = 3 nm (R = 9):</p>
                <Tex tex="\frac{1}{P_{\text{filt}}} = \frac{1}{13} + \frac{1}{9} = 0.188 \;\Rightarrow\; P_{\text{filt}} = 5.32\ \text{nm}^2,\ \ \sigma \approx 2.3\ \text{nm}" block />
                <p>
                  The filtered belief is narrower than <b>both</b> the prediction (σ 3.6) and the sighting (σ 3). Two independent pieces of evidence always beat either one alone. And the new mean is a weighted average, each source weighted by its information: <M>{'\\bar x_{\\text{filt}} = P_{\\text{filt}}\\big(\\bar x_{\\text{pred}}/P_{\\text{pred}} + z/R\\big)'}</M>.
                </p>
              </Example>
              <Ahead>Chapter 3 calls this the Kalman update, and Chapter 5 uses the very same “add the information” rule to fuse several sensors.</Ahead>
            </>
          ),
        },
      ],
    },
    /* ============================================================ 7 */
    {
      id: 'c2-filter',
      kicker: 'Scene 7',
      title: 'Filtering, derived',
      concept: 'Bayes with time stamps · the iteration formula',
      steps: [
        {
          id: 's7.1',
          body: (
            <>
              <P>Same idea, smooth curves and time stamps. Three moves:</P>
              <Derive
                steps={[
                  { tex: 'p(x_k\\mid\\mathcal Z^k) = p(x_k\\mid z_k, \\mathcal Z^{k-1})', why: '① Unpack the logbook: everything up to hour k = the new sighting zₖ + everything before, 𝒵ᵏ⁻¹.' },
                  { tex: '= \\frac{p(z_k\\mid x_k, \\mathcal Z^{k-1})\\;p(x_k\\mid\\mathcal Z^{k-1})}{\\int p(z_k\\mid x_k, \\mathcal Z^{k-1})\\,p(x_k\\mid\\mathcal Z^{k-1})\\,dx_k}', why: '② Bayes’ rule with background knowledge 𝒵ᵏ⁻¹ (Chapter 1, Scene 8): every term simply carries “| 𝒵ᵏ⁻¹”.' },
                  { tex: '= \\frac{\\ell(x_k; z_k)\\;p(x_k\\mid\\mathcal Z^{k-1})}{\\int \\ell(x_k; z_k)\\;p(x_k\\mid\\mathcal Z^{k-1})\\,dx_k}', why: '③ Sensor model: given where the ship is now, older sightings tell us nothing extra about today’s sighting. So p(zₖ | xₖ, 𝒵ᵏ⁻¹) = p(zₖ | xₖ) = ℓ(xₖ; zₖ).' },
                ]}
              />
              <P>Put prediction and filtering together and you get the lecture's <b>iteration formula</b> — one hour of the whole loop in one line:</P>
              <Formula
                tex="p(x_k\mid\mathcal Z^k) = \frac{\ell(x_k;\,z_k)\;\int p(x_k\mid x_{k-1})\,p(x_{k-1}\mid\mathcal Z^{k-1})\,dx_{k-1}}{\int \ell(x_k;\,z_k)\int p(x_k\mid x_{k-1})\,p(x_{k-1}\mid\mathcal Z^{k-1})\,dx_{k-1}\,dx_k}"
                rows={[
                  ['p(x_{k-1}\\mid\\mathcal Z^{k-1})', 'yesterday’s belief (the old posterior)'],
                  ['\\int p(x_k\\mid x_{k-1})\\cdots dx_{k-1}', 'Chapman–Kolmogorov: the prediction'],
                  ['\\ell(x_k; z_k)', 'today’s sighting'],
                  ['\\text{denominator}', 'rescale to 1'],
                ]}
              />
              <InOtherWords>New belief ∝ (today's evidence) × (yesterday's belief, sailed forward one hour).</InOtherWords>
              <Trap>
                Words that confuse people: “<b>filtering</b>” here has nothing to do with audio filters — it means “estimating the present from data up to the present”. Other books call retrodiction <b>smoothing</b>, and the whole loop a <b>Bayes filter</b> or recursive Bayesian estimation. Same ideas, different names.
              </Trap>
              <P>On the stage, Chapter 1's landscape picture, now with time stamps: the joint of prediction and sighting, sliced at the sighting we actually got, then rescaled.</P>
              <Controls>
                <Knob label="Sighting" value={p.fz} min={-3} max={3} step={0.05} onChange={set('fz')} fmt={(x) => x.toFixed(2)} />
                <Knob label="Sighting variance R" value={p.fR} min={0.1} max={2.5} step={0.05} onChange={set('fR')} fmt={(x) => x.toFixed(2)} />
                <Toggle options={['slice', 'slice + rescale']} value={p.fRen} onChange={set('fRen')} />
              </Controls>
              <Quiz
                id="ch2-q6"
                label="Which assumption drops 𝒵ᵏ⁻¹ from the likelihood?"
                q="Which assumption lets us write ℓ(xₖ; zₖ) instead of p(zₖ | xₖ, 𝒵ᵏ⁻¹)?"
                options={[
                  { t: 'The Markov property of the motion.', why: 'That one is used in the prediction step.' },
                  { t: 'Given the current position, the sighting’s error is independent of earlier sightings.', ok: true, why: 'The sensor model: today’s reading depends only on where the ship is today.' },
                  { t: 'Everything is Gaussian.', why: 'Nothing here needs Gaussians — the formulas hold for any shape.' },
                ]}
              />
            </>
          ),
        },
      ],
    },
    /* ============================================================ 8 */
    {
      id: 'c2-surprise',
      kicker: 'Scene 8',
      title: 'Ours — or a false light?',
      concept: 'Expected measurement p(zₖ | 𝒵ᵏ⁻¹)',
      steps: [
        {
          id: 's8.1',
          body: (
            <>
              <P>
                Before the fog lifts, a good navigator asks: <i>if I see the lighthouse, where should it appear?</i> That's the denominator of the filtering formula, read as a function of the sighting:
              </P>
              <Formula
                tex="p(z_k\mid\mathcal Z^{k-1}) = \int p(z_k\mid x_k)\;p(x_k\mid\mathcal Z^{k-1})\,dx_k"
                rows={[
                  ['p(z_k\\mid\\mathcal Z^{k-1})', 'the expected measurement: before looking, how likely is each possible sighting?'],
                  ['\\int \\cdots dx_k', 'average the sensor model over every place the ship might be (a marginal again)'],
                ]}
              />
              <Ask q="Prediction: σ = 4 nm. Sighting error: σ = 3 nm. Is the spread of the expected sighting 4, 5 or 7 nm?">
                <p>
                  <b>5 nm.</b> The sighting is z = x + w: the ship's uncertainty <i>plus</i> an independent sighting error. Variances add (Scene 5): 16 + 9 = 25, so σ = 5. Not 7 — standard deviations don't add, variances do.
                </p>
              </Ask>
              <Controls>
                <Knob label="Where the light appears" value={p.ez} min={25} max={60} step={1} onChange={set('ez')} fmt={(x) => x.toFixed(0)} unit=" nm" />
              </Controls>
              <Readout>
                The light at {p.ez} nm is {(Math.abs(p.ez - 40) / 5).toFixed(1)} σ from where we expected it.{' '}
                {Math.abs(p.ez - 40) / 5 > 3 ? 'That almost never happens by chance.' : 'Nothing unusual.'}
              </Readout>
              <P>
                The surprise has a name you'll hear in every remaining chapter: the <b>innovation</b> — what the sighting told us that we didn't already expect.
              </P>
              <Formula
                tex="\begin{gathered} \nu_k = z_k - \hat z_k, \qquad \hat z_k = \mathbb E[z_k\mid\mathcal Z^{k-1}] \\ \nu_k \sim \mathcal N(0,\,S), \qquad S = P_{\text{pred}} + R \end{gathered}"
                rows={[
                  ['\\nu_k', 'the innovation (Greek “nu”): the sighting minus where we expected it'],
                  ['\\hat z_k', 'the expected sighting (here: the predicted position, 40 nm)'],
                  ['S', 'the innovation variance: how big innovations normally are'],
                  ['\\nu_k/\\sqrt S', 'the surprise in σ’s — the readout above'],
                ]}
              />
              <P>
                If our models are right, innovations are “white”: centred on zero, about ±√S in size, and unrelated from hour to hour. Innovations that are consistently too big, or always on one side, are a warning that the model is wrong (the ship is turning, or the sighting is biased).
              </P>
              <Ahead>
                In the Gaussian case (Chapter 3): p(zₖ | 𝒵ᵏ⁻¹) = 𝒩(zₖ; H x_{'{k|k−1}'}, S) with S = H P Hᵀ + R — the innovation covariance. Here H = 1, so S = P + R. Chapter 6 squares the innovation in units of S (the Mahalanobis distance) to build the gate; Chapter 9 uses the value of p(zₖ | 𝒵ᵏ⁻¹) to judge which motion model fits best.
              </Ahead>
              <Quiz
                id="ch2-q9"
                label="Innovation in σ"
                q="Prediction: 40 nm with P = 16. Sighting variance R = 9. The sighting says 50 nm. How big is the innovation, in σ's?"
                options={[
                  { t: '10 σ', why: '10 nm is the innovation in miles. Divide by √S.' },
                  { t: '2 σ', ok: true, why: 'ν = 50 − 40 = 10 nm, S = 16 + 9 = 25, √S = 5, so 10 / 5 = 2σ. Unusual, not alarming.' },
                  { t: '2.5 σ', why: 'That divides by √16 = 4 — but the sighting error adds to the spread: use S = P + R.' },
                ]}
              />
            </>
          ),
        },
        {
          id: 's8.2',
          body: (
            <>
              <P>
                Cornish legend tells of <b>wreckers</b>: people on shore who lit false lights to lure ships onto the rocks. (Historians doubt it happened often — but it's a perfect thought experiment.)
              </P>
              <P>
                A light appears at <b>58 nm</b>. We expected 40 ± 5. That's <b>3.6 σ</b> away — far out in the tail of the orange curve. Two explanations: something unusual happened to our ship… or <b>this light is not the lighthouse at all</b>.
              </P>
              <Rule>The expected measurement tells you how surprised to be. Very surprising sightings may not belong to your target.</Rule>
              <Ahead>
                This single idea grows into four later chapters: <b>gating</b> (Ch 6: ignore readings outside a σ-ellipse), <b>clutter</b> (Ch 7: false readings are normal), <b>MHT</b> (Ch 8: keep several explanations, weighted by this density) and <b>track birth</b> (Ch 10: is there a ship at all?).
              </Ahead>
            </>
          ),
        },
      ],
    },
    /* ============================================================ 9 */
    {
      id: 'c2-voyage',
      kicker: 'Scene 9',
      title: 'The voyage',
      concept: 'The full recursion: predict → sight → filter',
      steps: [
        {
          id: 's9.1',
          body: (
            <>
              <P>
                Now run the whole loop. The yellow line is the true route (we cheat and show it). Red dots: the sightings. Each page going into the distance is one hour's belief. At hour 0 we don't know which harbour we left — <b>two bumps</b>.
              </P>
              <div className="sx-controls">
                <div className="px-actions">
                  <button className="sx-btn sx-btn-dark" onClick={() => set('k')(Math.min(p.k + 1, HOURS))}>
                    Next hour → {Math.min(p.k + 1, HOURS)}
                  </button>
                  <button className="sx-btn" onClick={() => setAuto(!auto)}>
                    {auto ? 'Pause' : 'Play'}
                  </button>
                  <button className="sx-btn" onClick={() => set('k')(0)}>
                    Back to hour 0
                  </button>
                  <button className="sx-btn" onClick={() => setP((q) => ({ ...q, seed: q.seed + 1, k: 0 }))}>
                    New voyage
                  </button>
                </div>
                <Knob label="Sea state q" value={p.qv} min={1} max={36} step={1} onChange={set('qv')} fmt={(x) => x.toFixed(0)} unit=" nm²" />
                <Knob label="Sighting variance R" value={p.r} min={1} max={64} step={1} onChange={set('r')} fmt={(x) => x.toFixed(0)} unit=" nm²" />
              </div>
              <Ask q="What happens to the wrong harbour's bump after the first sighting or two?">
                <p>It dies. The sightings are far from it, so its likelihood is tiny, and prediction × tiny ≈ 0. One or two hours in, only the true harbour survives.</p>
              </Ask>
              {p.k > 0 && (
                <Readout>
                  Hour {p.k}: predicted variance <b>{v(voyage.pred[p.k]).toFixed(1)}</b> nm² → after the sighting <b>{v(voyage.filt[p.k]).toFixed(1)}</b> nm².
                </Readout>
              )}
              <P>
                Step through and watch the readout. The width swings up (predict) and down (filter) and soon settles: the belief reaches a <b>steady width</b> where each hour's spreading exactly balances each sighting's sharpening. Make the sea rougher (q up) or the sightings worse (R up) and the balance settles wider.
              </P>
              <P>Where exactly does it settle? Use the two rules from Scene 6. In the steady state the filtered variance P comes out the same every hour:</P>
              <Derive
                steps={[
                  { tex: 'P_{\\text{pred}} = P + q, \\qquad \\frac{1}{P} = \\frac{1}{P + q} + \\frac{1}{R}', why: 'One hour of the loop: predict (add q), then filter (add the information 1/R). Steady state: we end where we started.' },
                  { tex: 'P\\,(P + q) = R\\,(P + q) - R\\,P \\;\\Longrightarrow\\; P^2 + q\\,P - q\\,R = 0', why: 'Multiply both sides by P(P + q)R and tidy up: a quadratic equation in P.' },
                  { tex: 'P = \\frac{-q + \\sqrt{q^2 + 4qR}}{2}', why: 'Take the positive root (a variance can’t be negative).' },
                ]}
              />
              <Readout>
                With q = {p.qv} and R = {p.r}: steady filtered variance P = {((-p.qv + Math.sqrt(p.qv * p.qv + 4 * p.qv * p.r)) / 2).toFixed(2)} nm² (σ = {Math.sqrt((-p.qv + Math.sqrt(p.qv * p.qv + 4 * p.qv * p.r)) / 2).toFixed(2)} nm). Step to hour 10 and compare with the readout above — the voyage really settles there.
              </Readout>
              <H3>Three practical details</H3>
              <ul>
                <li>
                  <b>An hour with no sighting</b> (fog again)? Skip filtering: the prediction <i>is</i> the new belief, p(xₖ | 𝒵ᵏ) = p(xₖ | 𝒵ᵏ⁻¹). The loop never breaks — it just stops narrowing until the next light.
                </li>
                <li>
                  <b>What does the navigator report?</b> One position and an error bar: the mean of the belief (the MMSE estimate from Chapter 1) and its σ. The full curve stays behind the scenes.
                </li>
                <li>
                  <b>Why a loop at all?</b> You could recompute the belief from the whole logbook every hour — but that gets slower every hour. Thanks to the Markov property, the loop only ever carries <i>one</i> belief forward: constant memory and constant work per hour, forever. That's why trackers can run for days on small computers.
                </li>
              </ul>
              <Rule>Predict (wider) → sight → filter (narrower) → predict … Every tracker in the course is this loop.</Rule>
            </>
          ),
        },
      ],
    },
    /* ============================================================ 10 */
    {
      id: 'c2-inquiry',
      kicker: 'Scene 10',
      title: 'The board of inquiry',
      concept: 'Retrodiction',
      steps: [
        {
          id: 's10.1',
          body: (
            <>
              <P>
                After every disaster at sea, there's an inquiry. The board reads the <i>whole</i> logbook and asks: “Where exactly was the ship at hour 2?” And they can answer better than the navigator could at hour 2 — because they also know what happened at hours 3, 4, 5.
              </P>
              <Example title="A detective version">
                <p>
                  At 9:00 pm the suspect was in the kitchen or the garden — 50/50. At 9:01 a camera sees them at the garden gate. You can't get from the kitchen to that gate in a minute. So now you know: at 9:00 they were in the garden. <b>Later evidence rewrote the past.</b>
                </p>
              </Example>
              <P>
                That's <b>retrodiction</b>: <M>{'p(x_l\\mid\\mathcal Z^k)'}</M> for an earlier hour <M>{'l < k'}</M>. It runs <b>backwards</b>, from the last hour to the first. Four moves:
              </P>
              <Derive
                steps={[
                  { tex: 'p(x_l\\mid\\mathcal Z^k) = \\int p(x_l, x_{l+1}\\mid\\mathcal Z^k)\\,dx_{l+1}', why: '① Marginalisation: bring in the next hour’s position, then add it away.' },
                  { tex: '= \\int p(x_l\\mid x_{l+1}, \\mathcal Z^k)\\;p(x_{l+1}\\mid\\mathcal Z^k)\\,dx_{l+1}', why: '② Conditional rule. The second factor is the retrodiction one hour later — so we can walk backwards, hour by hour.' },
                  { tex: 'p(x_l\\mid x_{l+1}, \\mathcal Z^k) = p(x_l\\mid x_{l+1}, \\mathcal Z^l) = \\frac{p(x_{l+1}\\mid x_l)\\;p(x_l\\mid\\mathcal Z^l)}{\\int p(x_{l+1}\\mid x_l)\\,p(x_l\\mid\\mathcal Z^l)\\,dx_l}', why: '③ If we knew exactly where the ship was at hour l+1, sightings after hour l would add nothing about hour l (Markov, looking backwards). Then Bayes: dynamics model × the filtered belief at hour l.' },
                  { tex: 'p(x_l\\mid\\mathcal Z^k) = \\int \\frac{p(x_{l+1}\\mid x_l)\\;p(x_l\\mid\\mathcal Z^l)}{p(x_{l+1}\\mid\\mathcal Z^l)}\\;p(x_{l+1}\\mid\\mathcal Z^k)\\,dx_{l+1}', why: '④ The denominator is just the prediction for hour l+1 (Chapman–Kolmogorov!). Every ingredient was already computed on the way forward.' },
                ]}
              />
              <InOtherWords>Retrodiction = the filtered belief at hour l, corrected by how much the later logbook changed our view of hour l+1.</InOtherWords>
              <Example title="The inquiry, worked by hand">
                <p>
                  Two channels, <b>west</b> and <b>east</b>. At hour 0 the navigator says 50/50. Each hour a ship stays in its channel with probability 0.9. At hour 1 a sighting: likelihood west 0.25, east 0.75.
                </p>
                <ol>
                  <li>Forward, hour 1: prediction 50/50 (by symmetry) → × likelihood, rescale → <b>west 0.25, east 0.75</b>.</li>
                  <li>
                    Backwards: <i>if</i> the ship is east at hour 1, how likely was it east at hour 0? Bayes: 0.9 × 0.5 / 0.5 = <b>0.9</b>. If it's west at hour 1: <b>0.1</b>.
                  </li>
                  <li>Average over what we now believe about hour 1: p(east₀ | 𝒵¹) = 0.9 × 0.75 + 0.1 × 0.25 = <b>0.70</b>.</li>
                </ol>
                <p>The navigator at hour 0 said 50 %. The inquiry, one sighting later, says 70 % east. That's the four-move formula with two cells instead of infinitely many.</p>
              </Example>
            </>
          ),
        },
        {
          id: 's10.2',
          body: (
            <>
              <P>Now replay the voyage — all ten hours — and turn on retrodiction. The pages turn <Q c="belief">purple</Q> and sharpen, from the last hour backwards.</P>
              <Controls>
                <Toggle options={['filtered (navigator)', 'retrodicted (inquiry)']} value={p.retro} onChange={set('retro')} />
                <Knob label="Hour to inspect" value={p.l} min={0} max={HOURS - 1} step={1} onChange={set('l')} fmt={(x) => x.toFixed(0)} />
              </Controls>
              <Readout>
                Hour {p.l}: the navigator's variance <b>{v(voyage.filt[p.l]).toFixed(2)}</b> nm² → the inquiry's <b>{v(voyage.retro[p.l]).toFixed(2)}</b> nm².
              </Readout>
              <P>Look at hour 0: the navigator still had two harbours in mind. The inquiry knows which one it was — the later sightings settled it. The last hour doesn't change at all: nobody has anything newer to correct it with.</P>
              <Trap>Retrodiction can't help you steer: it needs sightings that haven't happened yet. It's for reconstruction afterwards — and, inside MHT, for judging old hypotheses.</Trap>
              <Ahead>
                Chapter 3: for bell curves this becomes the <b>Rauch–Tung–Striebel</b> formulas. Chapter 8: MHT retrodicts the weights of its hypotheses — “strong sons strengthen weak fathers; if all sons die, the father dies too”. That's this inquiry, applied to stories instead of positions.
              </Ahead>
              <Quiz
                id="ch2-q7"
                label="Why is the last hour not improved by retrodiction?"
                q="Why does retrodiction change nothing at the very last hour?"
                options={[
                  { t: 'Because the last sighting is always perfect.', why: 'Sightings are never perfect.' },
                  { t: 'Because there are no later sightings to correct it with.', ok: true, why: 'Retrodiction uses newer data about the past. For the newest hour, there is no newer data — p(x_k | 𝒵ᵏ) is already the best we have.' },
                  { t: 'Because retrodiction only works for Gaussians.', why: 'It works for any shape — the grid on the stage isn’t Gaussian at hour 0.' },
                ]}
              />
            </>
          ),
        },
      ],
    },
    /* ============================================================ epilogue */
    {
      id: 'c2-epilogue',
      kicker: 'Epilogue',
      title: 'The loop',
      concept: 'Summary',
      steps: [
        {
          id: 's11.1',
          body: (
            <>
              <Lead>Iterative updating of conditional probability densities. That's the lecture's one-line summary of tracking — and you can now say what every word means.</Lead>
              <Table
                head={['Step', 'From → to', 'Uses', 'Rule']}
                rows={[
                  ['prediction', <M>{'p(x_{k-1}|\\mathcal Z^{k-1})\\to p(x_k|\\mathcal Z^{k-1})'}</M>, 'dynamics model (and road maps)', 'marginal + Markov'],
                  ['filtering', <M>{'p(x_k|\\mathcal Z^{k-1})\\to p(x_k|\\mathcal Z^{k})'}</M>, 'sighting zₖ + sensor model', 'Bayes'],
                  ['retrodiction', <M>{'p(x_{l+1}|\\mathcal Z^{k})\\to p(x_l|\\mathcal Z^{k})'}</M>, 'filtering output + dynamics', 'marginal + Bayes'],
                ]}
              />
              <P>The lecture adds three warnings, and now they make sense:</P>
              <ul>
                <li>
                  <b>Finite mixtures</b> — ambiguity (which reading is ours, which model, which road) turns the belief into several bumps (Chapters 8–9).
                </li>
                <li>
                  <b>Optimal estimators</b> — to report one number, use e.g. the mean: the minimum mean squared error (Chapter 1).
                </li>
                <li>
                  <b>Initiation</b> — the loop needs a first belief. Where does a track start? (Chapter 10.)
                </li>
              </ul>
              <P>
                Everything else in the course is a way of <i>computing</i> this loop when exact computation is impossible: Kalman (bells and straight lines, exact), EKF/UKF (curved models), PDAF/MHT (uncertain origin of the data), IMM (uncertain motion model).
              </P>
              <P>
                <b>Now prove it to yourself.</b> Practice has seven short problems on the same sea lane, and the explain-back questions for the exam.
              </P>
              <button className="sx-cta" onClick={() => (window.location.hash = '#/ch2/practice')}>
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
      chapterId="ch2"
      chapterLabel="Chapter 2"
      title="The ship in the fog"
      scenes={scenes}
      onHome={onHome}
      renderWorld={(step, hl, nonce) => <World2 step={step} p={p} voyage={voyage} nonce={nonce} hl={hl} />}
      extraItems={EXPLAIN2.map((e) => ({ id: e.id, kind: 'explain' as const, label: e.q, step: '#/ch2/practice' }))}
    />
  );
}

const H3 = ({ children }: { children: string }) => <h3 className="sx-h3">{children}</h3>;
