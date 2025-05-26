import { type SS58String } from "polkadot-api"
import type { PalletComposedChain } from "../../index"

export interface AssetsApiClass {
  balanceOf(account: SS58String[]): Promise<unknown>
  getAssetInfo(): Promise<unknown>
  getAssets(): Promise<unknown>
  getAssetBalance(): Promise<unknown>
  getBalances(): Promise<unknown>
}

export function AssetsApiMixin<T extends PalletComposedChain>(
  Base: T,
): T & AssetsApiClass {
  if (!Base.pallets.includes("Balances") || !Base.pallets.includes("System")) {
    console.info(
      `Balances and System pallets are not included in the current ${Base.chainInfo.name} runtime, skipping AssetsAPI mixin`,
    )
    return Base as T & AssetsApiClass
  }
  return Object.assign(Base, {
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
          location: Base.chainInfo.id,
          decimals: Base.asset.decimals,
        },
      }
    },
    async balanceOf(account: SS58String[]) {
      if (account.length === 0) {
        throw new Error("No account provided")
      }

      const [sys_Balance, bal_Balance] = await Promise.allSettled([
        "system_getAccountBalance" in Base
          ? Base.system_getAccountBalance!(account)
          : null,
        "balances_getAccountBalanceWithDetails" in Base
          ? Base.balances_getAccountBalanceWithDetails!(account)
          : null,
      ])
      console.log({ sys_Balance, bal_Balance })
      if (
        sys_Balance.status === "rejected" &&
        bal_Balance.status === "rejected"
      ) {
        throw new Error(
          `Failed to get balances: ${sys_Balance.reason}, ${bal_Balance.reason}`,
        )
      }

      // give precedence to system pallet
      const sysBalance =
        sys_Balance.status === "fulfilled" ? sys_Balance.value : null
      const balancesValue =
        bal_Balance.status === "fulfilled" ? bal_Balance.value : null

      const accountBalance = {
        transferrable:
          sysBalance?.transferrable || balancesValue?.transferrable || 0n,
        reserved: sysBalance?.reserved || balancesValue?.reserved || 0n,
        locked: sysBalance?.locked || balancesValue?.locked || 0n,
      }

      if (
        accountBalance.transferrable === 0n &&
        accountBalance.reserved === 0n &&
        accountBalance.locked === 0n
      ) {
        return this.emptyAccountBalance
      }

      console.log({
        chain: Base.chainInfo.name,
        sys_Balance:
          sys_Balance.status === "fulfilled" ? sys_Balance.value : null,
        bal_Balance:
          bal_Balance.status === "fulfilled" ? bal_Balance.value : null,
      })

      // Query Vesting and other balance-related pallets if needed (locks are present)
      return {}
      // return {
      //   transferrable: accountBalance.transferrable,
      //   allocated: vestingBalance?.locked || 0n,
      //   total: BigInt(total.toString()), // transferrable + reserved + locked + allocated,
      //   reserved: accountBalance.reserved,
      //   reservedDetails,
      //   locked: accountBalance.locked,
      //   lockedDetails,
      //   location: {
      //     total: BigInt(total.toString()),
      //     location: this.chainInfo.id,
      //     decimals: this.asset.decimals,
      //   },
      // }
    },

    async getAssetInfo() {
      throw new Error("Asset info is not implemented for this chain")
    },

    async getAssets() {
      throw new Error("getAssets are not implemented for this chain")
    },

    async getAssetBalance() {
      //   _assetId: string, //   _account: SS58String[],
      throw new Error("getAssetBalance is not implemented for this chain")
    },

    async getBalances() {
      throw new Error("getBalances is not implemented for this chain")
    },
  })
}
