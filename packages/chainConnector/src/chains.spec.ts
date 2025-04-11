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
    const dot = wsConnector.getChain("polkadot")
    expect(pah).toBeDefined()

    const pahAssets = await pah?.getAssets()
    expect(pahAssets).toBeDefined()

    const dotAssets = await dot?.getAssets()
    expect(dotAssets?.assets).toHaveLength(0)
  })

  it("should be able to query account balances", async () => {
    const wsConnector = createNetworkConnector("polkadot", "websocket")

    expect(wsConnector.getStatus()).toBe("connected")

    const pah = wsConnector.getChain("pah")
    const dot = wsConnector.getChain("polkadot")

    expect(pah).toBeDefined()

    const pahBalance = await pah?.balanceOf([
      "16M3BG9NGwc6kghtbb6pbaTSstggb7poWuim2Bd8W4pqzYf8",
      "16AH3HWtBLec3F4v7SjkYKfude4mDWZBktH1T4NRpzNEnAFH",
    ])
    expect(pahBalance).toBeDefined()

    const dotBalance = await dot?.balanceOf([
      "16M3BG9NGwc6kghtbb6pbaTSstggb7poWuim2Bd8W4pqzYf8",
      "16AH3HWtBLec3F4v7SjkYKfude4mDWZBktH1T4NRpzNEnAFH",
    ])
    console.log("dotBalance", dotBalance)
    console.log("pahBalance", pahBalance)
  })
})
