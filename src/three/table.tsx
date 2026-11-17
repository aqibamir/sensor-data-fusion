import { RoundedBox } from '@react-three/drei';
import { C } from '../ui/theme';
import { Camera, Label, Lights, useAnimated } from './primitives';

/**
 * The 2×2 joint table of Ch 1 as 3D bars.
 * Rows = position (near / far), columns = speed (slow / fast).
 *   mode 'joint'       — the four joint probabilities
 *   mode 'marginal'    — bars of each row slide together and stack: row sums = p(position)
 *   mode 'conditional' — only the 'fast' column is kept and stretched by 1 / p(fast)
 */
export const JOINT = [
  [0.3, 0.1], // near: slow, fast
  [0.15, 0.45], // far:  slow, fast
];
const ROWS = ['near', 'far'];
const COLS = ['slow', 'fast'];
const HS = 6; // height per unit probability

export function TableScene({ mode }: { mode: 'joint' | 'marginal' | 'conditional' }) {
  const m = useAnimated(mode === 'marginal' ? 1 : 0, 3);
  const c = useAnimated(mode === 'conditional' ? 1 : 0, 3);
  const pFast = JOINT[0][1] + JOINT[1][1];
  const bars = [];
  for (let r = 0; r < 2; r++) {
    for (let k = 0; k < 2; k++) {
      const v = JOINT[r][k];
      let h = v * HS;
      let x = k === 0 ? -1.3 : 1.3;
      let y = h / 2;
      let opacity = 1;
      // marginal: slide slow & fast bars onto x = 0 and stack them
      if (k === 1) y = h / 2 + m * JOINT[r][0] * HS;
      x = x * (1 - m);
      // conditional: drop the slow column, rescale the fast column
      if (k === 0) opacity = 1 - 0.85 * c;
      if (k === 1) {
        const scale = 1 + c * (1 / pFast - 1);
        h = h * scale;
        y = y * scale;
      }
      const z = r === 0 ? 1.4 : -1.4;
      const color = c > 0.5 && k === 1 ? C.post : m > 0.5 ? C.pred : C.joint;
      bars.push(
        <group key={`${r}${k}`}>
          <RoundedBox args={[1.6, Math.max(h, 0.001), 1.6]} radius={0.06} position={[x, y, z]}>
            <meshStandardMaterial color={color} transparent opacity={opacity} />
          </RoundedBox>
          {opacity > 0.5 && m < 0.5 && (
            <Label position={[x, h + 0.35, z]} color={C.text}>
              {c > 0.5 && k === 1 ? (v / pFast).toFixed(2) : v.toFixed(2)}
            </Label>
          )}
        </group>,
      );
    }
    if (m > 0.5)
      bars.push(
        <Label key={'s' + r} position={[0, (JOINT[r][0] + JOINT[r][1]) * HS + 0.4, r === 0 ? 1.4 : -1.4]} color={C.pred}>
          {(JOINT[r][0] + JOINT[r][1]).toFixed(2)}
        </Label>,
      );
  }
  return (
    <>
      <Camera position={[7, 6, 8]} target={[0, 1.5, 0]} />
      <Lights />
      <gridHelper args={[8, 8, C.grid, C.grid]} />
      {bars}
      {ROWS.map((r, i) => (
        <Label key={r} position={[-3.4, 0, i === 0 ? 1.4 : -1.4]} color={C.muted}>
          position: {r}
        </Label>
      ))}
      {m < 0.5 &&
        COLS.map((s, i) => (
          <Label key={s} position={[i === 0 ? -1.3 : 1.3, 0, 3.2]} color={C.muted}>
            speed: {s}
          </Label>
        ))}
    </>
  );
}
