/* 
    placeholder for fungible token abstraction
    include all methods for more detailed queries and generic calcs, info etc.
*/

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
    throw new Error("Method 'id' not implemented.")
  }
}
