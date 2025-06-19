import {
  CompatibilityToken,
  PolkadotClient,
  // SS58String,
} from "polkadot-api"
import type {
  ApiOf,
  ChainAsset,
  ChainId,
  ComposedChainClass,
  Descriptors,
  TChain,
} from "./types"
import { DESCRIPTORS /*DESCRIPTORS_POLKADOT*/ } from "./constants"
import { enhanceWithApis, enhanceWithPalletsMethods } from "./mixins"

export * from "./types"
export * from "./constants"

export class ChainConnector {
  private static instance: ComposedChainClass | undefined
  client: PolkadotClient
  chainInfo: TChain
  pallets: string[] = []
  api: ApiOf<ChainId>
  descriptors: Descriptors<ChainId>
  compatibilityToken: CompatibilityToken
  SS58Prefix: number
  asset: ChainAsset

  protected constructor(
    info: TChain,
    client: PolkadotClient,
    api: ApiOf<ChainId>,
    compatibilityToken: CompatibilityToken,
    SS58Prefix: number,
    asset: ChainAsset,
    pallets: string[],
  ) {
    this.chainInfo = info
    this.client = client
    this.api = api
    this.pallets = pallets
    this.descriptors = DESCRIPTORS[info.id as ChainId]
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

  static async init(
    info: TChain,
    client: PolkadotClient,
  ): Promise<ChainConnector> {
    const typedApi = client.getTypedApi(DESCRIPTORS[info.id as ChainId])
    const chainInfo = await ChainConnector.getInitChainInfo(
      client,
      typedApi,
      DESCRIPTORS[info.id as ChainId],
    )

    // enhance chainConnector with mixins
    const connector = new ChainConnector(
      info,
      client,
      typedApi,
      chainInfo.compatibilityToken,
      chainInfo.SS58Prefix,
      chainInfo.asset,
      chainInfo.pallets,
    )

    // ALWAYS enhance with methods first and then with APIs
    // mixin Pallet methods
    const enhancedChain = enhanceWithApis(enhanceWithPalletsMethods(connector))
    this.instance = enhancedChain
    return this.instance
  }

  static async getInitChainInfo(
    client: PolkadotClient,
    typedApi: ApiOf<ChainId>,
    descriptors: Descriptors<ChainId>,
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
      SS58Prefix,
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
