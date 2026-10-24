# Puli's Portfolio

The interactive portfolio of Nuthan Puli. A single continuous descent: from Mt. Kailash, through the clouds, past the Selected Work section, until the jetpack fails and voxel Puli falls through the rainforest canopy into an endless forest runner game. A separate contact page has a photographic 3D forest with a hummingbird by day and a glowing betta fish by night.

Everything is plain HTML, CSS and JavaScript (WebGL1 for the main page, three.js for the contact page). There is no build step to run the site.

## Run it locally

Any static file server works, for example:

```
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening the files directly from disk won't work, because the contact page loads its 3D models with `fetch`.

## Layout

| Path | What it is |
|---|---|
| `index.html` | The main page: ray-marched sky and clouds, voxel Puli, the fall, and the forest game (the `src/puli3d.js` module is inlined into it) |
| `contact.html` | The contact page (built from `src/contact.src.html`) |
| `assets/` | Contact-page assets: forest photos and depth maps, 3D models and textures |
| `src/puli3d.js` | Voxel character, birds, moss forest, fall choreography and the runner game |
| `src/contact.src.html` | Source of the contact page, with placeholders for the import map |
| `src/character-sheet.html` | The 2D character sheet the voxel model is built from |
| `tools/build_contact.py` | Builds `contact.html` from the source: `python3 tools/build_contact.py` |
| `tools/inline_puli3d.py` | Copies `src/puli3d.js` into `index.html` after edits: `python3 tools/inline_puli3d.py` |
| `CLAUDE.md`, `docs/WORKLOG.md` | Working guide and shared change log for anyone (or any chat) picking the project up |

Binary model buffers use a `.wasm` file name and glTF files use `.json`, only so that static hosts serve them with a known file type. They are ordinary glTF buffers and JSON.

## Credits

3D models, both licensed under [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) and adapted (reduced textures, new materials, motion blending):

- "[Hummingbird – Rigged, 6 Animations (Open Bill)](https://sketchfab.com/3d-models/hummingbird-rigged-6-animations-open-bill-d9b448ac1025485e843d54bebf35390a)" by [Animal Animator](https://sketchfab.com/animalanimator)
- "[Betta Splendens](https://sketchfab.com/3d-models/betta-splendens-f4eeb7f50ad24873842bd954ad27d23b)" by [BlueMesh](https://sketchfab.com/VapTor)

The contact-page forest images were generated with Gemini, and their depth maps were made with Depth Anything V2. The main page's Mt. Kailash is built from SRTM elevation data (via AWS Terrain Tiles) and textured with the CC0 Poly Haven materials "[Cliff Side](https://polyhaven.com/a/cliff_side)" and "[Snow 02](https://polyhaven.com/a/snow_02)" (no attribution required). The redesign (`v2/`) uses nine components from [React Bits](https://reactbits.dev) by David Haz (Waves, FoldText, CircularText, ShinyText, TextType, DepthCarousel, BlurText, PixelCard, StaggeredMenu; MIT + Commons Clause, licence kept in `site/src/components/reactbits/`). Its blossom tree is a modified copy of [Moonlit Petals](https://www.originkit.dev/components/moonlit-petals) from [Originkit](https://www.originkit.dev), used under their [licensing terms](https://www.originkit.dev/docs/licensing) (`site/src/components/originkit/`). The animated machine figures on the project cards are drawn with the [Anatomy](https://github.com/wheresryan22/anatomy) kit by Ryan (MIT, `site/src/components/anatomy/`). Fonts are served from Google Fonts.

© Nuthan Puli. Code and design in this repository are the author's own unless credited above.
