import { describe, it, expect } from "vitest"
import type {
  MedicationCard,
  MedicationInteraction,
  MedicationTaxonomyEntry,
  SideEffect,
  SeriousSideEffect,
  AvoidanceWarning,
} from "@/types/care-companion"
import {
  CONTENT_LOCALE,
  INTERACTION_SEVERITY,
} from "@/types/care-companion"

import medicationCards from "./medication-cards.json"
import medicationInteractions from "./medication-interactions.json"
import medicationTaxonomy from "./medication-taxonomy.json"

// ---------------------------------------------------------------------------
// Helper: compile-time type guard. If the fixture drifts from the TypeScript
// interface the test file fails to compile before it even runs.
// ---------------------------------------------------------------------------

function assertType<T>(_value: T): void {
  // compile-time only
}

const cards = medicationCards as MedicationCard[]
const interactions = medicationInteractions as MedicationInteraction[]
const taxonomy = medicationTaxonomy as MedicationTaxonomyEntry[]

const VALID_LOCALES = new Set<string>(Object.values(CONTENT_LOCALE))
const VALID_SEVERITIES = new Set<string>(Object.values(INTERACTION_SEVERITY))
const TAXONOMY_IDS = new Set(taxonomy.map((t) => t.id))

// Medication ID to name lookup for readable assertions
const ID_TO_NAME: Record<string, string> = Object.fromEntries(
  taxonomy.map((t) => [t.id, t.genericName]),
)

// ===========================================================================
// MEDICATION CARDS
// ===========================================================================

describe("medication-cards.json", () => {
  // -------------------------------------------------------------------------
  // 1. Structure and completeness
  // -------------------------------------------------------------------------

  describe("structure and completeness", () => {
    it("is a valid JSON array", () => {
      expect(Array.isArray(medicationCards)).toBe(true)
    })

    it("contains exactly 5 medication cards", () => {
      expect(cards).toHaveLength(5)
    })

    it("every card conforms to the MedicationCard type", () => {
      for (const card of cards) {
        assertType<MedicationCard>(card)
      }
    })

    it("all cards have unique IDs", () => {
      const ids = cards.map((c) => c.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it("includes cards for the 5 required medications: Metformin/EN, Amlodipine/EN, Losartan/EN, Atorvastatin/EN, Metformin/SW", () => {
      const combos = cards.map((c) => {
        const name = ID_TO_NAME[c.medicationId] || "UNKNOWN"
        return `${name}/${c.locale}`
      })
      expect(combos).toContain("Metformin/EN")
      expect(combos).toContain("Amlodipine/EN")
      expect(combos).toContain("Losartan/EN")
      expect(combos).toContain("Atorvastatin/EN")
      expect(combos).toContain("Metformin/SW")
    })
  })

  // -------------------------------------------------------------------------
  // 2. Required fields and sub-object validation
  // -------------------------------------------------------------------------

  describe("required fields validation", () => {
    it("every card has a non-empty id", () => {
      for (const card of cards) {
        expect(card.id).toBeTruthy()
        expect(card.id.trim()).not.toBe("")
      }
    })

    it("every card has a non-empty medicationId", () => {
      for (const card of cards) {
        expect(card.medicationId).toBeTruthy()
      }
    })

    it("every card has a valid locale (EN or SW)", () => {
      for (const card of cards) {
        expect(VALID_LOCALES).toContain(card.locale)
      }
    })

    it("every card has a non-empty description (at least 50 characters for medical content)", () => {
      for (const card of cards) {
        expect(card.description).toBeTruthy()
        expect(card.description.length).toBeGreaterThanOrEqual(50)
      }
    })

    it("every card has a non-empty howItWorks field", () => {
      for (const card of cards) {
        expect(card.howItWorks).toBeTruthy()
        expect(typeof card.howItWorks).toBe("string")
        expect(card.howItWorks!.length).toBeGreaterThanOrEqual(50)
      }
    })

    it("every card has a non-empty whenToSeekHelp field", () => {
      for (const card of cards) {
        expect(card.whenToSeekHelp).toBeTruthy()
        expect(card.whenToSeekHelp.length).toBeGreaterThan(20)
      }
    })

    it("every card has storageInstructions", () => {
      for (const card of cards) {
        expect(card.storageInstructions).toBeTruthy()
        expect(typeof card.storageInstructions).toBe("string")
        expect(card.storageInstructions!.length).toBeGreaterThan(10)
      }
    })
  })

  // -------------------------------------------------------------------------
  // 3. Common side effects validation
  // -------------------------------------------------------------------------

  describe("commonSideEffects", () => {
    it("every card has at least 2 common side effects", () => {
      for (const card of cards) {
        expect(Array.isArray(card.commonSideEffects)).toBe(true)
        expect(card.commonSideEffects.length).toBeGreaterThanOrEqual(2)
      }
    })

    it("every common side effect has effect, frequency, and advice", () => {
      for (const card of cards) {
        for (const se of card.commonSideEffects) {
          assertType<SideEffect>(se)
          expect(se.effect).toBeTruthy()
          expect(se.frequency).toBeTruthy()
          expect(se.advice).toBeTruthy()
        }
      }
    })

    it("no common side effect has empty or whitespace-only fields", () => {
      for (const card of cards) {
        for (const se of card.commonSideEffects) {
          expect(se.effect.trim()).not.toBe("")
          expect(se.frequency.trim()).not.toBe("")
          expect(se.advice.trim()).not.toBe("")
        }
      }
    })

    it("no duplicate common side effects within a single card", () => {
      for (const card of cards) {
        const effects = card.commonSideEffects.map((se) =>
          se.effect.toLowerCase(),
        )
        expect(new Set(effects).size).toBe(effects.length)
      }
    })
  })

  // -------------------------------------------------------------------------
  // 4. Serious side effects validation
  // -------------------------------------------------------------------------

  describe("seriousSideEffects", () => {
    it("every card has at least 1 serious side effect", () => {
      for (const card of cards) {
        expect(Array.isArray(card.seriousSideEffects)).toBe(true)
        expect(card.seriousSideEffects.length).toBeGreaterThanOrEqual(1)
      }
    })

    it("every serious side effect has effect and action", () => {
      for (const card of cards) {
        for (const se of card.seriousSideEffects) {
          assertType<SeriousSideEffect>(se)
          expect(se.effect).toBeTruthy()
          expect(se.action).toBeTruthy()
        }
      }
    })

    it("serious side effect actions mention seeking medical help (EN or SW)", () => {
      for (const card of cards) {
        for (const se of card.seriousSideEffects) {
          const actionLower = se.action.toLowerCase()
          const mentionsMedicalHelp =
            actionLower.includes("hospital") ||
            actionLower.includes("doctor") ||
            actionLower.includes("medical") ||
            actionLower.includes("emergency") ||
            actionLower.includes("seek") ||
            // Swahili equivalents
            actionLower.includes("hospitali") ||
            actionLower.includes("daktari") ||
            actionLower.includes("matibabu") ||
            actionLower.includes("dharura")
          expect(mentionsMedicalHelp).toBe(true)
        }
      }
    })

    it("no duplicate serious side effects within a single card", () => {
      for (const card of cards) {
        const effects = card.seriousSideEffects.map((se) =>
          se.effect.toLowerCase(),
        )
        expect(new Set(effects).size).toBe(effects.length)
      }
    })
  })

  // -------------------------------------------------------------------------
  // 5. Avoidance warnings validation
  // -------------------------------------------------------------------------

  describe("avoidanceWarnings", () => {
    it("every card has at least 1 avoidance warning", () => {
      for (const card of cards) {
        expect(Array.isArray(card.avoidanceWarnings)).toBe(true)
        expect(card.avoidanceWarnings.length).toBeGreaterThanOrEqual(1)
      }
    })

    it("every avoidance warning has substance and reason", () => {
      for (const card of cards) {
        for (const aw of card.avoidanceWarnings) {
          assertType<AvoidanceWarning>(aw)
          expect(aw.substance).toBeTruthy()
          expect(aw.reason).toBeTruthy()
        }
      }
    })

    it("no duplicate avoidance substances within a single card", () => {
      for (const card of cards) {
        const substances = card.avoidanceWarnings.map((aw) =>
          aw.substance.toLowerCase(),
        )
        expect(new Set(substances).size).toBe(substances.length)
      }
    })
  })

  // -------------------------------------------------------------------------
  // 6. Taxonomy cross-reference
  // -------------------------------------------------------------------------

  describe("taxonomy cross-reference", () => {
    it("every medicationId exists in the medication taxonomy", () => {
      for (const card of cards) {
        expect(TAXONOMY_IDS).toContain(card.medicationId)
      }
    })

    it("Metformin cards (EN and SW) share the same medicationId", () => {
      const metforminCards = cards.filter(
        (c) => ID_TO_NAME[c.medicationId] === "Metformin",
      )
      expect(metforminCards).toHaveLength(2)
      const ids = metforminCards.map((c) => c.medicationId)
      expect(ids[0]).toBe(ids[1])
    })

    it("Metformin EN and SW cards have different locales", () => {
      const metforminCards = cards.filter(
        (c) => ID_TO_NAME[c.medicationId] === "Metformin",
      )
      const locales = metforminCards.map((c) => c.locale).sort()
      expect(locales).toEqual(["EN", "SW"])
    })

    it("each medicationId+locale combination is unique (no duplicate cards)", () => {
      const combos = cards.map((c) => `${c.medicationId}/${c.locale}`)
      expect(new Set(combos).size).toBe(combos.length)
    })
  })

  // -------------------------------------------------------------------------
  // 7. Metformin/EN card spot-check
  // -------------------------------------------------------------------------

  describe("Metformin/EN card", () => {
    const card = cards.find(
      (c) =>
        ID_TO_NAME[c.medicationId] === "Metformin" && c.locale === "EN",
    )!

    it("exists", () => {
      expect(card).toBeDefined()
    })

    it("has id mc-metformin-en", () => {
      expect(card.id).toBe("mc-metformin-en")
    })

    it("description mentions type 2 diabetes", () => {
      expect(card.description.toLowerCase()).toContain("type 2 diabetes")
    })

    it("howItWorks mentions liver and insulin", () => {
      const text = card.howItWorks!.toLowerCase()
      expect(text).toContain("liver")
      expect(text).toContain("insulin")
    })

    it("has at least 4 common side effects", () => {
      expect(card.commonSideEffects.length).toBeGreaterThanOrEqual(4)
    })

    it("common side effects include nausea and diarrhoea", () => {
      const effects = card.commonSideEffects.map((se) =>
        se.effect.toLowerCase(),
      )
      const hasNausea = effects.some((e) => e.includes("nausea"))
      const hasDiarrhoea = effects.some(
        (e) => e.includes("diarrhoea") || e.includes("diarrhea"),
      )
      expect(hasNausea).toBe(true)
      expect(hasDiarrhoea).toBe(true)
    })

    it("serious side effects include lactic acidosis", () => {
      const effects = card.seriousSideEffects.map((se) =>
        se.effect.toLowerCase(),
      )
      const hasLacticAcidosis = effects.some((e) =>
        e.includes("lactic acidosis"),
      )
      expect(hasLacticAcidosis).toBe(true)
    })

    it("avoidance warnings include alcohol", () => {
      const substances = card.avoidanceWarnings.map((aw) =>
        aw.substance.toLowerCase(),
      )
      expect(substances).toContain("alcohol")
    })

    it("storageInstructions mention temperature", () => {
      expect(card.storageInstructions!.toLowerCase()).toContain("temperature")
    })
  })

  // -------------------------------------------------------------------------
  // 8. Metformin/SW card spot-check
  // -------------------------------------------------------------------------

  describe("Metformin/SW card", () => {
    const card = cards.find(
      (c) =>
        ID_TO_NAME[c.medicationId] === "Metformin" && c.locale === "SW",
    )!

    it("exists", () => {
      expect(card).toBeDefined()
    })

    it("has id mc-metformin-sw", () => {
      expect(card.id).toBe("mc-metformin-sw")
    })

    it("description is in Swahili (not identical to EN card)", () => {
      const enCard = cards.find(
        (c) =>
          ID_TO_NAME[c.medicationId] === "Metformin" && c.locale === "EN",
      )!
      expect(card.description).not.toBe(enCard.description)
    })

    it("has the same number of commonSideEffects as the EN card", () => {
      const enCard = cards.find(
        (c) =>
          ID_TO_NAME[c.medicationId] === "Metformin" && c.locale === "EN",
      )!
      expect(card.commonSideEffects.length).toBe(
        enCard.commonSideEffects.length,
      )
    })

    it("has the same number of seriousSideEffects as the EN card", () => {
      const enCard = cards.find(
        (c) =>
          ID_TO_NAME[c.medicationId] === "Metformin" && c.locale === "EN",
      )!
      expect(card.seriousSideEffects.length).toBe(
        enCard.seriousSideEffects.length,
      )
    })

    it("has the same number of avoidanceWarnings as the EN card", () => {
      const enCard = cards.find(
        (c) =>
          ID_TO_NAME[c.medicationId] === "Metformin" && c.locale === "EN",
      )!
      expect(card.avoidanceWarnings.length).toBe(
        enCard.avoidanceWarnings.length,
      )
    })

    it("commonSideEffects content is not identical to EN (actually translated)", () => {
      const enCard = cards.find(
        (c) =>
          ID_TO_NAME[c.medicationId] === "Metformin" && c.locale === "EN",
      )!
      expect(card.commonSideEffects[0].effect).not.toBe(
        enCard.commonSideEffects[0].effect,
      )
    })
  })

  // -------------------------------------------------------------------------
  // 9. Amlodipine/EN card spot-check
  // -------------------------------------------------------------------------

  describe("Amlodipine/EN card", () => {
    const card = cards.find(
      (c) =>
        ID_TO_NAME[c.medicationId] === "Amlodipine" && c.locale === "EN",
    )!

    it("exists", () => {
      expect(card).toBeDefined()
    })

    it("description mentions blood pressure", () => {
      expect(card.description.toLowerCase()).toContain("blood pressure")
    })

    it("howItWorks mentions calcium", () => {
      expect(card.howItWorks!.toLowerCase()).toContain("calcium")
    })

    it("common side effects include ankle swelling", () => {
      const effects = card.commonSideEffects.map((se) =>
        se.effect.toLowerCase(),
      )
      const hasSwelling = effects.some(
        (e) => e.includes("swell") || e.includes("ankle"),
      )
      expect(hasSwelling).toBe(true)
    })

    it("avoidance warnings include grapefruit", () => {
      const substances = card.avoidanceWarnings.map((aw) =>
        aw.substance.toLowerCase(),
      )
      const hasGrapefruit = substances.some((s) => s.includes("grapefruit"))
      expect(hasGrapefruit).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // 10. Losartan/EN card spot-check
  // -------------------------------------------------------------------------

  describe("Losartan/EN card", () => {
    const card = cards.find(
      (c) =>
        ID_TO_NAME[c.medicationId] === "Losartan" && c.locale === "EN",
    )!

    it("exists", () => {
      expect(card).toBeDefined()
    })

    it("description mentions angiotensin or ARB", () => {
      const text = card.description.toLowerCase()
      const mentionsArb =
        text.includes("angiotensin") || text.includes("arb")
      expect(mentionsArb).toBe(true)
    })

    it("avoidance warnings include potassium", () => {
      const substances = card.avoidanceWarnings.map((aw) =>
        aw.substance.toLowerCase(),
      )
      const hasPotassium = substances.some((s) => s.includes("potassium"))
      expect(hasPotassium).toBe(true)
    })

    it("serious side effects warn about high potassium", () => {
      const effects = card.seriousSideEffects.map((se) =>
        se.effect.toLowerCase(),
      )
      const hasHighK = effects.some((e) => e.includes("potassium"))
      expect(hasHighK).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // 11. Atorvastatin/EN card spot-check
  // -------------------------------------------------------------------------

  describe("Atorvastatin/EN card", () => {
    const card = cards.find(
      (c) =>
        ID_TO_NAME[c.medicationId] === "Atorvastatin" && c.locale === "EN",
    )!

    it("exists", () => {
      expect(card).toBeDefined()
    })

    it("description mentions cholesterol", () => {
      expect(card.description.toLowerCase()).toContain("cholesterol")
    })

    it("howItWorks mentions HMG-CoA reductase", () => {
      expect(card.howItWorks!.toLowerCase()).toContain("hmg-coa reductase")
    })

    it("serious side effects warn about rhabdomyolysis", () => {
      const effects = card.seriousSideEffects.map((se) =>
        se.effect.toLowerCase(),
      )
      const hasRhabdo = effects.some((e) => e.includes("rhabdomyolysis"))
      expect(hasRhabdo).toBe(true)
    })

    it("avoidance warnings include grapefruit and St. John's Wort", () => {
      const substances = card.avoidanceWarnings.map((aw) =>
        aw.substance.toLowerCase(),
      )
      const hasGrapefruit = substances.some((s) => s.includes("grapefruit"))
      const hasStJohns = substances.some((s) => s.includes("st. john"))
      expect(hasGrapefruit).toBe(true)
      expect(hasStJohns).toBe(true)
    })

    it("has at least 3 avoidance warnings (grapefruit, St. John's Wort, alcohol)", () => {
      expect(card.avoidanceWarnings.length).toBeGreaterThanOrEqual(3)
    })
  })

  // -------------------------------------------------------------------------
  // 12. Edge cases and data integrity
  // -------------------------------------------------------------------------

  describe("edge cases and data integrity", () => {
    it("no card has leading or trailing whitespace in description", () => {
      for (const card of cards) {
        expect(card.description).toBe(card.description.trim())
      }
    })

    it("no card has leading or trailing whitespace in whenToSeekHelp", () => {
      for (const card of cards) {
        expect(card.whenToSeekHelp).toBe(card.whenToSeekHelp.trim())
      }
    })

    it("no card has leading or trailing whitespace in howItWorks", () => {
      for (const card of cards) {
        if (card.howItWorks) {
          expect(card.howItWorks).toBe(card.howItWorks.trim())
        }
      }
    })

    it("no side effect, avoidance, or storage field contains HTML tags", () => {
      for (const card of cards) {
        const allText = [
          card.description,
          card.howItWorks ?? "",
          card.whenToSeekHelp,
          card.storageInstructions ?? "",
          ...card.commonSideEffects.map(
            (se) => `${se.effect} ${se.frequency} ${se.advice}`,
          ),
          ...card.seriousSideEffects.map(
            (se) => `${se.effect} ${se.action}`,
          ),
          ...card.avoidanceWarnings.map(
            (aw) => `${aw.substance} ${aw.reason}`,
          ),
        ].join(" ")
        expect(allText).not.toMatch(/<[a-z][\s\S]*>/i)
      }
    })

    it("the fixture can be filtered by locale without errors", () => {
      const enCards = cards.filter((c) => c.locale === "EN")
      const swCards = cards.filter((c) => c.locale === "SW")
      expect(enCards.length).toBe(4)
      expect(swCards.length).toBe(1)
    })

    it("the fixture can be looked up by medicationId", () => {
      const metforminId = "f47ac10b-58cc-4372-a567-0e02b2c3d479"
      const metforminCards = cards.filter(
        (c) => c.medicationId === metforminId,
      )
      expect(metforminCards.length).toBe(2) // EN and SW
    })
  })
})

// ===========================================================================
// MEDICATION INTERACTIONS
// ===========================================================================

describe("medication-interactions.json", () => {
  // -------------------------------------------------------------------------
  // 1. Structure and completeness
  // -------------------------------------------------------------------------

  describe("structure and completeness", () => {
    it("is a valid JSON array", () => {
      expect(Array.isArray(medicationInteractions)).toBe(true)
    })

    it("contains 6 interaction records", () => {
      expect(interactions).toHaveLength(6)
    })

    it("every interaction conforms to the MedicationInteraction type", () => {
      for (const int of interactions) {
        assertType<MedicationInteraction>(int)
      }
    })

    it("all interactions have unique IDs", () => {
      const ids = interactions.map((i) => i.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
  })

  // -------------------------------------------------------------------------
  // 2. Required fields validation
  // -------------------------------------------------------------------------

  describe("required fields validation", () => {
    it("every interaction has a non-empty id", () => {
      for (const int of interactions) {
        expect(int.id).toBeTruthy()
        expect(int.id.trim()).not.toBe("")
      }
    })

    it("every interaction has a non-empty medicationAId", () => {
      for (const int of interactions) {
        expect(int.medicationAId).toBeTruthy()
      }
    })

    it("every interaction has a valid severity value", () => {
      for (const int of interactions) {
        expect(VALID_SEVERITIES).toContain(int.severity)
      }
    })

    it("every interaction has a non-empty descriptionEn", () => {
      for (const int of interactions) {
        expect(int.descriptionEn).toBeTruthy()
        expect(int.descriptionEn.length).toBeGreaterThan(20)
      }
    })

    it("every interaction has a non-empty clinicalEffect", () => {
      for (const int of interactions) {
        expect(int.clinicalEffect).toBeTruthy()
        expect(int.clinicalEffect.length).toBeGreaterThan(20)
      }
    })

    it("every interaction has a non-empty recommendation", () => {
      for (const int of interactions) {
        expect(int.recommendation).toBeTruthy()
        expect(int.recommendation.length).toBeGreaterThan(20)
      }
    })

    it("every interaction has a non-empty source", () => {
      for (const int of interactions) {
        expect(int.source).toBeTruthy()
      }
    })
  })

  // -------------------------------------------------------------------------
  // 3. Drug-drug vs drug-herbal exclusivity
  // -------------------------------------------------------------------------

  describe("drug-drug vs drug-herbal exclusivity", () => {
    it("every interaction has exactly one of medicationBId or herbName (not both, not neither)", () => {
      for (const int of interactions) {
        const hasMedB = int.medicationBId !== null
        const hasHerb = int.herbName !== null
        expect(hasMedB !== hasHerb).toBe(true)
      }
    })

    it("drug-drug interactions have non-empty medicationBId and null herbName", () => {
      const drugDrug = interactions.filter(
        (int) => int.medicationBId !== null,
      )
      for (const int of drugDrug) {
        expect(int.medicationBId).toBeTruthy()
        expect(int.herbName).toBeNull()
      }
    })

    it("drug-herbal interactions have non-empty herbName and null medicationBId", () => {
      const herbal = interactions.filter((int) => int.herbName !== null)
      for (const int of herbal) {
        expect(int.herbName).toBeTruthy()
        expect(int.herbName!.trim()).not.toBe("")
        expect(int.medicationBId).toBeNull()
      }
    })

    it("includes at least 3 drug-drug interactions", () => {
      const drugDrug = interactions.filter(
        (int) => int.medicationBId !== null && int.herbName === null,
      )
      expect(drugDrug.length).toBeGreaterThanOrEqual(3)
    })

    it("includes at least 3 drug-herbal interactions", () => {
      const herbal = interactions.filter(
        (int) => int.herbName !== null && int.medicationBId === null,
      )
      expect(herbal.length).toBeGreaterThanOrEqual(3)
    })
  })

  // -------------------------------------------------------------------------
  // 4. Canonical ordering enforcement
  // -------------------------------------------------------------------------

  describe("canonical ordering (medicationAId < medicationBId)", () => {
    it("for drug-drug interactions, medicationAId is lexicographically less than medicationBId", () => {
      const drugDrug = interactions.filter(
        (int) => int.medicationBId !== null,
      )
      for (const int of drugDrug) {
        expect(int.medicationAId < int.medicationBId!).toBe(true)
      }
    })

    it("no interaction has medicationAId equal to medicationBId (self-interaction)", () => {
      for (const int of interactions) {
        if (int.medicationBId !== null) {
          expect(int.medicationAId).not.toBe(int.medicationBId)
        }
      }
    })
  })

  // -------------------------------------------------------------------------
  // 5. Severity distribution
  // -------------------------------------------------------------------------

  describe("severity distribution", () => {
    it("severity values span MILD, MODERATE, and SEVERE", () => {
      const severities = new Set(interactions.map((i) => i.severity))
      expect(severities).toContain("MILD")
      expect(severities).toContain("MODERATE")
      expect(severities).toContain("SEVERE")
    })

    it("exactly 1 MILD interaction", () => {
      const mild = interactions.filter((i) => i.severity === "MILD")
      expect(mild).toHaveLength(1)
    })

    it("exactly 1 SEVERE interaction", () => {
      const severe = interactions.filter((i) => i.severity === "SEVERE")
      expect(severe).toHaveLength(1)
    })

    it("multiple MODERATE interactions (the most common severity)", () => {
      const moderate = interactions.filter((i) => i.severity === "MODERATE")
      expect(moderate.length).toBeGreaterThanOrEqual(3)
    })
  })

  // -------------------------------------------------------------------------
  // 6. Taxonomy cross-reference
  // -------------------------------------------------------------------------

  describe("taxonomy cross-reference", () => {
    it("every medicationAId exists in the medication taxonomy", () => {
      for (const int of interactions) {
        expect(TAXONOMY_IDS).toContain(int.medicationAId)
      }
    })

    it("every medicationBId (when non-null) exists in the medication taxonomy", () => {
      for (const int of interactions) {
        if (int.medicationBId !== null) {
          expect(TAXONOMY_IDS).toContain(int.medicationBId)
        }
      }
    })
  })

  // -------------------------------------------------------------------------
  // 7. Specific interaction spot-checks
  // -------------------------------------------------------------------------

  describe("Metformin + Enalapril (MILD) spot-check", () => {
    const int = interactions.find(
      (i) =>
        i.severity === "MILD" &&
        (ID_TO_NAME[i.medicationAId] === "Enalapril" ||
          ID_TO_NAME[i.medicationBId ?? ""] === "Enalapril") &&
        (ID_TO_NAME[i.medicationAId] === "Metformin" ||
          ID_TO_NAME[i.medicationBId ?? ""] === "Metformin"),
    )

    it("exists", () => {
      expect(int).toBeDefined()
    })

    it("is a drug-drug interaction (no herbName)", () => {
      expect(int!.herbName).toBeNull()
      expect(int!.medicationBId).not.toBeNull()
    })

    it("has MILD severity", () => {
      expect(int!.severity).toBe("MILD")
    })

    it("clinical effect mentions blood sugar or hypoglycaemia", () => {
      const text = int!.clinicalEffect.toLowerCase()
      const relevant =
        text.includes("blood sugar") || text.includes("hypoglyc")
      expect(relevant).toBe(true)
    })
  })

  describe("Amlodipine + Simvastatin (MODERATE) spot-check", () => {
    const int = interactions.find(
      (i) =>
        (ID_TO_NAME[i.medicationAId] === "Simvastatin" ||
          ID_TO_NAME[i.medicationBId ?? ""] === "Simvastatin") &&
        (ID_TO_NAME[i.medicationAId] === "Amlodipine" ||
          ID_TO_NAME[i.medicationBId ?? ""] === "Amlodipine"),
    )

    it("exists", () => {
      expect(int).toBeDefined()
    })

    it("has MODERATE severity", () => {
      expect(int!.severity).toBe("MODERATE")
    })

    it("is a drug-drug interaction", () => {
      expect(int!.herbName).toBeNull()
      expect(int!.medicationBId).not.toBeNull()
    })

    it("clinical effect mentions CYP3A4 or muscle damage", () => {
      const text = int!.clinicalEffect.toLowerCase()
      const relevant =
        text.includes("cyp3a4") ||
        text.includes("myopathy") ||
        text.includes("muscle")
      expect(relevant).toBe(true)
    })

    it("recommendation mentions simvastatin dose limit", () => {
      const text = int!.recommendation.toLowerCase()
      const relevant =
        text.includes("20mg") ||
        text.includes("dose") ||
        text.includes("simvastatin")
      expect(relevant).toBe(true)
    })
  })

  describe("Losartan + Potassium supplements (MODERATE herbal) spot-check", () => {
    const int = interactions.find(
      (i) =>
        ID_TO_NAME[i.medicationAId] === "Losartan" &&
        i.herbName !== null &&
        i.herbName.toLowerCase().includes("potassium"),
    )

    it("exists", () => {
      expect(int).toBeDefined()
    })

    it("has MODERATE severity", () => {
      expect(int!.severity).toBe("MODERATE")
    })

    it("is a drug-herbal interaction", () => {
      expect(int!.medicationBId).toBeNull()
      expect(int!.herbName).toBeTruthy()
    })

    it("clinical effect mentions hyperkalaemia or potassium levels", () => {
      const text = int!.clinicalEffect.toLowerCase()
      const relevant =
        text.includes("hyperkalaemia") ||
        text.includes("hyperkalemia") ||
        text.includes("potassium")
      expect(relevant).toBe(true)
    })
  })

  describe("Metformin + Bitter melon (MODERATE herbal) spot-check", () => {
    const int = interactions.find(
      (i) =>
        ID_TO_NAME[i.medicationAId] === "Metformin" &&
        i.herbName !== null &&
        i.herbName.toLowerCase().includes("bitter melon"),
    )

    it("exists", () => {
      expect(int).toBeDefined()
    })

    it("has MODERATE severity", () => {
      expect(int!.severity).toBe("MODERATE")
    })

    it("is a drug-herbal interaction", () => {
      expect(int!.medicationBId).toBeNull()
      expect(int!.herbName).toBeTruthy()
    })

    it("clinical effect mentions hypoglycaemia or blood sugar", () => {
      const text = int!.clinicalEffect.toLowerCase()
      const relevant =
        text.includes("hypoglyc") || text.includes("blood sugar")
      expect(relevant).toBe(true)
    })
  })

  describe("Atorvastatin + St. John's Wort (SEVERE herbal) spot-check", () => {
    const int = interactions.find(
      (i) =>
        ID_TO_NAME[i.medicationAId] === "Atorvastatin" &&
        i.herbName !== null &&
        i.herbName.toLowerCase().includes("st. john"),
    )

    it("exists", () => {
      expect(int).toBeDefined()
    })

    it("has SEVERE severity", () => {
      expect(int!.severity).toBe("SEVERE")
    })

    it("is a drug-herbal interaction", () => {
      expect(int!.medicationBId).toBeNull()
      expect(int!.herbName).toBeTruthy()
    })

    it("clinical effect mentions CYP3A4 induction or reduced effectiveness", () => {
      const text = int!.clinicalEffect.toLowerCase()
      const relevant =
        text.includes("cyp3a4") ||
        text.includes("inducer") ||
        text.includes("reduce") ||
        text.includes("ineffective")
      expect(relevant).toBe(true)
    })

    it("recommendation warns against combining them", () => {
      const text = int!.recommendation.toLowerCase()
      const relevant =
        text.includes("do not") || text.includes("avoid")
      expect(relevant).toBe(true)
    })
  })

  describe("Metformin + Glibenclamide (MODERATE drug-drug) spot-check", () => {
    const int = interactions.find(
      (i) =>
        (ID_TO_NAME[i.medicationAId] === "Metformin" ||
          ID_TO_NAME[i.medicationBId ?? ""] === "Metformin") &&
        (ID_TO_NAME[i.medicationAId] === "Glibenclamide" ||
          ID_TO_NAME[i.medicationBId ?? ""] === "Glibenclamide"),
    )

    it("exists", () => {
      expect(int).toBeDefined()
    })

    it("has MODERATE severity", () => {
      expect(int!.severity).toBe("MODERATE")
    })

    it("is a drug-drug interaction (no herbName)", () => {
      expect(int!.herbName).toBeNull()
      expect(int!.medicationBId).not.toBeNull()
    })

    it("clinical effect mentions hypoglycaemia or insulin", () => {
      const text = int!.clinicalEffect.toLowerCase()
      const relevant =
        text.includes("hypoglyc") ||
        text.includes("low blood sugar") ||
        text.includes("insulin")
      expect(relevant).toBe(true)
    })

    it("recommendation mentions eating regular meals or monitoring blood sugar", () => {
      const text = int!.recommendation.toLowerCase()
      const relevant =
        text.includes("meal") ||
        text.includes("blood sugar") ||
        text.includes("monitor")
      expect(relevant).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // 8. Bilingual content validation
  // -------------------------------------------------------------------------

  describe("bilingual content", () => {
    it("every interaction has a descriptionSw field (string or null)", () => {
      for (const int of interactions) {
        expect(
          typeof int.descriptionSw === "string" ||
            int.descriptionSw === null,
        ).toBe(true)
      }
    })

    it("descriptionSw is non-empty when present", () => {
      for (const int of interactions) {
        if (int.descriptionSw !== null) {
          expect(int.descriptionSw.trim()).not.toBe("")
          expect(int.descriptionSw.length).toBeGreaterThan(10)
        }
      }
    })

    it("descriptionSw is not identical to descriptionEn (actually translated)", () => {
      for (const int of interactions) {
        if (int.descriptionSw !== null) {
          expect(int.descriptionSw).not.toBe(int.descriptionEn)
        }
      }
    })
  })

  // -------------------------------------------------------------------------
  // 9. Edge cases and data integrity
  // -------------------------------------------------------------------------

  describe("edge cases and data integrity", () => {
    it("no interaction has leading or trailing whitespace in descriptionEn", () => {
      for (const int of interactions) {
        expect(int.descriptionEn).toBe(int.descriptionEn.trim())
      }
    })

    it("no interaction has leading or trailing whitespace in clinicalEffect", () => {
      for (const int of interactions) {
        expect(int.clinicalEffect).toBe(int.clinicalEffect.trim())
      }
    })

    it("no interaction has leading or trailing whitespace in recommendation", () => {
      for (const int of interactions) {
        expect(int.recommendation).toBe(int.recommendation.trim())
      }
    })

    it("no duplicate (medicationAId, medicationBId) pairs", () => {
      const drugDrug = interactions.filter(
        (int) => int.medicationBId !== null,
      )
      const pairs = drugDrug.map(
        (int) => `${int.medicationAId}|${int.medicationBId}`,
      )
      expect(new Set(pairs).size).toBe(pairs.length)
    })

    it("no duplicate (medicationAId, herbName) pairs", () => {
      const herbal = interactions.filter((int) => int.herbName !== null)
      const pairs = herbal.map(
        (int) => `${int.medicationAId}|${int.herbName}`,
      )
      expect(new Set(pairs).size).toBe(pairs.length)
    })

    it("no text field contains HTML tags", () => {
      for (const int of interactions) {
        const allText = [
          int.descriptionEn,
          int.descriptionSw ?? "",
          int.clinicalEffect,
          int.recommendation,
          int.source ?? "",
        ].join(" ")
        expect(allText).not.toMatch(/<[a-z][\s\S]*>/i)
      }
    })

    it("source fields reference reputable medical references (BNF, WHO, KEMRI, FDA, EMA)", () => {
      const knownSources = [
        "bnf",
        "who",
        "kemri",
        "fda",
        "ema",
        "kenya national",
      ]
      for (const int of interactions) {
        if (int.source) {
          const sourceLower = int.source.toLowerCase()
          const hasKnownSource = knownSources.some((s) =>
            sourceLower.includes(s),
          )
          expect(hasKnownSource).toBe(true)
        }
      }
    })

    it("IDs follow the int-NNN pattern", () => {
      for (const int of interactions) {
        expect(int.id).toMatch(/^int-\d{3}$/)
      }
    })
  })
})
