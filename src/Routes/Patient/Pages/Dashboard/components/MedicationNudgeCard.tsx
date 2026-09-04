import { useNavigate } from "react-router-dom"
import { Sparkles, ChevronRight } from "lucide-react"
import { useNotifications } from "@/Routes/Patient/Pages/CareCompanion/hooks/useNotifications"

export function MedicationNudgeCard() {
  const navigate = useNavigate()
  const { data: notifications = [] } = useNotifications()

  const unreadInsights = notifications.filter(
    (n) => !n.readAt,
  )

  if (unreadInsights.length === 0) return null

  const firstTitle = unreadInsights[0].title
  const subtitle =
    unreadInsights.length === 1
      ? firstTitle
      : `${firstTitle} and ${unreadInsights.length - 1} more`

  return (
    <div className="mx-4 mt-1">
      <button
        type="button"
        onClick={() => navigate("/patients/notifications")}
        className="flex w-full items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-left transition-colors active:bg-primary/10"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {`${unreadInsights.length} update${unreadInsights.length === 1 ? "" : "s"} for you`}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {subtitle}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
      </button>
    </div>
  )
}
