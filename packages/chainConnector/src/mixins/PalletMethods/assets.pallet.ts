import { AllDescriptors, ChainConnector } from "@/index"
import { CompatibilityLevel, Enum, SS58String, TypedApi } from "polkadot-api"
import { TAsset } from "./types"

export interface AssetsPalletMethods {
  assets_getAssets(): Promise<{
    assets: TAsset[]
  }>
  assets_getAssetBalance(
    account: string[],
    assetId: number,
  ): Promise<{
    id: number
    pallet: string
    balances: unknown[]
  } | null>
  assets_getAssetsBalance(account: string[]): Promise<
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

export function AssetsPalletMixin<T extends ChainConnector>(
  Base: T,
): T & AssetsPalletMethods {
  if (!Base.pallets.includes("Assets")) {
    console.info(
      `Assets pallet is not included in the current ${Base.chainInfo.name} runtime, skipping Assets Pallet Methods mixin.`,
    )
    return Base as T & AssetsPalletMethods
  }
  return Object.assign(Base, {
    async assets_getAssets() {
      const api = Base.api as unknown as TypedApi<AllDescriptors>
      if (!api.query.Assets) {
        throw new Error("Assets pallet is not available in the current runtime")
      }

      const assets_asset = api.query.Assets.Asset

      if (
        !assets_asset.isCompatible(
          CompatibilityLevel.BackwardsCompatible,
          Base.compatibilityToken,
        )
      ) {
        throw new Error(
          "Assets.Asset is not compatible with the current runtime",
        )
      }
      const [assets] = await Promise.allSettled([assets_asset.getEntries()])

      return {
        assets:
          assets.status === "fulfilled"
            ? assets.value.map((a) => ({
                id: a.keyArgs[0],
                ...a.value,
              }))
            : [],
      }
    },
    async assets_getAssetBalance(account: string[], assetId: string | number) {
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

      const assets_accountBalance = api.query.Assets.Account

      if (
        !assets_accountBalance.isCompatible(
          CompatibilityLevel.BackwardsCompatible,
          Base.compatibilityToken,
        )
      ) {
        throw new Error(
          "Assets.Account is not compatible with the current runtime",
        )
      }

      const balances = await assets_accountBalance.getValues(
        account.map((a) => [id, a]),
      )

      const cleanedBalances = balances.filter(
        (b) => b !== undefined && b !== null,
      )

      return cleanedBalances.length > 0
        ? {
            id: id,
            pallet: "Assets",
            balances: cleanedBalances.map((b, i) => ({
              address: account[i],
              ...b,
            })),
          }
        : null
    },
    async assets_getAssetsBalance(account: string[]) {
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

      const assets = await this.assets_getAssets()

      const balances = await assets_Account.getValues(
        assets.assets.map((a) => [a.id, account[0]]),
      )
      return balances
        .map((b, i) => {
          if (b === undefined || b === null) {
            return null
          }
          return {
            id: assets.assets[i].id,
            pallet: "Assets",
            ...b,
          }
        })
        .filter((b) => b !== undefined && b !== null)
    },
  })
}
