import { useState, useEffect, useCallback } from "react"

export function useLocationPermission() {
  const [locationPermission, setLocationPermission] = useState<PermissionState | "unknown">("unknown")
  const [loading, setLoading] = useState(false)

  const checkPermission = useCallback(async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: "geolocation" })
        setLocationPermission(result.state)
        
        result.onchange = () => {
          setLocationPermission(result.state)
        }
      }
    } catch (e) {
      console.error("Error checking location permission:", e)
    }
  }, [])

  useEffect(() => {
    checkPermission()
  }, [checkPermission])

  const requestLocation = useCallback(async () => {
    setLoading(true)
    return new Promise<void>((resolve, reject) => {
      if (!navigator.geolocation) {
        setLoading(false)
        reject(new Error("Geolocation is not supported"))
        return
      }

      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationPermission("granted")
          setLoading(false)
          resolve()
        },
        (error) => {
          setLoading(false)
          // error.code === 1 means permission denied
          if (error.code === 1) {
            setLocationPermission("denied")
          }
          reject(error)
        }
      )
    })
  }, [])

  return {
    locationPermission,
    requestLocation,
    loading
  }
}
