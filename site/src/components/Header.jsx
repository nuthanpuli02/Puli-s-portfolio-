import tiger from '../assets/tiger-logo.webp';
import ThemeSwitch from './ThemeSwitch.jsx';
import { contactHref } from '../theme.js';

export default function Header({ theme, onToggleTheme }) {
  return (
    <>
      <header className="site-header">
        <a className="logo" href="#top" aria-label="Nuthan Puli, home">
          <img className="logo__tiger" src={tiger} alt="" width="218" height="300" />
          <span className="logo__word">PULI</span>
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
