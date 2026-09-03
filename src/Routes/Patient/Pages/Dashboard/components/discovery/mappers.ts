import type {
  Facility,
  FacilityActiveDiscount,
  FacilityDetail,
  FacilityServiceListItem,
  LinkedFacility,
} from "@/Routes/Patient/Pages/Dashboard/components/discovery/types"

// ---------------------------------------------------------------------------
// Row types — mirror Supabase table shapes (snake_case) until we have
// generated types from `supabase gen types`.
// ---------------------------------------------------------------------------

export interface FacilityRow {
  id: number
  name: string
  registration_number: string | null
  po_box: string | null
  facility_type: string
  facility_level: string | null
  bed_capacity: number
  county: string
  status: string
  plot_number: string | null
  latitude: number | null
  longitude: number | null
  location_name: string | null
  phone_number: string | null
  place_image_url: string | null
  distance: number | null
  has_active_discount: boolean
  active_discount: FacilityActiveDiscount | null
  verification_status: string
  service_categories: string[]
  rating: number | null
  closing_time: string | null
  discount_percentage: string | null
  is_onboarded: boolean
  linked_facility: LinkedFacility | null
  created_at: string
  updated_at: string
}

export interface ServiceCategoryRow {
  category: string
  display_name: string
  count: number
}

export interface DiscountCodeRow {
  id: number
  code: string
  description: string | null
  discount_type: string
  discount_value: string
  currency: { id: number; code: string; name: string; symbol: string }
  context: string
  discount_amount: string | null
  valid_from: string | null
  valid_until: string | null
  minimum_order_amount: string | null
  maximum_discount_amount: string | null
  is_active: boolean
  is_valid: boolean
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

/**
 * Convert a Supabase `facilities` row into the app-level `Facility` shape.
 *
 * Key conversions:
 * - `id` → `String(row.id)` (the app stores facility IDs as strings)
 * - `latitude` / `longitude` → stringified (Facility expects strings)
 * - `linked_facility` → `facility` (field rename)
 * - `is_onboarded` is intentionally omitted — it only exists on
 *   `FacilityDetail`, not `Facility`
 */
export function mapFacilityRow(row: FacilityRow): Facility {
  return {
    id: String(row.id),
    name: row.name,
    registrationNumber: row.registration_number ?? "",
    poBox: row.po_box ?? "",
    facilityType: row.facility_type,
    facilityLevel: row.facility_level ?? "",
    bedCapacity: row.bed_capacity,
    county: row.county,
    status: row.status,
    plotNumber: row.plot_number ?? "",
    latitude: row.latitude != null ? String(row.latitude) : "",
    longitude: row.longitude != null ? String(row.longitude) : "",
    locationName: row.location_name,
    phoneNumber: row.phone_number ?? "",
    placeImageUrl: row.place_image_url ?? "",
    distance: row.distance,
    hasActiveDiscount: row.has_active_discount,
    activeDiscount: row.active_discount,
    verificationStatus: row.verification_status,
    serviceCategories: row.service_categories ?? [],
    rating: row.rating ?? undefined,
    closingTime: row.closing_time ?? undefined,
    discountPercentage: row.discount_percentage ?? undefined,
    facility: row.linked_facility,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Build a full `FacilityDetail` from a facility row + its services list.
 * Adds `isOnboarded`, `activeDiscounts` array, and `services`.
 */
export function mapFacilityDetail(
  row: FacilityRow,
  services: FacilityServiceListItem[],
): FacilityDetail {
  return {
    ...mapFacilityRow(row),
    isOnboarded: row.is_onboarded,
    activeDiscounts: row.active_discount ? [row.active_discount] : [],
    services,
  }
}

/**
 * Map a service-category aggregate row to the app-level shape.
 */
export function mapServiceCategory(row: ServiceCategoryRow): {
  category: string
  displayName: string
  count: number
} {
  return {
    category: row.category,
    displayName: row.display_name,
    count: row.count,
  }
}

/**
 * Map a discount-code row from Supabase to camelCase.
 */
export function mapDiscountCode(row: DiscountCodeRow) {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    currency: row.currency,
    context: row.context,
    discountAmount: row.discount_amount,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    minimumOrderAmount: row.minimum_order_amount,
    maximumDiscountAmount: row.maximum_discount_amount,
    isActive: row.is_active,
    isValid: row.is_valid,
  }
}
