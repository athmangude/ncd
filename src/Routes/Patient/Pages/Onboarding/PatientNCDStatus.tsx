import PatientPageWrapper from "../PatientPageWrapper"
import { useState } from "react"
import { DualActionFooter } from "@/Routes/shell/footers"
import useNextCareProfileStep from "../../hooks/useNextCareProfileStep"
import { RadioGroup, RadioGroupItem } from "@/components/Radio"
import { Label } from "@/components/Label"
import { cn } from "@/lib/utils"

export default function PatientNCDStatus() {
  const { submitStep, skipStep, isSubmitting } = useNextCareProfileStep()
  const [hasNCD, setHasNCD] = useState<boolean | null>(null)

  const handleSave = () => {
    if (hasNCD === null) return
    submitStep({ ncdStatus: hasNCD ? "YES" : "NO" })
  }

  return (
    <PatientPageWrapper
      variant="content"
      headerAlign="start"
      pageTitle="Get tailored care & offers"
      footer={
        <DualActionFooter
          secondary={{
            label: "Skip",
            onClick: skipStep,
            disabled: isSubmitting,
          }}
          primary={{
            label: "Submit",
            onClick: handleSave,
            disabled: isSubmitting || hasNCD === null,
            isLoading: isSubmitting,
          }}
        />
      }
    >
      <div className="flex flex-col gap-6 w-full">
        <div className="flex flex-col gap-3">
          <h2 className="text-neutral-900">
            Are you interested in benefits for non-communicable or chronic
            illnesses?
          </h2>
          <p className="text-sm text-neutral-500">
            e.g. Asthma, Hypertension, Diabetes, Kidney disease, cancer, sickle
            cell etc.
          </p>

          <RadioGroup
            value={hasNCD === null ? "" : hasNCD ? "yes" : "no"}
            onValueChange={(val) => {
              setHasNCD(val === "yes")
            }}
            className="grid gap-4"
          >
            <Label
              htmlFor="yes-ncd"
              className={cn(
                "flex flex-col gap-2 p-4 border rounded-lg cursor-pointer transition-all",
                hasNCD === true
                  ? "border-purple-500 bg-purple-50"
                  : "border-neutral-200 hover:border-purple-200"
              )}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="yes-ncd" />
                <span className="font-medium">Yes, I do</span>
              </div>
            </Label>

            <Label
              htmlFor="no-ncd"
              className={cn(
                "flex flex-col gap-2 p-4 border rounded-lg cursor-pointer transition-all",
                hasNCD === false
                  ? "border-purple-500 bg-purple-50"
                  : "border-neutral-200 hover:border-purple-200"
              )}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="no-ncd" />
                <span className="font-medium">No, I do not</span>
              </div>
            </Label>
          </RadioGroup>
        </div>
      </div>
    </PatientPageWrapper>
  )
}
