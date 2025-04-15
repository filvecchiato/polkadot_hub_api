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
      "15Q7FYu3X5gphRvL58kkVQD6sa4LvT3PKNo8615HtSo2MQAS",
    ])
    expect(account).toBeDefined()
    expect(account.listAddresses()).not.toHaveLength(0)

    const balances = await account.balance(wsConnector)

    console.log("balances", balances)

    expect(balances).toBeDefined()

    expect(balances).toHaveProperty("free")
    expect(balances).toHaveProperty("reserved")
    expect(balances).toHaveProperty("frozen")
  }, 15000)
})
