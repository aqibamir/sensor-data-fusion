import { useEffect, useMemo, useState } from 'react';
import { cumulativeInterval, cumulativePD, ellArea, fixFromTowers, fuse1, meanCumulativePD, runFire, threeRoads, tracklet1 } from '../../engine/fusion';
import { Ahead, Ask, Controls, Derive, Example, Formula, InOtherWords, Knob, Lead, M, P, Quiz, Readout, Rule, Table, Toggle, Trap } from '../../story/blocks';
import { Scene, StoryShell } from '../../story/StoryShell';
import { DEFAULTS5, DT5, FIRE, Params5, STEPS5, towersFor } from './model';
import { EXPLAIN5 } from './Practice5';
import { World5 } from './World5';

const f0 = (v: number) => v.toFixed(0);
const f1 = (v: number) => v.toFixed(1);
const f2 = (v: number) => v.toFixed(2);
const f3 = (v: number) => v.toFixed(3);

export default function Chapter5({ onHome }: { onHome: () => void }) {
  const [p, setP] = useState<Params5>(DEFAULTS5);
  const set = <K extends keyof Params5>(k: K) => (v: Params5[K]) => setP((q) => ({ ...q, [k]: v }));
  const towers = towersFor(p);
  const fire = useMemo(
    () => runFire({ steps: STEPS5, dt: DT5, towers: towers.slice(0, 2), use: [p.use !== 1, p.use !== 0], pd: [p.haze, 1] }),
    [p.use, p.haze, p.sA, p.sB, p.bAngle],
  );
  const [auto, setAuto] = useState(false);
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setP((q) => (q.k >= STEPS5 - 1 ? (setAuto(false), q) : { ...q, k: q.k + 1 })), 300);
    return () => clearInterval(id);
  }, [auto]);

  // Scene 3: the 1D see-saw
  const one = fuse1([100, 110], [100, p.z2s * p.z2s]);
  // Scene 4: geometry
  const fixAB = fixFromTowers(towers.slice(0, 2), FIRE);
  const onlyA = towers[0];
  const areaFused = ellArea(fixAB.R) * 1e6; // m² (km² → m²) for the 1σ ellipse
  const sideA = Math.hypot(onlyA.p[0], onlyA.p[1]) * onlyA.sphi * 1000;
  // Scene 5: three roads with fixed numbers
  const roads = threeRoads({ m: [90, 10], P: [[100, 0], [0, 50]] }, [[100, 12], [110, 8]], [[[100, 10], [10, 30]], [[25, 0], [0, 40]]]);
  // Scene 6
  const g = fire.est[Math.min(p.k, STEPS5 - 1)];
  const sdKm = Math.sqrt(Math.max(g.P[0][0], g.P[1][1]));
  const Tc = cumulativeInterval([10, 15]);
  // Scene 8
  const tl = tracklet1(10, 5, 8, 20);

  const scenes: Scene[] = [
    /* ============================================================ prologue */
    {
      id: 'c5-prologue',
      kicker: 'Prologue',
      title: 'A line is not a place',
      concept: 'Why fuse sensors',
      steps: [
        {
          id: 's0.1',
          body: (
            <>
              <Lead>Late summer, the mountains. For a hundred years, forests like this have been watched from fire lookout towers on the peaks.</Lead>
              <P>
                A thin wisp of smoke rises from the trees. The lookout on <b>Eagle Peak</b> sights it with the <b>Osborne Firefinder</b> — a sighting ring over a map, invented by W. B. Osborne of the US Forest Service in the 1910s — and phones the dispatcher: “<i>Smoke, bearing 020.</i>”
              </P>
              <P>
                On the stage, the orange wedge is that report. The lookout can say <b>which direction</b>, very precisely, but <b>not how far</b>. The smoke could be anywhere along the line. In Chapter 1's language, the measurement is a cloud — and this cloud is razor-thin sideways and practically endless along the line.
              </P>
              <Rule>Each measurement is modelled as a probability density function (Lecture 2, p.46). One tower gives a line, not a place.</Rule>
            </>
          ),
        },
        {
          id: 's0.2',
          body: (
            <>
              <P>
                Then <b>Bald Ridge</b> calls in: “<i>Smoke, bearing 290.</i>” A second line, from somewhere else. The dispatcher pins a string along each on the map, and where they cross is the fire. Two clouds that each know almost nothing combine into one that knows almost everything — the blue ellipse.
              </P>
              <Ask q="Two towers locate the same fire along one road. Tower A says 100 m ± 10 m, tower B says 110 m ± 5 m. Where is the fire?">
                <p>
                  Most people say 105, the plain average. The honest answer is <b>108</b>. B is twice as precise, so — as you'll see — it counts <b>four</b> times as much. And the answer is good to ±4.5 m: better than either tower alone.
                </p>
              </Ask>
              <P>
                This chapter is about exactly that: how to combine clouds from several sensors into one — the <b>fusion formula</b> — and when it lies to you. Smokejumpers will be dropped where the dispatcher's ellipse says. If the ellipse is too small, they land in the wrong valley.
              </P>
            </>
          ),
        },
      ],
    },
    /* ============================================================ 1 */
    {
      id: 'c5-what',
      kicker: 'Scene 1',
      title: 'Time and space',
      concept: 'What fusion is',
      steps: [
        {
          id: 's1.1',
          body: (
            <>
              <P>Lecture 1 draws the whole field on one slide:</P>
              <ul>
                <li>
                  <b>Tracking = processing along time</b>: predict, measure, filter, repeat (Chapters 2–4).
                </li>
                <li>
                  <b>Fusion = combining across space</b>: data from <b>spatially distributed</b> or <b>complementary</b> sensors.
                </li>
              </ul>
              <Table
                head={['Kind', 'Meaning', 'Here']}
                rows={[
                  ['spatially distributed', 'same kind of sensor, different places — homogeneous (same h, book §2.3.1)', 'Eagle Peak and Bald Ridge'],
                  ['complementary', 'different kinds of sensor measuring different things — heterogeneous', 'a tower’s bearing + a spotter plane’s rough position'],
                ]}
              />
              <P>
                Lecture 1's processing chain also lists <b>fusion with already pre-processed tracking information</b> — combining finished tracks from other systems. That is Scene 8.
              </P>
              <Rule>The one assumption everything in this chapter rests on: the sensors' errors are independent.</Rule>
              <P>It is stated here, used in Scene 2, and deliberately broken in Scene 9.</P>
            </>
          ),
        },
      ],
    },
    /* ============================================================ 2 */
    {
      id: 'c5-formula',
      kicker: 'Scene 2',
      title: 'Multiply the clouds',
      concept: 'The fusion formula',
      steps: [
        {
          id: 's2.1',
          body: (
            <>
              <P>Two sensors measure the same thing Hx (L2 p.47; book eq. 2.24). Independence lets the joint likelihood split into a product (Chapter 1):</P>
              <Formula tex="p(\mathbf z_1, \mathbf z_2\mid\mathbf x) = p(\mathbf z_1\mid\mathbf x)\,p(\mathbf z_2\mid\mathbf x) = \mathcal N(\mathbf z_1;\mathbf H\mathbf x,\mathbf R_1)\,\mathcal N(\mathbf z_2;\mathbf H\mathbf x,\mathbf R_2)" rows={[['\\mathbf R_1, \\mathbf R_2', 'the two measurement error covariances']]} />
              <Derive
                steps={[
                  { tex: '\\mathcal N(\\mathbf z_1;\\mathbf H\\mathbf x,\\mathbf R_1) = \\mathcal N(\\mathbf H\\mathbf x;\\mathbf z_1,\\mathbf R_1)', why: 'A bell depends only on the difference z − Hx, so you may swap “where it sits” and “where you evaluate it”. Now it reads as a bell over Hx, centred on the measurement.' },
                  { tex: '\\mathcal N(\\mathbf H\\mathbf x;\\mathbf z_1,\\mathbf R_1)\\,\\mathcal N(\\mathbf z_2;\\mathbf H\\mathbf x,\\mathbf R_2) \\propto \\mathcal N(\\mathbf H\\mathbf x;\\,\\mathbf z,\\,\\mathbf R)', why: 'Chapter 3’s product formula, with Hx playing the variable. A bell times a bell is a bell.' },
                  { tex: '\\mathbf R = (\\mathbf R_1^{-1} + \\mathbf R_2^{-1})^{-1}, \\qquad \\mathbf z = \\mathbf R\\,(\\mathbf R_1^{-1}\\mathbf z_1 + \\mathbf R_2^{-1}\\mathbf z_2)', why: 'Its information form: inverse covariances add, and the mean is the information-weighted average.' },
                  { tex: '\\text{1D: } \\frac{1}{\\sigma^2} = \\frac{1}{\\sigma_1^2}+\\frac{1}{\\sigma_2^2},\\quad z = \\sigma^2\\Big(\\frac{z_1}{\\sigma_1^2}+\\frac{z_2}{\\sigma_2^2}\\Big)', why: 'Check by completing the square in the exponent: the x² coefficients add, and so do the x coefficients.' },
                ]}
              />
              <InOtherWords>The two measurements behave exactly like one measurement z with covariance R. Any filter from Chapters 3–4 can use the fused report as if it came from a single super-sensor.</InOtherWords>
            </>
          ),
        },
        {
          id: 's2.2',
          body: (
            <>
              <P>
                The “∝” hides something useful. The factor dropped is <M>{'\\mathcal N(\\mathbf z_1;\\,\\mathbf z_2,\\,\\mathbf R_1+\\mathbf R_2)'}</M>. It doesn't depend on x, and it measures whether the two reports <b>agree</b>. If it is tiny, the towers probably saw two different smokes — that number becomes the gate of Chapter 6 and the association score of Chapter 8.
              </P>
              <P>More than two sensors, by induction (book §2.3.2): fuse 1 and 2, then fuse the result with 3, and so on. The information keeps adding:</P>
              <Formula
                tex="\mathbf R = \Big(\sum_{s=1}^{S} \mathbf R_s^{-1}\Big)^{-1}, \qquad \mathbf z = \mathbf R\sum_{s=1}^{S}\mathbf R_s^{-1}\mathbf z_s"
                rows={[
                  ['\\mathbf R', 'the harmonic mean of the covariances — the book calls it the Fusion Equation'],
                  ['\\mathbf z', 'a (matrix-)weighted arithmetic mean of the reports'],
                ]}
              />
              <Quiz
                id="ch5-q1"
                label="Why may we multiply p(z₁|x) and p(z₂|x)?"
                q="Why is p(z₁, z₂ | x) = p(z₁ | x) · p(z₂ | x) allowed?"
                options={[
                  { t: 'Because the sensors are the same type', why: 'Same type is not enough — they could share an error.' },
                  { t: 'Because the measurement errors are independent', ok: true, why: 'Yes. Given the true x, knowing one error tells you nothing about the other.' },
                  { t: 'Because the product formula says so', why: 'The product formula is used after the split, not to justify it.' },
                ]}
              />
            </>
          ),
        },
      ],
    },
    /* ============================================================ 3 */
    {
      id: 'c5-weights',
      kicker: 'Scene 3',
      title: 'Trust is a weight',
      concept: 'Weighted mean · precision adds',
      steps: [
        {
          id: 's3.1',
          body: (
            <>
              <P>Back to the Prologue's road: 100 m ± 10 m and 110 m ± σ₂. Move σ₂:</P>
              <Controls>
                <Knob label="σ₂ of the second report" value={p.z2s} min={1} max={40} step={0.5} onChange={set('z2s')} unit=" m" />
              </Controls>
              <Readout>
                Weights: first {f2(one.w[0])}, second {f2(one.w[1])}. Fused z = {f1(one.z)} m, σ = {f1(Math.sqrt(one.s2))} m — always smaller than both 10 m and {f1(p.z2s)} m.
              </Readout>
              <Example>
                With σ₂ = 5: precisions 1/100 + 1/25 = 0.05 → σ² = 20, σ ≈ 4.47 m. z = 20·(100/100 + 110/25) = 20·5.4 = <b>108</b>. The weights are 0.2 and 0.8 — the second report counts four times as much, because 10²/5² = 4.
              </Example>
              <P>
                Push σ₂ to 1 m: the fused answer is the second report. Push it to 40 m: it is the first. A useless sensor is <b>ignored, never harmful</b> — as long as its errors are independent and its σ honest.
              </P>
              <P>
                In 2D the weights <M>{'\\mathbf R\\,\\mathbf R_s^{-1}'}</M> are <b>matrices</b>: a tower can be trusted <i>across</i> its line and ignored <i>along</i> it. The fused point takes its east–west position from one tower and its north–south position from the other. That is impossible with plain numbers, and it is the heart of fusion.
              </P>
              <Rule>Fused measurement = precision-weighted mean. Fused covariance = inverse of the summed precisions.</Rule>
            </>
          ),
        },
      ],
    },
    /* ============================================================ 4 */
    {
      id: 'c5-geometry',
      kicker: 'Scene 4',
      title: 'Where you stand matters',
      concept: 'Geometric fusion gain',
      steps: [
        {
          id: 's4.1',
          body: (
            <>
              <P>The book draws four conclusions from the Fusion Equation (§2.3.2). Watch them on the map:</P>
              <ol>
                <li>
                  <b>Equal sensors, equal directions:</b> z is the plain average and R/S — the <b>square-root law</b>: S sensors shrink σ by √S. Four towers in one spot: only twice as good.
                </li>
                <li>
                  <b>Differently oriented ellipses:</b> a much bigger effect — the <b>geometric fusion gain</b>.
                </li>
                <li>
                  The fused ellipse is the <b>“intersection”</b> of the individual ellipses, computed by the harmonic mean.
                </li>
                <li>
                  Very thin ellipses (bearings only, σr ≫ r σφ) give <b>triangulation</b>; range-only sensors give <b>trilateration</b>.
                </li>
              </ol>
              <Controls>
                <Knob label="angle between the lines of sight" value={p.bAngle} min={8} max={172} step={1} onChange={set('bAngle')} fmt={f0} unit="°" />
                <Toggle options={['bearings (triangulation)', 'ranges (trilateration)']} value={p.tri} onChange={set('tri')} />
              </Controls>
              <Readout>
                Each tower alone: ±{f0(sideA)} m sideways, unlimited along its line. Together: 1σ ellipse area {f0(areaFused / 1e4)} ha (σ ≈ {f0(Math.sqrt(fixAB.R[0][0]) * 1000)} m east, {f0(Math.sqrt(fixAB.R[1][1]) * 1000)} m north).
              </Readout>
              <P>
                At 90° the ellipse is smallest and roundest. Slide the angle towards 10°: the wedges become nearly parallel, the crossing smears out along them, and fusion barely helps. <b>Geometry matters as much as accuracy</b> — that's why lookout towers, radars and GPS satellites are spread out.
              </P>
            </>
          ),
        },
        {
          id: 's4.2',
          body: (
            <>
              <P>
                Why is the formula written with <b>inverses</b>? Because a bearing has <b>zero information along its line</b>: its covariance is infinite in that direction, so R itself doesn't exist — but its <b>information</b> R⁻¹ does, with a zero in that direction:
              </P>
              <Formula tex="\mathbf Y_{\text{bearing}} = \frac{1}{(d\,\sigma_\varphi)^2}\,\mathbf n\,\mathbf n^\top" rows={[['\\mathbf n', 'unit vector across the line of sight'], ['d', 'distance at which the bearing is linearised']]} />
              <P>
                Information adds: Eagle Peak fills one direction, Bald Ridge another, and together the sum is invertible — a place. Inverting only at the very end is what makes it possible to fuse lines at all. (Chapter 3's information form, again.)
              </P>
              <Quiz
                id="ch5-q2"
                label="Three towers on a line, fire on their axis"
                q="Three towers stand on a straight line, and the fire is far away along that same line. Good geometry?"
                options={[
                  { t: 'Yes — three sensors are always better', why: 'More sensors help only if they add information in new directions.' },
                  { t: 'No — all wedges are nearly parallel, so the fire’s distance stays unknown', ok: true, why: 'Right. All the information is across the line; none is along it.' },
                ]}
              />
            </>
          ),
        },
      ],
    },
    /* ============================================================ 5 */
    {
      id: 'c5-roads',
      kicker: 'Scene 5',
      title: 'Three roads, one place',
      concept: 'Stacked = sequential = fused',
      steps: [
        {
          id: 's5.1',
          body: (
            <>
              <P>The lecture offers another option (L2 p.47): don't fuse first — <b>stack</b> the sensors into one big measurement:</P>
              <Formula tex="\mathbf z = \begin{pmatrix}\mathbf z_1\\ \vdots\\ \mathbf z_n\end{pmatrix}, \quad \mathbf H = \begin{pmatrix}\mathbf H_1\\ \vdots\\ \mathbf H_n\end{pmatrix}, \quad \mathbf R = \operatorname{diag}(\mathbf R_1,\dots,\mathbf R_n)" rows={[['\\operatorname{diag}', 'zeros between the blocks: that IS the independence assumption']]} />
              <P>
                Stacking works even when the H differ — a tower's bearing with the spotter plane's position. The fused-measurement formula needs one shared H for all sensors. A third road: two ordinary Kalman updates in a row, one per sensor, with no prediction in between.
              </P>
              <Example title="Same answer three ways">
                Prior (90, 10), two position reports. Stacked: ({f3(roads.stacked.m[0])}, {f3(roads.stacked.m[1])}). Sequential: ({f3(roads.sequential.m[0])}, {f3(roads.sequential.m[1])}). Fused-then-update: ({f3(roads.fused.m[0])}, {f3(roads.fused.m[1])}).
              </Example>
              <P>
                Why identical? Each is prior × p(z₁|x) × p(z₂|x); only the order of multiplying changes. In information form: <M>{'\\mathbf P^{-1} + \\mathbf H^\\top\\mathbf R_1^{-1}\\mathbf H + \\mathbf H^\\top\\mathbf R_2^{-1}\\mathbf H'}</M> every time.
              </P>
              <Table
                head={['Road', 'Use it when']}
                rows={[
                  ['sequential', 'reports arrive at different times'],
                  ['stacked', 'sensors measure different things (different H)'],
                  ['fused report', 'explaining, and compressing many reports into one'],
                ]}
              />
              <Trap>Slide wording: L2 p.47 says “H_i = H_k for all i, k”, MHT p.13 says “for i ≠ k”. Same meaning: every sensor shares one H.</Trap>
            </>
          ),
        },
      ],
    },
    /* ============================================================ 6 */
    {
      id: 'c5-track',
      kicker: 'Scene 6',
      title: 'Fusion inside the tracker',
      concept: 'Time + space · cumulative detection',
      steps: [
        {
          id: 's6.1',
          body: (
            <>
              <P>
                The fire front drifts with the wind. The dispatcher runs the full loop: predict (Chapter 3), take each tower's bearing as it comes in, update (an EKF, Chapter 4, because a bearing is curved), repeat. One report per tower every {DT5} minutes.
              </P>
              <Controls>
                <Toggle options={['Eagle Peak only', 'Bald Ridge only', 'both']} value={p.use} onChange={set('use')} />
                <Knob label="report" value={p.k} min={0} max={STEPS5 - 1} step={1} onChange={set('k')} fmt={f0} />
                <button className="sx-btn" onClick={() => (setP((q) => ({ ...q, k: 0 })), setAuto(true))}>
                  Watch the afternoon
                </button>
                <Knob label="Eagle Peak sees smoke (haze)" value={p.haze} min={0.2} max={1} step={0.05} onChange={set('haze')} fmt={f2} />
              </Controls>
              <Readout>Uncertainty now: about ±{f0(sdKm * 1000)} m along its longest direction.</Readout>
              <P>
                With one tower the ellipse stays long forever — the distance along its line is never observed, and only the fire's motion helps a little. With both, it shrinks and stays small.
              </P>
              <P>Two bonuses from the book (§2.3.2):</P>
              <ul>
                <li>
                  <b>More eyes, more often.</b> The mean cumulative data innovation interval is <M>{'1/T_c = \\sum_s 1/T_s'}</M>. Towers reporting every 10 and 15 minutes give T_c = {f0(Tc)} minutes.
                </li>
                <li>
                  <b>Seeing through haze.</b> If tower s spots the smoke with probability P_D^s, together <M>{'P_D = 1 - \\prod_s (1 - P_D^s)'}</M>: 0.6 and 0.7 give {f2(cumulativePD([0.6, 0.7]))}. The time-weighted version <M>{'P_D^c = 1 - \\prod_s (1-P_D^s)^{T_c/T_s}'}</M> = {f2(meanCumulativePD([0.6, 0.7], [10, 15]))} shows that a slow sensor contributes less even if it is good.
                </li>
              </ul>
              <P>The course exercise — two radars watching a car on a mountain pass (MHT p.3–4) — is this scene with radars instead of towers. Writing that program yourself is the course prerequisite.</P>
            </>
          ),
        },
      ],
    },
    /* ============================================================ 7 */
    {
      id: 'c5-ghosts',
      kicker: 'Scene 7',
      title: 'Ghost fires',
      concept: 'Ghosts · the association problem',
      steps: [
        {
          id: 's7.1',
          body: (
            <>
              <P>
                Lightning strikes twice: <b>two smokes</b>. Each tower reports two bearings. The dispatcher pins four strings and gets <b>four crossings — but only two fires</b>. The other two are <b>ghosts</b> (book Fig. 2.5).
              </P>
              <Controls>
                <Toggle options={['two towers', 'add Cedar Knob']} value={p.towerC} onChange={set('towerC')} />
              </Controls>
              <P>
                With two towers you cannot tell which crossings are real. A third tower in a new direction passes through the real fires only — the classic way to remove ghosts. The book warns that with more objects the number of ghosts grows much faster than the number of real ones, and with missed, false or merged bearings, de-ghosting is far from trivial.
              </P>
              <Ahead>This is the first appearance of the data association problem — which report belongs to which object — Chapters 6–8.</Ahead>
            </>
          ),
        },
      ],
    },
    /* ============================================================ 8 */
    {
      id: 'c5-arch',
      kicker: 'Scene 8',
      title: 'Phone lines are busy',
      concept: 'Fusion architectures · track-to-track fusion',
      steps: [
        {
          id: 's8.1',
          body: (
            <>
              <P>Up to now every bearing went to the dispatcher. The book's vocabulary for the choices (§3.1.1):</P>
              <Table
                head={['Term', 'Meaning']}
                rows={[
                  ['centralized / distributed', 'one fusion centre / several'],
                  ['measurement fusion', 'the raw reports and their R are sent'],
                  ['track-to-track fusion', 'each site sends its own estimate x and covariance P'],
                  ['full-rate / reduced-rate', 'everything is sent / only selected reports or tracks'],
                ]}
              />
              <P>Measurement fusion generally comes closer to optimal. So why would anyone send tracks instead (book §3.1.3)?</P>
              <ul>
                <li>less traffic: false tracks and clutter are removed locally;</li>
                <li>more robust to registration errors (each site's own track is self-consistent);</li>
                <li>if one site or link fails, the rest still works.</li>
              </ul>
              <P>The price: slower reaction, poorer track quality, worse track start-up (each site sees fewer reports), and trouble mixing sensors that cannot form tracks alone — a lone lookout's bearing-only track is hard to build.</P>
            </>
          ),
        },
        {
          id: 's8.2',
          body: (
            <>
              <P>
                The trap: the towers keep logbooks (local tracks) and phone in every hour. Both logbooks started from the same first guess and used the same fire-spread model. They are <b>not independent</b>. Feeding them into the Fusion Equation counts the shared part twice — overconfidence.
              </P>
              <P>The exact fix, from book Ch. 6: recover from each logbook only the <b>new</b> information it added — Frenkel's <b>tracklet</b>:</P>
              <Formula
                tex="\ell_k^s(\mathbf x) \propto \frac{\mathcal N(\mathbf x;\,\mathbf x^s_{k|k},\,\mathbf P^s_{k|k})}{\mathcal N(\mathbf x;\,\mathbf x^s_{k|k-1},\,\mathbf P^s_{k|k-1})}, \qquad (\mathbf P^*)^{-1} = (\mathbf P^s_{k|k})^{-1} - (\mathbf P^s_{k|k-1})^{-1}"
                rows={[
                  ['\\mathbf x^s_{k|k}, \\mathbf P^s_{k|k}', 'the site’s filtered track'],
                  ['\\mathbf x^s_{k|k-1}, \\mathbf P^s_{k|k-1}', 'its prediction, before the new data'],
                  ['\\mathbf P^*', 'the covariance of what this site’s sensor added'],
                ]}
              />
              <InOtherWords>Posterior information minus prior information = what this sensor added. Those pieces ARE independent and fuse with the Fusion Equation.</InOtherWords>
              <Example>
                1D: predicted variance 20, filtered variance 5 → 1/P* = 1/5 − 1/20 = 3/20, P* = {f2(tl.P)}. The sensor's own report was worth variance {f2(tl.P)}, not 5 — the 5 already included the shared prediction.
              </Example>
              <P>
                The book goes further (§6.2): Kalman covariances don't depend on the data, so every site can compute everyone's covariances locally and only talk <i>when</i> a fused picture is needed (“reduced-rate” fusion). This breaks for IMM and PDA, whose covariances depend on the data. Details in the Deep dive.
              </P>
              <Quiz
                id="ch5-q3"
                label="Why not fuse the hourly estimates directly?"
                q="Why can't the dispatcher just apply the Fusion Equation to the towers' hourly estimates?"
                options={[
                  { t: 'The estimates share a prior, so they are not independent — it would double-count', ok: true, why: 'Exactly. Use tracklets (or exact track-to-track formulas) instead.' },
                  { t: 'Estimates cannot be fused, only measurements', why: 'They can — with the right formulas.' },
                  { t: 'The covariances are too big', why: 'Size is not the problem; correlation is.' },
                ]}
              />
            </>
          ),
        },
      ],
    },
    /* ============================================================ 9 */
    {
      id: 'c5-lies',
      kicker: 'Scene 9',
      title: 'When fusion lies',
      concept: 'The independence assumption',
      steps: [
        {
          id: 's9.1',
          body: (
            <>
              <P>Break the assumption on purpose. Eagle Peak's report reaches the dispatcher twice — by phone and by radio — and is entered twice:</P>
              <Controls>
                <Toggle options={['honest', 'report counted twice']} value={p.dup} onChange={set('dup')} />
              </Controls>
              <P>
                The formula sees two sensors and halves that covariance. Nothing new was learnt, but the red ellipse is smaller than the honest blue one. The true fire is still scattered like the blue one says — so the 95% ellipse now catches the fire only about <b>78%</b> of the time (1 − e^{'{−5.99/4}'}).
              </P>
              <P>The same happens with a <b>common error</b>: both towers' maps misaligned the same way (a registration error). The errors move together and no amount of averaging removes them.</P>
              <Rule>Independence is an assumption you must justify. If it fails, fusion is overconfident — and an overconfident tracker later rejects good reports (Chapter 6's gate gets too tight).</Rule>
            </>
          ),
        },
      ],
    },
    /* ============================================================ epilogue */
    {
      id: 'c5-epilogue',
      kicker: 'Epilogue',
      title: 'Lines become a place',
      concept: 'Summary',
      steps: [
        {
          id: 's10.1',
          body: (
            <>
              <Lead>Everything on one card:</Lead>
              <Table
                head={['Idea', 'Formula']}
                rows={[
                  ['independence', <M>{'p(\\mathbf z_1\\dots\\mathbf z_S\\mid\\mathbf x) = \\prod_s \\mathcal N(\\mathbf z_s;\\mathbf H\\mathbf x,\\mathbf R_s)'}</M>],
                  ['Fusion Equation', <M>{'\\mathbf R = (\\sum_s \\mathbf R_s^{-1})^{-1},\\ \\mathbf z = \\mathbf R\\sum_s \\mathbf R_s^{-1}\\mathbf z_s'}</M>],
                  ['same answer', 'stacked = sequential = fused'],
                  ['geometry', '√S law vs geometric fusion gain; triangulation, trilateration'],
                  ['more often, more reliably', <M>{'1/T_c = \\sum 1/T_s,\\ P_D = 1-\\prod(1-P_D^s)'}</M>],
                  ['ghosts', 'crossings that are not objects → association'],
                  ['tracks', 'measurement vs track-to-track; tracklet = posterior − prior information'],
                ]}
              />
              <P>Next, Chapter 6: before fusing anything, ask <b>“is this report even our fire?”</b> — the factor 𝒩(z₁; z₂, R₁ + R₂) becomes a gate.</P>
              <button className="sx-cta" onClick={() => (window.location.hash = '#/ch5/practice')}>
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
      chapterId="ch5"
      chapterLabel="Chapter 5"
      title="Smoke on the ridge"
      scenes={scenes}
      onHome={onHome}
      renderWorld={(step, _hl, nonce) => <World5 step={step} p={p} fire={fire} nonce={nonce} />}
      extraItems={EXPLAIN5.map((e) => ({ id: e.id, kind: 'explain' as const, label: e.q, step: '#/ch5/practice' }))}
    />
  );
}
