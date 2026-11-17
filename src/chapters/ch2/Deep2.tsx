import { PageShell } from '../../story/ChapterFrame';

const TOPICS: { title: string; why: string; links: string }[] = [
  { title: 'Markov chains and transition matrices', why: 'The table version of the dynamics model, made general: matrices whose columns sum to 1, steady states, and why they appear again in IMM.', links: 'Scenes 2–3 · Ch 9' },
  { title: 'Why the recursion is exact', why: 'A proof by induction that predict-then-filter gives exactly p(xₖ | 𝒵ᵏ) — no approximation, as long as the models are right.', links: 'Scenes 4, 7' },
  { title: 'Conditional independence, formally', why: 'What “given the state, the measurements are independent” really means, and how to check it in a model.', links: 'Scenes 2, 7' },
  { title: 'How computers run this loop for any shape', why: 'Grid filters (what the stage uses), particle filters, and why bells (Kalman) are so much cheaper.', links: 'Scene 9 · Ch 3' },
  { title: 'The steady state of the loop', why: 'Why the width settles, and how to compute the balance between q and R in closed form (the stationary Kalman filter).', links: 'Scene 9 · Ch 3' },
];

export default function Deep2({ onHome }: { onHome: () => void }) {
  return (
    <PageShell chapterId="ch2" chapterLabel="Chapter 2" view="deep" onHome={onHome}>
      <div className="cx-intro">
        <div className="sx-kicker">Chapter 2 · Deep dive</div>
        <h1 className="sx-h2">The mathematics underneath</h1>
        <p className="sx-lead">Where each idea of the voyage gets its full mathematical treatment.</p>
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
