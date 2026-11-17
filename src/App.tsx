import { lazy, Suspense, useEffect, useState } from 'react';
import { useProgress } from './story/progress';

const Chapter1 = lazy(() => import('./chapters/ch1/Chapter1'));

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
  const m = window.location.hash.match(/^#\/(ch\d+)/);
  return m ? m[1] : 'home';
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

  if (r === 'ch1')
    return (
      <Suspense fallback={<div className="hx" />}>
        <Chapter1 onHome={home} />
      </Suspense>
    );

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
              </span>
              <span className={`hx-status ${c.live ? 'live' : ''}`}>{c.live ? 'Start' : 'Soon'}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
