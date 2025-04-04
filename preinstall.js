/* eslint-disable no-undef */
import { existsSync, readFileSync } from "fs"
import { execSync } from "child_process"
import { fileURLToPath } from "url"
import { dirname, join, resolve } from "path"
// Read the JSON file

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageRoot = resolve(__dirname)

const jsonPath = join(packageRoot, "dist", "polkadot-hub-config.json")
const pathMetadata = join(packageRoot, ".papi", "metadata")
const rawData = readFileSync(jsonPath, "utf-8")
const chains = JSON.parse(rawData)

if (existsSync(pathMetadata)) {
  console.log(`Chains metadata already exists, skipping metadata generation`)
  process.exit(0)
}

// Iterate over the list and run the command
Object.entries(chains.entries).forEach(([key, { chain, wsUrl }]) => {
  try {
    // TODO: check if the chain is already added
    if (!existsSync(join(pathMetadata, `${key}.scale`))) {
      console.log(`Running: papi add -n ${chain} ${key} --skip-codegen`)
      if (wsUrl) {
        execSync(`papi add -w ${wsUrl} ${key} --skip-codegen`, {
          stdio: "inherit",
        })
      } else {
        execSync(`papi add -n ${chain} ${key} --skip-codegen`, {
          stdio: "inherit",
        })
      }
    }
  } catch (error) {
    console.error(`Error adding ${key}:`, error.message)
    process.exit(1)
  }
})

console.log("✅ Preinstall script completed successfully!")
