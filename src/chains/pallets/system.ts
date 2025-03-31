import { CompatibilityLevel, SS58String } from "polkadot-api"
import { NativeBalanceSdkTypedApi } from "./descriptors"
import { ChainConnector } from ".."

export const system_getAccountBalance = async (
  chain: ChainConnector,
  typedApi: NativeBalanceSdkTypedApi,
  account: SS58String[],
): Promise<{
  free: bigint
  reserved: bigint
  frozen: bigint
}> => {
  if (!chain.pallets.includes("System")) {
    throw new Error("No System pallet found")
  }
  if (account.length === 0) {
    throw new Error("No account provided")
  }

  const query = typedApi.query.System.Account

  const balance = query.isCompatible(
    CompatibilityLevel.BackwardsCompatible,
    chain.compatibilityToken,
  )
    ? await query.getValues(account.map((a) => [a]))
    : []
  return balance.reduce(
    (acc, b) => {
      const { free, reserved, frozen } = b.data
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
