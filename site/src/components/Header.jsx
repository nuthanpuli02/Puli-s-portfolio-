import tigerSvg from '../assets/tiger-logo.svg?raw';
import ThemeSwitch from './ThemeSwitch.jsx';
import { contactHref } from '../theme.js';

export default function Header({ theme, onToggleTheme }) {
  return (
    <>
      <header className="site-header">
        <a className="logo" href="#top" aria-label="Nuthan Puli, home">
          <span className="logo__tiger" aria-hidden="true" dangerouslySetInnerHTML={{ __html: tigerSvg }} />
        </a>
        <p className="site-header__title">Portfolio</p>
        <a className="btn btn-primary" href={contactHref(theme)}>Contact</a>
      </header>
      <div className="theme-switch-slot">
        <ThemeSwitch theme={theme} onToggle={onToggleTheme} />
      </div>
    </>
  );
}
