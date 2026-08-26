import { useNavigate } from "react-router-dom"
import { Pill, ChevronRight, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useCareCompanionStore } from "../../CareCompanion/store/careCompanionStore"
import { useMedicationCards } from "../../CareCompanion/hooks/useMedicationCards"

const NUDGE_DISMISS_KEY = "medication-nudge-dashboard"

export function MedicationNudgeCard() {
  const navigate = useNavigate()
  const { data, isLoading } = useMedicationCards()
  const dismissedOverlayIds = useCareCompanionStore(
    (s) => s.dismissedOverlayIds,
  )
  const dismissOverlay = useCareCompanionStore((s) => s.dismissOverlay)
  const [dismissed, setDismissed] = useState(false)

  const isDismissed =
    dismissed || dismissedOverlayIds.includes(NUDGE_DISMISS_KEY)

  if (isLoading || isDismissed || !data || data.cards.length === 0) {
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
              Review your medications
            </p>
            <p className="text-xs text-violet-700/70">
              {cardCount === 1
                ? `Info card for ${firstMed}`
                : `${cardCount} medication info cards available`}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-violet-400" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setDismissed(true)
            dismissOverlay(NUDGE_DISMISS_KEY)
          }}
          className="absolute right-1.5 top-1.5 rounded-full p-1 text-violet-400 transition-colors hover:bg-violet-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
