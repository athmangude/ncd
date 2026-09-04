import { useQuery } from "@tanstack/react-query"
import { usePatientLoginDetails } from "@/hooks/usePatientLoginDetails"
import { DiscountCode } from "../components/DiscountsSection"
import { useEligibleDiscountCodes } from "./useEligibleDiscountCodes"
import { supabase } from "@/lib/supabase"

export function usePatientDashboardData(activeTab: string) {
  const { isOffline } = usePatientLoginDetails()

  const {
    data: loanStats,
    isSuccess: isStatsSuccess,
    isError: isStatsError,
  } = useQuery({
    queryKey: ["loanStats"],
    queryFn: async () => {
      const { data: loans, error } = await supabase
        .from("loans")
        .select("amount, outstanding_amount, total_paid, status")
      if (error) throw error

      const rows = loans ?? []
      return {
        totalLoans: rows.length,
        activeLoans: rows.filter((l) => l.status === "DISBURSED").length,
        totalAmountBorrowed: rows.reduce(
          (s, l) => s + Number(l.amount),
          0,
        ),
        totalAmountRepaid: rows.reduce(
          (s, l) => s + Number(l.total_paid ?? 0),
          0,
        ),
        outstandingBalance: rows.reduce(
          (s, l) => s + Number(l.outstanding_amount ?? 0),
          0,
        ),
      }
    },
    enabled: !isOffline,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always" as const,
  })

  const {
    data: dashboardAlert,
    isSuccess: isAlertSuccess,
    isError: isAlertError,
  } = useQuery({
    queryKey: ["dashboardAlert"],
    queryFn: async () => null,
    enabled: !isOffline && isStatsSuccess,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always" as const,
  })

  const {
    data: paymentRequests = [],
    isSuccess: isRequestsSuccess,
    isError: isRequestsError,
  } = useQuery({
    queryKey: ["paymentRequests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manual_requests")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      return (data ?? []).map((r: any) => ({
        id: r.id,
        careProviderName: r.care_provider_name,
        billAmount: r.bill_amount,
        paymentInfo: r.payment_info,
        reason: r.reason,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        patient: r.patient,
        dependent: r.dependent,
        kmpdcFacility: r.kmpdc_facility,
        invoiceFile: r.invoice_file,
      }))
    },
    enabled: !isOffline && activeTab === "payments" && isAlertSuccess,
    staleTime: 1 * 60 * 1000,
  })

  const {
    data: discounts = [],
    isSuccess: isDiscountsSuccess,
    isError: isDiscountsError,
  } = useEligibleDiscountCodes(
    !isOffline && activeTab === "payments" && isAlertSuccess,
  )

  const {
    data: paymentHistory,
    isSuccess: isPaymentHistorySuccess,
    isError: isPaymentHistoryError,
  } = useQuery({
    queryKey: ["paymentHistory"],
    queryFn: async () => {
      const { data: payments, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error

      const { data: loans } = await supabase
        .from("loans")
        .select("*")
        .order("created_at", { ascending: false })

      const { data: wallet } = await supabase
        .from("wallets")
        .select("cashback_balance")
        .maybeSingle()

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
          paymentSplits: p.payment_splits ?? [],
          cashbackDetails: p.cashback_details ?? [],
          userInfo: p.user_info,
          patientMedicalInfoRequest: p.patient_medical_info_request,
          disbursementTransaction: p.disbursement_transaction,
          description: p.description,
        })),
        loans: (loans ?? []).map((l: any) => ({
          id: l.id,
          amount: Number(l.amount),
          totalBillAmount: Number(l.total_bill_amount),
          outstandingAmount: Number(l.outstanding_amount),
          totalPaid: Number(l.total_paid),
          careFundDiscountAmount: Number(l.care_fund_discount_amount ?? 0),
          status: l.status,
          loanType: l.loan_type,
          currency: l.currency,
          createdAt: l.created_at,
          loanDueDate: l.loan_due_date,
          firstPaymentDue: l.first_payment_due,
          patientName: l.patient_name,
          patientMedicalInfoRequest: l.patient_medical_info_request,
          transactions: l.transactions ?? [],
        })),
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

  const isLoanStatsPending =
    !isOffline && !isStatsSuccess && !isStatsError
  const isAlertPending =
    !isOffline && isStatsSuccess && !isAlertSuccess && !isAlertError
  const isRequestsPending =
    !isOffline &&
    activeTab === "payments" &&
    isAlertSuccess &&
    !isRequestsSuccess &&
    !isRequestsError
  const isDiscountsPending =
    !isOffline &&
    activeTab === "payments" &&
    isAlertSuccess &&
    !isDiscountsSuccess &&
    !isDiscountsError
  const isPaymentHistoryPending =
    !isOffline && !isPaymentHistorySuccess && !isPaymentHistoryError

  return {
    dashboardAlert,
    loanStats,
    paymentRequests,
    discounts: discounts as DiscountCode[],
    loans: paymentHistory?.loans || [],
    payments: paymentHistory?.payments || [],
    medicalRequests: paymentHistory?.medicalRequests || [],
    cashback: paymentHistory?.careFundAccount || null,
    isLoading:
      isLoanStatsPending ||
      isAlertPending ||
      isRequestsPending ||
      isDiscountsPending ||
      isPaymentHistoryPending,
  }
}
