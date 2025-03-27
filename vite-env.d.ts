declare const __vite_ssr_import_meta__: { resolve?: (path: string) => string }

declare function globalCreateRequire(url: string): NodeRequire

function globalCreateRequire(url: string) {
  import { createRequire } from "module"
  return createRequire(url)
}
