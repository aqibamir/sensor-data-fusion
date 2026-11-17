import { Canvas } from '@react-three/fiber';
import { createContext, ReactNode, Suspense, useContext, useEffect, useRef, useState } from 'react';

export interface Step {
  id: string;
  body: ReactNode;
}
export interface Scene {
  id: string;
  title: string;
  kicker: string;
  steps: Step[];
}

/** Highlight bus: hovering a symbol in a formula lights up the matching object in 3D. */
export const HighlightCtx = createContext<{ hl: string | null; setHl: (k: string | null) => void }>({ hl: null, setHl: () => {} });
export const useHighlight = () => useContext(HighlightCtx);

export function StoryShell({
  chapterLabel,
  title,
  scenes,
  renderWorld,
  onHome,
}: {
  chapterLabel: string;
  title: string;
  scenes: Scene[];
  renderWorld: (stepId: string, hl: string | null) => ReactNode;
  onHome: () => void;
}) {
  const allSteps = scenes.flatMap((s) => s.steps.map((st) => ({ ...st, scene: s.id })));
  const [active, setActive] = useState(allSteps[0].id);
  const [hl, setHl] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive((e.target as HTMLElement).dataset.step!);
      },
      { root, rootMargin: '-42% 0px -52% 0px', threshold: 0 },
    );
    root.querySelectorAll('[data-step]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [scenes]);

  const idx = allSteps.findIndex((s) => s.id === active);
  const activeScene = allSteps[idx]?.scene;
  const sceneIdx = scenes.findIndex((s) => s.id === activeScene);
  const progress = (idx + 1) / allSteps.length;

  const goScene = (id: string) => scroller.current?.querySelector(`#${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <HighlightCtx.Provider value={{ hl, setHl }}>
      <div className="sx">
        <header className="sx-top">
          <button className="sx-brand" onClick={onHome}>
            <span className="sx-logo" />
            Fusion
          </button>
          <div className="sx-top-title">
            <span className="sx-top-ch">{chapterLabel}</span>
            <span className="sx-top-sep">/</span>
            <span>{title}</span>
          </div>
          <div className="sx-top-right">
            <span className="sx-top-scene">{scenes[sceneIdx]?.kicker}</span>
          </div>
          <div className="sx-progress" style={{ transform: `scaleX(${progress})` }} />
        </header>
        <div className="sx-body">
          <div className="sx-stage">
            <Canvas camera={{ position: [-6, 2.5, 7], fov: 40 }} dpr={[1, 2]} shadows={false}>
              <Suspense fallback={null}>{renderWorld(active, hl)}</Suspense>
            </Canvas>
            <div className="sx-stage-label">
              <span className="sx-stage-kicker">{scenes[sceneIdx]?.kicker}</span>
              <span>{scenes[sceneIdx]?.title}</span>
            </div>
            <div className="sx-stage-hint">Drag to look around</div>
          </div>
          <div className="sx-story" ref={scroller}>
            <article className="sx-article">
              {scenes.map((sc, i) => (
                <section key={sc.id} id={sc.id} className="sx-scene">
                  <div className="sx-kicker">{sc.kicker}</div>
                  <h2 className="sx-h2">{sc.title}</h2>
                  {sc.steps.map((st) => (
                    <div key={st.id} data-step={st.id} className={`sx-step ${st.id === active ? 'is-active' : ''}`}>
                      {st.body}
                    </div>
                  ))}
                  {i < scenes.length - 1 && <div className="sx-scene-end" />}
                </section>
              ))}
              <div className="sx-footer-space" />
            </article>
          </div>
          <nav className="sx-rail" aria-label="Scenes">
            {scenes.map((sc, i) => (
              <button key={sc.id} className={`sx-rail-dot ${i === sceneIdx ? 'on' : ''} ${i < sceneIdx ? 'done' : ''}`} onClick={() => goScene(sc.id)}>
                <span className="sx-rail-label">{sc.title}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </HighlightCtx.Provider>
  );
}
