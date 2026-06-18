import PatientPageWrapper from "../PatientPageWrapper"
import { useEffect, useState } from "react"
import { Button } from "@/components/Button"
import useNextCareProfileStep from "../../hooks/useNextCareProfileStep"
import { patientMembershipStorageKey } from "./PatientReviewMembershipDetails"
import { CheckboxItem } from "@/components/Checkbox"
import { Textarea } from "@/components/Textarea"
import { RadioGroup, RadioGroupItem } from "@/components/Radio"
import { Label } from "@/components/Label"
import { cn } from "@/lib/utils"

/* 

SHA, I have no insurance, AAR Insurance, APA Insurance, Britam, CIC, First Assurance, GA, Heritage Insurance, ICEA Lion, Keninida assurance, Madison insurance, Mua insurance, Old Mutual, Pacis Insurance, The Kenyan Alliance, Other
*/
// eslint-disable-next-line react-refresh/only-export-components
export const insuranceProviderOptions = [
  {
    value: "SHA",
    name: "SHA (Social Health Authority)",
  },
  { value: "AAR_INSURANCE", name: "AAR Insurance" },
  { value: "APA_INSURANCE", name: "APA Insurance" },
  { value: "BRITAM", name: "Britam" },
  { value: "CIC", name: "CIC" },
  { value: "FIRST_ASSURANCE", name: "First Assurance" },
  { value: "GA", name: "GA" },
  { value: "HERITAGE_INSURANCE", name: "Heritage Insurance" },
  { value: "ICEA_LION", name: "ICEA Lion" },
  { value: "KENINDIA_ASSURANCE", name: "Keninida assurance" },
  { value: "MADISON_INSURANCE", name: "Madison insurance" },
  { value: "MUA_INSURANCE", name: "Mua insurance" },
  { value: "OLD_MUTUAL", name: "Old Mutual" },
  { value: "PACIS_INSURANCE", name: "Pacis Insurance" },
  { value: "KENYAN_ALLIANCE", name: "The Kenyan Alliance" },
  { value: "OTHER", name: "Other" },
]

export default function PatientSelectInsurance() {
  const { submitStep, skipStep, isSubmitting } = useNextCareProfileStep()

  const [insuranceProviders, setInsuranceProviders] = useState<string[]>([])
  const [otherText, setOtherText] = useState("")
  const [hasInsurance, setHasInsurance] = useState<"yes" | "no">("yes")

  useEffect(() => {
    // Load existing insurance providers from local storage if available
    const { insuranceProviders } = JSON.parse(
      localStorage.getItem(patientMembershipStorageKey) || "{}"
    )

    if (insuranceProviders && insuranceProviders.length > 0) {
      // Check if it's the "NO_INSURANCE" flag or actual providers
      if (insuranceProviders.includes("NO_INSURANCE")) {
        setHasInsurance("no")
        setInsuranceProviders([])
      } else {
        setHasInsurance("yes")
        setInsuranceProviders(insuranceProviders)
      }
    } else {
      // Default to yes as per design implication or keep as is
    }
  }, [])

  const handleSave = (skip = false) => {
    if (skip) {
      skipStep()
      return
    }
    // Save the insurance providers to local storage

    let selectedInsuarance =
      otherText.trim().length > 0
        ? [...insuranceProviders, otherText]
        : insuranceProviders

    if (hasInsurance === "no") {
      selectedInsuarance = ["NO_INSURANCE"] // Or just empty? Keeping consistent with "I have no insurance" option from before just in case backend expects it, though I removed it from options displayed.
      // If the backend expects an empty array for no insurance, use [].
      // Previous code had { value: "NO_INSURANCE", name: "I have no insurance" } in options.
      // I will use [] if skip, but if "no" is selected, maybe we should track that explicitly.
      // For now let's send [] if skip/no.
      selectedInsuarance = []
    }

    const membershipDetails = JSON.parse(
      localStorage.getItem(patientMembershipStorageKey) || "{}"
    )

    localStorage.setItem(
      patientMembershipStorageKey,
      JSON.stringify({
        ...membershipDetails,
        insuranceProviders: selectedInsuarance,
      })
    )

    submitStep({ insuranceProviders: selectedInsuarance })
  }

  return (
    <PatientPageWrapper title="" className="">
      <div className="flex flex-col gap-6 w-full">
        {/* Question 1 */}
        <div className="flex flex-col gap-3">
          <h2 className="font-medium text-neutral-900">
            Do you have an insurance cover?
          </h2>
          <RadioGroup
            value={hasInsurance}
            onValueChange={(val) => {
              setHasInsurance(val as "yes" | "no")
              if (val === "no") {
                setInsuranceProviders([])
                setOtherText("")
              }
            }}
            className="grid grid-cols-2 gap-4"
          >
            <Label
              htmlFor="no-insurance"
              className={cn(
                "flex flex-col gap-2 p-4 border rounded-lg cursor-pointer transition-all",
                hasInsurance === "no"
                  ? "border-purple-500 bg-purple-50"
                  : "border-neutral-200 hover:border-purple-200"
              )}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="no-insurance" />
                <span className="font-medium">No</span>
              </div>
              <span className="text-xs text-neutral-500 pl-6">
                I don't have any insurance cover
              </span>
            </Label>

            <Label
              htmlFor="yes-insurance"
              className={cn(
                "flex flex-col gap-2 p-4 border rounded-lg cursor-pointer transition-all",
                hasInsurance === "yes"
                  ? "border-purple-500 bg-purple-50"
                  : "border-neutral-200 hover:border-purple-200"
              )}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="yes-insurance" />
                <span className="font-medium">Yes</span>
              </div>
              <span className="text-xs text-neutral-500 pl-6">
                I have insurance e.g. SHA, Britam
              </span>
            </Label>
          </RadioGroup>
        </div>

        {/* Question 2 - Conditional */}
        {hasInsurance === "yes" && (
          <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col">
              <h2 className="font-medium text-neutral-900">
                Which insurance are you covered by?
              </h2>
              <p className="text-sm text-neutral-500">Add as many as you have</p>
            </div>

            <section className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2">
              {insuranceProviderOptions.map((area) => (
                <CheckboxItem
                  key={area.value}
                  label={area.name}
                  onChange={() => {
                    const insuranceExists = insuranceProviders.includes(
                      area.value
                    )

                    if (insuranceExists) {
                      setInsuranceProviders((prev) =>
                        prev.filter((item) => item !== area.value)
                      )
                    } else {
                      setInsuranceProviders((prev) => [...prev, area.value])
                    }
                  }}
                  checked={insuranceProviders.includes(area.value)}
                />
              ))}

              <Textarea
                className="mt-2"
                placeholder="Other (please specify)"
                rows={3}
                maxLength={200}
                value={otherText}
                onChange={(e) => {
                  setOtherText(e.target.value)
                }}
              />
            </section>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white  z-50">
          <div className="max-w-md mx-auto w-full flex gap-4">
            <Button
              className="w-1/3 "
              variant="secondary"
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSubmitting}
            >
              Skip
            </Button>
            <Button
              className="w-2/3"
              size="lg"
              role="link"
              type="submit"
              onClick={() => handleSave(false)}
              disabled={isSubmitting}
            >
              Submit
            </Button>
          </div>
        </div>
      </div>
    </PatientPageWrapper>
  )
}
