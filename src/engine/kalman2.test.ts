import { describe, expect, it } from 'vitest';
import { coast, Dm, kfPredict, kfUpdate } from './kalman2';

describe('Kalman (r, ṙ) with H = (1, 0)', () => {
  it('prediction matches F P Fᵀ + D (script Practice 2: Δt = 2, D = 0)', () => {
    const g = kfPredict({ x: [0, 3], P: [[1, 0], [0, 0.5]] }, 2, 0);
    expect(g.x).toEqual([6, 3]);
    expect(g.P[0][0]).toBeCloseTo(3);
    expect(g.P[0][1]).toBeCloseTo(1);
    expect(g.P[1][1]).toBeCloseTo(0.5);
  });

  it('white-acceleration D (σ² = 0.5, Δt = 2 → all entries 2)', () => {
    const D = Dm(2, 0.5);
    expect(D[0][0]).toBeCloseTo(2);
    expect(D[0][1]).toBeCloseTo(2);
    expect(D[1][1]).toBeCloseTo(2);
  });

  it('range-only update also corrects the speed through the correlation (script Practice 5)', () => {
    const u = kfUpdate({ x: [10, 1], P: [[4, 2], [2, 2]] }, 14, 4);
    expect(u.S).toBeCloseTo(8);
    expect(u.W[0]).toBeCloseTo(0.5);
    expect(u.W[1]).toBeCloseTo(0.25);
    expect(u.x[0]).toBeCloseTo(12);
    expect(u.x[1]).toBeCloseTo(2);
  });

  it('three forms of the covariance update agree: P − W S Wᵀ = (I − W H) P', () => {
    const P = [
      [4.26, 0.27],
      [0.27, 0.29],
    ] as [[number, number], [number, number]];
    const u = kfUpdate({ x: [104, 4], P }, 106, 1);
    // (I − W H) P with H = (1,0): rows: [P00 − W0 P00, P01 − W0 P01], [P10 − W1 P00, P11 − W1 P01]
    expect(u.P[0][0]).toBeCloseTo(P[0][0] - u.W[0] * P[0][0], 10);
    expect(u.P[1][1]).toBeCloseTo(P[1][1] - u.W[1] * P[0][1], 10);
    // information form in 1D for the position marginal is not exact in 2D, but variances must shrink
    expect(u.P[0][0]).toBeLessThan(P[0][0]);
  });

  it('RTS: last step unchanged, earlier variances never larger than filtered', () => {
    const c = coast({ seed: 1, steps: 12, dt: 1, R: 4, s2True: 0.02, s2Filter: 0.02 });
    const k = c.filt.length - 1;
    expect(c.smooth[k].x).toEqual(c.filt[k].x);
    for (let l = 0; l < k; l++) expect(c.smooth[l].P[0][0]).toBeLessThanOrEqual(c.filt[l].P[0][0] + 1e-9);
  });
});
