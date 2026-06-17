import { defineConfig } from 'vite';

// Tauri expects a fixed port during dev and a relative base for the bundled app.
export default defineConfig({
  base: './',
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
  },
});
