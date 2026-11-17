import { ReactNode, useState } from 'react';
import { Tex } from './Tex';

/**
 * Building blocks for the teaching text. Every beat is written with the same rhythm:
 * question → everyday example → plain idea → formula + symbols → worked numbers →
 * where it comes back → common confusion → quick check.
 */

export function Question({ children }: { children: ReactNode }) {
  return (
    <div className="lb lb-question">
      <div className="lb-tag">The question</div>
      {children}
    </div>
  );
}

export function Everyday({ title = 'Everyday example', children }: { title?: string; children: ReactNode }) {
  return (
    <div className="lb lb-everyday">
      <div className="lb-tag">{title}</div>
      {children}
    </div>
  );
}

export function Idea({ children }: { children: ReactNode }) {
  return (
    <div className="lb lb-idea">
      <div className="lb-tag">The idea in one sentence</div>
      <div className="lb-idea-text">{children}</div>
    </div>
  );
}

/** Formula with a symbol table underneath: every symbol gets a plain-language meaning. */
export function FormulaExplained({ tex, symbols, children }: { tex: string; symbols: [string, ReactNode][]; children?: ReactNode }) {
  return (
    <div className="lb lb-formula">
      <div className="lb-tag">The formula</div>
      <Tex tex={tex} block />
      {children}
      <table className="symbols">
        <tbody>
          {symbols.map(([s, m], i) => (
            <tr key={i}>
              <td className="sym">
                <Tex tex={s} />
              </td>
              <td>{m}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Worked({ title = 'Worked example', children }: { title?: string; children: ReactNode }) {
  return (
    <div className="lb lb-worked">
      <div className="lb-tag">{title}</div>
      {children}
    </div>
  );
}

export function Connect({ children }: { children: ReactNode }) {
  return (
    <div className="lb lb-connect">
      <div className="lb-tag">Where this comes back</div>
      {children}
    </div>
  );
}

export function Pitfall({ children }: { children: ReactNode }) {
  return (
    <div className="lb lb-pitfall">
      <div className="lb-tag">Common confusion</div>
      {children}
    </div>
  );
}

export function TryIt({ children }: { children: ReactNode }) {
  return (
    <div className="lb lb-try">
      <div className="lb-tag">Try it in the picture</div>
      {children}
    </div>
  );
}

/** Multiple-choice check with an explanation for every option. */
export function Check({ q, options }: { q: ReactNode; options: { text: ReactNode; correct?: boolean; why: ReactNode }[] }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="lb lb-check">
      <div className="lb-tag">Quick check</div>
      <div className="check-q">{q}</div>
      <div className="check-opts">
        {options.map((o, i) => (
          <button
            key={i}
            className={`check-opt ${picked === i ? (o.correct ? 'right' : 'wrong') : ''} ${picked !== null && o.correct ? 'reveal' : ''}`}
            onClick={() => setPicked(i)}
          >
            {o.text}
          </button>
        ))}
      </div>
      {picked !== null && (
        <div className={`check-why ${options[picked].correct ? 'right' : 'wrong'}`}>
          <b>{options[picked].correct ? 'Correct. ' : 'Not quite. '}</b>
          {options[picked].why}
        </div>
      )}
    </div>
  );
}

/** Lewin-style: make a guess BEFORE the demo, then reveal what actually happens. */
export function Predict({ q, answer }: { q: ReactNode; answer: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lb lb-predict">
      <div className="lb-tag">Predict first — then look</div>
      <div className="check-q">{q}</div>
      {!open ? (
        <button className="btn" onClick={() => setOpen(true)}>
          I've made my guess — show me
        </button>
      ) : (
        <div className="predict-a">{answer}</div>
      )}
    </div>
  );
}

/** The narrator's voice: short, punchy, enthusiastic. */
export function Say({ children }: { children: ReactNode }) {
  return <div className="say">{children}</div>;
}

/** A small numeric table, e.g. for discrete probabilities. */
export function NumTable({ head, rows, highlightCol }: { head: ReactNode[]; rows: ReactNode[][]; highlightCol?: number }) {
  return (
    <table className="numtable">
      <thead>
        <tr>
          {head.map((h, i) => (
            <th key={i} className={i === highlightCol ? 'hl' : ''}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j} className={j === highlightCol ? 'hl' : ''}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Opening card of a chapter: why it exists and what it needs. */
export function ChapterIntro({ why, needs, learn }: { why: ReactNode; needs: ReactNode; learn: ReactNode[] }) {
  return (
    <>
      <div className="lb lb-question">
        <div className="lb-tag">Why this chapter exists</div>
        {why}
      </div>
      <div className="lb lb-connect">
        <div className="lb-tag">What you need from before</div>
        {needs}
      </div>
      <div className="lb lb-idea">
        <div className="lb-tag">By the end you can explain</div>
        <ol className="learn-list">
          {learn.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ol>
      </div>
    </>
  );
}
