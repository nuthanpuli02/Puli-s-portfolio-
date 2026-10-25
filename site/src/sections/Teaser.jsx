import { useCallback, useEffect, useRef, useState } from 'react';
import DodgeField from '../components/reactbits/DodgeField.jsx';
import FlyingButton from '../components/reactbits/FlyingButton.jsx';

// Section 5: the game teaser. A button that dodges you (on touch screens it hops away when tapped), gives up after a few
// tries, and once caught grows thrusters and flies off the top of the screen. Puli (the blocky 3D character) joins in
// next: he moonwalks in, dances, grabs the button from the side and is carried off, then falls into the forest.
const TAUNTS = ['Catch me', 'Nope', 'Alright, alright', 'Play'];
const POD = 6; // the thruster pods' height at this button size (React Bits: 5px x size factor 1.18)

export default function Teaser({ theme }) {
  const stageRef = useRef(null);
  const [round, setRound] = useState(0);          // remounts the dodging button for another go
  const [flight, setFlight] = useState(null);     // where the caught button sits, in stage coordinates
  const [gone, setGone] = useState(false);

  const onCatch = useCallback(rect => {
    const stage = stageRef.current;
    if (!stage || !rect) return;
    const s = stage.getBoundingClientRect();
    // the flying button's box runs from the top of the screen down to where the button sits, so it takes off from
    // that spot and disappears off the top of the screen
    const top = -s.top;
    setFlight({ top, height: rect.bottom - s.top - top + POD, x: rect.left + rect.width / 2 - s.left });
  }, []);

  const onExit = useCallback(() => setGone(true), []);

  // until Puli and the forest are wired in: bring the button back for another go
  useEffect(() => {
    if (!gone) return undefined;
    const id = setTimeout(() => {
      setFlight(null);
      setGone(false);
      setRound(r => r + 1);
    }, 2600);
    return () => clearTimeout(id);
  }, [gone]);

  const css = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null;
  const accent = (css && css.getPropertyValue('--accent').trim()) || '#D21319';
  const day = theme !== 'dark';

  return (
    <section className="teaser" id="game" aria-label="A small game">
      <div className="teaser__stage" ref={stageRef}>
        <div className="teaser__copy">
          <h2 className="teaser__title">Okay, enough serious projects.</h2>
          <p className="teaser__line">Plot twist: I also make games. Small ones, but they count.</p>
          <p className="teaser__dare">Bet you can&rsquo;t catch the button first.</p>
        </div>

        <div className="teaser__field">
          {!flight && (
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
          )}
        </div>

        {flight && (
          <div className="teaser__flight" style={{ top: flight.top, height: flight.height }}>
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
              style={{ minHeight: 0 }}
            >
              Play
            </FlyingButton>
          </div>
        )}
        <p className="teaser__status" aria-live="polite">{gone ? 'Up, up and away.' : ''}</p>
      </div>
    </section>
  );
}
