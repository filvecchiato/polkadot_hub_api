import { describe, it, expect } from "vitest"
import { createNetworkConnector } from "./createNetworkConnector"
import { WellKnownChains } from "./connectors/utils"

describe("createNetwork", () => {
  it("should be able to create a network for ws connector", async () => {
    const wsConnector = await createNetworkConnector("polkadot", "websocket")

    expect(wsConnector).toBeDefined()
    expect(wsConnector.network).toBe("polkadot")
  })

  it("should be able to create a network for smoldot connector", async () => {
    const wsConnector = await createNetworkConnector("polkadot", "smoldot")

    expect(wsConnector).toBeDefined()
    expect(wsConnector.network).toBe("polkadot")
  })

  it("should throw an error if connector type is not supported", async () => {
    await expect(() =>
      createNetworkConnector("polkadot", "unknown"),
    ).rejects.toThrowError(`Connector type "unknown" not supported`)
  })

  it("should be able to connect to the network once created with smoldot", async () => {
    const smConnector = await createNetworkConnector("polkadot", "smoldot")

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
    const wsConnector = await createNetworkConnector("polkadot", "websocket")

    expect(wsConnector.getStatus()).toBe("connected")
    const expectedChains = Object.entries(WellKnownChains).filter(([, val]) => {
      return val.network === "polkadot"
    })

    expect(wsConnector.getChains().length).toEqual(expectedChains.length)
  }, 15000)

  it("should be able to disconnect from the network", async () => {
    const wsConnector = await createNetworkConnector("polkadot", "websocket")

    expect(wsConnector.getStatus()).toBe("connected")

    await wsConnector.disconnect()
    expect(wsConnector.getStatus()).toBe("disconnected")
  })

  it("should be able to get a chain from the network", async () => {
    const wsConnector = await createNetworkConnector("polkadot", "smoldot")

    const chain = wsConnector.getChain("pah")

    expect(chain).toBeDefined()
  })

  it("should have enhanced methods", async () => {
    const wsConnector = await createNetworkConnector("polkadot", "smoldot")

    expect(wsConnector.getBalances).toBeDefined()
  })
})
