/**
 * One colour per quantity, everywhere (formulas, 3D, 2D). Follows the MHT slides:
 * prediction = green, measurement = red, posterior = blue.
 */
export const C = {
  bg: '#0f1115',
  panel: '#161a22',
  text: '#e8e6e3',
  muted: '#8b929c',
  grid: '#2a2f3a',
  axis: '#5b6270',
  pred: '#16A34A', // prediction / prior
  meas: '#DC2626', // measurement / likelihood
  post: '#2563EB', // posterior / filtering result
  retro: '#9333EA', // retrodiction
  joint: '#CA8A04', // joint density / highlighted state
  truth: '#FFE066', // ground truth
  accent: '#EA580C',
};

/** KaTeX macros: \pred{..}, \meas{..}, \post{..} colour a term with its quantity colour. */
export const texMacros: Record<string, string> = {
  '\\pred': `\\textcolor{#${C.pred}}{#1}`,
  '\\meas': `\\textcolor{#${C.meas}}{#1}`,
  '\\post': `\\textcolor{#${C.post}}{#1}`,
  '\\retro': `\\textcolor{#${C.retro}}{#1}`,
  '\\joint': `\\textcolor{#${C.joint}}{#1}`,
  '\\hl': `\\textcolor{#${C.accent}}{#1}`,
  '\\Z': '\\mathcal{Z}',
  '\\N': '\\mathcal{N}',
  '\\x': '\\mathbf{x}',
  '\\z': '\\mathbf{z}',
};
