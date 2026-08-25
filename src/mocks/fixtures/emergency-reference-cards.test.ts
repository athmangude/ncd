import { describe, it, expect } from "vitest"
import type {
  EmergencyReferenceCard,
  WarningSymptom,
  ImmediateAction,
} from "@/types/care-companion"

import emergencyReferenceCards from "./emergency-reference-cards.json"

// ---------------------------------------------------------------------------
// Helper: compile-time type guard. If the fixture drifts from the TypeScript
// interface the test file fails to compile before it even runs.
// ---------------------------------------------------------------------------

function assertType<T>(_value: T): void {
  // compile-time only
}

const cards = emergencyReferenceCards as EmergencyReferenceCard[]

// ---------------------------------------------------------------------------
// 1. Structure and completeness
// ---------------------------------------------------------------------------

describe("emergency-reference-cards.json", () => {
  describe("structure and completeness", () => {
    it("contains exactly 6 cards", () => {
      expect(cards).toHaveLength(6)
    })

    it("every card conforms to the EmergencyReferenceCard type", () => {
      for (const card of cards) {
        assertType<EmergencyReferenceCard>(card)
      }
    })

    it("covers all 3 condition types: HYPERTENSION, DIABETES, GENERAL", () => {
      const conditionTypes = new Set(cards.map((c) => c.conditionType))
      expect(conditionTypes).toContain("HYPERTENSION")
      expect(conditionTypes).toContain("DIABETES")
      expect(conditionTypes).toContain("GENERAL")
      expect(conditionTypes.size).toBe(3)
    })

    it("covers both locales: EN and SW", () => {
      const locales = new Set(cards.map((c) => c.locale))
      expect(locales).toContain("EN")
      expect(locales).toContain("SW")
      expect(locales.size).toBe(2)
    })

    it("has exactly one card per conditionType+locale combination", () => {
      const combos = cards.map((c) => `${c.conditionType}/${c.locale}`)
      expect(new Set(combos).size).toBe(combos.length)
      expect(combos).toContain("HYPERTENSION/EN")
      expect(combos).toContain("HYPERTENSION/SW")
      expect(combos).toContain("DIABETES/EN")
      expect(combos).toContain("DIABETES/SW")
      expect(combos).toContain("GENERAL/EN")
      expect(combos).toContain("GENERAL/SW")
    })

    it("all cards have unique IDs", () => {
      const ids = cards.map((c) => c.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it("all cards have isPublished: true", () => {
      for (const card of cards) {
        expect(card.isPublished).toBe(true)
      }
    })

    it("all cards have version: 1", () => {
      for (const card of cards) {
        expect(card.version).toBe(1)
      }
    })
  })

  // ---------------------------------------------------------------------------
  // 2. Common field validation across all cards
  // ---------------------------------------------------------------------------

  describe("common field validation", () => {
    it("every card has a non-empty title", () => {
      for (const card of cards) {
        expect(card.title).toBeTruthy()
        expect(card.title.length).toBeGreaterThan(5)
      }
    })

    it("every card has a non-empty id", () => {
      for (const card of cards) {
        expect(card.id).toBeTruthy()
      }
    })

    it("every card has at least 3 warning symptoms", () => {
      for (const card of cards) {
        expect(card.warningSymptoms.length).toBeGreaterThanOrEqual(3)
      }
    })

    it("every card has at least 3 immediate actions", () => {
      for (const card of cards) {
        expect(card.immediateActions.length).toBeGreaterThanOrEqual(3)
      }
    })

    it("every card has at least 3 whenToGoToER entries", () => {
      for (const card of cards) {
        expect(card.whenToGoToER.length).toBeGreaterThanOrEqual(3)
      }
    })

    it("every card has at least 2 doNotDo entries (non-null)", () => {
      for (const card of cards) {
        expect(card.doNotDo).not.toBeNull()
        expect(card.doNotDo!.length).toBeGreaterThanOrEqual(2)
      }
    })

    it("warning symptoms all have valid severity values", () => {
      for (const card of cards) {
        for (const ws of card.warningSymptoms) {
          assertType<WarningSymptom>(ws)
          expect(["warning", "critical"]).toContain(ws.severity)
          expect(ws.symptom).toBeTruthy()
        }
      }
    })

    it("every card includes both warning and critical severity symptoms", () => {
      for (const card of cards) {
        const severities = new Set(card.warningSymptoms.map((ws) => ws.severity))
        expect(severities).toContain("warning")
        expect(severities).toContain("critical")
      }
    })

    it("immediate actions are numbered sequentially starting from 1", () => {
      for (const card of cards) {
        card.immediateActions.forEach((action, index) => {
          assertType<ImmediateAction>(action)
          expect(action.step).toBe(index + 1)
          expect(action.action).toBeTruthy()
        })
      }
    })

    it("whenToGoToER entries are all non-empty strings", () => {
      for (const card of cards) {
        for (const entry of card.whenToGoToER) {
          expect(typeof entry).toBe("string")
          expect(entry.length).toBeGreaterThan(5)
        }
      }
    })

    it("doNotDo entries are all non-empty strings", () => {
      for (const card of cards) {
        for (const entry of card.doNotDo!) {
          expect(typeof entry).toBe("string")
          expect(entry.length).toBeGreaterThan(5)
        }
      }
    })
  })

  // ---------------------------------------------------------------------------
  // 3. HYPERTENSION/EN card
  // ---------------------------------------------------------------------------

  describe("HYPERTENSION/EN card", () => {
    const card = cards.find(
      (c) => c.conditionType === "HYPERTENSION" && c.locale === "EN",
    )!

    it("exists", () => {
      expect(card).toBeDefined()
    })

    it("has the correct title", () => {
      expect(card.title).toBe("Hypertension Emergency Guide")
    })

    it("contains the 5 specified warning symptoms", () => {
      const symptoms = card.warningSymptoms.map((ws) => ws.symptom)
      expect(symptoms).toContain("Severe headache that does not go away")
      expect(symptoms).toContain("Chest pain or tightness")
      expect(symptoms).toContain("Vision changes or blurred vision")
      expect(symptoms).toContain("Nosebleed that does not stop")
      expect(symptoms).toContain("Dizziness or confusion")
    })

    it("has correct severity for specified symptoms", () => {
      const bySeverity = (symptomText: string) =>
        card.warningSymptoms.find((ws) => ws.symptom === symptomText)?.severity

      expect(bySeverity("Severe headache that does not go away")).toBe(
        "critical",
      )
      expect(bySeverity("Chest pain or tightness")).toBe("critical")
      expect(bySeverity("Vision changes or blurred vision")).toBe("warning")
      expect(bySeverity("Nosebleed that does not stop")).toBe("warning")
      expect(bySeverity("Dizziness or confusion")).toBe("critical")
    })

    it("contains the 3 specified immediate actions in order", () => {
      const actions = card.immediateActions.map((a) => a.action)
      expect(actions).toContain(
        "Sit or lie the person down in a comfortable position",
      )
      expect(actions).toContain(
        "If they have prescribed medication, help them take it",
      )
      expect(actions).toContain(
        "Call emergency services or take them to the nearest hospital immediately if symptoms are severe",
      )

      // Verify ordering: sit/lie down is before medication, medication is before call emergency
      const sitIndex = actions.findIndex((a) =>
        a.includes("Sit or lie the person down"),
      )
      const medIndex = actions.findIndex((a) =>
        a.includes("prescribed medication"),
      )
      const callIndex = actions.findIndex((a) =>
        a.includes("Call emergency services"),
      )
      expect(sitIndex).toBeLessThan(medIndex)
      expect(medIndex).toBeLessThan(callIndex)
    })

    it("contains the 4 specified whenToGoToER entries", () => {
      expect(card.whenToGoToER).toContain(
        "Blood pressure reading above 180/120",
      )
      expect(card.whenToGoToER).toContain(
        "Chest pain lasting more than 5 minutes",
      )
      expect(card.whenToGoToER).toContain(
        "Sudden severe headache with confusion",
      )
      expect(card.whenToGoToER).toContain("Difficulty breathing")
    })

    it("contains the 2 specified doNotDo entries", () => {
      expect(card.doNotDo).toContain(
        "Do not give someone else medication",
      )
      expect(card.doNotDo).toContain(
        "Do not ignore symptoms hoping they will pass",
      )
    })
  })

  // ---------------------------------------------------------------------------
  // 4. HYPERTENSION/SW card
  // ---------------------------------------------------------------------------

  describe("HYPERTENSION/SW card", () => {
    const card = cards.find(
      (c) => c.conditionType === "HYPERTENSION" && c.locale === "SW",
    )!

    it("exists", () => {
      expect(card).toBeDefined()
    })

    it("has a Swahili title", () => {
      expect(card.title).toBeTruthy()
      expect(card.title).not.toBe("Hypertension Emergency Guide")
    })

    it("has the same number of sections as the EN counterpart", () => {
      const enCard = cards.find(
        (c) => c.conditionType === "HYPERTENSION" && c.locale === "EN",
      )!
      expect(card.warningSymptoms.length).toBe(enCard.warningSymptoms.length)
      expect(card.immediateActions.length).toBe(enCard.immediateActions.length)
      expect(card.whenToGoToER.length).toBe(enCard.whenToGoToER.length)
      expect(card.doNotDo!.length).toBe(enCard.doNotDo!.length)
    })

    it("severity distribution matches the EN counterpart", () => {
      const enCard = cards.find(
        (c) => c.conditionType === "HYPERTENSION" && c.locale === "EN",
      )!
      const enCriticalCount = enCard.warningSymptoms.filter(
        (ws) => ws.severity === "critical",
      ).length
      const swCriticalCount = card.warningSymptoms.filter(
        (ws) => ws.severity === "critical",
      ).length
      expect(swCriticalCount).toBe(enCriticalCount)
    })
  })

  // ---------------------------------------------------------------------------
  // 5. DIABETES/EN card
  // ---------------------------------------------------------------------------

  describe("DIABETES/EN card", () => {
    const card = cards.find(
      (c) => c.conditionType === "DIABETES" && c.locale === "EN",
    )!

    it("exists", () => {
      expect(card).toBeDefined()
    })

    it("has the correct title", () => {
      expect(card.title).toBe("Diabetes Emergency Guide")
    })

    it("covers hypoglycemia guidance (low blood sugar)", () => {
      const allText = [
        ...card.warningSymptoms.map((ws) => ws.symptom),
        ...card.immediateActions.map((a) => a.action),
        ...card.whenToGoToER,
        ...card.doNotDo!,
      ].join(" ")

      // The card should mention low blood sugar / hypoglycemia concepts
      const lowSugarMentioned =
        allText.toLowerCase().includes("low blood sugar") ||
        allText.toLowerCase().includes("hypoglyc") ||
        allText.toLowerCase().includes("below")
      expect(lowSugarMentioned).toBe(true)
    })

    it("covers hyperglycemia guidance (high blood sugar)", () => {
      const allText = [
        ...card.warningSymptoms.map((ws) => ws.symptom),
        ...card.immediateActions.map((a) => a.action),
        ...card.whenToGoToER,
        ...card.doNotDo!,
      ].join(" ")

      const highSugarMentioned =
        allText.toLowerCase().includes("high blood sugar") ||
        allText.toLowerCase().includes("hyperglyc") ||
        allText.toLowerCase().includes("above") ||
        allText.toLowerCase().includes("ketoacidosis")
      expect(highSugarMentioned).toBe(true)
    })

    it("mentions ketoacidosis as a critical symptom", () => {
      const ketoacidosis = card.warningSymptoms.find(
        (ws) =>
          ws.symptom.toLowerCase().includes("ketoacidosis") ||
          ws.symptom.toLowerCase().includes("fruity"),
      )
      expect(ketoacidosis).toBeDefined()
      expect(ketoacidosis!.severity).toBe("critical")
    })

    it("mentions loss of consciousness as a critical symptom", () => {
      const unconscious = card.warningSymptoms.find(
        (ws) =>
          ws.symptom.toLowerCase().includes("unconscious") ||
          ws.symptom.toLowerCase().includes("loss of consciousness"),
      )
      expect(unconscious).toBeDefined()
      expect(unconscious!.severity).toBe("critical")
    })

    it("immediate actions include checking blood sugar", () => {
      const checkAction = card.immediateActions.find((a) =>
        a.action.toLowerCase().includes("blood sugar"),
      )
      expect(checkAction).toBeDefined()
    })

    it("doNotDo warns against giving insulin for low blood sugar", () => {
      const insulinWarning = card.doNotDo!.find(
        (d) =>
          d.toLowerCase().includes("insulin") &&
          d.toLowerCase().includes("low blood sugar"),
      )
      expect(insulinWarning).toBeDefined()
    })

    it("doNotDo warns against giving food/drink to unconscious person", () => {
      const unconsciousWarning = card.doNotDo!.find(
        (d) =>
          d.toLowerCase().includes("unconscious") &&
          (d.toLowerCase().includes("food") ||
            d.toLowerCase().includes("drink")),
      )
      expect(unconsciousWarning).toBeDefined()
    })
  })

  // ---------------------------------------------------------------------------
  // 6. DIABETES/SW card
  // ---------------------------------------------------------------------------

  describe("DIABETES/SW card", () => {
    const card = cards.find(
      (c) => c.conditionType === "DIABETES" && c.locale === "SW",
    )!

    it("exists", () => {
      expect(card).toBeDefined()
    })

    it("has a Swahili title", () => {
      expect(card.title).toBeTruthy()
      expect(card.title).not.toBe("Diabetes Emergency Guide")
    })

    it("has the same number of sections as the EN counterpart", () => {
      const enCard = cards.find(
        (c) => c.conditionType === "DIABETES" && c.locale === "EN",
      )!
      expect(card.warningSymptoms.length).toBe(enCard.warningSymptoms.length)
      expect(card.immediateActions.length).toBe(enCard.immediateActions.length)
      expect(card.whenToGoToER.length).toBe(enCard.whenToGoToER.length)
      expect(card.doNotDo!.length).toBe(enCard.doNotDo!.length)
    })
  })

  // ---------------------------------------------------------------------------
  // 7. GENERAL/EN card
  // ---------------------------------------------------------------------------

  describe("GENERAL/EN card", () => {
    const card = cards.find(
      (c) => c.conditionType === "GENERAL" && c.locale === "EN",
    )!

    it("exists", () => {
      expect(card).toBeDefined()
    })

    it("has the correct title", () => {
      expect(card.title).toBe("General Health Emergency Guide")
    })

    it("covers broad emergency scenarios not specific to one NCD", () => {
      const allSymptoms = card.warningSymptoms
        .map((ws) => ws.symptom)
        .join(" ")
        .toLowerCase()
      // Should mention general emergency concepts
      const hasBreathing = allSymptoms.includes("breathing")
      const hasBleeding = allSymptoms.includes("bleeding")
      const hasConsciousness = allSymptoms.includes("consciousness")
      expect(hasBreathing || hasBleeding || hasConsciousness).toBe(true)
    })

    it("includes allergic reaction as a critical symptom", () => {
      const allergic = card.warningSymptoms.find((ws) =>
        ws.symptom.toLowerCase().includes("allergic"),
      )
      expect(allergic).toBeDefined()
      expect(allergic!.severity).toBe("critical")
    })

    it("immediate actions include recovery position guidance", () => {
      const recovery = card.immediateActions.find(
        (a) =>
          a.action.toLowerCase().includes("recovery position") ||
          a.action.toLowerCase().includes("on their side"),
      )
      expect(recovery).toBeDefined()
    })

    it("immediate actions include calling emergency services", () => {
      const callEmergency = card.immediateActions.find(
        (a) =>
          a.action.toLowerCase().includes("emergency services") ||
          a.action.toLowerCase().includes("call"),
      )
      expect(callEmergency).toBeDefined()
    })
  })

  // ---------------------------------------------------------------------------
  // 8. GENERAL/SW card
  // ---------------------------------------------------------------------------

  describe("GENERAL/SW card", () => {
    const card = cards.find(
      (c) => c.conditionType === "GENERAL" && c.locale === "SW",
    )!

    it("exists", () => {
      expect(card).toBeDefined()
    })

    it("has a Swahili title", () => {
      expect(card.title).toBeTruthy()
      expect(card.title).not.toBe("General Health Emergency Guide")
    })

    it("has the same number of sections as the EN counterpart", () => {
      const enCard = cards.find(
        (c) => c.conditionType === "GENERAL" && c.locale === "EN",
      )!
      expect(card.warningSymptoms.length).toBe(enCard.warningSymptoms.length)
      expect(card.immediateActions.length).toBe(enCard.immediateActions.length)
      expect(card.whenToGoToER.length).toBe(enCard.whenToGoToER.length)
      expect(card.doNotDo!.length).toBe(enCard.doNotDo!.length)
    })
  })

  // ---------------------------------------------------------------------------
  // 9. Locale parity: EN and SW cards mirror each other
  // ---------------------------------------------------------------------------

  describe("locale parity", () => {
    const conditionTypes = ["HYPERTENSION", "DIABETES", "GENERAL"] as const

    for (const condition of conditionTypes) {
      describe(`${condition}`, () => {
        const enCard = cards.find(
          (c) => c.conditionType === condition && c.locale === "EN",
        )!
        const swCard = cards.find(
          (c) => c.conditionType === condition && c.locale === "SW",
        )!

        it("EN and SW cards both exist", () => {
          expect(enCard).toBeDefined()
          expect(swCard).toBeDefined()
        })

        it("both share the same conditionType, version, and isPublished", () => {
          expect(enCard.conditionType).toBe(swCard.conditionType)
          expect(enCard.version).toBe(swCard.version)
          expect(enCard.isPublished).toBe(swCard.isPublished)
        })

        it("severity mapping is identical between EN and SW", () => {
          const enSeverities = enCard.warningSymptoms.map((ws) => ws.severity)
          const swSeverities = swCard.warningSymptoms.map((ws) => ws.severity)
          expect(enSeverities).toEqual(swSeverities)
        })

        it("immediate action step numbers match between EN and SW", () => {
          const enSteps = enCard.immediateActions.map((a) => a.step)
          const swSteps = swCard.immediateActions.map((a) => a.step)
          expect(enSteps).toEqual(swSteps)
        })

        it("SW content is not identical to EN content (actually translated)", () => {
          expect(swCard.title).not.toBe(enCard.title)
          // At least the first symptom should be different
          expect(swCard.warningSymptoms[0].symptom).not.toBe(
            enCard.warningSymptoms[0].symptom,
          )
          expect(swCard.immediateActions[0].action).not.toBe(
            enCard.immediateActions[0].action,
          )
        })
      })
    }
  })

  // ---------------------------------------------------------------------------
  // 10. Edge cases and data integrity
  // ---------------------------------------------------------------------------

  describe("edge cases and data integrity", () => {
    it("no card has an empty warningSymptoms array", () => {
      for (const card of cards) {
        expect(card.warningSymptoms.length).toBeGreaterThan(0)
      }
    })

    it("no card has an empty immediateActions array", () => {
      for (const card of cards) {
        expect(card.immediateActions.length).toBeGreaterThan(0)
      }
    })

    it("no card has an empty whenToGoToER array", () => {
      for (const card of cards) {
        expect(card.whenToGoToER.length).toBeGreaterThan(0)
      }
    })

    it("no symptom text or action text is empty or whitespace-only", () => {
      for (const card of cards) {
        for (const ws of card.warningSymptoms) {
          expect(ws.symptom.trim()).not.toBe("")
        }
        for (const action of card.immediateActions) {
          expect(action.action.trim()).not.toBe("")
        }
        for (const entry of card.whenToGoToER) {
          expect(entry.trim()).not.toBe("")
        }
        if (card.doNotDo) {
          for (const entry of card.doNotDo) {
            expect(entry.trim()).not.toBe("")
          }
        }
      }
    })

    it("no duplicate symptoms within a single card", () => {
      for (const card of cards) {
        const symptoms = card.warningSymptoms.map((ws) => ws.symptom)
        expect(new Set(symptoms).size).toBe(symptoms.length)
      }
    })

    it("no duplicate actions within a single card", () => {
      for (const card of cards) {
        const actions = card.immediateActions.map((a) => a.action)
        expect(new Set(actions).size).toBe(actions.length)
      }
    })

    it("no duplicate whenToGoToER entries within a single card", () => {
      for (const card of cards) {
        expect(new Set(card.whenToGoToER).size).toBe(card.whenToGoToER.length)
      }
    })

    it("no duplicate doNotDo entries within a single card", () => {
      for (const card of cards) {
        if (card.doNotDo) {
          expect(new Set(card.doNotDo).size).toBe(card.doNotDo.length)
        }
      }
    })

    it("conditionType values are valid ConditionType enum values", () => {
      const valid = new Set(["HYPERTENSION", "DIABETES", "GENERAL"])
      for (const card of cards) {
        expect(valid).toContain(card.conditionType)
      }
    })

    it("locale values are valid ContentLocale enum values", () => {
      const valid = new Set(["EN", "SW"])
      for (const card of cards) {
        expect(valid).toContain(card.locale)
      }
    })

    it("version is a positive integer for all cards", () => {
      for (const card of cards) {
        expect(Number.isInteger(card.version)).toBe(true)
        expect(card.version).toBeGreaterThan(0)
      }
    })

    it("the fixture is importable as a valid JSON array", () => {
      expect(Array.isArray(emergencyReferenceCards)).toBe(true)
      expect(emergencyReferenceCards.length).toBe(6)
    })
  })
})
