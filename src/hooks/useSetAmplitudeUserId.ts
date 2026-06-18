import { useEffect } from "react"
import Session from "supertokens-web-js/recipe/session"
import * as amplitude from "@amplitude/analytics-browser"
import { updateUserProperties } from "@/analytics"

/**
 * User properties interface for Amplitude tracking
 * Based on PatientLoginDetails from usePatientLoginDetails hook
 * All properties are optional since user data may be partially loaded
 */
interface AmplitudeUser {
  id?: string
  type?: string
  membershipStatus?: string
  isVerified?: boolean
  creditLimit?: {
    totalCreditLimitAmount?: string
    remainingAmount?: string
  }
  network?: unknown[]
  loans?: unknown[]
  idVerificationStatus?: string
  careFundAccount?: {
    createdAt?: string
  }
}

export default function useSetAmplitudeUserId() {
  return useEffect(() => {
    async function setAmplitudeUserId() {
      if (await Session.doesSessionExist()) {
        const userId = await Session.getUserId()
        amplitude.setUserId(userId)
      }
    }

    setAmplitudeUserId()
  }, [])
}

/**
 * Hook to set user properties from patient login details
 * Call this after user data is loaded
 */
export function useSetAmplitudeUserProperties(user: AmplitudeUser | null | undefined) {
  useEffect(() => {
    if (!user) return

    try {
      updateUserProperties({
        userType: user.type,
        membershipStatus: user.membershipStatus,
        isVerified: user.isVerified,
        creditLimitTotal: user.creditLimit?.totalCreditLimitAmount,
        creditLimitRemaining: user.creditLimit?.remainingAmount,
        networkSize: user.network?.length,
        loanCount: user.loans?.length,
        kycStatus: user.idVerificationStatus,
        accountCreatedAt: user.careFundAccount?.createdAt,
        lastLoginAt: new Date().toISOString(),
      })
    } catch {
      // Silent fail - telemetry should never break user experience
    }
  }, [user])
}
