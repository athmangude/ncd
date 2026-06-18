import { usePaymentHistory } from "@/Routes/Patient/hooks/usePaymentHistory"
import { Skeleton } from "@/components/Skeleton"

export function MemberBalanceCard() {
  const { data, isLoading } = usePaymentHistory()

  if (isLoading) {
    return <Skeleton className="h-24 w-full rounded-xl" />
  }

  const careFundAccount = data?.careFundAccount
  const balance =
    careFundAccount?.careFundBalance != null
      ? parseFloat(String(careFundAccount.careFundBalance))
      : 0
  const formattedBalance = balance.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <div className="rounded-xl bg-neutral-50 p-4">
      <span className="inline-block rounded-full bg-purple-100 px-3 py-0.5 text-sm font-medium text-purple-700">
        Care fund
      </span>
      <p className="mt-3 text-sm text-neutral-500">Your Balance (KES):</p>
      <p className="text-xl font-medium font-mono text-neutral-900">{formattedBalance}</p>
    </div>
  )
}
