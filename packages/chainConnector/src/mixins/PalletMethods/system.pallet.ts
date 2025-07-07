import { AllTypedApi, ChainConnector } from "@/index"
import { CompatibilityLevel, SS58String } from "polkadot-api"
import { LoggerFactory } from "@polkadot-hub-api/utils"

const log = LoggerFactory.getLogger("ChainConnector")

export interface SystemPalletMethods {
  system_getAccountBalance(account: SS58String[]): Promise<{
    total: bigint
    transferrable: bigint
    reserved: bigint
    locked: bigint
  }>
}

export function SystemPalletMixin<T extends ChainConnector>(
  Base: T,
): T & SystemPalletMethods {
  if (!Base.pallets.includes("System")) {
    log.info(
      `System pallet is not included in the current ${Base.chainInfo.name} runtime, skipping System Pallet Methods mixin.`,
    )
    return Base as T & SystemPalletMethods
  }
  return Object.assign(Base, {
    async system_getAccountBalance(account: SS58String[]): Promise<{
      total: bigint
      transferrable: bigint
      reserved: bigint
      locked: bigint
    }> {
      if (account.length === 0) {
        throw new Error("No account provided")
      }

      const balance_Account = (Base.api as AllTypedApi).query.System.Account

      if (
        !balance_Account.isCompatible(
          CompatibilityLevel.BackwardsCompatible,
          Base.compatibilityToken,
        )
      ) {
        throw new Error(
          "System.Account is not compatible with the current runtime",
        )
      }

      const balance = await balance_Account.getValues(account.map((a) => [a]))

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
    },
  })
}
