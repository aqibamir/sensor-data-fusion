# UX evaluation — Chapter 1 “The car in the dark”

*2026-11-17 · Evaluated: Chapter 1 scrollytelling page (story shell, 3D world, teaching blocks) on a 1280×800 laptop viewport, against [project-context.md](project-context.md).*
*Method: heuristic evaluation (Nielsen 10), cognitive walkthrough of 5 learner tasks, anti-pattern scan, measurements taken in the running app.*
*Not evaluated: phone/tablet (out of scope), screen-reader experience in depth, real-user testing (n = 0, so every finding is the evaluator's judgement).*

## Measured facts
| | |
|---|---|
| Length | 7,065 words, 46 steps, 13 scenes, **64.5 screens of scrolling** (≈ 35 min reading + interaction) |
| Learning elements | 15 predict-first, 11 quizzes, 15 explained formulas, 35 controls |
| Inactive-step text | 38 % opacity → text ≈ #b4b4b6 on #fafaf9 ≈ **2.0 : 1 contrast** (WCAG AA needs 4.5 : 1) |
| 3D labels | 10–12 px on a dark canvas |
| Resume | Reload → back to step `s0.1`, scroll 0. Nothing saved by the new shell. |
| Jump | A scene-dot click smooth-scrolls through every scene in between; the 3D world re-renders each one on the way |
| Keyboard | Story column not focusable (tabIndex −1): PageDown/Space don't scroll until you click into it. Toggles have no `aria-pressed`. |
| Motion | `prefers-reduced-motion` respected ✓ |

## UX Health Score: **66 / 100**
Heuristics 25/40 · task success 22/35 · anti-patterns 19/25 (no dark patterns; points lost to returning-learner and accessibility gaps that the context doc names as baseline). In short: **an excellent first read, a weak second visit.** The teaching is strong; the platform around it doesn't yet support how studying really works: interrupted sessions, revisiting one idea, and checking what you've mastered.

## Anti-pattern verdict: **Clean**
- No streaks, no pressure, no data collection, no nagging. ✓
- *Manufactured Dependency* (Cat. 8) avoided: predict-first and quizzes ask the learner to think before the reveal. ✓
- Watch item: when progress tracking is added, it must stay informational (no “complete your chapter!” prompts) — see *Artificial Incompleteness* (Cat. 4).

## The learner's story — where it breaks
> **Day 1.** You open Chapter 1 at 8 pm. The car drives, the radar beeps, the lights go out — it works; you're hooked. By Scene 5 you're 40 minutes in and close the laptop.
> **Day 2.** You open it again. You're back at “It's eleven at night.” You click a dot on the right to find your place; the world flickers through cars, sand, beams and garages as the page scrolls 30 screens. You land somewhere around Scene 5, unsure which step you'd finished.
> **Day 10, before the exam.** You want to rehearse the seven explain-it-back questions and see which you couldn't answer last time. The app has no memory of that. You also want to re-look at “the knife” — but the dot labels say *“Learning something”*, not *“conditional probability”*, so you hover dots one by one.

The arc doesn't break on understanding. It breaks on **coming back**.

## Priority issues

### P0 — none
Nothing blocks the core task or harms the learner.

### P1 — Major
1. **No resume.** Reload or return → top of chapter. Contradicts success metric #3 (“resume at exactly that step, days later”). → `/fortify` (returning-user state) + `/journey` (“Continue where you left off” entry on the home and the chapter).
2. **Dimmed text fails contrast (≈ 2 : 1).** Readers often read near the top of the column, which usually belongs to the previous, dimmed step, so you read grey text. Fails the accessibility baseline. → `/include`: keep inactive text ≥ 4.5 : 1 (e.g. opacity 0.75) and show the active step with a left accent bar instead of fading.
3. **Jumping is expensive and disorienting.** Smooth-scrolling 40,000 px and re-rendering every scene on the way. → `/journey`: jump instantly (no smooth scroll for long jumps), let the world switch only once you land, and add a scene menu (table of contents) to the top bar.
4. **Mastery isn't recorded.** Quiz results and explain-back self-ratings vanish; the learner can't see what to revise (success metrics #1 and #2). → `/measure` (define what's stored: per question “got it first try / not yet”; per explain-back card “I can explain this”) + `/journey` (a revision view).

### P2 — Minor
5. **Scene titles hide the concept names** (“Learning something”, “Forgetting a variable”). Great for the story, bad for finding things again (H6). → `/articulate`/`/organize`: keep the story title, add the term as a subtitle and in the rail and menu (“Learning something · conditional probability”).
6. **64 screens of scrolling**, much of it empty space (34 vh after every step). → `/journey`: cut the gap to ~16 vh. Long dense steps (s8.4 has six blocks) split into two.
7. **The symbol ↔ 3D highlight is undiscoverable** (an unexplained ◎ marker, hover only). → `/articulate` (one-line hint the first time) + `/include` (also on keyboard focus).
8. **3D labels are 10 px**, and some scenes are dark. → `/include`: 12–13 px minimum, a stronger label background.
9. **Keyboard reading doesn't work until you click** the column. → `/include`: focus the story on load, arrow keys / J-K step by step, visible focus rings, `aria-pressed` on toggles.
10. **No first-run orientation.** Nothing says “scroll to advance; the world follows; drag to orbit; the dots are scenes”. → `/fortify` (first-run state) + `/articulate`.

### P3 — Cosmetic
11. Sliders shared between scenes (ρ in Scenes 5, 6, 7, 10): a value set in one changes later pictures, which then no longer match the text's description. → `/journey`: per-scene state, or reset on scene entry.
12. No “reset camera” after orbiting. → `/fortify`.
13. No WebGL fallback (blank stage on failure). Low risk on your laptop. → `/fortify`.

## Heuristic scores (0 = no issue … 4 = catastrophic)
| | Score | Finding |
|---|---|---|
| H1 Visibility of status | 2 | Thin progress bar + dots, but no “scene 5 of 13 · ~20 min left”; quiz state lost |
| H2 Real-world match | 0 | Excellent: car, radar, sand, plain language |
| H3 Control & freedom | 3 | No resume; long-jump thrash; no camera reset |
| H4 Consistency | 1 | Shared slider state across scenes |
| H5 Error prevention | 1 | Easy to wander off a step while orbiting/scrolling; little else to go wrong |
| H6 Recognition over recall | 2 | Poetic scene titles; hidden hover affordance |
| H7 Flexibility & efficiency | 3 | No keyboard stepping, no TOC, no revision mode for an expert re-read |
| H8 Minimalist design | 1 | Clean and calm; minor: very long whitespace, dense s8.4 |
| H9 Error recovery | 1 | n/a mostly; no WebGL fallback |
| H10 Help | 2 | No first-run orientation |

## Cognitive walkthrough
| Task | Result | Where it fails |
|---|---|---|
| T1 First visit: understand how to use the page | **Hesitation** | Q2 (visibility): nothing says “scroll”; the faded next paragraph is the only cue |
| T2 Learn Bayes (Scene 8) | **Pass**, hesitation at s8.4 | Six blocks in one step; the world stays still through the derivation |
| T3 Resume the next day at Scene 8 | **Failure** | Q2 + Q4: no resume entry; the jump gives no stable feedback about where you landed |
| T4 Rehearse explain-back before the exam | **Failure** | Q4: no record of what you've mastered; no revision view |
| T5 Link a formula symbol to the 3D object | **Hesitation** | Q2: the ◎ affordance is unexplained, hover only |

## Positive findings — protect these
- **Story-first, physical metaphors** (sand = probability, bulldozer = marginal, knife = conditional): a strong match between system and real world; carry it into every chapter.
- **Predict-first before every reveal**: an active-learning pattern and an ethical one (builds competence, not dependence).
- **Formula + symbol table + “in other words”**: the best block in the system.
- **Fixed colour code** (truth/measurement/belief/prior/sand) across text, formulas and 3D.
- **Calm visual design**: serif reading text, one accent, little chrome. Reduced motion respected.
- **No dark patterns, no data leaving the browser.**

## Recommended actions (in order)
1. **`/journey` + `/fortify` — the “coming back” flow (issues 1, 3, 10, 12):**
   - resume to the exact step, and “Continue” on the home page
   - instant jumps plus a table-of-contents menu
   - first-run hint
   - camera reset
2. **`/include` — the reading baseline (issues 2, 7, 8, 9):** contrast of inactive steps, label size, keyboard stepping, focus rings, ARIA on toggles.
3. **`/measure` → `/journey` — mastery memory and a revision view (issue 4).** Informational only, with no streaks.
4. **`/articulate` — scene subtitles with concept names; first-run and hover hint copy (issues 5, 7, 10).**
5. **`/journey` — tighten the pacing (issue 6) and per-scene slider state (issue 11).**

Re-evaluate after steps 1–2 (expected score ≥ 80).

---

## Remediation log — 2026-11-17

| # | Issue | Fix | Verified |
|---|---|---|---|
| 1 | No resume | The last step is saved locally; the chapter reopens at that step; “Continue where you left off” on the home page | Reload after jumping to Scene 8 reopens on s8.1 ✓ |
| 2 | Dimmed text 2 : 1 | No fading; the active step is marked by a dark bar on the left. Text stays #3f3f46 on #fafaf9 (≈ 10 : 1) | Computed style ✓ |
| 3 | Jump thrash | Instant jumps; the world switches once, on arrival; **Contents** menu in the top bar | Contents → Scene 8 lands on s8.1 with the Bayes scene ✓ |
| 4 | Mastery not recorded | Each check stores its first answer; explain-back asks “Could you have said that without looking? Yes / Not yet”; **Revise** drawer lists what to look at again, with jump links. Informational only. | Stored and listed ✓ |
| 5 | Poetic titles | Every scene has a concept subtitle (in the story, on the stage, in the menu and on the rail) | ✓ |
| 6 | 64 screens | Gap after each step 34 vh → 16 vh; s8.4 split into “do it by hand” (8.4) and “why it's true” (8.5) | 47 steps ✓ |
| 7 | Hidden ◎ link | Hint line under linked formulas; rows also react to keyboard focus | ✓ |
| 8 | 10 px labels | 12–13 px, stronger background and shadow | ✓ |
| 9 | Keyboard | The story column takes focus on load; ← / → (or J / K) step through paragraphs, including rapid presses; focus rings; `aria-pressed` on toggles and quiz options; ARIA labels on the rail and canvas | ✓ |
| 10 | No first-run orientation | “How this page works” card on the first visit, dismissed once | ✓ |
| 11 | Shared slider state | Scenes 6–7 use their own fixed landscape; Scene 10 has its own sliders | ✓ |
| 12 | No camera reset | “Reset view” button on the stage | ✓ |
| 13 | No WebGL fallback | Detection plus error boundary; a plain-language fallback message keeps the story usable | ✓ (code path) |

Also fixed during verification:
- Active-step detection now uses a single reading line at 43 % of the column (the old overlap band could highlight the previous long step).
- The top bar shows the scene's own name plus the minutes left.

Re-evaluation pending a real study session on the laptop.
