import { useEffect, useMemo, useRef, useState } from 'react';
import { mountMoonlitPetals } from '../components/originkit/moonlitPetals.js';
import DepthCarousel from '../components/reactbits/DepthCarousel.jsx';
import BlurText from '../components/reactbits/BlurText.jsx';
import { PROJECTS } from '../data/projects.js';

// Section 3, my work. It sits at the end of section 2's sideways pan: the blossom tree (Originkit Moonlit Petals) on the
// left, and on the right the title (React Bits BlurText, plays once when it first comes into view) over the projects in
// a React Bits DepthCarousel (drag, swipe sideways, arrows, dots or the arrow keys). On phones the tree sits on top.

// tree settings: red blossoms in both modes; at night they glow softly against the dark
const TREE = {
  day: {
    background: '#BDBDB8', blossomColor: '#C41E2A', glow: 0, petals: 120, wind: 30, speed: 100, scale: 100, direction: 'left',
    advanced: { branchColor: '#2B2728', petalColor: '#E9A3A9', eyeColor: '#4A0710', hazeColor: '#BDBDB8', hazeOpacity: 0,
      vignette: 0, fade: 0, grain: 4, bokehOpacity: 0, highlight: 100 },
  },
  night: {
    background: '#1E1E21', blossomColor: '#C41E2A', glow: 45, petals: 120, wind: 30, speed: 100, scale: 100, direction: 'left',
    advanced: { branchColor: '#47423F', petalColor: '#E9A3A9', eyeColor: '#3A050C', hazeColor: '#3A2326', hazeOpacity: 30,
      vignette: 18, fade: 18, grain: 5, bokehOpacity: 45, highlight: 100 },
  },
};

function Tree({ theme }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const propsRef = useRef(TREE.day);
  propsRef.current = theme === 'dark' ? TREE.night : TREE.day;
  useEffect(() => mountMoonlitPetals(rootRef.current, canvasRef.current, propsRef), []);
  return (
    <div className="work__tree" ref={rootRef} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}

function Card({ p }) {
  return (
    <article className={`work-card${p.status === 'building' ? ' work-card--live' : ''}`}>
      <p className="work-card__tag">{p.status === 'building' && <i aria-hidden="true" />}{p.tag}</p>
      <h3 className="work-card__title">{p.title}</h3>
      <p className="work-card__text">{p.text}</p>
      <ul className="work-card__chips">{p.chips.map(c => <li key={c}>{c}</li>)}</ul>
    </article>
  );
}

// card size follows the screen: smaller on phones so three cards still show their depth
function useCardSize() {
  const get = () => (window.innerWidth < 760 ? { w: 270, h: 360, spread: 26 } : { w: 300, h: 390, spread: 80 });
  const [s, setS] = useState(get);
  useEffect(() => {
    const on = () => setS(get());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return s;
}

export default function Work({ theme }) {
  const items = useMemo(() => PROJECTS.map(p => ({ content: <Card p={p} />, alt: p.title })), []);
  const size = useCardSize();
  return (
    <div className="work">
      <Tree theme={theme} />
      <div className="work__content">
        <BlurText as="h2" className="work__title" text="My work" delay={120} animateBy="letters" direction="top" blur={12} />
        <div className="work__carousel" style={{ '--fan': `${size.spread}px` }}>
          <DepthCarousel
            items={items}
            label="Projects"
            cardWidth={size.w}
            cardHeight={size.h}
            radius={18}
            tint={theme === 'dark' ? '#0c0c0e' : '#5d5d58'}
            depth={190}
            spread={size.spread}
            tilt={18}
            visibleCards={3}
            falloff={0.22}
            blur={4}
            loop
          />
        </div>
      </div>
    </div>
  );
}
