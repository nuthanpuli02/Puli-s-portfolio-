# Handoff: section 5 (game teaser), continue from here

Written 2026-10-25 for a new Claude Code session. Read `CLAUDE.md`, then `docs/WORKLOG.md` (top of Log and the
"Section 5" open item), then this file. Talk to Puli in simple, step-by-step terms; he wants blunt feedback and tests on
his Redmi Note 14 Pro 5G (Brave, portrait) first.

## Progress (2026-10-26)

Puli's phone test changed the sequence (see the Log in WORKLOG for details): the button glides to the bottom of the
screen as Play after "Alright, alright"; Play launches it; Puli steps under it, jumps and latches on as it hovers, is
carried up, lets go, and the page follows his fall into **section 6** (`site/src/sections/Forest.jsx`), which runs the
old forest fall and runner game from `src/puli3d.js` with voxel Puli. Steps 4-6 of the plan below are superseded by
this. Next: the blocky model in the forest fall and the game.

## Progress (2026-10-25, second session)

Steps 1-5 and 7 of the plan below are done, and step 6 up to the landing: `site/src/puli/stage.js` (the three.js stage,
the moves ported from movetest.html) is wired into `Teaser.jsx`. He moonwalks in with the scroll, cuts into the dance,
faces the viewer; on the catch the button glides into his hands, he is carried off the top, drops back in from the top
onto his own spot, lands face-down, gets up, and the button returns for another go (scroll is held from the catch until
he is up). Still open: **the forest and the game start** (ask Puli how the forest should appear), the "Tap to play" hint,
and Puli's verdict on his phone. Notes for whoever continues:
- Layout: his height in px is `V.px` (min of: button-to-section-bottom / 0.8, 46% of the screen, and what fits on the
  right of the button with his arms); feet 0.8 heights below the button's resting centre. The dance only carries him
  ~0.36 to the right (measured at load: `DANCE_RUN`), and its spin steps him ~0.36 towards the camera.
- The smoke's flat cut is now hidden by a mask on the smoke canvas (`app.css`), not fixed in FlyingButton.
- Headless test scripts used: scroll to the bottom with `?puli-debug`, poll `__puli.S.phase`, tap the pill 4 times.


- **Live:** `site/src/sections/Teaser.jsx` (section 5, id `game`). Copy at the top; a React Bits **DodgeField** button
  (`site/src/components/reactbits/DodgeField.jsx`, modified, see its header) that dodges the mouse, hops on touch taps,
  labels **Catch me -> Nope -> Alright, alright -> Play** (one per dodge, patience 3), springs back to the middle when it
  gives up. Tapping **Play** swaps it for a React Bits **FlyingButton** (`FlyingButton.jsx`, modified: `exit`, `onExit`,
  `autoLaunch`, `startX`, `interactive={false}`, `onFrame`) that takes off with thrusters/smoke and leaves through the
  top of the screen. Puli approved the labels and centring (2026-10-25).
- **Temporary in Teaser.jsx:** after the button leaves, it comes back 2.6 s later (`useEffect` on `gone`). Remove that
  once Puli's fall and the game are wired in.
- **Character model, now in the repo:** `site/src/assets/puli/puli.glb` (1.45 MB, meshopt + webp texture). Needs
  three.js `GLTFLoader` + `MeshoptDecoder` (`three/examples/jsm/libs/meshopt_decoder.module.js`). three.js is **not** a
  dependency of `site/` yet: `npm i three@0.169.0` (same version as the contact page).
  - Scale: 1 unit = his height (about 1.0 tall), faces +z, 25-bone Mixamo skeleton (`mixamorigHips` etc.).
  - Clips: `idle` (9.9 s), `walk`, `moonwalk` (1.02 s loop), `dance` (17.2 s, **keeps its own root motion**), `jump`,
    `grab` (Idle To Braced Hang, keeps root motion), `hang`, `fallloop` (Falling Idle, 4.5 s loop), `fall` (Falling Flat
    Impact: lands face-down, keeps root motion), `getup` (trimmed at 5.3 s, keeps root motion), `run`, `runjump`, `slide`.
    Sideways/forward hips drift was removed from the others (the page moves him).
  - Set `frustumCulled = false` on the mesh (root motion moves it away from its bind-pose bounds).
  - Raw Mixamo FBX files are on Puli's PC only; never commit them (Mixamo licence). The combined model is fine.
  - Rebuild tools (need the FBX files): `tools/texture_bake/blocky/anim/` (README in `tools/texture_bake/`).
- **Reference implementation of the whole sequence:** `tools/texture_bake/blocky/anim/movetest.html` (also published as
  https://claude.ai/artifact/5CeKdPZfKJuZx3DMVuPVo7). Port its logic; Puli approved this sequence.

## The agreed sequence (from movetest.html)

1. **Entrance (scroll-synced):** Puli moonwalks in from the left, side-on (`rotation.y = -PI/2`, i.e. facing left while
   sliding right), passing **behind** the button. Move him at `MW_SPEED = 0.46` units/s (matches the clip; feet don't
   slide).
2. **Into the dance with no visible cut:** moonwalk at 0.40 s and the dance at 7.57 s are the same pose (the dance has
   its own moonwalk from 6.6 to 9.2 s). Switch with a hard cut (`fade 0`, dance time = 7.57), keeping his hips where they
   are (`keepHips()` in movetest: read hips world position, change, `mixer.update(0)`, shift `puli.position` x/z by the
   difference). Trigger the cut when the moonwalk is at phase 0.40 s (`MW_LEAD = 0.40 + 3 * 1.0167`).
3. **Turn to face the viewer during the dance's spin:** dance time 9.2-10.4 s, ease `rotation.y` from -PI/2 to 0,
   pivoting on the hips (`keepHips` each frame). Then the rest of the dance (it drifts him ~0.36 left and back).
   Layout used in the test (camera distance 4.4, FOV 30, looking at y 0.5): cut at x -0.48, button at x -0.55; he ends
   the moonwalk clear of the button on its right. On the site the button is HTML, so convert with the camera (see below).
4. **Catching the button** (visitor's job, DodgeField `onCatch`): Puli turns side-on (`rotation.y` 0 -> -PI/2, 0.6 s),
   plays `grab`; the button meets his hands at the top of the jump and he **hangs from its right end** (Puli's request:
   from the side, not front/back). In movetest: `GRAB_HANDS` = mid-point of `mixamorigLeftHand`/`RightHand` at the end
   of `grab`, measured once at load with a throwaway mixer; button centre = hands + `BTN_GRIP (-0.15, 0.02, -0.03)`.
5. **Carried off:** play `hang`; the FlyingButton climbs (`exit`), Puli follows it. On the site, drive Puli from the
   FlyingButton's `onFrame({x, y, th, w, h, phase, W, H})` (craft centre in px inside its box) so his hands stay on the
   pill's right end: convert px to world with the camera (unproject at his depth). Its box top is the top of the screen.
6. **Pause off-screen, then fall:** `fallloop` from above the top of the screen down into the forest; at the ground
   `fall` (face-down landing), then `getup`, then `idle` blending into the game start.
7. **Game start:** default (Puli hasn't answered): wait for tap/Space with a "Tap to play" hint. The old runner game is
   in `src/puli3d.js` (voxel Puli); the new character will replace that one later (Puli also wants the forest and game
   upgraded).

Hold page scrolling during steps 4-6 (from the catch to the landing), and release it afterwards.

## Step-by-step plan for the next session

1. `cd site && npm install && npm i three@0.169.0`. Confirm `npm run build` works before changing anything.
2. Create `site/src/components/Puli3D.jsx` (or `src/puli/stage.js`): a three.js canvas behind the button in
   `.teaser__stage` (absolute, `inset:0`, `pointer-events:none`, z-index below `.teaser__flight`). Renderer with
   `alpha:true`, pixel ratio capped at 1.5, `outputColorSpace = SRGBColorSpace`; hemisphere + directional light in the
   theme (day/night from the `theme` prop; Charcoal day, Moss night tokens in `src/styles/tokens.css`); a soft radial
   shadow under his hips (as in movetest). Start the render loop only while the section is on screen
   (IntersectionObserver), stop it otherwise. Load `assets/puli/puli.glb` with `GLTFLoader().setMeshoptDecoder(...)`
   (Vite: `import url from '../assets/puli/puli.glb?url'`).
3. Port `play()`, `keepHips()`, `hipsWorld()`, `handsWorld()`, `grabTarget()` and the phases from movetest.html into
   a small state machine. Use `LoopOnce` + `clampWhenFinished` for `dance`, `grab`, `fall`, `getup`.
4. **Scroll sync for the entrance** (Puli's original ask: "when we fully scroll into this section he walks in"): map the
   section's scroll progress to the moonwalk (time and x) until the cut, then let the dance play on its own clock. If
   the visitor scrolls back up before the cut, run the moonwalk backwards with the scroll. Make sure the button sits
   at the right world spot: project the DodgeField's centre into the 3D scene (raycast from the camera through the
   button's screen centre onto the plane z = button depth) so he passes behind it.
5. **Catch:** in `Teaser.jsx` `onCatch`, tell the Puli stage to start step 4; feed FlyingButton's `onFrame` to it for
   step 5. Remove the temporary 2.6 s reset.
6. **Fall and forest:** after the button is gone, a pause (~0.8 s), then the fall down the screen. Decide with Puli how
   the forest appears (the old page's moss forest in `src/puli3d.js` is WebGL1 code; simplest first step is a
   forest backdrop at the bottom of section 5 that the camera follows down to). Land face-down, get up, idle,
   "Tap to play".
7. Phone first: test at 393x852 portrait in headless Chromium (SwiftShader is slow; step frames by hand), then desktop.
   `prefers-reduced-motion`: skip the moonwalk/dance and the flight (FlyingButton already calls `onExit` at once).
8. Credits: the model came from Tripo (free tier, CC BY 4.0): add "3D character made with Tripo" to the site (footer
   or the contact page credits) and to `README.md` once it's on the page. Mixamo animations: no credit needed, but never
   commit the raw files.
9. After each change: `cd site && npm run build` (writes `v2/`, commit it), add a dated entry at the top of the Log in
   `docs/WORKLOG.md` and update its Open items, commit with a message saying what and why, push to `main` (GitHub
   Pages serves `/v2/`). If Pages skips a deploy, push an empty commit.

## Gotchas learned so far

- The test page model is served as `.wasm` only because Claude artifacts serve standard file types; on the site use
  the `.glb` directly.
- `FlyingButton` smoke is cut flat at its take-off line (its floor is the bottom of its box). Optional fix later.
- In headless tests the first touch right after `scrollIntoView` can be lost; wait ~1.5 s before tapping.
- DodgeField only dodges a fine pointer; on touch the hop logic in our copy does the dodging.
- Section badge (`SectionBadge.jsx`) already lists 05 "???" for this section; keep the game out of the menu (a surprise).
