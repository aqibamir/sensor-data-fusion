import { ComponentType, lazy, LazyExoticComponent, Suspense, useEffect, useState } from 'react';
import { useProgress } from './story/progress';

type Page = LazyExoticComponent<ComponentType<{ onHome: () => void }>>;
interface ChapterEntry {
  id: string;
  num: number;
  title: string;
  blurb: string;
  story?: Page;
  practice?: Page;
  deep?: Page;
  exercises?: string[];
  explain?: string[];
}

const range = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`);

/** The course. A chapter is live once it has a story; practice and deep dive plug in the same way. */
const CHAPTERS: ChapterEntry[] = [
  {
    id: 'ch1',
    num: 1,
    title: 'The car in the dark',
    blurb: 'Probability: densities, mean, spread, joint, marginal, conditional, Bayes, Gaussians',
    story: lazy(() => import('./chapters/ch1/Chapter1')),
    practice: lazy(() => import('./chapters/ch1/Practice1')),
    deep: lazy(() => import('./chapters/ch1/Deep1')),
    exercises: range('ch1-p', 8),
    explain: range('ch1-e', 7),
  },
  {
    id: 'ch2',
    num: 2,
    title: 'The ship in the fog',
    blurb: 'The Bayesian recursion: prediction, filtering, retrodiction',
    story: lazy(() => import('./chapters/ch2/Chapter2')),
    practice: lazy(() => import('./chapters/ch2/Practice2')),
    deep: lazy(() => import('./chapters/ch2/Deep2')),
    exercises: range('ch2-p', 7),
    explain: range('ch2-e', 6),
  },
  {
    id: 'ch3',
    num: 3,
    title: 'Bringing them home',
    blurb: 'The Kalman filter: product formula, predict and update, Rauch–Tung–Striebel',
    story: lazy(() => import('./chapters/ch3/Chapter3')),
    practice: lazy(() => import('./chapters/ch3/Practice3')),
    deep: lazy(() => import('./chapters/ch3/Deep3')),
    exercises: range('ch3-p', 11),
    explain: range('ch3-e', 6),
  },
  {
    id: 'ch4',
    num: 4,
    title: 'Landing blind',
    blurb: 'Curved sensors: polar measurements, sensor models, EKF, UKF',
    story: lazy(() => import('./chapters/ch4/Chapter4')),
    practice: lazy(() => import('./chapters/ch4/Practice4')),
    deep: lazy(() => import('./chapters/ch4/Deep4')),
    exercises: range('ch4-p', 13),
    explain: range('ch4-e', 7),
  },
  {
    id: 'ch5',
    num: 5,
    title: 'Smoke on the ridge',
    blurb: 'Sensor fusion: the fusion formula, geometric gain, ghosts, track-to-track fusion',
    story: lazy(() => import('./chapters/ch5/Chapter5')),
    practice: lazy(() => import('./chapters/ch5/Practice5')),
    deep: lazy(() => import('./chapters/ch5/Deep5')),
    exercises: range('ch5-p', 14),
    explain: range('ch5-e', 8),
  },
  { id: 'ch6', num: 6, title: 'Is that pin ours?', blurb: 'Gating, Mahalanobis, χ²' },
  { id: 'ch7', num: 7, title: 'Ghosts on the screen', blurb: 'Detection, clutter, the ambiguous likelihood' },
  { id: 'ch8', num: 8, title: 'Many stories at once', blurb: 'NN, PDAF, MHT' },
  { id: 'ch9', num: 9, title: 'Changing gears', blurb: 'Interacting Multiple Models' },
  { id: 'ch10', num: 10, title: 'How a track is born', blurb: 'Sequential likelihood ratio test' },
];

function route(): { ch: string; view: 'story' | 'practice' | 'deep' } | null {
  const m = window.location.hash.match(/^#\/(ch\d+)(?:\/(practice|deep))?/);
  return m ? { ch: m[1], view: (m[2] as 'practice' | 'deep') ?? 'story' } : null;
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

  const ch = r && CHAPTERS.find((c) => c.id === r.ch && c.story);
  if (ch && r) {
    const Page = (r.view === 'practice' ? ch.practice : r.view === 'deep' ? ch.deep : ch.story) ?? ch.story!;
    return (
      <Suspense fallback={<div className="hx" />}>
        <Page key={`${ch.id}-${r.view}`} onHome={home} />
      </Suspense>
    );
  }

  // continue: the most advanced chapter with a saved step
  const resumeCh = [...CHAPTERS].reverse().find((c) => c.story && prog.step[c.id] && !/^s0\.1$/.test(prog.step[c.id]));

  return (
    <div className="hx">
      <div className="hx-wrap">
        <div className="hx-eyebrow">Sensor Data Fusion · WS 2026/27</div>
        <h1>Learn tracking by watching it happen.</h1>
        <p className="hx-lead">Every chapter tells its own story in 3D, then lets you do the maths yourself and explain it back, like in the oral exam.</p>
        {resumeCh && (
          <button className="hx-continue" onClick={() => (window.location.hash = `#/${resumeCh.id}`)}>
            <span>
              <span className="hx-continue-k">Continue where you left off</span>
              <span className="hx-continue-t">
                Chapter {resumeCh.num} · {resumeCh.title}
              </span>
            </span>
            <span aria-hidden>→</span>
          </button>
        )}
        <div className="hx-list">
          {CHAPTERS.map((c) => {
            const solved = (c.exercises ?? []).filter((id) => prog.exercise[id] && prog.exercise[id] !== 'revealed').length;
            const explained = (c.explain ?? []).filter((id) => prog.explain[id] === 'yes').length;
            return (
              <button key={c.id} className="hx-row" disabled={!c.story} onClick={() => (window.location.hash = `#/${c.id}`)}>
                <span className="hx-num">{c.num}</span>
                <span>
                  <div className="hx-title">{c.title}</div>
                  <div className="hx-blurb">{c.blurb}</div>
                  {c.story && (
                    <div className="hx-parts">
                      <span>Story</span>
                      {c.exercises && (
                        <span>
                          Practice {solved}/{c.exercises.length}
                        </span>
                      )}
                      {c.explain && (
                        <span>
                          Explain {explained}/{c.explain.length}
                        </span>
                      )}
                      <span className="hx-muted">Deep dive · planned</span>
                    </div>
                  )}
                </span>
                <span className={`hx-status ${c.story ? 'live' : ''}`}>{c.story ? 'Start' : 'Soon'}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
