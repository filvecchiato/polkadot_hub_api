import { AllTypedApi, ChainConnector } from "@/index"
import { CompatibilityLevel } from "polkadot-api"
import { LoggerFactory } from "@polkadot-hub-api/utils"

const log = LoggerFactory.getLogger("ChainConnector")

export interface ForeignAssetsPalletMethods {
  foreignAssets_getAssets(): Promise<{
    foreignAssets: object[]
  }>
}

export function ForeignAssetsPalletMixin<T extends ChainConnector>(
  Base: T,
): T & ForeignAssetsPalletMethods {
  if (!Base.pallets.includes("ForeignAssets")) {
    log.info(
      `Foreign Assets pallet is not included in the current ${Base.chainInfo.name} runtime, skipping Foreign Assets Pallet Methods mixin.`,
    )
    return Base as T & ForeignAssetsPalletMethods
  }
  return Object.assign(Base, {
    async foreignAssets_getAssets() {
      const api = Base.api as AllTypedApi
      if (!api.query.Assets) {
        throw new Error(
          "Foreign Assets pallet is not available in the current runtime",
        )
      }

      const assets_asset = api.query.ForeignAssets.Asset

      if (
        !assets_asset.isCompatible(
          CompatibilityLevel.BackwardsCompatible,
          Base.compatibilityToken,
        )
      ) {
        throw new Error(
          "ForeignAssets.Asset is not compatible with the current runtime",
        )
      }
      const [assets] = await Promise.allSettled([assets_asset.getEntries()])

      return {
        foreignAssets: assets.status === "fulfilled" ? assets.value : [],
      }
    },
  })
}
