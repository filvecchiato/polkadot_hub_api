import {
  type WellKnownChainIds,
  type WellknownRelayChainId,
} from "@polkadot-hub-api/types"
import { NetworkConnector } from "./types"
// import { getWsProvider as WebWsProvider } from "polkadot-api/ws-provider/web"
import { ChainRegistry } from "../registry/ChainRegistry"

// TODO generate instance with a client depening on network and type
import { LoggerFactory } from "@polkadot-hub-api/utils"

const log = LoggerFactory.getLogger()

export class WsHubConnector extends NetworkConnector {
  private static instances = new Map<string, WsHubConnector>()

  private status = "disconnected"

  protected constructor(network: WellknownRelayChainId) {
    super(network)
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

  loadChains(): WellKnownChainIds[] {
    // load chains from the registry

    // get all chains for the network
    // TODO: implement this
    return []
  }

  async disconnect(): Promise<void> {
    log.info(`[${this.network}] Disconnecting Substrate Connect...`)

    if (this.status === "disconnected" && this.chains.size === 0) {
      return
    }
    // destroy client and chains
    this.chains.forEach((chain) => {
      ChainRegistry.removeChain(chain.chainInfo.id)
    })

    this.status = "disconnected"
  }

  getStatus(): string {
    return this.status
  }

  static getInstance(network: WellknownRelayChainId): WsHubConnector {
    if (!this.instances.has(network)) {
      this.instances.set(network, new WsHubConnector(network))
    }
    return this.instances.get(network)!
  }
}
