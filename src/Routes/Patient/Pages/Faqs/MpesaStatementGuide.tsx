import { useState } from "react"
import PatientPageWrapper from "../PatientPageWrapper"
import { Button } from "@/components/Button"
import { Check, ChevronLeft, ChevronRight } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/Tabs"
import { mpesaStatementGuide } from "@/data/mpesaStatementGuide"
import { formatParenthesizedText } from "@/utilities/textUtilities"

const steps = mpesaStatementGuide
// Loan-role access is enforced once at the route level (MemberLoanRouteGuard in
// PatientsHome); this page no longer self-guards.
export default function MpesaStatementGuide() {
  return (
    <PatientPageWrapper title="How to get your MPESA statement">
      <InstructionsSection />
    </PatientPageWrapper>
  )
}

function InstructionsSection() {
  const [currentMethod, setCurrentMethod] = useState("ussd")
  const [currentSubStep, setCurrentSubStep] = useState(0)

  const currentMethodData = steps.find((step) => step.id === currentMethod)

  const maxSubSteps = currentMethodData?.subSteps.length || 0
  const safeCurrentSubStep = Math.min(currentSubStep, maxSubSteps - 1)

  if (currentSubStep !== safeCurrentSubStep) {
    setCurrentSubStep(safeCurrentSubStep)
  }

  const handleNext = () => {
    if (currentSubStep < maxSubSteps - 1) {
      setCurrentSubStep(currentSubStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentSubStep > 0) {
      setCurrentSubStep(currentSubStep - 1)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Tabs
        defaultValue="ussd"
        onValueChange={(value) => {
          setCurrentMethod(value)
          setCurrentSubStep(0)
        }}
      >
        <div className="overflow-x-auto pb-2 -mb-2 no-scrollbar">
          <TabsList className="bg-purple-200 text-black w-fit min-w-full sm:min-w-0">
            {steps.map((step) => (
              <TabsTrigger
                key={step.id}
                value={step.id}
                className="px-4 py-2 whitespace-nowrap"
              >
                <div className="flex items-center justify-center gap-2">
                  <Check
                    className="h-4 w-4 opacity-0 transition-opacity data-[state=active]:opacity-100 text-primary"
                    data-state={
                      step.id === currentMethod ? "active" : "inactive"
                    }
                  />
                  <span className="data-[state=active]:text-primary">
                    {step.method}
                  </span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {steps.map((step) => (
          <TabsContent key={step.id} value={step.id}>
            <div className="flex flex-col items-center gap-6">
              {/* Step Counter */}
              <div className="w-full text-center mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Step {currentSubStep + 1} of {step.subSteps.length}
                </span>
              </div>

              {/* Main Content */}
              <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto px-4 sm:px-0">
                {step.subSteps[safeCurrentSubStep] && (
                  <img
                    src={step.subSteps[safeCurrentSubStep].image}
                    alt={step.subSteps[safeCurrentSubStep].description}
                    className="w-full h-full object-contain"
                  />
                )}
                <div className="text-center w-full">
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {formatParenthesizedText(
                      step.subSteps[safeCurrentSubStep]?.description || ""
                    )}
                  </p>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar px-4 py-2 w-full max-w-md mx-auto">
                {step.subSteps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSubStep(index)}
                    className={`h-2 sm:h-2.5 min-w-[0.5rem] sm:min-w-[0.625rem] rounded-full transition-all flex-shrink-0 ${
                      index === currentSubStep
                        ? "bg-primary w-4"
                        : "bg-purple-200 hover:bg-muted"
                    }`}
                  />
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center w-full max-w-md mx-auto px-4 sm:px-0 mt-4 gap-4">
                <Button
                  onClick={handlePrevious}
                  disabled={currentSubStep === 0}
                  className="bg-primary text-white flex-1 sm:flex-none"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={currentSubStep === step.subSteps.length - 1}
                  className="bg-primary text-white flex-1 sm:flex-none"
                >
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
