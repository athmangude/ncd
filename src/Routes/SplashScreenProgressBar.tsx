export type SplashScreenProgressBarProps = {
  currentStep: number
  activeColor?: string
  inactiveColor?: string
  totalSteps?: number
}

export default function SplashScreenProgressBar({
  currentStep,
  activeColor = "bg-primary",
  inactiveColor = "bg-primary/20",
  totalSteps = 5,
}: SplashScreenProgressBarProps) {
  return (
    <div className="flex items-center gap-2 justify-center">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
            index === currentStep ? activeColor : inactiveColor
          }`}
        />
      ))}
    </div>
  )
}
