import { PolkadotClient } from "polkadot-api"
import type {
  ChainDescriptorOf,
  ChainId,
  TChain,
  WellKnownChainIds,
} from "@polkadot-hub-api/types"
import { ChainConnector } from "@polkadot-hub-api/chain-connector"

export class ChainRegistry {
  private static registry = new Map<string, ChainConnector>()

  static async set(
    info: TChain,
    client: PolkadotClient,
    descriptors: ChainDescriptorOf<ChainId>,
  ): Promise<ChainConnector> {
    if (this.registry.has(info.id)) {
      return this.registry.get(info.id)!
    }

    const chain = await ChainConnector.init(info, client, descriptors)

    return chain
  }

  static get(chainName: string): ChainConnector | undefined {
    return this.registry.get(chainName)
  }

  static listChains(): string[] {
    return [...this.registry.keys()]
  }

  static removeChain(chainId: WellKnownChainIds) {
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
