import { execSync } from "child_process"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
// Read the JSON file

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
// const packageRoot = resolve(__dirname)

const source = join(__dirname, ".papi", "polkadot-api.json")
const target = join(__dirname, "dist", "polkadot-hub-config.json")

execSync(`cp -r ${source} ${target}`, {
  stdio: "inherit",
})
