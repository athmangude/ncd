// @vitest-environment jsdom
//
// Guards the /discount-codes/validate contract: PaymentDetails (Fast Track)
// and PatientWalletSelection both read isValid/discountAmount/message, and
// PaymentDetails additionally needs the full `discount` object to populate
// the shared DiscountsSection card + DiscountDetailsDrawer without a second
// fetch. Also guards that a code's minimumOrderAmount is actually enforced
// server-side, not just filtered client-side.
import { setupServer } from "msw/node"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { handlers } from "./index"

const server = setupServer(...handlers)
const ORIGIN = window.location.origin

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }))
afterAll(() => server.close())

const validate = async (body: Record<string, unknown>) =>
  (
    await fetch(ORIGIN + "/discount-codes/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  ).json()

describe("POST /discount-codes/validate", () => {
  it("rejects an unknown code", async () => {
    const result = await validate({ code: "NOTREAL", orderAmount: 5000 })
    expect(result.isValid).toBe(false)
    expect(result.discountAmount).toBe("0")
  })

  it("rejects an inactive/expired code (EXPIRED20)", async () => {
    const result = await validate({ code: "EXPIRED20", orderAmount: 5000 })
    expect(result.isValid).toBe(false)
  })

  it("rejects a code when the order amount is below its minimumOrderAmount", async () => {
    // WELCOME15 requires a minimum order of KES 1,000.
    const result = await validate({ code: "WELCOME15", orderAmount: 500 })
    expect(result.isValid).toBe(false)
    expect(result.message).toMatch(/minimum order/i)
  })

  it("accepts a code once the order amount meets its minimum", async () => {
    const result = await validate({ code: "WELCOME15", orderAmount: 1000 })
    expect(result.isValid).toBe(true)
  })

  it("is case-insensitive on the code", async () => {
    const result = await validate({ code: "welcome15", orderAmount: 2000 })
    expect(result.isValid).toBe(true)
  })

  it("computes a percentage discount off the order amount", async () => {
    // WELCOME15: 15% off, capped at maximumDiscountAmount 3000.
    const result = await validate({ code: "WELCOME15", orderAmount: 2000 })
    expect(result.discountAmount).toBe("300")
  })

  it("caps the discount at maximumDiscountAmount", async () => {
    const result = await validate({ code: "WELCOME15", orderAmount: 100000 })
    expect(result.discountAmount).toBe("3000")
  })

  it("uses a flat discountValue for FIXED_AMOUNT codes, not a percentage of the order", async () => {
    // AFYA500: fixed KES 500 off, min order 2000.
    const result = await validate({ code: "AFYA500", orderAmount: 2000 })
    expect(result.discountAmount).toBe("500")
  })

  it("returns the full discount object alongside isValid/discountAmount", async () => {
    const result = await validate({ code: "WELCOME15", orderAmount: 2000 })
    expect(result.discount).toBeTruthy()
    expect(result.discount.code).toBe("WELCOME15")
    expect(result.discount.discountType).toBe("PERCENTAGE")
    expect(result.discount.minimumOrderAmount).toBe("1000")
    expect(result.discount.maximumDiscountAmount).toBe("3000")
  })

  it("does not return a discount object for an invalid code", async () => {
    const result = await validate({ code: "NOTREAL", orderAmount: 5000 })
    expect(result.discount).toBeUndefined()
  })
})
