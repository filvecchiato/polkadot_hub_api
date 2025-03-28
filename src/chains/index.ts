import { CompatibilityToken, PolkadotClient } from "polkadot-api"
import {
  ApiOf,
  ChainAsset,
  ChainId,
  DESCRIPTORS,
  Descriptors,
  TChain,
} from "./types"
import { AllAssetsSdkTypedApi } from "./descriptors"

export class ChainConnector {
  private static instance: ChainConnector
  client: PolkadotClient
  chainInfo: TChain
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
  ) {
    this.chainInfo = info
    this.client = client
    this.api = api

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
    const chainInfo = await ChainConnector.getInitChainInfo(client, typedApi)

    this.instance = new ChainConnector(
      info,
      client,
      typedApi,
      chainInfo.compatibilityToken,
      chainInfo.SS58Prefix,
      chainInfo.asset,
    )

    return this.instance
  }

  async getBalanceOf(): Promise<string> {
    return ""
  }
  async getBlockHash(): Promise<string> {
    return ""
  }

  async getStorage() {
    return Object.keys((await this.descriptors.descriptors).storage)
  }

  async getAssets() {
    const storageAccess = await this.getStorage()
    const [assets, pool] = await Promise.allSettled([
      storageAccess.includes("Assets")
        ? (
            this.client.getTypedApi(
              this.descriptors,
            ) as unknown as AllAssetsSdkTypedApi
          ).query.Assets.Asset.getEntries()
        : [],
      storageAccess.includes("PoolAssets")
        ? (
            this.client.getTypedApi(
              this.descriptors,
            ) as unknown as AllAssetsSdkTypedApi
          ).query.PoolAssets.Asset.getEntries()
        : [],
    ])

    return {
      assets: assets.status === "fulfilled" ? assets.value : [],
      pool: pool.status === "fulfilled" ? pool.value : [],
    }
  }

  static async getInitChainInfo(
    client: PolkadotClient,
    typedApi: ApiOf<ChainId>,
  ): Promise<{
    SS58Prefix: number
    compatibilityToken: CompatibilityToken
    asset: ChainAsset
  }> {
    const [{ name, properties }, SS58Prefix, compatibilityToken] =
      await Promise.all([
        client.getChainSpecData(),
        typedApi.constants.System.SS58Prefix(),
        typedApi.compatibilityToken,
      ])

    return {
      SS58Prefix,
      compatibilityToken,
      asset: {
        decimals: properties.tokenDecimals,
        name: name,
        symbol: properties.tokenSymbol,
      },
    }
  }
}
