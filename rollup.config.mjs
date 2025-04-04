import resolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import typescript from "@rollup/plugin-typescript"
import esbuild from "rollup-plugin-esbuild"
import dts from "rollup-plugin-dts"
import { terser } from "rollup-plugin-terser"
import pkg from "./package.json" assert { type: "json" }

export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.esm.js",
        format: "esm", // ESM format
        inlineDynamicImports: true,
      },
      {
        file: "dist/index.cjs.js",
        format: "cjs", // CommonJS format
        inlineDynamicImports: true,
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json", // Ensure this points to the correct tsconfig
        declaration: false, // Do not generate declaration files during bundling
        module: "ESNext",
        exclude: [
          "**/.husky/**",
          "vitest.config.ts",
          "vitest.setup.ts",
          "tsconfig.ts",
          "rollup.config.mjs",
          "src/**/*.spec.ts",
        ],
      }),
      terser(),
      esbuild(),
    ],
    external: [Object.keys(pkg.dependencies || {})],
  },
  {
    input: "src/index.ts",
    plugins: [
      dts({
        tsconfig: "./tsconfig.json", // Ensure this points to the correct tsconfig
      }),
    ],
    output: {
      file: `dist/index.d.ts`,
      format: "es",
    },
  },
]
