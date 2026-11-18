import { Html, RoundedBox, Stars } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { ReactNode, useMemo, useRef } from 'react';
import { lookSky, SkyLook } from './look';
import * as THREE from 'three';

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
  return (
    <>
      {sky ? <SkyLook file={sky} /> : <color attach="background" args={['#070B16']} />}
      <fog attach="fog" args={['#070B16', 18, 48]} />
      {!sky && <Stars radius={70} depth={30} count={1800} factor={3} fade speed={0.3} />}
      <hemisphereLight args={['#7C8DC0', '#0B1120', sky ? 0.3 : 0.9]} />
      <ambientLight intensity={sky ? 0.1 : 0.4} />
      <directionalLight position={[-6, 12, 8]} intensity={0.9} color="#C7D2FE" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[140, 80]} />
        <meshStandardMaterial color={W.ground} roughness={1} />
      </mesh>
    </>
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
  const postMs: number[] = [];
  for (let m = posts[0]; m <= posts[1]; m += 10) postMs.push(m);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[wx((from + to) / 2), 0, 0]}>
        <planeGeometry args={[len, ROAD_W]} />
        <meshStandardMaterial color={W.asphalt} roughness={0.9} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} rotation={[-Math.PI / 2, 0, 0]} position={[wx((from + to) / 2), 0.002, (s * ROAD_W) / 2 - s * 0.04]}>
          <planeGeometry args={[len, 0.03]} />
          <meshBasicMaterial color="#64748B" />
        </mesh>
      ))}
      {dashes.map((m) => (
        <mesh key={m} rotation={[-Math.PI / 2, 0, 0]} position={[wx(m + 1), 0.003, 0]}>
          <planeGeometry args={[0.4, 0.035]} />
          <meshBasicMaterial color="#CBD5E1" />
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
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.04, 0.24, 0.04]} />
        <meshStandardMaterial color="#E2E8F0" emissive="#E2E8F0" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, 0.2, 0.021]}>
        <boxGeometry args={[0.042, 0.05, 0.002]} />
        <meshBasicMaterial color="#F59E0B" />
      </mesh>
      <Html position={[0, -0.02, 0.18]} center style={{ pointerEvents: 'none' }}>
        <div className="w-post">{m} m</div>
      </Html>
    </group>
  );
}

/** A low-poly car facing +X. `ghost` renders a translucent single-colour copy (a belief, not a car). */
export function Car({
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
              <meshStandardMaterial color="#FFF7D6" emissive="#FFF7D6" emissiveIntensity={3} />
            </mesh>
          ))}
          {[0.14, -0.14].map((z) => (
            <mesh key={'t' + z} position={[-0.451, 0.19, z]}>
              <boxGeometry args={[0.01, 0.04, 0.1]} />
              <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={2.5} />
            </mesh>
          ))}
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

/** Radar tower with a rotating dish. Sits beside the road at 70 m. */
export const RADAR_M = 70;
export function Radar() {
  const dish = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (dish.current) dish.current.rotation.y = -Math.PI / 2 + 0.35 * Math.sin(clock.elapsedTime * 0.8);
  });
  return (
    <group position={[wx(RADAR_M), 0, -ROAD_W / 2 - 0.9]}>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.32, 0.4, 0.2, 6]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 1.6, 8]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.6} roughness={0.3} />
      </mesh>
      <group ref={dish} position={[0, 1.75, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0.08, 0, 0]}>
          <sphereGeometry args={[0.38, 24, 12, 0, Math.PI * 2, 0, Math.PI / 3.2]} />
          <meshStandardMaterial color="#E2E8F0" side={THREE.DoubleSide} metalness={0.4} roughness={0.3} />
        </mesh>
        <mesh position={[0.2, 0, 0]}>
          <sphereGeometry args={[0.04, 10, 10]} />
          <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={2} />
        </mesh>
      </group>
    </group>
  );
}

/** Expanding ring from the radar, repeated every `period` seconds. */
export function Pulse({ period = 1.5 }: { period?: number }) {
  const ring = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    const t = (clock.elapsedTime % period) / period;
    if (ring.current && mat.current) {
      const s = 0.2 + t * 7;
      ring.current.scale.set(s, s, s);
      mat.current.opacity = 0.35 * (1 - t);
    }
  });
  return (
    <mesh ref={ring} position={[wx(RADAR_M), 1.75, -ROAD_W / 2 - 0.9]} rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1, 0.012, 8, 96]} />
      <meshBasicMaterial ref={mat} color={W.meas} transparent />
    </mesh>
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
        <sphereGeometry args={[0.045, 14, 14]} />
        <meshStandardMaterial color={W.meas} emissive={W.meas} emissiveIntensity={1.2} transparent opacity={opacity} />
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
      <mesh position={[0, hh / 2, 0]}>
        <boxGeometry args={[w, hh, w]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} transparent opacity={opacity} />
      </mesh>
      {label !== undefined && (
        <Html position={[0, hh + 0.22, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="w-num">{label}</div>
        </Html>
      )}
    </group>
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
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.18} roughness={0.95} transparent opacity={opacity} />
    </mesh>
  );
}
