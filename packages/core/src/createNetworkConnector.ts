import "./connectors" // ensures registration happens
import { EnhancedNetworkConnector, enhanceWithApis } from "./mixins"
import { NetworkConnector } from "./connectors"
import { ConfigRegistry } from "@polkadot-hub-api/utils"

export async function createNetworkConnector(
  network: string,
): Promise<EnhancedNetworkConnector<NetworkConnector>> {
  const config = ConfigRegistry.config[network]
  if (!config) {
    throw new Error(`Network configuration for "${network}" not found.`)
  }

  const networkConnector =
    new //  create network connector from config if it exists
    //  needs to know about connected chains and whatnot
    // enahnce connector with APIs
    NetworkConnector.return()
}
