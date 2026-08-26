import { useNavigate } from "react-router-dom"
import { Pill, ChevronRight } from "lucide-react"
import { useCareCompanionStore } from "../../CareCompanion/store/careCompanionStore"
import { useMedicationCards } from "../../CareCompanion/hooks/useMedicationCards"
import { usePaymentHistory } from "@/Routes/Patient/hooks/usePaymentHistory"

const NUDGE_DISMISS_KEY = "medication-nudge-dashboard"

export function MedicationNudgeCard() {
  const navigate = useNavigate()
  const { data, isLoading } = useMedicationCards()
  const { data: paymentData } = usePaymentHistory()
  const dismissedOverlayIds = useCareCompanionStore(
    (s) => s.dismissedOverlayIds,
  )
  const dismissOverlay = useCareCompanionStore((s) => s.dismissOverlay)

  const isDismissed = dismissedOverlayIds.includes(NUDGE_DISMISS_KEY)
  const hasPayments = (paymentData?.payments?.length ?? 0) > 0

  if (isLoading || isDismissed || !hasPayments || !data || data.cards.length === 0) {
    return null
  }

  const cardCount = data.cards.length
  const firstMed = data.cards[0].genericName

  return (
    <div className="mx-4 mt-1">
      <div className="relative rounded-xl border border-violet-200 bg-violet-50 p-3">
        <button
          type="button"
          onClick={() =>
            navigate("/patients/care-companion/medication-cards")
          }
          className="flex w-full items-center gap-3 text-left"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <Pill className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-violet-900">
              Review your purchased medications
            </p>
            <p className="text-xs text-violet-700/70">
              {cardCount === 1
                ? `Info card for ${firstMed}`
                : `${cardCount} medication info cards available`}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            dismissOverlay(NUDGE_DISMISS_KEY)
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-violet-400 transition-colors hover:bg-violet-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
