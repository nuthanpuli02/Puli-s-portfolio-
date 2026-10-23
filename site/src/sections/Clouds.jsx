import { useEffect, useRef, useState } from 'react';
import ShinyText from '../components/reactbits/ShinyText.jsx';
import TextType from '../components/reactbits/TextType.jsx';
import Work from './Work.jsx';

// Section 2, inside the clouds, and the way into section 3. The hero's clouds rise and cover the screen; the section's
// stage then stays pinned while you scroll. Progress is measured in screens scrolled (s):
//   0   → .66  the covering cloud keeps rising until it hangs as a ceiling, revealing the darker inside of the cloud
//   .42 → .78  "Puli's Portfolio" (React Bits ShinyText) fades in; at .6 the intro lines start typing (React Bits TextType)
//   1.8 → 2.9  the whole scene pans sideways, as if the camera moves right, into section 3 (Work.jsx),
//              while the clouds lift off the top (gone by 2.6)
//   2.9 → 3.4  section 3 stays pinned for a moment, then the page scrolls on
// The typing plays once per page load: once started it never resets, even if you scroll back up.
// Only transforms and opacity change per frame, and the loop runs only while the section is on screen.

const LINE1 = "I'm a student working in machine learning. My thesis teaches transformer models to find security flaws in source code.";
const LINE2 = 'I also freelance, building models, dashboards and websites. Small projects, done carefully.';
const TYPE_MS = 24; // per character

const clamp01 = v => Math.min(1, Math.max(0, v));
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
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
  const [typing, setTyping] = useState(0); // 0 = not yet, 1 = first line, 2 = second line
  const shine = useShine(theme);

  // start typing once, when the title is in view
  const startTyping = useRef(() => {});
  startTyping.current = () => { if (!typing) setTyping(1); };
  useEffect(() => {
    if (typing !== 1) return undefined;
    const id = setTimeout(() => setTyping(2), LINE1.length * TYPE_MS + 350);
    return () => clearTimeout(id);
  }, [typing]);

  useEffect(() => {
    const section = ref.current;
    if (!section) return undefined;
    const stage = section.querySelector('.clouds__stage');
    const track = section.querySelector('.clouds__track');
    const cover = section.querySelector('.clouds__ceiling--near');
    const far = section.querySelector('.clouds__ceiling--far');
    const copy = section.querySelector('.clouds__copy');
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, visible = false, started = false;
    const t0 = performance.now();

    const frame = now => {
      raf = 0;
      const r = section.getBoundingClientRect();
      const vh = stage.clientHeight || window.innerHeight, vw = stage.clientWidth || window.innerWidth;
      const p = Math.min(Math.max(0, -r.top), Math.max(0, r.height - vh)) / vh; // screens scrolled into the section
      const edge = edgePx(), phone = vw < 760;
      const t = reduce ? 0 : (now - t0) * 0.00008, w = Math.min(1, vw / 1280);

      // the covering cloud: tall enough to fill the screen at p = 0, then it rises until its underside hangs at the top
      const hc = vh + edge * 1.6;
      cover.style.height = `${hc.toFixed(0)}px`;
      const rest = vh * (phone ? 0.25 : 0.27);
      const rise = smooth(0, 0.66, p);
      const pan = smooth(1.8, 2.9, p) * vw;
      // as the scene pans, the clouds lift off the top of the screen, gone well before section 3 settles
      const lift = smooth(1.8, 2.58, p) * (vh * 0.45 + edge);
      cover.style.transform = `translate3d(${(Math.sin(t * 1.3) * -30 * w).toFixed(1)}px,${(-rise * (hc - rest) - lift).toFixed(1)}px,0)`;
      // a darker bank behind it hangs a little lower, rises less and pans a little slower: depth
      far.style.height = `${hc.toFixed(0)}px`;
      const restFar = rest + vh * 0.07;
      far.style.transform = `translate3d(${(pan * 0.18 + Math.sin(t + 1.3) * 26 * w).toFixed(1)}px,${(vh * 0.25 * (1 - rise) - rise * (hc - restFar) - lift * 1.05).toFixed(1)}px,0)`;
      track.style.transform = `translate3d(${(-pan).toFixed(1)}px,0,0)`;

      const show = smooth(0.42, 0.78, p);
      copy.style.opacity = show.toFixed(3);
      copy.style.transform = `translate3d(0,${((1 - show) * 28).toFixed(1)}px,0)`;
      if (!started && p >= 0.6) { started = true; startTyping.current(); }
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
    <section className="clouds" id="about" ref={ref} aria-labelledby="cloudsTitle">
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
            <Work theme={theme} />
          </section>
          <div className="cbank cbank--bottom clouds__ceiling clouds__ceiling--far" style={{ '--mx': '-610px' }} aria-hidden="true" />
          <div className="cbank cbank--bottom clouds__ceiling clouds__ceiling--near" style={{ '--mx': '-170px' }} aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
