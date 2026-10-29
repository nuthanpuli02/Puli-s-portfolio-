# Plan: the new forest, the green-grid landing, the game (agreed 2026-10-27; Phases 1-2 done 2026-10-28, Phase 3 2026-10-29)

Read `CLAUDE.md` and `docs/WORKLOG.md` first. Nothing below is built yet; Puli asked to pause here and continue later.
Talk to Puli in plain, step-by-step terms; he tests on his Redmi Note 14 Pro 5G (Brave, portrait). Merge every change into
`main` straight away so he can test it at https://nuthanpuli02.github.io/Puli-s-portfolio-/.

## Where things stand

- Section 5 (`site/src/sections/Teaser.jsx`, `site/src/puli/stage.js`) is done and approved: moonwalk in, dance, Play at
  the bottom, Puli latches on mid-air, is carried off the top, slips off, falls back in, the page follows him down.
- Section 6 (`site/src/sections/Forest.jsx`) still runs the **old forest and game** from `src/puli3d.js` (WebGL1) on its
  own canvas, with voxel Puli hidden and the blocky Puli drawn over it by the stage (`renderForest`). The Running Jump
  plays properly (fixed 2026-10-26). This whole forest is what the plan below replaces.

## What Puli decided

1. **Green-grid landing ("matrix loading").** As he falls into the forest the screen is black; the scene appears as a
   clean **neon green grid on black** (Tron-like surface grid lines, no falling code), drawn in as he falls past the
   objects. **Only Puli stays fully textured**, so he stands out. When he lands face-down, the impact sends a **shockwave
   ring out from the landing spot**; behind the ring the grid turns into the real textured forest, finishing while he
   gets up. Classic green (#00FF41-ish) on black, **the same by day and night**; after the reveal the forest shows in the
   site's day or night look.
2. **Rebuild the forest and the game** with more realistic textures and cleaner objects (not polish the old code).
3. **Reuse the section 3 blossom tree** (`site/src/components/originkit/moonlitPetals.js`) by taking it apart:
   - its branch-growth rule (`buildTree` / `grow`: split in two, curve upwards a little each step, seeded random), ported
     to 3D with round branches, tuned to rainforest shapes (tall trunks, high canopy) → the forest's trees;
   - its flower clumps → green leaf clusters (instanced leaf cards);
   - its falling petals (with pointer push) → green falling leaves during the fall and in the game;
   - its warp sway → wind sway for leaves and vines (in the vertex shader);
   - the whole tree baked flat → far background layers in the game (the game camera is mostly side-on);
   - bokeh → night fireflies; haze, grain, vignette → mood.
   Licence: Originkit allows use and changes inside this open-source portfolio, never republishing it on its own as a
   component, snippet or template. Keep the Originkit header in every file derived from it.

Notes from the discussion:
- The **Anatomy** kit can't build the forest: it draws flat isometric SVG pictures (the project-card figures), no 3D.
- Weight: the grid phase is lighter than the textured forest (no moss shells, fog or lighting); the 2-3 s reveal draws
  both; the game costs about the same. The grid phase also hides the first-frame stutter of setting the scene up.
- Poly Haven (and other asset sites) are blocked from the cloud session; Puli downloads textures on his computer and adds
  them to the repo, as he did for Kailash.

## Phases

**Phase 1: look test** (a private preview page, not on the site):
- one 3D tree grown with the blossom tree's rule, green leaf clumps, green falling leaves, a patch of ground, a vine, a
  log and a rock, realistic textures, day and night;
- the same patch in the green grid look, with the shockwave reveal spreading from one point;
- Puli checks it on his phone; agree the look before building everything.

**Phase 2 (done 2026-10-28, see below and the WORKLOG): the new forest and the fall with the grid**, in three.js inside the stage's scene (one WebGL canvas instead of
two, real depth between Puli and leaves/vines, PBR materials, the grid as one material patch on every forest material via
`onBeforeCompile`):
- same layout and fall as now (canopy; two vines that stretch and snap; two branches; last vine; face-down), ported from
  `fallPath`/`FALL`/`mkVines` in `src/puli3d.js`;
- black screen → grid builds as he falls → landing shockwave → textures take over while he gets up → "Tap to run";
- goes live in place of the current fall.

**Phase 3 (done 2026-10-29, see the WORKLOG): the game in the new forest**: port the runner's rules unchanged from `src/puli3d.js` (`stepGame`, `spawn`,
`newGame`, `hurt`, `groundAt`: speeds, jump/double jump, slide, gaps, logs, rocks, stumps, low branches, owls, pickups,
3 lives, score, `puli-best`), the HUD/caption/Back up; obstacles rebuilt with the new objects; night mode (glowing moss,
ferns, mushrooms, amber-eyed owls). Then remove the old forest from v2 (`src/puli3d.js` stays only for the old page).

**Phase 4: phone pass**: smoothness on phone sizes; a lighter setting for slow phones (fewer leaves/moss, smaller
textures); reduced motion = a short fade instead of the grid sequence.

## Decided with Puli (2026-10-27, second talk)

1. **Objects: all built in code** (blossom-tree parts, trunks, roots, vines, rocks, logs, stumps) and dressed in Poly Haven
   textures. **No downloaded models in the game** (Puli: too heavy).
2. **No laser.** The vine walls go; in their place, low obstacles he **slides under** (hanging vines/low branches) and
   things to jump over. Remove the laser button and the laser from the new game.
3. **Textures:** Puli downloads them (1K, JPG: colour, normal GL, roughness, AO where offered) into
   "Puli portfolio cloud images/forest textures" on his computer; list sent in chat 2026-10-27 (bark, mossy bark or
   moss, forest floor with leaves, mossy rock, plain rock, muddy ground). Names were given from memory (Poly Haven is
   blocked here): he picks the closest match if one doesn't exist. Leaves are drawn in code (leaf cards), no texture.
   Done 2026-10-27: 7 sets in `site/src/assets/forest/` (see its README; 6.3 MB, load only with the forest). Puli
   swapped bark_willow for tree_bark_03 and uses bark_brown_02 for both plain and mossy trunks. Next: Phase 1.

## Changed with Puli (2026-10-27/28, after the Phase 1 look test)

- The grid does not draw in during the fall. **Black screen, he falls straight in (no canopy, vines or branches); the
  impact sends shockwave 1, which spreads across the floor and climbs the trees, drawing everything as the green grid;
  as he gets up, shockwave 2 comes from beneath him and brings in the textures, and the fog thickens with it.**
- The forest is **the old page's moss forest** (its layout and its moss shells), rebuilt in three.js, plus grass, bushes,
  ferns, flowers in four colours. No blossom-tree trees after all. Prototype with sliders: `tools/forest-moss/`.
- Puli's numbers: moss length 0.090, 6 layers, layer shift 0.5, grass 0.18 at 50%, fog 0.8x, both shockwaves 3.5 s.
- Phase 2 went live **without a game** (Puli's choice): after he gets up he stands there and a "Back up" button shows.
  Phase 3 brings the runner back in the new forest.
