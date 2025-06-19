import { AllDescriptors, ChainConnector } from "@/index"
import { CompatibilityLevel, SS58String, TypedApi } from "polkadot-api"

export interface ConvictionVotingPalletMethods {
  pyconvot_getAccountBalance(account: SS58String[]): Promise<unknown>
  pyconvot_getLockDetails(account: SS58String[]): Promise<unknown>
}

export function ConvictionVotingPalletMixin<T extends ChainConnector>(
  Base: T,
): T & ConvictionVotingPalletMethods {
  if (!Base.pallets.includes("ConvictionVoting")) {
    console.info(
      `ConvictionVoting pallet is not included in the current ${Base.chainInfo.name} runtime, skipping Conviction Voting Pallet Methods mixin.`,
    )
    return Base as T & ConvictionVotingPalletMethods
  }
  return Object.assign(Base, {
    async pyconvot_getAccountBalance(account: SS58String[]): Promise<unknown> {
      if (account.length === 0) {
        throw new Error("No account provided")
      }

      return null
    },
    async pyconvot_getLockDetails(account: SS58String[]): Promise<unknown> {
      if (account.length === 0) {
        throw new Error("No account provided")
      }

      const api = Base.api as unknown as TypedApi<AllDescriptors>
      if (!api.query.ConvictionVoting) {
        throw new Error(
          "Conviction Voting pallet is not available in the current runtime",
        )
      }
      // const convictionVoting_VoteLockingPeriod =
      //   await api.constants.ConvictionVoting.VoteLockingPeriod()

      const convictionVoting_votingFor = api.query.ConvictionVoting.VotingFor
      // get tracks
      const convictionVoting_tracks = api.query.ConvictionVoting.ClassLocksFor
      if (
        !convictionVoting_tracks.isCompatible(
          CompatibilityLevel.BackwardsCompatible,
          Base.compatibilityToken,
        )
      ) {
        throw new Error(
          "ConvictionVoting.ClassLocksFor is not compatible with the current runtime",
        )
      }
      if (
        !convictionVoting_votingFor.isCompatible(
          CompatibilityLevel.BackwardsCompatible,
          Base.compatibilityToken,
        )
      ) {
        throw new Error(
          "ConvictionVoting.VotingFor is not compatible with the current runtime",
        )
      }

      const locks = await convictionVoting_tracks.getValues(
        account.map((a) => [a]),
      )

      const queries = account
        .map((a, i) => locks[i].map((lock) => [a, lock[0]]))
        .flat() as unknown as [SS58String, number][]
      const votes = await convictionVoting_votingFor.getValues(queries)

      return votes
    },
  })
}
