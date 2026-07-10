import { ReactNode, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/Skeleton"
import { formatDateLong } from "@/utilities/dateUtilities"

/**
 * Canonical "grouped-by-date transaction list" scaffold.
 *
 * Every history surface — payment history, loan history, cashback /
 * care-fund transactions, the dashboard payment feed — is the SAME layout:
 * rows grouped under a date header, newest first, with a shared empty and
 * loading state. Only the row content differs. This component owns that
 * scaffold once so those surfaces can't drift apart again; callers supply the
 * items and a `renderItem` for the content-specific card (PaymentCard,
 * LoanCard, CashbackCard …).
 *
 * Do NOT re-implement date grouping or the group-header markup at a call
 * site — pass items here instead.
 */

interface TransactionHistoryListProps<T> {
  items: T[]
  /** Row renderer — the content-specific card (PaymentCard, LoanCard, …). */
  renderItem: (item: T) => ReactNode
  /** Stable React key for a row. */
  getKey: (item: T) => string | number
  /** ISO date string a row is grouped/sorted by (e.g. `item.createdAt`). */
  getDate: (item: T) => string
  isLoading?: boolean
  /** Shown when there are no items and not loading. */
  emptyState?: ReactNode
  /** Layout-only className for the outer container. */
  className?: string
}

interface DateGroup<T> {
  date: string
  items: T[]
}

/** Sort newest-first, then group consecutive rows sharing a long-date label. */
function groupByDate<T>(
  items: T[],
  getDate: (item: T) => string
): DateGroup<T>[] {
  const sorted = [...items].sort(
    (a, b) => new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime()
  )

  const groups: DateGroup<T>[] = []
  sorted.forEach((item) => {
    const date = formatDateLong(getDate(item))
    const lastGroup = groups[groups.length - 1]
    if (lastGroup && lastGroup.date === date) {
      lastGroup.items.push(item)
    } else {
      groups.push({ date, items: [item] })
    }
  })
  return groups
}

export function TransactionHistoryList<T>({
  items,
  renderItem,
  getKey,
  getDate,
  isLoading,
  emptyState,
  className,
}: TransactionHistoryListProps<T>) {
  const groups = useMemo(() => groupByDate(items, getDate), [items, getDate])

  if (isLoading) {
    return <TransactionHistoryListSkeleton className={className} />
  }

  if (groups.length === 0) {
    return <>{emptyState ?? <TransactionHistoryEmptyState />}</>
  }

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {groups.map((group) => (
        <div key={group.date} className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground font-medium ml-1">
            {group.date}
          </p>
          <div className="flex flex-col gap-3">
            {group.items.map((item) => (
              <div key={getKey(item)}>{renderItem(item)}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Default empty state — a call site can override via `emptyState`. */
export function TransactionHistoryEmptyState({
  message = "No history yet.",
}: {
  message?: string
}) {
  return (
    <div className="text-center text-muted-foreground py-10 bg-muted rounded-xl border border-dashed border-border">
      {message}
    </div>
  )
}

/** Shared skeleton mirroring the grouped-list rhythm. */
export function TransactionHistoryListSkeleton({
  className,
}: {
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {[3, 2].map((rowCount, groupIndex) => (
        <div key={groupIndex} className="flex flex-col gap-3">
          <Skeleton className="h-4 w-20 ml-1" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center gap-3"
              >
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <Skeleton className="h-4 w-3/4 max-w-[12rem]" />
                  <Skeleton className="h-3 w-1/2 max-w-[8rem]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
