import {
  CompatibilityLevel,
  CompatibilityToken,
  SS58String,
} from "polkadot-api"
import { StakingSdkDefinition, StakingSDKTypedApi } from "./descriptors"

export const staking_getAccountBalance = async (
  typedApi: StakingSDKTypedApi,
  account: SS58String[],
  compatibilityToken: CompatibilityToken<StakingSdkDefinition>,
): Promise<unknown> => {
  if (account.length === 0) {
    throw new Error("No account provided")
  }

  const query = typedApi.query.Staking.Nominators

  if (
    query.isCompatible(
      CompatibilityLevel.BackwardsCompatible,
      compatibilityToken,
    )
  ) {
    // const stakingBalance = await query.getValues(account.map((a) => [a]))

    return null
  }

  throw new Error(
    "Vesting pallet is not compatible with the current chain version",
  )
}
