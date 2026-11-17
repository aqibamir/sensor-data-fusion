import { Canvas } from '@react-three/fiber';
import { ReactNode, Suspense, useEffect } from 'react';
import { Card, ExplainCards } from './ExplainCards';
import { markSeen } from './progress';

export interface Beat {
  title: string;
  /** Narration, formulas, derivations and sliders. */
  panel: ReactNode;
  /** 3D content (rendered inside a shared Canvas) or a 2D element. */
  scene3d?: ReactNode;
  scene2d?: ReactNode;
  /** Slide references, e.g. "L2 p.10". */
  source?: string;
}

export function ChapterShell(props: {
  id: string;
  num: number;
  title: string;
  beats: Beat[];
  cards: Card[];
  beat: number;
  setBeat: (b: number) => void;
}) {
  const { id, num, title, beats, cards, beat, setBeat } = props;
  const total = beats.length + 1; // + explain-it-back page
  const onCards = beat >= beats.length;
  const b = beats[Math.min(beat, beats.length - 1)];

  useEffect(() => markSeen(id, beat), [id, beat]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowRight') setBeat(Math.min(beat + 1, total - 1));
      if (e.key === 'ArrowLeft') setBeat(Math.max(beat - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [beat, total, setBeat]);

  return (
    <div className="chapter">
      <div className="stage">
        {onCards ? (
          <div className="stage-cards-hint">
            <div className="big-num">Ch {num}</div>
            <div>Explain it back</div>
            <p className="muted">
              Oral exams test whether you can <i>say</i> it. Answer each question aloud before revealing the model answer.
            </p>
          </div>
        ) : b.scene3d ? (
          <Canvas camera={{ position: [6, 5, 8], fov: 45 }} dpr={[1, 2]}>
            <color attach="background" args={['#0f1115']} />
            <Suspense fallback={null}>{b.scene3d}</Suspense>
          </Canvas>
        ) : (
          <div className="stage-2d">{b.scene2d}</div>
        )}
        {!onCards && b.scene3d && <div className="stage-hint">drag to orbit · scroll to zoom</div>}
      </div>

      <aside className="panel">
        <div className="panel-head">
          <div className="crumb">
            Chapter {num} · {title}
          </div>
          <div className="dots">
            {Array.from({ length: total }, (_, i) => (
              <button
                key={i}
                className={`dot ${i === beat ? 'dot-on' : ''} ${i === total - 1 ? 'dot-cards' : ''}`}
                onClick={() => setBeat(i)}
                title={i === total - 1 ? 'Explain it back' : beats[i].title}
              />
            ))}
          </div>
          <h2>{onCards ? 'Explain it back' : b.title}</h2>
          {!onCards && b.source && <div className="source">Slides: {b.source}</div>}
        </div>
        <div className="panel-body" key={beat}>
          {onCards ? <ExplainCards cards={cards} onGoto={setBeat} /> : b.panel}
        </div>
        <div className="panel-nav">
          <button className="btn" disabled={beat === 0} onClick={() => setBeat(beat - 1)}>
            ← Back
          </button>
          <span className="muted">
            {beat + 1} / {total}
          </span>
          <button className="btn btn-primary" disabled={beat === total - 1} onClick={() => setBeat(beat + 1)}>
            Next →
          </button>
        </div>
      </aside>
    </div>
  );
}
