import { useMemo } from "react"
import { usePaymentHistory } from "@/Routes/Patient/hooks/usePaymentHistory"
import { PaymentCard } from "@/components/YourPayments"
import { TransactionHistoryList } from "@/components/TransactionHistoryList"

interface MyActivityTabProps {
  facilityId: string
}

export function MyActivityTab({ facilityId }: MyActivityTabProps) {
  const { data, isLoading } = usePaymentHistory()

  const payments = useMemo(() => {
    if (!data?.payments) return []
    return data.payments.filter(
      (p: any) =>
        String(p?.patientMedicalInfoRequest?.facility?.id ?? "") ===
        String(facilityId)
    )
  }, [data?.payments, facilityId])

  return (
    <div className="px-4 py-4">
      <TransactionHistoryList
        items={payments}
        isLoading={isLoading}
        getKey={(payment: any) => payment.id}
        getDate={(payment: any) => payment.createdAt}
        renderItem={(payment: any) => (
          <PaymentCard
            payment={payment}
            navigationState={{ from: "facility-details", facilityId }}
          />
        )}
        emptyState={
          <div className="text-center py-12 text-sm text-muted-foreground">
            No previous payments at this facility.
          </div>
        }
      />
    </div>
  )
}
