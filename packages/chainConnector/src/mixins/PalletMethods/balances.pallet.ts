import { ChainConnector } from "@/index"
import { CompatibilityLevel, SS58String } from "polkadot-api"
import { LoggerFactory } from "@polkadot-hub-api/utils"

const log = LoggerFactory.getLogger("ChainConnector")

export interface BalancesPalletMethods {
  balances_getAccountBalance(account: SS58String[]): Promise<{
    total: bigint
    transferrable: bigint
    reserved: bigint
    locked: bigint
  }>
  balances_getAccountBalanceWithDetails(account: SS58String[]): Promise<{
    total: bigint
    transferrable: bigint
    reserved: bigint
    locked: bigint
    reservedDetails: { value: bigint; id: string }[]
    lockedDetails: {
      value: bigint
      id: string
      reason?: string
    }[]
    freezesDetails: { value: bigint; id: string }[]
    holdsDetails: { value: bigint; id: string }[]
  }>
}

export function BalancesPalletMixin<T extends ChainConnector>(
  Base: T,
): T & BalancesPalletMethods {
  if (!Base.pallets.includes("Balances")) {
    log.info(
      `Balances pallet is not included in the current ${Base.chainInfo.name} runtime, skipping Balances Pallet Methods mixin.`,
    )
    return Base as T & BalancesPalletMethods
  }
  return Object.assign(Base, {
    async balances_getAccountBalance(account: SS58String[]): Promise<{
      transferrable: bigint
      reserved: bigint
      locked: bigint
      total: bigint
    }> {
      if (account.length === 0) {
        throw new Error("No account provided")
      }

      const balance_Account = Base.api.query.Balances.Account

      if (
        !balance_Account.isCompatible(
          CompatibilityLevel.BackwardsCompatible,
          Base.compatibilityToken,
        )
      ) {
        throw new Error(
          "Balance.Account is not compatible with the current runtime",
        )
      }
      const balance = await balance_Account.getValues(account.map((a) => [a]))

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
    },
    async balances_getAccountBalanceWithDetails(
      account: SS58String[],
    ): Promise<{
      total: bigint
      transferrable: bigint
      reserved: bigint
      locked: bigint
      reservedDetails: { value: bigint; id: string }[]
      lockedDetails: {
        value: bigint
        id: string
        reason?: string
      }[]
      freezesDetails: { value: bigint; id: string }[]
      holdsDetails: { value: bigint; id: string }[]
    }> {
      if (account.length === 0) {
        throw new Error("No account provided")
      }

      const [balance, locks, reserves, freezes, holds] =
        await Promise.allSettled([
          this.balances_getAccountBalance(account),
          Base.api.query.Balances.Locks.getValues(account.map((a) => [a])),
          Base.api.query.Balances.Reserves.getValues(account.map((a) => [a])),
          Base.api.query.Balances.Freezes.getValues(account.map((a) => [a])),
          Base.api.query.Balances.Holds.getValues(account.map((a) => [a])),
        ])

      if (balance.status === "rejected") {
        throw new Error(`Failed to get balance: ${balance.reason}`)
      }

      const { total, transferrable, reserved, locked } = balance.value
      const reservedDetails =
        reserves.status === "fulfilled"
          ? reserves.value
              .map((r) => {
                return r.map((reserve) => ({
                  value: reserve.amount,
                  id: reserve.id?.asText().trim(),
                }))
              })
              .flat()
          : []

      const freezesDetails =
        freezes.status === "fulfilled"
          ? freezes.value
              .map((f) => {
                return f.map((freeze) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const f = freeze as any
                  return {
                    value: f.amount,
                    id: f.id
                      ? (
                          f.id.type.charAt(0).toLowerCase() +
                          f.id.type.substring(1)
                        ).trim()
                      : undefined,
                  }
                })
              })
              .flat()
          : []
      const holdsDetails =
        holds.status === "fulfilled"
          ? holds.value
              .map((h) => {
                return h.map((hold) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const h = hold as any
                  return {
                    value: h.amount,
                    id: h.id
                      ? (
                          h.id.type.charAt(0).toLowerCase() +
                          h.id.type.substring(1)
                        ).trim()
                      : undefined,
                  }
                })
              })
              .flat()
          : []
      const lockedDetails =
        locks.status === "fulfilled"
          ? locks.value
              .map((l) => {
                return l.map((lock) => {
                  return {
                    value: lock.amount,
                    id: (
                      lock.id.asText().trim().charAt(0).toLowerCase() +
                      lock.id.asText().trim().substring(1)
                    ).trim(),
                    reason: lock.reasons.type,
                  }
                })
              })
              .flat()
          : []

      return {
        total,
        transferrable,
        reserved,
        locked,
        reservedDetails,
        lockedDetails,
        freezesDetails,
        holdsDetails,
      }
    },
  })
}
