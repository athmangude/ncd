export interface FastTrackFacility {
  id: number
  name: string
  address: string
  POBox: string | null
  orgName: string
  facilityLevel: string
  facilityVerificationStatus: string
  locationName: string | null
  county: string | null
  subCounty: string | null
  contactPhone: string | null
  latitude: string | null
  longitude: string | null
  isOutOfNetwork: boolean
  isPrimaryBranch: boolean
  branchDisplayName: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface FastTrackPaymentPoint {
  id: number
  name: string
  paymentNumber: string
  paymentCode: string
  smsPhoneNumbers: string[]
  isActive: boolean
  facility: FastTrackFacility
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type SplitMode = "MPESA" | "LOAN" | "CAREFUND" | "DISCOUNT"

export interface PaymentSplit {
  mode: SplitMode
  amount: number
  repaymentPeriodDays?: number
}

export interface InitiateFastTrackPaymentDto {
  paymentNumber: string
  amount: number
  invoiceNumber: string
  patientId: string
  splits: PaymentSplit[]
  discountAmount?: number
  repaymentPeriodDays?: number
}

export interface FastTrackProvider {
  id: number
  name: string
  address: string
  POBox: string | null
}

export interface FastTrackPatient {
  id: string
  firstName: string
  lastName: string
  phoneNumber: string
}

export interface FastTrackSplitResult {
  id: string
  splitAmount: string
  mode: SplitMode
  paymentRedirectUrl?: string
}

export interface FastTrackTransaction {
  id: string
  providerId: number
  patientId: string
  invoiceNumber: string
  paymentNumber: string
  totalBillAmount?: string
  grossAmount?: string
  providerName: string
  discountAmount: string
  netAmount: string
  paymentModeTags: SplitMode[]
  status: "HOLDING" | "SETTLED" | "DISBURSED" | "PENDING"
  createdAt: string
  updatedAt: string
  provider: FastTrackProvider
  patient: FastTrackPatient
  paymentRedirectUrl?: string
  paymentSplitResults?: FastTrackSplitResult[]
  transactionId?: string
}

export interface VerifyInvoiceResponse {
  exists: boolean
  facilityName: string
  transaction?: {
    id: string
    invoiceNumber: string
    grossAmount: string
    status: string
    createdAt: string
  }
}

export const SPLIT_MODE_LABELS: Record<SplitMode, string> = {
  MPESA: "M-PESA",
  LOAN: "Jireh Medical Loan",
  CAREFUND: "Jireh Care Fund",
  DISCOUNT: "Discount",
}
