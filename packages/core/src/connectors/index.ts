export * from "./WebSocketConnector"
export * from "./types"
export * from "./SmoldotConnector"

import type {
  WellKnownChainIds,
  WellknownRelayChainId,
  WellknownParachainId,
} from "@polkadot-hub-api/types"
import { ComposedChainClass } from "@polkadot-hub-api/chain-connector"

import { wellKnownChains } from "@polkadot-hub-api/types"
import { ChainRegistry } from "../registry/ChainRegistry"
import { enhanceWithApis } from "@/mixins"

export class PolkadotHubApi {
  network: WellknownRelayChainId
  protected chains: Map<WellKnownChainIds, ComposedChainClass> = new Map()
  protected isConnected = false

  constructor(network?: WellknownRelayChainId) {
    this.network = network ?? "polkadot"

    this.loadChains()

    return enhanceWithApis<PolkadotHubApi>(this)
  }

  connect(): Promise<void> {
    return new Promise((resolve) => {
      this.isConnected = true
      // Simulate loading chains
      this.loadChains()
      resolve()
    })
  }
  disconnect(): Promise<void> {
    return new Promise((resolve) => {
      this.isConnected = false
      this.chains.clear()
      resolve()
    })
  }

  private loadChains(): WellKnownChainIds[] {
    const networkChains = Object.keys(
      wellKnownChains[this.network][1],
    ) as WellknownParachainId[]
    // first load relay chain
    const relay = wellKnownChains[this.network][0]()

    const relayChain = ChainRegistry.get(relay.info.id)

    if (!relayChain) {
      throw new Error(`Relay chain ${relay.info.id} not found in registry.`)
    }

    networkChains.forEach((parachain) => {
      const chainConnector = ChainRegistry.get(parachain)
      if (!chainConnector) {
        throw new Error(`Parachain ${parachain} not found in registry.`)
      }

      this.chains.set(parachain, chainConnector)
    })

    return Array.from(this.chains.keys())
  }

  getChain(chainId: WellKnownChainIds): ComposedChainClass | undefined {
    return this.chains.get(chainId)
  }

  getStatus(): string {
    return this.isConnected ? "connected" : "disconnected"
  }

  getChains(): WellKnownChainIds[] {
    return [...this.chains.keys()]
  }
}
