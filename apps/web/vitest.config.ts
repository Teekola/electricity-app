import { defineConfig } from "vitest/config";

import { FINNISH_TIME_ZONE } from "@repo/api-contract";

export default defineConfig({
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
    env: { NEXT_PUBLIC_API_BASE_URL: "http://localhost:3001", TZ: FINNISH_TIME_ZONE },
  },
});
