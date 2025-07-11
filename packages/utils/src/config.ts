import { ChainConfig, LogLevel, Config } from "@polkadot-hub-api/types"

export function defineConfig({
  chains,
  logging,
}: Config): Record<string, ChainConfig> {
  //  add chains to ChainRegistry and then continue

  // receives all data necessary when creating client
  return ConfigRegistry.setConfig(chains, logging)
}

export class ConfigRegistry {
  private static chainsConfig: Record<string, ChainConfig> | undefined
  private static loggingConfig:
    | {
        defaultLogLevel?: LogLevel
        loggers?: Record<string, LogLevel>
      }
    | undefined

  static setConfig(
    chains: Record<string, ChainConfig>,
    logging?: {
      defaultLogLevel?: LogLevel
      loggers?: Record<string, LogLevel>
    },
  ): Record<string, ChainConfig> {
    // read from file (search hubApi.congfig.ts in the root directory)
    if (!this.chainsConfig) {
      this.chainsConfig = chains
    }

    if (!this.loggingConfig && logging) {
      this.loggingConfig = logging
    }

    return this.chainsConfig
  }

  static get config(): Record<string, ChainConfig> {
    if (!this.chainsConfig) {
      throw new Error("Configuration not set. Call defineConfig() first.")
    }
    return this.chainsConfig as Record<string, ChainConfig>
  }

  static get logConfig():
    | {
        defaultLogLevel?: LogLevel
        loggers?: Record<string, LogLevel>
      }
    | undefined {
    if (!this.loggingConfig) {
      return {
        defaultLogLevel: LogLevel.INFO, // Default log level if not set
      }
    }
    return this.loggingConfig
  }
}
