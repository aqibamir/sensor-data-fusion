import { describe, expect, it } from 'vitest';
import { crossings, cumulativeInterval, cumulativePD, ellArea, fixFromTowers, fuse, fuse1, runFire, threeRoads, Tower, tracklet1 } from './fusion';

describe('fusion engine', () => {
  it('1D: 100 ± 10 and 110 ± 5 fuse to 108, variance 20', () => {
    const f = fuse1([100, 110], [100, 25]);
    expect(f.z).toBeCloseTo(108, 10);
    expect(f.s2).toBeCloseTo(20, 10);
    expect(f.w[1]).toBeCloseTo(0.8, 10);
  });
  it('2D: matrix weights take each coordinate from the sharper sensor', () => {
    const f = fuse([[0, 0], [5, 5]], [[[1, 0], [0, 25]], [[25, 0], [0, 1]]]);
    expect(f.z[0]).toBeCloseTo(5 / 26, 10);
    expect(f.z[1]).toBeCloseTo(125 / 26, 10);
    expect(f.R[0][0]).toBeCloseTo(25 / 26, 10);
  });
  it('stacked = sequential = fused', () => {
    const g = { m: [90, 10] as [number, number], P: [[100, 0], [0, 50]] as [[number, number], [number, number]] };
    const r = threeRoads(g, [[100, 12], [110, 8]], [[[100, 10], [10, 30]], [[25, 0], [0, 40]]]);
    for (const k of [0, 1]) {
      expect(r.sequential.m[k]).toBeCloseTo(r.stacked.m[k], 8);
      expect(r.fused.m[k]).toBeCloseTo(r.stacked.m[k], 8);
    }
    expect(r.fused.P[0][1]).toBeCloseTo(r.stacked.P[0][1], 8);
  });
  it('two bearings at 90° beat two nearly parallel ones (geometric fusion gain)', () => {
    const fire: [number, number] = [0, 0];
    const s = 0.01;
    const A: Tower = { name: 'A', p: [-6, 0], sphi: s };
    const good = fixFromTowers([A, { name: 'B', p: [0, -6], sphi: s }], fire);
    const bad = fixFromTowers([A, { name: 'B', p: [-6, -1], sphi: s }], fire);
    expect(ellArea(good.R)).toBeLessThan(ellArea(bad.R) / 4);
    expect(good.z[0]).toBeCloseTo(0, 8);
  });
  it('two fires, two towers: four crossings, two of them ghosts', () => {
    const c = crossings([-6, -3], [6, -3], [[-1, 2], [2, 4]]);
    expect(c.length).toBe(4);
    expect(c.filter((q) => !q.real).length).toBe(2);
  });
  it('cumulative interval and detection (book 2.29–2.30)', () => {
    expect(cumulativeInterval([10, 15])).toBeCloseTo(6, 10);
    expect(cumulativePD([0.6, 0.7])).toBeCloseTo(0.88, 10);
  });
  it('tracklet: posterior information minus prior information', () => {
    const t = tracklet1(10, 5, 8, 20);
    expect(t.P).toBeCloseTo(20 / 3, 10);
  });
  it('two towers track the drifting fire; one tower alone stays long', () => {
    const towers: Tower[] = [
      { name: 'A', p: [-6, -3], sphi: 0.01 },
      { name: 'B', p: [5, -4], sphi: 0.01 },
    ];
    const both = runFire({ towers });
    const one = runFire({ towers, use: [true, false] });
    const k = 35;
    const err = Math.hypot(both.est[k].x[0] - both.truth[k][0], both.est[k].x[1] - both.truth[k][1]);
    expect(err).toBeLessThan(0.2);
    const area = (g: typeof both.est[0]) => g.P[0][0] * g.P[1][1] - g.P[0][1] ** 2;
    expect(area(one.est[k])).toBeGreaterThan(4 * area(both.est[k]));
  });
});
