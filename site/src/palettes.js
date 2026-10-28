// Saved colour palettes (see docs/PALETTES.md). The site's live colours are in src/styles/tokens.css:
// Charcoal by day and Moss by night, chosen 2026-10-23. Nothing here runs unless the address asks for it.
//
// Preview without changing any code: add ?day=<id>&night=<id> (or ?palette=<id> for both) to the address,
// e.g. /?day=sand&night=charcoal. To switch for real, copy a palette's values into tokens.css.

export const PALETTES = [
  {
    id: 'midnight', name: 'Midnight',
    day:   { bg: '#C0C0C0', bgDeep: '#B3B3B3', text: '#2A2A2A', ink: '42,42,42',    accent: '#D21319', accentHover: '#B30F14', highlight: '#2E3D28', smoke: '#E6E7DE', surface: 'rgba(232,233,223,.74)' },
    night: { bg: '#0B0D26', bgDeep: '#12143A', text: '#E8E9DF', ink: '232,233,223', accent: '#E10600', accentHover: '#FF2A1F', highlight: '#A9B887', smoke: '#9EA2AE', surface: 'rgba(16,18,46,.62)' },
  },
  {
    id: 'charcoal', name: 'Charcoal',
    day:   { bg: '#CFCFCB', bgDeep: '#BDBDB8', text: '#1F1F1F', ink: '31,31,31',    accent: '#D21319', accentHover: '#B30F14', highlight: '#2E3D28', smoke: '#EDEDE9', surface: 'rgba(240,240,236,.74)' },
    night: { bg: '#1C1C1E', bgDeep: '#242426', text: '#ECECE6', ink: '236,236,230', accent: '#E10600', accentHover: '#FF2A1F', highlight: '#A9B887', smoke: '#8E8E92', surface: 'rgba(36,36,38,.62)' },
  },
  {
    id: 'sand', name: 'Sand & Ink',
    day:   { bg: '#E3DACB', bgDeep: '#D4C8B4', text: '#221E19', ink: '34,30,25',    accent: '#B5121B', accentHover: '#960E15', highlight: '#5A6B3A', smoke: '#F1EBDF', surface: 'rgba(245,240,230,.74)' },
    night: { bg: '#15120E', bgDeep: '#1E1A14', text: '#EDE5D4', ink: '237,229,212', accent: '#E8452C', accentHover: '#FF5A40', highlight: '#C9B98A', smoke: '#8F877A', surface: 'rgba(30,26,20,.62)' },
  },
  {
    id: 'moss', name: 'Moss',
    day:   { bg: '#CDD3C2', bgDeep: '#BCC3AF', text: '#1C2418', ink: '28,36,24',    accent: '#C0261B', accentHover: '#A01F16', highlight: '#2E3D28', smoke: '#E4E8DA', surface: 'rgba(236,240,228,.74)' },
    night: { bg: '#0D1410', bgDeep: '#142019', text: '#E2E8D6', ink: '226,232,214', accent: '#E8361F', accentHover: '#FF4C33', highlight: '#A9B887', smoke: '#7F8C80', surface: 'rgba(18,28,22,.62)' },
  },
  {
    id: 'mono', name: 'Mono',
    day:   { bg: '#EEEDE9', bgDeep: '#DFDED9', text: '#111111', ink: '17,17,17',    accent: '#E10600', accentHover: '#C00500', highlight: '#111111', smoke: '#FAFAF8', surface: 'rgba(255,255,255,.74)' },
    night: { bg: '#070707', bgDeep: '#111111', text: '#F4F4F2', ink: '244,244,242', accent: '#FF2D20', accentHover: '#FF4A3E', highlight: '#F4F4F2', smoke: '#6E6E6E', surface: 'rgba(20,20,20,.62)' },
  },
];

const vars = c => `--bg:${c.bg};--bg-deep:${c.bgDeep};--surface:${c.surface};--surface-line:rgba(${c.ink},.14);--ink:${c.ink};` +
  `--text:${c.text};--text-soft:rgba(${c.ink},.72);--accent:${c.accent};--accent-hover:${c.accentHover};` +
  `--highlight:${c.highlight};--focus:${c.highlight};--smoke:${c.smoke};`;

const find = id => PALETTES.find(p => p.id === id);

// Preview from the address only; runs once, before React's first paint.
(function preview() {
  let q;
  try { q = new URLSearchParams(location.search); } catch (e) { return; }
  const day = find(q.get('day') || q.get('palette')), night = find(q.get('night') || q.get('palette'));
  if (!day && !night) return;
  let css = '';
  if (day) css += `:root{${vars(day.day)}}`;
  if (night) css += `:root[data-theme="dark"]{${vars(night.night)}}@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${vars(night.night)}}}`;
  const el = document.createElement('style');
  el.id = 'puli-palette-preview';
  el.textContent = css;
  document.head.appendChild(el);
})();
