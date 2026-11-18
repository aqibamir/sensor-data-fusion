import { V2 } from '../../engine/mat2';
import { Tower } from '../../engine/fusion';

/** Chapter 5 parameters. Plan coordinates in km; the fire starts at the origin. */
export interface Params5 {
  sA: number; // tower A bearing error (deg)
  sB: number; // tower B bearing error (deg)
  bAngle: number; // geometry: angle between the two lines of sight (deg)
  tri: number; // 0 bearings (triangulation), 1 ranges (trilateration)
  k: number; // tracking: report number
  use: number; // 0 A only, 1 B only, 2 both
  haze: number; // probability tower A sees the smoke
  fires2: number; // two fires (ghosts)
  towerC: number; // third tower on
  dup: number; // duplicate report of A
  z2s: number; // Scene 3: σ of the second report (1D)
}

export const DEFAULTS5: Params5 = { sA: 1, sB: 1, bAngle: 90, tri: 0, k: 20, use: 2, haze: 1, fires2: 0, towerC: 0, dup: 0, z2s: 5 };

export const deg = (d: number) => (d * Math.PI) / 180;
export const FIRE: V2 = [0, 0];
export const TOWER_DIST = 7;
const A_ANGLE = 200;
export const onCircle = (a: number, d = TOWER_DIST): V2 => [d * Math.cos(deg(a)), d * Math.sin(deg(a))];
export function towersFor(p: Params5): Tower[] {
  return [
    { name: 'Eagle Peak', p: onCircle(A_ANGLE), sphi: deg(p.sA) },
    { name: 'Bald Ridge', p: onCircle(A_ANGLE - p.bAngle), sphi: deg(p.sB) },
    { name: 'Cedar Knob', p: onCircle(A_ANGLE + 130), sphi: deg(1) },
  ];
}
export const FIRES2: V2[] = [
  [-1.2, 0.6],
  [1.6, 1.8],
];
export const STEPS5 = 36;
export const DT5 = 5; // minutes between reports
