import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { ignores: ["coverage/**", "node_modules/**", "dist/**"] },

  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  {
    files: ["tests/**/*.{js,mjs}", "**/*.test.{js,mjs}", "**/*.spec.{js,mjs}"],
    languageOptions: {
      globals: {
        ...globals.jest
      }
    }
  }
]);
