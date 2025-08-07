/* 
    placeholder for fungible token abstraction
    include all methods for more detailed queries and generic calcs, info etc.
*/
/**
 * @unstable
 * Represents a fungible token abstraction.
 * Provides methods to access token properties and balance.
 * @example
 * const fungibleToken = new FungibleToken();
 * console.log(fungibleToken.id);
 **/
export class FungibleToken {
  private originChainId: string | undefined
  private originAssetId: string | undefined
  private originAssetType: string | undefined

  constructor() {
    // Initialize with default values or leave undefined
    this.originChainId = undefined
    this.originAssetId = undefined
    this.originAssetType = undefined
  }

  get id(): string {
    const id = `${this.originChainId}-${this.originAssetId}-${this.originAssetType}`
    return id
  }

  get balance(): Promise<bigint> {
    throw new Error("Method 'balance' not implemented.")
  }
}
