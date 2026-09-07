import { defineConfig } from "eslint/config";
import playwright from "eslint-plugin-playwright";

import { baseConfig } from "./base.js";

export const playwrightConfig = defineConfig(...baseConfig, {
  files: ["**/*.{ts,tsx}"],
  extends: [playwright.configs["flat/recommended"]],
  rules: {
    "playwright/no-conditional-in-test": "error",
    "playwright/no-wait-for-timeout": "error",
    "playwright/prefer-web-first-assertions": "error",
  },
});

export default playwrightConfig;
