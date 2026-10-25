"""Give the sides and back the same Minecraft pixel texture as the front: a brightness jitter per 3D grid cell the
size of one of the picture's pixels (about 1/80 of his height), only where the picture didn't paint."""
import numpy as np, cv2
from raster import load
V, N, UV, F, g = load('model.glb')
tri = np.load('uv_tri.npy'); bary = np.load('uv_bary.npy'); cov = tri >= 0
ti = tri[cov].astype(np.int64); bb = bary[cov]; del tri, bary
st = np.load('bake_st.npy')
P = np.einsum('ij,ijk->ik', bb, V.astype(np.float32)[F[ti]])
cell = np.floor(P * 80.5).astype(np.int64)
h = (cell[:, 0] * 73856093) ^ (cell[:, 1] * 19349663) ^ (cell[:, 2] * 83492791)
r1 = ((h & 0xffff) / 65535.0); r2 = (((h >> 16) & 0xffff) / 65535.0)
tex = cv2.imread('tex_new.png').astype(np.float32)
c = tex[cov]
lum = c.mean(1)
amp = np.where(lum < 60, 0.10, 0.055)          # hair and gloves get a little more variation, it reads on dark colours
f = 1 + amp * (r1 * 2 - 1) - 0.07 * (r2 < 0.12)
w = (1 - st)[:, None]
tex[cov] = c * (1 + (f[:, None] - 1) * w)
m = cov.astype(np.uint8)
for i in range(8):
    a = cv2.blur(tex * m[..., None], (3, 3)); cnt = cv2.blur(m.astype(np.float32), (3, 3)); ring = (m == 0) & (cnt > 0)
    tex[ring] = a[ring] / cnt[ring][:, None]; m = m | ring.astype(np.uint8)
cv2.imwrite('tex_final.png', np.clip(tex, 0, 255).astype(np.uint8)); print('ok')
