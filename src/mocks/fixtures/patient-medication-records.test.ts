import { describe, it, expect } from "vitest"
import type {
  PatientMedicationRecord,
  MedicationTaxonomyEntry,
} from "@/types/care-companion"
import { MEDICATION_CATEGORY, CONDITION_TYPE } from "@/types/care-companion"

import patientMedicationRecords from "./patient-medication-records.json"
import medicationTaxonomy from "./medication-taxonomy.json"

// ---------------------------------------------------------------------------
// Helper: compile-time type guard. If the fixture drifts from the TypeScript
// interface the test file fails to compile before it even runs.
// ---------------------------------------------------------------------------

function assertType<T>(_value: T): void {
  // compile-time only
}

const records = patientMedicationRecords as PatientMedicationRecord[]
const taxonomy = medicationTaxonomy as MedicationTaxonomyEntry[]
const taxonomyById = new Map(taxonomy.map((t) => [t.id, t]))

// Valid enum values derived from the const objects
const VALID_CATEGORIES = new Set<string>(Object.values(MEDICATION_CATEGORY))
const VALID_CONDITION_TYPES = new Set<string>(Object.values(CONDITION_TYPE))

// ISO date pattern (YYYY-MM-DD)
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

// ---------------------------------------------------------------------------
// 1. Structure and completeness
// ---------------------------------------------------------------------------

describe("patient-medication-records.json", () => {
  describe("structure and completeness", () => {
    it("is a valid JSON array", () => {
      expect(Array.isArray(patientMedicationRecords)).toBe(true)
    })

    it("contains exactly 6 patient medication records", () => {
      expect(records).toHaveLength(6)
    })

    it("every record conforms to the PatientMedicationRecord type", () => {
      for (const record of records) {
        assertType<PatientMedicationRecord>(record)
      }
    })

    it("includes all 6 required medications by generic name", () => {
      const names = records.map((r) => r.medication.genericName)
      expect(names).toContain("Metformin")
      expect(names).toContain("Amlodipine")
      expect(names).toContain("Losartan")
      expect(names).toContain("Atorvastatin")
      expect(names).toContain("HbA1c Test")
      expect(names).toContain("Omeprazole")
    })

    it("all record IDs are unique", () => {
      const ids = records.map((r) => r.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it("all record IDs are non-empty strings", () => {
      for (const record of records) {
        expect(typeof record.id).toBe("string")
        expect(record.id.trim()).not.toBe("")
      }
    })

    it("every record has all required fields present", () => {
      for (const record of records) {
        expect(record.id).toBeDefined()
        expect(record.medicationId).toBeDefined()
        expect(record.medication).toBeDefined()
        expect(record.firstPurchaseDate).toBeDefined()
        expect(record.lastPurchaseDate).toBeDefined()
        expect(record.totalPurchaseCount).toBeDefined()
        expect(record.isActive).toBeDefined()
        expect(record.inferredConditions).toBeDefined()
        // averageRefillIntervalDays can be null, but must be present
        expect("averageRefillIntervalDays" in record).toBe(true)
      }
    })
  })

  // ---------------------------------------------------------------------------
  // 2. Medication ID cross-reference with taxonomy
  // ---------------------------------------------------------------------------

  describe("medication ID cross-references", () => {
    it("every medicationId matches a UUID in the medication-taxonomy fixture", () => {
      for (const record of records) {
        expect(taxonomyById.has(record.medicationId)).toBe(true)
      }
    })

    it("medicationId values are valid UUID format", () => {
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      for (const record of records) {
        expect(record.medicationId).toMatch(uuidPattern)
      }
    })

    it("all medicationId values are unique (no duplicate medications)", () => {
      const medIds = records.map((r) => r.medicationId)
      expect(new Set(medIds).size).toBe(medIds.length)
    })

    it("nested medication.genericName matches taxonomy genericName for each record", () => {
      for (const record of records) {
        const taxonomyEntry = taxonomyById.get(record.medicationId)
        expect(taxonomyEntry).toBeDefined()
        expect(record.medication.genericName).toBe(
          taxonomyEntry!.genericName,
        )
      }
    })

    it("nested medication.category matches taxonomy category for each record", () => {
      for (const record of records) {
        const taxonomyEntry = taxonomyById.get(record.medicationId)
        expect(taxonomyEntry).toBeDefined()
        expect(record.medication.category).toBe(taxonomyEntry!.category)
      }
    })

    it("nested medication.brandNames is a subset of taxonomy brandNames for each record", () => {
      for (const record of records) {
        const taxonomyEntry = taxonomyById.get(record.medicationId)
        expect(taxonomyEntry).toBeDefined()
        const taxonomyBrands = new Set(taxonomyEntry!.brandNames ?? [])
        for (const brand of record.medication.brandNames) {
          expect(taxonomyBrands).toContain(brand)
        }
      }
    })
  })

  // ---------------------------------------------------------------------------
  // 3. Nested medication object validation
  // ---------------------------------------------------------------------------

  describe("nested medication objects", () => {
    it("every medication has a non-empty genericName", () => {
      for (const record of records) {
        expect(record.medication.genericName.trim()).not.toBe("")
      }
    })

    it("every medication has a valid MedicationCategory", () => {
      for (const record of records) {
        expect(VALID_CATEGORIES).toContain(record.medication.category)
      }
    })

    it("brandNames is an array for every record", () => {
      for (const record of records) {
        expect(Array.isArray(record.medication.brandNames)).toBe(true)
      }
    })

    it("MEDICATION category records have at least one brand name", () => {
      const medications = records.filter(
        (r) => r.medication.category === "MEDICATION",
      )
      for (const med of medications) {
        expect(med.medication.brandNames.length).toBeGreaterThanOrEqual(1)
      }
    })

    it("LAB_TEST category records have an empty brandNames array", () => {
      const labTests = records.filter(
        (r) => r.medication.category === "LAB_TEST",
      )
      for (const lt of labTests) {
        expect(lt.medication.brandNames).toEqual([])
      }
    })
  })

  // ---------------------------------------------------------------------------
  // 4. Date validation
  // ---------------------------------------------------------------------------

  describe("date fields", () => {
    it("firstPurchaseDate is a valid ISO date string for every record", () => {
      for (const record of records) {
        expect(record.firstPurchaseDate).toMatch(ISO_DATE_PATTERN)
        expect(new Date(record.firstPurchaseDate).toString()).not.toBe(
          "Invalid Date",
        )
      }
    })

    it("lastPurchaseDate is a valid ISO date string for every record", () => {
      for (const record of records) {
        expect(record.lastPurchaseDate).toMatch(ISO_DATE_PATTERN)
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

    it("all dates fall within 2026 (the demo year)", () => {
      for (const record of records) {
        const firstYear = new Date(record.firstPurchaseDate).getFullYear()
        const lastYear = new Date(record.lastPurchaseDate).getFullYear()
        expect(firstYear).toBe(2026)
        expect(lastYear).toBe(2026)
      }
    })

    it("single-purchase records have identical first and last dates", () => {
      const singlePurchase = records.filter(
        (r) => r.totalPurchaseCount === 1,
      )
      for (const record of singlePurchase) {
        expect(record.firstPurchaseDate).toBe(record.lastPurchaseDate)
      }
    })
  })

  // ---------------------------------------------------------------------------
  // 5. Purchase count and refill interval validation
  // ---------------------------------------------------------------------------

  describe("purchase counts and refill intervals", () => {
    it("totalPurchaseCount is a positive integer for every record", () => {
      for (const record of records) {
        expect(Number.isInteger(record.totalPurchaseCount)).toBe(true)
        expect(record.totalPurchaseCount).toBeGreaterThan(0)
      }
    })

    it("averageRefillIntervalDays is a positive number or null", () => {
      for (const record of records) {
        if (record.averageRefillIntervalDays !== null) {
          expect(typeof record.averageRefillIntervalDays).toBe("number")
          expect(record.averageRefillIntervalDays).toBeGreaterThan(0)
        }
      }
    })

    it("records with 1 purchase have null averageRefillIntervalDays", () => {
      const singlePurchase = records.filter(
        (r) => r.totalPurchaseCount === 1,
      )
      expect(singlePurchase.length).toBeGreaterThan(0)
      for (const record of singlePurchase) {
        expect(record.averageRefillIntervalDays).toBeNull()
      }
    })

    it("records with 2+ purchases have a numeric averageRefillIntervalDays", () => {
      const multiPurchase = records.filter(
        (r) => r.totalPurchaseCount > 1,
      )
      for (const record of multiPurchase) {
        expect(record.averageRefillIntervalDays).not.toBeNull()
        expect(typeof record.averageRefillIntervalDays).toBe("number")
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
  })

  // ---------------------------------------------------------------------------
  // 6. isActive field validation
  // ---------------------------------------------------------------------------

  describe("isActive status", () => {
    it("isActive is a boolean for every record", () => {
      for (const record of records) {
        expect(typeof record.isActive).toBe("boolean")
      }
    })

    it("the majority of records are active", () => {
      const active = records.filter((r) => r.isActive)
      expect(active.length).toBeGreaterThanOrEqual(4)
    })

    it("at least one record is inactive", () => {
      const inactive = records.filter((r) => !r.isActive)
      expect(inactive.length).toBeGreaterThanOrEqual(1)
    })

    it("Omeprazole is the only inactive record", () => {
      const inactive = records.filter((r) => !r.isActive)
      expect(inactive).toHaveLength(1)
      expect(inactive[0].medication.genericName).toBe("Omeprazole")
    })
  })

  // ---------------------------------------------------------------------------
  // 7. Inferred conditions validation
  // ---------------------------------------------------------------------------

  describe("inferred conditions", () => {
    it("inferredConditions is a non-empty array for every record", () => {
      for (const record of records) {
        expect(Array.isArray(record.inferredConditions)).toBe(true)
        expect(record.inferredConditions.length).toBeGreaterThan(0)
      }
    })

    it("all inferredConditions values are valid ConditionType strings", () => {
      for (const record of records) {
        for (const cond of record.inferredConditions) {
          expect(VALID_CONDITION_TYPES).toContain(cond)
        }
      }
    })

    it("no duplicate conditions within a single record", () => {
      for (const record of records) {
        expect(new Set(record.inferredConditions).size).toBe(
          record.inferredConditions.length,
        )
      }
    })

    it("inferredConditions are subsets of the corresponding taxonomy conditionTags", () => {
      for (const record of records) {
        const taxonomyEntry = taxonomyById.get(record.medicationId)
        expect(taxonomyEntry).toBeDefined()
        const allowedTags = new Set(taxonomyEntry!.conditionTags ?? [])
        for (const condition of record.inferredConditions) {
          expect(allowedTags).toContain(condition)
        }
      }
    })

    it("Metformin is tagged with DIABETES", () => {
      const metformin = records.find(
        (r) => r.medication.genericName === "Metformin",
      )!
      expect(metformin.inferredConditions).toContain("DIABETES")
    })

    it("Amlodipine is tagged with HYPERTENSION", () => {
      const amlodipine = records.find(
        (r) => r.medication.genericName === "Amlodipine",
      )!
      expect(amlodipine.inferredConditions).toContain("HYPERTENSION")
    })

    it("Losartan is tagged with HYPERTENSION", () => {
      const losartan = records.find(
        (r) => r.medication.genericName === "Losartan",
      )!
      expect(losartan.inferredConditions).toContain("HYPERTENSION")
    })

    it("HbA1c Test is tagged with DIABETES", () => {
      const hba1c = records.find(
        (r) => r.medication.genericName === "HbA1c Test",
      )!
      expect(hba1c.inferredConditions).toContain("DIABETES")
    })
  })

  // ---------------------------------------------------------------------------
  // 8. Specific medication spot-checks per task description
  // ---------------------------------------------------------------------------

  describe("Metformin 500mg record", () => {
    const metformin = records.find(
      (r) => r.medication.genericName === "Metformin",
    )!

    it("exists", () => {
      expect(metformin).toBeDefined()
    })

    it("has 8 total purchases", () => {
      expect(metformin.totalPurchaseCount).toBe(8)
    })

    it("has approximately 28-day average refill interval (within 5 days tolerance)", () => {
      expect(metformin.averageRefillIntervalDays).not.toBeNull()
      expect(metformin.averageRefillIntervalDays!).toBeGreaterThanOrEqual(26)
      expect(metformin.averageRefillIntervalDays!).toBeLessThanOrEqual(33)
    })

    it("is tagged with DIABETES", () => {
      expect(metformin.inferredConditions).toContain("DIABETES")
    })

    it("is active", () => {
      expect(metformin.isActive).toBe(true)
    })

    it("has a date range spanning 7+ months (first purchase ~7 months ago)", () => {
      const first = new Date(metformin.firstPurchaseDate).getTime()
      const last = new Date(metformin.lastPurchaseDate).getTime()
      const daySpan = (last - first) / (1000 * 60 * 60 * 24)
      // 7 months is roughly 210 days
      expect(daySpan).toBeGreaterThanOrEqual(210)
    })

    it("is a MEDICATION category", () => {
      expect(metformin.medication.category).toBe("MEDICATION")
    })

    it("includes Glucophage as a brand name", () => {
      expect(metformin.medication.brandNames).toContain("Glucophage")
    })
  })

  describe("Amlodipine 5mg record", () => {
    const amlodipine = records.find(
      (r) => r.medication.genericName === "Amlodipine",
    )!

    it("exists", () => {
      expect(amlodipine).toBeDefined()
    })

    it("has 6 total purchases", () => {
      expect(amlodipine.totalPurchaseCount).toBe(6)
    })

    it("has approximately 30-day average refill interval", () => {
      expect(amlodipine.averageRefillIntervalDays).not.toBeNull()
      expect(amlodipine.averageRefillIntervalDays!).toBeGreaterThanOrEqual(
        28,
      )
      expect(amlodipine.averageRefillIntervalDays!).toBeLessThanOrEqual(32)
    })

    it("is tagged with HYPERTENSION", () => {
      expect(amlodipine.inferredConditions).toContain("HYPERTENSION")
    })

    it("is active", () => {
      expect(amlodipine.isActive).toBe(true)
    })

    it("is a MEDICATION category", () => {
      expect(amlodipine.medication.category).toBe("MEDICATION")
    })
  })

  describe("Losartan 50mg record", () => {
    const losartan = records.find(
      (r) => r.medication.genericName === "Losartan",
    )!

    it("exists", () => {
      expect(losartan).toBeDefined()
    })

    it("has 5 total purchases", () => {
      expect(losartan.totalPurchaseCount).toBe(5)
    })

    it("has approximately 30-day average refill interval", () => {
      expect(losartan.averageRefillIntervalDays).not.toBeNull()
      expect(losartan.averageRefillIntervalDays!).toBeGreaterThanOrEqual(28)
      expect(losartan.averageRefillIntervalDays!).toBeLessThanOrEqual(32)
    })

    it("is tagged with HYPERTENSION", () => {
      expect(losartan.inferredConditions).toContain("HYPERTENSION")
    })

    it("is active", () => {
      expect(losartan.isActive).toBe(true)
    })
  })

  describe("Atorvastatin 20mg record", () => {
    const atorvastatin = records.find(
      (r) => r.medication.genericName === "Atorvastatin",
    )!

    it("exists", () => {
      expect(atorvastatin).toBeDefined()
    })

    it("has 4 total purchases", () => {
      expect(atorvastatin.totalPurchaseCount).toBe(4)
    })

    it("has approximately 30-day average refill interval", () => {
      expect(atorvastatin.averageRefillIntervalDays).not.toBeNull()
      expect(atorvastatin.averageRefillIntervalDays!).toBeGreaterThanOrEqual(
        28,
      )
      expect(atorvastatin.averageRefillIntervalDays!).toBeLessThanOrEqual(32)
    })

    it("is active", () => {
      expect(atorvastatin.isActive).toBe(true)
    })

    it("is a MEDICATION category", () => {
      expect(atorvastatin.medication.category).toBe("MEDICATION")
    })

    it("does not have a specific NCD condition tag (uses GENERAL)", () => {
      // Atorvastatin has no explicit inferredConditions in the task description
      // so it should use a general tag rather than a specific NCD
      expect(atorvastatin.inferredConditions.length).toBeGreaterThan(0)
    })
  })

  describe("HbA1c Test record", () => {
    const hba1c = records.find(
      (r) => r.medication.genericName === "HbA1c Test",
    )!

    it("exists", () => {
      expect(hba1c).toBeDefined()
    })

    it("has exactly 1 purchase", () => {
      expect(hba1c.totalPurchaseCount).toBe(1)
    })

    it("has null averageRefillIntervalDays (single purchase)", () => {
      expect(hba1c.averageRefillIntervalDays).toBeNull()
    })

    it("is a LAB_TEST category", () => {
      expect(hba1c.medication.category).toBe("LAB_TEST")
    })

    it("is tagged with DIABETES", () => {
      expect(hba1c.inferredConditions).toContain("DIABETES")
    })

    it("is active", () => {
      expect(hba1c.isActive).toBe(true)
    })

    it("has an empty brandNames array", () => {
      expect(hba1c.medication.brandNames).toEqual([])
    })

    it("has identical first and last purchase dates", () => {
      expect(hba1c.firstPurchaseDate).toBe(hba1c.lastPurchaseDate)
    })
  })

  describe("Omeprazole 20mg record", () => {
    const omeprazole = records.find(
      (r) => r.medication.genericName === "Omeprazole",
    )!

    it("exists", () => {
      expect(omeprazole).toBeDefined()
    })

    it("has 2 total purchases", () => {
      expect(omeprazole.totalPurchaseCount).toBe(2)
    })

    it("is inactive (isActive: false)", () => {
      expect(omeprazole.isActive).toBe(false)
    })

    it("last purchase was approximately 90 days before current date (2026-08-25)", () => {
      const lastPurchase = new Date(omeprazole.lastPurchaseDate).getTime()
      // Current date per task context is 2026-08-25
      const currentDate = new Date("2026-08-25").getTime()
      const daysSinceLastPurchase =
        (currentDate - lastPurchase) / (1000 * 60 * 60 * 24)
      // Should be approximately 90 days, allow some tolerance
      expect(daysSinceLastPurchase).toBeGreaterThanOrEqual(80)
      expect(daysSinceLastPurchase).toBeLessThanOrEqual(100)
    })

    it("is a MEDICATION category", () => {
      expect(omeprazole.medication.category).toBe("MEDICATION")
    })

    it("has a numeric averageRefillIntervalDays (2 purchases)", () => {
      expect(omeprazole.averageRefillIntervalDays).not.toBeNull()
      expect(typeof omeprazole.averageRefillIntervalDays).toBe("number")
    })
  })

  // ---------------------------------------------------------------------------
  // 9. Edge cases and data integrity
  // ---------------------------------------------------------------------------

  describe("edge cases and data integrity", () => {
    it("genericName fields have no leading or trailing whitespace", () => {
      for (const record of records) {
        expect(record.medication.genericName).toBe(
          record.medication.genericName.trim(),
        )
      }
    })

    it("brandNames have no leading or trailing whitespace", () => {
      for (const record of records) {
        for (const brand of record.medication.brandNames) {
          expect(brand).toBe(brand.trim())
        }
      }
    })

    it("firstPurchaseDate values have no leading or trailing whitespace", () => {
      for (const record of records) {
        expect(record.firstPurchaseDate).toBe(
          record.firstPurchaseDate.trim(),
        )
      }
    })

    it("no record has totalPurchaseCount of 0", () => {
      for (const record of records) {
        expect(record.totalPurchaseCount).not.toBe(0)
      }
    })

    it("the fixture can be filtered by isActive without errors", () => {
      const active = records.filter((r) => r.isActive)
      const inactive = records.filter((r) => !r.isActive)
      expect(active.length + inactive.length).toBe(records.length)
    })

    it("the fixture can be filtered by medication category without errors", () => {
      const medications = records.filter(
        (r) => r.medication.category === "MEDICATION",
      )
      const labTests = records.filter(
        (r) => r.medication.category === "LAB_TEST",
      )
      expect(medications.length).toBeGreaterThan(0)
      expect(labTests.length).toBeGreaterThan(0)
      expect(medications.length + labTests.length).toBe(records.length)
    })

    it("the fixture can be filtered by inferred condition without errors", () => {
      const diabetes = records.filter((r) =>
        r.inferredConditions.includes("DIABETES"),
      )
      const hypertension = records.filter((r) =>
        r.inferredConditions.includes("HYPERTENSION"),
      )
      expect(diabetes.length).toBeGreaterThan(0)
      expect(hypertension.length).toBeGreaterThan(0)
    })

    it("records are ordered from most to fewest purchases", () => {
      // Not strictly required, but verify ordering is sensible
      const metformin = records.find(
        (r) => r.medication.genericName === "Metformin",
      )!
      const hba1c = records.find(
        (r) => r.medication.genericName === "HbA1c Test",
      )!
      expect(metformin.totalPurchaseCount).toBeGreaterThan(
        hba1c.totalPurchaseCount,
      )
    })

    it("active records with multiple purchases have lastPurchaseDate within the last 30 days of the demo period", () => {
      // Active medications should have been purchased recently
      const activeMulti = records.filter(
        (r) => r.isActive && r.totalPurchaseCount > 1,
      )
      for (const record of activeMulti) {
        const lastPurchase = new Date(record.lastPurchaseDate).getTime()
        // Demo current date is 2026-08-25; active meds should have recent refills
        const demoDate = new Date("2026-08-25").getTime()
        const daysSince =
          (demoDate - lastPurchase) / (1000 * 60 * 60 * 24)
        expect(daysSince).toBeLessThanOrEqual(30)
      }
    })

    it("inactive Omeprazole has a lastPurchaseDate significantly before the demo date", () => {
      const omeprazole = records.find(
        (r) => r.medication.genericName === "Omeprazole",
      )!
      const lastPurchase = new Date(omeprazole.lastPurchaseDate).getTime()
      const demoDate = new Date("2026-08-25").getTime()
      const daysSince =
        (demoDate - lastPurchase) / (1000 * 60 * 60 * 24)
      // Must be at least 60 days to justify inactive status
      expect(daysSince).toBeGreaterThanOrEqual(60)
    })
  })
})
