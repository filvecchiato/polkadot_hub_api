import { NetworkConnector } from "@/connectors"
import { NetworkApiAssets } from "./assets.api"

export type EnhancedNetworkConnector<T> = T & NetworkApiAssets

export function enhanceWithApis<T extends NetworkConnector>(
  Base: T,
): EnhancedNetworkConnector<T> {
  return Object.assign(Base, NetworkApiAssets(Base))
}
