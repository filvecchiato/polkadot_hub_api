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
      pah: () => {
        return {
          smoldot: () => import("polkadot-api/chains/polkadot_asset_hub"),
          info: {
            id: "pah",
            name: "Asset Hub",
            paraId: 1000,
          },
        }
      },
      pbh: () => {
        return {
          smoldot: () => import("polkadot-api/chains/polkadot_bridge_hub"),
          info: {
            id: "pbh",
            name: "Bridge Hub",
            paraId: 1002,
          },
        }
      },
      pcl: () => {
        return {
          smoldot: () => import("polkadot-api/chains/polkadot_collectives"),
          info: {
            id: "pcl",
            name: "Collectives",
            paraId: 1001,
          },
        }
      },
      pct: () => {
        return {
          smoldot: () => import("polkadot-api/chains/polkadot_coretime"),
          info: {
            id: "pct",
            name: "Coretime",
            paraId: 1005,
          },
        }
      },
      ppl: () => {
        return {
          smoldot: () => import("polkadot-api/chains/polkadot_people"),
          info: {
            id: "ppl",
            name: "People",
            paraId: 1004,
          },
        }
      },
    },
  ],
  kusama: [
    () => {
      return {
        smoldot: () => import("polkadot-api/chains/ksmcc3"),
        info: {
          id: "kusama",
          name: "Kusama",
          paraId: null,
        },
      }
    },
    {
      kah: () => {
        return {
          smoldot: () => import("polkadot-api/chains/ksmcc3_asset_hub"),
          info: {
            id: "kah",
            name: "Asset Hub",
            paraId: 1000,
          },
        }
      },
      kbh: () => {
        return {
          smoldot: () => import("polkadot-api/chains/ksmcc3_bridge_hub"),
          info: {
            id: "kbh",
            name: "Bridge Hub",
            paraId: 1002,
          },
        }
      },
      kct: () => {
        return {
          smoldot: () => null,
          info: {
            id: "kct",
            name: "Coretime",
            paraId: 1005,
          },
        }
      },
      kpl: () => {
        return {
          smoldot: () => import("polkadot-api/chains/ksmcc3_people"),
          info: {
            id: "kpl",
            name: "People",
            paraId: 1004,
          },
        }
      },
    },
  ],
  westend: [
    () => {
      return {
        smoldot: () => import("polkadot-api/chains/westend2"),
        info: {
          id: "westend",
          name: "Westend",
          paraId: null,
        },
      }
    },
    {
      wah: () => {
        return {
          smoldot: () => import("polkadot-api/chains/westend2_asset_hub"),
          info: {
            id: "wah",
            name: "Asset Hub",
            paraId: 1000,
          },
        }
      },
      wbh: () => {
        return {
          smoldot: () => import("polkadot-api/chains/westend2_bridge_hub"),
          info: {
            id: "wbh",
            name: "Bridge Hub",
            paraId: 1002,
          },
        }
      },
      wcl: () => {
        return {
          smoldot: () => import("polkadot-api/chains/westend2_collectives"),
          info: {
            id: "wcl",
            name: "Collectives",
            paraId: 1001,
          },
        }
      },
      wpl: () => {
        return {
          smoldot: () => import("polkadot-api/chains/westend2_people"),
          info: {
            id: "wpl",
            name: "People",
            paraId: 1004,
          },
        }
      },
      wct: () => {
        return {
          smoldot: () => null,
          info: {
            id: "wct",
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
