import { ChainConnector, ComposedChainClass, PalletComposedChain } from ".."
import { AssetsApiMixin } from "./APIs"

export * from "./APIs"
export * from "./PalletMethods"

import {
  AssetsPalletMixin,
  BalancesPalletMixin,
  ConvictionVotingPalletMixin,
  DelegatedStakingPalletMixin,
  StakingPalletMixin,
  SystemPalletMixin,
  VestingPalletMixin,
  PoolAssetsPalletMixin,
  ForeignAssetsPalletMixin,
} from "./PalletMethods"

export function enhanceWithPalletsMethods(
  Connector: ChainConnector,
): PalletComposedChain {
  return DelegatedStakingPalletMixin(
    ConvictionVotingPalletMixin(
      VestingPalletMixin(
        StakingPalletMixin(
          AssetsPalletMixin(
            ForeignAssetsPalletMixin(
              PoolAssetsPalletMixin(
                BalancesPalletMixin(SystemPalletMixin(Connector)),
              ),
            ),
          ),
        ),
      ),
    ),
  )
}

export function enhanceWithApis(
  Connector: PalletComposedChain,
): ComposedChainClass {
  return AssetsApiMixin(Connector)
}
