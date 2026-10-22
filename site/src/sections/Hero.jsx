import { useEffect, useRef } from 'react';
import Waves from '../components/reactbits/Waves.jsx';
import FoldText from '../components/reactbits/FoldText.jsx';
import CircularText from '../components/reactbits/CircularText.jsx';

// Section 1. Layers, back to front: Waves (React Bits, reacts to the cursor) → the bare ridge → the same ridge
// overgrown, seen through a soft spotlight → "NUTHAN" (React Bits FoldText) → the game badge (CircularText) →
// smoke rising from the bottom, which carries the page into section 2.
// x position (%), size (px), delay (s), duration (s), sideways drift (px)
const PUFFS = [
  [-3.1, 380, -11.5, 15.9, -16], [2.2, 540, -14.7, 17.8, -21], [10.3, 460, -4.4, 14.0, -22], [15.2, 380, -13.3, 17.8, 20], [21.1, 460, -10.0, 17.4, 16], [30.0, 460, -10.7, 16.0, -21],
  [34.6, 380, -15.1, 17.9, 14], [42.5, 540, -11.3, 14.9, -27], [46.6, 460, -6.9, 14.0, 22], [54.3, 380, -1.3, 15.8, 30], [59.3, 500, -11.2, 13.9, -16], [64.9, 420, -10.2, 15.6, -25],
  [71.2, 540, -5.1, 16.4, 17], [78.9, 420, -4.4, 16.5, -17], [83.0, 420, -4.7, 13.2, 16], [91.3, 460, -11.8, 18.8, -24], [95.0, 420, -12.4, 15.5, -23], [102.5, 500, -4.7, 14.5, -24]
];

export default function Hero({ theme }) {
  const heroRef = useRef(null);
  const dark = theme === 'dark';

  // Spotlight: follows the cursor or finger; with no input it drifts along the ridge on its own.
  // Only two CSS variables change per frame.
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return undefined;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const rect = () => hero.getBoundingClientRect();
    if (reduce) {
      const r = rect();
      hero.style.setProperty('--mx', `${r.width * 0.62}px`);
      hero.style.setProperty('--my', `${r.height * 0.7 - hero.querySelector('.hero__ridge--bloom').offsetTop}px`);
      return undefined;
    }
    let tx = -999, ty = -999, x = -999, y = -999, last = -1e9, visible = true, raf = 0;
    const t0 = performance.now();
    // the spotlight is drawn in the ridge layer's own coordinates, which starts some way down the hero
    const bloom = hero.querySelector('.hero__ridge--bloom');
    const top = () => bloom.offsetTop;
    const aim = e => { const r = rect(); tx = e.clientX - r.left; ty = e.clientY - r.top; last = performance.now(); };
    const drift = t => {
      const r = rect(), s = t * 0.00011;
      return [r.width * (0.5 + 0.36 * Math.sin(s * 2) + 0.06 * Math.sin(s * 5.3)),
              r.height * (0.72 + 0.06 * Math.sin(s * 3.1 + 1) - 0.08 * Math.sin(s * 2))];
    };
    const tick = now => {
      raf = 0;
      if (!visible) return;
      const idle = now - last > 2600;
      if (idle) [tx, ty] = drift(now - t0);
      if (x < -900) { x = tx; y = ty; }
      const k = idle ? 0.025 : 0.12;
      x += (tx - x) * k; y += (ty - y) * k;
      hero.style.setProperty('--mx', `${x.toFixed(1)}px`);
      hero.style.setProperty('--my', `${(y - top()).toFixed(1)}px`);
      raf = requestAnimationFrame(tick);
    };
    hero.addEventListener('pointermove', aim);
    hero.addEventListener('pointerdown', aim);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(tick); });
    io.observe(hero);
    return () => { io.disconnect(); cancelAnimationFrame(raf); hero.removeEventListener('pointermove', aim); hero.removeEventListener('pointerdown', aim); };
  }, []);

  return (
    <section className="hero" id="top" ref={heroRef} aria-labelledby="heroName">
      <Waves
        className="hero__waves"
        lineColor={dark ? 'rgba(232,233,223,0.30)' : 'rgba(42,42,42,0.30)'}
        accentColor={dark ? '#E10600' : '#D21319'}
        lightMode={!dark}
        spacing={14}
        amplitude={28}
        mouseRadius={190}
        fade={0.35}
        dpr={Math.min(window.devicePixelRatio || 1, 1.5)}
      />
      <div className="hero__ridge hero__ridge--stone" aria-hidden="true" />
      <div className="hero__ridge hero__ridge--bloom" aria-hidden="true" />

      <div className="hero__title">
        <h1 id="heroName" className="hero__name">
          <FoldText text="NUTHAN" hinge="top" foldStyle="paper" duration={0.9} stagger={0.07} hoverRefold refoldRadius={160}
            fontSize="clamp(76px, 17vw, 260px)" fontWeight={900} color="var(--text)" />
        </h1>
      </div>
      {/* in front of the ridge, so it stays readable where the peaks cover the name */}
      <p className="hero__role">Machine learning · Security · Web</p>

      <a className="hero__badge" href="#game" aria-label="Psst, there's a game hidden down here. Go to the game.">
        <CircularText text="PSST ✦ THERE'S A GAME HIDDEN DOWN HERE ✦ " spinDuration={22} onHover="speedUp" size={138} fontSize={11.5} fontWeight={700}>
          <svg className="hero__badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7.5 9.5h3M9 8v3M15 9.25h.01M17 11h.01"/><path d="M6.5 6h11A3.5 3.5 0 0 1 21 9.5l.6 6.2a2.6 2.6 0 0 1-4.6 1.9L15.2 15H8.8L7 17.6a2.6 2.6 0 0 1-4.6-1.9L3 9.5A3.5 3.5 0 0 1 6.5 6z"/>
          </svg>
        </CircularText>
      </a>

      {/* smoke: a low bank of mist with puffs billowing up out of it, each rising, swelling and thinning out */}
      <div className="hero__smoke" aria-hidden="true">
        <span className="hero__smoke-bank" />
        {PUFFS.map((p, i) => (
          <span key={i} className="hero__puff"
            style={{ '--x': `${p[0]}%`, '--s': `${p[1]}px`, '--d': `${p[2]}s`, '--t': `${p[3]}s`, '--dx': `${p[4]}px` }} />
        ))}
      </div>
    </section>
  );
}
