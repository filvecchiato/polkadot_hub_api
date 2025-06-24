import { Enum, SS58String } from "polkadot-api"

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
