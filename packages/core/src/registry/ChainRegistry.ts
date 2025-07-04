import { PolkadotClient } from "polkadot-api"
import type { ChainId, TChain } from "@polkadot-hub-api/types"
import { ChainConnector } from "@polkadot-hub-api/chain-connector"

export class ChainRegistry {
  private static registry = new Map<string, ChainConnector>()

  static set<T extends ChainConnector>(info: TChain, client: PolkadotClient) {
    if (this.registry.has(info.id)) {
      return this.registry.get(info.id)! as T
    }

    // TODO: update this method and return the correct chain
    const chain = ChainConnector.init(info, client)

    return chain
  }

  static get(chainName: string): ChainConnector | undefined {
    return this.registry.get(chainName)
  }

  static listChains(): string[] {
    return [...this.registry.keys()]
  }

  static removeChain(chainId: ChainId) {
    this.registry.get(chainId)?.client.destroy()
    return this.registry.delete(chainId)
  }

  static clear() {
    this.registry.forEach((chain) => {
      return chain.client.destroy()
    })

    return this.registry.clear()
  }
}
