import { Canvas } from '@react-three/fiber';
import { Component, createContext, ReactNode, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ChapterTabs } from './ChapterFrame';
import { progress, useProgress } from './progress';

export interface Step {
  id: string;
  body: ReactNode;
}
export interface Scene {
  id: string;
  title: string;
  /** The textbook name of the idea — shown under the story title, in the menu and on the rail. */
  concept: string;
  kicker: string;
  steps: Step[];
}

/** Highlight bus: hovering/focusing a symbol in a formula lights up the matching object in 3D. */
export const HighlightCtx = createContext<{ hl: string | null; setHl: (k: string | null) => void }>({ hl: null, setHl: () => {} });
export const useHighlight = () => useContext(HighlightCtx);

/** Which step a block lives in (used to jump back to it from the revision drawer). */
export const StepCtx = createContext<string>('');

/** Registry of everything you can master: quizzes and explain-back questions. */
export interface Checkable {
  id: string;
  kind: 'quiz' | 'explain';
  label: string;
  step: string;
}
const RegistryCtx = createContext<(c: Checkable) => void>(() => {});
export const useRegister = () => useContext(RegistryCtx);

/** The reading line: the step whose top has passed this fraction of the column height is the active one. */
const READ_LINE = 0.43;

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

class StageBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function StoryShell({
  chapterId,
  chapterLabel,
  title,
  scenes,
  renderWorld,
  onHome,
  extraItems = [],
}: {
  chapterId: string;
  chapterLabel: string;
  title: string;
  scenes: Scene[];
  renderWorld: (stepId: string, hl: string | null, camNonce: number) => ReactNode;
  onHome: () => void;
  /** Checkables that live outside the story (e.g. explain-back on the Practice page). Their `step` is a URL hash. */
  extraItems?: Checkable[];
}) {
  const allSteps = useMemo(() => scenes.flatMap((s, si) => s.steps.map((st) => ({ ...st, scene: s.id, sceneIdx: si }))), [scenes]);
  const saved = progress.get().step[chapterId];
  const [active, setActive] = useState(saved && allSteps.some((s) => s.id === saved) ? saved : allSteps[0].id);
  const [hl, setHl] = useState<string | null>(null);
  const [menu, setMenu] = useState<'none' | 'contents' | 'review'>('none');
  const [camNonce, setCamNonce] = useState(0);
  const [minutes, setMinutes] = useState<Record<string, number>>({});
  const [registry, setRegistry] = useState<Record<string, Checkable>>({});
  const p = useProgress();
  const scroller = useRef<HTMLDivElement>(null);
  const jumping = useRef(false);
  const gl = useMemo(webglAvailable, []);

  const register = useCallback((c: Checkable) => setRegistry((r) => (r[c.id] ? r : { ...r, [c.id]: c })), []);

  // --- which step is under the reading line (43 % down the story column)
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const measure = () => {
      if (jumping.current) return;
      const y = root.scrollTop + root.clientHeight * READ_LINE;
      let hit: string | null = null;
      root.querySelectorAll<HTMLElement>('[data-step]').forEach((el) => {
        if (el.offsetTop <= y) hit = el.dataset.step!;
      });
      if (hit) setActive(hit);
    };
    // Measured directly on every scroll event (47 cached offsets — cheap). rAF throttling would stall in background tabs.
    root.addEventListener('scroll', measure, { passive: true });
    return () => root.removeEventListener('scroll', measure);
  }, [scenes]);

  // --- remember where you are
  useEffect(() => progress.setStep(chapterId, active), [chapterId, active]);

  // --- on open: jump (instantly) to where you left off, focus the story so keys work
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    if (saved) jumpTo(saved, false);
    root.focus({ preventScroll: true });
    // reading time per step (≈ 200 words / minute)
    const m: Record<string, number> = {};
    root.querySelectorAll<HTMLElement>('[data-step]').forEach((el) => (m[el.dataset.step!] = el.innerText.split(/\s+/).length / 200));
    setMinutes(m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Instant jump: no smooth scroll through 40 screens, and the world switches only once, on arrival. */
  function jumpTo(stepId: string, close = true) {
    if (stepId.startsWith('#')) {
      window.location.hash = stepId;
      return;
    }
    const root = scroller.current;
    const el = root?.querySelector<HTMLElement>(`[data-step="${stepId}"]`);
    if (!root || !el) return;
    jumping.current = true;
    setActive(stepId);
    root.scrollTo({ top: el.offsetTop - root.clientHeight * READ_LINE + 2, behavior: 'auto' });
    window.setTimeout(() => (jumping.current = false), 120);
    if (close) setMenu('none');
  }

  const idx = Math.max(
    0,
    allSteps.findIndex((s) => s.id === active),
  );
  // Rapid key presses: count from where we're HEADING, not from where the smooth scroll currently is.
  const pending = useRef<{ i: number; t: number } | null>(null);
  const step = (d: number) => {
    const base = pending.current && performance.now() - pending.current.t < 900 ? pending.current.i : idx;
    const ni = Math.min(allSteps.length - 1, Math.max(0, base + d));
    pending.current = { i: ni, t: performance.now() };
    const next = allSteps[ni];
    const root = scroller.current;
    const el = root?.querySelector<HTMLElement>(`[data-step="${next.id}"]`);
    if (root && el) root.scrollTo({ top: el.offsetTop - root.clientHeight * READ_LINE + 2, behavior: 'smooth' });
  };

  // --- keyboard: ←/→ or J/K step through the story, Esc closes menus
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'Escape') setMenu('none');
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowRight' || e.key === 'j') (e.preventDefault(), step(1));
      if (e.key === 'ArrowLeft' || e.key === 'k') (e.preventDefault(), step(-1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const cur = allSteps[idx];
  const scene = scenes[cur.sceneIdx];
  const progressFrac = (idx + 1) / allSteps.length;
  const minsLeft = Math.max(1, Math.round(allSteps.slice(idx).reduce((s, st) => s + (minutes[st.id] ?? 0.8), 0) * 1.3));
  const items = [...Object.values(registry), ...extraItems];
  const quizzes = items.filter((i) => i.kind === 'quiz');
  const explains = items.filter((i) => i.kind === 'explain');
  const firstTry = quizzes.filter((q) => p.quiz[q.id] === 'first-try').length;
  const canExplain = explains.filter((q) => p.explain[q.id] === 'yes').length;

  const stageFallback = (
    <div className="sx-nogl">
      <b>The 3D world couldn't start on this computer.</b>
      <p>Your browser has WebGL turned off or unsupported. Everything in the story still works: the text, numbers, formulas and checks. Try another browser (Chrome, Firefox, Safari) to see the scenes.</p>
    </div>
  );

  return (
    <HighlightCtx.Provider value={{ hl, setHl }}>
      <RegistryCtx.Provider value={register}>
        <div className="sx">
          <header className="sx-top">
            <button className="sx-brand" onClick={onHome} title={title}>
              <span className="sx-logo" />
              Fusion <span className="cx-crumb">· {chapterLabel}</span>
            </button>
            <ChapterTabs chapterId={chapterId} view="story" />
            <div className="sx-top-right">
              <span className="sx-top-meta">
                {scene.kicker} · about {minsLeft} min left
              </span>
              <button className={`sx-chip ${menu === 'contents' ? 'on' : ''}`} onClick={() => setMenu(menu === 'contents' ? 'none' : 'contents')} aria-expanded={menu === 'contents'}>
                Contents
              </button>
              <button className={`sx-chip ${menu === 'review' ? 'on' : ''}`} onClick={() => setMenu(menu === 'review' ? 'none' : 'review')} aria-expanded={menu === 'review'}>
                Revise
              </button>
            </div>
            <div className="sx-progress" style={{ transform: `scaleX(${progressFrac})` }} />
          </header>

          {menu !== 'none' && <div className="sx-scrim" onClick={() => setMenu('none')} />}
          {menu === 'contents' && (
            <nav className="sx-panel" aria-label="Chapter contents">
              <div className="sx-panel-head">Contents</div>
              <ol className="sx-toc">
                {scenes.map((s, i) => {
                  const sQ = quizzes.filter((q) => allSteps.find((a) => a.id === q.step)?.scene === s.id);
                  const done = sQ.filter((q) => p.quiz[q.id]).length;
                  return (
                    <li key={s.id}>
                      <button className={i === cur.sceneIdx ? 'on' : ''} onClick={() => jumpTo(s.steps[0].id)}>
                        <span className="sx-toc-num">{s.kicker}</span>
                        <span className="sx-toc-text">
                          <span className="sx-toc-title">{s.title}</span>
                          <span className="sx-toc-concept">{s.concept}</span>
                        </span>
                        {sQ.length > 0 && (
                          <span className="sx-toc-check" title="Checks answered in this scene">
                            {done}/{sQ.length}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>
          )}
          {menu === 'review' && (
            <aside className="sx-panel sx-panel-wide" aria-label="Revision">
              <div className="sx-panel-head">Revise</div>
              <p className="sx-panel-note">
                Only you see this, and it's stored only in this browser. It shows what to look at again. Nothing here is a score.
              </p>
              <div className="sx-review-sum">
                <div>
                  <b>{canExplain}</b> of {explains.length} explain-back questions you said you can answer
                </div>
                <div>
                  <b>{firstTry}</b> of {quizzes.length} checks right on the first try
                </div>
                <div>
                  <b>{Object.entries(p.exercise).filter(([k, v]) => k.startsWith(chapterId + '-p') && v !== 'revealed').length}</b> practice exercises solved ·{' '}
                  <a className="sx-link" href={`#/${chapterId}/practice`}>
                    open Practice
                  </a>
                </div>
              </div>
              <div className="sx-review-h">Explain it back</div>
              <ul className="sx-review">
                {explains.map((q) => (
                  <li key={q.id}>
                    <span className={`sx-dot ${p.explain[q.id] === 'yes' ? 'ok' : p.explain[q.id] === 'not-yet' ? 'todo' : ''}`} />
                    <span className="sx-review-label">{q.label}</span>
                    <button className="sx-link" onClick={() => jumpTo(q.step)}>
                      Go
                    </button>
                  </li>
                ))}
              </ul>
              <div className="sx-review-h">Checks to look at again</div>
              <ul className="sx-review">
                {quizzes.filter((q) => p.quiz[q.id] !== 'first-try').length === 0 && <li className="sx-muted">Nothing yet: every check you've answered was right the first time.</li>}
                {quizzes
                  .filter((q) => p.quiz[q.id] !== 'first-try')
                  .map((q) => (
                    <li key={q.id}>
                      <span className={`sx-dot ${p.quiz[q.id] === 'retry' ? 'todo' : ''}`} />
                      <span className="sx-review-label">
                        {q.label}
                        <span className="sx-muted"> · {p.quiz[q.id] === 'retry' ? 'missed first time' : 'not answered yet'}</span>
                      </span>
                      <button className="sx-link" onClick={() => jumpTo(q.step)}>
                        Go
                      </button>
                    </li>
                  ))}
              </ul>
              <button className="sx-link sx-reset" onClick={() => progress.reset(chapterId, items.map((i) => i.id))}>
                Clear my progress for this chapter
              </button>
            </aside>
          )}

          <div className="sx-body">
            <div className="sx-stage">
              {gl ? (
                <StageBoundary fallback={stageFallback}>
                  <Canvas camera={{ position: [-6, 2.5, 7], fov: 40 }} dpr={[1, 2]} aria-label={`3D scene: ${scene.title}`} role="img">
                    <Suspense fallback={null}>{renderWorld(active, hl, camNonce)}</Suspense>
                  </Canvas>
                </StageBoundary>
              ) : (
                stageFallback
              )}
              <div className="sx-stage-label">
                <span className="sx-stage-kicker">
                  {scene.kicker} · {scene.concept}
                </span>
                <span>{scene.title}</span>
              </div>
              <div className="sx-stage-tools">
                <button className="sx-stage-btn" onClick={() => setCamNonce((n) => n + 1)} title="Put the camera back where the story wants it">
                  Reset view
                </button>
              </div>
              <div className="sx-stage-hint">Drag to look around · scroll to zoom</div>
              {!p.seenIntro && (
                <div className="sx-intro" role="dialog" aria-label="How this page works">
                  <div className="sx-intro-title">How this page works</div>
                  <ul>
                    <li>
                      <b>Scroll the story</b> on the right. This 3D world follows along and changes with each paragraph.
                    </li>
                    <li>
                      <b>Drag</b> here to look around. <b>Reset view</b> brings the camera back.
                    </li>
                    <li>
                      <kbd>←</kbd> <kbd>→</kbd> step one paragraph at a time.
                    </li>
                    <li>
                      <b>Contents</b> jumps to any scene. <b>Revise</b> shows what to look at again.
                    </li>
                    <li>Your place is saved: close the tab any time and continue later.</li>
                  </ul>
                  <button className="sx-btn sx-btn-dark" onClick={progress.dismissIntro}>
                    Got it
                  </button>
                </div>
              )}
            </div>
            <div className="sx-story" ref={scroller} tabIndex={0} aria-label="Story">
              <article className="sx-article">
                {scenes.map((sc, i) => (
                  <section key={sc.id} id={sc.id} className="sx-scene" aria-labelledby={`${sc.id}-h`}>
                    <div className="sx-kicker">{sc.kicker}</div>
                    <h2 className="sx-h2" id={`${sc.id}-h`}>
                      {sc.title}
                    </h2>
                    <div className="sx-concept">{sc.concept}</div>
                    {sc.steps.map((st) => (
                      <div key={st.id} data-step={st.id} className={`sx-step ${st.id === active ? 'is-active' : ''}`}>
                        <StepCtx.Provider value={st.id}>{st.body}</StepCtx.Provider>
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
                <button key={sc.id} className={`sx-rail-dot ${i === cur.sceneIdx ? 'on' : ''} ${i < cur.sceneIdx ? 'done' : ''}`} onClick={() => jumpTo(sc.steps[0].id)} aria-label={`${sc.kicker}: ${sc.title} (${sc.concept})`}>
                  <span className="sx-rail-label" aria-hidden>
                    {sc.title} · {sc.concept}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </RegistryCtx.Provider>
    </HighlightCtx.Provider>
  );
}
