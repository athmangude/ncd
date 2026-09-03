import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  useDeferredValue,
} from "react"
import { useToast } from "@/hooks/useToast"
import {
  Facility,
  DEFAULT_VIEW_STATE,
} from "./types"
import { useLocation } from "react-router-dom"
import { trackEvent, EVENTS } from "@/analytics"
import { supabase } from "@/lib/supabase"
import { mapFacilityRow } from "./mappers"
import type { FacilityRow } from "./mappers"

export const DISCOVERY_STORAGE_KEY = "discovery_tab_state"

// Minimal stand-in for the map ref API this hook calls. The interactive Mapbox
// map was removed for the standalone prototype, so this ref is never attached to
// a real map — mapRef.current stays null and these calls are guarded no-ops.
interface MapRef {
  flyTo: (opts: unknown) => void
  fitBounds: (bounds: unknown, opts?: unknown) => void
}

export interface DiscoveryState {
  viewState: typeof DEFAULT_VIEW_STATE
  activeTab: "all" | "jireh"
  filterType: string
  filterLevel: string
  serviceCategories: string[]
  userLocation: { lat: number; lng: number } | null
}

export function useDiscovery(enabled: boolean = true) {
  const location = useLocation()

  // Load saved state from sessionStorage lazily
  const [savedState] = useState<Partial<DiscoveryState>>(() => {
    try {
      const item = sessionStorage.getItem(DISCOVERY_STORAGE_KEY)
      return item ? JSON.parse(item) : {}
    } catch (error) {
      console.error("Error reading from sessionStorage:", error)
      return {}
    }
  })

  // searchQuery is intentionally NOT persisted in sessionStorage: leaving
  // SearchPage should clear the term so it does not leak into the next API
  // call (e.g. when the Explore tab remounts useDiscovery). A query passed
  // via route state or URL ?q= param is honored for explicit deep-links.
  const urlQ = new URLSearchParams(location.search).get("q")
  const initialSearchQuery = location.state?.searchQuery || urlQ || ""

  const [viewState, setViewState] = useState(
    savedState.viewState || DEFAULT_VIEW_STATE
  )
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(false)
  const [checkingPermission, setCheckingPermission] = useState(true)
  // userLocation is never seeded from sessionStorage — it must be obtained fresh each
  // session so the consent screen always shows for users who haven't actively enabled location.
  const [userLocation, setUserLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)
  // locationName previously came from Google reverse-geocoding (removed for the
  // standalone prototype); it now stays null and the UI uses its fallback label.
  const [locationName] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(
    null
  )
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionState>("prompt")

  // Filter states
  const [activeTab, setActiveTab] = useState<"all" | "jireh">(
    savedState.activeTab ?? "jireh"
  )
  const [filterType, setFilterType] = useState(savedState.filterType || "All")
  const [filterLevel, setFilterLevel] = useState(
    savedState.filterLevel || "All"
  )
  const [serviceCategories, setServiceCategories] = useState<string[]>(
    savedState.serviceCategories ?? []
  )

  const deferredFilterType = useDeferredValue(filterType)
  const deferredFilterLevel = useDeferredValue(filterLevel)
  const deferredServiceCategories = useDeferredValue(serviceCategories)
  // Timer debounce (not useDeferredValue) so effects fire once per pause, not per keystroke.
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery)
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearchQuery(searchQuery), 350)
    return () => clearTimeout(id)
  }, [searchQuery])

  const mapRef = useRef<MapRef>(null)
  const facilitiesAbortRef = useRef<AbortController | null>(null)
  const { toast } = useToast()

  // Persist state changes to sessionStorage (debounced to avoid heavy writes during map interaction)
  const stateToSaveRef = useRef<DiscoveryState | null>(null)
  stateToSaveRef.current = {
    viewState,
    activeTab,
    filterType,
    filterLevel,
    serviceCategories,
    userLocation,
  }
  useEffect(() => {
    const id = setTimeout(() => {
      if (stateToSaveRef.current) {
        try {
          sessionStorage.setItem(
            DISCOVERY_STORAGE_KEY,
            JSON.stringify(stateToSaveRef.current)
          )
        } catch (e) {
          console.error("Error writing discovery state:", e)
        }
      }
    }, 400)
    return () => clearTimeout(id)
  }, [
    viewState,
    activeTab,
    filterType,
    filterLevel,
    serviceCategories,
    userLocation,
  ])

  const fetchNearbyFacilities = useCallback(
    async (opts: {
      lat: number
      lng: number
      facilityType?: string
      facilityLevel?: string
      tab?: "all" | "jireh"
      categories?: string[]
    }) => {
      const {
        facilityType,
        facilityLevel,
        tab = "all",
        categories = [],
      } = opts as Omit<typeof opts, "lat" | "lng">
      facilitiesAbortRef.current?.abort()
      const controller = new AbortController()
      facilitiesAbortRef.current = controller
      setLoading(true)
      try {
        let query = supabase.from("facilities").select("*")
        if (tab === "jireh") {
          query = query.eq("verification_status", "APPROVED")
        } else {
          if (facilityType && facilityType !== "All")
            query = query.eq("facility_type", facilityType)
          if (facilityLevel && facilityLevel !== "All")
            query = query.eq("facility_level", facilityLevel)
        }
        if (categories.length > 0)
          query = query.contains("service_categories", categories)
        const { data, error } = await query.order("name")
        if (error) throw error
        setFacilities(
          ((data ?? []) as FacilityRow[]).map(mapFacilityRow),
        )
      } catch (error) {
        console.error("Error fetching facilities:", error)
        toast({
          title: "Error",
          description: "Failed to load facilities. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  const searchFacilities = useCallback(
    async (
      term: string,
      facilityType: string,
      facilityLevel: string,
      categories: string[] = []
    ) => {
      facilitiesAbortRef.current?.abort()
      const controller = new AbortController()
      facilitiesAbortRef.current = controller
      setLoading(true)
      try {
        let query = supabase.from("facilities").select("*")
        const orFilters = [
          `name.ilike.%${term}%`,
          `county.ilike.%${term}%`,
          `location_name.ilike.%${term}%`,
          `facility_type.ilike.%${term}%`,
        ].join(",")
        query = query.or(orFilters)
        if (facilityType && facilityType !== "All")
          query = query.eq("facility_type", facilityType)
        if (facilityLevel && facilityLevel !== "All")
          query = query.eq("facility_level", facilityLevel)
        if (categories.length > 0)
          query = query.contains("service_categories", categories)
        const { data, error } = await query.order("name")
        if (error) throw error
        const mapped = ((data ?? []) as FacilityRow[]).map(mapFacilityRow)
        setFacilities(mapped)
        trackEvent(EVENTS.DISCOVERY.SEARCH_SUBMIT, {
          resultCount: mapped.length,
          triggerSource: "debounce",
        })
      } catch (error) {
        console.error("Error searching facilities:", error)
        toast({
          title: "Error",
          description: "Failed to search facilities. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  // Effect to handle search and filter changes
  useEffect(() => {
    if (!enabled) return

    if (debouncedSearchQuery) {
      searchFacilities(
        debouncedSearchQuery,
        deferredFilterType,
        deferredFilterLevel,
        deferredServiceCategories
      )
    } else if (userLocation) {
      // If search is cleared and we have location, fetch nearby (with optional facilityType).
      fetchNearbyFacilities({
        lat: userLocation.lat,
        lng: userLocation.lng,
        facilityType: deferredFilterType,
        facilityLevel: deferredFilterLevel,
        tab: activeTab,
        categories: deferredServiceCategories,
      })
    }
  }, [
    debouncedSearchQuery,
    deferredFilterType,
    deferredFilterLevel,
    deferredServiceCategories,
    userLocation,
    activeTab,
    searchFacilities,
    fetchNearbyFacilities,
    enabled,
  ])

  const handleRequestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ lat: latitude, lng: longitude })
        const newView = { latitude, longitude, zoom: 14 }
        setViewState((prev) => ({ ...prev, ...newView }))
        setPermissionStatus("granted")
        trackEvent(EVENTS.DISCOVERY.LOCATION_GRANTED)
        mapRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: 14,
          duration: 800,
        })
        fetchNearbyFacilities({
          lat: latitude,
          lng: longitude,
          facilityType: filterType,
          facilityLevel: filterLevel,
          tab: activeTab,
          categories: serviceCategories,
        })
        setLoading(false)
        // Reverse-geocoding (Google Maps) was removed for the standalone
        // prototype. The location label simply stays at its fallback.
      },
      (error) => {
        console.error("Location error:", error)
        setLoading(false)

        if (error.code === 1) {
          trackEvent(EVENTS.DISCOVERY.LOCATION_DENIED)
          setPermissionStatus("denied")
          toast({
            title: "Location access blocked",
            description:
              "Enable location for this site in your browser settings, then tap Retry.",
          })
        } else {
          // For other errors (timeout, position unavailable), don't change permission status
          // This allows the user to try again without being stuck in the "enable permission" screen
          trackEvent(EVENTS.DISCOVERY.LOCATION_ERROR, { errorCode: error.code })
          toast({
            title: "Location Unavailable",
            description:
              "Unable to retrieve your location. Please check your connection and GPS settings.",
            variant: "destructive",
          })
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 10000,
      }
    )
  }, [
    toast,
    fetchNearbyFacilities,
    filterType,
    filterLevel,
    serviceCategories,
    activeTab,
  ])

  // Initial load: only sync permission status. Do NOT request location here.
  // Location is requested only when the user taps "Use my location" on the consent screen.
  useEffect(() => {
    if (!enabled) return

    const checkPermission = async () => {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({
            name: "geolocation",
          })
          setPermissionStatus(result.state)
          result.onchange = () => setPermissionStatus(result.state)
        } catch (error) {
          console.error("Error checking permissions:", error)
          setPermissionStatus("prompt")
        }
      } else {
        setPermissionStatus("prompt")
      }
      setCheckingPermission(false)
    }

    checkPermission()
  }, [enabled])

  // When browser permission is already granted (user consented previously), auto-request
  // location without showing the consent screen. The ref prevents duplicate calls.
  const hasAutoRequestedRef = useRef(false)
  useEffect(() => {
    if (!enabled || checkingPermission || hasAutoRequestedRef.current) return
    if (permissionStatus === "granted" && !userLocation) {
      hasAutoRequestedRef.current = true
      handleRequestLocation()
    }
    // handleRequestLocation intentionally omitted — filter changes should not re-trigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionStatus, checkingPermission, enabled])

  const flyToFacility = useCallback((facility: Facility) => {
    const lat = parseFloat(facility.latitude)
    const lng = parseFloat(facility.longitude)

    if (isNaN(lat) || isNaN(lng)) {
      console.warn("Invalid facility coordinates:", facility)
      return
    }

    trackEvent(EVENTS.DISCOVERY.FACILITY_TAP, {
      facilityId: facility.id,
      facilityType: facility.facilityType,
      isJirehNetwork: facility.verificationStatus === "APPROVED",
    })

    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: 15,
      duration: 2000,
    })
    setSelectedFacility(facility)
  }, [])

  // Filter Logic
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      // Tab Filter
      if (activeTab === "jireh" && f.verificationStatus !== "APPROVED")
        return false

      // Type Filter
      // If we are searching, we assume the API handled the type filter.
      // If not searching (nearby mode), we filter client-side.
      const isSearching = !!debouncedSearchQuery
      if (
        !isSearching &&
        deferredFilterType !== "All" &&
        !f.facilityType.includes(deferredFilterType)
      )
        return false

      // Level Filter
      // Similarly, assume API handles level filter if passed, but do client side for consistency or if needed
      if (
        !isSearching &&
        deferredFilterLevel !== "All" &&
        f.facilityLevel !== deferredFilterLevel
      )
        return false

      return true
    })
  }, [
    facilities,
    activeTab,
    deferredFilterType,
    deferredFilterLevel,
    debouncedSearchQuery,
  ])

  const jirehAcceptedCount = useMemo(
    () => facilities.filter((f) => f.verificationStatus === "APPROVED").length,
    [facilities]
  )

  // Effect to update map view when search results change or filters change
  useEffect(() => {
    if (filteredFacilities.length > 0 && mapRef.current) {
      let pointsToFit: { lat: number; lng: number }[] = []

      if (!debouncedSearchQuery && userLocation) {
        // In "Nearby" mode:
        // Prioritize showing the user's location and the nearest few facilities (e.g., closest 3)
        // This keeps the map zoomed in relative to the user.
        const sortedByDistance = [...filteredFacilities].sort(
          (a, b) => (a.distance || Infinity) - (b.distance || Infinity)
        )
        const nearest = sortedByDistance.slice(0, 3)

        pointsToFit = [
          { lat: userLocation.lat, lng: userLocation.lng },
          ...nearest.map((f) => ({
            lat: parseFloat(f.latitude),
            lng: parseFloat(f.longitude),
          })),
        ]
      } else {
        // In "Search" mode or no user location:
        // Fit all matching results
        pointsToFit = filteredFacilities.map((f) => ({
          lat: parseFloat(f.latitude),
          lng: parseFloat(f.longitude),
        }))
      }

      const validCoords = pointsToFit.filter(
        (c) => !isNaN(c.lat) && !isNaN(c.lng)
      )

      if (validCoords.length === 0) return

      if (validCoords.length === 1) {
        mapRef.current.flyTo({
          center: [validCoords[0].lng, validCoords[0].lat],
          zoom: 15,
          duration: 1000,
        })
      } else {
        const minLat = Math.min(...validCoords.map((c) => c.lat))
        const maxLat = Math.max(...validCoords.map((c) => c.lat))
        const minLng = Math.min(...validCoords.map((c) => c.lng))
        const maxLng = Math.max(...validCoords.map((c) => c.lng))

        mapRef.current.fitBounds(
          [
            [minLng, minLat],
            [maxLng, maxLat],
          ],
          {
            padding: 80,
            duration: 1000,
            maxZoom: 15, // Ensure we don't zoom in too close if points are very close
          }
        )
      }
    }
  }, [filteredFacilities, debouncedSearchQuery, userLocation])

  return {
    viewState,
    setViewState,
    facilities,
    filteredFacilities,
    loading,
    checkingPermission,
    userLocation,
    locationName,
    searchQuery,
    setSearchQuery,
    selectedFacility,
    setSelectedFacility,
    permissionStatus,
    activeTab,
    setActiveTab,
    filterType,
    setFilterType,
    filterLevel,
    setFilterLevel,
    serviceCategories,
    setServiceCategories,
    mapRef,
    handleRequestLocation,
    flyToFacility,
    jirehAcceptedCount,
  }
}
