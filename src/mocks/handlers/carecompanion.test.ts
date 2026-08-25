// @vitest-environment jsdom
import { setupServer } from "msw/node"
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest"
import { careCompanionHandlers } from "./carecompanion"
import { saveCareCompanionProfile } from "../domain/careCompanion"

import type { CareCompanionProfile } from "@/types/care-companion"

const server = setupServer(...careCompanionHandlers)
const ORIGIN = window.location.origin
const PATIENT_ID = "patient-123"

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }))
afterAll(() => server.close())
beforeEach(() => localStorage.clear())

// Helpers

const get = async (path: string) =>
  fetch(`${ORIGIN}/api/patients/${PATIENT_ID}${path}`)

const post = async (path: string, body: unknown) =>
  fetch(`${ORIGIN}/api/patients/${PATIENT_ID}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

const patch = async (path: string, body: unknown) =>
  fetch(`${ORIGIN}/api/patients/${PATIENT_ID}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

const MOCK_PROFILE: CareCompanionProfile = {
  id: "profile-test-001",
  completedAt: "2026-01-15T10:30:00Z",
  skippedAt: null,
  conditions: {
    type: ["DIABETES", "HYPERTENSION"],
    otherDescription: null,
    diagnosisRecency: "MORE_THAN_2_YEARS",
  },
  treatment: {
    currentlyOnMedication: true,
    medicationNames: ["Metformin 500mg", "Amlodipine 5mg"],
    takingMedicationRegularly: "MOSTLY",
    reasonsForMissing: ["COST"],
    usingHerbalAlternatives: false,
    herbalDetails: null,
  },
  challenges: {
    selected: ["COST"],
    topChallenge: "COST",
  },
  coping: {
    costCoping: ["BORROW_FAMILY"],
    informationSources: ["PHARMACIST"],
    hasEmergencyPlan: false,
    exerciseFrequency: null,
  },
  goals: {
    selected: ["TRACK_COSTS"],
  },
  userRole: {
    role: "SELF",
    patientRelationship: null,
  },
} as CareCompanionProfile

// ---------------------------------------------------------------------------
// 1. BFF home endpoint
// ---------------------------------------------------------------------------

describe("GET /api/patients/:id/care-companion/home", () => {
  it("returns aggregated home data with all required sections", async () => {
    const res = await get("/care-companion/home")
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty("refillSchedule")
    expect(data).toHaveProperty("costSummary")
    expect(data).toHaveProperty("educationFeed")
    expect(data).toHaveProperty("emergencyCard")
    expect(data).toHaveProperty("emergencyTransportCredit")
  })

  it("sorts refill schedules by urgency with OVERDUE first", async () => {
    const data = await (await get("/care-companion/home")).json()
    const statuses = data.refillSchedule.schedules.map(
      (s: { status: string }) => s.status,
    )
    expect(statuses[0]).toBe("OVERDUE")
  })
})

// ---------------------------------------------------------------------------
// 2. Medication taxonomy search
// ---------------------------------------------------------------------------

describe("GET /api/medications/taxonomy", () => {
  const getTaxonomy = async (params = "") =>
    fetch(`${ORIGIN}/api/medications/taxonomy${params ? "?" + params : ""}`)

  it("returns all entries when no query param is provided", async () => {
    const data = await (await getTaxonomy()).json()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThanOrEqual(15)
  })

  it("filters by q param (case-insensitive substring match)", async () => {
    const data = await (await getTaxonomy("q=metf")).json()
    expect(data.length).toBe(1)
    expect(data[0].genericName).toBe("Metformin")
  })

  it("matches brand names in search", async () => {
    const data = await (await getTaxonomy("q=glucophage")).json()
    expect(data.length).toBe(1)
    expect(data[0].genericName).toBe("Metformin")
  })

  it("matches synonyms in search", async () => {
    const data = await (await getTaxonomy("q=sugar+medicine")).json()
    expect(data.length).toBeGreaterThanOrEqual(1)
    expect(data[0].genericName).toBe("Metformin")
  })

  it("filters by category param", async () => {
    const data = await (await getTaxonomy("category=LAB_TEST")).json()
    expect(data.length).toBe(1)
    expect(data[0].genericName).toBe("HbA1c Test")
  })

  it("combines q and category filters", async () => {
    const data = await (
      await getTaxonomy("q=met&category=MEDICATION")
    ).json()
    expect(data.length).toBeGreaterThanOrEqual(1)
    for (const entry of data) {
      expect(entry.category).toBe("MEDICATION")
    }
  })

  it("respects limit param with default of 20", async () => {
    const data = await (await getTaxonomy("limit=3")).json()
    expect(data.length).toBeLessThanOrEqual(3)
  })

  it("returns empty array for non-matching query", async () => {
    const data = await (await getTaxonomy("q=zzzznonexistent")).json()
    expect(data).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// 3. Patient medications (with taxonomy enrichment)
// ---------------------------------------------------------------------------

describe("GET /api/patients/:id/medications", () => {
  it("returns a medications array from patient-medication-records", async () => {
    const data = await (await get("/medications")).json()
    expect(Array.isArray(data.medications)).toBe(true)
    expect(data.medications.length).toBe(6)
  })

  it("enriches each record with taxonomy details", async () => {
    const data = await (await get("/medications")).json()
    for (const med of data.medications) {
      expect(med.medication).toHaveProperty("genericName")
      expect(med.medication).toHaveProperty("brandNames")
      expect(med.medication).toHaveProperty("category")
      expect(med.medication.genericName).toBeTruthy()
    }
  })

  it("includes medicationId foreign key on each record", async () => {
    const data = await (await get("/medications")).json()
    for (const med of data.medications) {
      expect(med.medicationId).toBeTruthy()
    }
  })
})

// ---------------------------------------------------------------------------
// 4. Medication timeline (paginated)
// ---------------------------------------------------------------------------

describe("GET /api/patients/:id/medication-timeline", () => {
  it("returns paginated entries with summary", async () => {
    const data = await (await get("/medication-timeline")).json()
    expect(Array.isArray(data.entries)).toBe(true)
    expect(data.summary).toHaveProperty("totalMedications")
    expect(data.summary).toHaveProperty("pharmaciesUsed")
    expect(data.pagination).toHaveProperty("total")
  })

  it("respects limit and offset parameters", async () => {
    const data = await (
      await get("/medication-timeline?limit=2&offset=0")
    ).json()
    expect(data.entries.length).toBeLessThanOrEqual(2)
    expect(data.pagination.limit).toBe(2)
    expect(data.pagination.offset).toBe(0)
  })

  it("filters by medicationId query parameter", async () => {
    const data = await (
      await get("/medication-timeline?medicationId=Metformin")
    ).json()
    for (const entry of data.entries) {
      expect(entry.medicationName.toLowerCase()).toContain("metformin")
    }
  })
})

// ---------------------------------------------------------------------------
// 4. Annual cost summary
// ---------------------------------------------------------------------------

describe("GET /api/patients/:id/cost-summary", () => {
  it("returns cost summary fields", async () => {
    const data = await (await get("/cost-summary")).json()
    expect(data.year).toBe(2026)
    expect(data.currency).toBe("KES")
    expect(data.ytdSpend).toBe("47200")
    expect(data.transactionCount).toBe(24)
  })
})

// ---------------------------------------------------------------------------
// 5. Cost breakdown
// ---------------------------------------------------------------------------

describe("GET /api/patients/:id/cost-summary/breakdown", () => {
  it("returns categories and monthly trend", async () => {
    const data = await (await get("/cost-summary/breakdown")).json()
    expect(data.year).toBe(2026)
    expect(Array.isArray(data.categories)).toBe(true)
    expect(data.categories.length).toBe(3)
    expect(Array.isArray(data.monthlyTrend)).toBe(true)
    expect(data.monthlyTrend.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// 6. Emergency card
// ---------------------------------------------------------------------------

describe("GET /api/patients/:id/emergency-card", () => {
  it("returns a GENERAL card when no profile exists", async () => {
    const data = await (await get("/emergency-card")).json()
    expect(data.conditionType).toBe("GENERAL")
  })

  it("returns a condition-matched card when a profile exists", async () => {
    saveCareCompanionProfile(MOCK_PROFILE)
    const data = await (await get("/emergency-card")).json()
    expect(data.conditionType).toBe("DIABETES")
  })
})

// ---------------------------------------------------------------------------
// 7. Emergency transport credit
// ---------------------------------------------------------------------------

describe("GET /api/patients/:id/emergency-transport-credit", () => {
  it("returns transport credit details", async () => {
    const data = await (await get("/emergency-transport-credit")).json()
    expect(data.isAvailable).toBe(true)
    expect(data.preApprovedAmount).toBe("2000")
  })
})

// ---------------------------------------------------------------------------
// 8. Medication cards (annotated with interactions)
// ---------------------------------------------------------------------------

describe("GET /api/patients/:id/medication-cards", () => {
  it("returns paginated annotated cards", async () => {
    const data = await (await get("/medication-cards")).json()
    expect(data).toHaveProperty("cards")
    expect(data).toHaveProperty("pagination")
    expect(Array.isArray(data.cards)).toBe(true)
  })

  it("annotates cards with relevant interactions", async () => {
    const data = await (await get("/medication-cards")).json()
    // At least one card should have interactions (Metformin has several)
    const withInteractions = data.cards.filter(
      (c: { interactions: unknown[] }) => c.interactions.length > 0,
    )
    expect(withInteractions.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// 9. Full interaction check
// ---------------------------------------------------------------------------

describe("GET /api/patients/:id/interactions", () => {
  it("returns interactions list with severity flag", async () => {
    const data = await (await get("/interactions")).json()
    expect(Array.isArray(data.interactions)).toBe(true)
    expect(data.interactions.length).toBeGreaterThan(0)
    expect(typeof data.hasSevereInteraction).toBe("boolean")
    expect(data.hasSevereInteraction).toBe(true) // fixture has SEVERE entries
  })

  it("respects pagination parameters", async () => {
    const data = await (await get("/interactions?limit=2&offset=0")).json()
    expect(data.interactions.length).toBeLessThanOrEqual(2)
    expect(data.pagination.limit).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// 10. Refill schedule
// ---------------------------------------------------------------------------

describe("GET /api/patients/:id/refill-schedule", () => {
  it("returns a schedules array", async () => {
    const data = await (await get("/refill-schedule")).json()
    expect(Array.isArray(data.schedules)).toBe(true)
    expect(data.schedules.length).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// 11. Education feed (next unviewed card)
// ---------------------------------------------------------------------------

describe("GET /api/patients/:id/education-feed", () => {
  it("returns the next unviewed card", async () => {
    const data = await (await get("/education-feed")).json()
    // With no profile and no viewed cards, returns a GENERAL card
    expect(data).not.toBeNull()
    expect(data.conditionType).toBe("GENERAL")
  })
})

// ---------------------------------------------------------------------------
// 12. Mark education card viewed
// ---------------------------------------------------------------------------

describe("POST /api/patients/:id/education-feed/:cardId/viewed", () => {
  it("persists the viewed card and returns updated viewed IDs", async () => {
    const res = await post("/education-feed/edu-dietary-001/viewed", {})
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.viewedIds).toContain("edu-dietary-001")
  })

  it("is idempotent — viewing the same card twice does not duplicate", async () => {
    await post("/education-feed/edu-dietary-001/viewed", {})
    const res = await post("/education-feed/edu-dietary-001/viewed", {})
    const data = await res.json()
    expect(
      data.viewedIds.filter((id: string) => id === "edu-dietary-001").length,
    ).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// 13. Education cards list (all)
// ---------------------------------------------------------------------------

describe("GET /api/patients/:id/education-cards", () => {
  it("returns all cards with a viewed flag", async () => {
    const data = await (await get("/education-cards")).json()
    expect(Array.isArray(data.cards)).toBe(true)
    expect(data.cards.length).toBe(12)
    expect(data.cards[0]).toHaveProperty("viewed")
  })

  it("reflects viewed state after marking a card", async () => {
    await post("/education-feed/edu-dietary-001/viewed", {})
    const data = await (await get("/education-cards")).json()
    const card = data.cards.find(
      (c: { id: string }) => c.id === "edu-dietary-001",
    )
    expect(card.viewed).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 14. Pharmacy stock
// ---------------------------------------------------------------------------

describe("GET /api/pharmacies/stock", () => {
  it("returns stock sorted by distance", async () => {
    const res = await fetch(`${ORIGIN}/api/pharmacies/stock`)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)
    // Check distance sorting
    for (let i = 1; i < data.length; i++) {
      expect(data[i].distance).toBeGreaterThanOrEqual(data[i - 1].distance)
    }
  })

  it("filters by medicationId query parameter", async () => {
    const res = await fetch(
      `${ORIGIN}/api/pharmacies/stock?medicationId=amlodipine`,
    )
    const data = await res.json()
    for (const item of data) {
      expect(item.medicationName.toLowerCase()).toContain("amlodipine")
    }
  })
})

// ---------------------------------------------------------------------------
// 15. Medication loan pre-approval
// ---------------------------------------------------------------------------

describe("GET /api/patients/:id/credit/pre-approval", () => {
  it("returns pre-approval details", async () => {
    const data = await (await get("/credit/pre-approval")).json()
    expect(data.isPreApproved).toBe(true)
    expect(data.maxAmount).toBe("5500")
  })
})

// ---------------------------------------------------------------------------
// 16. Emergency transport credit (via credit endpoint)
// ---------------------------------------------------------------------------

describe("GET /api/patients/:id/credit/emergency-transport", () => {
  it("returns transport credit details", async () => {
    const data = await (await get("/credit/emergency-transport")).json()
    expect(data.isAvailable).toBe(true)
    expect(data.preApprovedAmount).toBe("2000")
  })
})

// ---------------------------------------------------------------------------
// 17. AI assistant message (keyword matching)
// ---------------------------------------------------------------------------

describe("POST /api/patients/:id/assistant/message", () => {
  it("matches cough keyword to Margaret conversation", async () => {
    const res = await post("/assistant/message", {
      content: "I have a bad cough since starting my medication",
    })
    const data = await res.json()
    expect(data.sessionId).toBe("session-margaret-cough")
    expect(data.message.content).toContain("ACE inhibitor")
  })

  it("matches food keyword to James conversation", async () => {
    const res = await post("/assistant/message", {
      content: "What food should I eat for diabetes?",
    })
    const data = await res.json()
    expect(data.sessionId).toBe("session-james-dinner")
  })

  it("matches together keyword to Grace conversation", async () => {
    const res = await post("/assistant/message", {
      content: "Can I take my medications together?",
    })
    const data = await res.json()
    expect(data.sessionId).toBe("session-grace-timing")
  })

  it("returns default redirect for unmatched messages", async () => {
    const res = await post("/assistant/message", {
      content: "How do I file my tax returns?",
    })
    const data = await res.json()
    expect(data.sessionId).toBe("session-default")
    expect(data.message.guardrailFlags).toContain("redirect_to_professional")
  })

  it("uses provided sessionId when given", async () => {
    const res = await post("/assistant/message", {
      content: "cough",
      sessionId: "my-custom-session",
    })
    const data = await res.json()
    expect(data.sessionId).toBe("my-custom-session")
  })

  it("returns a generated message ID", async () => {
    const data = await (
      await post("/assistant/message", { content: "cough" })
    ).json()
    expect(data.message.id).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 18. AI assistant interaction check
// ---------------------------------------------------------------------------

describe("POST /api/patients/:id/assistant/interaction-check", () => {
  it("finds interactions for a known medication", async () => {
    const res = await post("/assistant/interaction-check", {
      productName: "Metformin",
    })
    const data = await res.json()
    expect(data.productName).toBe("Metformin")
    expect(data.interactions.length).toBeGreaterThan(0)
    expect(data.overallRisk).not.toBe("NONE")
  })

  it("returns NONE risk for an unrecognised product", async () => {
    const res = await post("/assistant/interaction-check", {
      productName: "VitaminZ9000",
    })
    const data = await res.json()
    expect(data.interactions.length).toBe(0)
    expect(data.overallRisk).toBe("NONE")
  })

  it("always includes a disclaimer", async () => {
    const data = await (
      await post("/assistant/interaction-check", {
        productName: "Metformin",
      })
    ).json()
    expect(data.disclaimer).toContain("consult")
  })

  it("returns HIGH risk when SEVERE interactions exist", async () => {
    const data = await (
      await post("/assistant/interaction-check", {
        productName: "Enalapril",
      })
    ).json()
    // Enalapril + Potassium supplements is SEVERE in the fixture
    expect(data.overallRisk).toBe("HIGH")
  })
})

// ---------------------------------------------------------------------------
// 19. Profile GET
// ---------------------------------------------------------------------------

describe("GET /api/patients/:id/care-companion/profile", () => {
  it("returns null when no profile has been saved", async () => {
    const data = await (await get("/care-companion/profile")).json()
    expect(data).toBeNull()
  })

  it("returns the saved profile", async () => {
    saveCareCompanionProfile(MOCK_PROFILE)
    const data = await (await get("/care-companion/profile")).json()
    expect(data.id).toBe("profile-test-001")
  })
})

// ---------------------------------------------------------------------------
// 20. Profile POST
// ---------------------------------------------------------------------------

describe("POST /api/patients/:id/care-companion/profile", () => {
  it("saves the profile and returns 201", async () => {
    const res = await post("/care-companion/profile", MOCK_PROFILE)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBe("profile-test-001")
  })

  it("persists so subsequent GET returns the profile", async () => {
    await post("/care-companion/profile", MOCK_PROFILE)
    const data = await (await get("/care-companion/profile")).json()
    expect(data.id).toBe("profile-test-001")
  })
})

// ---------------------------------------------------------------------------
// 21. Profile PATCH
// ---------------------------------------------------------------------------

describe("PATCH /api/patients/:id/care-companion/profile", () => {
  it("shallow-merges into the existing profile", async () => {
    await post("/care-companion/profile", MOCK_PROFILE)
    const res = await patch("/care-companion/profile", {
      completedAt: "2026-06-01T00:00:00Z",
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.completedAt).toBe("2026-06-01T00:00:00Z")
    // Unpatched fields preserved
    expect(data.conditions.type).toEqual(["DIABETES", "HYPERTENSION"])
  })
})
