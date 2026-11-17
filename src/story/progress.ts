import { useSyncExternalStore } from 'react';

/**
 * Learner progress, kept only in this browser (nothing is ever sent anywhere).
 * Purely informational: where you stopped, what you got right first time,
 * which explain-back questions you said you can answer. No streaks, no pressure.
 */
export interface Progress {
  step: Record<string, string>; // chapter → last active step id
  quiz: Record<string, 'first-try' | 'retry'>; // quiz id → result of the FIRST answer
  explain: Record<string, 'yes' | 'not-yet'>; // explain-back id → self-rating
  exercise: Record<string, 'clean' | 'solved' | 'revealed'>; // practice id → solved without help / with hints / looked at the solution
  seenIntro: boolean;
}

const KEY = 'fusion-explorer-v2';
const EMPTY: Progress = { step: {}, quiz: {}, explain: {}, exercise: {}, seenIntro: false };

let state: Progress = load();
const listeners = new Set<() => void>();

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    /* storage unavailable — progress simply isn't remembered */
  }
  return { ...EMPTY };
}

function commit(next: Progress) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export const progress = {
  get: () => state,
  setStep: (chapter: string, step: string) => {
    if (state.step[chapter] !== step) commit({ ...state, step: { ...state.step, [chapter]: step } });
  },
  recordQuiz: (id: string, correct: boolean) => {
    if (state.quiz[id]) return; // only the first answer counts
    commit({ ...state, quiz: { ...state.quiz, [id]: correct ? 'first-try' : 'retry' } });
  },
  rateExplain: (id: string, v: 'yes' | 'not-yet') => commit({ ...state, explain: { ...state.explain, [id]: v } }),
  recordExercise: (id: string, v: 'clean' | 'solved' | 'revealed') => {
    const cur = state.exercise[id];
    // keep the best honest record: once solved, revealing the solution later doesn't erase it
    if (cur === 'clean' || (cur === 'solved' && v !== 'clean')) return;
    commit({ ...state, exercise: { ...state.exercise, [id]: v } });
  },
  dismissIntro: () => commit({ ...state, seenIntro: true }),
  reset: (chapter: string, ids: string[]) => {
    const quiz = { ...state.quiz };
    const explain = { ...state.explain };
    const exercise = { ...state.exercise };
    ids.forEach((id) => {
      delete quiz[id];
      delete explain[id];
      delete exercise[id];
    });
    const step = { ...state.step };
    delete step[chapter];
    commit({ ...state, quiz, explain, exercise, step });
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useProgress(): Progress {
  return useSyncExternalStore(progress.subscribe, progress.get, progress.get);
}
