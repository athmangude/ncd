import { http, HttpResponse } from "msw"
import { makeId, readCollection, writeCollection } from "../db"
import facilitiesSeed from "../fixtures/facilities.json"
import facilityServicesSeed from "../fixtures/facility-services.json"
import serviceCategoriesSeed from "../fixtures/service-categories.json"
import discountCodesSeed from "../fixtures/discount-codes.json"
import facilityReviewsSeed from "../fixtures/facility-reviews.json"
import recentSearchesSeed from "../fixtures/recent-searches.json"
import preferredProvidersSeed from "../fixtures/preferred-providers.json"

/**
 * Discovery / Facilities, Reviews and Discounts mock API.
 *
 * Facility data is read from editable JSON fixtures. User-created records
 * (recent searches, preferred providers/favorites, submitted reviews) persist
 * to localStorage via the mock db helpers so they survive reloads.
 */

// ---------------------------------------------------------------------------
// Types (mirrors of the shapes the UI reads)
// ---------------------------------------------------------------------------

interface SeedActiveDiscount {
  id: number
  code: string
  description: string | null
  discountType: "PERCENTAGE" | "FIXED_AMOUNT"
  discountValue: string
  validUntil: string | null
  maximumDiscountAmount: string | null
}

interface SeedFacility {
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
  facility: {
    id: number
    name: string
    facilityVerificationStatus: string
    createdAt: string
    updatedAt: string
  } | null
  placeImageUrl: string
  phoneNumber: string
  distance: number | null
  hasActiveDiscount: boolean
  activeDiscount: SeedActiveDiscount | null
  verificationStatus: string
  locationName: string | null
  serviceCategories: string[]
  rating?: number
  closingTime?: string
  discountPercentage?: string
  isOnboarded: boolean
}

interface FacilityServiceListItem {
  id: string
  name: string
  code: string
  category: string
}

interface ServiceCategory {
  category: string
  displayName: string
  count: number
}

interface DiscountCode {
  id: number
  code: string
  description: string
  discountType: "PERCENTAGE" | "FIXED_AMOUNT"
  discountValue: string
  currency: { id: number; code: string; name: string; symbol: string }
  context: "ORDER_BASED" | "PROMOTIONAL"
  discountAmount: string
  validFrom: string | null
  validUntil: string | null
  minimumOrderAmount: string | null
  maximumDiscountAmount: string | null
  isActive: boolean
  isValid: boolean
}

interface StoredReview {
  id: string
  paymentId: string
  npsScore: number
  lovedMost?: string
  couldDoBetter?: string
  makeItATen?: string
  createdAt: string
}

interface FacilityRef {
  id: number
  name: string
}

interface RecentSearch {
  id: string
  facility: FacilityRef
}

interface PreferredProvider {
  id: string
  facility: FacilityRef
}

interface SubmitReviewBody {
  paymentId: string
  npsScore: number
  lovedMost?: string
  couldDoBetter?: string
  makeItATen?: string
}

// ---------------------------------------------------------------------------
// Fixtures + persistence keys
// ---------------------------------------------------------------------------

const facilities = facilitiesSeed as SeedFacility[]
const facilityServices = facilityServicesSeed as Record<
  string,
  FacilityServiceListItem[]
>
const serviceCategories = serviceCategoriesSeed as ServiceCategory[]
const discountCodes = discountCodesSeed as DiscountCode[]
const reviewsSeed = facilityReviewsSeed as Record<string, StoredReview[]>

const RECENT_SEARCHES_KEY = "discovery-recent-searches"
const PREFERRED_PROVIDERS_KEY = "discovery-preferred-providers"
const reviewsKey = (facilityId: string) => `facility-reviews:${facilityId}`

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findFacility(facilityId: string): SeedFacility | undefined {
  return facilities.find((f) => f.id === facilityId)
}

/** True when the facility offers (at least one of) the requested categories. */
function matchesCategories(
  facility: SeedFacility,
  requested: string[]
): boolean {
  if (requested.length === 0) return true
  return requested.some((c) => facility.serviceCategories.includes(c))
}

function getQueryCategories(url: URL): string[] {
  // Axios serializes array params with repeated keys (indexes: null).
  return url.searchParams.getAll("serviceCategories").filter(Boolean)
}

function applyFilters(list: SeedFacility[], url: URL): SeedFacility[] {
  const facilityType = url.searchParams.get("facilityType")
  const facilityLevel = url.searchParams.get("facilityLevel")
  const categories = getQueryCategories(url)

  return list.filter((f) => {
    if (
      facilityType &&
      facilityType !== "All" &&
      f.facilityType !== facilityType
    ) {
      return false
    }
    if (
      facilityLevel &&
      facilityLevel !== "All" &&
      f.facilityLevel !== facilityLevel
    ) {
      return false
    }
    if (!matchesCategories(f, categories)) return false
    return true
  })
}

function discoveryResponse(list: SeedFacility[]) {
  const approvedFacilitiesCount = facilities.filter(
    (f) => f.verificationStatus === "APPROVED"
  ).length
  return {
    facilities: list,
    totalFacilities: list.length,
    approvedFacilitiesCount,
  }
}

function toVerifiedFacility(f: SeedFacility) {
  return {
    id: f.id,
    name: f.name,
    facilityType: f.facilityType ?? null,
    facilityLevel: f.facilityLevel ?? null,
    county: f.county ?? null,
    latitude: f.latitude ? Number(f.latitude) : null,
    longitude: f.longitude ? Number(f.longitude) : null,
    locationName: f.locationName ?? null,
    phoneNumber: f.phoneNumber ?? null,
    placeImageUrl: f.placeImageUrl ?? null,
    distance: f.distance,
    hasActiveDiscount: f.hasActiveDiscount,
    activeDiscount: f.activeDiscount ?? null,
    serviceCategories: f.serviceCategories ?? [],
  }
}

function getStoredReviews(facilityId: string): StoredReview[] {
  return readCollection<StoredReview>(
    reviewsKey(facilityId),
    reviewsSeed[facilityId] ?? []
  )
}

function buildAggregate(reviews: StoredReview[]) {
  if (reviews.length === 0) return null
  const total = reviews.reduce((sum, r) => sum + r.npsScore, 0)
  const overallRating = total / reviews.length
  const recommendCount = reviews.filter((r) => r.npsScore >= 9).length
  const recommendPercent = Math.round((recommendCount / reviews.length) * 100)
  return {
    overallRating: Math.round(overallRating * 10) / 10,
    recommendPercent,
    reviewCount: reviews.length,
  }
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const discoveryHandlers = [
  // Jireh-verified (APPROVED) facilities near a point.
  http.get("/healthcare/discovery/verified-facilities", ({ request }) => {
    const url = new URL(request.url)
    const categories = getQueryCategories(url)
    const verified = facilities
      .filter((f) => f.verificationStatus === "APPROVED")
      .filter((f) => matchesCategories(f, categories))
      .map(toVerifiedFacility)
    return HttpResponse.json({ facilities: verified, total: verified.length })
  }),

  // All facilities near a point (with optional type/level/category filters).
  http.get("/healthcare/discovery/facilities", ({ request }) => {
    const url = new URL(request.url)
    const filtered = applyFilters(facilities, url)
    return HttpResponse.json(discoveryResponse(filtered))
  }),

  // Text search across name / county / location, plus optional filters.
  http.get("/healthcare/discovery/search", ({ request }) => {
    const url = new URL(request.url)
    const term = (url.searchParams.get("searchTerm") ?? "").trim().toLowerCase()
    const filtered = applyFilters(facilities, url).filter((f) => {
      if (!term) return true
      return (
        f.name.toLowerCase().includes(term) ||
        f.county.toLowerCase().includes(term) ||
        (f.locationName ?? "").toLowerCase().includes(term) ||
        f.facilityType.toLowerCase().includes(term)
      )
    })
    return HttpResponse.json(discoveryResponse(filtered))
  }),

  // Single facility detail (superset of Facility with services + discounts).
  http.get("/healthcare/discovery/facilities/:facilityId", ({ params }) => {
    const facilityId = params.facilityId as string
    const facility = findFacility(facilityId)
    if (!facility) {
      return HttpResponse.json(
        { message: "Facility not found" },
        { status: 404 }
      )
    }
    const activeDiscounts = facility.activeDiscount
      ? [facility.activeDiscount]
      : []
    const detail = {
      ...facility,
      activeDiscounts,
      services: facilityServices[facilityId] ?? [],
      isOnboarded: facility.isOnboarded,
    }
    return HttpResponse.json(detail)
  }),

  // Service category chips.
  http.get("/healthcare/discovery/service-categories", () =>
    HttpResponse.json({ categories: serviceCategories })
  ),

  // -------------------------------------------------------------------------
  // Recent searches (persisted)
  // -------------------------------------------------------------------------

  http.get("/patients/discovery/recent-searches", () => {
    const recent = readCollection<RecentSearch>(
      RECENT_SEARCHES_KEY,
      recentSearchesSeed as RecentSearch[]
    )
    return HttpResponse.json({ recent })
  }),

  http.post("/patients/discovery/recent-searches", async ({ request }) => {
    const body = (await request.json()) as { facilityId: number }
    const facility = findFacility(String(body.facilityId))
    const current = readCollection<RecentSearch>(
      RECENT_SEARCHES_KEY,
      recentSearchesSeed as RecentSearch[]
    )
    // De-dupe: drop any existing entry for this facility, then prepend.
    const withoutExisting = current.filter(
      (r) => r.facility.id !== body.facilityId
    )
    const entry: RecentSearch = {
      id: makeId("recent"),
      facility: {
        id: body.facilityId,
        name: facility?.name ?? `Facility ${body.facilityId}`,
      },
    }
    writeCollection<RecentSearch>(
      RECENT_SEARCHES_KEY,
      [entry, ...withoutExisting].slice(0, 10)
    )
    return new HttpResponse(null, { status: 200 })
  }),

  // -------------------------------------------------------------------------
  // Preferred providers / favorites (persisted)
  // -------------------------------------------------------------------------

  http.get("/patients/discovery/preferred-providers", () => {
    const preferred = readCollection<PreferredProvider>(
      PREFERRED_PROVIDERS_KEY,
      preferredProvidersSeed as PreferredProvider[]
    )
    return HttpResponse.json({ preferred })
  }),

  http.post("/patients/discovery/preferred-providers", async ({ request }) => {
    const body = (await request.json()) as { facilityId: number }
    const facility = findFacility(String(body.facilityId))
    const current = readCollection<PreferredProvider>(
      PREFERRED_PROVIDERS_KEY,
      preferredProvidersSeed as PreferredProvider[]
    )
    const exists = current.some((p) => p.facility.id === body.facilityId)
    if (!exists) {
      const entry: PreferredProvider = {
        id: makeId("preferred"),
        facility: {
          id: body.facilityId,
          name: facility?.name ?? `Facility ${body.facilityId}`,
        },
      }
      writeCollection<PreferredProvider>(PREFERRED_PROVIDERS_KEY, [
        ...current,
        entry,
      ])
    }
    return new HttpResponse(null, { status: 200 })
  }),

  http.delete(
    "/patients/discovery/preferred-providers/:facilityId",
    ({ params }) => {
      const facilityId = Number(params.facilityId)
      const current = readCollection<PreferredProvider>(
        PREFERRED_PROVIDERS_KEY,
        preferredProvidersSeed as PreferredProvider[]
      )
      writeCollection<PreferredProvider>(
        PREFERRED_PROVIDERS_KEY,
        current.filter((p) => p.facility.id !== facilityId)
      )
      return new HttpResponse(null, { status: 200 })
    }
  ),

  // -------------------------------------------------------------------------
  // Reviews
  // -------------------------------------------------------------------------

  // Aggregate: 200 with data when reviews exist, 204 when none.
  http.get("/facilities/:facilityId/reviews/aggregate", ({ params }) => {
    const facilityId = params.facilityId as string
    const reviews = getStoredReviews(facilityId)
    const aggregate = buildAggregate(reviews)
    if (!aggregate) return new HttpResponse(null, { status: 204 })
    return HttpResponse.json(aggregate)
  }),

  // Eligibility: every facility offers a (fake) unreviewed payment to review.
  http.get(
    "/patients/facilities/:facilityId/review-eligibility",
    ({ params }) => {
      const facilityId = params.facilityId as string
      return HttpResponse.json({
        canReview: true,
        unreviewedPaymentId: `pay-${facilityId}-mock`,
        reason: null,
      })
    }
  ),

  // Submit a review — persisted so the aggregate reflects it on reload.
  http.post(
    "/patients/facilities/:facilityId/reviews",
    async ({ params, request }) => {
      const facilityId = params.facilityId as string
      const body = (await request.json()) as SubmitReviewBody
      const current = getStoredReviews(facilityId)
      const review: StoredReview = {
        id: makeId("review"),
        paymentId: body.paymentId,
        npsScore: body.npsScore,
        lovedMost: body.lovedMost,
        couldDoBetter: body.couldDoBetter,
        makeItATen: body.makeItATen,
        createdAt: new Date().toISOString(),
      }
      writeCollection<StoredReview>(reviewsKey(facilityId), [
        review,
        ...current,
      ])
      return HttpResponse.json({ message: "Thanks for your feedback!" })
    }
  ),

  // -------------------------------------------------------------------------
  // Discounts
  // -------------------------------------------------------------------------

  http.get("/discount-codes/eligible", () =>
    HttpResponse.json({ data: discountCodes })
  ),
]
