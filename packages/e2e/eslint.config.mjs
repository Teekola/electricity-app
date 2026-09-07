import { defineConfig, globalIgnores } from "eslint/config";

import { playwrightConfig } from "@repo/eslint-config/playwright";

export default defineConfig([
  globalIgnores(["playwright-report/**", "test-results/**"]),
  ...playwrightConfig,
]);
