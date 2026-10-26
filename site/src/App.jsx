import Header from './components/Header.jsx';
import Hero from './sections/Hero.jsx';
import Clouds from './sections/Clouds.jsx';
import { useRef, useState } from 'react';
import Teaser from './sections/Teaser.jsx';
import Forest from './sections/Forest.jsx';
import { holdScroll } from './scrollHold.js';
import SectionBadge from './components/SectionBadge.jsx';
import { useTheme } from './theme.js';
import './palettes.js'; // saved palettes; only used for ?day=/&night= previews

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const forestRef = useRef(null);
  const [forestOpen, setForestOpen] = useState(false);
  return (
    <>
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <main>
        <Hero theme={theme} />
        <Clouds theme={theme} />
        <Teaser theme={theme} forestRef={forestRef} onOpenForest={() => setForestOpen(true)} />
        <Forest ref={forestRef} theme={theme} open={forestOpen} onLanded={() => holdScroll(false)} />
      </main>
      <SectionBadge />
    </>
  );
}
