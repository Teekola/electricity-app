import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    setupFiles: ["dotenv/config"],
    env: { LOG_LEVEL: "silent" },
  },
});
