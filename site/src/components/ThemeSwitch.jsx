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
        <span className="dn-switch__rings dn-switch__rings--day" />
        <span className="dn-switch__rings dn-switch__rings--night" />
        <span className="dn-switch__stars">
          <i className="s1" /><i className="s2" /><i className="s3" />
          <b style={{ left: '9%', top: '52%' }} /><b style={{ left: '35%', top: '54%' }} /><b style={{ left: '43%', top: '24%' }} />
          <b style={{ left: '54%', top: '54%' }} /><b style={{ left: '22%', top: '22%' }} />
          <u style={{ left: '27%', top: '76%' }} /><u style={{ left: '47%', top: '40%' }} />
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
