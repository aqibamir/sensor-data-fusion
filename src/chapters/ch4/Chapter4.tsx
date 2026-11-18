import { useEffect, useMemo, useState } from 'react';
import { convCov, jacH, runApproach, sigmaPoints, utPolar } from '../../engine/polar';
import { Ask, Controls, Derive, Example, Formula, InOtherWords, Knob, Lead, M, P, Quiz, Readout, Rule, Table, Toggle, Trap } from '../../story/blocks';
import { Scene, StoryShell } from '../../story/StoryShell';
import { deg, DEFAULTS4, DT4, Params4, PHI0, STEPS4 } from './model';
import { EXPLAIN4 } from './Practice4';
import { World4 } from './World4';

const f0 = (v: number) => v.toFixed(0);
const f2 = (v: number) => v.toFixed(2);
const f3 = (v: number) => v.toFixed(3);

export default function Chapter4({ onHome }: { onHome: () => void }) {
  const [p, setP] = useState<Params4>(DEFAULTS4);
  const set = <K extends keyof Params4>(k: K) => (v: Params4[K]) => setP((q) => ({ ...q, [k]: v }));
  const run = useMemo(() => runApproach({ steps: STEPS4, dt: DT4, sphi: deg(p.sphiDeg), sr: p.srM / 1000, seed: p.seed, badStart: p.bad ? 2.5 : 0, W0: p.W0 }), [p.sphiDeg, p.srM, p.seed, p.bad, p.W0]);
  const [auto, setAuto] = useState(false);
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setP((q) => (q.k >= STEPS4 - 1 ? (setAuto(false), q) : { ...q, k: q.k + 1 })), 350);
    return () => clearInterval(id);
  }, [auto]);

  const sr = p.srM / 1000, sphi = deg(p.sphiDeg);
  const cross = p.r * sphi * 1000; // metres
  const C = convCov(p.r, PHI0, sr, sphi);
  const ut = utPolar(p.r, PHI0, sr, sphi, p.W0);
  const shiftM = (p.r - Math.hypot(...ut.m)) * 1000;
  const sp1 = sigmaPoints([2], [[4]], p.W0);
  const H34 = jacH(3, 4);
  const errAt = (m: number) => {
    const g = run.est[m][Math.min(p.k, STEPS4 - 1)], t = run.truth[Math.min(p.k, STEPS4 - 1)];
    return Math.hypot(g.x[0] - t[0], g.x[1] - t[1]) * 1000;
  };

  const scenes: Scene[] = [
    /* ============================================================ prologue */
    {
      id: 'c4-prologue',
      kicker: 'Prologue',
      title: 'Fog',
      concept: 'Why non-linear filtering',
      steps: [
        {
          id: 's0.1',
          body: (
            <>
              <Lead>Winter 1948, Berlin. Cargo planes land every few minutes, day and night, in any weather. Tonight the fog is so thick the pilot can't see his own wingtips.</Lead>
              <P>
                He is “talked down” over the radio by a controller sitting in a truck beside the runway, watching a <b>radar</b> screen: “<i>Turn left heading 270… on course… 2 miles from touchdown…</i>”. The system was called <b>Ground-Controlled Approach (GCA)</b>, built during the war at MIT's Radiation Laboratory and used during the Berlin Airlift.
              </P>
              <P>
                The controller can't see the plane either. He only has the radar. And here is the twist of this chapter: the radar does <b>not</b> tell him where the plane is. It tells him <b>how far</b> (the time the echo took to come back) and <b>which way</b> (where the dish was pointing when the echo came). Two numbers: range <M>{'r'}</M> and bearing <M>{'\\varphi'}</M>.
              </P>
            </>
          ),
        },
        {
          id: 's0.2',
          body: (
            <>
              <Ask q="The bearing error is ±1°. The plane is 18 km away. How wide is the uncertainty sideways?">
                <p>
                  Sideways distance = distance × angle (in radians). 1° = 0.0175 rad, so 18 000 m × 0.0175 ≈ <b>310 m</b>. The range is measured to about ±50 m. So the uncertainty is a thin smear 100 m deep and 600 m wide — and, because it follows the circle of constant range, it is <b>curved</b>. On the stage: 900 possible positions, drawn from exactly this error.
                </p>
              </Ask>
              <P>
                The runway is 45 m wide. At 1 km out the same ±1° is only ±17 m. Same sensor, a completely different situation depending on distance. Chapter 3's five lines assumed the sensor measures something <b>linear</b>, like z = Hx. But <M>{'x = r\\cos\\varphi'}</M> is not a straight line.
              </P>
              <Rule>The world is curved; the Kalman filter needs straight lines. This chapter shows three ways to land the plane anyway.</Rule>
              <P>
                (1) Bend the <b>measurement</b> into a straight-line world (conversion). (2) Straighten the <b>functions</b> at the current guess — the lecture's motto <b>“Be wise — linearize!”</b> (the Extended Kalman Filter). (3) Bend a handful of <b>sample points</b> instead of the function (the Unscented Kalman Filter).
              </P>
            </>
          ),
        },
      ],
    },
    /* ============================================================ 1 */
    {
      id: 'c4-model',
      kicker: 'Scene 1',
      title: 'What a sensor really is',
      concept: 'Likelihood = sensor model',
      steps: [
        {
          id: 's1.1',
          body: (
            <>
              <P>
                Koch's book (§2.3) gives the cleanest way to think about any sensor: a sensor model <b>is</b> a likelihood function <M>{'p(\\mathbf z_k\\mid\\mathbf x_k)'}</M>. Everything about the sensor lives inside it — accuracy, beam width, how often it sees anything at all. Read backwards it is also a recipe for <b>simulating</b> the sensor: draw random z from p(z | x). That is exactly how the course exercise's sensor simulator works.
              </P>
              <P>To build a sensor model you answer two questions (book §2.3.1):</P>
              <ol>
                <li>
                  <b>What is measured?</b> The measurement function <M>{'h_k: \\mathbf x_k \\mapsto h_k(\\mathbf x_k)'}</M>. For our radar, <M>{'h(\\mathbf x) = \\big(\\sqrt{x^2+y^2},\\ \\operatorname{atan2}(y, x)\\big)'}</M>.
                </li>
                <li>
                  <b>How well?</b> An additive, unbiased Gaussian error with covariance <M>{'\\mathbf R_k'}</M>; errors at different times and from different sensors independent.
                </li>
              </ol>
              <Formula
                tex="\mathbf z_k = h_k(\mathbf x_k) + \mathbf w_k \quad\Longleftrightarrow\quad p(\mathbf z_k\mid\mathbf x_k) = \mathcal N\big(\mathbf z_k;\ h_k(\mathbf x_k),\ \mathbf R_k\big)"
                rows={[
                  ['h_k', 'the measurement function: what the sensor looks at'],
                  ['\\mathbf R_k', 'how precisely it looks'],
                ]}
              />
              <P>
                Two words you will need in Chapter 5: sensors with the same h are <b>homogeneous</b> (two identical radars), otherwise <b>heterogeneous</b> (a radar and a camera). And a likelihood only needs to be known <b>up to a factor that doesn't depend on x</b> — Bayes divides by the normalisation anyway.
              </P>
              <Quiz
                id="ch4-q1"
                label="Which question does R answer?"
                q="In the two-question recipe for a sensor model, which question does R answer?"
                options={[
                  { t: 'What is measured', why: 'That is the job of the measurement function h.' },
                  { t: 'How well it is measured', ok: true, why: 'Right — R is the covariance of the measurement error.' },
                  { t: 'Where the sensor is', why: 'The sensor position enters h as a parameter.' },
                ]}
              />
            </>
          ),
        },
      ],
    },
    /* ============================================================ 2 */
    {
      id: 'c4-nonlin',
      kicker: 'Scene 2',
      title: 'Where straight lines break',
      concept: 'Non-linear models',
      steps: [
        {
          id: 's2.1',
          body: (
            <>
              <P>Chapter 3 had two straight-line assumptions. The lecture (L2 p.34–35) replaces both:</P>
              <Table
                head={['', 'Linear (Ch 3)', 'Non-linear (now)']}
                rows={[
                  ['dynamics', <M>{'\\mathbf x_k = \\mathbf F\\mathbf x_{k-1} + \\mathbf G\\mathbf v'}</M>, <M>{'\\mathbf x_k = f(\\mathbf x_{k-1}) + \\mathbf G\\mathbf v'}</M>],
                  ['sensor', <M>{'\\mathbf z_k = \\mathbf H\\mathbf x_k + \\mathbf w'}</M>, <M>{'\\mathbf z_k = h(\\mathbf x_k) + \\mathbf w'}</M>],
                ]}
              />
              <P>
                Both happen tonight: the radar (h is non-linear), and the plane's turn onto the final approach (heading changes, so sines and cosines of the heading appear in f).
              </P>
              <P>
                Why does this break Kalman? Chapter 1's rule says a straight-line map of a bell is a bell. A curved map of a bell is <b>not</b>: it gets bent and skewed — look at the stage, where an upright ellipse in the radar's own (r, φ) world becomes a banana on the ground. And Chapter 3's product formula only works for <M>{'\\mathcal N(\\mathbf z;\\,\\mathbf H\\mathbf x,\\,\\mathbf R)'}</M>: with h(x) the likelihood is not a bell in x, the posterior is not a bell, and we'd be back to Chapter 2's expensive curves.
              </P>
              <Rule>The Kalman filter is optimal only for linear models with additive Gaussian noise (MHT p.10). For curved models we approximate, so that every density is a Gaussian again. Conversion, EKF and UKF are three different approximations.</Rule>
              <Quiz
                id="ch4-q2"
                label="Which function is linear in the state?"
                q="State x = (x, y, ẋ, ẏ). Which of these is linear in the state?"
                options={[
                  { t: '√(x² + y²)', why: 'A square root of squares — curved.' },
                  { t: 'atan2(y, x)', why: 'An angle — curved.' },
                  { t: 'x + Δt·ẋ', ok: true, why: 'Yes: a sum of state entries times constants. That is exactly a row of Chapter 3’s F.' },
                ]}
              />
            </>
          ),
        },
      ],
    },
    /* ============================================================ 3 */
    {
      id: 'c4-banana',
      kicker: 'Scene 3',
      title: 'The banana',
      concept: 'The polar measurement error',
      steps: [
        {
          id: 's3.1',
          body: (
            <>
              <P>
                The radar's error model (L2 p.31; book §2.3.1): <M>{'\\mathbf z = (r, \\varphi)'}</M> with <M>{'\\mathbf R = \\operatorname{diag}(\\sigma_r^2, \\sigma_\\varphi^2)'}</M>. Range and bearing errors are independent, so in the radar's own world (the panel on the stage) the error is a neat upright ellipse.
              </P>
              <P>
                Mapped to the ground by <M>{'x = r\\cos\\varphi,\\ y = r\\sin\\varphi'}</M>, the same cloud becomes a <b>banana</b> bent along the circle of constant range. Move the plane away and widen the beam:
              </P>
              <Controls>
                <Knob label="distance r" value={p.r} min={2} max={40} step={1} onChange={set('r')} fmt={f0} unit=" km" />
                <Knob label="bearing error σφ" value={p.sphiDeg} min={0.2} max={6} step={0.1} onChange={set('sphiDeg')} unit="°" />
              </Controls>
              <Readout>
                Along the beam: σr = {f0(p.srM)} m (constant). Across the beam: r·σφ = {f0(cross)} m. Ratio {f0(cross / p.srM)} : 1.
              </Readout>
              <P>
                The book says it exactly: the cross-range semi-axis grows with range while the other stays constant. Close in, small beam: the banana is practically an ellipse. Far out, wide beam: it visibly bends.
              </P>
              <Rule>Linearisation is good when the function is nearly straight over the size of the error — here, when σφ (in radians) is small.</Rule>
            </>
          ),
        },
      ],
    },
    /* ============================================================ 4 */
    {
      id: 'c4-convert',
      kicker: 'Scene 4',
      title: 'Bend the measurement',
      concept: 'Converted measurements · Jacobian',
      steps: [
        {
          id: 's4.1',
          body: (
            <>
              <P>
                The lecture's <b>first possibility</b> (L2 p.31): convert the measurement to x and y with <M>{'t(r,\\varphi) = r(\\cos\\varphi,\\ \\sin\\varphi)^\\top'}</M>, and replace the curve by its best straight line near the measured point — a Taylor series cut after the first two terms:
              </P>
              <Formula tex="t(\mathbf z) \approx t(\mathbf s') + \mathbf T\,(\mathbf z - \mathbf s'), \qquad \mathbf T = \frac{\partial t}{\partial (r,\varphi)}" rows={[['\\mathbf T', 'the Jacobian: how x and y change when r or φ change a little']]} />
              <Derive
                steps={[
                  { tex: '\\frac{\\partial (r\\cos\\varphi)}{\\partial r} = \\cos\\varphi, \\quad \\frac{\\partial (r\\cos\\varphi)}{\\partial \\varphi} = -r\\sin\\varphi', why: 'Row 1: how x reacts. Moving out (r) moves x by cos φ; turning (φ) moves x by −r sin φ — the further out, the bigger the swing.' },
                  { tex: '\\frac{\\partial (r\\sin\\varphi)}{\\partial r} = \\sin\\varphi, \\quad \\frac{\\partial (r\\sin\\varphi)}{\\partial \\varphi} = r\\cos\\varphi', why: 'Row 2: the same for y.' },
                  { tex: '\\mathbf T = \\begin{pmatrix}\\cos\\varphi & -r\\sin\\varphi\\\\ \\sin\\varphi & r\\cos\\varphi\\end{pmatrix}', why: 'Put the four slopes in a matrix.' },
                  { tex: '\\mathbf T = \\underbrace{\\begin{pmatrix}\\cos\\varphi & -\\sin\\varphi\\\\ \\sin\\varphi & \\cos\\varphi\\end{pmatrix}}_{\\text{rotation } \\mathbf D_\\varphi}\\underbrace{\\begin{pmatrix}1 & 0\\\\ 0 & r\\end{pmatrix}}_{\\text{dilation } \\mathbf S_r}', why: 'The book’s factorisation (eq. 2.17): stretch the bearing direction by r (radians → metres), then turn everything to point along the beam.' },
                ]}
              />
            </>
          ),
        },
        {
          id: 's4.2',
          body: (
            <>
              <P>Now Chapter 1's linear-map rule does the rest (L2 p.31; book App. A.3): if z ~ 𝒩(x, R) and z′ = t + Tz, then z′ ~ 𝒩(t + Tx, T R Tᵀ). So the converted measurement error is</P>
              <Formula tex="\mathbf R' = \mathbf T\mathbf R\mathbf T^\top = \mathbf D_\varphi \begin{pmatrix}\sigma_r^2 & 0\\ 0 & r^2\sigma_\varphi^2\end{pmatrix}\mathbf D_\varphi^\top" rows={[['r\\sigma_\\varphi', 'the across-beam spread, in metres'], ['\\mathbf D_\\varphi', 'turns the ellipse to point along the beam']]} />
              <InOtherWords>σr along the beam, r·σφ across it, rotated to the bearing. Read it aloud like that in the exam.</InOtherWords>
              <Readout>
                Now: R′ = [[{f3(C[0][0])}, {f3(C[0][1])}], [{f3(C[1][0])}, {f3(C[1][1])}]] km². The blue ellipse on the stage.
              </Readout>
              <P>
                Then the ordinary Kalman filter runs with the converted position, <M>{'\\mathbf H = (\\mathbf I,\\ \\mathbf O)'}</M> (pick the position out of the state), and R′ recomputed every sweep — the time-indexed R_k of Chapter 3. R depends on where the plane is relative to the radar; Chapter 5 turns exactly that into the <i>geometric fusion gain</i>.
              </P>
              <P>
                Push r and σφ up in Scene 3's knobs (they are shared): the ellipse fits the banana's middle, but the tips stick out — an ellipse can't bend. There is also a small honest flaw: the average of r cos φ is <b>not</b> r̂ cos φ̂, because the banana bulges towards the radar. The book points to “unbiased converted measurements” as the fix (Deep dive).
              </P>
              <Quiz
                id="ch4-q3"
                label="Plane due north: which way is the long axis?"
                q="The plane is due north of the radar (φ = 90°). Which way does the long axis of the converted ellipse point?"
                options={[
                  { t: 'North–south (along the beam)', why: 'Along the beam the error is σr, the short one.' },
                  { t: 'East–west (across the beam)', ok: true, why: 'Yes — across the beam the spread is r·σφ, which is the long one at any real distance.' },
                ]}
              />
            </>
          ),
        },
      ],
    },
    /* ============================================================ 5 */
    {
      id: 'c4-ekf',
      kicker: 'Scene 5',
      title: 'Straighten the model',
      concept: 'Extended Kalman Filter',
      steps: [
        {
          id: 's5.1',
          body: (
            <>
              <P>The second possibility: keep z in polar coordinates and linearise h and f <b>inside</b> the filter, at the current best guess (L2 p.32–36). Chapter 3's card with the changes:</P>
              <Formula
                tex="\begin{aligned} &\mathbf x_{k|k-1} = f(\mathbf x_{k-1|k-1}), && \mathbf P_{k|k-1} = \mathbf F\mathbf P\mathbf F^\top + \mathbf D, && \mathbf F = \tfrac{\partial f}{\partial \mathbf x}\big|_{\mathbf x_{k-1|k-1}}\\ &\mathbf x_{k|k} = \mathbf x_{k|k-1} + \mathbf W\big(\mathbf z_k - h(\mathbf x_{k|k-1})\big), && \mathbf P_{k|k} = \mathbf P_{k|k-1} - \mathbf W\mathbf S\mathbf W^\top, && \mathbf H = \tfrac{\partial h}{\partial \mathbf x}\big|_{\mathbf x_{k|k-1}} \end{aligned}"
                rows={[
                  ['f, h', 'the real curved functions: the MEAN goes through them'],
                  ['\\mathbf F, \\mathbf H', 'their Jacobians (tangent slopes): the COVARIANCE goes through them'],
                  ['\\mathbf S, \\mathbf W', 'as in Ch 3: S = HPHᵀ + R, W = PHᵀS⁻¹'],
                ]}
              />
              <Rule>EKF in one sentence: the mean goes through the real curve; the covariance goes through its tangent.</Rule>
              <Trap>Slide typo (L2 p.36): the innovation is written z − h(x_{'{k−1|k}'}). The index must be h(x_{'{k|k−1}'}) — the predicted measurement.</Trap>
            </>
          ),
        },
        {
          id: 's5.2',
          body: (
            <>
              <P>The radar's Jacobian, for a state (x, y, ẋ, ẏ):</P>
              <Derive
                steps={[
                  { tex: 'r = \\sqrt{x^2+y^2} \\Rightarrow \\frac{\\partial r}{\\partial x} = \\frac{x}{r},\\ \\frac{\\partial r}{\\partial y} = \\frac{y}{r}', why: 'Chain rule on the square root.' },
                  { tex: '\\varphi = \\operatorname{atan2}(y,x) \\Rightarrow \\frac{\\partial \\varphi}{\\partial x} = -\\frac{y}{r^2},\\ \\frac{\\partial \\varphi}{\\partial y} = \\frac{x}{r^2}', why: 'Derivative of the angle; note the 1/r²: bearing changes faster when the plane is close.' },
                  { tex: '\\frac{\\partial r}{\\partial \\dot x} = \\frac{\\partial r}{\\partial \\dot y} = \\frac{\\partial \\varphi}{\\partial \\dot x} = \\frac{\\partial \\varphi}{\\partial \\dot y} = 0', why: 'This radar measures no velocity.' },
                  { tex: '\\mathbf H = \\begin{pmatrix} x/r & y/r & 0 & 0\\\\ -y/r^2 & x/r^2 & 0 & 0\\end{pmatrix}', why: 'Row 1 is the unit vector along the beam. Row 2 is the across-beam direction divided by r.' },
                ]}
              />
              <Example>
                At (x, y) = (3, 4) km: r = 5, row 1 = ({f2(H34[0][0])}, {f2(H34[0][1])}) — the unit vector pointing from the radar to the plane. Row 2 = ({f3(H34[1][0])}, {f3(H34[1][1])}) per km.
              </Example>
              <P>
                The turn onto final makes f non-linear too: then F = ∂f/∂x changes every step and depends on the estimate. (We use it, but don't derive the turn model — neither does the lecture.)
              </P>
            </>
          ),
        },
        {
          id: 's5.3',
          body: (
            <>
              <P>
                The weak spot: <b>where</b> you linearise. H is evaluated at the <i>prediction</i>. If the prediction is wrong, the tangent is taken at the wrong place, the ellipse points the wrong way, the gain is wrong — and the filter can lose the target. On the stage, the orange ellipse is linearised at the wrong bearing:
              </P>
              <Controls>
                <Knob label="linearisation point off by" value={p.linOff} min={0} max={40} step={1} onChange={set('linOff')} fmt={f0} unit="°" />
              </Controls>
              <P>
                Book bonus (§2.3.1): for radial measurements such as Doppler range-rate, a smarter trick is to <b>rotate the coordinate system</b> so one axis points along the beam. Then the radial measurement is a measurement of <i>one Cartesian component</i> — linear in that frame. Koch reports that on real data this is “significantly more robust than approaches based on Taylor expansions.” Sometimes the best linearisation is a better choice of coordinates.
              </P>
              <Quiz
                id="ch4-q4"
                label="EKF: h in the innovation, H in the gain — why?"
                q="Why does the EKF use h itself in the innovation but its Jacobian H in S and W?"
                options={[
                  { t: 'The predicted measurement is more accurate through the true function; the covariance formulas need a matrix', ok: true, why: 'Exactly — the mean can go through any function, but A P Aᵀ needs a matrix A.' },
                  { t: 'Because h is cheaper than H', why: 'Cost is not the reason.' },
                  { t: 'It is a typo on the slide', why: 'No — that is the intended design.' },
                ]}
              />
            </>
          ),
        },
      ],
    },
    /* ============================================================ 6 */
    {
      id: 'c4-ukf-idea',
      kicker: 'Scene 6',
      title: 'Bend the cloud, not the function',
      concept: 'Unscented transform',
      steps: [
        {
          id: 's6.1',
          body: (
            <>
              <P>The lecture's motto for the third way (L2 p.38):</P>
              <Rule>“It is easier to approximate a probability distribution than an arbitrary non-linear function.”</Rule>
              <ol>
                <li>Choose a few <b>σ-points</b> whose mean and covariance equal those of the bell.</li>
                <li>Push each point through the real curved function.</li>
                <li>Compute the new mean and covariance from where they landed.</li>
              </ol>
              <P>
                On the stage: five purple beads on the radar's upright ellipse (panel), sent through r(cos φ, sin φ). They land on the banana, and the purple ellipse is fitted to them. Compare with the blue one from Scene 4:
              </P>
              <Readout>The UKF centre sits {f0(Math.max(0, shiftM))} m closer to the radar than the converted one — the bulge of the banana, which linearisation can't see.</Readout>
              <P>No derivatives anywhere: f and h only have to be <i>evaluated</i>. That matters when they come from a simulation or a lookup table.</P>
            </>
          ),
        },
      ],
    },
    /* ============================================================ 7 */
    {
      id: 'c4-sigma',
      kicker: 'Scene 7',
      title: 'Choosing the σ-points',
      concept: 'σ-point recipe',
      steps: [
        {
          id: 's7.1',
          body: (
            <>
              <P>The exact recipe (L2 p.40–41), for a state of dimension n: <b>2n + 1 points</b>.</P>
              <Formula
                tex="\begin{aligned} &\mathbf x^0 = \hat{\mathbf x}, && W^0,\ \ -1 < W^0 < 1\\ &\mathbf x^i = \hat{\mathbf x} + \Big(\sqrt{\tfrac{n}{1-W^0}\,\mathbf P}\Big)_i, && \mathbf x^{i+n} = \hat{\mathbf x} - \Big(\sqrt{\tfrac{n}{1-W^0}\,\mathbf P}\Big)_i\\ &W^j = \tfrac{1-W^0}{2n}, && j = 1,\dots,2n \end{aligned}"
                rows={[
                  ['(\\sqrt{\\mathbf M})_i', 'i-th column of a matrix A with A Aᵀ = M (in practice the Cholesky factor). For a diagonal P: just the σ’s.'],
                  ['W^0', 'the centre weight: a tuning knob'],
                ]}
              />
              <Derive
                steps={[
                  { tex: 'n=1:\\ \\ x^{0}=\\hat x,\\ \\ x^{\\pm}=\\hat x \\pm \\sqrt{P/(1-W^0)}', why: 'One dimension: a centre and two side points.' },
                  { tex: '\\text{mean} = W^0\\hat x + \\tfrac{1-W^0}{2}(x^+ + x^-) = \\hat x', why: 'The side points are symmetric, so they average to x̂. Weights add to 1.' },
                  { tex: '\\text{var} = 2\\cdot\\tfrac{1-W^0}{2}\\cdot\\tfrac{P}{1-W^0} = P\\ \\checkmark', why: 'The √(n/(1−W⁰)) is chosen exactly so the spread comes out right.' },
                ]}
              />
              <Controls>
                <Knob label="centre weight W⁰" value={p.W0} min={-0.9} max={0.9} step={0.05} onChange={set('W0')} fmt={f2} />
              </Controls>
              <Readout>
                1D check with x̂ = 2, P = 4: points {sp1.pts.map((q) => f2(q[0])).join(', ')}, weights {sp1.w.map(f2).join(', ')}. Bigger W⁰ pushes the outer points further out (they must carry the spread with less weight).
              </Readout>
              <P>Counting: our 4D state needs 9 points, a 6D state 13 — tiny next to Chapter 2's grid.</P>
              <Trap>Slide notation (L2 p.40): the weight is called W^j but the text says “for all i”. Same thing: j = 1…2n.</Trap>
            </>
          ),
        },
      ],
    },
    /* ============================================================ 8 */
    {
      id: 'c4-ukf',
      kicker: 'Scene 8',
      title: 'The Unscented Kalman Filter',
      concept: 'UKF predict and update',
      steps: [
        {
          id: 's8.1',
          body: (
            <>
              <P>Prediction (L2 p.43): σ-points of the last posterior, pushed through the dynamics:</P>
              <Formula tex="\mathbf x_i^f = f(\mathbf x_i),\quad \mathbf x^f = \sum_{i=0}^{2n} W^i\mathbf x_i^f,\quad \mathbf P^f = \sum_{i=0}^{2n} W^i(\mathbf x_i^f-\mathbf x^f)(\mathbf x_i^f-\mathbf x^f)^\top + \mathbf D" rows={[['\\mathbf D', 'added once at the end, because the process noise is additive']]} />
              <P>Filtering (L2 p.44): σ-points of the <b>predicted</b> density, pushed through the sensor:</P>
              <Formula
                tex="\begin{aligned} &\mathbf z_i^h = h(\mathbf x_i), \quad \mathbf z^h = \textstyle\sum W^i\mathbf z_i^h\\ &\operatorname{Cov}(\mathbf z) = \textstyle\sum W^i(\mathbf z_i^h-\mathbf z^h)(\cdot)^\top + \mathbf R, \quad \operatorname{Cov}(\mathbf x,\mathbf z) = \textstyle\sum W^i(\mathbf x_i-\mathbf x^f)(\mathbf z_i^h-\mathbf z^h)^\top\\ &\mathbf W = \operatorname{Cov}(\mathbf x,\mathbf z)\operatorname{Cov}(\mathbf z)^{-1}, \quad \mathbf x = \mathbf x^f + \mathbf W(\mathbf z - \mathbf z^h), \quad \mathbf P = \mathbf P^f - \mathbf W\operatorname{Cov}(\mathbf z)\mathbf W^\top \end{aligned}"
                rows={[
                  ['\\operatorname{Cov}(\\mathbf z)', 'is Chapter 3’s S'],
                  ['\\operatorname{Cov}(\\mathbf x,\\mathbf z)', 'is Chapter 3’s P Hᵀ'],
                ]}
              />
              <P>
                The key insight: if h were linear, h(x) = Hx, then Cov(x, z) = Σ Wⁱ (xᵢ − x̂)(xᵢ − x̂)ᵀ Hᵀ = P Hᵀ exactly, and Cov(z) = H P Hᵀ + R = S. So W = P Hᵀ S⁻¹ again. <b>The UKF is the Kalman filter with its matrices measured from points instead of computed from H.</b>
              </P>
              <Trap>Slide wording (L2 p.44): “choose σ-points of the measurement density z_i”. They are points of the predicted <i>state</i> density, then mapped by h.</Trap>
            </>
          ),
        },
      ],
    },
    /* ============================================================ 9 */
    {
      id: 'c4-approach',
      kicker: 'Scene 9',
      title: 'The approach',
      concept: 'Converted KF vs EKF vs UKF',
      steps: [
        {
          id: 's9.1',
          body: (
            <>
              <P>
                The whole approach: the plane appears 25 km out flying west, makes an S-turn onto the final-approach line and heads for the threshold. One sweep every {DT4} s. Red dots are the radar blips (converted, to be drawn); the coloured line is the filter's track; the ellipse is its 2σ position uncertainty now.
              </P>
              <Controls>
                <Toggle options={['Converted KF', 'EKF', 'UKF']} value={p.method} onChange={set('method')} />
                <Knob label="sweep" value={p.k} min={2} max={STEPS4 - 1} step={1} onChange={set('k')} fmt={f0} />
                <button className="sx-btn" onClick={() => (setP((q) => ({ ...q, k: 2 })), setAuto(true))}>
                  Fly the approach
                </button>
                <Knob label="bearing error σφ" value={p.sphiDeg} min={0.2} max={6} step={0.1} onChange={set('sphiDeg')} unit="°" />
                <Toggle options={['honest start', 'bad start (2.5 km off)']} value={p.bad} onChange={set('bad')} />
              </Controls>
              <Readout>
                Position error now — converted: {f0(errAt(0))} m · EKF: {f0(errAt(1))} m · UKF: {f0(errAt(2))} m.
              </Readout>
              <P>
                Close in, all three agree — at that scale the curve is straight. Far out with a wide beam (try σφ = 5°), the converted ellipse is the most stretched and its centre sits slightly outside the banana's middle. With a bad start the gains are computed at the wrong place for a while; watch how long each filter needs to recover.
              </P>
              <Table
                head={['', 'Converted KF', 'EKF', 'UKF']}
                rows={[
                  ['approximates', 'the measurement conversion', 'f and h (1st-order Taylor)', 'the density (σ-points)'],
                  ['derivatives', 'T once per sweep', 'Jacobians F, H every step', 'none'],
                  ['cost', '1 KF step', '1 KF step + Jacobians', '2n + 1 function evaluations'],
                  ['weak spot', 'large r·σφ, small bias', 'strong curvature, bad linearisation point', 'choice of W⁰; still one Gaussian'],
                ]}
              />
              <P>Radio: “<i>Over the threshold — take over visually.</i>” The runway lights appear through the fog.</P>
            </>
          ),
        },
      ],
    },
    /* ============================================================ 10 */
    {
      id: 'c4-beyond',
      kicker: 'Scene 10',
      title: 'When one bell isn’t enough',
      concept: 'TDoA · Gaussian mixtures · particles',
      steps: [
        {
          id: 's10.1',
          body: (
            <>
              <P>
                EKF and UKF both end in <b>one Gaussian</b>. Some sensors produce likelihoods no single bell can describe. The book's example (§2.3.1): two receivers hear a radio emitter. The <b>time difference of arrival (TDoA)</b> fixes the difference of distances,
              </P>
              <Formula tex="h_t(\mathbf x) = |\mathbf r - \mathbf p_1| - |\mathbf r - \mathbf p_2|" rows={[['\\mathbf p_1, \\mathbf p_2', 'the receiver positions (known)']]} />
              <P>and all positions with the same difference lie on a <b>hyperbola</b> — not near a point at all.</P>
              <Controls>
                <Knob label="distance difference" value={p.tdoa} min={-8} max={8} step={0.5} onChange={set('tdoa')} unit=" km" />
              </Controls>
              <P>
                The <b>frequency difference (FDoA)</b>, from the Doppler shift, gives another curve; the book notes the two are complementary (TDoA acts roughly like a bearing, FDoA roughly like a distance).
              </P>
              <P>Two ways out when one bell won't do (book §3.1.2):</P>
              <ul>
                <li>
                  <b>Gaussian mixtures</b>: a weighted sum <M>{'\\sum_i p_i\\,\\mathcal N(\\mathbf x;\\mathbf x_i,\\mathbf P_i)'}</M>, each piece linearised locally. Koch's preferred tool — PDAF, MHT and IMM (Chapters 8–9) are all mixtures.
                </li>
                <li>
                  <b>Particle filters</b>: represent the density by random samples. “Numerically exact”, but expensive; used as benchmarks or when the likelihood can only be computed point by point (e.g. radio multipath in a city, by ray tracing).
                </li>
              </ul>
              <InOtherWords>σ-points are a few cleverly chosen samples; particles are many random ones. Same instinct, different scale.</InOtherWords>
            </>
          ),
        },
      ],
    },
    /* ============================================================ epilogue */
    {
      id: 'c4-epilogue',
      kicker: 'Epilogue',
      title: 'Wheels down',
      concept: 'Summary',
      steps: [
        {
          id: 's11.1',
          body: (
            <>
              <Lead>The curves are tamed. Everything in this chapter on one card:</Lead>
              <Table
                head={['Idea', 'Formula', 'Remember it as']}
                rows={[
                  ['sensor model', <M>{'\\mathbf z = h(\\mathbf x) + \\mathbf w \\Leftrightarrow \\mathcal N(\\mathbf z; h(\\mathbf x), \\mathbf R)'}</M>, 'what is measured + how well'],
                  ['polar → Cartesian', <M>{'\\mathbf T = \\mathbf D_\\varphi\\,\\mathrm{diag}(1, r)'}</M>, 'rotation × dilation'],
                  ['converted error', <M>{'\\mathbf R\' = \\mathbf D_\\varphi\\,\\mathrm{diag}(\\sigma_r^2, r^2\\sigma_\\varphi^2)\\,\\mathbf D_\\varphi^\\top'}</M>, 'σr along, r·σφ across'],
                  ['EKF', <M>{'f, h \\text{ for the mean};\\ \\mathbf F, \\mathbf H \\text{ for } \\mathbf P'}</M>, 'mean through the curve, covariance through the tangent'],
                  ['UKF', <M>{'2n+1 \\text{ points},\\ \\mathbf W = \\mathrm{Cov}(\\mathbf x,\\mathbf z)\\mathrm{Cov}(\\mathbf z)^{-1}'}</M>, 'bend the cloud, not the function'],
                  ['beyond', 'mixtures, particles', 'when one bell can’t hold the likelihood'],
                ]}
              />
              <P>Next: one radar gives one long ellipse. What if two observers look from different directions? Chapter 5.</P>
              <button className="sx-cta" onClick={() => (window.location.hash = '#/ch4/practice')}>
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
      chapterId="ch4"
      chapterLabel="Chapter 4"
      title="Landing blind"
      scenes={scenes}
      onHome={onHome}
      renderWorld={(step, _hl, nonce) => <World4 step={step} p={p} run={run} nonce={nonce} />}
      extraItems={EXPLAIN4.map((e) => ({ id: e.id, kind: 'explain' as const, label: e.q, step: '#/ch4/practice' }))}
    />
  );
}
