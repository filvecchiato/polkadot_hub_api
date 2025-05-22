import { SS58String } from "polkadot-api"
import { StakingSDKTypedApi } from "./descriptors"

export const staking_getAccountBalance = async (
  typedApi: StakingSDKTypedApi,
  account: SS58String[],
): Promise<
  {
    stash: SS58String
    total: bigint
    active: bigint
    unlocking: Array<{
      value: bigint
      era: number
    }>
  }[]
> => {
  if (account.length === 0) {
    throw new Error("No account provided")
  }
  // get stash account
  const stash = await typedApi.query.Staking.Bonded.getValues(
    account.map((a) => [a]),
  ).then((data) => data.filter((s) => s !== undefined).map((s) => s!))
  const ledgers = await typedApi.query.Staking.Ledger.getValues(
    stash.map((s) => [s!]),
  ).then((data) => data.filter((l) => l !== undefined).map((l) => l!))

  const stashAccounts = ledgers.map((s) => ({
    stash: s.stash,
    total: s.total,
    active: s.active,
    unlocking: s.unlocking,
  }))

  return stashAccounts
}
