---
context_version: 1.0
last_updated_commit: 14d2d4e9
last_updated_date: 2026-04-08
covers: Healthcare facility discovery — Mapbox integration, search/filter, sessionStorage state, virtual scroll, provider detail page
---

# Discovery and Map

## Overview

The Discovery feature allows patients to find nearby healthcare facilities on a map or via search. It lives inside the Dashboard's "Explore" tab and also has a standalone page (`PatientDiscoverHospitals`). Key capabilities:

- Interactive Mapbox map with facility markers
- Geolocation-based "nearby" facility list
- Text search across all KMPDC-registered facilities in Kenya
- Filter by facility type (35+ types) and facility level (LEVEL 2 through LEVEL 6B)
- Differentiate "Jireh network" (APPROVED) vs general facilities
- Cluster markers at lower zoom levels
- sessionStorage-based state persistence across tab navigations

---

## File Locations

```
src/Routes/Patient/Pages/Dashboard/components/discovery/
  useDiscovery.ts         — main logic hook (all state management)
  DiscoveryMap.tsx        — Mapbox Map component with clustering
  FacilityList.tsx        — ScrollArea-based list with skeleton loading
  FacilityCard.tsx        — individual facility card
  FacilityDetailsPage.tsx — full facility detail page
  DiscoveryFilters.tsx    — tab + type + level filter UI
  LocationPermissionPrompt.tsx — consent screen before geolocation request
  types.ts                — Facility, DiscoveryResponse, etc.
  constants.ts            — FACILITY_TYPES, FACILITY_LEVELS arrays
```

---

## `useDiscovery` Hook

`src/Routes/Patient/Pages/Dashboard/components/discovery/useDiscovery.ts`

This hook owns all discovery state. It is the single source of truth for both the map and the list view.

### State

```typescript
// Persisted to sessionStorage["discovery_tab_state"]
searchQuery: string
viewState: { latitude: number, longitude: number, zoom: number }
activeTab: "all" | "jireh"
filterType: string      // one of FACILITY_TYPES or "All"
filterLevel: string     // one of FACILITY_LEVELS or "All"
userLocation: { lat: number, lng: number } | null

// Not persisted
facilities: Facility[]
loading: boolean
selectedFacility: Facility | null
permissionStatus: PermissionState  // "prompt" | "granted" | "denied"
```

### sessionStorage Persistence

State is auto-saved to `sessionStorage["discovery_tab_state"]` with a 400ms debounce:

```typescript
// stateToSaveRef + useEffect
const id = setTimeout(() => {
  sessionStorage.setItem("discovery_tab_state", JSON.stringify(stateToSaveRef.current))
}, 400)
```

On mount, state is restored:
```typescript
const [savedState] = useState<Partial<DiscoveryState>>(() => {
  const item = sessionStorage.getItem("discovery_tab_state")
  return item ? JSON.parse(item) : {}
})
```

State priority on init: `location.state > savedState > default`

The `DEFAULT_VIEW_STATE` is Nairobi city centre: `{ latitude: -1.2921, longitude: 36.8219, zoom: 13 }`.

### Data Fetching

Two API endpoints:

**Nearby facilities** (location-based):
```
GET /healthcare/discovery/facilities
  ?latitude=...
  &longitude=...
  [&facilityType=...]
  [&facilityLevel=...]
```

**Text search**:
```
GET /healthcare/discovery/search
  ?searchTerm=...
  [&facilityType=...]
  [&facilityLevel=...]
```

The hook switches between these based on whether `deferredSearchQuery` is non-empty. The `useDeferredValue` React hook is used for `filterType`, `filterLevel`, and `searchQuery` to prevent blocking renders during fast filter changes.

### Filter Logic

After fetching, client-side filtering is applied:
- **Tab filter** (`"jireh"` tab): removes facilities where `verificationStatus !== "APPROVED"`
- **Type filter**: skipped in search mode (API handles it); applied client-side in nearby mode
- **Level filter**: same as type filter

### Location Request

The hook does **not** request geolocation on mount. Location is only requested when the user explicitly taps "Use my location" on the `LocationPermissionPrompt` screen:

```typescript
const handleRequestLocation = useCallback(() => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      setUserLocation({ lat, lng })
      fetchNearbyFacilities(lat, lng, filterType, filterLevel)
      mapRef.current?.flyTo({ center: [lng, lat], zoom: 14, duration: 800 })
    },
    (error) => {
      if (error.code === 1) {
        setPermissionStatus("denied")  // user explicitly denied
      } else {
        // timeout or GPS unavailable — don't change permissionStatus, allow retry
      }
    },
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
  )
}, [...])
```

On mount, it only reads the permission status via `navigator.permissions.query({ name: "geolocation" })` without triggering the permission dialog.

---

## Mapbox Integration

Library: `react-map-gl/mapbox` with `mapbox-gl`.

### Map Component (`DiscoveryMap`)

```typescript
interface DiscoveryMapProps {
  mapRef: RefObject<MapRef>
  viewState: { latitude, longitude, zoom }
  setViewState: (viewState: any) => void
  userLocation: { lat, lng } | null
  facilities: Facility[]         // pre-filtered
  selectedFacility: Facility | null
  setSelectedFacility: (f: Facility | null) => void
  handleRequestLocation: () => void
  loading: boolean
}
```

The `mapRef` is created in `useDiscovery` and passed down, allowing the hook to call `mapRef.current?.flyTo(...)` and `mapRef.current?.fitBounds(...)` directly.

### Marker Types

1. **`FacilityMarker`** (memoized): Single facility pin. Jireh-approved facilities get a purple background and a "Jireh" badge; others are white/grey. Pharmacies use a `Pill` icon; all others use `Stethoscope`.

2. **`ClusterMarker`** (memoized): Purple circle showing count for clustered points.

### Clustering

Uses `use-supercluster` library. Bounds are computed from `viewState` using a utility function:
```typescript
function getBoundsFromViewState(view): [west, south, east, north]
// Approximates viewport bounds from zoom level without querying the actual map bounds
```

### Auto-fit on Search/Filter Change

When `filteredFacilities` changes, the map auto-fits:
- **Nearby mode** (no search): fits user location + nearest 3 facilities
- **Search mode**: fits all matching results

Uses `mapRef.current.fitBounds(...)` with `padding: 80` and `maxZoom: 15`.

---

## Facility Data Types

```typescript
// types.ts
interface Facility {
  id: string
  name: string
  registrationNumber: string
  facilityType: string     // matches one of FACILITY_TYPES
  facilityLevel: string    // "LEVEL 2" through "LEVEL 6B"
  county: string
  latitude: string         // string! Must parseFloat before use
  longitude: string        // string! Must parseFloat before use
  distance: number | null  // km from user, set by API
  verificationStatus: string  // "APPROVED" = in Jireh network
  hasActiveDiscount: boolean
  placeImageUrl: string
  phoneNumber: string
  
  // API-calculated
  facility: LinkedFacility | null  // linked KMPDC facility record
  
  // UI-optional fields
  rating?: number
  cashback?: string
  discountPercentage?: string
  recentlyVisited?: boolean
}
```

**Warning**: `latitude` and `longitude` are strings in the API response. Always use `parseFloat(facility.latitude)` before passing to Mapbox. The codebase checks for `isNaN` before rendering markers.

---

## FacilityList — Virtual Scrolling

`FacilityList` uses `ScrollArea` (Radix-based) for the list container:

```typescript
<ScrollArea className="h-full">
  <div className="p-4 pt-0 space-y-3 pb-20">
    {loading ? Array.from({ length: 5 }).map(() => <FacilityCardSkeleton />) : ...}
    {filteredFacilities.map(f => <FacilityCard key={f.id} facility={f} />)}
  </div>
</ScrollArea>
```

No virtualization library (windowing) is used — the ScrollArea handles overflow. For large result sets (100+ facilities), this renders all cards in the DOM. This may be a performance concern for low-end Android devices.

---

## Search / Filter Flow

```
[User types in search box]
       ↓ (debounced via useDeferredValue)
searchFacilities(term, filterType, filterLevel)
  → GET /healthcare/discovery/search
  → setFacilities(results)
  → filteredFacilities recomputed (tab filter only in search mode)
  → mapRef.fitBounds(all results)

[User changes filterType or filterLevel without search term]
       ↓
fetchNearbyFacilities(userLat, userLng, filterType, filterLevel)
  → parameters sent to API
  → results filtered client-side for tab
  → map fits to nearest 3

[User clears search]
       ↓
If userLocation exists:
  fetchNearbyFacilities(userLat, userLng, filterType, filterLevel)
```

---

## Facility Details Page

`FacilityDetailsPage.tsx` is a full-page view for a selected facility. It is navigated to from `FacilityCard` actions (e.g., "Pay here" or "View details").

Route: no dedicated route — it's rendered inside the dashboard layout as a push navigation. The selected facility data is passed via React Router state or navigated to the path with a facility ID param.

---

## Filter Constants

```typescript
// constants.ts
export const FACILITY_TYPES = [
  "BASIC HEALTH CENTRE", "DISPENSARY", "HEALTH CENTRE",
  "HOSPITAL LEVEL 4", "HOSPITAL LEVEL 5", "MEDICAL CLINIC",
  "PHARMACY", ... (35+ values)
]

export const FACILITY_LEVELS = [
  "LEVEL 2", "LEVEL 3A", "LEVEL 3B",
  "LEVEL 4", "LEVEL 4B", "LEVEL 5", "LEVEL 6A", "LEVEL 6B"
]
```

These are also sent to the API as filter parameters.

---

## Analytics Events

```typescript
EVENTS.DISCOVERY.SEARCH_SUBMIT        // { resultCount, triggerSource }
EVENTS.DISCOVERY.LOCATION_GRANTED     // user granted geolocation
EVENTS.DISCOVERY.LOCATION_DENIED      // user denied geolocation
EVENTS.DISCOVERY.LOCATION_ERROR       // { errorCode } (GPS/timeout error)
EVENTS.DISCOVERY.FACILITY_TAP         // { facilityId, facilityType, isJirehNetwork }
```

---

## Gotchas

1. **Latitude/longitude are strings**: The `Facility.latitude` and `Facility.longitude` fields are `string` in the type definition. Always `parseFloat()` before using with Mapbox. The `FacilityMarker` and `flyToFacility` both guard with `isNaN` checks.

2. **Permission-denied does not auto-dismiss**: If the user denies geolocation, `permissionStatus` is set to `"denied"` and the `LocationPermissionPrompt` shows a different message. There is no path to retry without reloading the page (browser permission must be changed in settings).

3. **sessionStorage cleared on signOut**: `patientAuthStore.signOut()` calls `sessionStorage.removeItem("discovery_tab_state")`. This resets the map to Nairobi on the next session.

4. **No windowing**: `FacilityList` renders all filtered facilities in the DOM without virtualization. If a search returns 500+ results, this could cause frame drops on low-end Android devices.

5. **Map Mapbox token**: The Mapbox access token must be set via `VITE_MAPBOX_ACCESS_TOKEN`. If missing, the map will fail silently with a blank container. No graceful fallback is implemented.

6. **Distance is API-computed**: The `distance` field on a `Facility` object is set by the backend when using the nearby endpoint. When using the search endpoint, `distance` may be `null`. `FacilityCard` should handle `null` distance gracefully.
