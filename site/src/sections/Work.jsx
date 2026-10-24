import { useEffect, useMemo, useRef, useState } from 'react';
import { mountMoonlitPetals } from '../components/originkit/moonlitPetals.js';
import DepthCarousel from '../components/reactbits/DepthCarousel.jsx';
import BlurText from '../components/reactbits/BlurText.jsx';
import PixelCard from '../components/reactbits/PixelCard.jsx';
import { PROJECTS } from '../data/projects.js';
import { thesisFigure } from '../figures/thesisFigure.js';
import '../components/anatomy/iso.css';

// Section 3, my work. It sits at the end of section 2's sideways pan. Left: the title (React Bits BlurText) over the
// projects in a React Bits DepthCarousel whose cards are React Bits PixelCards. Right: the blossom tree (Originkit
// Moonlit Petals), mirrored and narrow, so the work is the highlight. Nothing here appears until the pan has finished
// (Clouds.jsx sets `revealed`), and it all leaves again before the page scrolls on (outro), every time; in between the page's scroll moves the carousel card by card (Clouds.jsx calls
// controlRef.current.setPosition), forwards and back. The dots jump the page to a card.

// tree settings: red blossoms in both modes, mirrored (direction 'right'); at night they glow softly. No haze, vignette,
// fade or grain: the canvas background matches the section exactly, so the tree has no visible box around it
const TREE = {
  day: {
    background: '#BDBDB8', blossomColor: '#C41E2A', glow: 0, petals: 90, wind: 30, speed: 100, scale: 100, direction: 'right',
    advanced: { branchColor: '#2B2728', petalColor: '#E9A3A9', eyeColor: '#4A0710', hazeColor: '#BDBDB8', hazeOpacity: 0,
      vignette: 0, fade: 0, grain: 0, bokehOpacity: 0, highlight: 100, crownReach: 80 },
  },
  night: {
    background: '#1E1E21', blossomColor: '#C41E2A', glow: 45, petals: 90, wind: 30, speed: 100, scale: 100, direction: 'right',
    advanced: { branchColor: '#47423F', petalColor: '#E9A3A9', eyeColor: '#3A050C', hazeColor: '#3A2326', hazeOpacity: 0,
      vignette: 0, fade: 0, grain: 0, bokehOpacity: 45, highlight: 100, crownReach: 80 },
  },
};

// pixel colours on the cards: the accent red with two greys, from the palette
const PIXELS = {
  day: { colors: '#D21319,#8E8E8A,#C9C9C4', glow: '#D21319' },
  night: { colors: '#E8361F,#6C6C70,#45454A', glow: '#E8361F' },
};

// the tree, plus its falling petals on a separate layer that covers the right 40% of the screen and sits behind the
// content (so petals drift behind the 01 / 08 counter)
function Tree({ theme }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const petalsRef = useRef(null);
  const propsRef = useRef(TREE.day);
  propsRef.current = theme === 'dark' ? TREE.night : TREE.day;
  useEffect(() => mountMoonlitPetals(rootRef.current, canvasRef.current, propsRef, petalsRef.current), []);
  return (
    <>
      <div className="work__tree" ref={rootRef} aria-hidden="true">
        <canvas ref={canvasRef} />
      </div>
      <canvas className="work__petals" ref={petalsRef} aria-hidden="true" />
    </>
  );
}

// animated figures drawn with the Anatomy kit (src/figures/); each runs only on the card at the front
const FIGURES = { thesis: thesisFigure };
function Figure({ name, active }) {
  const fig = useMemo(() => FIGURES[name](), [name]);
  const stageRef = useRef(null);
  const [label, setLabel] = useState('');
  useEffect(() => (active ? fig.start(stageRef.current, setLabel) : undefined), [active, fig]);
  return (
    <div className="work-fig iso">
      <div className="iso-stage work-fig__stage" ref={stageRef} dangerouslySetInnerHTML={{ __html: fig.svg }} />
      <p className="work-fig__readout" aria-hidden="true">{label}</p>
    </div>
  );
}

function Card({ p, front, theme }) {
  const px = theme === 'dark' ? PIXELS.night : PIXELS.day;
  // the card at the front shimmers on its own; the others light up when hovered
  return (
    <PixelCard className="work-card" trigger={front ? 'always' : 'hover'} colors={px.colors} glowColor={px.glow}
      gap={7} pixelSize={2} speed={28} opacity={0.75} fade={0.6} glow={0.35} spotlight={0.4} intro={false} noFocus
      theme={theme === 'dark' ? 'dark' : 'light'} radius={20}>
      <div className={`work-card__body${p.status === 'building' ? ' work-card--live' : ''}${p.figure ? ' has-figure' : ''}`}>
        {p.figure && <Figure name={p.figure} active={front} />}
        <p className="work-card__tag">{p.status === 'building' && <i aria-hidden="true" />}{p.tag}</p>
        <h3 className="work-card__title">{p.title}</h3>
        <p className="work-card__text">{p.text}</p>
        <ul className="work-card__chips">{p.chips.map(c => <li key={c}>{c}</li>)}</ul>
      </div>
    </PixelCard>
  );
}

// cards are sized from the screen: as big as the space allows
function useCardSize() {
  const get = () => {
    const vw = window.innerWidth, vh = window.innerHeight;
    if (vw < 760) {
      const w = Math.min(420, vw - 52);
      return { w, h: Math.round(Math.min(w * 1.12, vh * 0.48)), spread: 10, pad: 20 };
    }
    const h = Math.round(Math.max(380, Math.min(540, vh * 0.58)));
    return { w: Math.round(Math.min(h * 1.12, vw * 0.44)), h, spread: 100, pad: 110 };
  };
  const [s, setS] = useState(get);
  useEffect(() => {
    const on = () => setS(get());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return s;
}

export default function Work({ theme, revealed, controlRef, onDotClick }) {
  const [front, setFront] = useState(0);
  // every time section 3 comes into view the title plays again (a fresh BlurText each time)
  const [entry, setEntry] = useState(0);
  useEffect(() => { if (revealed) setEntry(n => n + 1); }, [revealed]);
  const items = useMemo(
    () => PROJECTS.map((p, i) => ({ content: <Card p={p} front={i === front} theme={theme} />, alt: p.title })),
    [front, theme]
  );
  const size = useCardSize();
  return (
    <div className={`work${revealed ? ' is-revealed' : ''}`}>
      <Tree theme={theme} />
      <div className="work__content">
        <div className="work__head">
          {entry > 0 ? (
            <BlurText key={entry} as="h2" className="work__title" text="My work" delay={110} animateBy="letters" direction="top" blur={12} trigger="load" />
          ) : (
            <h2 className="work__title work__title--wait">My work</h2>
          )}
          <p className="work__count" aria-live="polite">
            <b>{String(front + 1).padStart(2, '0')}</b> / {String(PROJECTS.length).padStart(2, '0')}
          </p>
        </div>
        <div className="work__carousel" style={{ '--fan': `${size.spread}px` }}>
          <DepthCarousel
            items={items}
            label="Projects"
            cardWidth={size.w}
            cardHeight={size.h}
            radius={20}
            tint={theme === 'dark' ? '#0c0c0e' : '#8f8f8a'}
            depth={200}
            spread={size.spread}
            tilt={18}
            visibleCards={3}
            falloff={0.22}
            blur={4}
            loop={false}
            showControls={false}
            interactive={false}
            edgePad={size.pad}
            exitFade={2.2}
            controlRef={controlRef}
            onDotClick={onDotClick}
            onChange={setFront}
          />
        </div>
      </div>
    </div>
  );
}
