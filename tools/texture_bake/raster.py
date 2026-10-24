"""Small numpy rasteriser for the texture bake.

load()            -> V (n,3) positions, N (n,3) normals, UV (n,2), F (m,3) faces, glTF object
raster(P2, F, W, H, z=None) -> per-pixel triangle id and barycentrics (with z-buffer when z given)
P2 are pixel coordinates (x right, y down). Pixel centres are at +0.5.
"""
import numpy as np, pygltflib

def load(path):
    g = pygltflib.GLTF2().load(path)
    blob = g.binary_blob()
    prim = g.meshes[0].primitives[0]
    def acc(i):
        a = g.accessors[i]; bv = g.bufferViews[a.bufferView]
        comps = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[a.type]
        dt = {5126: np.float32, 5125: np.uint32, 5123: np.uint16}[a.componentType]
        off = (bv.byteOffset or 0) + (a.byteOffset or 0)
        arr = np.frombuffer(blob, dt, a.count * comps, off).reshape(a.count, comps) if comps > 1 else np.frombuffer(blob, dt, a.count, off)
        return arr.copy()
    V = acc(prim.attributes.POSITION); N = acc(prim.attributes.NORMAL); UV = acc(prim.attributes.TEXCOORD_0)
    F = acc(prim.indices).reshape(-1, 3).astype(np.int64)
    return V, N, UV, F, g

def raster(P2, F, W, H, z=None, chunk=400000):
    """Returns tri (H,W) int (-1 = empty), bary (H,W,3) float32. If z (per vertex) is given, nearest (smallest z) wins."""
    tri = np.full(H * W, -1, np.int64)
    bary = np.zeros((H * W, 3), np.float32)
    zbuf = np.full(H * W, np.inf, np.float32) if z is not None else None
    A = P2[F[:, 0]]; B = P2[F[:, 1]]; C = P2[F[:, 2]]
    lo = np.floor(np.minimum(np.minimum(A, B), C) - 0.5).astype(np.int64)
    hi = np.ceil(np.maximum(np.maximum(A, B), C) - 0.5).astype(np.int64)
    lo = np.maximum(lo, 0); hi[:, 0] = np.minimum(hi[:, 0], W - 1); hi[:, 1] = np.minimum(hi[:, 1], H - 1)
    sz = hi - lo + 1
    ok = (sz[:, 0] > 0) & (sz[:, 1] > 0)
    # bucket triangles by bbox size so each batch uses a small fixed grid
    big = np.maximum(sz[:, 0], sz[:, 1])
    for k in np.unique(big[ok]):
        ids = np.nonzero(ok & (big == k))[0]
        gy, gx = np.mgrid[0:k, 0:k]; gx = gx.ravel(); gy = gy.ravel()
        per = max(1, chunk // (k * k))
        for s in range(0, len(ids), per):
            t = ids[s:s + per]
            px = lo[t, 0][:, None] + gx[None]; py = lo[t, 1][:, None] + gy[None]
            cx = px + 0.5; cy = py + 0.5
            a = A[t]; b = B[t]; c = C[t]
            d = (b[:, 1] - c[:, 1]) * (a[:, 0] - c[:, 0]) + (c[:, 0] - b[:, 0]) * (a[:, 1] - c[:, 1])
            d = np.where(np.abs(d) < 1e-12, 1e-12, d)[:, None]
            w0 = ((b[:, 1] - c[:, 1])[:, None] * (cx - c[:, 0][:, None]) + (c[:, 0] - b[:, 0])[:, None] * (cy - c[:, 1][:, None])) / d
            w1 = ((c[:, 1] - a[:, 1])[:, None] * (cx - c[:, 0][:, None]) + (a[:, 0] - c[:, 0])[:, None] * (cy - c[:, 1][:, None])) / d
            w2 = 1 - w0 - w1
            eps = -1e-4
            m = (w0 >= eps) & (w1 >= eps) & (w2 >= eps) & (px <= hi[t, 0][:, None]) & (py <= hi[t, 1][:, None]) & (px < W) & (py < H)
            ti, gi = np.nonzero(m)
            pix = py[ti, gi] * W + px[ti, gi]
            tt = t[ti]
            bb = np.stack([w0[ti, gi], w1[ti, gi], w2[ti, gi]], 1).astype(np.float32)
            if z is None:
                tri[pix] = tt; bary[pix] = bb
            else:
                zz = (bb * z[F[tt]]).sum(1).astype(np.float32)
                # resolve within the batch: sort by z descending so nearest is written last
                o = np.argsort(-zz, kind='stable')
                pix, tt, bb, zz = pix[o], tt[o], bb[o], zz[o]
                better = zz < zbuf[pix]
                pix, tt, bb, zz = pix[better], tt[better], bb[better], zz[better]
                tri[pix] = tt; bary[pix] = bb; zbuf[pix] = zz
                # duplicates within batch: last write wins = nearest, since sorted far->near
    return tri.reshape(H, W), bary.reshape(H, W, 3), (zbuf.reshape(H, W) if z is not None else None)
