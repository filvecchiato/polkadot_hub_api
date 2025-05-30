import { AllDescriptors, ChainConnector } from "@/index"
import { CompatibilityLevel, TypedApi } from "polkadot-api"
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
  })
}
