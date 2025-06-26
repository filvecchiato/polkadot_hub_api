import { ChainConnector } from "@/index"
import { AllDescriptors } from "@polkadot-hub-api/types"
import { CompatibilityLevel, SS58String, TypedApi } from "polkadot-api"
import { LoggerFactory } from "@polkadot-hub-api/utils"

const log = LoggerFactory.getLogger("ChainConnector")

export interface VestingPalletMethods {
  vesting_getAccountBalance(account: SS58String[]): Promise<{
    locked: bigint
    perBlock: bigint
  }>
  vesting_getLockDetails(account: SS58String[]): Promise<unknown>
}

export function VestingPalletMixin<T extends ChainConnector>(
  Base: T,
): T & VestingPalletMethods {
  if (!Base.pallets.includes("Vesting")) {
    log.info(
      `Vesting pallet is not included in the current ${Base.chainInfo.name} runtime, skipping Vesting Pallet Methods mixin.`,
    )
    return Base as T & VestingPalletMethods
  }
  return Object.assign(Base, {
    async vesting_getAccountBalance(account: SS58String[]) {
      if (account.length === 0) {
        throw new Error("No account provided")
      }

      const api = Base.api as unknown as TypedApi<AllDescriptors>
      if (!api.query.Vesting) {
        throw new Error(
          "Vesting pallet is not available in the current runtime",
        )
      }
      const vesting_Account = api.query.Vesting.Vesting

      if (
        !vesting_Account.isCompatible(
          CompatibilityLevel.BackwardsCompatible,
          Base.compatibilityToken,
        )
      ) {
        throw new Error(
          "Vesting.Vesting is not compatible with the current runtime",
        )
      }

      const balance = await vesting_Account.getValues(account.map((a) => [a]))

      return balance.reduce(
        (acc: { locked: bigint; perBlock: bigint }, balance) => {
          if (!balance) {
            return acc
          }

          const accountVestingBalance = balance.reduce(
            (
              acc: { locked: bigint; per_block: bigint },
              ab: { locked: bigint; per_block: bigint },
            ) => {
              const { locked, per_block } = ab
              return {
                locked: acc.locked + BigInt(locked),
                per_block: acc.per_block + BigInt(per_block),
              }
            },
            {
              locked: BigInt(0),
              per_block: BigInt(0),
            },
          )
          const { locked, per_block } = accountVestingBalance

          return {
            locked: acc.locked + BigInt(locked),
            perBlock: acc.perBlock + BigInt(per_block),
          }
        },
        {
          locked: 0n,
          perBlock: 0n,
        },
      )
    },
    async vesting_getLockDetails(account: SS58String[]) {
      if (account.length === 0) {
        throw new Error("No account provided")
      }

      const api = Base.api as unknown as TypedApi<AllDescriptors>
      if (!api.query.Vesting) {
        throw new Error(
          "Vesting pallet is not available in the current runtime",
        )
      }
      const vesting_Account = api.query.Vesting.Vesting

      if (
        !vesting_Account.isCompatible(
          CompatibilityLevel.BackwardsCompatible,
          Base.compatibilityToken,
        )
      ) {
        throw new Error(
          "Vesting.Vesting is not compatible with the current runtime",
        )
      }

      // get locked tokens for vesting: if no vesting id skip else continue
      // get current block number
      const vestingData = await vesting_Account
        .getValues(account.map((a) => [a]))
        .then((data) => {
          return data.filter((d) => d !== undefined).map((d) => d!)
        })

      if (vestingData.length === 0) {
        return []
      }

      for (const data of vestingData) {
        for (const vesting of data) {
          const blocks = vesting.locked / vesting.per_block
          log.info(
            `${vesting.locked} locked tokens, which will be released in ${blocks} blocks.`,
          )
          log.info(
            `time to relase all tokens: ${Number(blocks) / 600} hours (assuming 1 block = 6 seconds).`,
          )
          log.info(
            `Per block release: ${vesting.starting_block + Number(blocks)} tokens.`,
          )
        }
      }

      // get current block and current vestiing, calculate remaining vesting
      return vesting_Account.getValues(account.map((a) => [a])).then((data) => {
        return data.filter((d) => d !== undefined).map((d) => d!)
      })
    },
  })
}
