import { Environment } from '@react-three/drei';

/**
 * EXPERIMENT: Poly Haven night skies (CC0) as image-based lighting.
 * Off by default. Turn on with ?look=sky1 or ?look=sky2 before the # in the URL.
 */
const SKIES: Record<string, string> = {
  sky1: '/hdri/clarens_night_02_1k.hdr',
  sky2: '/hdri/dikhololo_night_1k.hdr',
};

export function lookSky(): string | null {
  const v = new URLSearchParams(window.location.search).get('look');
  return v && SKIES[v] ? SKIES[v] : null;
}

/** The sky as background + light source. Brightness tuned for night scenes. */
export function SkyLook({ file, intensity = 1.6, blur = 0.04 }: { file: string; intensity?: number; blur?: number }) {
  return <Environment files={file} background backgroundBlurriness={blur} backgroundIntensity={0.9} environmentIntensity={intensity} />;
}
