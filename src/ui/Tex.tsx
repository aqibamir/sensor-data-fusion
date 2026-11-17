import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useMemo } from 'react';
import { texMacros } from './theme';

export function Tex({ tex, block = false }: { tex: string; block?: boolean }) {
  const html = useMemo(
    () =>
      katex.renderToString(tex, {
        displayMode: block,
        throwOnError: false,
        macros: { ...texMacros },
        strict: false,
      }),
    [tex, block],
  );
  return <span className={block ? 'tex-block' : 'tex-inline'} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Inline maths shorthand for narration: <M>x_k</M>. */
export const M = ({ children }: { children: string }) => <Tex tex={children} />;
