import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { usePatientLoginDetails } from "@/hooks/usePatientLoginDetails"
import { DiscountCode } from "../components/DiscountsSection"
import { useEligibleDiscountCodes } from "./useEligibleDiscountCodes"
import { useSupabase, supabase } from "@/lib/supabase"

export function usePatientDashboardData(activeTab: string) {
  const { isOffline } = usePatientLoginDetails()

  // 1. Fetch loan stats first
  const {
    data: loanStats,
    isSuccess: isStatsSuccess,
    isError: isStatsError
  } = useQuery({
    queryKey: ["loanStats"],
    queryFn: async () => {
      if (useSupabase) {
        return {
          totalLoans: 0,
          activeLoans: 0,
          totalAmountBorrowed: 0,
          totalAmountRepaid: 0,
          outstandingBalance: 0,
        }
      }
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/loans/patient/me/stats`)
      return response.data
    },
    enabled: !isOffline,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always" as const,
  })

  // 2. Then fetch alerts
  const {
    data: dashboardAlert,
    isSuccess: isAlertSuccess,
    isError: isAlertError
  } = useQuery({
    queryKey: ["dashboardAlert"],
    queryFn: async () => {
      if (useSupabase) return null
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/alerts/dashboard`)
      return response.data?.alert_id ? response.data : null
    },
    enabled: !isOffline && isStatsSuccess,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always" as const,
  })

  // 3. Then fetch manual requests
  const {
    data: paymentRequests = [],
    isSuccess: isRequestsSuccess,
    isError: isRequestsError
  } = useQuery({
    queryKey: ["paymentRequests"],
    queryFn: async () => {
      if (useSupabase) return []
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/patients/payments/manual-requests`)
      return response.data?.requests || []
    },
    enabled: !isOffline && activeTab === "payments" && isAlertSuccess,
    staleTime: 1 * 60 * 1000
  })

  // 4. Fetch eligible discount codes
  const {
    data: discounts = [],
    isSuccess: isDiscountsSuccess,
    isError: isDiscountsError,
  } = useEligibleDiscountCodes(
    !isOffline && activeTab === "payments" && isAlertSuccess && !useSupabase,
  )

  // 5. Fetch payment history
  const {
    data: paymentHistory,
    isSuccess: isPaymentHistorySuccess,
    isError: isPaymentHistoryError
  } = useQuery({
    queryKey: ["paymentHistory"],
    queryFn: async () => {
      if (useSupabase) {
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
      }

      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/patients/payment-history`)
      return response.data
    },
    enabled: !isOffline,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always" as const,
  })

  const isLoanStatsPending = !isOffline && !isStatsSuccess && !isStatsError;
  const isAlertPending = !isOffline && isStatsSuccess && !isAlertSuccess && !isAlertError;
  const isRequestsPending = !isOffline && activeTab === "payments" && isAlertSuccess && !isRequestsSuccess && !isRequestsError;
  const isDiscountsPending = !isOffline && activeTab === "payments" && isAlertSuccess && !isDiscountsSuccess && !isDiscountsError && !useSupabase;
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
