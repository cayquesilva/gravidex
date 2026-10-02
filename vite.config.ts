import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  // Caminhos relativos: o dist/ funciona na raiz (Netlify/Vercel) e em subpasta (GitHub Pages).
  base: './',
  build: {
    rollupOptions: {
      input: {
        surpresa: resolve(import.meta.dirname, 'index.html'),
        criar: resolve(import.meta.dirname, 'criar/index.html'),
      },
    },
  },
  test: {
    include: ['tests/*.test.ts'],
  },
});
