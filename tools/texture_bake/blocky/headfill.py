"""On the head, texels the picture can't see (back and sides of the hair, behind the ears) take colour spread over the
surface from what the picture painted, instead of the old texture (which had skin-coloured patches in the hair)."""
import numpy as np, cv2
import scipy.sparse as sp
from scipy.sparse.linalg import spsolve
from raster import load
V, N, UV, F, g = load('model.glb')
tri = np.load('uv_tri.npy'); bary = np.load('uv_bary.npy'); cov = tri >= 0
ti = tri[cov].astype(np.int64); bb = bary[cov]; del tri, bary
st = np.load('bake_st.npy'); mix = np.load('bake_mix.npy')
key = np.round(V / 2e-5).astype(np.int64); _, WID = np.unique(key, axis=0, return_inverse=True); WID = WID.ravel()
nW = WID.max() + 1; WF = WID[F]
acc = np.zeros((nW, 3)); accw = np.zeros(nW); tot = np.zeros(nW)
for k in range(3):
    vid = WF[ti, k]; b = bb[:, k].astype(np.float64)
    tot += np.bincount(vid, b, nW); accw += np.bincount(vid, b * st, nW)
    for c in range(3): acc[:, c] += np.bincount(vid, b * st * mix[:, c], nW)
known = (tot > 0) & (accw / np.maximum(tot, 1e-9) >= 0.6)
col = np.zeros((nW, 3)); col[known] = acc[known] / accw[known][:, None]
e = np.concatenate([WF[:, [0, 1]], WF[:, [1, 2]], WF[:, [2, 0]]]); e = np.unique(np.sort(e, 1), axis=0)
A = sp.coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(nW, nW)); A = (A + A.T).tocsr(); A.data[:] = 1
L = (sp.diags(np.asarray(A.sum(1)).ravel()) - A).tocsr()
u = np.nonzero(~known)[0]; kn = np.nonzero(known)[0]
Luu = (L[u][:, u] + sp.identity(len(u)) * 1e-4).tocsc(); Luk = L[u][:, kn]
for c in range(3): col[u, c] = spsolve(Luu, -Luk @ col[kn, c])
fillc = np.einsum('ij,ijk->ik', bb, col[WF[ti]].astype(np.float32))
P = np.einsum('ij,ijk->ik', bb, V.astype(np.float32)[F[ti]])
head = np.clip((P[:, 1] - 0.79) / 0.03, 0, 1)            # the head starts at the collar
w = (head * (1 - st))[:, None]
tex = cv2.imread('tex_new.png').astype(np.float32)
c = tex[cov]; tex[cov] = c * (1 - w) + fillc * w
cv2.imwrite('tex_new.png', np.clip(tex, 0, 255).astype(np.uint8)); print('ok')
