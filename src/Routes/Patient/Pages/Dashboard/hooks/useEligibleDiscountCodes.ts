import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { DiscountCode } from "../components/DiscountsSection"

export function useEligibleDiscountCodes(enabled: boolean) {
  return useQuery<DiscountCode[]>({
    queryKey: ["eligibleDiscountCodes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
      if (error) throw error
      return (data ?? [])
        .map((r) => ({
          id: r.id,
          code: r.code,
          description: r.description,
          discountType: r.discount_type,
          discountValue: r.discount_value,
          currency: r.currency,
          context: r.context,
          discountAmount: r.discount_amount,
          validFrom: r.valid_from,
          validUntil: r.valid_until,
          minimumOrderAmount: r.minimum_order_amount,
          maximumDiscountAmount: r.maximum_discount_amount,
          isActive: r.is_active,
          isValid: r.is_valid,
        }))
        .filter(
          (d: DiscountCode) => d.isActive && d.isValid,
        )
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}
