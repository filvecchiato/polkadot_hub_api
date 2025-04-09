import "./connectors" // ensures registration happens
import { ConnectorRegistry } from "./registry/ConnectorRegistry"
import { NetworkConnector } from "./connectors/types"

export function createNetworkConnector(
  network: string,
  type: string,
): NetworkConnector {
  return ConnectorRegistry.getConnector(network, type)
}
