import { ReactNode, useState } from 'react';
import { isExplained, setExplained } from './progress';

export interface Card {
  id: string;
  q: ReactNode;
  a: ReactNode;
  /** Beat index that shows this idea. */
  beat?: number;
  /** Examiner-style follow-up to rehearse after the main answer. */
  followUp?: ReactNode;
}

function OneCard({ card, onGoto }: { card: Card; onGoto?: (beat: number) => void }) {
  const [stage, setStage] = useState<'ask' | 'think' | 'shown'>('ask');
  const [ok, setOk] = useState(isExplained(card.id));
  return (
    <div className={`card ${ok ? 'card-ok' : ''}`}>
      <div className="card-q">{card.q}</div>
      {stage === 'ask' && (
        <button className="btn" onClick={() => setStage('think')}>
          I'll answer out loud first →
        </button>
      )}
      {stage === 'think' && (
        <div className="card-think">
          <p className="muted">Say your answer out loud (or write it down) — as if the examiner just asked. Then compare.</p>
          <button className="btn btn-primary" onClick={() => setStage('shown')}>
            Show model answer
          </button>
        </div>
      )}
      {stage === 'shown' && (
        <div className="card-a">
          {card.a}
          {card.followUp && (
            <div className="card-follow">
              <b>Examiner follows up:</b> {card.followUp}
            </div>
          )}
          <div className="card-actions">
            {card.beat !== undefined && onGoto && (
              <button className="btn" onClick={() => onGoto(card.beat!)}>
                See it again
              </button>
            )}
            <label className="check">
              <input
                type="checkbox"
                checked={ok}
                onChange={(e) => {
                  setOk(e.target.checked);
                  setExplained(card.id, e.target.checked);
                }}
              />
              I can explain this
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export function ExplainCards({ cards, onGoto }: { cards: Card[]; onGoto?: (beat: number) => void }) {
  return (
    <div className="cards">
      {cards.map((c) => (
        <OneCard key={c.id} card={c} onGoto={onGoto} />
      ))}
    </div>
  );
}
