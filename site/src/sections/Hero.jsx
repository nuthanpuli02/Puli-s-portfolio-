import { useEffect, useRef, useState } from 'react';
import Galaxy from '../components/reactbits/Galaxy.jsx';
import { intro } from '../intro.js';
import FoldText from '../components/reactbits/FoldText.jsx';

// Section 1. Layers, back to front: Galaxy (React Bits; the same dark space by day and by night; stars move away from
// the pointer, a tap warps) → the bare ridge → the same ridge overgrown, seen through a soft spotlight → "NUTHAN"
// (React Bits FoldText) → clouds rising from the bottom, which carry the page into section 2.
// With the loading screen (src/intro.js) the hero waits hidden; when loading is done its galaxy shows inside the glass
// ball, and when the visitor dives in the title slides down from the top while the ridge and the clouds rise into place.
export default function Hero({ theme }) {
  const heroRef = useRef(null);
  const [phase, setPhase] = useState(intro.phase);
  useEffect(() => intro.on(setPhase), []);
  const phone = Math.min(window.innerWidth, window.innerHeight) < 700;

  // the header sits on the dark space while the hero is under it: its text turns light (html[data-over-hero])
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return undefined;
    const set = () => {
      const over = hero.getBoundingClientRect().bottom > 90;
      if (over) document.documentElement.dataset.overHero = '';
      else delete document.documentElement.dataset.overHero;
    };
    set();
    window.addEventListener('scroll', set, { passive: true });
    window.addEventListener('resize', set);
    return () => {
      window.removeEventListener('scroll', set);
      window.removeEventListener('resize', set);
      delete document.documentElement.dataset.overHero;
    };
  }, []);

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

  // clouds: rise with the scroll (near faster than far) and drift sideways; transforms only
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return undefined;
    const far = hero.querySelector('.hero__cloud--far'), near = hero.querySelector('.hero__cloud--near');
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, visible = true;
    const t0 = performance.now();
    const frame = now => {
      raf = 0;
      const sy = Math.max(0, -hero.getBoundingClientRect().top);
      const t = reduce ? 0 : (now - t0) * 0.00008, w = Math.min(1, window.innerWidth / 1280);
      far.style.transform = `translate3d(${(Math.sin(t + 1.3) * 34 * w).toFixed(1)}px,${(-sy * 0.16).toFixed(1)}px,0)`;
      near.style.transform = `translate3d(${(Math.sin(t * 1.3) * -46 * w).toFixed(1)}px,${(-sy * 0.34).toFixed(1)}px,0)`;
      if (visible && !reduce) raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); });
    io.observe(hero);
    const onScroll = () => { if (reduce) kick(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    kick();
    return () => { io.disconnect(); cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); };
  }, []);

  return (
    <section
      className={`hero${phase === 'loading' || phase === 'ready' ? ' hero--hold' : ''}${phase === 'entered' ? ' hero--enter' : ''}`}
      id="top" ref={heroRef} aria-labelledby="heroName"
    >
      {phase !== 'loading' && (
        <div className="hero__galaxy" aria-hidden="true">
          <Galaxy
            density={1}
            glowIntensity={0.3}
            saturation={0}
            hueShift={140}
            twinkleIntensity={0.3}
            starSpeed={0.5}
            rotationSpeed={0.1}
            mouseRepulsion
            repulsionStrength={2}
            clickWarp
            transparent
            dpr={Math.min(window.devicePixelRatio || 1, phone ? 1.25 : 1.5)}
          />
        </div>
      )}
      {/* the photo's ridge runs off its own frame, so its sides and base melt away instead of ending in a hard edge */}
      <div className="hero__ridges" aria-hidden="true">
        <div className="hero__ridge hero__ridge--stone" />
        <div className="hero__ridge hero__ridge--bloom" />
      </div>

      <div className="hero__title">
        <h1 id="heroName" className="hero__name">
          <FoldText key={phase === 'entered' ? 'in' : 'wait'} text="NUTHAN" hinge="top" foldStyle="paper" duration={0.9} stagger={0.07} hoverRefold refoldRadius={160}
            fontSize="clamp(64px, 12.8vw, 198px)" fontWeight={900} color="var(--text)" />
        </h1>
      </div>
      {/* in front of the ridge, so it stays readable where the peaks cover the name */}
      <p className="hero__role">Machine learning · Security · Web</p>


      {/* clouds: two banks (far = darker, higher; near = lighter, lower). They rise into place on load, drift
          sideways and rise faster than the page when scrolling; the near bank's flat base runs straight into
          section 2, which starts in the same colour */}
      <div className="hero__clouds" aria-hidden="true">
        <div className="cbank cbank--top hero__cloud hero__cloud--far" style={{ '--mx': '-520px' }} />
        <div className="cbank cbank--top hero__cloud hero__cloud--near" style={{ '--mx': '-90px' }} />
      </div>
    </section>
  );
}
