import { SS58String } from "polkadot-api"
import { u8aToHex } from "@polkadot/util"
import { decodeAddress } from "@polkadot/util-crypto"
import type {
  TAccountBalance,
  WellKnownChainIds,
} from "@polkadot-hub-api/types"
import { EnhancedNetworkConnector } from "@/mixins"
import { PolkadotHubApi } from ".."

/**
 * Represents a user account with multiple addresses.
 * Provides methods to manage addresses and query balances across different chains.
 * @example
 * const account = new Account(["address1", "address2"]);
 * account.addAddress("address3");
 * const balances = await account.balance(networkConnector, "polkadot");
 **/
export class Account {
  private addresses: SS58String[]
  constructor(addresses: SS58String[]) {
    this.addresses = addresses
  }
  /**
   * Returns the list of addresses associated with this account.
   * @returns {SS58String[]} Array of addresses.
   */
  listAddresses(): SS58String[] {
    return this.addresses
  }
  /**
   * Adds a new address to the account.
   * @param {SS58String} address - The address to add.
   * @return {SS58String[]} Updated array of addresses.
   */
  addAddress(address: SS58String): SS58String[] {
    this.addresses.push(address)
    return this.addresses
  }

  /**
   * Removes an address from the account.
   * @param {SS58String} address - The address to remove.
   * @return {SS58String[]} Updated array of addresses.
   */
  removeAddress(address: SS58String): SS58String[] {
    this.addresses = this.addresses.filter((addr) => addr !== address)
    return this.addresses
  }

  /**
   * Clears all addresses from the account.
   * @returns {SS58String[]} An empty array indicating all addresses have been cleared.
   */
  clearAddresses(): [] {
    this.addresses = []
    return []
  }

  /**
   * Converts a given address to its public key representation.
   * If the address is already in hex format (starts with "0x" and is 42 characters long),
   * it returns the address as is. Otherwise, it decodes the address and returns its hex representation.
   * @param {string} address - The address to convert.
   * @returns {string} The public key in hex format.
   */
  static getAddressPubkey(address: string) {
    if (address.startsWith("0x") && address.length === 42) {
      return address
    }
    return u8aToHex(decodeAddress(address))
  }

  /**
   * Queries the balance of the account across different chains.
   * @param {EnhancedNetworkConnector<PolkadotHubApi> | PolkadotHubApi} networkConnector - The network connector to use.
   * @param {WellKnownChainIds} [chain] - The specific chain to query (optional).
   * @returns {Promise<TAccountBalance>} The account balance information.
   */
  async balance(
    networkConnector: EnhancedNetworkConnector<PolkadotHubApi> | PolkadotHubApi,
    chain?: WellKnownChainIds,
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
          locations: balances.locations,
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
              allocated,
              locations,
              lockedDetails,
              reservedDetails,
            } = balance.value

            acc.transferrable += transferrable
            acc.reserved += reserved
            acc.locked += locked
            acc.total += total
            acc.allocated += allocated || BigInt(0)
            acc.lockedDetails.push(...lockedDetails)
            acc.reservedDetails.push(...reservedDetails)
            if (locations[0]?.total > 0n) {
              acc.locations.push(...locations)
            }
          }
          return acc
        },
        {
          transferrable: BigInt(0),
          reserved: BigInt(0),
          locked: BigInt(0),
          allocated: BigInt(0),
          total: BigInt(0),
          reservedDetails: [],
          lockedDetails: [],
          locations: [],
        } as TAccountBalance,
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
