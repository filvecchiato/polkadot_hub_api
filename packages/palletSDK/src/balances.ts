import { SS58String } from "polkadot-api"
import { NativeBalanceSdkTypedApi } from "./descriptors"

export const balances_getAccountBalance = async (
  typedApi: NativeBalanceSdkTypedApi,
  account: SS58String[],
): Promise<{
  free: bigint
  reserved: bigint
  frozen: bigint
}> => {
  if (account.length === 0) {
    throw new Error("No account provided")
  }

  const query = typedApi.query.Balances.Account

  const balance = await query.getValues(account.map((a) => [a]))

  return balance.reduce(
    (
      acc: { free: bigint; reserved: bigint; frozen: bigint },
      b: { free: bigint; reserved: bigint; frozen: bigint },
    ) => {
      const { free, reserved, frozen } = b
      return {
        free: acc.free + BigInt(free),
        reserved: acc.reserved + BigInt(reserved),
        frozen: acc.frozen + BigInt(frozen),
      }
    },
    {
      free: BigInt(0),
      reserved: BigInt(0),
      frozen: BigInt(0),
    },
  )
}
