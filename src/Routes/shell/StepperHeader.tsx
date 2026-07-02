import React from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/Button"
import { Stepper } from "@/components/Stepper"
import { useJourneyStepper } from "./useJourneyStepper"

interface StepperHeaderProps {
  title?: string
  isRoot?: boolean
  showHelp?: boolean
  onBack?: () => void
  backIcon?: React.ReactNode
  rightAction?: React.ReactNode
  /**
   * When false, the bottom border is dropped — used by the slim app-bar path
   * where the progress stepper and title live in a content-level `PageHeader`
   * instead of inside this bar. Defaults to true (the legacy app bar).
   */
  border?: boolean
  /**
   * When false, the in-bar progress stepper is suppressed (the stepper is
   * rendered in content instead). Defaults to true so legacy screens are
   * unchanged. Route detection lives in `useJourneyStepper`.
   */
  showStepper?: boolean
}

/**
 * The pinned top app bar for patient journey screens: a back button, optional
 * title, a right-action / "Need help?" slot, and — in the legacy layout — the
 * progress `Stepper` for whichever journey the current route belongs to.
 *
 * The journey detection now lives in `useJourneyStepper` so the same stepper can
 * be rendered here (legacy) or in a content-level `PageHeader` (content layout,
 * via `border={false}` + `showStepper={false}`). Safe-area top inset is supplied
 * by AppShell; horizontal padding is supplied here since the bar no longer sits
 * inside a padded container.
 */
export default function StepperHeader({
  title,
  isRoot = false,
  showHelp = false,
  onBack,
  backIcon,
  rightAction,
  border = true,
  showStepper = true,
}: StepperHeaderProps) {
  const navigate = useNavigate()
  const stepper = useJourneyStepper()

  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex w-full flex-col bg-white/80 backdrop-blur-md dark:bg-neutral-950/80",
        border && "border-b"
      )}
    >
      <div className="flex w-full items-center justify-between p-2">
        <div className="flex items-center gap-2">
          {!isRoot && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={onBack || (() => navigate(-1))}
              aria-label="Go back"
            >
              {backIcon || <ChevronLeft size={24} />}
            </Button>
          )}
          {title && <p className="text-base font-medium">{title}</p>}
        </div>
        {rightAction}
        {showHelp && (
          <Button
            variant="outline"
            className="rounded-full border-neutral-300 font-normal text-neutral-600 hover:bg-neutral-50"
            size="sm"
            onClick={() => navigate("/patients/payment/request-payment/help")}
          >
            Need help?
          </Button>
        )}
      </div>
      {showStepper && stepper && (
        <div className="w-full px-4 pb-2">
          <Stepper
            currentStep={stepper.currentStep}
            totalSteps={stepper.totalSteps}
            completedSteps={stepper.completedSteps}
          />
        </div>
      )}
    </header>
  )
}
