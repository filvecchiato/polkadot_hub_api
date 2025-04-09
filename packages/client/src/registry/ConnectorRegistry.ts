import { WsHubConnector } from "../connectors"
import { SmHubConnector } from "../connectors/SmoldotConnector"
import { NetworkConnector } from "../connectors/types"

export interface ConnectorStatic<
  T extends NetworkConnector = NetworkConnector,
> {
  getType(): string
  getInstance(network: string): T
}

export class ConnectorRegistry {
  private static registry = new Map<string, ConnectorStatic>([
    ["websocket", WsHubConnector],
    ["smoldot", SmHubConnector],
    // ["substrate", SubstrateConnectConnector],
  ])

  static createConnector(
    network: string,
    type: string,
  ): NetworkConnector | undefined {
    const Connector = this.registry.get(type)
    if (!Connector) {
      throw new Error(`Connector type "${type}" not supported`)
    }

    return Connector.getInstance(network)
  }

  static listConnectors(): string[] {
    return [...this.registry.keys()]
  }

  static getConnector(network: string, type: string): NetworkConnector {
    // TODO: make it a singleton
    const Connector = this.registry.get(type)
    if (!Connector) {
      throw new Error(`Connector type "${type}" not supported`)
    }
    return Connector.getInstance(network)
  }
}
