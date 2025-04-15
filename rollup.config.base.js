import resolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import typescript from "@rollup/plugin-typescript"
// import esbuild from "rollup-plugin-esbuild"
// import dts from "rollup-plugin-dts"
// import terser from "@rollup/plugin-terser"
// import pkg from "./package.json" assert { type: "json" }
// import path from "path"
// import alias from "@rollup/plugin-alias"
import { defineConfig } from "rollup"

export default defineConfig({
  plugins: [resolve(), commonjs(), typescript({ tsconfig: "./tsconfig.json" })],
  external: (id) => !id.startsWith(".") && !id.startsWith("/"),
})
// const commonOptions = {
//   input: "src/index.ts",
//   external: (id) => !/^[./]/.test(id) && !/^@\//.test(id),
// }

// const absoluteAlias = alias({
//   entries: [
//     {
//       find: "@",
//       // In tsconfig this would be like `"paths": { "@/*": ["./src/*"] }`
//       replacement: path.resolve("./src"),
//       customResolver: resolve({
//         extensions: [".js", ".ts"],
//       }),
//     },
//   ],
// })

// export default [
//   {
//     ...commonOptions,
//     output: [
//       {
//         file: "dist/esm",
//         format: "esm", // ESM format
//         entryFileNames: "[name].mjs",
//         sourcemap: true,
//         preserveModules: true,
//       },
//       {
//         file: "dist/index.js",
//         format: "cjs", // CommonJS format
//         sourcemap: true,
//       },
//     ],
//     plugins: [
//       absoluteAlias,
//       // resolve(),
//       commonjs(),
//       // typescript({
//       //   tsconfig: "./tsconfig.json", // Ensure this points to the correct tsconfig
//       //   declaration: false, // Do not generate declaration files during bundling
//       //   module: "ESNext",
//       //   exclude: [
//       //     "**/.husky/**",
//       //     "vitest.config.ts",
//       //     "vitest.setup.ts",
//       //     "tsconfig.ts",
//       //     "rollup.config.mjs",
//       //     "src/**/*.spec.ts",
//       //   ],
//       // }),
//       // terser(),
//       esbuild(),
//     ],
//     external: [Object.keys(pkg.dependencies || {})],
//   },
//   {
//     ...commonOptions,
//     plugins: [absoluteAlias, dts()],
//     output: {
//       file: `dist/index.d.ts`,
//       format: "es",
//     },
//   },
// ]
