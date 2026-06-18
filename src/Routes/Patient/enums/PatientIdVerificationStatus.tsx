export enum PatientIdVerificationStatus {
  NOT_SET = "NOT_SET",
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
  APPROVED = "APPROVED",
}

export enum PatientDocumentVerificationStatus {
  PASSED = "PASSED",
  FAILED = "FAILED",
  PENDING = "PENDING",
}

/**
 * The backend marks a successfully verified national ID as either VERIFIED or
 * APPROVED depending on the verification path (and the mocks/fixtures use
 * APPROVED). Treat both as "verified" so the onboarding/KYC completion checks
 * don't loop a user who has already passed ID verification.
 */
const VERIFIED_ID_STATUSES: string[] = [
  PatientIdVerificationStatus.VERIFIED,
  PatientIdVerificationStatus.APPROVED,
]

export function isIdVerified(status?: string | null): boolean {
  return !!status && VERIFIED_ID_STATUSES.includes(status)
}