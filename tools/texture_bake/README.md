# Texture bake for the Tripo character

Fixes the base-colour texture of Puli's Tripo model (`safari_explorer` GLB/FBX) by projecting his Gemini reference
images onto it. The model files and images live on Puli's computer ("Puli portfolio cloud images"), not in this repo.

Run inside a working folder holding `model.glb` (the Tripo GLB) and the textures extracted from it
(`tex_safari_explorer_3d_model_*.jpg/png`); `seg.py` reads the reference images from the uploads folder path at its top.

1. `seg.py` cuts the character out of the front, back and both side images (`ref_*.png`, `mask_*.png`).
2. `fit.py` fits the model's orthographic silhouette to each image; `headfit.py` refits the head on its own.
3. `uvraster.py` rasterises the UV layout (`uv_tri.npy`, `uv_bary.npy`) so every texel knows its 3D point.
4. `bake.py` projects front and back on the whole body and the right-side photo (mirrored for the left, whose photo has
   a different hairstyle) on the head only; weights use visibility, mask distance and smoothed normals.
5. `fill.py` spreads colour over the mesh into texels no photo sees (armpits, under the chin, boot sides), keeping the
   old texture's fine detail. `normfix.py` calms the head's normal map.
6. `export.py tex_new_basecolor.png out.glb rmfix` writes the GLB (metalness off, matte roughness).
`shot.py`/`cmp.py`/`view.html` render checks with three.js 0.169.0 in headless Chromium.

The FBX from the same Tripo export uses the same UV layout, so the fixed texture also works there.

## Blocky (voxel-style) model: `blocky/`

The chosen character is the blocky Tripo model ("safari explorer 3d model (1).glb", scaled to 1 unit tall) re-textured
from Puli's single front picture ("Bearded Voxel Adventurer in Khaki Gear.png"). In a folder with `model.glb`,
`raster.py`, `export.py` and the extracted `tex_*` textures, with the picture at `../toon2/ref.png`:
`pipeline.py` (UV raster, cut-out, silhouette fit, front projection with nearest-pixel sampling so the pixel art stays
crisp, colour shift for the unseen parts), then `headfill.py` (back and sides of the head filled from the picture's
colours), `noise.py` (Minecraft-style pixel jitter on the unseen sides and back), `export.py tex_final.png out.glb rmfix`.
