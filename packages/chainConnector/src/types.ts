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
import { TypedApi } from "polkadot-api"

import {
  polkadot,
  kusama,
  westend,
  kah,
  kbh,
  kpl,
  pah,
  pbh,
  pcl,
  pct,
  ppl,
  wah,
  wbh,
  wcl,
  wpl,
  kct,
  wct,
} from "@polkadot-hub-api/descriptors"

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

export type AllTypedApi = TypedApi<typeof polkadot> &
  TypedApi<typeof kusama> &
  TypedApi<typeof westend> &
  TypedApi<typeof kah> &
  TypedApi<typeof kbh> &
  TypedApi<typeof kpl> &
  TypedApi<typeof pah> &
  TypedApi<typeof pbh> &
  TypedApi<typeof pcl> &
  TypedApi<typeof pct> &
  TypedApi<typeof ppl> &
  TypedApi<typeof wah> &
  TypedApi<typeof wbh> &
  TypedApi<typeof wcl> &
  TypedApi<typeof wpl> &
  TypedApi<typeof kct> &
  TypedApi<typeof wct>
