// @vitest-environment jsdom
//
// Tests that the handler index correctly aggregates all handler modules,
// with particular focus on verifying that careCompanionHandlers are
// registered and reachable through the unified `handlers` export.
import { setupServer } from "msw/node"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { handlers } from "./index"
import { careCompanionHandlers } from "./carecompanion"
import { profileHandlers } from "./profile"
import { discoveryHandlers } from "./discovery"
import { loansHandlers } from "./loans"
import { onboardingHandlers } from "./onboarding"
import { networkHandlers } from "./network"
import { careFundHandlers } from "./carefund"
import { fastTrackHandlers } from "./fasttrack"
import { notificationsHandlers } from "./notifications"
import { miscHandlers } from "./misc"

const server = setupServer(...handlers)
const ORIGIN = window.location.origin
const PATIENT_ID = "patient-123"

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }))
afterAll(() => server.close())
beforeEach(() => localStorage.clear())

// ---------------------------------------------------------------------------
// 1. handlers array structure
// ---------------------------------------------------------------------------

describe("handlers array export", () => {
  it("exports a non-empty array of request handlers", () => {
    expect(Array.isArray(handlers)).toBe(true)
    expect(handlers.length).toBeGreaterThan(0)
  })

  it("includes handlers from every registered module", () => {
    const allModuleHandlers = [
      ...profileHandlers,
      ...discoveryHandlers,
      ...loansHandlers,
      ...onboardingHandlers,
      ...networkHandlers,
      ...careFundHandlers,
      ...fastTrackHandlers,
      ...notificationsHandlers,
      ...miscHandlers,
      ...careCompanionHandlers,
    ]
    expect(handlers.length).toBe(allModuleHandlers.length)
  })

  it("includes all careCompanionHandlers in the aggregated array", () => {
    // Every handler from the careCompanion module should be present
    // in the combined handlers array (reference equality check).
    for (const handler of careCompanionHandlers) {
      expect(handlers).toContain(handler)
    }
  })
})

// ---------------------------------------------------------------------------
// 2. Care companion endpoints are reachable through aggregated handlers
// ---------------------------------------------------------------------------

describe("care companion endpoints reachable through aggregated handlers", () => {
  it("GET /api/patients/:id/companion/home resolves 200", async () => {
    const res = await fetch(
      `${ORIGIN}/api/patients/${PATIENT_ID}/companion/home`,
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty("refillSchedule")
    expect(data).toHaveProperty("costSummary")
  })

  it("GET /api/patients/:id/medications resolves 200", async () => {
    const res = await fetch(
      `${ORIGIN}/api/patients/${PATIENT_ID}/medications`,
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data.medications)).toBe(true)
  })

  it("GET /api/patients/:id/companion/profile resolves 200", async () => {
    const res = await fetch(
      `${ORIGIN}/api/patients/${PATIENT_ID}/companion/profile`,
    )
    expect(res.status).toBe(200)
  })

  it("GET /api/patients/:id/refill-schedule resolves 200", async () => {
    const res = await fetch(
      `${ORIGIN}/api/patients/${PATIENT_ID}/refill-schedule`,
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data.schedules)).toBe(true)
  })

  it("GET /api/patients/:id/cost-summary resolves 200", async () => {
    const res = await fetch(
      `${ORIGIN}/api/patients/${PATIENT_ID}/cost-summary`,
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty("ytdSpend")
    expect(data).toHaveProperty("currency")
  })

  it("GET /api/patients/:id/emergency-card resolves", async () => {
    const res = await fetch(
      `${ORIGIN}/api/patients/${PATIENT_ID}/emergency-card`,
    )
    // May be 200 or 404 depending on fixture state; either is handled
    expect([200, 404]).toContain(res.status)
  })

  it("GET /api/patients/:id/credit/pre-approval resolves 200", async () => {
    const res = await fetch(
      `${ORIGIN}/api/patients/${PATIENT_ID}/credit/pre-approval`,
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty("isPreApproved")
  })

  it("GET /api/pharmacies/stock resolves 200", async () => {
    const res = await fetch(`${ORIGIN}/api/pharmacies/stock`)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
  })

  it("POST /api/patients/:id/assistant/message resolves 200", async () => {
    const res = await fetch(
      `${ORIGIN}/api/patients/${PATIENT_ID}/assistant/message`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "hello" }),
      },
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty("sessionId")
    expect(data).toHaveProperty("message")
  })
})

// ---------------------------------------------------------------------------
// 3. Non-care-companion endpoints still work alongside care companion
// ---------------------------------------------------------------------------

describe("existing handlers are not broken by care companion registration", () => {
  it("GET /patients/login-details still resolves 200", async () => {
    const res = await fetch(`${ORIGIN}/patients/login-details`)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.id).toBeTruthy()
  })

  it("GET /loans/patient/me/stats still resolves 200", async () => {
    const res = await fetch(`${ORIGIN}/loans/patient/me/stats`)
    expect(res.status).toBe(200)
  })

  it("GET /notifications still resolves 200", async () => {
    const res = await fetch(`${ORIGIN}/notifications`)
    expect(res.status).toBe(200)
  })

  it("GET /care-fund/transactions still resolves 200", async () => {
    const res = await fetch(`${ORIGIN}/care-fund/transactions`)
    expect(res.status).toBe(200)
  })
})
