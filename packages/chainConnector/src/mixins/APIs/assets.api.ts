import { type SS58String } from "polkadot-api"
import type { PalletComposedChain } from "../../index"
import {
  TAccountBalance,
  TAddressAssetBalance,
  TAsset,
  TDescriptors,
} from "@polkadot-hub-api/types"
import { LoggerFactory } from "@polkadot-hub-api/utils"

const log = LoggerFactory.getLogger("ChainConnector")

export interface AssetsApiClass {
  balanceOf(account: SS58String[]): Promise<TAccountBalance>
  getAssets(): Promise<{
    assets?: TAsset[]
    poolAssets?: TAsset[]
  }>
  getAssetBalance(): Promise<unknown>
  getBalances(account: SS58String[]): Promise<TAddressAssetBalance[]>
}

export function AssetsApiMixin<T extends PalletComposedChain>(
  Base: T,
): T & AssetsApiClass {
  let enhancedChain = Base
  if (Base.pallets.includes("Balances") || Base.pallets.includes("System")) {
    enhancedChain = Object.assign(Base, {
      get emptyAccountBalance(): TAccountBalance {
        return {
          total: 0n,
          allocated: 0n,
          transferrable: 0n,
          reserved: 0n,
          reservedDetails: [],
          lockedDetails: [],
          locked: 0n,
          locations: [
            {
              total: 0n,
              location: Base.chainInfo.id,
              decimals: Base.asset.decimals,
            },
          ],
        }
      },
      async balanceOf(account: SS58String[]): Promise<TAccountBalance> {
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
        const locks = [
          ...(balancesValue?.lockedDetails || []),
          ...(balancesValue?.freezesDetails || []),
        ]

        if (locks.length) {
          for (const lock of locks) {
            const method = `${lock.id}_getLockDetails`
            const lockDetail: {
              value: bigint
              id: string
              chainId: keyof TDescriptors
              details: () => Promise<unknown>
            } = {
              value: lock.value || 0n,
              id: lock.id,
              chainId: Base.chainInfo.id,
              details: async () => {
                return Promise.reject("No details available for this lock")
              },
            }

            if (method in Base) {
              const fn = Base[method as keyof typeof Base]
              if (typeof fn === "function") {
                lockDetail.details = async () => {
                  return fn(account)
                }
              }
            }
            locksDetails.push(lockDetail)
          }
        }

        const reservesDetails = []
        const reserves = [
          ...(balancesValue?.reservedDetails || []),
          ...(balancesValue?.holdsDetails || []),
        ]

        if (reserves.length) {
          for (const reserve of reserves) {
            const method = `${reserve.id}_getHoldDetails`
            const reserveDetail: {
              value: bigint
              id: string
              chainId: keyof TDescriptors
              details?: () => Promise<unknown>
            } = {
              value: reserve.value || 0n,
              id: reserve.id,
              chainId: Base.chainInfo.id,
              details: async () => {
                return Promise.reject("No details available for this reserve")
              },
            }

            if (method in Base) {
              const fn = Base[method as keyof typeof Base]
              if (typeof fn === "function") {
                reserveDetail.details = async () => {
                  return fn(account)
                }
              }
            }
            reservesDetails.push(reserveDetail)
          }
        }

        return {
          transferrable: accountBalance.transferrable,
          allocated: 0n, // TODO: implement allocated balance if needed
          total:
            accountBalance.locked +
            accountBalance.reserved +
            accountBalance.transferrable, // transferrable + reserved + locked + allocated,
          reserved: accountBalance.reserved,
          reservedDetails: reservesDetails,
          locked: accountBalance.locked,
          lockedDetails: locksDetails,
          locations: [
            {
              total:
                accountBalance.locked +
                accountBalance.reserved +
                accountBalance.transferrable,
              location: Base.chainInfo.id,
              decimals: Base.asset.decimals,
            },
          ],
        }
      },
    })
  } else {
    log.info(
      `Balances and System pallets are not included in the current ${Base.chainInfo.name} runtime, skipping Native AssetsAPI mixin`,
    )
  }

  if (
    Base.pallets.includes("Assets") ||
    Base.pallets.includes("PoolAssets") ||
    Base.pallets.includes("ForeignAssets")
  ) {
    enhancedChain = Object.assign(Base, {
      async getAssets() {
        const assetsPromises = []

        if ("assets_getAssets" in Base) {
          assetsPromises.push(Base.assets_getAssets!())
        }
        if ("poolAssets_getAssets" in Base) {
          assetsPromises.push(Base.poolAssets_getAssets!())
        }
        const assets = await Promise.allSettled(assetsPromises)

        const successfulAssets = assets
          .map((a) => (a.status === "fulfilled" ? a.value : null))
          .filter((a) => a !== null)

        const assetsPallet =
          successfulAssets.find((a) => "assets" in a)?.assets || []
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
        if (account.length === 0) {
          throw new Error("No account provided")
        }

        if (
          !("assets_getAssetsBalance" in Base) &&
          !("poolAssets_getAssetsBalance" in Base)
        ) {
          throw new Error(
            "Neither Assets nor PoolAssets pallets are available in the current runtime",
          )
        }

        const assetsPromises = account.map((address) =>
          Base.assets_getAssetsBalance!([address]),
        )
        const poolAssetsPromises = account.map((address) =>
          Base.poolAssets_getAssetsBalance!([address]),
        )

        const balances = await Promise.allSettled([
          ...assetsPromises,
          ...poolAssetsPromises,
        ])

        return balances
          .map((b) => (b.status === "fulfilled" ? b.value : null))
          .flat()
      },
    })
  } else {
    log.info(
      `Assets, PoolAssets, and ForeignAssets pallets are not included in the current ${Base.chainInfo.name} runtime, skipping Fungible AssetsAPI mixin`,
    )
  }

  return enhancedChain as T & AssetsApiClass
}
