import numpy as np, cv2, json
from raster import load, raster
from scipy.optimize import minimize
V,N,UV,F,g=load('model.glb')
# view axes: screen-x direction in model space, depth direction (towards camera)
VIEWS={'front':((1,0,0),(0,0,1)),'back':((-1,0,0),(0,0,-1)),'right':((0,0,1),(-1,0,0)),'left':((0,0,-1),(1,0,0))}
def proj(view,p):
    ax,dz=VIEWS[view]; return V@np.array(ax,float), V[:,1], V@np.array(dz,float)
res={}
for view in VIEWS:
    m=cv2.imread(f'mask_{view}.png',0)>0; H,W=m.shape
    X,Y,Z=proj(view,None)
    ys,xs=np.nonzero(m)
    s0=(ys.max()-ys.min())/(Y.max()-Y.min())
    ox0=xs.mean()-s0*X.mean() if view in('front','back') else None
    if ox0 is None:  # sides: align on the head/legs horizontally using the lower legs' centre
        sel=ys>ys.min()+0.75*(ys.max()-ys.min()); ox0=xs[sel].mean()-s0*X[Y<0.25].mean()
    oy0=ys.max()+s0*Y.min()
    def sil(p):
        sx,sy,ox,oy=p
        P=np.stack([X*sx+ox,-Y*sy+oy],1)
        t,_,_=raster(P,F,W,H); return t>=0
    def loss(p):
        a=sil(p); return 1-(a&m).sum()/(a|m).sum()
    p0=np.array([s0,s0,ox0,oy0])
    print(view,'init',p0,loss(p0))
    if view in ('front','back'):
        r=minimize(loss,p0,method='Nelder-Mead',options={'xatol':0.3,'fatol':1e-5,'maxiter':200,'initial_simplex':[p0,p0+[15,0,0,0],p0+[0,15,0,0],p0+[0,0,6,0],p0+[0,0,0,6]]})
        p=r.x; print(view,'fit',p,r.fun)
    else: p=p0
    res[view]=list(map(float,p))
    a=sil(p); ov=np.zeros((H,W,3),np.uint8); ov[...,1]=m*255; ov[...,2]=a*255
    cv2.imwrite(f'fit_{view}.png',cv2.resize(ov,(W//2,H//2)))
json.dump(res,open('fit.json','w'),indent=1)
