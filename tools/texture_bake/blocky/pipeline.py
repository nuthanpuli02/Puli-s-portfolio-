"""Re-texture the blocky Tripo model from Puli's single front picture.
Steps: UV raster -> cut-out of the picture -> fit the model's front silhouette to it (whole body, then the head on its
own) -> project the picture onto every texel that faces the front and is visible -> spread colour over the mesh into
texels the picture can't see, keeping the old texture's detail -> write tex_new.png.
Run from this folder: python3 pipeline.py [stage]  (stages: all, fit, bake)"""
import numpy as np, cv2, json, sys, os
import scipy.sparse as sp
from scipy.sparse.linalg import spsolve
from scipy.optimize import minimize
from scipy.ndimage import distance_transform_edt, binary_fill_holes
from raster import load, raster

V, N, UV, F, g = load('model.glb')
T = 4096
stage = sys.argv[1] if len(sys.argv) > 1 else 'all'
REFP = '../toon2/ref.png'
ref = cv2.imread(REFP)
Hh, Ww = ref.shape[:2]

def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)

# ---------- UV raster ----------
if not os.path.exists('uv_tri.npy'):
    tri, bary, _ = raster(UV * T, F, T, T)
    np.save('uv_tri.npy', tri.astype(np.int32)); np.save('uv_bary.npy', bary)

# ---------- cut-out of the picture ----------
if not os.path.exists('mask.png'):
    m = np.zeros((Hh, Ww), np.uint8); bg = np.zeros((1, 65)); fg = np.zeros((1, 65))
    cv2.grabCut(ref, m, (20, 10, Ww - 40, Hh - 20), bg, fg, 6, cv2.GC_INIT_WITH_RECT)
    mask = ((m == 1) | (m == 3)).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(mask); big = 1 + np.argmax(st[1:, 4])
    mask = binary_fill_holes(lab == big)
    # the floor shadow under the boots is not him
    a = ref.astype(int); grey = (np.abs(a[..., 0] - a[..., 1]) < 10) & (np.abs(a[..., 1] - a[..., 2]) < 10) & (a[..., 0] > 70)
    mask[(np.arange(Hh)[:, None] > 1470) & grey] = False
    cv2.imwrite('mask.png', mask.astype(np.uint8) * 255)
mask = cv2.imread('mask.png', 0) > 0

X, Y, Z = V[:, 0], V[:, 1], V[:, 2]
def sil(p, faces=F, cut=None):
    sx, sy, ox, oy = p
    t, _, _ = raster(np.stack([X * sx + ox, -Y * sy + oy], 1), faces, Ww, Hh)
    a = t >= 0
    if cut is not None: a[cut:] = False
    return a
if stage in ('all', 'fit') or not os.path.exists('fit.json'):
    ys, xs = np.nonzero(mask)
    s0 = (ys.max() - ys.min()) / (Y.max() - Y.min())
    p0 = np.array([s0, s0, xs.mean() - s0 * X.mean(), ys.max() + s0 * Y.min()])
    loss = lambda p: 1 - (sil(p) & mask).sum() / (sil(p) | mask).sum()
    r = minimize(loss, p0, method='Nelder-Mead', options={'xatol': 0.3, 'fatol': 1e-5, 'maxiter': 250,
                 'initial_simplex': [p0, p0 + [15, 0, 0, 0], p0 + [0, 15, 0, 0], p0 + [0, 0, 6, 0], p0 + [0, 0, 0, 6]]})
    body = r.x; print('body fit', body, 'IoU', 1 - r.fun)
    # head: refit on the part above the shoulders
    YC = 0.78
    Fh = F[(V[F][:, :, 1] > YC - 0.03).all(1)]
    def hloss(q):
        s, ox, oy = q; p = (s, s, ox, oy); cut = int(-YC * s + oy)
        a = sil(p, Fh, cut); mm = mask.copy(); mm[cut:] = False
        return 1 - (a & mm).sum() / max(1, (a | mm).sum())
    q0 = np.array([body[1], body[2], body[3]])
    r2 = minimize(hloss, q0, method='Nelder-Mead', options={'xatol': 0.2, 'fatol': 1e-5, 'maxiter': 250,
                  'initial_simplex': [q0, q0 + [20, 0, 0], q0 + [0, 4, 0], q0 + [0, 0, 4]]})
    print('head fit', r2.x, 'IoU', 1 - r2.fun)
    json.dump({'body': list(map(float, body)), 'head': list(map(float, r2.x)), 'yc': YC}, open('fit.json', 'w'))
    a = sil(body); ov = np.zeros((Hh, Ww, 3), np.uint8); ov[..., 1] = mask * 255; ov[..., 2] = a * 255
    cv2.imwrite('fit_overlay.png', cv2.resize(ov, (Ww // 2, Hh // 2)))
    if stage == 'fit': sys.exit()

fit = json.load(open('fit.json'))
def params(y):
    sx, sy, ox, oy = fit['body']; hs, hox, hoy = fit['head']; yc = fit['yc']
    t = smooth(yc - 0.05, yc, y)
    return sx + (hs - sx) * t, sy + (hs - sy) * t, ox + (hox - ox) * t, oy + (hoy - oy) * t

# ---------- bake ----------
tri = np.load('uv_tri.npy').astype(np.int64); bary = np.load('uv_bary.npy'); cov = tri >= 0
ti_all = tri[cov]; bb_all = bary[cov]; del tri, bary
V32 = V.astype(np.float32)
# welded vertices + smoothed normals (choose which texels the photo colours by the broad shape, not tiny creases)
key = np.round(V / 2e-5).astype(np.int64); _, WID = np.unique(key, axis=0, return_inverse=True); WID = WID.ravel()
nW = WID.max() + 1; WF = WID[F]
fa = np.cross(V[F[:, 1]] - V[F[:, 0]], V[F[:, 2]] - V[F[:, 0]])
VN = np.zeros((nW, 3))
for k in range(3):
    for c in range(3): VN[:, c] += np.bincount(WF[:, k], fa[:, c], nW)
e = np.concatenate([WF[:, [0, 1]], WF[:, [1, 2]], WF[:, [2, 0]]]); e = np.unique(np.sort(e, 1), axis=0)
A = sp.coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(nW, nW)); A = (A + A.T).tocsr(); A.data[:] = 1
deg = np.asarray(A.sum(1)).ravel(); An = sp.diags(1 / np.maximum(deg, 1)) @ A
VN /= np.linalg.norm(VN, axis=1, keepdims=True) + 1e-12
for it in range(4):
    VN = 0.5 * VN + 0.5 * (An @ VN); VN /= np.linalg.norm(VN, axis=1, keepdims=True) + 1e-12
VN = VN.astype(np.float32)

# depth buffer of the model in the picture's view (back faces culled like the renderer)
vsx, vsy, vox, voy = params(V[:, 1])
VP = np.stack([V[:, 0] * vsx + vox, -V[:, 1] * vsy + voy], 1)
fn = np.cross(V[F[:, 1]] - V[F[:, 0]], V[F[:, 2]] - V[F[:, 0]])
_, _, zb = raster(VP, F[fn[:, 2] > 0], Ww, Hh, z=-V[:, 2])
zb = np.where(np.isfinite(zb), -zb, -9).astype(np.float32)
edge = smooth(2.0, 6.0, distance_transform_edt(mask)).astype(np.float32)
img = ref.astype(np.float32)

n = len(ti_all)
mix = np.zeros((n, 3), np.float32); st = np.zeros(n, np.float32)
CH = 1500000
for s0 in range(0, n, CH):
    ti = ti_all[s0:s0 + CH]; bb = bb_all[s0:s0 + CH]
    P = np.einsum('ij,ijk->ik', bb, V32[F[ti]])
    Nn = np.einsum('ij,ijk->ik', bb, VN[WF[ti]]); Nn /= np.linalg.norm(Nn, axis=1, keepdims=True) + 1e-9
    sx, sy, ox, oy = params(P[:, 1])
    px = P[:, 0] * sx + ox; py = -P[:, 1] * sy + oy
    xi = np.clip(np.round(px - 0.5).astype(int), 0, Ww - 1); yi = np.clip(np.round(py - 0.5).astype(int), 0, Hh - 1)
    vis = P[:, 2] >= zb[yi, xi] - 0.006
    # nearest-pixel sampling keeps the pixel art crisp
    col = img[yi, xi]
    w = vis * edge[yi, xi] * smooth(0.25, 0.6, Nn[:, 2])
    mix[s0:s0 + CH] = col; st[s0:s0 + CH] = np.clip(w * 1.5, 0, 1)
np.save('bake_mix.npy', mix); np.save('bake_st.npy', st)
print('front-covered share of texels', (st > 0.5).mean())

# ---------- fill what the picture can't see ----------
orig = cv2.imread([f for f in os.listdir('.') if f.startswith('tex_') and 'basecolor' in f][0]).astype(np.float32)
acc = np.zeros((nW, 3)); accw = np.zeros(nW); tot = np.zeros(nW)
for k in range(3):
    vid = WF[ti_all, k]; b = bb_all[:, k].astype(np.float64)
    tot += np.bincount(vid, b, nW); accw += np.bincount(vid, b * st, nW)
    for c in range(3): acc[:, c] += np.bincount(vid, b * st * mix[:, c], nW)
# colour shift (new - old) measured where the photo is strong, spread over the surface; the old texture keeps its
# own pattern on sides and back but takes the photo's tones
oldv = np.zeros((nW, 3));
for k in range(3):
    vid = WF[ti_all, k]; b = bb_all[:, k].astype(np.float64)
    o = orig[cov]
    for c in range(3): oldv[:, c] += np.bincount(vid, b * st * o[:, c], nW)
known = (tot > 0) & (accw / np.maximum(tot, 1e-9) >= 0.5)
shift = np.zeros((nW, 3)); shift[known] = (acc[known] - oldv[known]) / accw[known][:, None]
L = (sp.diags(deg) - A).tocsr()
u = np.nonzero(~known)[0]; kn = np.nonzero(known)[0]
Luu = (L[u][:, u] + sp.identity(len(u)) * 1e-3).tocsc(); Luk = L[u][:, kn]
for c in range(3):
    shift[u, c] = spsolve(Luu, -Luk @ shift[kn, c])
sh = np.einsum('ij,ijk->ik', bb_all, shift[WF[ti_all]].astype(np.float32))
res = (orig[cov] + sh) * (1 - st[:, None]) + mix * st[:, None]
out = orig.copy(); out[cov] = res
m = cov.astype(np.uint8)
for i in range(8):
    a = cv2.blur(out * m[..., None], (3, 3)); cnt = cv2.blur(m.astype(np.float32), (3, 3)); ring = (m == 0) & (cnt > 0)
    out[ring] = a[ring] / cnt[ring][:, None]; m = m | ring.astype(np.uint8)
cv2.imwrite('tex_new.png', np.clip(out, 0, 255).astype(np.uint8))
print('done')
