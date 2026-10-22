import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Builds into ../v2 (served by GitHub Pages at /v2/). Relative base so it works under any sub-path.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: '../v2', emptyOutDir: true, assetsInlineLimit: 0 }
});
