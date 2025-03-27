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
} from "@polkadot-api/descriptors"

export const DESCRIPTORS_RELAY = {
  polkadot,
  kusama,
  westend,
} as const

export const DESCRIPTORS_ASSET_HUB = {
  kah,
  wah,
  pah,
} as const

// TODO add other system chains
export const DESCRIPTORS = {
  polkadot,
  kusama,
  westend,
  kah,
  wah,
  pah,
  pbh,
  pcl,
  pct,
  ppl,
  kbh,
  kpl,
  wbh,
  wpl,
  wcl,
  kct,
  wct,
} as const

export const DESCRIPTORS_POLKADOT = {
  polkadot,
  pah,
  pbh,
  pcl,
  pct,
  ppl,
} as const
export const DESCRIPTORS_KUSAMA = {
  kusama,
  kah,
  kbh,
  kct,
  kpl,
} as const

export const DESCRIPTORS_WESTEND = {
  westend,
  wah,
  wbh,
  wcl,
  wpl,
  wct,
} as const

export type ChainIdAssetHub = keyof typeof DESCRIPTORS_ASSET_HUB
export type ChainIdRelay = keyof typeof DESCRIPTORS_RELAY
export type ChainId = keyof typeof DESCRIPTORS
export type ChainIdPolkadot = keyof typeof DESCRIPTORS_POLKADOT
export type ChainIdKusama = keyof typeof DESCRIPTORS_KUSAMA
export type ChainIdWestend = keyof typeof DESCRIPTORS_WESTEND
export type Descriptors<Id extends ChainId> = (typeof DESCRIPTORS)[Id]

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
