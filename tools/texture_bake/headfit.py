import numpy as np, cv2, json
from raster import load, raster
from scipy.optimize import minimize
V,N,UV,F,g=load('model.glb')
VIEWS={'front':((1,0,0),(0,0,1)),'back':((-1,0,0),(0,0,-1)),'right':((0,0,1),(-1,0,0)),'left':((0,0,-1),(1,0,0))}
fit=json.load(open('fit.json'))
YC=0.865  # compare silhouettes above this height (head, above the beard line/collar)
Fh=F[(V[F][:,:,1]>YC-0.03).all(1)]
out={}
for view,(ax,dz) in VIEWS.items():
    m=cv2.imread(f'mask_{view}.png',0)>0; H,W=m.shape
    X=V@np.array(ax,float); Y=V[:,1]
    sx,sy,ox,oy=fit[view]
    def sil(p):
        s,ox_,oy_=p
        P=np.stack([X*s+ox_,-Y*s+oy_],1)
        t,_,_=raster(P,Fh,W,H); a=t>=0
        cut=int(-YC*s+oy_); a[cut:]=False; return a,cut
    def loss(p):
        a,cut=sil(p); mm=m.copy(); mm[cut:]=False
        return 1-(a&mm).sum()/max(1,(a|mm).sum())
    if view in('right','left'):
        # init: put model head-top on image head-top and match the head's horizontal centre
        s=sy; ys,xs=np.nonzero(m); top=ys.min()
        rows=m[top:top+int(0.1*s)]; cx=np.nonzero(rows.any(0))[0].mean()
        sel=Y>YC; p0=np.array([s, cx-s*X[sel].mean()*1.0 - 0*0, top+s*Y.max()])
        p0[1]=cx-s*(X[sel].min()+X[sel].max())/2
    else: p0=np.array([sy,ox,oy])
    print(view,'init',p0,loss(p0))
    r=minimize(loss,p0,method='Nelder-Mead',options={'xatol':0.2,'fatol':1e-5,'maxiter':300,'initial_simplex':[p0,p0+[20,0,0],p0+[0,4,0],p0+[0,0,4]]})
    print(view,'fit',r.x,r.fun); out[view]=list(map(float,r.x))
    a,cut=sil(r.x); mm=m.copy(); mm[cut:]=False
    y0=max(0,cut-260); ov=np.zeros((H,W,3),np.uint8); ov[...,1]=mm*255; ov[...,2]=a*255
    x0=int(np.nonzero(a.any(0))[0].mean())-130
    cv2.imwrite(f'hfit_{view}.png',ov[y0:cut+10,max(0,x0):x0+260])
json.dump(out,open('headfit.json','w'),indent=1)
