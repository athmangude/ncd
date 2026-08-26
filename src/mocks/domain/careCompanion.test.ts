// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest"
import {
  getCareCompanionProfile,
  saveCareCompanionProfile,
  patchCareCompanionProfile,
  getEducationViewedIds,
  markEducationViewed,
  getPatientMedications,
  getMedicationTimeline,
  getCostSummary,
  getEmergencyCards,
  getMedicationCards,
  getMedicationInteractions,
  getRefillSchedules,
  getEducationCards,
  getPharmacyStock,
  getMedicationLoanPreApproval,
  getEmergencyTransportCredit,
  getNextEducationCard,
  getMatchedEmergencyCard,
  buildCareCompanionHome,
  matchAssistantResponse,
} from "./careCompanion"

import type { CareCompanionProfile } from "@/types/care-companion"

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
    medicationNames: ["Metformin", "Amlodipine"],
    takingMedicationRegularly: "MOSTLY",
    reasonsForMissing: ["COST"],
    usingHerbalAlternatives: false,
    herbalDetails: null,
  },
  recurringTests: {
    selectedTests: ["HbA1c Test"],
  },
  costEstimates: {
    medications: [
      { name: "Metformin", refillFrequencyDays: 30, estimatedCostPerRefill: 450 },
      { name: "Amlodipine", refillFrequencyDays: 30, estimatedCostPerRefill: 380 },
    ],
    tests: [
      { name: "HbA1c Test", frequencyMonths: 3, estimatedCostPerTest: 1800 },
    ],
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

beforeEach(() => {
  localStorage.clear()
})

// ---------------------------------------------------------------------------
// Profile CRUD
// ---------------------------------------------------------------------------

describe("profile CRUD", () => {
  it("returns null when no profile has been saved", () => {
    expect(getCareCompanionProfile()).toBeNull()
  })

  it("returns null when localStorage has corrupt JSON", () => {
    localStorage.setItem("mock:care-companion-profile", "not json{{{")
    expect(getCareCompanionProfile()).toBeNull()
  })

  it("saves and returns a full profile (POST from intake)", () => {
    const saved = saveCareCompanionProfile(MOCK_PROFILE)
    expect(saved.id).toBe("profile-test-001")
    expect(getCareCompanionProfile()?.id).toBe("profile-test-001")
  })

  it("patch shallow-merges into an existing profile", () => {
    saveCareCompanionProfile(MOCK_PROFILE)
    const patched = patchCareCompanionProfile({
      id: "profile-test-001",
      completedAt: "2026-06-01T00:00:00Z",
    } as Partial<CareCompanionProfile>)
    expect(patched.completedAt).toBe("2026-06-01T00:00:00Z")
    // Unpatched fields preserved
    expect(patched.conditions.type).toEqual(["DIABETES", "HYPERTENSION"])
  })

  it("patch uses the fixture seed when no profile exists yet", () => {
    const patched = patchCareCompanionProfile({
      completedAt: "2026-07-01T00:00:00Z",
    } as Partial<CareCompanionProfile>)
    expect(patched.completedAt).toBe("2026-07-01T00:00:00Z")
    // Should have seed data for other fields (the fixture has DIABETES + HYPERTENSION)
    expect(patched.conditions).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// Education viewed tracking
// ---------------------------------------------------------------------------

describe("education viewed tracking", () => {
  it("starts with an empty viewed list", () => {
    expect(getEducationViewedIds()).toEqual([])
  })

  it("marks a card as viewed and persists the ID", () => {
    markEducationViewed("edu-dietary-001")
    expect(getEducationViewedIds()).toContain("edu-dietary-001")
  })

  it("is idempotent — marking the same card twice does not duplicate it", () => {
    markEducationViewed("edu-dietary-001")
    markEducationViewed("edu-dietary-001")
    const ids = getEducationViewedIds()
    expect(ids.filter((id) => id === "edu-dietary-001").length).toBe(1)
  })

  it("accumulates multiple viewed card IDs", () => {
    markEducationViewed("edu-dietary-001")
    markEducationViewed("edu-dietary-002")
    markEducationViewed("edu-exercise-001")
    expect(getEducationViewedIds()).toEqual([
      "edu-dietary-001",
      "edu-dietary-002",
      "edu-exercise-001",
    ])
  })
})

// ---------------------------------------------------------------------------
// Fixture data accessors
// ---------------------------------------------------------------------------

describe("fixture data accessors", () => {
  it("returns patient medications from seed", () => {
    const meds = getPatientMedications()
    expect(meds.length).toBe(3)
    expect(meds.map((m) => m.medication.genericName)).toEqual(
      expect.arrayContaining(["Metformin", "Amlodipine", "Aspirin"]),
    )
  })

  it("returns medication timeline entries from seed", () => {
    const entries = getMedicationTimeline()
    expect(entries.length).toBeGreaterThan(0)
    expect(entries[0]).toHaveProperty("medicationName")
    expect(entries[0]).toHaveProperty("facilityName")
  })

  it("returns cost summary with all required fields", () => {
    const summary = getCostSummary()
    expect(summary.year).toBe(2026)
    expect(summary.ytdSpend).toBe("47200")
    expect(summary.currency).toBe("KES")
    expect(summary.breakdown).toHaveLength(3)
    expect(summary.monthlyTrend.length).toBeGreaterThan(0)
  })

  it("returns emergency cards for DIABETES, HYPERTENSION, GENERAL", () => {
    const cards = getEmergencyCards()
    expect(cards.length).toBe(3)
    const types = cards.map((c) => c.conditionType)
    expect(types).toContain("DIABETES")
    expect(types).toContain("HYPERTENSION")
    expect(types).toContain("GENERAL")
  })

  it("returns medication cards from seed", () => {
    const cards = getMedicationCards()
    expect(cards.length).toBeGreaterThan(0)
    expect(cards[0]).toHaveProperty("medication")
    expect(cards[0]).toHaveProperty("description")
  })

  it("returns medication interactions from seed", () => {
    const interactions = getMedicationInteractions()
    expect(interactions.length).toBeGreaterThan(0)
    expect(interactions[0]).toHaveProperty("severity")
    expect(interactions[0]).toHaveProperty("medicationA")
  })

  it("returns refill schedules from seed", () => {
    const schedules = getRefillSchedules()
    expect(schedules.length).toBe(3)
    const statuses = schedules.map((s) => s.status)
    expect(statuses).toContain("OVERDUE")
    expect(statuses).toContain("DUE")
    expect(statuses).toContain("UPCOMING")
  })

  it("returns education cards from seed", () => {
    const cards = getEducationCards()
    expect(cards.length).toBe(12)
    expect(cards[0]).toHaveProperty("conditionType")
    expect(cards[0]).toHaveProperty("weekNumber")
  })

  it("returns pharmacy stock from seed", () => {
    const stock = getPharmacyStock()
    expect(stock.length).toBeGreaterThan(0)
    expect(stock[0]).toHaveProperty("facilityName")
    expect(stock[0]).toHaveProperty("medicationName")
  })

  it("returns medication loan pre-approval from seed", () => {
    const preApproval = getMedicationLoanPreApproval()
    expect(preApproval.isPreApproved).toBe(true)
    expect(preApproval.preApprovalDetails?.maxAmount).toBe("5500")
  })

  it("returns emergency transport credit from seed", () => {
    const credit = getEmergencyTransportCredit()
    expect(credit.isAvailable).toBe(true)
    expect(credit.preApprovedAmount).toBe("2000")
  })
})

// ---------------------------------------------------------------------------
// Education feed: next unviewed card
// ---------------------------------------------------------------------------

describe("getNextEducationCard", () => {
  it("returns the first card sorted by weekNumber when no profile and nothing viewed", () => {
    // No profile means conditionTypes is [], so only GENERAL cards qualify.
    const card = getNextEducationCard()
    expect(card).not.toBeNull()
    expect(card!.conditionType).toBe("GENERAL")
  })

  it("filters cards by patient condition when a profile exists", () => {
    saveCareCompanionProfile(MOCK_PROFILE)
    const card = getNextEducationCard()
    expect(card).not.toBeNull()
    // Should match DIABETES, HYPERTENSION, or GENERAL (those are the profile's conditions)
    expect(
      ["DIABETES", "HYPERTENSION", "GENERAL"].includes(card!.conditionType),
    ).toBe(true)
  })

  it("skips viewed cards and returns the next unviewed one", () => {
    saveCareCompanionProfile(MOCK_PROFILE)
    const first = getNextEducationCard()
    expect(first).not.toBeNull()
    markEducationViewed(first!.id)
    const second = getNextEducationCard()
    expect(second).not.toBeNull()
    expect(second!.id).not.toBe(first!.id)
  })

  it("returns null when all relevant cards have been viewed", () => {
    // No profile => only GENERAL cards are relevant
    const generalCards = getEducationCards().filter(
      (c) => c.conditionType === "GENERAL",
    )
    for (const card of generalCards) {
      markEducationViewed(card.id)
    }
    expect(getNextEducationCard()).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Emergency card: condition-matched
// ---------------------------------------------------------------------------

describe("getMatchedEmergencyCard", () => {
  it("falls back to GENERAL when no profile exists", () => {
    const card = getMatchedEmergencyCard()
    expect(card).toBeDefined()
    // With no profile, conditions is [], so fallback to GENERAL
    expect(card!.conditionType).toBe("GENERAL")
  })

  it("matches the patient primary condition from the profile", () => {
    saveCareCompanionProfile(MOCK_PROFILE) // DIABETES + HYPERTENSION
    const card = getMatchedEmergencyCard()
    expect(card).toBeDefined()
    // First condition in the list is DIABETES
    expect(card!.conditionType).toBe("DIABETES")
  })

  it("falls back to GENERAL when conditions do not match any card", () => {
    saveCareCompanionProfile({
      ...MOCK_PROFILE,
      conditions: {
        ...MOCK_PROFILE.conditions,
        type: ["CANCER"],
      },
    } as CareCompanionProfile)
    const card = getMatchedEmergencyCard()
    expect(card).toBeDefined()
    expect(card!.conditionType).toBe("GENERAL")
  })
})

// ---------------------------------------------------------------------------
// BFF aggregation: CareCompanionHome
// ---------------------------------------------------------------------------

describe("buildCareCompanionHome", () => {
  it("returns the expected top-level shape", () => {
    const home = buildCareCompanionHome()
    expect(home).toHaveProperty("refillSchedule")
    expect(home).toHaveProperty("costSummary")
    expect(home).toHaveProperty("educationFeed")
    expect(home).toHaveProperty("emergencyCard")
    expect(home).toHaveProperty("emergencyTransportCredit")
  })

  it("sorts refill schedules by urgency: OVERDUE first", () => {
    const home = buildCareCompanionHome()
    const statuses = home.refillSchedule.schedules.map((s) => s.status)
    // OVERDUE (priority 0) should come before DUE (1) and UPCOMING (2)
    expect(statuses[0]).toBe("OVERDUE")
  })

  it("limits refill schedules to 3 and signals hasMore correctly", () => {
    const home = buildCareCompanionHome()
    // Fixture has exactly 3 schedules, so hasMore is false
    expect(home.refillSchedule.schedules.length).toBeLessThanOrEqual(3)
    expect(home.refillSchedule.hasMore).toBe(false)
  })

  it("includes cost summary fields from the fixture", () => {
    const home = buildCareCompanionHome()
    expect(home.costSummary.year).toBe(2026)
    expect(home.costSummary.currency).toBe("KES")
    expect(home.costSummary.ytdSpend).toBe("47200")
  })

  it("includes emergency transport credit when available", () => {
    const home = buildCareCompanionHome()
    expect(home.emergencyTransportCredit).not.toBeNull()
    expect(home.emergencyTransportCredit!.preApprovedAmount).toBe("2000")
  })

  it("includes the education feed with an unviewed card", () => {
    const home = buildCareCompanionHome()
    // With no viewed cards and no profile, returns a GENERAL card
    expect(home.educationFeed).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// AI assistant: keyword matching
// ---------------------------------------------------------------------------

describe("matchAssistantResponse", () => {
  it("matches 'cough' to Margaret's conversation", () => {
    const result = matchAssistantResponse("I have a bad cough")
    expect(result.sessionId).toBe("session-margaret-cough")
  })

  it("matches 'enalapril' to Margaret's conversation", () => {
    const result = matchAssistantResponse(
      "Is enalapril causing my dry throat?",
    )
    expect(result.sessionId).toBe("session-margaret-cough")
  })

  it("matches 'cook' to James's conversation", () => {
    const result = matchAssistantResponse("What can I cook tonight?")
    expect(result.sessionId).toBe("session-james-dinner")
  })

  it("matches 'dinner' to James's conversation", () => {
    const result = matchAssistantResponse("Help me plan dinner")
    expect(result.sessionId).toBe("session-james-dinner")
  })

  it("matches 'food' to James's conversation", () => {
    const result = matchAssistantResponse("What food is good for diabetes?")
    expect(result.sessionId).toBe("session-james-dinner")
  })

  it("matches 'eat' to James's conversation", () => {
    const result = matchAssistantResponse("What should I eat today?")
    expect(result.sessionId).toBe("session-james-dinner")
  })

  it("matches 'together' to Grace's conversation", () => {
    const result = matchAssistantResponse(
      "Can I take my pills together in the morning?",
    )
    expect(result.sessionId).toBe("session-grace-timing")
  })

  it("matches 'same time' to Grace's conversation", () => {
    const result = matchAssistantResponse(
      "Can I take metformin and aspirin at the same time?",
    )
    expect(result.sessionId).toBe("session-grace-timing")
  })

  it("matches 'both' to Grace's conversation", () => {
    const result = matchAssistantResponse("Should I take both with breakfast?")
    expect(result.sessionId).toBe("session-grace-timing")
  })

  it("returns the default redirect for unmatched messages", () => {
    const result = matchAssistantResponse("How do I file a tax return?")
    expect(result.sessionId).toBe("session-default")
    expect(result.messages[0].guardrailFlags).toContain(
      "redirect_to_professional",
    )
  })

  it("is case-insensitive", () => {
    const upper = matchAssistantResponse("COUGH is really bad")
    const lower = matchAssistantResponse("cough is really bad")
    expect(upper.sessionId).toBe(lower.sessionId)
  })

  it("always returns a conversation with at least one message", () => {
    const keywords = [
      "cough",
      "food",
      "together",
      "random question about weather",
    ]
    for (const keyword of keywords) {
      const result = matchAssistantResponse(keyword)
      expect(result.messages.length).toBeGreaterThan(0)
    }
  })
})
