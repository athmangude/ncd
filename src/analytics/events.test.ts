import { describe, it, expect } from "vitest"
import { EVENTS } from "./events"

/**
 * Recursively collects all leaf string values from an object.
 */
function collectValues(obj: Record<string, unknown>): string[] {
  const values: string[] = []
  for (const val of Object.values(obj)) {
    if (typeof val === "string") {
      values.push(val)
    } else if (typeof val === "object" && val !== null) {
      values.push(...collectValues(val as Record<string, unknown>))
    }
  }
  return values
}

describe("EVENTS.CARE_COMPANION", () => {
  const CC = EVENTS.CARE_COMPANION

  // ---------------------------------------------------------------------------
  // Structural completeness
  // ---------------------------------------------------------------------------

  it("contains all 12 required sub-objects", () => {
    const expectedKeys = [
      "INTAKE",
      "HOME",
      "EMERGENCY_CARD",
      "COST_TRACKER",
      "MEDICATION_TIMELINE",
      "MEDICATION_CARDS",
      "REFILL_SCHEDULE",
      "EDUCATION",
      "PHARMACY_STOCK",
      "MEDICATION_LOAN",
      "AI_ASSISTANT",
      "ERROR",
    ]
    expect(Object.keys(CC).sort()).toEqual(expectedKeys.sort())
  })

  it("has no empty sub-objects", () => {
    for (const [key, section] of Object.entries(CC)) {
      expect(Object.keys(section).length).toBeGreaterThan(
        0,
      )
    }
  })

  it("every leaf value is a non-empty string", () => {
    const values = collectValues(CC as unknown as Record<string, unknown>)
    expect(values.length).toBeGreaterThan(0)
    for (const val of values) {
      expect(typeof val).toBe("string")
      expect(val.length).toBeGreaterThan(0)
    }
  })

  // ---------------------------------------------------------------------------
  // Naming convention: CARE_COMPANION:StageName:action-name
  // (note: the journey prefix in the string value uses a hyphen, not underscore)
  // ---------------------------------------------------------------------------

  it("every event string starts with CARE_COMPANION:", () => {
    const values = collectValues(CC as unknown as Record<string, unknown>)
    for (const val of values) {
      expect(val).toMatch(/^CARE_COMPANION:/)
    }
  })

  it("every event string follows the JOURNEY:Stage:action pattern (3 colon-separated parts)", () => {
    const values = collectValues(CC as unknown as Record<string, unknown>)
    for (const val of values) {
      const parts = val.split(":")
      expect(parts).toHaveLength(3)
      // Stage should be PascalCase (starts with uppercase)
      expect(parts[1][0]).toEqual(parts[1][0].toUpperCase())
      // Action should be lowercase kebab-case
      expect(parts[2]).toMatch(/^[a-z][a-z0-9-]*$/)
    }
  })

  // ---------------------------------------------------------------------------
  // No duplicate event strings within CARE_COMPANION
  // ---------------------------------------------------------------------------

  it("has no duplicate event strings", () => {
    const values = collectValues(CC as unknown as Record<string, unknown>)
    const unique = new Set(values)
    expect(unique.size).toBe(values.length)
  })

  // ---------------------------------------------------------------------------
  // No duplicate event strings across the entire EVENTS object
  // ---------------------------------------------------------------------------

  it("CARE_COMPANION event strings do not collide with any other journey", () => {
    const ccValues = new Set(
      collectValues(CC as unknown as Record<string, unknown>),
    )
    const allValues = collectValues(
      EVENTS as unknown as Record<string, unknown>,
    )
    const otherValues = allValues.filter((v) => !ccValues.has(v))
    for (const val of ccValues) {
      expect(otherValues).not.toContain(val)
    }
  })

  // ---------------------------------------------------------------------------
  // Per-section event checks
  // ---------------------------------------------------------------------------

  describe("INTAKE", () => {
    it("includes view, step-complete, skip, and complete events", () => {
      expect(CC.INTAKE.VIEW).toBe("CARE_COMPANION:Intake:view")
      expect(CC.INTAKE.STEP_COMPLETE).toBe(
        "CARE_COMPANION:Intake:step-complete",
      )
      expect(CC.INTAKE.SKIP).toBe("CARE_COMPANION:Intake:skip")
      expect(CC.INTAKE.COMPLETE).toBe("CARE_COMPANION:Intake:complete")
    })
  })

  describe("HOME", () => {
    it("includes view and card-tap events", () => {
      expect(CC.HOME.VIEW).toBe("CARE_COMPANION:Home:view")
      expect(CC.HOME.CARD_TAP).toBe("CARE_COMPANION:Home:card-tap")
    })

    it("includes newly added home shortcut events", () => {
      expect(CC.HOME.EMERGENCY_CARD_TAP).toBe(
        "CARE_COMPANION:Home:emergency-card-tap",
      )
      expect(CC.HOME.REFILL_CARD_TAP).toBe(
        "CARE_COMPANION:Home:refill-card-tap",
      )
      expect(CC.HOME.COST_CARD_TAP).toBe(
        "CARE_COMPANION:Home:cost-card-tap",
      )
      expect(CC.HOME.EDUCATION_CARD_VIEW).toBe(
        "CARE_COMPANION:Home:education-card-view",
      )
      expect(CC.HOME.AI_ASSISTANT_OPEN).toBe(
        "CARE_COMPANION:Home:ai-assistant-open",
      )
    })
  })

  describe("EMERGENCY_CARD", () => {
    it("includes view and transport-credit-tap events", () => {
      expect(CC.EMERGENCY_CARD.VIEW).toBe(
        "CARE_COMPANION:EmergencyCard:view",
      )
      expect(CC.EMERGENCY_CARD.TRANSPORT_CREDIT_TAP).toBe(
        "CARE_COMPANION:EmergencyCard:transport-credit-tap",
      )
    })
  })

  describe("COST_TRACKER", () => {
    it("includes view and share-tap events", () => {
      expect(CC.COST_TRACKER.VIEW).toBe("CARE_COMPANION:CostTracker:view")
      expect(CC.COST_TRACKER.SHARE_TAP).toBe(
        "CARE_COMPANION:CostTracker:share-tap",
      )
    })

    it("includes newly added cost tracker events", () => {
      expect(CC.COST_TRACKER.CATEGORY_TAP).toBe(
        "CARE_COMPANION:CostTracker:category-tap",
      )
      expect(CC.COST_TRACKER.TREND_SCROLL).toBe(
        "CARE_COMPANION:CostTracker:trend-scroll",
      )
    })
  })

  describe("MEDICATION_TIMELINE", () => {
    it("includes view, filter-change, and export-tap events", () => {
      expect(CC.MEDICATION_TIMELINE.VIEW).toBe(
        "CARE_COMPANION:MedicationTimeline:view",
      )
      expect(CC.MEDICATION_TIMELINE.FILTER_CHANGE).toBe(
        "CARE_COMPANION:MedicationTimeline:filter-change",
      )
      expect(CC.MEDICATION_TIMELINE.EXPORT_TAP).toBe(
        "CARE_COMPANION:MedicationTimeline:export-tap",
      )
    })

    it("includes newly added timeline events", () => {
      expect(CC.MEDICATION_TIMELINE.FILTER_DATE).toBe(
        "CARE_COMPANION:MedicationTimeline:filter-date",
      )
      expect(CC.MEDICATION_TIMELINE.EXPORT_SUCCESS).toBe(
        "CARE_COMPANION:MedicationTimeline:export-success",
      )
    })
  })

  describe("MEDICATION_CARDS", () => {
    it("includes view, card-expand, overlay-dismiss, and overlay-view-all events", () => {
      expect(CC.MEDICATION_CARDS.VIEW).toBe(
        "CARE_COMPANION:MedicationCards:view",
      )
      expect(CC.MEDICATION_CARDS.CARD_EXPAND).toBe(
        "CARE_COMPANION:MedicationCards:card-expand",
      )
      expect(CC.MEDICATION_CARDS.OVERLAY_DISMISS).toBe(
        "CARE_COMPANION:MedicationCards:overlay-dismiss",
      )
      expect(CC.MEDICATION_CARDS.OVERLAY_VIEW_ALL).toBe(
        "CARE_COMPANION:MedicationCards:overlay-view-all",
      )
    })

    it("includes newly added medication card events", () => {
      expect(CC.MEDICATION_CARDS.CARD_SWIPE).toBe(
        "CARE_COMPANION:MedicationCards:card-swipe",
      )
      expect(CC.MEDICATION_CARDS.INTERACTION_WARNING_TAP).toBe(
        "CARE_COMPANION:MedicationCards:interaction-warning-tap",
      )
    })
  })

  describe("REFILL_SCHEDULE", () => {
    it("includes view, find-pharmacy-tap, and apply-credit-tap events", () => {
      expect(CC.REFILL_SCHEDULE.VIEW).toBe(
        "CARE_COMPANION:RefillSchedule:view",
      )
      expect(CC.REFILL_SCHEDULE.FIND_PHARMACY_TAP).toBe(
        "CARE_COMPANION:RefillSchedule:find-pharmacy-tap",
      )
      expect(CC.REFILL_SCHEDULE.APPLY_CREDIT_TAP).toBe(
        "CARE_COMPANION:RefillSchedule:apply-credit-tap",
      )
    })

    it("includes newly added refill schedule events", () => {
      expect(CC.REFILL_SCHEDULE.ITEM_TAP).toBe(
        "CARE_COMPANION:RefillSchedule:item-tap",
      )
    })
  })

  describe("EDUCATION", () => {
    it("includes view, card-viewed, and previous-cards-tap events", () => {
      expect(CC.EDUCATION.VIEW).toBe("CARE_COMPANION:Education:view")
      expect(CC.EDUCATION.CARD_VIEWED).toBe(
        "CARE_COMPANION:Education:card-viewed",
      )
      expect(CC.EDUCATION.PREVIOUS_CARDS_TAP).toBe(
        "CARE_COMPANION:Education:previous-cards-tap",
      )
    })

    it("includes newly added education events", () => {
      expect(CC.EDUCATION.CARD_COMPLETE).toBe(
        "CARE_COMPANION:Education:card-complete",
      )
    })
  })

  describe("PHARMACY_STOCK", () => {
    it("includes view, search, and map-toggle events", () => {
      expect(CC.PHARMACY_STOCK.VIEW).toBe(
        "CARE_COMPANION:PharmacyStock:view",
      )
      expect(CC.PHARMACY_STOCK.SEARCH).toBe(
        "CARE_COMPANION:PharmacyStock:search",
      )
      expect(CC.PHARMACY_STOCK.MAP_TOGGLE).toBe(
        "CARE_COMPANION:PharmacyStock:map-toggle",
      )
    })

    it("includes newly added pharmacy stock events", () => {
      expect(CC.PHARMACY_STOCK.LOCATION_GRANTED).toBe(
        "CARE_COMPANION:PharmacyStock:location-granted",
      )
      expect(CC.PHARMACY_STOCK.LOCATION_DENIED).toBe(
        "CARE_COMPANION:PharmacyStock:location-denied",
      )
      expect(CC.PHARMACY_STOCK.MANUAL_LOCATION).toBe(
        "CARE_COMPANION:PharmacyStock:manual-location",
      )
    })
  })

  describe("MEDICATION_LOAN", () => {
    it("includes view, accept-tap, and decline-tap events", () => {
      expect(CC.MEDICATION_LOAN.VIEW).toBe(
        "CARE_COMPANION:MedicationLoan:view",
      )
      expect(CC.MEDICATION_LOAN.ACCEPT_TAP).toBe(
        "CARE_COMPANION:MedicationLoan:accept-tap",
      )
      expect(CC.MEDICATION_LOAN.DECLINE_TAP).toBe(
        "CARE_COMPANION:MedicationLoan:decline-tap",
      )
    })

    it("includes newly added medication loan events", () => {
      expect(CC.MEDICATION_LOAN.PRE_APPROVAL_VIEW).toBe(
        "CARE_COMPANION:MedicationLoan:pre-approval-view",
      )
    })
  })

  describe("AI_ASSISTANT", () => {
    it("includes view, message-send, and suggested-action-tap events", () => {
      expect(CC.AI_ASSISTANT.VIEW).toBe(
        "CARE_COMPANION:AiAssistant:view",
      )
      expect(CC.AI_ASSISTANT.MESSAGE_SEND).toBe(
        "CARE_COMPANION:AiAssistant:message-send",
      )
      expect(CC.AI_ASSISTANT.SUGGESTED_ACTION_TAP).toBe(
        "CARE_COMPANION:AiAssistant:suggested-action-tap",
      )
    })

    it("includes newly added AI assistant events", () => {
      expect(CC.AI_ASSISTANT.INTERACTION_CHECK).toBe(
        "CARE_COMPANION:AiAssistant:interaction-check",
      )
      expect(CC.AI_ASSISTANT.GUARDRAIL_TRIGGERED).toBe(
        "CARE_COMPANION:AiAssistant:guardrail-triggered",
      )
      expect(CC.AI_ASSISTANT.REPORT_INACCURATE).toBe(
        "CARE_COMPANION:AiAssistant:report-inaccurate",
      )
    })
  })

  describe("ERROR", () => {
    it("includes boundary-hit and retry-tap events", () => {
      expect(CC.ERROR.BOUNDARY_HIT).toBe(
        "CARE_COMPANION:Error:boundary-hit",
      )
      expect(CC.ERROR.RETRY_TAP).toBe(
        "CARE_COMPANION:Error:retry-tap",
      )
    })
  })

  // ---------------------------------------------------------------------------
  // Every sub-section has a VIEW event (screen views are required)
  // ---------------------------------------------------------------------------

  it("every sub-section includes a VIEW event (except ERROR)", () => {
    for (const [key, section] of Object.entries(CC)) {
      if (key === "ERROR") continue
      expect(
        (section as Record<string, string>).VIEW,
      ).toBeDefined()
    }
  })

  // ---------------------------------------------------------------------------
  // Total event count guard — catches accidental deletions
  // ---------------------------------------------------------------------------

  it("contains exactly 54 total events across all sub-sections", () => {
    const values = collectValues(CC as unknown as Record<string, unknown>)
    expect(values).toHaveLength(54)
  })
})
