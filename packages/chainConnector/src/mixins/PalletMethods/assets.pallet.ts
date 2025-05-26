import { AllDescriptors, ChainConnector } from "@/index"
import { CompatibilityLevel, TypedApi } from "polkadot-api"

export interface AssetsPalletMethods {
  assets_getAssets(): Promise<unknown>
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
    async assets_getAssets(): Promise<unknown> {
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
        assets: assets.status === "fulfilled" ? assets.value : [],
      }
    },
  })
}
