import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { usePatientLoginDetails } from "@/hooks/usePatientLoginDetails"
import { DiscountCode } from "../components/DiscountsSection"
import { useEligibleDiscountCodes } from "./useEligibleDiscountCodes"

export function usePatientDashboardData(activeTab: string) {
  const { isOffline } = usePatientLoginDetails()

  // 1. Fetch loan stats first
  // This is the highest priority data for the dashboard
  const { 
    data: loanStats, 
    isSuccess: isStatsSuccess,
    isError: isStatsError
  } = useQuery({
    queryKey: ["loanStats"],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/loans/patient/me/stats`)
      return response.data
    },
    enabled: !isOffline,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always" as const,
  })

  // 2. Then fetch alerts
  // Dependent on loanStats success to ensure strict ordering
  const { 
    data: dashboardAlert, 
    isSuccess: isAlertSuccess,
    isError: isAlertError
  } = useQuery({
    queryKey: ["dashboardAlert"],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/alerts/dashboard`)
      return response.data?.alert_id ? response.data : null
    },
    // Only fetch alerts after loan stats are successfully loaded
    enabled: !isOffline && isStatsSuccess,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always" as const,
  })

  // 3. Then fetch manual requests
  // Dependent on alerts success and active tab
  const { 
    data: paymentRequests = [], 
    isSuccess: isRequestsSuccess,
    isError: isRequestsError
  } = useQuery({
    queryKey: ["paymentRequests"],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/patients/payments/manual-requests`)
      return response.data?.requests || []
    },
    // Only fetch requests after alerts are loaded and if we're on the payments tab
    enabled: !isOffline && activeTab === "payments" && isAlertSuccess,
    staleTime: 1 * 60 * 1000 
  })

  // 4. Fetch eligible discount codes (shared with the Explore tab via the
  // common queryKey in useEligibleDiscountCodes).
  // Dependent on alerts success and active tab
  const {
    data: discounts = [],
    isSuccess: isDiscountsSuccess,
    isError: isDiscountsError,
  } = useEligibleDiscountCodes(
    !isOffline && activeTab === "payments" && isAlertSuccess,
  )

  // 5. Fetch payment history (loans, payments, medical requests, cashback)
  const { 
    data: paymentHistory,
    isSuccess: isPaymentHistorySuccess,
    isError: isPaymentHistoryError
  } = useQuery({
    queryKey: ["paymentHistory"],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/patients/payment-history`)
      return response.data
    },
    enabled: !isOffline,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always" as const,
  })

  // Calculate loading state based on the sequence
  // We consider it loading if a step is pending (not success and not error)
  // This prevents UI flashing between sequential requests
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
    // The aggregate loading state remains true until all required data for the current sequence is resolved
    isLoading: isLoanStatsPending || isAlertPending || isRequestsPending || isDiscountsPending || isPaymentHistoryPending
  }
}
