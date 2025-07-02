import { ChainDefinition } from "polkadot-api"
import { JsonRpcProvider } from "polkadot-api/ws-provider/node"

export type ChainConfig = {
  readonly descriptor: ChainDefinition
  readonly provider: JsonRpcProvider
}

export function defineConfig(
  chainsDefinitions: Record<string, ChainConfig>,
): Record<string, ChainConfig> {
  return ConfigRegistry.setConfig(chainsDefinitions)
}

export class ConfigRegistry {
  private static chainsConfig: Record<string, ChainConfig>

  static setConfig(
    chains: Record<string, ChainConfig>,
  ): Record<string, ChainConfig> {
    // read from file (search hubApi.congfig.ts in the root directory)
    if (!this.chainsConfig) {
      this.chainsConfig = chains
    }
    return this.chainsConfig
  }

  static get config(): Record<string, ChainConfig> {
    if (!this.chainsConfig) {
      throw new Error("Configuration not set. Call setConfig() first.")
    }
    return this.chainsConfig as Record<string, ChainConfig>
  }
}
