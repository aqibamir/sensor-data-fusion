# Chapter 1 — “The Car in the Dark”
### Screenplay for the probability chapter

*Format: one persistent 3D world (a road at night) stays pinned on the left. The story scrolls on the right. Each **step** of the text changes the world: camera, objects, numbers. When a step asks you to do something, the controls sit right inside that step, next to the sentence that explains them.*

*Rules for the whole script (from the research):*
- **One world, one car, the whole chapter.** Never an abstract dot when a car can be shown.
- **Intuition → picture → numbers → formula → “in other words”.** No formula appears before you've seen what it describes.
- **Predict first.** Before every reveal, you're asked what you think will happen (Walter Lewin's trick). The answer is hidden until you commit.
- **Start small, build big.** Every idea appears first with 2–4 boxes of numbers you could do by hand. Only then with smooth curves.
- **Every symbol is explained the moment it appears.** Hover any symbol in a formula and its meaning lights up in the 3D world.
- **Each scene ends with a 1-question check, and links forward** (“you'll use this in Chapter X for …”).

---

## THE WORLD (built once, used in every scene)

| Object | What it looks like | Why it exists |
|---|---|---|
| **The road** | Long straight 2-lane road, dark asphalt, white dashed centre line, **distance markers every 10 m** (small glowing posts labelled 80 m, 90 m, … 140 m) | The x-axis, made physical. Every number in the chapter is a distance you can see. |
| **The car** | Low-poly car: body, cabin, 4 wheels that spin, **headlights with light cones**, red tail lights | The thing we track. Truth. |
| **The radar station** | Tower at the road start, with a dish that **rotates**. Each measurement = a ring-shaped pulse that travels out, and a **red pin** that drops onto the road where the radar *thinks* the car is | The sensor. Makes “measurement” and “noise” visible. |
| **The ghost cars** | Semi-transparent blue copies of the car | Our *belief*: “the car could be here, or here, or here…” |
| **The sand** | Golden sand piling up along the road | Probability density. Height of the sand = density; amount of sand = probability. |
| **Speedometer** | A small dial floating above the car | The second unknown (velocity), from Scene 6 on. |
| **Night sky + fog** | Dark navy, a few stars, distance fog | Mood. Also a hint: you *can't see far*. |

Colour code (fixed for the whole app): **truth = warm yellow**, **measurement = red**, **belief / posterior = blue**, **prior / prediction = green**, **probability mass (sand) = gold**.

---

## SCENE 0 — Cold open: “Where is the car?”
**Goal:** create the question the whole course answers. No maths.

**Step 0.1**
- *On screen:* Camera low beside the road at night. The car drives in from the left, headlights sweeping the asphalt, wheels spinning. It passes the 100 m post. Sound-design style captions: *vroom*.
- *Narration:* “This is a car. It's 11 pm, it's foggy, and it's driving down a long straight road. You can see it — for now.”

**Step 0.2**
- *On screen:* Camera rises and swings back to the radar tower. The dish turns. A pulse ring travels down the road. A red pin drops onto the road at 103 m and a label pops up: **“z = 103 m”**. The real car is at 100 m.
- *Narration:* “This is a radar. Once every second it sends out a pulse and reports a distance. It just said: ‘103 metres’. But look — the car is actually at 100. The radar is close, but not exact. It never is.”

**Step 0.3 — the lights go out**
- *On screen:* The car's lights and body fade to almost invisible (a faint outline you can toggle). Only the radar pins remain: 103 m… then the car moves on and new pins drop: 118 m… 141 m…
- *Narration:* “Now turn off the lights. This is what a tracking system actually experiences. It never sees the car. It only gets these red pins, one per second, each a little bit wrong. And yet, an air-traffic controller, a self-driving car, a navy ship all need to answer one question, reliably, every second:”
- *Big caption:* **Where is the car — really? And how sure are we?**

**Step 0.4 — what this chapter gives you**
- *On screen:* Freeze. Ghost cars fade in around the last pin: a blue haze of possible cars.
- *Narration:* “To answer honestly we need a language for ‘I'm not sure’. That language is probability. In this chapter you'll learn every piece of it you need for the whole course. Nothing here is decoration — I'll show you where each piece comes back.”
- *Small roadmap:* density → mean & spread → two unknowns → marginal → conditional → Bayes → Gaussian → driving a Gaussian.

---

## SCENE 1 — “We track a belief, not a car”
**Goal:** state = random variable. The cloud of ghost cars.

**Step 1.1**
- *On screen:* Car stopped at the 100 m post (shown faintly). Radar fires **one** pulse: pin at 97 m.
- *Narration:* “Let's freeze the car at exactly 100 m and play a game. The radar measures once: 97 m. If that's all you had, where would you say the car is?”
- *Predict:* “Exactly at 97 m” / “Somewhere around 97, maybe ± a few metres” / “No idea at all”.
- *Reveal:* “Around 97 — but you'd be wrong to say *exactly* 97, because we know the radar makes errors of a few metres. The honest answer is a **range with likelihoods**.”

**Step 1.2 — the ghost cars**
- *On screen:* 60 ghost cars appear spread around 97 m, denser near 97, sparser further away.
- *Narration:* “Picture every place the car could be as a ghost car. More ghosts where it's more likely. This cloud of ghosts is our **belief**. In maths we say: the position is a **random variable** — a quantity we describe not by one value, but by how plausible each value is.”
- *Slider (inside the text):* **radar quality**: bad ↔ good. Bad radar → ghosts spread over 80–120 m. Good radar → ghosts huddle within a metre.

**Step 1.3 — the state**
- *On screen:* Labels appear on the real car: position `x = 100 m`, and later speed `ẋ`.
- *Narration:* “Everything we want to know about the car at time step k goes into one list of numbers: the **state** **x**ₖ. Here it's just one number, the position. In the lecture you'll see bigger states:”
  - one number: position on a line, `x ∈ ℝ`
  - nine numbers: position, velocity, acceleration in 3D, `x = (r, v, a) ∈ ℝ⁹`
  - two cars at once: `x = (x₁, x₂)` with `xᵢ = (xᵢ, yᵢ, ẋᵢ, ẏᵢ)` — “the dot means *rate of change*, i.e. velocity”
  - a big object with a shape (extended target), or kinematics plus a class (car / truck / bike)
- *Formula moment:* `p(xₖ | 𝒵ᵏ)` appears above the ghost cloud. Hover-explained piece by piece: **p( … )** = “how plausible”, **xₖ** = “the state at time k”, **|** = “given”, **𝒵ᵏ** = “all radar readings up to now”.
- *In other words:* “The ghost cloud has a name: p of x-k given Z-k. Our belief about the car, given everything the radar has said so far. You'll see it on nearly every slide.”
- *Forward link:* “Chapter 2 is about how this cloud moves when the car drives, and shrinks when a new pin arrives.”
- *Check:* “Why don't we just use the latest radar reading as the position?” (correct: it's noisy; we want to say how sure we are and combine it with what we knew).

---

## SCENE 2 — “Probability lives in the sand, not in a point”
**Goal:** pdf, probability = area, normalisation, density can be > 1.

**Step 2.1 — the paradox**
- *On screen:* Close-up of the road between 99 and 101 m, a magnifying-glass zoom.
- *Narration:* “Quick puzzle. What's the probability that the car is at *exactly* 100.000000… metres?”
- *Predict:* 0 / ½ / 1 / “depends on the radar”.
- *Reveal:* “Zero. Between 99 and 101 there are infinitely many positions: 100.1, 100.01, 100.001… If each had a positive chance, the total would be infinite. So for continuous things we can't talk about the probability *of a point*. We need a different object.”

**Step 2.2 — pile the pins (the most important animation of the chapter)**
- *On screen:* Car frozen at 100 m (faint). The radar fires rapidly: **500 pulses**. Each red pin, after landing, turns into a small **gold grain** that drops into a 2-metre-wide bin on the road. The grains stack into columns, a histogram growing in real time.
- *Narration:* “Let's measure the same parked car 500 times and stack up where the pins land. Most land near 100. Fewer at 95 or 105. Almost none at 85.”
- *Then:* the bins get narrower (2 m → 1 m → 0.5 m → 0.1 m) and the stack smooths into a **golden sand dune** with a glowing curve on top.
- *Narration:* “Now make the bins thinner and thinner. The jagged stack becomes a smooth dune of sand. The shape of this dune is called a **probability density function**, p(x).”

**Step 2.3 — sand is probability**
- *On screen:* Two orange traffic cones appear on the road at 95 m and 100 m. The sand between them glows; a counter shows “0.34 of all sand”.
- *Narration:* “Here's the rule. Imagine the dune contains exactly **1 kg** of sand. The amount of sand between two cones *is* the probability that the car is between them. Height of the dune means nothing alone. Amount of sand — area — is everything.”
- *Interaction (inside the text):* drag the cones; counter updates live. Drag them to cover everything → “1.000 — all the sand. The car is *somewhere*.”
- *Formula moment:*
  `P(a < x < b) = ∫ₐᵇ p(x) dx`, with `p(x) ≥ 0` and `∫ p(x) dx = 1`
  - **∫ₐᵇ … dx** — hover: the sand between the cones lights up. “The integral sign is a stretched S — for *Sum*. It means: add up thin strips of sand from a to b.”
  - **p(x) ≥ 0** — “no negative sand”.
  - **∫ p dx = 1** — “all the sand together is 1 kg. This is called *normalised*.”

**Step 2.4 — worked example you can do by hand**
- *On screen:* The dune melts into a perfectly flat strip of sand from 90 m to 110 m (“radar only says: somewhere between 90 and 110”).
- *Narration:* “Spread 1 kg evenly over 20 metres. How high is it?”
  - height = 1 ÷ 20 = **0.05 per metre**
  - between 95 and 100: width 5 × height 0.05 = **0.25** → 25 %
- *Interaction:* cones snap to 95 and 100, counter shows 0.250. “Physics works!”

**Step 2.5 — the trap**
- *On screen:* All the sand is squeezed into half a metre: the pile shoots up to height 2.
- *Narration:* “Can a density be bigger than 1? Watch: squeeze the same 1 kg into half a metre. The pile must be 2 per metre tall, or the sand wouldn't fit. So yes. Only the *area* is limited to 1, never the height.”
- *Check:* “Car is spread evenly between 0 and 4 m. Height of p(x)?” → 0.25.
- *Forward link:* “Every p(…) on the lecture slides is a dune like this. Every ∫ … dx is ‘add up the sand’.”

---

## SCENE 3 — “One number please: the balance point”
**Goal:** expectation, and the danger of the mean (PDAF foreshadowing).

**Step 3.1**
- *On screen:* The dune sits on a long thin **wooden beam** laid along the road. A triangular **pivot** under the beam slides until the beam balances, wobbling and settling.
- *Narration:* “Your boss doesn't want a dune. She wants one number. The most common choice: put the dune on a beam and find where it balances. That point is the **expectation**, or mean.”

**Step 3.2 — the die, by hand**
- *Inline mini-visual:* six equal weights at 1…6 on a ruler; pivot settles at 3.5.
- “Each value times its probability, added: 1·⅙ + 2·⅙ + … + 6·⅙ = 3.5. You can never roll 3.5, but it's where the ruler balances.”
- *Formula:* `𝔼[x] = ∫ x p(x) dx` — hover: “each position x, weighted by its sand.” Also `𝔼[g(x)] = ∫ g(x) p(x) dx` for “anything you compute from the state” (the lecture calls g an *observable*).

**Step 3.3 — the two garages (Lewin moment)**
- *On screen:* Two garages beside the road at 90 m and 110 m. The radar is confused: half the sand piles at each garage. Nothing in between.
- *Predict:* “Where does the beam balance? And is the car ever there?”
- *Reveal:* pivot settles at **100 m**, in the empty road between the garages. A ghost car appears at 100 m and is stamped **IMPOSSIBLE**. “The mean is 100 m — the one place the car never is.”
- *Interaction:* slider shifts sand between the garages; pivot follows.
- *Forward link:* “Remember this picture. In Chapter 8, the PDAF filter squeezes two bumps into their mean, and the lecture's punchline is ‘multimodality is lost’. This is exactly what that means. MHT keeps both garages.”
- *Check:* car at 0 m with 0.8, at 10 m with 0.2 → mean 2 m.

---

## SCENE 4 — “How sure? Spread, variance, σ”
**Goal:** variance and standard deviation, the 68–95–99.7 rule.

**Step 4.1 — two radars**
- *On screen:* Split screen, two identical roads. Left: a shiny precision radar. Right: a rusty cheap radar. Both fire 50 times at the parked car (100 m). Left pins cluster within ±2 m; right pins scatter ±20 m.
- *Narration:* “Both radars are right *on average*: their means are both 100 m. But would you trust them equally? We need a second number: how spread out.”

**Step 4.2 — building the variance from scratch**
- *On screen:* For 5 pins, a **rubber band** stretches from the mean to each pin; its length squared is drawn as a little square standing on the road.
- *Narration:* “For each possible position, measure how far it is from the mean. Square it, so left and right both count positive, and big misses count a lot. Average those squares: that's the **variance**. Take the square root to get back to metres: the **standard deviation**, σ — the ‘typical miss’.”
- *Formula:* `𝕍[x] = 𝔼[(x − x̄)²] = σ²`, `σ = √𝕍[x]`, symbols hovered one by one.
- *Worked:* two garages at 90 and 110: both 10 m from the mean → squares 100 → variance 100 m² → σ = 10 m.

**Step 4.3 — 68 – 95 – 99.7**
- *On screen:* The dune becomes a bell. Painted bands on the road: ±1σ (dark gold), ±2σ, ±3σ, with percentages floating above.
- *Predict:* “Belief: 100 m, σ = 5 m. How often is the car more than 10 m away?” → “10 m = 2σ, 95 % inside, so about 5 %.”
- *Interaction:* σ slider; the bell flattens as it widens (“1 kg of sand has to go somewhere”).
- *Forward link:* “Kalman's matrix P is this variance, grown up. Gating in Chapter 6 asks ‘is this pin more than 3σ away?’”

---

## SCENE 5 — “Two unknowns: where AND how fast”
**Goal:** joint distribution, first as a 2×2 table.

**Step 5.1 — a speedometer appears**
- *On screen:* The speedometer pops above the car. Narration: “Real trackers want two things: position *and* speed, because speed tells you where the car will be next.”

**Step 5.2 — the parking-lot experiment**
- *On screen:* Top-down view of the road. 100 cars all start at 0 m together. After 5 seconds, they're spread out. Each car is coloured by its speed (slow = teal, fast = orange). Two zones painted: NEAR (0–100 m) and FAR (100–200 m).
- *Narration:* “Let 100 cars leave a parking lot at the same moment. Five seconds later, sort them into a table: near or far, slow or fast.”
- *Table animation:* cars fly from the road into a 2×2 grid of boxes on a game board, stacking as **3D bars**:

|      | slow | fast |
|------|------|------|
| near | 30   | 10   |
| far  | 15   | 45   |

  → divided by 100 → **0.30, 0.10, 0.15, 0.45** (sum = 1 ✓).
- *Predict:* “Is a far car more likely slow or fast?” → fast (0.45 vs 0.15). “Of course: fast cars *got* far. Position and speed are linked — **correlated**. This link is the engine of tracking.”
- *Formula:* `p(x, y)` — “the comma means AND”. `Σ Σ p(x,y) = 1`.
- *Check:* p(near, fast) = 0.10.

**Step 5.3 — from table to landscape**
- *On screen:* The 2×2 bars split into 4×4, 8×8, 32×32, 128×128 — each time the bars get thinner and the board turns into a smooth **golden landscape**, a tilted ridge. Axes: position (along road), speed (sideways).
- *Narration:* “Ask finer questions — 10 m bins, 1 km/h bins — and the bars melt into a landscape. Height = joint density. Volume under a patch = probability. And look: it's a **tilted ridge**. That tilt *is* the correlation.”
- *Formula:* covariance and correlation ρ, explained as “does ‘more x’ come with ‘more y’?”
- *Interaction:* ρ slider tilts the ridge; σx, σy stretch it. Orange contour lines on the floor = equal-height lines “like on a hiking map — for this shape always ellipses”.
- *Forward link:* “In Kalman, the matrix P holds exactly these: variances on the diagonal, covariance off the diagonal. Tilted ellipse = correlated position and velocity.”

---

## SCENE 6 — “Marginal: I only care about position”
**Step 6.1 — table version**
- *On screen:* In each row of the 3D bars, the slow and fast bars **slide together and stack**. Their new heights glow: near 0.40, far 0.60.
- *Narration:* “You only care where the car is, not how fast. So for each position, add up all speeds: 0.30 + 0.10 = 0.40, 0.15 + 0.45 = 0.60. That's the **marginal**.”

**Step 6.2 — landscape version: the bulldozer**
- *On screen:* A bulldozer blade sweeps the landscape sideways (along the speed axis) and pushes all the sand against the far wall. What piles up against the wall is a green curve: p(position).
- *Formula:* `p(x) = ∫ p(x, y) dy = ∫ p(x | y) p(y) dy` — “the lecture calls the second form ‘Enter y!’”
- *Forward link (big):* “This exact move IS the prediction step of every tracker. To guess where the car will be next second, you consider every place it could be now and sum — bulldoze — over them. Chapter 2 calls it the Chapman–Kolmogorov equation. It's just a marginal.”
- *Check:* p(fast) = 0.55.

---

## SCENE 7 — “Conditional: a policeman gives you a tip”
**Step 7.1 — table version**
- *On screen:* A police car flashes blue lights: “The car is FAST.” The SLOW column of bars **shatters and falls away**. The two remaining bars (0.10, 0.45) then **grow** until they add up to 1: 0.18 and 0.82.
- *Narration:* “Throw out everything that contradicts the tip. What's left only adds up to 0.55, so stretch it by 1/0.55 to make it a full probability again.”
- *Formula:* `p(x | y) = p(x, y) / p(y)` — “the bar | means *given*”.

**Step 7.2 — landscape version: the knife**
- *On screen:* A glowing red knife-plane cuts the landscape at the reported speed. The cut edge lifts out as a curve, then stretches upward (rescale) into a blue curve with area 1.
- *Interaction:* drag the knife along the speed axis; the slice's peak moves (because of the tilt). Set ρ = 0 → the slice never moves: “no correlation → the tip tells you nothing about position”.
- *Trap:* “p(far | fast) = 0.82 but p(fast | far) = 0.75. Not the same! Mixing them up is the #1 mistake in probability — and Bayes' rule exists to fix it.”
- *Check:* p(slow | near) = 0.30 / 0.40 = 0.75.

---

## SCENE 8 — “Bayes: the radar beeps” (the heart of the chapter)
**Step 8.1 — four lampposts**
- *On screen:* The road has 4 lampposts at 100, 110, 120, 130 m. Above each, a **green column** = our prior belief: 0.1, 0.4, 0.4, 0.1. “Yesterday's traffic says the car is usually near the middle two.”

**Step 8.2 — the beep**
- *On screen:* Radar pulse, red pin lands at **125 m**. From the pin, a soft **red bell** spreads along the road (σ = 10 m), and red columns rise at each lamppost: the likelihood (0.04, 0.32, 0.88, 0.88).
- *Narration:* “For each lamppost ask: *if the car were really here, how plausible is a reading of 125?* That's the **likelihood**. The radar knows how it makes mistakes — that's exactly what it can tell us.”

**Step 8.3 — multiply**
- *On screen:* The green and red columns at each lamppost **merge** into a gold column of height green × red: 0.004, 0.130, 0.353, 0.088.
- *Predict:* “120 m and 130 m have the same likelihood. Which will win?” → 120, because the prior favoured it 4:1.

**Step 8.4 — rescale**
- *On screen:* The gold columns only add to 0.576. They all grow by the same factor (×1/0.576) and turn blue: **0.008, 0.226, 0.613, 0.153**.
- *Narration:* “Rescale so they sum to 1. That's the **posterior**: what we believe after the beep. 61 % it's at 120 m.”
- *Worked table:* full numbers, calculator-checkable.
- *Derivation (step by step):* write the joint two ways → divide → denominator is a marginal (sum of gold).
- *Formula:* `p(x|z) = p(z|x) p(x) / ∫ p(z|x) p(x) dx` — prior (green), likelihood (red), posterior (blue), normaliser (gold).
- *Interaction:* drag the pin along the road; change radar quality. Bad radar (σ = 40 m) → red bell almost flat → posterior ≈ prior. Great radar (σ = 3 m) → posterior jumps to the nearest lamppost.

**Step 8.5 — the same thing, continuous**
- *On screen:* Lampposts multiply into 1000 → the columns become a smooth green dune (prior), a red bell (likelihood), and their product, a blue dune (posterior), sitting between them, narrower than both.
- *Narration:* “Infinite lampposts: same story. The new belief sits between what we expected and what the radar said — closer to whichever is more certain — and it's *narrower than either*. Combining information always sharpens.”
- *Forward link:* “This is the filtering step of every tracker in the course. In Chapter 3, with bells, this multiplication becomes three lines: the Kalman update.”
- *Check:* why can we drop constants like 1/√(2πσ²)? (they cancel in the rescale).

---

## SCENE 9 — “The bell, in two dimensions”
**Goal:** 2D Gaussian, covariance ellipse, Mahalanobis distance.

**Step 9.1**
- *On screen:* Camera rises to a top-down view. Now the car can be anywhere on a wide car park (x and y). The radar measures **range** (distance) well but **angle** badly: the ghost cloud around the pin is a long thin ellipse lying *across* the radar beam.
- *Narration:* “Radars are good at distance, bad at angle. So the uncertainty isn't round — it's a long ellipse, stretched sideways.”

**Step 9.2 — Mahalanobis (Lewin moment)**
- *On screen:* Two suspicious pins appear, each **30 m** from the expected position: one along the beam (range direction), one sideways.
- *Predict:* “Which of the two is more suspicious?”
- *Reveal:* along the beam, σ = 10 m → 3σ → very suspicious (maybe a different car!). Sideways, σ = 50 m → 0.6σ → totally normal. “Same 30 m on a ruler, completely different meaning. We need a distance measured in σ's, direction by direction. That's the **Mahalanobis distance**, the orange part of the formula.”
- *Formula:* `𝒩(x; x̄, P) = |2πP|^(-1/2) exp(-½ (x−x̄)ᵀ P⁻¹ (x−x̄))`, each piece hover-linked to the ellipse.
- *3D:* the bell rises out of the car park as a hill, with 1σ/2σ/3σ rings on the ground.
- *Forward link:* “Gating (Ch 6) = ‘ignore pins outside the 3σ ellipse’.”

---

## SCENE 10 — “Let the ghost cars drive” (Kalman prediction, previewed)
**Step 10.1**
- *On screen:* 200 ghost cars, each with its own random position (± 5 m) and speed (± 2 m/s). A phase-space board appears beside the road: each ghost is a dot (position →, speed ↑), forming a round cloud.
- *Predict:* “Each ghost drives for 1 second at its own speed. What shape does the cloud on the board become?”
- *Reveal (press DRIVE):* ghosts drive; fast ones go further. On the board the cloud **shears** into a tilted ellipse. “Position and speed just became correlated — and the position got *less certain*, because we weren't sure of the speed.”
- *Formula:* `y = A x`, `A = [[1, Δt],[0, 1]]`; `𝒩(x̄, X) → 𝒩(A x̄, A X Aᵀ)`.
- *Worked:* X = diag(25, 4), Δt = 1 → A X Aᵀ = [[29, 4],[4, 4]]: position σ 5 → 5.4 m.
- *Interaction:* Δt slider; DRIVE replays.
- *Forward link:* “This is half of the Kalman filter. Chapter 3: P_k|k−1 = F P Fᵀ + D. Here F is A, and D adds the driver's random pedal pushes.”

---

## SCENE 11 — “Lights on: certainty”
- *On screen:* Headlights come back on. The car is perfectly visible. The sand dune squeezes into an infinitely thin, tall needle at the car.
- *Narration:* “If we knew exactly, all the sand piles on one point: a needle of zero width and infinite height. It's called the **Dirac delta**. Integrating anything against it just picks out one value — a trick you'll use in the χ² derivation (Ch 6).”

---

## FINALE — “What you now know”
- *On screen:* Camera pulls back over the whole road; each scene's object lights up in turn (sand dune, beam, two radars, 3D bars, bulldozer, knife, lampposts, ellipse, sheared cloud) with its one-line rule.
- One-page summary table (rule · formula · plain words · where it comes back).
- **Explain it back:** 7 exam-style questions, answered out loud first, then a model answer and the examiner's likely follow-up.

---

## UI / UX redesign (applies to every chapter)
1. **Scroll story, not paging.** The 3D world is pinned on the left (60 %); the story scrolls on the right (40 %). When a step scrolls into view, the world animates to it. Scrolling back replays in reverse. (The Pudding / scrollytelling pattern.)
2. **One world, one canvas.** The road, car and radar persist; scenes add or remove props. The camera glides between shots instead of jumping.
3. **Controls live inside the sentence that explains them.** No separate control panel.
4. **Hover-linked formulas.** Hover a symbol → its object glows in 3D; hover the object → the symbol glows.
5. **Typography.** One serif reading font for the story (comfortable for long reading), a clean sans for the UI, comfortable line length (~65 characters), generous spacing. Fewer boxes and borders — the current UI has too many.
6. **A thin progress rail** shows where you are in the chapter (scene names), clickable.
7. **Reduced motion** setting respected; everything also works by clicking Next.
