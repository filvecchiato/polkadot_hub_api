import resolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import typescript from "@rollup/plugin-typescript"
import esbuild from "rollup-plugin-esbuild"
import dts from "rollup-plugin-dts"
import terser from "@rollup/plugin-terser"
import pkg from "./package.json" assert { type: "json" }
import path from "path"
import alias from "@rollup/plugin-alias"
import json from "@rollup/plugin-json"

const commonOptions = {
  input: ["src/index.ts"],
  external: (id) => !/^[./]/.test(id) && !/^@\//.test(id),
}

const absoluteAlias = alias({
  entries: [
    {
      find: "@",
      // In tsconfig this would be like `"paths": { "@/*": ["./src/*"] }`
      replacement: path.resolve("./src"),
      customResolver: resolve({
        extensions: [".js", ".ts"],
      }),
    },
  ],
})

export default [
  {
    ...commonOptions,
    output: [
      {
        dir: "dist",
        format: "esm", // ESM format
        entryFileNames: "[name].mjs",
      },
      {
        dir: "dist",
        format: "cjs", // CommonJS format
      },
    ],
    plugins: [
      absoluteAlias,
      resolve(),
      commonjs(),
      typescript(),
      terser(),
      esbuild(),
      json(),
    ],
    external: [Object.keys(pkg.dependencies || {})],
  },
  {
    ...commonOptions,
    plugins: [absoluteAlias, dts()],
    output: {
      dir: `dist`,
      format: "es",
    },
  },
]
