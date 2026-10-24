import numpy as np, time
from raster import load, raster
V,N,UV,F,g=load('model.glb')
print(V.shape,F.shape, UV.min(0),UV.max(0))
T=4096
t=time.time()
tri,bary,_=raster(UV*T,F,T,T)
print('uv raster',time.time()-t,'coverage',(tri>=0).mean())
np.save('uv_tri.npy',tri.astype(np.int32)); np.save('uv_bary.npy',bary)
