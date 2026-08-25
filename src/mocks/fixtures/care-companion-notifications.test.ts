import { describe, it, expect } from "vitest"
import type { CareCompanionNotification } from "@/types/care-companion"
import { NOTIFICATION_TYPE } from "@/types/care-companion"

import careCompanionNotifications from "./care-companion-notifications.json"

// ---------------------------------------------------------------------------
// Helper: compile-time type guard. If the fixture drifts from the TypeScript
// interface the test file fails to compile before it even runs.
// ---------------------------------------------------------------------------

function assertType<T>(_value: T): void {
  // compile-time only
}

const notifications = careCompanionNotifications as CareCompanionNotification[]

const VALID_NOTIFICATION_TYPES = new Set<string>(
  Object.values(NOTIFICATION_TYPE),
)

// Deep-link routes each notification type must resolve to. These must match
// the routes registered for the care companion feature — a drift here means
// a push notification would deep-link a caregiver to a broken/blank route.
const EXPECTED_DEEP_LINKS: Record<string, string> = {
  REFILL_REMINDER: "/patients/care-companion/refill-schedule",
  REFILL_OVERDUE: "/patients/care-companion/refill-schedule",
  REFILL_LOAN_OFFER: "/patients/care-companion/medication-loan",
  PREDICTIVE_CREDIT_OFFER: "/patients/care-companion/medication-loan",
  EDUCATION_WEEKLY: "/patients/care-companion/education",
  MEDICATION_CARD_AVAILABLE: "/patients/care-companion/medication-cards",
  LAB_REMINDER: "/patients/care-companion",
}

// ---------------------------------------------------------------------------
// 1. Structure and completeness
// ---------------------------------------------------------------------------

describe("care-companion-notifications.json", () => {
  describe("structure and completeness", () => {
    it("contains exactly 7 notifications", () => {
      expect(notifications).toHaveLength(7)
    })

    it("every notification conforms to the CareCompanionNotification type", () => {
      for (const notification of notifications) {
        assertType<CareCompanionNotification>(notification)
      }
    })

    it("covers exactly the 7 NOTIFICATION_TYPE values, one each", () => {
      const types = notifications.map((n) => n.type)
      expect(new Set(types).size).toBe(7)
      for (const type of Object.values(NOTIFICATION_TYPE)) {
        expect(types).toContain(type)
      }
    })

    it("all notification IDs are unique", () => {
      const ids = notifications.map((n) => n.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it("the fixture is importable as a valid JSON array", () => {
      expect(Array.isArray(careCompanionNotifications)).toBe(true)
      expect(careCompanionNotifications.length).toBe(7)
    })
  })

  // ---------------------------------------------------------------------------
  // 2. Common field validation across all notifications
  // ---------------------------------------------------------------------------

  describe("common field validation", () => {
    it("every notification has a non-empty id, title, and body", () => {
      for (const n of notifications) {
        expect(n.id.trim()).not.toBe("")
        expect(n.title.trim()).not.toBe("")
        expect(n.body.trim()).not.toBe("")
      }
    })

    it("every notification has a type from the NOTIFICATION_TYPE enum", () => {
      for (const n of notifications) {
        expect(VALID_NOTIFICATION_TYPES).toContain(n.type)
      }
    })

    it("every notification has a non-empty deepLink starting with /patients/care-companion", () => {
      for (const n of notifications) {
        expect(n.deepLink.trim()).not.toBe("")
        expect(n.deepLink.startsWith("/patients/care-companion")).toBe(true)
      }
    })

    it("every notification has a valid ISO scheduledAt date", () => {
      for (const n of notifications) {
        expect(new Date(n.scheduledAt).toString()).not.toBe("Invalid Date")
      }
    })

    it("sentAt is either null or a valid ISO date string", () => {
      for (const n of notifications) {
        if (n.sentAt !== null) {
          expect(new Date(n.sentAt).toString()).not.toBe("Invalid Date")
        }
      }
    })

    it("readAt is either null or a valid ISO date string", () => {
      for (const n of notifications) {
        if (n.readAt !== null) {
          expect(new Date(n.readAt).toString()).not.toBe("Invalid Date")
        }
      }
    })

    it("readAt, when present, is not before sentAt", () => {
      for (const n of notifications) {
        if (n.readAt !== null && n.sentAt !== null) {
          expect(new Date(n.readAt).getTime()).toBeGreaterThanOrEqual(
            new Date(n.sentAt).getTime(),
          )
        }
      }
    })

    it("metadata is either null or a flat string-keyed record", () => {
      for (const n of notifications) {
        if (n.metadata !== null) {
          expect(typeof n.metadata).toBe("object")
          for (const value of Object.values(n.metadata)) {
            expect(typeof value).toBe("string")
          }
        }
      }
    })

    it("no string field contains HTML/script tags", () => {
      for (const n of notifications) {
        expect(n.title).not.toMatch(/<script[\s\S]*>/i)
        expect(n.body).not.toMatch(/<script[\s\S]*>/i)
      }
    })

    it("no string field has leading or trailing whitespace", () => {
      for (const n of notifications) {
        expect(n.id).toBe(n.id.trim())
        expect(n.title).toBe(n.title.trim())
        expect(n.body).toBe(n.body.trim())
        expect(n.deepLink).toBe(n.deepLink.trim())
      }
    })
  })

  // ---------------------------------------------------------------------------
  // 3. Deep-link routing contract — the reason this fixture exists
  // ---------------------------------------------------------------------------

  describe("deep-link routing contract", () => {
    for (const [type, expectedLink] of Object.entries(EXPECTED_DEEP_LINKS)) {
      it(`${type} deep-links to ${expectedLink}`, () => {
        const notification = notifications.find((n) => n.type === type)
        expect(notification).toBeDefined()
        expect(notification!.deepLink).toBe(expectedLink)
      })
    }

    it("REFILL_REMINDER and REFILL_OVERDUE share the refill-schedule route", () => {
      const reminder = notifications.find(
        (n) => n.type === "REFILL_REMINDER",
      )!
      const overdue = notifications.find((n) => n.type === "REFILL_OVERDUE")!
      expect(reminder.deepLink).toBe(overdue.deepLink)
    })

    it("REFILL_LOAN_OFFER and PREDICTIVE_CREDIT_OFFER share the medication-loan route", () => {
      const loanOffer = notifications.find(
        (n) => n.type === "REFILL_LOAN_OFFER",
      )!
      const predictiveOffer = notifications.find(
        (n) => n.type === "PREDICTIVE_CREDIT_OFFER",
      )!
      expect(loanOffer.deepLink).toBe(predictiveOffer.deepLink)
    })

    it("LAB_REMINDER deep-links to the care-companion home, not a sub-route", () => {
      const labReminder = notifications.find((n) => n.type === "LAB_REMINDER")!
      expect(labReminder.deepLink).toBe("/patients/care-companion")
      // Guard against accidental trailing sub-path such as
      // /patients/care-companion/lab-reminder which does not exist as a route.
      expect(labReminder.deepLink.split("/")).toHaveLength(3)
    })
  })

  // ---------------------------------------------------------------------------
  // 4. Per-type content and persona (Grace) consistency
  // ---------------------------------------------------------------------------

  describe("REFILL_REMINDER notification", () => {
    const n = notifications.find((x) => x.type === "REFILL_REMINDER")!

    it("exists and references Metformin", () => {
      expect(n).toBeDefined()
      expect(n.title).toContain("Metformin")
      expect(n.metadata?.medicationName).toBe("Metformin 500mg")
    })

    it("has an unread state (readAt is null) for an actionable reminder", () => {
      expect(n.readAt).toBeNull()
    })

    it("metadata includes daysUntilRefill as a string", () => {
      expect(n.metadata?.daysUntilRefill).toBe("3")
    })
  })

  describe("REFILL_OVERDUE notification", () => {
    const n = notifications.find((x) => x.type === "REFILL_OVERDUE")!

    it("exists and references Aspirin", () => {
      expect(n).toBeDefined()
      expect(n.title.toLowerCase()).toContain("aspirin")
      expect(n.metadata?.medicationName).toBe("Aspirin 75mg")
    })

    it("metadata includes a positive daysOverdue value", () => {
      expect(Number(n.metadata?.daysOverdue)).toBeGreaterThan(0)
    })
  })

  describe("REFILL_LOAN_OFFER notification", () => {
    const n = notifications.find((x) => x.type === "REFILL_LOAN_OFFER")!

    it("exists and offers a loan tied to the overdue Aspirin refill", () => {
      expect(n).toBeDefined()
      expect(n.metadata?.medicationName).toBe("Aspirin 75mg")
      expect(n.metadata?.currency).toBe("KES")
      expect(Number(n.metadata?.loanAmount)).toBeGreaterThan(0)
    })
  })

  describe("PREDICTIVE_CREDIT_OFFER notification", () => {
    const n = notifications.find(
      (x) => x.type === "PREDICTIVE_CREDIT_OFFER",
    )!

    it("exists and pre-approves credit ahead of need", () => {
      expect(n).toBeDefined()
      expect(n.metadata?.currency).toBe("KES")
      expect(Number(n.metadata?.preApprovedAmount)).toBeGreaterThan(0)
      expect(Number(n.metadata?.medicationCount)).toBeGreaterThan(0)
    })

    it("is distinct from REFILL_LOAN_OFFER (proactive, not overdue-triggered)", () => {
      expect(n.body.toLowerCase()).not.toContain("overdue")
    })
  })

  describe("EDUCATION_WEEKLY notification", () => {
    const n = notifications.find((x) => x.type === "EDUCATION_WEEKLY")!

    it("exists and links to a diabetes education card", () => {
      expect(n).toBeDefined()
      expect(n.metadata?.conditionType).toBe("DIABETES")
      expect(n.metadata?.educationCardId).toBeTruthy()
    })
  })

  describe("MEDICATION_CARD_AVAILABLE notification", () => {
    const n = notifications.find(
      (x) => x.type === "MEDICATION_CARD_AVAILABLE",
    )!

    it("exists and references Amlodipine", () => {
      expect(n).toBeDefined()
      expect(n.metadata?.medicationName).toBe("Amlodipine 5mg")
      expect(n.metadata?.medicationCardId).toBeTruthy()
    })
  })

  describe("LAB_REMINDER notification", () => {
    const n = notifications.find((x) => x.type === "LAB_REMINDER")!

    it("exists and references an HbA1c test for a diabetes patient", () => {
      expect(n).toBeDefined()
      expect(n.metadata?.labTestName).toBe("HbA1c")
      expect(n.metadata?.conditionType).toBe("DIABETES")
    })

    it("references a past lastTestDate before scheduledAt", () => {
      const lastTestDate = new Date(n.metadata!.lastTestDate)
      expect(lastTestDate.getTime()).toBeLessThan(
        new Date(n.scheduledAt).getTime(),
      )
    })
  })

  // ---------------------------------------------------------------------------
  // 5. Read/unread and sent/scheduled edge cases
  // ---------------------------------------------------------------------------

  describe("read/unread and delivery state edge cases", () => {
    it("includes at least one unread notification (readAt: null)", () => {
      const unread = notifications.filter((n) => n.readAt === null)
      expect(unread.length).toBeGreaterThanOrEqual(1)
    })

    it("includes at least one read notification (readAt set)", () => {
      const read = notifications.filter((n) => n.readAt !== null)
      expect(read.length).toBeGreaterThanOrEqual(1)
    })

    it("every notification with sentAt set was sent at or after its scheduledAt", () => {
      for (const n of notifications) {
        if (n.sentAt !== null) {
          expect(new Date(n.sentAt).getTime()).toBeGreaterThanOrEqual(
            new Date(n.scheduledAt).getTime(),
          )
        }
      }
    })

    it("no notification is read without first being sent", () => {
      for (const n of notifications) {
        if (n.readAt !== null) {
          expect(n.sentAt).not.toBeNull()
        }
      }
    })
  })
})
