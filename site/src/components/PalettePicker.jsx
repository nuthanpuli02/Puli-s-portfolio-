import { PALETTES } from '../palettes.js';

// Temporary palette preview. Each dot shows the palette's day colour (left half), night colour (right half)
// and accent (centre). Removed once a palette is chosen.
export default function PalettePicker({ palette, onChoose }) {
  return (
    <div className="palette-picker" role="radiogroup" aria-label="Colour palette preview">
      <span className="palette-picker__name" aria-live="polite">{palette.name}</span>
      <div className="palette-picker__dots">
        {PALETTES.map(p => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={p.id === palette.id}
            aria-label={p.name}
            title={p.name}
            className="palette-picker__dot"
            style={{ '--d': p.day.bg, '--n': p.night.bg, '--a': p.day.accent }}
            onClick={() => onChoose(p.id)}
          />
        ))}
      </div>
    </div>
  );
}
