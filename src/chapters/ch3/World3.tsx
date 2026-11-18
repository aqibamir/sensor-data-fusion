import { Html, Line, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { createContext, ReactNode, Suspense, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { ellipse, normal1, normal2 } from '../../engine/gaussian';
import { Coast, Gauss2, kfPredict, kfUpdate } from '../../engine/kalman2';
import { M2, V2 } from '../../engine/mat2';
import { Camera, P3, Surface, useAnimated } from '../../three/primitives';
import { SpaceSet } from '../../world/space';
import { Params3 } from './model';

/* ---------------------------------------------------------------- helpers */

const NonceCtx = createContext(0);
function Shot({ pos, tgt }: { pos: P3; tgt: P3 }) {
  return <Camera position={pos} target={tgt} nonce={useContext(NonceCtx)} />;
}
function useT(key: string) {
  const [t, setT] = useState(0);
  const start = useRef<number | null>(null);
  const last = useRef(-1);
  useEffect(() => {
    start.current = null;
    last.current = -1;
    setT(0);
  }, [key]);
  useFrame(({ clock }) => {
    if (start.current === null) start.current = clock.elapsedTime;
    const v = clock.elapsedTime - start.current;
    // React re-render at most 30×/s (was every frame); animations stay smooth, CPU drops a lot
    const q = Math.round(v * 30) / 30;
    if (q !== last.current && true) {
      last.current = q;
      setT(q);
    }
  });
  return t;
}
const C3 = { truth: '#FBBF24', meas: '#EF4444', prior: '#22C55E', post: '#3B82F6', retro: '#A855F7', gold: '#EAB308' };

/** distance from Earth (1000 km) → world x */
export const cx = (r: number) => -5.8 + (r / 384) * 12.6;

function Tag({ position, children, tone }: { position: P3; children: ReactNode; tone?: string }) {
  return (
    <Html position={position} center style={{ pointerEvents: 'none' }}>
      <div className={`w-tag ${tone ? 'w-tag-' + tone : ''}`}>{children}</div>
    </Html>
  );
}

/* ---------------------------------------------------------------- the space set */

function Space() {
  return (
    <SpaceSet>
      <Tag position={[-7.4, -1.75, 0]}>Earth</Tag>
      <Tag position={[7.3, -0.85, 0]}>Moon · 384 000 km (not to scale)</Tag>
      <Line points={[[-6, 0, 0], [6.8, 0, 0]]} color="#475569" lineWidth={1} dashed dashSize={0.2} gapSize={0.15} transparent opacity={0.6} />
    </SpaceSet>
  );
}

/**
 * NASA's Apollo–Soyuz model (NASA 3D Resources, credit NASA), showing only the Apollo command/service
 * module parts (they lie at x < 0 in the file; the Soyuz and docking module are dropped).
 * Nose (command module) points +x, towards the Moon. ~1 world unit long.
 */
function ApolloModel({ opacity, burn }: { opacity: number; burn: boolean }) {
  const { scene } = useGLTF('/space/apollo_soyuz.glb');
  const model = useMemo(() => {
    const root = scene.clone(true);
    const drop: THREE.Object3D[] = [];
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.geometry.computeBoundingBox();
      if (m.geometry.boundingBox!.max.x > 0) drop.push(m);
      else {
        const mats = (Array.isArray(m.material) ? m.material : [m.material]).map((mat) => {
          const c = (mat as THREE.MeshStandardMaterial).clone();
          if (opacity < 1) {
            c.transparent = true;
            c.opacity = opacity;
          }
          return c;
        });
        m.material = Array.isArray(m.material) ? mats : mats[0];
      }
    });
    drop.forEach((o) => o.parent?.remove(o));
    return root;
  }, [scene, opacity]);
  return (
    <group scale={0.085} position={[0.53, 0, 0]}>
      <primitive object={model} />
      {burn && (
        <mesh position={[-13.4, 0.3, 0.2]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[1.1, 3.2, 16]} />
          <meshBasicMaterial color={new THREE.Color(3, 1.6, 0.6)} toneMapped={false} transparent opacity={0.85} />
        </mesh>
      )}
    </group>
  );
}
useGLTF.preload('/space/apollo_soyuz.glb');

function Spacecraft({ x, opacity = 1, burn = false }: { x: number; opacity?: number; burn?: boolean }) {
  return (
    <group position={[x, 0, 0]}>
      <Suspense fallback={<SimpleCraft x={0} opacity={opacity} burn={burn} />}>
        <ApolloModel opacity={opacity} burn={burn} />
      </Suspense>
    </group>
  );
}

function SimpleCraft({ x, opacity = 1, burn = false }: { x: number; opacity?: number; burn?: boolean }) {
  return (
    <group position={[x, 0, 0]} rotation={[0, 0, -Math.PI / 2]} scale={0.32}>
      <mesh position={[0, 0.7, 0]}>
        <coneGeometry args={[0.55, 0.7, 24]} />
        <meshStandardMaterial color="#E5E7EB" metalness={0.8} roughness={0.25} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 1.0, 24]} />
        <meshStandardMaterial color="#CBD5E1" metalness={0.7} roughness={0.35} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      <mesh position={[0, -0.85, 0]}>
        <coneGeometry args={[0.32, 0.45, 18, 1, true]} />
        <meshStandardMaterial color="#64748B" side={THREE.DoubleSide} />
      </mesh>
      {burn && (
        <mesh position={[0, -1.4, 0]}>
          <coneGeometry args={[0.25, 0.9, 16]} />
          <meshBasicMaterial color="#FDBA74" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}

/** A tracking-station beam from Earth to the craft. */
function Beam({ x, on }: { x: number; on: boolean }) {
  if (!on) return null;
  return <Line points={[[-6.2, 0.4, 0.4], [x, 0, 0]]} color={C3.meas} lineWidth={1.5} transparent opacity={0.7} />;
}

/* ---------------------------------------------------------------- the phase board */

const B = { x: 0, y: 3.1, z: -3.2, w: 9, h: 4.4 };
const kr = 0.42; // world units per 1000 km of position deviation
const kv = 1.2; // world units per 1000 km/h of speed deviation

function Board({ title, children }: { title: string; children: ReactNode }) {
  return (
    <group position={[B.x, B.y, B.z]}>
      <mesh>
        <planeGeometry args={[B.w, B.h]} />
        <meshBasicMaterial color="#0B1220" transparent opacity={0.85} />
      </mesh>
      <Line points={[[-B.w / 2 + 0.3, 0, 0.01], [B.w / 2 - 0.3, 0, 0.01]]} color="#475569" lineWidth={1} />
      <Line points={[[0, -B.h / 2 + 0.25, 0.01], [0, B.h / 2 - 0.25, 0.01]]} color="#475569" lineWidth={1} />
      <Tag position={[B.w / 2 - 0.9, -0.25, 0.02]}>position r →</Tag>
      <Tag position={[0.85, B.h / 2 - 0.3, 0.02]}>speed ṙ ↑</Tag>
      <Tag position={[-B.w / 2 + 1.3, B.h / 2 - 0.3, 0.02]}>{title}</Tag>
      {children}
    </group>
  );
}

/** A covariance ellipse (2σ) on the board, relative to a reference mean. */
function BoardEllipse({ g, ref0, color, width = 2.5, dashed = false, c = 2 }: { g: Gauss2; ref0: V2; color: string; width?: number; dashed?: boolean; c?: number }) {
  const pts = useMemo(() => ellipse(g.x, g.P, c, 80).map(([r, v]) => [(r - ref0[0]) * kr, (v - ref0[1]) * kv, 0.03] as P3), [g, ref0, c]);
  return (
    <>
      <Line points={pts} color={color} lineWidth={width} dashed={dashed} dashSize={0.12} gapSize={0.08} />
      <mesh position={[(g.x[0] - ref0[0]) * kr, (g.x[1] - ref0[1]) * kv, 0.04]}>
        <circleGeometry args={[0.06, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </>
  );
}

/** The range measurement on the board: a vertical band (it says nothing about speed). */
function MeasBand({ z, R, ref0 }: { z: number; R: number; ref0: V2 }) {
  const x = (z - ref0[0]) * kr;
  const w = 2 * 2 * Math.sqrt(R) * kr;
  return (
    <group>
      <mesh position={[x, 0, 0.02]}>
        <planeGeometry args={[w, B.h - 0.4]} />
        <meshBasicMaterial color={C3.meas} transparent opacity={0.16} />
      </mesh>
      <Line points={[[x, -B.h / 2 + 0.2, 0.025], [x, B.h / 2 - 0.2, 0.025]]} color={C3.meas} lineWidth={1.5} />
    </group>
  );
}

/* ---------------------------------------------------------------- director */

export function World3({ step, p, run, nonce = 0, example }: { step: string; p: Params3; run: Coast; nonce?: number; example: { prior: Gauss2; z: number; R: number } }) {
  const act = step.split('.')[0];
  return (
    <NonceCtx.Provider value={nonce}>
      <Space />
      {act === 's0' && <Prologue step={step} />}
      {act === 's1' && <Act1 />}
      {act === 's2' && <Act2 p={p} />}
      {act === 's3' && <Act3 p={p} />}
      {act === 's4' && <Act4 p={p} />}
      {act === 's5' && <Act5 step={step} p={p} />}
      {act === 's6' && <Act6 example={example} />}
      {act === 's7' && <Act7 run={run} k={p.k} R={p.R} />}
      {act === 's8' && <Wide />}
      {act === 's9' && <Act9 run={run} retro={step === 's9.2' ? p.retro : 0} />}
      {act === 's10' && <Wide />}
    </NonceCtx.Provider>
  );
}

/* ---------------------------------------------------------------- prologue */

function Prologue({ step }: { step: string }) {
  const t = useT(step);
  const r = 60 + ((t * 18) % 260);
  const ping = Math.floor(t * 0.8) % 2 === 0;
  return (
    <>
      <Shot pos={[-1.5, 4, 19]} tgt={[-1, 0, 0]} />
      <Spacecraft x={cx(r)} />
      <Beam x={cx(r)} on={ping} />
      {step === 's0.2' && (
        <Html position={[cx(r), 1.6, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="w-log">
            <div className="w-log-title">Guidance computer memory</div>
            <div className="w-log-row">x̂ = ( {r.toFixed(0)} 000 km, 4.0 000 km/h )</div>
            <div className="w-log-row">P = [[ 9.0, 1.2 ], [ 1.2, 0.5 ]]</div>
            <div className="w-log-row">that's all it needs to remember</div>
          </div>
        </Html>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- 1: the Gaussian assumptions */

const NOMINAL: Gauss2 = { x: [150, 4], P: [[9, 1.2], [1.2, 0.5]] };

function Act1() {
  return (
    <>
      <Shot pos={[0, 2.6, 9]} tgt={[0, 1.8, -1]} />
      <Spacecraft x={cx(150)} />
      <Board title="the belief: 𝒩(x; x̂, P)">
        <BoardEllipse g={NOMINAL} ref0={NOMINAL.x} color={C3.post} width={3} />
        <BoardEllipse g={NOMINAL} ref0={NOMINAL.x} color={C3.post} width={1.2} c={1} />
      </Board>
    </>
  );
}

/* ---------------------------------------------------------------- 2: the product formula in 3D */

function Act2({ p }: { p: Params3 }) {
  const t = useAnimated(p.prod, 2.5);
  const prior = { m: [0, 0] as V2, P: [[2.2, 0.9], [0.9, 1.2]] as M2 };
  const z = p.pz;
  const R = p.pR;
  const post = kfUpdate({ x: prior.m, P: prior.P }, z, R);
  const f = (x: number, y: number) => {
    const pr = normal2([x, y], prior.m, prior.P);
    const lk = normal1(z, x, R) * 0.9;
    const po = normal2([x, y], post.x, post.P);
    return 14 * ((1 - t) * Math.max(pr, lk * 0.25) + t * po * 0.7);
  };
  return (
    <>
      <Shot pos={[5.5, 6.5, 8]} tgt={[0, 0.5, 0]} />
      <Surface f={f} xr={[-4, 4]} yr={[-4, 4]} color={t > 0.5 ? C3.post : C3.gold} opacity={0.82} />
      {[1, 2].map((c) => (
        <Line key={'pr' + c} points={ellipse(prior.m, prior.P, c).map(([x, y]) => [x, 0.02, -y] as P3)} color={C3.prior} lineWidth={2} />
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[z, 0.015, 0]}>
        <planeGeometry args={[2 * Math.sqrt(R), 8]} />
        <meshBasicMaterial color={C3.meas} transparent opacity={0.15} />
      </mesh>
      {t > 0.5 && [1, 2].map((c) => <Line key={'po' + c} points={ellipse(post.x, post.P, c).map(([x, y]) => [x, 0.03, -y] as P3)} color={C3.post} lineWidth={2.5} />)}
      <Tag position={[4.5, 0.05, 0]}>position →</Tag>
      <Tag position={[0, 0.05, -4.5]}>speed →</Tag>
      <Tag position={[z, 0.2, 3.6]} tone="red">
        range measurement z (says nothing about speed)
      </Tag>
    </>
  );
}

/* ---------------------------------------------------------------- 3: prediction on the board */

const FILT0: Gauss2 = { x: [150, 4], P: [[3, 0.4], [0.4, 0.3]] };

function Act3({ p }: { p: Params3 }) {
  const shear = kfPredict(FILT0, p.dt, 0);
  const full = kfPredict(FILT0, p.dt, p.s2);
  const ref0: V2 = [FILT0.x[0] + p.dt * FILT0.x[1] * 0.5, FILT0.x[1]];
  return (
    <>
      <Shot pos={[0, 3, 11.5]} tgt={[0, 2, -1]} />
      <Spacecraft x={cx(full.x[0])} />
      <Board title="prediction: shear (F), then swell (D)">
        <BoardEllipse g={FILT0} ref0={ref0} color={C3.post} />
        {p.predStage >= 1 && <BoardEllipse g={shear} ref0={ref0} color={C3.prior} dashed />}
        {p.predStage >= 2 && <BoardEllipse g={full} ref0={ref0} color={C3.prior} width={3.2} />}
      </Board>
    </>
  );
}

/* ---------------------------------------------------------------- 4: where D comes from */

function Act4({ p }: { p: Params3 }) {
  const t = useT('d');
  const D = { x: [0, 0] as V2, P: [[(p.s2 * p.dt ** 4) / 4, (p.s2 * p.dt ** 3) / 2], [(p.s2 * p.dt ** 3) / 2, p.s2 * p.dt ** 2]] as M2 };
  const puff = Math.floor(t * 2) % 3 === 0;
  return (
    <>
      <Shot pos={[0, 3, 11.5]} tgt={[0, 2, -1]} />
      <Spacecraft x={cx(150)} burn={puff} />
      <Board title={`D for Δt = ${p.dt.toFixed(1)} h, σ² = ${p.s2.toFixed(2)}`}>
        <BoardEllipse g={D} ref0={[0, 0]} color={C3.prior} width={3} />
      </Board>
      <Tag position={[cx(150), -0.9, 0]}>random pushes: unknown small accelerations</Tag>
    </>
  );
}

/* ---------------------------------------------------------------- 5: filtering on the board */

function Act5({ step, p }: { step: string; p: Params3 }) {
  const prior: Gauss2 = { x: [150, 4], P: [[p.Pscale * 9, p.Pscale * 1.2 * p.corr], [p.Pscale * 1.2 * p.corr, p.Pscale * 0.5]] };
  const z = 150 + p.zOff;
  const u = kfUpdate(prior, z, p.fR);
  return (
    <>
      <Shot pos={[0, 3, 11.5]} tgt={[0, 2, -1]} />
      <Spacecraft x={cx(u.x[0])} />
      <Beam x={cx(u.x[0])} on />
      <Board title={step === 's5.3' ? 'a range-only update moves the speed too' : 'filtering: prior × measurement'}>
        <BoardEllipse g={prior} ref0={prior.x} color={C3.prior} />
        <MeasBand z={z} R={p.fR} ref0={prior.x} />
        <BoardEllipse g={{ x: u.x, P: u.P }} ref0={prior.x} color={C3.post} width={3.2} />
        {step === 's5.3' && Math.abs(u.x[1] - prior.x[1]) > 0.01 && (
          <Line points={[[(u.x[0] - prior.x[0]) * kr + 0.3, 0, 0.05], [(u.x[0] - prior.x[0]) * kr + 0.3, (u.x[1] - prior.x[1]) * kv, 0.05]]} color={C3.truth} lineWidth={3} />
        )}
      </Board>
      <Tag position={[cx(u.x[0]), -0.9, 0]}>W = ({u.W[0].toFixed(2)}, {u.W[1].toFixed(2)})</Tag>
    </>
  );
}

/* ---------------------------------------------------------------- 6: one step by hand */

function Act6({ example }: { example: { prior: Gauss2; z: number; R: number } }) {
  const u = kfUpdate(example.prior, example.z, example.R);
  return (
    <>
      <Shot pos={[0, 3, 11.5]} tgt={[0, 2, -1]} />
      <Spacecraft x={cx(u.x[0])} />
      <Board title="the worked example">
        <BoardEllipse g={example.prior} ref0={example.prior.x} color={C3.prior} />
        <MeasBand z={example.z} R={example.R} ref0={example.prior.x} />
        <BoardEllipse g={{ x: u.x, P: u.P }} ref0={example.prior.x} color={C3.post} width={3.2} />
      </Board>
    </>
  );
}

/* ---------------------------------------------------------------- 7: the coast */

function Act7({ run, k, R }: { run: Coast; k: number; R: number }) {
  const g = run.filt[k];
  const truth = run.truth.slice(0, k + 1);
  const pr = run.pred[k];
  return (
    <>
      <Shot pos={[0, 3, 12.5]} tgt={[0, 1.6, -1]} />
      <Spacecraft x={cx(run.truth[k][0])} opacity={0.5} />
      <Line points={truth.map(([r]) => [cx(r), -0.05, 0] as P3)} color={C3.truth} lineWidth={2} />
      {/* belief capsule around the estimate: width = 2σ of position */}
      <mesh position={[cx(g.x[0]), 0, 0]} scale={[Math.max(2 * Math.sqrt(g.P[0][0]) * (12.6 / 384), 0.03), 0.18, 0.18]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshBasicMaterial color={C3.post} transparent opacity={0.35} />
      </mesh>
      {k > 0 && <Beam x={cx(run.z[k])} on />}
      {k > 0 && (
        <mesh position={[cx(run.z[k]), 0, 0]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshBasicMaterial color={C3.meas} />
        </mesh>
      )}
      <Board title={`step ${k}: prior (green) → posterior (blue)`}>
        {k > 0 && <BoardEllipse g={pr} ref0={g.x} color={C3.prior} />}
        {k > 0 && <MeasBand z={run.z[k]} R={R} ref0={g.x} />}
        <BoardEllipse g={g} ref0={g.x} color={C3.post} width={3.2} />
        <mesh position={[(run.truth[k][0] - g.x[0]) * kr, (run.truth[k][1] - g.x[1]) * kv, 0.05]}>
          <circleGeometry args={[0.08, 16]} />
          <meshBasicMaterial color={C3.truth} />
        </mesh>
      </Board>
    </>
  );
}

/* ---------------------------------------------------------------- 9: RTS on a ribbon */

function Act9({ run, retro }: { run: Coast; retro: number }) {
  const t = useAnimated(retro, 2.5);
  const n = run.filt.length;
  const s = 12.6 / 384;
  return (
    <>
      <Shot pos={[cx(run.filt[Math.floor(n / 2)].x[0]), 3.2, 8]} tgt={[cx(run.filt[Math.floor(n / 2)].x[0]), 1.4, 0]} />
      <Spacecraft x={cx(run.truth[n - 1][0])} opacity={0.5} />
      {run.filt.map((g, l) => {
        const sm = run.smooth[l];
        const m = (1 - t) * g.x[0] + t * sm.x[0];
        const sd = (1 - t) * Math.sqrt(g.P[0][0]) + t * Math.sqrt(sm.P[0][0]);
        const y = 0.4 + l * 0.22;
        return (
          <group key={l}>
            <Line points={[[cx(m) - 2 * sd * 0.14, y, 0], [cx(m) + 2 * sd * 0.14, y, 0]]} color={t > 0.5 ? C3.retro : C3.post} lineWidth={4} />
            <mesh position={[cx(run.truth[l][0]), y, 0.01]}>
              <sphereGeometry args={[0.035, 10, 10]} />
              <meshBasicMaterial color={C3.truth} />
            </mesh>
          </group>
        );
      })}
      <Tag position={[cx(run.filt[0].x[0]) - 0.8, 0.4, 0]}>step 0</Tag>
      <Tag position={[cx(run.filt[Math.floor(n / 2)].x[0]) - 1.6, 0.4 + n * 0.22 + 0.3, 0]}>±2σ bars, widths magnified ×4</Tag>
      <Tag position={[cx(run.filt[n - 1].x[0]) + 0.9, 0.4 + (n - 1) * 0.22, 0]}>step {n - 1}</Tag>
      {void s}
    </>
  );
}

function Wide() {
  const t = useT('wide');
  const r = 60 + ((t * 14) % 280);
  return (
    <>
      <Shot pos={[0, 6, 24]} tgt={[0, 0, 0]} />
      <Spacecraft x={cx(r)} />
      <Beam x={cx(r)} on={Math.floor(t) % 2 === 0} />
    </>
  );
}
