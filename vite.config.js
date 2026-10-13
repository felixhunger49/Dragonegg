import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build`         -> dist/ for the website (chunks load on demand)
// `npm run build:single`  -> dist-single/index.html, everything in one file (for the Claude artifact)
export default defineConfig(({ mode }) => mode === 'single'
  ? { base: './', plugins: [viteSingleFile()], build: { outDir: 'dist-single' } }
  : { base: './', build: { outDir: 'dist', chunkSizeWarningLimit: 800 } });
