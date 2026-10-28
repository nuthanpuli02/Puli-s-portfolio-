# Working on Puli's Portfolio

This is Nuthan Puli's interactive portfolio. Write his name as "Puli" in conversation and "Nuthan Puli" on the site.

## Before you change anything

1. Read `docs/WORKLOG.md`. It is the shared memory between chats: what was built, what was decided, what Puli liked or rejected, and what is still open.
2. After finishing a change, add an entry at the top of the "Log" section of `docs/WORKLOG.md` (date, what changed, why, anything left unfinished), and update its "Open items" list. Commit it together with the change. A future chat only knows what this file tells it.

## How the site is put together

A React + Vite app in `site/`, built into the repo root and served by GitHub Pages at
https://nuthanpuli02.github.io/Puli-s-portfolio-/ (the old `/v2/` address redirects there). One page that you scroll,
section by section, plus a separate contact page:

1. **Hero** (`site/src/sections/Hero.jsx`): React Bits Waves reacting to the pointer, a bare ridge with its overgrown
   version shown through a soft spotlight that follows the finger or cursor, a big "NUTHAN" (React Bits FoldText),
   clouds rising from the bottom into section 2.
2. **Into the clouds** (`Clouds.jsx`): the clouds pass, "Puli's Portfolio" (ShinyText) and the intro lines (TextType)
   appear, then the scene pans sideways into section 3.
3. **Projects** (`Work.jsx`, data in `src/data/projects.js`): the blossom tree (Originkit Moonlit Petals), a
   DepthCarousel of project cards with Anatomy-kit figures, scroll-driven.
4. (Section 04 is the contact page, `contact.html`, opened from the menu.)
5. **Game teaser** (`Teaser.jsx` + `src/puli/stage.js`): the blocky 3D Puli moonwalks in with the scroll and dances; the
   button dodges (Catch me -> Nope -> Alright, alright -> Play), Play takes off as a FlyingButton, Puli latches onto it,
   is carried off the top, slips and falls; the page follows him down.
6. **Forest** (`Forest.jsx` + `src/forest/world.js`, drawn by the same stage): he falls on through the dark (camera
   holds, tilts down as he falls away, then rushes after him into the landing view), lands face-down on a black floor,
   shockwave 1 draws the moss forest as a neon green grid, shockwave 2 (as he gets up) brings in the textures and the
   fog. Then he stands there with a "Back up" button. The runner game comes back in Phase 3 of `docs/PLAN-FOREST.md`.

The contact page is a photographic jungle with real depth, a hummingbird by day and a glowing betta fish by night.

## Files

| Path | What it is | How it's edited |
|---|---|---|
| `site/src/` | The site's source: `sections/` (one file per section), `components/` (incl. `reactbits/` copied from React Bits with its licence, `originkit/` the Moonlit Petals tree: Originkit's licence allows it in this open-source portfolio, never republish it on its own; `anatomy/` the MIT Anatomy kit, github.com/wheresryan22/anatomy, for the card figures in `src/figures/`), `styles/tokens.css` (palette, type, spacing, motion, buttons; Charcoal by day, Moss by night; saved palettes in `docs/PALETTES.md` and `src/palettes.js`, preview with `?day=<id>&night=<id>`), `puli/stage.js` (the 3D Puli and the forest's camera and landing; three.js 0.169.0, loaded only near section 5; model `src/assets/puli/puli.glb`), `forest/world.js` (the forest, built in code, Puli's Poly Haven textures in `src/assets/forest/`), `assets/` | Edit here, then `cd site && npm install && npm run build` |
| `index.html`, `app/` | The built site (written by `npm run build`; committed so GitHub Pages serves it) | Never edit by hand; rebuild |
| `v2/index.html` | Redirect from the old `/v2/` address to the root | Leave as is |
| `contact.html` | The built contact page | Never edit by hand; build it from the source |
| `src/contact.src.html` | Contact page source, with `__IMPORTMAP__`, `__FISH_YAW__` and `__BIRD_YAW__` placeholders | Edit this, then `python3 tools/build_contact.py` (writes `contact.html`); `python3 tools/build_contact.py local` writes `contact.test.html` that loads three.js from `./node_modules` for offline tests |
| `assets/` | Contact-page assets: forest photos and depth maps, glTF models and textures | Model buffers are named `.wasm` and glTF files `.json` only so that static hosts serve them; they are ordinary glTF data |
| `src/puli3d.js` | The old site's forest runner game (voxel Puli, moss forest, fall, game). Not used by the site; kept only as the reference for Phase 3 (porting its game rules) | Read only; delete after Phase 3 |
| `tools/` | `build_contact.py`; `gen_cloudbank.py` (section 2's cloud bank image); `forest-moss/` (the forest prototype with tweak sliders Puli tuned), `forest-look/` (the first look test); `texture_bake/` (rebuilds Puli's 3D model from the raw files on his PC; see its README) | |
| `docs/` | `WORKLOG.md` (shared memory), `PLAN-FOREST.md` (forest and game phases), `REDESIGN.md` (the redesign's original plan and decisions), `PALETTES.md` | |

The contact page loads three.js 0.169.0 from cdn.jsdelivr.net.

## Key behaviour (don't break these)

- **Puli (3D):** the blocky Tripo model made from Puli's picture (skin darkened a little at his request), 14 Mixamo
  clips (idle, walk, moonwalk, dance, jump, grab, hang, fallloop, fall, getup, run, runjump, slide). Raw Mixamo files
  stay on his PC, never in the repo. Credit Tripo on the page and in the README.
- **Section 5:** moonwalk in behind the button, hard cut into the dance's own moonwalk (moonwalk 0.40 s = dance 7.57 s),
  turn to face the viewer during the dance's spin; one label per dodge, the button springs back to the centre on phones;
  he latches onto the button's right end from the side.
- **Forest:** Puli's numbers from the prototype: moss length 0.090, 6 layers, layer shift 0.5, grass 0.18 at 50%, fog
  0.8x, both shockwaves 3.5 s; flowers in four colours that load in with shockwave 2. The moss's strands sit on two
  crooked grids with clumps and smoothing with distance (a single grid showed lines). Loading starts after the dance,
  shaders are compiled and textures uploaded in the background.
- **Game (Phase 3):** endless runner, 3 lives, best score `puli-best` in localStorage, no laser (slide under, jump over),
  obstacles built in code (no downloaded models).
- **Contact page:** depth-mapped photo parallax. The hummingbird follows the cursor or finger with a critically damped
  spring and only turns around after moving the other way for a moment (an earlier version flipped sides constantly).
  The betta keeps its head locked on the cursor (small corrections instant, big turns slow and eased, curling its body),
  swims forward and stops with its mouth on the cursor; it swims on a 12-joint spine and holds still when the cursor is
  on its own body.

## Credits are required

The contact page's 3D models and Puli's model are CC BY 4.0 and must stay credited on the page and in the README. If you
swap or add a model, update both. React Bits (MIT + Commons Clause), Originkit and Anatomy are credited in the README.

## Testing

- Serve the repo root over HTTP (`python3 -m http.server 8000`); `file://` breaks the `fetch` calls.
- Headless Chromium with SwiftShader works but is slow. `?puli-debug` exposes `window.__puliStage` (state, camera,
  `startForest()`), `window.__stageDt` (fixed frame time), `window.__forestStart(skip)`, and shows a readout of the
  sequence's phases and any long frames (Puli can screenshot it on his phone). The contact page has `window.__manual`,
  `window.__fixedDt` and `__dbg.frame()`.
- Puli's main device is a Redmi Note 14 Pro 5G running Brave in portrait. Check phone-portrait layouts first; on it the
  screen gets taller than `100svh` when the address bar hides (use `lvh` for full-screen sections).

## Commits

Commit only what you changed, with a message saying what and why. Push to `main` so Puli can test on his phone.
