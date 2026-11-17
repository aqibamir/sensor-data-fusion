/** Per-browser progress: a convenience only — everything works without it. */
const KEY = 'fusion-explorer-progress-v1';

type Progress = { seen: Record<string, number>; explained: Record<string, boolean> };

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* storage unavailable */
  }
  return { seen: {}, explained: {} };
}

function save(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable */
  }
}

export function markSeen(chapter: string, beat: number) {
  const p = load();
  p.seen[chapter] = Math.max(p.seen[chapter] ?? -1, beat);
  save(p);
}
export function seenUpTo(chapter: string): number {
  return load().seen[chapter] ?? -1;
}
export function isExplained(cardId: string): boolean {
  return !!load().explained[cardId];
}
export function setExplained(cardId: string, v: boolean) {
  const p = load();
  p.explained[cardId] = v;
  save(p);
}
