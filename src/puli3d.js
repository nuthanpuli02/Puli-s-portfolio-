/* Puli, voxel edition. Builds a 3D cube model from the pixel character sheet (front, back and side views),
   rigs it (body, head, two arms, two legs), lights it with the same sun or moon as the cloud scene,
   and flies it after the pointer. The left arm (with the watch) always points at the pointer; a click fires the laser. */
window.PuliChar=function(gl,mainBuf){
  const P={skin:['#d29d73','#bb8159','#9a6643'],hair:'#141218',hairHi:'#3b3a52',hairMid:'#24222d',brow:'#1a1214',
   stub:'#432719',eyeW:'#d8cdc3',iris:'#0c0909',glint:'#d9d4d0',mouth:'#7a4636',
   olive:['#727d47','#59623a','#424a2b'],oliveP:'#4c5432',watch:'#0b0b0e',face:'#5f7088',
   shoeW:'#f0eee7',shoeS:'#d0cdc3',collar:'#383a41',shoeG:'#9a9ca3',sole:'#e4d9bd',soleB:'#54565d',lace:'#c4c4c9',
   tank:['#f3eedc','#e0d9c2','#b8b098'],band:'#3f414b',pack:['#767c8c','#5c6170','#444855'],noz:'#24262c'};
  const HOOD={day:{c:['#3e3e4b','#2a2a33','#1c1c23'],dark:'#121217',str:'#d8d5de'},
              night:{c:['#ffffff','#e6e3ec','#c4bfcf'],dark:'#a39db2',str:'#8a8498'}};
  const ACC={day:['#fff3c9','#f2b84b','#c4831c'],night:['#efe4ff','#a77bff','#6f45d6']};
  const KEY={H:P.hair,h:P.hairHi,m:P.hairMid,S:P.skin[1],k:P.skin[0],s:P.skin[2],D:P.brow,b:P.stub,w:P.eyeW,E:P.iris,q:P.glint,M:P.mouth};
  const HEAD_F=["......HHHHHH.....","...HHHHhhhhHHH...","..HHHHHHHhhhhHHH.",".HHHHmHHHHHHhhHHH",".HHHmHHHHHHHHHHHH",".HHHSHHHHHHHHHHH.",".HHSSSSHHHHHHHH..",".HSSSSSHSSHSSSH..",".HSDDDDHSDDDDSs..",".SSssssSSssssSs..","sSSwEEwSSwEEwSSs.","sSSSEESSSSEESSss.",".SkSSSSssSSSSSs..",".bSSSSSSSSSSSSb..","..bSSbbbbbbSSb...","..bbbSMMMMSbbb...","...bbSSSSSSbb....","....bbbbbbbb.....","......bbbb......."];
  const HEAD_B=[".....HHHHHHH....","..HHHhhhhhHHHH..",".HHHHhhmhhhHHHH.","HHHHHHmHHHhhHHHH","HHmHHHHHHHHHHHHH","HHHHHHHHHmHHHHHH",".HHHHHHHHHHHHHH.",".HHHHHHHHHHHHHH.",".HHHmHHHHHHHmHH.",".HHHHHHHHHHHHHH.","sHHHHHHHHHHHHHHs","sHHHHHHHHHHHHHHs",".HHHHHHHHHHHHHH.","..HHHHHHHHHHHH..","...bHHHHHHHHb...","....sSSSSSSs....",".....SSSSSS....."];
  const HEAD_S=["....HHHHHHH.....","..HHHHHhhhhHH...",".HHHHHHHHhhhHHH.","HHHHHHHHHHHHmHHH","HHHHHHHHHHHHHHH.","HHHHHHHHHHHHH...","HHHHHHHHHHSSSS..","HHHHHHHHSSSSSSS.","HHHHHHHSSSSSDDS.","HHHHHssSSSSSSSS.","HHHHsSssSSSSwES.","HHHHsSssSSSSSES.","HHHHHssSSSkSSSSS",".HHHHbSSSSSSSSs.","..HHsbSSSSSbbbS.","...ssbSSSSbSMMS.","...ssbbSSSbbbbS.","....sbbbbbbbbbb.",".....sbbbbbbbb.."];

  for(let i=0;i<HEAD_S.length;i++)HEAD_S[i]=HEAD_S[i].replace(/[wEDMq]/g,'S');
  class Spr{constructor(only){this.w=48;this.h=80;this.only=only;this.part='';this.g=Array.from({length:80},()=>Array(48).fill(null))}
    p(x,y,c){if(this.only&&this.part!==this.only)return;if(x>=0&&y>=0&&x<48&&y<80)this.g[y][x]=c}
    r(x,y,w,h,c){for(let j=0;j<h;j++)for(let i=0;i<w;i++)this.p(x+i,y+j,c)}
    rs(x,y,w,h,c){this.r(x,y,w,h,c[1]);this.r(x,y,1,h,c[0]);this.r(x+w-1,y,1,h,c[2])}
    map(rows,ox,oy){rows.forEach((row,j)=>[...row].forEach((ch,i)=>{if(ch!=='.'&&KEY[ch])this.p(ox+i,oy+j,KEY[ch])}))}}
  function tank(s,x,y,h){s.rs(x,y,6,h,P.tank);s.r(x+1,y-1,4,1,P.tank[1]);s.r(x,y+2,6,1,P.band);s.r(x,y+4,6,1,P.band);s.r(x,y+h-3,6,1,P.band);s.r(x+1,y+h,4,2,P.noz)}
  function chevrons(s,x,y,A){for(let k=0;k<2;k++){const yy=y+k*3;s.p(x,yy,A[1]);s.p(x+1,yy+1,A[0]);s.p(x+2,yy+2,A[0]);s.p(x+3,yy+2,A[0]);s.p(x+4,yy+1,A[0]);s.p(x+5,yy,A[1]);s.p(x+2,yy+1,A[1]);s.p(x+3,yy+1,A[1])}}
  function torsoRows(s,H){for(let y=21;y<=43;y++){const t=Math.max(0,Math.min(1,(y-24)/12)),d=Math.round(t*2),l=13+d,r=34-d;s.r(l,y,r-l+1,1,H.c[1]);s.p(l,y,H.c[0]);s.p(r,y,H.c[2])}}
  function front(t,back,only){const s=new Spr(only),H=HOOD[t],A=ACC[t];
    s.part='legs';s.rs(15,44,18,7,P.olive);s.rs(15,50,8,19,P.olive);s.rs(25,50,8,19,P.olive);s.r(23,47,2,3,P.olive[2]);
    const pk=[P.olive[1],P.oliveP,P.olive[2]];s.rs(14,53,3,7,pk);s.r(14,53,3,1,P.olive[2]);s.rs(31,53,3,7,pk);s.r(31,53,3,1,P.olive[2]);
    s.r(17,63,5,1,P.olive[2]);s.r(26,63,5,1,P.olive[2]);
    s.part='shoe';for(const x of[13,25]){s.r(x+2,69,6,2,P.collar);s.r(x,71,10,6,P.shoeW);s.r(x+9,71,1,6,P.shoeS);
      if(back)s.r(x+3,71,4,3,P.shoeG);else{s.r(x+3,71,4,4,P.lace);s.r(x+4,72,2,1,P.shoeS);s.r(x+4,74,2,1,P.shoeS)}
      s.r(x,76,10,1,P.shoeS);s.r(x,77,10,1,P.sole);s.r(x,78,10,1,P.soleB)}
    s.part='torso';torsoRows(s,H);s.r(14,22,5,2,H.c[0]);s.r(29,22,5,2,H.c[0]);s.r(15,42,18,2,H.c[2]);
    s.part='arm';s.rs(9,23,4,18,H.c);s.rs(35,23,4,18,H.c);s.r(10,22,3,1,H.c[1]);s.r(35,22,3,1,H.c[1]);
    s.r(9,40,4,2,H.c[2]);s.r(35,40,4,2,H.c[2]);s.rs(9,42,4,4,P.skin);s.rs(35,42,4,4,P.skin);
    s.part='watch';const wx=back?9:35;s.r(wx,39,4,2,P.watch);s.r(wx+1,39,2,1,P.face);
    if(!back){s.part='torso';s.r(17,19,14,3,H.c[2]);s.r(20,19,8,2,P.skin[2]);
      s.r(17,29,6,1,H.c[2]);s.r(25,29,6,1,H.c[2]);s.r(23,25,2,5,H.c[2]);s.r(20,23,1,7,H.str);s.r(27,23,1,7,H.str);
      s.r(17,34,14,1,H.dark);s.r(16,35,1,5,H.dark);s.r(31,35,1,5,H.dark);s.r(15,21,1,5,P.band);s.r(32,21,1,5,P.band);
      s.part='head';s.map(HEAD_F,16,1)}
    else{s.part='hood';s.rs(18,19,12,4,H.c);
      s.part='pack';s.rs(17,23,14,16,P.pack);s.r(18,24,12,1,P.pack[0]);chevrons(s,21,28,A);s.r(18,37,12,1,P.pack[2]);
      s.part='tank';tank(s,11,21,21);tank(s,31,21,21);s.part='head';s.map(HEAD_B,16,3)}
    return s}
  function side(t,only){const s=new Spr(only),H=HOOD[t],A=ACC[t];
    s.part='tank';tank(s,5,21,21);
    s.part='pack';s.rs(10,23,5,16,P.pack);s.r(11,27,1,1,A[0]);s.r(11,28,1,5,A[1]);
    s.part='legs';s.rs(16,44,9,25,P.olive);s.rs(18,53,5,7,[P.olive[1],P.oliveP,P.olive[2]]);s.r(18,53,5,1,P.olive[2]);s.r(18,63,5,1,P.olive[2]);
    s.part='shoe';s.r(16,69,8,2,P.collar);s.r(15,71,9,1,P.shoeW);s.r(14,72,15,4,P.shoeW);s.r(14,71,3,5,P.shoeG);s.r(20,71,3,2,P.collar);
    s.r(16,75,12,1,P.shoeS);s.r(14,76,15,1,P.sole);s.r(14,77,15,1,P.soleB);s.r(14,78,15,1,P.soleB);
    s.part='hood';s.rs(13,17,6,6,H.c);
    s.part='torso';for(let y=19;y<=43;y++){const bk=14+(y>30?1:0),fr=y<23?25:y<31?26:y<36?25:24;s.r(bk,y,fr-bk+1,1,H.c[1]);s.p(bk,y,H.c[0]);s.p(fr,y,H.c[2])}
    s.r(15,42,10,2,H.c[2]);s.r(17,21,2,10,P.band);s.r(19,19,5,3,P.skin[2]);
    s.part='arm';s.rs(19,22,4,24,H.c);s.r(19,40,4,2,H.c[2]);s.rs(19,42,4,4,P.skin);
    s.part='watch';s.r(19,39,4,2,P.watch);s.r(20,39,2,1,P.face);
    s.part='head';s.map(HEAD_S,13,2);return s}

  const PARTS=['torso','legs','shoe','hood','pack','tank','arm','watch','head'];
  const GROUPS=['root','jet','head','armR','armL','legR','legL'];
  // voxel (x,y,z) -> model units: x right, y up, z toward the viewer
  const OX=24,OY=40,OZ=19;
  const PIV={root:[24,40,19],jet:[24,40,19],head:[24,21,20.5],armR:[11,23,21],armL:[37,23,21],legR:[19,49,20.5],legL:[29,49,20.5]};
  const toM=(x,y,z)=>[x-OX,OY-y,z-OZ];
  const hex=h=>{const n=parseInt(h.slice(1),16);return[(n>>16)/255,(n>>8&255)/255,(n&255)/255]};

  function build(t){
    const N=48,occ=new Int8Array(N*80*N).fill(-1),idx=(x,y,z)=>(y*N+z)*N+x;
    const views={};
    const HC=new Map(),HI=PARTS.indexOf('head');
    // blocky head: a near-square box with the face sculpted in cubes
    (function(){
      const set=(x,y,z,c)=>{if(x<0||y<0||z<0||x>=N||y>=80||z>=N)return;const i=idx(x,y,z);if(c===null){occ[i]=-1;HC.delete(i)}else{occ[i]=HI;HC.set(i,c)}};
      const fm=(x,y)=>{const r=HEAD_F[y-1],c=x-16;if(!r||c<0||c>=r.length)return null;const ch=r[c];return ch==='.'?null:ch};
      const hairAt=(x,y,z)=>{const d=x-z*0.6;if(y<=1&&d>3&&d<6)return P.hairHi;if(y<=2&&(d>=6&&d<7||d>-1&&d<0.5))return P.hairMid;return P.hair};
      // core: 14 wide, 16 tall, 14 deep
      for(let y=4;y<=19;y++)for(let x=17;x<=30;x++)for(let z=14;z<=27;z++)set(x,y,z,P.skin[1]);
      // face plane carries the drawn face; lower corners become beard so the jaw stays square
      // trimmed beard as one solid shape: moustache, lips, then full cover from the mouth down and along the jaw edges
      const BK='#2c2528';const beard=(x,y)=>y===15&&x>=21&&x<=26?BK:y===16?(x>=21&&x<=26?P.mouth:(x<=20||x>=27)?BK:null):y===17?(x>=21&&x<=26?null:BK):y>=18?BK:null;
      for(let y=4;y<=19;y++)for(let x=17;x<=30;x++){const ch=fm(x,y),bd=y>=13?beard(x,y):null;set(x,y,27,bd||(ch&&ch!=='b'&&ch!=='M'?KEY[ch]:P.skin[1]))}
      // relief: beard, brows and fringe stand out one cube; eyes sit one cube in
      for(let y=4;y<=19;y++)for(let x=17;x<=30;x++){const ch=fm(x,y);
        if(ch==='D')set(x,y,28,KEY[ch]);
        else if(ch==='w'||ch==='E'||ch==='q'){set(x,y,27,null);set(x,y,26,KEY[ch])}
        else if((ch==='H'||ch==='h'||ch==='m')&&y>=6)set(x,y,28,KEY[ch])}
      // nose
      set(23,12,28,P.skin[1]);set(24,12,28,P.skin[1]);set(23,13,28,P.skin[1]);set(24,13,28,P.skin[2]);set(23,13,29,P.skin[1]);set(24,13,29,P.skin[2]);
      // hair shell: volume on top swept to one side, back, sides above the ears
      for(let x=16;x<=31;x++)for(let z=13;z<=28;z++)set(x,3,z,hairAt(x,3,z));
      for(let x=17;x<=31;x++)for(let z=14;z<=28;z++)set(x,2,z,hairAt(x,2,z));
      for(let x=19;x<=31;x++)for(let z=15;z<=27;z++)set(x,1,z,hairAt(x,1,z));
      for(let x=22;x<=30;x++)for(let z=17;z<=26;z++)set(x,0,z,hairAt(x,0,z));
      for(let y=4;y<=16;y++)for(let x=16;x<=31;x++)set(x,y,13,hairAt(x,y,13));
      for(const sx of[16,31])for(let z=13;z<=28;z++)for(let y=4;y<=10;y++)set(sx,y,z,hairAt(sx,y,z));
      for(let z=14;z<=28;z++)for(let y=4;y<=6;y++)set(32,y,z,hairAt(32,y,z));
      for(const sx of[16,31]){for(let y=11;y<=13;y++){for(let z=18;z<=21;z++)set(sx,y,z,P.skin[1])}
        set(sx,12,19,P.skin[2]);
        const cx=sx===16?17:30;// sideburn: a strip just in front of the ear, from the hair down into the jaw
        for(let y=11;y<=19;y++)for(let z=22;z<=27;z++){const strip=z<=24,jaw=y>=16;if(strip||jaw)set(cx,y,z,'#2c2528')}}
      for(let x=17;x<=30;x++)for(let z=23;z<=27;z++)set(x,19,z,'#2c2528');
    })();
    PARTS.forEach((pn,pi)=>{if(pn==='head')return;const F=front(t,false,pn),B=front(t,true,pn),S=side(t,pn);views[pn]={F,B,S};
      for(let y=0;y<80;y++)for(let x=0;x<N;x++){if(!F.g[y][x]&&!B.g[y][47-x])continue;
        for(let z=0;z<N;z++)if(S.g[y][z]&&occ[idx(x,y,z)]!==HI)occ[idx(x,y,z)]=pi}});
    const get=(x,y,z)=>x<0||y<0||z<0||x>=N||y>=80||z>=N?-1:occ[idx(x,y,z)];
    const solid=(x,y,z)=>get(x,y,z)>=0;
    const groupOf=(pn,x,y)=>(pn==='tank'||pn==='pack')?'jet':pn==='head'?'head':(pn==='arm'||pn==='watch')?(x<24?'armR':'armL'):(pn==='shoe'||(pn==='legs'&&y>=50))?(x<24?'legR':'legL'):'root';
    const acc=new Set(ACC[t].map(c=>c.toLowerCase()));
    const out={};GROUPS.forEach(g=>out[g]=[]);
    // face dirs: [axis, sign]
    const DIRS=[[0,1],[0,-1],[1,1],[1,-1],[2,1],[2,-1]];
    for(let y=0;y<80;y++)for(let z=0;z<N;z++)for(let x=0;x<N;x++){const pi=occ[idx(x,y,z)];if(pi<0)continue;
      const pn=PARTS[pi],hcol=pi===HI?HC.get(idx(x,y,z)):null,V=views[pn]||{},fc=hcol||V.F.g[y][x],bc=hcol||V.B.g[y][47-x],sc=hcol||V.S.g[y][z],g=groupOf(pn,x,y),arr=out[g],pv=PIV[g],pvm=toM(...pv);
      for(const[a,sg]of DIRS){const n=[0,0,0];n[a]=sg;
        // sprite y grows downward, so "up" in model space is -y in voxel space
        const nx=x+(a===0?sg:0),ny=y+(a===1?-sg:0),nz=z+(a===2?sg:0);if(solid(nx,ny,nz))continue;
        let col=a===2?(sg>0?(fc||sc||bc):(bc||sc||fc)):a===0?(sc||fc||bc):(fc||sc||bc);
        const e=acc.has(col.toLowerCase())?1:0;const rgb=hex(col);
        const b=a===0?2:0,c=a===2?1:2;// two in-plane axes (in model axis indices)
        const ax=[0,1,2].filter(k=>k!==a);
        const corners=[[0,0],[1,0],[1,1],[0,1]];
        const vs=corners.map(([cu,cv])=>{
          // model-space corner of the voxel face
          const m=[x-OX,OY-y-1,z-OZ];// min corner in model space (voxel spans +1 in each model axis)
          const pnt=[m[0],m[1],m[2]];pnt[a]+=sg>0?1:0;pnt[ax[0]]+=cu;pnt[ax[1]]+=cv;
          // AO: neighbours in front of the face toward this corner
          const off=(k,dv)=>{const o=[0,0,0];o[k]=dv;return o};
          const du=off(ax[0],cu?1:-1),dv=off(ax[1],cv?1:-1);
          const q=(o)=>solid(nx+o[0],ny-o[1],nz+o[2])?1:0;
          const s1=q(du),s2=q(dv),cr=q([du[0]+dv[0],du[1]+dv[1],du[2]+dv[2]]);
          const ao=s1&&s2?0:3-(s1+s2+cr);
          return [pnt[0]-pvm[0],pnt[1]-pvm[1],pnt[2]-pvm[2],ao]});
        const tri=(sg>0)!==(a===1)?[0,1,2,0,2,3]:[0,2,1,0,3,2];
        // flip the quad diagonal when AO is uneven (avoids the classic AO seam)
        const flip=vs[0][3]+vs[2][3]<vs[1][3]+vs[3][3];
        const order=flip?tri.map(i=>(i+1)%4):tri;
        for(const i of order){const v=vs[i];arr.push(v[0],v[1],v[2],rgb[0],rgb[1],rgb[2],n[0],n[1],n[2],[0.52,0.68,0.84,1][v[3]],e)}}}
    const meshes={};for(const g of GROUPS){const d=new Float32Array(out[g]);const bf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,bf);gl.bufferData(gl.ARRAY_BUFFER,d,gl.STATIC_DRAW);meshes[g]={bf,n:d.length/11}}
    return meshes}

  // ---------- GL program ----------
  const VS=`attribute vec3 aP,aC,aN;attribute vec2 aE;uniform mat4 uM,uP;uniform vec2 uShift;
  varying vec3 vC,vN,vV,vW;varying vec2 vE;
  void main(){vec4 v=uM*vec4(aP,1.0);vV=v.xyz;vW=aP;gl_Position=uP*v;gl_Position.xy+=uShift*gl_Position.w;vC=aC;vN=normalize(mat3(uM)*aN);vE=aE;}`;
  const FS=`precision mediump float;varying vec3 vC,vN,vV,vW;varying vec2 vE;
  uniform vec3 uL,uSun,uSky,uGnd,uRimL,uRim,uFog;uniform float uFogA,uGlow,uFogD,uDap,uT,uNG;
  float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hs(i),hs(i+vec2(1.0,0.0)),f.x),mix(hs(i+vec2(0.0,1.0)),hs(i+vec2(1.0,1.0)),f.x),f.y);}
  void main(){vec3 N=normalize(vN);float d=max(dot(N,uL),0.0);
    if(uDap>0.0){float n=vn(vW.xz/170.0+vec2(uT*0.04,uT*0.02))*0.65+vn(vW.xz/55.0-vec2(uT*0.03,0.0))*0.35;d*=mix(1.0,smoothstep(0.42,0.66,n)*1.7+0.12,uDap);}
    vec3 hemi=mix(uGnd,uSky,N.y*0.5+0.5);
    vec3 c=vC*(uSun*d+hemi)*vE.x;
    c+=vC*uRim*max(dot(N,uRimL),0.0);
    float e=vE.y>1.5?uNG:vE.y;
    c=mix(c,vC*uGlow,e);
    float fd=1.0-exp(-length(vV)*uFogD);
    c=mix(c,uFog,max(uFogA*(1.0-e*0.6),fd*(1.0-e*0.35)));
    gl_FragColor=vec4(c,1.0);}`;
  function sh(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s}
  const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));
  ['aP','aC','aN','aE'].forEach((n,i)=>gl.bindAttribLocation(pr,i,n));gl.linkProgram(pr);
  const U={};['uM','uP','uShift','uL','uSun','uSky','uGnd','uRimL','uRim','uFog','uFogA','uGlow','uFogD','uDap','uT','uNG'].forEach(n=>U[n]=gl.getUniformLocation(pr,n));
  const MESH={day:build('day'),night:build('night')};
  // ---------- birds: small voxel swallows ----------
  function boxMesh(list){const d=[];for(const[x0,y0,z0,x1,y1,z1,c]of list){const rgb=hex(c),mn=[x0,y0,z0],mx=[x1,y1,z1];
      for(const[a,sg]of[[0,1],[0,-1],[1,1],[1,-1],[2,1],[2,-1]]){const n=[0,0,0];n[a]=sg;const ax=[0,1,2].filter(k=>k!==a);
        const cs=[[0,0],[1,0],[1,1],[0,1]].map(([u,v])=>{const q=[0,0,0];q[a]=sg>0?mx[a]:mn[a];q[ax[0]]=u?mx[ax[0]]:mn[ax[0]];q[ax[1]]=v?mx[ax[1]]:mn[ax[1]];return q});
        for(const i of[0,1,2,0,2,3]){const q=cs[i];d.push(q[0],q[1],q[2],rgb[0],rgb[1],rgb[2],n[0],n[1],n[2],1,0)}}}
    const bf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,bf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(d),gl.STATIC_DRAW);return{bf,n:d.length/11}}
  const BC={back:'#2c3140',belly:'#e6e1d6',wing:'#3a4254',tip:'#1a1d25',beak:'#e3a43c',eye:'#0a0a0c',throat:'#b4553a'};
  const BIRD={
    body:boxMesh([[-3,-1,-1,3,1,1,BC.back],[-3,-1.6,-0.9,2.5,-1,0.9,BC.belly],[3,-0.6,-0.9,5,1.4,0.9,BC.back],[3.2,-0.9,-0.8,4.6,-0.4,0.8,BC.throat],
      [5,0,-0.4,6.4,0.7,0.4,BC.beak],[4.2,0.5,0.9,4.8,1.1,1.05,BC.eye],[4.2,0.5,-1.05,4.8,1.1,-0.9,BC.eye],
      [-6,-0.2,-0.9,-3,0.6,0.9,BC.back],[-8.5,0,-1.7,-6,0.5,-0.4,BC.tip],[-8.5,0,0.4,-6,0.5,1.7,BC.tip]]),
    wingL:boxMesh([[-1.5,-0.25,0,1.8,0.25,4,BC.wing],[-2.5,-0.25,4,1.2,0.25,7,BC.wing],[-3.5,-0.25,7,0.4,0.25,9,BC.tip]]),
    wingR:boxMesh([[-1.5,-0.25,-4,1.8,0.25,0,BC.wing],[-2.5,-0.25,-7,1.2,0.25,-4,BC.wing],[-3.5,-0.25,-9,0.4,0.25,-7,BC.tip]])};
  gl.bindBuffer(gl.ARRAY_BUFFER,mainBuf);
  // ---------- forest floor: moss-covered roots and arches in soft mist ----------
  const sstep=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
  const HP='#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
  const NOISE=`float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hs(i),hs(i+vec2(1.0,0.0)),f.x),mix(hs(i+vec2(0.0,1.0)),hs(i+vec2(1.0,1.0)),f.x),f.y);}`;
  const mkProg=(vs,fs,attrs)=>{const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,vs));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs));attrs.forEach((a,i)=>gl.bindAttribLocation(p,i,a));gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));const u={};const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);for(let i=0;i<n;i++){const a=gl.getActiveUniform(p,i);u[a.name]=gl.getUniformLocation(p,a.name)}return{p,u}};
  // moss shells: the surface is drawn many times, each layer pushed out along the normal; strands are cut out by noise
  const MOSS=mkProg(`attribute vec3 aP,aN;attribute vec2 aUV;attribute float aF;uniform mat4 uV,uP;uniform mediump float uS;uniform float uT,uPush;
    varying vec3 vN,vVp,vW;varying vec2 vUV;varying float vF;
    void main(){float s=uS;vF=aF;vec3 p=aP+aN*aF*s;p.y-=aF*0.35*s*s;p.x+=sin(uT*1.3+aP.z*0.01+aP.x*0.013)*aF*0.25*s*s;if(abs(aF-4.5)>0.01&&aF<20.0)p.z-=uPush;
      vec4 v=uV*vec4(p,1.0);vVp=v.xyz;vW=p;vN=aN;vUV=aUV;gl_Position=uP*v;}`,
    HP+NOISE+`uniform mediump float uS;uniform float uDens,uFogD,uHF,uFlat,uFogO,uNight,uObG,uTileX,uShade;uniform vec4 uGapA,uGapB;uniform vec3 uL,uSun,uSky,uGnd,uFog,uTip,uBase,uCam;varying vec3 vN,vVp,vW;varying vec2 vUV;varying float vF;
    void main(){
      if(uFlat>0.5){vec2 q=vUV;float n1=vn(q*0.0016),n2=vn(q*0.035),n3=vn(q*0.11),lf=n2*0.6+n3*0.4;
        vec3 N=normalize(vN);if(dot(N,vW-uCam)>0.0)N=-N;float hx=vn((q+vec2(3.0,0.0))*0.035)-n2,hz=vn((q+vec2(0.0,3.0))*0.035)-n2;N=normalize(N+vec3(-hx,0.0,-hz)*7.0);
        vec3 alb=mix(vec3(0.05,0.10,0.04),vec3(0.36,0.50,0.15),lf);alb=mix(alb,alb*vec3(1.25,1.15,0.6),smoothstep(0.6,0.85,n1));
        float wrap=clamp((dot(N,uL)+0.45)/1.45,0.0,1.0);vec3 hemi=mix(uGnd,uSky,N.y*0.5+0.5);vec3 c=alb*(uSun*wrap+hemi)*(0.5+0.5*lf)*mix(0.35,1.12,clamp((vW.y-2320.0)/240.0,0.0,1.0));
        float dist=max(length(vVp)-uFogO,0.0),fog=1.0-exp(-dist*uFogD);gl_FragColor=vec4(mix(c,uFog,clamp(fog,0.0,1.0)),1.0);return;}
      float edge=1.0;if(abs(vF-4.5)<0.01&&vW.z>-110.0){float wx=vW.x+uTileX;vec4 A=uGapA,B=uGapB;
        if((wx>A.x&&wx<A.y)||(wx>A.z&&wx<A.w)||(wx>B.x&&wx<B.y)||(wx>B.z&&wx<B.w))discard;
        float dg=min(min(min(abs(wx-A.x),abs(wx-A.y)),min(abs(wx-A.z),abs(wx-A.w))),min(min(abs(wx-B.x),abs(wx-B.y)),min(abs(wx-B.z),abs(wx-B.w))));edge=mix(0.35,1.0,smoothstep(0.0,40.0,dg));}
      float leafy=step(20.0,vF);vec2 g=vUV*uDens*mix(1.0,0.085,leafy),cell=floor(g),f=fract(g)-0.5;float h=hs(cell);vec2 jit=vec2(hs(cell+7.1),hs(cell+3.3))-0.5;
      float clump=vn(vUV*mix(0.07,0.006,leafy))*0.6+vn(vUV*mix(0.23,0.02,leafy))*0.4,hgt=(0.45+0.55*h)*(0.5+0.65*clump);
      if(uS>0.0&&leafy<0.5){float r=1.0-uS/hgt;if(r<=0.0)discard;if(length(f-jit*0.45)>0.56*r)discard;}
      if(uS>0.0&&leafy>0.5){if(length(vVp)>1900.0)discard;float ly=floor(uS*16.0);vec2 g2=vUV*uDens*0.07+ly*vec2(0.37,0.61),c2=floor(g2),f2=fract(g2)-0.5;
        float cl=vn(vUV*0.006);if(hs(c2*1.7+ly)>(1.08-uS)*(0.5+0.6*cl)||length(f2)>0.5)discard;hgt=1.0;}
      float k=clamp(uS/max(hgt,0.01),0.0,1.0);
      vec3 tip=mix(uTip,mix(vec3(0.30,0.46,0.14),vec3(0.52,0.58,0.20),hs(cell+1.3)),leafy),bse=mix(uBase,vec3(0.04,0.09,0.035),leafy);
      vec3 base=mix(bse,tip,k*0.85+0.1);if(leafy>0.5&&uS<0.001)base=tip*0.6;
      base*=0.72+0.55*vn(vUV*0.03+13.0);
      base=mix(base,base*vec3(1.2,1.12,0.62),smoothstep(0.55,0.82,vn(vUV*0.012+4.0)));
      vec3 N=normalize(vN);if(leafy>0.5&&dot(N,vW-uCam)>0.0)N=-N;float wrap=clamp((dot(N,uL)+0.45)/1.45,0.0,1.0);
      vec3 hemi=mix(uGnd,uSky,N.y*0.5+0.5);
      vec3 c=base*(uSun*wrap+hemi)*mix(mix(0.32,0.7,leafy),1.0,uS)*edge;
      c+=uTip*uSun*0.22*uS*uS*clamp(0.3-dot(N,uL),0.0,1.0);
      float dist=max(length(vVp)-uFogO,0.0),fog=1.0-exp(-dist*uFogD),hf=exp(-max(vW.y,0.0)/240.0)*uHF*(1.0-exp(-dist*0.0011));
      vec3 em=vec3(0.0);
      if(uNight>0.01&&leafy<0.5){vec2 wq=vW.xz*0.0065+vec2(vW.y*0.009,vW.y*0.004);float pn=vn(wq)*0.6+vn(wq*3.1+5.0)*0.4;
        vec3 gc=mix(vec3(0.05,0.95,0.85),vec3(0.50,0.30,1.0),smoothstep(0.35,0.7,vn(vW.xz*0.0011+9.0)));
        float pch=smoothstep(0.60,0.72,pn),pool=smoothstep(0.45,0.72,pn);
        c+=gc*pool*0.16*uNight*(0.5+uS);
        em=gc*pch*step(0.3,h)*(0.12+0.88*uS*uS)*2.4*uNight;
        if(uObG>1.5)em+=uTip*(0.3+0.7*uS)*uNight*1.6;
        if(uShade>0.0){c*=0.12;em=vec3(0.55,0.25,1.0)*pow(1.0-clamp(abs(N.z),0.0,1.0),1.5)*uShade*(0.4+0.6*uS)*1.4;}
        if(uObG>0.5){vec3 oc=vec3(0.35,1.0,0.80);float rimo=pow(1.0-clamp(abs(N.z),0.0,1.0),2.0);em+=oc*(0.38+1.4*rimo)*(0.3+0.7*uS)*step(0.25,h)*uNight;}}
      gl_FragColor=vec4(mix(c,uFog,clamp(fog+hf,0.0,1.0))+em*(1.0-0.8*clamp(fog+hf,0.0,1.0)),1.0);}`,['aP','aN','aUV','aF']);
  // ferns (and the butterfly, uKind=1): alpha-cut quads with a procedural leaf shape
  const FERN=mkProg(`attribute vec3 aP,aC;attribute vec2 aUV;uniform mat4 uV,uP;uniform float uT;varying vec2 vUV;varying vec3 vVp;varying float vSeed;
    void main(){vec3 p=aP;float w=aUV.y*aUV.y;p.x+=sin(uT*1.6+aC.x*0.02)*w*5.0;p.z+=cos(uT*1.3+aC.z*0.02)*w*3.0;
      vUV=aUV;vSeed=fract(aC.x*0.131+aC.z*0.071);vec4 v=uV*vec4(p,1.0);vVp=v.xyz;gl_Position=uP*v;}`,
    HP+`uniform float uKind,uFogD,uNightF;uniform vec3 uSun,uSky,uFog,uGlowC;varying vec2 vUV;varying vec3 vVp;varying float vSeed;
    void main(){float x=vUV.x,y=vUV.y;vec3 c;
      if(uKind>0.5){float d=length(vec2(x-0.5,(y-0.5)*1.15));if(d>0.5)discard;c=uGlowC*(1.25-d);gl_FragColor=vec4(c,1.0);return;}
      float wd=(1.0-y)*0.95*smoothstep(0.0,0.14,y)+0.04,lob=abs(fract(y*11.0)-0.5)*2.0,leaf=wd*(1.0-lob*0.75)*(0.55+0.45*smoothstep(0.0,0.6,abs(x)*0.0+fract(y*11.0)));
      if(abs(x)>leaf)discard;
      float stem=1.0-smoothstep(0.03,0.09,abs(x));
      vec3 alb=mix(vec3(0.10,0.20,0.06),vec3(0.30,0.46,0.14),0.25+y*0.5+vSeed*0.25)*(1.0-stem*0.35);
      c=alb*(uSun*0.75+uSky*0.9);
      float fog=1.0-exp(-length(vVp)*uFogD);vec3 fe=mix(vec3(0.1,1.0,0.8),vec3(0.6,0.4,1.0),vSeed)*smoothstep(0.3,1.0,y)*(0.5+0.5*stem)*uNightF*step(0.25,vSeed)*2.0;
      gl_FragColor=vec4(mix(c,uFog,fog)+fe*(1.0-0.7*fog),1.0);}`,['aP','aUV','aC']);
  // points: white flower heads (uMode 0) and drifting pollen / fireflies (uMode 1)
  const PTS=mkProg(`attribute vec3 aP;attribute vec2 aS;uniform mat4 uV,uP;uniform float uT,uPx;uniform mediump float uMode;varying mediump float vA,vFogd;
    void main(){vec3 p=aP;vA=1.0;if(uMode>0.5&&uMode<1.5){p+=vec3(sin(uT*0.3+aS.y*30.0)*40.0,sin(uT*0.23+aS.y*17.0)*25.0,cos(uT*0.27+aS.y*11.0)*40.0);vA=0.55+0.45*sin(uT*2.2+aS.y*40.0);}
      vec4 v=uV*vec4(p,1.0);vFogd=length(v.xyz);gl_Position=uP*v;gl_PointSize=max(1.5,aS.x*uPx/max(-v.z,1.0));}`,
    `precision mediump float;uniform vec3 uCol,uFog;uniform mediump float uMode;uniform float uFogD;varying mediump float vA,vFogd;
    void main(){float d=length(gl_PointCoord-0.5);if(d>0.5)discard;
      if(uMode>0.5){float a=smoothstep(0.5,0.0,d)*vA*exp(-vFogd*0.0006);gl_FragColor=vec4(uCol*a,a);return;}
      float fog=1.0-exp(-vFogd*uFogD);gl_FragColor=vec4(mix(uCol*(1.0-d*0.6),uFog,fog),1.0);}`,['aP','aS']);
  const BLIT=mkProg(`attribute vec2 a;varying vec2 vU;void main(){vU=a*0.5+0.5;gl_Position=vec4(a,0.0,1.0);}`,
    `precision mediump float;uniform sampler2D uTex;varying vec2 vU;void main(){gl_FragColor=texture2D(uTex,vU);}`,['a']);

  // canopy height: rounded tree crowns on a jittered grid, over a gentle roll
  const ch=(i,j,k)=>{const v=Math.sin(i*127.1+j*311.7+k*74.7)*43758.5453;return v-Math.floor(v)};
  const CANH=(x,z)=>{const g=380,ix=Math.floor(x/g),iz=Math.floor(z/g);let c=0;
    for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const cx=(ix+i+0.5+(ch(ix+i,iz+j,1)-0.5)*0.7)*g,cz=(iz+j+0.5+(ch(ix+i,iz+j,2)-0.5)*0.7)*g,R=g*(0.55+0.35*ch(ix+i,iz+j,3)),d=Math.hypot(x-cx,z-cz);
      if(d<R)c=Math.max(c,Math.sqrt(1-(d/R)*(d/R))*(110+90*ch(ix+i,iz+j,4)))}
    return 2330+c+Math.sin(x*0.0011+z*0.0007)*45+Math.cos(z*0.0013-x*0.0004)*35};
  const CANY=CANH(0,10);
  function buildMoss(){
    let seed=23;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
    const V=[],I=[],FV=[],FI=[],flowers=[];
    const n3=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l]},cr=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
    const crm=(P,t)=>{const n=P.length-1,s=Math.min(n-1e-6,t*n),i=Math.floor(s),u=s-i,p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(n,i+2)];
      return[0,1,2].map(k=>0.5*((2*p1[k])+(-p0[k]+p2[k])*u+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*u*u+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*u*u*u))};
    // a mossy tube along a curve; ends that touch the ground flare out like roots
    function tube(P,r0,r1,fur,far,flowerRate){const VV=far?FV:V,II=far?FI:I,NS=far?40:90,NR=far?12:26,base=VV.length/9;
      let prev=null,len=0,last=crm(P,0),nrm=null;
      for(let i=0;i<=NS;i++){const t=i/NS,c=crm(P,t),c2=crm(P,Math.min(1,t+0.002)),c1=crm(P,Math.max(0,t-0.002));const T=n3([c2[0]-c1[0],c2[1]-c1[1],c2[2]-c1[2]]);
        len+=Math.hypot(c[0]-last[0],c[1]-last[1],c[2]-last[2]);last=c;
        if(!nrm){nrm=n3(cr(T,Math.abs(T[1])<0.9?[0,1,0]:[1,0,0]))}else{const b=cr(T,nrm);nrm=n3(cr(b,T))}
        const B=cr(T,nrm);let r=r0+(r1-r0)*t;r*=1+(far?0:0.10*Math.sin(t*11+seed%7)+0.06*Math.sin(t*29));
        const gEnd=Math.min(c[1]<60?1:0,1);r*=1+0.55*Math.exp(-Math.max(0,c[1])/45)*gEnd;
        for(let j=0;j<=NR;j++){const a=j/NR*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a);const nn=[nrm[0]*ca+B[0]*sa,nrm[1]*ca+B[1]*sa,nrm[2]*ca+B[2]*sa];
          const lump=far?1:1+0.07*Math.sin(a*3+t*17)+0.05*Math.sin(a*7-t*23);const p=[c[0]+nn[0]*r*lump,c[1]+nn[1]*r*lump,c[2]+nn[2]*r*lump];
          VV.push(p[0],p[1],p[2],nn[0],nn[1],nn[2],len,a*(r0+r1)*0.5,far?0:fur);
          if(!far&&nn[1]>0.55&&rnd()<flowerRate)flowerAt(p,nn,fur)}}
      for(let i=0;i<NS;i++)for(let j=0;j<NR;j++){const a=base+i*(NR+1)+j,b=a+NR+1;II.push(a,b,a+1,b,b+1,a+1)}}
    function blob(cx,cy,cz,rx,ry,rz,fur,flowerRate,full){const NT=36,NP=16,base=V.length/9,ph0=full?-Math.PI/2:-0.35;
      for(let ip=0;ip<=NP;ip++){const ph=ph0+(Math.PI/2-ph0)*ip/NP;for(let it=0;it<=NT;it++){const th=it/NT*Math.PI*2;
        const lump=1+0.09*Math.sin(th*3+ip*0.7)+0.06*Math.sin(th*7-ip*1.3);
        const ux=Math.cos(ph)*Math.cos(th),uy=Math.sin(ph),uz=Math.cos(ph)*Math.sin(th);const p=[cx+ux*rx*lump,cy+uy*ry*lump,cz+uz*rz*lump];
        const nn=n3([ux/rx,uy/ry,uz/rz]);V.push(p[0],p[1],p[2],nn[0],nn[1],nn[2],th*rx,ph*ry,fur);if(nn[1]>0.5&&rnd()<flowerRate)flowerAt(p,nn,fur)}}
      for(let ip=0;ip<NP;ip++)for(let it=0;it<NT;it++){const a=base+ip*(NT+1)+it,b=a+NT+1;I.push(a,a+1,b,b,a+1,b+1)}}
    function flowerAt(p,nn,fur){const k=3+Math.floor(rnd()*4);for(let i=0;i<k;i++)flowers.push(p[0]+nn[0]*fur*0.7+(rnd()-0.5)*9,p[1]+nn[1]*fur*0.7+(rnd()-0.5)*3,p[2]+nn[2]*fur*0.7+(rnd()-0.5)*9,3.6+rnd()*2.0,rnd())}
    // ground: gently rolling moss carpet, flat along the path
    {const NX=48,NZ=40,X0=-3200,X1=3200,Z0=-3600,Z1=900,base=V.length/9;
      for(let iz=0;iz<=NZ;iz++)for(let ix=0;ix<=NX;ix++){const x=X0+(X1-X0)*ix/NX,z=Z0+(Z1-Z0)*iz/NZ,path=Math.exp(-((z+10)*(z+10))/(110*110));
        const hy=(Math.sin(x*0.004)*Math.cos(z*0.005)*30+Math.sin(x*0.011+z*0.007)*14)*(1-path);V.push(x,hy,z,0,1,0,x,z,4.5)}
      for(let iz=0;iz<NZ;iz++)for(let ix=0;ix<NX;ix++){const a=base+iz*(NX+1)+ix,b=a+NX+1;I.push(a,b,a+1,b,b+1,a+1)}}
    const CV=[],CI=[];{const N=170,X0=-7000,X1=7000,Z0=-7000,Z1=5000;
      for(let iz=0;iz<=N;iz++)for(let ix=0;ix<=N;ix++){const x=X0+(X1-X0)*ix/N,z=Z0+(Z1-Z0)*iz/N,y=CANH(x,z),nx=-(CANH(x+20,z)-CANH(x-20,z))/40,nz=-(CANH(x,z+20)-CANH(x,z-20))/40,nn=n3([nx,1,nz]);
        CV.push(x,y,z,nn[0],nn[1],nn[2],x,z,40)}
      for(let iz=0;iz<N;iz++)for(let ix=0;ix<N;ix++){const a=iz*(N+1)+ix,b=a+N+1;CI.push(a,b,a+1,b,b+1,a+1)}}
    for(const[cx,cy,cz,rx,ry,rz]of[[-260,CANY-140,160,260,150,220],[330,CANY-170,-160,280,160,240],[90,CANY-230,520,220,140,200],[-380,CANY-250,900,240,150,220],[300,CANY-120,1150,260,150,230],[-520,CANY-60,-420,300,170,260]])blob(cx,cy,cz,rx,ry,rz,40,0,true);
    // the hero shapes, framing the play line like the reference: a long arch behind, a diagonal branch on the right
    tube([[-1150,-20,-420],[-900,260,-560],[-480,560,-700],[-60,600,-760],[300,420,-860],[560,40,-940]],120,80,11,false,0.010);
    tube([[700,-20,-80],[560,240,-260],[380,520,-470],[180,820,-700],[40,1150,-900]],105,62,11,false,0.012);
    tube([[470,330,-330],[600,420,-300],[700,560,-260]],34,18,9,false,0.02);
    tube([[-520,-10,-260],[-430,120,-300],[-300,170,-330],[-170,90,-320],[-90,-10,-300]],46,38,9,false,0.02);
    tube([[1150,-20,-650],[980,300,-760],[900,700,-880],[880,1400,-980],[860,2200,-1050]],120,95,11,false,0.004);
    tube([[-1250,-20,-900],[-1180,700,-980],[-1150,1600,-1050],[-1140,2200,-1100]],130,110,11,false,0.003);
    // fallen log on the path (the first platform of the game)
    tube([[380,30,-190],[560,36,-182],[740,32,-174],[900,26,-170]],30,26,8,false,0.05);
    // two trunks beside the fall line, each with one thin branch reaching across it
    tube([[650,-20,-60],[660,900,-70],[650,1800,-80],[640,2200,-90]],80,62,11,false,0.004);
    tube([[-650,-20,-60],[-660,900,-70],[-650,1800,-80],[-640,2200,-90]],78,60,11,false,0.004);
    tube([[620,1100,-30],[330,1128,-15],[60,1125,-5],[-200,1108,0]],16,8,5,false,0.04);
    tube([[-620,660,-30],[-320,690,-15],[-120,700,-5],[120,688,0]],16,8,5,false,0.04);
    // mounds framing the bottom corners and the middle distance
    blob(-380,-40,170,250,190,170,13,0.012);blob(400,-50,200,290,200,180,13,0.012);blob(-120,-30,-330,170,70,120,12,0.02);
    blob(820,-30,-420,260,110,160,12,0.01);blob(-860,-40,-200,240,100,170,12,0.01);blob(160,-40,-1300,360,140,240,12,0.004);
    // distant trunks and arches in the fog (no moss shells, they are only silhouettes)
    for(let i=0;i<12;i++){const x=-2600+i*470+rnd()*200,z=-1700-rnd()*1500,r=90+rnd()*120;tube([[x,-20,z],[x+rnd()*60,1300,z],[x+rnd()*120,2200,z-80]],r,r*0.8,0,true,0)}
    for(let i=0;i<4;i++){const x=-1800+i*1200+rnd()*300,z=-2000-rnd()*900;tube([[x-500,-20,z],[x-250,500,z],[x+250,520,z],[x+500,-20,z]],90,70,0,true,0)}
    // ferns tucked against the mounds and roots
    function fern(cx,cz,sc){const cy=0,nfr=7+Math.floor(rnd()*4);
      for(let f=0;f<nfr;f++){const ang=f/nfr*Math.PI*2+rnd()*0.5,len=(55+rnd()*55)*sc,dir=[Math.cos(ang),0,Math.sin(ang)],side=[-dir[2],0,dir[0]],hw=(16+rnd()*7)*sc,lift=0.55+rnd()*0.35,base=FERNV.length/8;
        for(let s=0;s<=6;s++){const t=s/6,px=cx+dir[0]*len*t,pz=cz+dir[2]*len*t,py=cy+len*lift*Math.sin(t*Math.PI*0.85)*0.9+4;
          for(const e of[-1,1])FERNV.push(px+side[0]*hw*e,py,pz+side[2]*hw*e,e,t,cx,cy,cz)}
        for(let s=0;s<6;s++){const a=base+s*2;FERNI.push(a,a+1,a+2,a+1,a+3,a+2)}}}
    const FERNV=[],FERNI=[];
    const fernSpots=[[-180,170],[-520,120],[240,190],[560,170],[-260,-230],[120,-260],[330,-200],[-640,-150],[700,-60],[-900,40],[930,60],[-40,-420],[460,-420],[-380,-480],[1000,-300],[-1100,-250],[150,120],[-120,-120],[260,-90],[640,-170]];
    for(const[x,z]of fernSpots)fern(x+(rnd()-0.5)*40,z+(rnd()-0.5)*30,0.8+rnd()*0.5);
    const mk=(arr,el)=>{const b=gl.createBuffer();gl.bindBuffer(el?gl.ELEMENT_ARRAY_BUFFER:gl.ARRAY_BUFFER,b);gl.bufferData(el?gl.ELEMENT_ARRAY_BUFFER:gl.ARRAY_BUFFER,el?new Uint16Array(arr):new Float32Array(arr),gl.STATIC_DRAW);return b};
    if(V.length/9>65535||FV.length/9>65535||FERNV.length/8>65535)throw new Error('forest mesh too large');
    const out={cvb:mk(CV),cib:mk(CI,1),cn:CI.length,vb:mk(V),ib:mk(I,1),n:I.length,fvb:mk(FV),fib:mk(FI,1),fn:FI.length,ferv:mk(FERNV),feri:mk(FERNI,1),fern:FERNI.length,flw:mk(flowers),nfl:flowers.length/5};
    const pol=[];for(let i=0;i<180;i++)pol.push(-1400+rnd()*2800,10+rnd()*520,-900+rnd()*1300,2.6+rnd()*2.4,rnd());out.pol=mk(pol);out.npol=pol.length/5;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,null);gl.bindBuffer(gl.ARRAY_BUFFER,mainBuf);return out}
  const MW=buildMoss();
  const PKB=gl.createBuffer(),PKG=gl.createBuffer(),MOTH=gl.createBuffer();
  // runner obstacles, built in the same moss as the forest
  function obsMesh(build){const V=[],I=[];const n3=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l]},cr=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
    const tube=(P,r0,r1,fur)=>{const NS=24,NR=16,base=V.length/9;let nrm=null,len=0,last=P[0];
      const at=t=>{const n=P.length-1,s2=Math.min(n-1e-6,t*n),i=Math.floor(s2),u=s2-i;return[0,1,2].map(k=>P[i][k]+(P[i+1][k]-P[i][k])*u)};
      for(let i=0;i<=NS;i++){const t=i/NS,c=at(t),c2=at(Math.min(1,t+0.01)),c1=at(Math.max(0,t-0.01)),T2=n3([c2[0]-c1[0],c2[1]-c1[1],c2[2]-c1[2]]);len+=Math.hypot(c[0]-last[0],c[1]-last[1],c[2]-last[2]);last=c;
        nrm=nrm?n3(cr(cr(T2,nrm),T2)):n3(cr(T2,Math.abs(T2[1])<0.9?[0,1,0]:[1,0,0]));const B=cr(T2,nrm),r=(r0+(r1-r0)*t)*(1+0.08*Math.sin(t*9));
        for(let j=0;j<=NR;j++){const a=j/NR*Math.PI*2,nn=[nrm[0]*Math.cos(a)+B[0]*Math.sin(a),nrm[1]*Math.cos(a)+B[1]*Math.sin(a),nrm[2]*Math.cos(a)+B[2]*Math.sin(a)];V.push(c[0]+nn[0]*r,c[1]+nn[1]*r,c[2]+nn[2]*r,nn[0],nn[1],nn[2],len,a*r,fur)}}
      for(let i=0;i<NS;i++)for(let j=0;j<NR;j++){const a=base+i*(NR+1)+j,b=a+NR+1;I.push(a,b,a+1,b,b+1,a+1)}};
    const blob=(cx,cy,cz,rx,ry,rz,fur)=>{const NT=20,NP=10,base=V.length/9;for(let ip=0;ip<=NP;ip++){const ph=-Math.PI/2+Math.PI*ip/NP;for(let it=0;it<=NT;it++){const th=it/NT*Math.PI*2,l=1+0.08*Math.sin(th*3+ip);
        const ux=Math.cos(ph)*Math.cos(th),uy=Math.sin(ph),uz=Math.cos(ph)*Math.sin(th),nn=n3([ux/rx,uy/ry,uz/rz]);V.push(cx+ux*rx*l,cy+uy*ry*l,cz+uz*rz*l,nn[0],nn[1],nn[2],th*rx,ph*ry,fur)}}
      for(let ip=0;ip<NP;ip++)for(let it=0;it<NT;it++){const a=base+ip*(NT+1)+it,b=a+NT+1;I.push(a,a+1,b,b,a+1,b+1)}};
    build(tube,blob);
    const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(V),gl.STATIC_DRAW);
    const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(I),gl.STATIC_DRAW);return{vb,ib,n:I.length}}
  const OBM={
    log:obsMesh((tube)=>tube([[-75,26,8],[0,29,10],[75,25,12]],26,22,9)),
    stump:obsMesh((tube,blob)=>{tube([[0,-10,10],[2,50,10],[0,88,10]],30,27,9);blob(0,88,10,29,8,29,9)}),
    rock:obsMesh((tube,blob)=>blob(0,-6,10,44,46,36,10)),
    arch:obsMesh((tube)=>tube([[-320,-20,0],[-260,200,0],[-120,330,0],[60,340,0],[220,240,0],[320,-20,0]],52,40,11)),
    trunk:obsMesh((tube)=>tube([[0,-20,0],[8,500,0],[-6,1000,0],[4,1500,0]],70,58,11)),
    mound:obsMesh((tube,blob)=>{blob(0,-40,0,230,120,160,13);blob(150,-30,40,120,80,100,12)}),
    root:obsMesh((tube)=>tube([[-160,-10,0],[-80,70,0],[40,90,0],[150,-10,0]],20,14,9)),
    boulder:obsMesh((tube,blob)=>{blob(0,0,8,52,50,44,10);blob(18,22,26,20,16,16,9)}),
    shroom:obsMesh((tube,blob)=>{tube([[0,-6,10],[2,22,10],[0,34,10]],11,9,2);blob(0,38,10,50,20,46,3)}),
    bridge:obsMesh((tube,blob)=>{tube([[-240,10,4],[-80,13,8],[80,11,10],[240,8,6]],21,18,8);blob(-236,10,4,26,24,24,8);blob(236,8,6,24,22,22,8)}),
    thorns:obsMesh((tube,blob)=>{for(let i=0;i<9;i++){const x=-140+i*35,z=10+((i*37)%17)-8,h=26+((i*53)%13);blob(x,4,z,26,h*0.8,22,4);
      for(let k=0;k<4;k++){const a=k*1.6+i;tube([[x+Math.cos(a)*8,10,z+Math.sin(a)*8],[x+Math.cos(a)*22,h+18,z+Math.sin(a)*16]],5,0.8,1.5)}}}),
    shade:obsMesh((tube,blob)=>{blob(0,30,10,50,46,38,6);blob(-26,62,10,26,24,22,6);tube([[-30,80,0],[-40,108,-6]],7,1,2);tube([[-30,80,20],[-40,108,26]],7,1,2)}),
    pod:obsMesh((tube,blob)=>{blob(0,-10,0,18,26,18,6);tube([[0,12,0],[0,-2,0]],7,12,4)}),
    branch:obsMesh((tube,blob)=>{tube([[0,108,-140],[0,103,0],[0,110,160]],13,11,8);blob(0,-10,-135,40,62,40,10);blob(0,-10,160,40,62,40,10);tube([[0,40,-133],[0,108,-138]],12,12,8);tube([[0,40,158],[0,110,158]],12,12,8)})};
  gl.bindBuffer(gl.ARRAY_BUFFER,mainBuf);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,null);
  const BFLY=gl.createBuffer(),VINEV=gl.createBuffer(),VINEI=gl.createBuffer();
  function vineMesh(polys){const V=[],I=[],NR=6;
    for(const pts of polys){const base=V.length/9,R=pts.r||3.6;let len=0;
      for(let i=0;i<pts.length;i++){const p=pts[i],q=pts[Math.min(pts.length-1,i+1)],o=pts[Math.max(0,i-1)];if(i)len+=Math.hypot(p[0]-o[0],p[1]-o[1],p[2]-o[2]);
        const T=norm([q[0]-o[0],q[1]-o[1],q[2]-o[2]]),N0=norm(cross(T,[0,0,1])),B=cross(T,N0);
        for(let j=0;j<=NR;j++){const a=j/NR*Math.PI*2,n=[N0[0]*Math.cos(a)+B[0]*Math.sin(a),N0[1]*Math.cos(a)+B[1]*Math.sin(a),N0[2]*Math.cos(a)+B[2]*Math.sin(a)];V.push(p[0]+n[0]*R,p[1]+n[1]*R,p[2]+n[2]*R,n[0],n[1],n[2],len,a*R,3)}}
      for(let i=0;i<pts.length-1;i++)for(let j=0;j<NR;j++){const a=base+i*(NR+1)+j,b=a+NR+1;I.push(a,b,a+1,b,b+1,a+1)}}
    gl.bindBuffer(gl.ARRAY_BUFFER,VINEV);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(V),gl.DYNAMIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,VINEI);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(I),gl.DYNAMIC_DRAW);return I.length}
  const FB={w:0,h:0,tex:null,fb:null,rb:null};
  function ensureFB(w,h){if(FB.w===w&&FB.h===h)return;FB.w=w;FB.h=h;
    if(!FB.tex){FB.tex=gl.createTexture();FB.fb=gl.createFramebuffer();FB.rb=gl.createRenderbuffer()}
    gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,FB.tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.bindRenderbuffer(gl.RENDERBUFFER,FB.rb);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,w,h);
    gl.bindFramebuffer(gl.FRAMEBUFFER,FB.fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,FB.tex,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,FB.rb);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.activeTexture(gl.TEXTURE0)}
  const isPhone=matchMedia('(pointer: coarse)').matches||innerWidth<700;
  let shells=isPhone?10:18;
  function drawForest(camM,cover,night,w,h,cssW,cssH,mixv,t,vpolys,camPos,game){
    const TP=6400,tk=Math.round(camPos[0]/TP),tiles=[tk*TP];{const d=camPos[0]-tk*TP;if(Math.abs(d)>TP*0.5-2200)tiles.push((tk+Math.sign(d))*TP)}
    const PUSH=420*(st.push||0),VT=tiles.map(o=>o?mul(camM.V,T(o,0,0)):camM.V),VTp=VT.map(v=>PUSH?mul(v,T(0,0,-PUSH)):v),showCanopy=camPos[1]>CANY-700;
    const fs=isPhone?0.6:0.75,fw=Math.max(2,Math.round(w*fs)),fh=Math.max(2,Math.round(h*fs));ensureFB(fw,fh);
    const fogF=mixv([0.47,0.52,0.47],[0.03,0.05,0.08]),haze=mixv([0.66,0.76,0.90],[0.07,0.10,0.18]),fogC=haze.map((v,i)=>lerp(v,fogF[i],cover));
    const fogD=lerp(0.00026,night>0.5?0.0008:0.00040,cover);
    const L=norm(mixv([0.3,0.9,0.25],[-0.3,0.8,0.4])),sun=mixv([1.10,1.06,0.86],[0.38,0.44,0.66]),sky=mixv([0.46,0.52,0.46],[0.17,0.22,0.29]),gnd=mixv([0.16,0.19,0.12],[0.02,0.04,0.045]);
    gl.bindFramebuffer(gl.FRAMEBUFFER,FB.fb);gl.viewport(0,0,fw,fh);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    for(let i=1;i<4;i++)gl.disableVertexAttribArray(i);gl.enableVertexAttribArray(0);
    // misty backdrop
    gl.useProgram(bpr);gl.disable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.bindBuffer(gl.ARRAY_BUFFER,mainBuf);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
    gl.uniform3fv(BU.uTop,mixv([0.36,0.40,0.35],[0.02,0.035,0.06]));gl.uniform3fv(BU.uBot,fogF);gl.uniform1f(BU.uA,cover>0.99?1:cover);gl.drawArrays(gl.TRIANGLES,0,3);
    gl.disable(gl.BLEND);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);
    // moss
    gl.useProgram(MOSS.p);const U2=MOSS.u;
    gl.uniformMatrix4fv(U2.uV,false,camM.V);gl.uniformMatrix4fv(U2.uP,false,camM.P);gl.uniform1f(U2.uT,t);gl.uniform1f(U2.uDens,0.55);
    gl.uniform3fv(U2.uL,L);gl.uniform3fv(U2.uSun,sun);gl.uniform3fv(U2.uSky,sky);gl.uniform3fv(U2.uGnd,gnd);gl.uniform3fv(U2.uFog,fogC);
    gl.uniform3fv(U2.uTip,[0.58,0.70,0.24]);gl.uniform3fv(U2.uBase,[0.09,0.13,0.05]);gl.uniform1f(U2.uFogD,fogD);gl.uniform1f(U2.uFogO,game?Math.max(0,camPos[2]-760):0);gl.uniform1f(U2.uHF,0.3*cover);gl.uniform1f(U2.uPush,PUSH);gl.uniform1f(U2.uShade,0);gl.uniform1f(U2.uTileX,0);
    {const gx=[];if(game)for(const o of game.obs)if((o.type==='gap'||o.type==='bridge')&&o.x+o.w>camPos[0]-2500&&o.x<camPos[0]+3000&&gx.length<8)gx.push(o.x,o.x+o.w);while(gx.length<8)gx.push(-1e9,-1e9);gl.uniform4fv(U2.uGapA,gx.slice(0,4));gl.uniform4fv(U2.uGapB,gx.slice(4,8))}gl.uniform1f(U2.uNight,night*cover);gl.uniform1f(U2.uObG,0);
    for(let i=0;i<4;i++)gl.enableVertexAttribArray(i);
    const mossFmt=()=>{gl.vertexAttribPointer(0,3,gl.FLOAT,false,36,0);gl.vertexAttribPointer(1,3,gl.FLOAT,false,36,12);gl.vertexAttribPointer(2,2,gl.FLOAT,false,36,24);gl.vertexAttribPointer(3,1,gl.FLOAT,false,36,32)};
    gl.bindBuffer(gl.ARRAY_BUFFER,MW.fvb);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,MW.fib);mossFmt();gl.uniform1f(U2.uS,0);for(const v of VT){gl.uniformMatrix4fv(U2.uV,false,v);gl.drawElements(gl.TRIANGLES,MW.fn,gl.UNSIGNED_SHORT,0)}gl.uniformMatrix4fv(U2.uV,false,camM.V);
    gl.bindBuffer(gl.ARRAY_BUFFER,MW.vb);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,MW.ib);mossFmt();
    gl.uniform3fv(U2.uCam,camPos);
    if(showCanopy){gl.uniform1f(U2.uFlat,1);gl.uniform1f(U2.uS,0);gl.bindBuffer(gl.ARRAY_BUFFER,MW.cvb);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,MW.cib);mossFmt();gl.drawElements(gl.TRIANGLES,MW.cn,gl.UNSIGNED_SHORT,0)}
    gl.uniform1f(U2.uFlat,0);gl.bindBuffer(gl.ARRAY_BUFFER,MW.vb);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,MW.ib);mossFmt();
    for(let vi=0;vi<VT.length;vi++){const v=VT[vi];gl.uniform1f(U2.uTileX,tiles[vi]);gl.uniformMatrix4fv(U2.uV,false,v);for(let s=0;s<=shells;s++){gl.uniform1f(U2.uS,s/shells);gl.drawElements(gl.TRIANGLES,MW.n,gl.UNSIGNED_SHORT,0)}}
    gl.uniformMatrix4fv(U2.uV,false,camM.V);
    if(showCanopy){gl.bindBuffer(gl.ARRAY_BUFFER,MW.cvb);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,MW.cib);mossFmt();for(let s=1;s<=shells;s++){gl.uniform1f(U2.uS,s/shells);gl.drawElements(gl.TRIANGLES,MW.cn,gl.UNSIGNED_SHORT,0)}}
    gl.uniform1f(U2.uPush,0);gl.uniform1f(U2.uTileX,0);gl.uniform4fv(U2.uGapA,[-1e9,-1e9,-1e9,-1e9]);gl.uniform4fv(U2.uGapB,[-1e9,-1e9,-1e9,-1e9]);
    if(game)for(const o of game.dec.concat(game.obs)){const m=OBM[o.type==='vine'?'pod':o.type];if(!m)continue;if(o.x<camPos[0]-1800||o.x>camPos[0]+2600)continue;const thr=o.type==='thorns',shd=o.type==='shade',shr=o.type==='shroom'||thr||shd;gl.uniform1f(U2.uObG,o.type==='shroom'||thr?2:'log rock stump branch vine boulder bridge'.includes(o.type)?1:0);
      if(o.type==='shroom'){gl.uniform3fv(U2.uTip,mixv([1.0,0.52,0.22],[0.30,1.0,0.95]));gl.uniform3fv(U2.uBase,mixv([0.80,0.74,0.62],[0.20,0.30,0.45]))}
      if(thr){gl.uniform3fv(U2.uTip,mixv([0.55,0.22,0.16],[1.0,0.25,0.65]));gl.uniform3fv(U2.uBase,mixv([0.14,0.06,0.05],[0.10,0.03,0.08]))}
      if(shd){gl.uniform3fv(U2.uTip,[0.06,0.05,0.09]);gl.uniform3fv(U2.uBase,[0.02,0.02,0.03]);gl.uniform1f(U2.uShade,Math.max(0.15,Math.min(1,((st.look||500)*0.9-(o.x-game.x))/250)))}gl.bindBuffer(gl.ARRAY_BUFFER,m.vb);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.ib);mossFmt();const sq=o.sq||0;gl.uniformMatrix4fv(U2.uV,false,mul(camM.V,o.type==='vine'?T(o.x+Math.sin(t*1.7+o.x*0.01)*10,o.bot,0):o.type==='boulder'?mul(T(o.x,o.my,0),RZ(o.rot)):o.type==='bridge'?mul(T(o.x+o.w/2,(o.trig!=null&&game.t-o.trig<0.5?Math.sin(t*70)*2:0)-o.drop,0),RZ(o.rot)):thr?T(o.x,0,0):shd?T(o.x,Math.abs(Math.sin(t*3+o.x))*4,0):o.type==='shroom'?mul(T(o.x,0,0),[1+sq*0.3,0,0,0,0,1-sq*0.4,0,0,0,0,1+sq*0.3,0,0,0,0,1]):T(o.x,0,o.z||0)));
      for(let s=0;s<=shells;s++){gl.uniform1f(U2.uS,s/shells);gl.drawElements(gl.TRIANGLES,m.n,gl.UNSIGNED_SHORT,0)}
      if(shr){gl.uniform3fv(U2.uTip,[0.58,0.70,0.24]);gl.uniform3fv(U2.uBase,[0.09,0.13,0.05]);gl.uniform1f(U2.uShade,0)}}
    gl.uniformMatrix4fv(U2.uV,false,camM.V);gl.uniform1f(U2.uObG,game?1:0);
    if(vpolys&&vpolys.length){const nv=vineMesh(vpolys);mossFmt();for(let s=0;s<=4;s++){gl.uniform1f(U2.uS,s/4);gl.drawElements(gl.TRIANGLES,nv,gl.UNSIGNED_SHORT,0)}}
    gl.uniform1f(U2.uObG,0);gl.disableVertexAttribArray(3);
    // ferns
    gl.useProgram(FERN.p);const UF=FERN.u;gl.uniformMatrix4fv(UF.uV,false,camM.V);gl.uniformMatrix4fv(UF.uP,false,camM.P);gl.uniform1f(UF.uT,t);
    gl.uniform3fv(UF.uSun,sun);gl.uniform3fv(UF.uSky,sky);gl.uniform3fv(UF.uFog,fogC);gl.uniform1f(UF.uFogD,fogD);gl.uniform1f(UF.uKind,0);gl.uniform1f(UF.uNightF,night*cover);
    const fernFmt=()=>{gl.vertexAttribPointer(0,3,gl.FLOAT,false,32,0);gl.vertexAttribPointer(1,2,gl.FLOAT,false,32,12);gl.vertexAttribPointer(2,3,gl.FLOAT,false,32,20)};
    gl.bindBuffer(gl.ARRAY_BUFFER,MW.ferv);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,MW.feri);fernFmt();for(const v of VTp){gl.uniformMatrix4fv(UF.uV,false,v);gl.drawElements(gl.TRIANGLES,MW.fern,gl.UNSIGNED_SHORT,0)}gl.uniformMatrix4fv(UF.uV,false,camM.V);
    // butterfly: two glowing wings on a lazy loop around the clearing
    {const bt=t*0.35,bx=140+Math.sin(bt)*220,by=110+Math.sin(bt*1.7)*45,bz=-60+Math.cos(bt*0.8)*120,hd=norm([Math.cos(bt)*220,Math.cos(bt*1.7)*45*1.7,-Math.sin(bt*0.8)*120*0.8]),
        side=norm([-hd[2],0,hd[0]]),fl=Math.sin(t*15)*1.1,span=10,q=[];
      for(const sg of[-1,1]){const wv=[side[0]*Math.cos(fl)*sg*span,Math.sin(fl)*span,side[2]*Math.cos(fl)*sg*span];
        const p0=[bx-hd[0]*5,by-hd[1]*5,bz-hd[2]*5],p1=[bx+hd[0]*5,by+hd[1]*5,bz+hd[2]*5],p2=[p1[0]+wv[0],p1[1]+wv[1],p1[2]+wv[2]],p3=[p0[0]+wv[0],p0[1]+wv[1],p0[2]+wv[2]];
        const uvs=[[0,0],[0,1],[1,1],[1,0]];
        for(const i of[0,1,2,0,2,3]){const p=[p0,p1,p2,p3][i],u=uvs[i];q.push(p[0],p[1],p[2],u[0],u[1],bx,by,bz)}}
      gl.bindBuffer(gl.ARRAY_BUFFER,BFLY);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(q),gl.DYNAMIC_DRAW);fernFmt();gl.uniform1f(UF.uKind,1);
      gl.uniform3fv(UF.uGlowC,mixv([0.80,0.95,0.30],[0.85,1.0,0.45]));gl.drawArrays(gl.TRIANGLES,0,12);st.bfly={x:bx,y:by,z:bz}}
    gl.disableVertexAttribArray(2);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,null);
    // flowers, then pollen / fireflies
    gl.useProgram(PTS.p);const UP=PTS.u;gl.uniformMatrix4fv(UP.uV,false,camM.V);gl.uniformMatrix4fv(UP.uP,false,camM.P);gl.uniform1f(UP.uT,t);
    gl.uniform1f(UP.uPx,fh/(2*Math.tan(FOV/2)));gl.uniform3fv(UP.uFog,fogC);gl.uniform1f(UP.uFogD,fogD);
    const ptFmt=()=>{gl.vertexAttribPointer(0,3,gl.FLOAT,false,20,0);gl.vertexAttribPointer(1,2,gl.FLOAT,false,20,12)};
    gl.bindBuffer(gl.ARRAY_BUFFER,MW.flw);ptFmt();gl.uniform1f(UP.uMode,0);gl.uniform3fv(UP.uCol,mixv([0.95,0.95,0.90],[0.35,1.0,0.95]));gl.uniform1f(UP.uFogD,night>0.5?fogD*0.25:fogD);for(const v of VTp){gl.uniformMatrix4fv(UP.uV,false,v);gl.drawArrays(gl.POINTS,0,MW.nfl)}gl.uniformMatrix4fv(UP.uV,false,camM.V);gl.uniform1f(UP.uFogD,fogD);
    let pk=null;if(game&&game.pick.length){pk=[];for(const q of game.pick)if(!q.got){const b=Math.sin(t*3+q.x*0.01)*6;pk.push(q.x,q.y+b,10,q.gear?26:15,0)}
      if(pk.length){gl.bindBuffer(gl.ARRAY_BUFFER,PKB);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(pk),gl.DYNAMIC_DRAW);ptFmt();gl.uniform3fv(UP.uCol,[1.0,0.86,0.42]);gl.uniform1f(UP.uFogD,0);gl.drawArrays(gl.POINTS,0,pk.length/5);gl.uniform1f(UP.uFogD,fogD)}else pk=null}
    gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.ONE,gl.ONE,gl.ZERO,gl.ONE);gl.depthMask(false);
    gl.bindBuffer(gl.ARRAY_BUFFER,MW.pol);ptFmt();gl.uniform1f(UP.uMode,1);gl.uniform3fv(UP.uCol,mixv([0.95,0.97,0.85],[1.0,0.92,0.45]).map(v=>v*(night>0.5?1.1:0.55)));for(const v of VT){gl.uniformMatrix4fv(UP.uV,false,v);gl.drawArrays(gl.POINTS,0,MW.npol)}gl.uniformMatrix4fv(UP.uV,false,camM.V);
    if(pk){gl.bindBuffer(gl.ARRAY_BUFFER,PKG);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(pk.map((v,i)=>i%5===3?v*2.6:v)),gl.DYNAMIC_DRAW);ptFmt();gl.uniform1f(UP.uMode,2);gl.uniform3fv(UP.uCol,[0.9,0.7,0.25]);gl.drawArrays(gl.POINTS,0,pk.length/5)}
    if(game){const sw=[],ve=[];for(const o of game.obs){if(o.x<camPos[0]-1600||o.x>camPos[0]+2600)continue;
        if(o.type==='swarm'){const f=o.form*o.form*(3-2*o.form);for(const q of o.P){let y=q[1];if(o.lo?y<70:(y>85&&y<280))y=o.lo?70+(y/70)*20:(y<182?85-(182-y)*0.15:280+(y-182)*0.15);
          const px=o.x+q[0]+(1-f)*q[4]+Math.sin(t*2+q[3])*6,py=y*f+(1-f)*(q[5]+40)+Math.cos(t*2.3+q[3])*6;sw.push(px,py,10+q[2],12,0,px,py,10+q[2],34,0)}}
        else if(o.type==='shade')for(const sg of[-1,1])ve.push(o.x-36,64,10+sg*8,16,0,o.x-36,64,10+sg*8,46,0)}
      for(const[arr,col]of[[sw,night>0.5?[0.5,1.0,0.6]:[1.0,0.85,0.35]],[ve,[0.75,0.35,1.0]]])if(arr.length){gl.bindBuffer(gl.ARRAY_BUFFER,MOTH);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arr),gl.DYNAMIC_DRAW);ptFmt();gl.uniform1f(UP.uMode,2);gl.uniform3fv(UP.uCol,col);gl.drawArrays(gl.POINTS,0,arr.length/5)}}
    if(game&&night>0.5){const mp=[],ey=[];
      for(const o of game.obs){if(o.x<camPos[0]-1600||o.x>camPos[0]+2600)continue;
        if(o.type==='bird'){const fl=Math.sin(t*16+o.x*0.01),yy=o.y+Math.sin(t*3+o.x)*4;
          mp.push(o.x,yy,10,30,0, o.x,yy,10,110,0);
          for(const sg of[-1,1])mp.push(o.x+sg*3,yy+6+fl*14,10+sg*18,36,0, o.x+sg*3,yy+6+fl*14,10+sg*18,70,0);
          mp.push(o.x+20,yy-2,10,14,0,o.x+38,yy-4,10,10,0)}
        else if(o.type==='owl')for(const sg of[-1,1])ey.push(o.x-30,o.y+14,10+sg*9,24,0,o.x-30,o.y+14,10+sg*9,70,0)}
      if(mp.length){gl.bindBuffer(gl.ARRAY_BUFFER,MOTH);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(mp),gl.DYNAMIC_DRAW);ptFmt();gl.uniform1f(UP.uMode,2);
        gl.uniform3fv(UP.uCol,[0.55,0.95,1.0]);gl.drawArrays(gl.POINTS,0,mp.length/5)}
      if(ey.length){gl.bindBuffer(gl.ARRAY_BUFFER,MOTH);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(ey),gl.DYNAMIC_DRAW);ptFmt();gl.uniform1f(UP.uMode,2);gl.uniform3fv(UP.uCol,[1.0,0.62,0.18]);gl.drawArrays(gl.POINTS,0,ey.length/5)}}
    gl.depthMask(true);
    // composite onto the screen (premultiplied alpha, so the sky shows through until the mist closes in)
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,w,h);gl.disable(gl.DEPTH_TEST);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(BLIT.p);gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,FB.tex);gl.uniform1i(BLIT.u.uTex,5);
    gl.disableVertexAttribArray(1);gl.bindBuffer(gl.ARRAY_BUFFER,mainBuf);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);gl.drawArrays(gl.TRIANGLES,0,3);
    gl.disable(gl.BLEND);gl.activeTexture(gl.TEXTURE0);gl.enable(gl.DEPTH_TEST)}
  const BVS=`attribute vec2 a;varying float vy;void main(){vy=a.y*0.5+0.5;gl_Position=vec4(a,0.999,1.0);}`;
  const BFS=`precision mediump float;varying float vy;uniform vec3 uTop,uBot;uniform float uA;void main(){gl_FragColor=vec4(mix(uBot,uTop,clamp(vy,0.0,1.0)),uA);}`;
  const bpr=gl.createProgram();gl.attachShader(bpr,sh(gl.VERTEX_SHADER,BVS));gl.attachShader(bpr,sh(gl.FRAGMENT_SHADER,BFS));gl.bindAttribLocation(bpr,0,'a');gl.linkProgram(bpr);
  const BU={uTop:gl.getUniformLocation(bpr,'uTop'),uBot:gl.getUniformLocation(bpr,'uBot'),uA:gl.getUniformLocation(bpr,'uA')};
  function forestCam(fp){const e=fp*fp*(1.7-0.7*fp);return{x:0,y:4300+(135-4300)*e,z:300+(760-300)*sstep(0.35,1,fp),pitch:-1.3+(1.23)*sstep(0.45,0.97,fp)}}
  function camMats(c,asp){return{V:mul(RX(-c.pitch),T(-c.x,-c.y,-c.z)),P:persp(FOV,asp,4,7000)}}
  function toScreen(V,p,cssW,cssH){const v=xf(V,p),f=cssH/(2*Math.tan(FOV/2));return{x:cssW/2+v[0]/(-v[2])*f,y:cssH/2-v[1]/(-v[2])*f,d:-v[2]}}
  const caption=document.createElement('div');caption.className='pill';caption.setAttribute('aria-live','polite');
  caption.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:5;height:38px;font-size:14px;font-weight:500;pointer-events:none;opacity:0;transition:opacity .6s;white-space:nowrap';
  caption.textContent='';document.body.appendChild(caption);
  function go(m){st.mode=m;st.mt=0}
  // ---------- the forest run: endless, faster over time, best score kept on the device ----------
  let best=0;try{best=parseInt(localStorage.getItem('puli-best')||'0',10)||0}catch(e){}
  const hud=document.createElement('div');hud.className='pill';hud.setAttribute('aria-live','off');
  hud.style.cssText='position:fixed;left:50%;transform:translateX(-50%);top:calc(64px + env(safe-area-inset-top,0px));z-index:5;height:38px;font-size:14px;font-weight:500;pointer-events:none;opacity:0;transition:opacity .4s;white-space:nowrap;font-variant-numeric:tabular-nums';
  document.body.appendChild(hud);
  const pad=document.createElement('div');pad.setAttribute('aria-hidden','true');
  pad.style.cssText='position:fixed;inset:0;z-index:4;touch-action:none;display:none;-webkit-user-select:none;user-select:none';document.body.appendChild(pad);
  const back=document.createElement('button');back.className='pill';back.type='button';back.textContent='Back to the sky';
  back.style.cssText='position:fixed;left:clamp(16px,4vw,40px);bottom:calc(52px + env(safe-area-inset-bottom,0px));z-index:6;height:36px;font-size:13px;display:none';document.body.appendChild(back);
  back.addEventListener('click',e=>{e.stopPropagation();const tr=document.querySelector('.track');scrollTo({top:tr?tr.offsetHeight:0,behavior:'smooth'})});
  const inp={jump:false,held:false,slide:false};
  const gameKeys=()=>(st.mode==='landed'||st.mode==='game')&&!document.querySelector('dialog[open]');
  addEventListener('keydown',e=>{if(!gameKeys()||e.target.closest&&e.target.closest('input,textarea'))return;
    if(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW'){e.preventDefault();if(!e.repeat)inp.jump=true;inp.held=true}
    else if(e.code==='ArrowDown'||e.code==='KeyS'){e.preventDefault();inp.slide=true}});
  addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW')inp.held=false});
  const liveWalls=()=>st.g&&!st.g.over?st.g.obs.filter(o=>o.type==='wall'&&!o.cut&&!o.targeted&&o.sx!=null&&o.x>st.g.x+20&&o.x<st.g.x+1300):[];
  const laserBtn=document.createElement('button');laserBtn.className='pill';laserBtn.type='button';laserBtn.textContent='Fire laser';
  laserBtn.style.cssText='position:fixed;right:clamp(16px,4vw,40px);bottom:calc(52px + env(safe-area-inset-bottom,0px));z-index:6;height:44px;min-width:120px;font-size:14px;font-weight:600;display:none';document.body.appendChild(laserBtn);
  laserBtn.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();const ws=liveWalls().sort((a,b)=>a.x-b.x);if(ws[0])shootWall(ws[0])});
  const shootWall=wl=>{if(fire(wl.sx,wl.sy,null,wl))wl.targeted=true};
  addEventListener('keydown',e=>{if(st.mode!=='game'||!(e.code==='KeyF'||e.code==='KeyE'||e.code==='Enter'))return;const ws=liveWalls().sort((a,b)=>a.x-b.x);if(ws[0]){e.preventDefault();shootWall(ws[0])}});
  let tch=null;
  pad.addEventListener('pointerdown',e=>{if(st.mode==='game'){const wl=liveWalls().find(o=>o.sx>-20&&o.sx<innerWidth+20&&Math.abs(o.sx-e.clientX)<Math.max(70,innerWidth*0.12));if(wl){shootWall(wl);return}}tch={y:e.clientY,t:performance.now(),sl:false};inp.jump=true;inp.held=true});
  pad.addEventListener('pointermove',e=>{if(tch&&!tch.sl&&e.clientY-tch.y>36&&performance.now()-tch.t<350){tch.sl=true;inp.slide=true}});
  addEventListener('pointerup',()=>{tch=null;inp.held=false});
  function newGame(x0){if(st.jet&&st.jet.on&&st.mode==='game'){st.jet.on=false;st.jet.p=null}return{gnd:true,hover:0,dec:[],nextD:x0+500,x0,x:x0,y:0,vy:0,jumps:0,slideT:0,speed:400,t:0,pts:0,lives:1+Math.min(2,Math.floor(bank/5)),inv:0,obs:[],pick:[],nextX:x0+900,over:false,overT:0}}
  const R2=()=>Math.random();
  function spawn(g){const d=Math.min(1,g.t/240),x=g.nextX,t=g.t,w=[['log',0.26],['rock',0.2],['stump',0.1+0.1*d],['branch',0.1+0.1*d],['bird',0.06+0.12*d],
      ['vine',t>12?0.12:0],['shroom',t>8?0.08:0],['wall',t>18?0.08+0.04*d:0],['boulder',t>24&&!(st.night>0.5)?0.1+0.05*d:0],['owl',t>32?0.06+0.1*d:0],['gap',t>10?0.1:0],['thorns',t>16?0.08:0],['swarm',t>20?0.07:0],['bridge',t>26?0.07:0],['jet',t>30?0.05:0],['shade',t>14&&st.night>0.5?0.14:0]];
    let r=R2()*w.reduce((a,b)=>a+b[1],0),type='log';for(const[k,v]of w){if((r-=v)<=0){type=k;break}}
    // pollen: an arc over things you jump, a low line under things you slide below
    const gear=R2()<0.06;let extra=0;
    if(type==='shroom'){g.obs.push({type,x,sq:0},{type:'stump',x:x+250},{type:'stump',x:x+340});
      for(let i=0;i<7;i++){const u=i/6;g.pick.push({x:x+70+u*420,y:90+Math.sin(u*Math.PI)*230,gear:gear&&i===3})}extra=420}
    else if(type==='vine'){g.obs.push({type,x,bot:230,trig:null,lead:0.75+R2()*1.1});for(let i=-2;i<=2;i++)g.pick.push({x:x+i*34,y:22,gear:false})}
    else if(type==='boulder')g.obs.push({type,x,vx:0,rot:0,act:false,my:50});
    else if(type==='gap'){const gw=120+g.speed*0.18;g.obs.push({type,x,w:gw});for(let i=0;i<5;i++){const u=i/4;g.pick.push({x:x+u*gw,y:70+Math.sin(u*Math.PI)*90,gear:gear&&i===2})}extra=gw}
    else if(type==='bridge'){g.obs.push({type,x,w:440,trig:null,drop:0,vy:0,rot:0});extra=440}
    else if(type==='thorns'){g.obs.push({type,x,w:300});for(let i=0;i<5;i++){const u=i/4;g.pick.push({x:x-150+u*300,y:110+Math.sin(u*Math.PI)*80,gear:gear&&i===2})}extra=160}
    else if(type==='swarm'){const lo=R2()<0.5,P=[];for(let i=0;i<46;i++)P.push([(R2()-0.5)*40,R2()*430,(R2()-0.5)*40,R2()*6.28,(R2()-0.5)*300,R2()*260]);g.obs.push({type,x,lo,P,form:0})}
    else if(type==='jet'){const gw=520+g.speed*0.3;g.pick.push({x,y:60,jet:true});g.obs.push({type:'gap',x:x+260,w:gw});extra=260+gw}
    else if(type==='shade')g.obs.push({type,x,vx:0,act:false});
    else if(type==='wall')g.obs.push({type,x,cut:false,bot:-10});
    else if(type==='owl')g.obs.push({type,x:x+200,y:330,ty:R2()<0.5?28:74,act:false,vx:0,tilt:0});
    else{g.obs.push({type,x,y:type==='bird'?72:0,vx:type==='bird'?-240-120*d:0});
      if(type==='branch')for(let i=-2;i<=2;i++)g.pick.push({x:x+i*34,y:22,gear:false});
      else if(type!=='bird')for(let i=-2;i<=2;i++)g.pick.push({x:x+i*40,y:(type==='stump'?150:118)-i*i*8,gear:gear&&i===0});
      if(d>0.45&&R2()<0.2+0.3*d&&type!=='bird'){g.obs.push({type:'bird',x:x+300+R2()*80,y:72,vx:-260-100*d});}}
    g.nextX+=g.speed*(0.95+R2()*0.6)*Math.max(0.6,1-g.t/360)+300+extra}
  const BOX={thorns:[150,0,44],shade:[44,0,84],log:[72,0,52],rock:[40,0,36],stump:[30,0,92],branch:[15,88,600],bird:[24,-12,12],owl:[26,-14,14],vine:[13,0,3000],wall:[22,0,3000],boulder:[44,0,96]};
  function stepGame(g,sec){
    if(g.over){g.overT+=sec;inp.slide=false;if(inp.jump&&g.overT>0.7){const nx=g.x+200;Object.assign(g,newGame(nx))}inp.jump=false;return}
    g.t+=sec;g.speed=Math.min(1000,400+g.t*4.5);g.x+=g.speed*sec;g.inv=Math.max(0,g.inv-sec);
    if(inp.jump&&!(g.hover>0)){if(g.gnd){g.vy=780;g.jumps=1;g.slideT=0}else if(g.jumps<2){g.vy=700;g.jumps=2}}
    if(inp.slide&&!(g.hover>0)){if(!g.gnd)g.vy=-1100;g.slideT=0.65}
    inp.jump=false;inp.slide=false;
    if(g.hover>0){g.hover-=sec;g.vy=(165-g.y)*5;g.y+=g.vy*sec;g.jumps=1;if(g.hover<=0){st.jet.on=false;st.jet.p=null}}
    else{g.vy-=(inp.held&&g.vy>0?1500:2600)*sec;g.y+=g.vy*sec}
    const gh=groundAt(g,g.x);g.gnd=false;if(gh>-1e8&&g.y<=gh&&g.vy<=0&&g.y>gh-40){g.y=gh;g.vy=0;g.jumps=0;g.gnd=true}
    if(g.y<-110){const gp=g.obs.find(o=>(o.type==='gap'||o.type==='bridge')&&g.x>o.x-20&&g.x<o.x+o.w+20);g.x=gp?gp.x+gp.w+40:g.x+60;g.y=0;g.vy=0;g.inv=0;hurt(g,1.6);st.shake=1}
    g.slideT=Math.max(0,g.slideT-sec);
    while(g.nextX<g.x+2400)spawn(g);
    while(g.nextD<g.x+2800){const r=R2(),x=g.nextD;
      if(r<0.25)g.dec.push({type:'arch',x,z:-520-R2()*380});else if(r<0.5)g.dec.push({type:'trunk',x,z:-380-R2()*700});
      else if(r<0.62)g.dec.push({type:'trunk',x,z:-1100-R2()*500});else if(r<0.82)g.dec.push({type:'mound',x,z:-260-R2()*160});else g.dec.push({type:'root',x,z:-170-R2()*60});
      g.nextD+=260+R2()*420}
    g.dec=g.dec.filter(o=>o.x>g.x-1400);
    const dd=Math.min(1,g.t/240);
    for(const o of g.obs){const dx=o.x-g.x;
      if(o.type==='vine'){if(o.trig==null&&dx<g.speed*o.lead)o.trig=g.t;
        if(o.trig!=null){const tt=(g.t-o.trig)%2.0,k=tt<0.16?tt/0.16:tt<1.0?1:tt<1.35?1-(tt-1.0)/0.35:0,bb=tt>0.16&&tt<0.6?Math.sin((tt-0.16)*22)*14*(1-(tt-0.16)/0.44):0;o.bot=Math.max(46,230-178*k+bb)}}
      else if(o.type==='boulder'){if(!o.act&&dx<(st.look||500)+120){o.act=true;o.vx=-(130+90*dd)}o.rot-=o.vx*sec/50;o.my=50+Math.abs(Math.sin(o.rot*1.5))*3}
      else if(o.type==='owl'){const lk=st.look||500;if(!o.act&&dx<lk+500){o.act=true;o.vx=-(150+70*dd)}const py=o.y;
        const dive=Math.max(0,Math.min(1,(lk+250-dx)/(lk+50)));o.y=o.ty+(330-o.ty)*(1-dive*dive*(3-2*dive))+(dx<-60?Math.min(300,(-60-dx)*1.4):0);o.tilt=Math.max(-0.7,Math.min(0.7,(o.y-py)/Math.max(sec,1e-3)*0.0014))}
      else if(o.type==='wall'&&o.cut)o.bot+=1300*sec;
      else if(o.type==='shroom')o.sq=Math.max(0,o.sq-sec*3);
      else if(o.type==='bridge'){if(o.trig==null&&g.gnd&&g.y>20&&g.x>o.x&&g.x<o.x+o.w)o.trig=g.t;if(o.trig!=null&&g.t-o.trig>0.5){o.vy+=1500*sec;o.drop+=o.vy*sec;o.rot+=0.9*sec}}
      else if(o.type==='swarm'){const lk=st.look||500;o.form=Math.max(0,Math.min(1,(lk+260-dx)/300))}
      else if(o.type==='shade'){if(!o.act&&dx<(st.look||500)+200){o.act=true;o.vx=-70}}
      if(o.vx)o.x+=o.vx*sec}
    if(!st.sawWall&&g.obs.some(o=>o.type==='wall'&&o.x-g.x<1500)){st.sawWall=true;g.hint=3.5}g.hint=Math.max(0,(g.hint||0)-sec);
    g.obs=g.obs.filter(o=>o.x+(o.w||0)>g.x-900);g.pick=g.pick.filter(q=>q.x>g.x-900);
    const sl=g.slideT>0&&g.gnd,x0=g.x-18,x1=g.x+18,y0=g.y,y1=g.y+(sl?40:76);
    for(const o of g.obs){
      if(o.type==='shroom'){if(Math.abs(g.x-o.x)<48&&g.y<58&&g.vy<=0){g.y=58;g.vy=1000;g.jumps=1;g.slideT=0;o.sq=1}continue}
      if(o.type==='wall'&&o.cut)continue;
      if(o.type==='gap'||o.type==='bridge')continue;
      if(o.type==='swarm'){if(o.form>0.85&&x1>o.x-20&&x0<o.x+20&&g.inv<=0){const ok=o.lo?y1<=58:(y0>=95&&y1<=270);if(!ok)hurt(g)}continue}
      const b=BOX[o.type],fly=o.type==='bird'||o.type==='owl',oy0=o.type==='vine'?o.bot:fly?o.y+b[1]:b[1],oy1=fly?o.y+b[2]:b[2];
      if(x1>o.x-b[0]&&x0<o.x+b[0]&&y1>oy0&&y0<oy1&&g.inv<=0){if(o.type==='wall')o.cut=true;hurt(g)}}
    for(const q of g.pick)if(!q.got&&Math.abs(q.x-g.x)<34&&Math.abs(q.y-(g.y+38))<50){q.got=true;if(q.jet){const gp=g.obs.find(o=>o.type==='gap'&&o.x>q.x);g.hover=gp?(gp.x+gp.w+140-g.x)/g.speed:2;st.jet={on:true};st.jetStage=0;g.vy=0}g.pts+=q.gear?100:q.jet?50:10;st.pops.push({x:st.landScreen?st.landScreen.x:0,y:st.landScreen?st.landScreen.y-60:0,age:0,txt:q.gear?'+100':q.jet?'Jetpack!':'+10'})}}
  function hurt(g,inv){g.lives--;g.inv=inv||1.4;st.shake=Math.max(st.shake,0.7);st.burst=true;
    if(g.lives<=0){g.over=true;g.overT=0;g.hover=0;st.jet.on=false;const sc2=score(g);if(sc2>best){best=sc2;try{localStorage.setItem('puli-best',String(best))}catch(e){}}}}
  function groundAt(g,x){for(const o of g.obs){if(o.type==='gap'&&x>o.x+10&&x<o.x+o.w-10)return -1e9;
      if(o.type==='bridge'&&x>o.x+10&&x<o.x+o.w-10)return o.trig!=null&&g.t-o.trig>0.5?-1e9:28}return 0}
  const score=g=>Math.floor((g.x-g.x0)/10)+g.pts;
  function gameVines(g,t){const P=[];for(const o of g.obs){if(o.x<g.x-1500||o.x>g.x+2600)continue;
      if(o.type==='vine'){const pts=[],top=1300,bot=o.bot+12;for(let i=0;i<=14;i++){const u=i/14,sw=Math.sin(t*1.7+o.x*0.01)*10*u*u;pts.push([o.x+sw,top+(bot-top)*u,-4+u*4])}pts.r=9;P.push(pts)}
      else if(o.type==='wall')for(let k=0;k<5;k++){const ox=o.x-28+k*14,oz=k%2?-9:9,pts=[],top=1300,bot=Math.min(top-40,o.bot+(k%2)*30);
        for(let i=0;i<=14;i++){const u=i/14,sw=Math.sin(t*1.2+k*1.7)*4*u+Math.sin(u*9+k)*5;pts.push([ox+sw,top+(bot-top)*u,oz])}pts.r=7.5;P.push(pts)}}
    return P.length?P:null}
  function gamePose(g,t,s){const sl=g.slideT>0&&g.gnd,ph=(g.x-g.x0)*0.03,gy=g.gnd?g.y:0;s.flame=g.hover>0;
    s.yaw=1.3;s.head=I();
    if(g.hover>0){s.world=[g.x,g.y+40,10];s.lean=0.25;s.armL=RX(-1.2);s.armR=RX(-1.0);s.legL=RX(-0.15);s.legR=RX(0.1);s.hidden=false;return}
    if(g.over){s.world=[g.x,12,10];s.lean=Math.PI/2;s.armL=RX(-2.8);s.armR=RX(-2.7);s.legL=I();s.legR=I();return}
    if(sl){s.world=[g.x,gy+22,10];s.lean=-1.15;s.armL=RX(-0.6);s.armR=RX(-0.4);s.legL=RX(-1.0);s.legR=RX(-0.85)}
    else if(!g.gnd){s.world=[g.x,g.y+40,10];s.lean=0.05;s.armL=RX(-2.3);s.armR=RX(-2.1);s.legL=RX(-0.7);s.legR=RX(0.45)}
    else{s.world=[g.x,gy+40+Math.abs(Math.sin(ph))*4,10];s.lean=0.14;s.armL=RX(-Math.sin(ph)*0.8);s.armR=RX(Math.sin(ph)*0.8);s.legL=RX(Math.sin(ph)*0.9);s.legR=RX(-Math.sin(ph)*0.9)}
    s.hidden=g.inv>0&&Math.floor(t*14)%2===0}

  function updateMode(o,sec,flyD){
    const{maxY}=o;const atBottom=!!o.pastWork,wentUp=!!o.workBack;
    if(st.mode==='sky'&&atBottom&&o.ready){st.gx=st.x;st.gy=st.y;st.gD=flyD;st.gyaw=st.yaw;go(o.reduce?'landed':'glitch');if(o.reduce)st.fp=1;st.jet={on:!o.reduce,p:[-150,14,60],v:[0,0,0],ang:Math.PI/2,av:0,rest:!!o.reduce};st.fc=null;st.fev=0;st.jetStage=o.reduce?3:0;st.vines=mkVines();
      try{scrollTo({top:maxY,behavior:o.reduce?'auto':'smooth'})}catch(e){}}
    else if((st.mode==='impact'||st.mode==='getup'||st.mode==='landed'||st.mode==='game')&&wentUp){if(o.reduce){st.mode='sky';st.fp=0}else{go('rise');st.g=null;st.fc=null;st.jet={on:true};st.jetStage=0}}
    st.mt+=sec;st.shake=Math.max(0,st.shake-sec*2.2);
    if(st.mode==='glitch'&&st.mt>1.1)go('fall');
    if(st.mode==='fall'){st.fp=1;if(st.mt>=FALL_T){go('impact');st.shake=1;st.dustPending=true}}
    if(st.mode==='impact'&&st.mt>0.9)go('getup');
    if(st.mode==='getup'&&st.mt>0.8)go('landed');
    if(st.mode==='landed'&&st.mt>0.5&&inp.jump){inp.jump=false;go('game');st.g=newGame(0);st.fc=null;st.gs=o.scrollY}
    if(st.mode==='landed')inp.jump=false;
    // pause only on a real scroll up, measured from where the run started (phone toolbars shift the page height a little)
    if(st.mode==='game'){if(st.gs==null||o.scrollY>st.gs)st.gs=o.scrollY}else st.gs=null;
    st.paused=st.mode==='game'&&o.scrollY<st.gs-Math.max(140,o.cssH*0.18);
    if(st.mode==='game'&&!st.paused)stepGame(st.g,sec);
    if(st.mode==='rise'){st.fp=Math.max(0,1-st.mt/1.3);if(st.fp<=0){st.mode='sky';st.riseDone=true}}}
  // the fall: high branch, second branch (the jetpack snaps off), vine slide, low branch, moss
  const P2=Math.PI;
  // sky, into the crowns, onto two vines (on his back) that stretch and snap, two thin branches, a last vine, then the moss
  const RB=CANY+20,V1Y=1849,V3Y=414;
  const FALL=[{t0:0,t1:1.7,k:'fall',p0:[0,4300],p1:[0,RB],l0:0.2,l1:4.71},{t0:1.7,t1:2.55,k:'lin',p0:[0,RB],p1:[-40,V1Y],l0:4.71,l1:4.71},
    {t0:2.55,t1:3.35,k:'stretch',p0:[-40,V1Y],p1:[-40,1560],l0:4.71},{t0:3.35,t1:3.85,k:'fall',p0:[-40,1560],p1:[60,1152],l0:4.71,l1:14.14},
    {t0:3.85,t1:4.0,k:'hold',p0:[60,1152],l0:14.14},{t0:4.0,t1:4.5,k:'arc',p0:[60,1152],p1:[-140,728],h:60,l0:14.14,l1:20.42},
    {t0:4.5,t1:4.65,k:'hold',p0:[-140,728],l0:20.42},{t0:4.65,t1:5.05,k:'fall',p0:[-140,728],p1:[-60,V3Y],l0:20.42,l1:23.56},
    {t0:5.05,t1:5.85,k:'stretch',p0:[-60,V3Y],p1:[-60,170],l0:23.56},{t0:5.85,t1:6.2,k:'fall',p0:[-60,170],p1:[0,12],l0:23.56,l1:26.70}];
  const FALL_T=6.2,HITS=[2.55,3.35,3.85,4.5,5.05,5.85];
  const mkVines=()=>[{a:[-650,1960,-5],b:[560,1930,-5],from:2.55,snap:3.3},{a:[-620,1895,18],b:[620,1905,18],from:2.6,snap:3.38},{a:[-520,520,0],b:[470,500,0],from:5.05,snap:5.85}];
  window.__puliMkVines=()=>mkVines();
  function vinePolys(t){const out=[];
    for(const v of st.vines||[]){const N=22,sag=110;
      const P=fallPath(Math.min(t,v.snap)),C=[P.x,P.y-14,v.a[2]];
      if(t<v.from){const pts=[];for(let i=0;i<=N;i++){const u=i/N;pts.push([lerp(v.a[0],v.b[0],u),lerp(v.a[1],v.b[1],u)-sag*4*u*(1-u),v.a[2]])}out.push(pts)}
      else if(t<v.snap){for(const[e,f]of[[v.a,C],[C,v.b]]){const pts=[];for(let i=0;i<=N/2;i++){const u=i/(N/2);pts.push([lerp(e[0],f[0],u),lerp(e[1],f[1],u)-14*4*u*(1-u),v.a[2]])}out.push(pts)}}
      else{const ts=t-v.snap;for(const e of[v.a,v.b]){const L=Math.hypot(C[0]-e[0],C[1]-e[1])*0.6,th0=Math.atan2(C[0]-e[0],-(C[1]-e[1])),th=th0*Math.exp(-1.6*ts)*Math.cos(4.5*ts),pts=[];
        for(let i=0;i<=N/2;i++){const u=i/(N/2),an=th*(1-0.35*u)+(e===v.a?1:-1)*0.15*u*u;pts.push([e[0]+L*u*Math.sin(an),e[1]-L*u*Math.cos(an),v.a[2]])}out.push(pts)}}}
    return out}
  function fallPath(t){const g=FALL.find(q=>t<q.t1)||FALL[FALL.length-1],u=Math.min(1,Math.max(0,(t-g.t0)/(g.t1-g.t0)));
    const p0=g.p0,p1=g.p1||g.p0;let x,y,lean=g.l0;
    if(g.k==='fall'){x=lerp(p0[0],p1[0],u);y=p0[1]-(p0[1]-p1[1])*u*u;lean=lerp(g.l0,g.l1,u)}
    else if(g.k==='lin'){x=lerp(p0[0],p1[0],u);y=lerp(p0[1],p1[1],u*(0.6+0.4*u));lean=g.l0}
    else if(g.k==='stretch'){const e=1-(1-u)*(1-u);x=p0[0];y=lerp(p0[1],p1[1],e)}
    else if(g.k==='arc'){x=lerp(p0[0],p1[0],u);y=lerp(p0[1],p1[1],Math.pow(u,1.6))+g.h*4*u*(1-u);lean=lerp(g.l0,g.l1,u)}
    else if(g.k==='slide'){const e=u*u*(3-2*u);x=lerp(p0[0],p1[0],e)+Math.sin(u*9)*4;y=lerp(p0[1],p1[1],e)}
    else{x=p0[0];y=p0[1]-Math.sin(u*Math.PI)*6}
    return{x,y,lean,k:g.k}}
  function pose(o,cssW,cssH,flyD,camM){
    const m=st.mode,Tm=st.mt,t=st.t,Ls=y=>toScreen(camM.V,[0,y,0],cssW,cssH),sh=st.shake;
    const s={flame:false,smoke:false,roll:0,yaw:st.yaw,head:I()};
    if(m==='glitch'){const k=Math.min(1,Tm/1.1);s.x=lerp(st.gx,cssW*0.5,sstep(0,0.5,k))+Math.sin(t*37)*4*k;s.y=lerp(st.gy,cssH*0.34,sstep(0,0.5,k))+Math.sin(t*29)*3*k+(k>0.7?(k-0.7)*120:0);
      s.D=st.gD;s.lean=0.12+Math.sin(t*21)*0.15*k;s.roll=Math.sin(t*17)*0.25*k;s.flame=(Math.floor(t*14)%3)!==0&&k<0.9;s.smoke=true;
      s.armL=RX(-0.4+Math.sin(t*19)*0.35*k);s.armR=RX(0.3-Math.sin(t*23)*0.35*k);s.legL=RX(0.2+Math.sin(t*15)*0.2*k);s.legR=RX(0.15-Math.sin(t*13)*0.2*k)}
    else if(m==='fall'){const f=fallPath(Tm);s.world=[f.x,f.y,10];s.lean=f.lean;s.yaw=lerp(st.gyaw,0.95,sstep(0,0.6,Tm));s.smoke=st.jetStage<1;
      s.hidden=f.y<CANY+40&&f.y>CANY-270;
      if(f.k==='stretch'){s.armL=mul(RZ(0.9),RX(-1.4));s.armR=mul(RZ(-0.9),RX(-1.4));s.legL=mul(RZ(0.25),RX(0.2));s.legR=mul(RZ(-0.25),RX(0.2));s.roll=Math.sin(t*9)*0.05}
      else if(f.k==='hold'){s.armL=RX(-2.6);s.armR=RX(-2.4);s.legL=RX(0.4);s.legR=RX(-0.2)}
      else{s.roll=Math.sin(t*5)*0.35;s.armL=RX(-2.4+Math.sin(t*13)*0.6);s.armR=RX(-2.2-Math.sin(t*11)*0.6);s.legL=RX(Math.sin(t*12)*0.6);s.legR=RX(-Math.sin(t*12)*0.6)}}
    else if(m==='impact'){const iy=12+(Tm<0.25?Math.sin(Tm/0.25*Math.PI)*8:0),land=Ls(iy);s.world=[0,iy,0];s.x=land.x;s.y=land.y;s.D=land.d;s.lean=Math.PI/2;s.yaw=0.95;
      s.armL=RX(-2.8);s.armR=RX(-2.7);s.legL=I();s.legR=I();s.smoke=false}
    else if(m==='getup'){const k=sstep(0,1,Tm/0.8),gy=lerp(12,40,k)+Math.sin(Math.PI*Math.min(1,Tm/0.8))*10,land=Ls(gy);s.world=[0,gy,0];s.x=land.x;s.y=land.y;s.D=land.d;
      s.lean=lerp(Math.PI/2,0,k);s.yaw=0.95;s.armL=RX(lerp(-2.8,0.1,k));s.armR=RX(lerp(-2.7,0.1,k));s.legL=RX(Math.sin(k*Math.PI)*0.7);s.legR=I()}
    else if(m==='landed'){const ly=40+Math.sin(t*2)*0.6,land=Ls(ly);s.world=[0,ly,0];s.x=land.x;s.y=land.y;s.D=land.d;s.lean=0.03;
      const p=st.pointer,want=p&&performance.now()-st.lastMove<6000?(p.x>land.x?0.95:-0.95):0.95+Math.sin(t*0.4)*0.25;st.lyaw=lerp(st.lyaw==null?0.95:st.lyaw,want,0.08);s.yaw=st.lyaw;
      s.armL=mul(RX(0.08+Math.sin(t*2)*0.03),RZ(0.06));s.armR=mul(RX(0.08-Math.sin(t*2)*0.03),RZ(-0.06));s.legL=I();s.legR=I();s.smoke=false;
      if(p){const dx=(p.x-land.x)/cssW,dy=(p.y-land.y)/cssH;s.head=mul(RY(clamp(dx*0.8,-0.4,0.4)*Math.sign(Math.cos(s.yaw))),RX(clamp(-dy*0.6,-0.3,0.3)))}}
    else if(m==='game'&&st.g){gamePose(st.g,t,s)}
    else if(m==='rise'){const land=Ls(40),k=1-st.fp,b=1-sstep(0,0.3,k);s.x=lerp(cssW*0.5,land.x,b);s.y=lerp(cssH*0.38,land.y,b);s.D=lerp(flyD,land.d,b);
      s.lean=-0.1;s.yaw=0.95;s.flame=true;s.armL=RX(-2.7);s.armR=RX(0.3);s.legL=RX(0.12);s.legR=RX(0.05)}
    if(sh>0){s.x+=Math.sin(t*61)*7*sh;s.y+=Math.cos(t*53)*7*sh}
    return s}
  // overlay effects for the forest
  const FF=Array.from({length:28},(_,i)=>({x:Math.random(),y:0.35+Math.random()*0.6,ph:Math.random()*6,sp:0.3+Math.random()*0.5}));
  function forestOverlay(oc,cssW,cssH,cover,night,sec,A){
    if(st.mode==='fall'&&st.camY<CANY+260&&st.camY>CANY-260)for(let i=0;i<5;i++)st.leaves.push({x:Math.random()*cssW,y:cssH+80,v:1400+Math.random()*1600,s:8+Math.random()*26,c:['#3e6a2c','#2f4f23','#5f8a36','#6f9a3e','#24401c'][i%5],r:Math.random()*6,vr:(Math.random()-0.5)*6});
    st.leaves=st.leaves.filter(l=>(l.y-=l.v*sec)>-40);
    for(const l of st.leaves){l.r+=(l.vr||0)*sec;oc.fillStyle=l.c;oc.save();oc.translate(l.x,l.y);oc.rotate(l.r);oc.beginPath();oc.ellipse(0,0,l.s*0.55,l.s,0,0,Math.PI*2);oc.fill();oc.restore()}
    if(cover<0.05)return;
    if(night<0.5){const a=0.05*cover*(1-night*2);oc.globalCompositeOperation='lighter';
      for(let i=0;i<5;i++){const x=cssW*(0.12+i*0.2)+Math.sin(st.t*0.2+i)*20,w=cssW*(0.04+0.03*((i*7)%3));
        const g=oc.createLinearGradient(0,0,0,cssH);g.addColorStop(0,`rgba(255,240,200,${a})`);g.addColorStop(1,'rgba(255,240,200,0)');oc.fillStyle=g;
        oc.beginPath();oc.moveTo(x,0);oc.lineTo(x+w,0);oc.lineTo(x+w+cssH*0.35,cssH);oc.lineTo(x+cssH*0.35-w*0.5,cssH);oc.closePath();oc.fill()}
      oc.globalCompositeOperation='source-over'}

    if(st.burst&&st.landScreen){st.burst=false;for(let i=0;i<22;i++)st.dust.push({x:st.landScreen.x+(Math.random()-0.5)*50,y:st.landScreen.y,vx:(Math.random()-0.5)*380,vy:-80-Math.random()*220,age:0,life:0.7+Math.random()*0.6,c:['#5f8a36','#3e6a2c','#9fbf5a','#f2f2e6'][i%4]})}
    if(st.dustPending&&st.landScreen){st.dustPending=false;for(let i=0;i<26;i++)st.dust.push({x:st.landScreen.x+(Math.random()-0.5)*40,y:st.landScreen.y+st.landScreen.h*0.1,vx:(Math.random()-0.5)*420,vy:-40-Math.random()*160,age:0,life:0.6+Math.random()*0.5,c:Math.random()<0.6?'#8a7656':'#e7d58a'})}
    st.dust=st.dust.filter(q=>(q.age+=sec)<q.life);
    for(const q of st.dust){q.vy+=300*sec;q.vx*=1-sec*2.5;q.x+=q.vx*sec;q.y+=q.vy*sec;oc.globalAlpha=(1-q.age/q.life)*0.85;oc.fillStyle=q.c;oc.fillRect(q.x-3,q.y-3,6,6)}
    oc.globalAlpha=1}
  const partBuf=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,mainBuf);

  // ---------- tiny matrix kit (column-major) ----------
  const I=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
  const mul=(a,b)=>{const o=new Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s}return o};
  const T=(x,y,z)=>[1,0,0,0,0,1,0,0,0,0,1,0,x,y,z,1];
  const S=k=>[k,0,0,0,0,k,0,0,0,0,k,0,0,0,0,1];
  const RX=a=>{const c=Math.cos(a),s=Math.sin(a);return[1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]};
  const RY=a=>{const c=Math.cos(a),s=Math.sin(a);return[c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]};
  const RZ=a=>{const c=Math.cos(a),s=Math.sin(a);return[c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]};
  const RA=(ax,a)=>{const[x,y,z]=ax,c=Math.cos(a),s=Math.sin(a),t=1-c;return[t*x*x+c,t*x*y+s*z,t*x*z-s*y,0,t*x*y-s*z,t*y*y+c,t*y*z+s*x,0,t*x*z+s*y,t*y*z-s*x,t*z*z+c,0,0,0,0,1]};
  const xf=(m,p)=>[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];
  const xd=(m,p)=>[m[0]*p[0]+m[4]*p[1]+m[8]*p[2],m[1]*p[0]+m[5]*p[1]+m[9]*p[2],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]];
  const xdT=(m,p)=>[m[0]*p[0]+m[1]*p[1]+m[2]*p[2],m[4]*p[0]+m[5]*p[1]+m[6]*p[2],m[8]*p[0]+m[9]*p[1]+m[10]*p[2]];
  const norm=v=>{const l=Math.hypot(...v)||1;return v.map(a=>a/l)};
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const persp=(f,asp,n,fa)=>{const t=1/Math.tan(f/2);return[t/asp,0,0,0,0,t,0,0,0,0,(fa+n)/(n-fa),-1,0,0,2*fa*n/(n-fa),0]};
  const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
  const lerp=(a,b,t)=>a+(b-a)*t, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  // ---------- flight state ----------
  const st=window.__puli={jetStage:0,vines:null,jet:{on:true},fc:null,fev:0,mode:'sky',mt:0,fp:0,shake:0,cover:0,leaves:[],dust:[],birds:[],feathers:[],pops:[],birdWait:1.5,pathT:0,spinT:-1,spinWait:8,x:-300,y:innerHeight*0.4,vx:0,vy:0,yaw:0.9,lean:0,roll:0,aimArm:null,recoil:0,pointer:null,lastMove:-1e9,parts:[],shots:[],cool:0,t:0};
  const isTouch=matchMedia('(pointer: coarse)').matches;
  addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){st.pointer={x:e.clientX,y:e.clientY};st.lastMove=performance.now()}},{passive:true});
  const overlay=document.createElement('canvas');overlay.setAttribute('aria-hidden','true');
  overlay.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:3';
  document.body.appendChild(overlay);const oc=overlay.getContext('2d');
  // banked birds carry over to the game at the end of the page
  let bank=0;try{bank=parseInt(localStorage.getItem('puli-bank')||'0',10)||0}catch(e){}
  const pill=document.createElement('div');pill.className='pill bankpill';pill.setAttribute('aria-live','polite');
  pill.style.cssText='position:fixed;right:clamp(16px,4vw,40px);bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:5;height:34px;font-size:13px;font-weight:500;pointer-events:none;opacity:0;transition:opacity .4s';
  const setPill=()=>{pill.innerHTML=bank?`<b style="font-variant-numeric:tabular-nums">${bank}</b>&nbsp;${bank===1?'bird':'birds'} banked for the game`:'Tap a bird. Puli banks it for the game'};
  setPill();document.body.appendChild(pill);
  function fire(tx,ty,bird,wall){if(st.cool>0)return false;st.cool=0.22;st.fireAt={x:tx,y:ty};st.fireBird=bird||null;st.fireWall=wall||null;st.pendingShot=true;st.recoil=1;return true}
  addEventListener('pointerdown',e=>{if(e.target.closest&&e.target.closest('a,button,.card-p,input,textarea,select'))return;
    st.pointer={x:e.clientX,y:e.clientY};st.lastMove=performance.now();if(st.mode!=='sky')return;
    let best=null,bd=1e9;for(const b of st.birds){if(!b.alive||b.targeted)continue;const d=Math.hypot(b.x-e.clientX,b.y-e.clientY);if(d<Math.max(28,b.size*0.75)&&d<bd){bd=d;best=b}}
    if(best){best.targeted=true;fire(best.x,best.y,best)}else fire(e.clientX,e.clientY)},{passive:true});

  const FOV=0.42; // vertical field of view (radians); gentle perspective
  let watchScreen=null;

  function draw(o){
    const{w,h,cssW,cssH,dt,night,inside,camY,ready,reduce}=o;st.night=night;const sec=Math.min(0.05,dt/1000);st.t+=sec;st.cool=Math.max(0,st.cool-sec);
    const outfit=night>0.5?'night':'day',A=ACC[outfit].map(hex);
    // size: about a fifth of the screen height
    const hPx=window.PULI_H||clamp(cssH*0.2,120,210),D0=80/(2*Math.tan(FOV/2)*(hPx/cssH));let D=D0;
    updateMode(o,sec,D0);
    if(st.riseDone&&st.lastSc){st.x=st.lastSc.x;st.y=st.lastSc.y;st.vx=0;st.vy=0;st.riseDone=false}
    // where to fly: keep a little distance from the pointer, on whichever side he already is
    let tx,ty;const p=st.pointer,active=p&&performance.now()-st.lastMove<(isTouch?3000:4000);
    if(!ready){tx=-hPx;ty=cssH*0.45}
    else if(active){const side=st.x<p.x?-1:1,R=hPx*0.95;tx=p.x+side*R;ty=p.y+hPx*0.15;
      tx=clamp(tx,hPx*0.35,cssW-hPx*0.35);ty=clamp(ty,hPx*0.55,cssH-hPx*0.5)}
    else{// nobody steering: cruise a slow figure-eight across the screen
      st.pathT+=sec*0.2;const narrow=cssW<700;
      tx=cssW*0.5+Math.sin(st.pathT)*cssW*(narrow?0.32:0.36);
      ty=cssH*(narrow?0.56:0.5)+Math.sin(st.pathT*2)*cssH*0.15+Math.sin(st.pathT*0.63)*cssH*0.05}
    const k=!ready?3.2:active?7:2.4;st.vx+=((tx-st.x)*k*k-st.vx*2*k)*sec;st.vy+=((ty-st.y)*k*k-st.vy*2*k)*sec;st.x+=st.vx*sec;st.y+=st.vy*sec;
    // face the pointer (three-quarter view), lean into the motion, bank on turns
    const look=p&&active?p.x-st.x:(ready?st.vx:1);const wantYaw=look>20?0.95:look<-20?-0.95:(Math.sin(st.yaw)>=0?0.95:-0.95);
    // now and then, a spin while cruising
    if(!active&&ready&&!reduce){st.spinWait-=sec;if(st.spinWait<0&&Math.abs(st.vx)>90){st.spinT=0;st.spinWait=11+Math.random()*7}}
    let spin=0;if(st.spinT>=0){st.spinT+=sec/1.1;const e=Math.min(1,st.spinT);spin=Math.PI*2*(e<.5?2*e*e:1-Math.pow(-2*e+2,2)/2);if(st.spinT>=1)st.spinT=-1}
    st.yaw=lerp(st.yaw,wantYaw,1-Math.exp(-sec*5));
    const fwd=Math.sign(Math.sin(st.yaw))*st.vx;
    st.lean=lerp(st.lean,clamp(0.15+fwd*0.0008,-0.1,0.5),1-Math.exp(-sec*4));
    st.roll=lerp(st.roll,clamp(-st.vx*0.00035,-0.35,0.35),1-Math.exp(-sec*4));
    st.recoil=Math.max(0,st.recoil-sec*6);
    const bob=reduce?0:Math.sin(st.t*2.3)*hPx*0.025;
    let sx=st.x,sy=st.y+bob;
    let fcam=st.mode==='sky'||st.mode==='glitch'?null:forestCam(st.fp);
    if(st.mode==='game'&&st.g){const g=st.g,asp=cssW/cssH,tf=Math.tan(FOV/2),dist=asp<1.2?Math.min(2600,Math.max(700,230/(tf*asp))):700,halfW=dist*tf*asp;st.look=halfW*1.5;const cy=140+(dist-700)*0.14+Math.max(0,g.y-110)*0.7,tgt={x:g.x+halfW*0.5,y:cy,z:10+dist,pitch:-Math.max(0.07,Math.atan2(cy-90,dist))};if(!st.fc)st.fc={...forestCam(1)};const kk=1-Math.exp(-sec*5);for(const q of['x','y','z','pitch'])st.fc[q]=lerp(st.fc[q],tgt[q],kk);st.fc.x=Math.min(st.fc.x,g.x+halfW*0.6);fcam={...st.fc}}
    if(st.mode==='fall'){const tm=st.mt,f=fallPath(tm),land=forestCam(1),b=sstep(5.75,FALL_T,tm),k0=sstep(0,0.9,tm),kc=sstep(1.55,2.35,tm);
      const oy=lerp(lerp(30,820,k0),150,kc),oz=lerp(10+D0,1300,k0),op=lerp(lerp(-0.05,-0.6,k0),-0.1,kc);
      const tgt={x:lerp(f.x*0.3,land.x,b),y:lerp(f.y+oy,land.y,b*b),z:lerp(oz,land.z,b),pitch:lerp(op,land.pitch,b)};
      if(!st.fc)st.fc={...tgt};const kk=1-Math.exp(-sec*(tm<0.3?40:12));for(const q of['x','y','z','pitch'])st.fc[q]=lerp(st.fc[q],tgt[q],kk);fcam={...st.fc};
      for(const ht of HITS)if(st.fev<ht&&st.mt>=ht){st.shake=Math.max(st.shake,ht===3.35||ht===5.85?0.35:0.6);st.burst=true;
        if(ht===2.55)st.jetStage=1;if(ht===3.85)st.jetStage=2;
        if(ht===4.5&&st.jet.on){const f2=fallPath(ht);st.jetStage=3;st.jet={on:false,p:[f2.x,f2.y,10],v:[-70,160,90],ang:f2.lean+1.2,av:6,rest:false}}}
      if(st.fev<CANY&&false){}
      st.fev=st.mt}
    const camM=camMats(fcam?{...fcam,y:fcam.y+Math.sin(st.t*47)*5*st.shake}:forestCam(1),cssW/cssH);
    const sc=st.mode==='sky'?null:pose(o,cssW,cssH,D0,camM);
    if(sc&&sc.world){const ps=toScreen(camM.V,sc.world,cssW,cssH);sc.x=ps.x;sc.y=ps.y;sc.D=ps.d}
    if(sc){sx=sc.x;sy=sc.y;D=sc.D;st.lastSc={x:sx,y:sy}}
    if(st.mode==='game'&&st.g)for(const o of st.g.obs)if(o.type==='wall'){const q=toScreen(camM.V,[o.x,95,0],cssW,cssH);o.sx=q.x;o.sy=q.y}
    st.cover=fcam?sstep(CANY+250,CANY-150,fcam.y):0;st.camY=fcam?fcam.y:1e9;
    {const g=st.g,ready=st.mode==='landed'&&st.mt>0.4,inGame=st.mode==='game'&&g;
      let msg='';if(ready)msg=isTouch?'Tap to run. Swipe down to slide':'Press Space to run. Down arrow to slide';
      else if(inGame&&g.over)msg=`Score ${score(g)}. Best ${best}. ${isTouch?'Tap':'Press Space'} to run again`;else if(inGame&&st.paused)msg='Paused. Scroll down to keep running';else if(inGame&&g.hint>0)msg=isTouch?'Vine wall ahead. Tap Fire laser to cut it':'Vine wall ahead. Press F to cut it with the laser';
      if(caption.textContent!==msg)caption.textContent=msg;caption.style.opacity=msg?'1':'0';
      const lives=inGame?g.lives:1+Math.min(2,Math.floor(bank/5)),hs=inGame?`Score ${score(g)}  ·  Best ${best}  ·  Lives ${Math.max(0,lives)}`:ready?`Best ${best}  ·  Lives ${lives}${bank>=5?' (from your birds)':''}`:'';
      if(hud.textContent!==hs)hud.textContent=hs;hud.style.opacity=hs?'1':'0';
      const play=ready||inGame,wallNear=inGame&&!g.over&&!st.paused&&liveWalls().length>0;laserBtn.style.display=wallNear?'inline-flex':'none';if(wallNear)laserBtn.style.opacity=String(0.75+0.25*Math.sin(st.t*10));
      pad.style.display=play?'block':'none';back.style.display=play&&isTouch?'inline-flex':'none'}
    // root matrix in view space
    if(window.PULI_YAW!=null){st.yaw=window.PULI_YAW;st.lean=0;st.roll=0;spin=0;st.x=window.PULI_X;st.y=window.PULI_Y}
    const R=sc?mul(RZ(sc.roll),mul(RY(sc.yaw),RX(sc.lean))):mul(RZ(st.roll),mul(RY(st.yaw+spin),RX(st.lean)));
    const root=sc&&sc.world?mul(camM.V,mul(T(...sc.world),R)):mul(T(0,0,-D),R);
    const pvR=toM(...PIV.root);
    const child=(g,rot)=>{const pv=toM(...PIV[g]);return mul(root,mul(T(pv[0]-pvR[0],pv[1]-pvR[1],pv[2]-pvR[2]),rot))};
    // pointer in view space on the character's depth plane
    const pxToV=(D*2*Math.tan(FOV/2))/cssH;
    const aimPt=st.fireAt&&st.recoil>0?st.fireAt:(p&&active?p:{x:sx+(Math.sin(st.yaw)>0?300:-300),y:sy+40});
    const aimV=[(aimPt.x-sx)*pxToV,-(aimPt.y-sy)*pxToV,-D];
    // left arm (watch arm) points at the pointer
    const shoulderL=xf(child('armL',I()),[0,0,0]);
    const dirV=norm(sub(aimV,shoulderL));
    const RlInv=mul(R,I());let dl=norm(xdT(RlInv,dirV));// into body space
    const rest=[0,-1,0];let ax=cross(rest,dl);const ang=Math.acos(clamp(rest[0]*dl[0]+rest[1]*dl[1]+rest[2]*dl[2],-1,1));
    const armL=Math.hypot(...ax)<1e-4?I():RA(norm(ax),ang-st.recoil*0.15);
    const swing=reduce?0:Math.sin(st.t*2.3+1.2);
    const armR=mul(RX(0.35+swing*0.05),RZ(-0.12));
    const legs=RX(0.22+st.lean*0.25+swing*0.04),legs2=RX(0.16+st.lean*0.25-swing*0.04);
    const headLook=mul(RY(clamp(-dl[0]*0.25,-0.3,0.3)),RX(clamp(dl[1]*0.25,-0.25,0.3)));
    const mats=sc?{root,head:child('head',sc.head),armR:child('armR',sc.armR),armL:child('armL',sc.armL),legR:child('legR',sc.legR),legL:child('legL',sc.legL)}:{root,head:child('head',headLook),armR:child('armR',armR),armL:child('armL',armL),legR:child('legR',legs),legL:child('legL',legs2)};
    if(sc)st.landScreen={x:sx,y:sy,h:80*(cssH/(2*Math.tan(FOV/2)))/D};

    const asp=cssW/cssH,Pm=sc&&sc.world?camM.P:persp(FOV,asp,D*0.5,D*2);
    const shift=sc&&sc.world?[0,0]:[sx/cssW*2-1,1-sy/cssH*2];
    // screen position of the watch (laser origin)
    const wv=xf(mats.armL,[0,-17.5,0]);
    const proj=v=>({x:sx+v[0]/(-v[2])*(cssH/(2*Math.tan(FOV/2))),y:sy-v[1]/(-v[2])*(cssH/(2*Math.tan(FOV/2)))});
    watchScreen=proj(wv);

    // lighting: same sun / moon as the clouds and mountain
    const mixv=(a,b)=>a.map((v,i)=>lerp(v,b[i],night));
    st.push=lerp(st.push||0,st.mode==='game'?1:0,1-Math.exp(-sec*2.2));
    let L=norm(mixv([0.62,0.45,0.62],[0.42,0.62,0.62]));
    const below=clamp((0.2-camY)/0.8,0,1);
    let sun=mixv([1.22,1.08,0.90],[0.66,0.74,1.00]).map(v=>v*(1-below*0.35));
    let sky=mixv([0.50,0.60,0.82],[0.30,0.34,0.52]);
    let gnd=mixv([0.62,0.62,0.66],[0.16,0.18,0.28]);
    let rimL=norm([-0.55,0.35,-0.75]),rim=mixv([0.55,0.55,0.62],[0.30,0.36,0.65]);
    let fog=mixv([0.84,0.84,0.88],[0.12,0.17,0.30]);
    if(st.cover>0){const c=st.cover,mx=(a,b)=>a.map((v,i)=>lerp(v,b[i],c));
      L=norm(mx(L,mixv([0.45,0.8,0.35],[-0.3,0.85,0.4])));sun=mx(sun,mixv([0.95,0.86,0.70],[0.44,0.48,0.70]));sky=mx(sky,mixv([0.40,0.50,0.42],[0.17,0.22,0.30]));
      gnd=mx(gnd,mixv([0.24,0.30,0.20],[0.04,0.06,0.07]));rim=mx(rim,mixv([0.25,0.30,0.22],[0.18,0.80,0.78]))}

    // remember the scene passes' vertex attribute state so it can be restored afterwards
    const saved=[];for(let i=0;i<4;i++)saved.push({en:gl.getVertexAttrib(i,gl.VERTEX_ATTRIB_ARRAY_ENABLED),buf:gl.getVertexAttrib(i,gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING),
      size:gl.getVertexAttrib(i,gl.VERTEX_ATTRIB_ARRAY_SIZE),type:gl.getVertexAttrib(i,gl.VERTEX_ATTRIB_ARRAY_TYPE),norm:gl.getVertexAttrib(i,gl.VERTEX_ATTRIB_ARRAY_NORMALIZED),
      stride:gl.getVertexAttrib(i,gl.VERTEX_ATTRIB_ARRAY_STRIDE),off:gl.getVertexAttribOffset(i,gl.VERTEX_ATTRIB_ARRAY_POINTER)});
    const prevProg=gl.getParameter(gl.CURRENT_PROGRAM),prevBuf=gl.getParameter(gl.ARRAY_BUFFER_BINDING);
    gl.useProgram(pr);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.clear(gl.DEPTH_BUFFER_BIT);gl.viewport(0,0,w,h);
    const setCharU=()=>{gl.uniformMatrix4fv(U.uP,false,Pm);gl.uniform2f(U.uShift,shift[0],shift[1]);
      gl.uniform3fv(U.uL,L);gl.uniform3fv(U.uSun,sun);gl.uniform3fv(U.uSky,sky);gl.uniform3fv(U.uGnd,gnd);
      gl.uniform3fv(U.uRimL,rimL);gl.uniform3fv(U.uRim,rim);gl.uniform3fv(U.uFog,fog);gl.uniform1f(U.uFogA,inside*0.42*(1-st.cover));gl.uniform1f(U.uGlow,1.35);
      gl.uniform1f(U.uFogD,0);gl.uniform1f(U.uDap,0);gl.uniform1f(U.uNG,0);gl.uniform1f(U.uT,st.t)};
    setCharU();
    for(let i=0;i<4;i++)gl.enableVertexAttribArray(i);
    const bindFmt=()=>{gl.vertexAttribPointer(0,3,gl.FLOAT,false,44,0);gl.vertexAttribPointer(1,3,gl.FLOAT,false,44,12);gl.vertexAttribPointer(2,3,gl.FLOAT,false,44,24);gl.vertexAttribPointer(3,2,gl.FLOAT,false,44,36)};
    if(fcam){drawForest(camM,st.cover,night,w,h,cssW,cssH,mixv,st.t,st.mode==='game'&&st.g?gameVines(st.g,st.t):st.vines?vinePolys(st.mode==='fall'?st.mt:99):null,[fcam.x,fcam.y,fcam.z],st.mode==='game'?st.g:null);gl.useProgram(pr);for(let i=0;i<4;i++)gl.enableVertexAttribArray(i);gl.depthMask(true);gl.clear(gl.DEPTH_BUFFER_BIT);setCharU()}
    const M=MESH[outfit];
    const J=st.jet;
    if(!J.on&&J.p&&fcam){if(!J.rest){J.v[1]-=700*sec;for(let k=0;k<3;k++)J.p[k]+=J.v[k]*sec;J.ang+=J.av*sec;
        if(J.p[1]<=14){J.p[1]=14;if(Math.abs(J.v[1])>140){J.v[1]*=-0.3;J.v[0]*=0.5;J.v[2]*=0.5;J.av*=0.5;st.jetThud=true}else{J.rest=true;J.ang=Math.PI/2}}}
      mats.jet=mul(camM.V,mul(T(...J.p),mul(RY(0.8),RX(J.ang))))}
    else if(J.on){const ja=st.jetStage===1?0.45:st.jetStage===2?1.15+Math.sin(st.t*9)*0.25:0;mats.jet=ja?mul(root,mul(T(0,19,-10),mul(RX(ja),T(0,-19+(st.jetStage===2?-4:0),10)))):root}
    for(const g of GROUPS){if(sc&&sc.hidden&&g!=='jet')continue;if(sc&&sc.hidden&&J.on)continue;if(g==='jet'&&!mats.jet)continue;if(g==='jet'&&!J.on&&sc&&!sc.world)continue;gl.bindBuffer(gl.ARRAY_BUFFER,M[g].bf);bindFmt();gl.uniformMatrix4fv(U.uM,false,mats[g]);gl.drawArrays(gl.TRIANGLES,0,M[g].n)}

    if(st.mode==='game'&&st.g)for(const o of st.g.obs){if(o.type!=='bird'&&o.type!=='owl')continue;if(o.type==='bird'&&night>0.5)continue;const ow=o.type==='owl',fl=ow&&o.tilt<-0.25?0.25:Math.sin(st.t*(ow?9:14)+o.x*0.01)*0.9,bm=mul(camM.V,mul(T(o.x,o.y,10),mul(RY(Math.PI-0.3),mul(RZ(ow?o.tilt:0),S(ow?4.6:3)))));
      for(const[m,mm]of[[BIRD.body,bm],[BIRD.wingL,mul(bm,mul(T(0,0.6,1),RX(-fl)))],[BIRD.wingR,mul(bm,mul(T(0,0.6,-1),RX(fl)))]]){gl.bindBuffer(gl.ARRAY_BUFFER,m.bf);bindFmt();gl.uniformMatrix4fv(U.uM,false,mm);gl.drawArrays(gl.TRIANGLES,0,m.n)}}
    // jet exhaust: small glowing cubes from the two nozzles
    const down=norm(xd(R,[0,-1,-0.3]));
    if(!reduce&&st.jet.on&&(!sc||sc.flame||sc.smoke))for(const nz of[[13.5,44,7.5],[33.5,44,7.5]]){const m=toM(...nz);const wp=xf(root,[m[0]-pvR[0],m[1]-pvR[1],m[2]-pvR[2]]);
      if(!sc||sc.flame)for(let i=0;i<2;i++)st.parts.push({p:wp.map(v=>v+(Math.random()-0.5)*1.6),v:down.map((d,j)=>d*(70+Math.random()*50)+(j===1?0:(Math.random()-0.5)*14)),age:0,life:0.28+Math.random()*0.2,s:1.6+Math.random()*1.4});
      if(sc&&sc.smoke&&Math.random()<0.5){const g=0.35+Math.random()*0.25;st.parts.push({p:wp.map(v=>v+(Math.random()-0.5)*3),v:[(Math.random()-0.5)*30,30+Math.random()*40,(Math.random()-0.5)*30],age:0,life:0.6+Math.random()*0.5,s:2.4+Math.random()*2,col:[g,g,g*1.05]})}}
    st.parts=st.parts.filter(q=>(q.age+=sec)<q.life);
    const pd=[];const cube=(c,s,col,e)=>{const F=[[0,1],[0,-1],[1,1],[1,-1],[2,1],[2,-1]];
      for(const[a,sg]of F){const ax2=[0,1,2].filter(k=>k!==a);const n=[0,0,0];n[a]=sg;
        const cs=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>{const q=[c[0],c[1],c[2]];q[a]+=sg*s;q[ax2[0]]+=u*s;q[ax2[1]]+=v*s;return q});
        for(const i of[0,1,2,0,2,3]){const q=cs[i];pd.push(q[0],q[1],q[2],col[0],col[1],col[2],n[0],n[1],n[2],1,e)}}};
    for(const q of st.parts){q.p=q.p.map((v,j)=>v+q.v[j]*sec);const k2=q.age/q.life;
      if(q.col){cube(q.p,q.s*(1+k2*0.8),q.col,0);continue}const col=k2<0.25?A[0]:k2<0.6?A[1]:A[2].map(v=>v*(1-(k2-0.6)*1.5));cube(q.p,q.s*(1-k2*0.7),col,1)}
    if(st.mode==='game'&&st.g)for(const q of st.g.pick)if(q.jet&&!q.got){const yy=q.y+Math.sin(st.t*3)*6,sp=st.t*2.2,cs=Math.cos(sp),sn=Math.sin(sp);
      cube([q.x,yy+4,10],10,[0.16,0.16,0.18],0);for(const sg of[-1,1]){cube([q.x+sg*cs*7,yy-9,10+sg*sn*7],4,A[1],1);if(Math.random()<0.6)st.parts.push({p:[q.x+sg*cs*7,yy-14,10+sg*sn*7],v:[0,-60-Math.random()*40,0],age:0,life:0.25,s:2})}}
    if(pd.length){gl.bindBuffer(gl.ARRAY_BUFFER,partBuf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(pd),gl.DYNAMIC_DRAW);bindFmt();
      gl.uniformMatrix4fv(U.uM,false,I());gl.drawArrays(gl.TRIANGLES,0,pd.length/11)}
    // birds: spawn in the open sky (above or below the cloud), none inside it
    const openSky=(camY>0.9||camY<0.12)&&st.mode==='sky';pill.style.opacity=ready&&st.mode==='sky'&&(openSky||bank)?'1':'0';
    const alive=st.birds.filter(b=>b.alive).length,want=openSky&&ready?(cssW<700?4:7):0;
    st.birdWait-=sec;
    if(alive<want&&st.birdWait<0){const n=1+Math.floor(Math.random()*3),dir=Math.random()<0.5?1:-1,y0=cssH*(0.14+Math.random()*0.42),sp=(70+Math.random()*80)*(cssW<700?0.8:1),sz=(30+Math.random()*26)*(cssW<700?0.85:1);
      for(let i=0;i<n;i++)st.birds.push({x:dir>0?-60-i*44:cssW+60+i*44,y:y0+(i%2?1:-1)*i*16,vx:dir*sp*(0.92+Math.random()*0.16),vy:0,ph:Math.random()*6,size:sz*(0.9+Math.random()*0.2),alive:true,spin:0});
      st.birdWait=1.2+Math.random()*2.5}
    if(!openSky)st.birds.forEach(b=>{if(b.alive)b.vx*=1+sec*1.5});
    for(const b of st.birds){if(b.alive){b.x+=b.vx*sec;b.y+=Math.sin(st.t*1.3+b.ph)*14*sec}else{b.vy+=820*sec;b.x+=b.vx*sec;b.y+=b.vy*sec;b.spin+=sec*9}}
    st.birds=st.birds.filter(b=>b.x>-140&&b.x<cssW+140&&b.y<cssH+80);
    if(st.birds.length&&st.cover<0.3){gl.uniform3fv(U.uFog,fog);
      for(const b of st.birds){const k=b.size*pxToV/18,dirR=b.vx>=0,flap=b.alive?(Math.sin(st.t*0.8+b.ph)>0.55?0.12:Math.sin(st.t*12+b.ph)*0.85):0.5;
        const pitch=b.alive?Math.sin(st.t*1.3+b.ph)*0.12:b.spin;
        const br=mul(T(0,0,-D),mul(RY(dirR?-0.35:Math.PI+0.35),mul(RX(0.18),mul(RZ(pitch),S(k)))));
        gl.uniform2f(U.uShift,b.x/cssW*2-1,1-b.y/cssH*2);
        const parts=[[BIRD.body,br],[BIRD.wingL,mul(br,mul(T(0,0.6,1),RX(-flap)))],[BIRD.wingR,mul(br,mul(T(0,0.6,-1),RX(flap)))]];
        for(const[m,mm]of parts){gl.bindBuffer(gl.ARRAY_BUFFER,m.bf);bindFmt();gl.uniformMatrix4fv(U.uM,false,mm);gl.drawArrays(gl.TRIANGLES,0,m.n)}}}
    saved.forEach((a,i)=>{if(a.buf){gl.bindBuffer(gl.ARRAY_BUFFER,a.buf);gl.vertexAttribPointer(i,a.size,a.type,a.norm,a.stride,a.off)}if(a.en)gl.enableVertexAttribArray(i);else gl.disableVertexAttribArray(i)});
    gl.bindBuffer(gl.ARRAY_BUFFER,mainBuf);gl.useProgram(prevProg);gl.disable(gl.DEPTH_TEST);

    // laser: drawn on a 2D overlay so it can glow across the whole screen
    const dpr=w/cssW;if(overlay.width!==w||overlay.height!==h){overlay.width=w;overlay.height=h}
    oc.setTransform(1,0,0,1,0,0);oc.clearRect(0,0,w,h);oc.setTransform(dpr,0,0,dpr,0,0);
    if(st.pendingShot){st.pendingShot=false;st.shots.push({bird:st.fireBird,wall:st.fireWall,a:{...watchScreen},b:{...st.fireAt},age:0,seed:Math.random()*6,dur:Math.max(0.05,Math.hypot(st.fireAt.x-watchScreen.x,st.fireAt.y-watchScreen.y)/2600)})}
    const css=a=>`rgb(${a.map(v=>Math.round(v*255)).join(',')})`;
    st.shots=st.shots.filter(s=>(s.age+=sec)<s.dur+0.25);
    forestOverlay(oc,cssW,cssH,st.cover,night,sec,A);
    for(const s of st.shots){const W=s.wall;if(W){if(!W.cut)s.b={x:W.sx,y:W.sy};
        if(s.age>=s.dur&&!W.cut&&!W.done){W.cut=true;W.done=true;if(st.g)st.g.pts+=25;st.pops.push({x:W.sx,y:W.sy-30,age:0,txt:'+25'});
          for(let i=0;i<16;i++)st.feathers.push({x:W.sx+(Math.random()-0.5)*20,y:W.sy+(Math.random()-0.5)*60,vx:(Math.random()-0.3)*260,vy:-80-Math.random()*200,age:0,life:0.7+Math.random()*0.6,c:Math.random()<0.5?'#3f6b2a':'#7fa04a',r:Math.random()*6})}continue}
      const b=s.bird;if(!b)continue;if(b.alive){s.b={x:b.x,y:b.y}}
      if(s.age>=s.dur&&b.alive){b.alive=false;b.vy=-120;b.vx*=0.3;bank++;try{localStorage.setItem('puli-bank',String(bank))}catch(e){}setPill();
        st.pops.push({x:b.x,y:b.y-10,age:0});
        for(let i=0;i<12;i++)st.feathers.push({x:b.x,y:b.y,vx:(Math.random()-0.5)*220,vy:-60-Math.random()*160,age:0,life:0.7+Math.random()*0.6,c:Math.random()<0.5?BC.belly:BC.back,r:Math.random()*6})}}
    // feathers and "+1"
    st.feathers=st.feathers.filter(f=>(f.age+=sec)<f.life);
    for(const f of st.feathers){f.vy+=260*sec;f.vx*=1-sec*2.2;f.x+=f.vx*sec;f.y+=f.vy*sec;oc.globalAlpha=1-f.age/f.life;oc.fillStyle=f.c;
      oc.save();oc.translate(f.x,f.y);oc.rotate(f.r+f.age*6);oc.fillRect(-2.5,-1.5,5,3);oc.restore()}
    oc.globalAlpha=1;
    st.pops=st.pops.filter(p=>(p.age+=sec)<0.9);
    for(const p of st.pops){oc.globalAlpha=1-p.age/0.9;oc.fillStyle=css(A[1]);oc.font='600 15px Figtree, system-ui, sans-serif';oc.textAlign='center';oc.fillText(p.txt||'+1',p.x,p.y-p.age*40)}
    oc.globalAlpha=1;
    for(const s of st.shots){const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L;
      oc.globalCompositeOperation='lighter';oc.lineCap='round';
      if(s.age<s.dur){const d=L*s.age/s.dur,hx=s.a.x+ux*d,hy=s.a.y+uy*d,tl=Math.min(d,42),bx=hx-ux*tl,by=hy-uy*tl;
        oc.shadowColor=css(A[1]);oc.shadowBlur=16;oc.strokeStyle=css(A[1]);oc.lineWidth=7;
        oc.beginPath();oc.moveTo(bx,by);oc.lineTo(hx,hy);oc.stroke();
        oc.shadowBlur=0;oc.strokeStyle='#fff';oc.lineWidth=2.5;oc.beginPath();oc.moveTo(bx+ux*tl*0.35,by+uy*tl*0.35);oc.lineTo(hx,hy);oc.stroke()}
      else{const k3=(s.age-s.dur)/0.25,fade=1-k3,r=4+k3*26;
        oc.globalAlpha=fade;oc.strokeStyle=css(A[1]);oc.lineWidth=3*fade+0.5;oc.beginPath();oc.arc(s.b.x,s.b.y,r,0,Math.PI*2);oc.stroke();
        oc.fillStyle=css(A[0]);for(let i=0;i<6;i++){const an=i*1.047+s.seed,rr=r*0.9;oc.fillRect(s.b.x+Math.cos(an)*rr-2,s.b.y+Math.sin(an)*rr-2,4,4)}}
      if(s.age<0.06){oc.globalAlpha=1-s.age/0.06;oc.fillStyle=css(A[0]);oc.beginPath();oc.arc(s.a.x,s.a.y,6,0,Math.PI*2);oc.fill()}
      oc.globalAlpha=1;oc.globalCompositeOperation='source-over'}
  }
  return{draw,fire,cover:()=>st.cover,covered:()=>st.cover>=0.995,mode:()=>st.mode,over:()=>!!(st.g&&st.g.over),ready:()=>st.mode==='landed'&&st.mt>0.4};
};
