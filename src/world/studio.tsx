import { PerformanceMonitor } from '@react-three/drei';
import { Bloom, EffectComposer, N8AO, Noise, ToneMapping, Vignette } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * The shared "look kit": one grade for every chapter.
 * Quality tiers: 'high' (AO + bloom + grain + MSAA) → 'low' (bloom only) when the frame rate drops.
 * Glow rule: only things with emissive / colour above 1.0 (toneMapped={false}) bloom, i.e. the maths objects and lights.
 */
export function StudioFX({ bloom = 0.7, ao = false, vignette = 0.55 }: { bloom?: number; ao?: boolean; vignette?: number }) {
  const [tier, setTier] = useState<'high' | 'low'>('high');
  const high = tier === 'high';
  return (
    <>
      <PerformanceMonitor onDecline={() => setTier('low')} onFallback={() => setTier('low')} flipflops={2} />
      <EffectComposer multisampling={0} enableNormalPass={false} resolutionScale={1}>
        {high && ao ? <N8AO halfRes aoRadius={0.6} intensity={1.6} distanceFalloff={0.6} /> : <></>}
        <Bloom mipmapBlur intensity={bloom} luminanceThreshold={0.9} luminanceSmoothing={0.25} radius={0.7} resolutionScale={0.5} />
        <ToneMapping mode={ToneMappingMode.AGX} />
        <Vignette offset={0.3} darkness={vignette} />
        {high ? <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.35} /> : <></>}
      </EffectComposer>
    </>
  );
}

/** Night sky dome: deep zenith fading to a faint warm glow at the horizon (distant town light). */
export function NightSky({ zenith = '#03060F', horizon = '#1A2238', glow = '#3A2E3A' }: { zenith?: string; horizon?: string; glow?: string }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { zen: { value: new THREE.Color(zenith) }, hor: { value: new THREE.Color(horizon) }, glow: { value: new THREE.Color(glow) } },
        vertexShader: /* glsl */ `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform vec3 zen; uniform vec3 hor; uniform vec3 glow; varying vec3 vDir;
          void main(){
            float h = clamp(vDir.y, -0.2, 1.0);
            vec3 c = mix(hor, zen, smoothstep(0.0, 0.55, h));
            c += glow * pow(1.0 - abs(h), 12.0) * 0.6;
            gl_FragColor = vec4(c, 1.0);
          }`,
      }),
    [zenith, horizon, glow],
  );
  return (
    <mesh material={mat} renderOrder={-1}>
      <sphereGeometry args={[90, 32, 16]} />
    </mesh>
  );
}

/** Procedural tileable noise texture (no downloads): used for asphalt grain and ground variation. */
export function useNoiseTexture(size = 256, seed = 1, repeat: [number, number] = [1, 1], contrast = 1) {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d')!;
    const img = g.createImageData(size, size);
    let s = seed * 9301 + 49297;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    // value noise at a few octaves, wrapped so it tiles
    const oct = [8, 32, 128].map((n) => Array.from({ length: n * n }, rnd));
    const sample = (a: number[], n: number, x: number, y: number) => {
      const fx = (x / size) * n, fy = (y / size) * n;
      const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
      const v = (i: number, j: number) => a[((j % n) + n) % n * n + (((i % n) + n) % n)];
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      return (v(x0, y0) * (1 - sx) + v(x0 + 1, y0) * sx) * (1 - sy) + (v(x0, y0 + 1) * (1 - sx) + v(x0 + 1, y0 + 1) * sx) * sy;
    };
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const n = 0.5 * sample(oct[0], 8, x, y) + 0.3 * sample(oct[1], 32, x, y) + 0.2 * sample(oct[2], 128, x, y);
        const v = Math.max(0, Math.min(255, 128 + (n - 0.5) * 255 * contrast));
        const i = (y * size + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
    t.anisotropy = 4;
    return t;
  }, [size, seed, repeat[0], repeat[1], contrast]);
}

/** A row of dark conifer silhouettes, instanced (one draw call). */
export function TreeLine({ z, from, to, gap = 0.9, seed = 3, scale = 1, color = '#0A1120' }: { z: number; from: number; to: number; gap?: number; seed?: number; scale?: number; color?: string }) {
  const { mesh, count } = useMemo(() => {
    let s = seed * 7919;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const xs: [number, number, number][] = [];
    for (let x = from; x < to; x += gap * (0.6 + rnd() * 0.8)) xs.push([x, z + (rnd() - 0.5) * 1.4, (0.7 + rnd() * 0.9) * scale]);
    // a conifer: trunk + three stacked, slightly offset tiers (merged → still one draw call)
    const parts = [
      new THREE.CylinderGeometry(0.04, 0.06, 0.4, 5).translate(0, 0.2, 0),
      new THREE.ConeGeometry(0.42, 0.8, 7).translate(0, 0.65, 0),
      new THREE.ConeGeometry(0.32, 0.7, 7).translate(0, 1.0, 0),
      new THREE.ConeGeometry(0.2, 0.55, 7).translate(0, 1.35, 0),
    ];
    const geo = mergeGeometries(parts.map((g) => g.toNonIndexed()))!;
    geo.computeVertexNormals();
    const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 1 }), xs.length);
    const o = new THREE.Object3D();
    xs.forEach(([x, zz, k], i) => {
      o.position.set(x, 0, zz);
      o.scale.set(k, k * (0.9 + 0.4 * ((i * 37) % 10) / 10), k);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    return { mesh: m, count: xs.length };
  }, [z, from, to, gap, seed, scale, color]);
  return count ? <primitive object={mesh} /> : null;
}

/**
 * "Glowing data" material for the maths objects (bars, dunes, pins).
 * A vertical gradient (deeper at the base, brighter at the top), a fresnel rim that goes above 1.0
 * so the bloom pass gives it a soft halo, and a thin bright band near the top edge.
 * Data objects are deliberately not lit by the scene: they are information, not things.
 */
export function DataMaterial({ color, opacity = 0.9, height = 1, base = 0, rim = 1.4 }: { color: string; opacity?: number; height?: number; base?: number; rim?: number }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { col: { value: new THREE.Color() }, op: { value: 1 }, h: { value: 1 }, y0: { value: 0 }, rimK: { value: 1 } },
        vertexShader: /* glsl */ `
          varying vec3 vN; varying vec3 vV; varying float vY;
          void main(){
            vec4 w = modelMatrix * vec4(position,1.0);
            vY = position.y;
            vN = normalize(mat3(modelMatrix) * normal);
            vV = normalize(cameraPosition - w.xyz);
            gl_Position = projectionMatrix * viewMatrix * w;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 col; uniform float op; uniform float h; uniform float y0; uniform float rimK;
          varying vec3 vN; varying vec3 vV; varying float vY;
          void main(){
            float t = clamp((vY - y0) / max(h, 1e-4), 0.0, 1.0);
            vec3 base = col * mix(0.18, 1.0, t * t);
            float fr = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.5);
            vec3 c = base + col * fr * rimK + col * smoothstep(0.92, 1.0, t) * 0.6;
            gl_FragColor = vec4(c, op * mix(0.75, 1.0, fr));
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  mat.uniforms.col.value.set(color);
  mat.uniforms.op.value = opacity;
  mat.uniforms.h.value = height;
  mat.uniforms.rimK.value = rim;
  mat.uniforms.y0.value = base;
  return <primitive object={mat} attach="material" />;
}
