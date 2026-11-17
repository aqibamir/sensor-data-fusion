import { ReactNode } from 'react';

/**
 * Every chapter on the platform has the same three parts.
 *   Story     — the 3Blue1Brown-style arc in its own 3D world (the main thing)
 *   Practice  — you compute, the app checks; explain-it-back for the oral exam
 *   Deep dive — the full mathematics, for those who want it (optional)
 */
export type ChapterView = 'story' | 'practice' | 'deep';

export function ChapterTabs({ chapterId, view }: { chapterId: string; view: ChapterView }) {
  const tabs: [ChapterView, string, string][] = [
    ['story', 'Story', `#/${chapterId}`],
    ['practice', 'Practice', `#/${chapterId}/practice`],
    ['deep', 'Deep dive', `#/${chapterId}/deep`],
  ];
  return (
    <nav className="cx-tabs" aria-label="Chapter parts">
      {tabs.map(([v, label, href]) => (
        <a key={v} href={href} className={v === view ? 'on' : ''} aria-current={v === view ? 'page' : undefined}>
          {label}
        </a>
      ))}
    </nav>
  );
}

/** Page layout for Practice and Deep dive: same top bar as the story, one calm reading column. */
export function PageShell({ chapterId, chapterLabel, view, onHome, right, children }: { chapterId: string; chapterLabel: string; view: ChapterView; onHome: () => void; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="sx cx-page">
      <header className="sx-top">
        <button className="sx-brand" onClick={onHome}>
          <span className="sx-logo" />
          Fusion <span className="cx-crumb">· {chapterLabel}</span>
        </button>
        <ChapterTabs chapterId={chapterId} view={view} />
        <div className="sx-top-right">{right}</div>
      </header>
      <main className="cx-main">{children}</main>
    </div>
  );
}
