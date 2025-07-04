import { describe, it, expect } from "vitest"
// import { wellKnownChains, WellknownParachainId } from "@polkadot-hub-api/types"
import { PolkadotHubApi } from "."

describe("createNetwork", () => {
  it("should be able to create a network for ws connector", async () => {
    const wsConnector = new PolkadotHubApi()

    expect(wsConnector).toBeDefined()
    expect(wsConnector.network).toBe("polkadot")
  })

  it("should be able to create a network for smoldot connector", async () => {
    const wsConnector = new PolkadotHubApi()

    expect(wsConnector).toBeDefined()
    expect(wsConnector.network).toBe("polkadot")
  })

  it("should throw an error if connector type is not supported", async () => {
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      () => new PolkadotHubApi("unknown" as any), // intentionally passing an unsupported type
    ).rejects.toThrowError(`Connector type "unknown" not supported`)
  })

  it("should be able to connect to the network once created with smoldot", async () => {
    const smConnector = new PolkadotHubApi()

    // const relay = wellKnownChains[smConnector.network][0]()
    // const paras = wellKnownChains[smConnector.network][1]

    // const expectedChains = [relay, ...paras]
    //   .filter((chain) => {
    //     return chain.info.network === "polkadot"
    //   })
    //   .filter(([, val]) => {
    //     return val.smoldot
    //   })

    expect(smConnector.getChains().length).not.toEqual(0)

    expect(smConnector.getStatus()).toBe("connected")
  }, 100000)

  it("should be able to connect to the network once created with websocket", async () => {
    const wsConnector = new PolkadotHubApi()

    expect(wsConnector.getStatus()).toBe("connected")
    expect(wsConnector.network).toBe("polkadot")
  }, 15000)

  it("should be able to disconnect from the network", async () => {
    const wsConnector = new PolkadotHubApi()

    expect(wsConnector.getStatus()).toBe("connected")

    await wsConnector.disconnect()
    expect(wsConnector.getStatus()).toBe("disconnected")
  })

  it("should be able to get a chain from the network", async () => {
    const wsConnector = new PolkadotHubApi()

    const chain = wsConnector.getChain("pah")

    expect(chain).toBeDefined()
  })

  // it("should have enhanced methods", async () => {
  //   const wsConnector = new PolkadotHubApi()

  //   expect(wsConnector.getBalances).toBeDefined()
  // })
})
