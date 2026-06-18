import { Textarea } from "@/components/Textarea"
import PatientPageWrapper from "../PatientPageWrapper"
import { CheckboxItem } from "@/components/Checkbox"
import { useEffect, useState } from "react"
import { Button } from "@/components/Button"
import useNextCareProfileStep from "../../hooks/useNextCareProfileStep"
import { patientMembershipStorageKey } from "./PatientReviewMembershipDetails"

// eslint-disable-next-line react-refresh/only-export-components
export const healthcareFocusAreas = [
  {
    name: "Chronic Conditions (e.g. Diabetes, High Blood Pressure)",
    value: "CHRONIC_CONDITIONS",
  },
  {
    name: "Major Illnesses (e.g. Cancer, Heart Disease)",
    value: "MAJOR_ILLNESSES",
  },
  {
    name: "Maternity & Newborn Care",
    value: "MATERNITY_NEWBORN_CARE",
  },
  {
    name: "Child Healthcare / Pediatrics",
    value: "CHILD_HEALTHCARE_PEDIATRICS",
  },
  {
    name: "Mental Health & Wellness",
    value: "MENTAL_HEALTH_WELLNESS",
  },
  {
    name: "Accidents & Emergencies",
    value: "ACCIDENTS_EMERGENCIES",
  },
  {
    name: "Dental & Vision Care",
    value: "DENTAL_VISION_CARE",
  },
  {
    name: "Prescription Medications",
    value: "PRESCRIPTION_MEDICATIONS",
  },
]

export default function PatientHealthcareFocus() {
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [otherText, setOtherText] = useState("")

  const { submitStep, skipStep, isSubmitting } = useNextCareProfileStep()

  useEffect(() => {
    // Load existing insurance providers from local storage if available
    const { focusAreas } = JSON.parse(
      localStorage.getItem(patientMembershipStorageKey) || "{}"
    )

    if (focusAreas) {
      setFocusAreas(focusAreas)
    }
  }, [])

  return (
    <PatientPageWrapper title="">
      <h1 className="text-2xl">
        Select the areas of health coverage that are most important to you.
      </h1>
      <p className="text-neutral-500">Add as many as you like</p>

      <section className="flex flex-col gap-3 ">
        {healthcareFocusAreas.map((area) => (
          <CheckboxItem
            key={area.value}
            label={area.name}
            onChange={() => {
              const areaExists = focusAreas.includes(area.value)

              if (areaExists) {
                setFocusAreas((prev) =>
                  prev.filter((item) => item !== area.value)
                )
              } else {
                setFocusAreas((prev) => [...prev, area.value])
              }
            }}
            checked={focusAreas.includes(area.value)}
          />
        ))}

        <Textarea
          className="mt-2"
          placeholder="Other (please specify)"
          rows={3}
          maxLength={200}
          onChange={(e) => {
            setOtherText(e.target.value)
          }}
        />
      </section>

      {focusAreas.length === 0 && otherText.trim().length === 0 && (
        <p className="text-neutral-500">Select at least one area to continue</p>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white  z-50">
        <div className="max-w-md mx-auto w-full flex gap-4">
          <Button
            className="w-1/3 "
            variant="secondary"
            type="button"
            onClick={skipStep}
            disabled={isSubmitting}
          >
            Skip
          </Button>
          <Button
            className="w-2/3"
            size="lg"
            role="link"
            type="button"
            isLoading={isSubmitting}
            onClick={() => {
              const selectedAreas =
                otherText.trim().length > 0
                  ? [...focusAreas, otherText]
                  : focusAreas

              const membershipDetails = JSON.parse(
                localStorage.getItem(patientMembershipStorageKey) || "{}"
              )

              const updatedDetails = {
                ...membershipDetails,
                focusAreas: selectedAreas,
              }

              localStorage.setItem(
                patientMembershipStorageKey,
                JSON.stringify(updatedDetails)
              )

              // Submit only focus areas
              submitStep({ focusAreas: selectedAreas })
            }}
            disabled={focusAreas.length === 0 && otherText.trim().length === 0}
          >
            Next
          </Button>
        </div>
      </div>
    </PatientPageWrapper>
  )
}
