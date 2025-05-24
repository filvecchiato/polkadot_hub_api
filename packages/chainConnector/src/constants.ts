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
import {
  TDescriptors,
  TDescriptorsKusama,
  TDescriptorsPolkadot,
  TDescriptorsWestend,
} from "./types"

// TODO add other system chains
export const DESCRIPTORS: TDescriptors = {
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
}

export const DESCRIPTORS_POLKADOT: TDescriptorsPolkadot = {
  polkadot,
  pah,
  pbh,
  pcl,
  pct,
  ppl,
}

export const DESCRIPTORS_KUSAMA: TDescriptorsKusama = {
  kusama,
  kah,
  kbh,
  kct,
  kpl,
}

export const DESCRIPTORS_WESTEND: TDescriptorsWestend = {
  westend,
  wah,
  wbh,
  wcl,
  wpl,
  wct,
}
