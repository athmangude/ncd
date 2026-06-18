import { useMemo } from "react"
import { usePaymentHistory } from "@/Routes/Patient/hooks/usePaymentHistory"
import { PaymentCard } from "@/components/YourPayments"

interface MyActivityTabProps {
  facilityId: string
}

export function MyActivityTab({ facilityId }: MyActivityTabProps) {
  const { data, isLoading } = usePaymentHistory()

  const payments = useMemo(() => {
    if (!data?.payments) return []
    return data.payments
      .filter(
        (p: any) =>
          String(p?.patientMedicalInfoRequest?.facility?.id ?? "") ===
          String(facilityId)
      )
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  }, [data?.payments, facilityId])

  if (isLoading) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        Loading payments...
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        No previous payments at this facility.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      {payments.map((payment: any) => (
        <PaymentCard
          key={payment.id}
          payment={payment}
          navigationState={{ from: "facility-details", facilityId }}
        />
      ))}
    </div>
  )
}
