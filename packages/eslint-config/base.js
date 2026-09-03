import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import turbo from "eslint-plugin-turbo";
import globals from "globals";
import tseslint from "typescript-eslint";

export const baseConfig = defineConfig(
  globalIgnores(["dist/**", "build/**", ".next/**", "out/**", "coverage/**", ".turbo/**"]),
  js.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node } },
    plugins: { turbo, "simple-import-sort": simpleImportSort },
    rules: {
      "turbo/no-undeclared-env-vars": "error",
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^\\u0000"],
            ["^node:"],
            ["^@?\\w"],
            ["^@repo/"],
            ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
            ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
    },
  },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  prettier,
);

export default baseConfig;
