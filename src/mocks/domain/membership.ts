/**
 * Membership domain helpers.
 *
 * "Jireh Plus" (the KES 499 upgrade) is what unlocks medical loans and the
 * credit limit. Activating membership flips `hasActiveMembership` and makes
 * sure the credit limit is funded; deactivating reverts it so a facilitator can
 * demo the upgrade from a basic account.
 */

import { getLoginDetails, patchLoginDetails } from "../handlers/profile"

export function activateMembership() {
  const profile = getLoginDetails()
  const credit = profile.creditLimit
  const total = Number(credit?.totalCreditLimitAmount ?? 0)
  const remaining = Number(credit?.remainingAmount ?? 0)

  return patchLoginDetails({
    hasActiveMembership: true,
    membershipStatus: "ACTIVE",
    isBasicMember: false,
    canPayMedicalBill: true,
    creditLimit: {
      ...credit,
      // Fund the limit if a deactivated account had drained it to zero.
      remainingAmount: String(remaining > 0 ? remaining : total),
    },
  })
}

export function deactivateMembership() {
  return patchLoginDetails({
    hasActiveMembership: false,
    membershipStatus: "INACTIVE",
    isBasicMember: true,
  })
}

export function isMembershipActive(): boolean {
  return getLoginDetails().hasActiveMembership === true
}
