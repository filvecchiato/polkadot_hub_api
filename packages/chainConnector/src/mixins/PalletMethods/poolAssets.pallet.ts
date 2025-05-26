import { AllDescriptors, ChainConnector } from "@/index"
import { CompatibilityLevel, TypedApi } from "polkadot-api"

export interface PoolAssetsPalletMethods {
  poolAssets_getAssets(): Promise<unknown>
}

export function PoolAssetsPalletMixin<T extends ChainConnector>(
  Base: T,
): T & PoolAssetsPalletMethods {
  if (!Base.pallets.includes("PoolAssets")) {
    console.info(
      "Pool Assets pallet is not included in the current runtime, skipping Pool Assets Pallet Methods mixin",
    )
    return Base as T & PoolAssetsPalletMethods
  }
  return Object.assign(Base, {
    async poolAssets_getAssets(): Promise<unknown> {
      const api = Base.api as unknown as TypedApi<AllDescriptors>
      if (!api.query.Assets) {
        throw new Error(
          "Pool Assets pallet is not available in the current runtime",
        )
      }

      const assets_asset = api.query.PoolAssets.Asset

      if (
        !assets_asset.isCompatible(
          CompatibilityLevel.BackwardsCompatible,
          Base.compatibilityToken,
        )
      ) {
        throw new Error(
          "PoolAssets.Asset is not compatible with the current runtime",
        )
      }
      const [assets] = await Promise.allSettled([assets_asset.getEntries()])

      return {
        assets: assets.status === "fulfilled" ? assets.value : [],
      }
    },
  })
}
