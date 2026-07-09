import { PaymentCard } from "@/components/YourPayments"
import { SectionTitle } from "@/components/SectionTitle"
import {
  TransactionHistoryList,
  TransactionHistoryListSkeleton,
} from "@/components/TransactionHistoryList"

interface SortedPaymentsProps {
  sortedPayments: any[]
  isLoading?: boolean
}

export function SortedPayments({
  sortedPayments,
  isLoading,
}: SortedPaymentsProps) {
  if (isLoading) {
    return (
      <>
        <div className="flex justify-between items-center mt-2">
          <SectionTitle>Payment History</SectionTitle>
        </div>
        <TransactionHistoryListSkeleton className="pb-24" />
      </>
    )
  }

  if (sortedPayments.length === 0) return null

  return (
    <>
      <div className="flex justify-between items-center mt-2">
        <SectionTitle>Payment History</SectionTitle>
      </div>

      <TransactionHistoryList
        className="pb-24"
        items={sortedPayments}
        getKey={(payment: any) => payment.id}
        getDate={(payment: any) => payment.createdAt}
        renderItem={(payment: any) => <PaymentCard payment={payment} />}
      />
    </>
  )
}
