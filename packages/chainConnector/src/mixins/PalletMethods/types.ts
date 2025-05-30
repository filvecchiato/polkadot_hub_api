import { SS58String } from "polkadot-api"

export type TAsset = {
  id: string
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
