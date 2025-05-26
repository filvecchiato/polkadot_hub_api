import { AllDescriptors, ChainConnector } from "@/index"
import { CompatibilityLevel, SS58String, TypedApi } from "polkadot-api"

export interface VestingPalletMethods {
  vesting_getAccountBalance(account: SS58String[]): Promise<{
    locked: bigint
    perBlock: bigint
  }>
}

export function VestingPalletMixin<T extends ChainConnector>(
  Base: T,
): T & VestingPalletMethods {
  if (!Base.pallets.includes("Vesting")) {
    console.info(
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
  })
}
