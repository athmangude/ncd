import { describe, it, expect } from "vitest"
import type {
  MedicationTaxonomyEntry,
  MedicationCategory,
  ConditionType,
} from "@/types/care-companion"
import { MEDICATION_CATEGORY, CONDITION_TYPE } from "@/types/care-companion"

import medicationTaxonomy from "./medication-taxonomy.json"

// ---------------------------------------------------------------------------
// Helper: compile-time type guard. If the fixture drifts from the TypeScript
// interface the test file fails to compile before it even runs.
// ---------------------------------------------------------------------------

function assertType<T>(_value: T): void {
  // compile-time only
}

const entries = medicationTaxonomy as MedicationTaxonomyEntry[]

// Valid enum values derived from the const objects
const VALID_CATEGORIES = new Set<string>(Object.values(MEDICATION_CATEGORY))
const VALID_CONDITION_TYPES = new Set<string>(Object.values(CONDITION_TYPE))

// UUID v4 pattern (allows non-random/deterministic UUIDs that match the format)
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// WHO ATC code pattern: letter + 2 digits + 2 letters + 2 digits
const ATC_CODE_PATTERN = /^[A-Z]\d{2}[A-Z]{2}\d{2}$/

// ---------------------------------------------------------------------------
// Required medications from the task description
// ---------------------------------------------------------------------------

const REQUIRED_GENERIC_NAMES = [
  "Metformin",
  "Amlodipine",
  "Losartan",
  "Atorvastatin",
  "Glibenclamide",
  "Hydrochlorothiazide",
  "Enalapril",
  "Nifedipine",
  "Insulin Glargine",
  "Aspirin",
  "Lisinopril",
  "Simvastatin",
  "Metoprolol",
  "Omeprazole",
]

const REQUIRED_LAB_TEST = "HbA1c Test"

// Known ATC codes for required medications
const EXPECTED_ATC_CODES: Record<string, string> = {
  Metformin: "A10BA02",
  Amlodipine: "C08CA01",
  Losartan: "C09CA01",
  Atorvastatin: "C10AA05",
  Glibenclamide: "A10BB01",
  Hydrochlorothiazide: "C03AA03",
  Enalapril: "C09AA02",
  Nifedipine: "C08CA05",
  "Insulin Glargine": "A10AE04",
  Aspirin: "B01AC06",
  Lisinopril: "C09AA03",
  Simvastatin: "C10AA01",
  Metoprolol: "C07AB02",
  Omeprazole: "A02BC01",
}

// Expected condition tags for required medications
const EXPECTED_CONDITION_TAGS: Record<string, string[]> = {
  Metformin: ["DIABETES"],
  Amlodipine: ["HYPERTENSION"],
  Losartan: ["HYPERTENSION"],
  Glibenclamide: ["DIABETES"],
  Hydrochlorothiazide: ["HYPERTENSION"],
  Enalapril: ["HYPERTENSION"],
  Nifedipine: ["HYPERTENSION"],
  "Insulin Glargine": ["DIABETES"],
  Lisinopril: ["HYPERTENSION"],
  Metoprolol: ["HYPERTENSION"],
  "HbA1c Test": ["DIABETES"],
}

// ---------------------------------------------------------------------------
// 1. Structure and completeness
// ---------------------------------------------------------------------------

describe("medication-taxonomy.json", () => {
  describe("structure and completeness", () => {
    it("is a valid JSON array", () => {
      expect(Array.isArray(medicationTaxonomy)).toBe(true)
    })

    it("contains between 15 and 20 entries", () => {
      expect(entries.length).toBeGreaterThanOrEqual(15)
      expect(entries.length).toBeLessThanOrEqual(20)
    })

    it("every entry conforms to the MedicationTaxonomyEntry type", () => {
      for (const entry of entries) {
        assertType<MedicationTaxonomyEntry>(entry)
      }
    })

    it("includes all required medications", () => {
      const genericNames = entries.map((e) => e.genericName)
      for (const name of REQUIRED_GENERIC_NAMES) {
        expect(genericNames).toContain(name)
      }
    })

    it("includes the HbA1c Test lab test entry", () => {
      const labTest = entries.find((e) => e.genericName === REQUIRED_LAB_TEST)
      expect(labTest).toBeDefined()
    })

    it("all entries have unique IDs", () => {
      const ids = entries.map((e) => e.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it("all entries have unique generic names", () => {
      const names = entries.map((e) => e.genericName)
      expect(new Set(names).size).toBe(names.length)
    })

    it("all entries have isActive: true", () => {
      for (const entry of entries) {
        expect(entry.isActive).toBe(true)
      }
    })
  })

  // ---------------------------------------------------------------------------
  // 2. ID format validation
  // ---------------------------------------------------------------------------

  describe("ID format", () => {
    it("every entry has a deterministic UUID-format ID", () => {
      for (const entry of entries) {
        expect(entry.id).toMatch(UUID_PATTERN)
      }
    })

    it("no ID is the nil UUID", () => {
      for (const entry of entries) {
        expect(entry.id).not.toBe("00000000-0000-0000-0000-000000000000")
      }
    })
  })

  // ---------------------------------------------------------------------------
  // 3. Category validation
  // ---------------------------------------------------------------------------

  describe("category values", () => {
    it("every entry has a valid MedicationCategory", () => {
      for (const entry of entries) {
        expect(VALID_CATEGORIES).toContain(entry.category)
      }
    })

    it("the majority of entries are MEDICATION category", () => {
      const medications = entries.filter(
        (e) => e.category === "MEDICATION",
      )
      expect(medications.length).toBeGreaterThanOrEqual(14)
    })

    it("HbA1c Test is the only LAB_TEST category entry", () => {
      const labTests = entries.filter((e) => e.category === "LAB_TEST")
      expect(labTests).toHaveLength(1)
      expect(labTests[0].genericName).toBe("HbA1c Test")
    })
  })

  // ---------------------------------------------------------------------------
  // 4. ATC code validation
  // ---------------------------------------------------------------------------

  describe("ATC codes", () => {
    it("every MEDICATION entry has a non-null ATC code", () => {
      const medications = entries.filter((e) => e.category === "MEDICATION")
      for (const med of medications) {
        expect(med.atcCode).not.toBeNull()
        expect(med.atcCode).toBeTruthy()
      }
    })

    it("every MEDICATION ATC code matches WHO format (letter + 2digits + 2letters + 2digits)", () => {
      const medications = entries.filter((e) => e.category === "MEDICATION")
      for (const med of medications) {
        expect(med.atcCode).toMatch(ATC_CODE_PATTERN)
      }
    })

    it("LAB_TEST entries have null ATC codes", () => {
      const labTests = entries.filter((e) => e.category === "LAB_TEST")
      for (const lt of labTests) {
        expect(lt.atcCode).toBeNull()
      }
    })

    it("required medications have the correct real ATC codes", () => {
      for (const [name, expectedCode] of Object.entries(EXPECTED_ATC_CODES)) {
        const entry = entries.find((e) => e.genericName === name)
        expect(entry).toBeDefined()
        expect(entry!.atcCode).toBe(expectedCode)
      }
    })

    it("all ATC codes are unique among entries that have them", () => {
      const codes = entries
        .filter((e) => e.atcCode !== null)
        .map((e) => e.atcCode)
      expect(new Set(codes).size).toBe(codes.length)
    })
  })

  // ---------------------------------------------------------------------------
  // 5. Brand names validation
  // ---------------------------------------------------------------------------

  describe("brand names", () => {
    it("every MEDICATION entry has at least one brand name", () => {
      const medications = entries.filter((e) => e.category === "MEDICATION")
      for (const med of medications) {
        expect(Array.isArray(med.brandNames)).toBe(true)
        expect(med.brandNames!.length).toBeGreaterThanOrEqual(1)
      }
    })

    it("LAB_TEST entries have empty or null brand names", () => {
      const labTests = entries.filter((e) => e.category === "LAB_TEST")
      for (const lt of labTests) {
        if (lt.brandNames !== null) {
          expect(lt.brandNames).toHaveLength(0)
        }
      }
    })

    it("brand names are non-empty strings", () => {
      for (const entry of entries) {
        if (entry.brandNames && entry.brandNames.length > 0) {
          for (const brand of entry.brandNames) {
            expect(typeof brand).toBe("string")
            expect(brand.trim()).not.toBe("")
          }
        }
      }
    })

    it("no duplicate brand names within a single entry", () => {
      for (const entry of entries) {
        if (entry.brandNames && entry.brandNames.length > 0) {
          expect(new Set(entry.brandNames).size).toBe(entry.brandNames.length)
        }
      }
    })
  })

  // ---------------------------------------------------------------------------
  // 6. Dosage forms and strengths
  // ---------------------------------------------------------------------------

  describe("dosage forms and strengths", () => {
    it("every MEDICATION entry has at least one dosage form", () => {
      const medications = entries.filter((e) => e.category === "MEDICATION")
      for (const med of medications) {
        expect(Array.isArray(med.dosageForms)).toBe(true)
        expect(med.dosageForms!.length).toBeGreaterThanOrEqual(1)
      }
    })

    it("every MEDICATION entry has at least one strength", () => {
      const medications = entries.filter((e) => e.category === "MEDICATION")
      for (const med of medications) {
        expect(Array.isArray(med.strengths)).toBe(true)
        expect(med.strengths!.length).toBeGreaterThanOrEqual(1)
      }
    })

    it("LAB_TEST entries have null dosage forms and strengths", () => {
      const labTests = entries.filter((e) => e.category === "LAB_TEST")
      for (const lt of labTests) {
        expect(lt.dosageForms).toBeNull()
        expect(lt.strengths).toBeNull()
      }
    })

    it("strengths contain unit indicators (mg, IU, etc.)", () => {
      const medications = entries.filter((e) => e.category === "MEDICATION")
      for (const med of medications) {
        for (const strength of med.strengths!) {
          expect(strength).toMatch(/\d/)
          expect(strength).toMatch(/[a-zA-Z]/)
        }
      }
    })

    it("dosage form strings are non-empty", () => {
      for (const entry of entries) {
        if (entry.dosageForms) {
          for (const form of entry.dosageForms) {
            expect(form.trim()).not.toBe("")
          }
        }
      }
    })

    it("Insulin Glargine has injection-based dosage forms", () => {
      const insulin = entries.find(
        (e) => e.genericName === "Insulin Glargine",
      )!
      const hasInjection = insulin.dosageForms!.some((f) =>
        f.toLowerCase().includes("injection"),
      )
      expect(hasInjection).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // 7. Synonyms validation
  // ---------------------------------------------------------------------------

  describe("synonyms", () => {
    it("every entry has at least one synonym", () => {
      for (const entry of entries) {
        expect(Array.isArray(entry.synonyms)).toBe(true)
        expect(entry.synonyms!.length).toBeGreaterThanOrEqual(1)
      }
    })

    it("synonyms include common misspellings for medications", () => {
      // Metformin should have a misspelling variant
      const metformin = entries.find((e) => e.genericName === "Metformin")!
      const hasMisspelling = metformin.synonyms!.some(
        (s) =>
          s !== "metformin" &&
          s.toLowerCase() !== "metformin" &&
          s.toLowerCase().includes("met"),
      )
      expect(hasMisspelling).toBe(true)
    })

    it("synonyms are all non-empty strings", () => {
      for (const entry of entries) {
        if (entry.synonyms) {
          for (const syn of entry.synonyms) {
            expect(typeof syn).toBe("string")
            expect(syn.trim()).not.toBe("")
          }
        }
      }
    })

    it("no duplicate synonyms within a single entry", () => {
      for (const entry of entries) {
        if (entry.synonyms) {
          const lowered = entry.synonyms.map((s) => s.toLowerCase())
          expect(new Set(lowered).size).toBe(lowered.length)
        }
      }
    })

    it("HbA1c Test synonyms include common search terms", () => {
      const hba1c = entries.find((e) => e.genericName === "HbA1c Test")!
      const synLower = hba1c.synonyms!.map((s) => s.toLowerCase())
      const hasA1c =
        synLower.some((s) => s.includes("a1c")) ||
        synLower.some((s) => s.includes("hba1c"))
      expect(hasA1c).toBe(true)
    })

    it("HbA1c Test synonyms include hemoglobin variant", () => {
      const hba1c = entries.find((e) => e.genericName === "HbA1c Test")!
      const synLower = hba1c.synonyms!.map((s) => s.toLowerCase())
      const hasHemoglobin = synLower.some(
        (s) => s.includes("hemoglobin") || s.includes("haemoglobin"),
      )
      expect(hasHemoglobin).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // 8. Condition tags validation
  // ---------------------------------------------------------------------------

  describe("condition tags", () => {
    it("every entry has at least one condition tag", () => {
      for (const entry of entries) {
        expect(Array.isArray(entry.conditionTags)).toBe(true)
        expect(entry.conditionTags!.length).toBeGreaterThanOrEqual(1)
      }
    })

    it("all condition tags are valid ConditionType values", () => {
      for (const entry of entries) {
        if (entry.conditionTags) {
          for (const tag of entry.conditionTags) {
            expect(VALID_CONDITION_TYPES).toContain(tag)
          }
        }
      }
    })

    it("required medications have the expected condition tags", () => {
      for (const [name, expectedTags] of Object.entries(
        EXPECTED_CONDITION_TAGS,
      )) {
        const entry = entries.find((e) => e.genericName === name)
        expect(entry).toBeDefined()
        for (const tag of expectedTags) {
          expect(entry!.conditionTags).toContain(tag)
        }
      }
    })

    it("diabetes medications are tagged with DIABETES", () => {
      const diabetesMeds = ["Metformin", "Glibenclamide", "Insulin Glargine"]
      for (const name of diabetesMeds) {
        const entry = entries.find((e) => e.genericName === name)!
        expect(entry.conditionTags).toContain("DIABETES")
      }
    })

    it("hypertension medications are tagged with HYPERTENSION", () => {
      const htMeds = [
        "Amlodipine",
        "Losartan",
        "Hydrochlorothiazide",
        "Enalapril",
        "Nifedipine",
        "Lisinopril",
        "Metoprolol",
      ]
      for (const name of htMeds) {
        const entry = entries.find((e) => e.genericName === name)!
        expect(entry.conditionTags).toContain("HYPERTENSION")
      }
    })

    it("no duplicate condition tags within a single entry", () => {
      for (const entry of entries) {
        if (entry.conditionTags) {
          expect(new Set(entry.conditionTags).size).toBe(
            entry.conditionTags.length,
          )
        }
      }
    })
  })

  // ---------------------------------------------------------------------------
  // 9. Specific required medication spot-checks
  // ---------------------------------------------------------------------------

  describe("Metformin entry", () => {
    const metformin = entries.find((e) => e.genericName === "Metformin")!

    it("exists", () => {
      expect(metformin).toBeDefined()
    })

    it("has ATC code A10BA02", () => {
      expect(metformin.atcCode).toBe("A10BA02")
    })

    it("is a MEDICATION category", () => {
      expect(metformin.category).toBe("MEDICATION")
    })

    it("is tagged for DIABETES", () => {
      expect(metformin.conditionTags).toContain("DIABETES")
    })

    it("has tablet-based dosage forms", () => {
      const hasTablet = metformin.dosageForms!.some((f) =>
        f.toLowerCase().includes("tablet"),
      )
      expect(hasTablet).toBe(true)
    })

    it("includes 500mg strength", () => {
      expect(metformin.strengths).toContain("500mg")
    })

    it("includes Glucophage as a brand name", () => {
      expect(metformin.brandNames).toContain("Glucophage")
    })
  })

  describe("HbA1c Test entry", () => {
    const hba1c = entries.find((e) => e.genericName === "HbA1c Test")!

    it("exists", () => {
      expect(hba1c).toBeDefined()
    })

    it("is a LAB_TEST category", () => {
      expect(hba1c.category).toBe("LAB_TEST")
    })

    it("has null ATC code", () => {
      expect(hba1c.atcCode).toBeNull()
    })

    it("has null dosage forms", () => {
      expect(hba1c.dosageForms).toBeNull()
    })

    it("has null strengths", () => {
      expect(hba1c.strengths).toBeNull()
    })

    it("is tagged for DIABETES", () => {
      expect(hba1c.conditionTags).toContain("DIABETES")
    })

    it("has empty brand names array", () => {
      expect(hba1c.brandNames).toEqual([])
    })

    it("has synonyms covering common search variants", () => {
      expect(hba1c.synonyms!.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe("Insulin Glargine entry", () => {
    const insulin = entries.find(
      (e) => e.genericName === "Insulin Glargine",
    )!

    it("exists", () => {
      expect(insulin).toBeDefined()
    })

    it("has ATC code A10AE04", () => {
      expect(insulin.atcCode).toBe("A10AE04")
    })

    it("has injection-based dosage forms (not tablets)", () => {
      const allForms = insulin.dosageForms!.join(" ").toLowerCase()
      expect(allForms).toContain("injection")
      expect(allForms).not.toContain("tablet")
    })

    it("has IU-based strengths", () => {
      const allStrengths = insulin.strengths!.join(" ")
      expect(allStrengths).toContain("IU")
    })

    it("includes Lantus as a brand name", () => {
      expect(insulin.brandNames).toContain("Lantus")
    })
  })

  // ---------------------------------------------------------------------------
  // 10. Edge cases and data integrity
  // ---------------------------------------------------------------------------

  describe("edge cases and data integrity", () => {
    it("no entry has an empty genericName", () => {
      for (const entry of entries) {
        expect(entry.genericName.trim()).not.toBe("")
        expect(entry.genericName.length).toBeGreaterThan(2)
      }
    })

    it("no entry has an undefined required field", () => {
      for (const entry of entries) {
        expect(entry.id).toBeDefined()
        expect(entry.genericName).toBeDefined()
        expect(entry.category).toBeDefined()
        expect(entry.isActive).toBeDefined()
      }
    })

    it("genericName does not have leading or trailing whitespace", () => {
      for (const entry of entries) {
        expect(entry.genericName).toBe(entry.genericName.trim())
      }
    })

    it("brand names do not have leading or trailing whitespace", () => {
      for (const entry of entries) {
        if (entry.brandNames) {
          for (const brand of entry.brandNames) {
            expect(brand).toBe(brand.trim())
          }
        }
      }
    })

    it("synonyms do not have leading or trailing whitespace", () => {
      for (const entry of entries) {
        if (entry.synonyms) {
          for (const syn of entry.synonyms) {
            expect(syn).toBe(syn.trim())
          }
        }
      }
    })

    it("no two entries share the same brand name", () => {
      const allBrands: string[] = []
      for (const entry of entries) {
        if (entry.brandNames) {
          allBrands.push(...entry.brandNames)
        }
      }
      expect(new Set(allBrands).size).toBe(allBrands.length)
    })

    it("ATC codes in the A group are diabetes/GI medications", () => {
      const aGroupEntries = entries.filter(
        (e) => e.atcCode && e.atcCode.startsWith("A"),
      )
      for (const entry of aGroupEntries) {
        const tags = entry.conditionTags || []
        const hasDiabetesOrGeneral =
          tags.includes("DIABETES") || tags.includes("GENERAL")
        expect(hasDiabetesOrGeneral).toBe(true)
      }
    })

    it("ATC codes in the C group are cardiovascular/hypertension medications", () => {
      const cGroupEntries = entries.filter(
        (e) => e.atcCode && e.atcCode.startsWith("C"),
      )
      for (const entry of cGroupEntries) {
        const tags = entry.conditionTags || []
        const hasHypertensionOrGeneral =
          tags.includes("HYPERTENSION") || tags.includes("GENERAL")
        expect(hasHypertensionOrGeneral).toBe(true)
      }
    })

    it("isActive is a boolean for every entry (not truthy string)", () => {
      for (const entry of entries) {
        expect(typeof entry.isActive).toBe("boolean")
      }
    })

    it("the fixture can be filtered by category without errors", () => {
      const byCategory = (cat: MedicationCategory) =>
        entries.filter((e) => e.category === cat)
      expect(byCategory("MEDICATION").length).toBeGreaterThan(0)
      expect(byCategory("LAB_TEST").length).toBeGreaterThan(0)
      expect(() => byCategory("CONSULTATION")).not.toThrow()
      expect(() => byCategory("SUPPLY")).not.toThrow()
    })

    it("the fixture can be filtered by condition tag without errors", () => {
      const byCondition = (tag: ConditionType) =>
        entries.filter(
          (e) => e.conditionTags && e.conditionTags.includes(tag),
        )
      expect(byCondition("DIABETES").length).toBeGreaterThan(0)
      expect(byCondition("HYPERTENSION").length).toBeGreaterThan(0)
      expect(byCondition("GENERAL").length).toBeGreaterThan(0)
    })
  })
})
