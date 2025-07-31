import globals from "globals"
import pluginJs from "@eslint/js"
import tseslint from "typescript-eslint"

/** @type {import('eslint').Linter.Config[]} */
export default [
  { ignores: ["dist/**/*", ".papi/**/*", "eslint.config.js"] },
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: globals.browser } },
  {
    plugins: ["eslint-plugin-tsdoc"],
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
]
