/* eslint-disable @typescript-eslint/no-empty-object-type */
import { SdkDefinition } from "@polkadot-api/common-sdk-utils"
import {
  ApisTypedef,
  Enum,
  PalletsTypedef,
  SS58String,
  StorageDescriptor,
  TypedApi,
} from "polkadot-api"
import {} from "@polkadot-hub-api/descriptors"

export type Version = Enum<{
  V0: undefined
  V1: undefined
}>

export type VestingData = Array<{
  locked: bigint
  per_block: bigint
  starting_block: number
}>

export type VestingSdkPallets = PalletsTypedef<
  {
    Vesting: {
      Vesting: StorageDescriptor<[Key: SS58String], VestingData, true, never>
      StorageVersion: StorageDescriptor<[], Version, false, never>
    }
  },
  {},
  {},
  {},
  {}
>

export type VestingSdkDefinition = SdkDefinition<
  VestingSdkPallets,
  ApisTypedef<{}>
>

export type VestingSdkTypedApi = TypedApi<VestingSdkDefinition>
