import { useQuery } from "@tanstack/react-query"
import axios from "axios"
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
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/patients/payment-history`)
      return response.data as PaymentHistoryData
    },
    enabled: !isOffline,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
