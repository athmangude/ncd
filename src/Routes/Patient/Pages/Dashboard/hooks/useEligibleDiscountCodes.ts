import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { DiscountCode } from "../components/DiscountsSection"

// Single source of truth for the patient's eligible discount codes.
// Shared between the Payments tab (DiscountsSection) and the Explore tab
// (DiscoveryHomeView) so both surfaces show the same list. React Query
// dedupes the network call via the shared queryKey.
export function useEligibleDiscountCodes(enabled: boolean) {
  return useQuery<DiscountCode[]>({
    queryKey: ["eligibleDiscountCodes"],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/discount-codes/eligible`,
      )
      const discountsData = response.data?.data || response.data || []
      return Array.isArray(discountsData)
        ? discountsData.filter(
            (d: DiscountCode) => d.isActive && d.isValid,
          )
        : []
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}
