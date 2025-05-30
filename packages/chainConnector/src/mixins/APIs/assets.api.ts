import { type SS58String } from "polkadot-api"
import type { PalletComposedChain, TDescriptors } from "../../index"
import { TAsset } from "../PalletMethods/types"

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
      details?: () => Promise<unknown>
    }[]
    location: {
      total: bigint
      location: keyof TDescriptors
      decimals: number
    }
  }>
  getAssetInfo(): Promise<unknown>
  getAssets(): Promise<{
    assets?: TAsset[]
    poolAssets?: TAsset[]
  }>
  getAssetBalance(): Promise<unknown>
  getBalances(account: SS58String[]): Promise<unknown>
}

export function AssetsApiMixin<T extends PalletComposedChain>(
  Base: T,
): T & AssetsApiClass {
  let enhancedChain = Base as T
  if (Base.pallets.includes("Balances") || Base.pallets.includes("System")) {
    enhancedChain = Object.assign(Base, {
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
            : Promise.reject(),
          "balances_getAccountBalanceWithDetails" in Base
            ? Base.balances_getAccountBalanceWithDetails!(account)
            : Promise.reject(),
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

        const locksDetails = []
        if (balancesValue?.lockedDetails) {
          for (const lock of balancesValue.lockedDetails) {
            const method = `${lock.id}_getAccountBalance`
            if (method in Base) {
              const fn = Base[method as keyof typeof Base]
              if (typeof fn === "function") {
                locksDetails.push({
                  value: lock.value || 0n,
                  id: lock.id,
                  details: async () => {
                    return fn(account)
                  },
                })
              }
            }
          }
        }
        return {
          transferrable: accountBalance.transferrable,
          allocated: 0n,
          total:
            accountBalance.locked +
            accountBalance.reserved +
            accountBalance.transferrable, // transferrable + reserved + locked + allocated,
          reserved: accountBalance.reserved,
          reservedDetails: balancesValue?.reservedDetails || [],
          locked: accountBalance.locked,
          lockedDetails: locksDetails,
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
    })
  } else {
    console.info(
      `Balances and System pallets are not included in the current ${Base.chainInfo.name} runtime, skipping Native AssetsAPI mixin`,
    )
  }

  if (
    Base.pallets.includes("Assets") ||
    Base.pallets.includes("PoolAssets") ||
    Base.pallets.includes("ForeignAssets")
  ) {
    enhancedChain = Object.assign(Base, {
      async getAssetInfo() {
        throw new Error("getAssetInfo is not implemented")
      },
      async getAssets() {
        const assetsPromises = []

        if ("assets_getAssets" in Base) {
          assetsPromises.push(Base.assets_getAssets!())
        }
        if ("poolAssets_getAssets" in Base) {
          assetsPromises.push(Base.poolAssets_getAssets!())
        }
        // if ("foreignAssets_getAssets" in Base) {
        //   assetsPromises.push(Base.foreignAssets_getAssets!())
        // }
        const assets = await Promise.allSettled(assetsPromises)

        const successfulAssets = assets
          .map((a) => (a.status === "fulfilled" ? a.value : null))
          .filter((a) => a !== null)

        const assetsPallet =
          successfulAssets.find((a) => "assets" in a)?.assets || []
        // const foreignAssets =
        //   successfulAssets.find((a) => "foreignAssets" in a)?.foreignAssets ||
        //   []
        const poolAssets =
          successfulAssets.find((a) => "poolAssets" in a)?.poolAssets || []

        return {
          assets: assetsPallet,
          poolAssets,
        }
      },
      async getAssetBalance(
        account: SS58String[],
        assetId: string | number,
        type?: "assets" | "poolAssets",
      ) {
        const id = typeof assetId === "number" ? assetId : Number(assetId)

        if (account.length === 0) {
          throw new Error("No account provided")
        }
        if (isNaN(id)) {
          throw new Error("Invalid asset ID provided")
        }
        const balances = []
        if ("assets_getAssetBalance" in Base) {
          // try assets pallet

          if (!type || type === "assets") {
            balances.push(Base.assets_getAssetBalance!(account, id))
          }
        }

        if ("poolAssets_getAssetBalance" in Base) {
          // try pool assets pallet
          if (!type || type === "poolAssets") {
            balances.push(Base.poolAssets_getAssetBalance!(account, id))
          }
        }

        const balancesData = await Promise.all(balances)

        const data = balancesData.filter((b) => b !== null && b !== undefined)
        return data.length > 0 ? data : null
      },
      async getBalances(account: SS58String[]) {
        // getassets, then traverse top assets and poolAssets to find balances of account
        const assets = await this.getAssets()
        console.log("got assets")
        const balances = await Promise.allSettled([
          ...assets.assets.map((asset) => {
            return this.getAssetBalance(account, asset.id, "assets")
          }),
          ...assets.poolAssets.map((asset) => {
            return this.getAssetBalance(account, asset.id, "poolAssets")
          }),
        ])
        return balances
          .map((b) => (b.status === "fulfilled" ? b.value : null))
          .filter((b) => b !== null && b !== undefined)
      },
    })
  } else {
    console.info(
      `Assets, PoolAssets, and ForeignAssets pallets are not included in the current ${Base.chainInfo.name} runtime, skipping Fungible AssetsAPI mixin`,
    )
  }

  return enhancedChain as T & AssetsApiClass
}
