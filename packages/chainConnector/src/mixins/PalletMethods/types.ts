import { PreimagesBounded } from "@polkadot-hub-api/descriptors"
import { Enum, FixedSizeArray, SS58String } from "polkadot-api"

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
