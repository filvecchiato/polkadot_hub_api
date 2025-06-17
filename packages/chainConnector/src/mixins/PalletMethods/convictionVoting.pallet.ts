import { ChainConnector } from "@/index"

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ConvictionVotingPalletMethods {}

export function ConvictionVotingPalletMixin<T extends ChainConnector>(
  Base: T,
): T & ConvictionVotingPalletMethods {
  if (!Base.pallets.includes("ConvictionVoting")) {
    console.info(
      `ConvictionVoting pallet is not included in the current ${Base.chainInfo.name} runtime, skipping Conviction Voting Pallet Methods mixin.`,
    )
    return Base as T & ConvictionVotingPalletMethods
  }
  return Object.assign(Base, {})
}
