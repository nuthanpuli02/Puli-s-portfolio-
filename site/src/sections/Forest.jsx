import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { shared } from '../puli/shared.js';

// Section 6: the forest. The 3D stage from section 5 (src/puli/stage.js) draws it on its full-screen canvas, in this
// section's box: Puli falls on through the dark, lands face-down, shockwave 1 draws the forest (src/forest/world.js) as a
// neon green grid, and as he gets up shockwave 2 brings in the textures and the fog. Then he stands there; the runner game
// comes back in Phase 3 (docs/PLAN-FOREST.md). The section has no height until `open` (set when Play is pressed), so
// nobody scrolls into an empty forest before the fall, and it is black, so the fall continues into the dark.
const Forest = forwardRef(function Forest({ onLanded, open }, ref) {
  const rootRef = useRef(null);
  const [landed, setLanded] = useState(false);
  const landedRef = useRef(onLanded);
  landedRef.current = onLanded;
  const started = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    shared.onForestLanded = () => {
      setLanded(true);
      landedRef.current?.();
    };
    // on screen = at least a sliver of it shows (just touching the bottom edge of the screen doesn't count)
    const seen = new IntersectionObserver(([e]) => {
      shared.stage?.setForestVisible(e.isIntersecting && e.intersectionRatio > 0.01 && started.current);
    }, { threshold: [0, 0.02] });
    seen.observe(root);
    // ?puli-debug: open the forest and start it from the console (true: already landed), for headless tests
    if (/[?&]puli-debug/.test(location.search)) {
      window.__forestStart = skip => {
        root.dataset.open = 'true';
        root.scrollIntoView({ behavior: 'instant' });
        started.current = true;
        if (skip) shared.stage?.showForest();
        else window.__puliStage?.startForest();
        shared.stage?.setForestVisible(true);
      };
    }
    return () => {
      seen.disconnect();
      shared.onForestLanded = null;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    // section 5: he has fallen down to here (the stage has already carried on with him), or, without the fall
    // (reduced motion), show the forest with him standing in it
    start: () => {
      started.current = true;
      setLanded(false);
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

  return (
    <section className="forest" id="forest" ref={rootRef} data-open={open ? 'true' : 'false'} aria-label="The forest">
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
