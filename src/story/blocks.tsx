import { ReactNode, useContext, useEffect, useState } from 'react';
import { Tex } from '../ui/Tex';
import { progress, useProgress } from './progress';
import { StepCtx, useHighlight, useRegister } from './StoryShell';

/** Prose building blocks for story chapters. Minimal: a label, a thin rule, generous space. */

export const Lead = ({ children }: { children: ReactNode }) => <p className="sx-lead">{children}</p>;
export const P = ({ children }: { children: ReactNode }) => <p className="sx-p">{children}</p>;
export const H3 = ({ children }: { children: ReactNode }) => <h3 className="sx-h3">{children}</h3>;

export function Ask({ q, children }: { q: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sx-block sx-ask">
      <div className="sx-label">Before you look — guess</div>
      <div className="sx-ask-q">{q}</div>
      {open ? (
        <div className="sx-reveal">{children}</div>
      ) : (
        <button className="sx-btn" onClick={() => setOpen(true)}>
          I have a guess. Show me.
        </button>
      )}
    </div>
  );
}

export const Rule = ({ children }: { children: ReactNode }) => (
  <div className="sx-block sx-rule">
    <div className="sx-label">The idea</div>
    <div className="sx-rule-text">{children}</div>
  </div>
);

/**
 * A formula with its symbols explained underneath.
 * Each symbol row can carry a world key — hovering the row lights up that object in 3D.
 */
export function Formula({ tex, rows, note }: { tex: string; rows?: [string, ReactNode, string?][]; note?: ReactNode }) {
  const { hl, setHl } = useHighlight();
  const linked = rows?.some((r) => r[2]);
  return (
    <div className="sx-block sx-formula">
      <div className="sx-formula-tex">
        <Tex tex={tex} block />
      </div>
      {rows && (
        <dl className="sx-symbols">
          {rows.map(([s, m, key], i) => (
            <div
              key={i}
              className={`sx-sym ${key ? 'has-key' : ''} ${key && hl === key ? 'on' : ''}`}
              onMouseEnter={() => key && setHl(key)}
              onMouseLeave={() => key && setHl(null)}
              onFocus={() => key && setHl(key)}
              onBlur={() => key && setHl(null)}
              tabIndex={key ? 0 : undefined}
            >
              <dt>
                <Tex tex={s} />
              </dt>
              <dd>{m}</dd>
            </div>
          ))}
        </dl>
      )}
      {linked && <div className="sx-formula-hint">Point at (or Tab to) a row marked ◎ and its object lights up in the 3D scene.</div>}
      {note && <div className="sx-formula-note">{note}</div>}
    </div>
  );
}

export const InOtherWords = ({ children }: { children: ReactNode }) => (
  <p className="sx-iow">
    <span className="sx-iow-tag">In other words</span> {children}
  </p>
);

export const Example = ({ title = 'Work it out', children }: { title?: string; children: ReactNode }) => (
  <div className="sx-block sx-example">
    <div className="sx-label">{title}</div>
    {children}
  </div>
);

export const Ahead = ({ children }: { children: ReactNode }) => (
  <div className="sx-block sx-ahead">
    <div className="sx-label">Where this comes back</div>
    {children}
  </div>
);

export const Trap = ({ children }: { children: ReactNode }) => (
  <div className="sx-block sx-trap">
    <div className="sx-label">Careful</div>
    {children}
  </div>
);

export function Quiz({ id, label, q, options }: { id: string; label: string; q: ReactNode; options: { t: ReactNode; ok?: boolean; why: ReactNode }[] }) {
  const [pick, setPick] = useState<number | null>(null);
  const step = useContext(StepCtx);
  const register = useRegister();
  const p = useProgress();
  useEffect(() => register({ id, kind: 'quiz', label, step }), [id, label, step, register]);
  const past = p.quiz[id];
  return (
    <div className="sx-block sx-quiz">
      <div className="sx-label">Check yourself</div>
      <div className="sx-quiz-q">{q}</div>
      <div className="sx-quiz-opts">
        {options.map((o, i) => (
          <button
            key={i}
            className={`sx-opt ${pick === i ? (o.ok ? 'ok' : 'bad') : ''} ${pick !== null && o.ok ? 'is-answer' : ''}`}
            aria-pressed={pick === i}
            onClick={() => {
              setPick(i);
              progress.recordQuiz(id, !!o.ok);
            }}
          >
            <span className="sx-opt-letter">{String.fromCharCode(65 + i)}</span>
            <span>{o.t}</span>
          </button>
        ))}
      </div>
      {pick !== null && (
        <div className={`sx-quiz-why ${options[pick].ok ? 'ok' : 'bad'}`} role="status">
          {options[pick].why}
        </div>
      )}
      {pick === null && past && <div className="sx-quiz-past">Last time: {past === 'first-try' ? 'right on the first try' : 'missed on the first try'}. Answer again any time.</div>}
    </div>
  );
}

/**
 * Explain-it-back: answer OUT LOUD first, then open the model answer, then rate yourself honestly.
 * The rating only feeds the Revise panel — it is information for you, not a score.
 */
export function ExplainBack({ id, q, children }: { id: string; q: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const step = useContext(StepCtx);
  const register = useRegister();
  const p = useProgress();
  useEffect(() => register({ id, kind: 'explain', label: q, step }), [id, q, step, register]);
  const r = p.explain[id];
  return (
    <div className="sx-block sx-ask sx-explain">
      <div className="sx-label">Explain it back — out loud first</div>
      <div className="sx-ask-q">{q}</div>
      {open ? (
        <>
          <div className="sx-reveal">{children}</div>
          <div className="sx-rate">
            <span>Could you have said that without looking?</span>
            <button className={`sx-btn ${r === 'yes' ? 'sx-btn-ok' : ''}`} aria-pressed={r === 'yes'} onClick={() => progress.rateExplain(id, 'yes')}>
              Yes
            </button>
            <button className={`sx-btn ${r === 'not-yet' ? 'sx-btn-todo' : ''}`} aria-pressed={r === 'not-yet'} onClick={() => progress.rateExplain(id, 'not-yet')}>
              Not yet
            </button>
          </div>
        </>
      ) : (
        <div className="sx-rate">
          <button className="sx-btn" onClick={() => setOpen(true)}>
            I said my answer. Show the model answer.
          </button>
          {r && <span className="sx-muted">Last time: {r === 'yes' ? 'you could explain it' : 'not yet'}</span>}
        </div>
      )}
    </div>
  );
}

/** Inline slider that lives inside the sentence explaining it. */
export function Knob({ label, value, min, max, step, onChange, fmt = (v: number) => v.toFixed(1), unit = '' }: { label: ReactNode; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; fmt?: (v: number) => string; unit?: string }) {
  return (
    <label className="sx-knob">
      <span className="sx-knob-label">{label}</span>
      <input type="range" min={min} max={max} step={step ?? (max - min) / 200} value={value} onChange={(e) => onChange(+e.target.value)} />
      <span className="sx-knob-val">
        {fmt(value)}
        {unit}
      </span>
    </label>
  );
}

export function Toggle({ options, value, onChange }: { options: string[]; value: number; onChange: (i: number) => void }) {
  return (
    <div className="sx-toggle" role="tablist">
      {options.map((o, i) => (
        <button key={o} className={i === value ? 'on' : ''} aria-pressed={i === value} onClick={() => onChange(i)}>
          {o}
        </button>
      ))}
    </div>
  );
}

export const Controls = ({ children }: { children: ReactNode }) => <div className="sx-controls">{children}</div>;

export function Readout({ children }: { children: ReactNode }) {
  return <div className="sx-readout">{children}</div>;
}

export function Table({ head, rows, hlCol }: { head: ReactNode[]; rows: ReactNode[][]; hlCol?: number }) {
  return (
    <div className="sx-table-wrap">
      <table className="sx-table">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} className={i === hlCol ? 'hl' : ''}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className={j === hlCol ? 'hl' : ''}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Inline maths. */
export const M = ({ children }: { children: string }) => <Tex tex={children} />;

/** A named quantity, coloured like its 3D object. */
export const Q = ({ c, children }: { c: 'truth' | 'meas' | 'belief' | 'prior' | 'sand' | 'post'; children: ReactNode }) => <span className={`sx-q sx-q-${c}`}>{children}</span>;

export function Derive({ steps }: { steps: { tex: string; why: ReactNode }[] }) {
  const [n, setN] = useState(1);
  return (
    <div className="sx-block sx-derive">
      <div className="sx-label">Derivation, one move at a time</div>
      <ol>
        {steps.slice(0, n).map((s, i) => (
          <li key={i}>
            <Tex tex={s.tex} block />
            <div className="sx-derive-why">{s.why}</div>
          </li>
        ))}
      </ol>
      {n < steps.length ? (
        <button className="sx-btn" onClick={() => setN(n + 1)}>
          Next move ({n}/{steps.length})
        </button>
      ) : (
        <span className="sx-muted">That's the whole derivation.</span>
      )}
    </div>
  );
}
