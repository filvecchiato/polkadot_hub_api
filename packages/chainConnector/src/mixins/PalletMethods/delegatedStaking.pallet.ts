import { ChainConnector } from "@/index"
import { SS58String } from "polkadot-api"
import { LoggerFactory } from "@polkadot-hub-api/utils"

const log = LoggerFactory.getLogger("ChainConnector")

export interface DelegatedStakingPalletMethods {
  delegatedStaking_getAccountBalance(account: SS58String[]): Promise<unknown>
  delegatedStaking_getHoldDetails(account: SS58String[]): Promise<unknown>
}

export function DelegatedStakingPalletMixin<T extends ChainConnector>(
  Base: T,
): T & DelegatedStakingPalletMethods {
  if (!Base.pallets.includes("DelegatedStaking")) {
    log.info(
      `DelegatedStaking pallet is not included in the current ${Base.chainInfo.name} runtime, skipping Delegated Staking Pallet Methods mixin.`,
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

      const api = Base.api
      if (!api.query.DelegatedStaking) {
        throw new Error(
          "Delegated Staking pallet is not available in the current runtime",
        )
      }

      const delegatedStaking_HoldDetails =
        api.query.DelegatedStaking?.Delegators

      if (!delegatedStaking_HoldDetails) {
        throw new Error(
          "DelegatedStaking.Delegators is not compatible with the current runtime",
        )
      }

      const holdDetails = await delegatedStaking_HoldDetails
        .getValues(account.map((a) => [a]))
        .then((data) => data.filter((h) => h !== undefined).map((h) => h!))
      return holdDetails
    },
  })
}
