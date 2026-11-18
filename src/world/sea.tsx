import { Html, Stars } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { ReactNode, useMemo, useRef } from 'react';
import { lookSky, SkyLook } from './look';
import * as THREE from 'three';

/**
 * The Chapter 2 world: a shipping lane at sea, at night, in fog.
 * The lane runs along world X. 1 world unit = 5 nautical miles. wx2(50 nm) = 0.
 * The coast (with lighthouses) lies at negative Z.
 */
export const wx2 = (nm: number) => (nm - 50) / 5;
export const S2 = {
  truth: '#FBBF24',
  meas: '#EF4444',
  belief: '#3B82F6',
  prior: '#22C55E',
  gold: '#EAB308',
  retro: '#A855F7',
  water: '#0B2236',
};
export const COAST_Z = -4.2;

export function SeaEnvironment({ fog = 0 }: { fog?: number }) {
  const near = 14 - fog * 8;
  const sky = lookSky();
  return (
    <>
      {sky ? <SkyLook file={sky} blur={fog * 0.4} /> : <color attach="background" args={['#06101C']} />}
      <fog attach="fog" args={['#0A1826', Math.max(near, 4), 40 - fog * 18]} />
      {!sky && <Stars radius={70} depth={30} count={fog > 0.5 ? 300 : 1500} factor={3} fade speed={0.3} />}
      <hemisphereLight args={['#8DA2C7', '#06101C', sky ? 0.3 : 0.9]} />
      <ambientLight intensity={sky ? 0.1 : 0.35} />
      <directionalLight position={[-8, 12, 6]} intensity={0.8} color="#CFE0FF" />
      <Water />
      <Coast />
    </>
  );
}

function Water() {
  const mesh = useRef<THREE.Mesh>(null);
  const geom = useMemo(() => new THREE.PlaneGeometry(160, 90, 120, 60), []);
  const base = useMemo(() => Float32Array.from(geom.attributes.position.array as Float32Array), [geom]);
  useFrame(({ clock }) => {
    const pos = geom.attributes.position as THREE.BufferAttribute;
    const t = clock.elapsedTime;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      pos.setZ(i, 0.045 * Math.sin(x * 0.6 + t * 0.9) + 0.035 * Math.sin(y * 0.8 - t * 0.7));
    }
    pos.needsUpdate = true;
    geom.computeVertexNormals();
  });
  return (
    <mesh ref={mesh} geometry={geom} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
      <meshStandardMaterial color={S2.water} roughness={0.35} metalness={0.4} />
    </mesh>
  );
}

function Coast() {
  return (
    <group>
      <mesh position={[0, 0.15, COAST_Z - 3]}>
        <boxGeometry args={[160, 0.5, 5]} />
        <meshStandardMaterial color="#1C2A22" roughness={1} />
      </mesh>
      <mesh position={[0, 0.02, COAST_Z - 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[160, 0.6]} />
        <meshStandardMaterial color="#3B3A2E" roughness={1} />
      </mesh>
    </group>
  );
}

/** The shipping lane: dashed line on the water and a buoy every 10 nm. */
export function Lane({ from = 0, to = 100 }: { from?: number; to?: number }) {
  const buoys: number[] = [];
  for (let nm = from; nm <= to; nm += 10) buoys.push(nm);
  const dashes: number[] = [];
  for (let nm = from - 20; nm <= to + 20; nm += 3) dashes.push(nm);
  return (
    <group>
      {dashes.map((nm) => (
        <mesh key={nm} rotation={[-Math.PI / 2, 0, 0]} position={[wx2(nm), 0.01, 0]}>
          <planeGeometry args={[0.3, 0.025]} />
          <meshBasicMaterial color="#5E7A94" transparent opacity={0.6} />
        </mesh>
      ))}
      {buoys.map((nm) => (
        <Buoy key={nm} nm={nm} />
      ))}
    </group>
  );
}

function Buoy({ nm }: { nm: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = 0.03 * Math.sin(clock.elapsedTime * 1.3 + nm);
  });
  return (
    <group ref={ref} position={[wx2(nm), 0, 0.9]}>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.07, 0.1, 0.18, 12]} />
        <meshStandardMaterial color="#DC2626" />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.03, 10, 10]} />
        <meshStandardMaterial color="#FDE68A" emissive="#FDE68A" emissiveIntensity={2} />
      </mesh>
      <Html position={[0, -0.05, 0.25]} center style={{ pointerEvents: 'none' }}>
        <div className="w-post">{nm} nm</div>
      </Html>
    </group>
  );
}

/** A small sailing ship facing +X. `ghost` = belief, not a ship. */
export function Ship({ position = [0, 0, 0] as [number, number, number], ghost = false, opacity = 1, scale = 1, lantern = true, color = '#7C5A3A' }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (g.current && !ghost) g.current.rotation.x = 0.04 * Math.sin(clock.elapsedTime * 1.1 + position[0]);
  });
  const mat = (c: string) =>
    ghost ? (
      <meshStandardMaterial color={S2.belief} emissive={S2.belief} emissiveIntensity={0.5} transparent opacity={opacity} depthWrite={false} />
    ) : (
      <meshStandardMaterial color={c} roughness={0.7} transparent={opacity < 1} opacity={opacity} />
    );
  return (
    <group ref={g} position={position} scale={scale}>
      <mesh position={[0, 0.09, 0]}>
        <boxGeometry args={[0.9, 0.16, 0.3]} />
        {mat(color)}
      </mesh>
      <mesh position={[0.5, 0.11, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.15, 0.22, 4]} />
        {mat(color)}
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.015, 0.02, 0.75, 6]} />
        {mat('#4B3621')}
      </mesh>
      <mesh position={[0.02, 0.52, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.02, 0.01]} />
        {mat('#E7E5E4')}
      </mesh>
      <mesh position={[0.05, 0.5, 0]}>
        <boxGeometry args={[0.44, 0.5, 0.01]} />
        {ghost ? mat('') : <meshStandardMaterial color="#E7E5E4" side={THREE.DoubleSide} transparent={opacity < 1} opacity={opacity} />}
      </mesh>
      {lantern && !ghost && (
        <mesh position={[-0.42, 0.24, 0]}>
          <sphereGeometry args={[0.04, 10, 10]} />
          <meshStandardMaterial color="#FCD34D" emissive="#FCD34D" emissiveIntensity={3} transparent={opacity < 1} opacity={opacity} />
        </mesh>
      )}
    </group>
  );
}

/** Lighthouse on the coast with a sweeping beam. */
export function Lighthouse({ nm, on = true }: { nm: number; on?: boolean }) {
  const beam = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (beam.current) beam.current.rotation.y = clock.elapsedTime * 0.9;
  });
  return (
    <group position={[wx2(nm), 0.4, COAST_Z - 0.6]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 0.2 + i * 0.35, 0]}>
          <cylinderGeometry args={[0.2 - i * 0.02, 0.22 - i * 0.02, 0.35, 16]} />
          <meshStandardMaterial color={i % 2 ? '#DC2626' : '#F8FAFC'} />
        </mesh>
      ))}
      <mesh position={[0, 1.58, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.16, 12]} />
        <meshStandardMaterial color="#FEF3C7" emissive="#FEF3C7" emissiveIntensity={on ? 3 : 0.2} />
      </mesh>
      {on && (
        <group ref={beam} position={[0, 1.58, 0]}>
          <mesh position={[3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.6, 6, 20, 1, true]} />
            <meshBasicMaterial color="#FFF7D6" transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </group>
      )}
      <pointLight position={[0, 1.6, 0]} intensity={on ? 1.2 : 0} distance={6} color="#FFF3C4" />
    </group>
  );
}

export function Reef({ nm, z = 1.4, label = true }: { nm: number; z?: number; label?: boolean }) {
  const rocks = useMemo(() => Array.from({ length: 7 }, (_, i) => [((i * 37) % 11) / 11 - 0.5, ((i * 53) % 7) / 7 - 0.5, 0.08 + ((i * 29) % 5) / 25] as const), []);
  return (
    <group position={[wx2(nm), 0, z]}>
      {rocks.map(([dx, dz, s], i) => (
        <mesh key={i} position={[dx * 1.2, s * 0.5, dz * 0.8]}>
          <dodecahedronGeometry args={[s * 1.6, 0]} />
          <meshStandardMaterial color="#27272A" roughness={1} />
        </mesh>
      ))}
      {label && (
        <Html position={[0, 0.8, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="w-tag w-tag-red">rocks</div>
        </Html>
      )}
    </group>
  );
}

/** Drifting fog banks (soft translucent blobs). */
export function FogBanks({ amount = 1 }: { amount?: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.position.x = ((clock.elapsedTime * 0.3) % 20) - 10;
  });
  const blobs = useMemo(() => Array.from({ length: 22 }, (_, i) => [(i * 7.3) % 40 - 20, 0.5 + ((i * 3) % 5) * 0.15, ((i * 5.1) % 8) - 4, 1.5 + ((i * 13) % 7) * 0.3] as const), []);
  if (amount <= 0) return null;
  return (
    <group ref={g}>
      {blobs.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, 0.15 + (y - 0.5) * 0.3, z - 1.5]} scale={[r * 1.6, r * 0.18, r]}>
          <sphereGeometry args={[1, 18, 10]} />
          <meshBasicMaterial color="#B6C6D6" transparent opacity={0.035 * amount} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/** A floating logbook card (HTML in the 3D scene). */
export function Logbook({ position, title = 'Logbook', rows }: { position: [number, number, number]; title?: string; rows: ReactNode[] }) {
  return (
    <Html position={position} center style={{ pointerEvents: 'none' }}>
      <div className="w-log">
        <div className="w-log-title">{title}</div>
        {rows.map((r, i) => (
          <div key={i} className="w-log-row">
            {r}
          </div>
        ))}
      </div>
    </Html>
  );
}
