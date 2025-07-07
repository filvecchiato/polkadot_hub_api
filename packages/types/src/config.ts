import { ChainDefinition } from "polkadot-api"
import { JsonRpcProvider } from "polkadot-api/ws-provider/node"

export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  HTTP = "http",
  VERBOSE = "verbose",
  DEBUG = "debug",
  SILLY = "silly", // winston-specific TRACE equivalent
  NONE = "none",
}

export const getProviderSymbol = Symbol("getProvider")

export type LightClientProvider = {
  [getProviderSymbol]: () => JsonRpcProvider
}

export type MaybePromise<T> = T | Promise<T>

export type Gettable<T> = MaybePromise<T> | (() => MaybePromise<T>)

export type ChainConfig = {
  readonly descriptor: ChainDefinition
  readonly provider: Gettable<JsonRpcProvider | LightClientProvider>
}

export type Config = {
  chains: Record<string, ChainConfig>
  logging?: {
    defaultLogLevel?: LogLevel
    loggers?: Record<string, LogLevel>
  }
}
