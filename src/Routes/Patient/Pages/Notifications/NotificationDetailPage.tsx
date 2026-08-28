import { useEffect, useMemo, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Info,
  Sparkles,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/Button"
import PatientPageWrapper from "../PatientPageWrapper"
import {
  useNotifications,
  useMarkNotificationRead,
} from "@/Routes/Patient/Pages/CareCompanion/hooks/useNotifications"
import type { CareCompanionNotification } from "@/types/care-companion"

const ACTION_TYPE_LABELS: Record<string, string> = {
  REFILL_NUDGE: "Refill Reminder",
  MISSED_TEST_FLAG: "Lab Test",
  COST_SAVING_SUGGESTION: "Cost Saving",
  DRUG_INTERACTION_WARNING: "Drug Interaction",
  PROVIDER_FLAG: "Clinical Attention",
  ADHERENCE_PATTERN: "Adherence Pattern",
  CIRCLE_PROMPT: "Circle",
  DRUG_INFO_SURFACE: "Drug Information",
  TEST_RESULT_PROMPT: "Test Results",
  JIREH_PLUS_RECOMMEND: "Jireh Plus",
  LOAN_REPAYMENT_PRAISE: "Repayment",
  LOAN_REPAYMENT_REMINDER: "Payment Due",
  LOAN_REPAYMENT_OVERDUE: "Payment Overdue",
  LOAN_OFFER: "Loan Offer",
  REFILL_REMINDER: "Refill Reminder",
  REFILL_OVERDUE: "Refill Overdue",
  REFILL_LOAN_OFFER: "Loan Offer",
  PREDICTIVE_CREDIT_OFFER: "Credit Offer",
  EDUCATION_WEEKLY: "Weekly Education",
  MEDICATION_CARD_AVAILABLE: "Medication Info",
  LAB_REMINDER: "Lab Test",
}

const SEVERITY_CONFIG: Record<
  string,
  { label: string; className: string; icon: typeof AlertTriangle }
> = {
  HIGH: {
    label: "High priority",
    className: "bg-red-100 text-red-700",
    icon: AlertTriangle,
  },
  MEDIUM: {
    label: "Medium priority",
    className: "bg-amber-100 text-amber-700",
    icon: Info,
  },
  LOW: {
    label: "Low priority",
    className: "bg-blue-100 text-blue-700",
    icon: Info,
  },
}

const GENERIC_DEEP_LINKS = new Set([
  "/patients/companion",
  "/patients/home",
  "/patients",
])

const ACTION_BUTTON_LABELS: Record<string, string> = {
  REFILL_NUDGE: "Find nearby pharmacies",
  MISSED_TEST_FLAG: "Find nearby labs",
  COST_SAVING_SUGGESTION: "View cost tracker",
  DRUG_INTERACTION_WARNING: "View medication details",
  ADHERENCE_PATTERN: "View schedule",
  INVOICE_POPULATE: "View payment details",
  DRUG_INFO_SURFACE: "View medication card",
  TEST_RESULT_PROMPT: "Upload test results",
  LOAN_REPAYMENT_PRAISE: "View loan details",
  LOAN_REPAYMENT_REMINDER: "View loan details",
  LOAN_REPAYMENT_OVERDUE: "View loan details",
  LOAN_OFFER: "View loan offer",
  REFILL_REMINDER: "Find nearby pharmacies",
  REFILL_OVERDUE: "Find nearby pharmacies",
  REFILL_LOAN_OFFER: "View loan offer",
  PREDICTIVE_CREDIT_OFFER: "View credit offer",
  EDUCATION_WEEKLY: "Read article",
  MEDICATION_CARD_AVAILABLE: "View medication card",
  LAB_REMINDER: "Find nearby labs",
}

function getTypeLabel(n: CareCompanionNotification): string {
  if (n.type === "AI_INSIGHT" && n.metadata?.actionType) {
    return ACTION_TYPE_LABELS[n.metadata.actionType] ?? "AI Insight"
  }
  return ACTION_TYPE_LABELS[n.type] ?? n.type
}

function hasUsefulDeepLink(n: CareCompanionNotification): boolean {
  return !GENERIC_DEEP_LINKS.has(n.deepLink)
}

function getActionLabel(n: CareCompanionNotification): string {
  const actionType = n.metadata?.actionType ?? n.type
  return ACTION_BUTTON_LABELS[actionType] ?? "View details"
}

export default function NotificationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: notifications = [] } = useNotifications()
  const markRead = useMarkNotificationRead()

  const notification = useMemo(
    () => notifications.find((n) => n.id === id) ?? null,
    [notifications, id],
  )

  const markedRef = useRef<string | null>(null)
  useEffect(() => {
    if (notification && !notification.readAt && markedRef.current !== notification.id) {
      markedRef.current = notification.id
      markRead.mutate(notification.id)
    }
  }, [notification, markRead])

  if (!notification) {
    return (
      <PatientPageWrapper title="Notification" onBack={() => navigate(-1)}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Notification not found.
          </p>
          <Button
            variant="link"
            className="mt-2"
            onClick={() => navigate("/patients/notifications")}
          >
            Back to notifications
          </Button>
        </div>
      </PatientPageWrapper>
    )
  }

  const typeLabel = getTypeLabel(notification)
  const severity = notification.metadata?.severity
  const severityConfig = severity ? SEVERITY_CONFIG[severity] : null
  const SeverityIcon = severityConfig?.icon
  const relatedMedication = notification.metadata?.relatedMedication
  const isAiInsight = notification.type === "AI_INSIGHT"
  const showDeepLink = hasUsefulDeepLink(notification)

  return (
    <PatientPageWrapper title="Notification" onBack={() => navigate(-1)}>
      <div className="flex flex-col gap-5 py-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-primary">
            {isAiInsight && <Sparkles className="h-3 w-3" />}
            {typeLabel}
          </span>
          {severityConfig && SeverityIcon && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                severityConfig.className,
              )}
            >
              <SeverityIcon className="h-2.5 w-2.5" />
              {severityConfig.label}
            </span>
          )}
        </div>

        <h2 className="text-lg font-semibold text-foreground leading-snug">
          {notification.title}
        </h2>

        <div className="flex flex-col gap-3">
          {notification.body.split("\n\n").map((para, i) => (
            <p
              key={i}
              className="text-sm leading-relaxed text-foreground/90"
            >
              {para}
            </p>
          ))}
        </div>

        {relatedMedication && (
          <div className="rounded-xl border border-border bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Related medication
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {relatedMedication}
            </p>
          </div>
        )}

        {notification.sentAt && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {format(new Date(notification.sentAt), "EEEE, MMMM d 'at' h:mm a")}
          </div>
        )}

        {showDeepLink && (
          <Button
            className="mt-2"
            onClick={() => navigate(notification.deepLink)}
          >
            {getActionLabel(notification)}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </PatientPageWrapper>
  )
}
