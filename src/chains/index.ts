import {
  CompatibilityLevel,
  CompatibilityToken,
  PolkadotClient,
  SS58String,
} from "polkadot-api"
import {
  ApiOf,
  ChainAsset,
  ChainId,
  DESCRIPTORS,
  Descriptors,
  TChain,
} from "./types"
import { AllAssetsSdkTypedApi, NativeBalanceSdkTypedApi } from "./descriptors"
// import { NativeBalanceSdkTypedApi } from "./descriptors/nativeBalanceDescriptors"

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

  async getBalances(): Promise<string> {
    return ""
  }
  async getBlockHash(): Promise<string> {
    return ""
  }

  async balanceOf(account: SS58String[]): Promise<{
    free: bigint
    reserved: bigint
    frozen: bigint
  }> {
    const storage = await this.getStorage()
    if (!storage.includes("Balances") && !storage.includes("System")) {
      return {
        free: 0n,
        reserved: 0n,
        frozen: 0n,
      }
    }
    const api = this.client.getTypedApi(
      this.descriptors,
    ) as unknown as NativeBalanceSdkTypedApi

    const querySystem = api.query.System.Account
    const [system] = await Promise.allSettled([
      // TODO: add checks for where the balances could be locked
      storage.includes("System") &&
      querySystem.isCompatible(
        CompatibilityLevel.BackwardsCompatible,
        this.compatibilityToken,
      )
        ? api.query.System.Account.getValues(account.map((a) => [a]))
        : [],
    ])

    // if every account checked does not have reserved/frozen/locked balance then skip checks and return
    const settledSystem = system.status === "fulfilled" ? system.value : []
    const accountBalance = settledSystem.reduce(
      (acc, curr) => {
        const accountData = curr.data
        return {
          free: acc.free + accountData.free,
          reserved: acc.reserved + accountData.reserved,
          frozen: acc.frozen + accountData.frozen,
        }
      },
      {
        free: BigInt(0),
        reserved: BigInt(0),
        frozen: BigInt(0),
      },
    )

    if (
      accountBalance.frozen === BigInt(0) &&
      accountBalance.reserved === BigInt(0)
    ) {
      return accountBalance
    }
    console.log("system", accountBalance)

    return accountBalance
  }
  async getStorage() {
    return Object.keys((await this.descriptors.descriptors).storage)
  }

  async getAssets() {
    const storageAccess = await this.getStorage()
    const api = this.client.getTypedApi(
      this.descriptors,
    ) as unknown as AllAssetsSdkTypedApi

    const queryAssets = api.query.Assets.Asset
    const queryPoolAssets = api.query.PoolAssets.Asset
    const [assets, pool] = await Promise.allSettled([
      storageAccess.includes("Assets") &&
      queryAssets.isCompatible(
        CompatibilityLevel.BackwardsCompatible,
        this.compatibilityToken,
      )
        ? api.query.Assets.Asset.getEntries()
        : [],
      storageAccess.includes("PoolAssets") &&
      queryPoolAssets.isCompatible(
        CompatibilityLevel.BackwardsCompatible,
        this.compatibilityToken,
      )
        ? api.query.PoolAssets.Asset.getEntries()
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
