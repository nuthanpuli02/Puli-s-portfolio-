// Day/night switch: a pill track with a sliding knob. By day the knob is a sun on a silver track;
// by night it turns into a crescent moon on a navy track with a few stars.
export default function ThemeSwitch({ theme, onToggle }) {
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className={`theme-switch${dark ? ' is-dark' : ''}`}
      role="switch"
      aria-checked={dark}
      aria-label="Night mode"
      onClick={onToggle}
    >
      <span className="theme-switch__track" aria-hidden="true">
        <span className="theme-switch__label theme-switch__label--day">Day</span>
        <span className="theme-switch__label theme-switch__label--night">Night</span>
        <span className="theme-switch__stars">
          <i style={{ left: '22%', top: '30%' }} /><i style={{ left: '34%', top: '64%' }} /><i style={{ left: '14%', top: '58%' }} />
        </span>
        <span className="theme-switch__knob">
          <span className="theme-switch__crater" />
        </span>
      </span>
    </button>
  );
}
