import { ChainConnector } from "@/index"
import { SS58String } from "polkadot-api"

export interface DelegatedStakingPalletMethods {
  delegatedStaking_getAccountBalance(account: SS58String[]): Promise<unknown>
  delegatedStaking_getHoldDetails(account: SS58String[]): Promise<unknown>
}

export function DelegatedStakingPalletMixin<T extends ChainConnector>(
  Base: T,
): T & DelegatedStakingPalletMethods {
  if (!Base.pallets.includes("ConvictionVoting")) {
    console.info(
      `ConvictionVoting pallet is not included in the current ${Base.chainInfo.name} runtime, skipping Conviction Voting Pallet Methods mixin.`,
    )
    return Base as T & DelegatedStakingPalletMethods
  }
  return Object.assign(Base, {
    async delegatedStaking_getAccountBalance(
      account: SS58String[],
    ): Promise<unknown> {
      if (account.length === 0) {
        throw new Error("No account provided")
      }

      return null
    },
    async delegatedStaking_getHoldDetails(
      account: SS58String[],
    ): Promise<unknown> {
      if (account.length === 0) {
        throw new Error("No account provided")
      }

      return null
    },
  })
}
