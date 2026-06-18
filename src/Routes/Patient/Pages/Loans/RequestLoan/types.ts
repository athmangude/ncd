export type WalletType =
  | "CARD"
  | "MPESA"
  | "CASHBACK"
  | "LOAN"
  | "DISCOUNT"
  | "DISCOUNTS"

export interface WalletItem {
  id: string
  type: WalletType
  remainingBalance: string
  createdAt: string
  updatedAt: string
}

export interface PatientCircle {
  id?: string
  status?: string
  maxAccountableSlots?: number
  maxAuxiliarySlots?: number
  filledAccountableSlots?: number
  filledAuxiliarySlots?: number
  isFrozen?: boolean
  hasCompletedSetup?: boolean
  activatedAt?: string | null
  frozenAt?: string | null
  freezeReason?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface ExtendedUser {
  id?: string
  wallets: WalletItem[]
  creditLimit?: {
    totalCreditLimitAmount?: string
    remainingAmount?: string
    currency?: {
      code: string
      countryName?: string
      id?: number
    }
  }
  patientCircle?: PatientCircle
  phoneNumber?: string
  name?: string
  type?: "PUBLIC" | "ORG" | "PLUS"
  hasActiveMembership?: boolean
  hasUploadedMpesaStatement?: boolean
  // ... other fields
}

export type WalletAllocation = {
  amount: number
  repaymentPeriodDays?: number
  type?: WalletType | "DISCOUNT"
  phoneNumber?: string
  walletId: string
  discountCode?: string
}

export type Allocations = Record<string, WalletAllocation>

export const getWalletName = (type: WalletType) => {
  switch (type) {
    case "MPESA":
      return "MPESA"
    case "CARD":
      return "Credit or debit card"
    case "CASHBACK":
      return "Jireh Care Fund"
    case "LOAN":
      return "Jireh Medical Loan"
    default:
      // Never return "DISCOUNTS" or "DISCOUNT" - this should only handle WalletType
      return type === "DISCOUNT" ? "" : type
  }
}

