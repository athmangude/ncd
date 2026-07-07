import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import AppShell from "@/Routes/AppShell"
import { Button } from "@/components/Button"
import facilityIcon from "@/assets/icons/hospital.png"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/Tabs"
import { trackEvent, EVENTS } from "@/analytics"
import { usePatientAuthStore } from "@/Routes/Patient/stores/patientAuthStore"
import { getFirstIncompleteStep } from "@/Routes/Patient/hooks/useNextOnboardingStep"
import { useOffline } from "@/hooks/useOffline"
import { OfflinePlaceholder } from "@/components/OfflinePlaceholder"
import { Skeleton as SkeletonBlock } from "@/components/Skeleton"
import { useFacilityDetails } from "./facility-details/useFacilityDetails"
import { useDriveTime } from "./facility-details/useDriveTime"
import { facilitySubtitle } from "./facility-details/facilitySubtitle"
import { AboutTab } from "./facility-details/AboutTab"
import { ReviewsTab } from "./facility-details/ReviewsTab"
import { MyActivityTab } from "./facility-details/MyActivityTab"
import { useFacilityReviews } from "./facility-details/reviews/useFacilityReviews"
import { useReviewEligibility } from "./facility-details/reviews/useReviewEligibility"
import { ReviewGateHelperText } from "./facility-details/reviews/ReviewGateHelperText"
import { DEFAULT_VIEW_STATE } from "./types"

/**
 * Used when the browser cannot supply a location (permission denied,
 * unavailable, or still resolving). Picks a sensible city centre so the
 * Drive time stat always renders a value rather than a blank dash.
 */
const FALLBACK_ORIGIN = {
  lat: DEFAULT_VIEW_STATE.latitude,
  lng: DEFAULT_VIEW_STATE.longitude,
}

type TabValue = "about" | "reviews" | "activity"

const VALID_TABS: TabValue[] = ["about", "reviews", "activity"]

export default function FacilityDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isOffline = useOffline()
  const user = usePatientAuthStore((s: any) => s.user) || {}

  const userLocation = useBrowserLocation()
  const { data: facility, isLoading, isError } = useFacilityDetails(id)
  const { data: reviewAggregate, isLoading: reviewsLoading } =
    useFacilityReviews(id)
  const { data: eligibility, isLoading: eligibilityLoading } =
    useReviewEligibility(id)

  const destination = useMemo(() => {
    if (!facility?.latitude || !facility?.longitude) return null
    const lat = parseFloat(String(facility.latitude))
    const lng = parseFloat(String(facility.longitude))
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null
    return { lat, lng }
  }, [facility?.latitude, facility?.longitude])

  // Always supply an origin so Drive time renders a value rather than a
  // blank dash — falls back to the city default if the browser denies
  // geolocation. Result accuracy obviously depends on the browser-reported
  // location being correct.
  const driveOrigin = userLocation ?? FALLBACK_ORIGIN

  const { data: driveMinutes, isLoading: isDriveLoading } = useDriveTime({
    origin: driveOrigin,
    destination,
  })

  const requestedTab = searchParams.get("tab") as TabValue | null
  const activeTab: TabValue =
    requestedTab && VALID_TABS.includes(requestedTab) ? requestedTab : "about"

  useEffect(() => {
    if (!facility) return
    trackEvent(EVENTS.DISCOVERY.FACILITY_DETAILS_VIEW, {
      facilityId: facility.id,
      isJirehNetwork: facility.verificationStatus === "APPROVED",
    })
    // Intentionally track only the specific fields read in the analytics payload
    // to avoid re-firing on unrelated facility-object reference changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facility?.id, facility?.verificationStatus])

  useEffect(() => {
    if (
      activeTab !== "reviews" ||
      !facility ||
      eligibilityLoading ||
      !eligibility ||
      eligibility.canReview
    )
      return
    trackEvent(EVENTS.DISCOVERY.FACILITY_REVIEW_GATE_BLOCKED, {
      facilityId: facility.id,
      reason: eligibility.reason,
    })
    // Intentionally narrowed to the specific fields read in the payload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    facility?.id,
    eligibility?.canReview,
    eligibility?.reason,
    eligibilityLoading,
  ])

  const handleTabChange = (next: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("tab", next)
    setSearchParams(params, { replace: true })
    trackEvent(EVENTS.DISCOVERY.FACILITY_DETAILS_TAB_CHANGE, {
      facilityId: facility?.id,
      tab: next,
    })
  }

  const handleDirections = () => {
    if (!facility) return
    trackEvent(EVENTS.DISCOVERY.FACILITY_DETAILS_GET_DIRECTIONS, {
      facilityId: facility.id,
    })
    if (!destination) return
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`,
      "_blank"
    )
  }

  const handlePayHere = () => {
    if (!facility) return
    const nextIncompleteStep = getFirstIncompleteStep(user)
    trackEvent(EVENTS.DISCOVERY.FACILITY_DETAILS_PAY_HERE, {
      facilityId: facility.id,
      requiresOnboarding: !!nextIncompleteStep,
    })
    if (!facility.isOnboarded) {
      navigate("/patients/payment/request-payment/how-to-pay")
      return
    }
    if (nextIncompleteStep) {
      navigate("/patients/complete-profile", {
        state: {
          onboardingRedirectLink: nextIncompleteStep,
          fromPayMedicalBill: true,
          facility,
        },
      })
      return
    }
    navigate("/patients/fast-track/resolve-provider")
  }

  const handleAddReview = () => {
    if (!facility || !eligibility?.canReview) return
    trackEvent(EVENTS.DISCOVERY.FACILITY_DETAILS_ADD_REVIEW, {
      facilityId: facility.id,
    })
    navigate(`/patients/facility/${facility.id}/review`)
  }

  if (isOffline) {
    return (
      <AppShell header={null} footer={null}>
        <OfflinePlaceholder message="Connect to the internet to view facility details." />
      </AppShell>
    )
  }

  if (isLoading) {
    return (
      <AppShell header={null} footer={null} bodyPadding="none">
        <Skeleton />
      </AppShell>
    )
  }

  if (isError || !facility) {
    return (
      <AppShell header={null} footer={null} bodyPadding="none">
        <NotFoundState
          onBack={() => navigate("/patients", { state: { tab: "explore" } })}
        />
      </AppShell>
    )
  }

  const driveTimeLabel = isDriveLoading
    ? "…"
    : typeof driveMinutes === "number"
      ? `${driveMinutes} mins`
      : "—"
  const showRating = !!reviewAggregate && reviewAggregate.reviewCount > 0

  const header = (
    <header className="flex w-full flex-col bg-white px-4 py-3">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Back"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="capitalize">Facility details</h1>
        </div>
      </div>
    </header>
  )

  const footer = (
    <div className="bg-white border-t border-border px-4 py-3 flex gap-3 w-full">
      {activeTab === "about" && (
        <>
          <Button
            className="flex-1 min-w-0 h-12 rounded-xl border-0 bg-purple-100 text-primary hover:bg-purple-200 shadow-none text-sm sm:text-base"
            onClick={handleDirections}
            disabled={!destination}
          >
            Get directions
          </Button>
          <Button
            className="flex-1 min-w-0 h-12 rounded-xl text-sm sm:text-base"
            onClick={handlePayHere}
          >
            Pay here
          </Button>
        </>
      )}
      {activeTab === "reviews" && (
        <div className="flex flex-col w-full">
          {eligibility && !eligibility.canReview && eligibility.reason && (
            <ReviewGateHelperText reason={eligibility.reason} />
          )}
          <Button
            className="flex-1 min-w-0 h-12 rounded-xl text-sm sm:text-base"
            onClick={handleAddReview}
            disabled={eligibilityLoading || !eligibility?.canReview}
          >
            Add a review
          </Button>
        </div>
      )}
      {activeTab === "activity" && (
        <Button
          className="flex-1 min-w-0 h-12 rounded-xl text-sm sm:text-base"
          onClick={handlePayHere}
        >
          Pay here
        </Button>
      )}
    </div>
  )

  return (
    <AppShell header={header} footer={footer} bodyPadding="none">
      <section className="bg-white px-4 pt-6 pb-4 border-b border-border flex flex-col items-center text-center">
        <img
          src={facilityIcon}
          alt=""
          aria-hidden="true"
          className="h-12 w-12 mb-3 object-contain"
        />
        <h2 className="text-foreground">
          {facility.name}
        </h2>
        {facilitySubtitle(facility) && (
          <p className="text-sm text-muted-foreground mt-1">
            {facilitySubtitle(facility)}
          </p>
        )}

        <div className="flex items-stretch gap-6 mt-4 text-sm text-foreground">
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">Drive time</span>
            <span className="font-medium">{driveTimeLabel}</span>
          </div>
          {showRating && reviewAggregate && (
            <>
              <div className="w-px bg-border" />
              <button
                type="button"
                onClick={() => handleTabChange("reviews")}
                className="flex flex-col items-center"
                aria-label="View reviews"
              >
                <span className="text-xs text-muted-foreground">Rating</span>
                <span className="font-medium">
                  {reviewAggregate.overallRating.toFixed(1)} (
                  {reviewAggregate.reviewCount})
                </span>
              </button>
            </>
          )}
        </div>
      </section>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex-1 flex flex-col"
      >
        <TabsList className="w-auto mx-4 mt-4 grid grid-cols-3 h-11 gap-1 bg-muted/50 p-1">
          <TabsTrigger
            value="about"
            className="text-sm h-full data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            About
          </TabsTrigger>
          <TabsTrigger
            value="reviews"
            className="text-sm h-full data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Reviews
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="text-sm h-full data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            My Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="flex-1">
          <AboutTab facility={facility} />
        </TabsContent>
        <TabsContent value="reviews" className="flex-1">
          <ReviewsTab aggregate={reviewAggregate} isLoading={reviewsLoading} />
        </TabsContent>
        <TabsContent value="activity" className="flex-1">
          <MyActivityTab facilityId={facility.id} />
        </TabsContent>
      </Tabs>
    </AppShell>
  )
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <SkeletonBlock className="h-5 w-32 bg-muted rounded" />
      <SkeletonBlock className="h-8 w-8 rounded-full bg-muted mx-auto" />
      <SkeletonBlock className="h-6 w-48 bg-muted rounded mx-auto" />
      <SkeletonBlock className="h-4 w-36 bg-muted rounded mx-auto" />
      <SkeletonBlock className="h-10 w-full bg-muted rounded mt-6" />
      <SkeletonBlock className="h-24 w-full bg-muted rounded" />
    </div>
  )
}

function NotFoundState({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-4">
      <p className="text-sm text-muted-foreground">
        Facility details are not available.
      </p>
      <Button onClick={onBack}>Back to Explore</Button>
    </div>
  )
}

/**
 * Reads the user's current position once on mount. Returns null until the
 * call resolves, and stays null if permission is denied or unavailable —
 * the page omits Drive time in that case.
 */
function useBrowserLocation(): { lat: number; lng: number } | null {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  )
  useEffect(() => {
    if (!("geolocation" in navigator)) return
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords(null),
      { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 5000 }
    )
  }, [])
  return coords
}
