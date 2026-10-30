// Section 6's runner game, in the new forest (src/forest/world.js). The rules are the old page's (src/puli3d.js: newGame,
// spawn, stepGame, hurt, groundAt), ported unchanged and kept in the old game's units (Puli 80 tall; K converts to the
// forest's units, where he is 1 tall), with Puli's changes (2026-10-29): no birds (or moths), no laser and no vine walls to
// cut (vine curtains to slide under instead), no jetpack pickup. Speed rises from 400 to 1000; new kinds of obstacles
// unlock over time; 3 lives; the score is the distance plus the pollen collected; the best is kept as `puli-best`.
// Everything is built in code from the forest's own materials (bark, mossy rock, moss shells); at night obstacles get a
// glowing outline, mushrooms glow and owls get amber eyes. The stage (src/puli/stage.js) moves Puli and the camera.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const K = 1 / 80;   // old game units -> forest units

const BOX = { thorns: [150, 0, 44], shade: [44, 0, 84], log: [72, 0, 52], rock: [40, 0, 36], stump: [30, 0, 92], branch: [15, 88, 600],
  owl: [26, -14, 14], vine: [13, 0, 3000], curtain: [26, 50, 3000], boulder: [44, 0, 96] };

export function createGame(forest) {
  const { M, mossOf, mossMesh, tube, blob, wave, DOT, leafMat, fernMat, groundY, mulberry32 } = forest.kit;
  const LANE = forest.LAND.z;
  const R2 = Math.random;
  const group = new THREE.Group();
  forest.group.add(group);

  // ---------- looks ----------
  // the night outline: the shape again, pushed out along its normals and drawn from the inside (an "inverted hull")
  const glowMat = new THREE.ShaderMaterial({ side: THREE.BackSide, transparent: true, depthWrite: false,
    uniforms: { uC: { value: new THREE.Color('#3CF2D0') } },
    vertexShader: 'void main(){ vec3 p = position + normal * 0.03; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }',
    fragmentShader: 'uniform vec3 uC; void main(){ gl_FragColor = vec4(uC, 0.6); }' });
  const wood = wave(new THREE.MeshStandardMaterial({ color: '#8a6a45', roughness: 0.9 }));
  const dark = wave(new THREE.MeshStandardMaterial({ color: '#2b2219', roughness: 1 }));
  const thornMat = wave(new THREE.MeshStandardMaterial({ color: '#3b2a1c', roughness: 0.85 }));
  const capMat = wave(new THREE.MeshStandardMaterial({ color: '#b4502a', roughness: 0.6, emissive: '#000000' }));
  const stemMat = wave(new THREE.MeshStandardMaterial({ color: '#e8dfc8', roughness: 0.8 }));
  const owlMat = wave(new THREE.MeshStandardMaterial({ color: '#7a6248', roughness: 0.9 }));
  const wingMat = wave(new THREE.MeshStandardMaterial({ color: '#6a533c', roughness: 0.9, side: THREE.DoubleSide }));
  const eyeMat = new THREE.MeshBasicMaterial({ color: '#1a1410' });
  const shadeMat = new THREE.MeshBasicMaterial({ color: '#06040c' });
  const shadeEyes = new THREE.MeshBasicMaterial({ color: '#b48cff' });
  const pitMat = new THREE.MeshStandardMaterial({ color: '#120d08', roughness: 1 });
  const glows = [];    // outlines, shown at night
  const nightBits = []; // things that change at night: [material, day colour, night colour, key]

  // a mesh with its moss and its night outline
  function part(geo, mat, { moss = false, glow = true, cast = true } = {}) {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = cast;
    m.receiveShadow = true;
    if (moss) m.add(mossMesh(mossOf([geo])));
    if (glow) {
      const o = new THREE.Mesh(geo, glowMat);
      o.renderOrder = -1;
      m.add(o);
      glows.push(o);
    }
    return m;
  }
  const r = mulberry32(77);

  // ---------- the obstacles, built once and reused ----------
  const G_LOG = (() => { const g = tube([[-0.9, 0.32, 0], [-0.3, 0.35, 0.02], [0.3, 0.33, -0.02], [0.9, 0.31, 0]], 0.32, 0.3, { seg: 24, rad: 18, flare: false, moss: 1.2, seed: 3 }); return g; })();
  const G_CAP = new THREE.CircleGeometry(0.31, 18);
  const G_ROCK = (() => { const g = new THREE.IcosahedronGeometry(0.46, 3); const p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = v.clone().normalize(); const k = 1 + 0.16 * Math.sin(n.x * 3 + 1) * Math.sin(n.y * 4 + 2) + 0.08 * Math.sin(n.z * 7);
      v.copy(n).multiplyScalar(0.46 * k); v.y = Math.max(v.y * 0.85, -0.05) + 0.05; p.setXYZ(i, v.x, v.y, v.z); }
    g.computeVertexNormals(); g.setAttribute('aMoss', new THREE.Float32BufferAttribute(new Array(p.count).fill(1.1), 1)); return g; })();
  const G_STUMP = tube([[0, -0.2, 0], [0.02, 0.5, 0], [0, 1.15, 0]], 0.37, 0.34, { seg: 18, rad: 18, flare: true, moss: 1, seed: 8 });
  const G_STUMPTOP = (() => { const g = new THREE.CircleGeometry(0.34, 18); g.rotateX(-Math.PI / 2); g.translate(0, 1.15, 0); return g; })();
  const G_BOULDER = (() => { const g = new THREE.IcosahedronGeometry(0.6, 3); const p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = v.clone().normalize(); v.copy(n).multiplyScalar(0.6 * (1 + 0.08 * Math.sin(n.x * 5) * Math.sin(n.y * 4 + 1) + 0.05 * Math.sin(n.z * 9))); p.setXYZ(i, v.x, v.y, v.z); }
    g.computeVertexNormals(); g.setAttribute('aMoss', new THREE.Float32BufferAttribute(new Array(p.count).fill(1), 1)); return g; })();
  const G_BRANCH = tube([[0, 1.7, -2.6], [0.05, 1.42, -0.8], [-0.03, 1.32, 0.4], [0.04, 1.5, 2.0]], 0.17, 0.11, { seg: 30, rad: 12, flare: false, moss: 1, seed: 5 });
  const G_VINE = tube([[0, 0, 0], [0.03, 0.3, 0.02], [-0.02, 0.7, -0.02], [0, 1, 0]], 0.05, 0.05, { seg: 20, rad: 7, flare: false, moss: 0.8, seed: 9 });
  // leaves hanging off a branch or the end of a vine
  const leafClump = (pts, size) => {
    const geo = new THREE.PlaneGeometry(size * 0.5, size); geo.translate(0, -size * 0.5, 0);
    const im = new THREE.InstancedMesh(geo, leafMat, pts.length), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
    pts.forEach((p, i) => { e.set((r() - 0.5) * 0.8, r() * Math.PI * 2, (r() - 0.5) * 0.8); q.setFromEuler(e); const s = 0.8 + r() * 0.5;
      m.compose(new THREE.Vector3(...p), q, new THREE.Vector3(s, s, s)); im.setMatrixAt(i, m); c.setHSL(0.24 + r() * 0.06, 0.5, 0.22 + r() * 0.12); im.setColorAt(i, c); });
    return im;
  };
  const vineTip = () => { const pts = []; for (let i = 0; i < 9; i++) pts.push([(r() - 0.5) * 0.16, (r() - 0.2) * 0.12, (r() - 0.5) * 0.16]); return leafClump(pts, 0.16); };
  const branchLeaves = () => { const pts = []; for (let i = 0; i < 26; i++) { const z = -1.2 + r() * 3.0; pts.push([(r() - 0.5) * 0.3, 1.4 - r() * 0.1, z]); } return leafClump(pts, 0.28); };
  const G_THORNS = (() => { const geos = [];
    for (let i = 0; i < 7; i++) { const x0 = -1.9 + r() * 0.6, x1 = 1.9 - r() * 0.6, z = (r() - 0.5) * 0.9, h = 0.3 + r() * 0.25;
      const pts = []; for (let k = 0; k <= 5; k++) { const t = k / 5; pts.push([x0 + (x1 - x0) * t, Math.sin(t * Math.PI) * h + (r() - 0.5) * 0.08, z + Math.sin(t * 7 + i) * 0.15]); }
      geos.push(tube(pts, 0.035, 0.025, { seg: 24, rad: 6, flare: false, moss: 0, seed: i })); }
    const cone = new THREE.ConeGeometry(0.025, 0.11, 5);
    for (let i = 0; i < 70; i++) { const g = cone.clone(); g.rotateZ((r() - 0.5) * 2.6); g.rotateX((r() - 0.5) * 2); g.translate(-1.8 + r() * 3.6, 0.08 + r() * 0.42, (r() - 0.5) * 0.9);
      g.deleteAttribute('uv'); g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(g.attributes.position.count * 2).fill(0), 2));
      g.setAttribute('aMoss', new THREE.Float32BufferAttribute(new Array(g.attributes.position.count).fill(0), 1)); geos.push(g); }
    return mergeGeometries(geos); })();
  const G_SHROOM_CAP = (() => { const g = new THREE.SphereGeometry(0.42, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.5); g.scale(1, 0.62, 1); g.translate(0, 0.42, 0); return g; })();
  const G_SHROOM_STEM = new THREE.CylinderGeometry(0.11, 0.15, 0.46, 12); G_SHROOM_STEM.translate(0, 0.23, 0);
  const G_SPOT = new THREE.SphereGeometry(0.045, 8, 6);
  const G_BRIDGE = (() => { const geos = []; for (let i = 0; i < 3; i++) geos.push(tube([[0, 0.2, -0.36 + i * 0.36], [5.5 * 0.5, 0.22, -0.36 + i * 0.36 + 0.03], [5.5, 0.2, -0.36 + i * 0.36]], 0.15, 0.14, { seg: 24, rad: 10, flare: false, moss: 1, seed: 30 + i }));
    return mergeGeometries(geos); })();

  const makers = {
    log: () => { const m = part(G_LOG, M.bark, { moss: true }); for (const s of [-1, 1]) { const c = new THREE.Mesh(G_CAP, wood); c.position.set(0.9 * s + 0.01 * s, 0.32, 0); c.rotation.y = s * Math.PI / 2; m.add(c); } return m; },
    rock: () => part(G_ROCK, M.mossrock, { moss: true }),
    stump: () => { const m = part(G_STUMP, M.bark2, { moss: true }); m.add(new THREE.Mesh(G_STUMPTOP, wood)); return m; },
    boulder: () => part(G_BOULDER, M.mossrock, { moss: true }),
    branch: () => { const m = part(G_BRANCH, M.bark, { moss: true }); m.add(branchLeaves()); return m; },
    vine: () => { const g = new THREE.Group(); const v = part(G_VINE, M.vine, { moss: true }); g.add(v); const tip = vineTip(); g.add(tip); g.userData = { v, tip }; return g; },
    curtain: () => { const g = new THREE.Group(); for (let i = 0; i < 5; i++) { const v = part(G_VINE, M.vine, { moss: true }); v.position.set(-0.3 + i * 0.15, 0.62, (i % 2 ? -0.18 : 0.18)); v.scale.y = 16 - 0.62; g.add(v);
        const tip = vineTip(); tip.position.set(v.position.x, 0.62, v.position.z); g.add(tip); } return g; },
    thorns: () => part(G_THORNS, thornMat),
    shroom: () => { const g = new THREE.Group(); g.add(part(G_SHROOM_STEM, stemMat)); const cap = part(G_SHROOM_CAP, capMat); g.add(cap);
      for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(G_SPOT, stemMat); const a = r() * Math.PI * 2, t = 0.2 + r() * 0.6; s.position.set(Math.cos(a) * 0.36 * t, 0.42 + 0.26 * Math.sqrt(1 - t * t), Math.sin(a) * 0.36 * t); cap.add(s); }
      g.userData.cap = cap; return g; },
    owl: () => { const g = new THREE.Group();
      const body = part(new THREE.SphereGeometry(0.2, 16, 12), owlMat); body.scale.set(1, 1.25, 0.9); g.add(body);
      const head = part(new THREE.SphereGeometry(0.15, 16, 12), owlMat); head.position.set(0.04, 0.28, 0); g.add(head);
      const eyes = []; for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), eyeMat); e.position.set(0.13, 0.31, s * 0.065); g.add(e); eyes.push(e); }
      const wings = []; for (const s of [-1, 1]) { const wg = new THREE.PlaneGeometry(0.42, 0.22); wg.translate(0, s * 0.11, 0); const w = new THREE.Mesh(wg, wingMat); w.position.set(-0.02, 0.08, s * 0.16); w.rotation.x = Math.PI / 2; g.add(w); wings.push(w); }
      g.userData = { wings, eyes }; return g; },
    shade: () => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.5, 18, 14), shadeMat); b.scale.set(1, 1.15, 0.8); b.position.y = 0.55; g.add(b);
      const o = new THREE.Mesh(b.geometry, new THREE.MeshBasicMaterial({ color: '#6a3cff', side: THREE.BackSide, transparent: true, opacity: 0.6, depthWrite: false })); o.scale.setScalar(1.08); b.add(o); g.rotation.y = Math.PI;
      for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), shadeEyes); e.position.set(0.36, 0.72, s * 0.12); g.add(e); } return g; },
    bridge: () => part(G_BRIDGE, M.bark, { moss: true }),
  };
  const pools = {};
  // one of each, parked out of sight: they get compiled with the forest, and the first of each costs nothing to show
  const warm = new THREE.Group();
  warm.visible = false;
  group.add(warm);
  for (const t of Object.keys(makers)) { const v = makers[t](); pools[t] = [v]; warm.add(v); }
  const take = type => { const p = pools[type] || (pools[type] = []); const v = p.pop() || makers[type](); group.add(v); return v; };
  const give = (type, v) => { group.remove(v); pools[type].push(v); };

  // pits: a floor and three walls (the near one is the ground's own edge), dark and fogged
  const pitGeo = (() => { const geos = [];
    const floor = new THREE.PlaneGeometry(1, 2.4); floor.rotateX(-Math.PI / 2); floor.translate(0.5, -2.2, 0); geos.push(floor);
    const back = new THREE.PlaneGeometry(1, 2.2); back.translate(0.5, -1.1, -1.2); geos.push(back);
    for (const s of [0, 1]) { const w = new THREE.PlaneGeometry(2.4, 2.2); w.rotateY(s ? -Math.PI / 2 : Math.PI / 2); w.translate(s, -1.1, 0); geos.push(w); }
    return mergeGeometries(geos); })();
  const pits = [];
  const pitPool = [];

  // pollen to collect: small glowing orbs (a golden seed is worth more)
  const MAXP = 80;
  const orbGeo = new THREE.SphereGeometry(0.075, 10, 8);
  const orbs = new THREE.InstancedMesh(orbGeo, new THREE.MeshBasicMaterial({ color: '#ffffff' }), MAXP);
  const C_POLLEN = new THREE.Color('#FFE08A'), C_SEED = new THREE.Color('#FFB13B');
  orbs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  orbs.frustumCulled = false;
  group.add(orbs);
  const haloPos = new Float32Array(MAXP * 3), haloCol = new Float32Array(MAXP * 3);
  const haloGeo = new THREE.BufferGeometry();
  haloGeo.setAttribute('position', new THREE.BufferAttribute(haloPos, 3));
  haloGeo.setAttribute('color', new THREE.BufferAttribute(haloCol, 3));
  const halos = new THREE.Points(haloGeo, new THREE.PointsMaterial({ size: 0.42, map: DOT, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true }));
  halos.frustumCulled = false;
  group.add(halos);
  // firefly swarms
  const swarmGeo = new THREE.BufferGeometry();
  const swarmPos = new Float32Array(46 * 3 * 3);
  swarmGeo.setAttribute('position', new THREE.BufferAttribute(swarmPos, 3));
  const swarmPts = new THREE.Points(swarmGeo, new THREE.PointsMaterial({ color: '#E4FF7A', size: 0.12, map: DOT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  swarmPts.frustumCulled = false;
  group.add(swarmPts);

  // ---------- the rules (the old game's, in its units) ----------
  let best = 0;
  try { best = parseInt(localStorage.getItem('puli-best') || '0', 10) || 0; } catch (e) { /* private mode */ }
  const inp = { jump: false, held: false, slide: false };
  let g = null;
  let look = 500;
  let events = [];  // 'hurt', 'over', 'pick', 'bounce' for the stage to react to

  function newGame(x0) {
    return { gnd: true, x0, x: x0, y: 0, vy: 0, jumps: 0, slideT: 0, speed: 400, t: 0, pts: 0, lives: 3, inv: 0, obs: [], pick: [], nextX: x0 + 900, over: false, overT: 0 };
  }
  function spawn(g) {
    const d = Math.min(1, g.t / 240), x = g.nextX, t = g.t, night = forest.night();
    const w = [['log', 0.26], ['rock', 0.2], ['stump', 0.1 + 0.1 * d], ['branch', 0.1 + 0.1 * d],
      ['vine', t > 12 ? 0.12 : 0], ['shroom', t > 8 ? 0.08 : 0], ['curtain', t > 18 ? 0.08 + 0.04 * d : 0], ['boulder', t > 24 && !night ? 0.1 + 0.05 * d : 0],
      ['owl', t > 32 ? 0.06 + 0.1 * d : 0], ['gap', t > 10 ? 0.1 : 0], ['thorns', t > 16 ? 0.08 : 0], ['swarm', t > 20 ? 0.07 : 0], ['bridge', t > 26 ? 0.07 : 0],
      ['shade', t > 14 && night ? 0.14 : 0]];
    let rr = R2() * w.reduce((a, b) => a + b[1], 0), type = 'log';
    for (const [k, v] of w) { if ((rr -= v) <= 0) { type = k; break; } }
    // pollen: an arc over things you jump, a low line under things you slide below
    const gear = R2() < 0.06;
    let extra = 0;
    if (type === 'shroom') { g.obs.push({ type, x, sq: 0 }, { type: 'stump', x: x + 250 }, { type: 'stump', x: x + 340 });
      for (let i = 0; i < 7; i++) { const u = i / 6; g.pick.push({ x: x + 70 + u * 420, y: 90 + Math.sin(u * Math.PI) * 230, gear: gear && i === 3 }); } extra = 420; }
    else if (type === 'vine') { g.obs.push({ type, x, bot: 230, trig: null, lead: 0.75 + R2() * 1.1 }); for (let i = -2; i <= 2; i++) g.pick.push({ x: x + i * 34, y: 22, gear: false }); }
    else if (type === 'curtain') { g.obs.push({ type, x }); for (let i = -2; i <= 2; i++) g.pick.push({ x: x + i * 34, y: 22, gear: false }); }
    else if (type === 'boulder') g.obs.push({ type, x, vx: 0, rot: 0, act: false, my: 50 });
    else if (type === 'gap') { const gw = 120 + g.speed * 0.18; g.obs.push({ type, x, w: gw }); for (let i = 0; i < 5; i++) { const u = i / 4; g.pick.push({ x: x + u * gw, y: 70 + Math.sin(u * Math.PI) * 90, gear: gear && i === 2 }); } extra = gw; }
    else if (type === 'bridge') { g.obs.push({ type, x, w: 440, trig: null, drop: 0, vy: 0, rot: 0 }); extra = 440; }
    else if (type === 'thorns') { g.obs.push({ type, x, w: 300 }); for (let i = 0; i < 5; i++) { const u = i / 4; g.pick.push({ x: x - 150 + u * 300, y: 110 + Math.sin(u * Math.PI) * 80, gear: gear && i === 2 }); } extra = 160; }
    else if (type === 'swarm') { const lo = R2() < 0.5, P = []; for (let i = 0; i < 46; i++) P.push([(R2() - 0.5) * 40, R2() * 430, (R2() - 0.5) * 40, R2() * 6.28, (R2() - 0.5) * 300, R2() * 260]); g.obs.push({ type, x, lo, P, form: 0 }); }
    else if (type === 'shade') g.obs.push({ type, x, vx: 0, act: false });
    else if (type === 'owl') g.obs.push({ type, x: x + 200, y: 330, ty: R2() < 0.5 ? 28 : 74, act: false, vx: 0, tilt: 0 });
    else { g.obs.push({ type, x, y: 0, vx: 0 });
      if (type === 'branch') for (let i = -2; i <= 2; i++) g.pick.push({ x: x + i * 34, y: 22, gear: false });
      else for (let i = -2; i <= 2; i++) g.pick.push({ x: x + i * 40, y: (type === 'stump' ? 150 : 118) - i * i * 8, gear: gear && i === 0 }); }
    g.nextX += g.speed * (0.95 + R2() * 0.6) * Math.max(0.6, 1 - g.t / 360) + 300 + extra;
  }
  function groundAt(g, x) {
    for (const o of g.obs) {
      if (o.type === 'gap' && x > o.x + 10 && x < o.x + o.w - 10) return -1e9;
      if (o.type === 'bridge' && x > o.x + 10 && x < o.x + o.w - 10) return o.trig != null && g.t - o.trig > 0.5 ? -1e9 : 28;
    }
    return 0;
  }
  const score = g => Math.floor((g.x - g.x0) / 10) + g.pts;
  function hurt(g, inv) {
    g.lives--;
    g.inv = inv || 1.4;
    events.push('hurt');
    if (g.lives <= 0) {
      g.over = true;
      g.overT = 0;
      events.push('over');
      const sc = score(g);
      if (sc > best) { best = sc; try { localStorage.setItem('puli-best', String(best)); } catch (e) { /* private mode */ } }
    }
  }
  function stepGame(g, sec) {
    if (g.over) { g.overT += sec; inp.slide = false; if (inp.jump && g.overT > 0.7) { const nx = g.x + 200; release(); Object.assign(g, newGame(nx)); events.push('restart'); } inp.jump = false; return; }
    g.t += sec; g.speed = Math.min(1000, 400 + g.t * 4.5); g.x += g.speed * sec; g.inv = Math.max(0, g.inv - sec);
    if (inp.jump) { if (g.gnd) { g.vy = 780; g.jumps = 1; g.slideT = 0; events.push('jump'); } else if (g.jumps < 2) { g.vy = 700; g.jumps = 2; events.push('jump2'); } }
    if (inp.slide) { if (!g.gnd) g.vy = -1100; g.slideT = 0.65; events.push('slide'); }
    inp.jump = false; inp.slide = false;
    g.vy -= (inp.held && g.vy > 0 ? 1500 : 2600) * sec; g.y += g.vy * sec;
    const gh = groundAt(g, g.x); g.gnd = false;
    if (gh > -1e8 && g.y <= gh && g.vy <= 0 && g.y > gh - 40) { g.y = gh; g.vy = 0; g.jumps = 0; g.gnd = true; }
    if (g.y < -110) { const gp = g.obs.find(o => (o.type === 'gap' || o.type === 'bridge') && g.x > o.x - 20 && g.x < o.x + o.w + 20); g.x = gp ? gp.x + gp.w + 40 : g.x + 60; g.y = 0; g.vy = 0; g.inv = 0; hurt(g, 1.6); events.push('fell'); }
    g.slideT = Math.max(0, g.slideT - sec);
    while (g.nextX < g.x + 2400) spawn(g);
    const dd = Math.min(1, g.t / 240);
    for (const o of g.obs) { const dx = o.x - g.x;
      if (o.type === 'vine') { if (o.trig == null && dx < g.speed * o.lead) o.trig = g.t;
        if (o.trig != null) { const tt = (g.t - o.trig) % 2.0, k = tt < 0.16 ? tt / 0.16 : tt < 1.0 ? 1 : tt < 1.35 ? 1 - (tt - 1.0) / 0.35 : 0, bb = tt > 0.16 && tt < 0.6 ? Math.sin((tt - 0.16) * 22) * 14 * (1 - (tt - 0.16) / 0.44) : 0; o.bot = Math.max(46, 230 - 178 * k + bb); } }
      else if (o.type === 'boulder') { if (!o.act && dx < look + 120) { o.act = true; o.vx = -(130 + 90 * dd); } o.rot -= o.vx * sec / 50; }
      else if (o.type === 'owl') { if (!o.act && dx < look + 500) { o.act = true; o.vx = -(150 + 70 * dd); } const py = o.y;
        const dive = Math.max(0, Math.min(1, (look + 250 - dx) / (look + 50))); o.y = o.ty + (330 - o.ty) * (1 - dive * dive * (3 - 2 * dive)) + (dx < -60 ? Math.min(300, (-60 - dx) * 1.4) : 0); o.tilt = Math.max(-0.7, Math.min(0.7, (o.y - py) / Math.max(sec, 1e-3) * 0.0014)); }
      else if (o.type === 'shroom') o.sq = Math.max(0, o.sq - sec * 3);
      else if (o.type === 'bridge') { if (o.trig == null && g.gnd && g.y > 20 && g.x > o.x && g.x < o.x + o.w) o.trig = g.t; if (o.trig != null && g.t - o.trig > 0.5) { o.vy += 1500 * sec; o.drop += o.vy * sec; o.rot += 0.9 * sec; } }
      else if (o.type === 'swarm') o.form = Math.max(0, Math.min(1, (look + 260 - dx) / 300));
      else if (o.type === 'shade') { if (!o.act && dx < look + 200) { o.act = true; o.vx = -70; } }
      if (o.vx) o.x += o.vx * sec; }
    const sl = g.slideT > 0 && g.gnd, x0 = g.x - 18, x1 = g.x + 18, y0 = g.y, y1 = g.y + (sl ? 40 : 76);
    for (const o of g.obs) {
      if (o.type === 'shroom') { if (Math.abs(g.x - o.x) < 48 && g.y < 58 && g.vy <= 0) { g.y = 58; g.vy = 1000; g.jumps = 1; g.slideT = 0; o.sq = 1; events.push('bounce'); } continue; }
      if (o.type === 'gap' || o.type === 'bridge') continue;
      if (o.type === 'swarm') { if (o.form > 0.85 && x1 > o.x - 20 && x0 < o.x + 20 && g.inv <= 0) { const ok = o.lo ? y1 <= 58 : (y0 >= 95 && y1 <= 270); if (!ok) hurt(g); } continue; }
      const b = BOX[o.type], fly = o.type === 'owl', oy0 = o.type === 'vine' ? o.bot : fly ? o.y + b[1] : b[1], oy1 = fly ? o.y + b[2] : b[2];
      if (x1 > o.x - b[0] && x0 < o.x + b[0] && y1 > oy0 && y0 < oy1 && g.inv <= 0) hurt(g);
    }
    for (const q of g.pick) if (!q.got && Math.abs(q.x - g.x) < 34 && Math.abs(q.y - (g.y + 38)) < 50) { q.got = true; g.pts += q.gear ? 100 : 10; events.push(q.gear ? 'seed' : 'pick'); }
    // forget what is far behind (and put its look back in the pool)
    for (const o of g.obs) if (o.x + (o.w || 0) < g.x - 900 && o.view) { give(o.type, o.view); o.view = null; }
    g.obs = g.obs.filter(o => o.x + (o.w || 0) > g.x - 900);
    g.pick = g.pick.filter(q => q.x > g.x - 900);
  }
  function release() {
    if (!g) return;
    for (const o of g.obs) if (o.view) { give(o.type, o.view); o.view = null; }
    for (const p of pits) { group.remove(p); pitPool.push(p); }
    pits.length = 0;
    forest.setPits([]);
  }

  // ---------- drawing it ----------
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _v = new THREE.Vector3(), _e = new THREE.Euler();
  const wx = x => x * K;
  function sync(time) {
    const night = forest.night();
    for (const o of glows) o.visible = night;
    capMat.emissive.set(night ? '#1d8f86' : '#000000');
    eyeMat.color.set(night ? '#FFB23C' : '#1a1410');
    if (!g) return;
    const pitList = [];
    for (const o of g.obs) {
      if (o.type === 'gap') { pitList.push([wx(o.x), wx(o.x + o.w), LANE - 1.2, LANE + 1.2]); continue; }
      if (o.type === 'swarm') continue;
      if (!o.view) o.view = take(o.type);
      const v = o.view;
      v.position.set(wx(o.x), 0, LANE);
      v.rotation.set(0, 0, 0);
      v.scale.set(1, 1, 1);
      if (o.type === 'vine') { const b = wx(o.bot); v.userData.v.position.y = b; v.userData.v.scale.y = 16 - b; v.userData.tip.position.y = b; }
      else if (o.type === 'boulder') { v.position.y = 0.6; v.rotation.z = o.rot; }
      else if (o.type === 'owl') { v.position.y = wx(o.y) - 0.05; v.rotation.y = Math.PI; v.rotation.z = -o.tilt;
        const f = Math.sin(time * 18) * 0.7; v.userData.wings[0].rotation.y = f; v.userData.wings[1].rotation.y = -f; }
      else if (o.type === 'shroom') { const s = 1 - 0.35 * o.sq; v.scale.set(1 + 0.2 * o.sq, s, 1 + 0.2 * o.sq); }
      else if (o.type === 'bridge') { pitList.push([wx(o.x), wx(o.x + o.w), LANE - 1.2, LANE + 1.2]); v.position.y = -wx(o.drop) + 0.15; v.rotation.z = -o.rot * 0.3; }
      else if (o.type === 'shade') { v.position.y = Math.sin(time * 3) * 0.04; v.visible = night; v.rotation.y = Math.PI; }
    }
    // pits
    while (pits.length < pitList.length) { const p = pitPool.pop() || new THREE.Mesh(pitGeo, pitMat); pits.push(p); group.add(p); }
    while (pits.length > pitList.length) { const p = pits.pop(); group.remove(p); pitPool.push(p); }
    pitList.forEach((q, i) => { pits[i].position.set(q[0], 0, LANE); pits[i].scale.set(q[1] - q[0], 1, 1); });
    forest.setPits(pitList);
    // pollen
    let n = 0;
    for (const q of g.pick) { if (q.got || n >= MAXP) continue;
      const y = wx(q.y) + Math.sin(time * 3 + q.x * 0.05) * 0.04, s = q.gear ? 1.8 : 1;
      _m.compose(_v.set(wx(q.x), y, LANE), _q.identity(), _s.set(s, s, s)); orbs.setMatrixAt(n, _m);
      orbs.setColorAt(n, q.gear ? C_SEED : C_POLLEN);
      haloPos.set([wx(q.x), y, LANE], n * 3); haloCol.set(q.gear ? [1, 0.6, 0.15] : [1, 0.85, 0.4], n * 3); n++; }
    orbs.count = n;
    orbs.instanceMatrix.needsUpdate = true;
    if (orbs.instanceColor) orbs.instanceColor.needsUpdate = true;
    haloGeo.setDrawRange(0, n);
    haloGeo.attributes.position.needsUpdate = true;
    haloGeo.attributes.color.needsUpdate = true;
    // swarms
    let k = 0;
    for (const o of g.obs) { if (o.type !== 'swarm' || k >= 3) continue;
      for (let i = 0; i < 46; i++) { const P = o.P[i], f = o.form;
        const ty = o.lo ? 70 + P[1] / 430 * 360 : (P[1] < 200 ? P[1] / 200 * 90 : 280 + (P[1] - 200) / 230 * 150);
        const sx = o.x + P[0] + P[4] * (1 - f) + Math.sin(time * 2 + P[3]) * 8, sy = ty + (P[5] - 130) * (1 - f) + Math.cos(time * 2.4 + P[3]) * 8, sz = P[2] * 0.6;
        swarmPos.set([wx(sx), wx(sy), LANE + wx(sz)], (k * 46 + i) * 3); }
      k++; }
    swarmGeo.setDrawRange(0, k * 46);
    swarmGeo.attributes.position.needsUpdate = true;
  }

  // ---------- the frame: ferns and leaves close to the camera along the bottom, a canopy along the top ----------
  // Placed in the world on fixed slots along x (so they slide past faster than the lane, like real things near the
  // camera), at depths worked out from the camera each frame: the ferns stand just past where the ground leaves the
  // bottom of the screen and never reach up to his feet; the canopy hangs into the top edge. Flat cards, no moss.
  const hsh = (s, k) => { const v = Math.sin(s * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
  const cardUp = new THREE.PlaneGeometry(1, 1); cardUp.translate(0, 0.5, 0);      // grows up from its foot
  const cardDown = new THREE.PlaneGeometry(1, 1); cardDown.translate(0, -0.5, 0); // hangs from its top
  const VINE = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 512; const x = c.getContext('2d');
    const at = y => 32 + Math.sin(y * 0.03) * 7;
    x.strokeStyle = '#4a6a2c'; x.lineWidth = 4; x.beginPath(); x.moveTo(at(0), 0); for (let y = 8; y <= 512; y += 8) x.lineTo(at(y), y); x.stroke();
    for (let y = 18, i = 0; y < 500; y += 24, i++) { const s = i % 2 ? 1 : -1; x.fillStyle = i % 3 ? '#5d8a34' : '#4b7a2a';
      x.beginPath(); x.ellipse(at(y) + s * 11, y + 4, 11, 5, s * 0.7, 0, Math.PI * 2); x.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  // a little light of their own, so the cards facing away from the sun don't go black
  const cardMat = (map, color, test, glow) => wave(new THREE.MeshStandardMaterial({ map, color, alphaTest: test, side: THREE.DoubleSide, roughness: 0.9, emissive: glow, emissiveMap: map, emissiveIntensity: 0.6 }), { sway: 0.03, lineK: 0.3 });
  const FR = new THREE.Group();
  group.add(FR);
  const frameMesh = (geo, mat, max) => { const m = new THREE.InstancedMesh(geo, mat, max); m.count = 0; m.frustumCulled = false; m.setColorAt(0, new THREE.Color(1, 1, 1)); FR.add(m); return m; };
  const fgFronds = frameMesh(cardUp, cardMat(fernMat.map, '#9cbc78', 0.45, '#3a5a26'), 200);
  const fgLeaves = frameMesh(cardUp, cardMat(leafMat.map, '#8fae6c', 0.5, '#34521f'), 60);
  const cnLeaves = frameMesh(cardUp, cardMat(leafMat.map, '#5c7848', 0.5, '#22341a'), 260);
  const cnVines = frameMesh(cardDown, cardMat(VINE, '#86a46a', 0.5, '#2c4420'), 30);
  const _fe = new THREE.Euler(), _fc = new THREE.Color();
  const putCard = (mesh, i, x, y, z, rx, ry, rz, sx, sy, shade) => {
    _m.compose(_v.set(x, y, z), _q.setFromEuler(_fe.set(rx, ry, rz)), _s.set(sx, sy, 1));
    mesh.setMatrixAt(i, _m); mesh.setColorAt(i, _fc.setScalar(shade));
  };
  // c: the run camera { x, y, z, pitch, fov, asp }; grow (0..1) raises them as the camera settles; null hides them
  function frame(c, grow = 1) {
    let nf = 0, nl = 0, nc = 0, nv = 0;
    if (c && grow > 0.01) {
      const h = c.fov / 2 * Math.PI / 180, th = Math.tan(h), dist = c.z - LANE;
      const bot = c.pitch - h, top = c.pitch + h, foot = Math.atan2(-c.y, dist);
      // the foreground band: from where the ground meets the bottom edge to half again as far
      const dg = c.y / Math.max(0.05, -Math.tan(bot)), d0 = dg * 1.04, d1 = Math.max(d0 + 0.5, Math.min(dg * 1.5, dist - 1.4));
      const S = 0.36, half = d1 * th * c.asp + 0.8;
      for (let s = Math.floor((c.x - half) / S); s <= Math.ceil((c.x + half) / S); s++) {
        if (hsh(s, 1) < 0.2) continue;
        const d = d0 + (d1 - d0) * hsh(s, 2), x = (s + hsh(s, 3)) * S, z = c.z - d, y0 = groundY(x, z) - 0.05;
        const room = c.y + d * Math.tan(foot - 0.06) - y0;   // up to just below his feet on screen
        const tall = Math.max(0.3, room) * (0.6 + 0.4 * hsh(s, 4)) * grow, shade = 0.7 + 0.3 * hsh(s, 7);
        if (hsh(s, 5) < 0.72) {   // a fern: fronds fanning out from one root
          const n = 4 + Math.floor(hsh(s, 6) * 3);
          for (let i = 0; i < n && nf < 200; i++) {
            const a = (i / (n - 1) - 0.5) * 1.5 + (hsh(s, 10 + i) - 0.5) * 0.3, len = tall * (0.75 + 0.25 * hsh(s, 20 + i)) / Math.max(0.5, Math.cos(a));
            putCard(fgFronds, nf++, x, y0, z, 0.25 + 0.3 * hsh(s, 30 + i), (hsh(s, 40 + i) - 0.5) * 0.9, a, len * 0.3, len, shade);
          }
        } else {                  // a couple of broad leaves
          for (let i = 0; i < 2 && nl < 60; i++) {
            const a = (i - 0.5) * 0.9 + (hsh(s, 50 + i) - 0.5) * 0.4, len = tall * (0.7 + 0.3 * hsh(s, 52 + i));
            putCard(fgLeaves, nl++, x + (i - 0.5) * 0.1, y0, z, 0.3, (hsh(s, 54 + i) - 0.5) * 1.2, a, len * 0.5, len, shade);
          }
        }
      }
      // the canopy: clusters of dark leaves hanging into the top edge, a vine now and then
      const C = 0.5, dc0 = dist * 0.35, dc1 = dist * 0.75, halfC = dc1 * th * c.asp + 1.2;
      for (let s = Math.floor((c.x - halfC) / C); s <= Math.ceil((c.x + halfC) / C); s++) {
        const d = dc0 + (dc1 - dc0) * hsh(s, 60), z = c.z - d, x = (s + hsh(s, 61)) * C;
        const yTop = c.y + d * Math.tan(top), viewH = 2 * d * th;
        const hang = viewH * (0.05 + 0.09 * hsh(s, 62) * hsh(s, 63) * 2) * grow, shade = 0.5 + 0.5 * hsh(s, 64);
        for (let i = 0; i < 7 && nc < 260; i++) {
          const len = viewH * 0.055 * (0.7 + 0.6 * hsh(s, 70 + i));
          const bottom = yTop - hang * (0.15 + 0.85 * hsh(s, 80 + i));
          putCard(cnLeaves, nc++, x + (hsh(s, 90 + i) - 0.5) * C * 1.6, bottom + len, z + (hsh(s, 100 + i) - 0.5) * 0.8,
            (hsh(s, 110 + i) - 0.5) * 0.8, hsh(s, 120 + i) * Math.PI, Math.PI + (hsh(s, 130 + i) - 0.5) * 1.6, len * 0.5, len * grow, shade);
        }
        if (hsh(s, 140) < 0.16 && nv < 30) {
          const len = viewH * (0.12 + 0.22 * hsh(s, 141)) * grow;
          putCard(cnVines, nv++, x, yTop + viewH * 0.03, z + 0.1, 0, (hsh(s, 142) - 0.5) * 0.6, (hsh(s, 143) - 0.5) * 0.08, len * 0.12, len, 0.7 + 0.3 * hsh(s, 144));
        }
      }
    }
    for (const [m, n] of [[fgFronds, nf], [fgLeaves, nl], [cnLeaves, nc], [cnVines, nv]]) {
      m.count = n; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }

  return {
    group,
    get g() { return g; },
    get best() { return best; },
    score: () => (g ? score(g) : 0),
    input: inp,
    // start a run with Puli at forest x (he is at the landing spot, x 0)
    start(worldX = 0) { release(); g = newGame(worldX / K); events = []; },
    stop() { release(); g = null; },
    // one step: lookAhead = how far ahead the camera sees (forest units); returns what happened this step
    step(sec, lookAhead, time) {
      look = lookAhead / K;
      events = [];
      if (g) stepGame(g, sec);
      sync(time);
      return events;
    },
    // the ferns and canopy around the camera's view (null hides them)
    frame,
    // where Puli is (forest units)
    pos: () => (g ? { x: g.x * K, y: g.y * K } : null),
  };
}
