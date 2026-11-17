import { describe, expect, it } from 'vitest';
import { affine, conditionalXgivenY, covFrom, ellipse, normal1, normal2, sample2 } from './gaussian';
import { gaussianOnGrid, integrate, makeGrid, moments, predict, retrodict, update } from './grid';
import { inv, M2, V2 } from './mat2';
import { mulberry32 } from './rng';

describe('Gaussians', () => {
  const m: V2 = [1, -0.5];
  const P = covFrom(1.2, 0.7, 0.6);

  it('2D Gaussian is normalised', () => {
    let s = 0;
    const h = 0.05;
    for (let x = -8; x <= 10; x += h) for (let y = -8; y <= 8; y += h) s += normal2([x, y], m, P) * h * h;
    expect(s).toBeCloseTo(1, 3);
  });

  it('ellipse points sit at Mahalanobis distance c', () => {
    const Pi = inv(P);
    for (const [x, y] of ellipse(m, P, 2, 24)) {
      const d = [x - m[0], y - m[1]];
      const q = d[0] * (Pi[0][0] * d[0] + Pi[0][1] * d[1]) + d[1] * (Pi[1][0] * d[0] + Pi[1][1] * d[1]);
      expect(q).toBeCloseTo(4, 8);
    }
  });

  it('samples have the requested covariance', () => {
    const rand = mulberry32(7);
    const N = 40000;
    const xs = Array.from({ length: N }, () => sample2(m, P, rand));
    const mx = xs.reduce((s, v) => s + v[0], 0) / N;
    const my = xs.reduce((s, v) => s + v[1], 0) / N;
    const cxy = xs.reduce((s, v) => s + (v[0] - mx) * (v[1] - my), 0) / N;
    expect(mx).toBeCloseTo(m[0], 1);
    expect(my).toBeCloseTo(m[1], 1);
    expect(cxy).toBeCloseTo(P[0][1], 1);
  });

  it('affine transform gives a + A x̄ and A X Aᵀ', () => {
    const A: M2 = [
      [2, 0],
      [1, 1],
    ];
    const r = affine([1, 1], A, [1, 2], [
      [1, 0],
      [0, 4],
    ]);
    expect(r.m).toEqual([3, 4]);
    expect(r.P).toEqual([
      [4, 2],
      [2, 5],
    ]);
  });

  it('conditional formula equals the renormalised slice of the joint', () => {
    const y0 = 0.8;
    const c = conditionalXgivenY(m, P, y0);
    const h = 0.01;
    let Z = 0;
    let M = 0;
    for (let x = -10; x <= 10; x += h) {
      const v = normal2([x, y0], m, P);
      Z += v * h;
      M += x * v * h;
    }
    expect(M / Z).toBeCloseTo(c.m, 4);
    expect(normal2([0.3, y0], m, P) / Z).toBeCloseTo(normal1(0.3, c.m, c.s2), 4);
  });
});

describe('Grid Bayes recursion reproduces the Kalman formulas for Gaussians', () => {
  const g = makeGrid(-30, 30, 1201);
  const m0 = 1;
  const p0 = 2;
  const u = 1.5;
  const q = 0.8;
  const r = 1.3;

  it('prediction: mean + u, variance + q', () => {
    const pred = predict(g, gaussianOnGrid(g, m0, p0), u, q);
    const mo = moments(g, pred);
    expect(integrate(g, pred)).toBeCloseTo(1, 4);
    expect(mo.mean).toBeCloseTo(m0 + u, 4);
    expect(mo.variance).toBeCloseTo(p0 + q, 3);
  });

  it('filtering: Kalman gain update and evidence N(z; x, P + R)', () => {
    const z = 2.7;
    const { post, evidence } = update(g, gaussianOnGrid(g, m0, p0), z, r);
    const W = p0 / (p0 + r);
    const mo = moments(g, post);
    expect(mo.mean).toBeCloseTo(m0 + W * (z - m0), 4);
    expect(mo.variance).toBeCloseTo(p0 - W * (p0 + r) * W, 4);
    expect(evidence).toBeCloseTo(normal1(z, m0, p0 + r), 4);
  });

  it('retrodiction matches Rauch–Tung–Striebel', () => {
    const f0 = gaussianOnGrid(g, m0, p0);
    const pr1 = predict(g, f0, u, q);
    const { post: f1 } = update(g, pr1, 4.2, r);
    const smooth = retrodict(g, [f0, f1], [f0, pr1], u, q);
    // RTS (F = 1): W = P_{0|0} / P_{1|0}; x_{0|1} = x_{0|0} + W (x_{1|1} - x_{1|0}); P_{0|1} = P_{0|0} + W (P_{1|1} - P_{1|0}) W
    const P10 = p0 + q;
    const K = P10 / (P10 + r);
    const x11 = m0 + u + K * (4.2 - m0 - u);
    const P11 = P10 - K * P10;
    const W = p0 / P10;
    const mo = moments(g, smooth[0]);
    expect(mo.mean).toBeCloseTo(m0 + W * (x11 - (m0 + u)), 3);
    expect(mo.variance).toBeCloseTo(p0 + W * (P11 - P10) * W, 3);
  });
});
