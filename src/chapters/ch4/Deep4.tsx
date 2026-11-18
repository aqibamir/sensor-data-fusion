import { PageShell } from '../../story/ChapterFrame';

const TOPICS = [
  { title: 'Unbiased converted measurements', why: 'Why the mean of r cos φ is not r̂ cos φ̂, and how to correct the bias (book §2.3.1 reference).', links: 'Scene 4' },
  { title: 'Why the UKF gets the mean right to second order', why: 'A Taylor argument: the σ-points match the first two moments, so curvature terms cancel correctly.', links: 'Scenes 6–8' },
  { title: 'Scaled σ-points (α, β, κ)', why: 'The common general family, and how the lecture’s single W⁰ fits into it.', links: 'Scene 7' },
  { title: 'Iterated EKF', why: 'Re-linearising at the updated estimate to reduce the bad-linearisation-point problem.', links: 'Scene 5' },
  { title: 'The rotated-frame Doppler trick', why: 'The book’s robust alternative to Taylor expansion for range-rate, worked out.', links: 'Scene 5' },
  { title: 'Gaussian mixtures and a minimal particle filter', why: 'Representing the TDoA hyperbola and the banana exactly enough.', links: 'Scene 10 · Ch 8–9' },
];

export default function Deep4({ onHome }: { onHome: () => void }) {
  return (
    <PageShell chapterId="ch4" chapterLabel="Chapter 4" view="deep" onHome={onHome}>
      <div className="cx-intro">
        <div className="sx-kicker">Chapter 4 · Deep dive</div>
        <h1 className="sx-h2">The mathematics underneath</h1>
        <p className="sx-p">
          <b>Coming later.</b> Planned topics; the story and practice already contain everything the exam needs.
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
