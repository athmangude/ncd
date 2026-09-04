import { supabase } from "@/lib/supabase"

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

// ---------------------------------------------------------------------------
// Recent searches
// ---------------------------------------------------------------------------

export async function fetchRecentSearches(): Promise<RecentSearch[]> {
  const { data, error } = await supabase
    .from("recent_searches")
    .select("id, facility:facilities(id, name)")
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) throw error
  return (data ?? []) as unknown as RecentSearch[]
}

export async function logRecentSearch(facilityId: number): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Not authenticated")

  const userId = user.id

  // Remove any existing entry for the same facility
  await supabase
    .from("recent_searches")
    .delete()
    .eq("user_id", userId)
    .eq("facility_id", facilityId)

  // Insert new entry
  const { error: insertError } = await supabase
    .from("recent_searches")
    .insert({
      id: "recent-" + Date.now().toString(36),
      user_id: userId,
      facility_id: facilityId,
    })

  if (insertError) throw insertError

  // Trim to 10 most recent entries
  const { data: allRows, error: fetchError } = await supabase
    .from("recent_searches")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (fetchError) throw fetchError

  if (allRows && allRows.length > 10) {
    const idsToDelete = allRows.slice(10).map((r) => r.id)
    await supabase
      .from("recent_searches")
      .delete()
      .in("id", idsToDelete)
  }
}

// ---------------------------------------------------------------------------
// Preferred providers
// ---------------------------------------------------------------------------

export async function fetchPreferredProviders(): Promise<PreferredProvider[]> {
  const { data, error } = await supabase
    .from("preferred_providers")
    .select("id, facility:facilities(id, name)")
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as PreferredProvider[]
}

export async function addPreferredProvider(facilityId: number): Promise<void> {
  const { error } = await supabase.from("preferred_providers").insert({
    id: "pref-" + Date.now().toString(36),
    facility_id: facilityId,
  })

  if (error) throw error
}

export async function removePreferredProvider(
  facilityId: number,
): Promise<void> {
  const { error } = await supabase
    .from("preferred_providers")
    .delete()
    .eq("facility_id", facilityId)

  if (error) throw error
}
