import { defineConfig, devices } from "@playwright/test";

const API_PORT = 3101;
const WEB_PORT = 3100;

const API_BASE_URL = `http://localhost:${String(API_PORT)}`;
const WEB_BASE_URL = `http://localhost:${String(WEB_PORT)}`;

const DATABASE_URL = "postgresql://academy:academy@localhost:5432/electricity";

const isCi = Boolean(process.env["CI"]);

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: WEB_BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "pnpm --filter @repo/api start",
      url: `${API_BASE_URL}/health`,
      reuseExistingServer: !isCi,
      env: { PORT: String(API_PORT), DATABASE_URL, LOG_LEVEL: "warn" },
    },
    {
      command: "pnpm --filter @repo/web start",
      url: WEB_BASE_URL,
      reuseExistingServer: !isCi,
      env: { PORT: String(WEB_PORT), NEXT_PUBLIC_API_BASE_URL: API_BASE_URL },
    },
  ],
});
