"""Calm the normal map on the head: Tripo baked grooves into it from its old, misplaced face (a line along the jaw,
creases by the nose and cuts through the temple hair) that now fight the corrected colours. Body folds are kept."""
import numpy as np, cv2
from raster import load
V, N, UV, F, g = load('model.glb')
tri = np.load('uv_tri.npy'); bary = np.load('uv_bary.npy'); cov = tri >= 0
Y = np.zeros(tri.shape, np.float32)
Y[cov] = np.einsum('ij,ij->i', bary[cov], V[F[tri[cov]], 1].astype(np.float32))
# extend Y a few texels past island edges so the padding follows its island
m = cov.astype(np.uint8)
for i in range(8):
    acc = cv2.blur(Y * m, (3, 3)); cnt = cv2.blur(m.astype(np.float32), (3, 3)); ring = (m == 0) & (cnt > 0)
    Y[ring] = acc[ring] / cnt[ring]; m = m | ring.astype(np.uint8)
t = np.clip((Y - 0.80) / 0.04, 0, 1); t = t * t * (3 - 2 * t); t[m == 0] = 0
keep = 1 - 0.75 * t  # head keeps a quarter of its normal-map relief
nm = cv2.imread('tex_safari_explorer_3d_model_normal.png').astype(np.float32)[..., ::-1] / 127.5 - 1  # RGB in [-1,1]
nm[..., 0] *= keep; nm[..., 1] *= keep
nm[..., 2] = np.sqrt(np.clip(1 - nm[..., 0] ** 2 - nm[..., 1] ** 2, 0, 1))
cv2.imwrite('tex_normal_fixed.png', np.clip((nm[..., ::-1] + 1) * 127.5, 0, 255).astype(np.uint8))
print('ok')
