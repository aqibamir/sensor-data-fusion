import { ReactNode, useState } from 'react';
import { Tex } from '../ui/Tex';
import { progress, useProgress } from './progress';

/**
 * Practice blocks: the learner COMPUTES, the app checks.
 * Every exercise has: a short story-framed task, input fields checked against a tolerance,
 * hints revealed one at a time, and a worked solution. Results are stored locally, honestly:
 * solved without help / solved with hints / looked at the solution.
 */

export interface Field {
  label: ReactNode;
  answer: number;
  tol: number;
  unit?: string;
}

function parse(v: string): number | null {
  const t = v.trim().replace(',', '.').replace(/\s/g, '');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function Status({ id }: { id: string }) {
  const p = useProgress();
  const r = p.exercise[id];
  if (!r) return null;
  const text = r === 'clean' ? 'Solved without help' : r === 'solved' ? 'Solved with hints' : 'Solution viewed — try it again later';
  return <span className={`px-status px-${r}`}>{text}</span>;
}

export function Exercise({ id, n, title, task, fields, hints, solution, visual }: { id: string; n: number; title: string; task: ReactNode; fields: Field[]; hints: ReactNode[]; solution: ReactNode; visual?: ReactNode }) {
  const [vals, setVals] = useState<string[]>(fields.map(() => ''));
  const [checked, setChecked] = useState<(boolean | null)[]>(fields.map(() => null));
  const [shownHints, setShownHints] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showSol, setShowSol] = useState(false);
  const allOk = checked.every((c) => c === true);

  const check = () => {
    const res = fields.map((f, i) => {
      const v = parse(vals[i]);
      return v !== null && Math.abs(v - f.answer) <= f.tol;
    });
    setChecked(res);
    setAttempts((a) => a + 1);
    if (res.every(Boolean)) progress.recordExercise(id, shownHints === 0 && attempts === 0 && !showSol ? 'clean' : showSol ? 'revealed' : 'solved');
  };

  return (
    <section className="px-ex" id={id} aria-labelledby={`${id}-t`}>
      <header className="px-ex-head">
        <span className="px-ex-n">{n}</span>
        <h3 id={`${id}-t`}>{title}</h3>
        <Status id={id} />
      </header>
      <div className="px-task">{task}</div>
      {visual}
      <div className="px-fields">
        {fields.map((f, i) => (
          <label key={i} className={`px-field ${checked[i] === true ? 'ok' : checked[i] === false ? 'bad' : ''}`}>
            <span className="px-field-label">{f.label}</span>
            <span className="px-input-wrap">
              <input
                inputMode="decimal"
                value={vals[i]}
                onChange={(e) => {
                  const nv = [...vals];
                  nv[i] = e.target.value;
                  setVals(nv);
                  const nc = [...checked];
                  nc[i] = null;
                  setChecked(nc);
                }}
                onKeyDown={(e) => e.key === 'Enter' && check()}
                aria-invalid={checked[i] === false}
              />
              {f.unit && <span className="px-unit">{f.unit}</span>}
              <span className="px-mark" aria-live="polite">
                {checked[i] === true ? '✓' : checked[i] === false ? '✗' : ''}
              </span>
            </span>
          </label>
        ))}
      </div>
      <div className="px-actions">
        <button className="sx-btn sx-btn-dark" onClick={check}>
          Check
        </button>
        {shownHints < hints.length && !allOk && (
          <button className="sx-btn" onClick={() => setShownHints(shownHints + 1)}>
            {shownHints === 0 ? 'Give me a hint' : 'Another hint'} ({shownHints}/{hints.length})
          </button>
        )}
        {!showSol && (
          <button
            className="sx-link"
            onClick={() => {
              setShowSol(true);
              if (!allOk) progress.recordExercise(id, 'revealed');
            }}
          >
            Show worked solution
          </button>
        )}
      </div>
      {allOk && <div className="px-win">Correct. {shownHints === 0 && attempts <= 1 ? 'First try, no hints.' : 'Well worked out.'}</div>}
      {checked.some((c) => c === false) && <div className="px-miss">Not quite yet. Check the units and your arithmetic, or open a hint.</div>}
      {shownHints > 0 && (
        <ol className="px-hints">
          {hints.slice(0, shownHints).map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ol>
      )}
      {showSol && <div className="px-sol">{solution}</div>}
    </section>
  );
}

/** "Estimate by eye": drag a marker to where you think the answer is, then compare with the exact maths. */
export function PlaceExercise({
  id,
  n,
  title,
  task,
  range,
  answer,
  tol,
  unit,
  draw,
  explain,
}: {
  id: string;
  n: number;
  title: string;
  task: ReactNode;
  range: [number, number];
  answer: number;
  tol: number;
  unit: string;
  draw: (sx: (v: number) => number, guess: number | null, reveal: boolean) => ReactNode;
  explain: ReactNode;
}) {
  const [g, setG] = useState((range[0] + range[1]) / 2);
  const [locked, setLocked] = useState(false);
  const W = 640;
  const sx = (v: number) => 30 + ((v - range[0]) / (range[1] - range[0])) * (W - 60);
  const ok = Math.abs(g - answer) <= tol;
  return (
    <section className="px-ex" id={id} aria-labelledby={`${id}-t`}>
      <header className="px-ex-head">
        <span className="px-ex-n">{n}</span>
        <h3 id={`${id}-t`}>{title}</h3>
        <Status id={id} />
      </header>
      <div className="px-task">{task}</div>
      <svg className="px-svg" viewBox={`0 0 ${W} 200`} role="img" aria-label="Prior, likelihood and your guess">
        {draw(sx, g, locked)}
      </svg>
      <label className="px-field">
        <span className="px-field-label">Your guess</span>
        <input type="range" min={range[0]} max={range[1]} step={0.1} value={g} disabled={locked} onChange={(e) => setG(+e.target.value)} />
        <span className="px-unit">
          {g.toFixed(1)} {unit}
        </span>
      </label>
      <div className="px-actions">
        {!locked ? (
          <button
            className="sx-btn sx-btn-dark"
            onClick={() => {
              setLocked(true);
              progress.recordExercise(id, ok ? 'clean' : 'revealed');
            }}
          >
            Lock in my guess
          </button>
        ) : (
          <button className="sx-btn" onClick={() => setLocked(false)}>
            Try again
          </button>
        )}
      </div>
      {locked && (
        <>
          <div className={ok ? 'px-win' : 'px-miss'}>
            {ok ? `Within ${tol} ${unit} of the exact answer (${answer.toFixed(1)} ${unit}). Your intuition is calibrated.` : `The exact answer is ${answer.toFixed(1)} ${unit} — you were ${Math.abs(g - answer).toFixed(1)} ${unit} off.`}
          </div>
          <div className="px-sol">{explain}</div>
        </>
      )}
    </section>
  );
}

export const PM = ({ children }: { children: string }) => <Tex tex={children} />;
export const PMB = ({ children }: { children: string }) => <Tex tex={children} block />;
