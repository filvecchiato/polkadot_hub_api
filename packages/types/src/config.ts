import { ChainDefinition } from "polkadot-api"
import { JsonRpcProvider } from "polkadot-api/ws-provider/node"

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
