import { SS58String } from "polkadot-api"
import { VestingData, VestingSdkTypedApi } from "./descriptors"

export const vesting_getAccountBalance = async (
  typedApi: VestingSdkTypedApi,
  account: SS58String[],
): Promise<
  | {
      locked: bigint
      perBlock: bigint
    }
  | undefined
> => {
  if (account.length === 0) {
    throw new Error("No account provided")
  }

  const query = typedApi.query.Vesting.Vesting

  const vestingBalance = await query.getValues(account.map((a) => [a]))
  return vestingBalance.reduce(
    (
      acc: { locked: bigint; perBlock: bigint },
      balance: VestingData | undefined,
    ) => {
      const accountVestingBalance = balance?.reduce(
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

      if (!accountVestingBalance) {
        return acc
      }
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
}
