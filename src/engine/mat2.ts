/** 2×2 matrices and 2-vectors — enough for the 2D pictures in Ch 1–2. */
export type V2 = [number, number];
/** Row-major [[a, b], [c, d]]. */
export type M2 = [[number, number], [number, number]];

export const mul = (A: M2, B: M2): M2 => [
  [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
  [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
];
export const mulV = (A: M2, v: V2): V2 => [A[0][0] * v[0] + A[0][1] * v[1], A[1][0] * v[0] + A[1][1] * v[1]];
export const T = (A: M2): M2 => [
  [A[0][0], A[1][0]],
  [A[0][1], A[1][1]],
];
export const det = (A: M2): number => A[0][0] * A[1][1] - A[0][1] * A[1][0];
export const inv = (A: M2): M2 => {
  const d = det(A);
  return [
    [A[1][1] / d, -A[0][1] / d],
    [-A[1][0] / d, A[0][0] / d],
  ];
};
export const add = (A: M2, B: M2): M2 => [
  [A[0][0] + B[0][0], A[0][1] + B[0][1]],
  [A[1][0] + B[1][0], A[1][1] + B[1][1]],
];

/** Lower Cholesky factor L with L Lᵀ = P (P symmetric positive definite). */
export function chol(P: M2): M2 {
  const l11 = Math.sqrt(P[0][0]);
  const l21 = P[1][0] / l11;
  const l22 = Math.sqrt(Math.max(P[1][1] - l21 * l21, 0));
  return [
    [l11, 0],
    [l21, l22],
  ];
}

/** Eigen-decomposition of a symmetric 2×2 matrix: values (descending) and angle of the first eigenvector. */
export function eigSym(P: M2): { l1: number; l2: number; angle: number } {
  const a = P[0][0];
  const b = P[0][1];
  const d = P[1][1];
  const tr = a + d;
  const disc = Math.sqrt(((a - d) / 2) ** 2 + b * b);
  const l1 = tr / 2 + disc;
  const l2 = tr / 2 - disc;
  const angle = 0.5 * Math.atan2(2 * b, a - d);
  return { l1, l2, angle };
}
