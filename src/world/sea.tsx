import { Html, Stars, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { ReactNode, Suspense, useMemo, useRef } from 'react';
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
          varying vec3 vPos;
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
            p.y += h; // only the long swells move the mesh; short waves live in the per-pixel normal
            vPos = p;
            vec4 mvPosition = viewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */ `
          uniform float t; uniform vec3 deep; uniform vec3 shallow; uniform vec3 skyCol; uniform vec3 moon;
          varying vec3 vPos;
          #include <fog_pars_fragment>
          const vec4 W0 = vec4(1.0, 0.25, 0.040, 3.2);
          const vec4 W1 = vec4(0.6, -0.8, 0.028, 2.1);
          const vec4 W2 = vec4(-0.3, 1.0, 0.016, 1.3);
          const vec4 W3 = vec4(0.9, 0.5, 0.010, 0.7);
          void wave(vec4 w, float spd, vec2 p, inout float h, inout vec2 g){
            vec2 d = normalize(w.xy); float k = 6.2831 / w.w; float ph = k * dot(d, p) - spd * t;
            h += w.z * sin(ph); g += w.z * k * cos(ph) * d;
          }
          void main(){
            float h = 0.0; vec2 g = vec2(0.0);
            wave(W0, 0.9, vPos.xz, h, g); wave(W1, 1.2, vPos.xz, h, g);
            wave(W2, 1.7, vPos.xz, h, g); wave(W3, 2.3, vPos.xz, h, g);
            // fade the short-wave slope with distance to avoid shimmer
            float fade = clamp(1.0 - length(cameraPosition - vPos) / 60.0, 0.3, 1.0);
            vec3 n = normalize(vec3(-g.x * fade, 1.0, -g.y * fade)); vec3 v = normalize(cameraPosition - vPos);
            float fres = 0.02 + 0.7 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
            vec3 water = mix(deep, shallow, clamp(n.y * 0.5 + 0.2 * (1.0 - n.y) * 8.0, 0.0, 1.0));
            vec3 col = mix(water, skyCol, fres);
            vec3 r = reflect(-v, n);
            float glit = pow(max(dot(r, moon), 0.0), 220.0);
            col += vec3(1.1, 1.2, 1.4) * glit + vec3(0.25, 0.3, 0.4) * pow(max(dot(r, moon), 0.0), 60.0) * 0.15;
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

/** Rocky coastline: a noise-displaced heightfield rising out of the sea, vertex-coloured (wet dark rock → grass on top). */
function Coast() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(160, 9, 400, 36);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const col = new Float32Array(pos.count * 3);
    const rock = new THREE.Color('#1B1F24'), wet = new THREE.Color('#0C0F12'), grass = new THREE.Color('#1F2B1E');
    const n = (x: number, z: number) => Math.sin(x * 0.9 + Math.sin(z * 1.3)) * 0.5 + Math.sin(x * 2.3 - z * 1.7) * 0.25 + Math.sin(x * 5.1 + z * 3.9) * 0.12;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const d = (4.5 - z) / 9; // 0 at the sea edge → 1 inland
      const edge = 0.5 * Math.sin(x * 0.35) + 0.3 * Math.sin(x * 1.1);
      const h = Math.max(-0.25, (d * 9 - 1.2 - edge) * 0.35) + Math.max(0, n(x, z)) * 0.35 * Math.min(1, d * 3);
      const y = Math.min(h, 0.9 + n(x * 0.5, z) * 0.15);
      pos.setY(i, y);
      const c = y < 0.05 ? wet : y > 0.6 ? grass : rock;
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo} position={[0, -0.05, COAST_Z - 3.6]}>
      <meshStandardMaterial vertexColors roughness={0.95} />
    </mesh>
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
function SimpleShip({ position = [0, 0, 0] as [number, number, number], ghost = false, opacity = 1, scale = 1, lantern = true, color = '#7C5A3A' }) {
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

type ShipProps = Parameters<typeof SimpleShip>[0];

/** An early-18th-century sailing ship facing +X (CC0 model, Quaternius). Ghost copies stay as translucent beliefs. */
export function Ship(props: ShipProps) {
  if (props.ghost) return <SimpleShip {...props} />;
  return (
    <Suspense fallback={<SimpleShip {...props} />}>
      <ModelShip {...props} />
    </Suspense>
  );
}

const SHIP_LEN = 1.15; // world units, same footprint as the hand-built ship

function ModelShip({ position = [0, 0, 0], opacity = 1, scale = 1, lantern = true }: ShipProps) {
  const { scene } = useGLTF('/sea/sailship.glb');
  const { root, k, offset } = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.material = (m.material as THREE.MeshStandardMaterial).clone();
      const mm = m.material as THREE.MeshStandardMaterial;
      mm.roughness = mm.name === 'Fabric' ? 0.95 : 0.8;
      if (mm.name === 'Fabric') mm.side = THREE.DoubleSide;
    });
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const len = Math.max(size.x, size.z);
    const k = SHIP_LEN / len;
    const c = box.getCenter(new THREE.Vector3());
    // centre on the hull, sit slightly into the water (waterline ~12% of hull height)
    return { root, k, offset: [-c.x * k, (-box.min.y - size.y * 0.06) * k, -c.z * k] as [number, number, number] };
  }, [scene]);
  useMemo(() => {
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      Object.assign(m.material, { transparent: opacity < 1, opacity, depthWrite: opacity > 0.5 });
    });
  }, [root, opacity]);
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.elapsedTime + position[0];
    g.current.rotation.x = 0.05 * Math.sin(t * 1.1);
    g.current.rotation.z = 0.02 * Math.sin(t * 0.8);
    g.current.position.y = 0.012 * Math.sin(t * 1.3);
  });
  return (
    <group position={position} scale={scale}>
      <group ref={g}>
        <group rotation={[0, Math.PI / 2, 0]}>
          <primitive object={root} scale={k} position={offset} />
        </group>
        {lantern && opacity > 0.3 && (
          <>
            <mesh position={[-0.5, 0.26, 0]}>
              <sphereGeometry args={[0.03, 12, 12]} />
              <meshBasicMaterial color={[4, 3, 1.2]} toneMapped={false} transparent opacity={opacity} />
            </mesh>
          </>
        )}
      </group>
    </group>
  );
}
useGLTF.preload('/sea/sailship.glb');

/** One CC0 rock (Quaternius), normalised to unit size. */
function Rock({ position, s, rot = 0 }: { position: [number, number, number]; s: number; rot?: number }) {
  const { scene } = useGLTF('/sea/rocks.glb');
  const { root, k } = useMemo(() => {
    const root = scene.clone(true);
    const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
    return { root, k: 1 / Math.max(size.x, size.y, size.z) };
  }, [scene]);
  return <primitive object={root} position={position} scale={k * s} rotation={[0, rot, 0]} />;
}

/** Stone lighthouse on a rocky outcrop with a lantern room and a sweeping beam. */
export function Lighthouse({ nm, on = true }: { nm: number; on?: boolean }) {
  const beam = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (beam.current) beam.current.rotation.y = clock.elapsedTime * 0.9;
  });
  return (
    <group position={[wx2(nm), 0.4, COAST_Z - 0.6]}>
      <Suspense fallback={null}>
        <Rock position={[0.1, -0.15, 0.1]} s={0.9} rot={0.4} />
        <Rock position={[-0.35, -0.2, 0.25]} s={0.55} rot={2} />
      </Suspense>
      {/* tapered stone tower: one lathe, white with a red band */}
      <mesh position={[0, 0.15, 0]}>
        <latheGeometry args={[[new THREE.Vector2(0.24, 0), new THREE.Vector2(0.2, 0.6), new THREE.Vector2(0.15, 1.3), new THREE.Vector2(0.15, 1.32), new THREE.Vector2(0, 1.32)], 24]} />
        <meshStandardMaterial color="#E7E5E0" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.178, 0.19, 0.22, 24]} />
        <meshStandardMaterial color="#9F1D1D" roughness={0.7} />
      </mesh>
      {/* gallery + lantern room + cap */}
      <mesh position={[0, 1.49, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.03, 24]} />
        <meshStandardMaterial color="#1F2937" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.2, 16]} />
        <meshStandardMaterial color="#FFF7D6" emissive="#FFE8A0" emissiveIntensity={on ? 4 : 0.15} toneMapped={!on} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 1.76, 0]}>
        <coneGeometry args={[0.15, 0.14, 16]} />
        <meshStandardMaterial color="#1F2937" metalness={0.6} roughness={0.4} />
      </mesh>
      {on && (
        <group ref={beam} position={[0, 1.6, 0]}>
          {[0, Math.PI].map((a) => (
            <group key={a} rotation={[0, a, 0]}>
              <mesh position={[3.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <coneGeometry args={[0.45, 7, 24, 1, true]} />
                <meshBasicMaterial color="#FFF2C8" transparent opacity={0.03} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
              </mesh>
            </group>
          ))}
        </group>
      )}
      <pointLight position={[0, 1.6, 0]} intensity={on ? 1.6 : 0} distance={7} color="#FFE7B0" />
    </group>
  );
}

export function Reef({ nm, z = 1.4, label = true }: { nm: number; z?: number; label?: boolean }) {
  const rocks = useMemo(() => Array.from({ length: 7 }, (_, i) => [((i * 37) % 11) / 11 - 0.5, ((i * 53) % 7) / 7 - 0.5, 0.08 + ((i * 29) % 5) / 25] as const), []);
  return (
    <group position={[wx2(nm), 0, z]}>
      <Suspense
        fallback={rocks.map(([dx, dz, s], i) => (
          <mesh key={i} position={[dx * 1.2, s * 0.5, dz * 0.8]}>
            <dodecahedronGeometry args={[s * 1.6, 0]} />
            <meshStandardMaterial color="#27272A" roughness={1} />
          </mesh>
        ))}
      >
        {rocks.map(([dx, dz, s], i) => (
          <Rock key={i} position={[dx * 1.2, -0.08, dz * 0.8]} s={s * 3.2} rot={i * 1.7} />
        ))}
      </Suspense>
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
