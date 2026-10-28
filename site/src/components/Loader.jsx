import { useCallback, useEffect, useRef, useState } from 'react';
import CrystalizedBall from './reactbits/CrystalizedBall.jsx';
import CountUp from './reactbits/CountUp.jsx';
import { holdScroll } from '../scrollHold.js';

// The loading screen (demo: only with ?loader in the address). A glass ball in the middle (React Bits Crystalized Ball:
// glowing dust that follows the finger, its electric rim turned off; the glass itself, its edge, highlights and the
// light it gathers at the bottom, is drawn in CSS on top), the real loading progress counting up bottom right (React
// Bits Count Up). The site is already there underneath, its first screen (the hero) running.
// When everything has loaded, the ball pops (a short bounce outwards) and glows brighter, its dust settles and the glass
// clears: the hero shows inside it. Scrolling, or a tap on the ball, then dives in (the Scroll Expand idea): the round
// window grows from the ball until it covers the screen while the hero zooms from 1.35x to its normal size, the glass
// stretches and fades. Then the loading screen removes itself and the page scrolls normally from the top.
// What it waits for: the fonts and every image and model the site uses (the forest's textures excepted: they are far
// down the page and load in the background afterwards).
const FILES = import.meta.glob(['../assets/**/*.{webp,png,jpg,jpeg,glb}', '!../assets/forest/**'], { eager: true, query: '?url', import: 'default' });
const LATER = import.meta.glob('../assets/forest/*.webp', { eager: true, query: '?url', import: 'default' });
const MIN_TIME = 2400;     // ms: at least the ball's own intro
const ZOOM = 1.35;         // the hero's zoom while it shows inside the ball
const OPEN_MS = 900;       // the glass clearing
const TAP_MS = 1300;       // a tap dives in over this long
const DIVE = 1.1;          // screens of scrolling for the whole dive
// ?loader=slow pretends the connection is slow (about 10 s), to try the ball for longer
const SLOW = typeof location !== 'undefined' && /[?&]loader=slow/.test(location.search) ? 10000 : 0;

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// fetch a file, reporting how many bytes have come in (into the browser's cache, so the site's own loading is instant)
async function fetchWithProgress(url, onBytes) {
  try {
    const res = await fetch(url);
    const total = +res.headers.get('content-length') || 0;
    if (!res.body || !res.body.getReader) {
      await res.blob();
      onBytes(1, 1);
      return;
    }
    const reader = res.body.getReader();
    let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      got += value.length;
      onBytes(got, total);
    }
    onBytes(1, 1);
  } catch (e) {
    onBytes(1, 1);
  }
}

export default function Loader({ theme, onDone }) {
  const rootRef = useRef(null);
  const [pct, setPct] = useState(0);
  const [ready, setReady] = useState(false);
  const [clear, setClear] = useState(0);
  const [gone, setGone] = useState(false);
  const phone = Math.min(window.innerWidth, window.innerHeight) < 700;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const dive = useRef({ p: 0, target: 0, raf: 0, tap: null, done: false });
  const radius = useRef(150);   // the ball's radius in px (its size follows the screen)

  // ---- hold the page at the top, zoom the hero in, load ----
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    holdScroll(true);
    const t0 = performance.now();
    const urls = Object.values(FILES);
    const parts = urls.map(() => ({ got: 0, total: 0, done: false }));
    let fonts = false;
    let shown = 0;
    let dead = false;
    const report = () => {
      // each file counts by its size once known (unknown: ~200 kB); the fonts count as one more small file
      let sum = 0, got = 0;
      for (const p of parts) {
        const size = p.total || 200000;
        sum += size;
        got += p.done ? size : Math.min(p.got, size);
      }
      sum += 100000;
      got += fonts ? 100000 : 0;
      let v = Math.floor((got / sum) * 100);
      if (SLOW) v = Math.min(v, Math.floor(((performance.now() - t0) / SLOW) * 100));
      if (v > shown) {
        shown = v;
        setPct(v);
      }
    };
    const timer = setInterval(report, 150);
    const jobs = urls.map((u, i) => fetchWithProgress(u, (g, t) => {
      if (g === 1 && t === 1) parts[i].done = true;
      else {
        parts[i].got = g;
        parts[i].total = t;
      }
    }));
    jobs.push((document.fonts?.ready || Promise.resolve()).then(() => { fonts = true; }));
    Promise.all(jobs).then(async () => {
      report();
      // give the hero a couple of frames with everything in place, and the ball its intro
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const wait = Math.max(MIN_TIME, SLOW) - (performance.now() - t0);
      if (wait > 0) await new Promise(r => setTimeout(r, wait));
      if (dead) return;
      clearInterval(timer);
      setPct(100);
      setReady(true);
      // the forest's textures quietly, afterwards
      for (const u of Object.values(LATER)) fetch(u).catch(() => {});
    });
    return () => {
      dead = true;
      clearInterval(timer);
    };
  }, []);

  // the ball's size: as big as the screen comfortably allows
  useEffect(() => {
    const root = rootRef.current;
    const size = () => {
      const D = Math.min(window.innerWidth * 0.84, window.innerHeight * 0.5, 440);
      radius.current = D / 2;
      root.style.setProperty('--d', `${D.toFixed(1)}px`);
      apply(dive.current.p);
    };
    size();
    window.addEventListener('resize', size);
    return () => window.removeEventListener('resize', size);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // the hero, zoomed in, centred on the ball
  const hero = () => document.getElementById('top');
  const place = useCallback(e => {
    const h = hero();
    if (!h) return;
    const z = ZOOM + (1 - ZOOM) * e;
    h.style.transformOrigin = `50% ${window.innerHeight / 2}px`;
    h.style.transform = e >= 1 ? '' : `scale(${z.toFixed(4)})`;
  }, []);
  useEffect(() => {
    place(0);
    return () => {
      const h = hero();
      if (h) h.style.transform = '';
    };
  }, [place]);

  // ---- ready: the glass clears ----
  useEffect(() => {
    if (!ready) return undefined;
    const t0 = performance.now();
    let raf = 0;
    const tick = now => {
      const u = reduce ? 1 : Math.min(1, (now - t0) / OPEN_MS);
      setClear(smooth(0, 1, u));
      if (u < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready, reduce]);

  // ---- the dive: scroll or swipe drives it, a tap plays it ----
  const apply = useCallback(p => {
    const root = rootRef.current;
    if (!root) return;
    const e = smooth(0, 1, p);
    const W = window.innerWidth, H = window.innerHeight;
    const R0 = radius.current;
    const far = Math.hypot(W, H) / 2 + 4;
    const r = R0 + (far - R0) * e;
    root.style.setProperty('--grow', (r / R0).toFixed(4));
    root.style.setProperty('--dive', e.toFixed(4));
    // fades (set here rather than in CSS: the hint's own breathing animation would override a CSS opacity)
    const fade = (sel, k) => {
      const el = root.querySelector(sel);
      if (el) el.style.opacity = Math.max(0, 1 - e * k).toFixed(3);
    };
    fade('.loader__hintwrap', 6);
    fade('.loader__count', 5);
    fade('.loader__ball', 1.7);
    fade('.loader__shadow', 3);
    place(e);
  }, [place]);

  const finish = useCallback(() => {
    const d = dive.current;
    if (d.done) return;
    d.done = true;
    cancelAnimationFrame(d.raf);
    place(1);
    holdScroll(false);
    setGone(true);
    onDone?.();
  }, [place, onDone]);

  useEffect(() => {
    if (!ready) return undefined;
    const d = dive.current;
    const root = rootRef.current;
    const tick = now => {
      d.raf = 0;
      if (d.tap) {
        const u = Math.min(1, (now - d.tap.t0) / TAP_MS);
        d.p = d.tap.p0 + (1 - d.tap.p0) * u;
      } else {
        d.p += (d.target - d.p) * 0.14;
        if (Math.abs(d.target - d.p) < 0.0005) d.p = d.target;
      }
      apply(d.p);
      if (d.p >= 0.995) {
        finish();
        return;
      }
      if (d.tap || d.p !== d.target) d.raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!d.raf) d.raf = requestAnimationFrame(tick);
    };
    const push = dy => {
      if (d.tap) return;
      d.target = Math.min(1, Math.max(0, d.target + dy / (window.innerHeight * DIVE)));
      // past a third of the way, it carries on by itself
      if (d.target > 0.34) d.tap = { t0: performance.now() - TAP_MS * d.p, p0: 0 };
      kick();
    };
    const onWheel = e => {
      e.preventDefault();
      push(e.deltaY * (e.deltaMode === 1 ? 32 : 1));
    };
    let ty = null, down = null;
    const onTouchStart = e => {
      ty = e.touches[0].clientY;
    };
    const onTouchMove = e => {
      if (ty === null) return;
      e.preventDefault();
      const y = e.touches[0].clientY;
      push((ty - y) * 1.3);
      ty = y;
    };
    const onTouchEnd = () => {
      ty = null;
    };
    const onDown = e => {
      down = { x: e.clientX, y: e.clientY, t: performance.now() };
    };
    const onUp = e => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      const quick = performance.now() - down.t < 500;
      down = null;
      if (moved > 12 || !quick || d.tap) return;
      // a tap on (or near) the ball
      const R0 = radius.current;
      if (Math.hypot(e.clientX - window.innerWidth / 2, e.clientY - window.innerHeight / 2) > R0 * 1.25) return;
      d.tap = { t0: performance.now(), p0: d.p };
      kick();
    };
    const onKey = e => {
      if (['Enter', ' ', 'ArrowDown', 'PageDown'].includes(e.key)) {
        e.preventDefault();
        if (!d.tap) d.tap = { t0: performance.now(), p0: d.p };
        kick();
      }
    };
    if (reduce) {
      // no dive: a tap, scroll or key fades the loading screen out
      const out = () => {
        root.classList.add('is-leaving');
        setTimeout(finish, 350);
      };
      window.addEventListener('wheel', out, { once: true, passive: true });
      root.addEventListener('pointerup', out, { once: true });
      window.addEventListener('keydown', out, { once: true });
      return () => {
        window.removeEventListener('wheel', out);
        window.removeEventListener('keydown', out);
      };
    }
    window.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('touchstart', onTouchStart, { passive: true });
    root.addEventListener('touchmove', onTouchMove, { passive: false });
    root.addEventListener('touchend', onTouchEnd);
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointerup', onUp);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', onWheel);
      root.removeEventListener('touchstart', onTouchStart);
      root.removeEventListener('touchmove', onTouchMove);
      root.removeEventListener('touchend', onTouchEnd);
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointerup', onUp);
      window.removeEventListener('keydown', onKey);
      cancelAnimationFrame(d.raf);
    };
  }, [ready, reduce, apply, finish]);

  if (gone) return null;
  const css = getComputedStyle(document.documentElement);
  const accent = css.getPropertyValue('--accent').trim() || '#D21319';
  const light = theme !== 'dark';
  return (
    <div
      ref={rootRef}
      className={`loader${ready ? ' is-ready' : ''}`}
      style={{ '--clear': clear.toFixed(3) }}
      role="dialog"
      aria-label={ready ? 'Nuthan Puli: tap or scroll to enter' : `Loading, ${pct} percent`}
    >
      <div className="loader__cover" aria-hidden="true" />
      <div className="loader__ball" aria-hidden="true">
        <div className="loader__shadow" />
        <div className="loader__pop">
        <div className="loader__dust">
          <CrystalizedBall
            preset="aurora"
            color={accent}
            theme={light ? 'light' : 'dark'}
            size={1 / 1.3}
            strands={0}
            crackle={0}
            flares={0}
            sparks={0}
            glow={0.3}
            haze={0.6}
            fill={0.5}
            motion="rise"
            particleShape="round"
            particleCount={phone ? 3500 : 9000}
            hoverStrength={0.8}
            clear={clear}
          />
        </div>
        <div className="loader__glass" />
        </div>
      </div>
      <div className="loader__hintwrap"><p className="loader__hint">{ready ? 'Tap or scroll to enter' : 'Loading'}</p></div>
      <div className="loader__count" aria-hidden="true">
        <CountUp to={pct} from={0} duration={0.5} mode="roll" easing="easeOut" trigger="load" suffix="%" />
      </div>
    </div>
  );
}
