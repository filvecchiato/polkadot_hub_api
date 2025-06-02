import { AllDescriptors, ChainConnector } from "@/index"
import { CompatibilityLevel, Enum, SS58String, TypedApi } from "polkadot-api"
import { TAsset } from "./types"

export interface PoolAssetsPalletMethods {
  poolAssets_getAssets(): Promise<{
    poolAssets: TAsset[]
  }>
  poolAssets_getAssetBalance(
    account: string[],
    assetId: number,
  ): Promise<{
    id: number
    pallet: string
    balances: unknown[]
  } | null>
  poolAssets_getAssetsBalance(account: string[]): Promise<
    {
      id: number
      pallet: string
      balance: bigint
      status: Enum<{ Liquid: undefined; Frozen: undefined; Blocked: undefined }>
      reason?: Enum<{
        Consumer: undefined
        Sufficient: undefined
        DepositHeld: bigint
        DepositRefunded: undefined
        DepositFrom: [SS58String, bigint]
      }>
    }[]
  >
}

export function PoolAssetsPalletMixin<T extends ChainConnector>(
  Base: T,
): T & PoolAssetsPalletMethods {
  if (!Base.pallets.includes("PoolAssets")) {
    console.info(
      `Pool Assets pallet is not included in the current ${Base.chainInfo.name} runtime, skipping Pool Assets Pallet Methods mixin.`,
    )
    return Base as T & PoolAssetsPalletMethods
  }
  return Object.assign(Base, {
    async poolAssets_getAssets() {
      const api = Base.api as unknown as TypedApi<AllDescriptors>
      if (!api.query.PoolAssets) {
        throw new Error(
          "Pool Assets pallet is not available in the current runtime",
        )
      }

      const poolAssets_asset = api.query.PoolAssets.Asset

      if (
        !poolAssets_asset.isCompatible(
          CompatibilityLevel.BackwardsCompatible,
          Base.compatibilityToken,
        )
      ) {
        throw new Error(
          "PoolAssets.Asset is not compatible with the current runtime",
        )
      }
      const [assets] = await Promise.allSettled([poolAssets_asset.getEntries()])
      return {
        poolAssets:
          assets.status === "fulfilled"
            ? assets.value.map((a) => ({
                id: a.keyArgs[0],
                ...a.value,
              }))
            : [],
      }
    },
    async poolAssets_getAssetBalance(account: string[], assetId: number) {
      const id = typeof assetId === "number" ? assetId : Number(assetId)

      if (account.length === 0) {
        throw new Error("No account provided")
      }
      if (isNaN(id)) {
        throw new Error("Invalid asset ID provided")
      }

      const api = Base.api as unknown as TypedApi<AllDescriptors>
      if (!api.query.Assets) {
        throw new Error("Assets pallet is not available in the current runtime")
      }

      const poolAssets_accountBalance = api.query.PoolAssets.Account

      if (
        !poolAssets_accountBalance.isCompatible(
          CompatibilityLevel.BackwardsCompatible,
          Base.compatibilityToken,
        )
      ) {
        throw new Error(
          "Assets.Account is not compatible with the current runtime",
        )
      }

      const balances = await poolAssets_accountBalance.getValues(
        account.map((a) => [id, a]),
      )
      const cleanedBalances = balances.filter(
        (b) => b !== undefined && b !== null,
      )

      return cleanedBalances.length > 0
        ? {
            id: id,
            pallet: "PoolAssets",
            balances: cleanedBalances.map((b, i) => ({
              address: account[i],
              ...b,
            })),
          }
        : null
    },
    async poolAssets_getAssetsBalance(account: string[]) {
      if (account.length === 0) {
        throw new Error("No account provided")
      }

      if (account.length > 1) {
        throw new Error("Only one address is supported at a time")
      }

      const api = Base.api as unknown as TypedApi<AllDescriptors>
      if (!api.query.Assets) {
        throw new Error("Assets pallet is not available in the current runtime")
      }

      const assets_Account = api.query.Assets.Account

      if (
        !assets_Account.isCompatible(
          CompatibilityLevel.BackwardsCompatible,
          Base.compatibilityToken,
        )
      ) {
        throw new Error(
          "Assets.Asset is not compatible with the current runtime",
        )
      }

      const assets = await this.poolAssets_getAssets()

      const balances = await assets_Account.getValues(
        assets.poolAssets.map((a) => [a.id, account[0]]),
      )
      return balances
        .map((b, i) => {
          if (b === undefined || b === null) {
            return null
          }
          return {
            id: assets.poolAssets[i].id,
            pallet: "PoolAssets",
            ...b,
          }
        })
        .filter((b) => b !== undefined && b !== null)
    },
  })
}
