# Fusion Explorer — UX project context

*Status: draft, 2026-11-17. Items marked **[assumed]** are guesses to be confirmed; **[open]** are unanswered.*

## 1. Users

**Primary user: the student preparing for the oral exam.**
- A master's student in *Introduction to Sensor Data Fusion* (Koch / Gehlen, Uni Bonn, WS 2026-27).
- Says every topic currently feels shaky. Reads English as a second language **[assumed — German university, international programme]**.
- **Goal:** walk into an oral exam and explain any concept and derivation calmly, in their own words. The real job isn't "read the app". It's being able to *say* it out loud, under questioning.
- **Today:** dense lecture slides (some image-only), a 260-page Springer book, and exercises. No visual or intuitive path in.
- **What they've told us:**
  - learns through reading plus seeing, at a high-school-friendly level, Walter Lewin / 3Blue1Brown style
  - rejects thin text, abstract dots and "ugly" dashboard-style UI
  - wants a real 3D world and a modern, minimal learning platform
- **Constraints:**
  - studies on a **laptop** (confirmed, 2026-11-17); phone/tablet are not a target for now
  - sessions are interrupted and resumed across days
  - limited time before the exam **[open: exam date unknown]**

**Secondary users (later, maybe):** classmates, if the repo gets shared. Not designed for now, but nothing should block it: keep accessibility at baseline, don't hard-code personal state, and make the first-run experience self-explanatory.

## 2. Product
- A local web app (Vite + React + three.js), now on GitHub. No backend, no accounts, no money.
- Maturity: one chapter (Ch 1) built in the final format; 9 more to come.
- Format: scrollytelling. A sticky 3D world sits next to a scrolling story, and every step is tied to a world state.

## 3. Constraints
- **Content scope:** only what the lecture decks cover. Notation must match the slides exactly.
- **Accuracy:** a wrong formula is the worst possible defect, because the learner can't catch it yet.
- **Technical:** needs WebGL, and the 3D is heavy on old laptops. Runs offline after install.
- **Copyright:** the lecture PDFs and the book never go in the repo.
- **Time:** the exam date drives how far we polish versus how fast we cover all 10 chapters **[open]**.

## 4. Ethical stance (defaults: maximum protection for the learner)
- **No engagement tricks:**
  - no streaks, no "you'll lose your progress!", no artificial completeness meters
  - progress shows only where you are and where you stopped, as information, not pressure
- **No data collection:** nothing leaves the browser, and progress stays in `localStorage`.
- **Honest about difficulty:** the app says when something is hard, and never fakes "easy".
- **Build competence, not dependence** (avoid Manufactured Dependency, Category 8): the goal is that the learner can explain things *without* the app. So explain-it-back comes before revealing the answer, every time.
- **Accessibility is a baseline:** keyboard, screen reader, reduced motion, colour-blind-safe colours, and enough contrast.

## 5. What success looks like
1. **Primary:** after a chapter, the learner can answer its explain-it-back questions out loud without opening the answer. They self-rate each card "I can explain this".
2. **Comprehension:** check-question accuracy on the first try. A low rate points to a confusing step.
3. **Usability:** they can stop at any step and resume at exactly that step days later, with no hunting.
4. **Readability:** no step needs re-reading to work out what the 3D picture is showing.
5. **Explicit non-goal:** time spent in the app is **not** a goal. Shorter is better if understanding is the same.

## 6. Known UX risks in the current build (to verify with `/evaluate`)
| Risk | Principle | Why it matters |
|---|---|---|
| No "resume where I left off" across sessions | Design for real conditions | Interrupted study sessions are the normal case |
| Inactive steps dimmed to 38 % opacity | Accessibility baseline | Low contrast for anyone re-reading previous paragraphs |
| Symbol ↔ 3D highlight works on mouse hover only | Accessibility, real conditions | Touch and keyboard users never discover it |
| 46 steps in one long scroll, with only a dot rail | Make intent visible | Hard to see the chapter's structure or jump back to one idea |
| Quiz answers and "I can explain this" not saved | Evidence / success metrics | The learner can't see what they've already mastered |
| 3D labels are small, and the scene is sometimes dark | Real conditions | Hard to read on small or bright screens |
| Mobile and tablet layout untested | Mobile Afterthought (Cat. 9) | Deprioritised: laptop-only for now. Keep the stacked fallback working, don't optimise. |
| Heavy WebGL with no fallback | Real conditions | An old laptop gets a blank stage |
