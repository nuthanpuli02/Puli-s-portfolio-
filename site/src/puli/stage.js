// Section 5's Puli: the blocky 3D character on a see-through canvas behind the HTML button. Ported from the test page
// Puli approved (tools/texture_bake/blocky/anim/movetest.html): he moonwalks in with the scroll, passing behind the
// button, cuts into the dance's own moonwalk, turns to face the viewer during its spin. When the visitor presses the
// Play button (resting at the bottom of the screen) it takes off; he turns side-on, steps under it, jumps and latches
// onto its right end while it hovers, is carried off the top of the screen, slips off up there and falls back in; the
// page follows him down into the forest (section 6). There, in this same scene, he falls on through the dark into the
// new forest (src/forest/world.js): the green-grid landing with its two shockwaves (see "the forest" below).
//
// The canvas is fixed to the viewport, so the flight and the fall can use the whole screen. Every frame the camera is
// placed from the page layout: his feet stand a fixed distance below the button's resting centre, and 1 world unit
// (his height) is `px` screen pixels, so world positions convert to screen positions with plain arithmetic.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import modelUrl from '../assets/puli/puli.glb?url';
import { shared } from './shared.js';

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
  R.shadowMap.enabled = true;   // only the forest's sun casts shadows
  R.shadowMap.type = THREE.PCFSoftShadowMap;
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
  const DEBUG = /[?&]puli-debug/.test(location.search);
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
  const V = { forestTop: null, forestBottom: null, pillHalf: 0, w: 1, h: 1, px: 300, feetY: 0, camY: 0, d: 5, bx: 0, cut: 0, lead: 3.45, q: 0 };

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
    V.forestBottom = forest ? forest.bottom - c.top : null;
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
        loadForest(); // the entrance is over: get the forest ready while the visitor plays with the button
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
      // into the forest once its top reaches the top of the screen, or the page can't scroll further (on phones the
      // screen can be taller than the section when the address bar hides)
      if (V.forestTop === null || V.forestTop <= 1 || V.forestBottom <= V.h + 1 || T.t > 6) {
        startForest();
        onForest();
      }
    }
  };

  // ---- the forest (section 6): the new forest (src/forest/world.js), drawn in this same scene ----
  // He carries on falling at the size and spot he had on screen, in the dark; the camera pulls back to the landing view as
  // he nears the ground; he lands face-down and shockwave 1 draws the forest as a green grid; as he gets up shockwave 2
  // brings in the textures and the fog; then he stands there (the game comes back in Phase 3).
  let forest = null;
  let forestP = null;
  let forestVis = false;
  let FS = null;                        // the forest sequence: null = not in the forest
  const fcam = new THREE.PerspectiveCamera(54, 1, 0.05, 200);
  const FALL_V = 6.5;                   // his falling speed in the forest (as at the end of the drop), units/s
  const IMPACT = 0.18, UP = 1.5, IDLE = 6.7; // after touching down: shockwave 1, getting up, standing (s)
  const _a = new THREE.Vector3();
  const nextFrame = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
  const loadForest = () => forestP || (forestP = import('../forest/world.js').then(async m => {
    const gm = await import('../forest/game.js');
    await nextFrame();
    return new Promise(res => {
      let f = null;
      const done = () => setTimeout(() => res(f), 0);
      f = m.createForest({ onLoad: done });
      f.WAVES = m.WAVES;
      f.makeGame = () => gm.createGame(f);
    });
  }).then(async f => {
    await nextFrame();
    if (dead) return null;
    f.setTheme(curTheme);
    f.game = f.makeGame();   // the runner (its obstacles are built now, so they are compiled with the rest)
    await nextFrame();
    // prepare the forest's shaders (and his, under the forest's lights, fog and tone mapping) now, in the background,
    // so the phone doesn't freeze when the forest first shows
    try {
      const tmp = new THREE.Scene();
      tmp.fog = f.fog;
      tmp.add(f.group);
      fcam.aspect = V.w / V.h;
      fcam.updateProjectionMatrix();
      const tm = R.toneMapping;
      R.toneMapping = THREE.ACESFilmicToneMapping;
      const jobs = [R.compileAsync(tmp, fcam)];
      if (puli) jobs.push(R.compileAsync(puli, fcam, tmp));
      R.toneMapping = tm;
      await Promise.all(jobs);
      tmp.remove(f.group);
      // send its textures to the graphics chip now, one per frame, instead of all at once on the first forest frame
      const tex = new Set();
      f.group.traverse(o => {
        for (const m of [].concat(o.material || [])) for (const v of Object.values(m)) if (v && v.isTexture) tex.add(v);
      });
      for (const t of tex) {
        await nextFrame();
        if (dead) return null;
        R.initTexture(t);
      }
    } catch (e) {
      // not supported: they are prepared on first use instead
    }
    if (dead) return null;
    forest = f;
    return f;
  }).catch(() => null));
  const forestRect = () => {
    const el = document.getElementById('forest');
    return el ? el.getBoundingClientRect() : canvas.getBoundingClientRect();
  };
  const showWorld = on => {
    hemi.visible = sun.visible = !on;  // in the forest its own lights light him
    if (on) {
      scene.add(forest.group);
      scene.fog = forest.fog;
      R.toneMapping = THREE.ACESFilmicToneMapping;
      R.toneMappingExposure = forest.exposure;
    } else {
      if (forest) scene.remove(forest.group);
      scene.fog = null;
      R.toneMapping = THREE.NoToneMapping;
      R.toneMappingExposure = 1;
    }
  };
  // he has fallen down to the forest section (or, skip: show it with him already standing there)
  const startForest = (skip = false) => {
    if (!puli || FS) return;
    loadForest();
    const sp = toScreen(hipsWorld());
    shadow.visible = false;
    puli.traverse(o => {
      if (o.isMesh) o.castShadow = true;
    });
    mixer.stopAllAction();
    cur = null;
    puli.rotation.set(0, -0.45, 0);
    puli.visible = true;
    S = { phase: 'forest' };
    if (skip || reduce) {
      FS = { phase: 'wait-skip', t: 0 };
      playClip('idle', 0);
      return;
    }
    playClip('fallloop', 0);
    puli.position.set(0, 60, 0.3);   // high up until the forest is ready (only he is drawn meanwhile)
    mixer.update(0);
    FS = { phase: 'void', t: 0, sx: sp.x, sy: sp.y, px: V.px };
  };
  const leaveForest = () => {
    FS = null;
    forest?.setFall({ on: false });
    forest?.game?.stop();
    forest?.endRun();
    forest?.setRunFog(1);
    for (const a of mixer._actions) a.timeScale = 1;
    showWorld(false);
    puli.traverse(o => {
      if (o.isMesh) o.castShadow = false;
    });
    puli.rotation.set(0, 0, 0);
    puli.position.set(0, 0, 0);
    setTheme(curTheme);
    resetEntrance();
  };
  const landed = () => {
    FS.phase = 'done';
    forest.setWaves({ seq: false });
    shared.onForestLanded?.();
    runEmit();
  };

  // ---- the run (Phase 3, src/forest/game.js): once he is up, a tap (or Space) starts it ----
  // He turns to run right; the camera moves from the landing view to the old game's side view (sized so he stays in
  // view on a portrait phone, him a quarter of the way in from the left). His clips follow the run: run (faster as the
  // run speeds up), the Running Jump scrubbed by his vertical speed in the air then its landing stride, slide, and the
  // face-down fall when the run is over. He blinks while he can't be hurt.
  const RJ = { off: 0.06, down: 0.6 };   // the Running Jump clip: push-off and touchdown times
  const RUN = { blend: 0, vy0: 780, air: false, land: 0, clip: null, cam: null, turn: 0, rot0: 0, look: 6, emitT: 0 };
  const gameInfo = () => {
    const game = forest?.game, g = game?.g;
    return { ready: !!FS && FS.phase === 'done', running: !!FS && FS.phase === 'run' && !!g && !g.over, over: !!(FS && FS.phase === 'run' && g && g.over),
      score: game ? game.score() : 0, best: game ? game.best : 0, lives: g ? g.lives : 3 };
  };
  const runEmit = () => shared.onGame?.(gameInfo());
  const startRun = () => {
    if (!forest?.game) return;
    forest.game.start(puli.position.x);
    forest.setRunFog(0.5);
    FS.phase = 'run';
    Object.assign(RUN, { blend: 0, air: false, land: 0, clip: null, cam: null, turn: 0, rot0: puli.rotation.y, emitT: 0 });
    runEmit();
  };
  const runStep = (dt, time) => {
    const game = forest.game, g = game.g;
    const ev = game.step(dt, RUN.look, time);
    RUN.turn = Math.min(1, RUN.turn + dt / 0.35);
    puli.rotation.y = RUN.rot0 + (Math.PI / 2 - RUN.rot0) * smooth(RUN.turn);
    if (ev.includes('restart')) RUN.clip = null;
    if (!g.over) {
      if (!g.gnd) {
        if (!RUN.air || ev.includes('jump2') || ev.includes('bounce')) RUN.vy0 = Math.max(g.vy, 300);
        RUN.air = true;
        RUN.land = 0;
      } else if (RUN.air) {
        RUN.air = false;
        RUN.land = clips.runjump.duration - RJ.down;
      } else RUN.land = Math.max(0, RUN.land - dt);
    }
    // a swipe down starts with the finger going down, which is a tap (a small jump) first; the slide then pulls him
    // straight back down, so on the ground the slide wins over the jump's landing stride
    if (ev.includes('slide')) RUN.land = 0;
    const name = g.over ? 'fall' : !g.gnd ? 'runjump' : g.slideT > 0 ? 'slide' : RUN.land > 0 ? 'runjump' : 'run';
    if (name !== RUN.clip || (name === 'runjump' && (ev.includes('jump2') || ev.includes('bounce')) && RUN.air) || (name === 'slide' && ev.includes('slide'))) {
      const once = name === 'fall' || name === 'slide';
      playClip(name, name === 'fall' ? 0.12 : 0.12, once).timeScale = 1;
      RUN.clip = name;
    }
    if (name === 'runjump') {
      cur.paused = true;
      cur.time = RUN.air ? RJ.off + (RJ.down - RJ.off) * clamp(0.5 * (1 - g.vy / RUN.vy0), 0, 1) : clips.runjump.duration - RUN.land;
    } else if (name === 'run') cur.timeScale = clamp(g.speed / 330, 1.1, 2.4);
    const p = game.pos();
    puli.position.set(p.x, g.over ? 0 : p.y, forest.LAND.z);
    puli.visible = !(g.inv > 0 && !g.over && Math.floor(time * 14) % 2 === 0);
    forest.follow(p.x);
    RUN.emitT -= dt;
    if (RUN.emitT <= 0 || ev.length) {
      RUN.emitT = 0.2;
      runEmit();
    }
  };
  const _gp = new THREE.Vector3();
  const _gt = new THREE.Vector3();
  const runCamera = (rect, dt) => {
    const L = landView(rect);
    const port = L.asp < 0.8, fov = port ? 40 : 32, t = Math.tan(fov / 2 * Math.PI / 180);
    const dist = port ? 3.0 / (t * L.asp) : 8.75, hw = dist * t * L.asp;
    RUN.look = hw * 1.5;
    const p = forest.game.pos() || { x: puli.position.x, y: 0 };
    const cy = 1.75 + (dist - 8.75) * 0.14 + Math.max(0, p.y - 1.375) * 0.7;
    const want = { x: p.x + hw * 0.5, y: cy, z: forest.LAND.z + dist, pitch: -Math.max(0.07, Math.atan2(cy - 1.125, dist)), fov };
    if (!RUN.cam) RUN.cam = { ...want };
    const k = 1 - Math.exp(-dt * 5);
    for (const q of ['x', 'y', 'z', 'pitch', 'fov']) RUN.cam[q] += (want[q] - RUN.cam[q]) * k;
    RUN.cam.x = Math.min(RUN.cam.x, p.x + hw * 0.6);
    RUN.blend = Math.min(1, RUN.blend + dt / 1.1);
    const b = smooth(RUN.blend);
    _gp.set(RUN.cam.x, RUN.cam.y, RUN.cam.z);
    _gt.set(RUN.cam.x, RUN.cam.y + Math.tan(RUN.cam.pitch) * dist, forest.LAND.z);
    fcam.position.copy(L.land.pos).lerp(_gp, b);
    fcam.lookAt(_a.copy(L.land.target).lerp(_gt, b));
    fcam.fov = L.land.fov + (RUN.cam.fov - L.land.fov) * b;
    fcam.updateProjectionMatrix();
    fcam.updateMatrixWorld(true);
    forest.runTo(fcam.position.x);
  };
  const forestStep = dt => {
    const T = FS;
    T.t += dt;
    if (T.phase === 'wait-skip') {
      if (forest) {
        showWorld(true);
        puli.position.copy(forest.LAND);
        landed();
      }
      return;
    }
    if (T.phase === 'run') {
      if (forestVis) runStep(dt, T.t);
      return;
    }
    if (T.phase !== 'land') return;   // the fall itself is moved by fallStep (it needs the view's size)
    {
      T.tl += dt;
      const W = forest.WAVES, tl = T.tl;
      const u1 = clamp((tl - IMPACT) / W.w1, 0, 1);
      const u2 = clamp((tl - UP - 0.35) / W.w2, 0, 1);
      forest.setWaves({ seq: true, w1: u1 > 0 ? W.w1Max * (1 - Math.pow(1 - u1, 2.4)) : 0, w2: u2 > 0 ? W.w2Max * Math.pow(u2, 1.45) : 0, k: smooth(u2) });
      if (tl > UP && !T.up) {
        T.up = true;
        playClip('getup', 0.25, true);
      }
      if (tl > IDLE && !T.idle) {
        T.idle = true;
        keepHips(() => playClip('idle', 0.5));
      }
      if (u1 >= 1 && u2 >= 1 && T.idle) landed();
    }
  };
  // ---- the fall through the dark (Puli's choreography, 2026-10-28) ----
  // drop:  the camera holds still in the landing view's direction; he falls at his section 5 size towards the bottom of
  //        the screen
  // tilt:  just before he leaves it, the camera stays put but turns to look down at him; he falls away and shrinks
  // rush:  once he is about his forest size, the camera dives after him, levelling out on the way, into the landing view
  // final: it stops there; he falls the last stretch into the frame and onto the floor
  // Dust specks in the dark show the motion; a faint floor glow and shadow grow under him as he nears it.
  const RUSH = 0.9, FINAL = 0.55, TILT_AY = -0.6;
  const _q = new THREE.Quaternion();
  const _q2 = new THREE.Quaternion();
  const _f = new THREE.Vector3();
  const _r = new THREE.Vector3();
  const _u = new THREE.Vector3();
  const _o = new THREE.Vector3();
  const _m4 = new THREE.Matrix4();
  const FWD = new THREE.Vector3(0, 0, -1);
  const UPV = new THREE.Vector3(0, 1, 0);
  const landView = rect => {
    const asp = rect.width / Math.max(1, rect.height);
    const land = forest ? forest.camFor(asp) : { fov: 54, target: new THREE.Vector3(0, 1.45, -0.6), pos: new THREE.Vector3(0, 1.2, 7) };
    fcam.fov = land.fov;
    fcam.aspect = asp;
    fcam.position.copy(land.pos);
    fcam.lookAt(land.target);
    fcam.updateProjectionMatrix();
    fcam.updateMatrixWorld(true);
    return { land, asp, ty: Math.tan(land.fov / 2 * Math.PI / 180), q: fcam.quaternion.clone() };
  };
  // the camera turned so that the hips sit at screen spot (ax, ay) (-1..1), seen from `pos`
  const aimAt = (pos, hp, ax, ay, ty, asp, out) => {
    _m4.lookAt(pos, hp, UPV);
    out.setFromRotationMatrix(_m4);
    _o.set(ax * ty * asp, ay * ty, -1).normalize();
    return out.multiply(_q2.setFromUnitVectors(_o, FWD));
  };
  const fallStep = (dt, rect) => {
    const T = FS;
    const L = landView(rect);
    const { land, asp, ty } = L;
    const H = rect.height;
    if (T.phase === 'void') {
      // the forest is still loading: he falls on with the camera, at his size and spot
      puli.position.y -= FALL_V * dt;
      const hp = hipsWorld();
      _f.set(0, 0, -1).applyQuaternion(L.q);
      _r.set(1, 0, 0).applyQuaternion(L.q);
      _u.set(0, 1, 0).applyQuaternion(L.q);
      const d0 = H / (2 * ty * T.px), ax = (T.sx / rect.width) * 2 - 1, ay = 1 - (T.sy / H) * 2;
      fcam.position.copy(hp).addScaledVector(_f, -d0).addScaledVector(_r, -ax * d0 * ty * asp).addScaledVector(_u, -ay * d0 * ty);
      fcam.updateMatrixWorld(true);
      if (forest && T.t > 0.25) {
        // ready: work out the whole fall so it ends on the landing view just as he reaches the floor
        showWorld(true);
        forest.setWaves({ seq: true, w1: 0, w2: 0, k: 0 });
        const off = hp.y - puli.position.y;              // his hips above his feet in the falling pose
        T.landH = forest.LAND.y + off;
        const rel = new THREE.Vector3(forest.LAND.x, T.landH, forest.LAND.z).sub(land.pos);
        const z1 = rel.dot(_f);                          // how far the hips will be from the landing view
        const px1 = H / (2 * ty * z1);                   // his size there, in px
        T.d0 = d0;
        T.dRush = d0 * Math.max(1.3, T.px / px1);        // the camera rushes once he is this far away
        const hTilt = Math.sqrt(T.dRush * T.dRush - d0 * d0);
        const hDrop = Math.max(0.3, ((1 - TILT_AY) / 2 * H - T.sy) / T.px);
        const top = T.landH + hDrop + hTilt + FALL_V * (RUSH + FINAL);
        puli.position.set(forest.LAND.x, top - off, forest.LAND.z);
        const hp2 = hipsWorld();
        T.C0 = hp2.clone().addScaledVector(_f, -d0).addScaledVector(_r, -ax * d0 * ty * asp).addScaledVector(_u, -ay * d0 * ty);
        T.ax = ax;
        T.v = FALL_V;
        forest.setFall({ on: true, top: top + 3 });
        T.phase = 'drop';
      }
      return;
    }
    puli.position.y -= T.v * dt;
    const hp = hipsWorld();
    forest.setFall({ on: true, x: hp.x, z: hp.z, h: hp.y - T.landH });
    if (T.phase === 'drop') {
      fcam.position.copy(T.C0);
      fcam.quaternion.copy(L.q);
      fcam.updateMatrixWorld(true);
      _o.copy(hp).project(fcam);
      if (_o.y <= TILT_AY) {
        T.phase = 'tilt';
        T.tt = 0;
        T.ax = clamp(_o.x, -0.8, 0.8);
      }
    } else if (T.phase === 'tilt') {
      T.tt += dt;
      const k = smooth(clamp(T.tt / 0.7, 0, 1));
      T.axNow = T.ax * (1 - k);
      T.ayNow = TILT_AY + (-0.3 - TILT_AY) * k;
      fcam.position.copy(T.C0);
      aimAt(T.C0, hp, T.axNow, T.ayNow, ty, asp, fcam.quaternion);
      if (hp.distanceTo(T.C0) >= T.dRush) {
        T.phase = 'rush';
        T.tr = 0;
        // fall at whatever speed brings him into the landing view on time
        T.v = clamp((hp.y - T.landH - FALL_V * FINAL) / RUSH, 3, 14);
      }
    } else if (T.phase === 'rush') {
      T.tr += dt;
      const u = clamp(T.tr / RUSH, 0, 1), e = smooth(u);
      fcam.position.copy(T.C0).lerp(land.pos, e);
      aimAt(fcam.position, hp, T.axNow * (1 - e), T.ayNow * (1 - e), ty, asp, _q);
      fcam.quaternion.copy(_q).slerp(L.q, smooth(clamp(u * 1.15, 0, 1)));
      if (u >= 1) {
        T.phase = 'final';
        T.v = FALL_V;
      }
    } else {
      fcam.position.copy(land.pos);
      fcam.quaternion.copy(L.q);
    }
    fcam.updateMatrixWorld(true);
    if (hp.y <= T.landH) {
      // touchdown
      puli.position.y = forest.LAND.y;
      playClip('fall', 0.06, true);
      forest.setFall({ on: true, x: hp.x, z: hp.z, h: 0, impact: true });
      T.phase = 'land';
      T.tl = 0;
    }
  };
  const renderForestView = dt => {
    const c = canvas.getBoundingClientRect();
    const rect = forestRect();
    if (FS.phase === 'run') runCamera(rect, dt);
    else if (FS.phase === 'land' || FS.phase === 'done' || FS.phase === 'wait-skip') landView(rect);
    else fallStep(dt, rect);
    R.setScissorTest(false);
    R.setViewport(0, 0, c.width, c.height);
    R.clear();
    const x = rect.left - c.left, y = c.bottom - rect.bottom;
    R.setViewport(x, y, rect.width, rect.height);
    R.setScissor(x, y, rect.width, rect.height);
    R.setScissorTest(true);
    R.render(scene, fcam);
    R.setScissorTest(false);
    R.setViewport(0, 0, c.width, c.height);
  };

  // ---- the loop: runs while the section is on screen, or while he is in the middle of the sequence ----
  let raf = 0;
  let visible = false;
  let last = 0;
  // ?puli-debug: a small readout of the phases with their times, to see where a pause happens on a phone
  let dbgEl = null, dbgLast = '', dbgLog = [], dbgT0 = 0;
  const debugLine = (now, gap) => {
    if (!dbgEl) {
      dbgEl = document.createElement('pre');
      dbgEl.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99;margin:0;padding:6px 8px;background:rgba(0,0,0,.7);color:#7f7;font:11px/1.35 monospace;pointer-events:none;border-radius:6px';
      document.body.append(dbgEl);
    }
    const ph = (FS ? 'forest:' + FS.phase : S.phase) + (forest ? '' : ' (forest loading)');
    if (ph !== dbgLast) {
      if (!dbgT0) dbgT0 = now;
      dbgLog.push(((now - dbgT0) / 1000).toFixed(2) + 's ' + ph);
      dbgLog = dbgLog.slice(-10);
      dbgLast = ph;
    }
    if (gap > 250) {
      dbgLog.push('  ! ' + Math.round(gap) + ' ms without a frame (' + ph + ')');
      dbgLog = dbgLog.slice(-10);
    }
    dbgEl.textContent = dbgLog.join('\n');
  };
  const frame = now => {
    raf = 0;
    const gap = last ? now - last : 0;
    const dt = DEBUG && window.__stageDt !== undefined ? window.__stageDt : last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    if (DEBUG) debugLine(now, gap);
    if (FS) {
      // in the forest; once only section 5 is on screen again (and he has landed), he starts over there
      if (visible && !forestVis && (FS.phase === 'done' || FS.phase === 'run')) leaveForest();
      else {
        measure();
        forestStep(dt);
        mixer.update(dt);
        if (forest) forest.update(now / 1000);
        renderForestView(dt);
        if (forestVis || (FS.phase !== 'done' && FS.phase !== 'run')) raf = requestAnimationFrame(frame);
        else last = 0;
        return;
      }
    }
    measure();
    if (puli) {
      let mdt = dt;
      if (S.phase === 'enter') mdt = enter(dt);
      else step(dt);
      mixer.update(mdt);
      if (FS) {
        // he has just dropped into the forest (step() started it)
        kick();
        return;
      }
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
    if (!v && !S.busy && puli && !FS) resetEntrance();
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
    window.__puliStage = { V, get fcam() { return fcam; }, get S() { return S; }, get puli() { return puli; }, get FS() { return FS; }, get forest() { return forest; }, startForest, get cur() { return cur; }, hipsWorld: () => hipsWorld(), toScreen,
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
          out.push([+a.time.toFixed(3), +hips.getWorldPosition(_a).y.toFixed(3), +lf.getWorldPosition(_a).y.toFixed(3), +rf.getWorldPosition(_a).y.toFixed(3)]);
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
      if (!FS) setTheme(t);
      forest?.setTheme(t);
      if (FS && forest && FS.phase !== 'void' && FS.phase !== 'wait-skip') R.toneMappingExposure = forest.exposure;
      kick();
    },
    setForestVisible: v => {
      forestVis = v;
      kick();
    },
    // the forest: load it early (when Play comes to rest), or show it with him already standing there (reduced motion)
    preloadForest: () => loadForest(),
    // the run's controls (the forest section passes taps, swipes and keys on): press = tap / Space down, release = let
    // go (a held jump goes higher), slide = swipe down / arrow down
    gamePress: () => {
      if (!FS) return;
      if (FS.phase === 'done') startRun();
      else if (FS.phase === 'run' && forest?.game) {
        forest.game.input.jump = true;
        forest.game.input.held = true;
      }
    },
    gameRelease: () => {
      if (forest?.game) forest.game.input.held = false;
    },
    gameSlide: () => {
      if (FS?.phase === 'run' && forest?.game) forest.game.input.slide = true;
    },
    gameInfo: () => gameInfo(),
    showForest: () => {
      startForest(true);
      kick();
    },
    get inForest() {
      return !!FS;
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
