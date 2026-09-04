import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { usePatientLoginDetails } from "@/hooks/usePatientLoginDetails"

export interface PaymentHistoryData {
  loans: any[]
  payments: any[]
  medicalRequests: any[]
  careFundAccount: any
}

export function usePaymentHistory() {
  const { isOffline } = usePatientLoginDetails()

  return useQuery({
    queryKey: ["paymentHistory"],
    queryFn: async (): Promise<PaymentHistoryData> => {
      const [paymentsResult, loansResult, walletsResult, requestsResult] =
        await Promise.all([
          supabase
            .from("payments")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("loans")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase.from("wallets").select("*").maybeSingle(),
          supabase
            .from("manual_requests")
            .select("*")
            .order("created_at", { ascending: false }),
        ])

      if (paymentsResult.error) throw paymentsResult.error
      if (loansResult.error) throw loansResult.error

      return {
        payments:
          paymentsResult.data?.map((p) => ({
            id: p.id,
            totalBillAmount: p.amount,
            facilityName: p.facility_name,
            facilityType: p.facility_type,
            currency: { code: p.currency ?? "KES" },
            status: p.status,
            createdAt: p.created_at,
            updatedAt: p.created_at,
            paymentSplits: p.payment_splits,
            cashbackAmount: p.cashback_amount,
            cashbackDetails: p.cashback_details,
            description: p.description,
            lineItems: p.line_items,
            fundingSources: p.funding_sources,
            patientMedicalInfoRequest: p.patient_medical_info_request,
            disbursementTransaction: p.disbursement_transaction,
          })) ?? [],
        loans:
          loansResult.data?.map((l) => ({
            id: l.id,
            amount: l.amount,
            totalBillAmount: l.total_bill_amount,
            outstandingAmount: l.outstanding_amount,
            totalPaid: l.total_paid,
            status: l.status,
            currency: l.currency,
            loanDueDate: l.loan_due_date,
            loanType: l.loan_type,
            createdAt: l.created_at,
            patientMedicalInfoRequest: l.patient_medical_info_request,
            patientName: l.patient_name,
            transactions: l.transactions,
            accumulatedInterestAmount: l.accumulated_interest_amount,
            lateFees: l.late_fees,
            firstPaymentDue: l.first_payment_due,
            careFundDiscountAmount: l.care_fund_discount_amount,
          })) ?? [],
        medicalRequests:
          requestsResult.data?.map((r) => ({
            id: r.id,
            careProviderName: r.care_provider_name,
            billAmount: r.bill_amount,
            status: r.status,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            paymentInfo: r.payment_info,
            reason: r.reason,
            patient: r.patient,
            dependent: r.dependent,
            kmpdcFacility: r.kmpdc_facility,
            invoiceFile: r.invoice_file,
          })) ?? [],
        careFundAccount: walletsResult.data
          ? {
              cashbackBalance: walletsResult.data.cashback_balance,
              updatedAt: walletsResult.data.updated_at,
            }
          : null,
      }
    },
    enabled: !isOffline,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
