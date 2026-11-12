import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import globals from "globals";

export default defineConfig([
  globalIgnores([".next/**", "out/**", "build/**"]),
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^[A-Z]",
          argsIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],
    },
  },
]);
