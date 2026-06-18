// @vitest-environment jsdom
import { setupServer } from "msw/node"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { handlers } from "./handlers"
import { getCareFundBalance } from "./domain/careFund"
import { deactivateMembership } from "./domain/membership"

const server = setupServer(...handlers)
// Handlers use same-origin relative paths; in jsdom they resolve against the
// document origin, so fetch against that exact origin for matching.
const ORIGIN = window.location.origin

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }))
afterAll(() => server.close())

// Core GET endpoints that should always resolve with a 2xx and not throw.
const CORE_GETS = [
  "/patients/login-details",
  "/users/tenant-id",
  "/loans/patient/me/stats",
  "/patients/payment-history",
  "/patients/payments/manual-requests",
  "/patients/payments/payment-methods",
  "/alerts/dashboard",
  "/healthcare/discovery/facilities?latitude=-1.29&longitude=36.8",
  "/healthcare/discovery/verified-facilities?latitude=-1.29&longitude=36.8",
  "/healthcare/discovery/search?searchTerm=hosp",
  "/healthcare/discovery/service-categories",
  "/discount-codes/eligible",
  "/patient-network/network",
  "/patient-network/circle-activity",
  "/patient-network/connections",
  "/care-fund/transactions",
  "/notifications",
  "/patients/discovery/recent-searches",
  "/patients/discovery/preferred-providers",
  "/patients/credit-limit",
  "/patients/request-medical-info-form-data",
  "/country-codes",
  "/patients/guarantor-invites",
]

describe("mock API core GET endpoints", () => {
  it.each(CORE_GETS)("GET %s resolves 2xx", async (path) => {
    const res = await fetch(ORIGIN + path)
    expect(res.status, `${path} returned ${res.status}`).toBeLessThan(400)
  })

  it("login-details has the fields the patient shell reads", async () => {
    const data = await (await fetch(ORIGIN + "/patients/login-details")).json()
    expect(data.id).toBeTruthy()
    expect(data.creditLimit).toBeTruthy()
    expect(Array.isArray(data.loans)).toBe(true)
  })

  it("payment-history exposes the dashboard arrays", async () => {
    const data = await (
      await fetch(ORIGIN + "/patients/payment-history")
    ).json()
    expect(Array.isArray(data.loans)).toBe(true)
    expect(Array.isArray(data.payments)).toBe(true)
    expect(Array.isArray(data.medicalRequests)).toBe(true)
  })

  it("discovery returns a facilities array, and a detail by id resolves", async () => {
    const list = await (
      await fetch(
        ORIGIN +
          "/healthcare/discovery/facilities?latitude=-1.29&longitude=36.8"
      )
    ).json()
    expect(Array.isArray(list.facilities)).toBe(true)
    expect(list.facilities.length).toBeGreaterThan(0)
    const id = list.facilities[0].id
    const detail = await fetch(
      ORIGIN + `/healthcare/discovery/facilities/${id}`
    )
    expect(detail.status).toBeLessThan(400)
  })

  it("network returns a network array", async () => {
    const data = await (await fetch(ORIGIN + "/patient-network/network")).json()
    expect(Array.isArray(data.network)).toBe(true)
  })
})

// Onboarding submit endpoints — these were reported 404ing in the browser.
const ONBOARDING_POSTS = [
  "/patients/verify-id-number",
  "/patients/verify-id",
  "/patients/verify-phone-name-match",
  "/patients/set-pin",
  "/patients/",
  "/patients/employment-details",
  "/underwriting/validate-crb-score",
  "/patients/link-referral",
  "/patients/skip-referral",
  "/patients/submit-plan-details",
  "/patients/accept-terms-and-conditions",
  "/patients/accept-medical-consent-form",
  "/patients/update-whatsapp-number",
]

describe("onboarding POST endpoints are handled (not bypassed)", () => {
  it.each(ONBOARDING_POSTS)("POST %s resolves 2xx", async (path) => {
    const res = await fetch(ORIGIN + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    expect(res.status, `${path} returned ${res.status}`).toBeLessThan(400)
  })
})

// Cross-flow effects: an action in one flow shows up consistently in another.
describe("cross-flow effects", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("a multi-payment lands in history and earns 5% MPESA cashback", async () => {
    const balanceBefore = getCareFundBalance()

    const res = await fetch(ORIGIN + "/payments/user/initiate-multi-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        totalBillAmount: 3000,
        kmpdcFacilityId: "fac-002",
        patientName: "Amina Otieno",
        paymentSplits: [
          { walletId: "w-mpesa", paymentAmount: 1000, type: "MPESA" },
          { walletId: "w-loan", paymentAmount: 2000, type: "LOAN" },
        ],
      }),
    })
    const body = await res.json()
    expect(res.status).toBeLessThan(400)
    expect(body.status).toBe("COMPLETED")
    expect(body.paymentId).toBeTruthy()

    const history = await (
      await fetch(ORIGIN + "/patients/payment-history")
    ).json()
    // Payment shows in history.
    expect(history.payments[0].id).toBe(body.paymentId)
    // 5% of the 1000 MPESA portion = 50 cashback earned, reflected everywhere.
    expect(history.careFundAccount.balance).toBe(balanceBefore + 50)
    // The LOAN split created a loan.
    expect(history.loans.length).toBeGreaterThan(0)
  })

  it("upgrading to Jireh Plus activates membership", async () => {
    deactivateMembership()
    const before = await (
      await fetch(ORIGIN + "/patients/login-details")
    ).json()
    expect(before.hasActiveMembership).toBe(false)

    await fetch(ORIGIN + "/patients/submit-plan-details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "JIREH_PLUS" }),
    })

    const after = await (
      await fetch(ORIGIN + "/patients/login-details")
    ).json()
    expect(after.hasActiveMembership).toBe(true)
  })
})
