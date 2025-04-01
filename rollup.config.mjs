import json from "@rollup/plugin-json"
import resolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import typescript from "@rollup/plugin-typescript"

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/index.esm.js",
      format: "esm", // ESM format
      sourcemap: true,
      inlineDynamicImports: true,
    },
    {
      file: "dist/index.cjs.js",
      format: "cjs", // CommonJS format
      sourcemap: true,
      inlineDynamicImports: true,
    },
  ],
  plugins: [resolve(), commonjs(), typescript(), json()],
}
