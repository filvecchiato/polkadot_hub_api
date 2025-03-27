import globals from "globals"
import pluginJs from "@eslint/js"
import tseslint from "typescript-eslint"

/** @type {import('eslint').Linter.Config[]} */
export default [
  { ignores: ["dist/**/*", ".papi/**/*", "eslint.config.js"] },
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  // { plugins: ["babel-plugin-transform-import-meta"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
]
