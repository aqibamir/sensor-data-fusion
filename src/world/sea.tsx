import { Html, Stars } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { ReactNode, useMemo, useRef } from 'react';
import { lookSky, SkyLook } from './look';
import * as THREE from 'three';
import { NightSky, StudioFX } from './studio';

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
  const sky = lookSky();
  return (
    <>
      {sky ? <SkyLook file={sky} blur={fog * 0.4} /> : <NightSky zenith="#030812" horizon="#13233A" glow="#2B3550" />}
      <fogExp2 attach="fog" args={['#0E1C2E', 0.02 + fog * 0.05]} />
      {!sky && <Stars radius={70} depth={30} count={fog > 0.5 ? 300 : 1800} factor={3} saturation={0} fade speed={0.3} />}
      <hemisphereLight args={['#8DA2C7', '#06101C', sky ? 0.3 : 0.7]} />
      <ambientLight intensity={sky ? 0.08 : 0.2} />
      {/* moonlight from behind-left: it lays a glitter path on the water */}
      <directionalLight position={MOON_DIR.clone().multiplyScalar(20).toArray()} intensity={1.4} color="#CFE0FF" />
      <Ocean />
      <Coast />
      <StudioFX bloom={0.8} />
    </>
  );
}

const MOON_DIR = new THREE.Vector3(-0.35, 0.45, -0.82).normalize();

/**
 * GPU ocean: four travelling waves summed in the vertex shader (no per-frame CPU work),
 * analytic normals, fresnel blend between deep water and the sky, moonlight glitter, scene fog.
 */
function Ocean() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        fog: true,
        uniforms: THREE.UniformsUtils.merge([
          THREE.UniformsLib.fog,
          {
            t: { value: 0 },
            deep: { value: new THREE.Color('#041320') },
            shallow: { value: new THREE.Color('#0D3048') },
            skyCol: { value: new THREE.Color('#1A2A44') },
            moon: { value: MOON_DIR },
          },
        ]),
        vertexShader: /* glsl */ `
          uniform float t;
          varying vec3 vPos; varying vec3 vN;
          #include <fog_pars_vertex>
          // dir.xy, amplitude, wavelength, speed
          const vec4 W0 = vec4(1.0, 0.25, 0.040, 3.2);
          const vec4 W1 = vec4(0.6, -0.8, 0.028, 2.1);
          const vec4 W2 = vec4(-0.3, 1.0, 0.016, 1.3);
          const vec4 W3 = vec4(0.9, 0.5, 0.010, 0.7);
          void wave(vec4 w, float spd, vec2 p, inout float h, inout vec2 g){
            vec2 d = normalize(w.xy); float k = 6.2831 / w.w; float ph = k * dot(d, p) - spd * t;
            h += w.z * sin(ph); g += w.z * k * cos(ph) * d;
          }
          void main(){
            vec3 p = (modelMatrix * vec4(position,1.0)).xyz;
            float h = 0.0; vec2 g = vec2(0.0);
            wave(vec4(W0.xy, W0.z, W0.w), 0.9, p.xz, h, g);
            wave(vec4(W1.xy, W1.z, W1.w), 1.2, p.xz, h, g);
            wave(vec4(W2.xy, W2.z, W2.w), 1.7, p.xz, h, g);
            wave(vec4(W3.xy, W3.z, W3.w), 2.3, p.xz, h, g);
            p.y += h;
            vPos = p; vN = normalize(vec3(-g.x, 1.0, -g.y));
            vec4 mvPosition = viewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 deep; uniform vec3 shallow; uniform vec3 skyCol; uniform vec3 moon;
          varying vec3 vPos; varying vec3 vN;
          #include <fog_pars_fragment>
          void main(){
            vec3 n = normalize(vN); vec3 v = normalize(cameraPosition - vPos);
            float fres = 0.02 + 0.7 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
            vec3 water = mix(deep, shallow, clamp(n.y * 0.5 + 0.2 * (1.0 - n.y) * 8.0, 0.0, 1.0));
            vec3 col = mix(water, skyCol, fres);
            vec3 r = reflect(-v, n);
            float glit = pow(max(dot(r, moon), 0.0), 220.0);
            col += vec3(2.6, 2.8, 3.2) * glit + vec3(0.25, 0.3, 0.4) * pow(max(dot(r, moon), 0.0), 18.0) * 0.4;
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
            #include <fog_fragment>
          }`,
      }),
    [],
  );
  useFrame(({ clock }) => (mat.uniforms.t.value = clock.elapsedTime));
  return (
    <mesh material={mat} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
      <planeGeometry args={[160, 90, 320, 180]} />
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
/** Soft drifting fog: camera-facing sprites with a feathered noise-gradient texture (no hard edges). */
function useFogTexture() {
  return useMemo(() => {
    const n = 128;
    const c = document.createElement('canvas');
    c.width = c.height = n;
    const g = c.getContext('2d')!;
    const grd = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.45, 'rgba(255,255,255,0.55)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, n, n);
    // break up the circle with soft blotches
    g.globalCompositeOperation = 'destination-out';
    for (let k = 0; k < 40; k++) {
      const x = ((k * 37) % n), y = ((k * 61) % n), r = 6 + ((k * 13) % 18);
      const b = g.createRadialGradient(x, y, 0, x, y, r);
      b.addColorStop(0, 'rgba(0,0,0,0.25)');
      b.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = b;
      g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
}

export function FogBanks({ amount = 1 }: { amount?: number }) {
  const g = useRef<THREE.Group>(null);
  const tex = useFogTexture();
  useFrame(({ clock }) => {
    if (g.current) g.current.position.x = ((clock.elapsedTime * 0.25) % 20) - 10;
  });
  const blobs = useMemo(() => Array.from({ length: 46 }, (_, i) => [((i * 7.3) % 46) - 23, 0.25 + ((i * 3) % 5) * 0.12, ((i * 5.1) % 9) - 4.5, 2.2 + ((i * 13) % 7) * 0.45] as const), []);
  if (amount <= 0) return null;
  return (
    <group ref={g}>
      {blobs.map(([x, y, z, r], i) => (
        <sprite key={i} position={[x, y, z - 1.5]} scale={[r * 2.2, r * 0.9, 1]}>
          <spriteMaterial map={tex} color="#9FB2C8" transparent opacity={0.12 * amount} depthWrite={false} rotation={(i * 0.7) % 3} />
        </sprite>
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
