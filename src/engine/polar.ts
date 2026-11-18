/**
 * Chapter 4 engine: range–bearing radar, linearisation, σ-points and three non-linear filters.
 * Radar at the origin; bearing φ measured from the +x axis (counter-clockwise), radians.
 * Units: km, seconds. Small dense-matrix helpers (number[][]) so the 4D state works.
 */
import { M2, V2 } from './mat2';
import { mulberry32, randn } from './rng';

export type Mat = number[][];
export type Vec = number[];

/* ------------------------------------------------------------------ small matrix toolkit */
export const zeros = (n: number, m: number): Mat => Array.from({ length: n }, () => Array(m).fill(0));
export const eye = (n: number): Mat => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
export const tr = (A: Mat): Mat => A[0].map((_, j) => A.map((r) => r[j]));
export const mm = (A: Mat, B: Mat): Mat => A.map((r) => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)));
export const mv = (A: Mat, v: Vec): Vec => A.map((r) => r.reduce((s, a, k) => s + a * v[k], 0));
export const madd = (A: Mat, B: Mat, k = 1): Mat => A.map((r, i) => r.map((a, j) => a + k * B[i][j]));
export const vadd = (a: Vec, b: Vec, k = 1): Vec => a.map((x, i) => x + k * b[i]);
export const outer = (a: Vec, b: Vec): Mat => a.map((x) => b.map((y) => x * y));
export const scale = (A: Mat, k: number): Mat => A.map((r) => r.map((a) => a * k));
export function inv2(A: Mat): Mat {
  const d = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  return [
    [A[1][1] / d, -A[0][1] / d],
    [-A[1][0] / d, A[0][0] / d],
  ];
}
/** Cholesky factor L (lower), L Lᵀ = A. */
export function cholN(A: Mat): Mat {
  const n = A.length;
  const L = zeros(n, n);
  for (let i = 0; i < n; i++)
    for (let j = 0; j <= i; j++) {
      let s = A[i][j];
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      L[i][j] = i === j ? Math.sqrt(Math.max(s, 1e-12)) : s / L[j][j];
    }
  return L;
}
const sym = (A: Mat): Mat => A.map((r, i) => r.map((_, j) => 0.5 * (A[i][j] + A[j][i])));
export const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/* ------------------------------------------------------------------ the radar */
export const toCart = (r: number, phi: number): V2 => [r * Math.cos(phi), r * Math.sin(phi)];
export const toPolar = (x: number, y: number): V2 => [Math.hypot(x, y), Math.atan2(y, x)];

/** Jacobian of t(r, φ) = r(cos φ, sin φ): T = D_φ · diag(1, r) (rotation × dilation). */
export function jacT(r: number, phi: number): M2 {
  const c = Math.cos(phi), s = Math.sin(phi);
  return [
    [c, -r * s],
    [s, r * c],
  ];
}
/** Converted covariance T R Tᵀ = D_φ diag(σr², r²σφ²) D_φᵀ. */
export function convCov(r: number, phi: number, sr: number, sphi: number): M2 {
  const c = Math.cos(phi), s = Math.sin(phi);
  const a = sr * sr, b = r * r * sphi * sphi;
  return [
    [c * c * a + s * s * b, c * s * (a - b)],
    [c * s * (a - b), s * s * a + c * c * b],
  ];
}
/** Radar measurement Jacobian w.r.t. position (x, y): rows = ∂r, ∂φ. */
export function jacH(x: number, y: number): M2 {
  const r2 = x * x + y * y, r = Math.sqrt(r2);
  return [
    [x / r, y / r],
    [-y / r2, x / r2],
  ];
}

/* ------------------------------------------------------------------ σ-points (lecture recipe) */
/** 2n+1 points: x₀ = m (weight W⁰), x± = m ± columns of √(n/(1−W⁰)·P), weights (1−W⁰)/(2n). */
export function sigmaPoints(m: Vec, P: Mat, W0: number): { pts: Vec[]; w: number[] } {
  const n = m.length;
  const L = cholN(scale(P, n / (1 - W0)));
  const pts: Vec[] = [m.slice()];
  for (let i = 0; i < n; i++) pts.push(m.map((v, k) => v + L[k][i]));
  for (let i = 0; i < n; i++) pts.push(m.map((v, k) => v - L[k][i]));
  const w = [W0, ...Array(2 * n).fill((1 - W0) / (2 * n))];
  return { pts, w };
}
export function weightedMoments(pts: Vec[], w: number[]): { m: Vec; P: Mat } {
  const n = pts[0].length;
  const m = Array(n).fill(0);
  pts.forEach((p, i) => p.forEach((v, k) => (m[k] += w[i] * v)));
  let P = zeros(n, n);
  pts.forEach((p, i) => (P = madd(P, outer(vadd(p, m, -1), vadd(p, m, -1)), w[i])));
  return { m, P };
}
/** Unscented transform of a polar Gaussian into Cartesian. */
export function utPolar(rm: number, phim: number, sr: number, sphi: number, W0: number) {
  const { pts, w } = sigmaPoints([rm, phim], [[sr * sr, 0], [0, sphi * sphi]], W0);
  const cart = pts.map(([r, p]) => toCart(r, p) as Vec);
  const { m, P } = weightedMoments(cart, w);
  return { polarPts: pts as V2[], cartPts: cart as V2[], w, m: m as V2, P: P as M2 };
}
/** Monte-Carlo cloud of the true measurement density (the banana). */
export function bananaCloud(rm: number, phim: number, sr: number, sphi: number, n = 1500, seed = 3): V2[] {
  const rand = mulberry32(seed);
  return Array.from({ length: n }, () => toCart(rm + sr * randn(rand), phim + sphi * randn(rand)));
}
export function sampleMoments(pts: V2[]): { m: V2; P: M2 } {
  const { m, P } = weightedMoments(pts as Vec[], Array(pts.length).fill(1 / pts.length));
  return { m: m as V2, P: P as M2 };
}

/* ------------------------------------------------------------------ the approach (4D constant velocity) */
export interface G4 {
  x: Vec; // (x, y, ẋ, ẏ)
  P: Mat;
}
export const F4 = (dt: number): Mat => [
  [1, 0, dt, 0],
  [0, 1, 0, dt],
  [0, 0, 1, 0],
  [0, 0, 0, 1],
];
/** Piecewise constant white acceleration (Ch 3), per axis. */
export const D4 = (dt: number, s2: number): Mat => {
  const a = 0.25 * dt ** 4 * s2, b = 0.5 * dt ** 3 * s2, c = dt * dt * s2;
  return [
    [a, 0, b, 0],
    [0, a, 0, b],
    [b, 0, c, 0],
    [0, b, 0, c],
  ];
};
export function predict4(g: G4, dt: number, s2: number): G4 {
  const F = F4(dt);
  return { x: mv(F, g.x), P: madd(mm(mm(F, g.P), tr(F)), D4(dt, s2)) };
}
function kfUpd(g: G4, nu: Vec, H: Mat, R: Mat): G4 & { S: Mat } {
  const S = madd(mm(mm(H, g.P), tr(H)), R);
  const W = mm(mm(g.P, tr(H)), inv2(S));
  return { x: vadd(g.x, mv(W, nu)), P: sym(madd(g.P, mm(mm(W, S), tr(W)), -1)), S };
}
/** 1st possibility: convert the measurement, linear KF with H = (I, O), R′ = T R Tᵀ. */
export function updConverted(g: G4, z: V2, sr: number, sphi: number) {
  const zc = toCart(z[0], z[1]);
  const R = convCov(z[0], z[1], sr, sphi) as Mat;
  const H = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
  ];
  return kfUpd(g, [zc[0] - g.x[0], zc[1] - g.x[1]], H, R);
}
/** EKF: innovation through h itself, gain through the Jacobian at the prediction. */
export function updEKF(g: G4, z: V2, sr: number, sphi: number) {
  const [hr, hp] = toPolar(g.x[0], g.x[1]);
  const J = jacH(g.x[0], g.x[1]);
  const H = [
    [J[0][0], J[0][1], 0, 0],
    [J[1][0], J[1][1], 0, 0],
  ];
  return kfUpd(g, [z[0] - hr, wrap(z[1] - hp)], H, [[sr * sr, 0], [0, sphi * sphi]]);
}
/** UKF update (lecture L2 p.44): σ-points of the predicted density mapped through h. */
export function updUKF(g: G4, z: V2, sr: number, sphi: number, W0 = 1 / 3) {
  const { pts, w } = sigmaPoints(g.x, g.P, W0);
  const zs = pts.map((p) => toPolar(p[0], p[1]) as Vec);
  // mean bearing via unit vectors (avoids the ±π seam)
  let zr = 0, cs = 0, sn = 0;
  zs.forEach((q, i) => ((zr += w[i] * q[0]), (cs += w[i] * Math.cos(q[1])), (sn += w[i] * Math.sin(q[1]))));
  const zh = [zr, Math.atan2(sn, cs)];
  const dz = zs.map((q) => [q[0] - zh[0], wrap(q[1] - zh[1])]);
  let Szz = [[sr * sr, 0], [0, sphi * sphi]];
  let Pxz = zeros(4, 2);
  const xm = g.x;
  pts.forEach((p, i) => {
    Szz = madd(Szz, outer(dz[i], dz[i]), w[i]);
    Pxz = madd(Pxz, outer(vadd(p, xm, -1), dz[i]), w[i]);
  });
  const W = mm(Pxz, inv2(Szz));
  const nu = [z[0] - zh[0], wrap(z[1] - zh[1])];
  return { x: vadd(g.x, mv(W, nu)), P: sym(madd(g.P, mm(mm(W, Szz), tr(W)), -1)), S: Szz };
}

export type Method = 0 | 1 | 2; // converted, EKF, UKF
export const METHOD_NAMES = ['Converted KF', 'EKF', 'UKF'];
export const METHOD_COLORS = ['#3B82F6', '#F97316', '#A855F7'];

/**
 * The fog approach (km): the plane flies west at ~250 km/h on a downwind line 7 km north of the runway,
 * then makes a smooth S-turn onto the final-approach line y = 0 and flies to the threshold near the radar.
 */
export function approachTruth(steps: number, dt: number): V2[] {
  const v = 0.07;
  const out: V2[] = [];
  for (let k = 0; k < steps; k++) {
    const x = Math.max(24 - v * dt * k, 1.0);
    const u = Math.min(1, Math.max(0, (16 - x) / 9)); // 0 before the turn, 1 after
    const y = 7 * (0.5 + 0.5 * Math.cos(Math.PI * u));
    out.push([x, y]);
  }
  return out;
}

export interface ApproachRun {
  truth: V2[];
  z: V2[]; // polar measurements
  est: G4[][]; // [method][k] filtered
}
export function runApproach({ steps = 60, dt = 5, sr = 0.05, sphi = (1.5 * Math.PI) / 180, s2 = 1e-6, seed = 11, badStart = 0, W0 = 1 / 3 }: { steps?: number; dt?: number; sr?: number; sphi?: number; s2?: number; seed?: number; badStart?: number; W0?: number }): ApproachRun {
  const truth = approachTruth(steps, dt);
  const rand = mulberry32(seed);
  const z = truth.map(([x, y]) => {
    const [r, p] = toPolar(x, y);
    return [r + sr * randn(rand), p + sphi * randn(rand)] as V2;
  });
  // initialise from the first two converted measurements (Ch 3's two-point start), optionally biased
  const c0 = toCart(z[0][0], z[0][1]), c1 = toCart(z[1][0], z[1][1]);
  const R1 = convCov(z[1][0], z[1][1], sr, sphi);
  const x0: Vec = [c1[0], c1[1] + badStart, (c1[0] - c0[0]) / dt, (c1[1] - c0[1]) / dt];
  const P0: Mat = [
    [R1[0][0], R1[0][1], 0, 0],
    [R1[1][0], R1[1][1] + badStart * badStart * 0.05, 0, 0],
    [0, 0, (2 * R1[0][0]) / (dt * dt), 0],
    [0, 0, 0, (2 * R1[1][1]) / (dt * dt)],
  ];
  const est: G4[][] = [[], [], []];
  for (let m = 0; m < 3; m++) {
    let g: G4 = { x: x0, P: P0 };
    est[m][0] = g;
    est[m][1] = g;
    for (let k = 2; k < steps; k++) {
      const pr = predict4(g, dt, s2);
      const u = m === 0 ? updConverted(pr, z[k], sr, sphi) : m === 1 ? updEKF(pr, z[k], sr, sphi) : updUKF(pr, z[k], sr, sphi, W0);
      g = { x: u.x, P: u.P };
      est[m][k] = g;
    }
  }
  return { truth, z, est };
}
export const pos = (g: G4): V2 => [g.x[0], g.x[1]];
export const posCov = (g: G4): M2 => [
  [g.P[0][0], g.P[0][1]],
  [g.P[1][0], g.P[1][1]],
];

/* ------------------------------------------------------------------ TDoA (book §2.3.1) */
/** h_t(x) = |x − p₁| − |x − p₂|: the set of equal values is a hyperbola branch. */
export const tdoa = (x: V2, p1: V2, p2: V2) => Math.hypot(x[0] - p1[0], x[1] - p1[1]) - Math.hypot(x[0] - p2[0], x[1] - p2[1]);
