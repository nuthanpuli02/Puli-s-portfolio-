import { useEffect, useRef } from 'react';

// Section 2, into the clouds. The hero's smoke becomes a cloud bank and the page sinks through it:
// the section is tall and its stage stays pinned while you scroll; scroll position (p, 0 → 1) moves cloud
// layers upward past the camera at different speeds (far ones slower and darker, near ones faster and lighter).
// "Puli's Portfolio" and the intro appear in the middle; a last, thick cloud covers the screen, and when it
// lifts the page is below the clouds, on the plain background of section 3.
// Only transforms and opacity change per frame, and the loop runs only while the section is on screen.

// cloud layers: s/e = the p at which it enters from the bottom / leaves at the top, h = its height (in screens),
// x = where along the texture it starts (px), d = sideways drift (px), kind = far | near | exit
const LAYERS = [
  { kind: 'far',  s: -0.10, e: 0.56, h: 1.1,  x: -220,  d: 40 },
  { kind: 'far',  s: 0.16,  e: 0.86, h: 1.2,  x: -760,  d: -50 },
  { kind: 'near', s: -0.14, e: 0.30, h: 1.3,  x: -40,   d: -60 },
  { kind: 'near', s: 0.12,  e: 0.50, h: 1.0,  x: -1180, d: 70 },
  { kind: 'near', s: 0.42,  e: 0.78, h: 0.9,  x: -560,  d: -55 },
];
const EXIT = { s: 0.62, e: 1.0, h: 2, x: 0, d: 0 }; // h is recomputed per screen size (see exitHeight)
// the scene behind is swapped for the plain background (section 3's colour) at the moment the exit cloud's
// billowy top edge has passed above the screen; its solid middle covers everything then, so the swap is never seen
const edgePx = () => Math.min(340, Math.max(170, 0.26 * window.innerWidth)); // same as --edge in app.css
// just tall enough that its solid middle can cover the whole screen between its two billowy edges
const exitHeight = vh => Math.max(1.6, 1 + (2 * edgePx()) / vh + 0.12);

const clamp01 = v => Math.min(1, Math.max(0, v));
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };

export default function Clouds() {
  const ref = useRef(null);

  useEffect(() => {
    const section = ref.current;
    if (!section) return undefined;
    const stage = section.querySelector('.clouds__stage');
    const layers = [...section.querySelectorAll('.cloud')];
    const exit = section.querySelector('.cloud--exit');
    const deep = section.querySelector('.clouds__deep');
    const floor = section.querySelector('.clouds__floor');
    const copy = section.querySelector('.clouds__copy');
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, visible = false;
    const t0 = performance.now();

    // place one cloud: it enters at the bottom at p = s and has left past the top at p = e
    const place = (el, L, p, vh, t) => {
      const k = (p - L.s) / (L.e - L.s);
      const y = vh - k * (vh * (1 + L.h));
      // sideways drift, scaled to the screen so a cloud never slides far enough to show its own side
      const x = reduce ? 0 : Math.sin(t * 0.00009 + L.x) * L.d * Math.min(1, window.innerWidth / 1280);
      el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    };

    const frame = now => {
      raf = 0;
      const r = section.getBoundingClientRect();
      const vh = stage.clientHeight || window.innerHeight;
      const p = clamp01(-r.top / Math.max(1, r.height - vh));
      const hE = exitHeight(vh);
      if (hE !== EXIT.h) { EXIT.h = hE; exit.style.setProperty('--h', hE.toFixed(3)); }
      const exitTop = vh - ((p - EXIT.s) / (EXIT.e - EXIT.s)) * vh * (1 + EXIT.h);
      const below = exitTop <= -edgePx();
      layers.forEach((el, i) => {
        if (el === exit) { place(el, EXIT, p, vh, 0); return; }
        place(el, LAYERS[i], p, vh, now - t0);
        el.style.opacity = below ? '0' : '';
      });
      deep.style.opacity = below ? '0' : smooth(0.02, 0.26, p).toFixed(3);
      floor.style.opacity = below ? '1' : '0';
      const show = smooth(0.25, 0.37, p) * (1 - smooth(0.62, 0.72, p));
      copy.style.opacity = show.toFixed(3);
      copy.style.transform = `translate3d(0,${((0.48 - p) * 0.22 * vh).toFixed(1)}px,0) scale(${(0.965 + 0.035 * smooth(0.25, 0.45, p)).toFixed(4)})`;
      if (visible && !reduce) raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }, { rootMargin: '20% 0px' });
    io.observe(section);
    // with reduced motion there is no drift, so the frame only needs to run when the page scrolls
    const onScroll = () => { if (reduce && visible) kick(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', kick);
    kick();
    return () => { io.disconnect(); cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', kick); };
  }, []);

  return (
    <section className="clouds" id="about" ref={ref} aria-labelledby="cloudsTitle">
      <div className="clouds__stage">
        <div className="clouds__deep" aria-hidden="true" />
        {LAYERS.filter(l => l.kind === 'far').map((l, i) => (
          <div key={`f${i}`} className="cloud cloud--far" style={{ '--h': l.h, '--mx': `${l.x}px` }} aria-hidden="true" />
        ))}
        <div className="clouds__copy">
          <h2 id="cloudsTitle" className="clouds__title"><span className="clouds__script">Puli's</span> <span className="clouds__caps">Portfolio</span></h2>
          <p>I'm a student working in machine learning. My thesis teaches transformer models to find security flaws in source code.</p>
          <p>I also freelance, building models, dashboards and websites. Small projects, done carefully.</p>
        </div>
        {LAYERS.filter(l => l.kind === 'near').map((l, i) => (
          <div key={`n${i}`} className="cloud cloud--near" style={{ '--h': l.h, '--mx': `${l.x}px` }} aria-hidden="true" />
        ))}
        <div className="clouds__floor" aria-hidden="true" />
        <div className="cloud cloud--exit" style={{ '--h': EXIT.h, '--mx': '-330px' }} aria-hidden="true" />
      </div>
    </section>
  );
}
