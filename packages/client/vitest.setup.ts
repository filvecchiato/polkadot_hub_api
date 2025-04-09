import { vi } from "vitest"
import { createRequire } from "node:module"

vi.stubGlobal("globalCreateRequire", createRequire)
