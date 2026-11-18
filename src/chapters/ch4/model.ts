/** Chapter 4 parameters. Distances in km, angles in degrees (converted in the engine calls). */
export interface Params4 {
  r: number; // range of the blip (Scenes 3–8)
  sphiDeg: number; // bearing error σφ
  srM: number; // range error σr in metres
  W0: number; // UKF centre weight
  linOff: number; // EKF demo: how far (degrees) the linearisation point is from the truth
  k: number; // approach: scan shown
  method: number; // 0 converted, 1 EKF, 2 UKF
  bad: number; // approach: bad initial guess (0/1)
  seed: number;
  tdoa: number; // TDoA demo: distance difference (km)
}

export const DEFAULTS4: Params4 = {
  r: 20,
  sphiDeg: 1.5,
  srM: 50,
  W0: 1 / 3,
  linOff: 0,
  k: 30,
  method: 0,
  bad: 0,
  seed: 11,
  tdoa: 2,
};

export const PHI0 = (25 * Math.PI) / 180; // bearing of the blip in the banana scenes
export const STEPS4 = 60;
export const DT4 = 5; // seconds per radar sweep
export const deg = (d: number) => (d * Math.PI) / 180;
