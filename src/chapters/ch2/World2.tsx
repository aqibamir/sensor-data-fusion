import { Html, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { normal1 } from '../../engine/gaussian';
import { transition } from '../../engine/grid';
import { Camera, Density, linspace, P3, Surface, useAnimated } from '../../three/primitives';
import { JointSliceScene } from '../../three/scenes';
import { Column, Pin as RoadPin, Tag } from '../../world/props';
import { FogBanks, Lane, Lighthouse, Logbook, Reef, S2, SeaEnvironment, Ship, wx2 } from '../../world/sea';
import { filterCells, G2, HOURS, Params2, PREV_ONE, PREV_TWO, predictCells, Voyage } from './model';

/* ---------------------------------------------------------------- helpers */

const NonceCtx = createContext(0);
function Shot({ pos, tgt }: { pos: P3; tgt: P3 }) {
  return <Camera position={pos} target={tgt} nonce={useContext(NonceCtx)} />;
}

function useT(key: string, stopAfter = Infinity) {
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
    if (q !== last.current && v <= stopAfter + 0.05) {
      last.current = q;
      setT(q);
    }
  });
  return t;
}

const SC = 14; // world height per (1/nm) of density
const NMS = linspace(-10, 130, 561);
const WXS = NMS.map(wx2);

/** A density over the lane, drawn on a "page" at depth z. */
function LaneDensity({ f, z = 0, color, scale = SC, opacity = 0.22, width = 3 }: { f: (nm: number) => number; z?: number; color: string; scale?: number; opacity?: number; width?: number }) {
  const p = useMemo(() => NMS.map(f), [f]);
  return <Density xs={WXS} p={p} scale={scale} z={z} color={color} opacity={opacity} width={width} />;
}

function GridDensity({ p, z = 0, color, opacity = 0.18, width = 2.5, scale = SC }: { p: number[]; z?: number; color: string; opacity?: number; width?: number; scale?: number }) {
  const xs = useMemo(() => G2.xs.map(wx2), []);
  return <Density xs={xs} p={p} scale={scale} z={z} color={color} opacity={opacity} width={width} />;
}

/** Measurement pin on the sea lane (the shared pin prop is positioned in road metres: m = nm + 60 maps onto the same x). */
function Pin({ nm, z = 0, label }: { nm: number; z?: number; label?: ReactNode }) {
  return <RoadPin m={nm + 60} z={z} label={label} />;
}

const ORIGIN = ['#38BDF8', '#22C55E', '#EAB308', '#F97316', '#A855F7', '#EF4444', '#14B8A6', '#818CF8', '#F472B6', '#A3E635'];

/* ---------------------------------------------------------------- director */

export function World2({ step, p, voyage, nonce = 0, hl }: { step: string; p: Params2; voyage: Voyage; nonce?: number; hl: string | null }) {
  const act = step.split('.')[0];
  const foggy = act === 's0' || act === 's5';
  // the three “chart” scenes show maths over the sea, without buoys and lighthouses in the way
  const chart = step === 's2.2' || step === 's4.1' || step === 's7.1';
  return (
    <NonceCtx.Provider value={nonce}>
      <SeaEnvironment fog={foggy ? 0.7 : 0} />
      {!chart && <Lane />}
      {!chart && act !== 's0' && act !== 's5' && (
        <>
          <Lighthouse nm={45} on={act === 's6' || act === 's8' || act === 's9' || act === 's10' || act === 's11'} />
          <Lighthouse nm={85} on={act === 's8' || act === 's11'} />
        </>
      )}
      {foggy && <FogBanks amount={1.2} />}
      {act === 's0' && <Prologue step={step} />}
      {act === 's1' && <Act1 voyage={voyage} />}
      {act === 's2' && <Act2 step={step} p={p} />}
      {act === 's3' && <Act3 step={step} p={p} />}
      {act === 's4' && <Act4 p={p} />}
      {act === 's5' && <Act5 p={p} hl={hl} />}
      {act === 's6' && <Act6 step={step} p={p} hl={hl} />}
      {act === 's7' && <Act7 p={p} />}
      {act === 's8' && <Act8 step={step} p={p} />}
      {act === 's9' && <Voyage3D voyage={voyage} k={p.k} retro={0} />}
      {act === 's10' && <Voyage3D voyage={voyage} k={HOURS} retro={step === 's10.2' ? p.retro : 0} pick={step === 's10.2' ? p.l : undefined} />}
      {act === 's11' && <Epilogue />}
    </NonceCtx.Provider>
  );
}

/* ---------------------------------------------------------------- prologue: October 1707 */

function Prologue({ step }: { step: string }) {
  const t = useT(step);
  if (step === 's0.1') {
    const x0 = 2.2 + ((t * 0.25) % 3);
    return (
      <>
        <Shot pos={[-1.5, 1.6, 6.5]} tgt={[0, 0.4, 0]} />
        {[0, 1, 2, 3].map((i) => (
          <Ship key={i} position={[x0 - i * 1.6, 0, 0.2 * (i % 2)]} scale={1.1} />
        ))}
        <Html position={[0, 2.4, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="w-big">22 October 1707 · off the Isles of Scilly</div>
        </Html>
      </>
    );
  }
  if (step === 's0.2') {
    // believed position (ghost, on the lane) vs real position (drifting towards the rocks)
    const h = Math.min(t / 1.2, 8); // hours
    const nm = 15 + 8 * h;
    return (
      <>
        <Shot pos={[wx2(46), 7.5, 8.5]} tgt={[wx2(46), 0, -1.6]} />
        <Reef nm={70} z={-3.1} />
        <Ship ghost opacity={0.5} position={[wx2(nm), 0, 0]} />
        <Ship position={[wx2(nm - 1.5 * h), 0, -0.4 * h]} />
        <Tag position={[wx2(nm), 0.9, 0.2]} tone="blue">
          where they believed they were
        </Tag>
        <Tag position={[wx2(nm - 1.5 * h), 0.9, -0.4 * h - 0.2]} tone="yellow">
          where they really were
        </Tag>
        <Tag position={[wx2(12), 1.6, 0]}>hour {Math.floor(h)} of fog</Tag>
      </>
    );
  }
  if (step === 's0.3') {
    const n = Math.min(Math.floor(t / 0.9), 6);
    return (
      <>
        <Shot pos={[wx2(50), 4.5, 10]} tgt={[wx2(50), 0.6, -1]} />
        {Array.from({ length: n + 1 }, (_, i) => (
          <LaneDensity key={i} f={(x) => normal1(x, 20 + 10 * i, 4 + 9 * i)} z={-i * 0.45} color={i === 0 ? S2.belief : S2.prior} opacity={i === n ? 0.25 : 0.07} width={i === n ? 3.5 : 1.5} />
        ))}
        <Tag position={[wx2(20 + 10 * n), 2.2, -n * 0.45]} tone="green">
          after {n} hour{n === 1 ? '' : 's'} of guessing: σ = {Math.sqrt(4 + 9 * n).toFixed(1)} nm
        </Tag>
      </>
    );
  }
  return (
    <>
      <Shot pos={[wx2(55), 3.6, 9]} tgt={[wx2(60), 0.8, 0]} />
      <Reef nm={80} z={-1.2} />
      {[-2, -1, 0, 1, 2, -0.5, 0.6].map((d, i) => (
        <Ship key={i} ghost opacity={0.16} position={[wx2(62 + 6 * d), 0, ((i % 3) - 1) * 0.5]} />
      ))}
      <Html position={[wx2(62), 2.4, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="w-big">
          How do you keep knowing where you are
          <br />
          when the world only gives you rare, noisy glimpses?
        </div>
      </Html>
    </>
  );
}

/* ---------------------------------------------------------------- 1: the logbook */

function Act1({ voyage }: { voyage: Voyage }) {
  const k = 3;
  return (
    <>
      <Shot pos={[wx2(25), 4.2, 9]} tgt={[wx2(22), 0.6, -1.4]} />
      <GridDensity p={voyage.filt[k - 1]} z={-(k - 1) * 0.9} color={S2.belief} opacity={0.18} />
      <GridDensity p={voyage.pred[k]} z={-k * 0.9 + 0.25} color={S2.prior} opacity={0.12} />
      <GridDensity p={voyage.filt[k]} z={-k * 0.9 - 0.25} color={S2.belief} opacity={0.25} width={3.5} />
      <Pin nm={voyage.z[k]} z={-k * 0.9 - 0.25} label={`sighting: ${voyage.z[k].toFixed(0)} nm`} />
      <Tag position={[wx2(-8), 0.3, -(k - 1) * 0.9]} tone="blue">
        p(x₂ | 𝒵²)
      </Tag>
      <Tag position={[wx2(-8), 0.3, -k * 0.9 + 0.25]} tone="green">
        p(x₃ | 𝒵²)
      </Tag>
      <Tag position={[wx2(-8), 0.3, -k * 0.9 - 0.25]} tone="blue">
        p(x₃ | 𝒵³)
      </Tag>
      <Logbook
        position={[wx2(62), 1.6, -1.5]}
        rows={[
          <>hour 1 · sighting z₁ = {voyage.z[1].toFixed(0)} nm</>,
          <>hour 2 · sighting z₂ = {voyage.z[2].toFixed(0)} nm</>,
          <>hour 3 · sighting z₃ = {voyage.z[3].toFixed(0)} nm</>,
          <>hour 4 · fog …</>,
        ]}
      />
    </>
  );
}

/* ---------------------------------------------------------------- 2: the dynamics model */

function Act2({ step, p }: { step: string; p: Params2 }) {
  const t = useT(step, 3);
  if (step === 's2.2') {
    // ridge over (old position along the lane, new position towards the viewer)
    const f = (a: number, b: number) => 12 * transition(b * 5 + 50, a * 5 + 50, p.u, p.q);
    return (
      <>
        <Shot pos={[-7, 7, 8]} tgt={[0, 0.5, 0]} />
        <Surface f={f} xr={[-6, 6]} yr={[-6, 6]} color={S2.prior} opacity={0.75} zOf={(y) => -y} />
        <Line points={[[-6, 0.02, -(-6 + p.u / 5)], [6, 0.02, -(6 + p.u / 5)]]} color="#F97316" lineWidth={2} dashed dashSize={0.15} gapSize={0.1} />
        <Tag position={[6.6, 0.1, 0]}>old position xₖ₋₁ →</Tag>
        <Tag position={[0, 0.1, -6.6]}>new position xₖ →</Tag>
        <Tag position={[3, 0.4, -(3 + p.u / 5) - 0.5]}>xₖ = xₖ₋₁ + u</Tag>
      </>
    );
  }
  const k = Math.min(t / 2, 1);
  return (
    <>
      <Shot pos={[wx2(36), 2.6, 6.5]} tgt={[wx2(36), 0.4, 0]} />
      <Ship position={[wx2(30 + k * p.u), 0, 0]} opacity={step === 's2.1' ? 1 : 0.5} />
      {k >= 1 && (
        <>
          <LaneDensity f={(x) => normal1(x, 30 + p.u, p.q)} z={0} color={S2.prior} />
          {[-1.6, -1, -0.5, 0, 0.5, 1, 1.6].map((d, i) => (
            <Ship key={i} ghost opacity={0.12 + 0.18 * Math.exp(-0.5 * d * d)} position={[wx2(30 + p.u + d * Math.sqrt(p.q)), 0, ((i % 3) - 1) * 0.5]} />
          ))}
          <Tag position={[wx2(30 + p.u), 1.7, 0]} tone="green">
            p(xₖ | xₖ₋₁ = 30 nm)
          </Tag>
        </>
      )}
      <Tag position={[wx2(30), 1.1, 0.4]} tone="yellow">
        known: 30 nm
      </Tag>
      {step === 's2.3' && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[wx2(50), 0.012, 0]}>
            <planeGeometry args={[30, 0.9]} />
            <meshBasicMaterial color="#38BDF8" transparent opacity={0.08} />
          </mesh>
          <Tag position={[wx2(58), 0.4, 0.6]}>the shipping lane: where ships can actually go (“road map”)</Tag>
        </>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- 3: predicting with a table */

function Act3({ step, p }: { step: string; p: Params2 }) {
  const prev = step === 's3.2' && p.two ? PREV_TWO : PREV_ONE;
  const { next, from } = predictCells(prev);
  const H = 3;
  return (
    <>
      <Shot pos={[wx2(34), 7.5, 9.5]} tgt={[wx2(34), 0.6, 0]} />
      {prev.map((v, i) =>
        v > 0 ? <Column key={'p' + i} x={wx2(i * 10)} z={-1.1} h={v * H} w={0.7} color={ORIGIN[i]} label={v.toFixed(2)} /> : null,
      )}
      {next.map((v, j) => {
        if (v <= 0) return null;
        let acc = 0;
        return (
          <group key={'n' + j}>
            {from[j].map((c, i) => {
              if (c <= 0) return null;
              const y0 = acc;
              acc += c;
              return (
                <mesh key={i} position={[wx2(j * 10), (y0 + c / 2) * H, 1.1]}>
                  <boxGeometry args={[0.7, c * H, 0.7]} />
                  <meshStandardMaterial color={ORIGIN[i]} emissive={ORIGIN[i]} emissiveIntensity={0.25} />
                </mesh>
              );
            })}
            <Html position={[wx2(j * 10), v * H + 0.25, 1.1]} center style={{ pointerEvents: 'none' }}>
              <div className="w-num">{v.toFixed(3)}</div>
            </Html>
          </group>
        );
      })}
      <Tag position={[wx2(-6), 0.2, -1.1]} tone="blue">
        now
      </Tag>
      <Tag position={[wx2(-6), 0.2, 1.1]} tone="green">
        one hour later
      </Tag>
    </>
  );
}

/* ---------------------------------------------------------------- 4: Chapman–Kolmogorov in 3D */

const prevBelief = (nm: number) => 0.55 * normal1(nm, 35, 9) + 0.45 * normal1(nm, 55, 12);

function Act4({ p }: { p: Params2 }) {
  const tm = useAnimated(p.mult, 3);
  const ti = useAnimated(p.integ, 3);
  const toNm = (w: number) => w * 5 + 50;
  const bs = linspace(-6, 6, 121);
  const pred = bs.map((b) => {
    let s = 0;
    for (let a = -6; a <= 6; a += 0.05) s += transition(toNm(b), toNm(a), p.u, p.q) * prevBelief(toNm(a)) * 0.25;
    return s;
  });
  const f = (a: number, b: number) => 12 * transition(toNm(b), toNm(a), p.u, p.q) * (1 - tm + tm * prevBelief(toNm(a)) * 14);
  return (
    <>
      <Shot pos={[-8, 7.5, 9]} tgt={[0.5, 0.6, 0]} />
      <Surface f={f} xr={[-6, 6]} yr={[-6, 6]} color={tm > 0.5 ? S2.gold : S2.prior} opacity={0.8 - 0.25 * ti} zOf={(y) => -y} />
      <Density xs={linspace(-6, 6, 241)} p={linspace(-6, 6, 241).map((a) => prevBelief(toNm(a)))} scale={SC * 2} z={6.4} color={S2.belief} />
      <Tag position={[-2, 2.6, 6.4]} tone="blue">
        old belief p(xₖ₋₁ | 𝒵ᵏ⁻¹)
      </Tag>
      {ti > 0.02 && (
        <>
          <Line points={bs.map((b, i) => [6.4, ti * pred[i] * SC * 2 + 0.02, -b] as P3)} color={S2.prior} lineWidth={4} />
          <Tag position={[6.4, ti * Math.max(...pred) * SC * 2 + 0.5, -(-1)]} tone="green">
            prediction p(xₖ | 𝒵ᵏ⁻¹)
          </Tag>
        </>
      )}
      <Tag position={[7, 0.1, 0]}>xₖ₋₁ →</Tag>
      <Tag position={[0, 0.1, -7]}>xₖ →</Tag>
    </>
  );
}

/* ---------------------------------------------------------------- 5: lost in the fog */

function Act5({ p, hl }: { p: Params2; hl: string | null }) {
  const n = p.fogHours;
  return (
    <>
      <Shot pos={[wx2(22 + 9 * n), 4.6, 10]} tgt={[wx2(22 + 9 * n), 0.6, -1]} />
      <Reef nm={85} z={1.3} />
      {Array.from({ length: n + 1 }, (_, i) => (
        <LaneDensity key={i} f={(x) => normal1(x, 20 + 10 * i, 4 + p.q * i)} z={-i * 0.45} color={i === 0 ? S2.belief : S2.prior} opacity={i === n ? 0.25 : 0.06} width={i === n ? (hl === 'var' ? 5 : 3.5) : 1.4} />
      ))}
      <Ship ghost opacity={0.35} position={[wx2(20 + 10 * n), 0, 0.3]} />
      <Tag position={[wx2(20 + 10 * n), 2.4, -n * 0.45]} tone="green">
        {n} hour{n === 1 ? '' : 's'} without a sighting · σ = {Math.sqrt(4 + p.q * n).toFixed(1)} nm
      </Tag>
    </>
  );
}

/* ---------------------------------------------------------------- 6: a light in the fog */

const CELLS6 = [20, 30, 40, 50, 60];

function Act6({ step, p, hl }: { step: string; p: Params2; hl: string | null }) {
  const prior = predictCells(PREV_ONE).next.slice(2, 7);
  const { lik, prod, post } = filterCells(prior, CELLS6, p.zc, p.rc);
  const g = useAnimated(step === 's6.3' ? 1 : 0, 3);
  const H = 3;
  if (step === 's6.1') {
    return (
      <>
        <Shot pos={[wx2(45), 3.6, 8]} tgt={[wx2(48), 0.6, -1.5]} />
        <Ship position={[wx2(48), 0, 0]} opacity={0.35} />
        <Pin nm={p.zc} z={0.4} label={`sighting z = ${p.zc} nm`} />
        <LaneDensity f={(x) => normal1(p.zc, x, p.rc * p.rc)} z={0.4} color={S2.meas} opacity={hl === 'lik' ? 0.3 : 0.12} />
        <Tag position={[wx2(p.zc), 2.2, 0.4]} tone="red">
          likelihood ℓ(x; z): how well each position explains the sighting
        </Tag>
      </>
    );
  }
  return (
    <>
      <Shot pos={[wx2(40), 5.5, 11]} tgt={[wx2(40), 1, 0]} />
      {CELLS6.map((c, i) => (
        <group key={c}>
          <Column x={wx2(c) - 0.4 * (1 - g)} z={0} h={prior[i] * H * (1 - g) + 1e-4} w={0.6} color={S2.prior} opacity={(1 - g) * 0.95} label={g < 0.5 ? prior[i].toFixed(2) : undefined} />
          <Column x={wx2(c) + 0.4 * (1 - g)} z={0} h={lik[i] * H * (1 - g) + 1e-4} w={0.6} color={S2.meas} opacity={(1 - g) * 0.95} label={g < 0.5 ? lik[i].toFixed(2) : undefined} />
          {g > 0.02 && <Column x={wx2(c)} z={0} h={post[i] * H * g + 1e-4} w={0.75} color={S2.belief} opacity={g} label={g > 0.5 ? post[i].toFixed(3) : undefined} />}
        </group>
      ))}
      <Pin nm={p.zc} z={1.2} label={`z = ${p.zc} nm`} />
      <Tag position={[wx2(5), 0.3, 0]}>{g < 0.5 ? 'prediction · likelihood' : 'filtered belief (prediction × likelihood, rescaled)'}</Tag>
      {void prod}
    </>
  );
}

/* ---------------------------------------------------------------- 7: filtering in 3D */

function Act7({ p }: { p: Params2 }) {
  return (
    <group position={[0, 0.05, 0]}>
      <JointSliceScene m={0.2} P={0.9} R={p.fR} z0={p.fz} renorm={p.fRen} labels={{ prior: 'p(x_k\\mid\\Z^{k-1})', lik: '\\ell(x_k; z_k)', post: 'p(x_k\\mid\\Z^{k})', joint: '\\ell\\,p(x_k\\mid\\Z^{k-1})' }} />
    </group>
  );
}

/* ---------------------------------------------------------------- 8: how surprised to be */

function Act8({ step, p }: { step: string; p: Params2 }) {
  const m = 40;
  const P = 16;
  const R = 9;
  const z = step === 's8.2' ? 58 : p.ez;
  const d = Math.abs(z - m) / Math.sqrt(P + R);
  return (
    <>
      <Shot pos={[wx2(45), 3.8, 9]} tgt={[wx2(45), 0.8, -0.5]} />
      <LaneDensity f={(x) => normal1(x, m, P)} z={-0.3} color={S2.prior} opacity={0.15} />
      <LaneDensity f={(x) => normal1(x, m, P + R)} z={0.3} color="#F97316" opacity={0.18} />
      <Tag position={[wx2(m) - 2.3, 1.5, -0.3]} tone="green">
        where the ship probably is (σ = 4 nm)
      </Tag>
      <Tag position={[wx2(m) + 2.6, 1.0, 0.3]}>where the light should appear (σ = 5 nm)</Tag>
      <Pin nm={z} z={0.6} label={`light seen at ${z.toFixed(0)} nm · ${d.toFixed(1)}σ`} />
      {step === 's8.2' && (
        <Html position={[wx2(z), 2.4, 0.6]} center style={{ pointerEvents: 'none' }}>
          <div className="w-stamp">OURS — OR A FALSE LIGHT?</div>
        </Html>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- 9 & 10: the voyage and the inquiry */

const DZ = 0.95;
const zAt = (k: number) => 3.5 - k * DZ;

function Voyage3D({ voyage, k, retro, pick }: { voyage: Voyage; k: number; retro: number; pick?: number }) {
  const t = useAnimated(retro, 3);
  const items: ReactNode[] = [];
  for (let i = 0; i <= k; i++) {
    const p = t === 0 ? voyage.filt[i] : voyage.filt[i].map((v, j) => (1 - t) * v + t * voyage.retro[i][j]);
    const cur = i === k && t < 0.5;
    const hi = pick === i && t > 0.5;
    items.push(<GridDensity key={'f' + i} p={p} z={zAt(i)} color={t > 0.5 ? S2.retro : S2.belief} opacity={cur || hi ? 0.28 : 0.09} width={cur || hi ? 3.5 : 1.5} />);
    if (i > 0)
      items.push(
        <mesh key={'z' + i} position={[wx2(voyage.z[i]), 0.06, zAt(i)]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color={S2.meas} emissive={S2.meas} emissiveIntensity={1.2} />
        </mesh>,
      );
  }
  if (k > 0 && t < 0.5) items.push(<GridDensity key="pred" p={voyage.pred[k]} z={zAt(k) + 0.32} color={S2.prior} opacity={0.08} width={2} />);
  const truth = voyage.truth.slice(0, k + 1).map((x, i) => [wx2(x), 0.05, zAt(i)] as P3);
  return (
    <>
      <Shot pos={[wx2(50), 7, 11]} tgt={[wx2(50), 0.3, -0.5]} />
      {items}
      <Line points={truth} color={S2.truth} lineWidth={2} />
      <Ship position={truth[truth.length - 1]} scale={0.8} opacity={0.8} />
      <Tag position={[wx2(-12), 0.1, zAt(0)]}>hour 0</Tag>
      {k > 0 && <Tag position={[wx2(-12), 0.1, zAt(k)]}>hour {k}</Tag>}
    </>
  );
}

function Epilogue() {
  const t = useT('epi');
  const nm = 10 + ((t * 4) % 90);
  return (
    <>
      <Shot pos={[wx2(30), 5, 11]} tgt={[wx2(55), 0.4, -1]} />
      <Ship position={[wx2(nm), 0, 0]} />
      <Ship ghost opacity={0.25} position={[wx2(nm + 1), 0, 0.5]} />
    </>
  );
}
