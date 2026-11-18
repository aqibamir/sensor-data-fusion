import { describe, expect, it } from 'vitest';
import { convCov, jacH, jacT, runApproach, sigmaPoints, tdoa, toCart, utPolar, weightedMoments, mm, tr } from './polar';

describe('polar radar engine', () => {
  it('T = rotation × dilation and T R Tᵀ matches convCov', () => {
    const r = 10, p = 0.7, sr = 0.05, sp = 0.02;
    const T = jacT(r, p) as number[][];
    const R = [[sr * sr, 0], [0, sp * sp]];
    const A = mm(mm(T, R), tr(T));
    const C = convCov(r, p, sr, sp);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) expect(A[i][j]).toBeCloseTo(C[i][j], 12);
  });
  it('plane due north: long axis east–west', () => {
    const C = convCov(10, Math.PI / 2, 0.05, (1 * Math.PI) / 180);
    expect(C[0][0]).toBeGreaterThan(C[1][1]);
    expect(C[1][1]).toBeCloseTo(0.0025, 6);
  });
  it('radar Jacobian row 1 is the unit vector', () => {
    const H = jacH(3, 4);
    expect(H[0][0]).toBeCloseTo(0.6);
    expect(H[0][1]).toBeCloseTo(0.8);
  });
  it('σ-points reproduce mean and covariance; weights sum to 1', () => {
    const m = [1, 2], P = [[4, 1], [1, 3]];
    for (const W0 of [-0.5, 0, 1 / 3, 0.8]) {
      const { pts, w } = sigmaPoints(m, P, W0);
      expect(pts.length).toBe(5);
      expect(w.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
      const mo = weightedMoments(pts, w);
      expect(mo.m[0]).toBeCloseTo(1, 10);
      expect(mo.P[0][1]).toBeCloseTo(1, 10);
      expect(mo.P[1][1]).toBeCloseTo(3, 10);
    }
  });
  it('1D σ-points through x² give the exact mean x̂² + P (Practice 9)', () => {
    const { pts, w } = sigmaPoints([2], [[4]], 1 / 3);
    const mean = pts.reduce((s, p, i) => s + w[i] * p[0] * p[0], 0);
    expect(mean).toBeCloseTo(8, 10);
  });
  it('UT mean of the banana sits closer to the radar than t(mean)', () => {
    const u = utPolar(20, 0.3, 0.05, (3 * Math.PI) / 180, 1 / 3);
    const naive = toCart(20, 0.3);
    expect(Math.hypot(...u.m)).toBeLessThan(Math.hypot(...naive));
  });
  it('all three filters track the approach to within a few hundred metres', () => {
    const run = runApproach({});
    for (let m = 0; m < 3; m++) {
      const k = 55;
      const e = run.est[m][k].x, t = run.truth[k];
      expect(Math.hypot(e[0] - t[0], e[1] - t[1])).toBeLessThan(0.4);
    }
  });
  it('TDoA is zero on the perpendicular bisector', () => {
    expect(tdoa([5, 3], [0, 0], [10, 0])).toBeCloseTo(0);
  });
});
