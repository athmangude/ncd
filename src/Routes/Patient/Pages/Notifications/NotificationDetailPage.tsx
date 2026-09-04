import { useEffect, useMemo, useRef, useState } from "react"
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
import { supabase } from "@/lib/supabase"
import type { CareCompanionNotification } from "@/types/care-companion"

interface GeneralNotification {
  id: string
  type: string
  title: string
  body: string
  deepLink?: string
  sentAt?: string
  readAt?: string
}

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

const ACTION_CTA: Record<string, { label: string; route: string }> = {
  REFILL_NUDGE: { label: "Find nearby pharmacies", route: "/patients/explore" },
  REFILL_REMINDER: {
    label: "View refill schedule",
    route: "/patients/companion/refill-schedule",
  },
  REFILL_OVERDUE: {
    label: "Find nearby pharmacies",
    route: "/patients/explore",
  },
  MISSED_TEST_FLAG: { label: "Find nearby labs", route: "/patients/explore" },
  LAB_REMINDER: { label: "Find nearby labs", route: "/patients/explore" },
  COST_SAVING_SUGGESTION: {
    label: "View cost tracker",
    route: "/patients/companion/cost-tracker",
  },
  CASHBACK_EARNED: {
    label: "View cost tracker",
    route: "/patients/companion/cost-tracker",
  },
  DRUG_INTERACTION_WARNING: {
    label: "View medication details",
    route: "/patients/companion/medication-cards",
  },
  DRUG_INFO_SURFACE: {
    label: "View medication card",
    route: "/patients/companion/medication-cards",
  },
  MEDICATION_CARD_AVAILABLE: {
    label: "View medication card",
    route: "/patients/companion/medication-cards",
  },
  ADHERENCE_PATTERN: {
    label: "View schedule",
    route: "/patients/companion/refill-schedule",
  },
  TEST_RESULT_PROMPT: {
    label: "Upload test results",
    route: "/patients/companion/test-results",
  },
  TEST_TREND: {
    label: "View test results",
    route: "/patients/companion/test-results",
  },
  LOAN_REPAYMENT_PRAISE: {
    label: "View loan details",
    route: "/patients/loans",
  },
  LOAN_REPAYMENT_REMINDER: {
    label: "View loan details",
    route: "/patients/loans",
  },
  LOAN_REPAYMENT_OVERDUE: {
    label: "View loan details",
    route: "/patients/loans",
  },
  LOAN_OFFER: { label: "View loan offer", route: "/patients/loans" },
  REFILL_LOAN_OFFER: { label: "View loan offer", route: "/patients/loans" },
  PREDICTIVE_CREDIT_OFFER: {
    label: "View credit offer",
    route: "/patients/loans",
  },
  EDUCATION_WEEKLY: {
    label: "Read article",
    route: "/patients/companion/education",
  },
  EDUCATION_RECOMMENDATION: {
    label: "Read article",
    route: "/patients/companion/education",
  },
  CIRCLE_PROMPT: { label: "View circle", route: "/patients/circle" },
  INVOICE_POPULATE: {
    label: "View payment details",
    route: "/patients/payments",
  },
  PROVIDER_FLAG: {
    label: "View care companion",
    route: "/patients/companion",
  },
}

const VALID_ROUTE_PREFIXES = [
  "/patients/companion/education/",
  "/patients/companion/medication-cards/",
  "/patients/companion/cost-tracker",
  "/patients/companion/refill-schedule",
  "/patients/companion/test-results",
  "/patients/companion/emergency-card",
  "/patients/companion/medication-timeline",
  "/patients/companion/assistant",
  "/patients/companion/intake",
  "/patients/explore",
  "/patients/loans",
  "/patients/payments",
  "/patients/circle",
  "/patients/care-fund",
  "/patients/network",
  "/patients/fast-track",
  "/patients/notifications",
]

function isValidRoute(path: string): boolean {
  return VALID_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix))
}

function getTypeLabel(n: CareCompanionNotification): string {
  if (n.type === "AI_INSIGHT" && n.metadata?.actionType) {
    return ACTION_TYPE_LABELS[n.metadata.actionType] ?? "AI Insight"
  }
  return ACTION_TYPE_LABELS[n.type] ?? n.type
}

function resolveCtaKey(n: {
  type: string
  metadata?: Record<string, string> | null
}): string {
  if (n.metadata?.actionType) return n.metadata.actionType
  if (n.metadata?.insightType) return n.metadata.insightType
  return n.type
}

function getCta(
  n: CareCompanionNotification,
): { label: string; route: string } | null {
  const key = resolveCtaKey(n)
  const mapped = ACTION_CTA[key]
  if (mapped) return mapped
  if (!GENERIC_DEEP_LINKS.has(n.deepLink) && isValidRoute(n.deepLink)) {
    return { label: "View details", route: n.deepLink }
  }
  return null
}

function getGeneralCta(
  n: GeneralNotification,
): { label: string; route: string } | null {
  const mapped = ACTION_CTA[n.type]
  if (mapped) return mapped
  if (
    n.deepLink &&
    !GENERIC_DEEP_LINKS.has(n.deepLink) &&
    isValidRoute(n.deepLink)
  ) {
    return { label: "View details", route: n.deepLink }
  }
  return null
}

export default function NotificationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: notifications = [] } = useNotifications()
  const markRead = useMarkNotificationRead()
  const [generalNotification, setGeneralNotification] =
    useState<GeneralNotification | null>(null)
  const [generalLoading, setGeneralLoading] = useState(false)

  const careNotification = useMemo(
    () => notifications.find((n) => n.id === id) ?? null,
    [notifications, id],
  )

  useEffect(() => {
    if (careNotification || !id) return
    setGeneralLoading(true)
    supabase
      .from("notifications")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setGeneralNotification({
            id: data.id,
            type: data.type,
            title: data.title,
            body: data.body ?? data.title,
            deepLink: data.deep_link ?? undefined,
            sentAt: data.sent_at ?? undefined,
            readAt: data.read_at ?? undefined,
          })
          if (!data.read_at) {
            supabase
              .from("notifications")
              .update({ read_at: new Date().toISOString() })
              .eq("id", id)
          }
        }
        setGeneralLoading(false)
      })
  }, [careNotification, id])

  const markedRef = useRef<string | null>(null)
  useEffect(() => {
    if (
      careNotification &&
      !careNotification.readAt &&
      markedRef.current !== careNotification.id
    ) {
      markedRef.current = careNotification.id
      markRead.mutate(careNotification.id)
    }
  }, [careNotification, markRead])

  if (generalLoading) {
    return (
      <PatientPageWrapper title="Notification" onBack={() => navigate(-1)}>
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </PatientPageWrapper>
    )
  }

  if (generalNotification) {
    const typeLabel = generalNotification.type
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ")

    return (
      <PatientPageWrapper title="Notification" onBack={() => navigate(-1)}>
        <div className="flex flex-col gap-5 py-2">
          <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-primary">
            {typeLabel}
          </span>

          <h2 className="text-lg font-semibold text-foreground leading-snug">
            {generalNotification.title}
          </h2>

          <div className="flex flex-col gap-3">
            {generalNotification.body.split("\n\n").map((para, i) => (
              <p
                key={i}
                className="text-sm leading-relaxed text-foreground/90"
              >
                {para}
              </p>
            ))}
          </div>

          {generalNotification.sentAt && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {format(
                new Date(generalNotification.sentAt),
                "EEEE, MMMM d 'at' h:mm a",
              )}
            </div>
          )}

          {(() => {
            const cta = getGeneralCta(generalNotification)
            return cta ? (
              <Button
                className="mt-2"
                onClick={() => navigate(cta.route)}
              >
                {cta.label}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : null
          })()}
        </div>
      </PatientPageWrapper>
    )
  }

  if (!careNotification) {
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

  const typeLabel = getTypeLabel(careNotification)
  const severity = careNotification.metadata?.severity
  const severityConfig = severity ? SEVERITY_CONFIG[severity] : null
  const SeverityIcon = severityConfig?.icon
  const relatedMedication = careNotification.metadata?.relatedMedication
  const isAiInsight = careNotification.type === "AI_INSIGHT"
  const cta = getCta(careNotification)

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
          {careNotification.title}
        </h2>

        <div className="flex flex-col gap-3">
          {careNotification.body.split("\n\n").map((para, i) => (
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

        {careNotification.sentAt && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {format(
              new Date(careNotification.sentAt),
              "EEEE, MMMM d 'at' h:mm a",
            )}
          </div>
        )}

        {cta && (
          <Button
            className="mt-2"
            onClick={() => navigate(cta.route)}
          >
            {cta.label}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </PatientPageWrapper>
  )
}
