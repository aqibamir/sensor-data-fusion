/** All slider/toggle state of Chapter 1, shared by the story text and the 3D world. */
export interface Params {
  sig1: number;
  bin: number;
  a: number;
  b: number;
  squeeze: number;
  w3: number;
  guess: number;
  sig4: number;
  res: number;
  sx: number;
  sy: number;
  rho: number;
  push: number;
  tip: number;
  y0: number;
  renorm: number;
  z8: number;
  s8: number;
  mm: number;
  preset: 'drive' | 'stretch' | 'rotate';
  undo: number;
  dice: number;
  sig10: number;
  drive: number;
  dt: number;
  dsig: number;
  sx10: number;
  sy10: number;
  rho10: number;
}

export const DEFAULTS: Params = {
  sig1: 4,
  bin: 0,
  a: 95,
  b: 100,
  squeeze: 0,
  w3: 0.5,
  guess: 92,
  sig4: 5,
  res: 0,
  sx: 1.1,
  sy: 0.9,
  rho: 0.6,
  push: 0,
  tip: 0,
  y0: 1,
  renorm: 0,
  z8: 125,
  s8: 10,
  mm: 0,
  preset: 'drive',
  undo: 0,
  dice: 1,
  sig10: 5,
  drive: 0,
  dt: 1,
  dsig: 5,
  sx10: 1.1,
  sy10: 0.9,
  rho10: 0.6,
};
