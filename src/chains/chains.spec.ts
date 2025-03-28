import { describe, it, expect, beforeAll } from "vitest"
import { createNetworkConnector } from "../createNetworkConnector"

describe("createNetwork", () => {
  beforeAll(async () => {
    const wsConnector = createNetworkConnector("polkadot", "websocket")
    await wsConnector.connect()
  }, 40000)
  it("should be able to create a network for ws connector and query assets on pah", async () => {
    const wsConnector = createNetworkConnector("polkadot", "websocket")

    expect(wsConnector.getStatus()).toBe("connected")

    const pah = wsConnector.getChain("pah")

    expect(pah).toBeDefined()

    expect(await pah?.getAssets()).toBeDefined()
  })
})
