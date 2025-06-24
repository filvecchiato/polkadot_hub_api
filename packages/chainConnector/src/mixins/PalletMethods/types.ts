import { PreimagesBounded } from "@polkadot-hub-api/descriptors"
import { Enum, FixedSizeArray, SS58String } from "polkadot-api"

export type TAsset = {
  id: number
  owner: SS58String
  issuer: SS58String
  admin: SS58String
  freezer: SS58String
  supply: bigint
  min_balance: bigint
  is_sufficient: boolean
  accounts: number
  sufficients: number
  approvals: number
  status: {
    type: string
    value?: unknown
  }
}

export type TAddressAssetBalance = {
  id: number
  pallet: string
  balance: bigint
  address: SS58String[]
  status: Enum<{ Liquid: undefined; Frozen: undefined; Blocked: undefined }>
  reason?: Enum<{
    Consumer: undefined
    Sufficient: undefined
    DepositHeld: bigint
    DepositRefunded: undefined
    DepositFrom: [SS58String, bigint]
  }>
  info: () => Promise<{
    assets?: TAsset[]
    poolAssets?: TAsset[]
  }>
  metadata: () => Promise<{
    id: number
    name: string
    symbol: string
    decimals: number
    deposit: bigint
    isFrozen: boolean
  } | null>
}

export enum ELockId {
  Vesting = "vesting",
  Staking = "staking",
  Democracy = "democrac",
  ElectionsPhragmen = "phrelect",
  Assembly = "assembly",
}

export enum CONVICTION_MULTIPLIERS {
  "None",
  "Locked1x",
  "Locked2x",
  "Locked3x",
  "Locked4x",
  "Locked5x",
  "Locked6x",
}

type BasicReferendumInfo = [
  number,
  (
    | {
        who: SS58String
        amount: bigint
      }
    | undefined
  ),
  (
    | {
        who: SS58String
        amount: bigint
      }
    | undefined
  ),
]

export type ReferendumInfo = Enum<{
  Ongoing: {
    track: number
    origin: unknown
    proposal: PreimagesBounded
    enactment: Enum<{
      At: number
      After: number
    }>
    submitted: number
    submission_deposit:
      | {
          who: SS58String
          amount: bigint
        }
      | undefined
    decision_deposit?:
      | {
          who: SS58String
          amount: bigint
        }
      | undefined
    deciding?:
      | {
          since: number
          confirming?: number | undefined
        }
      | undefined
    tally: {
      ayes: bigint
      nays: bigint
      support: bigint
    }
    in_queue: boolean
    alarm?: [number, FixedSizeArray<2, number>] | undefined
  }
  Approved: BasicReferendumInfo
  Rejected: BasicReferendumInfo
  Cancelled: BasicReferendumInfo
  TimedOut: BasicReferendumInfo
  Killed: number
}>
