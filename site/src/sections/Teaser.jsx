import { useCallback, useEffect, useRef, useState } from 'react';
import DodgeField from '../components/reactbits/DodgeField.jsx';
import FlyingButton from '../components/reactbits/FlyingButton.jsx';
import { holdScroll } from '../scrollHold.js';

// Section 5: the game teaser. A button that dodges you (on touch screens it hops away when tapped); after "Alright,
// alright" it gives up and glides down to the bottom of the screen as the Play button. Pressing Play makes it grow
// thrusters and take off. Puli (the blocky 3D character behind the HTML, `src/puli/stage.js`) moonwalks in with the
// scroll and dances; when Play is pressed he steps under the button, jumps and latches onto its right end as it hovers,
// is carried up, lets go, and the page follows him down into the forest (section 6), where the game starts.
const TAUNTS = ['Catch me', 'Nope', 'Alright, alright', 'Play'];
const POD = 6;      // the thruster pods' height at this button size (React Bits: 5px x size factor 1.18)
const PILL_H = 52;  // the button's height (large)
const FLOOR = 14;   // the Play button rests this far above the bottom of the screen
const GLIDE_MS = 700;

export default function Teaser({ theme, forestRef, onOpenForest }) {
  const stageRef = useRef(null);
  const fieldRef = useRef(null);
  const canvasRef = useRef(null);
  const flightRef = useRef(null);
  const ctrlRef = useRef(null);         // the flying button's launch()
  const puliRef = useRef(null);         // the 3D stage once loaded
  const soloRef = useRef(false);        // the button flies without Puli this time
  const [round, setRound] = useState(0);         // remounts the dodging button for another go
  const [phase, setPhase] = useState('dodge');   // dodge -> glide -> rest (Play at the bottom) -> flying
  const [glide, setGlide] = useState(null);      // the dodging button gliding down to where Play rests
  const [rest, setRest] = useState(null);        // the flying button's box and take-off spot, in stage coordinates

  // into the forest: the forest section opens and plays its own fall; the page stays still until he has landed
  const goForest = useCallback(smooth => {
    onOpenForest?.();
    requestAnimationFrame(() => {
      document.getElementById('forest')?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
      forestRef?.current?.start();
    });
  }, [forestRef, onOpenForest]);

  // back to the start of section 5 (once the forest has taken over, or for another go)
  const resetRound = useCallback(() => {
    setPhase('dodge');
    setGlide(null);
    setRest(null);
    setRound(r => r + 1);
  }, []);

  // ---- Puli: loaded a few screens early, drawn only while the section is on screen ----
  useEffect(() => {
    const canvas = canvasRef.current;
    const stageEl = stageRef.current;
    if (!canvas || !stageEl) return undefined;
    let api = null;
    let cancelled = false;
    let visible = false;
    const start = () => {
      if (api || cancelled) return;
      import('../puli/stage.js').then(({ createPuliStage }) => {
        if (cancelled) return;
        api = createPuliStage({
          canvas,
          theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
          layout: () => ({
            field: fieldRef.current.getBoundingClientRect(),
            stage: stageEl.getBoundingClientRect(),
            pill: fieldRef.current.querySelector('.dodge-field__pill')?.offsetWidth || 0,
            forest: document.getElementById('forest')?.getBoundingClientRect() || null
          }),
          onForest: () => {
            forestRef?.current?.start();
            resetRound();
          },
          onReady: ok => {
            if (ok) puliRef.current = api;
            api.setVisible(visible);
          }
        });
      });
    };
    const near = new IntersectionObserver(([e]) => e.isIntersecting && start(), { rootMargin: '300% 0px' });
    const seen = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      api?.setVisible(visible);
    });
    near.observe(stageEl);
    seen.observe(stageEl);
    return () => {
      cancelled = true;
      near.disconnect();
      seen.disconnect();
      api?.dispose();
      puliRef.current = null;
      holdScroll(false);
    };
  }, [forestRef, resetRound]);

  useEffect(() => {
    puliRef.current?.setTheme(theme === 'dark' ? 'dark' : 'light');
  }, [theme]);

  // ---- it gives up (or is caught with the keyboard): down to the bottom of the screen, where it becomes Play ----
  const toBottom = useCallback(() => {
    const stage = stageRef.current;
    const field = fieldRef.current;
    if (!stage || !field) return;
    setPhase(p => {
      if (p !== 'dodge') return p;
      const s = stage.getBoundingClientRect();
      const f = field.getBoundingClientRect();
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const top = -s.top; // the flying button's box: from the top of the screen down to its resting spot
      const floor = s.height - FLOOR;
      const x = f.left + f.width / 2 - s.left;
      const restY = floor - POD - PILL_H / 2; // its centre at rest, in stage coordinates
      // how high it climbs before hovering: to where Puli's jump meets it (or half the screen without him)
      const P = puliRef.current;
      const meet = P && P.standFor(s.left + x);
      const alt = Math.max(120, meet ? s.top + restY - meet.y : s.height * 0.5);
      // the dodging button always ends up back in the middle of its field, so glide from there
      setGlide({ x: 0, y: s.top + restY - (f.top + f.height / 2), ms: reduce ? 0 : GLIDE_MS });
      setTimeout(() => {
        setRest({ top, height: floor - top, x, alt });
        setPhase('rest');
        forestRef?.current?.preload();
      }, reduce ? 0 : GLIDE_MS);
      return 'glide';
    });
  }, [forestRef]);

  // ---- Play ----
  const onPlay = useCallback(() => {
    if (phase !== 'rest' || !rest) return;
    const s = stageRef.current.getBoundingClientRect();
    const P = puliRef.current;
    onOpenForest?.();
    if (ctrlRef.current && ctrlRef.current.launch()) {
      setPhase('flying');
      soloRef.current = !(P && !P.reduce && P.play(s.left + rest.x));
      if (!soloRef.current) holdScroll(true); // he takes it from here (onForest)
      return;
    }
    goForest(false); // reduced motion: no flight, straight to the forest
    resetRound();
  }, [phase, rest, goForest, resetRound, onOpenForest]);

  // without Puli (still loading, or didn't load) the button just flies off, and the forest takes over
  const onExit = useCallback(() => {
    if (soloRef.current) {
      goForest(true);
      resetRound();
    }
  }, [goForest, resetRound]);

  const onFrame = useCallback(f => {
    const el = flightRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    puliRef.current?.flyAt(r.left + f.x, r.top + f.y, f.phase);
  }, []);

  const css = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null;
  const accent = (css && css.getPropertyValue('--accent').trim()) || '#D21319';
  const day = theme !== 'dark';

  return (
    <section className="teaser" id="game" aria-label="A small game">
      <div className="teaser__stage" ref={stageRef}>
        <canvas className="teaser__puli" ref={canvasRef} aria-hidden="true" />
        <div className="teaser__copy">
          <h2 className="teaser__title">Okay, enough serious projects.</h2>
          <p className="teaser__line">Plot twist: I also make games. Small ones, but they count.</p>
          <p className="teaser__dare">Bet you can&rsquo;t catch the button first.</p>
        </div>

        <div className="teaser__field" ref={fieldRef}>
          {(phase === 'dodge' || phase === 'glide') && (
            <div
              className="teaser__glide"
              style={glide ? {
                transform: `translate(${glide.x.toFixed(1)}px, ${glide.y.toFixed(1)}px)`,
                transition: `transform ${glide.ms}ms cubic-bezier(.45,0,.55,1)`
              } : undefined}
            >
              <DodgeField
                key={round}
                taunts={TAUNTS}
                patience={3}
                radius={150}
                reach={110}
                stayCaught
                onRelent={toBottom}
                onCatch={toBottom}
                notice="Tap it. If you can."
                className="teaser__dodge"
                style={{ '--df-height': '100%' }}
              />
            </div>
          )}
        </div>

        {rest && (
          <div className="teaser__flight" ref={flightRef} style={{ top: rest.top, height: rest.height }}>
            <FlyingButton
              key={round}
              size="large"
              theme={day ? 'light' : 'dark'}
              buttonColor={accent}
              textColor="#FFFFFF"
              thrustColor={day ? '#FF8A3D' : '#FFB15C'}
              smokeColor={day ? '#E6E6E1' : '#3A3F3B'}
              trigger="click"
              carryCursor={false}
              interactive={false}
              exit
              altitude={rest.alt}
              hoverTime={1.6}
              startX={rest.x}
              controlRef={ctrlRef}
              onClick={onPlay}
              onExit={onExit}
              onFrame={onFrame}
              style={{ minHeight: 0 }}
            >
              Play
            </FlyingButton>
          </div>
        )}
        <p className="teaser__credit">3D character made with <a href="https://www.tripo3d.ai" target="_blank" rel="noreferrer">Tripo</a></p>
      </div>
    </section>
  );
}
