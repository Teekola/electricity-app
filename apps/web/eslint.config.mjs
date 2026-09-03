import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import globals from "globals";

import { baseConfig } from "@repo/eslint-config/base";

export default defineConfig([
  globalIgnores([".next/**", "out/**", "next-env.d.ts"]),
  ...nextVitals,
  ...nextTs,
  // Shared repo rules last, so eslint-config-prettier keeps the final word on
  // formatting rules.
  ...baseConfig,
  {
    // Next runs this code in the browser as well as on the server.
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
]);
