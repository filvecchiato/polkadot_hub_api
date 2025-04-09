import { PolkadotClient } from "polkadot-api"
import { ChainConnector } from "../chains"
import { ChainId, TChain } from "../chains/types"

export class ChainRegistry {
  private static registry = new Map<string, ChainConnector>()

  static async getOrCreate<T extends ChainConnector>(
    info: TChain,
    client?: PolkadotClient,
  ) {
    if (this.registry.has(info.id)) {
      return this.registry.get(info.id)! as T
    }

    if (!client) {
      throw new Error("Client is required to create a new chain")
    }

    const chain = ChainConnector.init(info, client)

    return chain
  }

  static get(chainName: string): ChainConnector | undefined {
    return this.registry.get(chainName)
  }

  static listChains(): string[] {
    return [...this.registry.keys()]
  }

  static removeChain(chianId: ChainId) {
    this.registry.get(chianId)?.client.destroy()
    return this.registry.delete(chianId)
  }

  static clear() {
    this.registry.forEach((chain) => {
      return chain.client.destroy()
    })

    return this.registry.clear()
  }
}
