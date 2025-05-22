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
    expect(balances.total).toEqual(
      balances.transferrable + balances.reserved + balances.locked,
    )
    expect(balances).toBeDefined()
    const totLocations = balances.locations.reduce(
      (acc: bigint, loc) => acc + loc.total,
      0n,
    )

    expect(balances.total).toEqual(totLocations)

    expect(balances).toHaveProperty("total")
    expect(balances).toHaveProperty("reserved")
    expect(balances).toHaveProperty("locked")
  }, 50000)
})
