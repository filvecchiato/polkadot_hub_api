import type {
  ChainId,
  WellKnownChainIds,
  WellknownParachainId,
  WellknownRelayChainId,
} from "@polkadot-hub-api/types"
import { NetworkConnector } from "./types"
// import { startFromWorker as webStartFromWorker } from "polkadot-api/smoldot/from-worker"
// import { Worker as ThreadWorker } from "worker_threads"
// import { startFromWorker as NodeStartFromWorker } from "polkadot-api/smoldot/from-node-worker"
// import { fileURLToPath } from "url"
import { ChainRegistry } from "../registry/ChainRegistry"
// import { resolve } from "import-meta-resolve"

import { wellKnownChains } from "@polkadot-hub-api/types"
import { LoggerFactory } from "@polkadot-hub-api/utils"

const log = LoggerFactory.getLogger()

export class lighClientConnector extends NetworkConnector {
  private static instances = new Map<ChainId, lighClientConnector>()

  private status = "disconnected"

  protected constructor(network: WellknownRelayChainId) {
    super(network)
  }

  static getType(): string {
    return "lightClient"
  }

  async connect(): Promise<void> {
    // load all chains needed, set them up in the registry

    if (this.status === "connected" && this.chains.size > 0) {
      return
    }

    this.loadChains()
    this.status = "connected"
    return
  }

  loadChains(): WellKnownChainIds[] {
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

  async disconnect(): Promise<void> {
    log.info(`[${this.network}] Disconnecting Substrate Connect...`)

    if (this.status === "disconnected" && this.chains.size === 0) {
      return
    }

    this.chains.forEach((chain) => {
      ChainRegistry.removeChain(chain.chainInfo.id)
    })

    this.status = "disconnected"
  }

  getStatus(): string {
    return this.status
  }

  //   TODO make sure it tests for browser environments
  static getInstance(network: WellknownRelayChainId): lighClientConnector {
    if (!this.instances.has(network)) {
      // if (typeof window === "undefined") {
      //   resolve("polkadot-api/smoldot/node-worker", import.meta.url).then(
      //     (resolvedUrl) => {
      //       // const smClient = NodeStartFromWorker(
      //       //   new ThreadWorker(fileURLToPath(resolvedUrl)),
      //       // )
      //       this.instances.set(network, new lighClientConnector(network))
      //     },
      //   )
      // } else {
      //   // const smClient = webStartFromWorker(
      //   //   new Worker(new URL("polkadot-api/smoldot/worker", import.meta.url)),
      //   // )
      // }
      this.instances.set(network, new lighClientConnector(network))
    }
    return this.instances.get(network)!
  }
}
