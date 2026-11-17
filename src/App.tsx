import { lazy, Suspense, useEffect, useState } from 'react';
import { useProgress } from './story/progress';

const Chapter1 = lazy(() => import('./chapters/ch1/Chapter1'));
const Practice1 = lazy(() => import('./chapters/ch1/Practice1'));
const Deep1 = lazy(() => import('./chapters/ch1/Deep1'));
const EX1 = ['ch1-p1', 'ch1-p2', 'ch1-p3', 'ch1-p4', 'ch1-p5', 'ch1-p6', 'ch1-p7', 'ch1-p8'];
const EXPL1 = ['ch1-e1', 'ch1-e2', 'ch1-e3', 'ch1-e4', 'ch1-e5', 'ch1-e6', 'ch1-e7'];

const CHAPTERS = [
  { id: 'ch1', num: 1, title: 'The car in the dark', blurb: 'Probability: densities, mean, spread, joint, marginal, conditional, Bayes, Gaussians', live: true },
  { id: 'ch2', num: 2, title: 'Predict, measure, repeat', blurb: 'The Bayesian recursion: prediction, filtering, retrodiction', live: false },
  { id: 'ch3', num: 3, title: 'The Kalman filter', blurb: 'Product formula, predict and update, Rauch–Tung–Striebel', live: false },
  { id: 'ch4', num: 4, title: 'Curved worlds', blurb: 'Polar sensors, EKF, UKF', live: false },
  { id: 'ch5', num: 5, title: 'Two radars are better than one', blurb: 'The fusion formula', live: false },
  { id: 'ch6', num: 6, title: 'Is that pin ours?', blurb: 'Gating, Mahalanobis, χ²', live: false },
  { id: 'ch7', num: 7, title: 'Ghosts on the screen', blurb: 'Detection, clutter, the ambiguous likelihood', live: false },
  { id: 'ch8', num: 8, title: 'Many stories at once', blurb: 'NN, PDAF, MHT', live: false },
  { id: 'ch9', num: 9, title: 'Changing gears', blurb: 'Interacting Multiple Models', live: false },
  { id: 'ch10', num: 10, title: 'How a track is born', blurb: 'Sequential likelihood ratio test', live: false },
];

function route() {
  const m = window.location.hash.match(/^#\/(ch\d+)(?:\/(practice|deep))?/);
  return m ? `${m[1]}${m[2] ? '/' + m[2] : ''}` : 'home';
}

export default function App() {
  const [r, setR] = useState(route());
  useEffect(() => {
    const on = () => setR(route());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const home = () => (window.location.hash = '#/');
  const prog = useProgress();
  const resume = prog.step.ch1;

  if (r === 'ch1' || r.startsWith('ch1/'))
    return (
      <Suspense fallback={<div className="hx" />}>
        {r === 'ch1/practice' ? <Practice1 onHome={home} /> : r === 'ch1/deep' ? <Deep1 onHome={home} /> : <Chapter1 onHome={home} />}
      </Suspense>
    );
  const solved1 = EX1.filter((id) => prog.exercise[id] && prog.exercise[id] !== 'revealed').length;
  const explained1 = EXPL1.filter((id) => prog.explain[id] === 'yes').length;

  return (
    <div className="hx">
      <div className="hx-wrap">
        <div className="hx-eyebrow">Sensor Data Fusion · WS 2026/27</div>
        <h1>Learn tracking by watching it happen.</h1>
        <p className="hx-lead">One car, one radar, one dark road. Every idea of the course, built up step by step in 3D — then you explain it back, like in the oral exam.</p>
        {resume && resume !== 's0.1' && (
          <button className="hx-continue" onClick={() => (window.location.hash = '#/ch1')}>
            <span>
              <span className="hx-continue-k">Continue where you left off</span>
              <span className="hx-continue-t">Chapter 1 · The car in the dark</span>
            </span>
            <span aria-hidden>→</span>
          </button>
        )}
        <div className="hx-list">
          {CHAPTERS.map((c) => (
            <button key={c.id} className="hx-row" disabled={!c.live} onClick={() => (window.location.hash = `#/${c.id}`)}>
              <span className="hx-num">{c.num}</span>
              <span>
                <div className="hx-title">{c.title}</div>
                <div className="hx-blurb">{c.blurb}</div>
                {c.id === 'ch1' && (
                  <div className="hx-parts">
                    <span>Story</span>
                    <span>
                      Practice {solved1}/{EX1.length}
                    </span>
                    <span>
                      Explain {explained1}/{EXPL1.length}
                    </span>
                    <span className="hx-muted">Deep dive · planned</span>
                  </div>
                )}
              </span>
              <span className={`hx-status ${c.live ? 'live' : ''}`}>{c.live ? 'Start' : 'Soon'}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
