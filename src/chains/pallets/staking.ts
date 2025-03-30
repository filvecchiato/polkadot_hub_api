import { CompatibilityLevel, SS58String } from "polkadot-api"
import { ChainConnector } from ".."
import { StakingSDKTypedApi } from "./descriptors"

export const staking_getAccountBalance = async (
  chain: ChainConnector,
  typedApi: StakingSDKTypedApi,
  account: SS58String[],
): Promise<unknown> => {
  if (!chain.pallets.includes("Staking")) {
    throw new Error("No Staking pallet found")
  }
  if (account.length === 0) {
    throw new Error("No account provided")
  }

  const query = typedApi.query.Staking.Nominators

  if (
    query.isCompatible(
      CompatibilityLevel.BackwardsCompatible,
      chain.compatibilityToken,
    )
  ) {
    // const stakingBalance = await query.getValues(account.map((a) => [a]))

    return null
  }

  throw new Error(
    "Vesting pallet is not compatible with the current chain version",
  )
}
