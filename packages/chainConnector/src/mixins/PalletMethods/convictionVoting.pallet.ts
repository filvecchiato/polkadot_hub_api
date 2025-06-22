import { AllDescriptors, ChainConnector } from "@/index"
import {
  ConvictionVotingVoteAccountVote,
  VotingConviction,
} from "@polkadot-hub-api/descriptors"
import { CompatibilityLevel, SS58String, TypedApi } from "polkadot-api"

export interface ConvictionVotingPalletMethods {
  pyconvot_getAccountBalance(account: SS58String[]): Promise<unknown>
  pyconvot_getLockDetails(account: SS58String[]): Promise<unknown>
}

const convictionLockMultiplier: Record<VotingConviction["type"], number> = {
  None: 0,
  Locked1x: 1,
  Locked2x: 2,
  Locked3x: 4,
  Locked4x: 8,
  Locked5x: 16,
  Locked6x: 32,
}

const convictions = Object.keys(
  convictionLockMultiplier,
) as VotingConviction["type"][]

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

      const referendaOfInterestArray = [...referendaOfInterest]
      const referendaResults =
        await api.query.Referenda.ReferendumInfoFor.getValues(
          referendaOfInterestArray.map((t) => [t]),
        )

      console.dir(referendaResults, {
        depth: null,
      })

      const enhancedReferendaResults = referendaResults
        .map((r, i) => {
          if (r?.type === "Approved") {
            return {
              id: referendaOfInterestArray[i],
              type: r.type,
              block: r.value[0],
              outcome: {
                side: "aye",
                ended: r.value[0],
              },
            }
          } else if (r?.type === "Rejected") {
            return {
              id: referendaOfInterestArray[i],
              type: r.type,
              block: r.value[0],
              outcome: {
                ended: r.value[0],
                side: "nay",
              },
            }
          } else if (r?.type === "Ongoing") {
            return {
              id: referendaOfInterestArray[i],
              type: r.type,
              block: null,
              outcome: null,
            }
          } else if (r?.type === "Killed") {
            return {
              id: referendaOfInterestArray[i],
              type: r.type,
              block: r.value,
              outcome: null,
            }
          }
          return undefined
        })
        .filter((r) => r !== undefined)

      // referenda types Approved, Rejected, Cancelled, TimedOut, Ongoing
      // if approved or rejected, check if won/lost and convitction, calculate lock details
      // if ongoing, check if conviction and calculate lock details
      // TODO: map through votes and referenda results to calculate lock details
      console.dir(enhancedReferendaResults, {
        depth: null,
      })

      // calcuate the lock depending on the votes and store lock bearing votes
      const lockDetails = referenda.map((r) => {
        return r.votes.map((v) => {
          const referendumResult = enhancedReferendaResults.find(
            (rr) => rr.id === v.referendumId,
          )
          if (!referendumResult) {
            throw new Error(
              `Referendum result not found for referendumId ${v.referendumId}`,
            )
          }
          if (referendumResult.type === "Ongoing") {
            // if ongoing, check if conviction and calculate lock details
            // lock is the balance currently
            // if standard get balance, if split check idividual balances if abstain then check balances

            // if ongoing all balance is locked until end of referendum minimum but get balances and vonciction anyway
            if (v.vote.type === "Standard") {
              // standard vote
              const convictionValue = v.vote.value.vote & 0x7f
              const conviction = {
                type: convictions[convictionValue],
                value: undefined,
              }
              const direction: "aye" | "nay" =
                v.vote.value.vote & 0x80 ? "aye" : "nay"

              return {
                // check aye nay, and conviction
                // check if won or lost
                conviction,
                direction,
                balance: v.vote.value.balance,
                referendumId: v.referendumId,
              }
            }
            const votes = {
              aye: v.vote.value.aye,
              nay: v.vote.value.nay,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              abstain: ((v.vote.value as any).abstain as bigint) ?? 0n,
            }

            const votesWithValue = Object.entries(votes).filter(
              ([, v]) => v > 0n,
            )
            if (votesWithValue.length === 1) {
              return {
                referendumId: v.referendumId,
                direction: votesWithValue[0][0],
                balance: votesWithValue[0][1],
                conviction: {
                  type: "None",
                  value: undefined,
                },
              }
            }
            // return {
            //   balance: Object.values(votes).reduce((a, b) => a + b),
            //   ...votes,
            //   referendumId: v.referendumId,
            //   conviction: {
            //     type: "None",
            //     value: undefined,
            //   },
            // }

            // return {
            //   referendumId: v.referendumId,
            //   conviction: {
            //     type: "None",
            //     value: undefined,
            //   },
            //   direction: undefined, // default to aye, as ongoing
            //   balance: v.vote.value.balance,
            // }

            // TODO: do approved, rejected, ongoing, killed
          }
          return null
        })
      })
      return lockDetails
    },
  })
}
