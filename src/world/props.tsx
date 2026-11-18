import { ContactShadows, Html, RoundedBox, Stars, useGLTF, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { ReactNode, Suspense, useMemo, useRef } from 'react';
import { lookSky, SkyLook } from './look';
import * as THREE from 'three';
import { DataMaterial, NightSky, StudioFX, TreeLine, useNoiseTexture } from './studio';
import { Edges, Line } from '@react-three/drei';

/**
 * The persistent night-road world of Chapter 1.
 * Road runs along world X. 1 world unit = 5 metres. wx(100 m) = -2.
 */
export const wx = (m: number) => (m - 110) / 5;
export const ROAD_W = 1.6;
export const W = {
  truth: '#FBBF24',
  meas: '#EF4444',
  belief: '#3B82F6',
  prior: '#22C55E',
  sand: '#EAB308',
  post: '#3B82F6',
  muted: '#94A3B8',
  asphalt: '#1C2230',
  ground: '#0B1120',
};

export function Environment() {
  const sky = lookSky();
  const ground = useNoiseTexture(256, 7, [28, 16], 0.9);
  return (
    <>
      {sky ? <SkyLook file={sky} /> : <NightSky />}
      <fogExp2 attach="fog" args={['#151C30', 0.022]} />
      {!sky && <Stars radius={70} depth={30} count={2200} factor={3} saturation={0} fade speed={0.3} />}
      <hemisphereLight args={['#8FA2DA', '#1A2030', sky ? 0.3 : 0.7]} />
      <ambientLight intensity={sky ? 0.08 : 0.25} />
      {/* moonlight: cool, from high behind the viewer */}
      <directionalLight position={[-8, 14, 10]} intensity={1.8} color="#B9CBFF" />
      <Suspense
        fallback={
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
            <planeGeometry args={[160, 90]} />
            <meshStandardMaterial color="#26302E" roughness={1} map={ground} />
          </mesh>
        }
      >
        <GroundPBR />
      </Suspense>
      <TreeLine z={-16} from={-40} to={50} gap={0.9} seed={3} scale={1.1} color="#18223A" />
      <TreeLine z={-22} from={-46} to={56} gap={0.8} seed={8} scale={1.5} color="#1A2440" />
      <ContactShadows position={[0, 0.004, 0]} scale={[60, 12]} resolution={1024} blur={2.2} opacity={0.75} far={2} frames={Infinity} color="#000000" />
      <StudioFX />
    </>
  );
}

/** A tiling PBR set from /public/road (ambientCG, CC0): colour + normal + roughness. */
function usePBR(id: string, repeat: [number, number]) {
  const t = useTexture({ map: `/road/${id}_Color.jpg`, normalMap: `/road/${id}_NormalGL.jpg`, roughnessMap: `/road/${id}_Roughness.jpg` });
  return useMemo(() => {
    const out: Record<string, THREE.Texture> = {};
    for (const [k, v] of Object.entries(t)) {
      const c = v.clone();
      c.wrapS = c.wrapT = THREE.RepeatWrapping;
      c.repeat.set(...repeat);
      c.anisotropy = 8;
      if (k === 'map') c.colorSpace = THREE.SRGBColorSpace;
      c.needsUpdate = true;
      out[k] = c;
    }
    return out;
  }, [t, repeat[0], repeat[1]]);
}

function GroundPBR() {
  const dirt = usePBR('Ground037', [40, 22]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <planeGeometry args={[160, 90]} />
      <meshStandardMaterial {...dirt} color="#3C4440" roughness={1} />
    </mesh>
  );
}

function Verges({ from, to }: { from: number; to: number }) {
  const len = (to - from) / 5;
  const grass = usePBR('Grass004', [len / 1.2, 1]);
  return (
    <>
      {[-1, 1].map((sd) => (
        <mesh key={sd} rotation={[-Math.PI / 2, 0, 0]} position={[wx((from + to) / 2), -0.004, sd * (ROAD_W / 2 + 0.55)]}>
          <planeGeometry args={[len, 1.1]} />
          <meshStandardMaterial {...grass} color="#4E5E4C" />
        </mesh>
      ))}
    </>
  );
}

function Asphalt({ from, to }: { from: number; to: number }) {
  const len = (to - from) / 5;
  const a = usePBR('Asphalt025C', [len / 0.8, 2]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[wx((from + to) / 2), 0, 0]}>
      <planeGeometry args={[len, ROAD_W]} />
      <meshStandardMaterial {...a} color="#9AA0AA" />
    </mesh>
  );
}

/** Straight road with dashed centre line and distance posts every 10 m. */
export function Road({ from = 20, to = 220, posts = [70, 160] as [number, number] }: { from?: number; to?: number; posts?: [number, number] }) {
  const dashes = useMemo(() => {
    const d: number[] = [];
    for (let m = from; m < to; m += 4) d.push(m);
    return d;
  }, [from, to]);
  const len = (to - from) / 5;
  const grain = useNoiseTexture(256, 2, [len / 2, 1], 1.4);
  const postMs: number[] = [];
  for (let m = posts[0]; m <= posts[1]; m += 10) postMs.push(m);
  return (
    <group>
      <Suspense
        fallback={
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[wx((from + to) / 2), 0, 0]}>
            <planeGeometry args={[len, ROAD_W]} />
            <meshStandardMaterial color="#2A3140" roughness={0.85} roughnessMap={grain} map={grain} metalness={0.05} />
          </mesh>
        }
      >
        <Asphalt from={from} to={to} />
        <Verges from={from} to={to} />
      </Suspense>
      {[-1, 1].map((s) => (
        <mesh key={s} rotation={[-Math.PI / 2, 0, 0]} position={[wx((from + to) / 2), 0.002, (s * ROAD_W) / 2 - s * 0.04]}>
          <planeGeometry args={[len, 0.03]} />
          <meshBasicMaterial color="#64748B" />
        </mesh>
      ))}
      {dashes.map((m) => (
        <mesh key={m} rotation={[-Math.PI / 2, 0, 0]} position={[wx(m + 1), 0.003, 0]}>
          <planeGeometry args={[0.4, 0.035]} />
          <meshBasicMaterial color="#E2E8F0" toneMapped={false} />
        </mesh>
      ))}
      {postMs.map((m) => (
        <DistancePost key={m} m={m} />
      ))}
    </group>
  );
}

function DistancePost({ m }: { m: number }) {
  return (
    <group position={[wx(m), 0, ROAD_W / 2 + 0.25]}>
      {/* white roadside marker post with a black band and an amber reflector */}
      <mesh position={[0, 0.13, 0]}>
        <boxGeometry args={[0.05, 0.26, 0.035]} />
        <meshStandardMaterial color="#E8ECF1" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.215, 0]}>
        <boxGeometry args={[0.052, 0.06, 0.037]} />
        <meshStandardMaterial color="#111827" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.215, -0.019]}>
        <boxGeometry args={[0.03, 0.04, 0.002]} />
        <meshBasicMaterial color={[2.6, 1.5, 0.2]} toneMapped={false} />
      </mesh>
      <Html position={[0, -0.02, 0.18]} center style={{ pointerEvents: 'none' }}>
        <div className="w-post">{m} m</div>
      </Html>
    </group>
  );
}

/** Hand-built fallback car (shown while the model loads, and for ghost/belief copies). */
function SimpleCar({
  position = [0, 0, 0],
  color = '#E5E7EB',
  opacity = 1,
  lights = true,
  ghost = false,
  spin = 0,
  police = false,
  scale = 1,
}: {
  position?: [number, number, number];
  color?: string;
  opacity?: number;
  lights?: boolean;
  ghost?: boolean;
  spin?: number;
  police?: boolean;
  scale?: number;
}) {
  const transparent = opacity < 1 || ghost;
  const bodyMat = ghost ? (
    <meshStandardMaterial color={W.belief} emissive={W.belief} emissiveIntensity={0.5} transparent opacity={opacity} depthWrite={false} />
  ) : (
    <meshStandardMaterial color={color} metalness={0.35} roughness={0.35} transparent={transparent} opacity={opacity} />
  );
  const flash = useRef<THREE.MeshStandardMaterial>(null);
  const flash2 = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (!police || !flash.current || !flash2.current) return;
    const on = Math.floor(clock.elapsedTime * 4) % 2 === 0;
    flash.current.emissiveIntensity = on ? 3 : 0.2;
    flash2.current.emissiveIntensity = on ? 0.2 : 3;
  });
  return (
    <group position={position} scale={scale}>
      <RoundedBox args={[0.9, 0.2, 0.42]} radius={0.06} position={[0, 0.17, 0]}>
        {bodyMat}
      </RoundedBox>
      <RoundedBox args={[0.46, 0.17, 0.38]} radius={0.06} position={[-0.06, 0.34, 0]}>
        {ghost ? (
          <meshStandardMaterial color={W.belief} emissive={W.belief} emissiveIntensity={0.5} transparent opacity={opacity} depthWrite={false} />
        ) : (
          <meshStandardMaterial color="#0F172A" metalness={0.8} roughness={0.15} transparent={transparent} opacity={opacity} />
        )}
      </RoundedBox>
      {!ghost &&
        [
          [0.28, 0.21],
          [0.28, -0.21],
          [-0.28, 0.21],
          [-0.28, -0.21],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.09, z]} rotation={[Math.PI / 2, spin, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.06, 18]} />
            <meshStandardMaterial color="#111827" roughness={0.8} transparent={transparent} opacity={opacity} />
          </mesh>
        ))}
      {!ghost && lights && (
        <>
          {[0.13, -0.13].map((z) => (
            <mesh key={z} position={[0.451, 0.19, z]}>
              <boxGeometry args={[0.01, 0.05, 0.09]} />
              <meshBasicMaterial color={[4, 3.8, 3.2]} toneMapped={false} />
            </mesh>
          ))}
          {[0.14, -0.14].map((z) => (
            <mesh key={'t' + z} position={[-0.451, 0.19, z]}>
              <boxGeometry args={[0.01, 0.04, 0.1]} />
              <meshBasicMaterial color={[3, 0.25, 0.2]} toneMapped={false} />
            </mesh>
          ))}
          <Headlight />
          <mesh position={[1.45, 0.12, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.55, 2, 24, 1, true]} />
            <meshBasicMaterial color="#FFF3C4" transparent opacity={0.07} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </>
      )}
      {police && (
        <>
          <mesh position={[-0.06, 0.45, 0.08]}>
            <boxGeometry args={[0.1, 0.05, 0.12]} />
            <meshStandardMaterial ref={flash} color="#3B82F6" emissive="#3B82F6" />
          </mesh>
          <mesh position={[-0.06, 0.45, -0.08]}>
            <boxGeometry args={[0.1, 0.05, 0.12]} />
            <meshStandardMaterial ref={flash2} color="#EF4444" emissive="#EF4444" />
          </mesh>
        </>
      )}
    </group>
  );
}

/** A car facing +X, 4.5 m long. Real CC0 model (Quaternius); `ghost` renders a translucent belief copy instead. */
export function Car(props: Parameters<typeof SimpleCar>[0]) {
  if (props.ghost) return <SimpleCar {...props} />;
  return (
    <Suspense fallback={<SimpleCar {...props} />}>
      <ModelCar {...props} />
    </Suspense>
  );
}

const CAR_FILES = { car: '/road/car1.glb', police: '/road/police.glb' };
const CAR_LEN = { car: 4.22, police: 3.73 };

function ModelCar({ position = [0, 0, 0], opacity = 1, lights = true, spin = 0, police = false, scale = 1 }: Parameters<typeof SimpleCar>[0]) {
  const kind = police ? 'police' : 'car';
  const { scene } = useGLTF(CAR_FILES[kind]);
  const transparent = opacity < 1;
  // per-instance clone with its own materials (opacity and lamp state differ between cars)
  const { root, wheels, lamps } = useMemo(() => {
    const root = scene.clone(true);
    const wheels: THREE.Object3D[] = [];
    const lamps: Record<string, THREE.MeshStandardMaterial[]> = {};
    root.traverse((o) => {
      if (/Wheel/i.test(o.name)) wheels.push(o);
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mats = (Array.isArray(m.material) ? m.material : [m.material]).map((mm) => {
        const c = (mm as THREE.MeshStandardMaterial).clone();
        if (c.name === 'Windows') Object.assign(c, { metalness: 0.9, roughness: 0.08 });
        else if (c.name === 'Black') c.roughness = 0.85;
        else if (/Lights/.test(c.name)) (lamps[c.name] ||= []).push(c);
        else Object.assign(c, { metalness: 0.45, roughness: 0.32 }); // painted body: a clear, glossy look
        return c;
      });
      m.material = Array.isArray(m.material) ? mats : mats[0];
    });
    return { root, wheels, lamps };
  }, [scene]);
  useMemo(() => {
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      (Array.isArray(m.material) ? m.material : [m.material]).forEach((mm) => {
        Object.assign(mm, { transparent, opacity, depthWrite: !transparent || opacity > 0.5 });
      });
    });
    const glow = (names: string[], col: THREE.ColorRepresentation, k: number) =>
      names.forEach((n) => (lamps[n] ?? []).forEach((mm) => Object.assign(mm, { emissive: new THREE.Color(col), emissiveIntensity: lights ? k : 0, toneMapped: !lights })));
    glow(['Headlights', 'WhiteLights'], '#FFF4D6', 6);
    glow(['TailLights'], '#FF2A1A', 4);
  }, [root, lamps, opacity, transparent, lights]);
  useFrame(({ clock }) => {
    wheels.forEach((w) => (w.rotation.x = -spin));
    if (police) {
      const on = Math.floor(clock.elapsedTime * 4) % 2 === 0;
      (lamps.BlueLights ?? []).forEach((mm) => Object.assign(mm, { emissive: new THREE.Color('#2F6BFF'), emissiveIntensity: on ? 8 : 0.3, toneMapped: false }));
      (lamps.WhiteLights ?? []).forEach((mm) => (mm.emissiveIntensity = on ? 0.3 : 8));
    }
  });
  const k = (0.9 / CAR_LEN[kind]) * scale;
  return (
    <group position={position}>
      <primitive object={root} scale={k} rotation={[0, Math.PI / 2, 0]} />
      {lights && opacity > 0.5 && (
        <group scale={scale}>
          <Headlight />
        </group>
      )}
    </group>
  );
}
useGLTF.preload(CAR_FILES.car);

/** A real light pool on the road in front of the car. */
function Headlight() {
  const target = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(3, 0, 0);
    return o;
  }, []);
  return (
    <>
      <primitive object={target} />
      <spotLight position={[0.46, 0.2, 0]} target={target} angle={0.42} penumbra={0.7} intensity={16} distance={8} decay={1.3} color="#FFF1CC" />
    </>
  );
}

/** Radar tower with a rotating dish. Sits beside the road at 70 m. */
export const RADAR_M = 70;
export function Radar() {
  const dish = useRef<THREE.Group>(null);
  const beacon = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (dish.current) dish.current.rotation.y = -Math.PI / 2 + 0.35 * Math.sin(clock.elapsedTime * 0.8);
    if (beacon.current) beacon.current.opacity = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 3));
  });
  const steel = <meshStandardMaterial color="#9AA4B2" metalness={0.85} roughness={0.35} />;
  const legs: [number, number][] = [[0.16, 0.16], [-0.16, 0.16], [0.16, -0.16], [-0.16, -0.16]];
  return (
    <group position={[wx(RADAR_M), 0, -ROAD_W / 2 - 0.9]}>
      {/* concrete pad */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.7, 0.08, 0.7]} />
        <meshStandardMaterial color="#5B6270" roughness={0.95} />
      </mesh>
      {/* lattice mast: four tapered legs + cross braces */}
      {legs.map(([x, z], i) => (
        <mesh key={i} position={[x * 0.75, 0.85, z * 0.75]} rotation={[z * -0.12, 0, x * 0.12]}>
          <cylinderGeometry args={[0.014, 0.02, 1.6, 6]} />
          {steel}
        </mesh>
      ))}
      {[0.35, 0.75, 1.15, 1.5].map((y, i) => {
        const r = 0.24 - y * 0.075;
        return (
          <group key={i} position={[0, y, 0]}>
            {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((a) => (
              <mesh key={a} position={[Math.cos(a) * r * 0.5, 0, Math.sin(a) * r * 0.5]} rotation={[0, -a, Math.PI / 2]}>
                <cylinderGeometry args={[0.007, 0.007, r * 1.05, 4]} />
                {steel}
              </mesh>
            ))}
          </group>
        );
      })}
      {/* equipment box */}
      <mesh position={[0, 1.68, 0]}>
        <boxGeometry args={[0.2, 0.12, 0.2]} />
        <meshStandardMaterial color="#E5E7EB" roughness={0.5} metalness={0.2} />
      </mesh>
      <group ref={dish} position={[0, 1.88, 0]}>
        {/* parabolic dish: lathe of y = x² */}
        <mesh rotation={[0, 0, -Math.PI / 2]} position={[-0.02, 0, 0]}>
          <latheGeometry args={[Array.from({ length: 14 }, (_, i) => new THREE.Vector2((i / 13) * 0.36, ((i / 13) * 0.36) ** 2 * 1.6)), 40]} />
          <meshStandardMaterial color="#F1F5F9" metalness={0.3} roughness={0.25} side={THREE.DoubleSide} />
        </mesh>
        {/* feed horn on three struts */}
        <mesh position={[0.26, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.025, 0.035, 0.06, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
        </mesh>
        {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((a) => (
          <mesh key={a} position={[0.14, Math.cos(a) * 0.14, Math.sin(a) * 0.14]} rotation={[a, 0, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.32, 4]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
      </group>
      {/* aviation beacon */}
      <mesh position={[0, 2.12, 0]}>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshBasicMaterial ref={beacon} color={[4, 0.3, 0.2]} toneMapped={false} transparent />
      </mesh>
    </group>
  );
}

/** Expanding ring from the radar, repeated every `period` seconds. A screen-space line, so it stays hairline-thin as it grows. */
const CIRCLE = Array.from({ length: 129 }, (_, i) => [Math.cos((i / 128) * Math.PI * 2), 0, Math.sin((i / 128) * Math.PI * 2)] as [number, number, number]);
export function Pulse({ period = 1.5 }: { period?: number }) {
  const ring = useRef<THREE.Group>(null);
  const line = useRef<any>(null);
  useFrame(({ clock }) => {
    const t = (clock.elapsedTime % period) / period;
    const s = 0.2 + t * 7;
    ring.current?.scale.set(s, 1, s);
    if (line.current?.material) line.current.material.opacity = 0.55 * (1 - t) ** 1.5;
  });
  return (
    <group ref={ring} position={[wx(RADAR_M), 1.88, -ROAD_W / 2 - 0.9]}>
      <Line ref={line} points={CIRCLE} color={new THREE.Color(W.meas).multiplyScalar(2.2)} lineWidth={1.6} transparent toneMapped={false} depthWrite={false} />
    </group>
  );
}

/** A red measurement pin stuck in the road at `m` metres. */
export function Pin({ m, z = 0, label, opacity = 1, h = 0.45 }: { m: number; z?: number; label?: ReactNode; opacity?: number; h?: number }) {
  return (
    <group position={[wx(m), 0, z]}>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0.008, 0.008, h, 6]} />
        <meshBasicMaterial color={W.meas} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, h, 0]}>
        <sphereGeometry args={[0.045, 20, 20]} />
        <meshBasicMaterial color={new THREE.Color(W.meas).multiplyScalar(2.4)} toneMapped={false} transparent opacity={opacity} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <circleGeometry args={[0.06, 18]} />
        <meshBasicMaterial color={W.meas} transparent opacity={0.6 * opacity} />
      </mesh>
      {label && (
        <Html position={[0, h + 0.2, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="w-tag w-tag-red">{label}</div>
        </Html>
      )}
    </group>
  );
}

export function TrafficCone({ m, z = ROAD_W / 2 - 0.15, label }: { m: number; z?: number; label?: string }) {
  return (
    <group position={[wx(m), 0, z]}>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.2, 0.03, 0.2]} />
        <meshStandardMaterial color="#F97316" />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <coneGeometry args={[0.08, 0.28, 18]} />
        <meshStandardMaterial color="#F97316" emissive="#F97316" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.045, 0.058, 0.05, 18]} />
        <meshStandardMaterial color="#F8FAFC" />
      </mesh>
      {label && (
        <Html position={[0, 0.48, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="w-tag">{label}</div>
        </Html>
      )}
    </group>
  );
}

export function Garage({ m, z = -ROAD_W / 2 - 0.75 }: { m: number; z?: number }) {
  return (
    <group position={[wx(m), 0, z]}>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[1.1, 0.7, 0.9]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <mesh position={[0, 0.78, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.58, 0.58, 0.95]} />
        <meshStandardMaterial color="#7F1D1D" />
      </mesh>
      <mesh position={[0, 0.28, 0.451]}>
        <planeGeometry args={[0.7, 0.5]} />
        <meshStandardMaterial color="#CBD5E1" />
      </mesh>
      <Html position={[0, 1.25, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="w-tag">garage · {m} m</div>
      </Html>
    </group>
  );
}

export function Lamppost({ m, z = -ROAD_W / 2 - 0.2 }: { m: number; z?: number }) {
  return (
    <group position={[wx(m), 0, z]}>
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.025, 0.035, 1.5, 8]} />
        <meshStandardMaterial color="#64748B" />
      </mesh>
      <mesh position={[0, 1.52, 0.15]}>
        <boxGeometry args={[0.12, 0.05, 0.3]} />
        <meshStandardMaterial color="#FDE68A" emissive="#FDE68A" emissiveIntensity={1.5} />
      </mesh>
      <pointLight position={[0, 1.4, 0.25]} intensity={0.6} distance={2.5} color="#FDE68A" />
    </group>
  );
}

/** A column (bar) standing on the road, used for discrete probabilities. */
export function Column({ x, z = 0, h, color, w = 0.5, opacity = 0.92, label }: { x: number; z?: number; h: number; color: string; w?: number; opacity?: number; label?: ReactNode }) {
  const hh = Math.max(h, 0.0001);
  return (
    <group position={[x, 0, z]}>
      <DataBox w={w} h={hh} d={w} color={color} opacity={opacity} />
      {label !== undefined && (
        <Html position={[0, hh + 0.22, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="w-num">{label}</div>
        </Html>
      )}
    </group>
  );
}

/** A glowing data bar standing on y = 0: gradient body, bright rim, crisp bright edges. */
export function DataBox({ w, h, d, color, opacity = 0.9 }: { w: number; h: number; d: number; color: string; opacity?: number }) {
  const hh = Math.max(h, 0.0005);
  const edge = useMemo(() => new THREE.Color(color).lerp(new THREE.Color('#FFFFFF'), 0.35).multiplyScalar(1.8), [color]);
  return (
    <mesh position={[0, hh / 2, 0]}>
      <boxGeometry args={[w, hh, d]} />
      <DataMaterial color={color} opacity={opacity * 0.8} height={hh} base={-hh / 2} rim={1.1} />
      <Edges threshold={15}>
        <lineBasicMaterial color={edge} toneMapped={false} transparent opacity={opacity} />
      </Edges>
    </mesh>
  );
}

export function Tag({ position, children, tone }: { position: [number, number, number]; children: ReactNode; tone?: 'red' | 'blue' | 'green' | 'gold' | 'yellow' }) {
  return (
    <Html position={position} center style={{ pointerEvents: 'none' }}>
      <div className={`w-tag ${tone ? 'w-tag-' + tone : ''}`}>{children}</div>
    </Html>
  );
}

export function Speedometer({ position, kmh }: { position: [number, number, number]; kmh: number }) {
  const a = -120 + (Math.min(kmh, 160) / 160) * 240;
  return (
    <Html position={position} center style={{ pointerEvents: 'none' }}>
      <div className="w-speedo">
        <svg viewBox="0 0 100 70" width="92">
          <path d="M10,60 A40,40 0 1,1 90,60" fill="none" stroke="#334155" strokeWidth="7" strokeLinecap="round" />
          <path d="M10,60 A40,40 0 1,1 90,60" fill="none" stroke="#FBBF24" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(kmh / 160) * 188} 400`} />
          <line x1="50" y1="52" x2={50 + 30 * Math.sin((a * Math.PI) / 180)} y2={52 - 30 * Math.cos((a * Math.PI) / 180)} stroke="#F8FAFC" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <div>{Math.round(kmh)} km/h</div>
      </div>
    </Html>
  );
}

/** Height-field from a 1D curve, extruded across the road: a "sand dune" for a density along the road. */
export function Dune({ ms, ps, scale, color = W.sand, opacity = 0.9, depth = 1.0, z = 0, range }: { ms: number[]; ps: number[]; scale: number; color?: string; opacity?: number; depth?: number; z?: number; range?: [number, number] }) {
  const geom = useMemo(() => {
    const shape = new THREE.Shape();
    const idx = ms.map((_, i) => i).filter((i) => !range || (ms[i] >= range[0] && ms[i] <= range[1]));
    if (idx.length < 2) return null;
    shape.moveTo(wx(ms[idx[0]]), 0);
    for (const i of idx) shape.lineTo(wx(ms[i]), Math.max(ps[i] * scale, 0.0005));
    shape.lineTo(wx(ms[idx[idx.length - 1]]), 0);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1 });
    g.translate(0, 0, -depth / 2);
    return g;
  }, [ms, ps, scale, depth, range]);
  if (!geom) return null;
  return (
    <mesh geometry={geom} position={[0, 0.002, z]}>
      <DataMaterial color={color} opacity={opacity} height={Math.max(...ps) * scale} rim={1.0} />
    </mesh>
  );
}
