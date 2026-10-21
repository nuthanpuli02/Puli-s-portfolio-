"""Keep only the mountain of a sky-above-a-sea-of-clouds photo: sky and the photo's own clouds become transparent.
Sky: region-grown from the top edge (as in cutout_sky.py). Clouds: bright, low-texture pixels connected to the bottom edge,
grown upward until they meet the rock's texture. Writes a grayscale mask (white = mountain) and a magenta preview.
Used for assets/kailash-day-*-mask.png (wide.png / tall.png are the full-size Figma AI photos; the .jpg assets are their compressed copies):
  python3 tools/mountain_only.py wide.png wide_mtn.png 0.78 0.075 0.42 "0.585;0.585:0.36:0.82;0.66:0.36:0.85;0.72:0.38:0.865" "560,250 1200,250 1200,380 1074,380 1100,420 1110,455 1150,490 1195,520 1210,600 1260,700 500,700 500,520 600,470 700,456 776,440 808,380 560,380"
  python3 tools/mountain_only.py tall.png tall_mtn.png 0.615 0.055 0.42 "" "0,420 768,420 768,560 470,515 550,587 563,620 583,655 613,690 636,726 720,750 768,760 768,900 0,900 0,680 60,670 190,640 240,585 330,520 0,520"
then saved as grayscale PNG."""
import sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
src, out, cut = sys.argv[1], sys.argv[2], float(sys.argv[3])   # cut: no mountain below this fraction of the height
texmax = float(sys.argv[4]) if len(sys.argv) > 4 else 0.055      # how busy a cloud may look (distant cloud fields are busier)
lmin = float(sys.argv[5]) if len(sys.argv) > 5 else 0.42         # how dark a cloud may be (clouds in shadow are darker)
# optional: below the ridgeline only the mountain's own span counts (the rest is the photo's sea of clouds);
# "ridge;row:xleft:xright;row:xleft:xright..." as fractions, edges interpolated between the given rows
edges = sys.argv[6] if len(sys.argv) > 6 else ''
poly = sys.argv[7] if len(sys.argv) > 7 else ''
img = Image.open(src).convert('RGB')
a = np.asarray(img, dtype=np.float32) / 255
H, W, _ = a.shape
L = a.mean(2)
# sky: smooth region connected to the top
b = np.asarray(img.filter(ImageFilter.GaussianBlur(1.2)), dtype=np.float32)
dx = np.zeros((H, W), np.float32); dy = np.zeros((H, W), np.float32)
dx[:, :-1] = np.abs(b[:, 1:] - b[:, :-1]).sum(2); dy[:-1] = np.abs(b[1:] - b[:-1]).sum(2)
edge = np.maximum(np.maximum(dx, np.roll(dx, 1, 1)), np.maximum(dy, np.roll(dy, 1, 0)))
lab, _ = ndimage.label(edge < 7)
sky = np.isin(lab, [v for v in np.unique(lab[0]) if v > 0])
sky = ndimage.binary_fill_holes(ndimage.binary_closing(sky, iterations=2))
# texture: local standard deviation of brightness over a 9x9 window
m = ndimage.uniform_filter(L, 9); m2 = ndimage.uniform_filter(L * L, 9)
tex = np.sqrt(np.maximum(m2 - m * m, 0))
sat = (a.max(2) - a.min(2)) / np.maximum(a.max(2), 1e-3)
cloudish = (L > lmin) & (tex < texmax) & (sat < 0.42)
lab, _ = ndimage.label(cloudish)
clouds = np.isin(lab, [v for v in np.unique(lab[-1]) if v > 0])
clouds = ndimage.binary_closing(clouds, iterations=3)
rows = np.arange(H)[:, None] / H
mtn = ~sky & ~clouds & (rows < cut)
if edges:
    ridge, *pts = edges.split(';')
    ridge = float(ridge); pts = [[float(v) for v in q.split(':')] for q in pts]
    r = np.arange(H) / H
    xl = np.interp(r, [q[0] for q in pts], [q[1] for q in pts]); xr = np.interp(r, [q[0] for q in pts], [q[2] for q in pts])
    cols = np.arange(W)[None, :] / W
    mtn &= (rows < ridge) | ((cols > xl[:, None]) & (cols < xr[:, None]))
# distant ridges sit right beside the flanks and look like rock, so an outline traced around the mountain keeps them out:
# "x,y x,y ..." in pixels of the source image
if poly:
    from PIL import ImageDraw
    pm = Image.new('L', (W, H), 0)
    ImageDraw.Draw(pm).polygon([tuple(float(v) for v in q.split(',')) for q in poly.split()], fill=255)
    mtn &= np.asarray(pm) > 0
mtn = ndimage.binary_opening(mtn, iterations=2)
# keep the large pieces only (mountain and ridges), drop specks left inside the clouds
lab, n = ndimage.label(mtn)
if n:
    sizes = ndimage.sum(mtn, lab, range(1, n + 1))
    mtn = lab == (int(np.argmax(sizes)) + 1)  # the mountain itself: the largest piece
mtn = ndimage.binary_fill_holes(mtn)  # shadowed rock can pass for cloud; nothing inside the outline is see-through
mtn = ndimage.binary_erosion(mtn, iterations=1)
alpha = Image.fromarray((mtn * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.6))
# soften the lower edges so the 3D clouds can take over there
al = np.asarray(alpha, np.float32) / 255
soft = ndimage.gaussian_filter(mtn.astype(np.float32), 6)
low = np.clip((rows - (cut - 0.08)) / 0.08, 0, 1)
al = al * (1 - low) + np.minimum(al, soft) * low
# and let the base thin out into haze over the last 90 px above the cut, so no cut line shows where the 3D clouds are thin
al *= np.clip((cut - rows) * H / 90, 0, 1) ** 0.8
Image.fromarray((al * 255).astype(np.uint8)).save(out)
prev = Image.new('RGB', img.size, (255, 0, 255)); prev.paste(img, mask=Image.fromarray((al * 255).astype(np.uint8)))
prev.save(out.replace('.png', '_preview.jpg'), quality=85)
print('mountain fraction', round(float(al.mean()), 3))
