import tiger from '../assets/tiger-logo.webp';
import ThemeSwitch from './ThemeSwitch.jsx';
import StaggeredMenu from './reactbits/StaggeredMenu.jsx';
import { contactHref } from '../theme.js';
import { scrollToSection } from '../nav.js';

// Header: the tiger logo and PULI on the left, PORTFOLIO in the middle, and on the right the day/night switch next to
// the menu button (React Bits StaggeredMenu). The menu lists the four sections (no numbers); the game stays a surprise.
const go = name => e => {
  if (scrollToSection(name)) e.preventDefault();
};

export default function Header({ theme, onToggleTheme }) {
  const items = [
    { label: 'Home', ariaLabel: 'Go to the top of the page', link: '#top', onClick: go('home') },
    { label: 'About', ariaLabel: 'Go to the about section', link: '#about', onClick: go('about') },
    { label: 'Projects', ariaLabel: 'Go to my projects', link: '#work', onClick: go('work') },
    { label: 'Contact', ariaLabel: 'Open the contact page', link: contactHref(theme) },
  ];
  return (
    <>
      <header className="site-header">
        <a className="logo" href="#top" aria-label="Nuthan Puli, home" onClick={go('home')}>
          <img className="logo__tiger" src={tiger} alt="" width="218" height="300" />
          <span className="logo__word">PULI</span>
        </a>
        <p className="site-header__title">Portfolio</p>
      </header>
      <StaggeredMenu
        className="site-menu"
        isFixed
        position="right"
        items={items}
        socialItems={[{ label: 'GitHub', link: 'https://github.com/nuthanpuli02' }]}
        displaySocials
        displayItemNumbering={false}
        colors={['var(--accent)', 'var(--menu-layer)']}
        accentColor="var(--accent)"
        menuButtonColor="var(--text)"
        openMenuButtonColor="var(--text)"
        changeMenuColorOnOpen={false}
        headerExtra={<ThemeSwitch theme={theme} onToggle={onToggleTheme} />}
      />
    </>
  );
}
