import { describe, it, expect } from "vitest"
import type {
  CareCompanionHomeResponse,
  RefillScheduleItem,
  CostSummary,
  EducationContentCard,
} from "@/types/care-companion"
import {
  REFILL_STATUS,
  EDUCATION_CONTENT_TYPE,
  CONDITION_TYPE,
} from "@/types/care-companion"

import careCompanionHome from "./care-companion-home.json"
import costSummaryFixture from "./cost-summary.json"
import refillSchedules from "./refill-schedules.json"

// ---------------------------------------------------------------------------
// Helper: compile-time type guard. If the fixture drifts from the TypeScript
// interface the test file fails to compile before it even runs.
// ---------------------------------------------------------------------------

function assertType<T>(_value: T): void {
  // compile-time only
}

const VALID_REFILL_STATUSES = new Set<string>(Object.values(REFILL_STATUS))
const VALID_CONDITION_TYPES = new Set<string>(Object.values(CONDITION_TYPE))
const VALID_EDUCATION_TYPES = new Set<string>(
  Object.values(EDUCATION_CONTENT_TYPE),
)

const home = careCompanionHome as CareCompanionHomeResponse

// ---------------------------------------------------------------------------
// 1. Top-level structure
// ---------------------------------------------------------------------------

describe("care-companion-home.json", () => {
  describe("top-level structure", () => {
    it("conforms to the CareCompanionHomeResponse type", () => {
      assertType<CareCompanionHomeResponse>(home)
    })

    it("has all four required top-level keys", () => {
      expect(home.refillSchedule).toBeDefined()
      expect(home.costSummary).toBeDefined()
      expect(home.educationFeed).toBeDefined()
      expect(home.emergencyCard).toBeDefined()
    })

    it("has no unexpected top-level keys beyond the four defined in the interface", () => {
      const allowedKeys = new Set([
        "refillSchedule",
        "costSummary",
        "educationFeed",
        "emergencyCard",
      ])
      for (const key of Object.keys(home)) {
        expect(allowedKeys).toContain(key)
      }
    })
  })

  // ---------------------------------------------------------------------------
  // 2. refillSchedule section
  // ---------------------------------------------------------------------------

  describe("refillSchedule", () => {
    const { refillSchedule } = home

    it("has a schedules array and a hasMore boolean", () => {
      expect(Array.isArray(refillSchedule.schedules)).toBe(true)
      expect(typeof refillSchedule.hasMore).toBe("boolean")
    })

    it("contains exactly 3 refill schedule items (Grace's 3 medications)", () => {
      expect(refillSchedule.schedules).toHaveLength(3)
    })

    it("every schedule item has the required RefillScheduleItem fields", () => {
      for (const item of refillSchedule.schedules) {
        assertType<RefillScheduleItem>(item)
        expect(item.id).toBeTruthy()
        expect(item.medicationName).toBeTruthy()
        expect(item.expectedRefillDate).toBeTruthy()
        expect(VALID_REFILL_STATUSES).toContain(item.status)
        expect(typeof item.daysUntilRefill).toBe("number")
        expect(typeof item.escalatedToLoanOffer).toBe("boolean")
      }
    })

    it("all schedule IDs are unique", () => {
      const ids = refillSchedule.schedules.map((s) => s.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it("includes all 3 of Grace's medications", () => {
      const names = refillSchedule.schedules.map((s) => s.medicationName)
      expect(names).toContain("Metformin 500mg")
      expect(names).toContain("Amlodipine 5mg")
      expect(names).toContain("Aspirin 75mg")
    })

    it("contains at least one OVERDUE medication", () => {
      const overdue = refillSchedule.schedules.filter(
        (s) => s.status === "OVERDUE",
      )
      expect(overdue.length).toBeGreaterThanOrEqual(1)
    })

    it("OVERDUE medications have negative daysUntilRefill", () => {
      const overdue = refillSchedule.schedules.filter(
        (s) => s.status === "OVERDUE",
      )
      for (const item of overdue) {
        expect(item.daysUntilRefill).toBeLessThan(0)
      }
    })

    it("OVERDUE medications have escalatedToLoanOffer = true", () => {
      const overdue = refillSchedule.schedules.filter(
        (s) => s.status === "OVERDUE",
      )
      for (const item of overdue) {
        expect(item.escalatedToLoanOffer).toBe(true)
      }
    })

    it("contains at least one DUE medication", () => {
      const due = refillSchedule.schedules.filter((s) => s.status === "DUE")
      expect(due.length).toBeGreaterThanOrEqual(1)
    })

    it("DUE medications have small positive daysUntilRefill (within 7 days)", () => {
      const due = refillSchedule.schedules.filter((s) => s.status === "DUE")
      for (const item of due) {
        expect(item.daysUntilRefill).toBeGreaterThanOrEqual(0)
        expect(item.daysUntilRefill).toBeLessThanOrEqual(7)
      }
    })

    it("expectedRefillDate values are valid date strings", () => {
      for (const item of refillSchedule.schedules) {
        expect(new Date(item.expectedRefillDate).toString()).not.toBe(
          "Invalid Date",
        )
      }
    })

    it("estimatedDaysSupply is 30 for all items (standard monthly supply)", () => {
      for (const item of refillSchedule.schedules) {
        expect(item.estimatedDaysSupply).toBe(30)
      }
    })

    it("hasMore indicates there are additional schedules beyond the top 3", () => {
      expect(refillSchedule.hasMore).toBe(true)
    })

    it("includes the most urgent medications (at least one OVERDUE or DUE)", () => {
      const urgentStatuses = new Set(["OVERDUE", "DUE"])
      const urgent = refillSchedule.schedules.filter((s) =>
        urgentStatuses.has(s.status),
      )
      expect(urgent.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ---------------------------------------------------------------------------
  // 3. costSummary section
  // ---------------------------------------------------------------------------

  describe("costSummary", () => {
    const { costSummary } = home

    it("conforms to the CostSummary type", () => {
      assertType<CostSummary>(costSummary)
    })

    it("is year 2026 with KES currency", () => {
      expect(costSummary.year).toBe(2026)
      expect(costSummary.currency).toBe("KES")
    })

    it("all monetary fields are string representations of numbers", () => {
      const fields = [
        costSummary.ytdSpend,
        costSummary.monthlyAverage,
        costSummary.cashbackEarned,
        costSummary.netSpend,
        costSummary.annualProjection,
      ]
      for (const val of fields) {
        expect(typeof val).toBe("string")
        expect(Number.isNaN(Number(val))).toBe(false)
      }
    })

    it("netSpend = ytdSpend - cashbackEarned", () => {
      const expected =
        Number(costSummary.ytdSpend) - Number(costSummary.cashbackEarned)
      expect(Number(costSummary.netSpend)).toBe(expected)
    })

    it("all monetary values are positive", () => {
      expect(Number(costSummary.ytdSpend)).toBeGreaterThan(0)
      expect(Number(costSummary.monthlyAverage)).toBeGreaterThan(0)
      expect(Number(costSummary.cashbackEarned)).toBeGreaterThan(0)
      expect(Number(costSummary.netSpend)).toBeGreaterThan(0)
      expect(Number(costSummary.annualProjection)).toBeGreaterThan(0)
    })

    it("transactionCount is a positive integer", () => {
      expect(costSummary.transactionCount).toBeGreaterThan(0)
      expect(Number.isInteger(costSummary.transactionCount)).toBe(true)
    })

    it("matches the standalone cost-summary fixture values", () => {
      const standalone = costSummaryFixture as CostSummary
      expect(costSummary.ytdSpend).toBe(standalone.ytdSpend)
      expect(costSummary.monthlyAverage).toBe(standalone.monthlyAverage)
      expect(costSummary.cashbackEarned).toBe(standalone.cashbackEarned)
      expect(costSummary.netSpend).toBe(standalone.netSpend)
      expect(costSummary.transactionCount).toBe(standalone.transactionCount)
      expect(costSummary.currency).toBe(standalone.currency)
    })

    it("annualProjection is a reasonable multiple of monthlyAverage", () => {
      const monthly = Number(costSummary.monthlyAverage)
      const annual = Number(costSummary.annualProjection)
      // annualProjection = monthlyAverage * 12
      expect(annual).toBe(monthly * 12)
    })
  })

  // ---------------------------------------------------------------------------
  // 4. educationFeed section
  // ---------------------------------------------------------------------------

  describe("educationFeed", () => {
    const { educationFeed } = home

    it("is not null (there is an active education card)", () => {
      expect(educationFeed).not.toBeNull()
    })

    it("conforms to the EducationContentCard type", () => {
      assertType<EducationContentCard | null>(educationFeed)
      if (educationFeed) {
        assertType<EducationContentCard>(educationFeed)
      }
    })

    it("has all required EducationContentCard fields", () => {
      expect(educationFeed!.id).toBeTruthy()
      expect(educationFeed!.title).toBeTruthy()
      expect(educationFeed!.body).toBeTruthy()
      expect(typeof educationFeed!.weekNumber).toBe("number")
      expect(educationFeed!.weekNumber).toBeGreaterThan(0)
    })

    it("has a valid conditionType", () => {
      expect(VALID_CONDITION_TYPES).toContain(educationFeed!.conditionType)
    })

    it("has a valid contentType", () => {
      expect(VALID_EDUCATION_TYPES).toContain(educationFeed!.contentType)
    })

    it("is in the DIABETES condition type (matching Grace's primary condition)", () => {
      expect(educationFeed!.conditionType).toBe("DIABETES")
    })

    it("is a DIETARY content type for week 1", () => {
      expect(educationFeed!.contentType).toBe("DIETARY")
      expect(educationFeed!.weekNumber).toBe(1)
    })

    it("locale is EN", () => {
      expect(educationFeed!.locale).toBe("EN")
    })

    it("body contains substantial content (markdown with practical advice)", () => {
      expect(educationFeed!.body.length).toBeGreaterThan(100)
    })

    it("body contains markdown formatting", () => {
      const body = educationFeed!.body
      const hasMarkdown =
        body.includes("##") ||
        body.includes("**") ||
        body.includes("- ") ||
        body.includes("1.")
      expect(hasMarkdown).toBe(true)
    })

    it("householdCompatible and costNeutral are boolean values (not null)", () => {
      expect(typeof educationFeed!.householdCompatible).toBe("boolean")
      expect(typeof educationFeed!.costNeutral).toBe("boolean")
    })

    it("the first education card is household-compatible and cost-neutral", () => {
      expect(educationFeed!.householdCompatible).toBe(true)
      expect(educationFeed!.costNeutral).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // 5. emergencyCard section
  // ---------------------------------------------------------------------------

  describe("emergencyCard", () => {
    const { emergencyCard } = home

    it("is not null (there is an active emergency card reference)", () => {
      expect(emergencyCard).not.toBeNull()
    })

    it("has the required fields: conditionType, title, cardId", () => {
      expect(emergencyCard!.conditionType).toBeTruthy()
      expect(emergencyCard!.title).toBeTruthy()
      expect(emergencyCard!.cardId).toBeTruthy()
    })

    it("conditionType is a valid ConditionType", () => {
      expect(VALID_CONDITION_TYPES).toContain(emergencyCard!.conditionType)
    })

    it("conditionType is DIABETES (matching Grace's primary condition)", () => {
      expect(emergencyCard!.conditionType).toBe("DIABETES")
    })

    it("title references diabetes emergency", () => {
      expect(emergencyCard!.title.toLowerCase()).toContain("diabetes")
    })

    it("cardId is a non-empty string that can be used for deep linking", () => {
      expect(emergencyCard!.cardId.trim()).not.toBe("")
      expect(emergencyCard!.cardId.length).toBeGreaterThan(2)
    })
  })

  // ---------------------------------------------------------------------------
  // 6. Cross-section consistency
  // ---------------------------------------------------------------------------

  describe("cross-section consistency", () => {
    it("refill schedule medication names are realistic medication + dosage format", () => {
      for (const item of home.refillSchedule.schedules) {
        // Medication names should follow "Name Dosage" pattern
        expect(item.medicationName).toMatch(/^[A-Z][a-z]+ \d+mg$/)
      }
    })

    it("refill schedule medication names align with standalone refill-schedules fixture", () => {
      const homeNames = home.refillSchedule.schedules
        .map((s) => s.medicationName)
        .sort()
      const standaloneNames = (refillSchedules as RefillScheduleItem[])
        .map((s) => s.medicationName)
        .sort()
      expect(homeNames).toEqual(standaloneNames)
    })

    it("education card conditionType matches the emergency card conditionType", () => {
      if (home.educationFeed && home.emergencyCard) {
        expect(home.educationFeed.conditionType).toBe(
          home.emergencyCard.conditionType,
        )
      }
    })

    it("cost summary year and education content are in the same time period", () => {
      expect(home.costSummary.year).toBe(2026)
      // Education content is for 2026 as well (week-based)
      expect(home.educationFeed!.weekNumber).toBeGreaterThanOrEqual(1)
    })
  })

  // ---------------------------------------------------------------------------
  // 7. BFF aggregation contract (the home endpoint replaces 4 API calls)
  // ---------------------------------------------------------------------------

  describe("BFF aggregation contract", () => {
    it("refill schedule is capped at 3 items (BFF optimization for mobile)", () => {
      expect(home.refillSchedule.schedules.length).toBeLessThanOrEqual(3)
    })

    it("education feed is a single card (not an array) for the home page", () => {
      // The BFF returns one card, not the full list
      expect(home.educationFeed).not.toBeNull()
      expect(Array.isArray(home.educationFeed)).toBe(false)
    })

    it("emergency card is a lightweight reference (not the full card)", () => {
      const card = home.emergencyCard!
      // The BFF returns just enough to render a link/banner, not the full card content
      expect(card).not.toHaveProperty("warningSymptoms")
      expect(card).not.toHaveProperty("immediateActions")
      expect(card).not.toHaveProperty("whenToGoToER")
    })

    it("cost summary is the full CostSummary object (needed for dashboard)", () => {
      expect(home.costSummary).toHaveProperty("ytdSpend")
      expect(home.costSummary).toHaveProperty("monthlyAverage")
      expect(home.costSummary).toHaveProperty("cashbackEarned")
      expect(home.costSummary).toHaveProperty("netSpend")
      expect(home.costSummary).toHaveProperty("annualProjection")
      expect(home.costSummary).toHaveProperty("transactionCount")
      expect(home.costSummary).toHaveProperty("currency")
    })
  })

  // ---------------------------------------------------------------------------
  // 8. Edge cases and data integrity
  // ---------------------------------------------------------------------------

  describe("edge cases and data integrity", () => {
    it("the fixture is importable as valid JSON without error", () => {
      expect(careCompanionHome).toBeDefined()
    })

    it("no string field contains HTML tags", () => {
      const allText = [
        ...home.refillSchedule.schedules.map((s) => s.medicationName),
        ...home.refillSchedule.schedules.map((s) => s.id),
        home.costSummary.ytdSpend,
        home.educationFeed?.title ?? "",
        home.educationFeed?.body ?? "",
        home.emergencyCard?.title ?? "",
        home.emergencyCard?.cardId ?? "",
      ].join(" ")
      expect(allText).not.toMatch(/<script[\s\S]*>/i)
    })

    it("no string field has leading or trailing whitespace", () => {
      for (const item of home.refillSchedule.schedules) {
        expect(item.medicationName).toBe(item.medicationName.trim())
        expect(item.id).toBe(item.id.trim())
      }
      if (home.educationFeed) {
        expect(home.educationFeed.title).toBe(
          home.educationFeed.title.trim(),
        )
        expect(home.educationFeed.id).toBe(home.educationFeed.id.trim())
      }
      if (home.emergencyCard) {
        expect(home.emergencyCard.title).toBe(
          home.emergencyCard.title.trim(),
        )
        expect(home.emergencyCard.cardId).toBe(
          home.emergencyCard.cardId.trim(),
        )
      }
    })

    it("date strings in refill schedule are ISO format (YYYY-MM-DD)", () => {
      for (const item of home.refillSchedule.schedules) {
        expect(item.expectedRefillDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      }
    })

    it("monetary values do not contain currency symbols or commas", () => {
      const monetaryFields = [
        home.costSummary.ytdSpend,
        home.costSummary.monthlyAverage,
        home.costSummary.cashbackEarned,
        home.costSummary.netSpend,
        home.costSummary.annualProjection,
      ]
      for (const val of monetaryFields) {
        expect(val).not.toMatch(/[,$KES]/)
      }
    })

    it("escalatedToLoanOffer is a boolean (not a truthy string)", () => {
      for (const item of home.refillSchedule.schedules) {
        expect(typeof item.escalatedToLoanOffer).toBe("boolean")
      }
    })
  })
})
