# Generates site/src/assets/cloudbank.webp (+ -flip) for section 2: a tileable cumulus edge, soft, fully opaque at its base.
# Run from any folder: python3 tools/gen_cloudbank.py, then crop the top 30% and save as WebP (see WORKLOG 2026-10-23).
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
W,H=2048,768
def tile_noise(w,h,cells,seed):
    r=np.random.default_rng(seed); g=r.random((cells[1]+2,cells[0]))
    g=np.concatenate([g,g[:,:1]],1)
    ys=np.linspace(0,cells[1],h,endpoint=False); xs=np.linspace(0,cells[0],w,endpoint=False)
    y0=ys.astype(int); x0=xs.astype(int); fy=(ys-y0)[:,None]; fx=(xs-x0)[None,:]
    fy=fy*fy*(3-2*fy); fx=fx*fx*(3-2*fx)
    a=g[y0][:,x0]; b=g[y0][:,x0+1]; c=g[y0+1][:,x0]; d=g[y0+1][:,x0+1]
    return (a*(1-fx)+b*fx)*(1-fy)+(c*(1-fx)+d*fx)*fy
def fbm(w,h,base,oct,seed):
    s=np.zeros((h,w)); amp=1; tot=0
    for o in range(oct):
        s+=amp*tile_noise(w,h,(base[0]*2**o,base[1]*2**o),seed+o); tot+=amp; amp*=.5
    return s/tot
def make(seed,out,level=.55):
    rng=np.random.default_rng(seed); x=np.arange(W)
    edge=np.full(W,level*H)
    def add(n,rmin,rmax,lift):
        nonlocal edge
        e=edge.copy()
        for i in range(n):
            cx=rng.uniform(0,W); r=rng.uniform(rmin,rmax)*H
            cy=np.interp(cx%W,x,e)+r*lift
            for k in (-1,0,1):
                d=x-(cx+k*W); m=np.abs(d)<r
                edge[m]=np.minimum(edge[m],cy-np.sqrt(r*r-d[m]**2))
    add(6,.18,.30,.25); add(24,.07,.12,.45); add(80,.025,.05,.6)
    yy=np.arange(H)[:,None]
    n=fbm(W,H,(16,6),3,seed+5)
    dist=(yy-edge[None,:])+(n-.5)*26
    alpha=np.clip(dist/70+.25,0,1)
    alpha=gaussian_filter(alpha,(9,9),mode=('nearest','wrap'))
    puff=fbm(W,H,(12,5),4,seed+9)
    solid=np.clip((yy/H-.62)/.3,0,1); solid=solid*solid*(3-2*solid)   # fully opaque toward the bottom, so it joins the solid middle without a seam
    alpha=np.clip(alpha*(0.8+0.28*puff),0,1)
    alpha=alpha*(1-solid)+solid
    a=(alpha*255).astype(np.uint8)
    Image.fromarray(np.stack([np.full_like(a,255),a],-1),'LA').save(out,optimize=True)
    bg=Image.new('L',(W,H),60); bg.paste(Image.new('L',(W,H),230),(0,0),Image.fromarray(a)); bg.resize((1024,384)).save(out.replace('.png','-prev.png'))
make(3,'cloudbank.png',.70)
