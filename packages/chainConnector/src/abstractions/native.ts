/*
    Placeholder for native token abstractions.
    Include all methods for more detailed queries and generic calculations, info etc.
*/

export class NativeToken {
  private originChainId: string | undefined

  constructor() {
    // Initialize with default values or leave undefined
    this.originChainId = undefined
  }

  get id(): string {
    throw new Error("Method 'id' not implemented.")
  }

  get decimals(): number {
    throw new Error("Method 'decimals' not implemented.")
  }

  get symbol(): string {
    throw new Error("Method 'symbol' not implemented.")
  }

  get name(): string {
    throw new Error("Method 'name' not implemented.")
  }

  get chainId(): string | undefined {
    return this.originChainId
  }
}
