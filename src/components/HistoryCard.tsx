import { ReactNode } from "react"
import {
  TrendingUp,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Activity,
  ChevronRight,
  Clock,
  Link as LinkIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/Badge"
import { Button } from "@/components/Button"
import { Item, ItemContent, ItemTitle, ItemActions } from "@/components/Item"
import { formatMoney } from "@/utilities/currencyUtilities"
import { formatTime } from "@/utilities/dateUtilities"

/**
 * History card system — every payment / loan / cashback history row is built
 * from the SAME atoms so they are guaranteed to look identical.
 *
 * Anatomy:
 *  - `HistoryCard` is the single bordered card shell. Its children are stacked
 *    sub-entry `Item`s (no separators, just spacing).
 *  - Each sub-entry is one `Item`: an optional bare (un-boxed) leading icon, a
 *    title + subtitle, and optional trailing content (chevron / badge).
 *
 * A payment card = header row (+ cashback row?) (+ loan row?) composed here.
 * A loan card = header row + loan row (no cashback). A payment-derived cashback
 * card = the same as a payment card. A standalone cashback (transfer) = a lone
 * `HistoryCard` with a single `CashbackEntry`. Because the atoms are shared,
 * every surface stays in lockstep — edit a row here, it changes everywhere.
 */

/** The single bordered card shell. Sub-entry Items stack inside it. */
export function HistoryCard({
  children,
  onClick,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <div
      role={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex flex-col bg-card border border-border rounded-xl shadow-sm p-1",
        onClick && "cursor-pointer hover:bg-muted transition-colors",
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * One sub-entry row. Bare leading icon (no box/border), title + subtitle,
 * optional trailing. This is the atom every history row shares.
 */
export function HistoryEntry({
  icon,
  title,
  subtitle,
  trailing,
  className,
}: {
  icon?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  trailing?: ReactNode
  className?: string
}) {
  return (
    <Item className={cn("gap-3", className)}>
      {icon && (
        <span className="flex w-5 shrink-0 items-center justify-center self-start pt-0.5 text-muted-foreground [&_svg]:size-5">
          {icon}
        </span>
      )}
      <ItemContent className="self-start gap-0.5">
        <ItemTitle className="text-base text-foreground capitalize line-clamp-1">
          {title}
        </ItemTitle>
        {subtitle && (
          <div className="text-sm text-muted-foreground">{subtitle}</div>
        )}
      </ItemContent>
      {trailing && <ItemActions className="self-start">{trailing}</ItemActions>}
    </Item>
  )
}

/** "amount · time" — the shared subtitle for a transaction's header row. */
export function AmountTime({
  amount,
  currency,
  createdAt,
}: {
  amount: number
  currency: string
  createdAt: string
}) {
  return (
    <span>
      {formatMoney(amount, currency)} • {formatTime(createdAt)}
    </span>
  )
}

/** Shared chevron trailing affordance. */
export function HistoryChevron() {
  return <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
}

/**
 * Cashback sub-entry — used both inside a payment card and as a standalone
 * cashback-history card. `type`/who drives the label + icon.
 */
export function CashbackEntry({
  type,
  label,
  amount,
  currency,
  createdAt,
  who,
}: {
  type: string
  label: string
  amount: number
  currency: string
  createdAt: string
  who: { isReceiver: boolean; isSender: boolean }
}) {
  return (
    <HistoryEntry
      icon={resolveCashbackIcon(type, who)}
      title={label}
      subtitle={
        <AmountTime amount={amount} currency={currency} createdAt={createdAt} />
      }
    />
  )
}

/** The compact "Cashback earned / KES 30" row shown inside a payment card. */
export function CashbackEarnedEntry({
  amount,
  currency,
}: {
  amount: number
  currency: string
}) {
  return (
    <HistoryEntry
      icon={<LinkIcon className="rotate-45" />}
      title="Cashback earned"
      subtitle={formatMoney(amount, currency)}
    />
  )
}

/**
 * Loan sub-entry. When there's an outstanding balance it shows the due row +
 * a Pay-now action; when repaid it shows the repaid summary.
 */
export function LoanEntry({
  outstandingAmount,
  amount,
  currency,
  dueDate,
  formattedDueDate,
  daysRemaining,
  onPay,
}: {
  outstandingAmount: number
  amount: string | number
  currency: string
  dueDate?: string
  formattedDueDate: string
  daysRemaining: number
  onPay: (e: React.MouseEvent) => void
}) {
  if (!(outstandingAmount > 0)) {
    return (
      <HistoryEntry
        icon={<Clock />}
        title="Loan repaid"
        subtitle={formatMoney(Number(amount), currency)}
      />
    )
  }

  return (
    <>
      <HistoryEntry
        icon={<Clock />}
        title="Loan repayment due:"
        subtitle={`${formatMoney(Number(outstandingAmount), currency)} due by ${formattedDueDate}`}
        trailing={
          dueDate && daysRemaining > 0 ? (
            <Badge variant="warning">
              {daysRemaining < 10 ? "0" : ""}
              {daysRemaining} days
            </Badge>
          ) : (
            <Badge variant="destructive">Overdue</Badge>
          )
        }
      />
      <div className="px-3 pb-2 pt-1">
        <Button variant="secondary" className="w-full" onClick={onPay}>
          Pay now
        </Button>
      </div>
    </>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function resolveCashbackIcon(
  type: string,
  who: { isReceiver: boolean; isSender: boolean }
) {
  switch (type) {
    case "EARNED":
      return <TrendingUp />
    case "SPENT":
      return <CreditCard />
    case "TRANSFER":
      if (who.isReceiver) return <ArrowDownLeft />
      if (who.isSender) return <ArrowUpRight />
      return <ArrowRightLeft />
    default:
      return <Activity />
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function resolveCashbackLabel(
  transaction: {
    type: string
    description?: string | null
    sender?: { accountOwner?: { firstName?: string } } | null
    receiver?: { accountOwner?: { firstName?: string } } | null
  },
  who: { isReceiver: boolean; isSender: boolean }
): string {
  if (transaction.type === "TRANSFER") {
    if (who.isReceiver) {
      return `Received from ${transaction.sender?.accountOwner?.firstName || "Unknown"}`
    }
    if (who.isSender) {
      return `Sent to ${transaction.receiver?.accountOwner?.firstName || "Unknown"}`
    }
    return "Transfer"
  }
  if (transaction.type === "SPENT") {
    return (transaction.description || "Spent").toLowerCase()
  }
  if (transaction.type === "EARNED") {
    return "Cashback earned"
  }
  return (transaction.description || transaction.type).toLowerCase()
}
