import { Client } from "polkadot-api/smoldot"
import type { ChainId, ChainIdRelay } from "../chains/types"
import { ChainConnector } from "../chains"

export abstract class NetworkConnector {
  network: ChainIdRelay
  client: Client | null = null
  protected chains: Map<ChainId, ChainConnector> = new Map()
  protected isConnected = false

  protected constructor(network: ChainIdRelay, client?: Client) {
    this.network = network
    this.client = client || null
  }

  abstract connect(): Promise<void>
  abstract disconnect(): Promise<void>
  abstract loadChains(): Promise<string[]>

  getChain(chainId: ChainId): ChainConnector | undefined {
    return this.chains.get(chainId)
  }

  getStatus(): string {
    return this.isConnected ? "connected" : "disconnected"
  }

  getChains(): string[] {
    return [...this.chains.keys()]
  }
}
