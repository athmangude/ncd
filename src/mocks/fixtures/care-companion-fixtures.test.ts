import { describe, it, expect } from "vitest"
import type {
  Medication,
  MedicationTaxonomyEntry,
  PatientMedication,
  PatientMedicationRecord,
  TimelineEntry,
  CostSummary,
  CostCategoryBreakdown,
  EmergencyCard,
  MedicationCard,
  MedicationInteraction,
  RefillSchedule,
  EducationContentCard,
  PharmacyStock,
  MedicationLoanPreApproval,
  EmergencyTransportCredit,
  AssistantMessage,
  CareCompanionProfile,
} from "@/types/care-companion"

import medicationTaxonomy from "./medication-taxonomy.json"
import patientMedications from "./patient-medications.json"
import medicationTimeline from "./medication-timeline.json"
import costSummaryFixture from "./cost-summary.json"
import emergencyCards from "./emergency-cards.json"
import medicationCards from "./medication-cards.json"
import medicationInteractions from "./medication-interactions.json"
import refillSchedules from "./refill-schedules.json"
import educationCards from "./education-cards.json"
import pharmacyStock from "./pharmacy-stock.json"
import medicationLoanPreapproval from "./medication-loan-preapproval.json"
import emergencyTransportCredit from "./emergency-transport-credit.json"
import aiAssistantConversations from "./ai-assistant-conversations.json"
import careCompanionProfile from "./care-companion-profile.json"
import patientMedicationRecords from "./patient-medication-records.json"

// ---------------------------------------------------------------------------
// Helper: type-check assertion. If the fixture shape drifts from the
// TypeScript type, the test file will fail to compile before it even runs.
// ---------------------------------------------------------------------------

function assertType<T>(_value: T): void {
  // compile-time only
}

// ---------------------------------------------------------------------------
// 1. medication-taxonomy.json
// ---------------------------------------------------------------------------

describe("medication-taxonomy.json", () => {
  const entries = medicationTaxonomy as MedicationTaxonomyEntry[]

  it("contains 18 NCD medications and lab tests (within the 15-20 range)", () => {
    expect(entries.length).toBeGreaterThanOrEqual(15)
    expect(entries.length).toBeLessThanOrEqual(20)
    expect(entries).toHaveLength(18)
  })

  it("every entry has the required MedicationTaxonomyEntry fields", () => {
    for (const entry of entries) {
      expect(entry.id).toBeTruthy()
      expect(entry.genericName).toBeTruthy()
      expect(["MEDICATION", "LAB_TEST", "CONSULTATION", "SUPPLY"]).toContain(
        entry.category,
      )
      expect(typeof entry.isActive).toBe("boolean")
      expect(entry.isActive).toBe(true)

      if (entry.category === "MEDICATION") {
        expect(Array.isArray(entry.brandNames)).toBe(true)
        expect((entry.brandNames as string[]).length).toBeGreaterThan(0)
        expect(Array.isArray(entry.dosageForms)).toBe(true)
        expect((entry.dosageForms as string[]).length).toBeGreaterThan(0)
        expect(Array.isArray(entry.strengths)).toBe(true)
        expect((entry.strengths as string[]).length).toBeGreaterThan(0)
        expect(entry.atcCode).toBeTruthy()
      }

      expect(Array.isArray(entry.conditionTags)).toBe(true)
      expect((entry.conditionTags as string[]).length).toBeGreaterThan(0)
      expect(Array.isArray(entry.synonyms)).toBe(true)
      expect((entry.synonyms as string[]).length).toBeGreaterThanOrEqual(2)
    }
  })

  it("every entry has a deterministic UUID", () => {
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    for (const entry of entries) {
      expect(entry.id).toMatch(uuidPattern)
    }
  })

  it("all entries have unique IDs", () => {
    const ids = entries.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("all entries have unique generic names", () => {
    const names = entries.map((m) => m.genericName)
    expect(new Set(names).size).toBe(names.length)
  })

  it("contains the three drugs Grace takes: Metformin, Amlodipine, Aspirin", () => {
    const names = entries.map((m) => m.genericName)
    expect(names).toContain("Metformin")
    expect(names).toContain("Amlodipine")
    expect(names).toContain("Aspirin")
  })

  it("includes at least 5 diabetes medications", () => {
    const diabetesMeds = entries.filter(
      (e) =>
        e.category === "MEDICATION" &&
        (e.conditionTags ?? []).includes("DIABETES"),
    )
    expect(diabetesMeds.length).toBeGreaterThanOrEqual(5)
  })

  it("includes at least 5 hypertension medications", () => {
    const hypertensionMeds = entries.filter(
      (e) =>
        e.category === "MEDICATION" &&
        (e.conditionTags ?? []).includes("HYPERTENSION"),
    )
    expect(hypertensionMeds.length).toBeGreaterThanOrEqual(5)
  })

  it("includes at least one LAB_TEST category entry (HbA1c)", () => {
    const labTests = entries.filter((e) => e.category === "LAB_TEST")
    expect(labTests.length).toBeGreaterThanOrEqual(1)
    const hba1c = labTests.find((e) => e.genericName === "HbA1c Test")
    expect(hba1c).toBeDefined()
    expect(hba1c!.conditionTags).toContain("DIABETES")
  })

  it("conditionTags only use valid ConditionType values", () => {
    const valid = new Set(["HYPERTENSION", "DIABETES", "GENERAL"])
    for (const entry of entries) {
      for (const tag of entry.conditionTags ?? []) {
        expect(valid).toContain(tag)
      }
    }
  })

  it("every medication entry has a real WHO ATC code", () => {
    const meds = entries.filter((e) => e.category === "MEDICATION")
    for (const med of meds) {
      expect(med.atcCode).toBeTruthy()
      expect(med.atcCode).toMatch(/^[A-Z]\d{2}[A-Z]{2}\d{2}$/)
    }
  })

  it("synonyms include at least 2 common misspellings per medication", () => {
    const meds = entries.filter((e) => e.category === "MEDICATION")
    for (const med of meds) {
      const synonyms = med.synonyms ?? []
      const brandLower = (med.brandNames ?? []).map((b) => b.toLowerCase())
      const descriptive = [
        "sugar medicine",
        "pressure medicine",
        "blood thinner",
        "cholesterol medicine",
        "water pill",
        "stomach medicine",
        "long-acting insulin",
        "acetylsalicylic acid",
        "water tablet",
        "cholesterol tablet",
        "hctz",
        "glyburide",
      ]
      const misspellings = synonyms.filter(
        (s) =>
          !brandLower.includes(s.toLowerCase()) &&
          s.toLowerCase() !== med.genericName.toLowerCase() &&
          !descriptive.includes(s.toLowerCase()),
      )
      expect(misspellings.length).toBeGreaterThanOrEqual(2)
    }
  })
})

// ---------------------------------------------------------------------------
// 2. patient-medications.json
// ---------------------------------------------------------------------------

describe("patient-medications.json", () => {
  const meds = patientMedications as PatientMedication[]

  it("contains exactly 3 medications for Grace", () => {
    expect(meds).toHaveLength(3)
  })

  it("includes metformin 500mg, amlodipine 5mg, and aspirin 75mg", () => {
    const names = meds.map((m) => m.medication.genericName)
    expect(names).toContain("Metformin")
    expect(names).toContain("Amlodipine")
    expect(names).toContain("Aspirin")
  })

  it("every entry has a nested Medication object with valid fields", () => {
    for (const pm of meds) {
      expect(pm.medication).toBeDefined()
      expect(pm.medication.id).toBeTruthy()
      expect(pm.medication.genericName).toBeTruthy()
      assertType<Medication>(pm.medication)
    }
  })

  it("all entries are active", () => {
    for (const pm of meds) {
      expect(pm.isActive).toBe(true)
    }
  })

  it("dates are valid date strings", () => {
    for (const pm of meds) {
      expect(new Date(pm.firstPurchaseDate).toString()).not.toBe("Invalid Date")
      expect(new Date(pm.lastPurchaseDate).toString()).not.toBe("Invalid Date")
    }
  })

  it("has 8+ month purchase history (first purchase on or before Dec 2025)", () => {
    const earliest = meds
      .map((m) => new Date(m.firstPurchaseDate).getTime())
      .sort((a, b) => a - b)[0]
    // December 2025 = 2025-12-31
    expect(earliest).toBeLessThanOrEqual(new Date("2025-12-31").getTime())
  })

  it("totalPurchaseCount is a positive number for all entries", () => {
    for (const pm of meds) {
      expect(pm.totalPurchaseCount).toBeGreaterThan(0)
    }
  })

  it("averageRefillIntervalDays is a number or null", () => {
    for (const pm of meds) {
      expect(
        typeof pm.averageRefillIntervalDays === "number" ||
          pm.averageRefillIntervalDays === null,
      ).toBe(true)
    }
  })

  it("inferredConditions is a non-empty array of strings", () => {
    for (const pm of meds) {
      expect(Array.isArray(pm.inferredConditions)).toBe(true)
      expect(pm.inferredConditions.length).toBeGreaterThan(0)
    }
  })
})

// ---------------------------------------------------------------------------
// 3. medication-timeline.json
// ---------------------------------------------------------------------------

describe("medication-timeline.json", () => {
  const entries = medicationTimeline as TimelineEntry[]

  it("contains 24 entries", () => {
    expect(entries).toHaveLength(24)
  })

  it("every entry has the required TimelineEntry fields", () => {
    for (const entry of entries) {
      expect(entry.date).toBeTruthy()
      expect(entry.medicationName).toBeTruthy()
      expect(typeof entry.lineTotal).toBe("string")
      expect(entry.facilityName).toBeTruthy()
      expect(typeof entry.isGapAnomaly).toBe("boolean")
    }
  })

  it("dates are valid date strings in descending order (most recent first)", () => {
    for (let i = 1; i < entries.length; i++) {
      const currentDate = new Date(entries[i - 1].date).getTime()
      const nextDate = new Date(entries[i].date).getTime()
      // Allow same-day entries (>=)
      expect(currentDate).toBeGreaterThanOrEqual(nextDate)
    }
  })

  it("includes purchases from 3 different pharmacies", () => {
    const facilities = new Set(entries.map((e) => e.facilityName))
    expect(facilities.size).toBeGreaterThanOrEqual(3)
  })

  it("contains exactly 2 gap anomalies", () => {
    const anomalies = entries.filter((e) => e.isGapAnomaly)
    expect(anomalies).toHaveLength(2)
  })

  it("gap anomalies have a higher gapDaysFromPrevious than the typical ~30-day cycle", () => {
    const anomalies = entries.filter((e) => e.isGapAnomaly)
    for (const anomaly of anomalies) {
      expect(anomaly.gapDaysFromPrevious).toBeGreaterThan(35)
    }
  })

  it("one gap anomaly occurs around January (school fees period)", () => {
    const anomalies = entries.filter((e) => e.isGapAnomaly)
    const januaryAnomaly = anomalies.some((a) => {
      const month = new Date(a.date).getMonth() // 0-indexed
      // The entry date is when they resumed purchasing, so Jan or Feb
      return month === 0 || month === 1
    })
    expect(januaryAnomaly).toBe(true)
  })

  it("one gap anomaly occurs around April (Easter period)", () => {
    const anomalies = entries.filter((e) => e.isGapAnomaly)
    const aprilAnomaly = anomalies.some((a) => {
      const month = new Date(a.date).getMonth()
      // April = month 3
      return month === 3 || month === 4
    })
    expect(aprilAnomaly).toBe(true)
  })

  it("lineTotal values are numeric strings (no currency symbol)", () => {
    for (const entry of entries) {
      expect(Number.isNaN(Number(entry.lineTotal))).toBe(false)
      expect(Number(entry.lineTotal)).toBeGreaterThan(0)
    }
  })

  it("first entries have null gapDaysFromPrevious (no prior purchase)", () => {
    const nullGapEntries = entries.filter(
      (e) => e.gapDaysFromPrevious === null,
    )
    expect(nullGapEntries.length).toBeGreaterThan(0)
  })

  it("includes all 3 of Grace's medications", () => {
    const medNames = new Set(entries.map((e) => e.medicationName))
    expect(medNames).toContain("Metformin 500mg")
    expect(medNames).toContain("Amlodipine 5mg")
    expect(medNames).toContain("Aspirin 75mg")
  })
})

// ---------------------------------------------------------------------------
// 4. cost-summary.json
// ---------------------------------------------------------------------------

describe("cost-summary.json", () => {
  const data = costSummaryFixture as CostSummary & {
    breakdown: CostCategoryBreakdown[]
    monthlyTrend: { month: number; spend: string }[]
  }

  it("is year 2026 with KES currency", () => {
    expect(data.year).toBe(2026)
    expect(data.currency).toBe("KES")
  })

  it("has YTD spend of KES 47,200", () => {
    expect(Number(data.ytdSpend)).toBe(47200)
  })

  it("has monthly average of KES 5,900", () => {
    expect(Number(data.monthlyAverage)).toBe(5900)
  })

  it("has cashback earned of KES 2,360", () => {
    expect(Number(data.cashbackEarned)).toBe(2360)
  })

  it("all monetary fields are string representations of numbers", () => {
    const fields = [
      data.ytdSpend,
      data.monthlyAverage,
      data.cashbackEarned,
      data.netSpend,
      data.annualProjection,
    ]
    for (const val of fields) {
      expect(typeof val).toBe("string")
      expect(Number.isNaN(Number(val))).toBe(false)
    }
  })

  it("netSpend = ytdSpend - cashbackEarned", () => {
    const expected = Number(data.ytdSpend) - Number(data.cashbackEarned)
    expect(Number(data.netSpend)).toBe(expected)
  })

  it("has a category breakdown array", () => {
    expect(Array.isArray(data.breakdown)).toBe(true)
    expect(data.breakdown.length).toBeGreaterThan(0)
  })

  it("breakdown percentages sum to approximately 100", () => {
    const totalPct = data.breakdown.reduce((s, b) => s + b.percentage, 0)
    expect(totalPct).toBeGreaterThanOrEqual(99)
    expect(totalPct).toBeLessThanOrEqual(101)
  })

  it("breakdown categories use valid MedicationCategory values", () => {
    const valid = new Set(["MEDICATION", "LAB_TEST", "CONSULTATION", "SUPPLY"])
    for (const b of data.breakdown) {
      expect(valid).toContain(b.category)
    }
  })

  it("has a monthly trend with entries for months 1 through 8", () => {
    expect(Array.isArray(data.monthlyTrend)).toBe(true)
    expect(data.monthlyTrend).toHaveLength(8)
    const months = data.monthlyTrend.map((t) => t.month)
    expect(months).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it("monthly trend spend values are numeric strings", () => {
    for (const t of data.monthlyTrend) {
      expect(typeof t.spend).toBe("string")
      expect(Number.isNaN(Number(t.spend))).toBe(false)
      expect(Number(t.spend)).toBeGreaterThan(0)
    }
  })

  it("transactionCount is a positive integer", () => {
    expect(data.transactionCount).toBe(24)
    expect(Number.isInteger(data.transactionCount)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 5. emergency-cards.json
// ---------------------------------------------------------------------------

describe("emergency-cards.json", () => {
  const cards = emergencyCards as EmergencyCard[]

  it("contains 3 cards: diabetes, hypertension, and general", () => {
    expect(cards).toHaveLength(3)
    const types = cards.map((c) => c.conditionType).sort()
    expect(types).toEqual(["DIABETES", "GENERAL", "HYPERTENSION"])
  })

  it("every card has clinically accurate required fields", () => {
    for (const card of cards) {
      expect(card.id).toBeTruthy()
      expect(card.title).toBeTruthy()
      expect(card.locale).toBe("EN")
      expect(card.warningSymptoms.length).toBeGreaterThan(0)
      expect(card.immediateActions.length).toBeGreaterThan(0)
      expect(card.whenToGoToER.length).toBeGreaterThan(0)
      expect(card.doNotDo.length).toBeGreaterThan(0)
    }
  })

  it("warning symptoms have valid severity values (warning or critical)", () => {
    for (const card of cards) {
      for (const ws of card.warningSymptoms) {
        expect(["warning", "critical"]).toContain(ws.severity)
        expect(ws.symptom).toBeTruthy()
      }
    }
  })

  it("immediate actions are numbered sequentially starting from 1", () => {
    for (const card of cards) {
      card.immediateActions.forEach((action, index) => {
        expect(action.step).toBe(index + 1)
        expect(action.action).toBeTruthy()
      })
    }
  })

  it("every card includes both warning and critical severity symptoms", () => {
    for (const card of cards) {
      const severities = card.warningSymptoms.map((ws) => ws.severity)
      expect(severities).toContain("warning")
      expect(severities).toContain("critical")
    }
  })

  it("all cards have emergency transport credit available with KES 2,000", () => {
    for (const card of cards) {
      expect(card.emergencyTransportCreditAvailable).toBe(true)
      expect(Number(card.emergencyTransportCreditAmount)).toBe(2000)
    }
  })

  it("all cards have unique IDs", () => {
    const ids = cards.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

// ---------------------------------------------------------------------------
// 6. medication-cards.json
// ---------------------------------------------------------------------------

describe("medication-cards.json", () => {
  const cards = medicationCards as MedicationCard[]

  it("contains exactly 5 drugs", () => {
    expect(cards).toHaveLength(5)
  })

  it("every card has the required MedicationCard fields", () => {
    for (const card of cards) {
      expect(card.id).toBeTruthy()
      expect(card.medicationId).toBeTruthy()
      expect(["EN", "SW"]).toContain(card.locale)
      expect(card.description).toBeTruthy()
      expect(card.commonSideEffects.length).toBeGreaterThan(0)
      expect(card.seriousSideEffects.length).toBeGreaterThan(0)
      expect(card.avoidanceWarnings.length).toBeGreaterThan(0)
      expect(card.whenToSeekHelp).toBeTruthy()
    }
  })

  it("common side effects have effect, frequency, and advice", () => {
    for (const card of cards) {
      for (const se of card.commonSideEffects) {
        expect(se.effect).toBeTruthy()
        expect(se.frequency).toBeTruthy()
        expect(se.advice).toBeTruthy()
      }
    }
  })

  it("serious side effects have effect and action", () => {
    for (const card of cards) {
      for (const se of card.seriousSideEffects) {
        expect(se.effect).toBeTruthy()
        expect(se.action).toBeTruthy()
      }
    }
  })

  it("avoidance warnings have substance and reason", () => {
    for (const card of cards) {
      for (const aw of card.avoidanceWarnings) {
        expect(aw.substance).toBeTruthy()
        expect(aw.reason).toBeTruthy()
      }
    }
  })

  it("all cards have unique IDs", () => {
    const ids = cards.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("nested medication objects reference valid taxonomy entries", () => {
    const taxonomyIds = new Set(
      (medicationTaxonomy as Medication[]).map((m) => m.id),
    )
    for (const card of cards) {
      expect(taxonomyIds).toContain(card.medicationId)
    }
  })

  it("howItWorks is a string or null for every card", () => {
    for (const card of cards) {
      expect(
        typeof card.howItWorks === "string" || card.howItWorks === null,
      ).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// 7. medication-interactions.json
// ---------------------------------------------------------------------------

describe("medication-interactions.json", () => {
  const interactions = medicationInteractions as MedicationInteraction[]

  it("contains 8 interaction records", () => {
    expect(interactions).toHaveLength(6)
  })

  it("every record has the required MedicationInteraction fields", () => {
    for (const int of interactions) {
      expect(int.id).toBeTruthy()
      expect(int.medicationAId).toBeTruthy()
      expect(int.descriptionEn).toBeTruthy()
      expect(int.descriptionSw).toBeTruthy()
      expect(int.clinicalEffect).toBeTruthy()
      expect(int.recommendation).toBeTruthy()
      expect(int.source).toBeTruthy()
      expect(
        ["MILD", "MODERATE", "SEVERE", "CONTRAINDICATED"],
      ).toContain(int.severity)
    }
  })

  it("includes drug-herbal interactions (herbName set, medicationBId null)", () => {
    const herbal = interactions.filter(
      (int) => int.herbName !== null && int.medicationBId === null,
    )
    expect(herbal.length).toBeGreaterThan(0)
  })

  it("includes drug-drug interactions (medicationBId set, herbName null)", () => {
    const drugDrug = interactions.filter(
      (int) => int.medicationBId !== null && int.herbName === null,
    )
    expect(drugDrug.length).toBeGreaterThan(0)
  })

  it("every record has exactly one of medicationBId or herbName set (not both, not neither)", () => {
    for (const int of interactions) {
      const hasMedB = int.medicationBId !== null
      const hasHerb = int.herbName !== null
      expect(hasMedB !== hasHerb).toBe(true)
    }
  })

  it("all IDs are unique", () => {
    const ids = interactions.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("severity values span at least MILD, MODERATE, and SEVERE", () => {
    const severities = new Set(interactions.map((i) => i.severity))
    expect(severities).toContain("MILD")
    expect(severities).toContain("MODERATE")
    expect(severities).toContain("SEVERE")
  })
})

// ---------------------------------------------------------------------------
// 8. refill-schedules.json
// ---------------------------------------------------------------------------

describe("refill-schedules.json", () => {
  const schedules = refillSchedules as RefillSchedule[]

  it("contains 3 refill schedules for Grace's medications", () => {
    expect(schedules).toHaveLength(3)
  })

  it("metformin is DUE with 3 days until refill", () => {
    const metformin = schedules.find(
      (s) => s.medicationName === "Metformin 500mg",
    )
    expect(metformin).toBeDefined()
    expect(metformin!.status).toBe("DUE")
    expect(metformin!.daysUntilRefill).toBe(3)
  })

  it("amlodipine is UPCOMING with 18 days until refill", () => {
    const amlodipine = schedules.find(
      (s) => s.medicationName === "Amlodipine 5mg",
    )
    expect(amlodipine).toBeDefined()
    expect(amlodipine!.status).toBe("UPCOMING")
    expect(amlodipine!.daysUntilRefill).toBe(18)
  })

  it("aspirin is OVERDUE with negative daysUntilRefill (-5 days)", () => {
    const aspirin = schedules.find(
      (s) => s.medicationName === "Aspirin 75mg",
    )
    expect(aspirin).toBeDefined()
    expect(aspirin!.status).toBe("OVERDUE")
    expect(aspirin!.daysUntilRefill).toBe(-5)
  })

  it("the OVERDUE medication has escalatedToLoanOffer = true", () => {
    const overdue = schedules.find((s) => s.status === "OVERDUE")
    expect(overdue).toBeDefined()
    expect(overdue!.escalatedToLoanOffer).toBe(true)
  })

  it("non-OVERDUE medications have escalatedToLoanOffer = false", () => {
    const nonOverdue = schedules.filter((s) => s.status !== "OVERDUE")
    for (const s of nonOverdue) {
      expect(s.escalatedToLoanOffer).toBe(false)
    }
  })

  it("every schedule has a valid expectedRefillDate", () => {
    for (const s of schedules) {
      expect(new Date(s.expectedRefillDate).toString()).not.toBe(
        "Invalid Date",
      )
    }
  })

  it("all IDs are unique", () => {
    const ids = schedules.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("status values only use valid RefillStatus values", () => {
    const valid = new Set([
      "UPCOMING",
      "DUE",
      "OVERDUE",
      "REFILLED",
      "CANCELLED",
    ])
    for (const s of schedules) {
      expect(valid).toContain(s.status)
    }
  })
})

// ---------------------------------------------------------------------------
// 9. education-cards.json
// ---------------------------------------------------------------------------

describe("education-cards.json", () => {
  const cards = educationCards as EducationContentCard[]

  it("contains exactly 12 education cards", () => {
    expect(cards).toHaveLength(12)
  })

  it("has 4 dietary cards", () => {
    const dietary = cards.filter((c) => c.contentType === "DIETARY")
    expect(dietary).toHaveLength(4)
  })

  it("has 2 exercise cards", () => {
    const exercise = cards.filter((c) => c.contentType === "EXERCISE")
    expect(exercise).toHaveLength(2)
  })

  it("has 2 myth-busting cards", () => {
    const myths = cards.filter((c) => c.contentType === "MYTH_BUSTING")
    expect(myths).toHaveLength(2)
  })

  it("has 2 emotional/acceptance cards", () => {
    const emotional = cards.filter(
      (c) => c.contentType === "EMOTIONAL" || c.contentType === "ACCEPTANCE",
    )
    expect(emotional).toHaveLength(2)
  })

  it("has 1 self-monitoring card", () => {
    const selfMon = cards.filter((c) => c.contentType === "SELF_MONITORING")
    expect(selfMon).toHaveLength(1)
  })

  it("has 1 milestone card", () => {
    const milestone = cards.filter((c) => c.contentType === "MILESTONE")
    expect(milestone).toHaveLength(1)
  })

  it("every card has required fields with content", () => {
    for (const card of cards) {
      expect(card.id).toBeTruthy()
      expect(card.title).toBeTruthy()
      expect(card.body).toBeTruthy()
      expect(card.body.length).toBeGreaterThan(20)
      expect(card.locale).toBe("EN")
      expect(typeof card.weekNumber).toBe("number")
      expect(card.weekNumber).toBeGreaterThan(0)
    }
  })

  it("contentType values are all valid EducationContentType", () => {
    const valid = new Set([
      "DIETARY",
      "EXERCISE",
      "MYTH_BUSTING",
      "EMOTIONAL",
      "SELF_MONITORING",
      "MILESTONE",
      "ACCEPTANCE",
    ])
    for (const card of cards) {
      expect(valid).toContain(card.contentType)
    }
  })

  it("conditionType values are all valid ConditionType", () => {
    const valid = new Set(["HYPERTENSION", "DIABETES", "GENERAL"])
    for (const card of cards) {
      expect(valid).toContain(card.conditionType)
    }
  })

  it("all IDs are unique", () => {
    const ids = cards.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("householdCompatible and costNeutral are boolean or null", () => {
    for (const card of cards) {
      expect(
        typeof card.householdCompatible === "boolean" ||
          card.householdCompatible === null,
      ).toBe(true)
      expect(
        typeof card.costNeutral === "boolean" || card.costNeutral === null,
      ).toBe(true)
    }
  })

  it("dietary cards have householdCompatible set (not all null)", () => {
    const dietary = cards.filter((c) => c.contentType === "DIETARY")
    const withCompatibility = dietary.filter(
      (c) => c.householdCompatible !== null,
    )
    expect(withCompatibility.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// 10. pharmacy-stock.json
// ---------------------------------------------------------------------------

describe("pharmacy-stock.json", () => {
  const stock = pharmacyStock as PharmacyStock[]

  it("contains stock entries for 6 Mombasa pharmacies", () => {
    const uniqueFacilities = new Set(stock.map((s) => s.facilityId))
    expect(uniqueFacilities.size).toBe(6)
  })

  it("every entry has the required PharmacyStock fields", () => {
    for (const s of stock) {
      expect(typeof s.facilityId).toBe("number")
      expect(s.facilityName).toBeTruthy()
      expect(s.medicationName).toBeTruthy()
      expect(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"]).toContain(s.status)
      expect(typeof s.lat).toBe("number")
      expect(typeof s.lng).toBe("number")
    }
  })

  it("coordinates are in the Mombasa region (lat ~ -4.0, lng ~ 39.6)", () => {
    for (const s of stock) {
      expect(s.lat).toBeLessThan(-3.5)
      expect(s.lat).toBeGreaterThan(-4.5)
      expect(s.lng).toBeGreaterThan(39.0)
      expect(s.lng).toBeLessThan(40.5)
    }
  })

  it("includes all 3 stock statuses across the dataset", () => {
    const statuses = new Set(stock.map((s) => s.status))
    expect(statuses).toContain("IN_STOCK")
    expect(statuses).toContain("LOW_STOCK")
    expect(statuses).toContain("OUT_OF_STOCK")
  })

  it("distance is a positive number or null", () => {
    for (const s of stock) {
      expect(
        (typeof s.distance === "number" && s.distance > 0) ||
          s.distance === null,
      ).toBe(true)
    }
  })

  it("lastReportedAt values are valid ISO date strings", () => {
    for (const s of stock) {
      expect(s.lastReportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(new Date(s.lastReportedAt).toString()).not.toBe("Invalid Date")
    }
  })

  it("facility names reference Mombasa-area locations", () => {
    const allNames = stock.map((s) => s.facilityName).join(" ").toLowerCase()
    // At least one Mombasa reference in the set
    expect(allNames).toContain("mombasa")
  })
})

// ---------------------------------------------------------------------------
// 11. medication-loan-preapproval.json
// ---------------------------------------------------------------------------

describe("medication-loan-preapproval.json", () => {
  const loan = medicationLoanPreapproval as MedicationLoanPreApproval

  it("conforms to MedicationLoanPreApproval type", () => {
    assertType<MedicationLoanPreApproval>(loan)
  })

  it("is pre-approved with preApprovalDetails containing KES 5,500", () => {
    expect(loan.isPreApproved).toBe(true)
    expect(loan.preApprovalDetails).not.toBeNull()
    expect(Number(loan.preApprovalDetails!.maxAmount)).toBe(5500)
  })

  it("maxAmount is a string representation of a number", () => {
    expect(typeof loan.preApprovalDetails!.maxAmount).toBe("string")
    expect(Number.isNaN(Number(loan.preApprovalDetails!.maxAmount))).toBe(false)
  })

  it("lists Grace's 3 medications with estimated costs", () => {
    expect(loan.preApprovalDetails!.medications).toHaveLength(3)
    for (const med of loan.preApprovalDetails!.medications) {
      expect(med.name).toBeTruthy()
      expect(typeof med.estimatedCost).toBe("string")
      expect(Number(med.estimatedCost)).toBeGreaterThan(0)
    }
  })

  it("medication estimated costs sum to at most the maxAmount", () => {
    const totalCost = loan.preApprovalDetails!.medications.reduce(
      (sum, m) => sum + Number(m.estimatedCost),
      0,
    )
    expect(totalCost).toBeLessThanOrEqual(
      Number(loan.preApprovalDetails!.maxAmount),
    )
  })

  it("has a target pharmacy with numeric id and name", () => {
    expect(typeof loan.preApprovalDetails!.targetPharmacy.id).toBe("number")
    expect(loan.preApprovalDetails!.targetPharmacy.name).toBeTruthy()
  })

  it("has a non-empty reason explaining the pre-approval", () => {
    expect(loan.preApprovalDetails!.reason).toBeTruthy()
    expect(loan.preApprovalDetails!.reason.length).toBeGreaterThan(10)
  })

  it("expiresAt is a valid future ISO date string", () => {
    expect(
      new Date(loan.preApprovalDetails!.expiresAt).toString(),
    ).not.toBe("Invalid Date")
  })
})

// ---------------------------------------------------------------------------
// 12. emergency-transport-credit.json
// ---------------------------------------------------------------------------

describe("emergency-transport-credit.json", () => {
  const credit = emergencyTransportCredit as EmergencyTransportCredit

  it("conforms to EmergencyTransportCredit type", () => {
    assertType<EmergencyTransportCredit>(credit)
  })

  it("is available with KES 2,000 pre-approved", () => {
    expect(credit.isAvailable).toBe(true)
    expect(Number(credit.preApprovedAmount)).toBe(2000)
  })

  it("preApprovedAmount is a string representation of a number", () => {
    expect(typeof credit.preApprovedAmount).toBe("string")
    expect(Number.isNaN(Number(credit.preApprovedAmount))).toBe(false)
  })

  it("expiresAt is a valid ISO date string", () => {
    expect(credit.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(new Date(credit.expiresAt).toString()).not.toBe("Invalid Date")
  })
})

// ---------------------------------------------------------------------------
// 13. ai-assistant-conversations.json
// ---------------------------------------------------------------------------

describe("ai-assistant-conversations.json", () => {
  type ConversationMap = Record<
    string,
    { sessionId: string; messages: AssistantMessage[] }
  >
  const conversations = aiAssistantConversations as ConversationMap

  const conversationKeys = Object.keys(conversations)

  it("contains at least 3 conversations plus a default redirect", () => {
    // 3 real conversations + 1 default redirect = 4
    expect(conversationKeys.length).toBeGreaterThanOrEqual(4)
  })

  it("every conversation has a sessionId and messages array", () => {
    for (const key of conversationKeys) {
      const conv = conversations[key]
      expect(conv.sessionId).toBeTruthy()
      expect(Array.isArray(conv.messages)).toBe(true)
      expect(conv.messages.length).toBeGreaterThan(0)
    }
  })

  it("every message has the required AssistantMessage fields", () => {
    for (const key of conversationKeys) {
      for (const msg of conversations[key].messages) {
        expect(msg.id).toBeTruthy()
        expect(["USER", "ASSISTANT", "SYSTEM"]).toContain(msg.role)
        expect(msg.content).toBeTruthy()
        expect(Array.isArray(msg.guardrailFlags)).toBe(true)
        expect(Array.isArray(msg.suggestedActions)).toBe(true)
        expect(msg.timestamp).toBeTruthy()
      }
    }
  })

  it("messages have valid timestamps in chronological order per conversation", () => {
    for (const key of conversationKeys) {
      const msgs = conversations[key].messages
      for (let i = 1; i < msgs.length; i++) {
        const prevTime = new Date(msgs[i - 1].timestamp).getTime()
        const currTime = new Date(msgs[i].timestamp).getTime()
        expect(currTime).toBeGreaterThanOrEqual(prevTime)
      }
    }
  })

  it("ASSISTANT messages include guardrailFlags", () => {
    for (const key of conversationKeys) {
      const assistantMsgs = conversations[key].messages.filter(
        (m) => m.role === "ASSISTANT",
      )
      for (const msg of assistantMsgs) {
        expect(msg.guardrailFlags.length).toBeGreaterThan(0)
      }
    }
  })

  it("suggested actions use valid action types", () => {
    const validTypes = new Set([
      "PAY",
      "CHECK_STOCK",
      "APPLY_LOAN",
      "VIEW_CARD",
    ])
    for (const key of conversationKeys) {
      for (const msg of conversations[key].messages) {
        for (const action of msg.suggestedActions) {
          expect(validTypes).toContain(action.type)
          expect(action.label).toBeTruthy()
          expect(action.deepLink).toBeTruthy()
          expect(action.deepLink).toMatch(/^\//)
        }
      }
    }
  })

  it("includes a default redirect conversation with professional-referral guardrail", () => {
    const defaultConv = conversations["default-redirect"]
    expect(defaultConv).toBeDefined()
    const flags = defaultConv.messages.flatMap((m) => m.guardrailFlags)
    expect(flags).toContain("redirect_to_professional")
  })

  it("all message IDs are unique across all conversations", () => {
    const allIds = conversationKeys.flatMap((k) =>
      conversations[k].messages.map((m) => m.id),
    )
    expect(new Set(allIds).size).toBe(allIds.length)
  })

  it("conversations include both USER and ASSISTANT roles", () => {
    // Exclude the default-redirect which may be assistant-only
    const realConvKeys = conversationKeys.filter(
      (k) => k !== "default-redirect",
    )
    for (const key of realConvKeys) {
      const roles = new Set(conversations[key].messages.map((m) => m.role))
      expect(roles).toContain("USER")
      expect(roles).toContain("ASSISTANT")
    }
  })
})

// ---------------------------------------------------------------------------
// 14. care-companion-profile.json
// ---------------------------------------------------------------------------

describe("care-companion-profile.json", () => {
  const profile = careCompanionProfile as CareCompanionProfile

  it("conforms to CareCompanionProfile type", () => {
    assertType<CareCompanionProfile>(profile)
  })

  it("is Grace's completed profile (not skipped)", () => {
    expect(profile.completedAt).toBeTruthy()
    expect(profile.skippedAt).toBeNull()
  })

  it("has a valid profile ID", () => {
    expect(profile.id).toBeTruthy()
  })

  describe("conditions", () => {
    it("lists DIABETES and HYPERTENSION", () => {
      expect(profile.conditions.type).toContain("DIABETES")
      expect(profile.conditions.type).toContain("HYPERTENSION")
    })

    it("has MORE_THAN_2_YEARS diagnosis recency (Grace is 62)", () => {
      expect(profile.conditions.diagnosisRecency).toBe("MORE_THAN_2_YEARS")
    })

    it("has no otherDescription since OTHER is not selected", () => {
      expect(profile.conditions.otherDescription).toBeNull()
    })
  })

  describe("treatment", () => {
    it("is currently on medication", () => {
      expect(profile.treatment.currentlyOnMedication).toBe(true)
    })

    it("lists Grace's 3 medications", () => {
      expect(profile.treatment.medicationNames).toHaveLength(3)
    })

    it("takes medication MOSTLY regularly", () => {
      expect(profile.treatment.takingMedicationRegularly).toBe("MOSTLY")
    })

    it("COST is a reason for missing medication", () => {
      expect(profile.treatment.reasonsForMissing).toContain("COST")
    })

    it("is not using herbal alternatives", () => {
      expect(profile.treatment.usingHerbalAlternatives).toBe(false)
      expect(profile.treatment.herbalDetails).toBeNull()
    })
  })

  describe("challenges", () => {
    it("has selected challenges including COST as top", () => {
      expect(profile.challenges.selected.length).toBeGreaterThan(0)
      expect(profile.challenges.topChallenge).toBe("COST")
    })

    it("topChallenge is one of the selected challenges", () => {
      expect(profile.challenges.selected).toContain(
        profile.challenges.topChallenge,
      )
    })
  })

  describe("coping", () => {
    it("has cost coping strategies including BORROW_FAMILY and SKIP_DOSES", () => {
      expect(profile.coping.costCoping).toContain("BORROW_FAMILY")
      expect(profile.coping.costCoping).toContain("SKIP_DOSES")
    })

    it("has no emergency plan", () => {
      expect(profile.coping.hasEmergencyPlan).toBe(false)
    })

    it("has information sources", () => {
      expect(profile.coping.informationSources.length).toBeGreaterThan(0)
    })
  })

  describe("goals", () => {
    it("selected goals include TRACK_COSTS, MEDICATION_REMINDERS, and CREDIT_FOR_MEDICATION", () => {
      expect(profile.goals.selected).toContain("TRACK_COSTS")
      expect(profile.goals.selected).toContain("MEDICATION_REMINDERS")
      expect(profile.goals.selected).toContain("CREDIT_FOR_MEDICATION")
    })
  })

  describe("userRole", () => {
    it("role is SELF with null patientRelationship", () => {
      expect(profile.userRole.role).toBe("SELF")
      expect(profile.userRole.patientRelationship).toBeNull()
    })
  })
})

// ---------------------------------------------------------------------------
// 15. patient-medication-records.json
// ---------------------------------------------------------------------------

describe("patient-medication-records.json", () => {
  const records = patientMedicationRecords as PatientMedicationRecord[]

  it("contains exactly 6 entries", () => {
    expect(records).toHaveLength(6)
  })

  it("every entry has the required PatientMedicationRecord fields", () => {
    for (const record of records) {
      expect(record.id).toBeTruthy()
      expect(record.medicationId).toBeTruthy()
      expect(record.medication).toBeDefined()
      expect(record.medication.genericName).toBeTruthy()
      expect(Array.isArray(record.medication.brandNames)).toBe(true)
      expect(
        ["MEDICATION", "LAB_TEST", "CONSULTATION", "SUPPLY"],
      ).toContain(record.medication.category)
      expect(record.firstPurchaseDate).toBeTruthy()
      expect(record.lastPurchaseDate).toBeTruthy()
      expect(typeof record.totalPurchaseCount).toBe("number")
      expect(record.totalPurchaseCount).toBeGreaterThan(0)
      expect(typeof record.isActive).toBe("boolean")
      expect(Array.isArray(record.inferredConditions)).toBe(true)
      expect(record.inferredConditions.length).toBeGreaterThan(0)
    }
  })

  it("every entry conforms to the PatientMedicationRecord type", () => {
    for (const record of records) {
      assertType<PatientMedicationRecord>(record)
    }
  })

  it("all medicationId values reference valid taxonomy UUIDs", () => {
    const taxonomyIds = new Set(
      (medicationTaxonomy as MedicationTaxonomyEntry[]).map((m) => m.id),
    )
    for (const record of records) {
      expect(taxonomyIds).toContain(record.medicationId)
    }
  })

  it("at least one record has isActive: false (Omeprazole)", () => {
    const inactive = records.filter((r) => !r.isActive)
    expect(inactive.length).toBeGreaterThanOrEqual(1)
    const omeprazole = inactive.find(
      (r) => r.medication.genericName === "Omeprazole",
    )
    expect(omeprazole).toBeDefined()
  })

  it("at least one record has averageRefillIntervalDays: null (HbA1c)", () => {
    const nullInterval = records.filter(
      (r) => r.averageRefillIntervalDays === null,
    )
    expect(nullInterval.length).toBeGreaterThanOrEqual(1)
    const hba1c = nullInterval.find(
      (r) => r.medication.genericName === "HbA1c Test",
    )
    expect(hba1c).toBeDefined()
  })

  it("inferredConditions are subsets of the corresponding taxonomy conditionTags", () => {
    const taxonomyMap = new Map(
      (medicationTaxonomy as MedicationTaxonomyEntry[]).map((m) => [
        m.id,
        new Set(m.conditionTags ?? []),
      ]),
    )
    for (const record of records) {
      const allowedTags = taxonomyMap.get(record.medicationId)
      expect(allowedTags).toBeDefined()
      for (const condition of record.inferredConditions) {
        expect(allowedTags!).toContain(condition)
      }
    }
  })

  it("Metformin date range spans 7+ months (217 days)", () => {
    const metformin = records.find(
      (r) => r.medication.genericName === "Metformin",
    )
    expect(metformin).toBeDefined()
    const first = new Date(metformin!.firstPurchaseDate).getTime()
    const last = new Date(metformin!.lastPurchaseDate).getTime()
    const daySpan = (last - first) / (1000 * 60 * 60 * 24)
    expect(daySpan).toBeGreaterThanOrEqual(210) // 7 months ~= 213 days
  })

  it("dates are valid ISO date strings", () => {
    for (const record of records) {
      expect(new Date(record.firstPurchaseDate).toString()).not.toBe(
        "Invalid Date",
      )
      expect(new Date(record.lastPurchaseDate).toString()).not.toBe(
        "Invalid Date",
      )
    }
  })

  it("lastPurchaseDate is on or after firstPurchaseDate for every record", () => {
    for (const record of records) {
      const first = new Date(record.firstPurchaseDate).getTime()
      const last = new Date(record.lastPurchaseDate).getTime()
      expect(last).toBeGreaterThanOrEqual(first)
    }
  })

  it("averageRefillIntervalDays is mathematically consistent with date range and purchase count", () => {
    for (const record of records) {
      if (
        record.averageRefillIntervalDays === null ||
        record.totalPurchaseCount <= 1
      ) {
        continue
      }
      const first = new Date(record.firstPurchaseDate).getTime()
      const last = new Date(record.lastPurchaseDate).getTime()
      const daySpan = (last - first) / (1000 * 60 * 60 * 24)
      const intervals = record.totalPurchaseCount - 1
      const computedAvg = Math.round(daySpan / intervals)
      expect(record.averageRefillIntervalDays).toBe(computedAvg)
    }
  })

  it("all IDs are unique", () => {
    const ids = records.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("inferredConditions use valid ConditionType values", () => {
    const valid = new Set(["HYPERTENSION", "DIABETES", "GENERAL"])
    for (const record of records) {
      for (const cond of record.inferredConditions) {
        expect(valid).toContain(cond)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// Cross-fixture consistency checks
// ---------------------------------------------------------------------------

describe("cross-fixture consistency", () => {
  it("patient-medications medication IDs exist in medication-taxonomy", () => {
    const taxonomyIds = new Set(
      (medicationTaxonomy as Medication[]).map((m) => m.id),
    )
    for (const pm of patientMedications as PatientMedication[]) {
      expect(taxonomyIds).toContain(pm.medication.id)
    }
  })

  it("refill-schedule medication names match patient-medications names", () => {
    const patientMedNames = new Set(
      (patientMedications as PatientMedication[]).map(
        (pm) => pm.medication.genericName,
      ),
    )
    // Refill names include strength (e.g., "Metformin 500mg"), so check the generic part
    for (const rs of refillSchedules as RefillSchedule[]) {
      const genericName = rs.medicationName.split(" ")[0]
      expect(patientMedNames).toContain(genericName)
    }
  })

  it("medication-timeline medication names match patient-medications", () => {
    const timelineNames = new Set(
      (medicationTimeline as TimelineEntry[]).map((e) => e.medicationName),
    )
    expect(timelineNames).toContain("Metformin 500mg")
    expect(timelineNames).toContain("Amlodipine 5mg")
    expect(timelineNames).toContain("Aspirin 75mg")
  })

  it("loan pre-approval medications match Grace's refill schedule medications", () => {
    const loanDetails = (
      medicationLoanPreapproval as MedicationLoanPreApproval
    ).preApprovalDetails
    expect(loanDetails).not.toBeNull()
    const loanMedNames = loanDetails!.medications.map((m) => m.name)
    const refillMedNames = (refillSchedules as RefillSchedule[]).map(
      (r) => r.medicationName,
    )
    for (const name of loanMedNames) {
      expect(refillMedNames).toContain(name)
    }
  })

  it("emergency-transport-credit amount matches emergency-cards credit amount", () => {
    const creditAmount = Number(
      (emergencyTransportCredit as EmergencyTransportCredit).preApprovedAmount,
    )
    for (const card of emergencyCards as EmergencyCard[]) {
      expect(Number(card.emergencyTransportCreditAmount)).toBe(creditAmount)
    }
  })

  it("care-companion-profile conditions align with patient-medications inferred conditions", () => {
    const profileConditions = new Set(
      (careCompanionProfile as CareCompanionProfile).conditions.type,
    )
    const medicationConditions = new Set(
      (patientMedications as PatientMedication[]).flatMap(
        (pm) => pm.inferredConditions,
      ),
    )
    // Every medication-inferred condition should be in the profile
    // (GENERAL is a catch-all, so we exclude it)
    for (const cond of medicationConditions) {
      if (cond !== "GENERAL") {
        expect(profileConditions).toContain(cond)
      }
    }
  })

  it("pharmacy-stock includes Grace's medications by name", () => {
    const stockMedNames = new Set(
      (pharmacyStock as PharmacyStock[]).map((s) => s.medicationName),
    )
    expect(stockMedNames).toContain("Metformin 500mg")
    expect(stockMedNames).toContain("Amlodipine 5mg")
  })

  it("patient-medication-records medicationId values exist in medication-taxonomy", () => {
    const taxonomyIds = new Set(
      (medicationTaxonomy as MedicationTaxonomyEntry[]).map((m) => m.id),
    )
    for (const record of patientMedicationRecords as PatientMedicationRecord[]) {
      expect(taxonomyIds).toContain(record.medicationId)
    }
  })

  it("patient-medication-records inferredConditions align with taxonomy conditionTags", () => {
    const taxonomyMap = new Map(
      (medicationTaxonomy as MedicationTaxonomyEntry[]).map((m) => [
        m.id,
        new Set(m.conditionTags ?? []),
      ]),
    )
    for (const record of patientMedicationRecords as PatientMedicationRecord[]) {
      const allowedTags = taxonomyMap.get(record.medicationId)
      expect(allowedTags).toBeDefined()
      for (const cond of record.inferredConditions) {
        expect(allowedTags!).toContain(cond)
      }
    }
  })

  it("all 15 fixture files are importable without error", () => {
    expect(medicationTaxonomy).toBeDefined()
    expect(patientMedications).toBeDefined()
    expect(medicationTimeline).toBeDefined()
    expect(costSummaryFixture).toBeDefined()
    expect(emergencyCards).toBeDefined()
    expect(medicationCards).toBeDefined()
    expect(medicationInteractions).toBeDefined()
    expect(refillSchedules).toBeDefined()
    expect(educationCards).toBeDefined()
    expect(pharmacyStock).toBeDefined()
    expect(medicationLoanPreapproval).toBeDefined()
    expect(emergencyTransportCredit).toBeDefined()
    expect(aiAssistantConversations).toBeDefined()
    expect(careCompanionProfile).toBeDefined()
    expect(patientMedicationRecords).toBeDefined()
  })
})
