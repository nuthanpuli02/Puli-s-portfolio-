import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

// Section 6: the forest and the runner game, the existing WebGL1 code from the old page (`src/puli3d.js`, voxel Puli)
// on its own canvas. Section 5 calls start() when Puli has fallen down to here: the forest's own fall plays (through
// the canopy, onto the vines and branches, face-down on the moss), he gets up, and the game starts on tap or Space.
// The section has a transform, so the game's fixed-position buttons and captions stay inside it. It has no height
// until `open` (set when the Play button is pressed), so nobody scrolls into an empty forest before the fall.
const Forest = forwardRef(function Forest({ theme, onLanded, open }, ref) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const api = useRef({ start: () => {} });
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const landedRef = useRef(onLanded);
  landedRef.current = onLanded;

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    let PC = null;
    let gl = null;
    let buf = null;
    let raf = 0;
    let last = 0;
    let visible = false;
    let started = false;
    let landed = false;
    let dead = false;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const load = () =>
      PC ? Promise.resolve(PC) : import('../../../src/puli3d.js').then(() => {
        if (dead) return null;
        gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
        if (!gl) return null;
        // the game draws its backdrop and its final copy to the screen as one full-screen triangle from this buffer
        buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        PC = window.PuliChar(gl, buf, {
          host: root,
          pillClass: 'forest__pill',
          lives: 3,
          birds: false,
          backLabel: 'Back up',
          onBack: () => document.getElementById('game')?.scrollIntoView({ behavior: 'smooth' })
        });
        return PC;
      });

    const frame = now => {
      raf = 0;
      if (!PC || dead) return;
      const dt = last ? Math.min(now - last, 50) : 16;
      last = now;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      const w = Math.round(cssW * dpr);
      const h = Math.round(cssH * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      PC.draw({
        w, h, cssW, cssH, dt,
        night: themeRef.current === 'dark' ? 1 : 0,
        camY: 0, inside: 0, ready: true, reduce,
        scrollY: window.scrollY,
        maxY: document.documentElement.scrollHeight - window.innerHeight,
        pastWork: false, workBack: false
      });
      if (!landed && PC.mode() === 'landed') {
        landed = true;
        landedRef.current?.();
      }
      if (visible) raf = requestAnimationFrame(frame);
      else last = 0;
    };
    const kick = () => {
      if (started && visible && !raf) raf = requestAnimationFrame(frame);
    };

    api.current.start = () =>
      load().then(pc => {
        if (!pc) {
          landedRef.current?.();
          return;
        }
        pc.startFall(reduce);
        started = true;
        landed = false;
        last = 0;
        kick();
      });
    api.current.preload = () => load();

    const seen = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      kick();
    });
    seen.observe(root);
    return () => {
      dead = true;
      seen.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    start: () => api.current.start(),
    preload: () => api.current.preload?.()
  }), []);

  return (
    <section className="forest" id="forest" ref={rootRef} data-open={open ? 'true' : 'false'} aria-label="The forest game">
      <canvas className="forest__canvas" ref={canvasRef} aria-hidden="true" />
    </section>
  );
});

export default Forest;
