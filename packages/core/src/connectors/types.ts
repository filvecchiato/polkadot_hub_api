import type {
  WellKnownChainIds,
  WellknownRelayChainId,
} from "@polkadot-hub-api/types"
import { ComposedChainClass } from "@polkadot-hub-api/chain-connector"

export abstract class NetworkConnector {
  network: WellknownRelayChainId
  protected chains: Map<WellKnownChainIds, ComposedChainClass> = new Map()
  protected isConnected = false

  protected constructor(network: WellknownRelayChainId) {
    this.network = network
  }

  abstract connect(): Promise<void>
  abstract disconnect(): Promise<void>
  abstract loadChains(): WellKnownChainIds[]

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
