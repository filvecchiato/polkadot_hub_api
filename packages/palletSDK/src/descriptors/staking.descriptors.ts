/* eslint-disable @typescript-eslint/no-empty-object-type */
import { SdkDefinition } from "@polkadot-api/common-sdk-utils"
import {
  ApisTypedef,
  PalletsTypedef,
  SS58String,
  StorageDescriptor,
  TypedApi,
} from "polkadot-api"

type targetsData = Array<SS58String>
type NominatorData = {
  targets: targetsData
  submitted_in: number
  suppressed: boolean
}

type StakingSdkPallets = PalletsTypedef<
  {
    Staking: {
      Nominators: StorageDescriptor<
        [Key: SS58String],
        NominatorData,
        true,
        never
      >
      Bonded: StorageDescriptor<[Key: SS58String], SS58String, true, never>
    }
  },
  {},
  {},
  {},
  {}
>

export type StakingSdkDefinition = SdkDefinition<
  StakingSdkPallets,
  ApisTypedef<{}>
>
export type StakingSDKTypedApi = TypedApi<StakingSdkDefinition>
