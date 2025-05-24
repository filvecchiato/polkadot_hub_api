/* eslint-disable @typescript-eslint/no-empty-object-type */
import { SdkDefinition } from "@polkadot-api/common-sdk-utils"
import { BalancesTypesReasons } from "@polkadot-hub-api/descriptors"
import {
  ApisTypedef,
  FixedSizeBinary,
  PalletsTypedef,
  SS58String,
  StorageDescriptor,
  TypedApi,
} from "polkadot-api"

export type AccountBalance = {
  free: bigint
  reserved: bigint
  frozen: bigint
  flags: bigint
}
export type SystemAccountData = {
  nonce: number
  consumers: number
  providers: number
  sufficients: number
  data: AccountBalance
}

export type LockData = {
  id: FixedSizeBinary<8>
  amount: bigint
  reasons: BalancesTypesReasons
}

export type ReserveData = {
  id: FixedSizeBinary<8>
  amount: bigint
}
export type ReservesArray = Array<ReserveData>

export type LocksArray = Array<LockData>

type AnonymousEnum<T extends {}> = T & {
  __anonymous: true
}
export type Ib6ve2drlnapui = AnonymousEnum<{
  StakingDelegation: undefined
}>
export type I7lf1val3vmpq0 = AnonymousEnum<{
  SlashForMigrate: undefined
}>

// export type HoldId = AnonymousEnum<{
//   Preimage: PreimagePalletHoldReason
//   DelegatedStaking: Ib6ve2drlnapui
//   StateTrieMigration: I7lf1val3vmpq0
// }>

export type HoldReason = AnonymousEnum<{
  isCouncil: boolean
  asCouncil: AnonymousEnum<{
    isProposalSubmission: boolean
    type: "ProposalSubmission"
  }>
  isTechnicalCommittee: boolean
  asTechnicalCommittee: AnonymousEnum<{
    isProposalSubmission: boolean
    type: "ProposalSubmission"
  }>
  isContracts: boolean
  asContracts: AnonymousEnum<{
    isCodeUploadDepositReserve: boolean
    isStorageDepositReserve: boolean
    type: "CodeUploadDepositReserve" | "StorageDepositReserve"
  }>
  isPreimage: boolean
  asPreimage: AnonymousEnum<{
    isPreimage: boolean
    type: "Preimage"
  }>
  isNis: boolean
  asNis: AnonymousEnum<{
    isNftReceipt: boolean
    type: "NftReceipt"
  }>
  isNftFractionalization: boolean
  asNftFractionalization: AnonymousEnum<{
    isFractionalized: boolean
    type: "Fractionalized"
  }>
  isTransactionStorage: boolean
  asTransactionStorage: AnonymousEnum<{
    isStorageFeeHold: boolean
    type: "StorageFeeHold"
  }>
  isStateTrieMigration: boolean
  asStateTrieMigration: AnonymousEnum<{
    isSlashForMigrate: boolean
    type: "SlashForMigrate"
  }>
  isAllianceMotion: boolean
  asAllianceMotion: AnonymousEnum<{
    isProposalSubmission: boolean
    type: "ProposalSubmission"
  }>
  isSafeMode: boolean
  asSafeMode: AnonymousEnum<{
    isEnterOrExtend: boolean
    type: "EnterOrExtend"
  }>
  isRevive: boolean
  asRevive: AnonymousEnum<{
    isCodeUploadDepositReserve: boolean
    isStorageDepositReserve: boolean
    isAddressMapping: boolean
    type:
      | "CodeUploadDepositReserve"
      | "StorageDepositReserve"
      | "AddressMapping"
  }>
  type:
    | "Council"
    | "TechnicalCommittee"
    | "Contracts"
    | "Preimage"
    | "Nis"
    | "NftFractionalization"
    | "TransactionStorage"
    | "StateTrieMigration"
    | "AllianceMotion"
    | "SafeMode"
    | "Revive"
}>
export type HoldData = {
  id: HoldReason
  amount: bigint
}
export type HoldsArray = Array<HoldData>
export type FreezeData = {
  id: HoldReason
  amount: bigint
}
export type FreezesArray = Array<FreezeData>
export type AllNativeBalanceSDKPallets = PalletsTypedef<
  {
    System: {
      Account: StorageDescriptor<
        [Key: SS58String],
        SystemAccountData,
        false,
        never
      >
    }
    Balances: {
      Account: StorageDescriptor<
        [Key: SS58String],
        AccountBalance,
        false,
        never
      >
      Locks: StorageDescriptor<[Key: SS58String], LocksArray, false, never>
      Reserves: StorageDescriptor<
        [Key: SS58String],
        ReservesArray,
        false,
        never
      >
      Holds: StorageDescriptor<[Key: SS58String], HoldsArray, false, never>
      Frezees: StorageDescriptor<[Key: SS58String], FreezesArray, false, never>
    }
  },
  {},
  {},
  {},
  {}
>

export type AllNativeBalanceSDKDefinition = SdkDefinition<
  AllNativeBalanceSDKPallets,
  ApisTypedef<{}>
>

export type NativeBalanceSdkTypedApi = TypedApi<AllNativeBalanceSDKDefinition>
