import { Client } from "polkadot-api/smoldot"
import { ChainIdRelay } from "../chains/types"
import { NetworkConnector } from "./types"
import { startFromWorker as webStartFromWorker } from "polkadot-api/smoldot/from-worker"
import { Worker as ThreadWorker } from "worker_threads"
import { startFromWorker as NodeStartFromWorker } from "polkadot-api/smoldot/from-node-worker"
import { fileURLToPath } from "url"
import { WellKnownChains } from "./utils"
import { ChainRegistry } from "../registry/ChainRegistry"
import { createClient } from "polkadot-api"
import { getSmProvider } from "polkadot-api/sm-provider"
// TODO generate instance with a client depening on network and type

export class SmHubConnector extends NetworkConnector {
  private static instances = new Map<string, SmHubConnector>()

  private status = "disconnected"

  protected constructor(network: ChainIdRelay, client?: Client) {
    super(network, client)
  }

  static getType(): string {
    return "smoldot"
  }

  async connect(): Promise<void> {
    // load all chains needed, set them up in the registry

    if (this.status === "connected" && this.chains.size > 0) {
      return
    }

    await this.loadChains()
    this.status = "connected"
    return
  }

  async loadChains(): Promise<string[]> {
    // load chains from the registry
    if (!this.client) {
      throw new Error("Client is required to create a smoldot connector")
    }

    const networkChains = Object.entries(WellKnownChains).filter(([, val]) => {
      return val.network === this.network
    })
    // first load relay chain
    const relay = networkChains.find(([key]) => {
      return key === this.network
    })

    if (!relay || !relay[1].smoldot) {
      throw new Error("No relay chain found or no smoldot config available")
    }

    const smRelayChain = await this.client.addChain({
      chainSpec: relay[1].smoldot,
    })

    const client = createClient(getSmProvider(smRelayChain))

    const relayChain = await ChainRegistry.getOrCreate(relay[1].info, client)

    this.chains.set(this.network, relayChain)
    const promises = []

    for (const entry of networkChains) {
      const [chainId, { smoldot: chainSmoldot, info }] = entry

      if (!chainSmoldot || chainId === this.network) {
        continue
      }
      // TODO: once there are many chains, this might not be an option anymore
      promises.push(
        this.client!.addChain({
          chainSpec: chainSmoldot,
          potentialRelayChains: [smRelayChain],
        }).then(async (chain) => {
          const client = createClient(getSmProvider(chain))
          return await ChainRegistry.getOrCreate(info, client)
        }),
      )
    }
    const chainConnectors = await Promise.allSettled(promises)
    chainConnectors.forEach((chainConnector) => {
      if (chainConnector.status === "fulfilled") {
        this.chains.set(chainConnector.value.chainInfo.id, chainConnector.value)
      }
    })

    return Array.from(this.chains.keys())
  }

  async disconnect(): Promise<void> {
    console.log(`[${this.network}] Disconnecting Substrate Connect...`)

    if (this.status === "disconnected" && this.chains.size === 0) {
      return
    }

    this.client?.terminate()
    this.chains.forEach((chain) => {
      ChainRegistry.removeChain(chain.chainInfo.id)
    })

    this.status = "disconnected"
  }

  getStatus(): string {
    return this.status
  }

  //   TODO make sure it tests for browser environments
  static getInstance(network: ChainIdRelay): SmHubConnector {
    if (!this.instances.has(network)) {
      if (typeof window === "undefined") {
        const smClient = NodeStartFromWorker(
          new ThreadWorker(
            fileURLToPath(
              import.meta.resolve("polkadot-api/smoldot/node-worker"),
            ),
          ),
        )

        this.instances.set(network, new SmHubConnector(network, smClient))
      } else {
        const smClient = webStartFromWorker(
          new Worker(new URL("polkadot-api/smoldot/worker", import.meta.url)),
        )
        this.instances.set(network, new SmHubConnector(network, smClient))
      }
    }
    return this.instances.get(network)!
  }
}

// ONLY FOR TEST PURPOSES
if (typeof __vite_ssr_import_meta__ !== "undefined") {
  __vite_ssr_import_meta__!.resolve = (path: string) =>
    "file://" + globalCreateRequire(import.meta.url).resolve(path)
}
