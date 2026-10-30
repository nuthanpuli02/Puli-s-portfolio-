// Section 6's forest: the old page's moss forest (src/puli3d.js) rebuilt in three.js, as Puli approved it in the
// prototype (tools/forest-moss/index.html, 2026-10-28). Everything is built in code and dressed in Puli's Poly Haven
// textures (src/assets/forest/): the old layout (two giant trunks by the landing spot, the big diagonal branch, the long
// arch behind, a low root arch, thin crossing branches, mid-distance trunks, the log, hanging vines, mounds, rocks, far
// trunks and arches in the fog), moss "shells" (every mossy surface drawn again in layers pushed outwards, strands cut
// out on two crooked grids, in clumps, merging into a soft pile with distance), grass, bushes, ferns, flowers in four
// colours, pollen by day, fireflies by night.
//
// The landing's two shockwaves are uniforms shared by every material (`G`): with uSeq on, nothing is drawn outside
// shockwave 1 (uW1, black), between the two the forest shows as a neon green grid, and inside shockwave 2 (uW2) the
// real look is back. The stage (src/puli/stage.js) runs the sequence and sets them with setWaves().
// Units: 1 = Puli's height. The stage adds `group` to its scene and uses `fog` as the scene's fog while in the forest.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const TEX = Object.fromEntries(Object.entries(import.meta.glob('../assets/forest/{bark,bark2,ground,mossrock,rock,mud}_*.webp', { eager: true, query: '?url', import: 'default' }))
  .map(([k, v]) => [k.split('/').pop().replace('.webp', ''), v]));

// Puli's numbers from the prototype's tweak sheet (2026-10-28)
const SET = { mossLen: 0.09, shells: 6, curl: 0.5, grassH: 0.18, grass: 0.5, fog: 0.8 };
// the shockwaves' durations (s) and how far they reach
export const WAVES = { w1: 3.5, w2: 3.5, w1Max: 50, w2Max: 74 };

function mulberry32(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/**
 * @param {object} o
 * @param {(ok: boolean) => void} [o.onLoad]  the textures have loaded
 */
export function createForest({ onLoad } = {}) {
  const PHONE = Math.min(innerWidth, innerHeight) < 700;
  const rnd = mulberry32(23);
  const manager = new THREE.LoadingManager(() => onLoad?.(true), undefined, () => onLoad?.(false));
  // ---------- shared uniforms: lights, fog, and the landing's two shockwaves ----------
  // uSeq 1 while the landing plays; uW1 = radius of shockwave 1 (inside: green grid), uW2 = radius of shockwave 2 (inside:
  // the real look); outside uW1 nothing is drawn (black). Radii are measured from uCenter, where he lands.
  const G={
    uSeq:{value:0},uW1:{value:0},uW2:{value:0},uCenter:{value:new THREE.Vector3()},uTime:{value:0},
    uFogD:{value:0},uFogC:{value:new THREE.Color()},uNight:{value:0},
    uSunDir:{value:new THREE.Vector3(0.4,0.8,0.35).normalize()},uSunC:{value:new THREE.Color()},
    uSkyC:{value:new THREE.Color()},uGndC:{value:new THREE.Color()},
    uMossLen:{value:SET.mossLen},uShells:{value:SET.shells},uCurl:{value:SET.curl},uGrassH:{value:SET.grassH},
    // the run's pits (x0, x1, z0, z1): the ground and the grass are not drawn there
    uPits:{value:[0,1,2,3].map(()=>new THREE.Vector4(1e9,1e9,0,0))},
  };
  const PIT_GLSL=`uniform vec4 uPits[4];
  bool inPit(vec3 p){ for(int i=0;i<4;i++){ vec4 q=uPits[i]; if(p.x>q.x&&p.x<q.y&&p.z>q.z&&p.z<q.w) return true; } return false; }`;
  const WAVE_GLSL=`
  uniform float uSeq,uW1,uW2;uniform vec3 uCenter;
  float gl1(vec2 p){ vec2 w=fwidth(p); vec2 g=abs(fract(p-0.5)-0.5)/max(w,1e-4);
    float l=1.0-min(min(g.x,g.y),1.0); return l*(1.0-smoothstep(0.18,0.45,max(w.x,w.y))); }   // fade lines that get too dense
  float gridLines(vec3 wp,vec3 wn){ vec3 an=abs(normalize(wn)); an/=(an.x+an.y+an.z); float s=2.5;
    return gl1(wp.yz*s)*an.x+gl1(wp.xz*s)*an.y+gl1(wp.xy*s)*an.z; }
  // returns the colour to show; real = the normal look of this fragment
  vec3 waves(vec3 real,vec3 wp,vec3 wn,float lineK){
    if(uSeq<0.5) return real;
    float d=distance(wp,uCenter);
    if(d>uW1) discard;
    vec3 green=vec3(0.0,1.0,0.255);
    float line=gridLines(wp,wn)*lineK;
    vec3 grid=green*(0.03+0.85*line);
    float inside=1.0-smoothstep(uW2-0.3,uW2,d);
    float t1=0.08+uW1*0.012, t2=0.10+uW2*0.012;
    float r1=exp(-pow((d-uW1)/t1,2.0)), r2=exp(-pow((d-uW2)/t2,2.0))*step(0.01,uW2);
    return mix(grid,real,inside)+green*(r1*1.9+r2*1.3);
  }`;

  // ---------- textures ----------
  const TL=new THREE.TextureLoader(manager);
  function set(name){
    const f=k=>{const t=TL.load(TEX[`${name}_${k}`]);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;if(k==='col')t.colorSpace=THREE.SRGBColorSpace;return t};
    return{map:f('col'),normalMap:f('nrm'),orm:f('orm')}}
  function mat(name,rep,extra={}){const s=set(name);for(const t of Object.values(s))t.repeat.set(rep[0],rep[1]);
    return new THREE.MeshStandardMaterial({map:s.map,normalMap:s.normalMap,roughnessMap:s.orm,aoMap:s.orm,aoMapIntensity:0.9,roughness:1,metalness:0,...extra})}

  // the waves patch for every standard material (bark, rock, ground, leaves, ferns)
  function wave(m,{sway=0,lineK=1,sky=false,pits=false}={}){
    m.onBeforeCompile=sh=>{
      Object.assign(sh.uniforms,G);
      sh.vertexShader=sh.vertexShader
        .replace('#include <common>','#include <common>\nuniform float uTime;varying vec3 vWP;varying vec3 vWN;')
        .replace('#include <begin_vertex>',`#include <begin_vertex>
          ${sway?`{ vec4 ip=vec4(0.0,0.0,0.0,1.0);
            #ifdef USE_INSTANCING
              ip=instanceMatrix*ip;
            #endif
            float k=${sway.toFixed(3)}*(0.6+0.4*sin(ip.x*1.7+ip.z*1.3));
            transformed.x+=k*sin(uTime*1.6+ip.x*0.9+ip.y*0.7); transformed.z+=k*0.6*cos(uTime*1.3+ip.z*0.8); }`:''}`)
        .replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
          { vec4 wp=vec4(transformed,1.0); vec3 n=${sky?'vec3(0.0,1.0,0.0)':'objectNormal'};
            #ifdef USE_INSTANCING
              wp=instanceMatrix*wp; n=mat3(instanceMatrix)*n;
            #endif
            wp=modelMatrix*wp; vWP=wp.xyz; vWN=normalize(mat3(modelMatrix)*n); }`);
      sh.fragmentShader=sh.fragmentShader
        .replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vWN;\n'+WAVE_GLSL+(pits?PIT_GLSL:''))
        .replace('void main() {',pits?'void main() {\n  if(inPit(vWP)) discard;':'void main() {')
        .replace('#include <dithering_fragment>',`#include <dithering_fragment>
          ${sky?`if(uSeq>0.5&&distance(vWP,uCenter)>uW2) discard;`:
               `gl_FragColor.rgb=waves(gl_FragColor.rgb,vWP,vWN,${lineK.toFixed(2)});`}`);
    };
    m.customProgramCacheKey=()=>'w'+sway+lineK+sky+pits;
    return m;
  }

  const M={
    ground:wave(mat('ground',[10,10]),{pits:true}),   // 10 repeats over 120 units: the pattern repeats every 12, the run's chunk length
    bark:wave(mat('bark',[3,0.45])),
    bark2:wave(mat('bark2',[3,0.45])),
    far:wave(new THREE.MeshStandardMaterial({color:'#3b4536',roughness:1})),
    mound:wave(mat('mossrock',[3,2])),
    mossrock:wave(mat('mossrock',[1.5,1.5])),
    rock:wave(mat('rock',[1.5,1.5])),
    vine:wave(mat('bark2',[1,0.6],{color:new THREE.Color('#8aa064')})),
  };
  // the path along the running lane: worn mud and leaves, its edges fading into the ground (an alpha map across it)
  const trailAlpha=(()=>{const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d'),img=x.createImageData(256,64),r0=mulberry32(5);
    const wob=[];for(let i=0;i<256;i++)wob.push(0.5+0.5*Math.sin(i/256*Math.PI*2*4+1.3)*0.6+0.4*Math.sin(i/256*Math.PI*2*12+r0()*0.2)*0.4);
    for(let j=0;j<64;j++)for(let i=0;i<256;i++){const v=j/63,e=Math.min(v,1-v)*2,edge=0.28+0.12*wob[i];
      let a=Math.min(1,Math.max(0,(e-edge*0.35)/(edge)));a*=0.85+0.15*r0();const k=(j*256+i)*4;img.data[k]=img.data[k+1]=img.data[k+2]=Math.round(a*255);img.data[k+3]=255}
    x.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=THREE.RepeatWrapping;return t})();
  M.trail=wave(mat('mud',[1,1],{alphaMap:trailAlpha,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),{pits:true});
  // a strip from x0 to x1 along the lane, 1.5 wide, its texture repeating every 3 units (4 times per piece of the run)
  function trailGeo(x0,x1,ox=0){const P=[],U=[],I=[],nx=Math.round((x1-x0)/0.5),nv=6;
    for(let j=0;j<=nv;j++)for(let i=0;i<=nx;i++){const x=x0+(x1-x0)*i/nx,v=j/nv,z=0.3+(v-0.5)*1.5;P.push(x-ox,groundY(x,z)+0.012,z);U.push(x/3,v)}
    for(let j=0;j<nv;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;I.push(a,b,a+1,b,b+1,a+1)}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));
    g.setIndex(I);g.computeVertexNormals();return g}
  const onTrail=(x,z)=>x>0.6&&Math.abs(z-0.3)<0.55;   // the worn middle of the path: hardly any grass

  // ---------- the ground ----------
  const LAND=new THREE.Vector3(0,0,0.3);
  // the ground: gentle bumps, flat along the running lane (z = 0.3), and repeating every CHUNK units in x so the run's
  // ground pieces join up seamlessly
  const CHUNK=12,TAU=Math.PI*2;
  const groundY=(x,z)=>{const path=Math.exp(-((z-0.3)*(z-0.3))/(1.6*1.6));
    return (Math.sin(x*TAU/CHUNK)*Math.cos(z*0.4)*0.35+Math.sin(x*TAU*2/CHUNK+z*0.6)*0.12)*(1-path)};
  // a ground patch from x0 to x1 (and z0 to z1), on the same 0.75-unit grid and texture coordinates everywhere
  function groundGeo(x0,x1,z0,z1,ox=0){const S=0.75,nx=Math.round((x1-x0)/S),nz=Math.round((z1-z0)/S),P=[],U=[],I=[];
    for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=x0+i*S,z=z0+j*S;P.push(x-ox,groundY(x,z),z);U.push((x+60)/120,(60-z)/120)}
    for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;I.push(a,b,a+1,b,b+1,a+1)}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));
    g.setIndex(I);g.computeVertexNormals();return g}
  const world=new THREE.Group();
  {const m=new THREE.Mesh(groundGeo(-60,9,-60,60),M.ground);m.receiveShadow=true;world.add(m)}
  {const m=new THREE.Mesh(trailGeo(0.6,9),M.trail);m.receiveShadow=true;m.renderOrder=1;world.add(m)}   // the path starts where he lands

  // ---------- shapes ----------
  // a tapered tube along points; ends on the ground flare into roots with buttress ridges. aMoss = how mossy (0..1.3).
  function tube(pts,r0,r1,{seg=60,rad=24,moss=1,vs=0.5,flare=true,seed=1}={}){
    const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));
    const fr=curve.computeFrenetFrames(seg,false),P=[],N=[],U=[],A=[],I=[],L=curve.getLength();
    for(let i=0;i<=seg;i++){const t=i/seg,c=curve.getPointAt(t);
      for(let j=0;j<=rad;j++){const a=j/rad*Math.PI*2,n=fr.normals[i].clone().multiplyScalar(Math.cos(a)).add(fr.binormals[i].clone().multiplyScalar(Math.sin(a)));
        let r=r0+(r1-r0)*t;r*=1+0.08*Math.sin(t*11+seed)+0.05*Math.sin(t*29+seed*2);
        r*=1+0.05*Math.sin(a*3+t*17)+0.04*Math.sin(a*7-t*23);
        if(flare){const g=Math.exp(-Math.max(0,c.y)/0.55);r*=1+0.6*g+0.45*Math.exp(-Math.max(0,c.y)/1.1)*Math.max(0,Math.sin(a*5+seed))}
        P.push(c.x+n.x*r,c.y+n.y*r,c.z+n.z*r);N.push(n.x,n.y,n.z);U.push(j/rad,t*L*vs);A.push(moss)}}
    for(let i=0;i<seg;i++)for(let j=0;j<rad;j++){const a=i*(rad+1)+j,b=a+rad+1;I.push(a,a+1,b,b,a+1,b+1)}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setAttribute('aMoss',new THREE.Float32BufferAttribute(A,1));g.setIndex(I);return g}
  // a lumpy half (or full) ball
  function blob(cx,cy,cz,rx,ry,rz,{moss=1.2,seed=3,full=false}={}){
    const g=new THREE.SphereGeometry(1,40,20,0,Math.PI*2,0,full?Math.PI:Math.PI*0.62);const p=g.attributes.position,rr=mulberry32(seed),o=[rr()*9,rr()*9];
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),th=Math.atan2(z,x),k=1+0.09*Math.sin(th*3+y*2+o[0])+0.06*Math.sin(th*7-y*4+o[1]);
      p.setXYZ(i,cx+x*rx*k,cy+y*ry*k,cz+z*rz*k)}
    g.computeVertexNormals();g.setAttribute('aMoss',new THREE.Float32BufferAttribute(new Array(p.count).fill(moss),1));g.deleteAttribute('uv');
    const uv=[];for(let i=0;i<p.count;i++)uv.push(p.getX(i)*0.5,p.getY(i)*0.5+p.getZ(i)*0.5);g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));return g}
  function rockGeo(x,z,r0,flat,seed){const g0=new THREE.IcosahedronGeometry(r0,4);g0.deleteAttribute('normal');g0.deleteAttribute('uv');
    const g=mergeVertices(g0),p=g.attributes.position,v=new THREE.Vector3(),rr=mulberry32(seed),o=[rr()*10,rr()*10,rr()*10];
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const n=v.clone().normalize();
      const k=1+0.18*Math.sin(n.x*3+o[0])*Math.sin(n.y*4+o[1])+0.1*Math.sin(n.z*7+o[2])+0.05*Math.sin(n.x*13+n.y*11);
      v.copy(n).multiplyScalar(r0*k);v.y*=flat;if(v.y<-r0*0.2)v.y=-r0*0.2;p.setXYZ(i,v.x+x,v.y+groundY(x,z),v.z+z)}
    g.computeVertexNormals();const uv=[];for(let i=0;i<p.count;i++)uv.push(p.getX(i)*1.3+p.getZ(i)*0.6,p.getY(i)*1.3);g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    g.setAttribute('aMoss',new THREE.Float32BufferAttribute(new Array(p.count).fill(1.1),1));return g}

  const mossy=[];   // every geometry that gets moss shells
  const casters=[];
  function add(geo,m,{cast=true,moss=true}={}){const me=new THREE.Mesh(geo,m);me.castShadow=cast;if(cast)casters.push(me);me.receiveShadow=true;world.add(me);if(moss)mossy.push(geo);return me}

  // ---------- the layout (the old forest's, sized so it frames a portrait phone) ----------
  // two giant trunks either side of the landing spot, running up off the screen
  add(tube([[-2.4,-0.3,-1.3],[-2.45,6,-1.4],[-2.3,14,-1.5],[-2.35,24,-1.6]],0.9,0.62,{seed:1}),M.bark);
  add(tube([[2.55,-0.3,-1.9],[2.6,7,-2.0],[2.45,15,-2.1],[2.5,24,-2.2]],0.85,0.6,{seed:4}),M.bark2);
  // the big diagonal branch on the right, rising back and left
  add(tube([[4.6,-0.3,-1.9],[3.9,2.6,-3.3],[2.6,6,-5.4],[1.2,10.5,-8],[0.2,16,-10]],0.95,0.6,{seed:7}),M.bark);   // its foot kept off the running lane
  // the long arch behind
  add(tube([[-7.5,-0.3,-6.5],[-5.6,3.6,-7.6],[-2.2,6.4,-8.6],[1.6,6.0,-9.4],[4.6,3.4,-10],[6.4,-0.3,-10.6]],1.25,0.85,{seed:9}),M.bark2);
  // a low root arch at the left, near him
  add(tube([[-3.6,-0.2,-2.6],[-2.9,1.2,-2.9],[-1.6,1.55,-3.1],[-0.5,0.7,-3.0],[-0.1,-0.2,-2.9]],0.42,0.33,{seed:2,seg:40,rad:18}),M.bark);
  // thin branches crossing above him (the old fall's branches)
  add(tube([[2.3,6.2,-1.9],[0.9,6.45,-1.6],[-0.6,6.4,-1.4],[-1.9,6.1,-1.4]],0.2,0.09,{seed:5,seg:40,rad:12,flare:false,moss:0.9}),M.bark);
  add(tube([[-2.2,4.0,-1.4],[-0.9,4.25,-1.15],[0.4,4.3,-1.0],[1.4,4.1,-1.0]],0.16,0.08,{seed:6,seg:40,rad:12,flare:false,moss:0.9}),M.bark2);
  // more mossy trunks in the middle distance
  for(const [x,z,r,s,mm] of [[-5.6,-4.5,1.0,11,M.bark],[6.8,-5,1.1,12,M.bark2],[-9,-9,1.3,13,M.bark2],[9.5,-12,1.4,14,M.bark],[-3.5,-13,1.2,15,M.bark]])
    add(tube([[x,-0.3,z],[x+0.1,8,z-0.1],[x-0.1,16,z-0.2],[x,26,z-0.3]],r,r*0.7,{seed:s,seg:44,rad:20}),mm);
  // the fallen log (the game's first platform) and the hanging vines
  add(tube([[1.0,0.3,-1.0],[2.6,0.36,-0.9],[4.2,0.32,-0.85],[5.8,0.26,-0.8]],0.38,0.33,{seed:8,seg:40,rad:18,flare:false,moss:1.2}),M.bark);
  for(const [x,z,y1,s] of [[-1.3,-1.6,2.2,21],[1.5,-2.6,3.0,22],[-4.0,-3.0,1.2,23],[3.6,-3.8,1.8,24],[0.4,-5.5,2.6,25]]){
    const pts=[];for(let i=0;i<=6;i++){const t=i/6;pts.push([x+Math.sin(t*3+s)*0.25,20-(20-y1)*t,z+Math.cos(t*2+s)*0.2])}
    add(tube(pts,0.05,0.04,{seed:s,seg:60,rad:7,flare:false,moss:0.8,vs:1}),M.vine)}
  // mounds at the bottom corners and in the middle distance
  add(blob(-3.6,-0.5,2.0,2.2,1.4,1.6,{seed:31}),M.mound);add(blob(3.8,-0.6,3.1,2.4,1.0,1.4,{seed:32}),M.mound);   // lower and further forward: the run is seen past it
  add(blob(-1.6,-0.4,-4.4,2.0,0.85,1.4,{seed:33}),M.mound);add(blob(5.2,-0.4,-5.6,3.0,1.2,2.0,{seed:34}),M.mound);
  add(blob(-6.6,-0.4,-1.8,2.6,1.0,1.8,{seed:35}),M.mound);add(blob(1.8,-0.5,-12,4.2,1.6,2.8,{seed:36}),M.mound);
  // rocks
  add(rockGeo(-1.0,1.3,0.32,0.7,3),M.mossrock);add(rockGeo(1.5,1.6,0.22,0.8,5),M.rock,{moss:false});add(rockGeo(3.1,-0.9,0.45,0.6,9),M.mossrock);
  // a ground moss carpet in patches around the landing spot (its own patch so the shells don't cover the whole ground)
  {const g=new THREE.PlaneGeometry(16,12,96,72);g.rotateX(-Math.PI/2);g.translate(0,0,-1.5);const p=g.attributes.position;
    for(let i=0;i<p.count;i++)p.setY(i,groundY(p.getX(i),p.getZ(i))+0.002);g.computeVertexNormals();
    g.setAttribute('aMoss',new THREE.Float32BufferAttribute(new Array(p.count).fill(0.55),1));mossy.push(g)}
  // far trunks and arches: silhouettes in the fog, no moss
  {const far=[];for(let i=0;i<16;i++){const x=-30+i*4+rnd()*2,z=-18-rnd()*20,r=1+rnd()*1.4;
      far.push(tube([[x,-0.3,z],[x+rnd()*0.6,16,z],[x+rnd()*1.2,30,z-0.8]],r,r*0.8,{seg:20,rad:12,seed:i}))}
    for(let i=0;i<4;i++){const x=-20+i*13+rnd()*3,z=-22-rnd()*10;far.push(tube([[x-6,-0.3,z],[x-3,6,z],[x+3,6.3,z],[x+6,-0.3,z]],1.1,0.85,{seg:24,rad:12,seed:40+i}))}
    add(mergeGeometries(far),M.far,{cast:false,moss:false})}
  // the sky: a dome
  const skyMat=new THREE.MeshBasicMaterial({color:'#b9cfa8',side:THREE.BackSide,fog:false});   // black during the landing, brightening with the fog
  const sky=new THREE.Mesh(new THREE.SphereGeometry(70,32,16),skyMat);sky.position.copy(LAND);world.add(sky);

  // ---------- moss shells ----------
  // All mossy surfaces merged into one mesh, drawn uShells times (instancing): layer k pushes it out by k/uShells of the moss
  // length along the normal. Strands are cut out by a 3D cell pattern; moss is thick on tops and upper sides and thins out
  // (bark shows) underneath. Layer 0 is a solid moss skin under the strands.
  const mossGeo=mergeGeometries(mossy.map(g=>{const h=new THREE.BufferGeometry();for(const k of['position','normal','aMoss'])h.setAttribute(k,g.attributes[k]);h.setIndex(g.index);return h}));
  const NOISE=`
  float h31(vec3 p){ p=fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  float vn3(vec3 x){ vec3 i=floor(x),f=fract(x); f=f*f*(3.0-2.0*f);
    return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z); }`;
  // the two moss grids' tilts (odd angles so their rows never line up with each other or with the scene)
  const rotGLSL=(x,y,z)=>{const m=new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(x,y,z)));
    return 'mat3('+m.elements.map(v=>v.toFixed(5)).join(',')+')'};
  const ROT_A=rotGLSL(0.62,0.41,0.93),ROT_B=rotGLSL(1.17,-0.73,0.35);
  const mossMat=new THREE.ShaderMaterial({
    uniforms:G,
    vertexShader:`attribute float aMoss;uniform float uMossLen,uShells,uTime;varying vec3 vBase,vWP,vN;varying float vLev,vMoss;
      void main(){ float lev=float(gl_InstanceID)/uShells; vLev=lev; vMoss=aMoss; vN=normal; vBase=position;
        float len=uMossLen*(0.6+0.4*aMoss);
        vec3 p=position+normal*(0.004+len*lev);
        p.y-=len*0.35*lev*lev;                                   // strands droop a little
        p.x+=sin(uTime*1.3+position.z*1.7+position.x*1.3)*len*0.15*lev*lev;
        vec4 wp=modelMatrix*vec4(p,1.0); vWP=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }`,
    fragmentShader:`uniform float uShells,uCurl,uFogD,uNight,uTime;uniform vec3 uFogC,uSunDir,uSunC,uSkyC,uGndC;varying vec3 vBase,vWP,vN;varying float vLev,vMoss;
      ${WAVE_GLSL}${NOISE}
      void main(){
        vec3 N=normalize(vN);
        // coverage: thick on top, patchy on the sides, bare underneath
        float big=vn3(vBase*0.55), mid=vn3(vBase*2.1+7.0);
        float cov=smoothstep(0.0,0.5,N.y*0.6+0.5+(big-0.5)*1.1+(mid-0.5)*0.4)*vMoss;
        if(cov<0.08) discard;
        float camD=length(vWP-cameraPosition);
        vec3 cell; float hgt=1.0;
        if(vLev<0.001){ if(cov<0.3) discard; }                  // the solid moss skin
        else{
          // layer shift: every layer (the whole sheet) is shifted by its own random offset along the surface
          float li=floor(vLev*uShells+0.5);
          vec3 walk=(vec3(h31(vec3(li*1.37,2.1,5.3)),h31(vec3(7.7,li*2.11,1.9)),h31(vec3(3.1,4.4,li*0.73)))-0.5)*step(0.5,li)*uCurl*0.8;
          walk-=N*dot(walk,N);
          // clumps: the moss grows in little cushions, taller and fuller in some spots, short and thin in others
          float clump=vn3(vBase*5.0+3.0)*0.7+vn3(vBase*11.0+8.0)*0.3;
          // smoothing with distance: further away the dots grow until they merge into a soft pile with no gaps
          float fade=smoothstep(4.0,11.0,camD);
          // two crooked grids of different sizes, tilted at odd angles: a strand stands wherever either grid has one,
          // so their rows never line up
          bool keep=false; float hg=0.0;
          for(int q=0;q<2;q++){
            mat3 Rm=q==0?${ROT_A}:${ROT_B}; float sc=q==0?30.0:43.0;
            vec3 g=Rm*vBase*sc; vec3 c=floor(g), f=fract(g)-0.5;
            vec3 jit=vec3(h31(c+7.1+float(q)*17.0),h31(c+3.3+float(q)*17.0),h31(c+5.9+float(q)*17.0))-0.5;
            float h=h31(c+float(q)*31.0), hq=(0.45+0.55*h)*(0.55+0.6*mid)*cov*mix(0.35,1.3,clump);
            if(vLev>hq) continue;
            float r=1.0-vLev/hq, rad=(0.5*r+0.06)*mix(0.85,1.2,clump)*mix(1.0,2.3,fade);
            if(length(f-jit*0.7-Rm*walk)<rad){ keep=true; hg=max(hg,hq); }
          }
          if(!keep) discard;
          hgt=hg;
        }
        float k=clamp(vLev/max(hgt,0.01),0.0,1.0);
        vec3 base=vec3(0.035,0.075,0.025), tip=mix(vec3(0.24,0.40,0.10),vec3(0.46,0.54,0.16),vn3(vBase*1.3+2.0));
        vec3 alb=mix(base,tip,k*0.85+0.12)*(0.75+0.5*vn3(vBase*4.0+13.0));
        alb=mix(alb,alb*vec3(1.2,1.1,0.6),smoothstep(0.6,0.85,big));    // sun-bleached patches
        float wrap=clamp((dot(N,uSunDir)+0.45)/1.45,0.0,1.0);
        vec3 hemi=mix(uGndC,uSkyC,N.y*0.5+0.5);
        vec3 c=alb*(uSunC*wrap*0.9+hemi*0.9)*mix(0.45,1.05,k);
        if(uNight>0.01){ float pn=vn3(vBase*0.9)*0.6+vn3(vBase*2.7+5.0)*0.4;
          vec3 gc=mix(vec3(0.05,0.95,0.85),vec3(0.50,0.30,1.0),smoothstep(0.35,0.7,vn3(vBase*0.18+9.0)));
          c+=gc*smoothstep(0.62,0.74,pn)*(0.15+0.85*k*k)*1.6*uNight*smoothstep(0.5,0.9,vMoss); }
        float fog=1.0-exp(-uFogD*uFogD*camD*camD);
        c=mix(c,uFogC,clamp(fog,0.0,1.0));
        gl_FragColor=vec4(waves(c,vBase,N,0.0),1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const MAXSH=21;
  const moss=new THREE.InstancedMesh(mossGeo,mossMat,MAXSH);moss.count=SET.shells+1;moss.frustumCulled=false;world.add(moss);
  // nothing of the moss shows outside shockwave 2 (the bark's grid lines show there instead)
  mossMat.fragmentShader=mossMat.fragmentShader.replace('vec3 N=normalize(vN);','vec3 N=normalize(vN);\n      if(uSeq>0.5&&distance(vBase,uCenter)>uW2) discard;');

  // ---------- leaves, bushes, ferns (textures drawn in code) ----------
  function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}
  const LEAF=canvasTex(128,256,(x)=>{const g=x.createLinearGradient(0,0,128,0);g.addColorStop(0,'#2f5a20');g.addColorStop(.5,'#5d8f34');g.addColorStop(1,'#2d5620');
    x.fillStyle=g;x.beginPath();x.moveTo(64,6);x.bezierCurveTo(124,60,120,170,64,250);x.bezierCurveTo(8,170,4,60,64,6);x.fill();
    x.strokeStyle='rgba(200,225,150,.5)';x.lineWidth=3;x.beginPath();x.moveTo(64,12);x.lineTo(64,246);x.stroke()});
  const FROND=canvasTex(128,512,(x,w,h)=>{x.strokeStyle='#4d7a2a';x.lineWidth=5;x.beginPath();x.moveTo(64,h);x.lineTo(64,8);x.stroke();
    for(let i=0;i<26;i++){const y=h-24-i*18.5,len=52*(1-i/28)+6;for(const s of[-1,1]){
      const g=x.createLinearGradient(64,0,64+s*len,0);g.addColorStop(0,'#3e6e22');g.addColorStop(1,'#6fa03c');x.fillStyle=g;
      x.beginPath();x.moveTo(64,y);x.quadraticCurveTo(64+s*len*0.6,y-14,64+s*len,y-20);x.quadraticCurveTo(64+s*len*0.5,y-2,64,y+6);x.fill()}}});
  const leafMat=wave(new THREE.MeshStandardMaterial({map:LEAF,alphaTest:0.5,side:THREE.DoubleSide,roughness:0.8}),{sway:0.025,lineK:0.6});
  const fernMat=wave(new THREE.MeshStandardMaterial({map:FROND,alphaTest:0.45,side:THREE.DoubleSide,roughness:0.85}),{lineK:0.6});

  // bushes: many leaf cards around a few rounded clumps
  {const spots=[[-1.9,0.9,0.5],[1.9,-1.2,0.45],[-4.3,-0.4,0.6],[4.6,-2.2,0.7],[-0.6,-3.6,0.55],[2.0,-4.6,0.6],[-6,-6,0.8],[7.5,-3.2,0.8],[0.9,2.6,0.35]];
    const per=PHONE?120:170,geo=new THREE.PlaneGeometry(0.09,0.18);geo.translate(0,0.09,0);
    const im=new THREE.InstancedMesh(geo,leafMat,spots.length*per),m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),c=new THREE.Color(),v=new THREE.Vector3();let i=0;
    for(const [x,z,r] of spots){const gy=groundY(x,z);for(let k=0;k<per;k++){
        v.set(rnd()-.5,rnd()*0.9-0.1,rnd()-.5).normalize().multiplyScalar(r*(0.55+rnd()*0.5));v.y=Math.max(v.y*0.8,-0.05);
        const p=new THREE.Vector3(x+v.x,gy+r*0.45+v.y,z+v.z);
        e.set(rnd()*Math.PI-0.5,rnd()*Math.PI*2,rnd()*1.2-0.6);q.setFromEuler(e);const s=(0.8+rnd()*0.7)*(r/0.5);
        m.compose(p,q,new THREE.Vector3(s,s,s));im.setMatrixAt(i,m);c.setHSL(0.24+rnd()*0.07,0.45+rnd()*0.2,0.2+rnd()*0.14);im.setColorAt(i,c);i++}}
    im.castShadow=true;im.receiveShadow=true;world.add(im)}
  // ferns: arching fronds in rosettes, against roots and mounds (the old forest's fern spots)
  function fernGeo(spots,gyAt){const geos=[];
    for(const [cx,cz] of spots){const n=7+Math.floor(rnd()*4),sc=0.7+rnd()*0.5,gy=gyAt(cx,cz);
      for(let f=0;f<n;f++){const ang=f/n*Math.PI*2+rnd()*0.5,len=(0.55+rnd()*0.45)*sc,wid=0.13*sc,lift=0.55+rnd()*0.35,seg=8;
        const P=[],U=[],I=[],dx=Math.cos(ang),dz=Math.sin(ang);
        for(let s=0;s<=seg;s++){const t=s/seg,along=len*t,up=len*(lift*Math.sin(t*1.9)-0.35*t*t);
          for(const e of[-1,1]){P.push(cx+dx*along+(-dz)*wid*e*0.5,gy+up,cz+dz*along+dx*wid*e*0.5);U.push(e<0?0:1,t)}}
        for(let s=0;s<seg;s++){const a=s*2;I.push(a,a+1,a+2,a+1,a+3,a+2)}
        const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setIndex(I);g.computeVertexNormals();geos.push(g)}}
    return mergeGeometries(geos)}
  {const m=new THREE.Mesh(fernGeo([[-1.6,-0.4],[-3.1,0.4],[1.2,-0.9],[3.3,-0.8],[-0.9,-2.7],[0.7,-3.2],[2.2,-2.6],[-4.6,-2.4],[5.5,-1.5],[-2.6,2.8],[2.7,2.9],[-5.2,0.8],[6.0,-1.0],[-0.2,-5.4]],groundY),fernMat);
    m.castShadow=true;m.receiveShadow=true;world.add(m)}

  // ---------- grass: ankle-high blades, thick around the landing spot, thinning with distance ----------
  const GRASS_MAX=Math.round((PHONE?9000:18000)*SET.grass);
  const grassMat=new THREE.ShaderMaterial({uniforms:G,side:THREE.DoubleSide,
    vertexShader:`attribute vec4 aOff;attribute vec2 aVar;uniform float uTime,uGrassH;varying vec3 vWP,vN;varying float vT,vVar;
      void main(){ float t=position.y; vT=t; vVar=aVar.x;
        float h=uGrassH*aOff.w, w=0.012*(1.0-t*0.85)*(0.8+aVar.y*0.5);
        float yaw=aVar.y*6.2831; vec2 dir=vec2(cos(yaw),sin(yaw)), side=vec2(-dir.y,dir.x);
        float bend=(0.25+0.35*aVar.x)*t*t*h;
        float wind=sin(uTime*1.8+aOff.x*1.3+aOff.z*0.9)*0.35+sin(uTime*3.1+aOff.x*4.0)*0.15;
        vec3 p=aOff.xyz+vec3(side.x*position.x*w+dir.x*bend+wind*t*t*h*0.6, t*h, side.y*position.x*w+dir.y*bend+wind*t*t*h*0.3);
        vN=normalize(vec3(dir.x,1.5,dir.y)); vec4 wp=modelMatrix*vec4(p,1.0); vWP=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }`,
    fragmentShader:`uniform float uFogD,uNight;uniform vec3 uFogC,uSunDir,uSunC,uSkyC,uGndC;varying vec3 vWP,vN;varying float vT,vVar;${WAVE_GLSL}${PIT_GLSL}
      void main(){
        if(inPit(vec3(vWP.x,0.0,vWP.z))) discard;
        vec3 base=vec3(0.03,0.06,0.02), tip=mix(vec3(0.22,0.38,0.09),vec3(0.42,0.50,0.15),vVar);
        vec3 alb=mix(base,tip,smoothstep(0.0,1.0,vT));
        float wrap=clamp((dot(vN,uSunDir)+0.5)/1.5,0.0,1.0);
        vec3 c=alb*(uSunC*wrap*0.85+mix(uGndC,uSkyC,0.8))*(0.55+0.5*vT);
        float camD=length(vWP-cameraPosition),fog=1.0-exp(-uFogD*uFogD*camD*camD);
        c=mix(c,uFogC,clamp(fog,0.0,1.0));
        vec3 o=c;
        if(uSeq>0.5){ float d=distance(vWP,uCenter); if(d>uW1) discard; vec3 green=vec3(0.0,1.0,0.255);
          float inside=1.0-smoothstep(uW2-0.3,uW2,d), t1=0.08+uW1*0.012, t2=0.10+uW2*0.012;
          float r1=exp(-pow((d-uW1)/t1,2.0)), r2=exp(-pow((d-uW2)/t2,2.0))*step(0.01,uW2);
          o=mix(green*vT*vT*0.55,c,inside)+green*(r1*1.9+r2*1.3); }
        gl_FragColor=vec4(o,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  // one grass blade, instanced; `place(n)` fills n spots ({x, z} or null to skip a try)
  const blade=new THREE.BufferGeometry();
  {const P=[],I=[],S=4;for(let s=0;s<=S;s++){const t=s/S;P.push(-0.5,t,0,0.5,t,0)}for(let s=0;s<S;s++){const a=s*2;I.push(a,a+1,a+2,a+1,a+3,a+2)}
    blade.setAttribute('position',new THREE.Float32BufferAttribute(P,3));blade.setIndex(I)}
  function grassGeo(count,place,ox=0){const ig=new THREE.InstancedBufferGeometry();ig.index=blade.index;ig.attributes.position=blade.attributes.position;
    const off=new Float32Array(count*4),va=new Float32Array(count*2);let n=0,guard=0;
    while(n<count&&guard++<count*40){const q=place();if(!q)continue;const {x,z}=q;
      const clump=0.5+0.5*Math.sin(x*2.3+Math.sin(z*1.7)*2)*Math.cos(z*2.9-x*0.7);if(rnd()>0.35+0.65*clump)continue;   // clumps, not a lawn
      off.set([x-ox,groundY(x,z),z,0.6+rnd()*0.8],n*4);va.set([rnd(),rnd()],n*2);n++}
    ig.setAttribute('aOff',new THREE.InstancedBufferAttribute(off,4));ig.setAttribute('aVar',new THREE.InstancedBufferAttribute(va,2));
    ig.instanceCount=n;return ig}
  let grass;
  {const solid=(x,z)=>Math.hypot(x+2.4,z+1.3)<1.2||Math.hypot(x-2.55,z+1.9)<1.1||Math.hypot(x-4.6,z+1.9)<1.2;  // not inside trunks
    // more blades near the landing spot: radius drawn from a falloff, a wider band towards the back
    const g=grassGeo(GRASS_MAX,()=>{const r=Math.pow(rnd(),1.6)*14,a=rnd()*Math.PI*2,x=LAND.x+Math.cos(a)*r*1.3,z=LAND.z+Math.sin(a)*r*0.9-1.2;
      return z>4.5||x>9||solid(x,z)||(onTrail(x,z)&&rnd()<0.85)?null:{x,z}});
    grass=new THREE.Mesh(g,grassMat);grass.frustumCulled=false;world.add(grass)}

  // ---------- flowers, pollen (day), fireflies (night) ----------
  function dotTex(){return canvasTex(64,64,(x)=>{const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(0.45,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64)})}
  const DOT=dotTex();
  // flowers: tiny dots on moss tops, in patches of one colour like wildflowers (mostly white, some pale yellow, soft pink,
  // a little violet); one draw call for all of them. At night a soft halo of the same dots makes them glow.
  const FLOWER_COLS=[['#f4f2e6',0.5],['#f5dc5a',0.2],['#f28cb4',0.17],['#a88bf0',0.13]];
  function flowerGeo(mg,rate=0.12){const p=[],col=[],pos=mg.attributes.position,nor=mg.attributes.normal,c=new THREE.Color();
    const pick=v=>{let a=0;for(const [h,w] of FLOWER_COLS){a+=w;if(v<a)return h}return FLOWER_COLS[0][0]};
    const cellRnd=(x,y,z)=>{const v=Math.sin(Math.floor(x*0.9)*12.9898+Math.floor(y*0.9)*37.719+Math.floor(z*0.9)*78.233)*43758.5453;return v-Math.floor(v)};
    for(let i=0;i<pos.count;i+=3){if(nor.getY(i)>0.75&&rnd()<rate){const k=3+Math.floor(rnd()*4),x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
        const patch=pick(cellRnd(x,y,z));
        const lift=SET.mossLen*1.05+(y<0.6?SET.grassH*(0.35+rnd()*0.4):0);   // above the moss, and on the ground up among the grass
        for(let j=0;j<k;j++){p.push(x+(rnd()-.5)*0.11,y+lift+(rnd()-.5)*0.03,z+(rnd()-.5)*0.11);
          c.set(rnd()<0.85?patch:pick(rnd()));col.push(c.r,c.g,c.b)}}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));return g}
  const flowerMat=new THREE.PointsMaterial({size:0.06,map:DOT,alphaTest:0.4,transparent:true,vertexColors:true});
  const flowerGlowMat=new THREE.PointsMaterial({size:0.12,map:DOT,transparent:true,opacity:0.3,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true});
  const glows=[];   // every flower glow (shown at night)
  function flowerPoints(g,parent){const pts=new THREE.Points(g,flowerMat),glow=new THREE.Points(g,flowerGlowMat);parent.add(pts,glow);glows.push(glow);pts.userData.glow=glow;return pts}
  const flowers=flowerPoints(flowerGeo(mossGeo),world);
  const drifters=new THREE.Group();world.add(drifters);   // pollen and fireflies, moved along with the run
  function drift(n,col,size,spread){const p=[];for(let i=0;i<n;i++)p.push((rnd()-.5)*spread[0],0.2+rnd()*spread[1],(rnd()-.5)*spread[2]-2);
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
    const pts=new THREE.Points(g,new THREE.PointsMaterial({color:col,size,map:DOT,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
    pts.userData.base=p.slice();drifters.add(pts);return pts}

  // dots appear only where shockwave 2 has passed, like everything else
  function waveDots(m){m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,G);
      sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;')
        .replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;');
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;uniform float uSeq,uW2;uniform vec3 uCenter;')
        .replace('void main() {','void main() {\n  if(uSeq>0.5&&distance(vWP,uCenter)>uW2) discard;')};
    m.customProgramCacheKey=()=>'dots';return m}
  waveDots(flowers.material);waveDots(flowers.userData.glow.material);
  const pollen=drift(160,'#fff6d8',0.035,[14,6,10]);
  const fireflies=drift(70,'#d9ff7a',0.09,[12,3.5,9]);
  waveDots(pollen.material);waveDots(fireflies.material);

  // ---------- light, day and night ----------
  const hemi=new THREE.HemisphereLight(0xffffff,0x3a2c1c,1);world.add(hemi);
  const sun=new THREE.DirectionalLight(0xffffff,1);sun.castShadow=true;sun.shadow.mapSize.set(PHONE?1024:2048,PHONE?1024:2048);
  Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:1,far:50});sun.shadow.bias=-0.0006;sun.shadow.normalBias=0.03;world.add(sun,sun.target);
  const LOOK={day:{sky:'#bcd1aa',fog:'#a6bb95',fogD:0.045,hemiSky:'#dfeccc',hemiGround:'#4a3a24',hemiI:1.1,sunC:'#fff0d2',sunI:2.6,exp:1.0,night:0,sunP:[6,14,7]},
              night:{sky:'#06110d',fog:'#0b1813',fogD:0.075,hemiSky:'#5f82a8',hemiGround:'#0d160f',hemiI:0.55,sunC:'#a9c2f0',sunI:0.8,exp:1.2,night:1,sunP:[-5,14,6]}};
  // ---------- the fall through the dark: dust specks, and a faint floor glow and shadow under him ----------
  const SPECK_N=PHONE?260:420, sp=new Float32Array(SPECK_N*3);
  const speckGeo=new THREE.BufferGeometry();speckGeo.setAttribute('position',new THREE.BufferAttribute(sp,3));
  const speckMat=new THREE.PointsMaterial({color:'#b9c4b8',size:0.045,map:DOT,transparent:true,opacity:0.7,depthWrite:false,blending:THREE.AdditiveBlending,fog:false});
  const specks=new THREE.Points(speckGeo,speckMat);specks.frustumCulled=false;specks.visible=false;world.add(specks);
  const floorMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{uP:{value:new THREE.Vector2()},uH:{value:10},uK:{value:1}},
    vertexShader:`varying vec2 vXZ;void main(){vec4 w=modelMatrix*vec4(position,1.0);vXZ=w.xz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`uniform vec2 uP;uniform float uH,uK;varying vec2 vXZ;
      void main(){ float d=length(vXZ-uP), near=1.0-clamp(uH/8.0,0.0,1.0);
        float glow=exp(-pow(d/(0.7+uH*0.35),2.0))*(0.05+0.2*near*near);          // light gathering under him
        glow*=1.0-0.9*near*exp(-pow(d/(0.28+uH*0.06),2.0));                        // his shadow in the middle
        glow+=0.012*exp(-pow(d/9.0,2.0));                                           // a faint sheen: a floor is there
        gl_FragColor=vec4(vec3(0.62,0.68,0.64)*glow*uK,1.0); }`});
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(40,40),floorMat);floor.rotation.x=-Math.PI/2;floor.position.y=0.004;floor.renderOrder=2;floor.visible=false;world.add(floor);
  const FX={impact:false,t0:-1,last:-1};
  function setFall({on=true,top,x,z,h,impact}={}){
    if(!on){specks.visible=floor.visible=false;FX.impact=false;return}
    if(top!==undefined){for(let i=0;i<SPECK_N;i++)sp.set([LAND.x+(rnd()-.5)*9,rnd()*top,LAND.z+(rnd()-.5)*9-1],i*3);
      speckGeo.attributes.position.needsUpdate=true;specks.visible=floor.visible=true;FX.impact=false;FX.t0=-1;floorMat.uniforms.uK.value=1;speckMat.opacity=0.7}
    if(x!==undefined)floorMat.uniforms.uP.value.set(x,z);
    if(h!==undefined)floorMat.uniforms.uH.value=Math.max(0,h);
    if(impact)FX.impact=true;
  }
  const fog=new THREE.FogExp2('#a6bb95',0);
  let theme='day',exposure=1,followX=0;
  function applyLook(){const L=LOOK[theme];hemi.color.set(L.hemiSky);hemi.groundColor.set(L.hemiGround);hemi.intensity=L.hemiI;
    sun.color.set(L.sunC);sun.intensity=L.sunI;sun.position.set(L.sunP[0]+followX,L.sunP[1],L.sunP[2]);sun.target.position.set(followX,0,-1);
    exposure=L.exp;fog.color.set(L.fog);G.uFogC.value.set(L.fog);G.uNight.value=L.night;
    G.uSunDir.value.copy(sun.position).normalize();G.uSunC.value.set(L.sunC).multiplyScalar(L.sunI*0.42);
    G.uSkyC.value.set(L.hemiSky).multiplyScalar(L.hemiI*0.5);G.uGndC.value.set(L.hemiGround).multiplyScalar(L.hemiI*0.5);
    for(const g of glows)g.visible=theme==='night';fireflies.visible=theme==='night';pollen.visible=theme==='day'}
  applyLook();

  // ---------- the run: the forest goes on, in pieces of CHUNK units, built in three variants at load and reused ----------
  // Piece k covers x from CHUNK_X0 + k*CHUNK; everything in it is in its own coordinates (x from 0 to CHUNK). The ground
  // repeats every CHUNK units, so the pieces and the landing's ground join up.
  const CHUNK_X0=9;
  function mossOf(geos){const g=mergeGeometries(geos.map(x=>{const h=new THREE.BufferGeometry();for(const k of['position','normal','aMoss'])h.setAttribute(k,x.attributes[k]);h.setIndex(x.index);return h}));
    g.computeBoundingSphere();g.boundingSphere.radius+=0.3;return g}
  function mossMesh(g){const m=new THREE.InstancedMesh(g,mossMat,MAXSH);m.count=SET.shells+1;return m}
  function chunkVariant(seed){const r=mulberry32(seed),meshes=[],mos=[],far=[];
    const put=(geo,mat,{cast=true,moss=true}={})=>{meshes.push({geo,mat,cast});if(moss)mos.push(geo)};
    // big mossy trunks just behind the lane, one further back, sometimes an arch
    const n=2+Math.floor(r()*2);
    for(let i=0;i<n;i++){const x=(i+0.2+r()*0.6)*CHUNK/n,z=-2.4-r()*2.6,rr=0.7+r()*0.45;
      put(tube([[x,-0.3,z],[x+(r()-.5)*0.3,8,z-0.1],[x+(r()-.5)*0.4,16,z-0.2],[x,26,z-0.3]],rr,rr*0.7,{seed:seed+i,seg:40,rad:18}),r()<0.5?M.bark:M.bark2)}
    {const x=r()*CHUNK,z=-7-r()*3,rr=1.0+r()*0.5;put(tube([[x,-0.3,z],[x,10,z-0.1],[x+0.3,26,z-0.3]],rr,rr*0.75,{seed:seed+9,seg:36,rad:16}),M.bark2)}
    if(r()<0.6){const x=2+r()*8,z=-5.5-r()*2;put(tube([[x-3.2,-0.3,z],[x-2,2.6,z-0.4],[x+0.5,3.4,z-0.6],[x+2.6,2.2,z-0.3],[x+3.4,-0.3,z]],0.75,0.6,{seed:seed+5}),M.bark)}
    // a low mound behind the lane, a rock or two in front (low, so the run stays in view)
    put(blob(r()*CHUNK,-0.45,-2.1-r()*1.2,1.4+r()*1.0,0.7+r()*0.4,0.9,{seed:seed+3}),M.mound);
    for(let i=0;i<2;i++){const x=r()*CHUNK,z=1.7+r()*1.6;const g=rockGeo(CHUNK_X0+x,z,0.18+r()*0.18,0.7,seed+20+i);g.translate(-CHUNK_X0,0,0);put(g,i?M.rock:M.mossrock,{moss:!i})}
    // stones along the path's edges
    {const st=[];for(let i=0;i<6;i++){const x=r()*CHUNK,z=0.3+(r()<0.5?-1:1)*(0.68+r()*0.25),g=rockGeo(CHUNK_X0+x,z,0.05+r()*0.07,0.6,seed+80+i);g.translate(-CHUNK_X0,0,0);st.push(g)}
      put(mergeGeometries(st),M.rock,{moss:false})}
    // hanging vines in the background
    for(let k=0;k<2;k++){const x=r()*CHUNK,z=-1.9-r()*2.4,y1=1.4+r()*2.4,pts=[];
      for(let i=0;i<=6;i++){const t=i/6;pts.push([x+Math.sin(t*3+k)*0.25,20-(20-y1)*t,z+Math.cos(t*2+k)*0.2])}
      put(tube(pts,0.05,0.04,{seed:seed+40+k,seg:60,rad:7,flare:false,moss:0.8,vs:1}),M.vine)}
    // faint trunks far back in the fog
    for(let i=0;i<3;i++){const x=r()*CHUNK,z=-18-r()*14,rr=1+r()*1.3;far.push(tube([[x,-0.3,z],[x+r()*0.6,16,z],[x+r()*1.2,30,z-0.8]],rr,rr*0.8,{seg:20,rad:12,seed:seed+60+i}))}
    put(mergeGeometries(far),M.far,{cast:false,moss:false});
    const moss=mossOf(mos);
    return {meshes,moss,
      ground:groundGeo(CHUNK_X0,CHUNK_X0+CHUNK,-39.75,20.25,CHUNK_X0),
      grass:grassGeo(PHONE?1400:2800,()=>{const x=CHUNK_X0+r()*CHUNK,z=-5+Math.pow(r(),0.85)*9;return onTrail(x,z)&&r()<0.85?null:{x,z}},CHUNK_X0),
      trail:trailGeo(CHUNK_X0,CHUNK_X0+CHUNK,CHUNK_X0),
      fern:fernGeo([[r()*CHUNK,-1.4-r()*0.6],[r()*CHUNK,-1.6-r()*1.2],[r()*CHUNK,2.2+r()*1.2]],(x,z)=>groundY(CHUNK_X0+x,z)),
      flowers:flowerGeo(moss,0.12)}}
  function chunkInstance(v){const g=new THREE.Group();
    for(const {geo,mat,cast} of v.meshes){const m=new THREE.Mesh(geo,mat);m.castShadow=cast;m.receiveShadow=true;if(cast)casters.push(m);g.add(m)}
    g.add(mossMesh(v.moss));
    const gm=new THREE.Mesh(v.ground,M.ground);gm.receiveShadow=true;g.add(gm);
    const tm=new THREE.Mesh(v.trail,M.trail);tm.receiveShadow=true;tm.renderOrder=1;g.add(tm);
    const gr=new THREE.Mesh(v.grass,grassMat);gr.frustumCulled=false;g.add(gr);
    const fm=new THREE.Mesh(v.fern,fernMat);fm.castShadow=true;fm.receiveShadow=true;g.add(fm);
    flowerPoints(v.flowers,g);return g}
  const variants=[101,202,303].map(chunkVariant);
  const pool=variants.map(v=>[chunkInstance(v)]);   // one of each ready, so their first frame costs nothing extra
  const live=new Map();
  // keep the pieces from just behind x to well ahead of it in place
  function runTo(x){const k0=Math.floor((x-14-CHUNK_X0)/CHUNK),k1=Math.floor((x+34-CHUNK_X0)/CHUNK);
    for(const [k,g] of live)if(k<k0||k>k1){world.remove(g);pool[k%3].push(g);live.delete(k)}
    for(let k=Math.max(0,k0);k<=k1;k++)if(!live.has(k)){const g=pool[k%3].pop()||chunkInstance(variants[k%3]);g.position.x=CHUNK_X0+k*CHUNK;world.add(g);live.set(k,g)}}
  function endRun(){for(const [k,g] of live){world.remove(g);pool[k%3].push(g)}live.clear();follow(0)}
  // the sun (and its shadows), the sky and the drifting pollen go along with him
  function follow(x){followX=x;const L=LOOK[theme];sun.position.set(L.sunP[0]+x,L.sunP[1],L.sunP[2]);sun.target.position.set(x,0,-1);sky.position.x=LAND.x+x;drifters.position.x=x}
  // for compiling: the pieces' materials are the landing's own, so one hidden instance of each is enough
  const warm=new THREE.Group();warm.visible=false;for(const p of pool)warm.add(p[0].clone());world.add(warm);

  let fogK = 1, runFog = 1;
  const api = {
    group: world,
    fog,
    G,
    LAND,
    casters,
    get exposure() { return exposure; },
    setFall,
    // the run
    runTo, endRun, follow,
    // the run's camera is further away: thinner fog there so the forest doesn't wash out
    setRunFog(k) { runFog = k; }, LOOK: () => LOOK[theme], night: () => theme === 'night',
    kit: { M, mossMat, mossOf, mossMesh, tube, blob, rockGeo, groundY, wave, DOT, leafMat, fernMat, mulberry32, SET, PHONE },
    setPits(list) { for (let i = 0; i < 4; i++) { const q = list[i]; G.uPits.value[i].set(q ? q[0] : 1e9, q ? q[1] : 1e9, q ? q[2] : 0, q ? q[3] : 0); } },
    setTheme(t) { theme = t === 'dark' || t === 'night' ? 'night' : 'day'; applyLook(); },
    // the landing: seq on/off, the two radii, and how thick the air is (0..1, rises with shockwave 2)
    setWaves({ seq, w1 = 0, w2 = 0, k = 1 }) { G.uSeq.value = seq ? 1 : 0; G.uW1.value = w1; G.uW2.value = w2; fogK = k; G.uCenter.value.copy(LAND); },
    // the landing camera: framed for a portrait phone or a wide screen
    camFor(aspect) { const port = aspect < 0.8, d = port ? 7.6 : 7.8, t = new THREE.Vector3(0, 1.45, -0.6);
      return { fov: port ? 54 : 36, target: t, pos: new THREE.Vector3(t.x, t.y - 0.25, t.z + d) }; },
    update(time) {
      G.uTime.value = time;
      const L = LOOK[theme], fd = L.fogD * SET.fog * fogK * runFog;
      fog.density = fd; G.uFogD.value = fd;
      skyMat.color.set(L.sky).multiplyScalar(G.uSeq.value > 0.5 ? fogK : 1);
      for (const P of [pollen, fireflies]) if (P.visible) { const a = P.geometry.attributes.position.array, b = P.userData.base;
        for (let i = 0; i < a.length; i += 3) { a[i] = b[i] + Math.sin(time * 0.3 + i) * 0.4; a[i + 1] = b[i + 1] + Math.sin(time * 0.5 + i * 1.3) * 0.25; a[i + 2] = b[i + 2] + Math.cos(time * 0.27 + i * 0.7) * 0.4; }
        P.geometry.attributes.position.needsUpdate = true; }
      fireflies.material.opacity = 0.6 + 0.4 * Math.sin(time * 2.6);
      // the fall's specks drift up a little; after touchdown they and the floor glow fade out
      const dt = FX.last < 0 ? 0 : Math.min(0.1, time - FX.last); FX.last = time;
      if (specks.visible) {
        for (let i = 1; i < sp.length; i += 3) sp[i] += 0.25 * dt;
        speckGeo.attributes.position.needsUpdate = true;
        if (FX.impact) { if (FX.t0 < 0) FX.t0 = time; const k = 1 - (time - FX.t0) / 0.6;
          floorMat.uniforms.uK.value = Math.max(0, k); speckMat.opacity = 0.7 * Math.max(0, k);
          if (k <= 0) setFall({ on: false }); }
      }
      // the hidden forest casts no shadow on him in the dark
      const shade = G.uSeq.value < 0.5 || G.uW2.value > 0; for (const c of casters) c.castShadow = shade;
    },
    dispose() { world.traverse(o => { if (o.geometry) o.geometry.dispose(); const m = o.material; if (m) for (const x of [].concat(m)) { for (const v of Object.values(x)) if (v && v.isTexture) v.dispose(); x.dispose(); } }); },
  };
  return api;
}
