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
import {
  AssetsApiMixin,
  AssetsPalletMixin,
  BalancesPalletMixin,
  StakingPalletMixin,
  SystemPalletMixin,
  VestingPalletMixin,
} from "./mixins"
import { ForeignAssetsPalletMixin } from "./mixins/PalletMethods/foreignAssets.pallet"
import { PoolAssetsPalletMixin } from "./mixins/PalletMethods/poolAssets.pallet"

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
    let current = new ChainConnector(
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
    current = VestingPalletMixin(
      VestingPalletMixin(
        StakingPalletMixin(
          AssetsPalletMixin(
            ForeignAssetsPalletMixin(
              PoolAssetsPalletMixin(
                BalancesPalletMixin(SystemPalletMixin(current)),
              ),
            ),
          ),
        ),
      ),
    )
    // mixing assetsAPI
    current = AssetsApiMixin(current)
    this.instance = current as ComposedChainClass
    return this.instance
  }

  // /**
  //  * Get the balance of an account
  //  * @param account - The account to get the balance for
  //  * @returns The balance of the account
  //  */
  // async balanceOf(account: SS58String[]): Promise<{
  //   total: bigint
  //   allocated: bigint
  //   transferrable: bigint
  //   reserved: bigint
  //   reservedDetails: {
  //     value: bigint
  //     flag: string
  //   }[]
  //   locked: bigint
  //   lockedDetails: {
  //     value: bigint
  //     flag: string
  //     timelock?: bigint
  //   }[]
  //   location: {
  //     total: bigint
  //     location: string
  //     decimals: number
  //   }
  // }> {
  //   if (
  //     !this.pallets.includes("Balances") &&
  //     !this.pallets.includes("System")
  //   ) {
  //     return this.emptyAccountBalance
  //   }
  //   console.log(this.chainInfo.name)
  //   const [system, balances] = await Promise.allSettled([
  //     // TODO: add checks for where the balances could be locked or cache the used method
  //     system_getAccountBalance(this.api as any, account),
  //     balances_getAccountBalance(this.api as any, account),
  //   ])

  //   // if every account checked does not have reserved/frozen/locked balance then skip checks and retur

  //   if (system.status === "rejected" && balances.status === "rejected") {
  //     throw new Error(
  //       `Failed to get balances: ${system.reason}, ${balances.reason}`,
  //     )
  //   }

  //   // const dotApi = this.client.getTypedApi(DESCRIPTORS_POLKADOT.polkadot)

  //   // const [locks, reserved] = await Promise.allSettled([
  //   //   dotApi.query.Balances.Locks.getValues(account.map((a) => [a])),
  //   //   dotApi.query.Balances.Reserves.getValues(account.map((a) => [a])),
  //   // ])

  //   // console.log({ locks, reserved })
  //   // give precedence to system pallet
  //   const systemBalance = system.status === "fulfilled" ? system.value : null
  //   const balancesValue =
  //     balances.status === "fulfilled" ? balances.value : null

  //   const accountBalance = {
  //     transferrable:
  //       systemBalance?.transferrable || balancesValue?.transferrable || 0n,
  //     reserved: systemBalance?.reserved || balancesValue?.reserved || 0n,
  //     locked: systemBalance?.locked || balancesValue?.locked || 0n,
  //   }

  //   if (
  //     accountBalance.transferrable === 0n &&
  //     accountBalance.reserved === 0n &&
  //     accountBalance.locked === 0n
  //   ) {
  //     return this.emptyAccountBalance
  //   }

  //   const [vesting, staking] = await Promise.allSettled([
  //     vesting_getAccountBalance(this.api as any, account),
  //     staking_getAccountBalance(this.api as any, account),
  //   ])
  //   // const possibleLockingPallets = [
  //   //   "Staking",
  //   //   "Democracy",
  //   //   "Vesting",
  //   //   "Conviction",
  //   //   "XCM"
  //   //   "CONVICTION_VOTING",
  //   //   "Elections-phragmen",
  //   // ]
  //   // const possibleFreezesPallets = ["Balances", "ForeignAssets", "Assets"]

  //   // TODO: make sure the response shape is the one agreed upon

  //   // vesting is locked assets
  //   const vestingBalance = vesting.status === "fulfilled" ? vesting.value : null
  //   const stakingBalance = staking.status === "fulfilled" ? staking.value : null

  //   const lockedDetails: {
  //     value: bigint
  //     flag: string
  //     timelock?: bigint
  //   }[] = []
  //   const reservedDetails: {
  //     value: bigint
  //     flag: string
  //   }[] = []

  //   if (vestingBalance) {
  //     const { locked, perBlock } = vestingBalance
  //     if (locked > 0n) {
  //       const timelock = new BN(locked.toString()).divRound(
  //         new BN(perBlock.toString()),
  //       )

  //       lockedDetails.push({
  //         value: locked,
  //         flag: "Vesting",
  //         timelock: BigInt(timelock.toString()),
  //       })
  //     }
  //   }

  //   if (stakingBalance) {
  //     stakingBalance.forEach((s) => {
  //       lockedDetails.push({
  //         value: s.total,
  //         flag: "Staking",
  //       })
  //     })
  //   }
  //   const locked = new BN(accountBalance.locked.toString()).isub(
  //     new BN(accountBalance.reserved.toString()),
  //   )

  //   const total = new BN(accountBalance.transferrable.toString()).add(locked)

  //   return {
  //     transferrable: accountBalance.transferrable,
  //     allocated: vestingBalance?.locked || 0n,
  //     total: BigInt(total.toString()), // transferrable + reserved + locked + allocated,
  //     reserved: accountBalance.reserved,
  //     reservedDetails,
  //     locked: accountBalance.locked,
  //     lockedDetails,
  //     location: {
  //       total: BigInt(total.toString()),
  //       location: this.chainInfo.id,
  //       decimals: this.asset.decimals,
  //     },
  //   }
  // }

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
