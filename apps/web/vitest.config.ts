import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
    // `lib/env.ts` parses at import, so every test file importing it needs a valid value.
    env: { NEXT_PUBLIC_API_BASE_URL: "http://localhost:3001" },
  },
});
