import { cn } from "@/lib/utils"
import { Progress } from "@/components/Progress"

interface IntakeProgressProps {
  currentStep: number
  totalSteps: number
  className?: string
}

export default function IntakeProgress({
  currentStep,
  totalSteps,
  className,
}: IntakeProgressProps) {
  const clampedStep = Math.max(0, Math.min(currentStep, totalSteps))
  const percentage = totalSteps > 0 ? (clampedStep / totalSteps) * 100 : 0

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between">
        <span className="font-sans text-xs text-muted-foreground">
          Step {clampedStep} of {totalSteps}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {Math.round(percentage)}%
        </span>
      </div>

      <Progress
        value={percentage}
        className="h-2"
        aria-label={`Step ${clampedStep} of ${totalSteps}`}
      />
    </div>
  )
}
