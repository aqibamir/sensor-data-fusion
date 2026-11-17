import { Html, Line, OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Tex } from '../ui/Tex';
import { C } from '../ui/theme';

/**
 * World convention for all 3D scenes:
 *   world X = first state variable (x),  world -Z = second variable (y),  world Y = density height.
 */
export type P3 = [number, number, number];

/** Smoothly animate a number towards `target` (3Blue1Brown-style easing between beats). */
export function useAnimated(target: number, speed = 4): number {
  const [v, setV] = useState(target);
  const ref = useRef(target);
  useFrame((_, dt) => {
    const d = target - ref.current;
    if (Math.abs(d) < 1e-4) {
      if (ref.current !== target) {
        ref.current = target;
        setV(target);
      }
      return;
    }
    ref.current += d * Math.min(1, dt * speed);
    setV(ref.current);
  });
  return v;
}

/** Orbit controls + a camera that glides to a new viewpoint whenever `position` changes. */
export function Camera({ position, target = [0, 0, 0] }: { position: P3; target?: P3 }) {
  const { camera, size } = useThree();
  const controls = useRef<any>(null);
  // Scenes are composed for a ~16:10 stage; on taller stages pull the camera back so nothing is cropped.
  const aspect = size.width / Math.max(size.height, 1);
  const pull = aspect < 1.15 ? Math.pow(1.15 / aspect, 0.6) : 1;
  const goalPos = () => {
    const t = new THREE.Vector3(...target);
    return new THREE.Vector3(...position).sub(t).multiplyScalar(pull).add(t);
  };
  const goal = useRef({ pos: goalPos(), tgt: new THREE.Vector3(...target), t: 0 });
  const key = position.join(',') + '|' + target.join(',') + '|' + pull.toFixed(2);
  useEffect(() => {
    goal.current = { pos: goalPos(), tgt: new THREE.Vector3(...target), t: 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useFrame((_, dt) => {
    const g = goal.current;
    if (g.t >= 1) return;
    g.t = Math.min(1, g.t + dt * 1.2);
    const k = Math.min(1, dt * 4);
    camera.position.lerp(g.pos, k);
    if (controls.current) {
      controls.current.target.lerp(g.tgt, k);
      controls.current.update();
    }
  });
  return <OrbitControls ref={controls} makeDefault enableDamping />;
}

export function Lights() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 10, 6]} intensity={1.1} />
      <directionalLight position={[-6, 4, -5]} intensity={0.35} />
    </>
  );
}

/** Height-field surface z = f(x, y). Colour fades from dark to `color` with height. */
export function Surface(props: {
  f: (x: number, y: number) => number;
  xr: [number, number];
  yr: [number, number];
  res?: number;
  color?: string;
  opacity?: number;
  wire?: boolean;
  /** Optional map from the y variable to world z (default: z = -y). */
  zOf?: (y: number) => number;
}) {
  const { f, xr, yr, res = 70, color = C.joint, opacity = 0.9, wire = true, zOf = (y) => -y } = props;
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = res + 1;
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * n * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * n * 3), 3));
    const idx: number[] = [];
    for (let i = 0; i < res; i++)
      for (let j = 0; j < res; j++) {
        const a = i * n + j;
        idx.push(a, a + n, a + 1, a + 1, a + n, a + n + 1);
      }
    g.setIndex(idx);
    return g;
  }, [res]);

  useLayoutEffect(() => {
    const n = res + 1;
    const pos = geom.getAttribute('position') as THREE.BufferAttribute;
    const col = geom.getAttribute('color') as THREE.BufferAttribute;
    const base = new THREE.Color('#1b2230');
    const top = new THREE.Color(color);
    let max = 1e-9;
    const hs = new Float32Array(n * n);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const x = xr[0] + ((xr[1] - xr[0]) * i) / res;
        const y = yr[0] + ((yr[1] - yr[0]) * j) / res;
        const h = f(x, y);
        hs[i * n + j] = h;
        if (h > max) max = h;
        pos.setXYZ(i * n + j, x, h, zOf(y));
      }
    const c = new THREE.Color();
    for (let k = 0; k < n * n; k++) {
      c.copy(base).lerp(top, Math.pow(Math.max(hs[k], 0) / max, 0.6));
      col.setXYZ(k, c.r, c.g, c.b);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
    geom.computeVertexNormals();
  });

  return (
    <group>
      <mesh geometry={geom}>
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} transparent opacity={opacity} roughness={0.6} metalness={0.05} />
      </mesh>
      {wire && (
        <mesh geometry={geom}>
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.06} />
        </mesh>
      )}
    </group>
  );
}

export function Curve({ points, color, width = 2.5, dashed = false, opacity = 1 }: { points: P3[]; color: string; width?: number; dashed?: boolean; opacity?: number }) {
  if (points.length < 2) return null;
  return <Line points={points} color={color} lineWidth={width} dashed={dashed} dashSize={0.12} gapSize={0.08} transparent opacity={opacity} />;
}

/** A curve with a translucent fill down to a baseline — the standard way we draw 1D densities in 3D. */
export function FilledCurve({ top, base, color, opacity = 0.25, width = 3 }: { top: P3[]; base: P3[]; color: string; opacity?: number; width?: number }) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos: number[] = [];
    for (let i = 0; i < top.length - 1; i++) {
      const a = top[i],
        b = top[i + 1],
        c = base[i],
        d = base[i + 1];
      pos.push(...a, ...c, ...b, ...b, ...c, ...d);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }, [top, base]);
  return (
    <group>
      <mesh geometry={geom}>
        <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Curve points={top} color={color} width={width} />
    </group>
  );
}

/** Density p(x) drawn in the vertical plane world z = zPlane. */
export function Density({ xs, p, scale = 1, z = 0, color, opacity = 0.22, width = 3 }: { xs: number[]; p: number[]; scale?: number; z?: number; color: string; opacity?: number; width?: number }) {
  const top = useMemo(() => xs.map((x, i) => [x, p[i] * scale, z] as P3), [xs, p, scale, z]);
  const base = useMemo(() => xs.map((x) => [x, 0, z] as P3), [xs, z]);
  return <FilledCurve top={top} base={base} color={color} opacity={opacity} width={width} />;
}

export function Label({ position, tex, children, color = C.text, size = 15 }: { position: P3; tex?: string; children?: ReactNode; color?: string; size?: number }) {
  return (
    <Html position={position} center style={{ pointerEvents: 'none', color, fontSize: size, whiteSpace: 'nowrap' }}>
      {tex ? <Tex tex={tex} /> : children}
    </Html>
  );
}

/** Floor grid + three axes with TeX labels. */
export function Axes({ x = 5, y = 3, z = 5, xLabel = 'x', yLabel = 'p', zLabel = 'y', grid = true }: { x?: number; y?: number; z?: number; xLabel?: string; yLabel?: string; zLabel?: string; grid?: boolean }) {
  return (
    <group>
      {grid && <gridHelper args={[Math.max(x, z) * 2, 20, C.grid, C.grid]} position={[0, -0.001, 0]} />}
      <Curve points={[[-x, 0, 0], [x, 0, 0]]} color={C.axis} width={1.5} />
      <Curve points={[[0, 0, z], [0, 0, -z]]} color={C.axis} width={1.5} />
      <Curve points={[[-x, 0, z], [-x, y, z]]} color={C.axis} width={1.5} />
      <Label position={[x + 0.35, 0, 0]} tex={xLabel} color={C.muted} />
      <Label position={[0, 0, -z - 0.35]} tex={zLabel} color={C.muted} />
      <Label position={[-x, y + 0.3, z]} tex={yLabel} color={C.muted} />
    </group>
  );
}

/** A translucent vertical plane (used for slicing surfaces). */
export function Plane({ center, width, height, rotY = 0, color, opacity = 0.12 }: { center: P3; width: number; height: number; rotY?: number; color: string; opacity?: number }) {
  return (
    <mesh position={center} rotation={[0, rotY, 0]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

export function Dot({ position, color, r = 0.08 }: { position: P3; color: string; r?: number }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[r, 20, 20]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  );
}

export const linspace = (a: number, b: number, n: number) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
