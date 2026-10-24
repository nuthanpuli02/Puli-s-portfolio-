"""Fill texels the reference images could not reach (armpits, under the chin, sides of legs and boots, top of
the head) by spreading the projected colours across the mesh surface (harmonic fill on the welded vertex graph),
then add back the fine detail (folds, seams) of the old texture. Writes tex_new_basecolor.png."""
import numpy as np, cv2
import scipy.sparse as sp
from scipy.sparse.linalg import spsolve
from raster import load

V, N, UV, F, g = load('model.glb')
T = 4096
tri = np.load('uv_tri.npy').astype(np.int64); bary = np.load('uv_bary.npy')
cov = tri >= 0
ti = tri[cov]; bb = bary[cov]; del tri, bary
mix = np.load('bake_mix.npy'); st = np.load('bake_strength.npy')
orig = cv2.imread('tex_safari_explorer_3d_model_basecolor.jpg').astype(np.float32)

# weld vertices split at UV seams so colour can flow across seams
key = np.round(V / 2e-5).astype(np.int64)
_, wid = np.unique(key, axis=0, return_inverse=True); wid = wid.ravel(); nW = wid.max() + 1
WF = wid[F]
print('welded vertices', nW, 'of', len(V))

acc = np.zeros((nW, 3)); accw = np.zeros(nW); tot = np.zeros(nW)
for k in range(3):
    vid = WF[ti, k]; b = bb[:, k].astype(np.float64)
    tot += np.bincount(vid, b, nW)
    accw += np.bincount(vid, b * st, nW)
    for c in range(3): acc[:, c] += np.bincount(vid, b * st * mix[:, c], nW)
frac = accw / np.maximum(tot, 1e-9)
known = (tot > 0) & (frac >= 0.55)
col = np.zeros((nW, 3)); col[known] = acc[known] / accw[known][:, None]
print('known vertices', known.mean())

# uniform graph Laplacian, Dirichlet at known vertices
e = np.concatenate([WF[:, [0, 1]], WF[:, [1, 2]], WF[:, [2, 0]]]); e = np.sort(e, 1); e = np.unique(e, axis=0)
A = sp.coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(nW, nW)); A = (A + A.T).tocsr(); A.data[:] = 1
deg = np.asarray(A.sum(1)).ravel()
L = (sp.diags(deg) - A).tocsr()
u = np.nonzero(~known)[0]; kn = np.nonzero(known)[0]
Luu = L[u][:, u] + sp.identity(len(u)) * 1e-4
Luk = L[u][:, kn]
mean = col[known].mean(0)
for c in range(3):
    rhs = -Luk @ col[kn, c] + 1e-4 * mean[c]
    col[u, c] = spsolve(Luu.tocsc(), rhs)
print('solved')

fillc = np.einsum('ij,ijk->ik', bb, col[WF[ti]].astype(np.float32))
# fine detail of the old texture (high-pass inside the UV islands)
m = cov.astype(np.float32)
blur = cv2.GaussianBlur(orig * m[..., None], (0, 0), 5) / np.maximum(cv2.GaussianBlur(m, (0, 0), 5), 1e-3)[..., None]
detail = (orig - blur)[cov]; del blur
detail = np.clip(detail, -40, 40) * 0.7
s = st[:, None]
res = (fillc + detail) * (1 - s) + mix * s
out = orig.copy(); out[cov] = res
# bleed past island edges so filtering/mipmaps show no seams
mm = cov.astype(np.uint8)
for i in range(8):
    a = cv2.blur(out * mm[..., None], (3, 3)); cnt = cv2.blur(mm.astype(np.float32), (3, 3))
    ring = (mm == 0) & (cnt > 0)
    out[ring] = a[ring] / cnt[ring][:, None]; mm = mm | ring.astype(np.uint8); del a
cv2.imwrite('tex_new_basecolor.png', np.clip(out, 0, 255).astype(np.uint8))
print('done')
