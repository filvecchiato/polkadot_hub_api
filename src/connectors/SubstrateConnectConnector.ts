import { NetworkConnector } from "./types"

export const SCKnownChains = []
export class SubstrateConnectConnector extends NetworkConnector {
  private status = "disconnected"

  async connect(): Promise<void> {
    console.log(`[${this.network}] Connecting via Substrate Connect...`)
    this.status = "connected"
  }

  async disconnect(): Promise<void> {
    console.log(`[${this.network}] Disconnecting Substrate Connect...`)
    this.client?.terminate()
    this.status = "disconnected"
  }
  async loadChains(): Promise<string[]> {
    // load substrate connect chains
    //
    return []
  }

  getStatus(): string {
    return this.status
  }
}
