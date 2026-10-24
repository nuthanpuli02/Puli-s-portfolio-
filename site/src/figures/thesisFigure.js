// Fig: Puli's thesis as a machine (built with the Anatomy kit, github.com/wheresryan22/anatomy, MIT).
// A three-station indexing table: a cartridge (the model) rides the turntable from the TRAIN press, to the TEST gauge
// (its needle reads the score against a target mark), to the DISCUSS console (three knobs: the next settings the agents
// agree on), and round again until the needle passes the mark and the stop lamp lights. The needle shows how the loop
// works, not results (the thesis is not evaluated yet). thesisFigure() returns the SVG and start(stage, onState),
// which animates it while it is on screen and returns a stop function.
import * as k from '../components/anatomy/iso-kit.mjs';

export function thesisFigure() {
  const WIDTH = 600, HEIGHT = 400;
  const DEG = Math.PI / 180;
  const dir = (a) => [Math.cos(a * DEG), Math.sin(a * DEG)];
  const along = (a, r) => { const [c, s] = dir(a); return [c * r, s * r]; };

  // ---- world ----
  const PLATE = { x: -140, y: -132, w: 280, d: 264, r: 10 };
  const PLATE_H = 12, FOOT_H = 5;
  const TABLE_R = 90, TABLE_Z = 5, TABLE_TOP = 14;
  const SEAT_R = 56;
  const PUCK_R = 15, PUCK_H = 9, PUCK_TOP = TABLE_TOP + PUCK_H;
  const A_TRAIN = 160, A_TEST = 280, A_TALK = 40;
  const SCORES = [0.42, 0.58, 0.71, 0.84];
  const TARGET = 0.8;

  const P = k.fitProjection(
    [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [...along(A_TRAIN, 124), 104], [...along(A_TRAIN, SEAT_R), 104], [...along(A_TEST, SEAT_R), 70]],
    WIDTH, HEIGHT, { pad: 8, azimuth: 40 },
  );
  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const D = (pts, style) => k.dotsSvg(pts, style);
  const depth = (x, y, z = 0) => k.depthOf([x, y, z], P);
  const byDepth = (pts) => [...pts].sort((a, b) => depth(a[0], a[1]) - depth(b[0], b[1]));
  // a rectangle turned to angle a (deg), centred at c, length along a, width across
  const rotRect = (c, a, len, wid) => {
    const [ux, uy] = dir(a), vx = -uy, vy = ux;
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => [c[0] + ux * len / 2 * i + vx * wid / 2 * j, c[1] + uy * len / 2 * i + vy * wid / 2 * j]);
  };
  const box = (c, a, len, wid, z, h, bevel = 0.5) => k.extrude(rotRect(c, a, len, wid), z, h, P, { bevel });

  // ---- base ----
  function base() {
    const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
    for (const [x, y] of byDepth(k.corners(PLATE, 24))) {
      out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
      out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
    }
    out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
    out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
    const screws = k.corners(PLATE, 11);
    out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
    out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
    // ruler strip along the near edge, with its ticks
    const strip = { x: -40, y: PLATE.y + PLATE.d - 16, w: 160, d: 7, r: 1 };
    out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
    const t = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
    out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
    out.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
    // label plate on the near right corner
    const label = { x: -124, y: PLATE.y + PLATE.d - 50, w: 56, d: 22, r: 2 };
    out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
    out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P), { tone: "faint" }));
    [[label.x + 6, label.x + 40], [label.x + 6, label.x + 32], [label.x + 6, label.x + 46]].forEach(([a, b], i) =>
      out.push(L(k.lineOnTop([a, label.y + 6 + i * 4.6], [b, label.y + 6 + i * 4.6], 0.8, P), { tone: "lo", free: true })));
    out.push(D([at([label.x + 3, label.y + 3, 0.8]), at([label.x + label.w - 3, label.y + label.d - 3, 0.8])], { size: 0.45 }));
    return out.join("");
  }

  // ---- train press: the column behind the table (drawn first) and the arm + ram over the seat (drawn later) ----
  const T_BASE = along(A_TRAIN, 122), T_SEAT = along(A_TRAIN, SEAT_R);
  const RAM_UP = 46, RAM_TRAVEL = RAM_UP - PUCK_TOP - 0.5; // the pad comes down onto the cartridge
  function trainColumn() {
    const [x, y] = T_BASE, out = [];
    out.push(S(box(T_BASE, A_TRAIN, 34, 34, 0, 10, 0.8), { tone: "mid" }));
    out.push(D(byDepth(rotRect(T_BASE, A_TRAIN, 26, 26)).map(([px, py]) => at([px, py, 10])), { size: 0.45 }));
    out.push(S(k.cylinder(x, y, 9, 10, 4, P, 32), { tone: "mid" }));
    out.push(S(k.cylinder(x, y, 7.5, 14, 74, P, 32), { tone: "mid", crease: "none" }));
    out.push(L([34, 60].map((z) => k.sideArc(x, y, 7.5, z, P, 20)).join(""), { tone: "faint" }));
    out.push(S(k.cylinder(x, y, 11.5, 86, 16, P, 36, 0.6), { tone: "mid" }));
    out.push(L(k.ring(x, y, 7, 102, P, 24), { tone: "lo" }));
    out.push(D([at([x, y, 102])], { size: 0.5 }));
    return out.join("");
  }
  function trainArm() {
    const out = [];
    const mid = [(T_BASE[0] + T_SEAT[0]) / 2, (T_BASE[1] + T_SEAT[1]) / 2];
    const len = Math.hypot(T_BASE[0] - T_SEAT[0], T_BASE[1] - T_SEAT[1]);
    out.push(S(box(mid, A_TRAIN, len, 11, 90, 8, 0.5), { tone: "mid" }));
    out.push(D([0.3, 0.7].map((f) => at([T_BASE[0] + (T_SEAT[0] - T_BASE[0]) * f, T_BASE[1] + (T_SEAT[1] - T_BASE[1]) * f, 98])), { size: 0.45 }));
    return out.join("");
  }
  function trainRam() {
    const [x, y] = T_SEAT;
    return S(k.cylinder(x, y, 4, RAM_UP + 3.5, 94 - RAM_UP - 3.5, P, 24), { tone: "hi", crease: "none", lit: true })
      + S(k.cylinder(x, y, 10, RAM_UP, 3.5, P, 36, 0.4), { tone: "hi", lit: true });
  }
  function trainHead() {
    const [x, y] = T_SEAT, out = [];
    out.push(S(k.cylinder(x, y, 11, 70, 28, P, 36, 0.6), { tone: "mid" }));
    out.push(L(k.sideArc(x, y, 11, 78, P, 24), { tone: "faint" }));
    out.push(L(k.ring(x, y, 7, 98, P, 24), { tone: "lo" }));
    // lock screw on the side facing the viewer
    const [vx, vy] = k.towardViewer(P);
    out.push(S(k.cylinder(x + vx * 11.6, y + vy * 11.6, 2, 84, 5, P, 16), { tone: "mid" }));
    return out.join("");
  }

  // ---- test gauge: post in front, dial over the seat, plunger down to the cartridge ----
  const G_POST = along(A_TEST, 124), G_SEAT = along(A_TEST, SEAT_R);
  const DIAL_R = 24, DIAL_Z = 52, DIAL_H = 10, DIAL_TOP = DIAL_Z + DIAL_H;
  const TIP_UP = PUCK_TOP + 10;
  const turnOf = (score) => 0.08 + score * 0.8; // share of a turn
  function testPost() {
    const [x, y] = G_POST, out = [];
    out.push(S(box(G_POST, A_TEST, 26, 24, 0, 8, 0.6), { tone: "mid" }));
    out.push(S(k.cylinder(x, y, 7, 8, 3, P, 28), { tone: "mid" }));
    out.push(S(k.cylinder(x, y, 4.2, 11, DIAL_Z + 6 - 11, P, 28), { tone: "mid", crease: "none" }));
    out.push(L([30, 52].map((z) => k.sideArc(x, y, 4.2, z, P, 16)).join(""), { tone: "faint" }));
    out.push(S(box(G_POST, A_TEST, 14, 14, DIAL_Z - 2, 10, 0.5), { tone: "mid" }));
    const mid = [(G_POST[0] + G_SEAT[0]) / 2, (G_POST[1] + G_SEAT[1]) / 2];
    const len = Math.hypot(G_POST[0] - G_SEAT[0], G_POST[1] - G_SEAT[1]) - DIAL_R + 2;
    const armC = along(A_TEST, SEAT_R + DIAL_R - 2 + len / 2);
    out.push(S(box(armC, A_TEST, len, 6, DIAL_Z + 1, 4, 0.4), { tone: "mid" }));
    return out.join("");
  }
  function testPlunger() {
    const [x, y] = G_SEAT;
    return S(k.cylinder(x, y, 2.4, TIP_UP, 2.2, P, 20), { tone: "hi", lit: true })
      + S(k.cylinder(x, y, 1.3, TIP_UP + 2.2, 16, P, 16), { tone: "hi", crease: "none", lit: true });
  }
  function testDial() {
    const [x, y] = G_SEAT, out = [];
    out.push(S(k.cylinder(x, y, 3.2, DIAL_Z - 12, 12, P, 20), { tone: "mid" }));
    out.push(L(k.sideArc(x, y, 3.2, DIAL_Z - 6, P, 12), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, DIAL_R, DIAL_Z, DIAL_H, P, 64, 0.8), { tone: "hi", crease: "lo" }));
    out.push(L(k.knurl(x, y, DIAL_R, DIAL_TOP - 3.4, DIAL_TOP, 84, P, 0.3), { tone: "lo" }));
    out.push(L(k.sideArc(x, y, DIAL_R, DIAL_TOP - 3.4, P, 40), { tone: "faint" }));
    out.push(L(k.ring(x, y, DIAL_R - 2.2, DIAL_TOP, P, 64), { tone: "lo" }));
    const t = k.radialTicks(x, y, DIAL_R - 3, 50, 5, DIAL_TOP, [1.3, 2.8], P);
    out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
    // the target: a heavier mark at the passing score
    const ta = turnOf(TARGET) * Math.PI * 2;
    const r0 = DIAL_R - 3, r1 = DIAL_R - 8;
    out.push(L(k.lineOnTop([x + Math.sin(ta) * r1, y - Math.cos(ta) * r1], [x + Math.sin(ta) * r0, y - Math.cos(ta) * r0], DIAL_TOP, P), { tone: "hi", free: "start" }));
    out.push(L(k.ring(x, y, 1.6, DIAL_TOP, P, 16), { tone: "mid" }));
    return out.join("");
  }
  const needleAt = (turn) => {
    const a = turn * Math.PI * 2, [x, y] = G_SEAT;
    return k.lineOnTop([x - Math.sin(a) * 3.4, y + Math.cos(a) * 3.4], [x + Math.sin(a) * (DIAL_R - 4.5), y - Math.cos(a) * (DIAL_R - 4.5)], DIAL_TOP + 0.2, P);
  };

  // ---- discuss console: three knobs = the next run's settings ----
  const C_POS = along(A_TALK, 112);
  const KNOB_R = 6, CON_H = 18;
  const KNOBS = [-18, 0, 18].map((o) => { const [tx, ty] = dir(A_TALK + 90); return [C_POS[0] + tx * o, C_POS[1] + ty * o]; });
  function consoleBody() {
    const out = [];
    out.push(S(box(C_POS, A_TALK, 30, 62, 0, CON_H, 0.8), { tone: "mid" }));
    out.push(L(k.onTop(rotRect(C_POS, A_TALK, 24, 56), CON_H, P, true), { tone: "faint" }));
    for (const [x, y] of byDepth(KNOBS)) {
      out.push(S(k.cylinder(x, y, KNOB_R, CON_H, 4, P, 28), { tone: "mid" }));
      out.push(L(k.knurl(x, y, KNOB_R, CON_H, CON_H + 4, 30, P), { tone: "lo" }));
    }
    const [ux, uy] = dir(A_TALK);
    out.push(D(KNOBS.map(([x, y]) => at([x - ux * 8, y - uy * 8, CON_H])), { size: 0.7, tone: "lo" }));
    return out.join("");
  }
  const pointerAt = ([x, y], turn) => {
    const a = turn * Math.PI * 2;
    return k.lineOnTop([x, y], [x + Math.sin(a) * (KNOB_R - 1), y - Math.cos(a) * (KNOB_R - 1)], CON_H + 4, P);
  };

  // ---- stop lamp beside the gauge ----
  const LAMP = along(332, 124);
  function lampPost() {
    const [x, y] = LAMP, out = [];
    out.push(S(k.cylinder(x, y, 6, 0, 3, P, 24), { tone: "mid" }));
    out.push(S(k.cylinder(x, y, 2.2, 3, 30, P, 16), { tone: "mid", crease: "none" }));
    out.push(S(k.cylinder(x, y, 4.6, 33, 3, P, 24), { tone: "mid" }));
    return out.join("");
  }
  const lampCap = (lit) => { const [x, y] = LAMP; return S(k.cylinder(x, y, 4, 36, 7, P, 24, 0.4), { tone: lit ? "hi" : "mid", lit }); };

  // ---- table and cartridge ----
  function tableBody() {
    const out = [`<path class="iso-halo" d="${k.haloOf({ x: -TABLE_R, y: -TABLE_R, w: TABLE_R * 2, d: TABLE_R * 2, r: TABLE_R }, 0, TABLE_TOP, P)}" style="filter:blur(4px)"/>`];
    out.push(S(k.cylinder(0, 0, 70, 0, TABLE_Z, P, 72), { tone: "lo" }));
    out.push(S(k.cylinder(0, 0, TABLE_R, TABLE_Z, TABLE_TOP - TABLE_Z, P, 96, 1), { tone: "mid" }));
    out.push(L(k.sideArc(0, 0, TABLE_R, TABLE_Z + 3, P, 64), { tone: "faint" }));
    out.push(L(k.ring(0, 0, 18, TABLE_TOP, P, 40), { tone: "lo" }));
    out.push(S(k.cylinder(0, 0, 10, TABLE_TOP, 4, P, 32, 0.4), { tone: "mid" }));
    out.push(D([0, 1, 2, 3, 4, 5].map((i) => at([Math.cos(i * Math.PI / 3) * 14, Math.sin(i * Math.PI / 3) * 14, TABLE_TOP])), { size: 0.45 }));
    return out.join("");
  }
  const SEATS = [A_TRAIN, A_TEST, A_TALK];
  function tableMarks(rot) {
    const t = k.radialTicks(0, 0, TABLE_R - 1.5, 72, 6, TABLE_TOP, [1.4, 3], P, -rot * DEG);
    const seats = SEATS.map((a) => { const [x, y] = along(a + rot, SEAT_R); return k.ring(x, y, PUCK_R + 2.4, TABLE_TOP, P, 40); }).join("");
    return L(t.minor, { tone: "lo" }) + L(t.major, { tone: "mid" }) + L(seats, { tone: "lo" });
  }
  function cartridge() {
    const out = [];
    out.push(S(k.cylinder(0, 0, PUCK_R, TABLE_TOP, PUCK_H, P, 48, 0.6), { tone: "hi", crease: "lo" }));
    out.push(L(k.sideArc(0, 0, PUCK_R, TABLE_TOP + 2.5, P, 32), { tone: "faint" }));
    out.push(L(k.ring(0, 0, PUCK_R - 3, PUCK_TOP, P, 40), { tone: "lo" }));
    out.push(L(k.ring(0, 0, 3, PUCK_TOP, P, 20), { tone: "mid" }));
    out.push(D([0, 1, 2, 3, 4, 5].map((i) => { const a = i * Math.PI / 3; return at([Math.cos(a) * 7.5, Math.sin(a) * 7.5, PUCK_TOP]); }), { size: 0.45 }));
    return out.join("");
  }

  // ---- assemble ----
  const seatAt = (a) => along(a, SEAT_R);
  const g = (part, body, extra = "") => `<g data-part="${part}"${extra}>${body}</g>`;
  const svg = k.figureSvg({
    width: WIDTH, height: HEIGHT,
    label: "An indexing table with three stations. A cartridge standing for the model rides the turntable from a press marked train, to a dial gauge marked test whose needle reads the score against a target mark, to a console of three knobs marked discuss, where the next settings are chosen, and round again until the gauge passes the target and a stop lamp lights.",
    body: [
      base(),
      trainColumn(),
      tableBody(),
      g("marks", tableMarks(0)),
      `<g data-part="sorted">`,
      g("cart", cartridge(), ` data-depth="0" transform="${k.translateAlong(P, [...seatAt(A_TRAIN), 0])}"`),
      g("ram", trainRam(), ` data-depth="${depth(...T_SEAT) + 0.5}"`),
      g("trainhead", trainArm() + trainHead(), ` data-depth="${depth(...T_SEAT) + 1}"`),
      g("lamp", lampPost() + `<g data-part="lampoff">${lampCap(false)}</g><g data-part="lampon" style="opacity:0">${lampCap(true)}</g>`, ` data-depth="${depth(...LAMP)}"`),
      g("plunger", testPlunger(), ` data-depth="${depth(...G_SEAT) + 0.5}"`),
      g("gauge", testPost() + testDial() + `<path data-part="needle" class="iso-line" data-tone="lit" data-free="start" d="${needleAt(turnOf(0))}" style="stroke-width:1.1"/>`, ` data-depth="${depth(...G_SEAT) + 1}"`),
      g("console", consoleBody() + KNOBS.map((p, i) => `<path data-knob="${i}" class="iso-line" data-tone="hi" d="${pointerAt(p, 0.1)}"/>`).join(""), ` data-depth="${depth(...C_POS)}"`),
      `</g>`,
    ],
  });


  const D2R = Math.PI / 180;
  const ease = (t) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));
  const bump = (t) => Math.sin(Math.PI * Math.min(1, Math.max(0, t)));
  // one lap: train 1.6 s, index 1.1 s, test 1.9 s, index 1.1 s, discuss 1.6 s, index 1.1 s
  const STEPS = [['train', 1.6], ['index', 1.1], ['test', 1.9], ['index', 1.1], ['discuss', 1.6], ['index', 1.1]];
  const LAP = STEPS.reduce((n, x) => n + x[1], 0);
  const ROUNDS = SCORES.length;
  const LAST = 1.6 + 1.1 + 1.9, HOLD = 3.2, BACK = 2.2;
  const CYCLE = LAP * (ROUNDS - 1) + LAST + HOLD + BACK;
  const KNOB_SETS = [[0.12, 0.35, 0.6], [0.3, 0.2, 0.72], [0.22, 0.48, 0.55], [0.4, 0.3, 0.66]];
  function stateAt(t) {
    t = ((t % CYCLE) + CYCLE) % CYCLE;
    const st = { rot: 0, ram: 0, tip: 0, needle: turnOf(0), lamp: 0, knobs: KNOB_SETS[0], round: 1, phase: 'train' };
    let score = 0, knob = KNOB_SETS[0];
    for (let r = 0; r < ROUNDS; r++) {
      const last = r === ROUNDS - 1;
      let u = t - r * LAP;
      if (u < 0) break;
      st.round = r + 1;
      const steps = last ? STEPS.slice(0, 3) : STEPS;
      for (let i = 0; i < steps.length; i++) {
        const [name, len] = steps[i];
        const base = 120 * Math.floor((i + 1) / 2) + r * 360;
        if (u < len) {
          st.phase = name;
          if (name === 'train') { st.rot = base; st.ram = bump(u / len); }
          if (name === 'index') st.rot = base - 120 + 120 * ease(u / len);
          if (name === 'test') { st.rot = base; st.tip = bump(u / len); score += (SCORES[r] - score) * ease((u / len - 0.25) / 0.5); }
          if (name === 'discuss') { st.rot = base; const next = KNOB_SETS[(r + 1) % KNOB_SETS.length]; knob = knob.map((v, j) => v + (next[j] - v) * ease((u / len - 0.15 * j) / 0.6)); }
          st.needle = turnOf(score); st.knobs = knob;
          return st;
        }
        u -= len;
        if (name === 'test') score = SCORES[r];
        if (name === 'discuss') knob = KNOB_SETS[(r + 1) % KNOB_SETS.length];
        st.rot = base;
      }
      if (last) {
        if (u < HOLD) { Object.assign(st, { phase: 'done', rot: 120 + r * 360, needle: turnOf(score), lamp: 1, knobs: knob }); return st; }
        const f = ease((u - HOLD) / BACK);
        Object.assign(st, { phase: 'reset', rot: 120 + r * 360 + 240 * f, needle: turnOf(score * (1 - f)), lamp: 1 - f, knobs: knob.map((v, j) => v + (KNOB_SETS[0][j] - v) * f) });
        return st;
      }
    }
    return st;
  }
  const labelOf = (st) => (st.phase === 'done' ? `round ${st.round} · past the target · stop`
    : st.phase === 'reset' ? 'back to the start'
      : `round ${st.round} · ${st.phase === 'index' ? 'indexing' : st.phase}`);

  function start(stage, onState) {
    const svgEl = stage.querySelector('svg');
    const q = (name) => svgEl.querySelector(`[data-part="${name}"]`);
    const sorted = q('sorted'), cart = q('cart'), ram = q('ram'), plunger = q('plunger'), needle = q('needle'), marks = q('marks');
    const lampOn = q('lampon'), knobs = [...svgEl.querySelectorAll('[data-knob]')];
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let said = '';
    const draw = (st) => {
      const rot = st.rot % 360;
      const [cx, cy] = along(A_TRAIN + rot, SEAT_R);
      cart.setAttribute('transform', k.translateAlong(P, [cx, cy, 0]));
      cart.dataset.depth = String(k.depthOf([cx, cy, 0], P) - 0.5);
      ram.setAttribute('transform', k.translateAlong(P, [0, 0, -RAM_TRAVEL * st.ram]));
      plunger.setAttribute('transform', k.translateAlong(P, [0, 0, -(TIP_UP - PUCK_TOP) * st.tip]));
      needle.setAttribute('d', needleAt(st.needle));
      knobs.forEach((el, i) => el.setAttribute('d', pointerAt(KNOBS[i], st.knobs[i])));
      lampOn.style.opacity = st.lamp.toFixed(3);
      const t = k.radialTicks(0, 0, TABLE_R - 1.5, 72, 6, TABLE_TOP, [1.4, 3], P, -rot * D2R);
      const seats = SEATS.map((a) => { const [x, y] = along(a + rot, SEAT_R); return k.ring(x, y, PUCK_R + 2.4, TABLE_TOP, P, 40); }).join('');
      const ps = marks.querySelectorAll('path');
      if (ps.length === 3) { ps[0].setAttribute('d', t.minor); ps[1].setAttribute('d', t.major); ps[2].setAttribute('d', seats); }
      // keep the moving cartridge in true depth order with the stations
      const kids = [...sorted.children];
      const order = [...kids].sort((a, b) => Number(a.dataset.depth) - Number(b.dataset.depth));
      if (order.some((el, i) => el !== kids[i])) order.forEach((el) => sorted.appendChild(el));
      const text = labelOf(st);
      if (text !== said) { said = text; onState?.(text); }
    };
    let frame = 0, last = 0, clock = 0.01, visible = false, alive = true;
    const tick = (now) => {
      frame = 0;
      const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
      last = now; clock += dt;
      draw(stateAt(clock));
      if (visible && alive) frame = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((e) => {
      visible = e[e.length - 1].isIntersecting;
      if (visible && !still && !frame && alive) { last = 0; frame = requestAnimationFrame(tick); }
    }, { rootMargin: '80px 0px' });
    if (still) draw(stateAt(LAP * (ROUNDS - 1) + LAST + 0.5));
    else { draw(stateAt(clock)); io.observe(stage); }
    return () => { alive = false; io.disconnect(); cancelAnimationFrame(frame); };
  }
  return { svg, start, width: WIDTH, height: HEIGHT };
}
