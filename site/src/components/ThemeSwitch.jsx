// Day/night switch, drawn in CSS: by day a sun on a blue sky with soft rings of light and clouds;
// by night a cratered moon on a dark sky with rings and twinkling stars. The knob slides across and changes.
export default function ThemeSwitch({ theme, onToggle }) {
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className={`dn-switch${dark ? ' is-night' : ''}`}
      role="switch"
      aria-checked={dark}
      aria-label="Night mode"
      onClick={onToggle}
    >
      <span className="dn-switch__track" aria-hidden="true">
        <span className="dn-switch__sky dn-switch__sky--day" />
        <span className="dn-switch__sky dn-switch__sky--night" />
        <span className="dn-switch__rings" />
        <span className="dn-switch__stars">
          <i className="s1" /><i className="s2" /><i className="s3" />
          <b style={{ left: '12%', top: '46%' }} /><b style={{ left: '30%', top: '30%' }} /><b style={{ left: '46%', top: '60%' }} />
          <b style={{ left: '22%', top: '74%' }} /><b style={{ left: '52%', top: '36%' }} />
        </span>
        <span className="dn-switch__clouds"><span className="c-back" /><span className="c-front" /></span>
        <span className="dn-switch__knob">
          <span className="dn-switch__sun" />
          <span className="dn-switch__moon"><i /><i /><i /></span>
        </span>
      </span>
    </button>
  );
}
