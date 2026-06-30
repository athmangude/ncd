/**
 * Reset helpers for usability testing.
 *
 * `resetMockState` wipes everything a previous participant did and re-seeds a
 * fresh, fully-onboarded account so the next interview starts from scratch.
 * `resetCollection` undoes a single area (e.g. restore the seeded cashback or
 * clear applied loans) for mid-test recovery. Callers reload the app afterwards
 * so React Query refetches against the reset state.
 */

import { markMockAccountCreated, startMockSession } from "../auth/session"
import { writeCollection, writeObject } from "../db"

const MOCK_PREFIX = "mock:"

// Mock-session + returning-user flags.
export const SESSION_KEYS = [
  "mock_session_exists",
  "mock_user_id",
  "mock_has_account",
]

// App-side flow keys written outside the `mock:` namespace (loan request flow,
// KYC circle members, QR invite tokens, persisted payment state, etc.).
export const APP_FLOW_KEYS = [
  "approved_patient_phone_number",
  "patientReviewInvoice",
  "manualPaymentRequestId",
  "paymentId",
  "paymentResponse",
  "patientSelectPatient",
  "patientTreatmentDetails",
  "kyc_circle_members",
  "fast-track-storage",
  "qrToken",
  "qrSignature",
  "inviteId",
]

/** Remove every `mock:*` localStorage entry. */
export function clearMockKeys(): void {
  const toRemove: string[] = []
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (key && key.startsWith(MOCK_PREFIX)) toRemove.push(key)
  }
  toRemove.forEach((key) => localStorage.removeItem(key))
}

/**
 * Wipe all participant state and re-establish a fresh, fully-onboarded session.
 * The handlers re-seed each collection from its fixture on the next read, so
 * after the caller reloads the app the participant lands logged-in on the
 * default seeded account.
 */
/**
 * Wipe every trace of participant state: `mock:*` collections, session +
 * returning-user flags, app-flow keys, the discovery tab cache and the offline
 * IndexedDB. Leaves no session — callers decide whether to start one.
 */
export function clearAllParticipantState(): void {
  clearMockKeys()
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key))
  APP_FLOW_KEYS.forEach((key) => localStorage.removeItem(key))

  try {
    window.sessionStorage.removeItem("discovery_tab_state")
    window.sessionStorage.removeItem("sw-purged")
  } catch {
    // ignore — sessionStorage may be unavailable
  }

  try {
    window.indexedDB?.deleteDatabase("JirehHealthDB")
  } catch {
    // ignore — offline cache is best-effort
  }
}

export function resetMockState(): void {
  clearAllParticipantState()

  // Land the next load straight in the app as the seeded returning user.
  startMockSession()
  markMockAccountCreated()
}

/**
 * Reset a single mock collection by its key (without the `mock:` prefix), e.g.
 * "care-fund-transactions", "loans", "payment-history", "patient-network",
 * "login-details". The next handler read re-seeds it from the fixture.
 */
export function resetCollection(key: string): void {
  localStorage.removeItem(MOCK_PREFIX + key)
}

/**
 * Empty a single mock collection while preserving its shape. Unlike
 * `resetCollection` (which re-seeds from the fixture on next read), this writes
 * the empty value so the area reads as genuinely cleared — used by the
 * Facilitator Tools "Clear" actions. Object-shaped collections (payment-history,
 * the network, the ledgers) get their empty object so a consumer never reads an
 * array where it expects `{ payments, … }`. Unknown keys fall back to `[]`.
 */
export function clearCollection(key: string): void {
  switch (key) {
    case "payment-history":
      writeObject(key, { payments: [], medicalRequests: [] })
      return
    case "patient-network":
      writeObject(key, {
        network: [],
        invites: [],
        receivedInvites: [],
        slots: {
          auxiliary: { used: 0, max: 3, reserved: 0 },
          accountable: { used: 0, max: 2, reserved: 0 },
        },
      })
      return
    case "care-fund-transactions":
      writeObject(key, { transactions: [] })
      return
    case "circle-activity":
      writeObject(key, { events: [] })
      return
    default:
      writeCollection(key, [])
  }
}
