import { ChainConnector, AllTypedApi } from "@/index"
import { CompatibilityLevel, SS58String } from "polkadot-api"

import { LoggerFactory } from "@polkadot-hub-api/utils"

const log = LoggerFactory.getLogger("ChainConnector")

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

// const convictions = Object.keys(
//   convictionLockMultiplier,
// ) as VotingConviction["type"][]

//  if winning side and with conviction, wait til conviction to unlock
// if no conviction, can unlock directly
// if losing side can unlock directly

// const enhanceReferendumResult = (referendum: ReferendumInfo, id: number) => {
//   if (referendum.type === "Approved") {
//     return {
//       id: id,
//       type: referendum.type,
//       block: referendum.value[0],
//       outcome: {
//         side: "aye",
//         ended: referendum.value[0],
//       },
//     }
//   } else if (referendum.type === "Rejected") {
//     return {
//       id: id,
//       type: referendum.type,
//       block: referendum.value[0],
//       outcome: {
//         ended: referendum.value[0],
//         side: "nay",
//       },
//     }
//   } else if (referendum.type === "Ongoing") {
//     return {
//       id: id,
//       type: referendum.type,
//       block: null,
//       outcome: {
//         side: null,
//         ended: null,
//       },
//     }
//   } else if (referendum.type === "Killed") {
//     return {
//       id: id,
//       type: referendum.type,
//       block: referendum.value,
//       outcome: null,
//     }
//   } else if (referendum.type === "TimedOut") {
//     return {
//       id: id,
//       type: referendum.type,
//       block: null,
//       outcome: null,
//     }
//   } else if (referendum.type === "Cancelled") {
//     return {
//       id: id,
//       type: referendum.type,
//       block: referendum.value,
//       outcome: null,
//     }
//   }
//   return undefined
// }

export function ConvictionVotingPalletMixin<T extends ChainConnector>(
  Base: T,
): T & ConvictionVotingPalletMethods {
  if (!Base.pallets.includes("ConvictionVoting")) {
    log.info(
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

      const api = Base.api as AllTypedApi
      if (!api.query.ConvictionVoting) {
        throw new Error(
          "Conviction Voting pallet is not available in the current runtime",
        )
      }
      // const convictionVoting_VoteLockingPeriod =
      //   await api.constants.ConvictionVoting.VoteLockingPeriod()
      const convictionVoting_votingFor = api.query.ConvictionVoting.VotingFor
      // get tracks
      const currentBlock = await api.query.System.Number.getValue()
      log.info(`Current block number: ${currentBlock}`)
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

      // const referendaOfInterest = referendaVotes.reduce((acc, vByA) => {
      //   if (vByA.votes.length === 0) {
      //     return acc
      //   }
      //   for (const v of vByA.votes) {
      //     if (v.type === "Casting") {
      //       for (const vote of v.value.votes) {
      //         acc.add(vote[0])
      //       }
      //     }
      //   }
      //   return acc
      // }, new Set<number>())

      // const referendaOfInterestArray = [...referendaOfInterest]
      // const referendaResults =
      //   await api.query.Referenda.ReferendumInfoFor.getValues(
      //     referendaOfInterestArray.map((t) => [t]),
      //   )

      // const enhancedReferendaResults = referendaResults
      //   .map((r, i) => {
      //     if (r === undefined) {
      //       log.warn(
      //         `Referendum result not found for referendumId ${referendaOfInterestArray[i]}`,
      //       )
      //       return undefined
      //     }
      //     return enhanceReferendumResult(r, referendaOfInterestArray[i])
      //   })
      //   .filter((r) => r !== undefined)

      let lockBalance = 0n
      const timelock: {
        amount: bigint
        status?: "Delegating" | "conviction" | "withdrawable"
        timelock: number
      }[] = []
      const lockDetails: {
        referendumId: number
        accountId: SS58String
      }[] = []

      for (const vByA of referendaVotes) {
        for (const v of vByA.votes) {
          if (v.type === "Delegating") {
            // skip delegation votes for now
            //       type: "delegating",
            // target: votingFor.value.target,
            // balance: votingFor.value.balance,
            // conviction: votingFor.value.conviction,
            // lockDuration:
            //   convictionLockMultiplier[votingFor.value.conviction.type] *
            //   voteLockingPeriod,.
            if (v.value.prior[0] > 0) {
              lockBalance += v.value.balance
              timelock.push({
                amount: v.value.balance,
                status: "Delegating",
                timelock: v.value.prior[0],
              })
            }
            continue
          }
          if (v.value.prior[0] > 0) {
            lockBalance += v.value.prior[1]
            // check if ongoing or with conviction active. if so push to timelock and amount to locked balance, else push to lockedBalance and set
            timelock.push({
              amount: v.value.prior[1],
              timelock: v.value.prior[0],
            })
            // log.dir(
            //   {
            //     votes: v.value.votes.map(([referendumId, vote]) => {
            //       const referendumResult = enhancedReferendaResults.find(
            //         (rr) => rr.id === referendumId,
            //       )
            //       if (vote.type === "Standard") {
            //         const convictionValue = vote.value.vote & 0x7f

            //         const conviction = {
            //           type: convictions[convictionValue],
            //           value:
            //             convictionLockMultiplier[convictions[convictionValue]] *
            //             convictionVoting_VoteLockingPeriod,
            //         }
            //         return {
            //           conviction,
            //           direction: vote.value.vote & 0x80 ? "aye" : "nay",
            //           balance: vote.value.balance,
            //           referendumResult,
            //         }
            //       }
            //       const votes = {
            //         aye: vote.value.aye,
            //         nay: vote.value.nay,
            //         // eslint-disable-next-line @typescript-eslint/no-explicit-any
            //         abstain: (vote.value as any).abstain ?? 0n,
            //       }
            //       const votesWithValue = Object.entries(votes).filter(
            //         ([, v]) => v > 0n,
            //       )
            //       if (votesWithValue.length === 1) {
            //         return {
            //           referendumResult,
            //           direction: votesWithValue[0][0],
            //           balance: votesWithValue[0][1],
            //           conviction: {
            //             type: "None",
            //             value: 0,
            //           },
            //         }
            //       }
            //       return {
            //         referendumResult,
            //         conviction: {
            //           type: "None",
            //           value: 0,
            //         },
            //         direction: undefined,
            //         balance: Object.values(votes).reduce((a, b) => a + b),
            //       }
            //     }),
            //     prior: v.value.prior,
            //   },
            //   { depth: null },
            // )
          }
        }
      }

      return {
        balance: lockBalance,
        timelock,
        details: lockDetails,
      }
      // const lockDetails = referenda.map((r) => {
      //   return r.votes.map((v) => {
      //     const referendumResult = enhancedReferendaResults.find(
      //       (rr) => rr.id === v.referendumId,
      //     )
      //     if (!referendumResult) {
      //       log.warn(
      //         `Referendum result not found for referendumId ${v.referendumId}`,
      //       )
      //       return null
      //     }
      //     // if ongoing, check if conviction and calculate lock details
      //     // lock is the balance currently
      //     // if standard get balance, if split check idividual balances if abstain then check balances

      //     // if ongoing all balance is locked until end of referendum minimum but get balances and vonciction anyway
      //     if (v.vote.type === "Standard") {
      //       // standard vote
      //       const convictionValue = v.vote.value.vote & 0x7f
      //       const conviction = {
      //         type: convictions[convictionValue],
      //         value: convictionValue * convictionVoting_VoteLockingPeriod,
      //       }
      //       const direction: "aye" | "nay" =
      //         v.vote.value.vote & 0x80 ? "aye" : "nay"

      //       return {
      //         // check aye nay, and conviction
      //         // check if won or lost
      //         conviction,
      //         direction,
      //         balance: v.vote.value.balance,
      //         referendumId: v.referendumId,
      //       }
      //     }
      //     const votes = {
      //       aye: v.vote.value.aye,
      //       nay: v.vote.value.nay,
      //       // eslint-disable-next-line @typescript-eslint/no-explicit-any
      //       abstain: ((v.vote.value as any).abstain as bigint) ?? 0n,
      //     }

      //     const votesWithValue = Object.entries(votes).filter(([, v]) => v > 0n)
      //     if (votesWithValue.length === 1) {
      //       return {
      //         referendumId: v.referendumId,
      //         direction: votesWithValue[0][0],
      //         balance: votesWithValue[0][1],
      //         conviction: {
      //           type: "None",
      //           value: 0,
      //         },
      //       }
      //     }

      //     return {
      //       referendumId: v.referendumId,
      //       conviction: {
      //         type: "None",
      //         value: 0,
      //       },
      //       direction: undefined,
      //       balance: Object.values(votes).reduce((a, b) => a + b),
      //     }

      //     // TODO: do approved, rejected, ongoing, killed
      //   })
      // })
      // return lockDetails
    },
  })
}
