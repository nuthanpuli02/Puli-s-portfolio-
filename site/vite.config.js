import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Builds the site into the repo root (index.html + app/), which GitHub Pages serves at the plain address. The contact
// page (contact.html, assets/) also lives there, so the root isn't emptied; `npm run build` clears only ../app first.
// Relative base so it works under any sub-path.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: '..', emptyOutDir: false, assetsDir: 'app', assetsInlineLimit: 0 }
});
