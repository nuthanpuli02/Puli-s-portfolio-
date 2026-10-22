import Header from './components/Header.jsx';
import Hero from './sections/Hero.jsx';
import { useTheme } from './theme.js';
import { usePalette } from './palettes.js';
import PalettePicker from './components/PalettePicker.jsx';

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const [palette, choosePalette] = usePalette();
  return (
    <>
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <main>
        <Hero theme={theme} palette={palette} />
        {/* Section 2 (into the clouds) is next; this placeholder is the smoke the hero hands over to */}
        <section className="next-placeholder" id="about" aria-label="Into the clouds (coming next)">
          <p>Section 2 · Into the clouds · coming next</p>
        </section>
        <section className="next-placeholder" id="game" aria-label="Game (coming later)">
          <p>Game teaser · coming later</p>
        </section>
      </main>
      <PalettePicker palette={palette} onChoose={choosePalette} />
    </>
  );
}
