import { NetworkApiAssets } from "./assets.api"
import type { PolkadotHubApi } from ".."

export type EnhancedNetworkConnector<T> = T & NetworkApiAssets

export function enhanceWithApis<T extends PolkadotHubApi>(
  Base: T,
): EnhancedNetworkConnector<T> {
  return Object.assign(Base, NetworkApiAssets(Base))
}
