# Working on Puli's Portfolio

This is Nuthan Puli's interactive portfolio. Write his name as "Puli" in conversation and "Nuthan Puli" on the site.

## Before you change anything

1. Read `docs/WORKLOG.md`. It is the shared memory between chats: what was built, what was decided, what Puli liked or rejected, and what is still open.
2. After finishing a change, add an entry at the top of the "Log" section of `docs/WORKLOG.md` (date, what changed, why, anything left unfinished), and update its "Open items" list. Commit it together with the change. A future chat only knows what this file tells it.

## How the site is put together

The main page is one continuous scroll that a single camera follows:

1. Mt. Kailash intro above the clouds: the 3D mountain centred at golden hour (moonlit at night) with snow blowing off the summit and crests, a giant "BEYOND" behind the summit, and a glass card, labels and a 01–04 index (`#hud`).
2. Into the clouds: "Puli's Portfolio" and the short intro.
3. Below the clouds: the Selected Work section (HTML over the sky).
4. Only after Selected Work has scrolled fully off-screen, the jetpack malfunctions.
5. Puli falls through the rainforest canopy, bounces off vines and branches, and lands face-down.
6. He gets up, a closing card offers "Get in touch", and the endless forest runner game starts on tap or Space.

The contact page (`contact.html`) is a separate page: a photographic jungle with real depth, a hummingbird by day and a glowing betta fish by night.

## Files

| Path | What it is | How it's edited |
|---|---|---|
| `site/` → `v2/` | The redesign (see `docs/REDESIGN.md`): a React + Vite app in `site/` (`src/sections/` one file per section, `src/components/` incl. `reactbits/` copied from React Bits with its licence and `originkit/` (the Moonlit Petals tree; Originkit licence allows it in this open-source portfolio, but never republish it on its own), `anatomy/` (the MIT Anatomy kit, github.com/wheresryan22/anatomy, used by the card figures in `src/figures/`; its full skill with references and examples can be cloned from GitHub when making new figures), `src/styles/tokens.css` = palette/type/spacing/motion/buttons (colours: Charcoal day, Moss night; all saved palettes in `docs/PALETTES.md` and `src/palettes.js`, previewable with `?day=<id>&night=<id>`), `src/assets/`; section 5's 3D Puli is `src/puli/stage.js` (three.js 0.169.0, loaded only near section 5; the model is `src/assets/puli/puli.glb`; `?puli-debug` exposes `window.__puliStage` for headless tests); section 6, `src/sections/Forest.jsx`, runs the old forest and runner game from `../src/puli3d.js` (with options, see its header) on its own canvas, with voxel Puli hidden and the blocky Puli drawn by the stage (`renderForest`, shared through `src/puli/shared.js`)). `npm run build` in `site/` writes the static site into `v2/` (committed; GitHub Pages serves it at `/v2/` until it replaces the old page). The tiger logo is Puli's own image, `site/src/assets/tiger-logo.webp` (trimmed, 300 px tall, transparent), also the tab icon | Edit `site/src`, then `cd site && npm install && npm run build`; never edit `v2/` by hand |
| `index.html` | Main page (old v1, to be replaced by `v2/`): WebGL1 ray-marched clouds and mountain, Selected Work, and an inlined copy of `src/puli3d.js` | Edit HTML/CSS/scene code directly. For the character, forest or game, edit `src/puli3d.js`, then run `python3 tools/inline_puli3d.py` |
| `src/puli3d.js` | Voxel Puli (built from the pixel character sheet), birds and laser, moss forest, fall choreography, runner game; also imported by the redesign's section 6 | Source of truth for that code; after editing run `python3 tools/inline_puli3d.py` (old page) and rebuild `site/` (v2) |
| `contact.html` | Built contact page | Never edit by hand; build it from the source |
| `src/contact.src.html` | Contact page source, with `__IMPORTMAP__`, `__FISH_YAW__` and `__BIRD_YAW__` placeholders | Edit this, then run `python3 tools/build_contact.py` (writes `contact.html`); `python3 tools/build_contact.py local` writes `contact.test.html` that loads three.js from `./node_modules` for offline tests |
| `assets/` | Kailash height and snow maps (main page), and contact assets: forest photos and depth maps, glTF models and textures | Model buffers are named `.wasm` and glTF files `.json` only so that static hosts serve them; they are ordinary glTF data |
| `src/character-sheet.html` | The 2D pixel character sheet (front, back, side) the voxel model is built from | Reference |
| `tools/` | `inline_puli3d.py`, `build_contact.py`, and `bake_kailash.py` (+ `bake_kailash.js`), which bakes `assets/kailash-h.webp` and `assets/kailash-s.webp` for the sharp mountain layer | `python3 tools/bake_kailash.py` (needs node, numpy, Pillow) |

The contact page loads three.js 0.169.0 from cdn.jsdelivr.net. The main page uses no libraries.

## Key behaviour (don't break these)

- **Character:** blocky near-square head with cube-pixel features; black trimmed beard level with the lips, joined by sideburns up to the hair; black eyes; lighter skin. Black hoodie by day, white at night. Olive cargos, black round watch, white high-tops with a charcoal collar and no logos. Laser bolt: gold by day, purple at night.
- **Sky:** Puli flies with a jetpack, aims at the pointer, and shoots birds on click; shot birds are banked as extra lives for the game.
- **Fall:** canopy from above, through the leaves, onto two sagging vines that stretch hard and snap, flips onto two thin branches, a final vine, then face-down. The jetpack breaks off in stages. The camera stays wide.
- **Game:** endless 2.5D runner with rising difficulty and a best score stored as `puli-best` in localStorage. The camera is sized to the screen shape so Puli stays visible on portrait phones. During the game the landing scene's trees slide back off the running lane.
- **Night mode:** darker forest with bioluminescent moss, ferns and mushrooms; obstacles get a glowing outline; birds become glowing moths; owls get amber eyes.
- **Contact page:** depth-mapped photo parallax. The hummingbird follows the cursor or finger with a critically damped spring and only turns around after moving the other way for a moment (an earlier version flipped sides constantly and looked like a rendering glitch). The betta keeps its head locked on the cursor (small corrections are instant, big turns are slow and eased, curling its body), then swims forward along its heading and stops with the tip of its mouth on the cursor. It swims with its whole body on a 12-joint spine and bends sideways and up/down instead of tilting rigidly; a cursor on its own body makes it hold still rather than spin.

## Credits are required

The 3D models are CC BY 4.0 and must stay credited on the contact page and in the README. If you swap or add a model, update both.

## Testing

- Serve the folder over HTTP (`python3 -m http.server 8000`); `file://` breaks the contact page's `fetch` calls.
- Headless Chromium with SwiftShader works but runs the full main page at well under 1 fps. Test pieces in isolation, step frames by hand with a fixed time step, and look at screenshots. The contact page has debug hooks: `window.__manual = true` stops the animation loop, `window.__fixedDt = 1/30` fixes the time step, and `__dbg.frame()` renders one frame.
- Puli's main device is a Redmi Note 14 Pro 5G running Brave in portrait. Check phone-portrait layouts first.

## Shared preview

The working version is also published as a Claude artifact: https://claude.ai/artifact/4DbHHJTdXxiKAiBsiMisLW. The repo and that page don't sync automatically; if you update one, say whether the other still needs updating.

## Commits

Commit only what you changed, with a message saying what and why.
