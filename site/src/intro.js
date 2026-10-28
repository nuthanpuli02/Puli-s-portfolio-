// The loading screen and the hero talk through this: 'none' (no loading screen: the hero plays its own intro),
// 'loading' (the hero waits, hidden, galaxy not started), 'ready' (loaded: the galaxy shows inside the glass ball),
// 'entered' (the visitor dived in: the title slides down, the ridge and the clouds rise into place).
// The loading screen is a demo for now: only with ?loader in the address.
export const WITH_LOADER = typeof location !== 'undefined' && /[?&]loader/.test(location.search);
const listeners = new Set();
export const intro = {
  phase: WITH_LOADER ? 'loading' : 'none',
  set(p) {
    intro.phase = p;
    for (const f of listeners) f(p);
  },
  on(f) {
    listeners.add(f);
    return () => listeners.delete(f);
  }
};
