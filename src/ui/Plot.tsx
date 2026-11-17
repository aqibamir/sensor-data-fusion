import { ReactNode } from 'react';
import { Tex } from './Tex';
import { C } from './theme';

export interface Series {
  xs: number[];
  ys: number[];
  color: string;
  fill?: boolean;
  dashed?: boolean;
  width?: number;
  label?: string; // TeX
}

/** Simple responsive SVG plot for flat 1D pictures. */
export function Plot(props: {
  x: [number, number];
  y: [number, number];
  series: Series[];
  /** Shade the area under series[shade.series] between a and b. */
  shade?: { series: number; a: number; b: number; color: string };
  vlines?: { x: number; color: string; label?: string; dashed?: boolean }[];
  points?: { x: number; y: number; color: string; r?: number }[];
  xLabel?: string;
  children?: (sx: (v: number) => number, sy: (v: number) => number) => ReactNode;
}) {
  const W = 800;
  const H = 460;
  const pad = { l: 50, r: 20, t: 20, b: 40 };
  const sx = (v: number) => pad.l + ((v - props.x[0]) / (props.x[1] - props.x[0])) * (W - pad.l - pad.r);
  const sy = (v: number) => H - pad.b - ((v - props.y[0]) / (props.y[1] - props.y[0])) * (H - pad.t - pad.b);
  const path = (xs: number[], ys: number[]) => xs.map((x, i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(Math.min(ys[i], props.y[1] * 1.5)).toFixed(1)}`).join('');
  const ticks = [];
  const step = niceStep(props.x[1] - props.x[0]);
  for (let t = Math.ceil(props.x[0] / step) * step; t <= props.x[1] + 1e-9; t += step) ticks.push(+t.toFixed(6));

  let shadePath = '';
  if (props.shade) {
    const s = props.series[props.shade.series];
    const idx = s.xs.map((x, i) => i).filter((i) => s.xs[i] >= props.shade!.a && s.xs[i] <= props.shade!.b);
    if (idx.length > 1) {
      shadePath = `M${sx(s.xs[idx[0]])},${sy(0)}` + idx.map((i) => `L${sx(s.xs[i])},${sy(s.ys[i])}`).join('') + `L${sx(s.xs[idx[idx.length - 1]])},${sy(0)}Z`;
    }
  }

  return (
    <div className="plot">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        <line x1={pad.l} x2={W - pad.r} y1={sy(0)} y2={sy(0)} stroke={C.axis} />
        {ticks.map((t) => (
          <g key={t}>
            <line x1={sx(t)} x2={sx(t)} y1={sy(0)} y2={sy(0) + 5} stroke={C.axis} />
            <text x={sx(t)} y={sy(0) + 20} fill={C.muted} fontSize={13} textAnchor="middle">
              {t}
            </text>
          </g>
        ))}
        {shadePath && <path d={shadePath} fill={props.shade!.color} opacity={0.35} />}
        {props.series.map((s, i) => (
          <g key={i}>
            {s.fill && <path d={path(s.xs, s.ys) + `L${sx(s.xs[s.xs.length - 1])},${sy(0)}L${sx(s.xs[0])},${sy(0)}Z`} fill={s.color} opacity={0.14} />}
            <path d={path(s.xs, s.ys)} fill="none" stroke={s.color} strokeWidth={s.width ?? 3} strokeDasharray={s.dashed ? '8 6' : undefined} />
          </g>
        ))}
        {props.vlines?.map((v, i) => (
          <line key={i} x1={sx(v.x)} x2={sx(v.x)} y1={sy(0)} y2={pad.t} stroke={v.color} strokeWidth={2} strokeDasharray={v.dashed ? '5 5' : undefined} />
        ))}
        {props.points?.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={p.r ?? 6} fill={p.color} />)}
        {props.children?.(sx, sy)}
      </svg>
      <div className="plot-legend">
        {props.series
          .filter((s) => s.label)
          .map((s, i) => (
            <span key={i} style={{ color: s.color }}>
              <span className="swatch" style={{ background: s.color }} /> <Tex tex={s.label!} />
            </span>
          ))}
        {props.vlines
          ?.filter((v) => v.label)
          .map((v, i) => (
            <span key={'v' + i} style={{ color: v.color }}>
              <span className="swatch" style={{ background: v.color }} /> <Tex tex={v.label!} />
            </span>
          ))}
      </div>
    </div>
  );
}

function niceStep(range: number) {
  const raw = range / 8;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}
