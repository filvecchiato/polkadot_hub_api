import "./connectors" // ensures registration happens
import { ConnectorRegistry } from "./registry/ConnectorRegistry"
import { EnhancedNetworkConnector, enhanceWithApis } from "./mixins"

export async function createNetworkConnector(
  network: string,
  type: string,
): Promise<EnhancedNetworkConnector> {
  const connector = ConnectorRegistry.getConnector(network, type)
  if (!connector) {
    throw new Error(`Connector type "${type}" not supported`)
  }

  await connector.connect()
  // register methods available as runtime mixins

  return enhanceWithApis(connector)
}
