"""Cut the mountain (and everything in front of the sky) out of a sky photo.
Region-grows the sky from the top edge through pixels whose colour changes smoothly from their neighbour,
so it stops at the mountain's and ridges' outlines. Writes an RGBA cutout (sky transparent) and a preview."""
import sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
src, out, thr = sys.argv[1], sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else 6.0
img = Image.open(src).convert('RGB')
a = np.asarray(img.filter(ImageFilter.GaussianBlur(1.2)), dtype=np.float32)
H, W, _ = a.shape
# colour step to the right and downward neighbours
dx = np.zeros((H, W), np.float32); dy = np.zeros((H, W), np.float32)
dx[:, :-1] = np.abs(a[:, 1:] - a[:, :-1]).sum(2)
dy[:-1, :] = np.abs(a[1:] - a[:-1]).sum(2)
edge = np.maximum(np.maximum(dx, np.roll(dx, 1, 1)), np.maximum(dy, np.roll(dy, 1, 0)))
smooth = edge < thr
# sky = smooth pixels connected to the top row
lab, n = ndimage.label(smooth)
top = set(np.unique(lab[0][lab[0] > 0]))
sky = np.isin(lab, list(top))
# close small holes in the sky, then remove sky specks below the mountain's outline
sky = ndimage.binary_closing(sky, iterations=2)
sky = ndimage.binary_fill_holes(sky)
fg = ~sky
fg = ndimage.binary_opening(fg, iterations=1)
fg = ndimage.binary_erosion(fg, iterations=1)  # drop the pale rim of sky along the outline
alpha = Image.fromarray((fg * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.0))
rgba = img.copy(); rgba.putalpha(alpha); rgba.save(out)
prev = Image.new('RGB', img.size, (255, 0, 255)); prev.paste(img, mask=alpha); prev.save(out.replace('.png', '_preview.jpg'), quality=85)
print('foreground fraction', fg.mean().round(3))
