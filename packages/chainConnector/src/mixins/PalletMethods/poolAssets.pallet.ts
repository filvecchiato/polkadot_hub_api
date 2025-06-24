import { AllDescriptors, ChainConnector } from "@/index"
import { CompatibilityLevel, TypedApi } from "polkadot-api"
import { TAddressAssetBalance, TAsset } from "@polkadot-hub-api/types"

export interface PoolAssetsPalletMethods {
  poolAssets_getAssets(assetId?: number): Promise<{
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
  poolAssets_getAssetMetadata(assetId: number): Promise<{
    id: number
    name: string
    symbol: string
    decimals: number
    deposit: bigint
    isFrozen: boolean
  } | null>
  poolAssets_getAssetsBalance(
    account: string[],
  ): Promise<TAddressAssetBalance[]>
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
    async poolAssets_getAssets(assetId?: number) {
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
      const assets: {
        keyArgs: [number]
        value: object
      }[] = []
      if (assetId && typeof assetId === "number") {
        const asset = await poolAssets_asset.getValue(assetId)
        if (asset !== undefined && asset !== null) {
          assets.push({
            keyArgs: [assetId],
            value: asset,
          })
        }
      } else {
        const assetsData = await poolAssets_asset.getEntries()
        assets.push(...assetsData)
      }
      return {
        poolAssets: assets.map((a) => ({
          ...(a.value as TAsset),
          id: a.keyArgs[0],
        })),
      }
    },
    async poolAssets_getAssetMetadata(assetId: number) {
      const api = Base.api as unknown as TypedApi<AllDescriptors>
      if (!api.query.Assets) {
        throw new Error("Assets pallet is not available in the current runtime")
      }

      const assets_assetMetadata = api.query.Assets.Metadata

      if (
        !assets_assetMetadata.isCompatible(
          CompatibilityLevel.BackwardsCompatible,
          Base.compatibilityToken,
        )
      ) {
        throw new Error(
          "Assets.Asset is not compatible with the current runtime",
        )
      }

      const asset = await assets_assetMetadata.getValue(assetId)
      if (asset === undefined || asset === null) {
        return null
      }

      return {
        id: assetId,
        name: asset.name.asText(),
        symbol: asset.symbol.asText(),
        deposit: asset.deposit,
        decimals: asset.decimals,
        isFrozen: asset.is_frozen,
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
            address: account,
            ...b,
            info: async () => {
              return await this.poolAssets_getAssets(assets.poolAssets[i].id)
            },
            metadata: async () => {
              return await this.poolAssets_getAssetMetadata(
                assets.poolAssets[i].id,
              )
            },
          }
        })
        .filter((b) => b !== undefined && b !== null)
    },
  })
}
