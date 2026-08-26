import { useEffect } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Loader2,
  Phone,
  Shield,
  Truck,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { trackEvent } from "@/analytics"
import { EVENTS } from "@/analytics"
import { useEmergencyCard } from "./hooks/useEmergencyCard"
import { useEmergencyTransportCredit } from "./hooks/useEmergencyTransportCredit"
import type { WarningSymptom } from "@/types/care-companion"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMERGENCY_NUMBERS = [
  { label: "Emergency", number: "999" },
  { label: "Emergency", number: "112" },
  { label: "Kenya Red Cross", number: "0800 723 253" },
] as const

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function EmergencyCardPage() {
  const {
    data: card,
    isLoading: cardLoading,
    error: cardError,
  } = useEmergencyCard()

  const {
    data: transportCredit,
    isLoading: transportLoading,
  } = useEmergencyTransportCredit()

  useEffect(() => {
    trackEvent(EVENTS.CARE_COMPANION.EMERGENCY_CARD.VIEW)
  }, [])

  if (cardLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (cardError || !card) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <AlertTriangle className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Could not load emergency card. Use the numbers below in an
            emergency.
          </p>
        </div>
        <EmergencyNumbersSection />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {card.title}
          </h1>
          <p className="text-xs text-muted-foreground">
            Condition-specific emergency guidance
          </p>
        </div>
      </div>

      {/* Warning Signs */}
      <WarningSignsSection symptoms={card.warningSymptoms} />

      {/* Immediate Actions */}
      <ImmediateActionsSection
        actions={card.immediateActions}
      />

      {/* When to Go to ER */}
      <WhenToGoToERSection criteria={card.whenToGoToER} />

      {/* Do Not Do */}
      {card.doNotDo && card.doNotDo.length > 0 && (
        <DoNotDoSection items={card.doNotDo} />
      )}

      {/* Transport Credit */}
      <TransportCreditSection
        data={transportCredit ?? null}
        isLoading={transportLoading}
      />

      {/* Emergency Numbers */}
      <EmergencyNumbersSection />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Warning Signs
// ---------------------------------------------------------------------------

function WarningSignsSection({
  symptoms,
}: {
  symptoms: WarningSymptom[]
}) {
  return (
    <section
      aria-labelledby="warning-signs-heading"
      className="rounded-xl border border-red-200 bg-red-50 p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <h2
          id="warning-signs-heading"
          className="text-sm font-semibold text-red-900"
        >
          Warning Signs
        </h2>
      </div>

      <ul className="flex flex-col gap-2">
        {symptoms.map((s, i) => (
          <li
            key={i}
            className={cn(
              "flex items-start gap-2.5 rounded-lg px-3 py-2",
              s.severity === "critical"
                ? "bg-red-100/80"
                : "bg-amber-50"
            )}
          >
            <CircleAlert
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                s.severity === "critical"
                  ? "text-red-600"
                  : "text-amber-500"
              )}
            />
            <div className="min-w-0">
              <p
                className={cn(
                  "text-xs font-medium",
                  s.severity === "critical"
                    ? "text-red-900"
                    : "text-amber-900"
                )}
              >
                {s.symptom}
              </p>
              <span
                className={cn(
                  "mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase",
                  s.severity === "critical"
                    ? "bg-red-200 text-red-800"
                    : "bg-amber-200 text-amber-800"
                )}
              >
                {s.severity}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Immediate Actions
// ---------------------------------------------------------------------------

function ImmediateActionsSection({
  actions,
}: {
  actions: { step: number; action: string }[]
}) {
  return (
    <section
      aria-labelledby="immediate-actions-heading"
      className="rounded-xl border bg-card p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-primary" />
        <h2
          id="immediate-actions-heading"
          className="text-sm font-semibold text-foreground"
        >
          Immediate Actions
        </h2>
      </div>

      <ol className="flex flex-col gap-2">
        {actions.map((a) => (
          <li key={a.step} className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
              {a.step}
            </span>
            <p className="pt-0.5 text-xs text-foreground leading-relaxed">
              {a.action}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}

// ---------------------------------------------------------------------------
// When to Go to ER
// ---------------------------------------------------------------------------

function WhenToGoToERSection({ criteria }: { criteria: string[] }) {
  return (
    <section
      aria-labelledby="when-to-go-er-heading"
      className="rounded-xl border border-red-200 bg-white p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <CircleAlert className="h-4 w-4 text-red-600" />
        <h2
          id="when-to-go-er-heading"
          className="text-sm font-semibold text-red-900"
        >
          When to Go to the ER
        </h2>
      </div>

      <ul className="flex flex-col gap-2">
        {criteria.map((c, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
            <p className="text-xs text-foreground leading-relaxed">{c}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Do Not Do
// ---------------------------------------------------------------------------

function DoNotDoSection({ items }: { items: string[] }) {
  return (
    <section
      aria-labelledby="do-not-do-heading"
      className="rounded-xl border border-red-200 bg-red-50/50 p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <X className="h-4 w-4 text-red-600" />
        <h2
          id="do-not-do-heading"
          className="text-sm font-semibold text-red-900"
        >
          Do Not Do
        </h2>
      </div>

      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-xs text-foreground leading-relaxed">{item}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Transport Credit
// ---------------------------------------------------------------------------

function TransportCreditSection({
  data,
  isLoading,
}: {
  data: {
    isAvailable: boolean
    preApprovedAmount: string
    expiresAt: string
  } | null
  isLoading: boolean
}) {
  function handleTransportTap() {
    trackEvent(EVENTS.CARE_COMPANION.EMERGENCY_CARD.TRANSPORT_CREDIT_TAP)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl border bg-card py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) return null

  const amount = parseFloat(data.preApprovedAmount)
  const formattedAmount = isNaN(amount)
    ? "0"
    : amount.toLocaleString("en-KE")

  return (
    <section
      aria-labelledby="transport-credit-heading"
      className="rounded-xl border bg-card p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <Truck className="h-4 w-4 text-primary" />
        <h2
          id="transport-credit-heading"
          className="text-sm font-semibold text-foreground"
        >
          Emergency Transport Credit
        </h2>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-3">
        <div>
          <p className="text-xs text-muted-foreground">Pre-approved amount</p>
          <p className="text-base font-semibold font-mono text-foreground">
            KES {formattedAmount}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium",
            data.isAvailable
              ? "bg-emerald-100 text-emerald-700"
              : "bg-muted text-muted-foreground"
          )}
        >
          {data.isAvailable ? "Available" : "Unavailable"}
        </span>
      </div>

      {data.isAvailable && (
        <button
          type="button"
          onClick={handleTransportTap}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors active:bg-primary/90"
        >
          <Truck className="h-4 w-4" />
          Request Transport
        </button>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Emergency Numbers (always visible)
// ---------------------------------------------------------------------------

function EmergencyNumbersSection() {
  return (
    <section
      aria-labelledby="emergency-numbers-heading"
      className="rounded-xl border border-red-200 bg-red-50 p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <Phone className="h-4 w-4 text-red-600" />
        <h2
          id="emergency-numbers-heading"
          className="text-sm font-semibold text-red-900"
        >
          Kenya Emergency Numbers
        </h2>
      </div>

      <ul className="flex flex-col gap-2">
        {EMERGENCY_NUMBERS.map(({ label, number }) => (
          <li
            key={number}
            className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2"
          >
            <span className="text-xs text-red-800">{label}</span>
            <a
              href={`tel:${number.replace(/\s/g, "")}`}
              className="font-mono text-sm font-semibold text-red-700 underline underline-offset-2"
            >
              {number}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
