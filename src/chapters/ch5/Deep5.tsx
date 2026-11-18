import { PageShell } from '../../story/ChapterFrame';

const TOPICS = [
  { title: 'The fusion formula in matrix form', why: 'A full proof via the information form, and why stacking with block-diagonal R gives exactly Σ HᵀRₛ⁻¹H.', links: 'Scenes 2, 5' },
  { title: 'Tracklet fusion in full', why: 'Book eq. 6.8–6.15: from local tracks to the optimal fused track.', links: 'Scene 8' },
  { title: 'The distributed Kalman filter', why: 'Book §6.2: globalised prediction and retrodiction, arbitrary communication rates, and the simulated example of §6.3.', links: 'Scene 8' },
  { title: 'Unknown correlations: covariance intersection', why: 'What to do when you cannot know how correlated two tracks are (beyond the book and the lecture).', links: 'Scene 9' },
  { title: 'Dilution of precision', why: 'The geometric fusion gain as GPS engineers measure it.', links: 'Scene 4' },
  { title: 'De-ghosting', why: 'Strategies for bearing-only multi-target problems with missed and false reports.', links: 'Scene 7 · Ch 7–8' },
];

export default function Deep5({ onHome }: { onHome: () => void }) {
  return (
    <PageShell chapterId="ch5" chapterLabel="Chapter 5" view="deep" onHome={onHome}>
      <div className="cx-intro">
        <div className="sx-kicker">Chapter 5 · Deep dive</div>
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
