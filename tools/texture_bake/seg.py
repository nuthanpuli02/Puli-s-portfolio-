import numpy as np, cv2, sys
from scipy.ndimage import binary_fill_holes
R='/mnt/user-data/uploads/Puli portfolio cloud images/'
names={'front':'Gemini_Generated_Image_tby4r6tby4r6tby4.jpg','back':'Gemini_Generated_Image_94fd5q94fd5q94fd.jpg','right':'Gemini_Generated_Image_w82uvtw82uvtw82u.jpg','left':'Gemini_Generated_Image_s5w9t0s5w9t0s5w9.jpg'}
for k,f in names.items():
    im=cv2.imread(R+f)
    cv2.imwrite(f'ref_{k}.png',im)
    m=np.zeros(im.shape[:2],np.uint8)
    bg=np.zeros((1,65),np.float64); fg=np.zeros((1,65),np.float64)
    cv2.grabCut(im,m,(20,40,im.shape[1]-40,im.shape[0]-50),bg,fg,6,cv2.GC_INIT_WITH_RECT)
    mask=((m==1)|(m==3)).astype(np.uint8)
    # keep the biggest blob, fill holes
    n,lab,st,_=cv2.connectedComponentsWithStats(mask)
    big=1+np.argmax(st[1:,4]); mask=binary_fill_holes(lab==big).astype(np.uint8)
    ys,xs=np.nonzero(mask); print(k,'bbox x',xs.min(),xs.max(),'y',ys.min(),ys.max())
    cv2.imwrite(f'mask_{k}.png',mask*255)
    ov=im.copy(); ov[mask==0]=(ov[mask==0]*0.3+np.array([0,0,180])*0.7).astype(np.uint8)
    cv2.imwrite(f'maskov_{k}.jpg',cv2.resize(ov,(384,683)))
