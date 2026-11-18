import { PageShell } from '../../story/ChapterFrame';

const TOPICS = [
  { title: 'The product formula in matrix form', why: 'The full proof with matrices, via the matrix inversion lemma — and why the three covariance forms are equal.', links: 'Scene 2' },
  { title: 'The Joseph form and numerical safety', why: 'Why computers sometimes use (I − WH)P(I − WH)ᵀ + WRWᵀ to keep P symmetric and positive.', links: 'Scene 5' },
  { title: 'The information filter', why: 'Running the filter on P⁻¹ instead of P — and why it makes fusing many sensors easy.', links: 'Scenes 2, 5 · Ch 5' },
  { title: 'Kalman as least squares', why: 'The same answer from minimising a sum of weighted squared errors — no probability needed.', links: 'Scene 8' },
  { title: 'The steady-state Riccati equation', why: 'Where the gain settles, in closed form — Chapter 2’s steady width in matrix form.', links: 'Scene 7' },
  { title: 'History: Kálmán, Schmidt and Apollo', why: 'How a 1960 paper became the navigation of the Moon missions.', links: 'Prologue' },
];

export default function Deep3({ onHome }: { onHome: () => void }) {
  return (
    <PageShell chapterId="ch3" chapterLabel="Chapter 3" view="deep" onHome={onHome}>
      <div className="cx-intro">
        <div className="sx-kicker">Chapter 3 · Deep dive</div>
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
