// Section 5's Puli: the blocky 3D character on a see-through canvas behind the HTML button. Ported from the test page
// Puli approved (tools/texture_bake/blocky/anim/movetest.html): he moonwalks in with the scroll, passing behind the
// button, cuts into the dance's own moonwalk, turns to face the viewer during its spin; once the button is caught he
// turns side-on, jumps, hangs from its right end while it flies off the top, then falls back down, lands face-down and
// gets up.
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
 * @param {() => {field: DOMRect, stage: DOMRect, pill: number}} o.layout  the button field and the section's stage, in
 *   viewport px, and the resting button's width (0 while it is gone)
 * @param {'light'|'dark'} o.theme
 * @param {(p: {x: number, y: number}, ms: number) => void} o.onGrab  where (viewport px) the button should glide to
 * @param {() => void} o.onLaunch  he is holding it: time for it to take off
 * @param {() => void} o.onDone    he has landed and got up
 * @param {(ok: boolean) => void} o.onReady
 */
export function createPuliStage({ canvas, layout, theme, onGrab, onLaunch, onDone, onReady }) {
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
  const V = { pillHalf: 0, w: 1, h: 1, px: 300, feetY: 0, camY: 0, d: 5, bx: 0, cut: 0, lead: 3.45, q: 0 };

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
  const play = (name, fade = 0.25, once = false) => {
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
    const { field, stage, pill } = layout();
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
    if (reduce) {
      // no moonwalk or dance: he simply stands to the right of the button, facing the viewer
      puli.rotation.y = 0;
      play('idle', 0);
      measure();
      puli.position.x = V.cut + DANCE_RUN;
      S = { phase: 'idle' };
      return;
    }
    play('moonwalk', 0);
    S = { phase: 'enter', r: V.lead, auto: false };
  };

  const enter = dt => {
    if (!S.auto) {
      S.r = V.lead * (1 - clamp((V.q - 0.25) / (AUTO_AT - 0.25), 0, 1));
      if (V.q >= AUTO_AT) S.auto = true;
    } else S.r = Math.max(0, S.r - dt);
    const dur = clips.moonwalk.duration;
    puli.position.x = V.cut - MW_SPEED * S.r;
    cur.time = (((MW_CUT - S.r) % dur) + dur) % dur;
    if (S.r <= 0) {
      cur.time = MW_CUT;
      mixer.update(0);
      keepHips(() => {
        play('dance', 0, true).time = DANCE_IN;
      });
      S = { phase: 'dance' };
    }
    return S.phase === 'dance' ? dt : 0; // the scroll drives the moonwalk's clock, not the frame time
  };

  // ---- the catch: called by the section when the visitor catches the button ----
  const caught = () => {
    if (!puli || S.phase === 'none' || S.busy) return false;
    if (S.phase === 'enter') {
      // caught before he arrived: skip to where the entrance ends
      mixer.stopAllAction();
      cur = null;
      puli.rotation.y = 0;
      play('idle', 0);
      puli.position.set(V.cut + DANCE_RUN, 0, 0);
      mixer.update(0);
    } else if (cur && cur.getClip() !== clips.idle) keepHips(() => play('idle', 0.3));
    S = { phase: 'call', t: 0, rot0: puli.rotation.y, busy: true };
    return true;
  };

  let craft = null;     // the flying button's centre (viewport px), reported every frame while it flies
  const flyAt = (x, y) => {
    craft = { x, y };
  };
  let exited = false;
  const gone = () => {
    exited = true;
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
        keepHips(() => play('idle', 0.4));
        S = { phase: 'idle' };
      }
    } else if (T.phase === 'call') {
      // he turns side-on, towards the button, then jumps for it
      const u = Math.min(1, T.t / 0.6);
      keepHips(() => {
        puli.rotation.y = T.rot0 + (SIDE - T.rot0) * smooth(u);
      });
      if (T.t > 0.9) {
        keepHips(() => play('grab', 0.2, true));
        const target = GRAB_HANDS.clone().applyEuler(puli.rotation).add(puli.position).add(BTN_GRIP);
        onGrab(toScreen(target), 950);
        S = { phase: 'grab', t: 0, busy: true };
      }
    } else if (T.phase === 'grab') {
      if (T.t > 1.15) {
        play('hang', 0.25);
        craft = null;
        exited = false;
        onLaunch();
        S = { phase: 'fly', t: 0, busy: true, vy: 0 };
      }
    } else if (T.phase === 'fly') {
      // his hands stay on the right end of the flying button
      if (craft && !exited) {
        const h = handsWorld();
        const want = toWorld(craft.x, craft.y, h.z + BTN_GRIP.z).sub(BTN_GRIP);
        const dy = want.y - h.y;
        if (dt > 0) T.vy = T.vy * 0.8 + (dy / dt) * 0.2;
        puli.position.x += want.x - h.x;
        puli.position.y += dy;
      }
      if (exited) {
        // the button has left the screen: he keeps going until he is out of sight too
        if (T.t2 === undefined) T.t2 = 0;
        T.t2 += dt;
        puli.position.y += Math.max(T.vy, 2.5) * dt;
        const top = V.camY + V.h / 2 / V.px;
        if (puli.position.y > top + 0.1 || T.t2 > 4) {
          S = { phase: 'pause', t: 0, busy: true };
        }
      }
    } else if (T.phase === 'pause') {
      if (T.t > 0.8) {
        // drop back in from the top, facing the viewer
        keepHips(() => {
          puli.rotation.y = 0;
        });
        play('fallloop', 0.2);
        // back onto his own spot beside the button (the button returns to the middle for another go)
        puli.position.x = V.cut + DANCE_RUN;
        puli.position.z = 0;
        S = { phase: 'drop', t: 0, busy: true, y0: V.camY + V.h / 2 / V.px + 0.15 };
      }
    } else if (T.phase === 'drop') {
      const u = Math.min(1, T.t / 1.3);
      puli.position.y = T.y0 * (1 - u * u);
      if (u >= 1) {
        puli.position.y = 0;
        play('fall', 0.1, true);
        S = { phase: 'land', t: 0, busy: true };
      }
    } else if (T.phase === 'land') {
      if (T.t > 1.6) {
        keepHips(() => play('getup', 0.2, true));
        S = { phase: 'up', t: 0, busy: true };
      }
    } else if (T.phase === 'up') {
      if (T.t > 5.1) {
        keepHips(() => play('idle', 0.5));
        S = { phase: 'idle' };
        onDone();
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
      shadow.visible = true;
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
    window.__puli = { V, get S() { return S; }, get puli() { return puli; }, hipsWorld: () => hipsWorld(), toScreen };
  }

  return {
    setVisible,
    setTheme: t => {
      setTheme(t);
      kick();
    },
    caught,
    flyAt,
    gone,
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
