import { defineConfig } from '@playwright/test';

// End-to-end tests drive the built desktop shell (Tauri webview / Vite preview).
// Runs on a provisioned runner with the UI built; not exercised in offline CI.
export default defineConfig({
  testDir: './specs',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.B2030B_URL ?? 'http://localhost:1420',
    trace: 'on-first-retry',
    // Default-deny: tests must explicitly grant permissions they need.
    permissions: [],
  },
  reporter: [['list'], ['json', { outputFile: 'e2e-report.json' }]],
});
