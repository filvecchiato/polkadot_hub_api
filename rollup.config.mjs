import resolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import typescript from "@rollup/plugin-typescript"
import esbuild from "rollup-plugin-esbuild"
import dts from "rollup-plugin-dts"

export default [
  {
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
    plugins: [
      resolve({ extensions: [".ts", ".js"] }),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json", // Ensure this points to the correct tsconfig
        declaration: false, // Do not generate declaration files during bundling
        module: "ESNext",
      }),
      esbuild(),
    ],
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
