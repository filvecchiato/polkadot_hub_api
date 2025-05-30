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
      // "15Q7FYu3X5gphRvL58kkVQD6sa4LvT3PKNo8615HtSo2MQAS",
      "13aUbVbnthMvYuSLUbfK6eTQWaDWLriRrP89ExD17Ep19BkK",
    ])
    expect(account).toBeDefined()
    expect(account.listAddresses()).not.toHaveLength(0)

    const balances = await account.balance(wsConnector)
    expect(balances?.total).toEqual(
      balances?.transferrable + balances?.reserved + balances?.locked,
    )
    expect(balances).toBeDefined()
    const totLocations = balances?.locations?.reduce(
      (acc: bigint, loc) => acc + loc.total,
      0n,
    )

    expect(balances?.total).toEqual(totLocations)

    expect(balances).toHaveProperty("total")
    expect(balances).toHaveProperty("reserved")
    expect(balances).toHaveProperty("locked")

    for (const chain of wsConnector.getChains()) {
      const chainConnector = wsConnector.getChain(chain)
      if (chainConnector?.getAssets) {
        const assets = await chainConnector?.getAssets()
        const sortedAssets =
          assets.assets?.sort((a, b) => b.accounts - a.accounts) || []
        sortedAssets.length = 20
      } else {
        console.log(`Chain ${chain} does not support getAssets method`)
      }
    }
  }, 50000)
})
