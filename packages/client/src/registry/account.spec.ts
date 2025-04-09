import { describe, it, expect } from "vitest"
import { createNetworkConnector } from "../createNetworkConnector"
import { Account } from "./Account"

describe("account queries", () => {
  it("should be able to create an account and use a ws connector", async () => {
    const wsConnector = createNetworkConnector("polkadot", "websocket")

    expect(wsConnector).toBeDefined()
    expect(wsConnector.network).toBe("polkadot")
    await wsConnector.connect()

    expect(wsConnector.getStatus()).toBe("connected")

    const account = new Account([
      "16M3BG9NGwc6kghtbb6pbaTSstggb7poWuim2Bd8W4pqzYf8",
      "16AH3HWtBLec3F4v7SjkYKfude4mDWZBktH1T4NRpzNEnAFH",
    ])
    expect(account).toBeDefined()
    expect(account.listAddresses()).toHaveLength(2)

    const balances = await account.balance(wsConnector)

    console.log("balances", balances)

    expect(balances).toBeDefined()

    expect(balances).toHaveProperty("free")
    expect(balances).toHaveProperty("reserved")
    expect(balances).toHaveProperty("frozen")
  }, 10000)
})
