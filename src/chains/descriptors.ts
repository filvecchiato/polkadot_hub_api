import { SdkDefinition } from "@polkadot-api/common-sdk-utils"
import { XcmV3Junction } from "@polkadot-api/descriptors"
import {
  ApisTypedef,
  Binary,
  Enum,
  FixedSizeArray,
  PalletsTypedef,
  SS58String,
  StorageDescriptor,
  TypedApi,
} from "polkadot-api"

/* eslint-disable @typescript-eslint/no-empty-object-type */
export type AssetStatus = Enum<{
  Live: undefined
  Frozen: undefined
  Destroying: undefined
}>

export type AssetData = {
  owner: SS58String
  issuer: SS58String
  admin: SS58String
  freezer: SS58String
  supply: bigint
  deposit: bigint
  min_balance: bigint
  is_sufficient: boolean
  accounts: number
  sufficients: number
  approvals: number
  status: AssetStatus
}

export type XcmV3Junctions = Enum<{
  Here: undefined
  X1: XcmV3Junction
  X2: FixedSizeArray<2, XcmV3Junction>
  X3: FixedSizeArray<3, XcmV3Junction>
  X4: FixedSizeArray<4, XcmV3Junction>
  X5: FixedSizeArray<5, XcmV3Junction>
  X6: FixedSizeArray<6, XcmV3Junction>
  X7: FixedSizeArray<7, XcmV3Junction>
  X8: FixedSizeArray<8, XcmV3Junction>
}>
export type ForeignAssetKey = {
  parents: number
  interior: XcmV3Junctions
}

export type AssetAccountStatus = Enum<{
  Live: undefined
  Frozen: undefined
  Destroying: undefined
}>

export type AssetAccountReason = Enum<{
  Consumer: undefined
  Sufficient: undefined
  DepositHeld: bigint
  DepositRefunded: undefined
  DepositFrom: [SS58String, bigint]
}>

export type AssetAccountData = {
  balance: bigint
  status: AssetAccountStatus
  reason: AssetAccountReason
}

export type Metadata = {
  deposit: bigint
  name: Binary
  symbol: Binary
  decimals: number
  is_frozen: boolean
}

// TODO: define metadata
export type AllAssetsSDKPallets = PalletsTypedef<
  {
    Assets: {
      Asset: StorageDescriptor<[Key: number], AssetData, true, never>
      Account: StorageDescriptor<
        [number, SS58String],
        AssetAccountData,
        true,
        never
      >
      Metadata: StorageDescriptor<[Key: number], Metadata, false, never>
    }
    ForeignAssets: {
      Asset: StorageDescriptor<[Key: ForeignAssetKey], AssetData, true, never>
      Account: StorageDescriptor<
        [number, SS58String],
        AssetAccountData,
        true,
        never
      >
      Metadata: StorageDescriptor<
        [Key: ForeignAssetKey],
        Metadata,
        false,
        never
      >
    }
    PoolAssets: {
      Asset: StorageDescriptor<[Key: number], AssetData, true, never>
      Account: StorageDescriptor<
        [number, SS58String],
        AssetAccountData,
        true,
        never
      >
      Metadata: StorageDescriptor<[Key: number], Metadata, false, never>
    }
  },
  {},
  {},
  {},
  {}
>

export type AllAssetsSDKDefinition = SdkDefinition<
  AllAssetsSDKPallets,
  ApisTypedef<{}>
>

export type AllAssetsSdkTypedApi = TypedApi<AllAssetsSDKDefinition>
