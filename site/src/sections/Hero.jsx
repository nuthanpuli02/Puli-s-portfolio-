import { useEffect, useRef } from 'react';
import Waves from '../components/reactbits/Waves.jsx';
import FoldText from '../components/reactbits/FoldText.jsx';
import CircularText from '../components/reactbits/CircularText.jsx';

// Section 1. Layers, back to front: Waves (React Bits, reacts to the cursor) → the bare ridge → the same ridge
// overgrown, seen through a soft spotlight → "NUTHAN" (React Bits FoldText) → the game badge (CircularText) →
// smoke rising from the bottom, which carries the page into section 2.
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
      hero.style.setProperty('--my', `${r.height * 0.7 - (hero.querySelector('.hero__ridge--bloom').getBoundingClientRect().top - r.top)}px`);
      return undefined;
    }
    let tx = -999, ty = -999, x = -999, y = -999, last = -1e9, visible = true, raf = 0;
    const t0 = performance.now();
    // the spotlight is drawn in the ridge layer's own coordinates, which starts some way down the hero
    const bloom = hero.querySelector('.hero__ridge--bloom');
    const top = () => bloom.getBoundingClientRect().top - rect().top;
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
      {/* the photo's ridge runs off its own frame, so its sides and base melt away instead of ending in a hard edge */}
      <div className="hero__ridges" aria-hidden="true">
        <div className="hero__ridge hero__ridge--stone" />
        <div className="hero__ridge hero__ridge--bloom" />
      </div>

      <div className="hero__title">
        <h1 id="heroName" className="hero__name">
          <FoldText text="NUTHAN" hinge="top" foldStyle="paper" duration={0.9} stagger={0.07} hoverRefold refoldRadius={160}
            fontSize="clamp(58px, 11.5vw, 178px)" fontWeight={900} color="var(--text)" />
        </h1>
      </div>
      {/* in front of the ridge, so it stays readable where the peaks cover the name */}
      <p className="hero__role">Machine learning · Security · Web</p>

      <a className="hero__badge" href="#game" aria-label="Psst, there's a game hidden down here. Go to the game.">
        <CircularText text="PSST ✦ THERE'S A GAME HIDDEN DOWN HERE ✦ " spinDuration={22} onHover="speedUp" size={116} fontSize={10} fontWeight={700}>
          <svg className="hero__badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7.5 9.5h3M9 8v3M15 9.25h.01M17 11h.01"/><path d="M6.5 6h11A3.5 3.5 0 0 1 21 9.5l.6 6.2a2.6 2.6 0 0 1-4.6 1.9L15.2 15H8.8L7 17.6a2.6 2.6 0 0 1-4.6-1.9L3 9.5A3.5 3.5 0 0 1 6.5 6z"/>
          </svg>
        </CircularText>
      </a>

      {/* smoke: one wispy texture, three copies drifting upward one after another and fading out as they rise,
          over a soft base that runs into the next section, so it reads as a single smoke that keeps rising */}
      <div className="hero__smoke" aria-hidden="true">
        <span className="hero__smoke-base" />
        <span className="hero__smoke-rise" style={{ '--d': '0s', '--o': '0px' }} />
        <span className="hero__smoke-rise" style={{ '--d': '-6s', '--o': '-480px' }} />
        <span className="hero__smoke-rise" style={{ '--d': '-12s', '--o': '-950px' }} />
      </div>
    </section>
  );
}
