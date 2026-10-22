// Kailash bake: upsample the 256² elevation data and add the rock structure the data is too coarse to hold.
// Runs once in a worker. Output: 16-bit height (luminance+alpha) and an attribute map
// (R,G = surface normal x,z; B = cavity/occlusion; A = snow cover), both N×N, same layout as the source.
function bakeKailash(src,N,Y0,SPAN,SIZE){
  const S=256, hs=new Float32Array(S*S);
  for(let i=0;i<S*S;i++){ const h=(src[2*i]*256+src[2*i+1])/65535; hs[i]=Y0+Math.pow(h,1.18)*SPAN; }
  const at=(x,y)=>hs[Math.min(S-1,Math.max(0,y))*S+Math.min(S-1,Math.max(0,x))];
  const cr=(p0,p1,p2,p3,t)=>p1+0.5*t*(p2-p0+t*(2*p0-5*p1+4*p2-p3+t*(3*(p1-p2)+p3-p0)));
  // value noise
  const hash=(x,y)=>{ let h=(x*374761393+y*668265263)|0; h=(h^(h>>>13))*1274126177|0; return ((h^(h>>>16))>>>0)/4294967295; };
  const vn=(x,y)=>{ const ix=Math.floor(x),iy=Math.floor(y); let fx=x-ix,fy=y-iy; fx=fx*fx*(3-2*fx); fy=fy*fy*(3-2*fy);
    const a=hash(ix,iy),b=hash(ix+1,iy),c=hash(ix,iy+1),d=hash(ix+1,iy+1); return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy; };
  const fbm=(x,y,o)=>{ let s=0,a=0.5; for(let i=0;i<o;i++){ s+=a*vn(x,y); x=x*2.03+17.1; y=y*2.03+3.7; a*=0.5; } return s; };
  const ridged=(x,y,o)=>{ let s=0,a=0.5,w=1; for(let i=0;i<o;i++){ let n=1-Math.abs(2*vn(x,y)-1); n*=n*w; w=Math.min(1,n*2); s+=a*n; x=x*2.1+5.3; y=y*2.1+9.1; a*=0.5; } return s; };
  const sst=(a,b,x)=>{ const t=Math.min(1,Math.max(0,(x-a)/(b-a))); return t*t*(3-2*t); };
  const NN=N*N, H=new Float32Array(NN), dx=SIZE/N;
  // 1. bicubic (Catmull-Rom) upsample
  for(let r=0;r<N;r++){ const fy=(r+0.5)*S/N-0.5, iy=Math.floor(fy), ty=fy-iy;
    for(let c=0;c<N;c++){ const fx=(c+0.5)*S/N-0.5, ix=Math.floor(fx), tx=fx-ix;
      const row=k=>cr(at(ix-1,iy+k),at(ix,iy+k),at(ix+1,iy+k),at(ix+2,iy+k),tx);
      H[r*N+c]=cr(row(-1),row(0),row(1),row(2),ty); } }
  const grad=(A,i)=>{ const r=(i/N)|0,c=i-r*N; const l=A[r*N+Math.max(0,c-1)],R=A[r*N+Math.min(N-1,c+1)],u=A[Math.max(0,r-1)*N+c],d=A[Math.min(N-1,r+1)*N+c];
    return [(R-l)/(2*dx),-(d-u)/(2*dx)]; };
  // 1b. crisp ridges: SRTM is smoothed, so arêtes come out rounded. Sharpen at two scales (unsharp mask): crests are
  //     pushed up and narrowed more than hollows are deepened; the summit dome is left alone; nothing below the cloud deck
  { const bl=(A,rad)=>{ const T=new Float32Array(NN), O=new Float32Array(NN), w=2*rad+1;
      for(let r=0;r<N;r++){ let s=0; for(let c=-rad;c<=rad;c++) s+=A[r*N+Math.min(N-1,Math.max(0,c))];
        for(let c=0;c<N;c++){ T[r*N+c]=s/w; s+=A[r*N+Math.min(N-1,c+rad+1)]-A[r*N+Math.max(0,c-rad)]; } }
      for(let c=0;c<N;c++){ let s=0; for(let r=-rad;r<=rad;r++) s+=T[Math.min(N-1,Math.max(0,r))*N+c];
        for(let r=0;r<N;r++){ O[r*N+c]=s/w; s+=T[Math.min(N-1,r+rad+1)*N+c]-T[Math.max(0,r-rad)*N+c]; } }
      return O; };
    let mi=0; for(let i=1;i<NN;i++) if(H[i]>H[mi]) mi=i; const r0=(mi/N)|0, c0=mi-r0*N;
    for(const [rad,kU,kD] of [[30,0.45,0.30],[9,0.80,0.35],[4,0.55,0.25]]){
      const B1=bl(bl(H,rad),rad);
      for(let i=0;i<NN;i++){ const r=(i/N)|0, c=i-r*N, d2=((r-r0)**2+(c-c0)**2)*dx*dx;
        const hn=(H[i]-Y0)/SPAN, D=H[i]-B1[i];
        const m=sst(0.25,0.45,hn)*sst(0.02,0.08,d2);
        H[i]+=(D>0?D*kU:D*kD)*m; } } }
  // coarse steepness (from the smooth data) decides where cliffs and strata go
  const steep=new Float32Array(NN), top=Y0+SPAN;
  for(let i=0;i<NN;i++){ const g=grad(H,i); steep[i]=sst(0.70,1.45,Math.hypot(g[0],g[1])); }
  // 2. strata: Kailash is stacked near-horizontal conglomerate beds. Terrace the steep faces into
  //    cliff bands with narrow ledges; bed height wanders a little and beds break up along their length.
  const SP=0.042, tread=new Float32Array(NN);
  for(let r=0;r<N;r++) for(let c=0;c<N;c++){ const i=r*N+c, x=c*dx, z=(N-r)*dx, y=H[i];
    const st=steep[i]; if(st<0.01) continue;
    const warp=(fbm(x*0.9,z*0.9,3)-0.5)*1.4*SP+x*0.012;
    const s=(y+warp)/SP, fl=Math.floor(s), fr=s-fl;
    const thick=0.18+0.22*vn(fl*3.1,0.5);                 // ledge width varies bed to bed
    const g=sst(thick,1.0,fr);
    const tr=(fl+g)*SP-warp;
    const cont=sst(0.38,0.62,fbm(x*1.6+fl*0.37,z*1.6,3)); // beds fade in and out along the face // beds fade in and out along the face
    const hn=(y-Y0)/SPAN;
    const amt=st*(0.10+0.80*cont)*sst(0.18,0.40,hn)*(1-sst(0.70,0.84,hn));
    H[i]=y+(tr-y)*amt;
    // the tread of each bed (where snow lies) is the flat part of the step, broken into runs along the face
    tread[i]=(1-sst(thick*0.7,thick*1.5,fr))*st*sst(0.20,0.40,hn)*sst(0.40,0.62,fbm(x*5.0+fl*1.7,z*5.0,3)); }
  // 3. ribs and buttresses on the faces, finer crumble everywhere
  for(let r=0;r<N;r++) for(let c=0;c<N;c++){ const i=r*N+c, x=c*dx, z=(N-r)*dx;
    const st=steep[i];
    H[i]+=(ridged(x*7.0,z*7.0,4)-0.35)*0.020*st+(fbm(x*40,z*40,3)-0.5)*0.004*(0.3+st); }
  // the summit is a snow dome, not a spike: cap the top with a smooth minimum against a paraboloid
  { let mi=0; for(let i=1;i<NN;i++) if(H[i]>H[mi]) mi=i; const r0=(mi/N)|0, c0=mi-r0*N, Hs=H[mi];
    for(let r=0;r<N;r++) for(let c=0;c<N;c++){ const i=r*N+c, d2=((r-r0)**2+(c-c0)**2)*dx*dx;
      if(d2>0.09) continue;
      const dome=Hs-0.10-4.5*d2, k=0.05, h=Math.max(k-Math.abs(H[i]-dome),0)/k;
      H[i]+=(Math.min(H[i],dome)-h*h*k*0.25-H[i])*(1-sst(0.03,0.09,d2)); } }
  // 4. water and snowmelt cut gullies: flow accumulation (D8), then carve along the flow lines
  const order=new Uint32Array(NN);
  { let mn=1e9,mx=-1e9; for(let i=0;i<NN;i++){ if(H[i]<mn)mn=H[i]; if(H[i]>mx)mx=H[i]; }
    const B=65536, cnt=new Uint32Array(B+1), key=new Uint32Array(NN);
    for(let i=0;i<NN;i++){ const k=B-1-Math.min(B-1,((H[i]-mn)/(mx-mn)*(B-1))|0); key[i]=k; cnt[k+1]++; }
    for(let k=0;k<B;k++) cnt[k+1]+=cnt[k];
    for(let i=0;i<NN;i++) order[cnt[key[i]]++]=i; }
  // multiple-flow-direction routing: each cell shares its water with every lower neighbour by slope,
  // which gives branching, natural drainage instead of the straight axis lines of single-direction routing
  const acc=new Float32Array(NN).fill(1), wn=new Float32Array(8), jn=new Int32Array(8);
  for(let k=0;k<NN;k++){ const i=order[k], r=(i/N)|0, c=i-r*N; const h=H[i]; let m=0, ws=0;
    for(let dy=-1;dy<=1;dy++) for(let dxx=-1;dxx<=1;dxx++){ if(!dy&&!dxx) continue; const rr=r+dy, cc=c+dxx; if(rr<0||cc<0||rr>=N||cc>=N) continue;
      const j=rr*N+cc, d=(h-H[j])/((dy&&dxx)?1.414:1); if(d>0){ const w=Math.pow(d,1.3); wn[m]=w; jn[m]=j; ws+=w; m++; } }
    for(let q=0;q<m;q++) acc[jn[q]]+=acc[i]*wn[q]/ws; }
  const carve=new Float32Array(NN);
  for(let i=0;i<NN;i++){ const hn=(H[i]-Y0)/SPAN; carve[i]=Math.min(0.026,0.0045*Math.max(0,Math.log(acc[i])-3.0))*sst(0.10,0.35,hn)*(0.4+0.6*steep[i]); }
  const blur=(A,rad,out)=>{ const T=new Float32Array(NN), w=2*rad+1;
    for(let r=0;r<N;r++){ let s=0; for(let c=-rad;c<=rad;c++) s+=A[r*N+Math.min(N-1,Math.max(0,c))];
      for(let c=0;c<N;c++){ T[r*N+c]=s/w; s+=A[r*N+Math.min(N-1,c+rad+1)]-A[r*N+Math.max(0,c-rad)]; } }
    for(let c=0;c<N;c++){ let s=0; for(let r=-rad;r<=rad;r++) s+=T[Math.min(N-1,Math.max(0,r))*N+c];
      for(let r=0;r<N;r++){ out[r*N+c]=s/w; s+=T[Math.min(N-1,r+rad+1)*N+c]-T[Math.max(0,r-rad)*N+c]; } }
    return out; };
  const cv=blur(carve,2,new Float32Array(NN)); blur(cv,1,cv);
  for(let i=0;i<NN;i++) H[i]-=cv[i];
  // 5. the south face's vertical gash: one deep straight couloir from below the summit dome down the face centre
  { let mi=0; for(let i=1;i<NN;i++) if(H[i]>H[mi]) mi=i; const r0=(mi/N)|0, c0=mi-r0*N;
    for(let r=r0;r<N;r++) for(let c=Math.max(0,c0-40);c<Math.min(N,c0+40);c++){ const i=r*N+c;
      const along=(r-r0)*dx, hn=(H[i]-Y0)/SPAN; if(along<0.10) continue;
      const cx=c0+Math.sin(along*3.0)*2.0+along*6, w=4.0+along*16;
      const d=Math.abs(c-cx)/w; if(d>1) continue;
      H[i]-=(1-d*d)*0.045*sst(0.10,0.25,along)*sst(0.30,0.55,hn)*steep[i]; } }
  // 6. normals, cavity, snow
  const nx=new Float32Array(NN), nz=new Float32Array(NN), ny=new Float32Array(NN);
  for(let i=0;i<NN;i++){ const g=grad(H,i), l=Math.hypot(g[0],1,g[1]); nx[i]=-g[0]/l; ny[i]=1/l; nz[i]=-g[1]/l; }
  const b1=blur(H,3,new Float32Array(NN)), b2=blur(H,14,new Float32Array(NN));
  const cav=new Float32Array(NN);
  for(let i=0;i<NN;i++) cav[i]=Math.min(1,Math.max(0,0.62+(H[i]-b1[i])*28+(H[i]-b2[i])*5));
  // smoothed normal: tells a ledge (locally flat) from the face it sits on
  const sny=blur(ny,6,new Float32Array(NN));
  const snow=new Float32Array(NN);
  for(let r=0;r<N;r++) for(let c=0;c<N;c++){ const i=r*N+c, x=c*dx, z=(N-r)*dx, hn=(H[i]-Y0)/SPAN;
    const flat=sst(0.62,0.86,ny[i]);
    const ledge=sst(0.70,0.92,ny[i])*(1-sst(0.55,0.80,sny[i]));        // treads on steep ground
    const couloir=sst(2.6,5.5,Math.log(acc[i]))*sst(0.25,0.45,ny[i]);  // snow slides into and fills the gullies
    const lee=0.15*Math.max(0,nx[i])+0.10*Math.max(0,nz[i]);           // westerly wind loads east and north faces
    const dome=sst(0.70,0.84,hn+(fbm(x*5,z*5,3)-0.5)*0.10)*sst(0.25,0.50,ny[i]);
    let s=flat*0.8+tread[i]*1.3+ledge*0.55+couloir*0.35+lee+(fbm(x*9+3,z*9,3)-0.5)*0.35;
    s*=sst(0.06,0.22,hn);
    snow[i]=Math.min(1,Math.max(0,Math.max(s,dome))); }
  blur(snow,1,snow);
  // pack
  let mn=1e9,mx=-1e9; for(let i=0;i<NN;i++){ if(H[i]<mn)mn=H[i]; if(H[i]>mx)mx=H[i]; }
  const hb=new Uint8Array(NN*2), ab=new Uint8Array(NN*4);
  for(let i=0;i<NN;i++){ const v=Math.round(Math.min(1,Math.max(0,(H[i]-Y0)/(SPAN+0.05)))*65535); hb[2*i]=v>>8; hb[2*i+1]=v&255;
    ab[4*i]=Math.round((nx[i]*0.5+0.5)*255); ab[4*i+1]=Math.round((nz[i]*0.5+0.5)*255); ab[4*i+2]=Math.round(cav[i]*255); ab[4*i+3]=Math.round(snow[i]*255); }
  return {h:hb,a:ab};
}

// CLI: node tools/bake_kailash.js <outdir>  (reads the 256² data from index.html, writes h.bin and a.bin)
if(require.main===module){
  const fs=require('fs'), path=require('path');
  const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  const src=Buffer.from(html.match(/const HM_B64="([^"]+)"/)[1],'base64');
  const out=process.argv[2]||'.', o=bakeKailash(src,1024,-0.37,3.30,5.6);
  fs.writeFileSync(path.join(out,'h.bin'),o.h); fs.writeFileSync(path.join(out,'a.bin'),o.a);
}
