import { useEffect, useRef, useCallback, useState } from "react"
import {
  Loader2,
  AlertTriangle,
  TrendingUp,
  Wallet,
  Calendar,
  BadgeDollarSign,
  Target,
  Receipt,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Store,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { trackEvent } from "@/analytics"
import { EVENTS } from "@/analytics"
import { useCostSummary } from "./hooks/useCostSummary"
import { useCostBreakdown } from "./hooks/useCostBreakdown"
import { useRecentPayments, useAllPayments } from "./hooks/useRecentPayments"
import type { CostSummary, PaymentEvent } from "@/types/care-companion"
import type {
  CostCategoryBreakdown,
  MonthlySpend,
} from "@/types/care-companion"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatKES(value: string): string {
  const num = parseFloat(value)
  if (isNaN(num)) return "KES 0"
  return `KES ${num.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

const CATEGORY_LABELS: Record<string, string> = {
  MEDICATION: "Medication",
  LAB_TEST: "Lab Tests",
  CONSULTATION: "Consultation",
  SUPPLY: "Supplies",
}

const CATEGORY_COLORS: Record<string, string> = {
  MEDICATION: "bg-primary",
  LAB_TEST: "bg-accent",
  CONSULTATION: "bg-warning",
  SUPPLY: "bg-secondary",
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function CostTrackerPage() {
  const summary = useCostSummary()
  const breakdown = useCostBreakdown()
  const recentPayments = useRecentPayments()
  const allPayments = useAllPayments()

  useEffect(() => {
    trackEvent(EVENTS.CARE_COMPANION.COST_TRACKER.VIEW)
  }, [])

  if (summary.isLoading || breakdown.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (summary.error || breakdown.error || !summary.data) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <AlertTriangle className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Could not load your cost data. Please try again later.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      <AnnualSummarySection data={summary.data} />

      {recentPayments.data && recentPayments.data.length > 0 && (
        <RecentPaymentsSection payments={recentPayments.data} />
      )}

      {breakdown.data && breakdown.data.categories.length > 0 && (
        <CategoryBreakdownSection
          categories={breakdown.data.categories}
          payments={allPayments.data ?? []}
        />
      )}

      {breakdown.data && breakdown.data.monthlyTrend.length > 0 && (
        <MonthlyTrendSection trend={breakdown.data.monthlyTrend} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Annual Summary — 2x3 grid of stat cards
// ---------------------------------------------------------------------------

function AnnualSummarySection({ data }: { data: CostSummary }) {
  const cashbackOpportunity = Math.round(
    parseFloat(data.annualProjection) * 0.05,
  )

  const stats = [
    {
      label: "Year to date",
      value: formatKES(data.ytdSpend),
      icon: Wallet,
      highlight: true,
    },
    {
      label: "Monthly average",
      value: formatKES(data.monthlyAverage),
      icon: Calendar,
      highlight: false,
    },
    {
      label: "Transactions",
      value: String(data.transactionCount),
      icon: Receipt,
      highlight: false,
    },
    {
      label: "Net spend",
      value: formatKES(data.netSpend),
      icon: TrendingUp,
      highlight: false,
    },
    {
      label: "Cashback earned",
      value: formatKES(data.cashbackEarned),
      icon: BadgeDollarSign,
      highlight: false,
      success: true,
    },
    {
      label: "Projected annual",
      value: formatKES(data.annualProjection),
      icon: Target,
      highlight: false,
    },
    {
      label: "Cashback opportunity",
      value: formatKES(String(cashbackOpportunity)),
      icon: BadgeDollarSign,
      highlight: false,
      success: true,
    },
  ]

  return (
    <section aria-label="Annual cost summary">
      <h2 className="mb-3 text-sm font-semibold text-foreground">
        {data.year} Summary
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              "flex flex-col gap-1 rounded-xl border p-3",
              stat.highlight && "col-span-2 bg-primary/5 border-primary/20",
              stat.success && "bg-success border-success/30",
              !stat.highlight && !stat.success && "bg-card"
            )}
          >
            <div className="flex items-center gap-2">
              <stat.icon
                className={cn(
                  "h-4 w-4",
                  stat.success
                    ? "text-emerald-600"
                    : stat.highlight
                      ? "text-primary"
                      : "text-muted-foreground"
                )}
              />
              <span className="text-[11px] text-muted-foreground">
                {stat.label}
              </span>
            </div>
            <p
              className={cn(
                "font-mono text-sm font-semibold",
                stat.success
                  ? "text-emerald-700"
                  : stat.highlight
                    ? "text-primary"
                    : "text-foreground"
              )}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Category Breakdown — list with percentage bars
// ---------------------------------------------------------------------------

function CategoryBreakdownSection({
  categories,
  payments,
}: {
  categories: CostCategoryBreakdown[]
  payments: PaymentEvent[]
}) {
  const [expandedCat, setExpandedCat] = useState<string | null>(null)

  return (
    <section aria-label="Spending by category">
      <h2 className="mb-3 text-sm font-semibold text-foreground">
        Spending by Category
      </h2>
      <div className="flex flex-col gap-2">
        {categories.map((cat) => {
          const isExpanded = expandedCat === cat.category
          const catPayments = payments.filter((p) =>
            p.lineItems.some((li) => li.category === cat.category),
          )

          return (
            <div
              key={cat.category}
              className="rounded-xl border bg-card overflow-hidden"
            >
              <button
                type="button"
                onClick={() => {
                  const next = isExpanded ? null : cat.category
                  setExpandedCat(next)
                  if (next) {
                    trackEvent(
                      EVENTS.CARE_COMPANION.COST_TRACKER.CATEGORY_TAP,
                      { category: cat.category },
                    )
                  }
                }}
                className="flex w-full flex-col gap-2 p-3 text-left transition-colors active:bg-muted/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">
                    {CATEGORY_LABELS[cat.category] ?? cat.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {formatKES(cat.totalSpend)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {cat.percentage}%
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      CATEGORY_COLORS[cat.category] ?? "bg-primary",
                    )}
                    style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {cat.transactionCount} transaction
                  {cat.transactionCount !== 1 ? "s" : ""}
                </p>
              </button>

              {isExpanded && (
                <div className="border-t px-3 pb-3 pt-2">
                  {catPayments.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {catPayments.map((p) => {
                        const date = new Date(p.timestamp)
                        const dateStr = date.toLocaleDateString("en-KE", {
                          day: "numeric",
                          month: "short",
                        })
                        const catTotal = p.lineItems
                          .filter((li) => li.category === cat.category)
                          .reduce((s, li) => s + li.lineTotal, 0)

                        return (
                          <div
                            key={p.id}
                            className="flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium text-foreground">
                                {p.facilityName}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {dateStr}
                              </p>
                            </div>
                            <span className="shrink-0 font-mono text-xs text-foreground">
                              {formatKES(String(catTotal))}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-1">
                      No recent transactions
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Recent Payments — expandable cards with AI-populated line items
// ---------------------------------------------------------------------------

function RecentPaymentsSection({
  payments,
}: {
  payments: PaymentEvent[]
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <section aria-label="Recent payments">
      <h2 className="mb-3 text-sm font-semibold text-foreground">
        Recent Payments
      </h2>
      <div className="flex flex-col gap-2">
        {payments.slice(0, 6).map((payment) => {
          const isExpanded = expandedId === payment.id
          const hasLineItems = payment.lineItems.length > 0
          const date = new Date(payment.timestamp)
          const dateStr = date.toLocaleDateString("en-KE", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })

          return (
            <div
              key={payment.id}
              className="rounded-xl border bg-card overflow-hidden"
            >
              <button
                type="button"
                onClick={() => {
                  const nextId = isExpanded ? null : payment.id
                  setExpandedId(nextId)
                  if (nextId) {
                    trackEvent(
                      EVENTS.CARE_COMPANION.COST_TRACKER.PAYMENT_EXPAND,
                      {
                        paymentId: payment.id,
                        facilityName: payment.facilityName,
                        hasLineItems,
                      },
                    )
                  }
                }}
                className="flex w-full items-center gap-3 p-3 text-left transition-colors active:bg-muted/50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Store className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {payment.facilityName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {dateStr}
                    {payment.isInNetwork && (
                      <span className="ml-1.5 text-emerald-600">
                        In-network
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {formatKES(String(payment.totalAmount))}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-3 pb-3 pt-2">
                  {hasLineItems ? (
                    <>
                      <div className="mb-2 flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-primary" />
                        <span className="text-[10px] font-medium uppercase tracking-wider text-primary">
                          Invoice details
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {payment.lineItems.map((item, idx) => (
                          <div
                            key={`${item.name}-${idx}`}
                            className="flex items-start justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-foreground">
                                {item.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {CATEGORY_LABELS[item.category] ?? item.category}
                                {item.quantity > 1 && ` · Qty ${item.quantity}`}
                              </p>
                            </div>
                            <span className="shrink-0 font-mono text-xs text-foreground">
                              {formatKES(String(item.lineTotal))}
                            </span>
                          </div>
                        ))}
                        <div className="mt-1 flex items-center justify-between border-t pt-1.5">
                          <span className="text-[11px] font-medium text-muted-foreground">
                            Total
                          </span>
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {formatKES(String(payment.totalAmount))}
                          </span>
                        </div>
                      </div>
                      {payment.fundingSources.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {payment.fundingSources.map((fs) => (
                            <span
                              key={fs.type}
                              className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                            >
                              {fs.type.replace("_", " ")} · {formatKES(String(fs.amount))}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 py-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground italic">
                        Invoice details pending — itemization will appear once
                        processed by your care companion
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Monthly Trend — simple bar chart with colored divs
// ---------------------------------------------------------------------------

function MonthlyTrendSection({ trend }: { trend: MonthlySpend[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasTrackedScroll = useRef(false)

  const handleScroll = useCallback(() => {
    if (!hasTrackedScroll.current) {
      hasTrackedScroll.current = true
      trackEvent(EVENTS.CARE_COMPANION.COST_TRACKER.TREND_SCROLL)
    }
  }, [])

  const maxSpend = Math.max(
    ...trend.map((t) => parseFloat(t.spend) || 0),
    1
  )

  return (
    <section aria-label="Monthly spending trend">
      <h2 className="mb-3 text-sm font-semibold text-foreground">
        Monthly Trend
      </h2>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="overflow-x-auto rounded-xl border bg-card p-4"
      >
        <div
          className="flex items-end gap-3"
          style={{ minWidth: `${trend.length * 48}px` }}
        >
          {trend.map((point) => {
            const amount = parseFloat(point.spend) || 0
            const heightPct = (amount / maxSpend) * 100
            const label = MONTH_LABELS[point.month - 1] ?? `M${point.month}`

            return (
              <div
                key={point.month}
                className="flex flex-1 flex-col items-center gap-1"
                style={{ minWidth: "36px" }}
              >
                <span className="font-mono text-[10px] text-muted-foreground">
                  {formatKES(point.spend)}
                </span>
                <div className="flex h-28 w-full items-end justify-center">
                  <div
                    className="w-full max-w-[28px] rounded-t-md bg-primary transition-all"
                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
