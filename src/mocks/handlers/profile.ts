import { http, HttpResponse } from "msw"
import { patchObject, readObject } from "../db"
import loginDetailsSeed from "../fixtures/patient-login-details.json"

export const LOGIN_DETAILS_KEY = "login-details"

// Derive the type from the fixture, but widen fields whose JSON literal is too
// narrow: `profilePhoto: null` would reject a string data URL, and the
// membership flags toggle between values the seed literal doesn't cover.
type LoginDetails = Omit<
  typeof loginDetailsSeed,
  "profilePhoto" | "membershipStatus"
> & {
  profilePhoto?: string | null
  membershipStatus?: string
  hasActiveMembership?: boolean
}

/** Current patient profile (seeded from the fixture, mutated by other handlers). */
export function getLoginDetails(): LoginDetails {
  return readObject<LoginDetails>(LOGIN_DETAILS_KEY, loginDetailsSeed)
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
