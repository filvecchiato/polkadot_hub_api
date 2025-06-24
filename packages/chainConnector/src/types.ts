import { ChainConnector } from "."
import {
  AssetsApiClass,
  AssetsPalletMethods,
  BalancesPalletMethods,
  ConvictionVotingPalletMethods,
  DelegatedStakingPalletMethods,
  StakingPalletMethods,
  SystemPalletMethods,
  VestingPalletMethods,
} from "./mixins"
import { PoolAssetsPalletMethods } from "./mixins/PalletMethods/poolAssets.pallet"
import { ForeignAssetsPalletMethods } from "./mixins/PalletMethods/foreignAssets.pallet"

export type PalletComposedChain = ChainConnector &
  Partial<
    SystemPalletMethods &
      BalancesPalletMethods &
      VestingPalletMethods &
      StakingPalletMethods &
      AssetsPalletMethods &
      PoolAssetsPalletMethods &
      ForeignAssetsPalletMethods &
      ConvictionVotingPalletMethods &
      DelegatedStakingPalletMethods
  >

export type ComposedChainClass = PalletComposedChain & Partial<AssetsApiClass>
