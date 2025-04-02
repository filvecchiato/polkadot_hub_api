import {
  CompatibilityLevel,
  CompatibilityToken,
  PolkadotClient,
  SS58String,
} from "polkadot-api"
import { ApiOf, ChainAsset, ChainId, Descriptors, TChain } from "./types"
import { DESCRIPTORS } from "./constants"
import {
  AllAssetsSdkTypedApi,
  NativeBalanceSdkTypedApi,
} from "./pallets/descriptors"
import { balances_getAccountBalance, system_getAccountBalance } from "./pallets"
// import { NativeBalanceSdkTypedApi } from "./descriptors/nativeBalanceDescriptors"

export * from "./types"
export * from "./pallets"
export * from "./constants"

export class ChainConnector {
  private static instance: ChainConnector
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

    this.instance = new ChainConnector(
      info,
      client,
      typedApi,
      chainInfo.compatibilityToken,
      chainInfo.SS58Prefix,
      chainInfo.asset,
      chainInfo.pallets,
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
    if (
      !this.pallets.includes("Balances") &&
      !this.pallets.includes("System")
    ) {
      return {
        free: 0n,
        reserved: 0n,
        frozen: 0n,
      }
    }
    const api = this.client.getTypedApi(
      this.descriptors,
    ) as unknown as NativeBalanceSdkTypedApi

    const [system, balances] = await Promise.allSettled([
      // TODO: add checks for where the balances could be locked
      system_getAccountBalance(this, api, account),
      balances_getAccountBalance(this, api, account),
    ])

    // if every account checked does not have reserved/frozen/locked balance then skip checks and retur

    if (system.status === "rejected" && balances.status === "rejected") {
      throw new Error(
        `Failed to get balances: ${system.reason}, ${balances.reason}`,
      )
    }

    // give precedence to system pallet
    const systemBalance = system.status === "fulfilled" ? system.value : null
    const balancesValue =
      balances.status === "fulfilled" ? balances.value : null

    const accountBalance = {
      free: systemBalance?.free || balancesValue?.free || 0n,
      reserved: systemBalance?.reserved || balancesValue?.reserved || 0n,
      frozen: systemBalance?.frozen || balancesValue?.frozen || 0n,
    }

    // const possibleLockingPallets = [
    //   "Balances",
    //   "Staking",
    //   "Democracy",
    //   "Vesting",
    //   "Conviction",
    //   "Crowdloan",
    //   "Assets",
    // ]
    // const possibleFreezesPallets = ["Balances", "ForeignAssets", "Assets"]

    return accountBalance
  }

  async getAssets() {
    const api = this.client.getTypedApi(
      this.descriptors,
    ) as unknown as AllAssetsSdkTypedApi

    const queryAssets = api.query.Assets.Asset
    const queryPoolAssets = api.query.PoolAssets.Asset
    const [assets, pool] = await Promise.allSettled([
      this.pallets.includes("Assets") &&
      queryAssets.isCompatible(
        CompatibilityLevel.BackwardsCompatible,
        this.compatibilityToken,
      )
        ? api.query.Assets.Asset.getEntries()
        : [],
      this.pallets.includes("PoolAssets") &&
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
