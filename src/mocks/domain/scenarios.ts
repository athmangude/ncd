/**
 * Onboarding-stage scenarios for the Facilitator Tools panel.
 *
 * Each stage seeds the participant's profile so they land at a specific point in
 * the journey, and returns the route to send the facilitator to so they can see
 * that screen immediately. Built entirely from the existing seed / membership
 * helpers plus profile patches, so there is no new seeding behaviour to keep in
 * sync — only known combinations of the same fields the app already routes by.
 */

import { clearAllParticipantState } from "./reset"
import { seedFreshAccount } from "./seed"
import { activateMembership } from "./membership"
import { patchLoginDetails } from "../handlers/profile"

export type OnboardingStage =
  | "phone-entry"
  | "needs-name"
  | "needs-pin"
  | "needs-id"
  | "needs-circle"
  | "onboarded"
  | "onboarded-plus"

const NAME = { firstName: "Test", lastName: "Participant" }

const ID_APPROVED = {
  idVerificationStatus: "APPROVED",
  hasVerifiedId: "APPROVED",
  documentVerificationStatus: "PASSED",
  hasAcceptedMedicalConsentForm: true,
  hasAcceptedLatestTermsAndConditions: true,
}

/**
 * Put the participant at `stage` and return the patient route to view it.
 * Stages build on one another from a fresh, logged-in empty account, except
 * `phone-entry`, which signs out entirely so the journey starts at phone input.
 */
export function seedAtStage(stage: OnboardingStage): string {
  if (stage === "phone-entry") {
    clearAllParticipantState()
    return "/patients"
  }

  seedFreshAccount()
  if (stage === "needs-name") return "/patients/personal-details"

  patchLoginDetails(NAME)
  if (stage === "needs-pin") return "/patients/set-pin"

  patchLoginDetails({ hasSetPin: true })
  if (stage === "needs-id") return "/patients/id-verification-onboarding"

  patchLoginDetails(ID_APPROVED)
  if (stage === "needs-circle") {
    activateMembership()
    return "/patients/kyc-add-circle-members"
  }

  if (stage === "onboarded-plus") {
    activateMembership()
  }
  return "/patients"
}
