/*
    Placeholder for native token abstractions.
    Include all methods for more detailed queries and generic calculations, info etc.
*/

/**
 * @unstable
 * Represents a native token abstraction.
 * Provides methods to access token properties and balance.
 * @example
 * const nativeToken = new NativeToken();
 * console.log(nativeToken.id);
 **/
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

  /**
   * @unstable
   * Returns the balance of the native token.
   * @returns {Promise<bigint>} The balance of the native token.
   * @throws {Error} If the method is not implemented.
   * @example
   * const nativeToken = new NativeToken();
   * const balance = await nativeToken.balance;
   **/

  get balance(): Promise<bigint> {
    throw new Error("Method 'balance' not implemented.")
  }
}
