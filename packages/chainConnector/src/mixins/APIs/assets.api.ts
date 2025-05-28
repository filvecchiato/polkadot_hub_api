import { type SS58String } from "polkadot-api"
import type { PalletComposedChain, TDescriptors } from "../../index"

export interface AssetsApiClass {
  balanceOf(account: SS58String[]): Promise<{
    total: bigint
    transferrable: bigint
    reserved: bigint
    locked: bigint
    reservedDetails: { value: bigint; id: string }[]
    lockedDetails: {
      value: bigint
      id: string
      reason?: string
    }[]
    location: {
      total: bigint
      location: keyof TDescriptors
      decimals: number
    }
  }>
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
        id: string
      }[]
      lockedDetails: {
        value: bigint
        id: string
        timelock?: bigint
      }[]
      locked: bigint
      location: {
        total: bigint
        location: keyof TDescriptors
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

      // Query Vesting and other balance-related pallets if needed (locks are present)

      const locks = []
      // const reserved = []

      if (balancesValue?.lockedDetails) {
        for (const lock of balancesValue.lockedDetails) {
          const method = `${lock.id}_getAccountBalance`
          if (method in Base) {
            const fn = Base[method as keyof typeof Base]
            if (typeof fn === "function") {
              locks.push(fn(account))
            }
          }
        }
      }

      const locksData = await Promise.allSettled(locks)
      console.log("res", locksData)
      return {
        transferrable: accountBalance.transferrable,
        allocated: 0n,
        total:
          accountBalance.locked +
          accountBalance.reserved +
          accountBalance.transferrable, // transferrable + reserved + locked + allocated,
        reserved: accountBalance.reserved,
        reservedDetails:
          bal_Balance.status === "fulfilled"
            ? bal_Balance.value?.reservedDetails || []
            : [],
        locked: accountBalance.locked,
        lockedDetails:
          bal_Balance.status === "fulfilled"
            ? // TODO: if data in lock add a call back to get details of lock
              bal_Balance.value?.lockedDetails || []
            : [],
        location: {
          total:
            accountBalance.locked +
            accountBalance.reserved +
            accountBalance.transferrable,
          location: Base.chainInfo.id,
          decimals: Base.asset.decimals,
        },
      }
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
