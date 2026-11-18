/**
 * Chapter 5 engine: the Fusion Equation, bearing-only towers, ghosts, cumulative detection, tracklets,
 * and a two-tower fire tracker. Plan coordinates in km; bearings in radians from the +x axis.
 */
import { add, inv, M2, mulV, V2 } from './mat2';
import { G4, madd, mm, predict4, tr, vadd } from './polar';
import { mulberry32, randn } from './rng';

/* ------------------------------------------------------------------ the Fusion Equation */
/** Fuse n measurements of the same H·x: R = (Σ Rᵢ⁻¹)⁻¹, z = R Σ Rᵢ⁻¹ zᵢ (book eq. 2.27–2.28). */
export function fuse(zs: V2[], Rs: M2[]): { z: V2; R: M2 } {
  const Ys = Rs.map(inv);
  const ys = zs.map((z, i) => mulV(Ys[i], z));
  return fuseInfo(Ys, ys);
}
/** Same in information form (Y = R⁻¹, y = R⁻¹z): works even when one Yᵢ is singular (a bearing line). */
export function fuseInfo(Ys: M2[], ys: V2[]): { z: V2; R: M2; Y: M2 } {
  let Y: M2 = [
    [0, 0],
    [0, 0],
  ];
  let y: V2 = [0, 0];
  Ys.forEach((Yi, i) => {
    Y = add(Y, Yi);
    y = [y[0] + ys[i][0], y[1] + ys[i][1]];
  });
  const R = inv(Y);
  return { z: mulV(R, y), R, Y };
}
/** 1D version, for the story's worked numbers. */
export function fuse1(zs: number[], s2: number[]): { z: number; s2: number; w: number[] } {
  const info = s2.reduce((a, v) => a + 1 / v, 0);
  const R = 1 / info;
  return { z: R * zs.reduce((a, z, i) => a + z / s2[i], 0), s2: R, w: s2.map((v) => R / v) };
}

/* ------------------------------------------------------------------ bearing-only towers */
export interface Tower {
  name: string;
  p: V2;
  sphi: number; // bearing error, radians
}
export const bearing = (from: V2, to: V2) => Math.atan2(to[1] - from[1], to[0] - from[0]);
/**
 * A bearing as a Gaussian line: zero information along the line, 1/(d·σφ)² across it,
 * where d is the distance at which it is linearised (book §2.3.2, limit σr ≫ r σφ).
 */
export function bearingInfo(t: Tower, phi: number, d: number): { Y: M2; y: V2 } {
  const nx = -Math.sin(phi), ny = Math.cos(phi); // unit normal to the line
  const k = 1 / (d * t.sphi) ** 2;
  const Y: M2 = [
    [k * nx * nx, k * nx * ny],
    [k * nx * ny, k * ny * ny],
  ];
  return { Y, y: mulV(Y, t.p) }; // the line passes through the tower position
}
/** A range–bearing style ellipse for a tower with a (large) range error: the book's thin-wedge picture. */
export function wedgeCov(d: number, phi: number, sAlong: number, sphi: number): M2 {
  const c = Math.cos(phi), s = Math.sin(phi);
  const a = sAlong * sAlong, b = (d * sphi) ** 2;
  return [
    [c * c * a + s * s * b, c * s * (a - b)],
    [c * s * (a - b), s * s * a + c * c * b],
  ];
}
/** Fix a fire from noise-free bearings of several towers (information form, linearised at the true distance). */
export function fixFromTowers(towers: Tower[], fire: V2, phis?: number[]) {
  const infos = towers.map((t, i) => bearingInfo(t, phis ? phis[i] : bearing(t.p, fire), Math.hypot(fire[0] - t.p[0], fire[1] - t.p[1])));
  return fuseInfo(
    infos.map((q) => q.Y),
    infos.map((q) => q.y),
  );
}
export const ellArea = (R: M2) => Math.PI * Math.sqrt(Math.max(R[0][0] * R[1][1] - R[0][1] * R[1][0], 0));

/** Intersection of two bearing lines (null if parallel). */
export function crossLines(p1: V2, a1: number, p2: V2, a2: number): V2 | null {
  const d1: V2 = [Math.cos(a1), Math.sin(a1)], d2: V2 = [Math.cos(a2), Math.sin(a2)];
  const den = d1[0] * d2[1] - d1[1] * d2[0];
  if (Math.abs(den) < 1e-9) return null;
  const t = ((p2[0] - p1[0]) * d2[1] - (p2[1] - p1[1]) * d2[0]) / den;
  if (t < 0) return null;
  return [p1[0] + t * d1[0], p1[1] + t * d1[1]];
}
/** All crossings of every bearing of tower A with every bearing of tower B: real fires and ghosts. */
export function crossings(pA: V2, pB: V2, fires: V2[]) {
  const out: { at: V2; real: boolean }[] = [];
  fires.forEach((fa, i) =>
    fires.forEach((fb, j) => {
      const c = crossLines(pA, bearing(pA, fa), pB, bearing(pB, fb));
      if (c) out.push({ at: c, real: i === j });
    }),
  );
  return out;
}

/* ------------------------------------------------------------------ book eq. 2.29–2.30 */
export const cumulativeInterval = (Ts: number[]) => 1 / Ts.reduce((a, t) => a + 1 / t, 0);
export const cumulativePD = (pd: number[]) => 1 - pd.reduce((a, p) => a * (1 - p), 1);
export function meanCumulativePD(pd: number[], Ts: number[]) {
  const Tc = cumulativeInterval(Ts);
  return 1 - pd.reduce((a, p, i) => a * Math.pow(1 - p, Tc / Ts[i]), 1);
}

/* ------------------------------------------------------------------ three roads: stacked = sequential = fused */
export interface G2 {
  m: V2;
  P: M2;
}
/** Kalman update of a 2D position belief with a position measurement (H = I). */
export function updPos(g: G2, z: V2, R: M2): G2 {
  const S = add(g.P, R);
  const Si = inv(S);
  const W: M2 = [
    [g.P[0][0] * Si[0][0] + g.P[0][1] * Si[1][0], g.P[0][0] * Si[0][1] + g.P[0][1] * Si[1][1]],
    [g.P[1][0] * Si[0][0] + g.P[1][1] * Si[1][0], g.P[1][0] * Si[0][1] + g.P[1][1] * Si[1][1]],
  ];
  const nu: V2 = [z[0] - g.m[0], z[1] - g.m[1]];
  const m = mulV(W, nu);
  // P − W S Wᵀ = P − W P (since W S = P)
  const WP: M2 = [
    [W[0][0] * g.P[0][0] + W[0][1] * g.P[1][0], W[0][0] * g.P[0][1] + W[0][1] * g.P[1][1]],
    [W[1][0] * g.P[0][0] + W[1][1] * g.P[1][0], W[1][0] * g.P[0][1] + W[1][1] * g.P[1][1]],
  ];
  return {
    m: [g.m[0] + m[0], g.m[1] + m[1]],
    P: [
      [g.P[0][0] - WP[0][0], g.P[0][1] - WP[0][1]],
      [g.P[1][0] - WP[1][0], g.P[1][1] - WP[1][1]],
    ],
  };
}
/** Stacked update: information form P⁻¹ + Σ Rᵢ⁻¹ (H stacked = (I; I), R = diag(R₁, R₂)). */
export function updStacked(g: G2, zs: V2[], Rs: M2[]): G2 {
  const Pi = inv(g.P);
  let Y = Pi;
  let y = mulV(Pi, g.m);
  zs.forEach((z, i) => {
    const Ri = inv(Rs[i]);
    Y = add(Y, Ri);
    const v = mulV(Ri, z);
    y = [y[0] + v[0], y[1] + v[1]];
  });
  const P = inv(Y);
  return { m: mulV(P, y), P };
}
export function threeRoads(g: G2, zs: V2[], Rs: M2[]) {
  const seq = zs.reduce((acc, z, i) => updPos(acc, z, Rs[i]), g);
  const f = fuse(zs, Rs);
  return { stacked: updStacked(g, zs, Rs), sequential: seq, fused: updPos(g, f.z, f.R) };
}

/* ------------------------------------------------------------------ Frenkel tracklet (book eq. 6.6–6.7), 1D */
export function tracklet1(xFilt: number, pFilt: number, xPred: number, pPred: number) {
  const info = 1 / pFilt - 1 / pPred;
  const P = 1 / info;
  return { x: P * (xFilt / pFilt - xPred / pPred), P };
}

/* ------------------------------------------------------------------ the drifting fire, tracked by two towers */
/** EKF update of a 4D state with one bearing (book: linearised measurement function). */
export function updBearing(g: G4, t: Tower, phi: number): G4 {
  const dx = g.x[0] - t.p[0], dy = g.x[1] - t.p[1];
  const r2 = dx * dx + dy * dy;
  const H = [[-dy / r2, dx / r2, 0, 0]];
  const S = mm(mm(H, g.P), tr(H))[0][0] + t.sphi * t.sphi;
  const PHt = mm(g.P, tr(H)); // 4×1
  const W = PHt.map((r) => r[0] / S);
  const pred = Math.atan2(dy, dx);
  const nu = Math.atan2(Math.sin(phi - pred), Math.cos(phi - pred));
  const x = vadd(g.x, W.map((w) => w * nu));
  const P = madd(g.P, W.map((wi) => W.map((wj) => wi * wj * S)), -1);
  return { x, P };
}
export interface FireRun {
  truth: V2[];
  est: G4[];
  seen: boolean[][]; // [tower][k]: did it see the smoke?
}
export function runFire({ steps = 36, dt = 5, towers, use = [true, true], pd = [1, 1], periods = [1, 1], seed = 4, duplicateA = false }: { steps?: number; dt?: number; towers: Tower[]; use?: boolean[]; pd?: number[]; periods?: number[]; seed?: number; duplicateA?: boolean }): FireRun {
  const rand = mulberry32(seed);
  // the fire front drifts north-east with the wind, ~0.3 km per 5 minutes, slowly turning
  const truth: V2[] = Array.from({ length: steps }, (_, k) => [-1.2 + 0.07 * k + 0.4 * Math.sin(k / 9), -0.8 + 0.05 * k]);
  let g: G4 = {
    x: [truth[0][0] + 0.6, truth[0][1] - 0.5, 0, 0],
    P: [
      [4, 0, 0, 0],
      [0, 4, 0, 0],
      [0, 0, 0.01, 0],
      [0, 0, 0, 0.01],
    ],
  };
  const est: G4[] = [];
  const seen: boolean[][] = towers.map(() => []);
  for (let k = 0; k < steps; k++) {
    if (k > 0) g = predict4(g, dt, 2e-5);
    towers.forEach((t, i) => {
      const reports = periods[i] ? k % periods[i] === 0 : true;
      const sees = use[i] && reports && rand() < pd[i];
      seen[i][k] = sees;
      const noise = randn(rand);
      if (!sees) return;
      const phi = bearing(t.p, truth[k]) + t.sphi * noise;
      g = updBearing(g, t, phi);
      if (duplicateA && i === 0) g = updBearing(g, t, phi); // the same report counted twice
    });
    est.push(g);
  }
  return { truth, est, seen };
}

