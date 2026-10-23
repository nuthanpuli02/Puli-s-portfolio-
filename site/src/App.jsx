import Header from './components/Header.jsx';
import Hero from './sections/Hero.jsx';
import Clouds from './sections/Clouds.jsx';
import SectionBadge from './components/SectionBadge.jsx';
import { useTheme } from './theme.js';
import './palettes.js'; // saved palettes; only used for ?day=/&night= previews

export default function App() {
  const [theme, toggleTheme] = useTheme();
  return (
    <>
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <main>
        <Hero theme={theme} />
        <Clouds theme={theme} />
        <section className="next-placeholder" id="game" aria-label="Game (coming later)">
          <p>Game teaser · coming later</p>
        </section>
      </main>
      <SectionBadge />
    </>
  );
}
