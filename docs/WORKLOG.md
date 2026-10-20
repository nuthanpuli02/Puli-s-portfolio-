# Worklog: shared memory for every chat

Read this before working. After a change, add a dated entry at the top of **Log** and update **Open items**. Keep entries short and factual: what changed, why, and what Puli said about it.

## Puli's preferences for this project

- Wants it to look professional, photoreal and premium; the portfolio is for recruiters, labs and clients, so project copy should sound technical.
- Gives feedback bluntly ("nope, not good"). Fix the root cause rather than tuning numbers around a bug; when unsure what he means, ask one short question.
- Can't spend money on assets. Use free CC BY / CC0 models and credit them.
- Main test device: Redmi Note 14 Pro 5G, Brave, portrait.
- Explanations: simple steps, in plain words, cause then effect.

## Open items

- **Betta swim (contact page, night):** rebuilt on 2026-10-20 to run through the betta's own skeleton (see Log); given cursor-pointing steering after his third review; waiting for his next look via the preview https://claude.ai/artifact/6jWDc71EVjRXDLV3HF4qKs. If he likes it, delete `assets/swim-wave.json` (no longer loaded) and change the Guppie credit on the contact page and in the README, which still says the guppy's motion drives the betta. Tuning knobs are at the top of the betta section in `src/contact.src.html`: `SPINE_AMP` (body sway), `RECOIL` (head swing), `SPINE_BEND`/`TAIL_K`/`TAIL_DAMP`/`MAX_CURL` (turn curl), and the numbers in `swimFish`.
- **Hummingbird (contact page, day):** now the animated "Hummingbird – Rigged, 6 Animations" model, blending hover and forward flight by speed, lit from the forest photo. Waiting for his review on a phone.
- Mixamo animations (run, jump, falls, get-up, idle FBX files are on Puli's computer) to be mapped onto voxel Puli.
- Final quality pass: mountain, clouds, birds, vines and owls (proper models), rocky walls in the game's gaps, game physics feel, a proper fall animation for the gaps.
- Licensed fonts (a Creative Fabrica bundle; check that its licence allows web embedding). The site currently uses Google Fonts stand-ins.
- Optional: a public CV without birth date, phone or address, for a "Download CV" button.
- Hosting: GitHub Pages can serve this repo directly (Settings → Pages → main, root). A custom domain is still to decide.
- Puli's computer has a `_claude_work` folder inside "Puli portfolio cloud images" from file transfers; it can be deleted.

## Log

### 2026-10-20: betta points at the cursor and swims to it
- Puli: the fish always faced a fixed direction and slid sideways toward the cursor before flipping round, which looked unnatural. He wants it to point at where the cursor really is, turn smoothly to that side, then swim slowly toward it.
- The fish now has its own steering, `steerFish` in `src/contact.src.html`; the hummingbird's steering is unchanged. The fish turns its head toward the cursor (max 2 rad/s, eased; a reversal goes round through facing the viewer, never showing its back). It tilts up or down toward it. It swims forward along its heading only once it faces the cursor (speed scales with how well it is aimed), up to 0.6 units/s, and eases to a stop. Near the cursor (`ARRIVE`) it stops and only turns gently, so a cursor resting on it can't make it spin. Depth counts for less than left/right and up/down, and a soft pull keeps it near its swimming plane, so it doesn't swim into the screen. A target almost straight above or below is reached by tilting rather than swinging left and right. The swim beat also rises while it turns, as a real fish uses its tail to turn.
- Tuning: `FISH_SPEED`, `FISH_TURN`, `ARRIVE`, `FISH_PITCH`.
- Tested headless at phone size: a 180° reversal takes about 1.5 s with no sideways sliding, then it swims to the cursor and stops there. The sideways flip with a hold time (the old hysteresis rule) no longer applies to the fish; `CLAUDE.md` is updated.
- Preview artifact updated to match.

### 2026-10-20: betta slower, deeper bends
- Puli: turning and moving felt a bit quick; wanted the body to bend even more. He also wants to send a video of a real betta to copy its motion; it hasn't arrived yet.
- Slower: swim beat 0.65 to 1.55 per second (was 1.0 to 2.4), pectorals 2.0 to 2.6 per second, cruise loop slower (0.35 rad/s), steering spring softer (k 1.6) with top speed 0.6 (was 0.95), head turn max 2.8 rad/s (a full turn now takes about 1.3 s instead of 0.6 s).
- More bend: `SPINE_AMP` 0.14 to 0.45 (cruising: base of tail about ±7% of the snout-to-mid-tail length, tail fin about ±19%), `RECOIL` 0.05; turn curl now about 90° at its deepest (`SPINE_BEND` sums to 1.4, softer tail spring `TAIL_K` 8, `TAIL_DAMP` 0.45, `MAX_CURL` 1.8). Checked headless from above and at the page's camera angle; no pinching or tearing.
- Preview artifact updated to match.

### 2026-10-20: betta bends more and curls into its turns
- Puli, after viewing the preview: the body should bend a lot more, and the turn looked robotic (the fish rotated stiffly as one piece).
- Body wave about 1.6 times stronger (`SPINE_AMP` 0.11 to 0.35 rad per spine joint; when cruising the base of the tail swings about ±4% of body length and the tail fin about ±13%). Head recoil up to 0.045.
- Turns: the tail now follows the head's heading on an underdamped spring (`TAIL_K`, `TAIL_DAMP`); the difference between the two headings curls the spine into a C (`SPINE_BEND` spreads it from head to tail, capped at `MAX_CURL`), then the tail swings through and slightly past straight. The fish's head also turns faster (max 5 rad/s instead of 2.4). The hysteresis that stops it flipping sides is unchanged. The curl peaks at about 1.1 rad (63°) during a full turn.
- The private preview artifact https://claude.ai/artifact/6jWDc71EVjRXDLV3HF4qKs (contact page only, opens at night) is updated to match.

### 2026-10-20: betta swims with its own skeleton
- Puli: the body looked stiff and the fins didn't move smoothly. Cause: the guppy wave pushed every point of the mesh sideways by the same amount at each position along the body, so body and fins moved as one flat sheet; the betta's own fin animation was frozen on frame 0.
- Now the swim rotates the betta's bones (`swimFish` in `src/contact.src.html`). Bones were mapped by position: spine `Bone.002-005`, tail fin `020/025/026` and `039-045`, dorsal and anal `018-024` and `033-038`, long ventral fins `009/027-032`, pectorals `010-017`, gills `046-051`, head and mouth `006-008`.
- What it does: a slow wave down the spine that grows toward the tail (about ±2.6% of body length at the base of the tail and ±8% across the tail fin when cruising, more when fast); fin rays trail the body joint by joint; pectorals fan at about 3 beats a second, left and right alternating; the long fins stream back with speed; the body bends into turns; the head swings slightly against the tail. The model's own clip now plays underneath (gills, mouth, eyes, slow fin drift). Reduced motion turns the swim off.
- Gotcha: three.js's mixer only writes a bone when its clip value changes, so the code restores the last clip pose before each frame; without that the extra rotations pile up.
- The guppy swim wave is no longer used. Checked in headless Chromium (side, top-down and turning sequences, no tearing); not yet seen on a real phone.

### 2026-10-20: repo set up
- Pushed the whole project here. Added this worklog, `CLAUDE.md`, and `tools/inline_puli3d.py`; reworked `tools/build_contact.py` to run from the repo root.

### 2026-10-20: contact page
- New separate contact page (`contact.html`). The main page's Contact button and the "Get in touch" buttons link to it, passing `?theme=night|day`; the contact page passes it back.
- Background: Gemini-generated day and night images of the same jungle, plus Depth Anything V2 depth maps, turned into a 3D displaced surface with cursor or tilt parallax. Night adds pulsing bioluminescence, fireflies and bloom. The creatures are lit from the photo itself (as an environment map), with a backlight to match the sun shafts and a little of the forest haze.
- Layout from his references: big "CONTACT" title (he asked to replace the scattered floating letters), intro text, an "Email me" button, then his details (email, LinkedIn, GitHub, Messina) in the same column (he asked to move them out of the bottom bar). Thin frame lines from the night reference; "Back to the sky" button at the bottom right; CC BY credits.
- Hummingbird history: a static realistic model with hand-made wing joints flickered, then a rigged model replaced it. The flicker turned out to be the steering code: near the cursor the creature overshot, turned round, and kept flipping sides many times a second. Fixed with a critically damped spring and hysteresis on turning.
- Betta history: procedural sine waves were rejected as glitchy. The betta's rig rests with the snout along +z (now rotated to -x); this had been bending the fish along the wrong axis. Now driven by the guppy's swim wave sampled from its animation (`assets/swim-wave.json`: 32 positions along the body × 64 time samples, about 1 beat per second).

### 2026-10-19: Selected Work section
- "Now building": thesis (a self-optimising vulnerability detector: a CodeBERT/RoBERTa classifier on Big-Vul inside a three-agent train, test and discuss loop, benchmarked against Optuna, with a dashboard that flags vulnerable functions and suggests fixes) and Project Artha (an autonomous trading research system focused on loss minimisation, built to his professors' software-engineering standards, with a monitoring dashboard; no real money, private code). Both are marked in progress and not yet evaluated by his professors.
- "Finished projects", from his CV: DEICMS, the SQL vs NoSQL benchmark, Papa's Pizzeria, churn prediction, emotion classification, and the Mastercard phishing job simulation. He asked for technical wording.

### 2026-10-19: forest game
- Obstacles: log, rock, stump, branch, bird, snapping vine, bounce mushroom, laser-cut vine wall (with a "Fire laser" button), rolling boulder, diving owl, gap, collapsing log bridge, thorn patch, firefly wall, jetpack-piece hover, and a night-only shadow creature.
- Difficulty ramps slowly (he found the first version too fast). The camera is sized to the screen shape so Puli stays visible on portrait phones. Fog is measured from the running lane so obstacles don't vanish.
