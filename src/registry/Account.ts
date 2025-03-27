import { SS58String } from "polkadot-api"
import { u8aToHex } from "@polkadot/util"
import { decodeAddress } from "@polkadot/util-crypto"

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
}
