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
      "13aUbVbnthMvYuSLUbfK6eTQWaDWLriRrP89ExD17Ep19BkK",
      "12dvmstTqsjrPrPdouMpbsgaaQjPGYFh7gMaiNgZ7Rzaacok",
      "16bZYfxvkUGT5WbjwyJkEmZYAsBdZhMeonnaxtcuUrhzpKHm",
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
      if (chainConnector && "getBalances" in chainConnector) {
        const balances = await chainConnector?.getBalances!(
          account.listAddresses(),
        )
        console.dir(balances, { depth: null })
      }
    }

    // await
  }, 550000)
})
