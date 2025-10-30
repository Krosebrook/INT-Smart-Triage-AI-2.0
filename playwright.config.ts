import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/playwright",
  fullyParallel: true,
  retries: 0,
  use: {
    trace: "on-first-retry",
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4173",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
