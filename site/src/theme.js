import { useCallback, useEffect, useState } from 'react';

// Light is the default; dark follows the system until the visitor picks one (remembered as "puli-theme").
const systemDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
const current = () => {
  const t = document.documentElement.dataset.theme;
  return t === 'light' || t === 'dark' ? t : systemDark() ? 'dark' : 'light';
};

export function useTheme() {
  const [theme, setTheme] = useState(current);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onChange = () => setTheme(current());
    mq?.addEventListener('change', onChange);
    return () => mq?.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback(() => {
    const next = current() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('puli-theme', next); } catch (e) { /* private mode */ }
    setTheme(next);
  }, []);

  return [theme, toggle];
}

// the contact page is a separate page and takes the theme in its address
export const contactHref = theme => `../contact.html?theme=${theme === 'dark' ? 'night' : 'day'}`;
