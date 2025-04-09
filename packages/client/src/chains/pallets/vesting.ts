import { CompatibilityLevel, SS58String } from "polkadot-api"
import { ChainConnector } from ".."
import { VestingSdkTypedApi } from "./descriptors"

export const vesting_getAccountBalance = async (
  chain: ChainConnector,
  typedApi: VestingSdkTypedApi,
  account: SS58String[],
): Promise<{
  locked: bigint
  perBlock: bigint
}> => {
  if (!chain.pallets.includes("Vesting")) {
    throw new Error("No Vesting pallet found")
  }
  if (account.length === 0) {
    throw new Error("No account provided")
  }

  const query = typedApi.query.Vesting.Vesting

  if (
    query.isCompatible(
      CompatibilityLevel.BackwardsCompatible,
      chain.compatibilityToken,
    )
  ) {
    const vestingBalance = await query.getValues(account.map((a) => [a]))

    return vestingBalance.reduce(
      (acc, balance) => {
        const accountVestingBalance = balance?.reduce(
          (acc, ab) => {
            const { locked, per_block } = ab
            return {
              ...acc,
              locked: acc.locked + BigInt(locked),
              perBlock: acc.per_block + BigInt(per_block),
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

  throw new Error(
    "Vesting pallet is not compatible with the current chain version",
  )
}
