import { defineConfig } from '@playwright/test';

/**
 * End-to-end tests of the key admin flows, against a real API on its own
 * database (see e2e/start-api.mjs). Needs `npm run db` running in Gigspot-api.
 * Uses the Microsoft Edge already installed on Windows (set E2E_BROWSER_CHANNEL
 * to "chrome", or to "" for Playwright's own Chromium).
 */
const API_PORT = 8100;
const PANEL_PORT = 5175;

export default defineConfig({
  testDir: './e2e',
  // One signed-in staff member walks through the flows in order (TOTP codes are single-use).
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${PANEL_PORT}`,
    channel: process.env.E2E_BROWSER_CHANNEL ?? 'msedge',
    viewport: { width: 1280, height: 800 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'node e2e/start-api.mjs',
      url: `http://127.0.0.1:${API_PORT}/api/admin/auth/status/`,
      // Answers 401 without a token; Playwright counts 2xx-403 as up.
      timeout: 240_000,
      reuseExistingServer: false,
      stdout: 'pipe',
    },
    {
      command: `npx vite --port ${PANEL_PORT} --strictPort --host 127.0.0.1`,
      url: `http://127.0.0.1:${PANEL_PORT}/login`,
      env: { GIGSPOT_API: `http://127.0.0.1:${API_PORT}` },
      timeout: 60_000,
      reuseExistingServer: false,
    },
  ],
});
