import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import {
  AlertTriangle,
  Loader2,
  Pill,
  Clock,
  MapPin,
  CreditCard,
  FlaskConical,
  Pencil,
  Check,
  X,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getMedicationPriceKES } from "@/mocks/fixtures/medication-prices"
import { trackEvent, EVENTS } from "@/analytics"
import { useRefillSchedule, refillScheduleQueryKey } from "./hooks/useRefillSchedule"
import { useCareCompanionHome } from "./hooks/useCareCompanionHome"
import { useIntakeProfile, intakeProfileQueryKey } from "./hooks/useIntakeProfile"
import type {
  RefillScheduleItem,
  TestScheduleItem,
  RefillStatus,
} from "@/types/care-companion"

const STATUS_SORT_ORDER: Record<RefillStatus, number> = {
  OVERDUE: 0,
  DUE: 1,
  UPCOMING: 2,
  REFILLED: 3,
  CANCELLED: 4,
}

function StatusBadge({ status }: { status: RefillStatus }) {
  const config: Record<
    string,
    { label: string; className: string }
  > = {
    OVERDUE: {
      label: "Overdue",
      className: "bg-red-100 text-red-700",
    },
    DUE: {
      label: "Due soon",
      className: "bg-amber-100 text-amber-700",
    },
    UPCOMING: {
      label: "Upcoming",
      className: "bg-muted text-muted-foreground",
    },
    REFILLED: {
      label: "Refilled",
      className: "bg-success text-green-700",
    },
    CANCELLED: {
      label: "Cancelled",
      className: "bg-muted text-muted-foreground",
    },
  }

  const c = config[status] ?? config.UPCOMING
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
        c.className,
      )}
    >
      {c.label}
    </span>
  )
}

function DaysLabel({ days, type }: { days: number; type: "refill" | "test" }) {
  if (days < 0) {
    const overdueDays = Math.abs(days)
    return (
      <span className="text-xs text-red-600">
        {overdueDays} {overdueDays === 1 ? "day" : "days"} overdue
      </span>
    )
  }

  if (days === 0) {
    return <span className="text-xs text-amber-600">Due today</span>
  }

  return (
    <span className="text-xs text-muted-foreground">
      In {days} {days === 1 ? "day" : "days"}
    </span>
  )
}

const FREQUENCY_OPTIONS = [
  { value: 14, label: "Every 2 weeks" },
  { value: 30, label: "Every 30 days" },
  { value: 60, label: "Every 60 days" },
  { value: 90, label: "Every 90 days" },
]

const TEST_FREQUENCY_OPTIONS = [
  { value: 1, label: "Monthly" },
  { value: 3, label: "Every 3 months" },
  { value: 6, label: "Every 6 months" },
  { value: 12, label: "Yearly" },
]

const CHANGE_REASONS = [
  { value: "doctor_recommendation", label: "Doctor recommended" },
  { value: "side_effects", label: "Side effects" },
  { value: "cost_concerns", label: "Cost concerns" },
  { value: "out_of_stock", label: "Medication out of stock" },
  { value: "feeling_better", label: "Feeling better" },
  { value: "schedule_conflict", label: "Schedule conflict" },
  { value: "other", label: "Other" },
]

function RefillItemCard({
  item,
  price,
  onSave,
  onRemove,
}: {
  item: RefillScheduleItem
  price: number | null
  onSave: (id: string, nextDate: string, frequencyDays: number, reason: string) => void
  onRemove: (id: string, reason: string) => void
}) {
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [confirmingRemove, setConfirmingRemove] = useState(false)
  const [nextDate, setNextDate] = useState(item.expectedRefillDate)
  const [frequency, setFrequency] = useState(
    item.estimatedDaysSupply ?? 30,
  )
  const [reason, setReason] = useState("")
  const [customReason, setCustomReason] = useState("")
  const [removeReason, setRemoveReason] = useState("")
  const [customRemoveReason, setCustomRemoveReason] = useState("")

  useEffect(() => {
    setNextDate(item.expectedRefillDate)
    setFrequency(item.estimatedDaysSupply ?? 30)
  }, [item.expectedRefillDate, item.estimatedDaysSupply])

  function handleSave() {
    const finalReason = reason === "other" ? customReason : reason
    if (!finalReason) return
    onSave(item.id, nextDate, frequency, finalReason)
    trackEvent(EVENTS.CARE_COMPANION.REFILL_SCHEDULE.ITEM_TAP, {
      medicationName: item.medicationName,
      status: item.status,
      action: "edit_schedule",
      reason: finalReason,
    })
    setEditing(false)
    setReason("")
    setCustomReason("")
  }

  const canSave = reason === "other" ? customReason.trim().length > 0 : reason.length > 0
  const canRemove = removeReason === "other"
    ? customRemoveReason.trim().length > 0
    : removeReason.length > 0

  function handleRemove() {
    const finalReason = removeReason === "other" ? customRemoveReason : removeReason
    if (!finalReason) return
    onRemove(item.id, finalReason)
    setEditing(false)
    setConfirmingRemove(false)
    setRemoveReason("")
    setCustomRemoveReason("")
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-colors",
        item.status === "OVERDUE" && "border-red-200",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              item.status === "OVERDUE"
                ? "bg-red-100 text-red-600"
                : item.status === "DUE"
                  ? "bg-amber-100 text-amber-600"
                  : "bg-primary/10 text-primary",
            )}
          >
            <Pill className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {item.medicationName}
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
              <DaysLabel days={item.daysUntilRefill} type="refill" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end gap-1">
            <StatusBadge status={item.status} />
            {price != null && (
              <span className="text-[11px] font-mono text-muted-foreground">
                KES {price.toLocaleString()}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setEditing((v) => !v)
              setConfirmingRemove(false)
              setRemoveReason("")
              setCustomRemoveReason("")
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            {editing ? (
              <X className="h-3.5 w-3.5" />
            ) : (
              <Pencil className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {editing && !confirmingRemove && (
        <div className="mt-3 space-y-3 border-t pt-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Next refill date
            </label>
            <input
              type="date"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Refill frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Reason for change
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="" disabled>
                Select a reason
              </option>
              {CHANGE_REASONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {reason === "other" && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                Specify reason
              </label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter your reason"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium",
              canSave
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            <Check className="h-3.5 w-3.5" />
            Save changes
          </button>
          <button
            type="button"
            onClick={() => setConfirmingRemove(true)}
            className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove from schedule
          </button>
        </div>
      )}

      {editing && confirmingRemove && (
        <div className="mt-3 space-y-3 border-t pt-3">
          <p className="text-xs font-medium text-foreground">
            Why are you removing this medication?
          </p>
          <div className="flex flex-col gap-1">
            <select
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="" disabled>
                Select a reason
              </option>
              {CHANGE_REASONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {removeReason === "other" && (
            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={customRemoveReason}
                onChange={(e) => setCustomRemoveReason(e.target.value)}
                placeholder="Enter your reason"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
          )}
          <button
            type="button"
            onClick={handleRemove}
            disabled={!canRemove}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium",
              canRemove
                ? "bg-red-600 text-white"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Confirm removal
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmingRemove(false)
              setRemoveReason("")
              setCustomRemoveReason("")
            }}
            className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      )}

      {!editing && item.escalatedToLoanOffer && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            trackEvent(
              EVENTS.CARE_COMPANION.REFILL_SCHEDULE.APPLY_CREDIT_TAP,
              { medicationName: item.medicationName },
            )
            navigate("/patients/companion/medication-loan")
          }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-colors active:bg-primary/20"
        >
          <CreditCard className="h-3.5 w-3.5" />
          Loan available
        </button>
      )}
    </div>
  )
}

function TestItemCard({
  item,
  price,
  onSave,
  onRemove,
}: {
  item: TestScheduleItem
  price: number | null
  onSave: (testName: string, nextDate: string, frequencyMonths: number, reason: string) => void
  onRemove: (testName: string, reason: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [confirmingRemove, setConfirmingRemove] = useState(false)
  const [nextDate, setNextDate] = useState(item.expectedDate)
  const [frequency, setFrequency] = useState(item.frequencyMonths)
  const [reason, setReason] = useState("")
  const [customReason, setCustomReason] = useState("")
  const [removeReason, setRemoveReason] = useState("")
  const [customRemoveReason, setCustomRemoveReason] = useState("")

  useEffect(() => {
    setNextDate(item.expectedDate)
    setFrequency(item.frequencyMonths)
  }, [item.expectedDate, item.frequencyMonths])

  function handleSave() {
    const finalReason = reason === "other" ? customReason : reason
    if (!finalReason) return
    onSave(item.testName, nextDate, frequency, finalReason)
    setEditing(false)
    setReason("")
    setCustomReason("")
  }

  const canSave = reason === "other" ? customReason.trim().length > 0 : reason.length > 0
  const canRemove = removeReason === "other"
    ? customRemoveReason.trim().length > 0
    : removeReason.length > 0

  function handleRemove() {
    const finalReason = removeReason === "other" ? customRemoveReason : removeReason
    if (!finalReason) return
    onRemove(item.testName, finalReason)
    setEditing(false)
    setConfirmingRemove(false)
    setRemoveReason("")
    setCustomRemoveReason("")
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-colors",
        item.status === "OVERDUE" && "border-red-200",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              item.status === "OVERDUE"
                ? "bg-red-100 text-red-600"
                : item.status === "DUE"
                  ? "bg-amber-100 text-amber-600"
                  : "bg-blue-50 text-blue-600",
            )}
          >
            <FlaskConical className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {item.testName}
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
              <DaysLabel days={item.daysUntilTest} type="test" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end gap-1">
            <StatusBadge status={item.status} />
            {price != null && (
              <span className="text-[11px] font-mono text-muted-foreground">
                KES {price.toLocaleString()}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setEditing((v) => !v)
              setConfirmingRemove(false)
              setRemoveReason("")
              setCustomRemoveReason("")
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            {editing ? (
              <X className="h-3.5 w-3.5" />
            ) : (
              <Pencil className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {editing && !confirmingRemove && (
        <div className="mt-3 space-y-3 border-t pt-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Next test date
            </label>
            <input
              type="date"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Test frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {TEST_FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Reason for change
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="" disabled>
                Select a reason
              </option>
              {CHANGE_REASONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {reason === "other" && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                Specify reason
              </label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter your reason"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium",
              canSave
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            <Check className="h-3.5 w-3.5" />
            Save changes
          </button>
          <button
            type="button"
            onClick={() => setConfirmingRemove(true)}
            className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove from schedule
          </button>
        </div>
      )}

      {editing && confirmingRemove && (
        <div className="mt-3 space-y-3 border-t pt-3">
          <p className="text-xs font-medium text-foreground">
            Why are you removing this test?
          </p>
          <div className="flex flex-col gap-1">
            <select
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="" disabled>
                Select a reason
              </option>
              {CHANGE_REASONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {removeReason === "other" && (
            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={customRemoveReason}
                onChange={(e) => setCustomRemoveReason(e.target.value)}
                placeholder="Enter your reason"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
          )}
          <button
            type="button"
            onClick={handleRemove}
            disabled={!canRemove}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium",
              canRemove
                ? "bg-red-600 text-white"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Confirm removal
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmingRemove(false)
              setRemoveReason("")
              setCustomRemoveReason("")
            }}
            className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

export default function RefillSchedulePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useRefillSchedule()
  const { data: homeData, isLoading: homeLoading } = useCareCompanionHome()
  const { data: profile } = useIntakeProfile()

  const patchProfile = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/profile`,
        patch,
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [refillScheduleQueryKey] })
      queryClient.invalidateQueries({ queryKey: [intakeProfileQueryKey] })
      queryClient.invalidateQueries({ queryKey: ["careCompanionHome"] })
    },
  })

  const logEvent = useMutation({
    mutationFn: async (event: Record<string, unknown>) => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/events`,
        event,
      )
      return response.data
    },
  })

  const handleRefillSave = useCallback(
    (id: string, nextDate: string, frequencyDays: number, reason: string) => {
      if (!profile) return
      const schedules = data?.schedules ?? []
      const item = schedules.find((s) => s.id === id)
      if (!item) return

      const costEntry = profile.costEstimates.medications.find(
        (m) => m.name === item.medicationName,
      )
      const reasonLabel = CHANGE_REASONS.find((r) => r.value === reason)?.label ?? reason

      logEvent.mutate({
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "REFILL_SCHEDULE_CHANGE",
        timestamp: new Date().toISOString(),
        source: "user",
        scheduleId: item.id,
        medicationName: item.medicationName,
        conditions: profile.conditions?.type ?? [],
        statusAtChange: item.status,
        daysUntilRefillAtChange: item.daysUntilRefill,
        previousFrequencyDays: item.estimatedDaysSupply ?? 30,
        newFrequencyDays: frequencyDays,
        previousNextDate: item.expectedRefillDate,
        newNextDate: nextDate,
        reason: reasonLabel,
        reasonCategory: reason,
        estimatedCostPerRefill: costEntry?.estimatedCostPerRefill ?? null,
      })

      const updatedCostEstimates = {
        ...profile.costEstimates,
        medications: profile.costEstimates.medications.map((m) =>
          m.name === item.medicationName
            ? { ...m, refillFrequencyDays: frequencyDays }
            : m,
        ),
      }
      trackEvent(EVENTS.CARE_COMPANION.REFILL_SCHEDULE.ITEM_TAP, {
        medicationName: item.medicationName,
        action: "save_schedule",
        reason: reasonLabel,
        frequencyDays,
      })
      axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/refill-schedules/${id}`,
        { nextDate, frequencyDays },
      ).then(() => {
        patchProfile.mutate({ costEstimates: updatedCostEstimates })
      })
    },
    [profile, data, patchProfile, logEvent],
  )

  const handleTestSave = useCallback(
    (testName: string, nextDate: string, frequencyMonths: number, reason: string) => {
      if (!profile) return

      const testSchedules = homeData?.testSchedule?.schedules ?? []
      const item = testSchedules.find((t) => t.testName === testName)
      const costEntry = profile.costEstimates.tests.find(
        (t) => t.name === testName,
      )
      const reasonLabel = CHANGE_REASONS.find((r) => r.value === reason)?.label ?? reason

      logEvent.mutate({
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "TEST_SCHEDULE_CHANGE",
        timestamp: new Date().toISOString(),
        source: "user",
        scheduleId: item?.id ?? `test-${testName}`,
        testName,
        conditions: profile.conditions?.type ?? [],
        statusAtChange: item?.status ?? "UPCOMING",
        daysUntilTestAtChange: item?.daysUntilTest ?? 0,
        previousFrequencyMonths: item?.frequencyMonths ?? costEntry?.frequencyMonths ?? 12,
        newFrequencyMonths: frequencyMonths,
        previousNextDate: item?.expectedDate ?? "",
        newNextDate: nextDate,
        reason: reasonLabel,
        reasonCategory: reason,
        estimatedCostPerTest: costEntry?.estimatedCostPerTest ?? null,
      })

      const updatedCostEstimates = {
        ...profile.costEstimates,
        tests: profile.costEstimates.tests.map((t) =>
          t.name === testName
            ? { ...t, frequencyMonths }
            : t,
        ),
      }
      trackEvent(EVENTS.CARE_COMPANION.REFILL_SCHEDULE.ITEM_TAP, {
        testName,
        action: "save_test_schedule",
        reason: reasonLabel,
        frequencyMonths,
      })
      axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/test-schedules/${encodeURIComponent(testName)}`,
        { nextDate, frequencyMonths },
      ).then(() => {
        patchProfile.mutate({ costEstimates: updatedCostEstimates })
      })
    },
    [profile, homeData, patchProfile, logEvent],
  )

  const handleRefillRemove = useCallback(
    (id: string, reason: string) => {
      if (!profile) return
      const schedules = data?.schedules ?? []
      const item = schedules.find((s) => s.id === id)
      if (!item) return

      const costEntry = profile.costEstimates.medications.find(
        (m) => m.name === item.medicationName,
      )
      const reasonLabel = CHANGE_REASONS.find((r) => r.value === reason)?.label ?? reason

      logEvent.mutate({
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "REFILL_SCHEDULE_REMOVE",
        timestamp: new Date().toISOString(),
        source: "user",
        scheduleId: item.id,
        medicationName: item.medicationName,
        conditions: profile.conditions?.type ?? [],
        statusAtChange: item.status,
        daysUntilRefillAtChange: item.daysUntilRefill,
        reason: reasonLabel,
        reasonCategory: reason,
        estimatedCostPerRefill: costEntry?.estimatedCostPerRefill ?? null,
      })

      const updatedCostEstimates = {
        ...profile.costEstimates,
        medications: profile.costEstimates.medications.filter(
          (m) => m.name !== item.medicationName,
        ),
      }
      trackEvent(EVENTS.CARE_COMPANION.REFILL_SCHEDULE.ITEM_REMOVE, {
        medicationName: item.medicationName,
        status: item.status,
        reason: reasonLabel,
      })
      axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/refill-schedules/${id}`,
        { status: "CANCELLED" },
      ).then(() => {
        patchProfile.mutate({ costEstimates: updatedCostEstimates })
      })
    },
    [profile, data, patchProfile, logEvent],
  )

  const handleTestRemove = useCallback(
    (testName: string, reason: string) => {
      if (!profile) return

      const testSchedules = homeData?.testSchedule?.schedules ?? []
      const item = testSchedules.find((t) => t.testName === testName)
      const costEntry = profile.costEstimates.tests.find(
        (t) => t.name === testName,
      )
      const reasonLabel = CHANGE_REASONS.find((r) => r.value === reason)?.label ?? reason

      logEvent.mutate({
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "TEST_SCHEDULE_REMOVE",
        timestamp: new Date().toISOString(),
        source: "user",
        scheduleId: item?.id ?? `test-${testName}`,
        testName,
        conditions: profile.conditions?.type ?? [],
        statusAtChange: item?.status ?? "UPCOMING",
        daysUntilTestAtChange: item?.daysUntilTest ?? 0,
        reason: reasonLabel,
        reasonCategory: reason,
        estimatedCostPerTest: costEntry?.estimatedCostPerTest ?? null,
      })

      const updatedCostEstimates = {
        ...profile.costEstimates,
        tests: profile.costEstimates.tests.filter(
          (t) => t.name !== testName,
        ),
      }
      trackEvent(EVENTS.CARE_COMPANION.REFILL_SCHEDULE.TEST_REMOVE, {
        testName,
        status: item?.status ?? "UPCOMING",
        reason: reasonLabel,
      })
      axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/test-schedules/${encodeURIComponent(testName)}`,
        { status: "CANCELLED" },
      ).then(() => {
        patchProfile.mutate({ costEstimates: updatedCostEstimates })
      })
    },
    [profile, homeData, patchProfile, logEvent],
  )

  useEffect(() => {
    trackEvent(EVENTS.CARE_COMPANION.REFILL_SCHEDULE.VIEW)
  }, [])

  if (isLoading || homeLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <AlertTriangle className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Could not load your schedule.
        </p>
      </div>
    )
  }

  const medPriceMap: Record<string, number> = {}
  for (const m of profile?.costEstimates?.medications ?? []) {
    medPriceMap[m.name.toLowerCase()] = m.estimatedCostPerRefill
  }
  for (const s of data.schedules) {
    const key = s.medicationName.toLowerCase()
    if (medPriceMap[key] == null) {
      medPriceMap[key] = getMedicationPriceKES(s.medicationName)
    }
  }
  const testPriceMap: Record<string, number> = {}
  for (const t of profile?.costEstimates?.tests ?? []) {
    testPriceMap[t.name.toLowerCase()] = t.estimatedCostPerTest
  }
  for (const t of homeData?.testSchedule?.schedules ?? []) {
    const key = t.testName.toLowerCase()
    if (testPriceMap[key] == null) {
      testPriceMap[key] = getMedicationPriceKES(t.testName)
    }
  }

  const sortedMeds = [...data.schedules].sort(
    (a, b) =>
      (STATUS_SORT_ORDER[a.status] ?? 99) -
      (STATUS_SORT_ORDER[b.status] ?? 99) ||
      a.daysUntilRefill - b.daysUntilRefill,
  )

  const testSchedules = homeData?.testSchedule?.schedules ?? []
  const sortedTests = [...testSchedules].sort(
    (a, b) =>
      (STATUS_SORT_ORDER[a.status] ?? 99) -
      (STATUS_SORT_ORDER[b.status] ?? 99) ||
      a.daysUntilTest - b.daysUntilTest,
  )

  const hasNothing = sortedMeds.length === 0 && sortedTests.length === 0

  if (hasNothing) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center px-4">
        <Pill className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No upcoming medications or tests. Your schedule will appear
          here once you complete your health profile.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4 pb-24">
      {sortedMeds.length > 0 && (
        <>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Medications
          </p>
          {sortedMeds.map((item) => (
            <RefillItemCard key={item.id} item={item} price={medPriceMap[item.medicationName.toLowerCase()] ?? null} onSave={handleRefillSave} onRemove={handleRefillRemove} />
          ))}
        </>
      )}

      {sortedTests.length > 0 && (
        <>
          <p className="mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Tests
          </p>
          {sortedTests.map((item) => (
            <TestItemCard key={item.id} item={item} price={testPriceMap[item.testName.toLowerCase()] ?? null} onSave={handleTestSave} onRemove={handleTestRemove} />
          ))}
        </>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t bg-background p-4 safe-area-bottom">
        <button
          type="button"
          onClick={() => {
            trackEvent(
              EVENTS.CARE_COMPANION.REFILL_SCHEDULE.FIND_PHARMACY_TAP,
            )
            navigate("/patients", { state: { tab: "explore" } })
          }}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors active:bg-primary/90"
        >
          <MapPin className="h-4 w-4" />
          Find Pharmacy
        </button>
      </div>
    </div>
  )
}
