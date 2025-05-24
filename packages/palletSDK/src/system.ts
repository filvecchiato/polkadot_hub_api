import { SS58String } from "polkadot-api"
import { NativeBalanceSdkTypedApi } from "./descriptors"

// export class SystemPalletSDK<T extends NativeBalanceSdkTypedApi> {
//   typedApi: T

//   constructor(typedApi: T) {
//     this.typedApi = typedApi
//   }

//   async getAccountBalance(
//     account: SS58String[],
//     compatibilityToken: CompatibilityToken<AllNativeBalanceSDKDefinition>,
//   ) {
//     if (account.length === 0) {
//       throw new Error("No account provided")
//     }

//     const query = this.typedApi.query.System.Account

//     const balance = query.isCompatible(
//       CompatibilityLevel.BackwardsCompatible,
//       compatibilityToken,
//     )
//       ? await query.getValues(account.map((a) => [a]))
//       : []

//     return balance.reduce(
//       (
//         acc: { free: bigint; reserved: bigint; frozen: bigint },
//         b: { data: { free: bigint; reserved: bigint; frozen: bigint } },
//       ) => {
//         const { free, reserved, frozen } = b.data
//         return {
//           free: acc.free + BigInt(free),
//           reserved: acc.reserved + BigInt(reserved),
//           frozen: acc.frozen + BigInt(frozen),
//         }
//       },
//       {
//         free: BigInt(0),
//         reserved: BigInt(0),
//         frozen: BigInt(0),
//       },
//     )
//   }
// }

export async function system_getAccountBalance(
  typedApi: NativeBalanceSdkTypedApi,
  account: SS58String[],
): Promise<{
  total: bigint
  transferrable: bigint
  reserved: bigint
  locked: bigint
}> {
  if (account.length === 0) {
    throw new Error("No account provided")
  }

  // TODO: add compatibility check
  const query = typedApi.query.System.Account

  const balance = await query.getValues(account.map((a) => [a]))
  console.log({ balance: balance[0].data })
  return balance.reduce(
    (
      acc: {
        transferrable: bigint
        reserved: bigint
        locked: bigint
        total: bigint
      },
      b: { data: { free: bigint; reserved: bigint; frozen: bigint } },
    ) => {
      const { free, reserved, frozen } = b.data
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
