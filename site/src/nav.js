// Where each menu item scrolls to. Sections 2 and 3 live inside one pinned, scroll-driven section, so their
// "positions" are scroll offsets that Clouds.jsx registers here (in px from the top of the page).
const targets = { home: () => 0 };

export const registerTarget = (name, fn) => { targets[name] = fn; };

export function scrollToSection(name) {
  const y = targets[name]?.();
  if (y == null) return false;
  window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  return true;
}
