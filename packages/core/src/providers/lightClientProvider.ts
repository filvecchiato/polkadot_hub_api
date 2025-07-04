/* eslint-disable no-unexpected-multiline */
import {
  TChain,
  wellKnownChains,
  type WellknownParachainId,
  type WellknownRelayChainId,
} from "@polkadot-hub-api/types"
import type { getSmoldotExtensionProviders } from "@substrate/smoldot-discovery"
import { createClient } from "polkadot-api"
import { getSmProvider } from "polkadot-api/sm-provider"
import { LightClientProvider, getProviderSymbol } from "@polkadot-hub-api/types"
import { ChainRegistry } from "@/registry"

type AddChainOptions<TWellknownChainId> =
  | { chainSpec: string; id: TWellknownChainId }
  | { id: TWellknownChainId }

export function createLightClientProvider() {
  const getSmoldot = async () => {
    return (await startSubstrateConnectWorker()) ?? startSmoldotWorker()
  }
  // TODO add check for worker support on node or browser
  return {
    addRelayChain<TRelayChainId extends WellknownRelayChainId>(
      options: AddChainOptions<TRelayChainId>,
    ) {
      const getChainSpec = () =>
        "chainSpec" in options
          ? Promise.resolve(options.chainSpec)
          : wellKnownChains[options.id]
              [0]()
              .smoldot()
              .then((chain) => chain.chainSpec)

      const getRelayChain = async () => {
        const smoldot = await getSmoldot()
        const chainSpec = await getChainSpec()

        if (isSubstrateConnectProvider(smoldot)) {
          return smoldot.addChain(chainSpec)
        }
        const chain = await smoldot.addChain({
          chainSpec,
        })

        const client = createClient(getSmProvider(chain))

        const chainInfo = wellKnownChains[options.id][0]().info as TChain

        ChainRegistry.set(chainInfo, client)
        return chain
      }
      const relayId = options.id as TRelayChainId
      return addLightClientProvider({
        [getProviderSymbol]() {
          return getSmProvider(getRelayChain())
        },

        addParachain<
          TParachainId extends
            keyof (typeof wellKnownChains)[TRelayChainId][1] extends never
              ? WellknownParachainId
              : keyof (typeof wellKnownChains)[TRelayChainId][1],
        >(options: AddChainOptions<TParachainId>) {
          return addLightClientProvider({
            [getProviderSymbol]() {
              const chainSpecPromise =
                "chainSpec" in options
                  ? Promise.resolve(options.chainSpec)
                  : (Object.fromEntries(
                      Object.values(wellKnownChains).flatMap((relayChain) =>
                        Object.entries(relayChain[1] ?? {}),
                      ),
                    )
                      [options.id]?.()
                      ?.smoldot()
                      ?.then((chain) => chain.chainSpec) ??
                    Promise.reject(new Error("Chain not found")))

              const parachainPromise = Promise.all([
                getRelayChain(),
                chainSpecPromise,
              ]).then(([relayChain, chainSpec]) => {
                const chain =
                  "addChain" in relayChain
                    ? relayChain.addChain(chainSpec)
                    : (async () => {
                        const smoldot = await getSmoldot()

                        return isSubstrateConnectProvider(smoldot)
                          ? smoldot.addChain(chainSpec)
                          : smoldot.addChain({
                              chainSpec,
                              potentialRelayChains: [relayChain],
                            })
                      })()
                return chain
              })

              const chainInfo = (
                wellKnownChains[relayId][1] as Record<
                  TParachainId,
                  () => { info: TChain }
                >
              )[options.id]?.().info

              const client = createClient(getSmProvider(parachainPromise))

              ChainRegistry.set(chainInfo, client)

              return getSmProvider(parachainPromise)
            },
          })
        },
      })
    },
  }
}

export function isLightClientProvider(
  value: unknown,
): value is LightClientProvider {
  return lightClientProviders.has(value as LightClientProvider)
}

export function createClientFromLightClientProvider(
  provider: LightClientProvider,
) {
  return createClient(provider[getProviderSymbol]())
}

const lightClientProviders = new WeakSet<LightClientProvider>()

function addLightClientProvider<T extends LightClientProvider>(provider: T) {
  lightClientProviders.add(provider)
  return provider
}

function startSmoldotWorker() {
  return import("polkadot-api/smoldot/from-worker").then(
    ({ startFromWorker }) =>
      startFromWorker(
        new Worker(new URL("polkadot-api/smoldot/worker", import.meta.url), {
          type: "module",
        }),
      ),
  )
}

const substrateConnectSet = new WeakSet<
  Awaited<ReturnType<typeof getSmoldotExtensionProviders>[number]["provider"]>
>()

function startSubstrateConnectWorker() {
  return import("@substrate/smoldot-discovery").then(
    async ({ getSmoldotExtensionProviders }) => {
      const provider = await getSmoldotExtensionProviders().at(0)?.provider

      if (provider !== undefined) {
        substrateConnectSet.add(provider)
      }

      return provider
    },
  )
}

function isSubstrateConnectProvider(
  value: unknown,
): value is Awaited<
  ReturnType<typeof getSmoldotExtensionProviders>[number]["provider"]
> {
  return substrateConnectSet.has(value as never)
}
