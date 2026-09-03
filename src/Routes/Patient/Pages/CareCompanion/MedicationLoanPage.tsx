import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  CircleAlert,
  CircleMinus,
  CreditCard,

  MapPin,
  Pill,
  ShieldX,
  X,
} from "lucide-react"
import { trackEvent, EVENTS } from "@/analytics"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { useMedicationLoanPreApproval } from "./hooks/useMedicationLoanPreApproval"
import type { MedicationLoanPreApproval } from "@/types/care-companion"

type LoanPageState = "viewing" | "accepted" | "declined"

function formatKES(value: string): string {
  const num = parseFloat(value)
  if (isNaN(num)) return "KES 0"
  return `KES ${num.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

function FactorIcon({ status }: { status: "met" | "not-met" | "partial" }) {
  if (status === "met") {
    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success">
        <Check className="h-3 w-3 text-green-700" />
      </div>
    )
  }
  if (status === "partial") {
    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warning">
        <CircleMinus className="h-3 w-3 text-amber-700" />
      </div>
    )
  }
  return (
    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
      <X className="h-3 w-3 text-red-600" />
    </div>
  )
}

function PreApprovedBadge() {
  return (
    <div className="flex items-center gap-2 rounded-full bg-success px-4 py-2">
      <BadgeCheck className="h-5 w-5 text-green-700" />
      <span className="text-sm font-semibold text-green-700">
        Pre-Approved
      </span>
    </div>
  )
}

function NotEligibleBadge() {
  return (
    <div className="flex items-center gap-2 rounded-full bg-red-100 px-4 py-2">
      <ShieldX className="h-5 w-5 text-red-600" />
      <span className="text-sm font-semibold text-red-600">Not Eligible</span>
    </div>
  )
}

function SuccessState() {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-20 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-success"
      >
        <motion.div
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Check className="h-10 w-10 text-green-700" strokeWidth={3} />
        </motion.div>
      </motion.div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">
          Loan Accepted
        </h2>
        <p className="text-sm text-muted-foreground">
          Your medication loan has been confirmed. The funds will be available at
          your designated pharmacy for your next refill.
        </p>
      </div>
    </div>
  )
}

function DeclinedState() {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <CreditCard className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">
          Loan Declined
        </h2>
        <p className="text-sm text-muted-foreground">
          You have declined this medication loan offer. You can always check back
          later if your needs change.
        </p>
      </div>
    </div>
  )
}

function ApprovedContent({
  data,
  onAccept,
  onDecline,
}: {
  data: MedicationLoanPreApproval
  onAccept: () => void
  onDecline: () => void
}) {
  const details = data.preApprovalDetails
  if (!details) return null

  return (
    <div className="flex flex-col gap-4 p-4 pb-40">
      {/* Status badge */}
      <div className="flex justify-center">
        <PreApprovedBadge />
      </div>

      {/* Max loan amount */}
      <div className="rounded-xl border bg-card p-5 text-center">
        <p className="text-xs text-muted-foreground">
          Maximum loan amount
        </p>
        <p className="mt-1 text-3xl font-bold font-mono text-foreground">
          {formatKES(details.maxAmount)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Expires {formatDate(details.expiresAt)}
        </p>
      </div>

      {/* Reason */}
      <div className="rounded-xl border bg-accent/50 p-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          {details.reason}
        </p>
      </div>

      {/* Target pharmacy */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Designated pharmacy
            </p>
            <p className="text-sm font-semibold text-foreground">
              {details.targetPharmacy.name}
            </p>
          </div>
        </div>
      </div>

      {/* Covered medications */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">
          Covered Medications
        </h3>
        <div className="mt-3 space-y-2">
          {details.medications.map((med) => (
            <div
              key={med.name}
              className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Pill className="h-3.5 w-3.5 shrink-0 text-primary" />
                <p className="truncate text-xs font-medium text-foreground">
                  {med.name}
                </p>
              </div>
              <p className="shrink-0 text-xs font-semibold font-mono text-foreground">
                {formatKES(med.estimatedCost)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground">Total</p>
          <p className="text-sm font-bold font-mono text-foreground">
            {formatKES(
              details.medications
                .reduce((sum, m) => sum + parseFloat(m.estimatedCost), 0)
                .toString()
            )}
          </p>
        </div>
      </div>

      {/* Fixed action buttons */}
      <div className="fixed inset-x-0 bottom-0 space-y-2 border-t bg-background p-4 safe-area-bottom">
        <button
          type="button"
          onClick={onAccept}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors active:bg-primary/90"
        >
          <CreditCard className="h-4 w-4" />
          Accept Loan
        </button>
        <button
          type="button"
          onClick={onDecline}
          className="flex w-full items-center justify-center px-4 py-2 text-sm font-medium text-muted-foreground transition-colors active:text-foreground"
        >
          Decline
        </button>
      </div>
    </div>
  )
}

function NotEligibleContent({
  data: _data,
}: {
  data: MedicationLoanPreApproval
}) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Status badge */}
      <div className="flex justify-center">
        <NotEligibleBadge />
      </div>

      {/* Explanation */}
      <div className="rounded-xl border bg-card p-5 text-center">
        <CircleAlert className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          You are not currently eligible for a medication loan. Review the
          factors below to understand what is needed.
        </p>
      </div>

      {/* Tips for improving eligibility */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">
          Tips to Improve Eligibility
        </h3>
        <ul className="mt-3 space-y-3">
          <li className="flex items-start gap-3">
            <FactorIcon status="partial" />
            <div>
              <p className="text-xs font-medium text-foreground">
                Build your Care Saver balance
              </p>
              <p className="text-[11px] text-muted-foreground">
                Regular contributions to your Care Saver account demonstrate
                financial commitment and improve your eligibility score.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <FactorIcon status="partial" />
            <div>
              <p className="text-xs font-medium text-foreground">
                Maintain consistent refills
              </p>
              <p className="text-[11px] text-muted-foreground">
                Purchasing medications regularly through Jireh Pay builds a
                reliable purchase history that lenders can evaluate.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <FactorIcon status="partial" />
            <div>
              <p className="text-xs font-medium text-foreground">
                Join or stay active in a Jireh Circle
              </p>
              <p className="text-[11px] text-muted-foreground">
                Circle membership and participation are key trust signals that
                support loan approval.
              </p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  )
}

function ConfirmationContent({
  data,
}: {
  data: MedicationLoanPreApproval
}) {
  const details = data.preApprovalDetails
  if (!details) return null

  return (
    <div className="mt-2 space-y-3">
      <div className="rounded-lg bg-muted/50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Loan amount</span>
          <span className="text-sm font-semibold font-mono text-foreground">
            {formatKES(details.maxAmount)}
          </span>
        </div>
      </div>
      <div className="rounded-lg bg-muted/50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Pharmacy</span>
          <span className="text-xs font-medium text-foreground">
            {details.targetPharmacy.name}
          </span>
        </div>
      </div>
      <div className="rounded-lg bg-muted/50 p-3 space-y-1">
        <p className="text-xs text-muted-foreground">Medications</p>
        {details.medications.map((med) => (
          <div key={med.name} className="flex items-center justify-between">
            <span className="text-xs text-foreground">{med.name}</span>
            <span className="text-xs font-mono text-muted-foreground">
              {formatKES(med.estimatedCost)}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        By accepting, you agree to the loan terms. The funds will be disbursed
        to {details.targetPharmacy.name} for your medication purchase.
      </p>
    </div>
  )
}

function MedicationLoanSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 pb-40 animate-pulse">
      <div className="flex justify-center">
        <div className="h-9 w-36 rounded-full bg-muted" />
      </div>

      <div className="rounded-xl border bg-card p-5 flex flex-col items-center gap-2">
        <div className="h-3 w-28 rounded bg-muted" />
        <div className="h-8 w-40 rounded bg-muted" />
        <div className="h-3 w-24 rounded bg-muted" />
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="h-4 w-full rounded bg-muted" />
        <div className="mt-1.5 h-4 w-4/5 rounded bg-muted" />
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-4 w-40 rounded bg-muted" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="h-4 w-36 rounded bg-muted" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-3.5 rounded bg-muted" />
              <div className="h-3 w-28 rounded bg-muted" />
            </div>
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
        ))}
        <div className="flex items-center justify-between border-t pt-3">
          <div className="h-3 w-10 rounded bg-muted" />
          <div className="h-4 w-20 rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}

export default function MedicationLoanPage() {
  const { data, isLoading, error } = useMedicationLoanPreApproval()
  const [pageState, setPageState] = useState<LoanPageState>("viewing")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  useEffect(() => {
    trackEvent(EVENTS.CARE_COMPANION.MEDICATION_LOAN.VIEW)
  }, [])

  useEffect(() => {
    if (data) {
      trackEvent(EVENTS.CARE_COMPANION.MEDICATION_LOAN.PRE_APPROVAL_VIEW, {
        isPreApproved: data.isPreApproved,
      })
    }
  }, [data])

  function handleAcceptTap() {
    trackEvent(EVENTS.CARE_COMPANION.MEDICATION_LOAN.ACCEPT_TAP)
    setShowConfirmDialog(true)
  }

  function handleConfirmAccept() {
    setShowConfirmDialog(false)
    setPageState("accepted")
  }

  function handleDeclineTap() {
    trackEvent(EVENTS.CARE_COMPANION.MEDICATION_LOAN.DECLINE_TAP)
    setPageState("declined")
  }

  if (isLoading) {
    return <MedicationLoanSkeleton />
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <AlertTriangle className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Could not load loan pre-approval details.
        </p>
      </div>
    )
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {pageState === "accepted" ? (
          <motion.div
            key="accepted"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <SuccessState />
          </motion.div>
        ) : pageState === "declined" ? (
          <motion.div
            key="declined"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <DeclinedState />
          </motion.div>
        ) : data.isPreApproved ? (
          <motion.div
            key="approved"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ApprovedContent
              data={data}
              onAccept={handleAcceptTap}
              onDecline={handleDeclineTap}
            />
          </motion.div>
        ) : (
          <motion.div
            key="not-eligible"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <NotEligibleContent data={data} />
          </motion.div>
        )}
      </AnimatePresence>

      {data.isPreApproved && (
        <ConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          onConfirm={handleConfirmAccept}
          title="Accept Medication Loan"
          description="Review the loan details below before confirming."
          confirmLabel="Confirm & Accept"
          cancelLabel="Go Back"
        >
          <ConfirmationContent data={data} />
        </ConfirmDialog>
      )}
    </>
  )
}
