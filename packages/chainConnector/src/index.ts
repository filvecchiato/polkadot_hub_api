import { CompatibilityToken, PolkadotClient, TypedApi } from "polkadot-api"
import type {
  ChainAsset,
  ChainDescriptorOf,
  ChainId,
  TChain,
} from "@polkadot-hub-api/types"
import { ComposedChainClass } from "@/types"
import { enhanceWithApis, enhanceWithPalletsMethods } from "./mixins"

export * from "./types"

export class ChainConnector {
  private static instance: ComposedChainClass | undefined
  client: PolkadotClient
  chainInfo: TChain
  pallets: string[] = []
  descriptors: ChainDescriptorOf<ChainId>
  compatibilityToken: CompatibilityToken
  SS58Prefix: number
  asset: ChainAsset

  protected constructor(
    info: TChain,
    client: PolkadotClient,
    descriptors: ChainDescriptorOf<ChainId>,
    compatibilityToken: CompatibilityToken,
    SS58Prefix: number,
    asset: ChainAsset,
    pallets: string[],
  ) {
    this.chainInfo = info
    this.client = client
    this.pallets = pallets
    this.descriptors = descriptors
    this.SS58Prefix = SS58Prefix
    this.compatibilityToken = compatibilityToken
    this.asset = asset
  }

  static getInstance(): ChainConnector | undefined {
    if (!this.instance) {
      return undefined
    }
    return this.instance
  }

  get api(): TypedApi<ChainDescriptorOf<ChainId>> {
    if (!this.descriptors) {
      throw new Error("ChainConnector not initialized")
    }
    return this.client.getTypedApi<ChainDescriptorOf<ChainId>>(this.descriptors)
  }

  static async init(
    info: TChain,
    client: PolkadotClient,
    descriptors: ChainDescriptorOf<ChainId>,
  ): Promise<ChainConnector> {
    const typedApi = client.getTypedApi(descriptors)
    const chainInfo = await ChainConnector.getInitChainInfo(
      client,
      typedApi,
      descriptors,
    )

    // enhance chainConnector with mixins
    const connector = new ChainConnector(
      info,
      client,
      descriptors,
      chainInfo.compatibilityToken,
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
    typedApi: TypedApi<ChainDescriptorOf<ChainId>>,
    descriptors: ChainDescriptorOf<ChainId>,
  ): Promise<{
    SS58Prefix: number
    compatibilityToken: CompatibilityToken
    asset: ChainAsset
    pallets: string[]
  }> {
    const [
      { name, properties },
      SS58Prefix,
      compatibilityToken,
      wrappedStorage,
    ] = await Promise.all([
      client.getChainSpecData(),
      typedApi.constants.System.SS58Prefix(),
      typedApi.compatibilityToken,
      descriptors.descriptors,
    ])

    return {
      SS58Prefix: SS58Prefix as number,
      compatibilityToken,
      asset: {
        decimals: properties.tokenDecimals,
        name: name,
        symbol: properties.tokenSymbol,
      },
      pallets: Object.keys(wrappedStorage.storage),
    }
  }
}
