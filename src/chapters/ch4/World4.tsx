import { Html, Line, Stars } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { createContext, ReactNode, useContext, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ellipse } from '../../engine/gaussian';
import { M2, V2 } from '../../engine/mat2';
import { ApproachRun, bananaCloud, convCov, METHOD_COLORS, pos, posCov, tdoa, toCart, utPolar } from '../../engine/polar';
import { Camera, P3 } from '../../three/primitives';
import { NightSky, StudioFX, useNoiseTexture } from '../../world/studio';
import { deg, Params4, PHI0 } from './model';

/**
 * Chapter 4 world: a fog-bound airfield at night, 1948.
 * Ground plane: 1 world unit = 1 km. Radar (the GCA truck) at the origin; runway along −x from the threshold at x ≈ 1 km.
 * Plane coordinates (x, y) map to world (x, h, −y). Aircraft are drawn ~15× too big so they can be seen at km scale.
 */
const NonceCtx = createContext(0);
function Shot({ pos: p, tgt }: { pos: P3; tgt: P3 }) {
  return <Camera position={p} target={tgt} nonce={useContext(NonceCtx)} />;
}
const w3 = (x: number, y: number, h = 0.02): P3 => [x, h, -y];
const C4 = { truth: '#FBBF24', meas: '#EF4444', conv: METHOD_COLORS[0], ekf: METHOD_COLORS[1], ukf: METHOD_COLORS[2], green: '#22C55E' };

function Tag({ position, children, tone }: { position: P3; children: ReactNode; tone?: string }) {
  return (
    <Html position={position} center style={{ pointerEvents: 'none' }}>
      <div className={`w-tag ${tone ? 'w-tag-' + tone : ''}`}>{children}</div>
    </Html>
  );
}

/* ---------------------------------------------------------------- the set */

function Airfield({ fog = 0.05, real = false }: { fog?: number; real?: boolean }) {
  const ground = useNoiseTexture(256, 9, [40, 40], 0.7);
  return (
    <>
      <NightSky zenith="#04070E" horizon="#161E2C" glow="#2A2A33" />
      <fogExp2 attach="fog" args={['#1A2230', fog]} />
      <Stars radius={70} depth={30} count={600} factor={2.5} saturation={0} fade speed={0.2} />
      <hemisphereLight args={['#7F8DB0', '#0C0F14', 0.5]} />
      <ambientLight intensity={0.15} />
      <directionalLight position={[-10, 14, 8]} intensity={0.9} color="#B9C7E8" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8, -0.01, -3]}>
        <planeGeometry args={[90, 70]} />
        <meshStandardMaterial color="#2B3326" roughness={1} metalness={0} map={ground} />
      </mesh>
      <Runway real={real} />
      <Berlin />
      <GCATruck real={real} />
      <StudioFX bloom={0.9} />
    </>
  );
}

/* ---------------------------------------------------------------- Berlin, 1948 */

/** Procedural window texture: a grid of panes, ~1 in 5 lit warm (night, rationed electricity). */
let windowTex: THREE.Texture | null = null;
function getWindowTex() {
  if (windowTex) return windowTex;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, 64, 64);
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let y = 4; y < 60; y += 10)
    for (let x = 3; x < 61; x += 8) {
      const v = rnd();
      g.fillStyle = v < 0.2 ? `rgba(255,${180 + Math.floor(rnd() * 40)},110,1)` : v < 0.26 ? 'rgba(140,150,170,0.6)' : 'rgba(0,0,0,0)';
      g.fillRect(x, y, 4, 5);
    }
  windowTex = new THREE.CanvasTexture(c);
  windowTex.colorSpace = THREE.SRGBColorSpace;
  return windowTex;
}

/**
 * Berlin around Tempelhof: courtyard apartment blocks on a street grid (one instanced mesh, one draw call),
 * bombed-out gaps, the curved Tempelhof terminal north of the field, and the open airfield itself.
 * Real Airlift approaches came in low over the rooftops of Neukölln — so does ours, from the east (+x).
 */
function Berlin() {
  const blocks = useMemo(() => {
    let s = 99;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const pts: [number, number, number, number, number][] = []; // x, y, w, d, h (km)
    for (let gx = -9; gx <= 16; gx += 0.34)
      for (let gy = -8; gy <= 8; gy += 0.3) {
        const x = gx + (rnd() - 0.5) * 0.05, y = gy + (rnd() - 0.5) * 0.05;
        const inField = x > -2.9 && x < 1.9 && y > -1.0 && y < 1.4; // the airfield
        const inApproach = x >= 1.9 && x < 9 && Math.abs(y) < 0.18; // keep the final-approach line clear of tall blocks
        if (inField || inApproach) continue;
        if (Math.hypot(x - 4, y) < 1.8 && rnd() < 0.5) continue; // ruins: whole blocks missing
        if (rnd() < 0.12) continue; // bomb gaps
        const edge = Math.hypot(x - 3, y) / 12; // the city thins out towards the edge
        if (rnd() < edge * edge) continue;
        pts.push([x, y, 0.24 + rnd() * 0.06, 0.2 + rnd() * 0.06, 0.018 + rnd() * 0.012]);
      }
    const geo = new THREE.BoxGeometry(1, 1, 1);
    geo.translate(0, 0.5, 0);
    const mat = new THREE.MeshStandardMaterial({ color: '#3A3631', roughness: 0.95, emissive: new THREE.Color('#FFB866'), emissiveMap: getWindowTex(), emissiveIntensity: 1.6 });
    const m = new THREE.InstancedMesh(geo, mat, pts.length);
    const o = new THREE.Object3D();
    pts.forEach(([x, y, w, d, h], i) => {
      o.position.set(x, 0, -y);
      o.scale.set(w, h, d);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    return m;
  }, []);
  // Tempelhof terminal: a 1.2 km quarter-circle of hangars along the north edge of the field
  const terminal = useMemo(() => {
    const n = 28;
    const geo = new THREE.BoxGeometry(1, 1, 1);
    geo.translate(0, 0.5, 0);
    const mat = new THREE.MeshStandardMaterial({ color: '#5B5550', roughness: 0.9, emissive: new THREE.Color('#FFC27A'), emissiveMap: getWindowTex(), emissiveIntensity: 0.9 });
    const m = new THREE.InstancedMesh(geo, mat, n);
    const o = new THREE.Object3D();
    const c: V2 = [-0.4, 2.3], R = 1.3;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * 0.82 + (i / (n - 1)) * Math.PI * 0.64;
      o.position.set(c[0] + R * Math.cos(a), 0, -(c[1] + R * Math.sin(a)));
      o.rotation.set(0, -a + Math.PI / 2, 0);
      o.scale.set(0.075, i % 7 === 3 ? 0.05 : 0.032, 0.09);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    return m;
  }, []);
  return (
    <>
      <primitive object={blocks} />
      <primitive object={terminal} />
      {/* the grass of the airfield, lighter than the city ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.5, -0.005, -0.2]}>
        <planeGeometry args={[4.8, 2.4]} />
        <meshStandardMaterial color="#2E3A28" roughness={1} />
      </mesh>
    </>
  );
}

/** Runway (3 km × 60 m, drawn 2× wide), edge lights and an approach light line. One instanced mesh for all lights. */
function Runway({ real = false }: { real?: boolean }) {
  const lights = useMemo(() => {
    const pts: [number, number][] = [];
    for (let x = -2; x <= 1.0001; x += 0.15) pts.push([x, 0.06], [x, -0.06]);
    for (let x = 1.15; x <= 2.2; x += 0.12) pts.push([x, 0]);
    const m = new THREE.InstancedMesh(new THREE.SphereGeometry(real ? 0.0035 : 0.012, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.6, 1.4), toneMapped: false }), pts.length);
    const o = new THREE.Object3D();
    pts.forEach(([x, y], i) => {
      o.position.set(x, 0.015, -y);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    return m;
  }, [real]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.5, 0.002, 0]}>
        <planeGeometry args={[3, 0.12]} />
        <meshStandardMaterial color="#20242B" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.97, 0.004, 0]}>
        <planeGeometry args={[0.04, 0.11]} />
        <meshBasicMaterial color="#CBD5E1" />
      </mesh>
      <primitive object={lights} />
    </group>
  );
}

/** The Ground-Controlled Approach truck: cab, trailer, a rotating search dish and a sweeping beam. */
function GCATruck({ real = false }: { real?: boolean }) {
  const dish = useRef<THREE.Group>(null);
  const beam = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const a = clock.elapsedTime * 1.2;
    if (dish.current) dish.current.rotation.y = a;
    if (beam.current) beam.current.rotation.y = a;
  });
  return (
    <group position={[0, 0, 0.25]} scale={real ? 0.08 : 1}>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.22, 0.09, 0.09]} />
        <meshStandardMaterial color="#3F4A3A" roughness={0.8} />
      </mesh>
      <mesh position={[0.14, 0.04, 0]}>
        <boxGeometry args={[0.07, 0.07, 0.085]} />
        <meshStandardMaterial color="#3A4436" roughness={0.8} />
      </mesh>
      <group ref={dish} position={[-0.03, 0.14, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.012, 20]} />
          <meshStandardMaterial color="#D6DBE2" metalness={0.5} roughness={0.3} />
        </mesh>
      </group>
      <mesh ref={beam} position={[-0.03, 0.03, 0]}>
        <ringGeometry args={[0.2, 26, 3, 1, -0.02, 0.04]} />
        <meshBasicMaterial color="#4ADE80" transparent opacity={0.05} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

/** Twin-engine transport (C-47-like), procedural, nose along +x of its local frame. */
function Plane({ position, heading = Math.PI, size = 0.32 }: { position: P3; heading?: number; size?: number }) {
  const body = <meshStandardMaterial color="#9AA3AD" metalness={0.6} roughness={0.4} />;
  return (
    <group position={position} rotation={[0, heading, 0]} scale={size}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.07, 0.7, 6, 14]} />
        {body}
      </mesh>
      <mesh position={[0.08, -0.01, 0]}>
        <boxGeometry args={[0.16, 0.015, 1.0]} />
        {body}
      </mesh>
      {[0.25, -0.25].map((z) => (
        <mesh key={z} position={[0.15, -0.02, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.03, 0.16, 12]} />
          <meshStandardMaterial color="#4B5563" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[-0.42, 0.02, 0]}>
        <boxGeometry args={[0.1, 0.01, 0.36]} />
        {body}
      </mesh>
      <mesh position={[-0.42, 0.08, 0]}>
        <boxGeometry args={[0.1, 0.13, 0.01]} />
        {body}
      </mesh>
      <mesh position={[0.43, 0, 0]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshBasicMaterial color={[4, 3.8, 3]} toneMapped={false} />
      </mesh>
      <mesh position={[0.08, 0, 0.5]}>
        <sphereGeometry args={[0.014, 8, 8]} />
        <meshBasicMaterial color={[0.3, 3, 0.4]} toneMapped={false} />
      </mesh>
      <mesh position={[0.08, 0, -0.5]}>
        <sphereGeometry args={[0.014, 8, 8]} />
        <meshBasicMaterial color={[3.5, 0.3, 0.2]} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- maths objects */

/** Glowing point cloud (one draw call). */
function Cloud({ pts, color = C4.meas, size = 0.035, h = 0.03, opacity = 0.75 }: { pts: V2[]; color?: string; size?: number; h?: number; opacity?: number }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const a = new Float32Array(pts.length * 3);
    pts.forEach(([x, y], i) => a.set([x, h, -y], i * 3));
    g.setAttribute('position', new THREE.BufferAttribute(a, 3));
    return g;
  }, [pts, h]);
  return (
    <points geometry={geo}>
      <pointsMaterial color={new THREE.Color(color).multiplyScalar(1.6)} size={size} sizeAttenuation transparent opacity={opacity} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function Ellipse2({ m, P, color, c = 2, h = 0.035, width = 2.2, dashed = false }: { m: V2; P: M2; color: string; c?: number; h?: number; width?: number; dashed?: boolean }) {
  const pts = useMemo(() => ellipse(m, P, c, 96).map(([x, y]) => [x, h, -y] as P3), [m[0], m[1], P[0][0], P[0][1], P[1][1], c, h]);
  return <Line points={pts} color={new THREE.Color(color).multiplyScalar(1.5)} lineWidth={width} dashed={dashed} dashSize={0.05} gapSize={0.04} toneMapped={false} />;
}

function Bead({ p, color, r = 0.03, h = 0.04 }: { p: V2; color: string; r?: number; h?: number }) {
  return (
    <mesh position={w3(p[0], p[1], h)}>
      <sphereGeometry args={[r, 14, 14]} />
      <meshBasicMaterial color={new THREE.Color(color).multiplyScalar(2)} toneMapped={false} />
    </mesh>
  );
}

/** The radar's own world: an (r, φ) panel where the same error is a neat upright ellipse. */
function PolarPanel({ position, sr, sphi, sigma }: { position: P3; sr: number; sphi: number; sigma?: V2[] }) {
  // panel axes: horizontal = range error (±4σr), vertical = bearing error (±4σφ), each scaled to ±70 px
  const sx = (dr: number) => 100 + (dr / (4 * sr)) * 70;
  const sy = (dp: number) => 80 - (dp / (4 * sphi)) * 60;
  return (
    // pinned to the stage's lower-right corner so it never leaves the frame
    <Html position={position} calculatePosition={(_el, _cam, size) => [size.width - 128, size.height - 150]} style={{ pointerEvents: 'none' }}>
      <div className="w-log" style={{ minWidth: 0, padding: '8px 10px', transform: 'translate(-50%, -50%)' }}>
        <div className="w-log-title">The radar's own world</div>
        <svg width="200" height="160" viewBox="0 0 200 160">
          <line x1="20" y1="80" x2="185" y2="80" stroke="#94a3b8" strokeWidth="1" />
          <line x1="100" y1="12" x2="100" y2="150" stroke="#94a3b8" strokeWidth="1" />
          <ellipse cx="100" cy="80" rx={35} ry={30} fill="rgba(239,68,68,0.18)" stroke="#f87171" strokeWidth="1.5" />
          <ellipse cx="100" cy="80" rx={70} ry={60} fill="none" stroke="#f87171" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
          {sigma?.map(([dr, dp], i) => <circle key={i} cx={sx(dr)} cy={sy(dp)} r={4} fill="#c084fc" stroke="#fff" strokeWidth="0.8" />)}
          <text x="186" y="94" fill="#cbd5e1" fontSize="11" textAnchor="end">range r →</text>
          <text x="106" y="20" fill="#cbd5e1" fontSize="11">bearing φ ↑</text>
        </svg>
        <div className="w-log-row">upright ellipse: σr and σφ independent</div>
      </div>
    </Html>
  );
}

/* ---------------------------------------------------------------- the world */

export function World4({ step, p, run, nonce = 0 }: { step: string; p: Params4; run: ApproachRun; nonce?: number }) {
  const act = step.split('.')[0];
  return (
    <NonceCtx.Provider value={nonce}>
      <Airfield fog={act === 's9' || act === 's10' ? 0.018 : 0.05} real={step === 's0.1' || act === 's11'} />
      {(act === 's0' || act === 's1') && <Opening step={step} p={p} />}
      {['s2', 's3', 's4', 's5', 's6', 's7', 's8'].includes(act) && <BlipLab step={step} p={p} />}
      {act === 's9' && <Approach p={p} run={run} />}
      {act === 's10' && <TDoA p={p} />}
      {act === 's11' && <Finale />}
    </NonceCtx.Provider>
  );
}

/** Prologue and Scene 1: the plane on its approach in the fog, the blip and its smear. */
function Opening({ step, p }: { step: string; p: Params4 }) {
  const close = step !== 's0.1';
  const [x, y] = toCart(18, deg(12));
  const cloud = useMemo(() => bananaCloud(18, deg(12), 0.05, deg(1), 900), []);
  const C = convCov(18, deg(12), 0.05, deg(1));
  return (
    <>
      {close ? <Shot pos={[x - 1.5, 2.4, -y + 3.2]} tgt={[x, 0, -y]} /> : <Shot pos={[-1.2, 0.35, 1.1]} tgt={[3.5, 0.08, 0]} />}
      {!close && (
        <>
          <LandingPlane chase={false} />
          <Rabbit />
        </>
      )}
      {close && (
        <>
          <Plane position={w3(x, y, 0.5)} heading={Math.PI} />
          <Cloud pts={cloud} />
          <Bead p={[x, y]} color={C4.meas} />
          <Tag position={w3(x, y, 0.95)} tone="red">
            radar blip: 18 km, bearing 12°
          </Tag>
          {step !== 's0.2' && <Ellipse2 m={[x, y]} P={C} color={C4.meas} dashed />}
          <Tag position={w3(x + 0.1, y + 0.45, 0.1)}>±1° sideways ≈ ±310 m</Tag>
        </>
      )}
      {!close && (
        <>
          <Tag position={[0, 0.12, 0.25]} tone="green">
            GCA radar truck
          </Tag>
          <Tag position={[-0.4, 0.15, -2.3]}>Tempelhof terminal</Tag>
          <Tag position={[5, 0.2, -1.5]}>Berlin-Neukölln</Tag>
        </>
      )}
    </>
  );
}

/** Scenes 2–8: one blip, its banana, and the three ways of turning it into a bell. */
function BlipLab({ step, p }: { step: string; p: Params4 }) {
  const act = step.split('.')[0];
  const sr = p.srM / 1000, sphi = deg(p.sphiDeg);
  const [x, y] = toCart(p.r, PHI0);
  const cloud = useMemo(() => bananaCloud(p.r, PHI0, sr, sphi, 1500, 5), [p.r, sr, sphi]);
  const conv = convCov(p.r, PHI0, sr, sphi);
  const ut = utPolar(p.r, PHI0, sr, sphi, p.W0);
  // camera framed on the banana; its size grows with r·σφ
  const span = Math.max(0.8, 3 * p.r * sphi);
  const showConv = ['s4', 's5', 's6', 's7', 's8'].includes(act);
  const showSigma = ['s6', 's7', 's8'].includes(act);
  const wrongLin = act === 's5' && step === 's5.3';
  const linPhi = PHI0 + deg(p.linOff);
  const wrongP = convCov(p.r, linPhi, sr, sphi);
  return (
    <>
      <Shot pos={[x - span * 0.6, span * 1.6, -y + span * 1.5]} tgt={[x, 0, -y]} />
      <Plane position={w3(x, y, 0.45)} heading={Math.PI} size={Math.min(0.32, span * 0.15)} />
      <Cloud pts={cloud} size={Math.max(0.01, span * 0.012)} />
      <Line points={[w3(0, 0, 0.03), w3(x * 1.08, y * 1.08, 0.03)]} color="#4ADE80" lineWidth={1} transparent opacity={0.5} dashed dashSize={0.2} gapSize={0.15} />
      <Tag position={w3(x * 0.5, y * 0.5, 0.15)} tone="green">
        beam from the radar
      </Tag>
      {showConv && !wrongLin && <Ellipse2 m={[x, y]} P={conv} color={C4.conv} width={showSigma ? 1.8 : 2.6} dashed={showSigma} />}
      {wrongLin && (
        <>
          <Ellipse2 m={[x, y]} P={conv} color={C4.conv} width={1.4} dashed />
          <Ellipse2 m={[x, y]} P={wrongP} color={C4.ekf} width={2.8} />
          <Tag position={w3(x, y, span * 0.5)} tone="red">
            linearised {p.linOff.toFixed(0)}° off: the ellipse points the wrong way
          </Tag>
        </>
      )}
      {showSigma && (
        <>
          {ut.cartPts.map((q, i) => (
            <Bead key={i} p={q} color={C4.ukf} r={Math.max(0.012, span * 0.018)} h={0.06} />
          ))}
          <Ellipse2 m={ut.m} P={ut.P} color={C4.ukf} width={2.6} h={0.05} />
          <Bead p={ut.m} color={C4.ukf} r={Math.max(0.01, span * 0.012)} h={0.07} />
        </>
      )}
      <PolarPanel position={w3(x + span * 0.9, y + span * 0.4, span * 0.7)} sr={sr} sphi={sphi} sigma={showSigma ? ut.polarPts.map(([r, ph]) => [r - p.r, ph - PHI0] as V2) : undefined} />
      {showConv && (
        <Tag position={w3(x - span * 0.55, y - span * 0.3, 0.05)} tone="blue">
          converted ellipse T R Tᵀ
        </Tag>
      )}
      {showSigma && (
        <Tag position={w3(ut.m[0] + span * 0.1, ut.m[1] - span * 0.45, 0.05)}>
          <span style={{ color: '#d8b4fe' }}>UKF: 2n+1 = 5 σ-points</span>
        </Tag>
      )}
    </>
  );
}

/** Scene 9: the whole approach, one filter at a time. */
function Approach({ p, run }: { p: Params4; run: ApproachRun }) {
  const k = Math.min(Math.max(2, p.k), run.truth.length - 1);
  const est = run.est[p.method];
  const col = METHOD_COLORS[p.method];
  const truthPts = run.truth.map(([x, y]) => w3(x, y, 0.03));
  const estPts = est.slice(2, k + 1).map((g) => w3(g.x[0], g.x[1], 0.05));
  const zs = run.z.slice(0, k + 1).map(([r, ph]) => toCart(r, ph));
  const [tx, ty] = run.truth[k];
  const g = est[k];
  const err = Math.hypot(g.x[0] - tx, g.x[1] - ty);
  return (
    <>
      <Shot pos={[13.5, 31, 13]} tgt={[13.5, 0, -3.5]} />
      <Line points={truthPts} color={C4.truth} lineWidth={1.4} transparent opacity={0.55} dashed dashSize={0.2} gapSize={0.15} />
      {estPts.length > 1 && <Line points={estPts} color={new THREE.Color(col).multiplyScalar(1.5)} lineWidth={2.6} toneMapped={false} />}
      <Cloud pts={zs} size={0.22} h={0.04} opacity={0.95} />
      <Plane size={0.9} position={w3(tx, ty, 0.3 + 0.03 * tx)} heading={Math.atan2(run.truth[k][1] - run.truth[k - 1][1], run.truth[k][0] - run.truth[k - 1][0])} />
      <Ellipse2 m={pos(g)} P={posCov(g)} color={col} width={2.8} />
      <Tag position={w3(g.x[0], g.x[1], 0.9 + 0.03 * tx)} tone="blue">
        <span style={{ color: col }}>{['converted KF', 'EKF', 'UKF'][p.method]}</span> · error {Math.round(err * 1000)} m
      </Tag>
      {/* the glide tunnel: the corridor the ellipse must fit into before landing clearance */}
      <Line points={[w3(1, 0.15, 0.04), w3(8, 0.15, 0.04)]} color="#4ADE80" lineWidth={1} transparent opacity={0.6} />
      <Line points={[w3(1, -0.15, 0.04), w3(8, -0.15, 0.04)]} color="#4ADE80" lineWidth={1} transparent opacity={0.6} />
      <Tag position={w3(4.5, -0.6, 0.05)} tone="green">
        final approach corridor ±150 m
      </Tag>
    </>
  );
}

/** Scene 10 (book §2.3.1): TDoA — a time difference fixes a hyperbola, not a point. */
function TDoA({ p }: { p: Params4 }) {
  const p1: V2 = [4, 6], p2: V2 = [14, 6];
  const d = p.tdoa;
  const curve = useMemo(() => {
    // trace the branch |x−p1| − |x−p2| = d by marching along y and solving x by bisection
    const out: P3[] = [];
    for (let yy = -6; yy <= 18; yy += 0.1) {
      let a = 9, b = 30;
      if (tdoa([a, yy], p1, p2) > d || tdoa([b, yy], p1, p2) < d) continue;
      for (let it = 0; it < 40; it++) {
        const m = (a + b) / 2;
        if (tdoa([m, yy], p1, p2) < d) a = m;
        else b = m;
      }
      out.push(w3((a + b) / 2, yy, 0.05));
    }
    return out;
  }, [d]);
  const emitter: V2 = useMemo(() => {
    let a = 9, b = 30;
    for (let it = 0; it < 40; it++) {
      const m = (a + b) / 2;
      if (tdoa([m, 10], p1, p2) < d) a = m;
      else b = m;
    }
    return [(a + b) / 2, 10];
  }, [d]);
  return (
    <>
      <Shot pos={[9, 16, 4]} tgt={[9, 0, -7]} />
      {[p1, p2].map((q, i) => (
        <group key={i}>
          <mesh position={w3(q[0], q[1], 0.15)}>
            <cylinderGeometry args={[0.03, 0.06, 0.3, 8]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.6} roughness={0.3} />
          </mesh>
          <Tag position={w3(q[0], q[1], 0.6)} tone="green">
            receiver {i + 1}
          </Tag>
        </group>
      ))}
      {curve.length > 1 && <Line points={curve} color={new THREE.Color('#F59E0B').multiplyScalar(1.8)} lineWidth={3} toneMapped={false} />}
      <Bead p={emitter} color={C4.truth} r={0.12} h={0.12} />
      <Tag position={w3(emitter[0], emitter[1], 0.7)} tone="gold">
        the emitter is somewhere on this hyperbola
      </Tag>
    </>
  );
}

/**
 * A real landing, on a loop: 3° glide path over the rooftops from 6 km out, flare over the threshold,
 * touchdown, rollout. Landing light on, approach "rabbit" strobes running towards the runway.
 * Scale: plane drawn at ~2× real size (C-47 wingspan 29 m).
 */
const LOOP = 18;
function landingAt(t: number): { x: number; h: number; pitch: number; phase: string } {
  const thr = 1.0; // threshold x (km)
  if (t < 11) {
    const u = t / 11;
    const x = 7 - 6 * u; // 6 km of final at ~200 km/h (time compressed)
    return { x, h: 0.012 + (x - thr) * Math.tan(deg(3)), pitch: -deg(3), phase: 'on the glide path' };
  }
  if (t < 12.5) {
    const u = (t - 11) / 1.5;
    return { x: thr - 0.25 * u, h: 0.012 * (1 - u) + 0.0, pitch: deg(4) * Math.sin(u * Math.PI * 0.5), phase: 'flare' };
  }
  const u = Math.min(1, (t - 12.5) / 4);
  return { x: thr - 0.25 - 1.0 * (1 - (1 - u) * (1 - u)), h: 0, pitch: 0, phase: u < 1 ? 'touchdown — rollout' : 'stopped' };
}
function LandingPlane({ chase }: { chase: boolean }) {
  const g = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const label = useRef<HTMLDivElement>(null);
  const { camera } = useThree();
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime % LOOP;
    const L = landingAt(t);
    if (g.current) g.current.position.set(L.x, L.h + 0.006, 0);
    if (inner.current) inner.current.rotation.z = L.pitch;
    if (label.current) label.current.textContent = L.phase;
    if (chase) {
      // chase camera: behind, above and slightly to the side, easing in
      const want = new THREE.Vector3(L.x + 0.22, L.h + 0.06, 0.09);
      camera.position.lerp(want, 0.08);
      look.set(L.x - 0.4, L.h * 0.6, 0);
      camera.lookAt(look);
    }
  });
  return (
    <group ref={g}>
      <group ref={inner}>
        <Plane position={[0, 0, 0]} heading={Math.PI} size={0.06} />
        <spotLight position={[-0.03, 0, 0]} target-position={[-0.6, -0.08, 0]} angle={0.35} penumbra={0.6} intensity={3} distance={1.2} color="#FFF1CC" />
      </group>
      <Html position={[0, 0.05, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="w-tag w-tag-gold" ref={label} />
      </Html>
    </group>
  );
}
/** Sequenced approach strobes ("the rabbit"): a flash running along the approach lights towards the threshold. */
function Rabbit() {
  const refs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const xs = useMemo(() => Array.from({ length: 10 }, (_, i) => 2.2 - i * 0.12), []);
  useFrame(({ clock }) => {
    const k = Math.floor((clock.elapsedTime * 8) % 14);
    refs.current.forEach((m, i) => m && (m.opacity = i === k ? 1 : 0));
  });
  return (
    <>
      {xs.map((x, i) => (
        <mesh key={i} position={[x, 0.02, 0]}>
          <sphereGeometry args={[0.005, 8, 6]} />
          <meshBasicMaterial ref={(m) => (refs.current[i] = m)} color={[6, 6, 7]} toneMapped={false} transparent opacity={0} />
        </mesh>
      ))}
    </>
  );
}

function Finale() {
  return (
    <>
      <LandingPlane chase />
      <Rabbit />
    </>
  );
}

