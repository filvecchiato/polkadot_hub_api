export const wellKnownChains = {
  polkadot: [
    () => {
      return {
        smoldot: () => import("polkadot-api/chains/polkadot"),
        info: {
          id: "polkadot",
          name: "Polkadot",
          paraId: null,
        },
      }
    },
    {
      polkadot_asset_hub: () => {
        return {
          smoldot: () => import("polkadot-api/chains/polkadot_asset_hub"),
          info: {
            id: "polkadot_asset_hub",
            name: "Asset Hub",
            paraId: 1000,
          },
        }
      },
      polkadot_bridge_hub: () => {
        return {
          smoldot: () => import("polkadot-api/chains/polkadot_bridge_hub"),
          info: {
            id: "polkadot_bridge_hub",
            name: "Bridge Hub",
            paraId: 1002,
          },
        }
      },
      polkadot_collectives: () => {
        return {
          smoldot: () => import("polkadot-api/chains/polkadot_collectives"),
          info: {
            id: "polkadot_collectives",
            name: "Collectives",
            paraId: 1001,
          },
        }
      },
      polkadot_coretime: () => {
        return {
          smoldot: () => import("polkadot-api/chains/polkadot_coretime"),
          info: {
            id: "polkadot_coretime",
            name: "Coretime",
            paraId: 1005,
          },
        }
      },
      polkadot_people: () => {
        return {
          smoldot: () => import("polkadot-api/chains/polkadot_people"),
          info: {
            id: "polkadot_people",
            name: "People",
            paraId: 1004,
          },
        }
      },
    },
  ],
  ksmcc3: [
    () => {
      return {
        smoldot: () => import("polkadot-api/chains/ksmcc3"),
        info: {
          id: "ksmcc3",
          name: "Kusama",
          paraId: null,
        },
      }
    },
    {
      ksmcc3_asset_hub: () => {
        return {
          smoldot: () => import("polkadot-api/chains/ksmcc3_asset_hub"),
          info: {
            id: "ksmcc3_asset_hub",
            name: "Asset Hub",
            paraId: 1000,
          },
        }
      },
      ksmcc3_bridge_hub: () => {
        return {
          smoldot: () => import("polkadot-api/chains/ksmcc3_bridge_hub"),
          info: {
            id: "ksmcc3_bridge_hub",
            name: "Bridge Hub",
            paraId: 1002,
          },
        }
      },
      ksmcc3_coretime: () => {
        return {
          smoldot: () => null,
          info: {
            id: "ksmcc3_coretime",
            name: "Coretime",
            paraId: 1005,
          },
        }
      },
      ksmcc3_people: () => {
        return {
          smoldot: () => import("polkadot-api/chains/ksmcc3_people"),
          info: {
            id: "ksmcc3_people",
            name: "People",
            paraId: 1004,
          },
        }
      },
    },
  ],
  westend2: [
    () => {
      return {
        smoldot: () => import("polkadot-api/chains/westend2"),
        info: {
          id: "westend2",
          name: "Westend",
          paraId: null,
        },
      }
    },
    {
      westend2_asset_hub: () => {
        return {
          smoldot: () => import("polkadot-api/chains/westend2_asset_hub"),
          info: {
            id: "westend2_asset_hub",
            name: "Asset Hub",
            paraId: 1000,
          },
        }
      },
      westend2_bridge_hub: () => {
        return {
          smoldot: () => import("polkadot-api/chains/westend2_bridge_hub"),
          info: {
            id: "westend2_bridge_hub",
            name: "Bridge Hub",
            paraId: 1002,
          },
        }
      },
      westend2_collectives: () => {
        return {
          smoldot: () => import("polkadot-api/chains/westend2_collectives"),
          info: {
            id: "westend2_collectives",
            name: "Collectives",
            paraId: 1001,
          },
        }
      },
      westend2_people: () => {
        return {
          smoldot: () => import("polkadot-api/chains/westend2_people"),
          info: {
            id: "westend2_people",
            name: "People",
            paraId: 1004,
          },
        }
      },
      westend2_coretime: () => {
        return {
          smoldot: () => null,
          info: {
            id: "westend2_coretime",
            name: "Coretime",
            paraId: 1005,
          },
        }
      },
    },
  ],
} as const

export type WellknownRelayChainId = keyof typeof wellKnownChains

type KeysOfUnion<T> = T extends T ? keyof T : never

export type WellknownParachainId = KeysOfUnion<
  (typeof wellKnownChains)[WellknownRelayChainId][1]
>

export type WellKnownChainIds = WellknownRelayChainId | WellknownParachainId
