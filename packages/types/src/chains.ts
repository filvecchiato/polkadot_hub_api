import type { ChainDefinition } from "polkadot-api"
import type { Config } from "./config"
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
import { WellknownParachainId, WellknownRelayChainId } from "./wellKnownChains"

// should load all available descriptors from config and use that to generate Ids and so on
// export type
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

export type TDescriptorsRelay = {
  polkadot: typeof polkadot
  kusama: typeof kusama
  westend: typeof westend
}

// export type Descriptors<Id extends ChainId> = TDescriptors[Id]
// export type ApiOf<Id extends ChainId> = TypedApi<Descriptors<Id>>

export type ChainAsset = {
  decimals: number
  symbol: string
  name: string
}

export type ChainIdRelay = keyof TDescriptorsRelay

export type TChain = {
  id: WellknownParachainId | WellknownRelayChainId
  name: string
  paraId: number | null
}

type InferChains<T extends Config> = {
  [P in keyof T["chains"]]: T["chains"][P]["descriptor"]
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Chains extends InferChains<ResolvedRegister["config"]> {}

export type ChainId = keyof Chains

export type CommonDescriptor = Chains[keyof Chains] extends never
  ? ChainDefinition
  : Chains[keyof Chains]

export type ChainDescriptorOf<T extends ChainId | undefined> =
  undefined extends T ? CommonDescriptor : T extends ChainId ? Chains[T] : never

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Register {}

export type ResolvedRegister = {
  config: Register extends { config: infer config extends Config }
    ? config
    : Config
}
