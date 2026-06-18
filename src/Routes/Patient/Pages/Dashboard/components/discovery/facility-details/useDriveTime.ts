import { useQuery } from "@tanstack/react-query"

const STALE_TIME_MS = 60 * 60 * 1000 // 1 hour
const AVG_SPEED_KMH = 28 // rough urban driving speed for the estimate

interface DriveTimeArgs {
  origin: { lat: number; lng: number } | null
  destination: { lat: number; lng: number } | null
}

// Haversine great-circle distance in kilometres.
function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * Standalone prototype replacement for the Google Distance Matrix call.
 * Estimates driving time locally from the straight-line distance between the
 * user and the facility — no external API. Returns minutes (rounded), or null
 * when origin/destination is missing.
 */
export function useDriveTime({ origin, destination }: DriveTimeArgs) {
  const enabled = Boolean(origin && destination)
  const originKey = origin ? `${origin.lat},${origin.lng}` : "none"
  const destinationKey = destination
    ? `${destination.lat},${destination.lng}`
    : "none"

  return useQuery({
    queryKey: ["drive-time", originKey, destinationKey],
    enabled,
    staleTime: STALE_TIME_MS,
    retry: 0,
    queryFn: async (): Promise<number | null> => {
      if (!origin || !destination) return null
      // Inflate straight-line distance ~1.3x to approximate road distance.
      const km = distanceKm(origin, destination) * 1.3
      return Math.max(1, Math.round((km / AVG_SPEED_KMH) * 60))
    },
  })
}
