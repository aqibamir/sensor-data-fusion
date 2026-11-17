import { PageShell } from '../../story/ChapterFrame';

/** The deep-dive slot of Chapter 1. Topics are planned; content comes later. */
const TOPICS: { title: string; why: string; links: string }[] = [
  { title: 'The Gaussian integral', why: 'Why the bell needs exactly 1/√(2πσ²) in front: the famous ∫e^(−x²) dx = √π, done with polar coordinates.', links: 'Scene 10 · reused in the χ² derivation (Ch 6)' },
  { title: 'Why bells everywhere: the central limit theorem', why: 'The dice experiment, made precise: sums of many independent errors become Gaussian.', links: 'Scene 10' },
  { title: 'Eigenvectors and the covariance ellipse', why: 'Where the axes of the σ-ellipse come from, and why a covariance matrix must be symmetric and positive definite.', links: 'Scenes 5, 10 · gating (Ch 6)' },
  { title: 'Change of variables for densities', why: 'What happens to a density under a curved (non-linear) map — the bridge to range/azimuth sensors and the EKF.', links: 'Scene 11 · Ch 4' },
  { title: 'The Dirac delta, properly', why: 'Why the delta is not really a function, and how to compute with it safely.', links: 'Scene 12 · Ch 6' },
];

export default function Deep1({ onHome }: { onHome: () => void }) {
  return (
    <PageShell chapterId="ch1" chapterLabel="Chapter 1" view="deep" onHome={onHome}>
      <div className="cx-intro">
        <div className="sx-kicker">Chapter 1 · Deep dive</div>
        <h1 className="sx-h2">The mathematics underneath</h1>
        <p className="sx-lead">The story explains each idea as simply as it can. Here is where each one gets its full mathematical treatment — for when you want to know exactly why.</p>
        <p className="sx-p">
          <b>Coming later.</b> These are the planned topics. The story and practice already contain everything the exam needs from this chapter.
        </p>
      </div>
      <ol className="cx-deep">
        {TOPICS.map((t) => (
          <li key={t.title}>
            <div className="cx-deep-title">{t.title}</div>
            <div className="cx-deep-why">{t.why}</div>
            <div className="cx-deep-links">Builds on: {t.links}</div>
            <span className="cx-soon">Planned</span>
          </li>
        ))}
      </ol>
    </PageShell>
  );
}
