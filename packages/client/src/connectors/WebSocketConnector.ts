import { Client } from "polkadot-api/smoldot"
import type { ChainId, ChainIdRelay } from "@polkadot-hub-api/chain-connector"
import { NetworkConnector } from "./types"
import { WellKnownChains } from "./utils"
import { createClient } from "polkadot-api"
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat"
import { getWsProvider as NodeWsProvider } from "polkadot-api/ws-provider/node"
// import { getWsProvider as WebWsProvider } from "polkadot-api/ws-provider/web"
import { ChainRegistry } from "../registry/ChainRegistry"

// TODO generate instance with a client depening on network and type

export class WsHubConnector extends NetworkConnector {
  private static instances = new Map<string, WsHubConnector>()

  private status = "disconnected"

  protected constructor(network: ChainIdRelay, client?: Client) {
    super(network, client)
  }

  static getType(): string {
    return "websocket"
  }

  async connect(): Promise<void> {
    // load chains in registry and return
    if (this.status === "connected" && this.chains.size > 0) {
      return
    }

    await this.loadChains()
    this.status = "connected"
    return
  }

  async loadChains(): Promise<string[]> {
    // load chains from the registry

    // get all chains for the network
    const chains = Object.entries(WellKnownChains).filter(([, val]) => {
      return val.network === this.network
    })

    for (const [chainId, { info }] of chains) {
      if (!info.wsUrl.length) {
        console.log("No ws endpoints found for chain")
        continue
      }

      const chainClient = createClient(
        withPolkadotSdkCompat(NodeWsProvider(info.wsUrl)),
      )
      // create a client for the chain
      const chainConnector = await ChainRegistry.getOrCreate(info, chainClient)

      this.chains.set(chainId as ChainId, chainConnector)
    }
    return Array.from(this.chains.keys())
  }

  async disconnect(): Promise<void> {
    console.log(`[${this.network}] Disconnecting Substrate Connect...`)

    if (this.status === "disconnected" && this.chains.size === 0) {
      return
    }
    // destroy client and chains
    this.client?.terminate()
    this.chains.forEach((chain) => {
      ChainRegistry.removeChain(chain.chainInfo.id)
    })

    this.status = "disconnected"
  }

  getStatus(): string {
    return this.status
  }

  static getInstance(network: ChainIdRelay): WsHubConnector {
    if (!this.instances.has(network)) {
      this.instances.set(network, new WsHubConnector(network))
    }
    return this.instances.get(network)!
  }
}
