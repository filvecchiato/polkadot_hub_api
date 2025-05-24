import { ChainConnector } from "@/index"
import { CompatibilityLevel, FixedSizeBinary, SS58String } from "polkadot-api"

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
    reservedDetails: { value: bigint; id: FixedSizeBinary<8> }[]
    lockedDetails: {
      value: bigint
      id: FixedSizeBinary<8>
      reason?: string
    }[]
    freezesDetails: { value: bigint }[]
    holdsDetails: { value: bigint }[]
  }>
}

export function BalancesPalletMixin<T extends ChainConnector>(
  Base: T,
): T & BalancesPalletMethods {
  if (!Base.pallets.includes("Balances")) {
    console.info(
      "Balances pallet is not included in the current runtime, skipping Balances Pallet Methods mixin",
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
      reservedDetails: { value: bigint; id: FixedSizeBinary<8> }[]
      lockedDetails: {
        value: bigint
        id: FixedSizeBinary<8>
        reason?: string
      }[]
      freezesDetails: { value: bigint }[]
      holdsDetails: { value: bigint }[]
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
                if (r.length === 0) return
                return {
                  value: r[0].amount,
                  id: r[0].id,
                }
              })
              .filter((reserve) => !!reserve)
          : []

      const freezesDetails =
        freezes.status === "fulfilled"
          ? freezes.value
              .map((f) => {
                if (f.length === 0) return
                return {
                  value: f[0].amount,
                }
              })
              .filter((f) => !!f)
          : []
      const holdsDetails =
        holds.status === "fulfilled"
          ? holds.value
              .map((h) => {
                if (h.length === 0) return
                return {
                  value: h[0].amount,
                }
              })
              .filter((h) => !!h)
          : []
      const lockedDetails =
        locks.status === "fulfilled"
          ? locks.value
              .map((l) => {
                if (l.length === 0) return
                return {
                  value: l[0].amount,
                  id: l[0].id,
                  reason: l[0].reasons.toString(),
                }
              })
              .filter((lock) => !!lock) // filter out empty locks
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
