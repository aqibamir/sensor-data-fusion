# Platform outline (product decision, 2026-11-17)

**Problem:** students find mathematical courses like Sensor Data Fusion hard to learn from slides. They need intuition first, then proof to themselves that they can do the maths and explain it.

**Users:** the author, preparing for an oral exam (laptop). Later, possibly classmates and others.

## Every chapter has three parts
| Part | Role | Status for Ch 1 |
|---|---|---|
| **Story** | The main thing. A 3Blue1Brown-style arc in its own 3D world (each chapter picks the story that explains it best). Predict-first, formulas with symbol tables, derivations, inline checks. | ✅ 14 scenes, 48 steps |
| **Practice** | You compute, the app checks (tolerance, hints, worked solution). Then explain-it-back with an honest self-rating. | ✅ 8 exercises + 7 explain-back |
| **Deep dive** | Optional full mathematics, for those who want to know exactly why. | Slot with planned topics; content later |

Navigation: chapter tabs **Story · Practice · Deep dive**. Every chapter is always open; progress (story position, practice solved, can-explain) is shown, never enforced.

## Decisions
- No game; practice replaces it (user, 2026-11-17).
- No gating, no streaks, no scores; progress is local and informational.
- The platform is not tied to one course in its structure; content today is Sensor Data Fusion only.
- Not now: accounts, sync, multiple courses, a content editor, phone layout.

## Building a new chapter (the kit)
1. Screenplay in `docs/scripts/chN-script.md`, then a beginner audit.
2. Story with `StoryShell` + a `WorldN` director + `story/blocks`.
3. Practice with `story/practice` (`Exercise`, `PlaceExercise`) + `ExplainBack`.
4. A deep-dive slot listing planned topics.
5. Verify every step, every exercise answer and every formula; then a UX pass.

## Success criteria
- After a chapter's Practice, the learner solves the exercises without hints and answers most explain-back questions “Yes”.
- A new chapter is built from the kit without new layout or UI.
- A first-time visitor understands Story → Practice → Deep dive without instructions.
