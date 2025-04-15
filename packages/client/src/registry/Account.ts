import { SS58String } from "polkadot-api"
import { u8aToHex } from "@polkadot/util"
import { decodeAddress } from "@polkadot/util-crypto"
import type { ChainId } from "@polkadot-hub-api/chain-connector"
import { NetworkConnector } from "../connectors"

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

  async balance(networkConnector: NetworkConnector, chain?: ChainId) {
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

      const balances = await chainConnector.balanceOf(this.addresses)
      return balances
    } else {
      const balances = await Promise.allSettled(
        chains.map((chain) =>
          networkConnector.getChain(chain)!.balanceOf(this.addresses),
        ),
      )
      const successfulBalances = balances.reduce(
        (acc, balance) => {
          if (balance.status === "fulfilled") {
            const { free, reserved, frozen } = balance.value
            acc.free += BigInt(free)
            acc.reserved += BigInt(reserved)
            acc.frozen += BigInt(frozen)
          }
          return acc
        },
        {
          free: BigInt(0),
          reserved: BigInt(0),
          frozen: BigInt(0),
        },
      )

      return successfulBalances
    }
  }
}
