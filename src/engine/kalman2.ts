import { M2, V2 } from './mat2';
import { mulberry32, randn } from './rng';

/**
 * Kalman filter for the state (position r, speed ṙ) with a range-only sensor, H = (1, 0).
 * Piecewise constant white acceleration model (Lecture 2 p.20):
 *   F = [[1, Δt], [0, 1]],  D = σ² [[Δt⁴/4, Δt³/2], [Δt³/2, Δt²]]
 */
export interface Gauss2 {
  x: V2;
  P: M2;
}

export const Fm = (dt: number): M2 => [
  [1, dt],
  [0, 1],
];
export const Dm = (dt: number, s2: number): M2 => [
  [(s2 * dt ** 4) / 4, (s2 * dt ** 3) / 2],
  [(s2 * dt ** 3) / 2, s2 * dt ** 2],
];

/** Prediction: x_{k|k-1} = F x, P_{k|k-1} = F P Fᵀ + D. */
export function kfPredict(g: Gauss2, dt: number, s2: number): Gauss2 {
  const [r, v] = g.x;
  const [[a, b], [, d]] = g.P;
  const D = Dm(dt, s2);
  // F P Fᵀ for F = [[1, dt],[0,1]]
  const p00 = a + 2 * dt * b + dt * dt * d;
  const p01 = b + dt * d;
  return {
    x: [r + dt * v, v],
    P: [
      [p00 + D[0][0], p01 + D[0][1]],
      [p01 + D[1][0], d + D[1][1]],
    ],
  };
}

export interface UpdateInfo extends Gauss2 {
  nu: number; // innovation ν = z − H x
  S: number; // innovation variance H P Hᵀ + R
  W: V2; // gain P Hᵀ S⁻¹
}

/** Filtering with H = (1, 0): ν, S, W, x + Wν, P − W S Wᵀ. */
export function kfUpdate(g: Gauss2, z: number, R: number): UpdateInfo {
  const [[a, b], [, d]] = g.P;
  const S = a + R;
  const W: V2 = [a / S, b / S];
  const nu = z - g.x[0];
  return {
    x: [g.x[0] + W[0] * nu, g.x[1] + W[1] * nu],
    P: [
      [a - W[0] * W[0] * S, b - W[0] * W[1] * S],
      [b - W[1] * W[0] * S, d - W[1] * W[1] * S],
    ],
    nu,
    S,
    W,
  };
}

const inv2 = (P: M2): M2 => {
  const det = P[0][0] * P[1][1] - P[0][1] * P[1][0];
  return [
    [P[1][1] / det, -P[0][1] / det],
    [-P[1][0] / det, P[0][0] / det],
  ];
};
const mm = (A: M2, B: M2): M2 => [
  [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
  [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
];
const tr = (A: M2): M2 => [
  [A[0][0], A[1][0]],
  [A[0][1], A[1][1]],
];

/**
 * Rauch–Tung–Striebel retrodiction (Lecture 2 p.29):
 *   W_l = P_{l|l} Fᵀ P_{l+1|l}⁻¹
 *   x_{l|k} = x_{l|l} + W_l (x_{l+1|k} − x_{l+1|l})
 *   P_{l|k} = P_{l|l} + W_l (P_{l+1|k} − P_{l+1|l}) W_lᵀ
 */
export function rts(filt: Gauss2[], pred: Gauss2[], dts: number[]): Gauss2[] {
  const k = filt.length - 1;
  const out: Gauss2[] = new Array(k + 1);
  out[k] = filt[k];
  for (let l = k - 1; l >= 0; l--) {
    const W = mm(mm(filt[l].P, tr(Fm(dts[l + 1]))), inv2(pred[l + 1].P));
    const dx: V2 = [out[l + 1].x[0] - pred[l + 1].x[0], out[l + 1].x[1] - pred[l + 1].x[1]];
    const dP: M2 = [
      [out[l + 1].P[0][0] - pred[l + 1].P[0][0], out[l + 1].P[0][1] - pred[l + 1].P[0][1]],
      [out[l + 1].P[1][0] - pred[l + 1].P[1][0], out[l + 1].P[1][1] - pred[l + 1].P[1][1]],
    ];
    const corr = mm(mm(W, dP), tr(W));
    out[l] = {
      x: [filt[l].x[0] + W[0][0] * dx[0] + W[0][1] * dx[1], filt[l].x[1] + W[1][0] * dx[0] + W[1][1] * dx[1]],
      P: [
        [filt[l].P[0][0] + corr[0][0], filt[l].P[0][1] + corr[0][1]],
        [filt[l].P[1][0] + corr[1][0], filt[l].P[1][1] + corr[1][1]],
      ],
    };
  }
  return out;
}

/* -------------------------------------------------------- the coast simulation */

export interface Coast {
  truth: V2[];
  z: number[];
  pred: Gauss2[];
  filt: Gauss2[];
  info: (UpdateInfo | null)[];
  smooth: Gauss2[];
  dts: number[];
}

/**
 * Trans-lunar coast in units of 1000 km and hours. Measurements every Δt hours.
 * The truth gets random accelerations with variance s2True; optionally a burn (mid-course correction) at step `burnAt`.
 * The filter assumes variance s2Filter (it may be mistuned).
 */
export function coast(opts: { seed: number; steps: number; dt: number; R: number; s2True: number; s2Filter: number; burnAt?: number; burn?: number; x0?: Gauss2 }): Coast {
  const { seed, steps, dt, R, s2True, s2Filter, burnAt = -1, burn = 0 } = opts;
  const rand = mulberry32(seed);
  const truth: V2[] = [[100, 4]];
  for (let k = 1; k <= steps; k++) {
    const a = Math.sqrt(s2True) * randn(rand) + (k === burnAt ? burn : 0);
    const [r, v] = truth[k - 1];
    truth.push([r + v * dt + 0.5 * a * dt * dt, v + a * dt]);
  }
  const z = truth.map(([r]) => r + Math.sqrt(R) * randn(rand));
  const start: Gauss2 = opts.x0 ?? { x: [z[0], 3.5], P: [[R, 0], [0, 1]] };
  const filt: Gauss2[] = [start];
  const pred: Gauss2[] = [start];
  const info: (UpdateInfo | null)[] = [null];
  const dts = [0];
  for (let k = 1; k <= steps; k++) {
    const p = kfPredict(filt[k - 1], dt, s2Filter);
    pred.push(p);
    const u = kfUpdate(p, z[k], R);
    info.push(u);
    filt.push({ x: u.x, P: u.P });
    dts.push(dt);
  }
  return { truth, z, pred, filt, info, smooth: rts(filt, pred, dts), dts };
}
