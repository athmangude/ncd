import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepperProps {
  currentStep: number
  totalSteps: number
  className?: string
  completedSteps?: boolean[]
}

export function Stepper({
  currentStep,
  totalSteps,
  className,
  completedSteps,
}: StepperProps) {
  return (
    <div
      className={cn("flex items-center justify-center w-full", className)}
      role="group"
      aria-label={`Step ${currentStep} of ${totalSteps}`}
    >
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1

        // Use completedSteps if provided, otherwise fallback to linear logic
        const isCompleted = completedSteps
          ? completedSteps[index]
          : stepNumber < currentStep

        const isCurrent = stepNumber === currentStep
        const isLast = stepNumber === totalSteps

        return (
          <div key={stepNumber} className="flex items-center last:flex-none">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-mono transition-colors duration-200 z-10 shrink-0",
                isCompleted
                  ? "bg-purple-100 text-primary border-2 border-primary" // Completed style
                  : isCurrent
                    ? "bg-primary text-white " // Active style
                    : "bg-card border-2 border-border text-foreground"
              )}
            >
              {isCompleted ? <Check className="w-5 h-5 " /> : stepNumber}
            </div>

            {!isLast && (
              <div
                className={cn(
                  "h-[2px] w-4 rounded-full transition-colors duration-200",
                  stepNumber < currentStep ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
