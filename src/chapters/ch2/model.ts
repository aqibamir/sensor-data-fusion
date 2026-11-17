import { Grid, makeGrid, mixtureOnGrid, predict, retrodict, update } from '../../engine/grid';
import { mulberry32, randn } from '../../engine/rng';

/** All slider/toggle state of Chapter 2. Units: nautical miles (nm), hours. */
export interface Params2 {
  u: number; // usual progress per hour (nm)
  q: number; // randomness of one hour's sailing (variance, nm²)
  two: number; // start belief: 0 = one bump, 1 = two harbours
  mult: number;
  integ: number;
  fogHours: number;
  zc: number; // sighting (nm) in the table example
  rc: number; // sighting error σ (nm) in the table example
  fz: number;
  fR: number;
  fRen: number;
  ez: number; // expected-measurement scene: reading (nm)
  r: number; // voyage: sighting variance (nm²)
  qv: number; // voyage: sailing variance (nm²)
  seed: number;
  k: number; // voyage: hours shown
  retro: number;
  l: number;
}

export const DEFAULTS2: Params2 = {
  u: 10,
  q: 9,
  two: 0,
  mult: 0,
  integ: 0,
  fogHours: 1,
  zc: 52,
  rc: 10,
  fz: 0.9,
  fR: 0.5,
  fRen: 0,
  ez: 46,
  r: 16,
  qv: 9,
  seed: 3,
  k: 0,
  retro: 0,
  l: 0,
};

/* -------------------------------------------------------- the voyage simulation (exact grid Bayes) */

export const G2: Grid = makeGrid(-10, 130, 421);
export const HOURS = 10;

export interface Voyage {
  truth: number[];
  z: number[];
  pred: number[][];
  filt: number[][];
  retro: number[][];
}

/** Start belief: we're not sure which of two harbours we left (5 nm or 25 nm). */
export const startBelief = () =>
  mixtureOnGrid(G2, [
    { w: 0.55, m: 5, s2: 4 },
    { w: 0.45, m: 25, s2: 6 },
  ]);

export function sail(seed: number, u: number, q: number, r: number): Voyage {
  const rand = mulberry32(seed);
  const truth = [5];
  for (let k = 1; k <= HOURS; k++) truth.push(truth[k - 1] + u + Math.sqrt(q) * randn(rand) * 0.7);
  const z = truth.map((x) => x + Math.sqrt(r) * randn(rand));
  const filt = [startBelief()];
  const pred: number[][] = [filt[0]];
  for (let k = 1; k <= HOURS; k++) {
    const p = predict(G2, filt[k - 1], u, q);
    pred.push(p);
    filt.push(update(G2, p, z[k], r).post);
  }
  return { truth, z, pred, filt, retro: retrodict(G2, filt, pred, u, q) };
}

/* -------------------------------------------------------- the 10-nm cell examples */

export const MOVES = [
  { step: 1, p: 0.25 },
  { step: 2, p: 0.5 },
  { step: 3, p: 0.25 },
];
export const PREV_ONE = [0, 0.2, 0.6, 0.2, 0, 0, 0, 0, 0, 0];
export const PREV_TWO = [0.5, 0, 0, 0, 0.5, 0, 0, 0, 0, 0];

export function predictCells(prev: number[]) {
  const next = new Array(prev.length).fill(0);
  const from: number[][] = prev.map(() => new Array(prev.length).fill(0)); // from[j][i]: share of next[j] that came from i
  prev.forEach((p, i) =>
    MOVES.forEach((m) => {
      if (i + m.step < prev.length) {
        next[i + m.step] += p * m.p;
        from[i + m.step][i] += p * m.p;
      }
    }),
  );
  return { next, from };
}

export function filterCells(prior: number[], cells: number[], z: number, sigma: number) {
  const lik = cells.map((c) => Math.exp(-0.5 * ((z - c) / sigma) ** 2));
  const prod = prior.map((p, i) => p * lik[i]);
  const sum = prod.reduce((a, b) => a + b, 0);
  return { lik, prod, sum, post: prod.map((v) => v / sum) };
}
