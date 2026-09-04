import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type {
  FacilityDetail,
  FacilityActiveDiscount,
  FacilityServiceListItem,
} from "../types"

const STALE_TIME_MS = 5 * 60 * 1000

export function useFacilityDetails(facilityId: string | undefined) {
  return useQuery({
    queryKey: ["facility-details", facilityId],
    enabled: Boolean(facilityId),
    staleTime: STALE_TIME_MS,
    retry: 1,
    queryFn: async (): Promise<FacilityDetail> => {
      const { data: row, error } = await supabase
        .from("facilities")
        .select("*")
        .eq("id", Number(facilityId))
        .single()
      if (error) throw error

      const { data: services } = await supabase
        .from("facility_services")
        .select("*")
        .eq("facility_id", Number(facilityId))

      const activeDiscounts: FacilityActiveDiscount[] = row.active_discount
        ? [row.active_discount as FacilityActiveDiscount]
        : []

      const mappedServices: FacilityServiceListItem[] = (services ?? []).map(
        (s) => ({
          id: String(s.id),
          name: s.name,
          code: s.code,
          category: s.category,
        }),
      )

      return {
        id: String(row.id),
        name: row.name,
        registrationNumber: row.registration_number ?? "",
        poBox: row.po_box ?? "",
        facilityType: row.facility_type ?? "",
        facilityLevel: row.facility_level ?? "",
        bedCapacity: row.bed_capacity ?? 0,
        county: row.county ?? "",
        status: row.status ?? "",
        plotNumber: row.plot_number ?? "",
        latitude: String(row.latitude ?? ""),
        longitude: String(row.longitude ?? ""),
        updatedAt: row.updated_at ?? "",
        createdAt: row.created_at ?? "",
        facility: row.linked_facility ?? null,
        placeImageUrl: row.place_image_url ?? "",
        phoneNumber: row.phone_number ?? "",
        distance: row.distance ?? null,
        hasActiveDiscount: activeDiscounts.length > 0,
        activeDiscount: activeDiscounts[0] ?? null,
        verificationStatus: row.verification_status ?? "",
        locationName: row.location_name ?? null,
        serviceCategories: row.service_categories ?? [],
        isOnboarded: Boolean(row.linked_facility),
        activeDiscounts,
        services: mappedServices,
      }
    },
  })
}
