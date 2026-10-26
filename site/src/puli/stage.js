// Section 5's Puli: the blocky 3D character on a see-through canvas behind the HTML button. Ported from the test page
// Puli approved (tools/texture_bake/blocky/anim/movetest.html): he moonwalks in with the scroll, passing behind the
// button, cuts into the dance's own moonwalk, turns to face the viewer during its spin. When the visitor presses the
// Play button (resting at the bottom of the screen) it takes off; he turns side-on, steps under it, jumps and latches
// onto its right end while it hovers, is carried off the top of the screen, slips off up there and falls back in; the
// page follows him down into the forest (section 6). There the forest code (src/puli3d.js) runs the fall, the landing
// and the game, and reports every frame where he is and what he is doing; `renderForest` draws him there, with the
// forest's camera, in place of the old voxel Puli.
//
// The canvas is fixed to the viewport, so the flight and the fall can use the whole screen. Every frame the camera is
// placed from the page layout: his feet stand a fixed distance below the button's resting centre, and 1 world unit
// (his height) is `px` screen pixels, so world positions convert to screen positions with plain arithmetic.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import modelUrl from '../assets/puli/puli.glb?url';

const LOOP = new Set(['idle', 'walk', 'moonwalk', 'dance', 'hang', 'fallloop', 'run']);
const FOV = 30;
const TAN = Math.tan((FOV / 2) * Math.PI / 180);
const BTN_UP = 0.8;          // the button's resting centre sits this high on him (chest), in his heights
const MW_SPEED = 0.46;       // moonwalk glide in units/s, matched to the clip so his feet don't slide
const MW_CUT = 0.40;         // moonwalk time that matches the dance at DANCE_IN (same pose)
const DANCE_IN = 7.57;
const SPIN = [9.2, 10.4];    // the dance's spin: he turns from side-on to facing the viewer during it
const AUTO_AT = 0.97;        // once this much of the section is in view, the rest of the entrance plays by itself
const MAX_RATE = 2.5;        // the scroll can speed the moonwalk up to this many times its own pace, never skip it
const WALK = 0.75;           // his walking speed, units/s
const GRAV = 7;              // falling, units/s^2 (he is 1 unit tall)
const FOLLOW = 0.42;         // while he falls the page scrolls to keep him this far down the screen
const CLEAR = 0.12;          // how far right of the button's edge his hips end up after the entrance, in his heights
const REACH = 0.34;          // his half-width with his arms at his sides (dance and idle), in his heights
const NEAR = 1.06;           // the dance's spin also steps him towards the camera, which makes him this much bigger
const BTN_GRIP = new THREE.Vector3(-0.15, 0.02, -0.03); // pill centre relative to his hands: he holds its right end
const SIDE = -Math.PI / 2;   // side-on, facing left (towards the button)

const LIGHT = {
  light: { sky: 0xffffff, ground: 0x8a8a80, hemi: 2.1, sun: 0xfff4e6, sunI: 1.7, shadow: 0.45 },
  dark: { sky: 0xdfe8d6, ground: 0x2a3a2e, hemi: 1.45, sun: 0xffe6c8, sunI: 1.3, shadow: 0.7 }
};

const smooth = u => u * u * (3 - 2 * u);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/**
 * @param {object} o
 * @param {HTMLCanvasElement} o.canvas  fixed, full-viewport, pointer-events:none
 * @param {() => {field: DOMRect, stage: DOMRect, pill: number, forest: DOMRect|null}} o.layout  the button field, the
 *   section's stage and the forest section, in viewport px, and the resting button's width (0 while it is gone)
 * @param {'light'|'dark'} o.theme
 * @param {() => void} o.onForest  he has fallen into the forest: the forest section takes over from here
 * @param {(ok: boolean) => void} o.onReady
 */
export function createPuliStage({ canvas, layout, theme, onForest, onReady }) {
  const R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  R.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const hemi = new THREE.HemisphereLight();
  const sun = new THREE.DirectionalLight();
  sun.position.set(1.2, 2.4, 2.2);
  scene.add(hemi, sun);
  const cam = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);

  // a soft round shadow under his hips
  const sc = document.createElement('canvas');
  sc.width = sc.height = 128;
  const sx = sc.getContext('2d');
  const gr = sx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(0,0,0,1)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  sx.fillStyle = gr;
  sx.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.75),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.visible = false;
  scene.add(shadow);

  let shadowA = 0.45;
  const setTheme = t => {
    const L = LIGHT[t === 'dark' ? 'dark' : 'light'];
    hemi.color.set(L.sky);
    hemi.groundColor.set(L.ground);
    hemi.intensity = L.hemi;
    sun.color.set(L.sun);
    sun.intensity = L.sunI;
    shadowA = L.shadow;
  };
  let curTheme = theme;
  setTheme(theme);

  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  let puli = null;
  let mixer = null;
  let clips = {};
  let cur = null;
  let hips = null;
  let lh = null;
  let rh = null;
  let GRAB_HANDS = null;    // his hands at the top of the grab, in his own frame
  let DANCE_RUN = 0.75;     // how far the dance's moonwalk carries his hips (measured at load)

  // layout, refreshed every frame (scrolling moves everything together)
  const V = { forestTop: null, pillHalf: 0, w: 1, h: 1, px: 300, feetY: 0, camY: 0, d: 5, bx: 0, cut: 0, lead: 3.45, q: 0 };

  // the move state
  let S = { phase: 'none' };

  const hipsWorld = () => {
    puli.updateMatrixWorld(true);
    return hips.getWorldPosition(new THREE.Vector3());
  };
  const handsWorld = () => {
    puli.updateMatrixWorld(true);
    return lh.getWorldPosition(new THREE.Vector3()).add(rh.getWorldPosition(new THREE.Vector3())).multiplyScalar(0.5);
  };
  // apply a change (a new clip, a turn) without moving his hips: shift him back by however much they moved
  const keepHips = change => {
    const p0 = hipsWorld();
    change();
    mixer.update(0);
    const p1 = hipsWorld();
    puli.position.x += p0.x - p1.x;
    puli.position.z += p0.z - p1.z;
  };
  const playClip = (name, fade = 0.25, once = false) => {
    const a = mixer.clipAction(clips[name]);
    a.reset();
    a.setLoop(LOOP.has(name) && !once ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    a.clampWhenFinished = true;
    if (cur && cur !== a) {
      if (fade > 0) a.crossFadeFrom(cur, fade, false);
      else cur.stop();
    }
    a.play();
    cur = a;
    return a;
  };

  // ---- screen <-> world (his plane, z = 0, and planes near it) ----
  const toScreen = p => ({ x: V.w / 2 + p.x * V.px * V.d / (V.d - p.z), y: V.feetY - p.y * V.px * V.d / (V.d - p.z) });
  const toWorld = (x, y, z = 0) => {
    const k = (V.d - z) / V.d / V.px;
    return new THREE.Vector3((x - V.w / 2) * k, V.camY - (y - V.h / 2) * k, z);
  };

  const measure = () => {
    const c = canvas.getBoundingClientRect();
    const w = Math.max(1, c.width);
    const h = Math.max(1, c.height);
    if (w !== V.w || h !== V.h) {
      V.w = w;
      V.h = h;
      R.setSize(w, h, false);
      cam.aspect = w / h;
    }
    const { field, stage, pill, forest } = layout();
    V.forestTop = forest ? forest.top - c.top : null;
    if (!V.pillHalf && pill) V.pillHalf = pill / 2; // the first label's width, so he doesn't shift as the labels change
    const half = V.pillHalf || 70;
    const bcx = field.left + field.width / 2 - c.left;
    const bcy = field.top + field.height / 2 - c.top;
    // his size: from the button down to the bottom of the section, and narrow enough that he ends the entrance on
    // screen to the right of the button
    const px = clamp(Math.min((stage.bottom - c.top - 20 - bcy) / BTN_UP, h * 0.46, (w - 8 - bcx - half) / ((CLEAR + REACH) * NEAR)), 150, 440);
    V.px = px;
    V.feetY = bcy + BTN_UP * px;
    V.d = h / (2 * TAN * px);
    V.camY = (V.feetY - h / 2) / px;
    V.bx = (bcx - w / 2) / px;
    const endX = V.bx + half / px + CLEAR;
    V.cut = endX - DANCE_RUN;
    // start well off the left edge: whole moonwalk cycles before the cut, so the cut lands on the matching pose
    const dur = clips.moonwalk ? clips.moonwalk.duration : 1.0167;
    const need = (V.cut + w / 2 / px + 0.45) / MW_SPEED;
    V.lead = MW_CUT + Math.max(1, Math.ceil((need - MW_CUT) / dur)) * dur;
    // how much of the section is in view: 1 once its bottom reaches the bottom of the screen
    V.q = clamp((h - (stage.top - c.top)) / Math.max(1, stage.height), 0, 1);
    cam.position.set(0, V.camY, V.d);
    cam.lookAt(0, V.camY, 0);
    cam.updateProjectionMatrix();
  };

  // ---- the entrance ----
  const resetEntrance = () => {
    if (!puli) return;
    mixer.stopAllAction();
    cur = null;
    puli.rotation.y = SIDE;
    puli.position.set(0, 0, 0);
    puli.visible = true;
    if (reduce) {
      // no moonwalk or dance: he simply stands to the right of the button, facing the viewer
      puli.rotation.y = 0;
      playClip('idle', 0);
      measure();
      puli.position.x = V.cut + DANCE_RUN;
      S = { phase: 'idle' };
      return;
    }
    playClip('moonwalk', 0);
    S = { phase: 'enter', r: V.lead, auto: false };
  };

  const enter = dt => {
    // the scroll sets where he should be, but he only ever moonwalks there (at most MAX_RATE times his pace), so a
    // fast scroll or a late-loading model never makes him pop up mid-screen
    if (V.q >= AUTO_AT) S.auto = true;
    if (!S.auto) {
      const want = V.lead * (1 - clamp((V.q - 0.25) / (AUTO_AT - 0.25), 0, 1));
      const k = dt * MAX_RATE;
      S.r = want < S.r ? Math.max(want, S.r - k) : Math.min(want, S.r + k);
    } else S.r = Math.max(0, S.r - dt);
    const dur = clips.moonwalk.duration;
    puli.position.x = V.cut - MW_SPEED * S.r;
    cur.time = (((MW_CUT - S.r) % dur) + dur) % dur;
    if (S.r <= 0) {
      cur.time = MW_CUT;
      mixer.update(0);
      keepHips(() => {
        playClip('dance', 0, true).time = DANCE_IN;
      });
      S = { phase: 'dance' };
    }
    return S.phase === 'dance' ? dt : 0; // the scroll drives the moonwalk's clock, not the frame time
  };

  // where he has to stand so that his hands meet a button at screen x `bx` at the top of his jump, and the screen y of
  // the button's centre at that moment
  const standFor = bx => {
    const reach = GRAB_HANDS.clone().applyEuler(new THREE.Euler(0, SIDE, 0)).add(BTN_GRIP);
    return { x: toWorld(bx, 0).x - reach.x, y: toScreen(new THREE.Vector3(0, reach.y, reach.z)).y };
  };

  // ---- Play: called by the section when the visitor presses the Play button (it takes off from screen x `bx`) ----
  let craft = null;     // the flying button's centre (viewport px) and its phase, reported every frame while it flies
  const flyAt = (x, y, phase) => {
    craft = { x, y, phase };
  };
  const play = bx => {
    if (!puli || S.phase === 'none' || S.busy) return false;
    if (S.phase === 'enter') {
      // pressed before he arrived: skip to where the entrance ends
      mixer.stopAllAction();
      cur = null;
      puli.rotation.y = 0;
      playClip('idle', 0);
      puli.position.set(V.cut + DANCE_RUN, 0, 0);
      mixer.update(0);
    } else if (cur && cur.getClip() !== clips.idle) keepHips(() => playClip('idle', 0.3));
    craft = null;
    S = { phase: 'call', t: 0, rot0: puli.rotation.y, standX: standFor(bx).x, walking: false, busy: true };
    return true;
  };

  const step = dt => {
    const T = S;
    T.t = (T.t || 0) + dt;
    if (T.phase === 'dance') {
      const t = cur.time;
      if (t >= SPIN[0] && t <= SPIN[1] + 0.05) {
        const u = Math.min(1, (t - SPIN[0]) / (SPIN[1] - SPIN[0]));
        keepHips(() => {
          puli.rotation.y = SIDE * (1 - smooth(u));
        });
      }
      if (t >= clips.dance.duration - 0.05) {
        keepHips(() => playClip('idle', 0.4));
        S = { phase: 'idle' };
      }
    } else if (T.phase === 'call') {
      // he turns side-on, towards the button, and steps to where his jump will meet it
      const u = Math.min(1, T.t / 0.6);
      keepHips(() => {
        puli.rotation.y = T.rot0 + (SIDE - T.rot0) * smooth(u);
      });
      const dx = T.standX - puli.position.x;
      if (Math.abs(dx) > 0.03 && u > 0.4) {
        if (!T.walking) {
          playClip('walk', 0.2);
          T.walking = true;
        }
        puli.position.x += Math.sign(dx) * Math.min(Math.abs(dx), WALK * dt);
      } else if (u >= 1) {
        if (T.walking) playClip('idle', 0.25);
        S = { phase: 'ready', t: 0, busy: true };
      }
    } else if (T.phase === 'ready') {
      // he jumps as the button reaches the top of its climb and hovers
      if (craft && craft.phase === 'hover') {
        keepHips(() => playClip('grab', 0.15, true));
        S = { phase: 'grab', t: 0, busy: true };
      }
    } else if (T.phase === 'grab') {
      const dur = clips.grab.duration;
      if (craft && T.t > dur * 0.6) {
        // the last part of the jump: his hands home in on the button's right end
        const h = handsWorld();
        const want = toWorld(craft.x, craft.y, h.z + BTN_GRIP.z).sub(BTN_GRIP);
        const k = 1 - Math.exp(-dt * 14);
        puli.position.x += (want.x - h.x) * k;
        puli.position.y += (want.y - h.y) * k;
      }
      if (T.t >= dur) {
        playClip('hang', 0.25);
        S = { phase: 'fly', t: 0, busy: true };
      }
    } else if (T.phase === 'fly') {
      // his hands stay on the right end of the flying button, until it is off the top of the screen
      if (craft && !T.loose) {
        const h = handsWorld();
        const want = toWorld(craft.x, craft.y, h.z + BTN_GRIP.z).sub(BTN_GRIP);
        if (dt > 0) T.vy = (T.vy || 0) * 0.8 + ((want.y - h.y) / dt) * 0.2;
        puli.position.x += want.x - h.x;
        puli.position.y += want.y - h.y;
        if (craft.phase === 'exit' && craft.y < -20) T.loose = true; // it soon stops reporting: carry on upwards
      } else if (T.loose) puli.position.y += Math.max(T.vy || 0, 3) * dt;
      // out of sight above the screen: he slips off up there
      if (toScreen(hipsWorld()).y + 0.7 * V.px < -10 || T.t > 10) S = { phase: 'slip', t: 0, busy: true };
    } else if (T.phase === 'slip') {
      // a moment later he falls back in from the top, and the page follows him down
      if (T.t > 0.35) {
        keepHips(() => {
          puli.rotation.y = 0;
        });
        playClip('fallloop', 0);
        mixer.update(0);
        puli.position.y += V.camY + V.h / 2 / V.px + 0.75 - hipsWorld().y;
        S = { phase: 'drop', t: 0, busy: true, vy: 0 };
      }
    } else if (T.phase === 'drop') {
      // falling; the page follows him down into the forest
      T.vy = Math.max(T.vy - GRAV * dt, -6.5);
      puli.position.y += T.vy * dt;
      const hy = toScreen(hipsWorld()).y;
      if (hy > V.h * FOLLOW) window.scrollTo({ top: window.scrollY + (hy - V.h * FOLLOW), behavior: 'instant' });
      if (V.forestTop === null || V.forestTop <= 1 || T.t > 6) {
        puli.visible = false;
        S = { phase: 'gone' };
        onForest();
      }
    }
  };

  // ---- the forest (section 6): the forest code moves the camera and the character, this draws him ----
  const holder = new THREE.Group();     // in the forest he hangs off this: placed and turned like the old voxel Puli
  scene.add(holder);
  const FOREST_LIGHT = {
    day: { sky: 0xc4ceb4, ground: 0x2f3824, hemi: 1.7, sun: 0xfff1d6, sunI: 2.0, dir: [0.3, 0.9, 0.25] },
    night: { sky: 0x3b4c63, ground: 0x0b1411, hemi: 1.1, sun: 0x8c9bd8, sunI: 1.1, dir: [-0.3, 0.8, 0.4] }
  };
  let forestOn = false;
  let forestVis = false;
  let K = 87;                           // his size in forest units (the voxel rig's hips stand 40 high)
  const F = { clip: null, mode: null, off: new THREE.Vector3(), air: false, vy0: 780, pvy: 0, land: 0 };
  // the Running Jump clip (0.9 s): he pushes off at 0.06 s, is in the air until he lands at 0.60 s, then runs on
  const RJ = { off: 0.06, down: 0.6 };
  const _m = new THREE.Matrix4();
  const _p = new THREE.Matrix4();
  const _v = new THREE.Vector3();
  const enterForest = () => {
    forestOn = true;
    mixer.stopAllAction();
    cur = null;
    F.clip = null;
    F.mode = null;
    holder.add(puli);
    puli.rotation.set(0, 0, 0);
    puli.scale.setScalar(K);
    shadow.visible = false;
    cam.matrixWorldAutoUpdate = false;
    cam.matrixAutoUpdate = false;
    S = { phase: 'forest' };
  };
  const leaveForest = () => {
    forestOn = false;
    scene.add(puli);
    puli.scale.setScalar(1);
    puli.position.set(0, 0, 0);
    cam.matrixWorldAutoUpdate = true;
    cam.matrixAutoUpdate = true;
    setTheme(curTheme);
    resetEntrance();
  };
  // which of his animations matches what the forest is doing, and whether his hips are pinned to its point
  // (falling, hanging, jumping, sliding) or his feet stand on the ground (landing, getting up, idle, running)
  const forestClip = st => {
    const g = st.g;
    if (st.mode === 'fall') return [st.kind === 'hold' ? 'hang' : 'fallloop', true];
    if (st.mode === 'impact') return ['fall', false];
    if (st.mode === 'getup') return ['getup', false];
    if (st.mode === 'game' && g) {
      if (g.over) return ['fall', false];
      if (g.hover > 0 || !g.gnd) return ['runjump', true];
      if (F.land > 0) return ['runjump', false];
      if (g.slideT > 0) return ['slide', true];
      return ['run', false];
    }
    return ['idle', false];
  };
  const renderForest = (st, rect, dt) => {
    if (!puli || dead) return false;
    if (!forestOn) enterForest();
    measure();
    const L = FOREST_LIGHT[st.night > 0.5 ? 'night' : 'day'];
    hemi.color.set(L.sky);
    hemi.groundColor.set(L.ground);
    hemi.intensity = L.hemi;
    sun.color.set(L.sun);
    sun.intensity = L.sunI;
    sun.position.set(...L.dir);
    // jumps in the run: note the take-off speed (a second jump in the air starts the clip again) and the landing
    const g0 = st.g;
    if (st.mode === 'game' && g0) {
      if (!g0.gnd) {
        if (!F.air || g0.vy > F.pvy + 60) F.vy0 = Math.max(g0.vy, 300);
        F.air = true;
        F.land = 0;
      } else if (F.air) {
        F.air = false;
        F.land = clips.runjump.duration - RJ.down;
      } else F.land = Math.max(0, F.land - dt);
      F.pvy = g0.vy;
    } else {
      F.air = false;
      F.land = 0;
    }
    const [name, pinned] = forestClip(st);
    const moved = F.mode !== st.mode;
    F.mode = st.mode;
    if (name !== F.clip) {
      const p0 = F.clip ? hipsWorld() : null;
      const once = name === 'fall' || name === 'getup' || name === 'slide';
      playClip(name, name === 'fall' || name === 'getup' ? 0.12 : 0.2, once);
      F.clip = name;
      if (st.mode === 'impact' || (st.mode === 'game' && moved)) F.off.set(0, 0, 0);
      else if (p0 && !pinned) {
        // from the landing into getting up into idle: keep his hips where they were
        mixer.update(0);
        holder.updateMatrixWorld(true);
        const p1 = hipsWorld();
        F.off.x += p0.x - p1.x;
        F.off.z += p0.z - p1.z;
      }
    }
    if (name === 'runjump') {
      // the run's physics moves him up and down; the clip follows the jump from take-off to landing (by how far his
      // upward speed has turned into downward speed), then plays its landing stride before he runs on
      const g = st.g;
      cur.paused = true;
      if (g && g.hover > 0) cur.time = 0.33;
      else if (F.air) cur.time = RJ.off + (RJ.down - RJ.off) * clamp(0.5 * (1 - g.vy / F.vy0), 0, 1);
      else cur.time = clips.runjump.duration - F.land;
    }
    mixer.update(name === 'runjump' ? 0 : dt);
    // place him like the voxel rig: turned about his hips (pinned), or standing at the forest's point (feet down)
    _m.makeRotationZ(st.roll || 0).multiply(_p.makeRotationY(st.yaw || 0)).multiply(_p.makeRotationX(st.lean || 0));
    if (pinned && st.world) {
      holder.position.fromArray(st.world);
      holder.quaternion.setFromRotationMatrix(_m);
      puli.position.set(0, 0, 0);
      holder.updateMatrixWorld(true);
      const hl = puli.worldToLocal(hips.getWorldPosition(_v));
      puli.position.copy(hl).multiplyScalar(-K);
    } else {
      const g = st.g;
      const w = st.world || [0, 0, 0];
      holder.position.set((st.mode === 'game' && g ? g.x : w[0]) + F.off.x, st.mode === 'game' && g && g.gnd ? g.y : 0, w[2] + F.off.z);
      holder.rotation.set(0, st.yaw || 0, 0);
      puli.position.set(0, 0, 0);
    }
    puli.visible = !st.hidden;
    // the forest's camera, squeezed into where the forest section sits on this full-screen canvas
    const c = canvas.getBoundingClientRect();
    cam.matrixWorldInverse.fromArray(st.V);
    cam.matrixWorld.copy(cam.matrixWorldInverse).invert();
    _p.set(rect.width / c.width, 0, 0, ((rect.left + rect.width / 2) - (c.left + c.width / 2)) / c.width * 2,
      0, rect.height / c.height, 0, -((rect.top + rect.height / 2) - (c.top + c.height / 2)) / c.height * 2,
      0, 0, 1, 0, 0, 0, 0, 1);
    cam.projectionMatrix.copy(_p.multiply(_m.fromArray(st.P)));
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
    R.setScissorTest(false);
    R.clear();
    R.setScissor(rect.left - c.left, c.bottom - rect.bottom, rect.width, rect.height);
    R.setScissorTest(true);
    R.render(scene, cam);
    R.setScissorTest(false);
    return true;
  };

  // ---- the loop: runs while the section is on screen, or while he is in the middle of the sequence ----
  let raf = 0;
  let visible = false;
  let last = 0;
  const frame = now => {
    raf = 0;
    if (forestOn) {
      // the forest draws him; once only section 5 is on screen again, he starts over here
      if (visible && !forestVis) leaveForest();
      else {
        last = 0;
        return;
      }
    }
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    measure();
    if (puli) {
      let mdt = dt;
      if (S.phase === 'enter') mdt = enter(dt);
      else step(dt);
      mixer.update(mdt);
      const hw = hipsWorld();
      const lift = Math.max(0, hw.y - 0.46);
      shadow.visible = S.phase !== 'drop' && S.phase !== 'gone';
      shadow.position.set(hw.x, 0.001, hw.z);
      shadow.scale.setScalar(1 / (1 + lift));
      shadow.material.opacity = shadowA / (1 + lift * 2);
    }
    R.render(scene, cam);
    if (visible || S.busy) raf = requestAnimationFrame(frame);
    else last = 0;
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };
  const setVisible = v => {
    visible = v;
    // scrolled right away (and not mid-sequence): the entrance plays again next time
    if (!v && !S.busy && puli && !forestOn) resetEntrance();
    if (v) kick();
  };

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  let dead = false;
  loader.load(modelUrl, g => {
    if (dead) return;
    puli = g.scene;
    puli.traverse(o => {
      if (o.isMesh) o.frustumCulled = false; // root motion moves him away from his bind-pose bounds
    });
    scene.add(puli);
    for (const c of g.animations) clips[c.name] = c;
    hips = puli.getObjectByName('mixamorigHips');
    lh = puli.getObjectByName('mixamorigLeftHand');
    rh = puli.getObjectByName('mixamorigRightHand');
    // measured once with a throwaway mixer: his hands at the top of the grab, and how far the dance's moonwalk goes
    {
      const m = new THREE.AnimationMixer(puli);
      const a = m.clipAction(clips.grab);
      a.play();
      a.time = clips.grab.duration - 0.01;
      m.update(0);
      GRAB_HANDS = handsWorld();
      a.stop();
      puli.rotation.y = SIDE;
      const d = m.clipAction(clips.dance);
      d.play();
      d.time = DANCE_IN;
      m.update(0);
      const x0 = hipsWorld().x;
      d.time = SPIN[0];
      m.update(0);
      DANCE_RUN = hipsWorld().x - x0;
      d.stop();
      m.uncacheRoot(puli);
      puli.rotation.y = 0;
    }
    mixer = new THREE.AnimationMixer(puli);
    {
      const a = mixer.clipAction(clips.idle);
      a.play();
      mixer.update(0);
      K = 40 / Math.max(0.2, hipsWorld().y); // the voxel rig's hips stand 40 forest units high
      a.stop();
    }
    measure();
    resetEntrance();
    onReady?.(true);
    kick();
  }, undefined, () => onReady?.(false));

  // ?puli-debug: inspect the layout and the move state from the console (headless tests)
  if (/[?&]puli-debug/.test(location.search)) {
    window.__puliStage = { V, get S() { return S; }, get puli() { return puli; }, get F() { return F; }, get cur() { return cur; }, hipsWorld: () => hipsWorld(), toScreen,
      // a clip's hips and feet heights over time, on a throwaway mixer (for timing moves against the game)
      sample: (name, n = 40) => {
        const m = new THREE.AnimationMixer(puli);
        const a = m.clipAction(clips[name]);
        a.play();
        const lf = puli.getObjectByName('mixamorigLeftToeBase') || puli.getObjectByName('mixamorigLeftFoot');
        const rf = puli.getObjectByName('mixamorigRightToeBase') || puli.getObjectByName('mixamorigRightFoot');
        const out = [];
        for (let i = 0; i <= n; i++) {
          a.time = clips[name].duration * i / n;
          m.update(0);
          puli.updateMatrixWorld(true);
          out.push([+a.time.toFixed(3), +hips.getWorldPosition(_v).y.toFixed(3), +lf.getWorldPosition(_v).y.toFixed(3), +rf.getWorldPosition(_v).y.toFixed(3)]);
        }
        a.stop();
        m.uncacheRoot(puli);
        return { duration: clips[name].duration, rows: out };
      } };
  }

  return {
    setVisible,
    setTheme: t => {
      curTheme = t;
      if (!forestOn) setTheme(t);
      kick();
    },
    renderForest,
    setForestVisible: v => {
      forestVis = v;
      kick();
    },
    // how long the forest should let his landing and his getting up last (his own animations)
    forestTimes: () => (puli ? { impact: 1.6, getup: 5.1 } : null),
    play,
    flyAt,
    standFor: bx => (GRAB_HANDS ? standFor(bx) : null),
    get reduce() {
      return reduce;
    },
    dispose() {
      dead = true;
      cancelAnimationFrame(raf);
      R.dispose();
    }
  };
}
