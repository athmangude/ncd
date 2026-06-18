import { useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { TabsContent } from "@/components/Tabs"
import { useOffline } from "@/hooks/useOffline"
import { OfflinePlaceholder } from "@/components/OfflinePlaceholder"
import { useDiscovery } from "./components/discovery/useDiscovery"
import { LocationPermissionPrompt } from "./components/discovery/LocationPermissionPrompt"
import { DiscoveryHomeView } from "./components/discovery/DiscoveryHomeView"
import { DiscoveryHomeSkeleton } from "./components/discovery/DiscoveryHomeSkeleton"
import { Facility } from "./components/discovery/types"
import { useEligibleDiscountCodes } from "./hooks/useEligibleDiscountCodes"
import { trackEvent, EVENTS } from "@/analytics"

/** Distance in km between two points (Haversine). */
function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function getFacilityDistanceKm(
  facility: Facility,
  userLocation: { lat: number; lng: number } | null
): number | null {
  if (facility.distance != null && !isNaN(facility.distance)) {
    return facility.distance
  }
  if (!userLocation) return null
  const lat = parseFloat(facility.latitude)
  const lng = parseFloat(facility.longitude)
  if (isNaN(lat) || isNaN(lng)) return null
  return distanceKm(userLocation.lat, userLocation.lng, lat, lng)
}

interface PatientDashboardExploreTabProps {
  isActive?: boolean
}

export default function PatientDashboardExploreTab({
  isActive = true,
}: PatientDashboardExploreTabProps) {
  const navigate = useNavigate()
  const {
    filteredFacilities,
    loading,
    checkingPermission,
    userLocation,
    locationName,
    permissionStatus,
    activeTab,
    setActiveTab,
    handleRequestLocation,
  } = useDiscovery(isActive)

  const isOffline = useOffline()

  // Patient-eligible discount codes — same source as the Payments tab so the
  // two surfaces stay in sync. React Query dedupes via the shared queryKey.
  const { data: discountCodes = [] } = useEligibleDiscountCodes(
    isActive && !isOffline,
  )

  useEffect(() => {
    if (!isActive) return
    trackEvent(EVENTS.DISCOVERY.EXPLORE_TAB_VIEW)
  }, [isActive])

  const distanceByFacilityId = useMemo(() => {
    const byId = new Map<string, number>()
    filteredFacilities.forEach((f) => {
      const dist = getFacilityDistanceKm(f, userLocation)
      if (dist != null) byId.set(f.id, dist)
    })
    return byId
  }, [filteredFacilities, userLocation])

  if (isOffline) {
    return (
      <TabsContent value="explore" className="w-full h-full">
        <OfflinePlaceholder message="Connect to the internet to discover healthcare facilities and discounts near you." />
      </TabsContent>
    )
  }

  if (!userLocation) {
    return (
      <LocationPermissionPrompt
        onRequestLocation={handleRequestLocation}
        loading={loading || checkingPermission}
        permissionStatus={permissionStatus}
      />
    )
  }

  if (loading && filteredFacilities.length === 0) {
    return <DiscoveryHomeSkeleton />
  }

  return (
    <DiscoveryHomeView
      facilities={filteredFacilities}
      discountCodes={discountCodes}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onFacilitySelect={(facility) => {
        trackEvent(EVENTS.DISCOVERY.FACILITY_TAP, {
          facilityId: facility.id,
          facilityType: facility.facilityType,
          isJirehNetwork: facility.verificationStatus === "APPROVED",
        })
        navigate(`/patients/facility/${facility.id}`)
      }}
      distanceByFacilityId={distanceByFacilityId}
      locationName={locationName}
    />
  )
}
