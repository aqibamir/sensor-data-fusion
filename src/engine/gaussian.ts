import { M2, V2, chol, det, eigSym, inv, mul, mulV, T } from './mat2';
import { randn } from './rng';

/** 1D Gaussian N(x; m, s2) — note: second argument is the VARIANCE, as in the slides' N(x; x̄, P). */
export function normal1(x: number, m: number, s2: number): number {
  return Math.exp((-0.5 * (x - m) ** 2) / s2) / Math.sqrt(2 * Math.PI * s2);
}

/** Covariance matrix from standard deviations and correlation coefficient. */
export function covFrom(sx: number, sy: number, rho: number): M2 {
  return [
    [sx * sx, rho * sx * sy],
    [rho * sx * sy, sy * sy],
  ];
}

/** 2D Gaussian N(x; x̄, P) = |2πP|^{-1/2} exp(-½ (x-x̄)ᵀ P⁻¹ (x-x̄)). */
export function normal2(x: V2, m: V2, P: M2): number {
  const Pi = inv(P);
  const d: V2 = [x[0] - m[0], x[1] - m[1]];
  const q = d[0] * (Pi[0][0] * d[0] + Pi[0][1] * d[1]) + d[1] * (Pi[1][0] * d[0] + Pi[1][1] * d[1]);
  return Math.exp(-0.5 * q) / Math.sqrt((2 * Math.PI) ** 2 * det(P));
}

/** Points on the ellipse {x : (x-m)ᵀ P⁻¹ (x-m) = c²}. */
export function ellipse(m: V2, P: M2, c = 1, n = 96): V2[] {
  const { l1, l2, angle } = eigSym(P);
  const a = c * Math.sqrt(Math.max(l1, 0));
  const b = c * Math.sqrt(Math.max(l2, 0));
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  const pts: V2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (2 * Math.PI * i) / n;
    const u = a * Math.cos(t);
    const v = b * Math.sin(t);
    pts.push([m[0] + ca * u - sa * v, m[1] + sa * u + ca * v]);
  }
  return pts;
}

/** Sample from N(m, P) via x = m + L u, u ~ N(0, I). */
export function sample2(m: V2, P: M2, rand: () => number): V2 {
  const L = chol(P);
  const u: V2 = [randn(rand), randn(rand)];
  const Lu = mulV(L, u);
  return [m[0] + Lu[0], m[1] + Lu[1]];
}

/** Affine transform of a Gaussian: x ~ N(x̄, X), y = a + A x  ⇒  y ~ N(a + A x̄, A X Aᵀ). */
export function affine(a: V2, A: M2, m: V2, X: M2): { m: V2; P: M2 } {
  const Am = mulV(A, m);
  return { m: [a[0] + Am[0], a[1] + Am[1]], P: mul(mul(A, X), T(A)) };
}

/** Marginal of a 2D Gaussian onto x: N(x; m_x, P_xx). */
export function marginalX(m: V2, P: M2) {
  return { m: m[0], s2: P[0][0] };
}

/** Conditional of a 2D Gaussian: p(x | y) = N(x; m_x + P_xy/P_yy (y - m_y), P_xx - P_xy²/P_yy). */
export function conditionalXgivenY(m: V2, P: M2, y: number) {
  return { m: m[0] + (P[0][1] / P[1][1]) * (y - m[1]), s2: P[0][0] - (P[0][1] * P[0][1]) / P[1][1] };
}
