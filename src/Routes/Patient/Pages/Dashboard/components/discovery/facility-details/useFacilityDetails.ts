import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { FacilityDetail } from "../types"

const STALE_TIME_MS = 5 * 60 * 1000

export function useFacilityDetails(facilityId: string | undefined) {
  return useQuery({
    queryKey: ["facility-details", facilityId],
    enabled: Boolean(facilityId),
    staleTime: STALE_TIME_MS,
    retry: 1,
    queryFn: async (): Promise<FacilityDetail> => {
      const response = await axios.get<FacilityDetail>(
        `${import.meta.env.VITE_API_BASE_URL}/healthcare/discovery/facilities/${facilityId}`
      )
      return response.data
    },
  })
}
