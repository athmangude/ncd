import logoIcon from "@/assets/icons/logo.svg"

export default function OnboardingTimeline({
  steps,
  currentStep,
}: {
  steps: readonly string[]
  currentStep: number
}) {
  return (
    <div className="relative flex flex-col items-center justify-center mb-20 w-full">
      <div className="hidden md:block absolute left-0 top-0 transform -translate-x-8 ml-6">
        <img src={logoIcon} className="h-8 w-auto" />
      </div>

      <div className="flex items-center  justify-between px-6 lg:px-18 relative w-3/4">
        <div className="absolute top-3 left-8 right-8 md:left-20 md:right-24 lg:left-28 lg:right-30 flex items-center">
          <div className="flex-1 h-px bg-neutral-300 relative">
            <div
              className="absolute h-px bg-primary"
              style={{
                width: `${(currentStep / (steps.length - 1)) * 100}%`,
              }}
            />
          </div>
        </div>

        {steps.map((step, index) => (
          <div
            key={index}
            className="flex flex-col items-center relative z-10 text-center"
          >
            <div
              className={`w-6 h-6 rounded-full ${
                index <= currentStep ? "bg-primary" : "bg-neutral-300"
              } flex items-center justify-center text-white text-sm`}
            >
              {index + 1}
            </div>
            <span
              className={`hidden md:block mt-2 text-xs md:text-sm lg:text-base ${
                index <= currentStep ? "text-primary" : "text-neutral-500"
              }`}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
