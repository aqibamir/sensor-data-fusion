import { ReactNode, useState } from 'react';
import { Tex } from './Tex';

export function Slider(props: {
  label: string; // TeX allowed
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  fmt?: (v: number) => string;
}) {
  const { label, value, min, max, step = (max - min) / 200, onChange, fmt = (v) => v.toFixed(2) } = props;
  return (
    <label className="slider">
      <span className="slider-label">
        <Tex tex={label} />
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
      <span className="slider-value">{fmt(value)}</span>
    </label>
  );
}

export function Button({ children, onClick, primary }: { children: ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button className={primary ? 'btn btn-primary' : 'btn'} onClick={onClick}>
      {children}
    </button>
  );
}

export function Controls({ children }: { children: ReactNode }) {
  return <div className="controls">{children}</div>;
}

/** A formula shown as a block, optionally with a caption. */
export function Formula({ tex, caption }: { tex: string; caption?: ReactNode }) {
  return (
    <div className="formula">
      <Tex tex={tex} block />
      {caption && <div className="formula-caption">{caption}</div>}
    </div>
  );
}

/**
 * A derivation revealed one step at a time. Each step names the rule it uses —
 * that rule name is exactly what you say out loud in the exam.
 */
export function Derivation({ steps }: { steps: { tex: string; why: ReactNode }[] }) {
  const [shown, setShown] = useState(1);
  return (
    <div className="derivation">
      {steps.slice(0, shown).map((s, i) => (
        <div className="deriv-step" key={i}>
          <div className="deriv-tex">
            <Tex tex={s.tex} block />
          </div>
          <div className="deriv-why">{s.why}</div>
        </div>
      ))}
      <div className="deriv-nav">
        {shown < steps.length ? (
          <Button onClick={() => setShown(shown + 1)}>Next step ({shown}/{steps.length})</Button>
        ) : (
          <span className="muted">Derivation complete.</span>
        )}
        {shown > 1 && <Button onClick={() => setShown(1)}>Restart</Button>}
      </div>
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <div className="note">{children}</div>;
}
