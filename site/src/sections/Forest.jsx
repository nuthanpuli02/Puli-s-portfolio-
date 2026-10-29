import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { shared } from '../puli/shared.js';

// Section 6: the forest and the runner game. The 3D stage from section 5 (src/puli/stage.js) draws it on its full-screen
// canvas, in this section's box: Puli falls on through the dark, lands face-down, shockwave 1 draws the forest
// (src/forest/world.js) as a neon green grid, and as he gets up shockwave 2 brings in the textures and the fog. Then
// "Tap to run": the runner (src/forest/game.js). Taps (or Space / arrow up) jump, a second one in the air jumps again,
// holding goes higher; a swipe down (or arrow down) slides. 3 lives; score = distance + pollen; best kept on the device.
// The section has no height until `open` (set when Play is pressed), so nobody scrolls into an empty forest before the
// fall, and it is black, so the fall continues into the dark.
const Forest = forwardRef(function Forest({ onLanded, open }, ref) {
  const rootRef = useRef(null);
  const [landed, setLanded] = useState(false);
  const [info, setInfo] = useState(null);
  const landedRef = useRef(onLanded);
  landedRef.current = onLanded;
  const started = useRef(false);
  const touch = window.matchMedia?.('(pointer: coarse)').matches ?? false;

  useEffect(() => {
    const root = rootRef.current;
    shared.onForestLanded = () => {
      setLanded(true);
      landedRef.current?.();
    };
    shared.onGame = i => setInfo(prev => (prev && prev.ready === i.ready && prev.running === i.running && prev.over === i.over
      && prev.score === i.score && prev.best === i.best && prev.lives === i.lives ? prev : i));
    // on screen = at least a sliver of it shows (just touching the bottom edge of the screen doesn't count)
    let onScreen = false;
    const seen = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting && e.intersectionRatio > 0.5;
      shared.stage?.setForestVisible(e.isIntersecting && e.intersectionRatio > 0.01 && started.current);
    }, { threshold: [0, 0.02, 0.5] });
    seen.observe(root);

    // the run's controls: taps and swipes on the forest, Space / arrows on a keyboard
    let down = null;
    const live = () => started.current && onScreen && shared.stage;
    const onDown = e => {
      if (!live() || e.target.closest('button,a')) return;
      down = { y: e.clientY, t: performance.now(), slid: false };
      shared.stage.gamePress();
    };
    const onMove = e => {
      if (!down || down.slid) return;
      if (e.clientY - down.y > 36 && performance.now() - down.t < 350) {
        down.slid = true;
        shared.stage.gameSlide();
      }
    };
    const onUp = () => {
      down = null;
      shared.stage?.gameRelease();
    };
    const onKey = e => {
      if (!live() || e.target.closest?.('input,textarea')) return;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (!e.repeat) shared.stage.gamePress();
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        shared.stage.gameSlide();
      }
    };
    const onKeyUp = e => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') shared.stage?.gameRelease();
    };
    root.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);

    // ?puli-debug: open the forest and start it from the console (true: already landed), for headless tests
    if (/[?&]puli-debug/.test(location.search)) {
      window.__forestStart = skip => {
        root.dataset.open = 'true';
        root.scrollIntoView({ behavior: 'instant' });
        started.current = true;
        onScreen = true;
        if (skip) shared.stage?.showForest();
        else window.__puliStage?.startForest();
        shared.stage?.setForestVisible(true);
      };
    }
    return () => {
      seen.disconnect();
      root.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      shared.onForestLanded = null;
      shared.onGame = null;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    // section 5: he has fallen down to here (the stage has already carried on with him), or, without the fall
    // (reduced motion), show the forest with him standing in it
    start: () => {
      started.current = true;
      setLanded(false);
      setInfo(null);
      const st = shared.stage;
      if (!st) {
        landedRef.current?.();
        return;
      }
      if (!st.inForest) st.showForest();
      st.setForestVisible(true);
    },
    preload: () => shared.stage?.preloadForest()
  }), []);

  const playing = !!info && (info.running || info.over);
  let caption = '';
  if (info?.ready) caption = touch ? 'Tap to run. Swipe down to slide' : 'Press Space to run. Down arrow to slide';
  else if (info?.over) caption = `Score ${info.score}. Best ${info.best}. ${touch ? 'Tap' : 'Press Space'} to run again`;

  return (
    <section className={`forest${playing || info?.ready ? ' is-playing' : ''}`} id="forest" ref={rootRef} data-open={open ? 'true' : 'false'} aria-label="The forest game">
      {playing && (
        <div className="forest__hud forest__pill" aria-live="off">
          <span>{info.score}</span>
          <span className="forest__lives" aria-label={`${info.lives} lives left`}>{'♥'.repeat(Math.max(0, info.lives))}<span className="forest__lost">{'♥'.repeat(Math.max(0, 3 - info.lives))}</span></span>
          <span className="forest__best">Best {Math.max(info.best, info.score)}</span>
        </div>
      )}
      {caption && <p className="forest__caption forest__pill" aria-live="polite">{caption}</p>}
      {landed && (
        <button
          type="button"
          className="forest__pill forest__back"
          onClick={() => document.getElementById('game')?.scrollIntoView({ behavior: 'smooth' })}
        >
          Back up
        </button>
      )}
    </section>
  );
});

export default Forest;
