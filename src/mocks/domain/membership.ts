/**
 * Membership domain helpers.
 *
 * "Jireh Plus" (the KES 499 upgrade) is what unlocks medical loans and the
 * credit limit. Activating membership flips `hasActiveMembership` and makes
 * sure the credit limit is funded; deactivating reverts it so a facilitator can
 * demo the upgrade from a basic account.
 */

import { getLoginDetails, patchLoginDetails } from "../handlers/profile"

// Every freshly upgraded account starts with this interest-free limit. Uploading
// an M-Pesa statement later raises it (see /underwriting/upload-mpesa-statement).
export const DEFAULT_CREDIT_LIMIT = 500

const DEFAULT_CURRENCY = { countryName: "Kenya", code: "KES", id: 1 }

export function activateMembership() {
  const profile = getLoginDetails()
  const credit = profile.creditLimit
  const total = Number(credit?.totalCreditLimitAmount ?? 0)
  const remaining = Number(credit?.remainingAmount ?? 0)

  // A fresh account has no limit yet — seed the default. An already-funded
  // account (e.g. the demo profile) keeps its total; only refill the remaining
  // balance if a deactivated account had drained it to zero.
  const effectiveTotal = total > 0 ? total : DEFAULT_CREDIT_LIMIT
  const effectiveRemaining = remaining > 0 ? remaining : effectiveTotal

  return patchLoginDetails({
    hasActiveMembership: true,
    membershipStatus: "ACTIVE",
    isBasicMember: false,
    canPayMedicalBill: true,
    // Jireh Plus upgrade promotes the account role the loan/limit gates check.
    type: "PLUS",
    creditLimit: {
      ...credit,
      currency: credit?.currency ?? DEFAULT_CURRENCY,
      totalCreditLimitAmount: String(effectiveTotal),
      remainingAmount: String(effectiveRemaining),
    },
  })
}

export function deactivateMembership() {
  return patchLoginDetails({
    hasActiveMembership: false,
    membershipStatus: "INACTIVE",
    isBasicMember: true,
    // Revert to the basic role so the demo can re-run the upgrade.
    type: "PUBLIC",
  })
}

export function isMembershipActive(): boolean {
  return getLoginDetails().hasActiveMembership === true
}
