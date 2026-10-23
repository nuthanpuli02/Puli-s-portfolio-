import { useEffect, useRef, useState } from 'react';
import CircularText from './reactbits/CircularText.jsx';
import { getTarget } from '../nav.js';

// The section badge (React Bits CircularText), fixed in the bottom-right corner on every section. Its ring names the
// section ("SECTION 01 ✦ HOMEPAGE ✦ …") with the number in the middle, and it turns with the page's scroll, exactly in
// step: scrolling down turns it clockwise, scrolling back up turns it back. It never spins on its own.
const SECTIONS = [
  { n: '01', name: 'Homepage' },
  { n: '02', name: 'About' },
  { n: '03', name: 'Projects' },
  { n: '05', name: '???' }, // the game; section 04 is the contact page, a separate page
];
const DEG_PER_PX = 0.09;

function sectionAt(y) {
  const vh = window.innerHeight;
  const aboutStart = getTarget('aboutStart'), panMid = getTarget('panMid'), end = getTarget('end');
  if (aboutStart == null || y < aboutStart - vh * 0.5) return 0;
  if (y < panMid) return 1;
  if (y < end + vh * 0.3) return 2;
  return 3;
}

export default function SectionBadge() {
  const spinRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(0); // the section whose name is on the ring (changes after a short fade)
  const [fading, setFading] = useState(false);

  useEffect(() => {
    let raf = 0;
    const frame = () => {
      raf = 0;
      const y = window.scrollY;
      if (spinRef.current) spinRef.current.style.transform = `rotate(${(y * DEG_PER_PX).toFixed(2)}deg)`;
      setIndex(sectionAt(y));
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick);
    kick();
    const late = setTimeout(kick, 300); // the section offsets register after the first render
    return () => { cancelAnimationFrame(raf); clearTimeout(late); window.removeEventListener('scroll', kick); window.removeEventListener('resize', kick); };
  }, []);

  // when the section changes, fade the ring out, swap the words, fade back in
  useEffect(() => {
    if (index === shown) return undefined;
    setFading(true);
    const id = setTimeout(() => { setShown(index); setFading(false); }, 220);
    return () => clearTimeout(id);
  }, [index, shown]);

  const s = SECTIONS[shown];
  const label = `SECTION ${s.n} ✦ ${s.name.toUpperCase()} ✦ `;
  return (
    <div className={`sbadge${fading ? ' is-fading' : ''}`} aria-hidden="true">
      <div className="sbadge__spin" ref={spinRef}>
        <CircularText text={label} repeat={2} spinDuration={0} onHover="pause" size={116} fontSize={9.5} fontWeight={700} />
      </div>
      <span className="sbadge__num">{s.n}</span>
    </div>
  );
}
