import { useQuery } from "@tanstack/react-query"
import { usePatientLoginDetails } from "@/hooks/usePatientLoginDetails"
import { DiscountCode } from "../components/DiscountsSection"
import { useEligibleDiscountCodes } from "./useEligibleDiscountCodes"
import { supabase } from "@/lib/supabase"

export function usePatientDashboardData(activeTab: string) {
  const { isOffline } = usePatientLoginDetails()

  // 1. Loan stats (no loans in Supabase yet — return zeroes)
  const {
    data: loanStats,
    isSuccess: isStatsSuccess,
    isError: isStatsError
  } = useQuery({
    queryKey: ["loanStats"],
    queryFn: async () => ({
      totalLoans: 0,
      activeLoans: 0,
      totalAmountBorrowed: 0,
      totalAmountRepaid: 0,
      outstandingBalance: 0,
    }),
    enabled: !isOffline,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always" as const,
  })

  // 2. Dashboard alerts (not in Supabase yet)
  const {
    data: dashboardAlert,
    isSuccess: isAlertSuccess,
    isError: isAlertError
  } = useQuery({
    queryKey: ["dashboardAlert"],
    queryFn: async () => null,
    enabled: !isOffline && isStatsSuccess,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always" as const,
  })

  // 3. Manual payment requests (not in Supabase yet)
  const {
    data: paymentRequests = [],
    isSuccess: isRequestsSuccess,
    isError: isRequestsError
  } = useQuery({
    queryKey: ["paymentRequests"],
    queryFn: async () => [],
    enabled: !isOffline && activeTab === "payments" && isAlertSuccess,
    staleTime: 1 * 60 * 1000
  })

  // 4. Fetch eligible discount codes
  const {
    data: discounts = [],
    isSuccess: isDiscountsSuccess,
    isError: isDiscountsError,
  } = useEligibleDiscountCodes(
    !isOffline && activeTab === "payments" && isAlertSuccess,
  )

  // 5. Fetch payment history
  const {
    data: paymentHistory,
    isSuccess: isPaymentHistorySuccess,
    isError: isPaymentHistoryError
  } = useQuery({
    queryKey: ["paymentHistory"],
    queryFn: async () => {
      const { data: payments, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error

      const { data: wallet } = await supabase
        .from("wallets")
        .select("cashback_balance")
        .single()

      return {
        payments: (payments ?? []).map((p: any) => ({
          id: p.id,
          amount: Number(p.amount),
          totalBillAmount: String(p.amount),
          status: p.status,
          createdAt: p.created_at,
          facilityName: p.facility_name,
          facilityType: p.facility_type,
          currency: p.currency || "KES",
          lineItems: p.line_items ?? [],
          fundingSources: p.funding_sources ?? [],
          cashbackAmount: Number(p.cashback_amount ?? 0),
        })),
        loans: [],
        medicalRequests: [],
        careFundAccount: {
          id: 1,
          careFundBalance: String(wallet?.cashback_balance ?? 0),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          accountOwner: null,
          currency: { countryName: "Kenya", code: "KES", id: 1 },
        },
      }
    },
    enabled: !isOffline,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always" as const,
  })

  const isLoanStatsPending = !isOffline && !isStatsSuccess && !isStatsError;
  const isAlertPending = !isOffline && isStatsSuccess && !isAlertSuccess && !isAlertError;
  const isRequestsPending = !isOffline && activeTab === "payments" && isAlertSuccess && !isRequestsSuccess && !isRequestsError;
  const isDiscountsPending = !isOffline && activeTab === "payments" && isAlertSuccess && !isDiscountsSuccess && !isDiscountsError;
  const isPaymentHistoryPending = !isOffline && !isPaymentHistorySuccess && !isPaymentHistoryError;

  return {
    dashboardAlert,
    loanStats,
    paymentRequests,
    discounts: discounts as DiscountCode[],
    loans: paymentHistory?.loans || [],
    payments: paymentHistory?.payments || [],
    medicalRequests: paymentHistory?.medicalRequests || [],
    cashback: paymentHistory?.careFundAccount || null,
    isLoading: isLoanStatsPending || isAlertPending || isRequestsPending || isDiscountsPending || isPaymentHistoryPending
  }
}
