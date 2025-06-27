import { SS58String } from "polkadot-api"
import { u8aToHex } from "@polkadot/util"
import { decodeAddress } from "@polkadot/util-crypto"
import type { ChainId } from "@polkadot-hub-api/types"
import { EnhancedNetworkConnector } from "@/mixins"
import { NetworkConnector } from ".."

export class Account {
  private addresses: SS58String[]
  constructor(addresses: SS58String[]) {
    this.addresses = addresses
  }

  listAddresses(): SS58String[] {
    return this.addresses
  }

  addAddress(address: SS58String): void {
    this.addresses.push(address)
  }

  removeAddress(address: SS58String): void {
    this.addresses = this.addresses.filter((addr) => addr !== address)
  }

  clearAddresses(): void {
    this.addresses = []
  }

  static getAddressPubkey(address: string) {
    if (address.startsWith("0x") && address.length === 42) {
      return address
    }
    return u8aToHex(decodeAddress(address))
  }

  async balance(
    networkConnector: EnhancedNetworkConnector<NetworkConnector>,
    chain?: ChainId,
  ) {
    if (networkConnector.getStatus() !== "connected") {
      throw new Error("Network connector is not connected")
    }

    if (!this.addresses.length) {
      throw new Error("No addresses provided")
    }

    // load chains and query all chains balance

    const chains = networkConnector.getChains()
    if (chain) {
      if (!chains.includes(chain)) {
        throw new Error(`Chain ${chain} not found in network connector`)
      }
      const chainConnector = networkConnector.getChain(chain)!

      const balances =
        "balanceOf" in chainConnector &&
        (await chainConnector.balanceOf!(this.addresses))
      if (!balances) {
        throw new Error(`Chain ${chain} does not support balanceOf method`)
      } else {
        return {
          ...balances,
          locations: [balances.location],
        }
      }
    } else {
      const balances = await Promise.allSettled(
        chains
          .map((chain) => {
            const networkConnectorChain = networkConnector.getChain(chain)
            if (networkConnectorChain) {
              if (
                !("balanceOf" in networkConnectorChain) ||
                typeof networkConnectorChain.balanceOf !== "function"
              ) {
                return null
              }
              return networkConnectorChain.balanceOf(this.addresses)
            }
            return null
          })
          .filter((el) => !!el), // filter out nulls
      )

      const successfulBalances = balances.reduce(
        (acc, balance) => {
          if (balance.status === "fulfilled") {
            const {
              total,
              transferrable,
              reserved,
              locked,
              location,
              lockedDetails,
              reservedDetails,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } = balance.value as any
            acc.transferrable += BigInt(transferrable)
            acc.reserved += BigInt(reserved)
            acc.locked += BigInt(locked)
            acc.total += BigInt(total)
            acc.lockedDetails.push(...lockedDetails)
            acc.reservedDetails.push(...reservedDetails)
            if (location.total > 0n) {
              acc.locations.push(location)
            }
          }
          return acc
        },
        {
          transferrable: BigInt(0),
          reserved: BigInt(0),
          locked: BigInt(0),
          total: BigInt(0),
          lockedDetails: [] as {
            value: bigint
            id: string
            details: () => Promise<unknown>
          }[],
          reservedDetails: [] as { value: bigint; id: string }[],
          locations: [] as {
            total: bigint
            location: string
            decimals: number
          }[],
        },
      )
      if (
        successfulBalances.total !==
        successfulBalances.transferrable +
          successfulBalances.locked +
          successfulBalances.reserved
      ) {
        throw new Error(
          `Total balance ${successfulBalances.total} does not match sum of transferrable ${successfulBalances.transferrable}, reserved ${successfulBalances.reserved}, and locked ${successfulBalances.locked}`,
        )
      }
      return successfulBalances
    }
  }
}
