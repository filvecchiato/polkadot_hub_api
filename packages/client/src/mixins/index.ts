import { NetworkConnector } from "@/connectors"
import { NetworkApiAssets } from "./assets.api"

export type EnhancedNetworkConnector = NetworkConnector & NetworkApiAssets

export function enhanceWithApis<T extends NetworkConnector>(
  Base: T,
): EnhancedNetworkConnector {
  return Object.assign(Base, NetworkApiAssets(Base))
}
