/**
 * Single source of truth for mapping domain statuses (loan, payment,
 * treatment) onto the design-system status variants shared by Tag, Badge,
 * and Alert. Replaces the per-screen raw-palette resolvers
 * (resolveStatusColor, resolvePaymentStatusColor, resolveTagColor).
 */
export type StatusVariant =
  | "success"
  | "warning"
  | "info"
  | "destructive"
  | "neutral"

const STATUS_VARIANT_MAP: Record<string, StatusVariant> = {
  // Positive terminal states
  APPROVED: "success",
  PAID: "success",
  COMPLETED: "success",
  // Awaiting action / in review (PENDING was orange in payments and
  // neutral in treatments — unified on warning, the payments treatment)
  PENDING: "warning",
  SUBMITTED_FOR_APPROVAL: "warning",
  DISBURSED: "warning",
  // In-progress, informational
  PROCESSING: "info",
  REPAYMENT: "info",
  PAID_TRANSACTION_FEE: "info",
  // Negative states
  FAILED: "destructive",
  REJECTED: "destructive",
  DEFAULTED: "destructive",
  OVERDUE: "destructive",
}

export function resolveStatusVariant(
  status: string | null | undefined
): StatusVariant {
  if (!status) return "neutral"
  const key = status
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_")
  return STATUS_VARIANT_MAP[key] ?? "neutral"
}
