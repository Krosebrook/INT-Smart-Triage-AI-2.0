import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT ? Number(process.env.PORT) : 4173;

export default defineConfig({
  testDir: './test/e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  retries: process.env.CI ? 2 : 0,
  fullyParallel: true,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 120_000,
  },
});
