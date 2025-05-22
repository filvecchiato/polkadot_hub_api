/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CompatibilityLevel,
  CompatibilityToken,
  PolkadotClient,
  SS58String,
} from "polkadot-api"
import type { ApiOf, ChainAsset, ChainId, Descriptors, TChain } from "./types"
import { DESCRIPTORS /*DESCRIPTORS_POLKADOT*/ } from "./constants"
import type { AllAssetsSdkTypedApi } from "@polkadot-hub-api/pallet-sdk"
import {
  balances_getAccountBalance,
  staking_getAccountBalance,
  system_getAccountBalance,
} from "@polkadot-hub-api/pallet-sdk"
import { vesting_getAccountBalance } from "@polkadot-hub-api/pallet-sdk"
// import { NativeBalanceSdkTypedApi } from "./descriptors/nativeBalanceDescriptors"
import { BN } from "@polkadot/util"

export * from "./types"
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
    throw new Error("Not implemented")
  }
  async getBlockHash(): Promise<string> {
    throw new Error("Not implemented")
  }

  get emptyAccountBalance(): {
    total: bigint
    allocated: bigint
    transferrable: bigint
    reserved: bigint
    reservedDetails: {
      value: bigint
      flag: string
    }[]
    lockedDetails: {
      value: bigint
      flag: string
      timelock?: bigint
    }[]
    locked: bigint
    location: {
      total: bigint
      location: string
      decimals: number
    }
  } {
    return {
      total: 0n,
      allocated: 0n,
      transferrable: 0n,
      reserved: 0n,
      reservedDetails: [],
      lockedDetails: [],
      locked: 0n,
      location: {
        total: 0n,
        location: this.chainInfo.id,
        decimals: this.asset.decimals,
      },
    }
  }

  /**
   * Get the balance of an account
   * @param account - The account to get the balance for
   * @returns The balance of the account
   */
  async balanceOf(account: SS58String[]): Promise<{
    total: bigint
    allocated: bigint
    transferrable: bigint
    reserved: bigint
    reservedDetails: {
      value: bigint
      flag: string
    }[]
    locked: bigint
    lockedDetails: {
      value: bigint
      flag: string
      timelock?: bigint
    }[]
    location: {
      total: bigint
      location: string
      decimals: number
    }
  }> {
    if (
      !this.pallets.includes("Balances") &&
      !this.pallets.includes("System")
    ) {
      return this.emptyAccountBalance
    }

    const [system, balances] = await Promise.allSettled([
      // TODO: add checks for where the balances could be locked or cache the used method
      system_getAccountBalance(this.api as any, account),
      balances_getAccountBalance(this.api as any, account),
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
      transferrable:
        systemBalance?.transferrable || balancesValue?.transferrable || 0n,
      reserved: systemBalance?.reserved || balancesValue?.reserved || 0n,
      locked: systemBalance?.locked || balancesValue?.locked || 0n,
    }

    if (
      accountBalance.transferrable === 0n &&
      accountBalance.reserved === 0n &&
      accountBalance.locked === 0n
    ) {
      return this.emptyAccountBalance
    }

    const [vesting, staking] = await Promise.allSettled([
      vesting_getAccountBalance(this.api as any, account),
      staking_getAccountBalance(this.api as any, account),
    ])
    // this.client.getTypedApi(DESCRIPTORS_POLKADOT.polkadot).query.
    // const possibleLockingPallets = [
    //   "Staking",
    //   "Democracy",
    //   "Vesting",
    //   "Conviction",
    //   "XCM"
    //   "CONVICTION_VOTING",
    //   "Elections-phragmen",
    // ]
    // const possibleFreezesPallets = ["Balances", "ForeignAssets", "Assets"]

    // TODO: make sure the response shape is the one agreed upon

    // vesting is locked assets
    const vestingBalance = vesting.status === "fulfilled" ? vesting.value : null
    const stakingBalance = staking.status === "fulfilled" ? staking.value : null

    const lockedDetails: {
      value: bigint
      flag: string
      timelock?: bigint
    }[] = []
    const reservedDetails: {
      value: bigint
      flag: string
    }[] = []

    if (vestingBalance) {
      const { locked, perBlock } = vestingBalance
      if (locked > 0n) {
        const timelock = new BN(locked.toString()).divRound(
          new BN(perBlock.toString()),
        )

        lockedDetails.push({
          value: locked,
          flag: "Vesting",
          timelock: BigInt(timelock.toString()),
        })
      }
    }

    if (stakingBalance) {
      stakingBalance.forEach((s) => {
        lockedDetails.push({
          value: s.total,
          flag: "Staking",
        })
      })
    }
    const locked = new BN(accountBalance.locked.toString()).isub(
      new BN(accountBalance.reserved.toString()),
    )

    const total = new BN(accountBalance.transferrable.toString()).add(locked)

    return {
      transferrable: accountBalance.transferrable,
      allocated: vestingBalance?.locked || 0n,
      total: BigInt(total.toString()), // transferrable + reserved + locked + allocated,
      reserved: accountBalance.reserved,
      reservedDetails,
      locked: accountBalance.locked,
      lockedDetails,
      location: {
        total: BigInt(total.toString()),
        location: this.chainInfo.id,
        decimals: this.asset.decimals,
      },
    }
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
