import { describe, it, expect } from "vitest"
import { createNetworkConnector } from "../createNetworkConnector"
import { Account } from "./account"

describe("account queries", () => {
  it("should be able to create an account and use a ws connector", async () => {
    const wsConnector = await createNetworkConnector("polkadot", "websocket")

    expect(wsConnector).toBeDefined()
    expect(wsConnector.network).toBe("polkadot")

    expect(wsConnector.getStatus()).toBe("connected")

    const account = new Account([
      "123VwdDkJeUd8K1g9gS5rZHKy1vQg1N64ZNcYYBk2J5ZEkfs",
      "13aUbVbnthMvYuSLUbfK6eTQWaDWLriRrP89ExD17Ep19BkK",
      "14ruQdbF3SqZh8Wkbeu1Y6XkG3Dvdckiof58vhKYmrBFUWxs",
      "129EYiTbv2J4LkYqRNssUfMuxNLYN8TW2LgfG1Gqyj8wCcs7",
      "142zGifFwRrDbFLJD7LvbyoHQAqDaXeHjkxJbUVwmDYBD7Gf",
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
    // console.log("Balances:", balances)
    for (const lock of balances?.lockedDetails || []) {
      console.log("Lock details:", lock)
      console.dir(await lock.details!(), { depth: null })
    }
  }, 550000)
})
