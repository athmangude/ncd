/**
 * Account-state seeding for the prototype.
 *
 * The default experience is a FRESH, empty, unonboarded participant who builds
 * their own profile (name, PIN, circle invites, payments, cashback all persist).
 * The rich "Amina" fixtures remain the on-demand DEMO dataset.
 *
 * - `seedFreshAccount()`  → empty profile + empty collections, logged in so the
 *   participant lands mid-onboarding (the "enter your name" step).
 * - `seedDemoAccount()`   → clear state so the rich fixtures re-seed on next read.
 * - `resetToOnboardingOnly()` → keep identity (name/PIN/ID/T&Cs), clear all
 *   financial + activity data so they can rebuild from a known-onboarded start.
 */

import { writeObject, writeCollection } from "../db"
import { LOGIN_DETAILS_KEY, getLoginDetails } from "../handlers/profile"
import { clearAllParticipantState, clearMockKeys } from "./reset"
import {
  startMockSession,
  markMockAccountCreated,
  DEFAULT_MOCK_USER_ID,
} from "../auth/session"

const KES = { countryName: "Kenya", code: "KES", id: 1 }

// Collection localStorage keys (without the `mock:` prefix) the participant builds up.
const COLLECTION_KEYS = {
  loans: "loans",
  paymentHistory: "payment-history",
  manualRequests: "manual-requests",
  network: "patient-network",
  careFundTransactions: "care-fund-transactions",
  circleActivity: "circle-activity",
  notifications: "notifications",
  fastTrackTransactions: "fast-track-transactions",
} as const

/** An empty, unonboarded profile shaped like patient-login-details.json. */
function freshLoginDetails() {
  return {
    id: DEFAULT_MOCK_USER_ID,
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "+254712345678",
    isVerified: true,
    hasVerifiedId: null,
    membershipStatus: "INACTIVE",
    hasActiveMembership: false,
    creditLimit: {
      totalCreditLimitAmount: "0",
      remainingAmount: "0",
      currency: KES,
    },
    medicalRequests: [],
    loans: [],
    wallets: [
      {
        id: "wallet-mpesa-001",
        type: "MPESA",
        remainingBalance: "0",
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "wallet-loan-001",
        type: "LOAN",
        remainingBalance: "0",
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "wallet-cashback-001",
        type: "CASHBACK",
        remainingBalance: "0",
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "wallet-card-001",
        type: "CARD",
        remainingBalance: "0",
        createdAt: "",
        updatedAt: "",
      },
    ],
    patientCircle: null,
    hasAcceptedMedicalConsentForm: false,
    hasAcceptedLatestTermsAndConditions: false,
    hasBeenReferred: false,
    hasVerifiedCrbScore: false,
    idVerificationStatus: null,
    documentVerificationStatus: null,
    network: [],
    type: "PUBLIC",
    canPayMedicalBill: false,
    orgBorrower: null,
    hasUploadedMpesaStatement: false,
    careFundAccount: {
      id: 1,
      careFundBalance: "0",
      createdAt: "2026-01-15T09:30:00.000Z",
      updatedAt: "2026-01-15T09:30:00.000Z",
      accountOwner: null,
      currency: KES,
    },
    accountReference: "JIR-NEW-001",
    subscriptions: [],
    isBasicMember: true,
    hasSetPin: false,
    profilePhoto: null,
  }
}

/** Write empty values for every participant-buildable collection. */
function writeEmptyCollections(): void {
  writeCollection(COLLECTION_KEYS.loans, [])
  writeObject(COLLECTION_KEYS.paymentHistory, {
    payments: [],
    medicalRequests: [],
  })
  writeCollection(COLLECTION_KEYS.manualRequests, [])
  writeObject(COLLECTION_KEYS.network, {
    network: [],
    invites: [],
    receivedInvites: [],
    slots: {
      auxiliary: { used: 0, max: 3, reserved: 0 },
      accountable: { used: 0, max: 2, reserved: 0 },
    },
  })
  writeObject(COLLECTION_KEYS.careFundTransactions, { transactions: [] })
  writeObject(COLLECTION_KEYS.circleActivity, { events: [] })
  writeCollection(COLLECTION_KEYS.notifications, [])
  writeCollection(COLLECTION_KEYS.fastTrackTransactions, [])
}

/**
 * Write an empty, unonboarded profile + empty collections, leaving the session
 * untouched. Called when a brand-new participant completes OTP sign-up so they
 * land mid-onboarding with their own blank profile (instead of reading the rich
 * "Amina" fixture). Does NOT clear existing state or start a session.
 */
export function seedEmptyProfile(): void {
  writeObject(LOGIN_DETAILS_KEY, freshLoginDetails())
  writeEmptyCollections()
}

/**
 * Fresh, empty, logged-in account that lands mid-onboarding. Used by the
 * "Empty onboarded (skip phone)" facilitator control to jump straight into
 * onboarding without going through the phone / OTP entry.
 */
export function seedFreshAccount(): void {
  clearAllParticipantState()
  seedEmptyProfile()
  startMockSession()
  markMockAccountCreated()
}

/**
 * Load the rich "Amina" demo dataset by clearing state so the next read of each
 * collection re-seeds from its fixture. Lands logged-in + fully onboarded.
 */
export function seedDemoAccount(): void {
  clearAllParticipantState()
  startMockSession()
  markMockAccountCreated()
}

/** Identity fields preserved by `resetToOnboardingOnly`. */
const IDENTITY_FIELDS = [
  "id",
  "firstName",
  "lastName",
  "email",
  "phoneNumber",
  "isVerified",
  "hasSetPin",
  "hasVerifiedId",
  "idVerificationStatus",
  "documentVerificationStatus",
  "hasAcceptedMedicalConsentForm",
  "hasAcceptedLatestTermsAndConditions",
  "hasBeenReferred",
  "hasVerifiedCrbScore",
  "profilePhoto",
  "accountReference",
  "type",
] as const

/**
 * Keep who the participant is (name, PIN, verified ID, T&Cs) but wipe everything
 * they did — membership, credit, cashback, loans, circle, payments — so they can
 * rebuild activity from a known-onboarded starting point.
 */
export function resetToOnboardingOnly(): void {
  const current = getLoginDetails() as Record<string, unknown>
  const base = freshLoginDetails() as Record<string, unknown>

  for (const field of IDENTITY_FIELDS) {
    if (current[field] !== undefined) base[field] = current[field]
  }

  // Clear only the mock collections (preserve session + the merged profile).
  clearMockKeys()
  writeObject(LOGIN_DETAILS_KEY, base)
  writeEmptyCollections()
}
