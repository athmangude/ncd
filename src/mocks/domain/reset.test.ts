// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest"
import { resetCollection, resetMockState } from "./reset"

beforeEach(() => {
  localStorage.clear()
})

describe("reset domain", () => {
  it("clears mock:* keys + flow keys and reseeds a fresh session", () => {
    localStorage.setItem("mock:loans", "[]")
    localStorage.setItem("mock:login-details", "{}")
    localStorage.setItem("paymentId", "pay-x")
    localStorage.setItem("mock_session_exists", "true")

    resetMockState()

    expect(localStorage.getItem("mock:loans")).toBeNull()
    expect(localStorage.getItem("mock:login-details")).toBeNull()
    expect(localStorage.getItem("paymentId")).toBeNull()
    // The next load should land logged-in on a fresh seeded account.
    expect(localStorage.getItem("mock_session_exists")).toBe("true")
    expect(localStorage.getItem("mock_has_account")).toBe("true")
  })

  it("resetCollection removes only the target key", () => {
    localStorage.setItem("mock:loans", "[]")
    localStorage.setItem("mock:payment-history", "{}")

    resetCollection("loans")

    expect(localStorage.getItem("mock:loans")).toBeNull()
    expect(localStorage.getItem("mock:payment-history")).toBe("{}")
  })
})
