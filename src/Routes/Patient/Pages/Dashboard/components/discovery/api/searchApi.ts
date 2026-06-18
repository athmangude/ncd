import axios from "axios"

const BASE = `${import.meta.env.VITE_API_BASE_URL}/patients/discovery`

export interface FacilityRef {
  id: number
  name: string
}

export interface RecentSearch {
  id: string
  facility: FacilityRef
}

export interface PreferredProvider {
  id: string
  facility: FacilityRef
}

export async function fetchRecentSearches(): Promise<RecentSearch[]> {
  const { data } = await axios.get<{ recent: RecentSearch[] }>(
    `${BASE}/recent-searches`,
    { withCredentials: true }
  )
  return data.recent
}

export async function logRecentSearch(facilityId: number): Promise<void> {
  await axios.post(
    `${BASE}/recent-searches`,
    { facilityId },
    { withCredentials: true }
  )
}

export async function fetchPreferredProviders(): Promise<PreferredProvider[]> {
  const { data } = await axios.get<{ preferred: PreferredProvider[] }>(
    `${BASE}/preferred-providers`,
    { withCredentials: true }
  )
  return data.preferred
}

export async function addPreferredProvider(facilityId: number): Promise<void> {
  await axios.post(
    `${BASE}/preferred-providers`,
    { facilityId },
    { withCredentials: true }
  )
}

export async function removePreferredProvider(
  facilityId: number
): Promise<void> {
  await axios.delete(`${BASE}/preferred-providers/${facilityId}`, {
    withCredentials: true,
  })
}
