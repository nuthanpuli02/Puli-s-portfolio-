# Worklog: shared memory for every chat

Read this before working. After a change, add a dated entry at the top of **Log** and update **Open items**. Keep entries short and factual: what changed, why, and what Puli said about it.

## Puli's preferences for this project

- Wants it to look professional, photoreal and premium; the portfolio is for recruiters, labs and clients, so project copy should sound technical.
- Gives feedback bluntly ("nope, not good"). Fix the root cause rather than tuning numbers around a bug; when unsure what he means, ask one short question.
- Can't spend money on assets. Use free CC BY / CC0 models and credit them.
- Main test device: Redmi Note 14 Pro 5G, Brave, portrait.
- Explanations: simple steps, in plain words, cause then effect.

## Open items

- **Betta swim (contact page, night):** still not convincing to Puli. The latest attempt (2026-10-20) drives the betta's body with the guppy's recorded swim wave and shows the fish three-quarters on so the bend is visible; he hasn't reviewed it yet. If it's still rejected, the planned next step is true skeletal retargeting: find the betta's spine bone chain (53 joints) and rotate each spine bone with the guppy's spine rotations, so the fins follow the rig instead of being moved per vertex. Don't add lag or extra swing to the fins; he called that "morphing".
- **Hummingbird (contact page, day):** now the animated "Hummingbird – Rigged, 6 Animations" model, blending hover and forward flight by speed, lit from the forest photo. Waiting for his review on a phone.
- Mixamo animations (run, jump, falls, get-up, idle FBX files are on Puli's computer) to be mapped onto voxel Puli.
- Final quality pass: mountain, clouds, birds, vines and owls (proper models), rocky walls in the game's gaps, game physics feel, a proper fall animation for the gaps.
- Licensed fonts (a Creative Fabrica bundle; check that its licence allows web embedding). The site currently uses Google Fonts stand-ins.
- Optional: a public CV without birth date, phone or address, for a "Download CV" button.
- Hosting: GitHub Pages can serve this repo directly (Settings → Pages → main, root). A custom domain is still to decide.
- Puli's computer has a `_claude_work` folder inside "Puli portfolio cloud images" from file transfers; it can be deleted.

## Log

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
