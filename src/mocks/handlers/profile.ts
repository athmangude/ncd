import { http, HttpResponse } from "msw"
import { patchObject, readObject } from "../db"
import loginDetailsSeed from "../fixtures/patient-login-details.json"

export const LOGIN_DETAILS_KEY = "login-details"

// Derive the type from the fixture, but widen fields whose JSON literal is too
// narrow: `profilePhoto: null` would reject a string data URL, and the
// membership flags toggle between values the seed literal doesn't cover.
type LoginDetails = Omit<
  typeof loginDetailsSeed,
  "profilePhoto" | "membershipStatus" | "type"
> & {
  profilePhoto?: string | null
  membershipStatus?: string
  hasActiveMembership?: boolean
  type?: string
}

// The account `type` is what the role gates (ProtectedRoute / ProtectedResource)
// check, and they expect one of these. A profile carrying anything else (e.g. a
// legacy "PATIENT") is locked out of loan/limit pages, so we normalize it.
const VALID_ACCOUNT_TYPES = ["PUBLIC", "ORG", "PLUS"]

/**
 * Current patient profile (seeded from the fixture, mutated by other handlers).
 * Normalizes an invalid account `type` to a real role so already-cached
 * profiles aren't locked out of the loan/limit pages (no reseed required): an
 * upgraded account reads as "PLUS", a basic one as "PUBLIC".
 */
export function getLoginDetails(): LoginDetails {
  const profile = readObject<LoginDetails>(LOGIN_DETAILS_KEY, loginDetailsSeed)
  if (!VALID_ACCOUNT_TYPES.includes(profile.type ?? "")) {
    return { ...profile, type: profile.hasActiveMembership ? "PLUS" : "PUBLIC" }
  }
  return profile
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
