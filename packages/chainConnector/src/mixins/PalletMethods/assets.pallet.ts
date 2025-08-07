import { TAddressAssetBalance, TAsset } from "@polkadot-hub-api/types"
import { ChainConnector } from "@/index"
import { LoggerFactory } from "@polkadot-hub-api/utils"

const log = LoggerFactory.getLogger("ChainConnector")

export interface AssetsPalletMethods {
  assets_getAssets(assetId?: number): Promise<{
    assets: TAsset[]
  }>
  assets_getAssetMetadata(assetId: number): Promise<{
    id: number
    name: string
    symbol: string
    decimals: number
    deposit: bigint
    isFrozen: boolean
  } | null>
  assets_getAssetBalance(
    account: string[],
    assetId: number,
  ): Promise<{
    id: number
    pallet: string
    balances: unknown[]
  } | null>
  assets_getAssetsBalance(account: string[]): Promise<TAddressAssetBalance[]>
}

export function AssetsPalletMixin<T extends ChainConnector>(
  Base: T,
): T & AssetsPalletMethods {
  if (!Base.pallets.includes("Assets")) {
    log.info(
      `Assets pallet is not included in the current ${Base.chainInfo.name} runtime, skipping Assets Pallet Methods mixin.`,
    )
    return Base as T & AssetsPalletMethods
  }
  return Object.assign(Base, {
    async assets_getAssets(assetId?: number) {
      const api = Base.api
      if (!api.query.Assets) {
        throw new Error("Assets pallet is not available in the current runtime")
      }

      const assets_asset = api.query.Assets.Asset

      if (!assets_asset) {
        throw new Error(
          "Assets.Asset is not compatible with the current runtime",
        )
      }

      const assets: {
        keyArgs: [number]
        value: object
      }[] = []
      if (assetId && typeof assetId === "number") {
        const asset = await assets_asset.getValue(assetId)
        if (asset !== undefined && asset !== null) {
          assets.push({
            keyArgs: [assetId],
            value: asset,
          })
        }
      } else {
        const assetsData = await assets_asset.getEntries()
        assets.push(...assetsData)
      }

      return {
        assets: assets.map((a) => ({
          ...(a.value as TAsset),
          id: a.keyArgs[0],
        })),
      }
    },
    async assets_getAssetMetadata(assetId: number) {
      const api = Base.api
      if (!api.query.Assets) {
        throw new Error("Assets pallet is not available in the current runtime")
      }

      const assets_assetMetadata = api.query.Assets.Metadata

      if (!assets_assetMetadata) {
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
    async assets_getAssetBalance(account: string[], assetId: string | number) {
      const id = typeof assetId === "number" ? assetId : Number(assetId)

      if (account.length === 0) {
        throw new Error("No account provided")
      }
      if (isNaN(id)) {
        throw new Error("Invalid asset ID provided")
      }

      const api = Base.api
      if (!api.query.Assets) {
        throw new Error("Assets pallet is not available in the current runtime")
      }

      const assets_accountBalance = api.query.Assets.Account

      if (!assets_accountBalance) {
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

      const api = Base.api
      if (!api.query.Assets) {
        throw new Error("Assets pallet is not available in the current runtime")
      }

      const assets_Account = api.query.Assets.Account

      if (!assets_Account) {
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
            address: account,
            ...b,
            info: async () => {
              return await this.assets_getAssets(assets.assets[i].id)
            },
            metadata: async () => {
              return await this.assets_getAssetMetadata(assets.assets[i].id)
            },
          }
        })
        .filter((b) => b !== undefined && b !== null)
    },
  })
}
