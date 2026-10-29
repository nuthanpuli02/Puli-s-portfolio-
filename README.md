# Puli's Portfolio

The interactive portfolio of Nuthan Puli: https://nuthanpuli02.github.io/Puli-s-portfolio-/

One scrolling page: a hero with a spotlit ridge and folding name under a starfield, a descent into the clouds, the projects around a
blossom tree, a game teaser where a 3D Puli moonwalks in, rides a flying button and falls into a moss forest that loads
in with two shockwaves (the runner game is being rebuilt there). A separate contact page has a photographic 3D forest
with a hummingbird by day and a glowing betta fish by night.

## Build and run

The site is a React + Vite app in `site/`, built into the repo root (`index.html` + `app/`):

```
cd site && npm install && npm run build
cd .. && python3 -m http.server 8000
```

Then open http://localhost:8000. Opening the files directly from disk won't work (the 3D models load with `fetch`).

## Layout

| Path | What it is |
|---|---|
| `site/src/` | The site's source (sections, components, the 3D stage and the forest) |
| `index.html`, `app/` | The built site |
| `contact.html` | The contact page (built from `src/contact.src.html` with `python3 tools/build_contact.py`) |
| `assets/` | Contact-page assets: forest photos and depth maps, 3D models and textures |
| `src/puli3d.js` | The old site's runner game, kept as the reference for rebuilding it |
| `tools/` | Build and asset tools, and the forest prototypes |
| `CLAUDE.md`, `docs/` | Working guide, shared change log and plans for anyone (or any chat) picking the project up |

Binary model buffers use a `.wasm` file name and glTF files use `.json`, only so that static hosts serve them with a known file type. They are ordinary glTF buffers and JSON.

## Credits

3D models, both licensed under [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) and adapted (reduced textures, new materials, motion blending):

- "[Hummingbird – Rigged, 6 Animations (Open Bill)](https://sketchfab.com/3d-models/hummingbird-rigged-6-animations-open-bill-d9b448ac1025485e843d54bebf35390a)" by [Animal Animator](https://sketchfab.com/animalanimator)
- "[Betta Splendens](https://sketchfab.com/3d-models/betta-splendens-f4eeb7f50ad24873842bd954ad27d23b)" by [BlueMesh](https://sketchfab.com/VapTor)

The contact-page forest images were generated with Gemini, and their depth maps were made with Depth Anything V2. The site uses thirteen components from [React Bits](https://reactbits.dev) by David Haz (Galaxy, FoldText, CircularText, ShinyText, TextType, DepthCarousel, BlurText, PixelCard, StaggeredMenu, DodgeField, FlyingButton, and on the loading screen Crystalized Ball and Count Up; MIT + Commons Clause, licence kept in `site/src/components/reactbits/`). Its blossom tree is a modified copy of [Moonlit Petals](https://www.originkit.dev/components/moonlit-petals) from [Originkit](https://www.originkit.dev), used under their [licensing terms](https://www.originkit.dev/docs/licensing) (`site/src/components/originkit/`). The animated machine figures on the project cards are drawn with the [Anatomy](https://github.com/wheresryan22/anatomy) kit by Ryan (MIT, `site/src/components/anatomy/`). The 3D character in section 5 was made with [Tripo](https://www.tripo3d.ai) (CC BY 4.0) from Puli's own picture and animated with Mixamo animations (the raw Mixamo files are not in this repository). The forest's textures are CC0 sets from [Poly Haven](https://polyhaven.com) (bark_brown_02, tree_bark_03, forrest_ground_01, mossy_rock, rock_boulder_dry; no attribution required). Fonts are served from Google Fonts.

© Nuthan Puli. Code and design in this repository are the author's own unless credited above.
