import { AllDescriptors, ChainConnector } from "@/index"
import { ConvictionVotingVoteAccountVote } from "@polkadot-hub-api/descriptors"
// import {
//   ConvictionVotingVoteAccountVote,
//   VotingConviction,
// } from "@polkadot-hub-api/descriptors"
import { CompatibilityLevel, SS58String, TypedApi } from "polkadot-api"

export interface ConvictionVotingPalletMethods {
  pyconvot_getAccountBalance(account: SS58String[]): Promise<unknown>
  pyconvot_getLockDetails(account: SS58String[]): Promise<unknown>
}

// const convictionLockMultiplier: Record<VotingConviction["type"], number> = {
//   None: 0,
//   Locked1x: 1,
//   Locked2x: 2,
//   Locked3x: 4,
//   Locked4x: 8,
//   Locked5x: 16,
//   Locked6x: 32,
// }

//  if winning side and with conviction, wait til conviction to unlock
// if no conviction, can unlock directly
// if losing side can unlock directly

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
      const convictionVoting_votingClasses =
        api.query.ConvictionVoting.ClassLocksFor
      if (
        !convictionVoting_votingClasses.isCompatible(
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

      // get results of tracks for accounts

      const votingClasses = await convictionVoting_votingClasses
        .getValues(account.map((a) => [a]))
        .then((classes) =>
          classes.map((c, i) => ({
            account: account[i],
            classes: c.reduce((acc: number[], cl) => {
              if (cl[1] > 0n) {
                acc.push(cl[0])
              }
              return acc
            }, []),
          })),
        )

      const referendaVotes = await Promise.all(
        votingClasses.map((a) =>
          convictionVoting_votingFor
            .getValues(a.classes.map((cl) => [a.account, cl]))
            .then((votes) => ({
              account: a.account,
              votes: votes,
            })),
        ),
      )

      const referenda = referendaVotes.map((vByA) => ({
        account: vByA.account,
        votes: vByA.votes
          .filter((v) => v.type === "Casting")
          .reduce(
            (
              acc: {
                referendumId: number
                vote: ConvictionVotingVoteAccountVote
              }[],
              v,
            ) => {
              if (v.value.votes.length === 0) {
                return acc
              }
              return acc.concat(
                v.value.votes.map((vote) => ({
                  referendumId: vote[0],
                  vote: vote[1],
                })),
              )
            },
            [],
          ),
      }))

      const referendaOfInterest = referenda.reduce((acc, r) => {
        r.votes.forEach((v) => acc.add(v.referendumId))
        return acc
      }, new Set<number>())

      const referendaResults =
        await api.query.Referenda.ReferendumInfoFor.getValues(
          Array.from(referendaOfInterest.values()).map((t) => [t]),
        )

      console.dir(referendaResults, {
        depth: null,
      })

      // TODO: map through votes and referenda results to calculate lock details
      return null
    },
  })
}
