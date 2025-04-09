import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true, // allows you to use `describe`, `it`, `expect` without importing
    coverage: {
      reporter: ["text", "html"],
    },
    setupFiles: ["./vitest.setup.ts"],
  },
})
