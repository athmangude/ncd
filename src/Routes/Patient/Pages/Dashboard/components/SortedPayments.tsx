import { PaymentCard } from "@/components/YourPayments"
import { Skeleton } from "@/components/Skeleton"
import { formatDateLong } from "@/utilities/dateUtilities"

interface SortedPaymentsProps {
  sortedPayments: any[]
  isLoading?: boolean
}

// Group items by date (similar to PatientPaymentHistory)
const groupItemsByDate = (items: any[]) => {
  const groups: { date: string; items: any[] }[] = []
  items.forEach((item) => {
    const groupKey = formatDateLong(item.createdAt)

    const lastGroup = groups[groups.length - 1]
    if (lastGroup && lastGroup.date === groupKey) {
      lastGroup.items.push(item)
    } else {
      groups.push({ date: groupKey, items: [item] })
    }
  })
  return groups
}

export function SortedPayments({ sortedPayments, isLoading }: SortedPaymentsProps) {
  if (isLoading) {
    return (
      <>
        <div className="flex justify-between items-center mt-2">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="flex flex-col gap-3 pb-24">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 flex flex-col gap-3 bg-card border border-border rounded-xl shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 mr-2 space-y-2">
                  <Skeleton className="h-4 w-3/4 max-w-[14rem]" />
                  <Skeleton className="h-3 w-1/2 max-w-[8rem]" />
                </div>
                <Skeleton className="h-5 w-5 rounded shrink-0" />
              </div>
              <Skeleton className="h-3 w-full max-w-[10rem]" />
            </div>
          ))}
        </div>
      </>
    )
  }

  if (sortedPayments.length === 0) return null

  // Group payments by date
  const groupedPayments = groupItemsByDate(sortedPayments)

  return (
    <>
      <div className="flex justify-between items-center mt-2">
        <h3 className="font-bold text-lg text-neutral-900">Payment History</h3>
      </div>

      <div className="flex flex-col gap-6 pb-24">
        {groupedPayments.map((group) => (
          <div key={group.date} className="flex flex-col gap-3">
            <p className="text-sm text-neutral-500 font-medium ml-1">{group.date}</p>
            <div className="flex flex-col gap-3">
              {group.items.map((payment: any) => (
                <PaymentCard key={payment.id} payment={payment} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
