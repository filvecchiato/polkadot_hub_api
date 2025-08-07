import { PolkadotClient, UnsafeApi } from "polkadot-api"
import type {
  ChainAsset,
  ChainDescriptorOf,
  ChainId,
  TChain,
} from "@polkadot-hub-api/types"
import { AllTypedApi, ComposedChainClass } from "@/types"
import { enhanceWithApis, enhanceWithPalletsMethods } from "./mixins"

export * from "./types"
export * from "./abstractions"

export class ChainConnector {
  private static instance: ComposedChainClass | undefined
  client: PolkadotClient
  chainInfo: TChain
  pallets: string[] = []
  descriptors: ChainDescriptorOf<ChainId>
  SS58Prefix: number
  asset: ChainAsset

  protected constructor(
    info: TChain,
    client: PolkadotClient,
    descriptors: ChainDescriptorOf<ChainId>,
    SS58Prefix: number,
    asset: ChainAsset,
    pallets: string[],
  ) {
    this.chainInfo = info
    this.client = client
    this.pallets = pallets
    this.descriptors = descriptors
    this.SS58Prefix = SS58Prefix
    this.asset = asset
  }

  static getInstance(): ChainConnector | undefined {
    if (!this.instance) {
      return undefined
    }
    return this.instance
  }

  get api(): UnsafeApi<AllTypedApi> {
    if (!this.descriptors) {
      throw new Error("ChainConnector not initialized")
    }
    return this.client.getUnsafeApi<AllTypedApi>()
  }

  static async init(
    info: TChain,
    client: PolkadotClient,
    descriptors: ChainDescriptorOf<ChainId>,
  ): Promise<ChainConnector> {
    const api = client.getUnsafeApi()
    const chainInfo = await ChainConnector.getInitChainInfo(
      client,
      api,
      descriptors,
    )

    // enhance chainConnector with mixins
    const connector = new ChainConnector(
      info,
      client,
      descriptors,
      chainInfo.SS58Prefix,
      chainInfo.asset,
      chainInfo.pallets,
    )

    const enhancedChain = enhanceWithApis(enhanceWithPalletsMethods(connector))
    this.instance = enhancedChain
    return this.instance
  }

  static async getInitChainInfo(
    client: PolkadotClient,
    api: UnsafeApi<AllTypedApi>,
    descriptors: ChainDescriptorOf<ChainId>,
  ): Promise<{
    SS58Prefix: number
    asset: ChainAsset
    pallets: string[]
  }> {
    const [{ name, properties }, SS58Prefix, wrappedStorage] =
      await Promise.all([
        client.getChainSpecData(),
        api.constants.System.SS58Prefix(),
        descriptors.descriptors,
      ])

    return {
      SS58Prefix: SS58Prefix as number,
      asset: {
        decimals: properties.tokenDecimals,
        name: name,
        symbol: properties.tokenSymbol,
      },
      pallets: Object.keys(wrappedStorage.storage),
    }
  }
}
