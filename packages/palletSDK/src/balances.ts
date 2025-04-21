import { SS58String } from "polkadot-api"
import { NativeBalanceSdkTypedApi } from "./descriptors"

export const balances_getAccountBalance = async (
  typedApi: NativeBalanceSdkTypedApi,
  account: SS58String[],
): Promise<{
  transferrable: bigint
  reserved: bigint
  locked: bigint
  total: bigint
}> => {
  if (account.length === 0) {
    throw new Error("No account provided")
  }

  const query = typedApi.query.Balances.Account

  const balance = await query.getValues(account.map((a) => [a]))

  return balance.reduce(
    (
      acc: {
        total: bigint
        transferrable: bigint
        reserved: bigint
        locked: bigint
      },
      b: { free: bigint; reserved: bigint; frozen: bigint },
    ) => {
      const { free, reserved, frozen } = b
      return {
        total: acc.total + BigInt(free) + BigInt(reserved),
        transferrable: acc.transferrable + BigInt(free) - BigInt(frozen),
        reserved: acc.reserved + BigInt(reserved),
        locked: acc.locked + BigInt(frozen),
      }
    },
    {
      total: BigInt(0),
      transferrable: BigInt(0),
      reserved: BigInt(0),
      locked: BigInt(0),
    },
  )
}
