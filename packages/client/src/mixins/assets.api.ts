/* eslint-disable @typescript-eslint/no-unused-vars */
import { NetworkConnector } from "@/connectors"
import {
  TAddressAssetBalance,
  TAsset,
  TAccountBalance,
} from "@polkadot-hub-api/types"

export interface NetworkApiAssets {
  balanceOf(account: string): Promise<TAccountBalance>
  getAssets(): Promise<{
    assets?: TAsset[]
    poolAssets?: TAsset[]
  }>
  getAssetBalance(): Promise<unknown>
  getBalances(account: string): Promise<TAddressAssetBalance[]>
}

export function NetworkApiAssets<T extends NetworkConnector>(
  Base: T,
): T & NetworkApiAssets {
  return Object.assign(Base, {
    async balanceOf(_account: string): Promise<TAccountBalance> {
      throw new Error(
        "balanceOf method is not implemented in the base class. Please implement it in the derived class.",
      )
    },

    async getAssets(): Promise<{
      assets?: TAsset[]
      poolAssets?: TAsset[]
    }> {
      throw new Error(
        "getAssets method is not implemented in the base class. Please implement it in the derived class.",
      )
    },

    async getAssetBalance(): Promise<unknown> {
      throw new Error(
        "getAssetBalance method is not implemented in the base class. Please implement it in the derived class.",
      )
    },

    async getBalances(_account: string): Promise<TAddressAssetBalance[]> {
      throw new Error(
        "getBalances method is not implemented in the base class. Please implement it in the derived class.",
      )
    },
  })
}
