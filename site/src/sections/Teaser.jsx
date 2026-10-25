import { useCallback, useEffect, useRef, useState } from 'react';
import DodgeField from '../components/reactbits/DodgeField.jsx';
import FlyingButton from '../components/reactbits/FlyingButton.jsx';

// Section 5: the game teaser. A button that dodges you (on touch screens it hops away when tapped), gives up after a few
// tries, and once caught grows thrusters and flies off the top of the screen. Puli (the blocky 3D character, behind the
// HTML, `src/puli/stage.js`) moonwalks in with the scroll and dances; when the button is caught he turns, jumps, the
// button glides into his hands, and he is carried off the top; then he falls back down, lands face-down and gets up.
// The page can't scroll from the catch until he is back on his feet.
const TAUNTS = ['Catch me', 'Nope', 'Alright, alright', 'Play'];
const POD = 6; // the thruster pods' height at this button size (React Bits: 5px x size factor 1.18)

const holdScroll = on => {
  const v = on ? 'hidden' : '';
  document.documentElement.style.overflow = v;
  document.body.style.overflow = v;
};

export default function Teaser({ theme }) {
  const stageRef = useRef(null);
  const fieldRef = useRef(null);
  const canvasRef = useRef(null);
  const flightRef = useRef(null);
  const puliRef = useRef(null);        // the 3D stage once loaded
  const caughtRef = useRef(null);      // the button's rectangle when it was caught (viewport px)
  const glideRef = useRef({ x: 0, y: 0 });
  const [round, setRound] = useState(0);          // remounts the dodging button for another go
  const [flight, setFlight] = useState(null);     // where the caught button takes off, in stage coordinates
  const [glide, setGlide] = useState(null);       // the caught button gliding into Puli's hands
  const [gone, setGone] = useState(false);

  // the flying button, placed where the caught one now sits
  const launch = useCallback(() => {
    const stage = stageRef.current;
    const rect = caughtRef.current;
    if (!stage || !rect) return;
    const s = stage.getBoundingClientRect();
    const g = glideRef.current;
    // its box runs from the top of the screen down to where the button sits, so it takes off from that spot and
    // disappears off the top of the screen
    const top = -s.top;
    setFlight({ top, height: rect.bottom + g.y - s.top - top + POD, x: rect.left + g.x + rect.width / 2 - s.left });
  }, []);

  // ---- Puli: loaded once the section is near, drawn only while it is on screen ----
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
            pill: fieldRef.current.querySelector('.dodge-field__pill')?.offsetWidth || 0
          }),
          onGrab: (p, ms) => {
            const r = caughtRef.current;
            if (!r) return;
            const g = { x: p.x - (r.left + r.width / 2), y: p.y - (r.top + r.height / 2) };
            glideRef.current = g;
            setGlide({ ...g, ms });
          },
          onLaunch: launch,
          onDone: () => {
            holdScroll(false);
            setFlight(null);
            setGlide(null);
            setGone(false);
            glideRef.current = { x: 0, y: 0 };
            setRound(r => r + 1);
          },
          onReady: ok => {
            if (ok) puliRef.current = api;
            api.setVisible(visible);
          }
        });
      });
    };
    // load a screen early; draw only while the section is on screen
    const near = new IntersectionObserver(([e]) => e.isIntersecting && start(), { rootMargin: '100% 0px' });
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
  }, [launch]);

  useEffect(() => {
    puliRef.current?.setTheme(theme === 'dark' ? 'dark' : 'light');
  }, [theme]);

  const onCatch = useCallback(rect => {
    if (!rect) return;
    caughtRef.current = rect;
    glideRef.current = { x: 0, y: 0 };
    const P = puliRef.current;
    if (P && !P.reduce && P.caught()) {
      holdScroll(true); // Puli takes it from here: he jumps for it, then the button launches (onLaunch)
      return;
    }
    launch();
  }, [launch]);

  const onExit = useCallback(() => {
    setGone(true);
    puliRef.current?.gone();
  }, []);

  // without Puli (still loading, didn't load, or reduced motion): bring the button back for another go
  useEffect(() => {
    if (!gone || (puliRef.current && !puliRef.current.reduce)) return undefined;
    const id = setTimeout(() => {
      setFlight(null);
      setGlide(null);
      setGone(false);
      setRound(r => r + 1);
    }, 2600);
    return () => clearTimeout(id);
  }, [gone]);

  const onFrame = useCallback(f => {
    const el = flightRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    puliRef.current?.flyAt(r.left + f.x, r.top + f.y);
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
          {!flight && (
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
                onCatch={onCatch}
                notice="Tap it. If you can."
                className="teaser__dodge"
                style={{ '--df-height': '100%' }}
              />
            </div>
          )}
        </div>

        {flight && (
          <div className="teaser__flight" ref={flightRef} style={{ top: flight.top, height: flight.height }}>
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
              autoLaunch
              exit
              altitude={70}
              hoverTime={0.9}
              startX={flight.x}
              onExit={onExit}
              onFrame={onFrame}
              style={{ minHeight: 0 }}
            >
              Play
            </FlyingButton>
          </div>
        )}
        <p className="teaser__status" aria-live="polite">{gone ? 'Up, up and away.' : ''}</p>
        <p className="teaser__credit">3D character made with <a href="https://www.tripo3d.ai" target="_blank" rel="noreferrer">Tripo</a></p>
      </div>
    </section>
  );
}
