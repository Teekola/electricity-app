import baseConfig from "../../.prettierrc.json" with { type: "json" };

/** @type {import("prettier").Config} */
const config = {
  ...baseConfig,
  plugins: [import.meta.resolve("prettier-plugin-tailwindcss")],
  tailwindStylesheet: "./app/globals.css",
  tailwindFunctions: ["cn", "cva"],
};

export default config;
