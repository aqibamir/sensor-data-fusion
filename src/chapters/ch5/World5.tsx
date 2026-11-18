import { Html, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { createContext, ReactNode, useContext, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { bearing, crossings, FireRun, fixFromTowers, Tower } from '../../engine/fusion';
import { ellipse } from '../../engine/gaussian';
import { M2, V2 } from '../../engine/mat2';
import { Camera, P3 } from '../../three/primitives';
import { NightSky, StudioFX } from '../../world/studio';
import { deg, FIRE, FIRES2, Params5, towersFor } from './model';

/**
 * Chapter 5 world: a forested mountain valley in late-summer afternoon light.
 * 1 world unit = 1 km. Plan (x, y) → world (x, h, −y). The maths is drawn on a "map layer" at the height of the
 * tower cabins (MAP_H), like lines pinned on the dispatcher's map, floating over the real valley.
 */
const NonceCtx = createContext(0);
function Shot({ pos, tgt }: { pos: P3; tgt: P3 }) {
  return <Camera position={pos} target={tgt} nonce={useContext(NonceCtx)} />;
}
const MAP_H = 1.75;
const wm = (x: number, y: number, h = MAP_H): P3 => [x, h, -y];
const C5 = { A: '#F97316', B: '#2DD4BF', C: '#A3E635', fused: '#3B82F6', truth: '#FBBF24', ghost: '#94A3B8', meas: '#EF4444' };
const TONES = [C5.A, C5.B, C5.C];

function Tag({ position, children, tone }: { position: P3; children: ReactNode; tone?: string }) {
  return (
    <Html position={position} center style={{ pointerEvents: 'none' }}>
      <div className={`w-tag ${tone ? 'w-tag-' + tone : ''}`}>{children}</div>
    </Html>
  );
}

/* ---------------------------------------------------------------- terrain */

/** Valley floor near the fire, ridges outside, a peak under every tower. */
function heightAt(x: number, y: number, peaks: V2[]) {
  const r = Math.hypot(x, y);
  let h = 0.18 * Math.sin(x * 0.9) * Math.cos(y * 0.7) + 0.08 * Math.sin(x * 2.3 + y * 1.7);
  h += 1.1 * THREE.MathUtils.smoothstep(r, 4.5, 11);
  for (const [px, py] of peaks) h += 1.25 * Math.exp(-((x - px) ** 2 + (y - py) ** 2) / 2.2);
  return Math.max(0, h);
}

function Terrain({ peaks }: { peaks: V2[] }) {
  const key = peaks.map((p) => p.map((v) => v.toFixed(1)).join(',')).join('|');
  const { geo, trees } = useMemo(() => {
    const g = new THREE.PlaneGeometry(36, 36, 180, 180);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const col = new Float32Array(pos.count * 3);
    const meadow = new THREE.Color('#6B7A3A'), forest = new THREE.Color('#2F4A26'), rock = new THREE.Color('#7A6E5C');
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = -pos.getZ(i);
      const h = heightAt(x, y, peaks);
      pos.setY(i, h);
      c.copy(h > 1.6 ? rock : h > 0.25 ? forest : meadow).lerp(meadow, 0.15 * Math.sin(x * 3 + y * 2) + 0.15);
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    // forest: one instanced mesh of conifers on the slopes
    const n = 1400;
    const tg = new THREE.ConeGeometry(0.09, 0.32, 6);
    tg.translate(0, 0.16, 0);
    const im = new THREE.InstancedMesh(tg, new THREE.MeshStandardMaterial({ color: '#24401F', roughness: 1 }), n);
    const o = new THREE.Object3D();
    let s = 12345, placed = 0;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n * 3 && placed < n; i++) {
      const x = (rnd() - 0.5) * 30, y = (rnd() - 0.5) * 30;
      const h = heightAt(x, y, peaks);
      if (h < 0.15 || h > 1.7) continue;
      o.position.set(x, h, -y);
      const k = 0.7 + rnd() * 0.8;
      o.scale.set(k, k * (0.9 + rnd() * 0.5), k);
      o.updateMatrix();
      im.setMatrixAt(placed++, o.matrix);
    }
    im.count = placed;
    return { geo: g, trees: im };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return (
    <>
      <mesh geometry={geo}>
        <meshStandardMaterial vertexColors roughness={1} metalness={0} />
      </mesh>
      <primitive object={trees} />
    </>
  );
}

/** A wooden lookout cabin on four stilts, glass all round. */
function LookoutTower({ p, peaks, color, label }: { p: V2; peaks: V2[]; color: string; label: string }) {
  const h = heightAt(p[0], p[1], peaks);
  const wood = <meshStandardMaterial color="#7A5634" roughness={0.9} />;
  return (
    <group position={[p[0], h, -p[1]]}>
      {[
        [0.06, 0.06],
        [-0.06, 0.06],
        [0.06, -0.06],
        [-0.06, -0.06],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.14, z]}>
          <boxGeometry args={[0.015, 0.28, 0.015]} />
          {wood}
        </mesh>
      ))}
      <mesh position={[0, 0.33, 0]}>
        <boxGeometry args={[0.18, 0.11, 0.18]} />
        <meshStandardMaterial color="#C9D6DF" metalness={0.2} roughness={0.15} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0.42, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.16, 0.08, 4]} />
        {wood}
      </mesh>
      <Tag position={[0, 0.75, 0]}>
        <span style={{ color }}>●</span> {label}
      </Tag>
    </group>
  );
}

/* ---------------------------------------------------------------- smoke */

let smokeTex: THREE.Texture | null = null;
function getSmokeTex() {
  if (smokeTex) return smokeTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,0.9)');
  grd.addColorStop(0.5, 'rgba(255,255,255,0.35)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  smokeTex = new THREE.CanvasTexture(c);
  return smokeTex;
}
/** A rising, drifting smoke column: 18 sprites recycled up the column. */
function Smoke({ at, peaks }: { at: V2; peaks: V2[] }) {
  const g = useRef<THREE.Group>(null);
  const base = heightAt(at[0], at[1], peaks);
  const tex = getSmokeTex();
  useFrame(({ clock }) => {
    if (!g.current) return;
    g.current.children.forEach((s, i) => {
      if (!(s as THREE.Sprite).isSprite) return; // skip the fire's point light
      const t = (clock.elapsedTime * 0.12 + i / 18) % 1;
      s.position.set(t * 0.9 + 0.05 * Math.sin(i), base + 0.05 + t * 2.4, -t * 0.4);
      const k = 0.25 + t * 1.1;
      s.scale.set(k, k, 1);
      ((s as THREE.Sprite).material as THREE.SpriteMaterial).opacity = 0.55 * (1 - t) * Math.min(1, t * 6);
    });
  });
  return (
    <group ref={g} position={[at[0], 0, -at[1]]}>
      {Array.from({ length: 18 }, (_, i) => (
        <sprite key={i}>
          <spriteMaterial map={tex} color="#BDB6AC" transparent depthWrite={false} />
        </sprite>
      ))}
      <pointLight position={[0, base + 0.05, 0]} color="#FF8A3D" intensity={0.6} distance={1.2} />
    </group>
  );
}

/* ---------------------------------------------------------------- maths on the map layer */

/** A bearing wedge: thin glowing triangle (±2σ) from the tower along the bearing, plus its centre line. */
function Wedge({ t, phi, color, len = 14, opacity = 1 }: { t: Tower; phi: number; color: string; len?: number; opacity?: number }) {
  const geo = useMemo(() => {
    const a = 2 * t.sphi;
    const p0 = wm(t.p[0], t.p[1]);
    const p1 = wm(t.p[0] + len * Math.cos(phi - a), t.p[1] + len * Math.sin(phi - a));
    const p2 = wm(t.p[0] + len * Math.cos(phi + a), t.p[1] + len * Math.sin(phi + a));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([...p0, ...p1, ...p2]), 3));
    return g;
  }, [t.p[0], t.p[1], t.sphi, phi, len]);
  const end = wm(t.p[0] + len * Math.cos(phi), t.p[1] + len * Math.sin(phi));
  return (
    <>
      <mesh geometry={geo}>
        <meshBasicMaterial color={new THREE.Color(color).multiplyScalar(1.4)} transparent opacity={0.22 * opacity} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
      </mesh>
      <Line points={[wm(t.p[0], t.p[1]), end]} color={new THREE.Color(color).multiplyScalar(1.6)} lineWidth={1.6} transparent opacity={opacity} toneMapped={false} />
    </>
  );
}
function Ellipse2({ m, P, color, c = 2, width = 2.6, dashed = false }: { m: V2; P: M2; color: string; c?: number; width?: number; dashed?: boolean }) {
  const raw = useMemo(() => ellipse(m, P, c, 96), [m[0], m[1], P[0][0], P[0][1], P[1][1], c]);
  const pts = raw.map(([x, y]) => wm(x, y, MAP_H + 0.01));
  const fill = useMemo(() => {
    const g = new THREE.ShapeGeometry(new THREE.Shape(raw.map(([x, y]) => new THREE.Vector2(x, y))));
    g.rotateX(-Math.PI / 2); // shape (x, y) → world (x, 0, −y)
    return g;
  }, [raw]);
  return (
    <>
      {!dashed && (
        <mesh geometry={fill} position={[0, MAP_H + 0.008, 0]}>
          <meshBasicMaterial color={new THREE.Color(color).multiplyScalar(1.3)} transparent opacity={0.35} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      )}
      <Line points={pts} color={new THREE.Color(color).multiplyScalar(1.7)} lineWidth={width} dashed={dashed} dashSize={0.08} gapSize={0.06} toneMapped={false} />
    </>
  );
}
function Ring({ c, r, color }: { c: V2; r: number; color: string }) {
  const pts = useMemo(() => Array.from({ length: 129 }, (_, i) => wm(c[0] + r * Math.cos((i / 128) * 2 * Math.PI), c[1] + r * Math.sin((i / 128) * 2 * Math.PI))), [c[0], c[1], r]);
  return <Line points={pts} color={new THREE.Color(color).multiplyScalar(1.5)} lineWidth={1.6} toneMapped={false} />;
}
function Marker({ p, color, r = 0.09 }: { p: V2; color: string; r?: number }) {
  return (
    <mesh position={wm(p[0], p[1], MAP_H + 0.02)}>
      <sphereGeometry args={[r, 14, 14]} />
      <meshBasicMaterial color={new THREE.Color(color).multiplyScalar(2)} toneMapped={false} />
    </mesh>
  );
}

/* ---------------------------------------------------------------- the world */

export function World5({ step, p, fire, nonce = 0 }: { step: string; p: Params5; fire: FireRun; nonce?: number }) {
  const act = step.split('.')[0];
  const towers = towersFor(p);
  const showC = p.towerC === 1;
  const peaks = towers.map((t) => t.p);
  return (
    <NonceCtx.Provider value={nonce}>
      <NightSky zenith="#5F86BD" horizon="#E9C9A0" glow="#F4B26A" />
      <fogExp2 attach="fog" args={['#D4BC98', 0.028]} />
      <hemisphereLight args={['#C9DCF5', '#5A4A33', 0.7]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[-14, 7, 6]} intensity={2.2} color="#FFD7A0" />
      <Terrain peaks={peaks} />
      {towers.slice(0, showC ? 3 : 2).map((t, i) => (
        <LookoutTower key={i} p={t.p} peaks={peaks} color={TONES[i]} label={t.name} />
      ))}
      <StudioFX bloom={0.45} vignette={0.4} />
      {act === 's6' ? <Tracking p={p} fire={fire} towers={towers} peaks={peaks} /> : act === 's7' ? <Ghosts p={p} towers={towers} peaks={peaks} /> : <Fix step={step} p={p} towers={towers} peaks={peaks} />}
    </NonceCtx.Provider>
  );
}

/** One fire, two (or three) towers, the wedges and the fused ellipse. Most scenes. */
function Fix({ step, p, towers, peaks }: { step: string; p: Params5; towers: Tower[]; peaks: V2[] }) {
  const act = step.split('.')[0];
  const onlyA = step === 's0.1';
  const use = towers.slice(0, p.towerC ? 3 : 2);
  const fix = fixFromTowers(use, FIRE);
  const tri = act === 's4' && p.tri === 1;
  return (
    <>
      {step.startsWith('s0') || step.startsWith('s1') ? <Shot pos={[-9, 5.5, 7]} tgt={[0, 1, 0]} /> : <Shot pos={[0, 13, 8]} tgt={[0, 1.2, -0.5]} />}
      <Smoke at={FIRE} peaks={peaks} />
      {!tri &&
        use.map((t, i) => (onlyA && i > 0 ? null : <Wedge key={i} t={t} phi={bearing(t.p, FIRE)} color={TONES[i]} />))}
      {tri && use.map((t, i) => <Ring key={i} c={t.p} r={Math.hypot(t.p[0], t.p[1])} color={TONES[i]} />)}
      {!onlyA && !tri && (
        <>
          <Ellipse2 m={fix.z} P={fix.R} color={C5.fused} c={2.45} />
          <Tag position={wm(0.6, -0.9, MAP_H + 0.1)} tone="blue">
            fused: the fire is here
          </Tag>
        </>
      )}
      {act === 's9' && p.dup === 1 && (
        <>
          <Ellipse2 m={fix.z} P={[[fix.R[0][0] / 2, fix.R[0][1] / 2], [fix.R[1][0] / 2, fix.R[1][1] / 2]]} color={C5.meas} c={2.45} width={2} />
          <Tag position={wm(-0.4, 0.8, MAP_H + 0.1)} tone="red">
            report counted twice: too small
          </Tag>
        </>
      )}
      {onlyA && (
        <Tag position={wm(2.5, 1.2, MAP_H + 0.1)} tone="gold">
          a line is not a place
        </Tag>
      )}
    </>
  );
}

/** Scene 6: the drifting fire, tracked over time from both towers. */
function Tracking({ p, fire, towers, peaks }: { p: Params5; fire: FireRun; towers: Tower[]; peaks: V2[] }) {
  const k = Math.min(p.k, fire.truth.length - 1);
  const g = fire.est[k];
  const truth = fire.truth[k];
  const path = fire.truth.slice(0, k + 1).map(([x, y]) => wm(x, y, MAP_H + 0.005));
  const estPath = fire.est.slice(0, k + 1).map((e) => wm(e.x[0], e.x[1], MAP_H + 0.02));
  return (
    <>
      <Shot pos={[0, 12, 8]} tgt={[0.5, 1.2, -0.5]} />
      <Smoke at={truth} peaks={peaks} />
      {towers.slice(0, 2).map((t, i) => (fire.seen[i][k] ? <Wedge key={i} t={t} phi={bearing(t.p, truth)} color={TONES[i]} /> : null))}
      {path.length > 1 && <Line points={path} color={C5.truth} lineWidth={1.4} dashed dashSize={0.1} gapSize={0.08} />}
      {estPath.length > 1 && <Line points={estPath} color={new THREE.Color(C5.fused).multiplyScalar(1.6)} lineWidth={2.4} toneMapped={false} />}
      <Ellipse2 m={[g.x[0], g.x[1]]} P={[[g.P[0][0], g.P[0][1]], [g.P[1][0], g.P[1][1]]]} color={C5.fused} c={2.45} />
      {!fire.seen[0][k] && p.use !== 1 && (
        <Tag position={wm(towers[0].p[0], towers[0].p[1] + 0.8, MAP_H + 0.4)} tone="gold">
          haze: Eagle Peak sees nothing
        </Tag>
      )}
    </>
  );
}

/** Scene 7: two fires → four crossings, two of them ghosts; a third tower sorts them out. */
function Ghosts({ p, towers, peaks }: { p: Params5; towers: Tower[]; peaks: V2[] }) {
  const [A, B, C] = towers;
  const cs = crossings(A.p, B.p, FIRES2);
  return (
    <>
      <Shot pos={[0, 13, 8]} tgt={[0.3, 1.2, -1]} />
      {FIRES2.map((f, i) => (
        <Smoke key={i} at={f} peaks={peaks} />
      ))}
      {FIRES2.map((f, i) => (
        <group key={i}>
          <Wedge t={{ ...A, sphi: deg(0.4) }} phi={bearing(A.p, f)} color={C5.A} />
          <Wedge t={{ ...B, sphi: deg(0.4) }} phi={bearing(B.p, f)} color={C5.B} />
          {p.towerC === 1 && <Wedge t={{ ...C, sphi: deg(0.4) }} phi={bearing(C.p, f)} color={C5.C} />}
        </group>
      ))}
      {cs.map((c, i) => (
        <group key={i}>
          <Marker p={c.at} color={c.real || p.towerC === 0 ? C5.truth : C5.ghost} r={c.real || p.towerC === 0 ? 0.1 : 0.07} />
          <Tag position={wm(c.at[0], c.at[1], MAP_H + 0.45)} tone={c.real || p.towerC === 0 ? 'gold' : undefined}>
            {p.towerC === 0 ? 'fire?' : c.real ? 'fire' : 'ghost'}
          </Tag>
        </group>
      ))}
    </>
  );
}
