import { Stars, useCubeTexture, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { ReactNode, Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { StudioFX } from './studio';

/**
 * Realistic space set for Chapter 3.
 * Textures: three.js example planet maps (MIT, derived from NASA imagery), 1–2K, ~4 MB total, in /public/space.
 * Performance: textures stream in behind a simple fallback; bloom is switched off automatically if the frame rate drops.
 */
export const EARTH = { pos: new THREE.Vector3(-7.4, 0, 0), r: 1.3 };
export const MOON = { pos: new THREE.Vector3(7.3, 0, 0), r: 0.5 };
/** Direction TO the sun (light comes from the front-right). */
export const SUN_DIR = new THREE.Vector3(0.55, 0.35, 0.76).normalize();

export function SpaceSet({ children }: { children?: ReactNode }) {
  return (
    <>
      <ambientLight intensity={0.06} />
      <directionalLight position={SUN_DIR.clone().multiplyScalar(30)} intensity={2.2} color="#FFF4E0" />
      <Suspense fallback={<SimpleSpace />}>
        <MilkyWay />
        <RealEarth />
        <RealMoon />
      </Suspense>
      <Sun />
      {children}
      {/* shared grade; no AO in space (nothing to occlude against) */}
      <StudioFX bloom={0.9} ao={false} vignette={0.6} />
    </>
  );
}

/** Shown while the textures load (and if they ever fail). */
function SimpleSpace() {
  return (
    <>
      <color attach="background" args={['#03050B']} />
      <Stars radius={80} depth={40} count={2500} factor={3.5} fade speed={0.2} />
      <mesh position={EARTH.pos}>
        <sphereGeometry args={[EARTH.r, 48, 32]} />
        <meshStandardMaterial color="#2563EB" emissive="#1E3A8A" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={MOON.pos}>
        <sphereGeometry args={[MOON.r, 32, 24]} />
        <meshStandardMaterial color="#A1A1AA" />
      </mesh>
    </>
  );
}

function MilkyWay() {
  const tex = useCubeTexture(['dark-s_px.jpg', 'dark-s_nx.jpg', 'dark-s_py.jpg', 'dark-s_ny.jpg', 'dark-s_pz.jpg', 'dark-s_nz.jpg'], { path: '/space/milkyway/' });
  const { scene } = useThree();
  useEffect(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    scene.background = tex;
    scene.backgroundIntensity = 0.22;
    return () => {
      scene.background = null;
    };
  }, [tex, scene]);
  return null;
}

/* ------------------------------------------------------------------ Earth: day/night shader */

const earthVert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 w = modelMatrix * vec4(position, 1.0);
    vPosW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
const earthFrag = /* glsl */ `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D specMap;
  uniform vec3 sunDir;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vec3 n = normalize(vNormalW);
    float d = dot(n, sunDir);
    vec3 day = texture2D(dayMap, vUv).rgb;
    vec3 night = texture2D(nightMap, vUv).rgb;
    float dayMix = smoothstep(-0.12, 0.25, d);
    vec3 col = mix(night * 1.6, day * (0.15 + 0.95 * max(d, 0.0)), dayMix);
    // ocean glint (specular map: bright = water)
    vec3 v = normalize(cameraPosition - vPosW);
    vec3 h = normalize(sunDir + v);
    float spec = pow(max(dot(n, h), 0.0), 40.0) * texture2D(specMap, vUv).r * dayMix;
    col += vec3(1.0, 0.95, 0.85) * spec * 0.8;
    // thin blue atmosphere at the rim, only on the lit side
    float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0);
    col += vec3(0.30, 0.55, 1.0) * rim * (0.25 + 0.75 * dayMix) * 0.9;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

function RealEarth() {
  const [day, night, spec, clouds] = useTexture(['/space/earth_atmos_2048.jpg', '/space/earth_lights_2048.png', '/space/earth_specular_2048.jpg', '/space/earth_clouds_1024.png']);
  const { gl } = useThree();
  useMemo(() => {
    [day, night].forEach((t) => (t.colorSpace = THREE.SRGBColorSpace));
    [day, night, spec, clouds].forEach((t) => (t.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy())));
  }, [day, night, spec, clouds, gl]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { dayMap: { value: day }, nightMap: { value: night }, specMap: { value: spec }, sunDir: { value: SUN_DIR } },
        vertexShader: earthVert,
        fragmentShader: earthFrag,
      }),
    [day, night, spec],
  );
  const earth = useRef<THREE.Mesh>(null);
  const cloud = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (earth.current) earth.current.rotation.y += dt * 0.03;
    if (cloud.current) cloud.current.rotation.y += dt * 0.038;
  });
  return (
    <group position={EARTH.pos}>
      <mesh ref={earth} material={mat} rotation={[0, 0, 0.41]}>
        <sphereGeometry args={[EARTH.r, 64, 48]} />
      </mesh>
      <mesh ref={cloud} rotation={[0, 0, 0.41]} scale={1.012}>
        <sphereGeometry args={[EARTH.r, 48, 32]} />
        <meshStandardMaterial color="#C9CFD8" alphaMap={clouds} transparent opacity={0.55} depthWrite={false} roughness={1} />
      </mesh>
      <Atmosphere />
    </group>
  );
}

/** Soft outer glow: a slightly larger back-facing sphere with a fresnel fade. */
function Atmosphere() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { sunDir: { value: SUN_DIR } },
        vertexShader: /* glsl */ `
          varying vec3 vN; varying vec3 vV;
          void main() {
            vN = normalize(mat3(modelMatrix) * normal);
            vec4 w = modelMatrix * vec4(position, 1.0);
            vV = normalize(cameraPosition - w.xyz);
            gl_Position = projectionMatrix * viewMatrix * w;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 sunDir; varying vec3 vN; varying vec3 vV;
          void main() {
            float f = pow(1.0 - abs(dot(vN, vV)), 2.5);
            float lit = 0.35 + 0.65 * smoothstep(-0.3, 0.4, dot(vN, sunDir));
            gl_FragColor = vec4(vec3(0.35, 0.6, 1.0) * f * lit, f * 0.9);
          }`,
        side: THREE.BackSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );
  return (
    <mesh material={mat} scale={1.09}>
      <sphereGeometry args={[EARTH.r, 48, 32]} />
    </mesh>
  );
}

function RealMoon() {
  const map = useTexture('/space/moon_1024.jpg');
  useMemo(() => (map.colorSpace = THREE.SRGBColorSpace), [map]);
  return (
    <mesh position={MOON.pos}>
      <sphereGeometry args={[MOON.r, 48, 32]} />
      <meshStandardMaterial map={map} roughness={1} metalness={0} />
    </mesh>
  );
}

/** A small, very bright disc far away in the sun's direction; bloom turns it into a glow. */
function Sun() {
  const p = SUN_DIR.clone().multiplyScalar(60);
  return (
    <mesh position={p}>
      <sphereGeometry args={[1.4, 24, 16]} />
      <meshBasicMaterial color={new THREE.Color(6, 5.4, 4.2)} toneMapped={false} />
    </mesh>
  );
}
