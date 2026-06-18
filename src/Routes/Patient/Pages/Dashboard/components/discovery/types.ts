export interface LinkedFacility {
  id: number
  name: string
  facilityVerificationStatus: string
  createdAt: string
  updatedAt: string
}

export interface FacilityActiveDiscount {
  id: number
  code: string
  description: string | null
  discountType: "PERCENTAGE" | "FIXED_AMOUNT"
  discountValue: string
  validUntil: string | null
  maximumDiscountAmount: string | null
}

export interface Facility {
  id: string
  name: string
  registrationNumber: string
  poBox: string
  facilityType: string
  facilityLevel: string
  bedCapacity: number
  county: string
  status: string
  plotNumber: string
  latitude: string
  longitude: string
  updatedAt: string
  createdAt: string
  facility: LinkedFacility | null
  placeImageUrl: string
  phoneNumber: string
  distance: number | null
  hasActiveDiscount: boolean
  activeDiscount?: FacilityActiveDiscount | null
  verificationStatus: string
  locationName?: string | null
  serviceCategories?: string[]
  // UI specific fields (optional as they might not come from API yet)
  rating?: number
  closingTime?: string
  cashback?: string
  discountPercentage?: string
  discountTitle?: string
  discountValidUntil?: string
  recentlyVisited?: boolean
}

export interface PaymentSplit {
  id: string
  paymentSplitAmount: string
  status: string
  wallet: {
    id: string
    type: string
    remainingBalance: string
  }
}

export interface FacilityPayment {
  id: string
  totalBillAmount: string
  careProviderDisbursalAmount: string
  careProviderCommissionPercentage: string
  status: string
  createdAt: string
  updatedAt: string
  patientMedicalInfoRequest: {
    id: number
    status: string
    facility: {
      id: number
      name: string
      address: string
      isOutOfNetwork: boolean
    }
  }
  paymentSplits: PaymentSplit[]
  disbursementTransaction: {
    id: string
    amount: string
    transactionType: string
    status: string
    reference: string
  }
}

export interface FacilityPaymentsResponse {
  message: string
  data: FacilityPayment[]
}

export interface DiscoveryResponse {
  facilities: Facility[]
  totalFacilities: number
  approvedFacilitiesCount: number
}

export interface VerifiedFacility {
  id: string
  name: string
  facilityType: string | null
  facilityLevel: string | null
  county: string | null
  latitude: number | null
  longitude: number | null
  locationName: string | null
  phoneNumber: string | null
  placeImageUrl: string | null
  distance: number | null
  hasActiveDiscount: boolean
  activeDiscount?: FacilityActiveDiscount | null
  serviceCategories?: string[]
}

export interface VerifiedFacilitiesResponse {
  facilities: VerifiedFacility[]
  total: number
}

export interface ActiveDiscountFacility {
  id: number
  name: string
  county: string | null
  locationName: string | null
  latitude: number | null
  longitude: number | null
  facilityType: string | null
  placeImageUrl: string | null
}

export interface ActiveDiscount {
  id: number
  code: string
  description: string | null
  discountType: "PERCENTAGE" | "FIXED_AMOUNT"
  discountValue: string
  validFrom: string | null
  validUntil: string | null
  maximumDiscountAmount: string | null
  facility: ActiveDiscountFacility
}

export interface ActiveDiscountsResponse {
  discounts: ActiveDiscount[]
  total: number
}

export const DEFAULT_VIEW_STATE = {
  latitude: -1.2921,
  longitude: 36.8219,
  zoom: 13,
}

export interface FacilityServiceListItem {
  id: string
  name: string
  code: string
  category: string
}

/**
 * Response shape of GET /healthcare/discovery/facilities/:id.
 * Superset of the existing Facility shape, adding services and a flat
 * activeDiscounts array. `isOnboarded` is true when the facility is backed
 * by a healthcare_facility row (so Jireh can route payments through it) and
 * false for KMPDC-only entries that haven't been onboarded.
 */
export interface FacilityDetail extends Facility {
  activeDiscounts: FacilityActiveDiscount[]
  services?: FacilityServiceListItem[]
  isOnboarded: boolean
}
