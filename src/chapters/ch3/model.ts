import { Gauss2 } from '../../engine/kalman2';

/** Units: distance in 1000 km, speed in 1000 km/h, time in hours. */
export interface Params3 {
  prod: number; // product-formula scene: 0 = factors, 1 = product
  pz: number;
  pR: number;
  dt: number;
  s2: number; // white-acceleration variance used by the scenes
  predStage: number; // 0 filtered, 1 + shear, 2 + D
  Pscale: number;
  corr: number;
  zOff: number;
  fR: number;
  k: number; // coast step shown
  R: number; // coast measurement variance
  s2Filter: number;
  burn: number; // 0/1: mid-course burn in the truth
  seed: number;
  retro: number;
}

export const DEFAULTS3: Params3 = {
  prod: 0,
  pz: 1.5,
  pR: 0.6,
  dt: 1,
  s2: 0.04,
  predStage: 0,
  Pscale: 1,
  corr: 1,
  zOff: 4,
  fR: 4,
  k: 0,
  R: 4,
  s2Filter: 0.02,
  burn: 0,
  seed: 7,
  retro: 0,
};

export const STEPS3 = 14;

/** The worked example of Scene 6 (2D): last posterior, one hour, then a range of 106 (thousand km). */
export const EXAMPLE_FILT: Gauss2 = { x: [100, 4], P: [[4, 0], [0, 0.25]] };
export const EXAMPLE = { dt: 1, s2: 0.04, z: 106, R: 1 };
