// Section 5's Puli: the blocky 3D character on a see-through canvas behind the HTML button. Ported from the test page
// Puli approved (tools/texture_bake/blocky/anim/movetest.html): he moonwalks in with the scroll, passing behind the
// button, cuts into the dance's own moonwalk, turns to face the viewer during its spin. When the visitor presses the
// Play button (resting at the bottom of the screen) it takes off; he turns side-on, steps under it, jumps and latches
// onto its right end while it hovers, is carried up, lets go, and falls; the page follows him down into the forest
// (section 6), which takes over with its own fall.
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
      // his hands stay on the right end of the flying button
      if (craft) {
        const h = handsWorld();
        const want = toWorld(craft.x, craft.y, h.z + BTN_GRIP.z).sub(BTN_GRIP);
        puli.position.x += want.x - h.x;
        puli.position.y += want.y - h.y;
      }
      // carried up until he is high on the screen, then he lets go
      const hy = toScreen(hipsWorld()).y;
      if ((craft && craft.phase === 'exit' && hy < V.h * 0.3) || T.t > 8) {
        keepHips(() => {
          puli.rotation.y = 0;
        });
        playClip('fallloop', 0.2);
        S = { phase: 'drop', t: 0, busy: true, vy: 0.6 };
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

  // ---- the loop: runs while the section is on screen, or while he is in the middle of the sequence ----
  let raf = 0;
  let visible = false;
  let last = 0;
  const frame = now => {
    raf = 0;
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
    if (!v && !S.busy && puli) resetEntrance();
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
    measure();
    resetEntrance();
    onReady?.(true);
    kick();
  }, undefined, () => onReady?.(false));

  // ?puli-debug: inspect the layout and the move state from the console (headless tests)
  if (/[?&]puli-debug/.test(location.search)) {
    window.__puliStage = { V, get S() { return S; }, get puli() { return puli; }, hipsWorld: () => hipsWorld(), toScreen };
  }

  return {
    setVisible,
    setTheme: t => {
      setTheme(t);
      kick();
    },
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
