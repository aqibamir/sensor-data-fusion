import { normal1 } from './gaussian';

/**
 * Grid-based Bayesian recursion for a 1D state (Ch 2).
 * Works for ANY density shape — that's the point: prediction and filtering
 * are exact operations on functions, Kalman is only the Gaussian special case.
 *
 * Dynamics model:    x_k = x_{k-1} + u + noise,  p(x_k | x_{k-1}) = N(x_k; x_{k-1} + u, q)
 * Measurement model: z_k = x_k + noise,          p(z_k | x_k)     = N(z_k; x_k, r)
 * (q, r are variances.)
 */
export interface Grid {
  xs: number[];
  dx: number;
}

export function makeGrid(min: number, max: number, n: number): Grid {
  const dx = (max - min) / (n - 1);
  return { xs: Array.from({ length: n }, (_, i) => min + i * dx), dx };
}

export function integrate(g: Grid, p: number[]): number {
  let s = 0;
  for (const v of p) s += v;
  return s * g.dx;
}

export function normalize(g: Grid, p: number[]): number[] {
  const c = integrate(g, p);
  return p.map((v) => v / c);
}

export function moments(g: Grid, p: number[]): { mean: number; variance: number } {
  let m = 0;
  for (let i = 0; i < p.length; i++) m += g.xs[i] * p[i] * g.dx;
  let v = 0;
  for (let i = 0; i < p.length; i++) v += (g.xs[i] - m) ** 2 * p[i] * g.dx;
  return { mean: m, variance: v };
}

/** Transition kernel p(x_k | x_{k-1}) evaluated on the grid. */
export function transition(xk: number, xk1: number, u: number, q: number): number {
  return normal1(xk, xk1 + u, q);
}

/** Chapman–Kolmogorov: p(x_k | Z^{k-1}) = ∫ p(x_k | x_{k-1}) p(x_{k-1} | Z^{k-1}) dx_{k-1}. */
export function predict(g: Grid, post: number[], u: number, q: number): number[] {
  return g.xs.map((xk) => {
    let s = 0;
    for (let j = 0; j < g.xs.length; j++) s += transition(xk, g.xs[j], u, q) * post[j];
    return s * g.dx;
  });
}

/** Likelihood p(z_k | x_k) as a function of x_k. */
export function likelihood(g: Grid, z: number, r: number): number[] {
  return g.xs.map((x) => normal1(z, x, r));
}

/**
 * Bayes: p(x_k | Z^k) = p(z_k | x_k) p(x_k | Z^{k-1}) / ∫ p(z_k | x_k) p(x_k | Z^{k-1}) dx_k.
 * Returns the posterior and the normalisation constant p(z_k | Z^{k-1}).
 */
export function update(g: Grid, prior: number[], z: number, r: number): { post: number[]; evidence: number } {
  const l = likelihood(g, z, r);
  const unnorm = prior.map((p, i) => p * l[i]);
  const evidence = integrate(g, unnorm);
  return { post: unnorm.map((v) => v / evidence), evidence };
}

/**
 * Retrodiction (L2 slides 27–28):
 * p(x_l | Z^k) = p(x_l | Z^l) ∫ p(x_{l+1} | x_l) p(x_{l+1} | Z^k) / p(x_{l+1} | Z^l) dx_{l+1}
 * filtered[l] = p(x_l|Z^l), predicted[l+1] = p(x_{l+1}|Z^l). Returns p(x_l|Z^k) for all l.
 */
export function retrodict(g: Grid, filtered: number[][], predicted: number[][], u: number, q: number): number[][] {
  const k = filtered.length - 1;
  const out: number[][] = new Array(k + 1);
  out[k] = filtered[k];
  const eps = 1e-300;
  for (let l = k - 1; l >= 0; l--) {
    const ratio = out[l + 1].map((v, i) => v / Math.max(predicted[l + 1][i], eps));
    const sm = g.xs.map((xl, i) => {
      let s = 0;
      for (let j = 0; j < g.xs.length; j++) s += transition(g.xs[j], xl, u, q) * ratio[j];
      return filtered[l][i] * s * g.dx;
    });
    out[l] = normalize(g, sm);
  }
  return out;
}

export function gaussianOnGrid(g: Grid, m: number, s2: number): number[] {
  return normalize(
    g,
    g.xs.map((x) => normal1(x, m, s2)),
  );
}

/** Weighted Gaussian mixture on the grid — used for deliberately non-Gaussian starting beliefs. */
export function mixtureOnGrid(g: Grid, comps: { w: number; m: number; s2: number }[]): number[] {
  return normalize(
    g,
    g.xs.map((x) => comps.reduce((s, c) => s + c.w * normal1(x, c.m, c.s2), 0)),
  );
}
