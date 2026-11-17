import { useMemo } from 'react';
import * as THREE from 'three';
import { normal1 } from '../engine/gaussian';
import { C } from '../ui/theme';
import { Axes, Camera, Curve, Density, Label, Lights, linspace, P3, Plane, Surface, useAnimated } from './primitives';

/** Height scales: 2D densities are much lower than 1D ones, so they get a larger scale. */
export const H2 = 7;
export const H1 = 3;

/**
 * "Bayes = slice of the joint":
 * joint p(x, z) = p(z | x) p(x) with prior p(x) = N(x; m, P) and likelihood p(z | x) = N(z; x, R).
 * Observing z = z0 slices the joint; renormalising the slice gives the posterior p(x | z0).
 */
export function JointSliceScene({ m, P, R, z0, renorm, labels }: { m: number; P: number; R: number; z0: number; renorm: number; labels: { prior: string; lik: string; post: string; joint: string } }) {
  const xs = useMemo(() => linspace(-4, 4, 161), []);
  const f = useMemo(() => (x: number, z: number) => H2 * normal1(x, m, P) * normal1(z, x, R), [m, P, R]);
  const t = useAnimated(renorm);
  const prior = xs.map((x) => normal1(x, m, P));
  // posterior (exact, Gaussian case): N(x; m + W (z0 - m), P - W² S), W = P / S, S = P + R
  const S = P + R;
  const W = P / S;
  const post = xs.map((x) => normal1(x, m + W * (z0 - m), P - W * W * S));
  const evidence = normal1(z0, m, S);
  const slice = xs.map((x) => f(x, z0));
  const sliceOrPost = xs.map((x, i) => [x, (1 - t) * slice[i] + t * H1 * post[i], -z0] as P3);
  const back = 4.4;
  return (
    <>
      <Camera position={[6.5, 5.5, 7]} target={[0, 0.6, 0]} />
      <Lights />
      <Axes x={4} z={4} y={3} xLabel="x" zLabel="z" yLabel="p" />
      <Surface f={f} xr={[-4, 4]} yr={[-4, 4]} color={C.joint} opacity={0.55} />
      {/* prior on the back wall = marginal of the joint over z */}
      <Density xs={xs} p={prior} scale={H1} z={-back} color={C.pred} />
      <Label position={[m, H1 * normal1(m, m, P) + 0.35, -back]} tex={labels.prior} color={C.pred} />
      {/* observed z0: slicing plane; the likelihood p(z0 | x) is a function of x living in that plane */}
      <Plane center={[0, 1.5, -z0]} width={8} height={3} color={C.meas} opacity={0.08} />
      <Curve points={xs.map((x) => [x, H1 * normal1(z0, x, R), -z0] as P3)} color={C.meas} dashed width={2} />
      <Label position={[z0 + 0.9, H1 * normal1(0, 0, R) + 0.3, -z0]} tex={labels.lik} color={C.meas} />
      <Curve points={sliceOrPost} color={t > 0.5 ? C.post : C.joint} width={4} />
      <Label position={[m + W * (z0 - m), (1 - t) * f(m + W * (z0 - m), z0) + t * H1 * normal1(0, 0, P - W * W * S) + 0.4, -z0]} tex={t > 0.5 ? labels.post : labels.joint} color={t > 0.5 ? C.post : C.joint} />
      <Label position={[-3.6, 2.8, -z0]} color={C.muted} size={13}>
        area of slice = p(z₀) = {evidence.toFixed(3)}
      </Label>
    </>
  );
}

/** A cloud of points (instanced) for sample-based pictures. */
export function PointCloud({ pts, color, size = 0.05, opacity = 0.8 }: { pts: P3[]; color: string; size?: number; opacity?: number }) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3));
    return g;
  }, [pts]);
  return (
    <points geometry={geom}>
      <pointsMaterial color={color} size={size} transparent opacity={opacity} sizeAttenuation />
    </points>
  );
}
