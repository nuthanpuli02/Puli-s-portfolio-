import { useEffect, useRef, useState } from 'react';
import ShinyText from '../components/reactbits/ShinyText.jsx';
import TextType from '../components/reactbits/TextType.jsx';
import Work from './Work.jsx';
import { PROJECTS } from '../data/projects.js';
import { registerTarget } from '../nav.js';

// Section 2, inside the clouds, and the way into section 3. The hero's clouds rise and cover the screen; the section's
// stage then stays pinned while you scroll. Progress is measured in screens scrolled (s), timings in T below:
//   0  → .8   the covering cloud keeps rising and passes completely off the top (the darker bank behind it by .95),
//             leaving the darker inside of the cloud with no clouds in view
//   .6 → .95  "Puli's Portfolio" (React Bits ShinyText) fades in; at .8 the intro lines start typing (React Bits TextType)
//   1.9 → 3.0 the whole scene pans sideways, as if the camera moves right, into section 3 (Work.jsx)
//   3.0       section 3 appears (title, counter, carousel), every time it is reached, from either side
//   3.35 →    each further 0.7 screen of scrolling brings the next project card to the front; scrolling back goes back
//   .3 screen after the last card section 3 leaves again (outro), then a short hold and the page scrolls on
// The typing plays once per page load; section 3's entrance and exit play each time. Only transforms and opacity change per frame, and the
// loop runs only while the section is on screen.

const LINE1 = "I'm a student working in machine learning. My thesis teaches transformer models to find security flaws in source code.";
const LINE2 = 'I also freelance, building models, dashboards and websites. Small projects, done carefully.';
const TYPE_MS = 24; // per character

const clamp01 = v => Math.min(1, Math.max(0, v));
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const T = { rise: 0.8, farRise: 0.95, show: [0.6, 0.95], type: 0.8, pan: [1.9, 3.0], reveal: 3.0, cards: 3.35, step: 0.7, outro: 0.3, hold: 0.75 };
const LAST = PROJECTS.length - 1;
const SCREENS = T.cards + T.step * LAST + T.hold; // pinned length, in screens
// card position from scroll: each step dwells on a card and moves to the next in its middle part
const cardPos = s => {
  const x = Math.min(LAST, Math.max(0, (s - T.cards) / T.step));
  const i = Math.floor(x);
  return i >= LAST ? LAST : i + smooth(0.25, 0.75, x - i);
};
const edgePx = () => Math.min(340, Math.max(170, 0.26 * window.innerWidth)); // same as --edge in app.css

// ShinyText takes real colours (it blends them in JS), so read them from the tokens when the theme changes
function useShine(theme) {
  const [c, setC] = useState({ color: '#1F1F1F', shine: '#A3A39F' });
  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    setC({ color: cs.getPropertyValue('--text').trim() || '#1F1F1F', shine: cs.getPropertyValue('--shine').trim() || '#A3A39F' });
  }, [theme]);
  return c;
}

function TypedLine({ text, start, cursor }) {
  // the full line sits invisibly underneath to hold the space, so nothing moves while the text types in
  return (
    <p className="clouds__line">
      <span className="clouds__ghost" aria-hidden="true">{text}</span>
      {start ? (
        <TextType as="span" className="clouds__typed" text={text} loop={false} typingSpeed={TYPE_MS} showCursor={cursor}
          cursorStyle="bar" cursorBlinkDuration={0.55} />
      ) : <span className="text-type__sr">{text}</span>}
    </p>
  );
}

export default function Clouds({ theme }) {
  const ref = useRef(null);
  const carousel = useRef(null);
  const [typing, setTyping] = useState(0); // 0 = not yet, 1 = first line, 2 = second line
  const [revealed, setRevealed] = useState(false);
  const shine = useShine(theme);

  // start typing once, when the title is in view
  const startTyping = useRef(() => {});
  startTyping.current = () => { if (!typing) setTyping(1); };
  useEffect(() => {
    if (typing !== 1) return undefined;
    const id = setTimeout(() => setTyping(2), LINE1.length * TYPE_MS + 350);
    return () => clearTimeout(id);
  }, [typing]);

  // page position (px) at a given number of screens into this section; used by the menu and the carousel dots
  const at = screens => {
    const section = ref.current;
    if (!section) return null;
    const vh = section.querySelector('.clouds__stage').clientHeight || window.innerHeight;
    return window.scrollY + section.getBoundingClientRect().top + screens * vh;
  };
  useEffect(() => {
    registerTarget('about', () => at(T.show[1]));
    registerTarget('work', () => at(T.cards));
    // for the section badge: where section 2 starts, where the pan is half done, and where this section ends
    registerTarget('aboutStart', () => at(0));
    registerTarget('panMid', () => at((T.pan[0] + T.pan[1]) / 2));
    registerTarget('end', () => at(SCREENS));
  }, []);
  const goToCard = i => window.scrollTo({ top: at(T.cards + i * T.step), behavior: 'smooth' });

  useEffect(() => {
    const section = ref.current;
    if (!section) return undefined;
    const stage = section.querySelector('.clouds__stage');
    const track = section.querySelector('.clouds__track');
    const cover = section.querySelector('.clouds__ceiling--near');
    const far = section.querySelector('.clouds__ceiling--far');
    const copy = section.querySelector('.clouds__copy');
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, visible = false, started = false, shown = false, lastPos = -1;
    const t0 = performance.now();

    const frame = now => {
      raf = 0;
      const r = section.getBoundingClientRect();
      const vh = stage.clientHeight || window.innerHeight, vw = stage.clientWidth || window.innerWidth;
      const s = Math.min(Math.max(0, -r.top), Math.max(0, r.height - vh)) / vh; // screens scrolled into the section
      const edge = edgePx();
      const t = reduce ? 0 : (now - t0) * 0.00008, w = Math.min(1, vw / 1280);

      // the covering cloud fills the screen at s = 0 and rises until even its underside has passed off the top
      const hc = vh + edge * 1.6;
      cover.style.height = far.style.height = `${hc.toFixed(0)}px`;
      const rise = smooth(0, T.rise, s), riseFar = smooth(0, T.farRise, s);
      cover.style.transform = `translate3d(${(Math.sin(t * 1.3) * -30 * w).toFixed(1)}px,${(-rise * (hc + 40)).toFixed(1)}px,0)`;
      // a darker bank behind it starts a little lower and rises a little later: depth
      far.style.transform = `translate3d(${(Math.sin(t + 1.3) * 26 * w).toFixed(1)}px,${(vh * 0.25 * (1 - riseFar) - riseFar * (hc + 40)).toFixed(1)}px,0)`;
      const hidden = rise >= 1 && riseFar >= 1;
      cover.style.visibility = far.style.visibility = hidden ? 'hidden' : '';

      const pan = smooth(T.pan[0], T.pan[1], s) * vw;
      track.style.transform = `translate3d(${(-pan).toFixed(1)}px,0,0)`;

      const show = smooth(T.show[0], T.show[1], s);
      copy.style.opacity = show.toFixed(3);
      copy.style.transform = `translate3d(0,${((1 - show) * 28).toFixed(1)}px,0)`;
      if (!started && s >= T.type) { started = true; startTyping.current(); }
      // section 3 enters once the pan has finished and leaves shortly after the last card, each time it is passed
      const inView = s >= T.reveal && s < T.cards + T.step * LAST + T.outro;
      if (inView !== shown) { shown = inView; setRevealed(inView); }
      const pos = cardPos(s);
      if (Math.abs(pos - lastPos) > 0.0005) { lastPos = pos; carousel.current?.setPosition(pos); }
      if (visible && !reduce) raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }, { rootMargin: '20% 0px' });
    io.observe(section);
    const onScroll = () => { if (reduce && visible) kick(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', kick);
    kick();
    return () => { io.disconnect(); cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', kick); };
  }, []);

  return (
    <section className="clouds" id="about" ref={ref} aria-labelledby="cloudsTitle" style={{ height: `${((1 + SCREENS) * 100).toFixed(0)}vh` }}>
      <div className="clouds__stage">
        <div className="clouds__track">
          <div className="clouds__panel">
            <div className="clouds__copy">
              <h2 id="cloudsTitle" className="clouds__title">
                <ShinyText color={shine.color} shineColor={shine.shine} speed={2.6} delay={1.8} shineWidth={34} angle={115}>
                  <span className="clouds__script">Puli's</span> <span className="clouds__caps">Portfolio</span>
                </ShinyText>
              </h2>
              <TypedLine text={LINE1} start={typing >= 1} cursor={typing === 1} />
              <TypedLine text={LINE2} start={typing >= 2} cursor={typing === 2} />
            </div>
          </div>
          {/* section 3 */}
          <section className="clouds__panel clouds__panel--work" id="work" aria-label="My work">
            <Work theme={theme} revealed={revealed} controlRef={carousel} onDotClick={goToCard} />
          </section>
          <div className="cbank cbank--bottom clouds__ceiling clouds__ceiling--far" style={{ '--mx': '-610px' }} aria-hidden="true" />
          <div className="cbank cbank--bottom clouds__ceiling clouds__ceiling--near" style={{ '--mx': '-170px' }} aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
