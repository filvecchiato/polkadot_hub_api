import { describe, it, expect } from "vitest"
import { createNetworkConnector } from "./createNetworkConnector"
import { WellKnownChains } from "./connectors/utils"

describe("createNetwork", () => {
  it("should be able to create a network for ws connector", () => {
    const wsConnector = createNetworkConnector("polkadot", "websocket")

    expect(wsConnector).toBeDefined()
    expect(wsConnector.network).toBe("polkadot")
  })

  it("should be able to create a network for smoldot connector", () => {
    const wsConnector = createNetworkConnector("polkadot", "smoldot")

    expect(wsConnector).toBeDefined()
    expect(wsConnector.network).toBe("polkadot")
  })

  it("should throw an error if connector type is not supported", () => {
    expect(() => createNetworkConnector("polkadot", "unknown")).toThrowError(
      `Connector type "unknown" not supported`,
    )
  })

  it("should be able to connect to the network once created with smoldot", async () => {
    const smConnector = createNetworkConnector("polkadot", "smoldot")

    expect(smConnector.getStatus()).toBe("disconnected")
    expect(smConnector.getChains().length).toEqual(0)

    await smConnector.connect()

    const expectedChains = Object.entries(WellKnownChains)
      .filter(([, val]) => {
        return val.network === "polkadot"
      })
      .filter(([, val]) => {
        return val.smoldot
      })

    expect(smConnector.getChains().length).toEqual(expectedChains.length)

    expect(smConnector.getStatus()).toBe("connected")
  }, 100000)

  it("should be able to connect to the network once created with websocket", async () => {
    const wsConnector = createNetworkConnector("polkadot", "websocket")

    expect(wsConnector.getStatus()).toBe("disconnected")
    expect(wsConnector.getChains().length).toEqual(0)
    await wsConnector.connect()

    expect(wsConnector.getStatus()).toBe("connected")
    const expectedChains = Object.entries(WellKnownChains).filter(([, val]) => {
      return val.network === "polkadot"
    })

    expect(wsConnector.getChains().length).toEqual(expectedChains.length)
  }, 15000)

  it("should be able to disconnect from the network", async () => {
    const wsConnector = createNetworkConnector("polkadot", "websocket")

    expect(wsConnector.getStatus()).toBe("connected")

    await wsConnector.disconnect()
    expect(wsConnector.getStatus()).toBe("disconnected")
  })

  it("should be able to get a chain from the network", async () => {
    const wsConnector = createNetworkConnector("polkadot", "smoldot")

    await wsConnector.connect()

    const chain = wsConnector.getChain("pah")

    expect(chain).toBeDefined()
  })
})
