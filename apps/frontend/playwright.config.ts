import { defineConfig, devices } from '@playwright/test';

const BACKEND_PORT = 3101;
const FRONTEND_PORT = 3100;
const isCI = Boolean(process.env.CI);

// Both apps read the rest of their env (DB, secrets) from their .env files
// locally, and from the job's environment in CI.
export default defineConfig({
  testDir: 'e2e',
  testMatch: '*.e2e.ts',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }],
  webServer: [
    {
      command: 'bun src/main.ts',
      cwd: '../backend',
      url: `http://localhost:${BACKEND_PORT}/health`,
      // Not `test`: Bun would load .env.test, which points at the CI database.
      env: { PORT: String(BACKEND_PORT), NODE_ENV: 'development' },
      reuseExistingServer: !isCI,
    },
    {
      command: `bun --bun next start --port ${FRONTEND_PORT}`,
      url: `http://localhost:${FRONTEND_PORT}`,
      // Playwright sets NODE_ENV=test, under which Next skips .env.local.
      env: {
        BACKEND_URL: `http://localhost:${BACKEND_PORT}`,
        NODE_ENV: 'production',
      },
      reuseExistingServer: !isCI,
    },
  ],
});
