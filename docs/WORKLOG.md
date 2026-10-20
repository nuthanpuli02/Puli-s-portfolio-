# Worklog: shared memory for every chat

Read this before working. After a change, add a dated entry at the top of **Log** and update **Open items**. Keep entries short and factual: what changed, why, and what Puli said about it.

## Puli's preferences for this project

- Wants it to look professional, photoreal and premium; the portfolio is for recruiters, labs and clients, so project copy should sound technical.
- Gives feedback bluntly ("nope, not good"). Fix the root cause rather than tuning numbers around a bug; when unsure what he means, ask one short question.
- Can't spend money on assets. Use free CC BY / CC0 models and credit them.
- Main test device: Redmi Note 14 Pro 5G, Brave, portrait.
- Explanations: simple steps, in plain words, cause then effect.

## Open items

- **Phone check of the contact page:** the betta's rig has about 248 bones on its body mesh; check the night page stays smooth on Puli's Redmi (Brave, portrait). If it stutters, reduce `TAIL_RAYS`/`TAIL_SEGS` first. Tuning knobs for the betta are at the top of its section in `src/contact.src.html`.
- Mixamo animations (run, jump, falls, get-up, idle FBX files are on Puli's computer) to be mapped onto voxel Puli.
- Final quality pass: mountain, clouds, birds, vines and owls (proper models), rocky walls in the game's gaps, game physics feel, a proper fall animation for the gaps.
- Licensed fonts (a Creative Fabrica bundle; check that its licence allows web embedding). The site currently uses Google Fonts stand-ins.
- Optional: a public CV without birth date, phone or address, for a "Download CV" button.
- Hosting: GitHub Pages can serve this repo directly (Settings → Pages → main, root). A custom domain is still to decide.
- Puli's computer has a `_claude_work` folder inside "Puli portfolio cloud images" from file transfers; it can be deleted.

## Log

### 2026-10-20: merged the contact-page work into main; credits tidied
- Puli confirmed the hummingbird colours and the betta's swim are fixed. The work from branch `claude/eager-lovelace-ub440d` was fast-forwarded into `main`.
- The betta no longer uses the guppy's recorded swim (it now swims through its own rebuilt skeleton), so `assets/swim-wave.json` was deleted and the "Guppie Animated" credit removed from the contact page and README. Two models remain credited: the hummingbird (Animal Animator) and the betta (BlueMesh).
- The shared preview https://claude.ai/artifact/4DbHHJTdXxiKAiBsiMisLW was updated to the same contact page. A second preview made by the other chat (https://claude.ai/artifact/6jWDc71EVjRXDLV3HF4qKs) may now be behind; use the first one.

### 2026-10-20: hummingbird haze 4%
- Puli turned the bird's haze down from 8% to 6%, then to 4%: `BIRD_HAZE` 0.04. Preview artifact updated to match.

### 2026-10-20: a little haze on the hummingbird
- Puli asked for just a little haze on the bird.
- The plumage keeps `fog:false` and gets its own haze instead: the final colour is mixed `BIRD_HAZE` 0.08 toward the scene's fog colour (`BIRD_HAZE_U`, updated each frame).
- The mix is done in display brightness (gamma 2.2), not linear light. Mixing in linear light lifts dark colours a lot to the eye, which is why three's own fog looked milky even when weak.
- Same-frame comparison at 0 / 8% / 15%: 8% is a subtle softening; 15% is already clearly paler.
- Testing note: screenshots taken before the loading overlay finishes fading look pale; hide `#loading` in headless tests before comparing colours.
- Preview artifact updated to match.

### 2026-10-20: hummingbird sheen, shimmer and reflections back
- Puli asked to add back the rest of the removed effects except the fog. Restored: sheen 0.25 (pale green), iridescence 0.35, full environment reflections, `BIRD_GLOW` 0.9. Kept: `fog:false`, `BIRD_SAT` 1.6, contrast 1.15, lift 1.3.
- Checked headless: colours stay rich, with the sheen and shimmer on top.
- Preview artifact updated to match.

### 2026-10-20: hummingbird saturation to 60%
- Puli asked to turn the saturation down to 60%. Taken as +60% over the original texture (it was +75%): `BIRD_SAT` 1.75 → 1.6. If he meant 60% of the previous level, that would be about 1.05.
- Preview artifact updated to match.

### 2026-10-20: hummingbird without the pale film
- Puli: the bird still looked like it had a pale white filter on it; saturate more.
- Tested each likely cause by switching it off. The biggest was the bright photo's reflections (environment); sheen and iridescence added a milky layer, and fog a little.
- Plumage now:
  - no sheen
  - iridescence 0.15 (was 0.35)
  - `envMapIntensity` 0.35
  - `fog:false`
  - saturation `BIRD_SAT` 1.75, mid-tone contrast `BIRD_CONTRAST` 1.15 (pow), lift `BIRD_BRIGHT` 1.3
  - forest-colour glow `BIRD_GLOW` 0.6
- Checked headless at three spots: vivid greens, deep red throat, golden tones, no milky look.
- Preview artifact updated to match.

### 2026-10-20: hummingbird colours match the forest
- Puli: the hummingbird's colours don't match the background; make it brighter to match the forest's colour gradient.
- Before: flat, greyish feathers under cool light, looking pasted onto the warm green and golden photo.
- Feathers: the plumage texture is pushed away from grey (`BIRD_SAT` 1.35) and lifted (`BIRD_BRIGHT` 1.2) in the shader.
- Local forest colour: the day photo is shrunk to a 48×27 grid at load (`forestGrid`). Each frame the colour behind the bird is sampled (`forestAt`, 5×5 average, using the background's crop and 1.22× overfill) and eased onto the feathers as emissive light (`BIRD_GLOW` 0.9, emissive map = feather texture). It glows golden in the sun shafts and greener by the ferns, and fades out toward night.
- Checked headless at three spots: warmer, brighter, more saturated, with olive-gold tones that sit in the photo.
- Preview artifact updated to match.

### 2026-10-20: fish bends up and down; everything wavier
- Puli: moving the cursor up or down rotated the whole fish rigidly; it should bend up or down (in fact in any direction). He also wanted the body, tail and fins much wavier.
- Up/down: only `PITCH_BODY` 0.5 of the tilt now turns the whole fish. The rest (`lift`) is bent in by the spine: Spine0 lifts the head and the remaining joints bring the tail back toward level, so the head still points at the cursor. A second lag spring (`SW.tailEl`, same `TAIL_K`/`TAIL_DAMP` as turns) makes the tail trail behind changes in tilt, curling the body up or down (`PITCH_CURL` 0.6 × the turn curl spread). Combined with the sideways curl, the body bends in any direction. `swimFish` now also takes `el`. Mouth stop measured at 2-4 px.
- Wavier:
  - body: `BODY_AMP` [0.09, 0.24], `BODY_WAVELEN` 0.5
  - tail: `TAIL_WAVE` [0.03, 0.46], `TAIL_TWIST` 0.5
  - top, bottom and belly fins: bone ripple `FIN_RIP` up about 35%
  - fin skin ripple: `FIN_WAVE` 0.055 (applies to all fins with skin ripple)
  - pectoral fanning: 0.42
- Checked headless: aiming up and down bends the body; swimming, top-down and turn views intact.
- Preview artifact updated to match.

### 2026-10-20: tail fin far wavier at its end than near the body
- Puli: the end of the tail must be much wavier than the part near the body.
- Bone waves: height now grows with (joint position)^`TAIL_EDGE` 1.8 instead of linearly; `TAIL_WAVE` [0.02, 0.36] (base, extra at the end). The twist (`TAIL_TWIST` 0.4) and the in-surface ripple follow the same curve.
- Membrane ripple on the tail: strength × (0.2 + 1.1 × (distance/0.45)^1.5), with `CAUDAL_WAVE` 1.2.
- Checked headless: from above the base of the tail stays calm and the end ripples strongly; from the side the outer edge is wavy.
- Preview artifact updated to match.

### 2026-10-20: tail fin fan 13 × 14
- Puli: add a lot more bones to the tail fin so it moves wavy like the top and bottom fins.
- `TAIL_RAYS` 13 × `TAIL_SEGS` 14 (182 bones plus `TailBase`).
- Waves retuned for the shorter joints so they're smaller and more numerous, about 3-4 along the fin like the top and bottom fins: `TAIL_WAVE` [0.08, 0.2], `TAIL_STEP` 1.55, `TAIL_SLANT` 0.35, `TAIL_TWIST` 0.26, in-surface ripple 0.05. `TAIL_CURL` scaled to 0.03 per joint so turns are unchanged.
- The BODY mesh now has about 248 bones. Checked headless: side, top and turn views intact. Phone frame rate still unchecked.
- Preview artifact updated to match.

### 2026-10-20: whole-body swimming on a 12-joint spine
- Puli: make the fish swim with its whole body, not just the tail; more bones are fine if they make it smoother.
- `rebase()` (at load, after levelling) rewrites every vertex to its current rest position and sets every bone's inverse to cancel its current pose. The rest pose becomes the bind pose, so any vertex can move onto any bone without shifting. The rest pose was compared before and after: identical.
- `buildBodyRig()` replaces the model's 4-joint spine (Bone, Bone.002-.005) with `BODY_JOINTS` 12 joints (`Spine0-11`), from 18% behind the mouth to the base of the tail. Body skin moves onto the two nearest joints. Every bone that hung from the old spine, and the head (`Bone.006`), now hangs from the nearest new joint through a socket that copies its old parent's rest pose, so the model's clip values still apply. The tail fan (`TailBase`) hangs from `Spine11`. The BODY mesh now has 147 bones and EYES 65.
- Motion: one wave travels the whole body (`BODY_WAVELEN` 0.55; `BODY_AMP` 0.07 to 0.18 rad per joint from front to back). `BALANCE` 0.6: from the wave's offsets the front is turned and shifted against the tail, as a real fish recoils. Measured while cruising: mouth ±0.018, smallest just behind the head, rising to ±0.033 at the base of the tail and ±0.15 at the tail-fin tip. The turn curl is spread over the joints, growing toward the tail (`BODY_CURL` 2.0), with the head leading. The old `SPINE_AMP`, `SPINE_BEND` and `RECOIL` are gone; dorsal and anal fins take their body phase from the same wave.
- Fixed a bug from the previous change: the gliding path also lagged the speed, so the fish coasted past and stopped with its centre (not its mouth) on the cursor. Now only the direction glides (`C.dir`); measured stop is back to 1-2 px, and the turn arc still keeps its speed.
- Preview artifact updated to match.

### 2026-10-20: tail fin much wavier
- Puli: the tail fin still looked like a static image flapping around; it should wave, bend and ripple a lot more while swimming.
- Denser rig: `TAIL_RAYS` 9 × `TAIL_SEGS` 9 (82 new bones; the mesh now has 135).
- Bigger, more frequent waves: `TAIL_WAVE` [0.12, 0.3] (was [0.06, 0.16]), `TAIL_STEP` 1.6 (about 2.3 waves along the fin), `TAIL_SLANT` 0.5, `TAIL_TWIST` 0.4, `TAIL_HZ` 1.6 + 1.0×speed.
- New in-surface ripple: joints crowd and spread within the fin, `0.08*f` toward the edge.
- `TAIL_CURL` scaled to 0.047 per joint, so the total turn curl is unchanged with the extra joints.
- Membrane `CAUDAL_WAVE` back up to 1.6.
- Checked headless: from the side the fan folds and catches the light; from above several S-waves run along it; turns still form one arc. Not checked: frame rate on his phone with 135 bones.
- Preview artifact updated to match.

### 2026-10-20: tail fin re-rigged with 42 new bones
- Puli: add more bones to the tail fin, let them twist in any direction (not just left/right), make body and tail bend as one in turns, and show real ripples while swimming, like a flag in the wind.
- `buildTailRig()` runs at load, after levelling:
  - It adds a fan of `TAIL_RAYS` 7 × `TAIL_SEGS` 6 bones (plus a `TailBase`) under `Bone.005`, spread to match the fin's own angle range and length.
  - Every vertex weighted to the old tail bones (`OLD_TAIL`, now unused) moves onto the two nearest rays × two nearest joints. Vertices in front of the tail base go to `TailBase`.
  - The new bones' inverses cancel their rest pose, so each moved vertex's position and normal are rewritten as `bindMatrix⁻¹ ×` its current place; the mesh doesn't move at rest (checked).
  - The mesh is re-bound to a new Skeleton (96 bones).
- Each tail joint now:
  - swings sideways with a flag wave (`TAIL_WAVE` 0.06 at the base + 0.16 toward the edge; `TAIL_STEP` 1.9 rad per joint outward and `TAIL_SLANT` 0.6 per ray across, so the waves run out and slant across the fan; plus a ×1.7 second wave)
  - twists about its own ray (`TAIL_TWIST`)
  - opens and closes the fan
  - carries the body's own wave on into the tail
- In turns the flapping calms down (up to 60%) and every tail joint adds `TAIL_CURL` 0.07 × the turn's curl, so body and tail curve as one arc. 0.12 folded the tail back on itself.
- The tail's membrane shader ripple is reduced (`CAUDAL_WAVE` 0.8), since the bones now carry the big waves. The old caudal entry is gone from `RIG`, so no bone-ripple code drives the old tail bones any more.
- Checked headless: rest pose unchanged; while swimming the tail shows travelling, slanted waves from above and changes shape strongly from the side; in turns body and tail form one smooth arc.
- Preview artifact updated to match.

### 2026-10-20: tail fin bends more; turns are a continuous arc
- Puli: the top and bottom fins look perfect. The tail fin should bend more. When the cursor jumps to the other side mid-swim, the fish stopped dead, turned its head, then its body, which looked unnatural; it should keep moving so the turn is clean and smooth.
- Tail fin: bone sway `A*(0.18+0.1*d)` (was 0.12+0.06*d), curl share 0.2 (was 0.08), bone ripple ×1.5, and membrane waves ×`CAUDAL_WAVE` 1.6.
- Turns: speed used to be multiplied by aim³ and braked instantly, so it dropped to zero as soon as the fish faced away. Now it keeps `TURN_KEEP` 0.4 of its speed plus 0.6×aim², and eases speed changes, braking instantly only on the stopping curve. While turning the stopping distance is the straight mouth-to-cursor distance; once it faces the cursor it is measured along the heading, so it still can't overshoot. Velocity glides toward the heading (rate 4/s) instead of snapping.
- Measured at phone size with the cursor flipped mid-swim at full speed: speed stays at 0.55 or more through the turn, the fish swims a U-shaped arc, speeds up again and stops with its mouth on the cursor.
- Preview artifact updated to match.

### 2026-10-20: fin membranes ripple with several waves
- Puli: the fins weren't wavy enough; they should bend far more than the body, with several waves visible on the tail fin while swimming.
- Bones can't do that: each fin ray has only 2-3 bones, so at most one bend. The fin membranes now also ripple in the vertex shader, before skinning, so the ripple rides along with every bone bend and turn. `finMembranes()` computes per-vertex data once at load:
  - strength: skin weight on caudal, dorsal, anal and ventral bones, fading in away from the body; pectorals are left to their bones
  - distance from the body's centre line
  - a phase offset per fin and across the fin
  - the mesh-space "sideways" and "outward" directions, from the per-vertex skinning Jacobian
- Waves (`FIN_WAVELEN` 0.11, about three across the tail fin; height `FIN_WAVE` 0.04 at the edge) travel outward at 1.6-2.8 per second and grow with speed. A smaller in-plane component makes the edges scallop. Normals tilt with the waves, so light bands show the ripples even side-on.
- Bone ripple amplitudes (`FIN_RIP`) are also up by about 50%.
- Note: the earlier rejected "morphing" was per-vertex lag on the whole fish driven by the guppy wave. This version leaves the body to the bones and only ripples the fin membranes; watch for his reaction.
- Checked headless from the side and from above: several waves on the tail, dorsal and anal fins, no tearing.
- Preview artifact updated to match.

### 2026-10-20: each fin ripples on its own
- Puli liked the body bend ("bends like a real fish"). Next he wanted the fins to bend and move in small waves while swimming, each fin individually.
- `RIG` now lists each fin separately (caudal, dorsal, anal, left and right ventral, left and right pectoral), with rays side by side. Each fin has its own oscillator (`FIN_HZ`: caudal 1.25, dorsal 1.75, anal 1.55, ventral about 1.05, pectoral about 2.6 beats a second; left and right differ by about ±4.5% so paired fins drift in and out of step). Along a fin, each joint toward the tip and each ray across the fin lags the one before it, so ripples run through the fin. A slower second wave (×1.61) keeps it from repeating exactly. Amplitudes grow toward the tips (`FIN_RIP`), and the fins flow more when swimming faster.
- Extra in-plane motion: the tail fan opens and closes, the dorsal and anal fins ripple backward and forward along their base, and the pectorals row up and down while fanning.
- Paired fins start on the body's centre line, so left/right is judged from where each bone ends.
- Checked headless from the side and from above: the fins move independently and nothing tears.
- Preview artifact updated to match.

### 2026-10-20: betta levelled, head locked on the cursor, mouth stops on it
- Puli: the fish pointed a bit up by default; it should always point at the cursor with no delay; the body should bend a lot more; turning should be slow and fluid; then it should swim quickly until the tip of its mouth touches the cursor, and stop.
- Nose-up: the model's body is tilted about 17° nose-up. At load the fish is now levelled (mouth tip and base of the tail at the same height) inside a new `lvl` group. The pivot moved to the body axis, 40% back from the mouth; `fish.snout` is the pivot-to-mouth distance.
- Pointing: `turnRate` replaces the spring. Small errors close almost instantly (`TURN_SNAP`); big turns speed up gently (`TURN_ACC`), glide at up to `FISH_TURN` 2.2 rad/s and ease out by a braking curve, with no overshoot. Measured: 0° heading error while swimming; a 180° turn-around takes about 1.5 s. The same controller drives the up/down tilt (up to 80°).
- Swimming: up to 1.0 units/s once facing the cursor. Speed comes from a stopping curve (`BRAKE`) on how far the mouth still is from the cursor along the heading, so it can't overshoot; measured stop is 1-2 px from the cursor on phone and desktop sizes.
- More bend: `SPINE_AMP` 0.19 to 0.6, `RECOIL` 0.06; turn curl `SPINE_BEND` sums to 2.0 with `TAIL_K` 6, so the body curls past 90° in a turn-around. Checked headless: no tearing.
- The video Puli mentioned still hasn't arrived.
- Preview artifact updated to match.

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
