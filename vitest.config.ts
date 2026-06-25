import { defineConfig } from 'vitest/config';

/**
 * Root Vitest config. Vitest runs the *unit* suites across all workspaces.
 * The end-to-end specs under tests/e2e are driven by Playwright (its own
 * runner + config at tests/e2e/playwright.config.ts) and must be excluded here,
 * otherwise Vitest tries to load `@playwright/test` and fails.
 */
export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.yarn/**',
      'tests/e2e/**',
    ],
  },
});
