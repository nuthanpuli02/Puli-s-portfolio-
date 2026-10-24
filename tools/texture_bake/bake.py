"""Project the reference images onto the model's base-colour texture.

Each texel gets its 3D position and normal from the UV raster, is projected into each reference view
(orthographic, fitted to the silhouettes in fit.json / headfit.json), is tested for visibility against that
view's depth buffer, and takes the image colour weighted by how squarely that view sees it.
Texels no view sees well keep the old texture, colour-shifted toward their neighbours' new colours.
"""
import numpy as np, cv2, json, sys
from raster import load, raster
from scipy.ndimage import distance_transform_edt

V, N, UV, F, g = load('model.glb')
T = 4096
tri = np.load('uv_tri.npy').astype(np.int64); bary = np.load('uv_bary.npy')
fit = json.load(open('fit.json')); hfit = json.load(open('headfit.json'))
orig = cv2.imread('tex_safari_explorer_3d_model_basecolor.jpg').astype(np.float32)

cov = tri >= 0
ti_all = tri[cov]; bb_all = bary[cov]; del tri, bary
V32 = V.astype(np.float32); N32 = N.astype(np.float32)
# Smoothed surface normals for choosing which photo colours a texel: small creases (e.g. the step where a hair lock
# meets the temple) then follow their surroundings instead of flipping to another photo and leaving streaks.
import scipy.sparse as sp
_key = np.round(V / 2e-5).astype(np.int64); _, WID = np.unique(_key, axis=0, return_inverse=True); WID = WID.ravel()
nW = WID.max() + 1; WF = WID[F]
_fa = np.cross(V[F[:, 1]] - V[F[:, 0]], V[F[:, 2]] - V[F[:, 0]])  # area-weighted face normals
VN = np.zeros((nW, 3))
for k in range(3):
    for c in range(3): VN[:, c] += np.bincount(WF[:, k], _fa[:, c], nW)
_e = np.concatenate([WF[:, [0, 1]], WF[:, [1, 2]], WF[:, [2, 0]]])
_A = sp.coo_matrix((np.ones(len(_e)), (_e[:, 0], _e[:, 1])), shape=(nW, nW)); _A = (_A + _A.T).tocsr(); _A.data[:] = 1
_A = sp.diags(1 / np.maximum(np.asarray(_A.sum(1)).ravel(), 1)) @ _A
VN /= np.linalg.norm(VN, axis=1, keepdims=True) + 1e-12
for it in range(int(sys.argv[1]) if len(sys.argv) > 1 else 12):
    VN = 0.5 * VN + 0.5 * (_A @ VN); VN /= np.linalg.norm(VN, axis=1, keepdims=True) + 1e-12
VN = VN.astype(np.float32)
print('texels', len(ti_all))

def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)

AX = {'front': ((1, 0, 0), (0, 0, 1)), 'back': ((-1, 0, 0), (0, 0, -1)), 'right': ((0, 0, 1), (-1, 0, 0))}
HEAD0, HEAD1 = 0.80, 0.845  # blend from the body fit to the head fit between these heights

def params(view, y):
    sx, sy, ox, oy = fit[view]; hs, hox, hoy = hfit[view]
    if view == 'right':  # side views only ever used on the head
        return hs, hs, hox, hoy
    t = smooth(HEAD0, HEAD1, y)
    return sx + (hs - sx) * t, sy + (hs - sy) * t, ox + (hox - ox) * t, oy + (hoy - oy) * t

VIEWDATA = {}
for view, (ax, dz) in AX.items():
    ax = np.array(ax, np.float32); dz = np.array(dz, np.float32)
    img = cv2.imread(f'ref_{view}.png').astype(np.float32)
    m = cv2.imread(f'mask_{view}.png', 0) > 0; H, W = m.shape
    vsx, vsy, vox, voy = params(view, V[:, 1])
    VP = np.stack([(V @ ax) * vsx + vox, -V[:, 1] * vsy + voy], 1)
    # cull back faces like the renderer does (the mesh has inner/back-facing layers that would hide real surface)
    fn = np.cross(V[F[:, 1]] - V[F[:, 0]], V[F[:, 2]] - V[F[:, 0]])
    _, _, zb = raster(VP, F[fn @ dz > 0], W, H, z=-(V @ dz))
    zb = np.where(np.isfinite(zb), -zb, -9).astype(np.float32)
    edge = smooth(3.0, 10.0, distance_transform_edt(m)).astype(np.float32)
    VIEWDATA[view] = (ax, dz, img, zb, edge, H, W)

def view_sample(view, Pt, Nt, mirror=False):
    ax, dz, img, zb, edgemap, H, W = VIEWDATA[view]
    if mirror:
        Pt = Pt * np.array([-1, 1, 1], np.float32); Nt = Nt * np.array([-1, 1, 1], np.float32)
    Yt = Pt[:, 1]
    sx, sy, ox, oy = params(view, Yt)
    px = (Pt @ ax) * sx + ox; py = -Yt * sy + oy; d = Pt @ dz
    xi = np.clip(np.round(px - 0.5).astype(int), 0, W - 1); yi = np.clip(np.round(py - 0.5).astype(int), 0, H - 1)
    vis = d >= zb[yi, xi] - (0.025 if view == 'right' else 0.006)  # side views: head only, where hair locks overlap the temples
    facing = Nt @ dz
    fx = np.clip(px - 0.5, 0, W - 1.001); fy = np.clip(py - 0.5, 0, H - 1.001)
    x0 = fx.astype(int); y0 = fy.astype(int); ax_ = (fx - x0)[:, None]; ay_ = (fy - y0)[:, None]
    col = (img[y0, x0] * (1 - ax_) * (1 - ay_) + img[y0, x0 + 1] * ax_ * (1 - ay_)
           + img[y0 + 1, x0] * (1 - ax_) * ay_ + img[y0 + 1, x0 + 1] * ax_ * ay_)
    hd = smooth(0.80, 0.84, Yt)
    if view == 'right':
        fw = smooth(0.2, 0.6, facing)
    else:  # on the head only trust the front/back photos where they see the surface fairly squarely
        fw = smooth(0.06 + 0.24 * hd, 0.5 + 0.15 * hd, facing)
    w = vis * edgemap[yi, xi] * fw
    return col.astype(np.float32), w.astype(np.float32)

n = len(ti_all)
mix = np.zeros((n, 3), np.float32); strength = np.zeros(n, np.float32); dom = np.zeros((n, 4), np.float32)
CH = 1500000
for s0 in range(0, n, CH):
    ti = ti_all[s0:s0 + CH]; bb = bb_all[s0:s0 + CH]
    P = np.einsum('ij,ijk->ik', bb, V32[F[ti]])
    Nn = np.einsum('ij,ijk->ik', bb, VN[WF[ti]]); Nn /= np.linalg.norm(Nn, axis=1, keepdims=True) + 1e-9
    head = smooth(0.80, 0.84, P[:, 1])
    acc = np.zeros((len(ti), 3), np.float32); wsum = np.zeros(len(ti), np.float32); wmax = np.zeros(len(ti), np.float32)
    for vi, (view, mirror, extra) in enumerate( (('front', False, 1.0), ('back', False, 1.0),
                                ('right', False, head * (P[:, 0] < 0) * 0.8), ('right', True, head * (P[:, 0] > 0) * 0.8))):
        c, w = view_sample(view, P, Nn, mirror); w = w * extra
        w3 = w ** 6  # sharpen: the view that faces a texel most squarely dominates (less ghosting)
        acc += c * w3[:, None]; wsum += w3; wmax = np.maximum(wmax, w); dom[s0:s0 + CH, vi] = w
    mix[s0:s0 + CH] = acc / np.maximum(wsum, 1e-9)[:, None]
    strength[s0:s0 + CH] = np.clip(wmax * (1.6 + 1.4 * head), 0, 1)
del VIEWDATA

# write into texture space
np.save('bake_dom.npy', dom); np.save('bake_mix.npy', mix); np.save('bake_strength.npy', strength)
st = np.zeros((T, T), np.float32); st[cov] = strength
# low-frequency colour correction for texels the projection does not reach: shift the old texture by the
# local average difference (new - old) measured where the projection is strong
diff = np.zeros((T, T, 3), np.float32)
diff[cov] = (mix - orig[cov]) * strength[:, None]
sig = 40
num = cv2.GaussianBlur(diff, (0, 0), sig); del diff
den = cv2.GaussianBlur(st, (0, 0), sig)
num *= (np.clip(den / 0.05, 0, 1) / np.maximum(den, 1e-3))[..., None]
out = orig + num; del num
# where the projection is strong, use it
out[cov] = out[cov] * (1 - strength[:, None]) + mix * strength[:, None]
out[~cov] = orig[~cov]
# bleed the new colours a few texels past each UV island so mipmaps and filtering show no seams
m = cov.astype(np.uint8)
for i in range(8):
    acc = cv2.blur(out * m[..., None], (3, 3)); cnt = cv2.blur(m.astype(np.float32), (3, 3))
    ring = (m == 0) & (cnt > 0)
    out[ring] = acc[ring] / cnt[ring][:, None]; m = m | ring.astype(np.uint8); del acc
cv2.imwrite('tex_new_basecolor.png', np.clip(out, 0, 255).astype(np.uint8))
cv2.imwrite('tex_strength.png', (st * 255).astype(np.uint8))
print('done; mean strength over covered texels', strength.mean())
