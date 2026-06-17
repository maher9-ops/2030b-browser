import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Alias the workspace dependency to its source so tests run without a full
// workspace install (the offline sandbox cannot resolve `workspace:*`).
export default defineConfig({
  resolve: {
    alias: {
      '@b2030b/command-palette': fileURLToPath(
        new URL('../command-palette/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
