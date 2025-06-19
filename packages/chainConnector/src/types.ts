import { TypedApi } from "polkadot-api"
import {
  kusama,
  kah,
  kbh,
  kpl,
  kct,
  polkadot,
  pah,
  pbh,
  pcl,
  pct,
  ppl,
  westend,
  wah,
  wbh,
  wcl,
  wpl,
  wct,
} from "@polkadot-hub-api/descriptors"
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

export type TDescriptorsRelay = {
  polkadot: typeof polkadot
  kusama: typeof kusama
  westend: typeof westend
}

export type DescriptorsRelay = typeof polkadot & typeof kusama & typeof westend
export type DescriptorsAssetHub = typeof kah & typeof wah & typeof pah

export type AllDescriptors = typeof polkadot &
  typeof kusama &
  typeof westend &
  typeof kah &
  typeof wah &
  typeof pah &
  typeof pbh &
  typeof pcl &
  typeof pct &
  typeof ppl &
  typeof kbh &
  typeof kpl &
  typeof wbh &
  typeof wpl &
  typeof wcl &
  typeof kct &
  typeof wct

export type TDescriptorsAssetHub = {
  kah: typeof kah
  wah: typeof wah
  pah: typeof pah
}

// TODO add other system chains
export type TDescriptors = {
  polkadot: typeof polkadot
  kusama: typeof kusama
  westend: typeof westend
  kah: typeof kah
  wah: typeof wah
  pah: typeof pah
  pbh: typeof pbh
  pcl: typeof pcl
  pct: typeof pct
  ppl: typeof ppl
  kbh: typeof kbh
  kpl: typeof kpl
  wbh: typeof wbh
  wpl: typeof wpl
  wcl: typeof wcl
  kct: typeof kct
  wct: typeof wct
}

export type TDescriptorsPolkadot = {
  polkadot: typeof polkadot
  pah: typeof pah
  pbh: typeof pbh
  pcl: typeof pcl
  pct: typeof pct
  ppl: typeof ppl
}

export type TDescriptorsKusama = {
  kusama: typeof kusama
  kah: typeof kah
  kbh: typeof kbh
  kct: typeof kct
  kpl: typeof kpl
}

export type TDescriptorsWestend = {
  westend: typeof westend
  wah: typeof wah
  wbh: typeof wbh
  wcl: typeof wcl
  wpl: typeof wpl
  wct: typeof wct
}

export type ChainIdAssetHub = keyof TDescriptorsAssetHub
export type ChainIdRelay = keyof TDescriptorsRelay
export type ChainId = keyof TDescriptors
export type ChainIdPolkadot = keyof TDescriptorsPolkadot
export type ChainIdKusama = keyof TDescriptorsKusama
export type ChainIdWestend = keyof TDescriptorsWestend
export type Descriptors<Id extends ChainId> = TDescriptors[Id]
export type ApiOf<Id extends ChainId> = TypedApi<Descriptors<Id>>

export type ChainAsset = {
  decimals: number
  symbol: string
  name: string
}

export type TChain<Id = ChainId> = {
  id: Id
  name: string
  wsUrl: string[]
  paraId: number | null
  stableTokenId: string | null
}

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
