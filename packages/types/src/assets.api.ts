import { Enum, SS58String } from "polkadot-api"
import { WellKnownChainIds } from "./wellKnownChains"

export type TAccountBalance = {
  total: bigint
  transferrable: bigint
  allocated: bigint // tokens not available for transfer but available for other operations like staking/voting/etc
  reserved: bigint
  locked: bigint
  reservedDetails: {
    value: bigint
    id: string
    chainId: WellKnownChainIds
  }[]
  lockedDetails: {
    chainId: WellKnownChainIds
    value: bigint
    id: string
    details?: () => Promise<unknown>
  }[]
  locations: {
    total: bigint
    location: WellKnownChainIds
    decimals: number
  }[]
}

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
