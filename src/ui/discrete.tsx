import { C } from './theme';

/**
 * Discrete versions of the big ideas: a handful of possible positions ("cells"),
 * each with a probability. Easier to follow with a calculator than curves.
 */

const W = 640;

function Row({ y, h, label, color, vals, cells, fmt = (v: number) => v.toFixed(3), max }: { y: number; h: number; label: string; color: string; vals: number[]; cells: string[]; fmt?: (v: number) => string; max?: number }) {
  const n = vals.length;
  const left = 150;
  const cw = (W - left - 20) / n;
  const m = max ?? Math.max(...vals, 1e-9);
  return (
    <g>
      <text x={6} y={y + h / 2} fill={color} fontSize={17} fontWeight={600} dominantBaseline="middle">
        {label}
      </text>
      <line x1={left} x2={W - 20} y1={y + h} y2={y + h} stroke={C.axis} />
      {vals.map((v, i) => {
        const bh = (v / m) * (h - 22);
        return (
          <g key={i}>
            <rect x={left + i * cw + cw * 0.2} y={y + h - bh} width={cw * 0.6} height={bh} fill={color} opacity={0.85} rx={3} />
            <text x={left + i * cw + cw / 2} y={y + h - bh - 6} fill={C.text} fontSize={16} textAnchor="middle">
              {fmt(v)}
            </text>
            {cells[i] && (
              <text x={left + i * cw + cw / 2} y={y + h + 16} fill={C.muted} fontSize={14} textAnchor="middle">
                {cells[i]}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

/** prior → likelihood → prior × likelihood → posterior, each as a row of bars. */
export function BayesPipeline({ cells, prior, lik, labels }: { cells: string[]; prior: number[]; lik: number[]; labels?: { prior: string; lik: string } }) {
  const prod = prior.map((p, i) => p * lik[i]);
  const s = prod.reduce((a, b) => a + b, 0);
  const post = prod.map((v) => v / s);
  const rh = 140;
  return (
    <div className="bars">
      <svg viewBox={`0 0 ${W} ${4 * rh + 40}`}>
        <Row y={5} h={rh - 25} label={labels?.prior ?? 'prior'} color={C.pred} vals={prior} cells={cells} max={1} fmt={(v) => v.toFixed(2)} />
        <Row y={5 + rh} h={rh - 25} label={labels?.lik ?? 'likelihood'} color={C.meas} vals={lik} cells={cells} max={1} />
        <Row y={5 + 2 * rh} h={rh - 25} label="prior × likelihood" color={C.joint} vals={prod} cells={cells} />
        <Row y={5 + 3 * rh} h={rh - 25} label="posterior" color={C.post} vals={post} cells={cells} max={1} />
        <text x={W / 2} y={4 * rh + 32} fill={C.joint} fontSize={16} textAnchor="middle">
          sum of yellow row = {s.toFixed(4)} → divide every yellow bar by it → blue row
        </text>
      </svg>
    </div>
  );
}

const ORIGIN = ['#58C4DD', '#83C167', '#F4D35E', '#FF9F43', '#C77DFF', '#FC6255', '#5CD0B3', '#9aa7ff', '#e58fb8', '#b8e986', '#7fd1c7', '#f7a072'];

/**
 * Chapman–Kolmogorov with cells: next[j] = Σ_i T(j | i) prev[i].
 * Bars of the prediction are STACKED by the cell they came from.
 */
export function PredictPipeline({ prev, moves }: { prev: number[]; moves: { step: number; p: number }[] }) {
  const n = prev.length;
  const contrib = Array.from({ length: n }, () => new Array(n).fill(0)); // contrib[j][i]
  for (let i = 0; i < n; i++) for (const m of moves) if (i + m.step < n) contrib[i + m.step][i] += prev[i] * m.p;
  const next = contrib.map((r) => r.reduce((a, b) => a + b, 0));
  const left = 60;
  const cw = (W - left - 20) / n;
  const h = 170;
  const sc = h / 0.7;
  return (
    <div className="bars">
      <svg viewBox={`0 0 ${W} 470`}>
        <text x={10} y={22} fill={C.post} fontSize={16} fontWeight={600}>
          before: p(x_k-1 | Z^k-1)
        </text>
        {prev.map((v, i) => (
          <g key={i}>
            <rect x={left + i * cw + cw * 0.15} y={30 + h - v * sc} width={cw * 0.7} height={v * sc} fill={ORIGIN[i]} opacity={v > 0 ? 0.9 : 0} rx={3} />
            {v > 0 && (
              <text x={left + i * cw + cw / 2} y={30 + h - v * sc - 6} fill={C.text} fontSize={13} textAnchor="middle">
                {v.toFixed(2)}
              </text>
            )}
            <text x={left + i * cw + cw / 2} y={30 + h + 15} fill={C.muted} fontSize={12} textAnchor="middle">
              {i * 10} m
            </text>
          </g>
        ))}
        <line x1={left} x2={W - 20} y1={30 + h} y2={30 + h} stroke={C.axis} />
        <text x={10} y={250} fill={C.pred} fontSize={16} fontWeight={600}>
          after one second: p(x_k | Z^k-1)
        </text>
        {next.map((v, j) => {
          let acc = 0;
          return (
            <g key={j}>
              {contrib[j].map((c, i) => {
                if (c <= 0) return null;
                const y0 = 258 + h - (acc + c) * sc;
                acc += c;
                return <rect key={i} x={left + j * cw + cw * 0.15} y={y0} width={cw * 0.7} height={c * sc} fill={ORIGIN[i]} opacity={0.9} stroke={C.bg} strokeWidth={1} />;
              })}
              {v > 0.001 && (
                <text x={left + j * cw + cw / 2} y={258 + h - v * sc - 6} fill={C.text} fontSize={13} textAnchor="middle">
                  {v.toFixed(3)}
                </text>
              )}
              <text x={left + j * cw + cw / 2} y={258 + h + 15} fill={C.muted} fontSize={12} textAnchor="middle">
                {j * 10} m
              </text>
            </g>
          );
        })}
        <line x1={left} x2={W - 20} y1={258 + h} y2={258 + h} stroke={C.axis} />
      </svg>
    </div>
  );
}

export function predictCells(prev: number[], moves: { step: number; p: number }[]) {
  const next = new Array(prev.length).fill(0);
  for (let i = 0; i < prev.length; i++) for (const m of moves) if (i + m.step < prev.length) next[i + m.step] += prev[i] * m.p;
  return next;
}
