import { AllDescriptors, ChainConnector } from "@/index"
import { CompatibilityLevel, SS58String, TypedApi } from "polkadot-api"

export interface StakingPalletMethods {
  staking_getAccountBalance(account: SS58String[]): Promise<
    {
      stash: SS58String
      total: bigint
      active: bigint
      unlocking: Array<{
        value: bigint
        era: number
      }>
    }[]
  >
  staking_getLockDetails(account: SS58String[]): Promise<unknown>
}

export function StakingPalletMixin<T extends ChainConnector>(
  Base: T,
): T & StakingPalletMethods {
  if (!Base.pallets.includes("Staking")) {
    console.info(
      `Staking pallet is not included in the current ${Base.chainInfo.name} runtime, skipping Staking Pallet Methods mixin.`,
    )
    return Base as T & StakingPalletMethods
  }
  return Object.assign(Base, {
    async staking_getAccountBalance(account: SS58String[]) {
      if (account.length === 0) {
        throw new Error("No account provided")
      }
      const typedApi = Base.api as unknown as TypedApi<AllDescriptors>

      if (!typedApi.query.Staking) {
        throw new Error("Staking pallet is not available in the API")
      }

      const staking_Bonded = typedApi.query.Staking.Bonded

      if (
        !staking_Bonded.isCompatible(
          CompatibilityLevel.BackwardsCompatible,
          Base.compatibilityToken,
        )
      ) {
        throw new Error(
          "Staking.Bonded is not compatible with the current runtime",
        )
      }

      const stash = await staking_Bonded
        .getValues(account.map((a) => [a]))
        .then((data) => data.filter((s) => s !== undefined).map((s) => s!))

      if (stash.length === 0) {
        return []
      }
      const staking_Ledger = typedApi.query.Staking.Ledger
      if (
        !staking_Ledger.isCompatible(
          CompatibilityLevel.BackwardsCompatible,
          Base.compatibilityToken,
        )
      ) {
        throw new Error(
          "Staking.Ledger is not compatible with the current runtime",
        )
      }
      const ledgers = await staking_Ledger
        .getValues(stash.map((s) => [s!]))
        .then((data) => data.filter((l) => l !== undefined).map((l) => l!))

      const stashAccounts = ledgers.map((s) => ({
        stash: s.stash,
        total: s.total,
        active: s.active,
        unlocking: s.unlocking,
      }))

      return stashAccounts
    },
    async staking_getLockDetails(account: SS58String[]) {
      if (account.length === 0) {
        throw new Error("No account provided")
      }

      const typedApi = Base.api as unknown as TypedApi<AllDescriptors>

      if (!typedApi.query.Staking) {
        throw new Error("Staking pallet is not available in the API")
      }

      const staking_Ledger = typedApi.query.Staking.Ledger

      if (
        !staking_Ledger.isCompatible(
          CompatibilityLevel.BackwardsCompatible,
          Base.compatibilityToken,
        )
      ) {
        throw new Error(
          "Staking.Ledger is not compatible with the current runtime",
        )
      }

      const ledgers = await staking_Ledger
        .getValues(account.map((a) => [a]))
        .then((data) => data.filter((l) => l !== undefined).map((l) => l!))

      return ledgers
    },
  })
}
