import { useEffect, useState } from "react"

interface UseOfflinePatientDataOptions {
  endpoint: string
  fetchFn: () => Promise<any>
  onError?: (error: Error) => void
}

interface UseOfflinePatientDataResult<T> {
  data: T | null
  isLoading: boolean
  isError: boolean
  error: Error | null
  isOffline: boolean
  refetch: () => Promise<void>
}

/**
 * Hook to fetch patient data with offline support.
 * This hook will attempt to fetch data from the network first, then fall back to the cached version if offline.
 */
export function useOfflinePatientData<T>({
  endpoint,
  fetchFn,
  onError,
}: UseOfflinePatientDataOptions): UseOfflinePatientDataResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isError, setIsError] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine)

  // Function to fetch data
  const fetchData = async () => {
    setIsLoading(true)
    setIsError(false)
    setError(null)

    try {
      const result = await fetchFn()
      setData(result)
      setIsOffline(false)
    } catch (err) {
      const error = err as Error
      //'[useOfflinePatientData] Fetch error:', error.message);

      // Check if we're offline or if this is a network error
      const isNetworkError =
        !navigator.onLine ||
        error.message.includes("Failed to fetch") ||
        error.message.includes("Network")

      if (isNetworkError) {
        setIsOffline(true)
        //'[useOfflinePatientData] Network error detected, attempting offline fallback...');

        // Try to get data from IndexedDB
        try {
          const db = await openPatientDatabase()
          const storedData = await getDataFromIndexedDB(db, endpoint)

          if (storedData) {
            //'[useOfflinePatientData] Successfully retrieved data from IndexedDB');
            setData(storedData.data)
            setIsError(false)
            setError(null)
          } else {
            //'[useOfflinePatientData] No data found in IndexedDB');
            setIsError(true)
            setError(error)
          }

          db.close()
        } catch (dbError) {
          console.error(
            "[useOfflinePatientData] Failed to retrieve offline data:",
            dbError
          )
          setIsError(true)
          setError(error)
        }
      } else {
        // Not a network error, propagate it
        setIsError(true)
        setError(error)
      }

      if (onError) {
        onError(error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      fetchData() // Refresh data when coming online
    }

    const handleOffline = () => {
      setIsOffline(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
    // Mount-only listener setup; fetchData captures current closure for use inside handleOnline.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchData()
    // Triggered on endpoint change; fetchData is recreated each render and including it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint])

  return {
    data,
    isLoading,
    isError,
    error,
    isOffline,
    refetch: fetchData,
  }
}

// Helper functions for IndexedDB operations
const DB_NAME = "JirehHealthDB"
const PATIENT_STORE = "patientData"
const DB_VERSION = 1

async function openPatientDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error("Failed to open database"))
    }

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result)
    }

    // This should already be handled by the service worker,
    // but we include it here as a fallback
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(PATIENT_STORE)) {
        db.createObjectStore(PATIENT_STORE, { keyPath: "id" })
      }
    }
  })
}

interface StoredData {
  id: string
  data: any
  timestamp: number
  endpoint: string
}

async function getDataFromIndexedDB(
  db: IDBDatabase,
  endpoint: string
): Promise<StoredData | null> {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([PATIENT_STORE], "readonly")
      const store = transaction.objectStore(PATIENT_STORE)
      const request = store.getAll()

      request.onsuccess = () => {
        const allData = request.result as StoredData[]

        // Find data for the specific endpoint
        const matchingData = allData.filter(
          (item) => item.endpoint === endpoint
        )

        if (matchingData.length > 0) {
          // Sort by timestamp to get the most recent
          const sortedData = matchingData.sort(
            (a, b) => b.timestamp - a.timestamp
          )
          resolve(sortedData[0])
        } else {
          resolve(null)
        }
      }

      request.onerror = () => {
        reject(new Error("Failed to get data from IndexedDB"))
      }
    } catch (error) {
      reject(error)
    }
  })
}
