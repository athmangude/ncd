import { http, HttpResponse } from "msw"
import { patchObject, readObject } from "../db"
import {
  getNetwork,
  getPatientCircleSummary,
  type PatientCircleSummary,
  type NetworkMember,
} from "../domain/network"
import loginDetailsSeed from "../fixtures/patient-login-details.json"

export const LOGIN_DETAILS_KEY = "login-details"

// Derive the type from the fixture, but widen fields whose JSON literal is too
// narrow: `profilePhoto: null` would reject a string data URL, the membership
// flags toggle between values the seed literal doesn't cover, and network /
// patientCircle are surfaced from the circle domain (see getLoginDetails).
type LoginDetails = Omit<
  typeof loginDetailsSeed,
  "profilePhoto" | "membershipStatus" | "type" | "network" | "patientCircle"
> & {
  profilePhoto?: string | null
  membershipStatus?: string
  hasActiveMembership?: boolean
  type?: string
  network?: NetworkMember[]
  patientCircle?: PatientCircleSummary | null
}

// The account `type` is what the role gates (ProtectedRoute / ProtectedResource)
// check, and they expect one of these. A profile carrying anything else (e.g. a
// legacy "PATIENT") is locked out of loan/limit pages, so we normalize it.
const VALID_ACCOUNT_TYPES = ["PUBLIC", "ORG", "PLUS"]

/**
 * Current patient profile (seeded from the fixture, mutated by other handlers).
 *
 * Two derivations keep the profile coherent with the rest of the mock state:
 * - `type` is normalized to a real role so already-cached profiles aren't
 *   locked out of the loan/limit pages (upgraded → "PLUS", basic → "PUBLIC").
 * - `network` + `patientCircle` are surfaced from the circle domain so the loan
 *   gate and KYC "add 2 people" check (which read `user.network` /
 *   `user.patientCircle`) agree with the actual circle. This is why completing
 *   the upgrade flow's circle step activates the medical-loan option.
 */
export function getLoginDetails(): LoginDetails {
  const stored = readObject<LoginDetails>(LOGIN_DETAILS_KEY, loginDetailsSeed)
  const type = VALID_ACCOUNT_TYPES.includes(stored.type ?? "")
    ? stored.type
    : stored.hasActiveMembership
      ? "PLUS"
      : "PUBLIC"

  return {
    ...stored,
    type,
    network: getNetwork().network,
    patientCircle: getPatientCircleSummary(),
  }
}

/** Shallow-merge a patch into the stored profile (used by onboarding handlers). */
export function patchLoginDetails(patch: Partial<LoginDetails>): LoginDetails {
  return patchObject<LoginDetails>(LOGIN_DETAILS_KEY, loginDetailsSeed, patch)
}

export const profileHandlers = [
  http.get("/patients/login-details", () =>
    HttpResponse.json(getLoginDetails())
  ),
  http.get("/users/tenant-id", () =>
    HttpResponse.json({ tenantId: "patients" })
  ),
]
