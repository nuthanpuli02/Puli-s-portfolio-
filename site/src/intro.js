// The loading screen and the hero talk through this: 'none' (no loading screen: the hero plays its own intro),
// 'loading' (the hero waits, hidden, galaxy not started), 'ready' (loaded: the galaxy shows inside the glass ball),
// 'entered' (the visitor dived in: the title slides down, the ridge and the clouds rise into place).
// The loading screen shows for everyone (since 2026-10-29); ?noloader skips it, and so does ?puli-debug (headless tests).
export const WITH_LOADER = typeof location !== 'undefined' && !/[?&](noloader|puli-debug)/.test(location.search);
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
