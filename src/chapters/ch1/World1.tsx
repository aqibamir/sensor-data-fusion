import { Html, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { covFrom, ellipse, normal1, normal2 } from '../../engine/gaussian';
import { M2, V2 } from '../../engine/mat2';
import { mulberry32, randn } from '../../engine/rng';
import { Camera, linspace, P3, Surface, useAnimated } from '../../three/primitives';
import { Car, Column, Dune, Environment, Garage, Lamppost, Pin, Pulse, Radar, Road, ROAD_W, Speedometer, Tag, TrafficCone, W, wx } from '../../world/props';
import { Params } from './params';

/* ======================================================================
   Helpers
   ====================================================================== */

/** Seconds since `key` last changed (re-renders only the component that uses it). */
function useT(key: string, stopAfter = Infinity) {
  const [t, setT] = useState(0);
  const start = useRef<number | null>(null);
  useEffect(() => {
    start.current = null;
    setT(0);
  }, [key]);
  useFrame(({ clock }) => {
    if (start.current === null) start.current = clock.elapsedTime;
    const v = clock.elapsedTime - start.current;
    if (v <= stopAfter + 0.05) setT(v);
  });
  return t;
}

function normals(seed: number, n: number) {
  const r = mulberry32(seed);
  return Array.from({ length: n }, () => randn(r));
}
const N1 = normals(1, 600);
const N2 = normals(2, 600);
const N3 = normals(3, 600);

export function erf(x: number) {
  const s = Math.sign(x);
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}
export const Phi = (x: number) => 0.5 * (1 + erf(x / Math.SQRT2));

const S = 12; // world height per (1 / metre) of density
const FIELD_Z = -9; // the "maths field" behind the road
const ms = linspace(60, 160, 801);

function Shot({ pos, tgt }: { pos: P3; tgt: P3 }) {
  return <Camera position={pos} target={tgt} />;
}

/** Thin vertical guide line on the road. */
function Mark({ m, color = '#e2e8f0', h = 1.2, z = 0, dashed = false }: { m: number; color?: string; h?: number; z?: number; dashed?: boolean }) {
  return <Line points={[[wx(m), 0.01, z], [wx(m), h, z]]} color={color} lineWidth={1.5} dashed={dashed} dashSize={0.06} gapSize={0.05} />;
}

/** A road-level curve (for likelihood bells etc). */
function RoadCurve({ f, scale, color, z = 0, from = 60, to = 160, width = 3, dashed = false }: { f: (m: number) => number; scale: number; color: string; z?: number; from?: number; to?: number; width?: number; dashed?: boolean }) {
  const pts = useMemo(() => linspace(from, to, 300).map((m) => [wx(m), f(m) * scale + 0.01, z] as P3), [f, scale, z, from, to]);
  return <Line points={pts} color={color} lineWidth={width} dashed={dashed} dashSize={0.1} gapSize={0.06} />;
}

/* ======================================================================
   World director
   ====================================================================== */

export function World1({ step, hl, p }: { step: string; hl: string | null; p: Params }) {
  const act = step.split('.')[0];
  return (
    <>
      <Environment />
      <Road />
      <Radar />
      {act === 's0' && <Act0 step={step} />}
      {act === 's1' && <Act1 step={step} p={p} hl={hl} />}
      {act === 's2' && <Act2 step={step} p={p} hl={hl} />}
      {act === 's3' && <Act3 step={step} p={p} hl={hl} />}
      {act === 's4' && <Act4 step={step} p={p} hl={hl} />}
      {act === 's5' && <Act5 step={step} p={p} hl={hl} />}
      {act === 's6' && <Act6 step={step} p={p} />}
      {act === 's7' && <Act7 step={step} p={p} />}
      {act === 's8' && <Act8 step={step} p={p} hl={hl} />}
      {act === 's9' && <Act9 step={step} p={p} />}
      {act === 's10' && <Act10 step={step} p={p} hl={hl} />}
      {act === 's11' && <Act11 step={step} p={p} hl={hl} />}
      {act === 's12' && <Act12 step={step} p={p} />}
      {act === 's13' && <Finale />}
    </>
  );
}

/* ---------------------------------------------------------------- Act 0: cold open */

function Act0({ step }: { step: string }) {
  const t = useT(step);
  if (step === 's0.1') {
    const m = 70 + ((t * 14) % 95);
    return (
      <>
        <Shot pos={[wx(92), 1.1, 4.6]} tgt={[wx(112), 0.3, 0]} />
        <Car position={[wx(m), 0, 0.35]} spin={-t * 18} />
      </>
    );
  }
  if (step === 's0.2') {
    return (
      <>
        <Shot pos={[wx(82), 4.2, 10]} tgt={[wx(86), 0.6, -0.6]} />
        <Car position={[wx(100), 0, 0.35]} />
        <Pulse />
        {t > 1.2 && <Pin m={103} z={0.35} label="radar: z = 103 m" />}
        <Tag position={[wx(100), 0.2, 1.15]} tone="yellow">
          truly at 100 m
        </Tag>
      </>
    );
  }
  // s0.3 lights out, s0.4 the question
  const dark = step === 's0.3' || step === 's0.4';
  const seq = [103, 118, 131, 141, 156];
  const sec = Math.min(Math.floor(t / 1.1), seq.length - 1);
  const shown = step === 's0.4' ? seq.length : sec + 1;
  const carM = step === 's0.4' ? 154 : 100 + Math.min(t / 1.1, seq.length - 1) * 13;
  return (
    <>
      <Shot pos={step === 's0.4' ? [wx(146), 3.6, 7.5] : [wx(122), 5.5, 9.5]} tgt={step === 's0.4' ? [wx(152), 0.6, 0] : [wx(127), 0, 0]} />
      <Car position={[wx(carM), 0, 0.35]} opacity={dark ? 0.06 : 1} lights={!dark} />
      <Pulse period={1.1} />
      {seq.slice(0, shown).map((m, i) => (
        <Pin key={m} m={m} z={0.35} opacity={0.4 + (0.6 * (i + 1)) / shown} label={i === shown - 1 ? `z = ${m} m` : undefined} />
      ))}
      {step === 's0.4' &&
        N1.slice(0, 16).map((n, i) => <Car key={i} ghost opacity={0.1 + 0.15 * Math.exp(-0.5 * n * n)} position={[wx(156 + 4 * n), 0, ((i % 3) - 1) * 0.42]} />)}
      {step === 's0.4' && (
        <Html position={[wx(152), 2.3, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="w-big">
            Where is the car, really?
            <br />
            And how sure are we?
          </div>
        </Html>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- Act 1: belief */

function Act1({ step, p, hl }: { step: string; p: Params; hl: string | null }) {
  const sig = useAnimated(p.sig1, 3);
  const showGhosts = step !== 's1.1';
  return (
    <>
      <Shot pos={[wx(92), 2.6, 6]} tgt={[wx(98), 0.3, 0]} />
      <Car position={[wx(100), 0, 0.35]} opacity={0.18} lights={false} />
      <Tag position={[wx(100), 0.75, 0.35]} tone="yellow">
        hidden truth: 100 m
      </Tag>
      <Pin m={97} z={0.35} label="z = 97 m" />
      {showGhosts &&
        N1.slice(0, 22).map((n, i) => {
          const m = 97 + sig * n;
          const w = Math.exp(-0.5 * n * n);
          return <Car key={i} ghost opacity={(hl === 'belief' ? 0.35 : 0.1) + 0.18 * w} position={[wx(m), 0, ((i % 3) - 1) * 0.42]} />;
        })}
      {step === 's1.3' && (
        <Html position={[wx(97), 1.5, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="w-tag w-tag-blue" style={{ fontSize: 15 }}>
            p(xₖ | 𝒵ᵏ) — our belief
          </div>
        </Html>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- Act 2: density = sand */

const BIN_W = [4, 2, 1, 0.5, 0.25, 0];

function Act2({ step, p, hl }: { step: string; p: Params; hl: string | null }) {
  const t = useT(step, 6);
  const wv = useAnimatedWidth(p.squeeze ? 0.5 : 20);
  if (step === 's2.1') {
    const ticks = linspace(99, 101, 21);
    return (
      <>
        <Shot pos={[wx(100), 0.55, 1.5]} tgt={[wx(100), 0.05, 0]} />
        <Car position={[wx(100), 0, 0.35]} opacity={0.15} lights={false} />
        {ticks.map((m, i) => (
          <mesh key={i} position={[wx(m), 0.004, -0.2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.006, i % 5 === 0 ? 0.24 : 0.12]} />
            <meshBasicMaterial color="#e2e8f0" />
          </mesh>
        ))}
        <Tag position={[wx(100), 0.35, -0.2]} tone="yellow">
          exactly 100.000000… m ?
        </Tag>
        <Tag position={[wx(99), 0.12, -0.35]}>99 m</Tag>
        <Tag position={[wx(101), 0.12, -0.35]}>101 m</Tag>
      </>
    );
  }
  if (step === 's2.2' || step === 's2.3') {
    // burst of radar measurements piling into bins
    const n = step === 's2.2' ? Math.min(500, Math.floor(t * 110)) : 500;
    const bw = step === 's2.2' ? 2 : BIN_W[p.bin];
    const recent = step === 's2.2' ? N1.slice(Math.max(0, n - 8), n) : [];
    let cols: ReactNode[] = [];
    if (bw > 0) {
      const counts: Record<number, number> = {};
      if (step === 's2.2') for (let i = 0; i < n; i++) counts[Math.floor((100 + 5 * N1[i]) / bw)] = (counts[Math.floor((100 + 5 * N1[i]) / bw)] ?? 0) + 1;
      const lo = Math.floor(80 / bw);
      const hi = Math.ceil(120 / bw);
      cols = [];
      for (let b = lo; b < hi; b++) {
        const a = b * bw;
        const dens = step === 's2.2' ? (counts[b] ?? 0) / (500 * bw) : (Phi((a + bw - 100) / 5) - Phi((a - 100) / 5)) / bw;
        cols.push(<Column key={b} x={wx(a + bw / 2)} z={-0.1} h={dens * S} w={(bw / 5) * 0.92} color={W.sand} opacity={0.9} />);
      }
    }
    return (
      <>
        <Shot pos={[wx(100), 2.6, 6.8]} tgt={[wx(100), 0.5, 0]} />
        <Car position={[wx(100), 0, 0.35]} opacity={0.12} lights={false} />
        <Pulse period={0.6} />
        {recent.map((nn, i) => (
          <Pin key={i + '-' + n} m={100 + 5 * nn} z={0.45} h={0.35} />
        ))}
        {bw > 0 ? cols : <Dune ms={ms} ps={ms.map((m) => normal1(m, 100, 25))} scale={S} depth={0.9} z={-0.1} />}
        {step === 's2.2' && <Tag position={[wx(86), 1.5, 0]}>{n} measurements</Tag>}
        {step === 's2.3' && <Tag position={[wx(86), 1.5, 0]}>{bw > 0 ? `bin width ${bw} m` : 'infinitely thin bins'}</Tag>}
      </>
    );
  }
  if (step === 's2.4') {
    const f = (m: number) => normal1(m, 100, 25);
    const amount = Phi((p.b - 100) / 5) - Phi((p.a - 100) / 5);
    return (
      <>
        <Shot pos={[wx(100), 2.4, 6.2]} tgt={[wx(100), 0.4, 0]} />
        <Dune ms={ms} ps={ms.map(f)} scale={S} depth={0.9} z={-0.1} opacity={0.3} />
        <Dune ms={ms} ps={ms.map(f)} scale={S} depth={0.92} z={-0.1} range={[p.a, p.b]} opacity={hl === 'area' ? 1 : 0.95} />
        <TrafficCone m={p.a} label={`a = ${p.a.toFixed(0)} m`} />
        <TrafficCone m={p.b} label={`b = ${p.b.toFixed(0)} m`} />
        <Tag position={[wx((p.a + p.b) / 2), Math.max(f((p.a + p.b) / 2) * S, 0.2) + 0.45, -0.1]} tone="gold">
          {amount.toFixed(3)} of the sand
        </Tag>
      </>
    );
  }
  if (step === 's2.5') {
    const f = (m: number) => (m >= 90 && m <= 110 ? 0.05 : 0);
    return (
      <>
        <Shot pos={[wx(100), 2.2, 6]} tgt={[wx(100), 0.3, 0]} />
        <Dune ms={ms} ps={ms.map(f)} scale={S} depth={0.9} z={-0.1} opacity={0.3} />
        <Dune ms={ms} ps={ms.map(f)} scale={S} depth={0.92} z={-0.1} range={[95, 100]} />
        <TrafficCone m={95} label="95 m" />
        <TrafficCone m={100} label="100 m" />
        <Tag position={[wx(97.5), 1.15, -0.1]} tone="gold">
          5 m × 0.05 = 0.25
        </Tag>
        <Tag position={[wx(110), 0.95, -0.1]}>height 0.05 per metre</Tag>
      </>
    );
  }
  // s2.6 squeeze
  const S2 = 3;
  const f = (m: number) => (Math.abs(m - 100) <= wv / 2 ? 1 / wv : 0);
  return (
    <>
      <Shot pos={[wx(100), 3.2, 8]} tgt={[wx(100), 1.6, 0]} />
      <Dune ms={linspace(60, 160, 2001)} ps={linspace(60, 160, 2001).map(f)} scale={S2} depth={0.9} z={-0.1} />
      <Tag position={[wx(100), (1 / wv) * S2 + 0.4, -0.1]} tone="gold">
        width {wv.toFixed(1)} m · height {(1 / wv).toFixed(2)} per m · area 1
      </Tag>
    </>
  );
}
function useAnimatedWidth(target: number) {
  return useAnimated(target, 2.5);
}

/* ---------------------------------------------------------------- Act 3: expectation */

function Seesaw({ f, mean, step, pivotAt, label }: { f: (m: number) => number; mean: number; step: string; pivotAt?: number; label?: string }) {
  const t = useT(step, 8);
  const piv = pivotAt ?? mean;
  // tilt settles to 0 when the pivot is at the mean; otherwise leans towards the heavy side
  const lean = Math.max(-0.25, Math.min(0.25, -(mean - piv) * 0.03));
  const tilt = lean + 0.14 * Math.exp(-t * 0.9) * Math.cos(t * 3.2);
  const ps = ms.map(f);
  return (
    <group position={[wx(piv), 0.42, -0.1]}>
      <mesh position={[0, -0.21, 0]}>
        <coneGeometry args={[0.18, 0.42, 3]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      <group rotation={[0, 0, tilt]}>
        <mesh position={[wx(100) - wx(piv), 0.02, 0]}>
          <boxGeometry args={[9, 0.05, 0.95]} />
          <meshStandardMaterial color="#8b5a2b" roughness={0.8} />
        </mesh>
        <group position={[-wx(piv), 0.045, 0.1]}>
          <Dune ms={ms} ps={ps} scale={S} depth={0.85} />
        </group>
      </group>
      {label && (
        <Html position={[0, -0.55, 0.7]} center style={{ pointerEvents: 'none' }}>
          <div className="w-tag w-tag-yellow">{label}</div>
        </Html>
      )}
    </group>
  );
}

function Act3({ step, p, hl }: { step: string; p: Params; hl: string | null }) {
  if (step === 's3.3') {
    const w = p.w3;
    const f = (m: number) => w * normal1(m, 90, 4) + (1 - w) * normal1(m, 110, 4);
    const mean = w * 90 + (1 - w) * 110;
    return (
      <>
        <Shot pos={[wx(100), 3, 8]} tgt={[wx(100), 0.6, 0]} />
        <Garage m={90} z={-2.6} />
        <Garage m={110} z={-2.6} />
        <Seesaw f={f} mean={mean} step={step + w.toFixed(2)} label={`𝔼[x] = ${mean.toFixed(1)} m`} />
        {w > 0.25 && w < 0.75 && (
          <>
            <Car ghost opacity={0.45} position={[wx(mean), 0, 0.6]} />
            <Html position={[wx(mean), 0.75, 0.6]} center style={{ pointerEvents: 'none' }}>
              <div className="w-stamp">CAR IS NEVER HERE</div>
            </Html>
          </>
        )}
      </>
    );
  }
  const f = (m: number) => 0.6 * normal1(m, 96, 9) + 0.4 * normal1(m, 108, 4);
  const mean = 0.6 * 96 + 0.4 * 108;
  const guess = step === 's3.4' ? p.guess : mean;
  return (
    <>
      <Shot pos={[wx(101), 2.8, 7.5]} tgt={[wx(101), 0.6, 0]} />
      <Seesaw f={f} mean={mean} step={step + (step === 's3.4' ? guess.toFixed(1) : '')} pivotAt={guess} label={step === 's3.4' ? `guess = ${guess.toFixed(1)} m` : `balance point 𝔼[x] = ${mean.toFixed(1)} m`} />
      {hl === 'mean' && <Mark m={mean} color={W.truth} h={2} z={-0.1} />}
    </>
  );
}

/* ---------------------------------------------------------------- Act 4: spread */

function Act4({ step, p, hl }: { step: string; p: Params; hl: string | null }) {
  const sg = useAnimated(p.sig4, 3);
  if (step === 's4.1' || step === 's4.2') {
    const good = N1.slice(0, 50).map((n) => 100 + 2 * n);
    const bad = N2.slice(0, 50).map((n) => 100 + 20 * n);
    const bands = step === 's4.2' ? N2.slice(0, 6).map((n) => 100 + 20 * n) : [];
    return (
      <>
        <Shot pos={[wx(100), 6.5, 7]} tgt={[wx(100), 0, 0]} />
        <Car position={[wx(100), 0, 0]} opacity={0.15} lights={false} />
        {good.map((m, i) => (
          <Pin key={'g' + i} m={m} z={-0.45} h={0.25} opacity={0.8} />
        ))}
        {bad.map((m, i) => (
          <Pin key={'b' + i} m={m} z={0.45} h={0.25} opacity={step === 's4.2' && i >= 6 ? 0.2 : 0.8} />
        ))}
        <Tag position={[wx(70), 0.3, -0.45]}>precision radar · σ = 2 m</Tag>
        <Tag position={[wx(70), 0.3, 0.45]}>cheap radar · σ = 20 m</Tag>
        {bands.map((m, i) => {
          const d = Math.abs(m - 100) / 5;
          return (
            <group key={'r' + i}>
              <Line points={[[wx(100), 0.06, 0.45], [wx(m), 0.06, 0.45]]} color="#F97316" lineWidth={2.5} />
              <mesh position={[(wx(100) + wx(m)) / 2, d / 2 + 0.06, 0.45 + 0.02 * i]}>
                <planeGeometry args={[d, d]} />
                <meshBasicMaterial color="#F97316" transparent opacity={hl === 'sq' ? 0.4 : 0.16} side={THREE.DoubleSide} />
              </mesh>
            </group>
          );
        })}
      </>
    );
  }
  const f = (m: number) => normal1(m, 100, sg * sg);
  const bandCol = ['#EAB308', '#CA8A04', '#854D0E'];
  return (
    <>
      <Shot pos={[wx(100), 3, 7.5]} tgt={[wx(100), 0.5, 0]} />
      {[3, 2, 1].map((k, i) => (
        <mesh key={k} rotation={[-Math.PI / 2, 0, 0]} position={[wx(100), 0.004 + 0.001 * (3 - k), 0.62]}>
          <planeGeometry args={[(2 * k * sg) / 5, 0.25]} />
          <meshBasicMaterial color={bandCol[2 - i]} transparent opacity={0.85} />
        </mesh>
      ))}
      <Tag position={[wx(100), 0.12, 0.95]}>±1σ: 68 %</Tag>
      <Tag position={[wx(100 + 2 * sg), 0.12, 0.95]}>±2σ: 95 %</Tag>
      <Tag position={[wx(100 + 3 * sg), 0.12, 1.2]}>±3σ: 99.7 %</Tag>
      <Dune ms={ms} ps={ms.map(f)} scale={S} depth={0.9} z={-0.15} />
      {hl === 'sigma' && (
        <>
          <Mark m={100 - sg} color="#F97316" h={1.4} z={-0.15} />
          <Mark m={100 + sg} color="#F97316" h={1.4} z={-0.15} />
        </>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- Act 5: joint */

/** 100 cars in four groups that make the near/far × slow/fast table. */
const LOT = (() => {
  const r = mulberry32(9);
  const U = (a: number, b: number) => a + (b - a) * r();
  const cars: { start: number; v: number }[] = [];
  const add = (n: number, s: [number, number], v: [number, number]) => {
    for (let i = 0; i < n; i++) cars.push({ start: U(...s), v: U(...v) });
  };
  add(30, [0, 30], [8, 13]); // near & slow
  add(10, [0, 15], [15, 17]); // near & fast
  add(15, [40, 50], [12, 14.5]); // far & slow
  add(45, [25, 50], [16, 24]); // far & fast
  return cars;
})();
export const JOINT = [
  [0.3, 0.1],
  [0.15, 0.45],
];
const lotX = (m: number) => -5 + m / 20; // field coordinates: 0..200 m → -5..5

function Bars2x2({ mode }: { mode: 'joint' | 'marginal' | 'conditional' }) {
  const m = useAnimated(mode === 'marginal' ? 1 : 0, 3);
  const c = useAnimated(mode === 'conditional' ? 1 : 0, 3);
  const pFast = 0.55;
  const H = 6;
  const items: ReactNode[] = [];
  for (let r = 0; r < 2; r++)
    for (let k = 0; k < 2; k++) {
      const v = JOINT[r][k];
      let h = v * H;
      let y0 = 0;
      const x = (k === 0 ? -1.2 : 1.2) * (1 - m);
      if (k === 1) y0 = m * JOINT[r][0] * H;
      let opacity = 1;
      if (k === 0) opacity = 1 - 0.9 * c;
      if (k === 1) h = h * (1 + c * (1 / pFast - 1));
      const color = c > 0.5 && k === 1 ? W.post : m > 0.5 ? W.prior : W.sand;
      items.push(
        <group key={`${r}${k}`} position={[x, y0, r === 0 ? 1.3 : -1.3]}>
          <mesh position={[0, h / 2, 0]}>
            <boxGeometry args={[1.5, Math.max(h, 0.001), 1.5]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} transparent opacity={opacity} />
          </mesh>
          {opacity > 0.5 && m < 0.5 && (
            <Html position={[0, h + 0.3, 0]} center style={{ pointerEvents: 'none' }}>
              <div className="w-num" style={{ fontSize: 15 }}>
                {c > 0.5 && k === 1 ? (v / pFast).toFixed(2) : v.toFixed(2)}
              </div>
            </Html>
          )}
        </group>,
      );
    }
  if (m > 0.5)
    [0, 1].forEach((r) =>
      items.push(
        <Html key={'s' + r} position={[0, (JOINT[r][0] + JOINT[r][1]) * H + 0.3, r === 0 ? 1.3 : -1.3]} center style={{ pointerEvents: 'none' }}>
          <div className="w-num" style={{ fontSize: 15, color: '#bbf7d0' }}>
            p({r === 0 ? 'near' : 'far'}) = {(JOINT[r][0] + JOINT[r][1]).toFixed(2)}
          </div>
        </Html>,
      ),
    );
  return (
    <group>
      {items}
      <Tag position={[-3.2, 0.05, 1.3]}>near</Tag>
      <Tag position={[-3.2, 0.05, -1.3]}>far</Tag>
      {m < 0.5 && (
        <>
          <Tag position={[-1.2, 0.05, 2.6]}>slow</Tag>
          <Tag position={[1.2, 0.05, 2.6]}>fast</Tag>
        </>
      )}
    </group>
  );
}

/** Joint landscape for position (x) and speed (y), optionally drawn as n×n bars. */
function Landscape({ P, res, opacity = 0.85, color = W.sand }: { P: M2; res: number; opacity?: number; color?: string }) {
  const f = (x: number, y: number) => {
    if (res > 0) {
      const w = 8 / res;
      x = -4 + (Math.floor((x + 4) / w) + 0.5) * w;
      y = -4 + (Math.floor((y + 4) / w) + 0.5) * w;
    }
    return 7 * normal2([x, y], [0, 0], P);
  };
  return <Surface f={f} xr={[-4, 4]} yr={[-4, 4]} res={res > 0 && res <= 8 ? 160 : 90} color={color} opacity={opacity} wire={res === 0} />;
}

function FieldAxes({ x = 'position', y = 'speed' }: { x?: string; y?: string }) {
  return (
    <group>
      <Line points={[[-4.4, 0.01, 4.4], [4.6, 0.01, 4.4]]} color="#64748B" lineWidth={1.5} />
      <Line points={[[-4.4, 0.01, 4.4], [-4.4, 0.01, -4.6]]} color="#64748B" lineWidth={1.5} />
      <Tag position={[4.9, 0.05, 4.4]}>{x} →</Tag>
      <Tag position={[-4.4, 0.05, -5]}>{y} →</Tag>
    </group>
  );
}

const RES = [2, 4, 8, 32, 0];

function Act5({ step, p, hl }: { step: string; p: Params; hl: string | null }) {
  const t = useT(step, 4);
  if (step === 's5.1') {
    return (
      <>
        <Shot pos={[wx(96), 1.6, 4.2]} tgt={[wx(101), 0.5, 0]} />
        <Car position={[wx(100), 0, 0.35]} />
        <Speedometer position={[wx(100), 1.25, 0.35]} kmh={72} />
        <Tag position={[wx(100), 0.85, 0.35]} tone="yellow">
          where? and how fast?
        </Tag>
      </>
    );
  }
  if (step === 's5.2' || step === 's5.3') {
    const k = Math.min(t / 3, 1);
    const sorted = step === 's5.3';
    return (
      <>
        <Shot pos={sorted ? [0, 8, FIELD_Z + 9] : [0, 6.5, FIELD_Z + 9.5]} tgt={sorted ? [0, 0.5, FIELD_Z] : [0, 0, FIELD_Z + 3.4]} />
        <group position={[0, 0, FIELD_Z]}>
          {!sorted && (
            <>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 3.6]}>
                <planeGeometry args={[10.4, 1.1]} />
                <meshStandardMaterial color={W.asphalt} />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[lotX(50), 0.005, 3.6]}>
                <planeGeometry args={[5, 1.1]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={0.06} />
              </mesh>
              <Line points={[[0, 0.01, 2.9], [0, 0.01, 4.3]]} color="#e2e8f0" lineWidth={2} dashed dashSize={0.08} gapSize={0.06} />
              <Tag position={[lotX(50), 0.05, 2.5]}>NEAR · 0–100 m</Tag>
              <Tag position={[lotX(150), 0.05, 2.5]}>FAR · 100–200 m</Tag>
              {LOT.map((c, i) => {
                const m = c.start + k * 5 * c.v;
                const fast = c.v > 15;
                return (
                  <mesh key={i} position={[lotX(m), 0.06, 3.15 + ((i * 37) % 10) * 0.09]}>
                    <boxGeometry args={[0.16, 0.1, 0.07]} />
                    <meshStandardMaterial color={fast ? '#F97316' : '#2DD4BF'} emissive={fast ? '#F97316' : '#2DD4BF'} emissiveIntensity={0.4} />
                  </mesh>
                );
              })}
              <Tag position={[-3.5, 0.6, 4.5]}>🟧 fast (over 54 km/h) · 🟩 slow</Tag>
              <Tag position={[0, 1.2, 3.6]} tone="yellow">
                {k < 1 ? `t = ${(k * 5).toFixed(1)} s` : '5 seconds later'}
              </Tag>
            </>
          )}
          {sorted && <Bars2x2 mode="joint" />}
        </group>
      </>
    );
  }
  // s5.4 landscape, s5.5 correlation & covariance
  const P = covFrom(p.sx, p.sy, step === 's5.4' ? 0.6 : p.rho);
  return (
    <>
      <Shot pos={[6, 7, FIELD_Z + 8]} tgt={[0, 0.6, FIELD_Z]} />
      <group position={[0, 0, FIELD_Z]}>
        <FieldAxes />
        <Landscape P={P} res={step === 's5.4' ? RES[p.res] : 0} />
        {step === 's5.5' &&
          [1, 2].map((c) => <Line key={c} points={ellipse([0, 0], P, c).map(([x, y]) => [x, 0.02, -y] as P3)} color="#F97316" lineWidth={hl === 'cov' ? 3.5 : 2} />)}
      </group>
    </>
  );
}

/* ---------------------------------------------------------------- Act 6: marginal */

function Act6({ step, p }: { step: string; p: Params }) {
  const tt = useAnimated(p.push, 2.5);
  if (step === 's6.1') {
    return (
      <>
        <Shot pos={[0, 8, FIELD_Z + 9]} tgt={[0, 0.8, FIELD_Z]} />
        <group position={[0, 0, FIELD_Z]}>
          <Bars2x2 mode="marginal" />
        </group>
      </>
    );
  }
  const P = covFrom(p.sx, p.sy, p.rho);
  const wall = -4.5;
  const xs = linspace(-4, 4, 161);
  const marg = xs.map((x) => normal1(x, 0, P[0][0]));
  return (
    <>
      <Shot pos={[7, 6, FIELD_Z + 7]} tgt={[0, 0.7, FIELD_Z - 1.5]} />
      <group position={[0, 0, FIELD_Z]}>
        <FieldAxes />
        <Surface f={(x, y) => 7 * normal2([x, y], [0, 0], P)} xr={[-4, 4]} yr={[-4, 4]} color={W.sand} opacity={0.85 - 0.5 * tt} zOf={(y) => (1 - tt) * -y + tt * wall} />
        {/* bulldozer blade */}
        <group position={[0, 0, 4.2 - tt * (4.2 - wall) - 0.2]}>
          <mesh position={[0, 0.22, 0]}>
            <boxGeometry args={[8.6, 0.44, 0.08]} />
            <meshStandardMaterial color="#F59E0B" metalness={0.5} roughness={0.4} transparent opacity={tt > 0.98 ? 0 : 0.55} />
          </mesh>
        </group>
        <Line points={xs.map((x, i) => [x, marg[i] * 3 * tt + 0.01, wall - 0.05] as P3)} color={W.prior} lineWidth={4} />
        {tt > 0.6 && <Tag position={[0, 3 * normal1(0, 0, P[0][0]) + 0.5, wall]} tone="green">p(position) = ∫ p(position, speed) d speed</Tag>}
      </group>
    </>
  );
}

/* ---------------------------------------------------------------- Act 7: conditional */

function Act7({ step, p }: { step: string; p: Params }) {
  const tt = useAnimated(p.renorm, 3);
  if (step === 's7.1') {
    return (
      <>
        <Shot pos={[2, 6.5, 4.5]} tgt={[0, 0.8, FIELD_Z + 1]} />
        <Car police position={[wx(108), 0, 0.35]} />
        <Tag position={[wx(108), 1, 0.35]} tone="blue">
          “The car is FAST.”
        </Tag>
        <group position={[0, 0, FIELD_Z]}>
          <Bars2x2 mode={p.tip ? 'conditional' : 'joint'} />
        </group>
      </>
    );
  }
  const rho = step === 's7.3' ? 0 : p.rho;
  const P = covFrom(p.sx, p.sy, rho);
  const y0 = p.y0;
  const xs = linspace(-4, 4, 161);
  const cm = (P[0][1] / P[1][1]) * y0;
  const cs2 = P[0][0] - (P[0][1] * P[0][1]) / P[1][1];
  const pts = xs.map((x) => [x, (1 - tt) * 7 * normal2([x, y0], [0, 0], P) + tt * 3 * normal1(x, cm, cs2) + 0.01, -y0] as P3);
  const peak = Math.max(...pts.map((q) => q[1]));
  return (
    <>
      <Shot pos={[6.5, 5.5, FIELD_Z + 7.5]} tgt={[0, 0.6, FIELD_Z]} />
      <group position={[0, 0, FIELD_Z]}>
        <FieldAxes />
        <Surface f={(x, y) => 7 * normal2([x, y], [0, 0], P)} xr={[-4, 4]} yr={[-4, 4]} color={W.sand} opacity={0.4} />
        <mesh position={[0, 1.4, -y0]}>
          <planeGeometry args={[8.4, 2.8]} />
          <meshBasicMaterial color={W.meas} transparent opacity={0.1} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <Line points={pts} color={tt > 0.5 ? W.post : W.sand} lineWidth={4} />
        <Tag position={[cm, peak + 0.45, -y0]} tone={tt > 0.5 ? 'blue' : 'gold'}>
          {tt > 0.5 ? 'p(position | speed) — rescaled' : 'p(position, speed) along the cut'}
        </Tag>
        <Line points={[[cm, 0.01, -y0], [cm, peak, -y0]]} color="#e2e8f0" lineWidth={1} dashed dashSize={0.06} gapSize={0.05} />
      </group>
    </>
  );
}

/* ---------------------------------------------------------------- Act 8: Bayes on the road */

export const CELLS8 = [100, 110, 120, 130];
export const PRIOR8 = [0.1, 0.4, 0.4, 0.1];
export function bayes8(z: number, s: number) {
  const lik = CELLS8.map((c) => Math.exp(-0.5 * ((z - c) / s) ** 2));
  const prod = PRIOR8.map((q, i) => q * lik[i]);
  const sum = prod.reduce((a, b) => a + b, 0);
  return { lik, prod, sum, post: prod.map((v) => v / sum) };
}

function Act8({ step, p, hl }: { step: string; p: Params; hl: string | null }) {
  const stage = { 's8.1': 1, 's8.2': 2, 's8.3': 3, 's8.4': 4, 's8.5': 5 }[step] ?? 1;
  const { lik, prod, post } = bayes8(p.z8, p.s8);
  const H = 2.6;
  const g = useAnimated(stage >= 3 ? 1 : 0, 3);
  const r = useAnimated(stage >= 4 ? 1 : 0, 3);
  if (stage === 5) {
    const pr = (m: number) => normal1(m, 115, 64);
    const lk = (m: number) => normal1(p.z8, m, p.s8 * p.s8);
    const S8 = 64 + p.s8 * p.s8;
    const W8 = 64 / S8;
    const po = (m: number) => normal1(m, 115 + W8 * (p.z8 - 115), 64 - W8 * W8 * S8);
    return (
      <>
        <Shot pos={[wx(114), 3.2, 7.5]} tgt={[wx(114), 0.6, 0]} />
        <Dune ms={ms} ps={ms.map(pr)} scale={S} depth={0.25} z={-0.5} color={W.prior} opacity={hl === 'prior' ? 1 : 0.7} />
        <RoadCurve f={lk} scale={S} color={W.meas} z={0} width={hl === 'lik' ? 5 : 3} />
        <Dune ms={ms} ps={ms.map(po)} scale={S} depth={0.25} z={0.5} color={W.post} opacity={hl === 'post' ? 1 : 0.85} />
        <Pin m={p.z8} z={0} label={`z = ${p.z8.toFixed(0)} m`} />
        <Tag position={[wx(85), 0.6, -0.5]} tone="green">
          prior
        </Tag>
        <Tag position={[wx(85), 0.6, 0.5]} tone="blue">
          posterior
        </Tag>
      </>
    );
  }
  return (
    <>
      <Shot pos={[wx(114), 4, 9]} tgt={[wx(115), 0.9, 0]} />
      {CELLS8.map((c) => (
        <Lamppost key={c} m={c} />
      ))}
      {CELLS8.map((c, i) => (
        <group key={'c' + c}>
          {/* prior (green) and likelihood (red) side by side, merging into gold, then rescaled to blue */}
          <Column x={wx(c) - 0.3 * (1 - g)} z={-0.15} h={PRIOR8[i] * H * (1 - g) + 0.0001} w={0.45} color={W.prior} opacity={(1 - g) * 0.95} label={g < 0.5 ? PRIOR8[i].toFixed(2) : undefined} />
          {stage >= 2 && <Column x={wx(c) + 0.3 * (1 - g)} z={-0.15} h={lik[i] * H * (1 - g) + 0.0001} w={0.45} color={W.meas} opacity={(1 - g) * 0.95} label={g < 0.5 ? lik[i].toFixed(2) : undefined} />}
          {stage >= 3 && (
            <Column
              x={wx(c)}
              z={-0.15}
              h={(prod[i] * (1 - r) + post[i] * r) * H * g + 0.0001}
              w={0.55}
              color={r > 0.5 ? W.post : W.sand}
              opacity={g}
              label={g > 0.5 ? (r > 0.5 ? post[i].toFixed(3) : prod[i].toFixed(3)) : undefined}
            />
          )}
        </group>
      ))}
      {stage >= 2 && (
        <>
          <Pin m={p.z8} z={0.5} label={`radar: z = ${p.z8.toFixed(0)} m`} />
          <RoadCurve f={(m) => Math.exp(-0.5 * ((p.z8 - m) / p.s8) ** 2)} scale={0.6} color={W.meas} z={0.5} from={70} to={160} width={2} />
        </>
      )}
      <Tag position={[wx(86), 0.3, -0.15]}>{stage === 1 ? 'prior' : stage === 2 ? 'prior · likelihood' : stage === 3 ? 'prior × likelihood' : 'posterior (rescaled)'}</Tag>
    </>
  );
}

/* ---------------------------------------------------------------- Act 9: matrices */

const PRESETS: Record<string, M2> = {
  drive: [
    [1, 1],
    [0, 1],
  ],
  stretch: [
    [2, 0],
    [0, 1],
  ],
  rotate: [
    [Math.cos(0.6), -Math.sin(0.6)],
    [Math.sin(0.6), Math.cos(0.6)],
  ],
};

function Act9({ step, p }: { step: string; p: Params }) {
  const k = useAnimated(p.mm, 3);
  const Mx = step === 's9.1' ? PRESETS.drive : PRESETS[p.preset];
  const inv = step === 's9.3' && p.undo;
  const ui = useAnimated(inv ? 1 : 0, 3);
  const apply = (x: number, y: number): V2 => {
    const tx = Mx[0][0] * x + Mx[0][1] * y;
    const ty = Mx[1][0] * x + Mx[1][1] * y;
    const ax = x + k * (tx - x);
    const ay = y + k * (ty - y);
    return [ax + ui * (x - ax), ay + ui * (y - ay)];
  };
  const grid: ReactNode[] = [];
  for (let i = -3; i <= 3; i++) {
    grid.push(<Line key={'v' + i} points={linspace(-3, 3, 13).map((t) => apply(i, t)).map(([a, b]) => [a, 0.01, -b] as P3)} color="#334155" lineWidth={1} />);
    grid.push(<Line key={'h' + i} points={linspace(-3, 3, 13).map((t) => apply(t, i)).map(([a, b]) => [a, 0.01, -b] as P3)} color="#334155" lineWidth={1} />);
  }
  const cars: ReactNode[] = [];
  for (let i = -2; i <= 2; i++)
    for (let j = -2; j <= 2; j++) {
      const [a, b] = apply(i, j);
      cars.push(
        <mesh key={`${i}${j}`} position={[a, 0.06, -b]}>
          <boxGeometry args={[0.22, 0.1, 0.12]} />
          <meshStandardMaterial color={j > 0 ? '#F97316' : j < 0 ? '#2DD4BF' : '#e2e8f0'} emissive={j > 0 ? '#F97316' : '#2DD4BF'} emissiveIntensity={0.3} />
        </mesh>,
      );
    }
  const sq = [apply(0, 0), apply(1, 0), apply(1, 1), apply(0, 1), apply(0, 0)].map(([a, b]) => [a, 0.02, -b] as P3);
  const det = Mx[0][0] * Mx[1][1] - Mx[0][1] * Mx[1][0];
  const e1 = apply(1, 0);
  const e2 = apply(0, 1);
  const v = apply(1, 2);
  return (
    <>
      <Shot pos={[0.5, 9, FIELD_Z + 6]} tgt={[0, 0, FIELD_Z]} />
      <group position={[0, 0, FIELD_Z]}>
        {grid}
        {step !== 's9.1' && cars}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
          <shapeGeometry args={[new THREE.Shape(sq.map(([a, , c]) => new THREE.Vector2(a, -c)))]} />
          <meshBasicMaterial color="#EAB308" transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
        <Line points={[[0, 0.03, 0], [e1[0], 0.03, -e1[1]]]} color="#F97316" lineWidth={4} />
        <Line points={[[0, 0.03, 0], [e2[0], 0.03, -e2[1]]]} color="#3B82F6" lineWidth={4} />
        {step === 's9.1' && (
          <>
            <Line points={[[0, 0.04, 0], [v[0], 0.04, -v[1]]]} color="#FBBF24" lineWidth={4} />
            <Tag position={[v[0], 0.3, -v[1]]} tone="yellow">
              {k < 0.5 ? 'x = (1, 2)' : 'M x = (3, 2)'}
            </Tag>
          </>
        )}
        <Tag position={[sq[2][0] + 0.3, 0.3, sq[2][2]]} tone="gold">
          area = {(ui > 0.5 ? 1 : 1 + k * (det - 1)).toFixed(2)}
        </Tag>
        <Tag position={[3.6, 0.05, 0.3]}>position →</Tag>
        <Tag position={[0.3, 0.05, -3.6]}>speed →</Tag>
      </group>
    </>
  );
}

/* ---------------------------------------------------------------- Act 10: the Gaussian */

function diceDist(n: number) {
  let d = [1];
  for (let k = 0; k < n; k++) {
    const nd = new Array(d.length + 6).fill(0);
    d.forEach((v, i) => {
      for (let f = 1; f <= 6; f++) nd[i + f] += v / 6;
    });
    d = nd;
  }
  return d;
}

function Act10({ step, p, hl }: { step: string; p: Params; hl: string | null }) {
  if (step === 's10.1') {
    const d = diceDist(p.dice);
    const vals = d.map((v, i) => ({ s: i, v })).filter((o) => o.v > 0);
    const max = Math.max(...vals.map((o) => o.v));
    const w = 8 / vals.length;
    return (
      <>
        <Shot pos={[0, 5.5, FIELD_Z + 9]} tgt={[0, 1.3, FIELD_Z]} />
        <group position={[0, 0, FIELD_Z]}>
          {vals.map((o, i) => (
            <Column key={o.s} x={-4 + w * (i + 0.5)} h={(o.v / max) * 3} w={w * 0.85} color={W.sand} label={vals.length <= 11 ? o.s : undefined} />
          ))}
          <Tag position={[0, 3.6, 0]} tone="gold">
            sum of {p.dice} dice
          </Tag>
        </group>
      </>
    );
  }
  if (step === 's10.2') {
    const sg = p.sig10;
    const f = (m: number) => normal1(m, 100, sg * sg);
    const peak = f(100) * S;
    return (
      <>
        <Shot pos={[wx(100), 2.6, 7]} tgt={[wx(100), 0.6, 0]} />
        <Dune ms={ms} ps={ms.map(f)} scale={S} depth={0.9} z={-0.1} />
        {[0, 1, 2].map((k) => (
          <group key={k}>
            <Mark m={100 + k * sg} color={k === 0 ? W.truth : '#F97316'} h={f(100 + k * sg) * S + 0.02} z={0.4} />
            <Tag position={[wx(100 + k * sg), f(100 + k * sg) * S + 0.3, 0.4]} tone={k === 0 ? 'yellow' : undefined}>
              {k === 0 ? 'x̄: height 100 %' : `${k}σ away: e^(−${(k * k) / 2}) = ${(Math.exp((-k * k) / 2) * 100).toFixed(1)} %`}
            </Tag>
          </group>
        ))}
        {hl === 'norm' && <Tag position={[wx(80), peak, 0]}>area = 1 → peak = 1/√(2πσ²)</Tag>}
      </>
    );
  }
  // car park: s10.3 ellipse, s10.4 mahalanobis, s10.5 hill
  const beam = 0.35; // beam direction angle
  const along: V2 = [Math.cos(beam), Math.sin(beam)];
  const across: V2 = [-Math.sin(beam), Math.cos(beam)];
  const sR = 0.5;
  const sA = 2.0; // world units (1 unit = 20 m here): 10 m along, 40 m across
  const P: M2 = [
    [sR * sR * along[0] * along[0] + sA * sA * across[0] * across[0], sR * sR * along[0] * along[1] + sA * sA * across[0] * across[1]],
    [sR * sR * along[0] * along[1] + sA * sA * across[0] * across[1], sR * sR * along[1] * along[1] + sA * sA * across[1] * across[1]],
  ];
  const c0: V2 = [1, 0.5];
  const radar: V2 = [c0[0] - 6 * along[0], c0[1] - 6 * along[1]];
  if (step === 's10.5') {
    const P2 = covFrom(p.sx, p.sy, p.rho);
    return (
      <>
        <Shot pos={[6, 7, FIELD_Z + 8]} tgt={[0, 0.5, FIELD_Z]} />
        <group position={[0, 0, FIELD_Z]}>
          <Surface f={(x, y) => 7 * normal2([x, y], [0, 0], P2)} xr={[-4, 4]} yr={[-4, 4]} color={W.belief} opacity={0.85} />
          {[1, 2, 3].map((c) => (
            <Line key={c} points={ellipse([0, 0], P2, c).map(([x, y]) => [x, 0.02, -y] as P3)} color="#F97316" lineWidth={hl === 'maha' ? 3.5 : 1.8} />
          ))}
        </group>
      </>
    );
  }
  const pA: V2 = [c0[0] + 3 * sR * along[0], c0[1] + 3 * sR * along[1]];
  const pB: V2 = [c0[0] + 3 * sR * across[0], c0[1] + 3 * sR * across[1]];
  return (
    <>
      <Shot pos={[c0[0], 10, FIELD_Z - c0[1] + 4]} tgt={[c0[0], 0, FIELD_Z - c0[1]]} />
      <group position={[0, 0, FIELD_Z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
          <planeGeometry args={[16, 12]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
        {linspace(-7, 7, 15).map((x) => (
          <Line key={x} points={[[x, 0.004, -5], [x, 0.004, 5]]} color="#1f2937" lineWidth={1} />
        ))}
        <mesh position={[radar[0], 0.4, -radar[1]]}>
          <cylinderGeometry args={[0.15, 0.25, 0.8, 8]} />
          <meshStandardMaterial color="#94A3B8" />
        </mesh>
        <Tag position={[radar[0], 1, -radar[1]]}>radar</Tag>
        <Line points={[[radar[0], 0.02, -radar[1]], [c0[0] + 2 * along[0], 0.02, -(c0[1] + 2 * along[1])]]} color="#FCA5A5" lineWidth={1.5} dashed dashSize={0.15} gapSize={0.1} />
        {N1.slice(0, 160).map((n, i) => {
          const x = c0[0] + sR * n * along[0] + sA * N3[i] * across[0];
          const y = c0[1] + sR * n * along[1] + sA * N3[i] * across[1];
          return (
            <mesh key={i} position={[x, 0.04, -y]}>
              <sphereGeometry args={[0.045, 8, 8]} />
              <meshBasicMaterial color={W.belief} transparent opacity={0.6} />
            </mesh>
          );
        })}
        {[1, 2, 3].map((c) => (
          <Line key={c} points={ellipse(c0, P, c).map(([x, y]) => [x, 0.03, -y] as P3)} color="#F97316" lineWidth={c === 1 ? 2.5 : 1.5} />
        ))}
        <Car position={[c0[0], 0, -c0[1]]} opacity={0.5} lights={false} scale={0.8} />
        {step === 's10.4' && (
          <>
            <mesh position={[pA[0], 0.15, -pA[1]]}>
              <sphereGeometry args={[0.13, 16, 16]} />
              <meshStandardMaterial color={W.meas} emissive={W.meas} emissiveIntensity={1.2} />
            </mesh>
            <Tag position={[pA[0] + 0.3, 0.6, -pA[1]]} tone="red">
              A: 30 m along the beam = 3σ 🚨
            </Tag>
            <mesh position={[pB[0], 0.15, -pB[1]]}>
              <sphereGeometry args={[0.13, 16, 16]} />
              <meshStandardMaterial color="#22C55E" emissive="#22C55E" emissiveIntensity={1.2} />
            </mesh>
            <Tag position={[pB[0], 0.6, -pB[1]]} tone="green">
              B: 30 m sideways = 0.75σ ✓
            </Tag>
          </>
        )}
      </group>
    </>
  );
}

/* ---------------------------------------------------------------- Act 11: drive the ghost cars */

function Act11({ step, p, hl }: { step: string; p: Params; hl: string | null }) {
  const k = useAnimated(p.drive, 1.6);
  const dt = p.dt;
  const ghosts = N1.slice(0, 120).map((n, i) => ({ x: 100 + 5 * n, v: 20 + 2 * N2[i] }));
  // phase board on the field: x-dev (m)/5 → world, v-dev (m/s) → world
  const bx = (m: number) => (m - 110) / 5;
  const bv = (v: number) => (v - 20) * 0.9;
  const X: M2 = [
    [25, 0],
    [0, 4],
  ];
  const PY: M2 = [
    [X[0][0] + dt * dt * X[1][1], dt * X[1][1]],
    [dt * X[1][1], X[1][1]],
  ];
  const toBoard = (m: V2, Pm: M2) =>
    ellipse(m, Pm, 2).map(([x, v]) => [bx(x), 0.03, -bv(v)] as P3);
  return (
    <>
      <Shot pos={[wx(110), 9, 7]} tgt={[wx(110), 0, FIELD_Z / 2]} />
      {ghosts.slice(0, 36).map((g, i) => (
        <Car key={i} ghost opacity={0.16} position={[wx(g.x + k * dt * g.v), 0, 0.35 + 0.18 * N3[i]]} />
      ))}
      <Tag position={[wx(80), 0.6, 0.6]}>possible cars · each drives at its own speed</Tag>
      <group position={[0, 0, FIELD_Z + 2]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[wx(110), 0.002, 0]}>
          <planeGeometry args={[16, 7]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <Line points={[[bx(80), 0.01, 0], [bx(145), 0.01, 0]]} color="#475569" lineWidth={1.5} />
        <Line points={[[bx(100), 0.01, 3.2], [bx(100), 0.01, -3.2]]} color="#475569" lineWidth={1.5} />
        <Tag position={[bx(146), 0.05, 0.3]}>position →</Tag>
        <Tag position={[bx(100), 0.05, -3.4]}>speed ↑</Tag>
        {ghosts.map((g, i) => (
          <mesh key={i} position={[bx(g.x + k * dt * g.v), 0.05, -bv(g.v)]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshBasicMaterial color={k > 0.5 ? W.belief : W.prior} />
          </mesh>
        ))}
        <Line points={toBoard([100, 20], X)} color={W.prior} lineWidth={2} dashed dashSize={0.15} gapSize={0.1} />
        <Line points={toBoard([100 + dt * 20, 20], PY)} color={W.belief} lineWidth={hl === 'AXA' ? 4 : 2.5} />
        <Tag position={[bx(100 + dt * 20) + 1.5, 0.3, -2.2]} tone="blue">
          predicted 𝒩(A x̄, A X Aᵀ)
        </Tag>
      </group>
    </>
  );
}

/* ---------------------------------------------------------------- Act 12: certainty */

function Act12({ p }: { step: string; p: Params }) {
  const s = useAnimated(p.dsig, 3);
  const f = (m: number) => normal1(m, 100, s * s);
  return (
    <>
      <Shot pos={[wx(97), 2.8, 7]} tgt={[wx(100), 1.3, 0]} />
      <Car position={[wx(100), 0, 0.5]} />
      <Dune ms={linspace(60, 160, 3001)} ps={linspace(60, 160, 3001).map(f)} scale={3} depth={0.4} z={-0.3} />
      <Tag position={[wx(100), Math.min(f(100) * 3, 9) + 0.3, -0.3]} tone="gold">
        σ = {s.toFixed(2)} m · peak = {f(100).toFixed(2)} per m
      </Tag>
    </>
  );
}

function Finale() {
  const t = useT('fin');
  const m = 70 + ((t * 10) % 95);
  return (
    <>
      <Shot pos={[wx(80), 7, 11]} tgt={[wx(115), 0, -2]} />
      <Car position={[wx(m), 0, 0.35]} spin={-t * 14} />
      {CELLS8.map((c) => (
        <Lamppost key={c} m={c} />
      ))}
      <Pulse />
    </>
  );
}

export { ROAD_W };
